#!/usr/bin/env python3
"""Place a photo-only visual volume (e.g. Volumes 5 and 6) into the Reading Room.

These manifests (visuals_manifest_with_chapter_pages.json) carry photographs and
the occasional political cartoon, all tagged `photo_or_illustration`, with a
chapter_number, chapter_page_number and position_in_page — but no sentence
anchors. The scanned art does not separate cleanly into line-art vs photo by
tone, and thresholding a photograph would destroy it, so every item is rendered
as a framed photograph (no ink threshold, no dark-invert).

Unlike Volume 2, the front matter is not indexed in the Reading Room, so the
book's chapter N maps directly to v{VOL}-ch{N} (no offset).

Placement: with several images per chapter and only a page-order hint, the images
are distributed evenly through the chapter in chapter_page_number order, so they
appear in reading order without clustering.

Usage:  build_photo_volume_visuals.py <volume-number> <source-dir>

Output:  public/data/visuals/v{VOL}-ch{NN}.json  ->  [{src, type, afterParagraph, confidence}]
         public/images/volume{VOL}/<file>.jpg     (downscaled, optimised)
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
VIS_OUT = ROOT / "public" / "data" / "visuals"
TEXT_DIR = ROOT / "public" / "data" / "text"
PHOTO_MAX_W = 1400


def npar(cid: str) -> int:
    p = TEXT_DIR / f"{cid}.json"
    if not p.exists():
        return 0
    return len(json.loads(p.read_text(encoding="utf-8")).get("paragraphs", []))


def save_photo(src: Path, dst: Path) -> None:
    """Copy an archival photo, downscaled and optimised, tone unchanged."""
    im = Image.open(src).convert("RGB")
    if im.width > PHOTO_MAX_W:
        im = im.resize((PHOTO_MAX_W, round(im.height * PHOTO_MAX_W / im.width)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=85, optimize=True)


def main() -> None:
    vol = int(sys.argv[1])
    src_dir = Path(sys.argv[2])
    img_out = ROOT / "public" / "images" / f"volume{vol}"
    img_out.mkdir(parents=True, exist_ok=True)
    VIS_OUT.mkdir(parents=True, exist_ok=True)

    manifest = json.loads(
        (src_dir / "visuals_manifest_with_chapter_pages.json").read_text(encoding="utf-8")
    )

    # Group present, chapter-anchored visuals per chapter.
    grouped: dict[int, list[dict]] = defaultdict(list)
    skipped = 0
    for item in manifest["visuals"]:
        num = item.get("chapter_number")
        fname = Path(item.get("filename", "")).name
        img = src_dir / "images" / fname
        if num is None or item.get("type") == "cover_image" or not img.exists():
            skipped += 1  # cover / missing
            continue
        grouped[num].append(item)

    by_chapter: dict[str, list[dict]] = {}
    placed = 0
    for num, items in grouped.items():
        cid = f"v{vol}-ch{num:02d}"
        nparas = npar(cid)
        if nparas == 0:
            print(f"  ! no text for {cid}, skipped {len(items)} visuals")
            skipped += len(items)
            continue
        # Reading order within the chapter: by printed page, then position.
        pos_rank = {"top": 0, "middle": 1, "bottom": 2}
        items.sort(key=lambda i: (i.get("chapter_page_number") or 0, pos_rank.get(i.get("position_in_page"), 1)))
        k = len(items)
        recs = []
        for j, item in enumerate(items):
            after = max(0, round((j + 1) / (k + 1) * nparas) - 1)
            png = f"{Path(item['filename']).stem}.jpg"
            save_photo(src_dir / "images" / Path(item["filename"]).name, img_out / png)
            recs.append(
                {"src": f"/images/volume{vol}/{png}", "type": "photo", "afterParagraph": after, "confidence": 1.0}
            )
            placed += 1
        recs.sort(key=lambda v: v["afterParagraph"])  # stable: preserves reading order
        by_chapter[cid] = recs
        (VIS_OUT / f"{cid}.json").write_text(
            json.dumps(recs, ensure_ascii=False, indent=1), encoding="utf-8"
        )

    print(f"Volume {vol}: placed {placed} photos across {len(by_chapter)} chapters (skipped {skipped}).")
    print(f"  chapters: {', '.join(sorted(by_chapter))}")


if __name__ == "__main__":
    main()
