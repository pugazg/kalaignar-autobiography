# Free local documentary rendering

This route creates an actual MP4 without a paid AI-video subscription. It uses FFmpeg, the approved subtitles, original typography and simple illustrative graphics. It deliberately does **not** fabricate archival photographs or imitate Kalaignar's voice.

## 1. Install the free dependencies

### macOS

```bash
brew install ffmpeg
```

Install **Noto Serif Tamil** or another Tamil-capable `.ttf`/`.otf` font.

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y ffmpeg fonts-noto-core
```

## 2. Render a silent, subtitled proof

Run from the repository root:

```bash
python3 documentary/tools/render_free_proof.py
```

Output:

```text
documentary/chapters/v1-ch01/render/v1-ch01-free-proof.mp4
```

The proof is about 4 minutes long and follows the existing `v1-ch01` script and storyboard.

## 3. Render with approved narration

Record the Tamil narration yourself or commission/produce a neutral narrator voice. Do not imitate Kalaignar. Then run:

```bash
python3 documentary/tools/render_free_proof.py \
  --audio /absolute/path/to/approved-tamil-narration.wav
```

The renderer mixes the narration into the MP4 and stops at the shorter of the video or audio tracks.

## 4. Font override

When the script cannot find a Tamil font automatically:

```bash
python3 documentary/tools/render_free_proof.py \
  --font /absolute/path/to/NotoSerifTamil-Regular.ttf
```

## What this proof contains

- 1920×1080, 25 fps H.264 MP4
- chapter/title cards
- timed Tamil typography based on the approved storyboard
- existing Tamil SRT subtitles when present
- optional approved narration audio
- visible illustrative-reconstruction disclosure
- no paid API, cloud render or generative-video dependency

## Limitations

This is a clean editorial proof rather than a finished archival documentary. Before public release, replace selected typography scenes with rights-cleared photographs, maps, scans, ambience and music listed in the chapter's rights ledger. Verify all quotations against the print scans and close the human-review items in `metadata.json`.
