#!/usr/bin/env python3
"""Build the site's Murasoli data for Volume 49 from the page-fidelity repo.

Volume 49 (github.com/pugazg/kalaignar-murasoli-letters, volumes/volume-49) is
transcribed page-by-page rather than as one file per letter:

  chapters/<n>-<slug>.md         per-letter frontmatter (number, date, page spans);
                                 the Tamil BODY is NOT here — it lives in pages/.
  pages/page-<PDF>.md            one Markdown file per PDF page, tagged with its
                                 letter_number — the canonical Tamil text.
  translations/en/letters/<n>-<slug>.md
                                 the English translation (+ a full Tamil reproduction
                                 below it, which we ignore — pages/ is canonical).

This parses that layout and emits exactly the shape volumes 50–54 already use:

  public/data/murasoli/letters/m49-l{n}.json      Tamil   {salutation, paragraphs, …}
  public/data/murasoli/letters-en/m49-l{n}.json   English {title, salutation, translatorNote, paragraphs, …}
  public/data/murasoli/letters-index.json         + volume 49 entry
  public/data/murasoli/index.json                 + volume 49 entry

Usage:
  python3 build_vol49_from_pages.py [/path/to/kalaignar-murasoli-letters/volumes/volume-49]
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

VOLUME = 49
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
    "/tmp/kml49/volumes/volume-49"
)
OUT = Path(__file__).resolve().parents[2] / "public" / "data" / "murasoli"
TAMIL_SALUTATION = "உடன்பிறப்பே,"
EN_SALUTATION = "Udanpirappē,"
SOURCE_URL = "https://tamildigitallibrary.in"
# A body line ending in one of these is treated as a completed sentence, so a
# page break after it starts a new paragraph rather than continuing the last one.
_SENTENCE_END = re.compile(r"[.!?…”\"’')\]]$")


def read_frontmatter(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if not m:
        return {}, text
    fm: dict[str, str] = {}
    for line in m.group(1).splitlines():
        mm = re.match(r'\s*([A-Za-z_]+):\s*"?(.*?)"?\s*$', line)
        if mm:
            fm[mm.group(1)] = mm.group(2)
    return fm, m.group(2)


def strip_md(s: str) -> str:
    """Drop Markdown emphasis/links so paragraphs are plain text, matching the
    shape volumes 50–54 store (the plain-text readers don't parse Markdown)."""
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)          # [text](url) -> text
    s = re.sub(r"\*\*([^*]+)\*\*", r"\1", s)                # **bold** -> bold
    s = re.sub(r"(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)", r"\1", s)  # *italic* -> italic
    s = s.replace("`", "")                                   # `code` -> code
    return re.sub(r"\s+", " ", s).strip()


def blocks(text: str) -> list[str]:
    """Blank-line separated blocks, each collapsed to a single plain-text line."""
    out = []
    for b in re.split(r"\n\s*\n", text.strip()):
        joined = " ".join(part.strip() for part in b.splitlines() if part.strip())
        if re.fullmatch(r"[-*_ ]{2,}", joined):
            continue  # Markdown thematic break (***, ---) — not content
        joined = strip_md(joined)
        if joined:
            out.append(joined)
    return out


# ── Tamil: assemble the letter body from its PDF page files ──────────────────
def tamil_paragraphs(page_bodies: list[str]) -> list[str]:
    paras: list[str] = []
    buf: list[str] = []

    def flush() -> None:
        if buf:
            paras.append(re.sub(r"\s+", " ", " ".join(buf)).strip())
            buf.clear()

    for pi, body in enumerate(page_bodies):
        lines = [ln.rstrip() for ln in body.strip("\n").splitlines()]
        start = 0
        if pi == 0:
            # Drop the opening address (stored as its own field) and, ahead of it,
            # the "<n>. title" heading. Most letters open with "உடன்பிறப்பே,";
            # a few (e.g. tributes) have no address, so fall back to dropping the
            # numbered heading block up to its first blank line (the title wraps).
            sal = next((k for k, ln in enumerate(lines) if ln.strip().startswith("உடன்பிறப்ப")), None)
            if sal is not None:
                start = sal + 1
            elif lines and re.match(r"^\s*\d+\.", lines[0].strip()):
                start = next((k for k, ln in enumerate(lines) if ln.strip() == ""), len(lines))
        for ln in lines[start:]:
            s = ln.strip()
            if s == "":
                flush()
            elif re.fullmatch(r"[-*_]{2,}", s):
                continue  # Markdown thematic break (***, ---) — not content
            elif re.match(r"^அன்புள்ள", s):
                # Valediction: the sign-off is its own final paragraph
                # ("அன்புள்ள, மு.க. <date>"), matching volumes 50–54.
                flush()
                buf.append(s)
            else:
                buf.append(s)
        # Page boundary: keep the paragraph open across the break unless the last
        # line clearly ended a sentence (paragraphs routinely span PDF pages).
        if pi < len(page_bodies) - 1 and buf and _SENTENCE_END.search(buf[-1].rstrip()):
            flush()
    flush()
    return paras


def build_tamil(chap_fm: dict) -> list[str]:
    ps, pe = int(chap_fm["pdf_page_start"]), int(chap_fm["pdf_page_end"])
    bodies = []
    for p in range(ps, pe + 1):
        f = SRC / "pages" / f"page-{p:03d}.md"
        if not f.exists():
            print(f"  ! missing page {f.name}")
            continue
        _, body = read_frontmatter(f)
        bodies.append(body)
    return tamil_paragraphs(bodies)


# ── English: parse translation, note, and any letter-specific notes ──────────
def parse_english(path: Path) -> tuple[str, str, list[str]]:
    fm, body = read_frontmatter(path)
    # Split off "## …" / "### …" sections (letter-specific notes appear at either
    # level across the volume); everything before the first is the translation.
    sections = re.split(r"^(#{2,3}\s+.*)$", body, flags=re.M)
    main = sections[0]
    letter_notes = ""
    for k in range(1, len(sections), 2):
        title, content = sections[k], sections[k + 1] if k + 1 < len(sections) else ""
        if "Letter-specific notes" in title:
            letter_notes = content
        # "## Original Tamil …" is the Tamil reproduction — ignored (pages/ is canonical).

    note_lines: list[str] = []
    body_lines: list[str] = []
    in_note = False
    salutation = EN_SALUTATION
    for ln in main.splitlines():
        s = ln.strip()
        if s.startswith("# "):
            continue
        if s.startswith(">"):
            q = s.lstrip(">").strip()
            if q.startswith("**Translator"):
                in_note = True
                continue
            if in_note:
                if q:
                    note_lines.append(q)
                continue
            body_lines.append(q)  # quoted material within the letter
            continue
        in_note = False
        if re.match(r"^\*\*[^*]+:\*\*", s):  # bold "Label:" metadata (Tamil source, Date, audit, …)
            continue
        if s.startswith("**Udanpirapp"):
            salutation = re.sub(r"\*", "", s).strip()
            continue
        body_lines.append(ln.rstrip())

    # The note mirrors the siblings' translatorNote verbatim (backticks kept);
    # only the letter body is reduced to plain text.
    note = " ".join(note_lines).strip()
    if letter_notes.strip():
        extra = " ".join(
            " ".join(p.strip() for p in b.splitlines() if p.strip())
            for b in re.split(r"\n\s*\n", letter_notes.strip())
            if b.strip()
        )
        note = (note + " Letter-specific notes: " + re.sub(r"\s+", " ", extra)).strip()
    return salutation, note, blocks("\n".join(body_lines))


def main() -> None:
    (OUT / "letters").mkdir(parents=True, exist_ok=True)
    (OUT / "letters-en").mkdir(parents=True, exist_ok=True)

    chapters = {}
    for f in (SRC / "chapters").glob("*.md"):
        if f.name.lower() == "readme.md":
            continue
        fm, _ = read_frontmatter(f)
        if fm.get("letter_number", "").isdigit():
            chapters[int(fm["letter_number"])] = fm
    numbers = sorted(chapters)

    en_by_num = {}
    for f in (SRC / "translations" / "en" / "letters").glob("*.md"):
        m = re.match(r"(\d+)", f.name)
        if m:
            en_by_num[int(m.group(1))] = f

    letter_meta = []
    total_pages = 0

    for num in numbers:
        chap = chapters[num]
        lid = f"m{VOLUME}-l{num}"
        ta_paras = build_tamil(chap)

        start_pg = int(chap["printed_page_start"])
        end_pg = int(chap["printed_page_end"])
        pages = [str(p) for p in range(start_pg, end_pg + 1)]
        total_pages = max(total_pages, end_pg)

        title = {"en": "", "ta": chap.get("title", "")}
        en_sal, note, en_paras = (EN_SALUTATION, "", [])
        if num in en_by_num:
            en_fm, _ = read_frontmatter(en_by_num[num])
            title["en"] = en_fm.get("english_title", "")
            en_sal, note, en_paras = parse_english(en_by_num[num])
        else:
            print(f"  ! no English translation for {num}")

        (OUT / "letters" / f"{lid}.json").write_text(
            json.dumps(
                {
                    "id": lid,
                    "collection": "murasoli-letter",
                    "volume": VOLUME,
                    "number": num,
                    "date": chap.get("date"),
                    "title": title,
                    "salutation": TAMIL_SALUTATION,
                    "pages": pages,
                    "ocrStatus": "source-verified",
                    "paragraphs": ta_paras,
                },
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )

        (OUT / "letters-en" / f"{lid}.json").write_text(
            json.dumps(
                {
                    "id": lid,
                    "lang": "en",
                    "title": title["en"],
                    "salutation": en_sal or EN_SALUTATION,
                    "translatorNote": note,
                    "paragraphs": en_paras,
                    "provenance": {"status": "translated", "source": "vol49 page-fidelity set"},
                },
                ensure_ascii=False,
                indent=1,
            ),
            encoding="utf-8",
        )

        letter_meta.append(
            {"id": lid, "number": num, "date": chap.get("date"), "title": title, "pages": pages}
        )

    # letters-index.json — add/replace volume 49, keep ascending
    li_path = OUT / "letters-index.json"
    li = json.loads(li_path.read_text(encoding="utf-8"))
    li["volumes"] = [v for v in li["volumes"] if v["volume"] != VOLUME]
    li["volumes"].append({"volume": VOLUME, "letterCount": len(letter_meta), "letters": letter_meta})
    li["volumes"].sort(key=lambda v: v["volume"])
    li_path.write_text(json.dumps(li, ensure_ascii=False), encoding="utf-8")

    # index.json — add/replace volume 49 (no page routes)
    idx_path = OUT / "index.json"
    idx = json.loads(idx_path.read_text(encoding="utf-8"))
    prev = next((v for v in idx["volumes"] if v["volume"] == VOLUME), None)
    entry = {"volume": VOLUME, "pageCount": total_pages, "pages": []}
    entry["sourceUrl"] = (prev or {}).get("sourceUrl", SOURCE_URL)
    idx["volumes"] = [v for v in idx["volumes"] if v["volume"] != VOLUME]
    idx["volumes"].append(entry)
    idx["volumes"].sort(key=lambda v: v["volume"])
    idx["totalPages"] = sum(v.get("pageCount", 0) for v in idx["volumes"])
    idx["volumeCount"] = len(idx["volumes"])
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Volume {VOLUME}: wrote {len(letter_meta)} letters (Tamil + English).")
    print(f"  pageCount={total_pages}, totalPages(all)={idx['totalPages']}, volumes={idx['volumeCount']}")


if __name__ == "__main__":
    main()
