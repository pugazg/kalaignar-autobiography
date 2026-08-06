#!/usr/bin/env python3
"""Render a free, source-faithful proof video for Nenjukku Neethi.

Requirements:
  - Python 3.10+
  - ffmpeg and ffprobe on PATH
  - A Tamil-capable font, preferably Noto Serif Tamil

The proof uses original typography and simple vector-like graphics only. It does not
fabricate archival photographs. Add an approved narration file with --audio when ready.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

WIDTH, HEIGHT, FPS = 1920, 1080, 25
BG = "#FAF7F1"
INK = "#0F1720"
TEAL = "#0E5D63"
BRASS = "#B98A2F"

SCENES = [
    (0, 16, "நெஞ்சுக்கு நீதி", "பிறந்த ஆண்டு\n1924 · திருக்குவளை"),
    (16, 66, "ஒரு கேள்வியோடு தொடங்கும் சுயசரிதை", "வரலாறு பெரியவர்களுக்கு மட்டும் சொந்தமா?"),
    (66, 88, "1924", "ஒரு காலத்தின் கேள்விக்குறி"),
    (88, 114, "உலகம் மாறிய ஆண்டு", "காந்தி · லெனின் · காலனிய எதிர்ப்புகள்"),
    (114, 140, "தமிழகத்தில் புதிய குரல்கள்", "சுயமரியாதை · சமூக நீதி"),
    (140, 168, "காவிரி", "மைசூர் ↔ சென்னை மாகாணம்"),
    (168, 194, "திருக்குவளை", "திருக்குளம் · சோலை · சிவன் கோயில்"),
    (194, 225, "ஒரு மனிதனின் வாழ்க்கை", "காலம் · சமூகம் · மொழி · அரசியல்"),
    (225, 245, "மூலத்தை வாசிக்க", "nenjukkuneethi.org/read/v1-ch01"),
]


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


def require(binary: str) -> None:
    if shutil.which(binary) is None:
        raise SystemExit(f"Missing required command: {binary}")


def escape_drawtext(text: str) -> str:
    return (
        text.replace("\\", r"\\")
        .replace(":", r"\:")
        .replace("'", r"\'")
        .replace("%", r"\%")
        .replace("\n", r"\n")
    )


def find_font(explicit: str | None) -> str:
    candidates = [
        explicit,
        "/System/Library/Fonts/Supplemental/NotoSerifTamil-Regular.ttf",
        "/Library/Fonts/NotoSerifTamil-Regular.ttf",
        str(Path.home() / "Library/Fonts/NotoSerifTamil-Regular.ttf"),
        "/usr/share/fonts/truetype/noto/NotoSerifTamil-Regular.ttf",
        "/usr/share/fonts/opentype/noto/NotoSerifTamil-Regular.ttf",
    ]
    for value in candidates:
        if value and Path(value).exists():
            return value
    raise SystemExit(
        "Tamil font not found. Install Noto Serif Tamil and pass --font /path/to/font.ttf"
    )


def scene_filter(font: str, title: str, subtitle: str, duration: int) -> str:
    f = font.replace("\\", "/").replace(":", r"\:").replace("'", r"\'")
    title = escape_drawtext(title)
    subtitle = escape_drawtext(subtitle)
    label = escape_drawtext("காட்சிப்படுத்தலுக்கான கற்பனை மறுவடிவம் · Illustrative reconstruction")
    return ",".join(
        [
            f"drawbox=x=0:y=0:w=iw:h=ih:color={BG}:t=fill",
            f"drawbox=x=110:y=115:w=18:h=850:color={TEAL}:t=fill",
            f"drawbox=x=155:y=170:w=480:h=8:color={BRASS}:t=fill",
            (
                "drawtext="
                f"fontfile='{f}':text='{title}':fontcolor={INK}:fontsize=82:"
                "x=180:y=230:line_spacing=28"
            ),
            (
                "drawtext="
                f"fontfile='{f}':text='{subtitle}':fontcolor={TEAL}:fontsize=48:"
                "x=185:y=470:line_spacing=24"
            ),
            (
                "drawtext="
                f"fontfile='{f}':text='{label}':fontcolor={INK}@0.64:fontsize=24:"
                "x=(w-text_w)/2:y=h-92"
            ),
            "fade=t=in:st=0:d=1",
            f"fade=t=out:st={max(duration - 1, 0)}:d=1",
        ]
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", help="Approved narration audio (wav/m4a/mp3)")
    parser.add_argument("--font", help="Path to a Tamil-capable TTF/OTF font")
    parser.add_argument(
        "--output",
        default="documentary/chapters/v1-ch01/render/v1-ch01-free-proof.mp4",
    )
    parser.add_argument(
        "--subtitles",
        default="documentary/chapters/v1-ch01/subtitles/v1-ch01.ta.srt",
    )
    args = parser.parse_args()

    require("ffmpeg")
    require("ffprobe")
    font = find_font(args.font)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="nenjukku-proof-") as td:
        temp = Path(td)
        segments: list[Path] = []
        for index, (start, end, title, subtitle) in enumerate(SCENES, start=1):
            duration = end - start
            segment = temp / f"scene-{index:02d}.mp4"
            run(
                [
                    "ffmpeg",
                    "-y",
                    "-f",
                    "lavfi",
                    "-i",
                    f"color=c={BG}:s={WIDTH}x{HEIGHT}:r={FPS}:d={duration}",
                    "-vf",
                    scene_filter(font, title, subtitle, duration),
                    "-an",
                    "-c:v",
                    "libx264",
                    "-preset",
                    "medium",
                    "-crf",
                    "18",
                    "-pix_fmt",
                    "yuv420p",
                    str(segment),
                ]
            )
            segments.append(segment)

        concat_file = temp / "concat.txt"
        concat_file.write_text(
            "\n".join(f"file '{path.as_posix()}'" for path in segments), encoding="utf-8"
        )
        base_video = temp / "base.mp4"
        run(
            [
                "ffmpeg",
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_file),
                "-c",
                "copy",
                str(base_video),
            ]
        )

        cmd = ["ffmpeg", "-y", "-i", str(base_video)]
        if args.audio:
            cmd += ["-i", args.audio]
        subtitle_path = Path(args.subtitles)
        filters: list[str] = []
        if subtitle_path.exists():
            escaped = subtitle_path.resolve().as_posix().replace(":", r"\:").replace("'", r"\'")
            filters.append(
                "subtitles='{}':force_style='FontName=Noto Serif Tamil,FontSize=26,"
                "PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=3,Outline=1,"
                "Shadow=0,MarginV=44,Alignment=2'".format(escaped)
            )
        if filters:
            cmd += ["-vf", ",".join(filters)]
        cmd += ["-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p"]
        if args.audio:
            cmd += ["-c:a", "aac", "-b:a", "192k", "-shortest"]
        else:
            cmd += ["-an"]
        cmd += ["-movflags", "+faststart", str(output)]
        run(cmd)

    manifest = output.with_suffix(".json")
    manifest.write_text(
        json.dumps(
            {
                "output": str(output),
                "renderer": "documentary/tools/render_free_proof.py",
                "audio": args.audio,
                "subtitles": args.subtitles if Path(args.subtitles).exists() else None,
                "font": font,
                "runtimeSeconds": SCENES[-1][1],
                "resolution": f"{WIDTH}x{HEIGHT}",
                "fps": FPS,
                "visualPolicy": "original typography and illustrative graphics; no fake archival photos",
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Created: {output}")
    print(f"Manifest: {manifest}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        print(f"Render failed with exit code {exc.returncode}", file=sys.stderr)
        raise SystemExit(exc.returncode)
