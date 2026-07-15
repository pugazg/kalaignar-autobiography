#!/usr/bin/env python3
"""Place Volume 2 visuals into the Reading Room.

Two kinds of visual, handled differently:

* Chapter sketches (line art) — thresholded to ink-on-transparent PNGs, like
  Volume 1, and placed inside their chapter by the manifest's page-position hint
  (top / middle / bottom), since this manifest has no sentence anchors.

* Front-matter photo plates (archival photographs, pages 9–20) — copied as real
  photos (no threshold, no dark-invert) and placed together after the author's
  note, in page order.

Chapter offset: the book's என்னுரை (author's note) is chapter v2-ch01 in the
Reading Room, so the printed book's chapter N is v2-ch(N+1). (Verified: manifest
printed_page + 20 == the site page where that chapter starts.)

Output (the shape the Reader already consumes):
  public/data/visuals/v2-ch{NN}.json  ->  [{ "src", "type", "afterParagraph", "confidence" }, ...]
Only visuals whose image file is present are placed; the cover and the missing
front-matter photos (002–017) are skipped.
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

from build_volume1_visuals import to_transparent_png  # shared threshold helper

SRC = Path("/Users/pugazhendhirajendran/Documents/volume2_visuals_redone-2")
ROOT = Path(__file__).resolve().parents[2]
IMG_OUT = ROOT / "public" / "images" / "volume2"
VIS_OUT = ROOT / "public" / "data" / "visuals"
TEXT_DIR = ROOT / "public" / "data" / "text"
VOLUME = 2
ENNURAI = "v2-ch01"  # the author's note; photo plates follow it
PHOTO_MAX_W = 1400


def npar(cid: str) -> int:
    p = TEXT_DIR / f"{cid}.json"
    if not p.exists():
        return 0
    return len(json.loads(p.read_text(encoding="utf-8")).get("paragraphs", []))


def paragraph_slot(position: str, chapter_page: int, nparas: int) -> int:
    """Resolve a page-position hint to an insertion point (-1 = before para 0)."""
    if chapter_page and chapter_page > 1:
        return nparas - 1 if position == "bottom" else max(0, nparas // 2)
    if position == "top":
        return -1
    if position == "middle":
        return max(0, nparas // 2)
    return min(1, nparas - 1)  # bottom of the first page — still early


def save_photo(src: Path, dst: Path) -> None:
    """Copy an archival photo, downscaled and optimised, without altering tone."""
    im = Image.open(src).convert("RGB")
    if im.width > PHOTO_MAX_W:
        im = im.resize((PHOTO_MAX_W, round(im.height * PHOTO_MAX_W / im.width)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=85, optimize=True)


def main() -> None:
    manifest = json.loads(
        (SRC / "visuals_manifest_with_chapter_pages.json").read_text(encoding="utf-8")
    )
    IMG_OUT.mkdir(parents=True, exist_ok=True)
    VIS_OUT.mkdir(parents=True, exist_ok=True)

    by_chapter: dict[str, list[dict]] = {}
    sketches, photos, skipped = 0, 0, 0

    for item in manifest["visuals"]:
        # The manifest is inconsistent: some filenames carry an "images/" prefix.
        fname = Path(item["filename"]).name
        img = SRC / "images" / fname
        if not img.exists():
            skipped += 1  # cover kept out too, and the absent front-matter photos
            continue

        is_plate = item.get("type") == "photo_plate_page"
        num = item.get("chapter_number")

        if is_plate:
            cid = ENNURAI
            n = npar(cid)
            after = max(0, n - 1)  # gather the plates after the author's note
            png = f"{Path(fname).stem}.jpg"
            save_photo(img, IMG_OUT / png)
            by_chapter.setdefault(cid, []).append(
                {"src": f"/images/volume2/{png}", "type": "photo", "afterParagraph": after, "confidence": 1.0}
            )
            photos += 1
            continue

        if num is None:
            skipped += 1  # cover_image
            continue

        cid = f"v{VOLUME}-ch{num + 1:02d}"  # +1: ennurai occupies v2-ch01
        n = npar(cid)
        if n == 0:
            print(f"  ! {fname}: no text for {cid}, skipped")
            skipped += 1
            continue
        after = paragraph_slot(item.get("position_in_page", ""), item.get("chapter_page_number") or 1, n)
        png = f"{Path(fname).stem}.png"
        to_transparent_png(img, IMG_OUT / png)
        by_chapter.setdefault(cid, []).append(
            {
                "src": f"/images/volume2/{png}",
                "type": "sketch",
                "afterParagraph": after,
                "confidence": 1.0 if item.get("position_in_page") == "top" else 0.6,
            }
        )
        sketches += 1

    for cid, vis in by_chapter.items():
        vis.sort(key=lambda v: v["afterParagraph"])  # stable: preserves plate page order
        (VIS_OUT / f"{cid}.json").write_text(
            json.dumps(vis, ensure_ascii=False, indent=1), encoding="utf-8"
        )

    print(f"Placed {sketches} sketches + {photos} photo plates across {len(by_chapter)} chapters "
          f"(skipped {skipped}: cover / missing front-matter photos).")
    print(f"  chapters: {', '.join(sorted(by_chapter))}")


if __name__ == "__main__":
    main()
