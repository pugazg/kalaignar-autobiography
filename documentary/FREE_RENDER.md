# Free local documentary rendering

This renderer creates an image-led editorial proof of **Nenjukku Neethi · Volume 1 · Chapter 1** without a paid video service.

Version 2 fixes two problems in the first proof:

1. Tamil is shaped by **Pango/HarfBuzz** and rasterised into PNG layers. FFmpeg `drawtext` is not used.
2. Kalaignar's repository portrait is included in the opening, reflective and closing scenes instead of showing typography alone.

The portrait and all other assets still require a rights check before public release.

## 1. Install the free dependencies

### macOS

```bash
brew install ffmpeg pango
brew install --cask font-noto-serif-tamil
```

`ffmpeg-full` also works. The renderer no longer needs FFmpeg's `drawtext` or `subtitles` filters.

Verify Pango:

```bash
pango-view --version
```

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y ffmpeg pango1.0-tools fonts-noto-core
```

## 2. Update the renderer branch

From the Git clone:

```bash
git switch agent/free-documentary-renderer
git pull
```

## 3. Render the image-led Tamil proof

Run from the repository root:

```bash
python3 documentary/tools/render_free_proof.py \
  --font-family "Noto Serif Tamil"
```

Output:

```text
documentary/chapters/v1-ch01/render/v1-ch01-free-proof.mp4
```

Open it on macOS:

```bash
open documentary/chapters/v1-ch01/render/v1-ch01-free-proof.mp4
```

## 4. Render with approved narration

```bash
python3 documentary/tools/render_free_proof.py \
  --font-family "Noto Serif Tamil" \
  --audio /absolute/path/to/approved-tamil-narration.wav
```

Do not imitate Kalaignar's voice. Use a neutral narrator.

## Portrait selection

The default portrait is:

```text
public/images/kalaignar-portrait.png
```

Use another rights-cleared image:

```bash
python3 documentary/tools/render_free_proof.py \
  --font-family "Noto Serif Tamil" \
  --portrait /absolute/path/to/kalaignar-image.png
```

Render without a portrait only when needed:

```bash
python3 documentary/tools/render_free_proof.py \
  --font-family "Noto Serif Tamil" \
  --no-portrait
```

## Subtitle behaviour

Tamil SRT cues are parsed by Python. Every cue is shaped by Pango/HarfBuzz as a PNG and composited at its timestamp. This avoids broken vowel signs, detached pulli marks and split Tamil glyph clusters.

Disable burned subtitles:

```bash
python3 documentary/tools/render_free_proof.py \
  --font-family "Noto Serif Tamil" \
  --no-subtitles
```

## What this proof contains

- 1920×1080, 25 fps H.264 MP4
- correctly shaped Tamil title and subtitle layers
- Kalaignar portrait scenes with documentary framing
- original typography and restrained visual graphics
- existing Tamil SRT cues
- optional approved narration
- visible illustrative-reconstruction disclosure
- no paid API or cloud-render dependency

## Editorial limitations

This is now an image-led proof, but it is not yet a finished archival documentary. The middle historical sections still use original graphic cards rather than unverified or fabricated photographs. Before publication:

- clear the rights for the Kalaignar portrait and every added asset;
- verify quotations against the printed chapter scans;
- replace selected 1924 cards with rights-cleared maps, documents and photographs;
- add approved narration, ambience and music;
- close the human-review items in `metadata.json`.

Generated historical reconstructions must remain visibly labelled as illustrative.
