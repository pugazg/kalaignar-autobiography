#!/usr/bin/env python3
"""
Mixed Tamil/English OCR extractor for Murasoli scanned pages.

This is a replacement direction for the first extractor:
- use Tesseract CLI directly, so pytesseract is not required
- default to tam+eng instead of tam-only
- avoid destructive thresholding by default
- use TSV output to rebuild cleaner lines
- discard separator/border hallucinations before JSON is written
- keep original page JSON shape: one file per page with a paragraphs array
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import shutil
import subprocess
import tempfile
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageFilter, ImageOps

Image.MAX_IMAGE_PIXELS = None

TAMIL_RE = re.compile(r"[\u0B80-\u0BFF]+")
LATIN_RE = re.compile(r"[A-Za-z]+")
DIGIT_RE = re.compile(r"\d+")
TSV_LEAK_RE = re.compile(r"\b[1-5]\s+1\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+")
EMAIL_RE = re.compile(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}")

JUNK_TAMIL_TOKENS = {
    "க",
    "கக",
    "ககக",
    "கை",
    "கைக",
    "கைகை",
    "சைகை",
    "ணை",
    "னை",
    "வனை",
    "டட",
    "எ",
}

STANDALONE_JUNK_TAMIL_TOKENS = {
    "கக",
    "ககக",
    "கைக",
    "கைகை",
    "சைகை",
    "ணை",
    "னை",
    "வனை",
    "டட",
}


def normalize_text(text: str) -> str:
    return unicodedata.normalize("NFC", text or "")


def run_command(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, text=True, capture_output=True, check=True)


def get_pdf_page_count(pdf: Path) -> int:
    result = run_command(["pdfinfo", str(pdf)])
    for line in result.stdout.splitlines():
        if line.startswith("Pages:"):
            return int(line.split(":", 1)[1].strip())
    raise RuntimeError(f"could not read page count from {pdf}")


def render_pdf_page(pdf: Path, page: int, dpi: int, temp_dir: Path) -> Path:
    prefix = temp_dir / f"page-{page:04d}"
    run_command(
        [
            "pdftoppm",
            "-r",
            str(dpi),
            "-f",
            str(page),
            "-l",
            str(page),
            "-singlefile",
            "-png",
            str(pdf),
            str(prefix),
        ]
    )
    out = prefix.with_suffix(".png")
    if not out.exists():
        raise RuntimeError(f"pdftoppm did not create {out}")
    return out


def preprocess_image(input_path: Path, output_path: Path, mode: str) -> Path:
    img = Image.open(input_path)
    img = ImageOps.exif_transpose(img)
    img = img.convert("L")

    if mode in {"mild", "threshold"}:
        img = ImageOps.autocontrast(img)
        img = img.filter(ImageFilter.MedianFilter(3))

    if mode == "threshold":
        img = img.point(lambda p: 255 if p > 170 else 0)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path)
    return output_path


def page_type(page: int) -> str:
    if page == 1:
        return "cover"
    if page <= 4:
        return "frontmatter"
    return "body"


def psm_for_page(page: int, override: int | None) -> int:
    if override is not None:
        return override
    if page_type(page) == "cover":
        return 11
    return 4


def tesseract_tsv(image: Path, lang: str, psm: int) -> list[dict[str, str]]:
    result = run_command(
        [
            "tesseract",
            str(image),
            "stdout",
            "-l",
            lang,
            "--oem",
            "1",
            "--psm",
            str(psm),
            "tsv",
        ]
    )
    return list(csv.DictReader(result.stdout.splitlines(), delimiter="\t"))


def safe_float(value: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return -1.0


def safe_int(value: str) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def group_tsv_lines(rows: list[dict[str, str]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[int, int, int], list[dict[str, str]]] = {}

    for row in rows:
        if row.get("level") != "5":
            continue
        text = normalize_text((row.get("text") or "").strip())
        if not text:
            continue
        if should_drop_word(text, safe_float(row.get("conf", ""))):
            continue

        key = (
            safe_int(row.get("block_num", "")),
            safe_int(row.get("par_num", "")),
            safe_int(row.get("line_num", "")),
        )
        grouped.setdefault(key, []).append(row)

    lines: list[dict[str, Any]] = []
    for key, words in grouped.items():
        words = sorted(words, key=lambda r: safe_int(r.get("left", "")))
        tokens = [normalize_text((w.get("text") or "").strip()) for w in words]
        tokens = [token for token in tokens if token]
        confs = [safe_float(w.get("conf", "")) for w in words if safe_float(w.get("conf", "")) >= 0]
        left = min(safe_int(w.get("left", "")) for w in words)
        top = min(safe_int(w.get("top", "")) for w in words)
        right = max(safe_int(w.get("left", "")) + safe_int(w.get("width", "")) for w in words)
        bottom = max(safe_int(w.get("top", "")) + safe_int(w.get("height", "")) for w in words)

        text = normalize_text(" ".join(tokens))
        lines.append(
            {
                "key": key,
                "text": text,
                "tokens": tokens,
                "mean_conf": sum(confs) / len(confs) if confs else 0.0,
                "low_conf_words": sum(1 for conf in confs if conf < 40),
                "bbox": [left, top, right - left, bottom - top],
            }
        )

    return sorted(lines, key=lambda item: (item["bbox"][1], item["bbox"][0]))


def should_drop_word(text: str, confidence: float) -> bool:
    compact = re.sub(r"\s+", "", text)
    if not compact:
        return True
    if TSV_LEAK_RE.search(text):
        return True
    if confidence >= 45:
        if compact in STANDALONE_JUNK_TAMIL_TOKENS and confidence < 85:
            return True
        return False

    tamil_parts = TAMIL_RE.findall(compact)
    latin_parts = LATIN_RE.findall(compact)
    has_digit = bool(DIGIT_RE.search(compact))

    if compact in {"-", "—", "_", "=", "|", "]", "[", "}", "{"}:
        return True
    if all(ch in "-—_=|:.;·Ee[]" for ch in compact):
        return True
    if tamil_parts and all(part in JUNK_TAMIL_TOKENS for part in tamil_parts) and not has_digit:
        return True
    if latin_parts and not tamil_parts and not has_digit:
        letters = "".join(latin_parts)
        if len(letters) <= 2:
            return True
        if letters.lower() in {"eee", "eeee", "ss"}:
            return True

    return False


def char_counts(text: str) -> dict[str, int]:
    compact = "".join(ch for ch in text if not ch.isspace())
    return {
        "total": len(compact),
        "tamil": len(TAMIL_RE.findall(text)),
        "latin": len(LATIN_RE.findall(text)),
        "digits": len(DIGIT_RE.findall(text)),
        "punct": sum(
            1
            for ch in compact
            if not ch.isalnum() and not ("\u0B80" <= ch <= "\u0BFF")
        ),
    }


def is_rule_like(text: str) -> bool:
    compact = re.sub(r"\s+", "", text)
    if not compact:
        return True
    rule_chars = sum(1 for ch in compact if ch in "-—_=|:.;·Ee")
    if rule_chars / len(compact) > 0.75:
        return True
    if re.fullmatch(r"[-—_=|.·:;Ee]+", compact):
        return True
    return False


def tamil_junk_score(tokens: list[str]) -> int:
    score = 0
    for token in tokens:
        tamil_parts = TAMIL_RE.findall(token)
        for part in tamil_parts:
            if part in JUNK_TAMIL_TOKENS:
                score += 1
            if re.fullmatch(r"(கை|க|சை|ணை|னை|ட)+", part) and len(part) >= 3:
                score += 2
    return score


def should_discard_line(line: dict[str, Any]) -> tuple[bool, str]:
    text = line["text"]
    tokens = line["tokens"]
    counts = char_counts(text)
    total = max(counts["total"], 1)
    junk_score = tamil_junk_score(tokens)
    tamil_chars = sum(1 for ch in text if "\u0B80" <= ch <= "\u0BFF")
    compact = re.sub(r"\s+", "", text)

    if TSV_LEAK_RE.search(text):
        return True, "tsv_leakage"

    if is_rule_like(text):
        return True, "rule_or_separator"

    if len(compact) <= 6 and counts["latin"] == 0 and tamil_chars <= 2:
        return True, "short_fragment_line"

    has_email = bool(EMAIL_RE.search(text))
    mostly_numeric = counts["digits"] >= 8 and counts["digits"] >= (counts["tamil"] + counts["latin"])

    if line["mean_conf"] < 35 and not has_email and not mostly_numeric:
        return True, "low_confidence_line"

    if line["mean_conf"] < 20 and counts["latin"] == 0 and counts["digits"] == 0:
        return True, "very_low_confidence_non_alnum"

    if junk_score >= 4 and line["mean_conf"] < 55:
        return True, "tamil_border_hallucination"

    if junk_score >= 3 and counts["tamil"] / total > 0.65 and counts["digits"] == 0:
        return True, "repeated_tamil_fragments"

    if counts["punct"] / total > 0.70 and line["mean_conf"] < 60:
        return True, "punctuation_noise"

    return False, ""


def clean_text_line(text: str) -> str:
    text = normalize_text(text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    return text.strip()


def build_paragraphs(lines: list[dict[str, Any]]) -> list[str]:
    paragraphs: list[str] = []
    current: list[str] = []
    previous: dict[str, Any] | None = None

    for line in lines:
        text = clean_text_line(line["text"])
        if not text:
            continue

        new_para = False
        if previous is not None:
            prev_top = previous["bbox"][1]
            prev_height = max(previous["bbox"][3], 1)
            gap = line["bbox"][1] - (prev_top + prev_height)
            block_changed = line["key"][:2] != previous["key"][:2]
            if block_changed or gap > prev_height * 0.85:
                new_para = True

        if new_para and current:
            paragraphs.append("\n".join(current))
            current = []

        current.append(text)
        previous = line

    if current:
        paragraphs.append("\n".join(current))

    seen: set[str] = set()
    unique: list[str] = []
    for para in paragraphs:
        key = re.sub(r"\s+", " ", para).strip()
        if key and key not in seen:
            seen.add(key)
            unique.append(para)

    return unique


def signal_char_count(text: str) -> int:
    return sum(
        1
        for ch in text
        if ch.isalnum() or ("\u0B80" <= ch <= "\u0BFF")
    )


def classify_ocr_status(
    paragraphs: list[str],
    kept_lines: list[dict[str, Any]],
    discarded: list[dict[str, Any]],
) -> str:
    text = "\n".join(paragraphs)
    signal_chars = signal_char_count(text)

    if not kept_lines and not discarded:
        return "no_text"
    if signal_chars < 20 and (len(kept_lines) <= 2 or discarded):
        return "low_text_or_image"
    return "ok"


def extract_page(
    image_path: Path,
    page: int,
    lang: str,
    psm: int,
) -> tuple[list[str], list[dict[str, Any]], list[dict[str, Any]]]:
    rows = tesseract_tsv(image_path, lang, psm)
    lines = group_tsv_lines(rows)
    kept: list[dict[str, Any]] = []
    discarded: list[dict[str, Any]] = []

    for line in lines:
        discard, reason = should_discard_line(line)
        record = {
            "text": line["text"],
            "meanConfidence": round(line["mean_conf"], 2),
            "bbox": line["bbox"],
            "reason": reason,
        }
        if discard:
            discarded.append(record)
        else:
            kept.append(line)

    return build_paragraphs(kept), kept, discarded


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def process_one_page(
    source_path: Path,
    page_image: Path,
    output_dir: Path,
    collection: str,
    volume: int,
    page: int,
    dpi: int,
    lang: str,
    psm: int,
    preprocess: str,
    debug_dir: Path | None,
) -> dict[str, Any]:
    pid = f"m{volume}-p{page:04d}"

    if page == 1:
        rec = {
            "id": pid,
            "collection": collection,
            "volume": volume,
            "page": page,
            "pageType": "cover",
            "ocrStatus": "skipped_cover",
            "paragraphs": [],
            "ocrLines": [],
            "textCandidates": [],
            "discardedOcrLines": [],
            "engine": None,
            "source": {"file": source_path.name, "page": page},
        }
        write_json(output_dir / f"{pid}.json", rec)
        return {
            "id": pid,
            "page": page,
            "ocrStatus": "skipped_cover",
            "paragraphs": 0,
            "keptLines": 0,
            "textCandidates": 0,
            "discardedLines": 0,
        }

    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        preprocessed = tmp_dir / f"{pid}-preprocessed.png"
        preprocess_image(page_image, preprocessed, preprocess)

        if debug_dir:
            debug_dir.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(preprocessed, debug_dir / f"{pid}-preprocessed.png")

        paragraphs, kept_lines, discarded = extract_page(preprocessed, page, lang, psm)

    ocr_status = classify_ocr_status(paragraphs, kept_lines, discarded)
    text_candidates = [
        {
            "text": clean_text_line(line["text"]),
            "meanConfidence": round(line["mean_conf"], 2),
            "bbox": line["bbox"],
        }
        for line in kept_lines
    ]
    paragraphs_for_json = [] if ocr_status in {"low_text_or_image", "no_text"} else paragraphs
    ocr_lines_for_json = [] if ocr_status in {"low_text_or_image", "no_text"} else text_candidates

    rec = {
        "id": pid,
        "collection": collection,
        "volume": volume,
        "page": page,
        "pageType": page_type(page),
        "ocrStatus": ocr_status,
        "paragraphs": paragraphs_for_json,
        "ocrLines": ocr_lines_for_json,
        "textCandidates": text_candidates if ocr_status in {"low_text_or_image", "no_text"} else [],
        "discardedOcrLines": discarded,
        "engine": {
            "name": "tesseract-cli",
            "version": run_command(["tesseract", "--version"]).stdout.splitlines()[0],
            "language": lang,
            "oem": 1,
            "psm": psm,
            "dpi": dpi,
            "preprocess": preprocess,
            "mode": "tsv_line_filter",
        },
        "source": {"file": source_path.name, "page": page},
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    write_json(output_dir / f"{pid}.json", rec)
    return {
        "id": pid,
        "page": page,
        "ocrStatus": ocr_status,
        "paragraphs": len(paragraphs_for_json),
        "keptLines": len(ocr_lines_for_json),
        "textCandidates": len(text_candidates),
        "discardedLines": len(discarded),
    }


def is_pdf(path: Path) -> bool:
    return path.suffix.lower() == ".pdf"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("source", type=Path, help="PDF or single page image")
    ap.add_argument("--collection", default="murasoli")
    ap.add_argument("--volume", required=True, type=int)
    ap.add_argument("--page", type=int, default=0, help="Page number for a single image source")
    ap.add_argument("--first", type=int, default=1)
    ap.add_argument("--last", type=int, default=0)
    ap.add_argument("--dpi", type=int, default=400)
    ap.add_argument("--lang", default="tam+eng")
    ap.add_argument("--psm", type=int, default=0, help="Override Tesseract PSM")
    ap.add_argument("--preprocess", choices=["none", "mild", "threshold"], default="none")
    ap.add_argument("--output-dir", type=Path, default=Path("public/data/murasoli/text"))
    ap.add_argument("--debug-dir", type=Path, default=None)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    if not args.source.exists():
        raise FileNotFoundError(args.source)
    if not shutil.which("tesseract"):
        raise RuntimeError("tesseract command not found")
    if is_pdf(args.source) and not shutil.which("pdftoppm"):
        raise RuntimeError("pdftoppm command not found")

    pages: list[int]
    temp_root = tempfile.TemporaryDirectory()
    temp_dir = Path(temp_root.name)

    try:
        if is_pdf(args.source):
            total = get_pdf_page_count(args.source)
            last = args.last or total
            pages = list(range(args.first, last + 1))
        else:
            page = args.page or args.first
            pages = [page]

        summaries: list[dict[str, Any]] = []
        for page in pages:
            pid = f"m{args.volume}-p{page:04d}"
            outfile = args.output_dir / f"{pid}.json"
            if outfile.exists() and not args.force:
                print(f"page {page} already exists, skipping")
                continue

            if is_pdf(args.source):
                page_image = render_pdf_page(args.source, page, args.dpi, temp_dir)
            else:
                page_image = args.source

            psm = psm_for_page(page, args.psm or None)
            summary = process_one_page(
                args.source,
                page_image,
                args.output_dir,
                args.collection,
                args.volume,
                page,
                args.dpi,
                args.lang,
                psm,
                args.preprocess,
                args.debug_dir,
            )
            summaries.append(summary)
            print(
                f"page {page}: {summary.get('paragraphs', 0)} paragraphs, "
                f"{summary.get('discardedLines', 0)} discarded lines"
            )

        index = {
            "collection": args.collection,
            "volume": args.volume,
            "pageCount": len(summaries),
            "pages": summaries,
            "engine": "ocr_extract_v2",
        }
        index_path = args.output_dir.parent / f"volume{args.volume}.index.json"
        write_json(index_path, index)
    finally:
        temp_root.cleanup()


if __name__ == "__main__":
    main()
