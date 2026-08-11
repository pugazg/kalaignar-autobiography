#!/usr/bin/env python3
"""Build the Reading Room data for Kalaignar's *Tholkappiya Poonga* (தொல்காப்பியப் பூங்கா).

Source: github.com/pugazg/tolkappiyap-poonga — a page-fidelity transcription where
each chapter (front matter, a "பூங்கா புகுமுன்" intro, and 100 "மலர்" commentaries)
carries a rich README (adhikāram, iyal, related நூற்பாக்கள், scan/print page ranges,
a one-line summary) and the actual commentary text lives per PDF page under `## உரை`.

Emits, in the same data-driven shape the memoir + Murasoli Reading Rooms use:

  public/data/tholkappiyam/index.json         collection meta + all malars (adhikāram/iyal/sutras/pages)
  public/data/tholkappiyam/text/<id>.json     per-malar commentary {title, adhikaram, iyal, sutras, paragraphs, summary}
  public/data/tholkappiyam/fulltext.json      [{i,t,x}] for full-text search

Usage:  python3 build_tholkappiyam.py [/path/to/tolkappiyap-poonga]
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/tp")
OUT = Path(__file__).resolve().parents[2] / "public" / "data" / "tholkappiyam"
SOURCE_REPO = "https://github.com/pugazg/tolkappiyap-poonga"
# The separately-published English edition transcribed under english-translation/.
EN_SRC = SRC / "english-translation"
EN_WORK_TITLE = "The Flower-garden of Tolkāppiyam"
EN_TRANSLATOR = "G. Thiruvasagam"
_SENTENCE_END = re.compile(r"[.!?…”\"’')\]।]$")
# The final malar's pages run into the book's back-matter (a composition-date
# colophon + a catalogue of Kalaignar's other works). That is not commentary —
# truncate the last malar's text here.
_BACK_MATTER = "தொல்காப்பியப் பூங்கா எழுதத் தொடங்கியது"

# Normalise the adhikāram name (READMEs use the full "-அதிகாரம்" form; the printed
# contents table uses the short form) to a stable key + display label.
ADHIKARAM = {
    "எழுத்ததிகாரம்": ("ezhuttu", "எழுத்து"), "எழுத்து": ("ezhuttu", "எழுத்து"),
    "சொல்லதிகாரம்": ("sol", "சொல்"), "சொல்": ("sol", "சொல்"),
    "பொருளதிகாரம்": ("porul", "பொருள்"), "பொருள்": ("porul", "பொருள்"),
}
ADHIKARAM_EN = {"ezhuttu": "Ezhuttatikāram", "sol": "Sollatikāram", "porul": "Poruḷatikāram"}


_BAD_UTF8: list[str] = []


def read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        _BAD_UTF8.append(p.name)  # flag for source correction; recover the rest
        return p.read_text(encoding="utf-8", errors="replace")


def strip_frontmatter(text: str) -> tuple[dict, str]:
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if not m:
        return {}, text
    fm = {}
    for line in m.group(1).splitlines():
        mm = re.match(r'\s*([A-Za-z_]+):\s*"?(.*?)"?\s*$', line)
        if mm:
            fm[mm.group(1)] = mm.group(2)
    return fm, m.group(2)


def meta_list(readme: str) -> dict[str, str]:
    """The '- key: value' metadata block at the top of a chapter README."""
    out = {}
    for line in readme.splitlines():
        mm = re.match(r"^-\s*([^:]+):\s*(.*)$", line.strip())
        if mm:
            out[mm.group(1).strip()] = mm.group(2).strip()
    return out


def scan_range(readme_meta: dict) -> tuple[int | None, int | None, int | None, int | None]:
    def pages(v: str):
        nums = re.findall(r"\d+", v or "")
        return (int(nums[0]), int(nums[1])) if len(nums) >= 2 else (int(nums[0]), None) if nums else (None, None)
    ss, ps = pages(readme_meta.get("தொடக்கம்", ""))
    se, pe = pages(readme_meta.get("முடிவு", ""))
    return ss, se, ps, pe


def clean_para(s: str) -> str:
    """Reduce Markdown to plain text — the reader renders paragraphs verbatim."""
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)             # [text](url) -> text
    s = re.sub(r"\*\*([^*]+)\*\*", r"\1", s)                   # **bold** -> bold
    s = re.sub(r"(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)", r"\1", s)   # *italic* -> italic
    s = re.sub(r"^\s*[-*•]\s+", "", s)                         # leading list marker
    s = s.replace("`", "")
    return re.sub(r"\s+", " ", s).strip()


def page_paragraphs(bodies: list[str]) -> list[str]:
    """Assemble prose from a malar's text pages, joining paragraphs across page breaks."""
    paras: list[str] = []
    buf: list[str] = []

    def flush():
        if buf:
            p = clean_para(" ".join(buf))
            if p:
                paras.append(p)
            buf.clear()

    for pi, body in enumerate(bodies):
        body = re.sub(r"<!--.*?-->", "", body, flags=re.S)  # drop page-marker comments
        # Drop markdown headings (# மலர்…, ## உரை) — commentary prose never starts with '#'.
        lines = [ln.rstrip() for ln in body.splitlines() if not re.match(r"^\s*#{1,6}\s", ln)]
        for ln in lines:
            s = ln.strip()
            if s == "":
                flush()
            elif re.fullmatch(r"[-*_—–★✦✧✩✫✬✭✮✯◆◇♦•·∗~=]+", s):
                continue  # decorative separator line (★, ---, etc.) — not content
            else:
                buf.append(s)
        if pi < len(bodies) - 1 and buf and _SENTENCE_END.search(buf[-1].rstrip()):
            flush()
    flush()
    return paras


def assemble_text(scan_start: int, scan_end: int) -> list[str]:
    bodies = []
    for pg in range(scan_start, scan_end + 1):
        matches = sorted((SRC / "pages").glob(f"{pg:04d}-*.md"))
        if not matches:
            continue
        fm, body = strip_frontmatter(read(matches[0]))
        if fm.get("page_type", "text").strip('"') != "text":
            continue  # skip full-page illustrations & front-matter pages
        bodies.append(body)
    return page_paragraphs(bodies)


def title_from_readme(readme: str, fallback: str) -> str:
    m = re.search(r"^#\s+(.*)$", readme, re.M)
    if not m:
        return fallback
    t = m.group(1).strip()
    # "மலர் (4) — மருந்து மாத்திரை" -> "மருந்து மாத்திரை"; keep intro titles whole.
    m2 = re.match(r"^மலர்\s*\(\d+\)\s*[—–-]\s*(.*)$", t)
    return (m2.group(1) if m2 else t).strip()


def build_entry(cdir: Path) -> dict | None:
    readme_p = cdir / "README.md"
    if not readme_p.exists():
        return None
    readme = read(readme_p)
    meta = meta_list(readme)
    name = cdir.name

    mm = re.match(r"^\d+-malar-(\d+)-", name)
    if mm:
        number = int(mm.group(1))
        entry_id = f"tp-m{number:02d}"
        kind = "malar"
    elif "aninthurai" in name:
        number, entry_id, kind = 0, "tp-aninthurai", "intro"
    elif "pugumun" in name:
        number, entry_id, kind = 0, "tp-pugumun", "intro"
    else:
        return None  # cover / title / contents front-matter dirs

    ss, se, ps, pe = scan_range(meta)
    if ss is None or se is None:
        return None
    paragraphs = assemble_text(ss, se)

    ad_raw = meta.get("அதிகாரம்", "—").strip()
    adk = ADHIKARAM.get(ad_raw)
    sutras = [int(n) for n in re.findall(r"\d+", meta.get("தொடர்புடைய நூற்பாக்கள்", ""))]
    summary = ""
    sm = re.search(r"##\s*பகுதியின்\s*அமைப்பு\s*\n+(.*?)(?:\n#|\Z)", readme, re.S)
    if sm:
        summary = re.sub(r"\s+", " ", sm.group(1)).strip()

    return {
        "id": entry_id,
        "kind": kind,
        "number": number,
        "title": {"ta": title_from_readme(readme, name)},
        "adhikaram": {"key": adk[0], "ta": adk[1], "en": ADHIKARAM_EN[adk[0]]} if adk else None,
        "iyal": (meta.get("இயல்", "").strip() or None) if meta.get("இயல்", "—") != "—" else None,
        "sutras": sutras,
        "pages": {"scanStart": ss, "scanEnd": se, "printStart": ps, "printEnd": pe},
        "summary": summary,
        "textUrl": f"/data/tholkappiyam/text/{entry_id}.json",
        "paragraphs": paragraphs,
    }


# ── English: the separately-published translation (The Flower-garden of
# Tolkāppiyam, tr. G. Thiruvasagam). 100 Blossoms, one chapter README each,
# body assembled from english-translation/pages/<scan>.md. Maps blossom N to the
# same tp-m{N} id the Tamil malar uses so the reader can offer an En/Ta toggle.
_EN_HEADING = re.compile(r"^#\s+Blossom\s+(\d+)\s*[—–-]\s*(.+)$", re.M)
_EN_SCAN = re.compile(r"Scan range:\s*\*\*\s*(\d+)\s*(?:[–-]\s*(\d+))?\s*\*\*")


def assemble_english(scan_start: int, scan_end: int) -> list[str]:
    bodies = []
    for pg in range(scan_start, scan_end + 1):
        f = EN_SRC / "pages" / f"{pg:04d}.md"
        if not f.exists():
            continue
        fm, body = strip_frontmatter(read(f))
        if fm.get("page_type", "text") != "text":
            continue  # skip cover/blank/title/copyright scans
        bodies.append(body)
    return page_paragraphs(bodies)  # reuse: drops "# Blossom" headings, HTML markers, separators


def build_english() -> int:
    if not (EN_SRC / "chapters").exists():
        return 0
    (OUT / "text-en").mkdir(parents=True, exist_ok=True)
    count = 0
    for cdir in sorted((EN_SRC / "chapters").glob("*")):
        readme_p = cdir / "README.md"
        if not cdir.is_dir() or not readme_p.exists():
            continue
        readme = read(readme_p)
        hm = _EN_HEADING.search(readme)
        sr = _EN_SCAN.search(readme)
        if not hm or not sr:
            continue
        number = int(hm.group(1))
        title = hm.group(2).strip()
        ss, se = int(sr.group(1)), int(sr.group(2) or sr.group(1))
        paras = assemble_english(ss, se)
        if not paras:
            print(f"  ! English blossom {number}: no text assembled (scans {ss}-{se})")
            continue
        entry_id = f"tp-m{number:02d}"
        (OUT / "text-en" / f"{entry_id}.json").write_text(
            json.dumps(
                {
                    "id": entry_id,
                    "lang": "en",
                    "title": title,
                    "paragraphs": paras,
                    "provenance": {
                        "status": "published-translation",
                        "work": EN_WORK_TITLE,
                        "translator": EN_TRANSLATOR,
                    },
                },
                ensure_ascii=False,
                indent=1,
            ),
            encoding="utf-8",
        )
        count += 1
    return count


def main():
    (OUT / "text").mkdir(parents=True, exist_ok=True)

    entries, seen, dup_ids = [], set(), []
    for cdir in sorted((SRC / "chapters").glob("*")):
        if not cdir.is_dir():
            continue
        e = build_entry(cdir)
        if not e:
            continue
        if e["id"] in seen:  # source repo carries a duplicate dir (e.g. malar 65)
            dup_ids.append((e["id"], cdir.name))
            continue
        seen.add(e["id"])
        entries.append(e)

    # intros first, then malars in number order
    entries.sort(key=lambda e: (e["kind"] != "intro", e["number"]))

    # per-malar text files + fulltext + slim index list
    fulltext, index_malars = [], []
    for e in entries:
        paras = e.pop("paragraphs")
        cut = next((i for i, p in enumerate(paras) if p.startswith(_BACK_MATTER)), None)
        if cut is not None:  # drop the book's trailing colophon + other-works catalogue
            paras = paras[:cut]
        (OUT / "text" / f"{e['id']}.json").write_text(
            json.dumps({**e, "paragraphs": paras}, ensure_ascii=False), encoding="utf-8"
        )
        fulltext.append({"i": e["id"], "t": e["title"]["ta"], "x": " ".join(paras)})
        index_malars.append({k: e[k] for k in
                             ("id", "kind", "number", "title", "adhikaram", "iyal", "sutras", "pages", "summary")})

    # collection metadata (from metadata/book.md)
    book = read(SRC / "metadata" / "book.md") if (SRC / "metadata" / "book.md").exists() else ""
    def bookfield(label, default=""):
        m = re.search(rf"\*\*{re.escape(label)}\*\*[::]?\s*(.+)", book)
        return m.group(1).strip() if m else default

    adhik_summary = []
    for key in ("ezhuttu", "sol", "porul"):
        mal = [e for e in index_malars if e["kind"] == "malar" and e["adhikaram"] and e["adhikaram"]["key"] == key]
        allsut = sorted({s for e in mal for s in e["sutras"]})
        adhik_summary.append({
            "key": key, "ta": ADHIKARAM[{"ezhuttu": "எழுத்து", "sol": "சொல்", "porul": "பொருள்"}[key]][1],
            "en": ADHIKARAM_EN[key], "malarCount": len(mal), "sutraCount": len(allsut),
        })

    malar_count = sum(1 for e in index_malars if e["kind"] == "malar")
    # Durability net: every malar — including interludes like malar 24
    # (இடையில் ஓர் எளிய விளக்கம்?) — must declare an அதிகாரம் in its chapter
    # README. A malar with no அதிகாரம் silently drops out of the adhikāram
    # filters and the segmented progress (the counts stop summing to malarCount).
    # If this warns, add the அதிகாரம் line back upstream rather than muting it.
    uncategorised = [e["id"] for e in index_malars
                     if e["kind"] == "malar" and not e["adhikaram"]]
    # நூற்பா numbering restarts in each அதிகாரம், so a "sutra discussed" is an
    # (adhikāram, number) pair — summing the per-book unique counts is exact.
    total_sutras = sum(a["sutraCount"] for a in adhik_summary)

    # English translation layer (separate published edition) → text-en/*.json.
    en_count = build_english()

    index = {
        "collection": "tholkappiya-poonga",
        "title": {"ta": "தொல்காப்பியப் பூங்கா", "en": "Tholkappiya Poonga"},
        "author": {"ta": "கலைஞர் மு. கருணாநிதி", "en": "Kalaignar M. Karunanidhi"},
        "work": {"ta": "தொல்காப்பியம்", "en": "Tolkāppiyam"},
        "publisher": bookfield("பதிப்பகம்", "தமிழ்க்கனி பதிப்பகம்"),
        "edition": bookfield("பதிப்பு", "முதல் பதிப்பு"),
        "year": 2003,
        "rights": bookfield("உரிமை", "ஆசிரியருக்கே"),
        "scanPages": int(re.sub(r"\D", "", bookfield("ஸ்கேன் PDF பக்கங்கள்", "537")) or 537),
        "sourceRepo": SOURCE_REPO,
        "adhikarams": adhik_summary,
        "malarCount": malar_count,
        "sutraCount": total_sutras,
        "malars": index_malars,
    }
    if en_count:
        index["english"] = {
            "work": EN_WORK_TITLE,
            "translator": EN_TRANSLATOR,
            "blossomCount": en_count,
        }
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT / "fulltext.json").write_text(json.dumps(fulltext, ensure_ascii=False), encoding="utf-8")

    print(f"Tholkappiya Poonga: {len(entries)} entries "
          f"({malar_count} malars + {len(entries)-malar_count} intro), {total_sutras} sutras discussed.")
    for a in adhik_summary:
        print(f"  {a['ta']}: {a['malarCount']} malars · {a['sutraCount']} sutras")
    print(f"  English: {en_count} blossom translations (text-en/) — {EN_WORK_TITLE}, tr. {EN_TRANSLATOR}.")
    if uncategorised:
        print(f"  ! WARNING: {len(uncategorised)} malar(s) have no அதிகாரம் and will be "
              f"missing from the adhikāram filters + segmented progress: {uncategorised}. "
              f"Add the 'அதிகாரம்:' line to their chapter README in {SOURCE_REPO} (see malar 24).")
    if dup_ids:
        print(f"  ! skipped duplicate source dirs: {dup_ids} (flag for cleanup in {SOURCE_REPO})")
    if _BAD_UTF8:
        print(f"  ! invalid UTF-8 recovered with replacement in: {sorted(set(_BAD_UTF8))} "
              f"(flag for source correction in {SOURCE_REPO})")


if __name__ == "__main__":
    main()
