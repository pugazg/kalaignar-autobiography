#!/usr/bin/env python3
"""Build the site's Murasoli data for Volume 53 from the translated markdown set.

Volume 53 arrives differently from Volume 54: instead of page-level OCR, each
letter is a single ``m53-l{n}.en.md`` file carrying BOTH the English translation
and the corrected Original Tamil, plus a bilingual ``contents.en.md`` table with
titles, dates and printed page numbers.

This script parses that source and emits exactly the shape the Reading Room and
the Letters library already consume for Volume 54:

  public/data/murasoli/letters/m53-l{n}.json      Tamil letter  {salutation, paragraphs, ...}
  public/data/murasoli/letters-en/m53-l{n}.json   English       {title, salutation, translatorNote, paragraphs, ...}
  public/data/murasoli/letters-index.json         + volume 53 entry (letter meta)
  public/data/murasoli/index.json                 + volume 53 entry (drives the library card)

The Tamil source remains authoritative; the English file is the published translation.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Same translated-markdown drop for every Murasoli volume. Pass the volume number
# and its source directory to build another one:
#   build_vol53_from_translations.py 52 /path/to/translations/vol52
_DEFAULT_SRC = "/Users/pugazhendhirajendran/Documents/Kalaignar_Murasoli_Letters_Translated/vol53"
VOLUME = int(sys.argv[1]) if len(sys.argv) > 1 else 53
SRC = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(_DEFAULT_SRC)
OUT = Path(__file__).resolve().parents[2] / "public" / "data" / "murasoli"
TAMIL_SALUTATION = "உடன்பிறப்பே,"
# Every Murasoli volume points at the same source library.
SOURCE_URL = "https://tamildigitallibrary.in"


def iso_date(raw: str) -> str | None:
    """'27-5-2015' / '30.12.2015' / '14-07-2015' -> '2015-05-27'."""
    raw = raw.strip()
    parts = re.split(r"[.\-/]", raw)
    if len(parts) != 3:
        return None
    d, m, y = (p.strip() for p in parts)
    if not (d.isdigit() and m.isdigit() and y.isdigit()):
        return None
    return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"


def parse_contents() -> dict[int, dict]:
    """Return {number: {ta, en, date_iso, page}} from the printed contents table."""
    rows: dict[int, dict] = {}
    for line in (SRC / "contents.en.md").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 5 or not cells[0].isdigit():
            continue
        num = int(cells[0])
        rows[num] = {
            "ta": cells[1],
            "en": cells[2],
            "date": iso_date(cells[3]),
            "page": int(re.sub(r"\D", "", cells[4]) or 0),
        }
    return rows


def split_sections(md: str) -> dict[str, str]:
    """Split a letter markdown into its '## ' sections."""
    sections: dict[str, str] = {}
    current = None
    buf: list[str] = []
    for line in md.splitlines():
        m = re.match(r"^##\s+(.*)$", line)
        if m and not line.startswith("###"):
            if current is not None:
                sections[current] = "\n".join(buf).strip()
            current = m.group(1).strip()
            buf = []
        else:
            buf.append(line)
    if current is not None:
        sections[current] = "\n".join(buf).strip()
    return sections


def paragraphs(text: str) -> list[str]:
    """Blank-line separated blocks, each collapsed to a single line."""
    blocks = re.split(r"\n\s*\n", text.strip())
    out = []
    for b in blocks:
        joined = " ".join(part.strip() for part in b.splitlines() if part.strip())
        if joined:
            out.append(joined)
    return out


def parse_letter(path: Path) -> dict:
    md = path.read_text(encoding="utf-8")
    sections = split_sections(md)

    # English translation: first block is the "Udanpirappē," salutation.
    en_blocks = paragraphs(sections.get("English Translation", ""))
    en_salutation = None
    if en_blocks and en_blocks[0].lower().startswith("udanpirapp"):
        en_salutation = en_blocks.pop(0)

    # Original Tamil: drop the "# {num}. title" heading, then blocks.
    tamil_raw = sections.get("Original Tamil", "")
    tamil_raw = re.sub(r"^#\s+\d+\..*$", "", tamil_raw, count=1, flags=re.MULTILINE).strip()
    ta_blocks = paragraphs(tamil_raw)
    # Every letter opens with the "உடன்பிறப்பே," address, matching Volume 54.
    # Drop it from the body if the source already carried it, so it isn't doubled.
    if ta_blocks and ta_blocks[0].replace(" ", "") == TAMIL_SALUTATION.replace(" ", ""):
        ta_blocks.pop(0)
    ta_salutation = TAMIL_SALUTATION

    note = " ".join(paragraphs(sections.get("Translator's Note", "")))
    return {
        "en_salutation": en_salutation,
        "en_paragraphs": en_blocks,
        "ta_salutation": ta_salutation,
        "ta_paragraphs": ta_blocks,
        "translator_note": note,
    }


def main() -> None:
    contents = parse_contents()
    (OUT / "letters").mkdir(parents=True, exist_ok=True)
    (OUT / "letters-en").mkdir(parents=True, exist_ok=True)

    numbers = sorted(contents)
    letter_meta = []
    total_pages = 0

    for i, num in enumerate(numbers):
        lid = f"m{VOLUME}-l{num}"
        src = SRC / f"{lid}.en.md"
        if not src.exists():
            print(f"  ! missing {src.name}, skipping")
            continue
        info = parse_letter(src)
        c = contents[num]

        # Printed page span: this letter's start page up to the next letter's start.
        start = c["page"]
        nxt = contents[numbers[i + 1]]["page"] if i + 1 < len(numbers) else start + 7
        span = max(1, (nxt - start) if nxt > start else 7)
        page_numbers = [str(p) for p in range(start, start + span)]
        total_pages = max(total_pages, start + span - 1)

        title = {"en": c["en"], "ta": c["ta"]}

        # Tamil letter file (authoritative)
        (OUT / "letters" / f"{lid}.json").write_text(
            json.dumps(
                {
                    "id": lid,
                    "collection": "murasoli-letter",
                    "volume": VOLUME,
                    "number": num,
                    "date": c["date"],
                    "title": title,
                    "salutation": info["ta_salutation"],
                    "pages": page_numbers,
                    "ocrStatus": "source-verified",
                    "paragraphs": info["ta_paragraphs"],
                },
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )

        # English translation file
        (OUT / "letters-en" / f"{lid}.json").write_text(
            json.dumps(
                {
                    "id": lid,
                    "lang": "en",
                    "title": c["en"],
                    "salutation": info["en_salutation"] or "Udanpirappē,",
                    "translatorNote": info["translator_note"],
                    "paragraphs": info["en_paragraphs"],
                    "provenance": {"status": "translated", "source": "vol53 translation set"},
                },
                ensure_ascii=False,
                indent=1,
            ),
            encoding="utf-8",
        )

        letter_meta.append(
            {
                "id": lid,
                "number": num,
                "date": c["date"],
                "title": title,
                "pages": page_numbers,
            }
        )

    # --- letters-index.json: add / replace volume 53, keep volumes sorted ascending ---
    li_path = OUT / "letters-index.json"
    li = json.loads(li_path.read_text(encoding="utf-8"))
    li["volumes"] = [v for v in li["volumes"] if v["volume"] != VOLUME]
    li["volumes"].append(
        {"volume": VOLUME, "letterCount": len(letter_meta), "letters": letter_meta}
    )
    li["volumes"].sort(key=lambda v: v["volume"])
    li_path.write_text(json.dumps(li, ensure_ascii=False), encoding="utf-8")

    # --- index.json: add / replace volume 53 (empty pages -> no page routes) ---
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
