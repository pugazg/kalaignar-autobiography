"""Extract a structured chapter index from a Nenjukku Neethi volume (OCR markdown).

Usage:  python3 scripts/extract_index.py path/to/volumeN.md N
Writes: data/extracted/volumeN.index.json

Detection strategies (auto-selected in this order):
  1. wordjoiner — U+2060-prefixed title lines (Volume 1 OCR style)
  2. numbered   — in-body numbered headings "12. Title" (Volumes 5-6 style)
  3. heuristic  — standalone short title line followed by a drop-cap
                  fragment or page-start prose (Volumes 2-4 style)
"""
import json
import re
import sys

WJ = "\u2060"
TAMIL = r"[\u0B80-\u0BFF]"


def split_pages(text):
    parts = re.split(r"<!-- PAGE (\d+) -->", text)
    return [(int(parts[i]), parts[i + 1]) for i in range(1, len(parts) - 1, 2)]


def by_wordjoiner(pages):
    out = []
    for num, content in pages:
        lines = [l.strip() for l in content.split("\n") if l.strip()]
        if lines and lines[0].startswith(WJ):
            out.append({"title": lines[0].lstrip(WJ).strip(), "startPage": num})
    return out


def by_numbered(pages, toc_pages=()):
    out, seen = [], set()
    pat = re.compile(r"^\s*(\d{1,3})\s*\.\s*([\u0B80-\u0BFF\"'\u2018\u201c][^\n]{2,60})$", re.M)
    for num, content in pages:
        if num in toc_pages:
            continue
        matches = list(pat.finditer(content))
        if len(matches) >= 5:  # in-body numbered list (chronology, interview), not headings
            continue
        for m in matches:
            ordinal = int(m.group(1))
            if ordinal in seen:  # running headers / repeats
                continue
            seen.add(ordinal)
            out.append({"title": m.group(2).strip(), "startPage": num, "ordinal": ordinal})
    out.sort(key=lambda c: (c["startPage"], c.get("ordinal", 0)))
    # enforce strictly non-decreasing pages; drop stragglers from stray numbers
    cleaned, last = [], -1
    for c in out:
        if c["startPage"] >= last:
            cleaned.append(c)
            last = c["startPage"]
    return cleaned


def by_heuristic(pages, min_start=0, skip_pages=()):
    out = []
    for pi, (pg, content) in enumerate(pages):
        if pg < min_start or pg in skip_pages:
            continue
        lines = [l.strip() for l in content.split("\n") if l.strip()]
        for li, l in enumerate(lines):
            if not (3 <= len(l) <= 60):
                continue
            if l.endswith((".", ",", ":", ";")) or l.endswith('."') or l.endswith(".\u201d"):
                continue
            if not re.search(TAMIL, l):
                continue
            if li + 1 < len(lines):
                nxt = lines[li + 1]
            elif pi + 1 < len(pages):
                nxt_lines = [x.strip() for x in pages[pi + 1][1].split("\n") if x.strip()]
                nxt = nxt_lines[0] if nxt_lines else ""
            else:
                nxt = ""
            dropcap = bool(re.fullmatch(r"['\"\u2018\u201c]?" + TAMIL + r"{1,4}", nxt))
            pagestart_prose = li == 0 and len(nxt) > 80
            if dropcap or pagestart_prose:
                out.append({"title": l, "startPage": pg})
                break  # at most one chapter start detected per page
    return out


# Per-volume configuration for known OCR layouts.
CONFIG = {
    1: {"strategy": "wordjoiner"},
    2: {"strategy": "heuristic", "min_start": 5, "skip_pages": set(range(9, 21))},
    3: {"strategy": "numbered", "toc_pages": set()},
    4: {"strategy": "heuristic", "min_start": 4, "skip_pages": set(range(9, 21))},
    5: {"strategy": "numbered", "toc_pages": set(range(9, 18))},
    6: {"strategy": "numbered", "toc_pages": set(range(7, 10))},
}


def build_index(path: str, volume: int) -> dict:
    text = open(path, encoding="utf-8").read()
    pages = split_pages(text)
    cfg = CONFIG.get(volume, {"strategy": "heuristic"})
    if cfg["strategy"] == "wordjoiner":
        chapters = by_wordjoiner(pages)
    elif cfg["strategy"] == "numbered":
        chapters = by_numbered(pages, cfg.get("toc_pages", ()))
    else:
        chapters = by_heuristic(pages, cfg.get("min_start", 0), cfg.get("skip_pages", ()))

    last_page = pages[-1][0] if pages else 0
    for j, ch in enumerate(chapters):
        ch["endPage"] = chapters[j + 1]["startPage"] - 1 if j + 1 < len(chapters) else last_page
        ch["id"] = f"v{volume}-ch{j + 1:02d}"
        ch.pop("ordinal", None)

    return {
        "volume": volume,
        "strategy": cfg["strategy"],
        "totalPages": last_page,
        "chapterCount": len(chapters),
        "chapters": chapters,
    }


if __name__ == "__main__":
    src, vol = sys.argv[1], int(sys.argv[2])
    idx = build_index(src, vol)
    out = f"data/extracted/volume{vol}.index.json"
    json.dump(idx, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{out}: {idx['chapterCount']} chapters, {idx['totalPages']} pages [{idx['strategy']}]")
