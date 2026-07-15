#!/usr/bin/env python3
"""Place Volume 2 sketches into the Reading Room chapters.

Volume 2's manifest is shaped differently from Volume 1: there are no sentence
anchors. Each retained visual carries a chapter_number, a chapter_page_number
and a position_in_page (top / middle / bottom). We map that to a paragraph slot
in the chapter's published text and emit the same per-chapter file the Reader
already consumes:

  public/data/visuals/v2-ch{NN}.json  ->  [{ "src", "type", "afterParagraph", "confidence" }, ...]

Only visuals whose image file is actually present and that are anchored to a
chapter are placed. Cover, back-cover and front-matter plates are skipped (and,
in this drop, their image files are absent anyway). Images are thresholded to
ink-on-transparent PNGs by the shared helper, so they blend into the page.
"""
from __future__ import annotations

import json
from pathlib import Path

from build_volume1_visuals import to_transparent_png  # shared threshold helper

SRC = Path("/Users/pugazhendhirajendran/Documents/volume2_visuals_redone-2")
ROOT = Path(__file__).resolve().parents[2]
IMG_OUT = ROOT / "public" / "images" / "volume2"
VIS_OUT = ROOT / "public" / "data" / "visuals"
TEXT_DIR = ROOT / "public" / "data" / "text"
VOLUME = 2


def paragraph_slot(position: str, chapter_page: int, nparas: int) -> int:
    """Resolve a page-position hint to an insertion point (-1 = before para 0)."""
    # Later pages of a chapter sit deeper in the text.
    if chapter_page and chapter_page > 1:
        return nparas - 1 if position == "bottom" else max(0, nparas // 2)
    # First page of the chapter.
    if position == "top":
        return -1  # a chapter-opening illustration
    if position == "middle":
        return max(0, nparas // 2)
    # bottom of the first page — still early in the chapter
    return min(1, nparas - 1)


def main() -> None:
    manifest = json.loads(
        (SRC / "visuals_manifest_with_chapter_pages.json").read_text(encoding="utf-8")
    )
    IMG_OUT.mkdir(parents=True, exist_ok=True)
    VIS_OUT.mkdir(parents=True, exist_ok=True)

    by_chapter: dict[str, list[dict]] = {}
    placed, skipped = 0, 0

    for item in manifest["visuals"]:
        num = item.get("chapter_number")
        img = SRC / "images" / item["filename"]
        if num is None or not img.exists():
            skipped += 1  # cover / front-matter / missing file
            continue
        cid = f"v{VOLUME}-ch{num:02d}"
        text_path = TEXT_DIR / f"{cid}.json"
        if not text_path.exists():
            print(f"  ! {item['filename']}: no text for {cid}, skipped")
            skipped += 1
            continue
        nparas = max(1, len(json.loads(text_path.read_text(encoding="utf-8")).get("paragraphs", [])))

        after = paragraph_slot(
            item.get("position_in_page", ""),
            item.get("chapter_page_number") or 1,
            nparas,
        )
        png = Path(item["filename"]).with_suffix(".png").name
        to_transparent_png(img, IMG_OUT / png)
        by_chapter.setdefault(cid, []).append(
            {
                "src": f"/images/volume2/{png}",
                "type": "sketch",
                "afterParagraph": after,
                "confidence": 1.0 if item.get("position_in_page") == "top" else 0.6,
            }
        )
        placed += 1

    for cid, vis in by_chapter.items():
        vis.sort(key=lambda v: v["afterParagraph"])
        (VIS_OUT / f"{cid}.json").write_text(
            json.dumps(vis, ensure_ascii=False, indent=1), encoding="utf-8"
        )

    print(f"Placed {placed} visuals across {len(by_chapter)} chapters (skipped {skipped}).")
    print(f"  chapters: {', '.join(sorted(by_chapter))}")


if __name__ == "__main__":
    main()
