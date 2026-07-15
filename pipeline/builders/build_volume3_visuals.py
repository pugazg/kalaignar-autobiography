#!/usr/bin/env python3
"""Place Volume 3 sketches/cartoons into the Reading Room, cropping out captured text.

Volume 3's crops came out loose: each cartoon panel has a block of chapter text
captured above (and occasionally beside) it. We detect the whitespace gap that
separates the text block from the illustration, crop to the illustration, tighten
to its ink, then threshold it to an ink-on-transparent PNG so it blends into the
page like the Volume 1/2 sketches. The single colour photo (026) is framed as-is.

Chapter mapping: this manifest's own chapter_number is coarse and its site page
metadata is partly broken, so each visual is placed by its pdf_page_reference —
mapped to the site chapter whose printed page-range contains it (pdf pages align
with the site's printed pages: manifest ch1 pdf 14 falls in v3-ch01, pp. 12–17).
Within the chapter the image is positioned proportionally to its page.

Output: public/data/visuals/v3-ch{NN}.json + public/images/volume3/<file>
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = Path("/Users/pugazhendhirajendran/Documents/volume3_visuals_redone")
IMG_OUT = ROOT / "public" / "images" / "volume3"
VIS_OUT = ROOT / "public" / "data" / "visuals"
TEXT_DIR = ROOT / "public" / "data" / "text"
REFS = ROOT / "data" / "references.ts"

INK_RGB = (15, 23, 32)
BLACK_PT, WHITE_PT = 95, 205
PHOTO_MAX_W = 1400


def chapter_bounds() -> list[tuple[str, int, int]]:
    """(id, start_page, end_page) for every v3 chapter, in order."""
    out = []
    for m in re.finditer(r'\{ id: "(v3-ch\d+)", volume: 3, title: (?:".*?"|\'.*?\'), pages: "([^"]*)" \}',
                          REFS.read_text(encoding="utf-8")):
        cid, pages = m.groups()
        nums = [int(n) for n in re.findall(r"\d+", pages)]
        start = nums[0] if nums else 0
        end = nums[1] if len(nums) > 1 else start
        out.append((cid, start, max(start, end)))
    return out


def chapter_for_page(page: int, bounds: list[tuple[str, int, int]]) -> tuple[str, int, int]:
    chosen = bounds[0]
    for cid, s, e in bounds:
        if s <= page:
            chosen = (cid, s, e)
    return chosen


def npar(cid: str) -> int:
    p = TEXT_DIR / f"{cid}.json"
    return len(json.loads(p.read_text(encoding="utf-8")).get("paragraphs", [])) if p.exists() else 0


def crop_illustration(im: Image.Image) -> Image.Image:
    """Drop the chapter text above the panel: cut below the lowest whitespace gap,
    then tighten to the illustration's ink."""
    g = np.asarray(im.convert("L"), dtype=np.float32)
    H, W = g.shape
    r = (g < 140).mean(axis=1)
    r = np.convolve(r, np.ones(3) / 3, mode="same")
    lo, hi = int(0.08 * H), int(0.74 * H)
    gaps, run = [], None
    for y in range(lo, hi):
        if r[y] < 0.035:
            run = [run[0], y] if run else [y, y]
        else:
            if run:
                gaps.append(run)
                run = None
    if run:
        gaps.append(run)
    sig = [gp for gp in gaps if gp[1] - gp[0] >= 4]
    top = sig[-1][1] + 1 if sig else 0
    sub = g[top:H]
    col = (sub < 140).mean(axis=0)
    row = (sub < 140).mean(axis=1)
    ys = np.where(row > 0.012)[0]
    xs = np.where(col > 0.012)[0]
    if len(ys) == 0 or len(xs) == 0:
        return im
    y0, y1 = top + ys[0], top + ys[-1] + 1
    x0, x1 = xs[0], xs[-1] + 1
    p = 6
    return im.crop((max(0, x0 - p), max(0, y0 - p), min(W, x1 + p), min(H, y1 + p)))


def to_transparent_png(im: Image.Image, dst: Path) -> None:
    lum = np.asarray(im.convert("L"), dtype=np.float32)
    alpha = np.clip((WHITE_PT - lum) / (WHITE_PT - BLACK_PT), 0.0, 1.0)
    h, w = lum.shape
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = INK_RGB
    out[..., 3] = (alpha * 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(dst, "PNG", optimize=True)


def save_photo(im: Image.Image, dst: Path) -> None:
    im = im.convert("RGB")
    if im.width > PHOTO_MAX_W:
        im = im.resize((PHOTO_MAX_W, round(im.height * PHOTO_MAX_W / im.width)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=85, optimize=True)


def main() -> None:
    manifest = json.loads((SRC / "visuals_manifest_with_chapter_pages.json").read_text(encoding="utf-8"))
    IMG_OUT.mkdir(parents=True, exist_ok=True)
    VIS_OUT.mkdir(parents=True, exist_ok=True)
    bounds = chapter_bounds()

    # Map each placeable visual to a chapter by its printed page.
    per_chapter: dict[str, list[dict]] = {}
    skipped = 0
    for item in manifest["visuals"]:
        typ = item.get("type")
        page = item.get("pdf_page_reference")
        if typ == "cover_image" or page is None:
            skipped += 1
            continue
        cid, s, e = chapter_for_page(page, bounds)
        if npar(cid) == 0:
            print(f"  ! no text for {cid}, skipping {Path(item['filename']).name}")
            skipped += 1
            continue
        per_chapter.setdefault(cid, []).append({"item": item, "page": page, "start": s, "end": e})

    placed_sketch, placed_photo = 0, 0
    for cid, entries in per_chapter.items():
        n = npar(cid)
        entries.sort(key=lambda x: x["page"])
        recs = []
        for x in entries:
            item = x["item"]
            fname = Path(item["filename"]).name
            src = SRC / "images" / fname
            span = max(1, x["end"] - x["start"] + 1)
            frac = min(1.0, max(0.0, (x["page"] - x["start"]) / span))
            after = max(-1, min(n - 1, round(frac * n) - 1))
            if item.get("type") == "photo":
                png = f"{Path(fname).stem}.jpg"
                save_photo(Image.open(src), IMG_OUT / png)
                recs.append({"src": f"/images/volume3/{png}", "type": "photo", "afterParagraph": after, "confidence": 1.0})
                placed_photo += 1
            else:
                png = f"{Path(fname).stem}.png"
                to_transparent_png(crop_illustration(Image.open(src)), IMG_OUT / png)
                recs.append({"src": f"/images/volume3/{png}", "type": "sketch", "afterParagraph": after, "confidence": 0.6})
                placed_sketch += 1
        recs.sort(key=lambda v: v["afterParagraph"])
        by = VIS_OUT / f"{cid}.json"
        by.write_text(json.dumps(recs, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"Volume 3: placed {placed_sketch} cropped sketches + {placed_photo} photo "
          f"across {len(per_chapter)} chapters (skipped {skipped}).")
    print(f"  chapters: {', '.join(sorted(per_chapter))}")


if __name__ == "__main__":
    main()
