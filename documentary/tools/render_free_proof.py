#!/usr/bin/env python3
"""Render a free, image-led proof video for Nenjukku Neethi.

The renderer deliberately avoids FFmpeg drawtext for Tamil. Tamil and subtitle
layers are rasterised by Pango/HarfBuzz into transparent PNG files and then
composited with FFmpeg. This preserves Tamil glyph shaping on macOS and Linux.

Requirements:
  - Python 3.10+
  - ffmpeg and ffprobe on PATH
  - pango-view on PATH
  - Noto Serif Tamil (or another installed Tamil font family)

The bundled Kalaignar portrait is used only for an editorial proof. Confirm its
video-use rights before publishing the result.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

WIDTH, HEIGHT, FPS = 1920, 1080, 25
BG = "#FAF7F1"
INK = "#0F1720"
TEAL = "#0E5D63"
BRASS = "#B98A2F"
DEFAULT_FONT_FAMILY = "Noto Serif Tamil"
DEFAULT_PORTRAIT = "public/images/kalaignar-portrait.png"


@dataclass(frozen=True)
class Scene:
    start: int
    end: int
    title: str
    subtitle: str
    portrait: bool = False


@dataclass(frozen=True)
class SubtitleCue:
    start: float
    end: float
    text: str


SCENES = [
    Scene(0, 16, "நெஞ்சுக்கு நீதி", "பிறந்த ஆண்டு\n1924 · திருக்குவளை", True),
    Scene(
        16,
        66,
        "ஒரு கேள்வியோடு தொடங்கும் சுயசரிதை",
        "வரலாறு பெரியவர்களுக்கு மட்டும் சொந்தமா?",
        True,
    ),
    Scene(66, 88, "1924", "ஒரு காலத்தின் கேள்விக்குறி"),
    Scene(88, 114, "உலகம் மாறிய ஆண்டு", "காந்தி · லெனின் · காலனிய எதிர்ப்புகள்"),
    Scene(114, 140, "தமிழகத்தில் புதிய குரல்கள்", "சுயமரியாதை · சமூக நீதி"),
    Scene(140, 168, "காவிரி", "மைசூர் ↔ சென்னை மாகாணம்"),
    Scene(168, 194, "திருக்குவளை", "திருக்குளம் · சோலை · சிவன் கோயில்"),
    Scene(
        194,
        225,
        "ஒரு மனிதனின் வாழ்க்கை",
        "காலம் · சமூகம் · மொழி · அரசியல்",
        True,
    ),
    Scene(225, 245, "மூலத்தை வாசிக்க", "nenjukkuneethi.org/read/v1-ch01", True),
]


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


def require(binary: str) -> None:
    if shutil.which(binary) is None:
        raise SystemExit(f"Missing required command: {binary}")


def font_family_from_legacy_arg(value: str | None) -> str | None:
    """Accept the old --font path argument without sending a path to Pango."""
    if not value:
        return None
    path = Path(value)
    if path.exists():
        compact = path.stem.replace("-", " ").replace("[wdth,wght]", "")
        if "NotoSerifTamil" in compact.replace(" ", ""):
            return DEFAULT_FONT_FAMILY
        return compact
    return value


def render_text(
    output: Path,
    text: str,
    *,
    font_family: str,
    size: int,
    color: str,
    width: int,
    background: str = "transparent",
    margin: str = "0",
) -> None:
    """Shape Tamil with Pango/HarfBuzz and write a transparent PNG."""
    markup = f'<span foreground="{color}">{html.escape(text)}</span>'
    run(
        [
            "pango-view",
            "--no-display",
            "--markup",
            "--pixels",
            f"--font={font_family} {size}",
            f"--width={width}",
            "--wrap=word-char",
            f"--background={background}",
            f"--margin={margin}",
            f"--text={markup}",
            f"--output={output}",
        ]
    )
    if not output.exists() or output.stat().st_size == 0:
        raise SystemExit(f"Pango did not create a usable image: {output}")


def render_scene_text(
    temp: Path,
    index: int,
    scene: Scene,
    font_family: str,
) -> tuple[Path, Path, Path]:
    max_width = 760 if scene.portrait else 1500
    title = temp / f"scene-{index:02d}-title.png"
    subtitle = temp / f"scene-{index:02d}-subtitle.png"
    label = temp / f"scene-{index:02d}-label.png"
    render_text(
        title,
        scene.title,
        font_family=font_family,
        size=82 if len(scene.title) < 24 else 62,
        color=INK,
        width=max_width,
    )
    render_text(
        subtitle,
        scene.subtitle,
        font_family=font_family,
        size=48,
        color=TEAL,
        width=max_width,
    )
    render_text(
        label,
        "காட்சிப்படுத்தலுக்கான மறுவடிவம் · Illustrative reconstruction",
        font_family=font_family,
        size=24,
        color="#475569",
        width=1450,
    )
    return title, subtitle, label


def make_scene(
    output: Path,
    scene: Scene,
    *,
    title_png: Path,
    subtitle_png: Path,
    label_png: Path,
    portrait_path: Path | None,
) -> None:
    duration = scene.end - scene.start
    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "lavfi",
        "-i",
        f"color=c={BG}:s={WIDTH}x{HEIGHT}:r={FPS}:d={duration}",
    ]
    portrait_index: int | None = None
    if scene.portrait and portrait_path:
        portrait_index = 1
        cmd += ["-loop", "1", "-framerate", str(FPS), "-i", str(portrait_path)]
    title_index = 1 if portrait_index is None else 2
    subtitle_index = title_index + 1
    label_index = subtitle_index + 1
    for path in (title_png, subtitle_png, label_png):
        cmd += ["-loop", "1", "-framerate", str(FPS), "-i", str(path)]

    filters: list[str] = []
    if portrait_index is not None:
        filters += [
            (
                f"[{portrait_index}:v]"
                "scale=900:1080:force_original_aspect_ratio=increase,"
                "crop=900:1080,"
                "eq=saturation=0.82:contrast=1.04,"
                "format=rgba[portrait]"
            ),
            "[0:v][portrait]overlay=x=1020:y=0:shortest=1[withportrait]",
            (
                f"[withportrait]"
                f"drawbox=x=0:y=0:w=1020:h=1080:color={BG}:t=fill,"
                f"drawbox=x=110:y=115:w=18:h=850:color={TEAL}:t=fill,"
                f"drawbox=x=155:y=170:w=480:h=8:color={BRASS}:t=fill,"
                "drawbox=x=1000:y=0:w=20:h=1080:color=#0F1720@0.18:t=fill[base]"
            ),
        ]
    else:
        filters += [
            (
                f"[0:v]"
                f"drawbox=x=0:y=0:w=iw:h=ih:color={BG}:t=fill,"
                f"drawbox=x=110:y=115:w=18:h=850:color={TEAL}:t=fill,"
                f"drawbox=x=155:y=170:w=480:h=8:color={BRASS}:t=fill,"
                "drawbox=x=1240:y=115:w=520:h=18:color=#0E5D63@0.18:t=fill,"
                "drawbox=x=1390:y=175:w=370:h=12:color=#B98A2F@0.25:t=fill[base]"
            )
        ]

    filters += [
        f"[base][{title_index}:v]overlay=x=180:y=230:shortest=1[v1]",
        f"[v1][{subtitle_index}:v]overlay=x=185:y=470:shortest=1[v2]",
        (
            f"[v2][{label_index}:v]"
            "overlay=x=(main_w-overlay_w)/2:y=main_h-overlay_h-60:shortest=1,"
            "fade=t=in:st=0:d=1,"
            f"fade=t=out:st={max(duration - 1, 0)}:d=1,"
            "format=yuv420p[vout]"
        ),
    ]

    cmd += [
        "-filter_complex",
        ";".join(filters),
        "-map",
        "[vout]",
        "-t",
        str(duration),
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        str(output),
    ]
    run(cmd)


def srt_time(value: str) -> float:
    hours, minutes, rest = value.strip().replace(".", ",").split(":")
    seconds, millis = rest.split(",")
    return int(hours) * 3600 + int(minutes) * 60 + int(seconds) + int(millis) / 1000


def parse_srt(path: Path) -> list[SubtitleCue]:
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8-sig")
    cues: list[SubtitleCue] = []
    for block in re.split(r"\n\s*\n", text.strip()):
        lines = [line.rstrip() for line in block.splitlines() if line.strip()]
        time_line_index = next((i for i, line in enumerate(lines) if "-->" in line), None)
        if time_line_index is None:
            continue
        start_text, end_text = lines[time_line_index].split("-->", 1)
        cue_text = "\n".join(lines[time_line_index + 1 :])
        cue_text = re.sub(r"<[^>]+>", "", cue_text).strip()
        if cue_text:
            cues.append(SubtitleCue(srt_time(start_text), srt_time(end_text), cue_text))
    return cues


def render_subtitle_layers(
    temp: Path,
    cues: list[SubtitleCue],
    font_family: str,
) -> list[tuple[SubtitleCue, Path]]:
    layers: list[tuple[SubtitleCue, Path]] = []
    for index, cue in enumerate(cues, start=1):
        output = temp / f"subtitle-{index:03d}.png"
        render_text(
            output,
            cue.text,
            font_family=font_family,
            size=40,
            color="#FFFFFF",
            width=1520,
            background="#0F1720D9",
            margin="18 30",
        )
        layers.append((cue, output))
    return layers


def burn_subtitle_pngs(
    base_video: Path,
    output: Path,
    subtitle_layers: list[tuple[SubtitleCue, Path]],
    *,
    audio: str | None,
    runtime: int,
) -> None:
    cmd = ["ffmpeg", "-y", "-i", str(base_video)]
    if audio:
        cmd += ["-i", audio]
    first_subtitle_input = 2 if audio else 1
    for _, path in subtitle_layers:
        cmd += ["-loop", "1", "-framerate", str(FPS), "-i", str(path)]

    if subtitle_layers:
        filters: list[str] = []
        previous = "[0:v]"
        for offset, (cue, _) in enumerate(subtitle_layers):
            input_index = first_subtitle_input + offset
            output_label = f"[sub{offset}]"
            filters.append(
                f"{previous}[{input_index}:v]"
                "overlay=x=(main_w-overlay_w)/2:y=main_h-overlay_h-42:"
                f"enable='between(t,{cue.start:.3f},{cue.end:.3f})'{output_label}"
            )
            previous = output_label
        filters.append(f"{previous}format=yuv420p[vout]")
        cmd += ["-filter_complex", ";".join(filters), "-map", "[vout]"]
    else:
        cmd += ["-map", "0:v:0"]

    if audio:
        cmd += ["-map", "1:a:0", "-c:a", "aac", "-b:a", "192k"]
    else:
        cmd += ["-an"]

    cmd += [
        "-t",
        str(runtime),
        "-c:v",
        "libx264",
        "-crf",
        "18",
        "-preset",
        "medium",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(output),
    ]
    run(cmd)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", help="Approved narration audio (wav/m4a/mp3)")
    parser.add_argument(
        "--font-family",
        help=f"Installed Pango font family (default: {DEFAULT_FONT_FAMILY})",
    )
    parser.add_argument(
        "--font",
        help="Backward-compatible alias: a font path or installed font family",
    )
    parser.add_argument(
        "--portrait",
        default=DEFAULT_PORTRAIT,
        help="Kalaignar portrait/image used in image-led scenes",
    )
    parser.add_argument(
        "--no-portrait",
        action="store_true",
        help="Render typography-only scenes without the portrait",
    )
    parser.add_argument(
        "--no-subtitles",
        action="store_true",
        help="Do not burn the Tamil subtitle track",
    )
    parser.add_argument(
        "--output",
        default="documentary/chapters/v1-ch01/render/v1-ch01-free-proof.mp4",
    )
    parser.add_argument(
        "--subtitles",
        default="documentary/chapters/v1-ch01/subtitles/v1-ch01.ta.srt",
    )
    args = parser.parse_args()

    for binary in ("ffmpeg", "ffprobe", "pango-view"):
        require(binary)

    legacy_family = font_family_from_legacy_arg(args.font)
    font_family = args.font_family or legacy_family or DEFAULT_FONT_FAMILY
    portrait_path = None if args.no_portrait else Path(args.portrait)
    if portrait_path and not portrait_path.exists():
        raise SystemExit(
            f"Portrait not found: {portrait_path}\n"
            "Pass --portrait /path/to/image.png or use --no-portrait."
        )

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    runtime = SCENES[-1].end

    with tempfile.TemporaryDirectory(prefix="nenjukku-proof-v2-") as td:
        temp = Path(td)

        # Fail early with a small Tamil shaping test.
        render_text(
            temp / "tamil-shaping-test.png",
            "கலைஞர் · நெஞ்சுக்கு நீதி · பிறந்த ஆண்டு",
            font_family=font_family,
            size=52,
            color=INK,
            width=1400,
        )

        segments: list[Path] = []
        for index, scene in enumerate(SCENES, start=1):
            title_png, subtitle_png, label_png = render_scene_text(
                temp, index, scene, font_family
            )
            segment = temp / f"scene-{index:02d}.mp4"
            make_scene(
                segment,
                scene,
                title_png=title_png,
                subtitle_png=subtitle_png,
                label_png=label_png,
                portrait_path=portrait_path,
            )
            segments.append(segment)

        concat_file = temp / "concat.txt"
        concat_file.write_text(
            "\n".join(f"file '{path.as_posix()}'" for path in segments),
            encoding="utf-8",
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

        cues = [] if args.no_subtitles else parse_srt(Path(args.subtitles))
        subtitle_layers = render_subtitle_layers(temp, cues, font_family)
        burn_subtitle_pngs(
            base_video,
            output,
            subtitle_layers,
            audio=args.audio,
            runtime=runtime,
        )

    manifest = output.with_suffix(".json")
    manifest.write_text(
        json.dumps(
            {
                "output": str(output),
                "renderer": "documentary/tools/render_free_proof.py",
                "rendererVersion": 2,
                "textRenderer": "Pango/HarfBuzz PNG layers; FFmpeg drawtext not used",
                "audio": args.audio,
                "subtitles": None if args.no_subtitles else args.subtitles,
                "fontFamily": font_family,
                "portrait": str(portrait_path) if portrait_path else None,
                "runtimeSeconds": runtime,
                "resolution": f"{WIDTH}x{HEIGHT}",
                "fps": FPS,
                "visualPolicy": (
                    "image-led editorial proof using the repository portrait plus "
                    "original typography/graphics; no fabricated archival photograph"
                ),
                "rightsWarning": (
                    "Confirm portrait and all other asset rights before public release."
                ),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Created: {output}")
    print(f"Manifest: {manifest}")
    print("Tamil text was rendered through Pango/HarfBuzz, not FFmpeg drawtext.")
    if portrait_path:
        print(f"Portrait used: {portrait_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        print(f"Render failed with exit code {exc.returncode}", file=sys.stderr)
        raise SystemExit(exc.returncode)
