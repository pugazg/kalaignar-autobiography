"""Extract a structured chapter index from a Nenjukku Neethi volume (OCR markdown).

Usage:  python3 scripts/extract_index.py path/to/volumeN.md N
Writes: data/extracted/volumeN.index.json

Chapters are detected by the word-joiner marker (U+2060) that prefixes
chapter titles in the OCR output, immediately after a page comment.
"""
import json
import re
import sys

WJ = "\u2060"


def build_index(path: str, volume: int) -> dict:
    text = open(path, encoding="utf-8").read()
    parts = re.split(r"<!-- PAGE (\d+) -->", text)
    pages = [(int(parts[i]), parts[i + 1].strip()) for i in range(1, len(parts) - 1, 2)]

    chapters = []
    for num, content in pages:
        lines = [l.strip() for l in content.split("\n") if l.strip()]
        if lines and lines[0].startswith(WJ):
            chapters.append({"title": lines[0].lstrip(WJ).strip(), "startPage": num})

    last_page = pages[-1][0] if pages else 0
    for j, ch in enumerate(chapters):
        ch["endPage"] = chapters[j + 1]["startPage"] - 1 if j + 1 < len(chapters) else last_page
        ch["id"] = f"v{volume}-ch{j + 1:02d}"

    return {
        "volume": volume,
        "totalPages": last_page,
        "chapterCount": len(chapters),
        "chapters": chapters,
    }


if __name__ == "__main__":
    src, vol = sys.argv[1], int(sys.argv[2])
    idx = build_index(src, vol)
    out = f"data/extracted/volume{vol}.index.json"
    json.dump(idx, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{out}: {idx['chapterCount']} chapters, {idx['totalPages']} pages")
