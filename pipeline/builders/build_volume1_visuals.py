#!/usr/bin/env python3
"""Place Volume 1 sketches/photos into the Reading Room chapters.

Source:
  volume1_visuals_with_chapter_sentence_manifest/images/*.jpg      the visuals
  visuals_manifest_by_chapter.json                                 chapter + sentence anchors

Each visual anchors to a chapter and a nearby sentence (OCR-derived, often noisy).
We resolve every anchor to a *paragraph index* in that chapter's published text by
fuzzy token overlap, then emit a small per-chapter file the Reader interleaves:

  public/data/visuals/v1-ch{NN}.json  ->  [{ "src", "type", "afterParagraph", "confidence" }, ...]

  afterParagraph = -1  render before the first paragraph
                 =  i  render immediately after paragraph i

Images are copied to public/images/volume1/. Cover and back-cover are skipped.
Tamil is authoritative; these visuals sit alongside the text without altering it.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np
from PIL import Image

# Ink tint for the cleaned art: the site's ink colour, so `filter: invert()`
# in dark mode yields a warm off-white (~#F0E8DF) that matches night-text.
INK_RGB = (15, 23, 32)
# Luminance below BLACK_PT is solid ink; above WHITE_PT is transparent paper.
BLACK_PT, WHITE_PT = 95, 205


def to_transparent_png(src: Path, dst: Path) -> None:
    """Threshold a scanned sketch to ink-on-transparent, dropping the paper."""
    lum = np.asarray(Image.open(src).convert("L"), dtype=np.float32)
    alpha = (WHITE_PT - lum) / (WHITE_PT - BLACK_PT)
    alpha = np.clip(alpha, 0.0, 1.0)
    h, w = lum.shape
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = INK_RGB
    out[..., 3] = (alpha * 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(dst, "PNG", optimize=True)

SRC = Path("/Users/pugazhendhirajendran/Documents/volume1_visuals_with_chapter_sentence_manifest")
ROOT = Path(__file__).resolve().parents[2]
IMG_OUT = ROOT / "public" / "images" / "volume1"
VIS_OUT = ROOT / "public" / "data" / "visuals"
TEXT_DIR = ROOT / "public" / "data" / "text"

# Keep Tamil letters (and digits) only; drop punctuation, spaces, stray Latin/OCR marks.
_KEEP = re.compile(r"[஀-௿0-9]+")


def tokens(s: str) -> list[str]:
    return [t for t in _KEEP.findall(s or "") if len(t) >= 4]


def normalize(s: str) -> str:
    return "".join(_KEEP.findall(s or ""))


def resolve_paragraph(sentence: str, paragraphs: list[str]) -> tuple[int, float]:
    """Best-matching paragraph index for an OCR sentence anchor, with confidence 0–1."""
    anchor_tokens = tokens(sentence)
    if not anchor_tokens or not paragraphs:
        return 0, 0.0
    norms = [normalize(p) for p in paragraphs]
    best_i, best_score = 0, 0
    for i, n in enumerate(norms):
        score = sum(1 for t in anchor_tokens if t in n)
        if score > best_score:
            best_i, best_score = i, score
    return best_i, best_score / len(anchor_tokens)


def chapter_id(n: int) -> str:
    return f"v1-ch{n:02d}"


def main() -> None:
    manifest = json.loads((SRC / "visuals_manifest_by_chapter.json").read_text(encoding="utf-8"))
    IMG_OUT.mkdir(parents=True, exist_ok=True)
    VIS_OUT.mkdir(parents=True, exist_ok=True)

    CONF_MIN = 0.34  # below this the OCR anchor is unusable; distribute instead

    # Group anchor items per chapter in manifest (page) order — that already
    # reflects each visual's true reading order within the chapter.
    grouped: dict[str, list[dict]] = {}
    skipped = 0
    for item in manifest["items"]:
        loc = item["location"]
        if loc["kind"] != "chapter_anchor":  # cover / back-cover
            skipped += 1
            continue
        num = loc.get("chapter_number")
        cid = chapter_id(num) if num is not None else chapter_id(1)
        grouped.setdefault(cid, []).append((item, num is None))

    by_chapter: dict[str, list[dict]] = {}
    placed, spread = 0, 0

    for cid, entries in grouped.items():
        text_path = TEXT_DIR / f"{cid}.json"
        if not text_path.exists():
            print(f"  ! {cid}: no text file, skipped {len(entries)} visuals")
            skipped += len(entries)
            continue
        paragraphs = json.loads(text_path.read_text(encoding="utf-8")).get("paragraphs", [])
        nparas = max(1, len(paragraphs))

        # First pass: resolve confident anchors; collect the rest to distribute.
        resolved: list[dict] = []
        weak_positions: list[int] = []  # indices in `resolved` needing a spread slot
        for k, (item, lead) in enumerate(entries):
            loc = item["location"]
            if lead:
                after, conf = -1, 1.0
            else:
                idx, conf = resolve_paragraph(loc.get("sentence", ""), paragraphs)
                after = idx - 1 if loc.get("placement") == "before_sentence" else idx
            png = Path(item["file"]).with_suffix(".png").name
            rec = {
                "src": f"/images/volume1/{png}",
                "type": item["type"],
                "afterParagraph": after,
                "confidence": round(conf, 2),
            }
            if conf < CONF_MIN and not lead:
                weak_positions.append(k)
                spread += 1
            else:
                placed += 1
            resolved.append(rec)

        # Second pass: evenly space the weak ones through the chapter body,
        # in their reading order, so they neither cluster nor pretend precision.
        w = len(weak_positions)
        for n, k in enumerate(weak_positions):
            frac = (n + 1) / (w + 1)
            resolved[k]["afterParagraph"] = max(0, round(frac * nparas) - 1)

        for item, _ in entries:
            dst = IMG_OUT / Path(item["file"]).with_suffix(".png").name
            to_transparent_png(SRC / "images" / item["file"], dst)

        resolved.sort(key=lambda v: v["afterParagraph"])
        by_chapter[cid] = resolved
        (VIS_OUT / f"{cid}.json").write_text(
            json.dumps(resolved, ensure_ascii=False, indent=1), encoding="utf-8"
        )

    print(f"Placed {placed + spread} visuals across {len(by_chapter)} chapters "
          f"(skipped {skipped}: cover/back-cover/missing).")
    print(f"  precise anchor matches: {placed} · distributed (weak OCR anchor): {spread}")


if __name__ == "__main__":
    main()
