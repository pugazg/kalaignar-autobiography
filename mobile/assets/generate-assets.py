#!/usr/bin/env python3
"""Generate the Nenjukku Neethi app icon / splash / adaptive-icon.

The நீ glyph is rasterised directly from the site's vector source
(../../app/icon.svg) so the app identity is pixel-identical to the website —
cream நீ, marina-teal field, brass frame. Requires: pillow, matplotlib, numpy.

Run from anywhere:  python3 mobile/assets/generate-assets.py
"""
import os, re
import numpy as np
import matplotlib
matplotlib.use("Agg")
from matplotlib.path import Path
from matplotlib.patches import PathPatch
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = HERE
SVG = os.path.normpath(os.path.join(HERE, "../../app/icon.svg"))
HELVETICA = "/System/Library/Fonts/Helvetica.ttc"

MARINA_TOP = (18, 114, 122)   # #12727A
MARINA_BOT = (14, 93, 99)     # #0E5D63
CREAM = (250, 247, 241)       # #FAF7F1
CREAM_HEX = "#FAF7F1"
BRASS = (185, 138, 47)        # #B98A2F


# ── vector நீ from icon.svg → transparent RGBA sprite ────────────────────────
def _mat_translate(a, b):
    m = np.eye(3); m[0, 2] = a; m[1, 2] = b; return m


def _mat_scale(sx, sy):
    m = np.eye(3); m[0, 0] = sx; m[1, 1] = sy; return m


def _parse_transform(s):
    M = np.eye(3)
    for name, args in re.findall(r"(translate|scale)\(([^)]*)\)", s):
        n = [float(x) for x in re.split(r"[,\s]+", args.strip()) if x]
        M = M @ (_mat_translate(n[0], n[1] if len(n) > 1 else 0) if name == "translate"
                 else _mat_scale(n[0], n[1] if len(n) > 1 else n[0]))
    return M


def _build_path(d, M):
    toks = re.findall(r"[MLHVQZ]|-?\d*\.?\d+", d)
    verts, codes = [], []
    i = 0; cx = cy = 0.0

    def emit(code, x, y):
        p = M @ np.array([x, y, 1.0]); verts.append((p[0], p[1])); codes.append(code)

    while i < len(toks):
        c = toks[i]; i += 1
        if c == "M":
            cx, cy = float(toks[i]), float(toks[i + 1]); i += 2; emit(Path.MOVETO, cx, cy)
        elif c == "L":
            cx, cy = float(toks[i]), float(toks[i + 1]); i += 2; emit(Path.LINETO, cx, cy)
        elif c == "H":
            cx = float(toks[i]); i += 1; emit(Path.LINETO, cx, cy)
        elif c == "V":
            cy = float(toks[i]); i += 1; emit(Path.LINETO, cx, cy)
        elif c == "Q":
            emit(Path.CURVE3, float(toks[i]), float(toks[i + 1]))
            ex, ey = float(toks[i + 2]), float(toks[i + 3]); i += 4
            emit(Path.CURVE3, ex, ey); cx, cy = ex, ey
        elif c == "Z":
            emit(Path.CLOSEPOLY, cx, cy)
    return Path(verts, codes)


def glyph_sprite(px=1600):
    """Render நீ as it sits in the 512 viewBox, at `px` resolution (RGBA)."""
    svg = open(SVG).read()
    gm = _parse_transform(re.search(r'<g fill="#FAF7F1"\s+transform="([^"]*)"', svg).group(1))
    paths = re.findall(r'<path[^>]*transform="([^"]*)"[^>]*d="([^"]*)"', svg)
    fig = plt.figure(figsize=(px / 100, px / 100), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, 512); ax.set_ylim(512, 0); ax.axis("off")
    for tr, d in paths:
        ax.add_patch(PathPatch(_build_path(d, gm @ _parse_transform(tr)),
                               facecolor=CREAM_HEX, edgecolor="none", antialiased=True))
    tmp = os.path.join(HERE, "_glyph_tmp.png")
    fig.savefig(tmp, transparent=True, dpi=100); plt.close(fig)
    im = Image.open(tmp).convert("RGBA"); os.remove(tmp)
    return im  # px×px, glyph positioned as in the SVG canvas


def gradient(size):
    w, h = size
    img = Image.new("RGB", size); px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        col = tuple(round(MARINA_TOP[i] + (MARINA_BOT[i] - MARINA_TOP[i]) * t) for i in range(3))
        for x in range(w):
            px[x, y] = col
    return img


def scaled_to_height(sprite, target_h):
    crop = sprite.crop(sprite.getbbox())
    w, h = crop.size
    return crop.resize((round(w * target_h / h), target_h), Image.LANCZOS)


def main():
    full = glyph_sprite(1600)  # SVG-positioned (matches the site composition)

    # icon.png — the site composition exactly, plus a brass frame.
    S = 1024
    icon = gradient((S, S))
    ImageDraw.Draw(icon).rounded_rectangle([44, 44, S - 44, S - 44], radius=188,
                                           outline=BRASS, width=20)
    glyph_icon = full.resize((S, S), Image.LANCZOS)  # same relative placement as SVG
    icon.paste(glyph_icon, (0, 0), glyph_icon)
    icon.save(os.path.join(OUT, "icon.png")); print("icon.png")

    # adaptive-icon.png — glyph centred inside Android's safe zone, transparent.
    adaptive = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    g = scaled_to_height(full, 470)
    adaptive.paste(g, ((S - g.width) // 2, (S - g.height) // 2), g)
    adaptive.save(os.path.join(OUT, "adaptive-icon.png")); print("adaptive-icon.png")

    # splash.png — teal field, centred நீ, Latin wordmark (resizeMode: contain).
    SP = 1242
    splash = gradient((SP, SP))
    g = scaled_to_height(full, 520)
    splash.paste(g, ((SP - g.width) // 2, SP // 2 - g.height // 2 - 70), g)
    sd = ImageDraw.Draw(splash)
    wf = ImageFont.truetype(HELVETICA, 62)
    word = "N E N J U K K U   N E E T H I"
    wb = sd.textbbox((0, 0), word, font=wf)
    sd.text((SP / 2 - (wb[0] + wb[2]) / 2, SP - 300), word, font=wf, fill=CREAM)
    splash.save(os.path.join(OUT, "splash.png")); print("splash.png")


if __name__ == "__main__":
    main()
