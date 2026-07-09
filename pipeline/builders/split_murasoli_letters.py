#!/usr/bin/env python3
"""
split_murasoli_letters.py — Layer 2 builder: page-level → letter-level Murasoli units.

Reads the reader-ready pages produced by build_murasoli_collection.py
(public/data/murasoli/text/mNN-pXXXX.json) and reassembles them into individual,
citable letters. Run it AFTER build_murasoli_collection.py for a volume.

What defines a letter (validated against Volume 54):
  START  a numbered heading — "4016. <title, often wrapping two lines>" —
         followed within a few lines by the salutation "உடன்பிறப்பே,".
         (Volume 54 uses the singular salutation; the serial number is a
         GLOBAL sequence across all 54 volumes, so it makes a durable id.)
         A salutation with no readable number still starts a letter
         (number recorded as null; flagged in the report).
  END    the sign-off block — "அன்புள்ள," / "மு.க." — usually followed by a
         date (dd-mm-yyyy). That trailing date is the letter's date.
  NOISE  running page headers ("தலைவர் கலைஞர் NN", "NN கலைஞரின் கடிதங்கள்"),
         bare page numbers, and table-of-contents pages are stripped/skipped.

Output letter schema (public/data/murasoli/letters/mNN-lXXXX.json):
    { id, collection: "murasoli-letter", volume, number, date | null,
      title: {en, ta}, salutation, pages: [page ids], paragraphs[], ocrStatus }
plus letters index appended into public/data/murasoli/letters-index.json.

Modes:
  --report (default) : analyse only. Writes archive/murasoli-letters-vNN-report.json
                       + the split letters under archive/murasoli-letters-vNN/ for
                       human review. public/ is NOT touched.
  --publish          : additionally writes letters + index under public/data/murasoli/.
                       Only do this once the volume's page set is complete
                       (i.e. built from the lossless v4 correction output).

Usage:
    python3 pipeline/builders/split_murasoli_letters.py --volume 54
    python3 pipeline/builders/split_murasoli_letters.py --volume 54 --publish
"""
import argparse, glob, json, os, re, unicodedata

PAGES_DIR = "public/data/murasoli/text"
PUB_LETTERS_DIR = "public/data/murasoli/letters"
PUB_LETTERS_INDEX = "public/data/murasoli/letters-index.json"
ARCHIVE_DIR = "archive"

# --- patterns (tolerant of OCR noise) ---------------------------------------
# ZWNJ/ZWSP and the Tamil pulli sequences OCR sprinkles around; normalise first.
ZW = re.compile(r"[​‌‍]")

# Letter serial heading: "4016." at the start of a line (3–4 digits observed).
HEAD = re.compile(r"^\s*(\d{3,4})\s*[.،]\s*(.*)$")

# Salutation — singular form used in Vol 54; keep the plural as a fallback for
# earlier volumes ("உடன்பிறப்புகளே", "...புக்களே") and allow stray spaces.
SALUT = re.compile(r"உடன்\s*பிறப்(?:பே|புக?\s*களே|புக்களே)\s*[,!]?")

# Sign-off: "அன்புள்ள," then "மு.க." (OCR may space the dots), then a date.
# OCR routinely drops the pulli in the sign-off: அன்புள்ள / அனபுள்ள / அன்புளள /
# அனபுளள all occur in V54. The optional pulli marks make the regex catch them all.
SIGNOFF = re.compile(r"அன்?புள்?ள\s*[,.]?\s*(?:\n\s*)?மு\s*\.?\s*க\s*\.?")
# trailing stray digit tolerated: "24-6-20168" → 2016
DATE = re.compile(r"\b(\d{1,2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{4})\d?\b")

# Running headers / pure page-number lines to strip.
HEADERS = [
    re.compile(r"^\s*\d{0,3}\s*கலைஞரின்?\s*கடிதங்கள்?\s*\d{0,3}\s*$"),
    re.compile(r"^\s*தலைவ[ரா]்?\s*கலைஞர்?\s*[\d\]lI|]{0,4}\s*$"),
    re.compile(r"^\s*[\d\]lI|]{1,4}\s*$"),
]

def norm(s: str) -> str:
    return unicodedata.normalize("NFC", ZW.sub("", s))

def is_header_line(line: str) -> bool:
    return any(h.match(line.strip()) for h in HEADERS)

def clean_lines(paragraphs):
    """Flatten a page's paragraphs to lines, dropping running headers."""
    lines = []
    for p in paragraphs:
        for ln in norm(p).split("\n"):
            if ln.strip() and not is_header_line(ln):
                lines.append(ln.rstrip())
        lines.append("")  # paragraph break marker
    return lines

def parse_date(text):
    m = DATE.search(text)
    if not m:
        return None
    d, mo, y = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    if not (1 <= d <= 31 and 1 <= mo <= 12 and 1940 <= y <= 2018):
        return None
    return f"{y:04d}-{mo:02d}-{d:02d}"

def lines_to_paragraphs(lines):
    paras, cur = [], []
    for ln in lines:
        if ln == "":
            if cur:
                paras.append(" ".join(cur)); cur = []
        else:
            cur.append(ln.strip())
    if cur:
        paras.append(" ".join(cur))
    return paras

def split_volume(volume, pages_dir=PAGES_DIR, allow_unnumbered=True):
    files = sorted(glob.glob(f"{pages_dir}/m{volume}-p*.json"))
    if not files:
        raise SystemExit(f"No built pages for volume {volume} in {pages_dir} — "
                         "run build_murasoli_collection.py first.")
    letters, report = [], {
        "volume": volume, "pagesScanned": len(files), "letterStarts": 0,
        "startsWithoutNumber": 0, "signoffsSeen": 0, "lettersWithDate": 0,
        "numberGaps": [], "orphanPagesBeforeFirstLetter": [], "warnings": [],
    }
    cur = None  # current letter accumulator

    def close_current():
        nonlocal cur
        if cur:
            cur["paragraphs"] = lines_to_paragraphs(cur.pop("lines"))
            letters.append(cur)
            cur = None

    for fn in files:
        d = json.load(open(fn, encoding="utf-8"))
        if d.get("pageType") in ("cover", "frontmatter", "toc"):
            continue
        lines = clean_lines(d["paragraphs"])
        page_text = "\n".join(lines)

        # Table-of-contents heuristic: many dates + many short lines, no salutation.
        if (len(DATE.findall(page_text)) >= 4 and not SALUT.search(page_text)
                and not SIGNOFF.search(page_text) and sum(len(l) for l in lines) / max(len(lines), 1) < 45):
            continue

        i = 0
        while i < len(lines):
            ln = lines[i]
            hm = HEAD.match(ln)
            # A numbered heading only starts a letter if the salutation follows soon.
            lookahead = "\n".join(lines[i:i + 8])
            if hm and SALUT.search(lookahead):
                close_current()
                number = int(hm.group(1))
                # title = heading remainder + lines up to the salutation
                title_parts = [hm.group(2).strip()] if hm.group(2).strip() else []
                j = i + 1
                while j < len(lines) and not SALUT.search(lines[j]):
                    if lines[j].strip():
                        title_parts.append(lines[j].strip())
                    j += 1
                title_ta = " ".join(title_parts).strip(" -–—!")
                cur = {
                    "id": f"m{volume}-l{number:04d}",
                    "collection": "murasoli-letter", "volume": volume,
                    "number": number, "date": None,
                    "title": {"en": f"Letter {number}", "ta": title_ta or f"கடிதம் {number}"},
                    "salutation": "உடன்பிறப்பே,",
                    "pages": [d["id"]], "lines": [],
                    "ocrStatus": d.get("ocrStatus", "uncorrected"),
                }
                report["letterStarts"] += 1
                i = j + 1  # skip past the salutation line
                continue
            # Salutation with no readable serial number → still a letter start.
            # DISABLE with --no-unnumbered when the volume's numbered coverage is
            # contiguous: letters QUOTE the salutation mid-text, and every
            # salutation-only "letter" is then a false split that chops the tail
            # off the preceding letter (V54: all 36 serials present; the 3
            # unnumbered starts were quotes inside l4025/l4046 + front matter).
            if allow_unnumbered and SALUT.search(ln) and (cur is None or len("\n".join(cur["lines"])) > 400):
                close_current()
                report["letterStarts"] += 1
                report["startsWithoutNumber"] += 1
                cur = {
                    "id": f"m{volume}-l-unnumbered-{d['page']:04d}",
                    "collection": "murasoli-letter", "volume": volume,
                    "number": None, "date": None,
                    "title": {"en": f"Letter (number unclear, p. {d['page']})",
                              "ta": f"கடிதம் (எண் தெளிவில்லை, பக். {d['page']})"},
                    "salutation": "உடன்பிறப்பே,",
                    "pages": [d["id"]], "lines": [],
                    "ocrStatus": d.get("ocrStatus", "uncorrected"),
                }
                i += 1
                continue
            if cur:
                if d["id"] not in cur["pages"]:
                    cur["pages"].append(d["id"])
                cur["lines"].append(ln)
                # sign-off closes the letter; grab the trailing date.
                # Anchor on the "அன்புள்ள" line itself (blank paragraph-break
                # markers sit between it, "மு.க." and the date), then read an
                # 8-line window forward for மு.க. + the date.
                tail = "\n".join(lines[i:i + 8])
                if re.search(r"அன்?புள்?ள", ln) and SIGNOFF.search(tail):
                    report["signoffsSeen"] += 1
                    # consume the sign-off block (up to 6 lines, stop after a date)
                    k = i + 1
                    consumed = 0
                    while k < len(lines) and consumed < 6:
                        cur["lines"].append(lines[k])
                        if lines[k].strip() and parse_date(lines[k]):
                            k += 1
                            break
                        k += 1
                        consumed += 1
                    dt = parse_date(tail)
                    if dt:
                        cur["date"] = dt
                        report["lettersWithDate"] += 1
                    close_current()
                    i = k
                    continue
            else:
                if not report["orphanPagesBeforeFirstLetter"] or \
                        report["orphanPagesBeforeFirstLetter"][-1] != d["id"]:
                    if ln.strip():
                        report["orphanPagesBeforeFirstLetter"].append(d["id"])
            i += 1
    close_current()

    nums = sorted(l["number"] for l in letters if l["number"])
    for a, b in zip(nums, nums[1:]):
        if b - a > 1:
            report["numberGaps"].append(f"{a} → {b} (missing {b - a - 1})")
    if nums:
        report["serialRange"] = f"{nums[0]}–{nums[-1]}"
    report["lettersAssembled"] = len(letters)
    # keep the orphan list readable
    report["orphanPagesBeforeFirstLetter"] = report["orphanPagesBeforeFirstLetter"][:20]
    return letters, report

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--volume", type=int, required=True)
    ap.add_argument("--pages-dir", default=PAGES_DIR)
    ap.add_argument("--publish", action="store_true",
                    help="write letters under public/data/murasoli/ (complete volumes only)")
    ap.add_argument("--no-unnumbered", action="store_true",
                    help="ignore salutation-only letter starts (use when the "
                         "volume's numbered serials are contiguous)")
    args = ap.parse_args()

    letters, report = split_volume(args.volume, args.pages_dir,
                               allow_unnumbered=not args.no_unnumbered)

    review_dir = os.path.join(ARCHIVE_DIR, f"murasoli-letters-v{args.volume}")
    os.makedirs(review_dir, exist_ok=True)
    for l in letters:
        with open(os.path.join(review_dir, f"{l['id']}.json"), "w", encoding="utf-8") as f:
            json.dump(l, f, ensure_ascii=False, indent=1)
    with open(os.path.join(ARCHIVE_DIR, f"murasoli-letters-v{args.volume}-report.json"),
              "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    print(f"[report] v{args.volume}: {report['lettersAssembled']} letters "
          f"({report['startsWithoutNumber']} unnumbered), "
          f"{report['lettersWithDate']} dated, gaps: {len(report['numberGaps'])}")

    if args.publish:
        os.makedirs(PUB_LETTERS_DIR, exist_ok=True)
        for l in letters:
            with open(os.path.join(PUB_LETTERS_DIR, f"{l['id']}.json"), "w", encoding="utf-8") as f:
                json.dump(l, f, ensure_ascii=False)
        idx = {"collection": "murasoli-letters", "volumes": []}
        if os.path.exists(PUB_LETTERS_INDEX):
            idx = json.load(open(PUB_LETTERS_INDEX, encoding="utf-8"))
        idx["volumes"] = [v for v in idx["volumes"] if v["volume"] != args.volume]
        idx["volumes"].append({
            "volume": args.volume,
            "letterCount": len(letters),
            "letters": [{"id": l["id"], "number": l["number"], "date": l["date"],
                         "title": l["title"], "pages": l["pages"]} for l in letters],
        })
        idx["volumes"].sort(key=lambda v: v["volume"])
        with open(PUB_LETTERS_INDEX, "w", encoding="utf-8") as f:
            json.dump(idx, f, ensure_ascii=False)
        print(f"[publish] wrote {len(letters)} letters + letters-index.json")

if __name__ == "__main__":
    main()
