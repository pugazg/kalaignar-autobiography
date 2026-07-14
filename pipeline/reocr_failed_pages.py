#!/usr/bin/env python3
"""
reocr_failed_pages.py — stage 1.5: re-OCR pages the first pass failed on.

WHY: correction and dictionary stages can only fix text that EXISTS. Some pages
come out of stage 1 nearly empty (V54 p311: a full text page reduced to one
line in textCandidates) or partially read. The only remedy is re-OCR with
different parameters. This script:

  1. FINDS suspect pages:
       - ocrStatus low_text_or_image / no_text, or empty paragraphs
       - body pages whose Tamil character count is far below the volume median
       - anything passed explicitly with --pages
  2. RE-RENDERS each from the source PDF (pdftoppm, 400 dpi),
  3. RUNS tesseract (tam+eng) across several page-segmentation modes
     (--psm 4, 3, 6, 11 by default — the first pass used 4 only),
  4. SCORES each result: Tamil characters weighted by mean word confidence,
  5. KEEPS the best output ONLY if it beats the existing text by --min-gain
     (default 1.3x), writing the page JSON in place with the original backed
     up to <id>.orig.json and full engine metadata recorded,
  6. LOGS everything to <src>/reocr_report.csv.

Requires locally: pdftoppm (poppler), tesseract with `tam` traineddata.

Usage (from the volume's working folder):
  python3 pipeline/reocr_failed_pages.py \
      --pdf vol54.pdf --src 01_ocr_v2_full --volume 54           # auto-detect
  python3 pipeline/reocr_failed_pages.py \
      --pdf vol54.pdf --src 01_ocr_v2_full --volume 54 --pages 311,345,346
  # then re-run apply_corrections_v4.py and the builders as usual.

Every kept page still flows through correction (normalization, ortho, glyph),
so don't hand-fix OCR output here — let the pipeline do it.
"""
import argparse, csv, glob, json, os, re, shutil, statistics, subprocess, sys, tempfile
from datetime import datetime, timezone

# Tesseract's TSV can contain stray '"' characters in recognized text; with the
# default quoting the csv module swallows everything after one into a single
# giant field and dies at the 128 KB limit. QUOTE_NONE + a raised limit fix it.
csv.field_size_limit(10**8)

TAMIL = re.compile(r"[஀-௿]")

def tamil_chars(s):
    return len(TAMIL.findall(s))

def page_text(d):
    paras = [p for p in d.get("paragraphs", []) if isinstance(p, str)]
    if paras:
        return "\n".join(paras)
    lines = [l.get("text", "") for l in d.get("ocrLines", []) if isinstance(l, dict)]
    if lines:
        return "\n".join(lines)
    return "\n".join(c.get("text", "") for c in d.get("textCandidates", [])
                     if isinstance(c, dict))

def detect_suspects(files, ratio):
    """Pages whose Tamil char count is < ratio * median of body pages."""
    counts = {}
    metas = {}
    for fn in files:
        d = json.load(open(fn, encoding="utf-8"))
        counts[fn] = tamil_chars(page_text(d))
        metas[fn] = d
    body_counts = [c for fn, c in counts.items()
                   if metas[fn].get("pageType") == "body" and c > 0]
    median = statistics.median(body_counts) if body_counts else 0
    suspects = []
    for fn, c in counts.items():
        d = metas[fn]
        status = d.get("ocrStatus", "ok")
        reason = None
        if status in ("low_text_or_image", "no_text") or c == 0:
            reason = f"status={status},chars={c}"
        elif d.get("pageType") == "body" and median and c < ratio * median:
            reason = f"short_body:{c}<{ratio:.0%}~median({int(median)})"
        if reason:
            suspects.append((fn, d, reason))
    return suspects, median

def run_tesseract(png, lang, psm, dpi):
    """Returns (text, mean_confidence) using TSV output."""
    r = subprocess.run(
        ["tesseract", png, "stdout", "-l", lang, "--oem", "1",
         "--psm", str(psm), "--dpi", str(dpi), "tsv"],
        capture_output=True, text=True)
    if r.returncode != 0:
        return "", 0.0
    words, confs = [], []
    lines = {}
    for row in csv.DictReader(r.stdout.splitlines(), delimiter="\t",
                              quoting=csv.QUOTE_NONE):
        try:
            conf = float(row.get("conf", -1))
        except ValueError:
            continue
        txt = (row.get("text") or "").strip()
        if conf < 0 or not txt:
            continue
        key = (row.get("block_num"), row.get("par_num"), row.get("line_num"))
        lines.setdefault(key, []).append(txt)
        confs.append(conf)
    text = "\n".join(" ".join(ws) for ws in lines.values())
    mean_conf = sum(confs) / len(confs) if confs else 0.0
    return text, mean_conf

def score(text, conf):
    """Tamil volume weighted by confidence; junk-heavy outputs score low."""
    t = tamil_chars(text)
    return t * (max(conf, 1.0) / 100.0)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True, help="source scan (e.g. vol54.pdf)")
    ap.add_argument("--src", required=True, help="stage-01 folder (contains text/)")
    ap.add_argument("--volume", type=int, required=True)
    ap.add_argument("--pages", default="",
                    help="comma-separated page numbers to force (else auto-detect)")
    ap.add_argument("--lang", default="tam+eng")
    ap.add_argument("--dpi", type=int, default=400)
    ap.add_argument("--psms", default="4,3,6,11")
    ap.add_argument("--short-ratio", type=float, default=0.35,
                    help="body pages under this fraction of the median are suspect")
    ap.add_argument("--min-gain", type=float, default=1.3,
                    help="new text must beat the old score by this factor to be kept")
    ap.add_argument("--min-conf", type=float, default=60.0,
                    help="never keep output below this mean confidence. V54 showed "
                         "a clean separation: real text re-OCRs at conf 84-94, while "
                         "covers/images/bleed-through ghost pages 'read' as thousands "
                         "of Tamil chars at conf 32-45 — pure hallucinated junk. An "
                         "empty page must stay empty rather than gain junk text.")
    ap.add_argument("--dry-run", action="store_true", help="report, change nothing")
    args = ap.parse_args()

    for tool in ("pdftoppm", "tesseract"):
        if shutil.which(tool) is None:
            sys.exit(f"'{tool}' not found on PATH — install poppler/tesseract first.")
    langs = subprocess.run(["tesseract", "--list-langs"],
                           capture_output=True, text=True).stdout
    if "tam" not in langs:
        sys.exit("tesseract has no 'tam' traineddata — install tesseract-lang / tessdata.")

    src_text = os.path.join(args.src, "text")
    files = sorted(glob.glob(f"{src_text}/m{args.volume}-p*.json"))
    if not files:
        sys.exit(f"No pages in {src_text}")

    if args.pages.strip():
        wanted = {int(p) for p in args.pages.split(",")}
        suspects = []
        for fn in files:
            d = json.load(open(fn, encoding="utf-8"))
            if d.get("page") in wanted:
                suspects.append((fn, d, "explicit"))
        median = None
    else:
        suspects, median = detect_suspects(files, args.short_ratio)

    print(f"suspect pages: {len(suspects)}"
          + (f" (volume body-median {int(median)} Tamil chars)" if median else ""))
    report = []
    psms = [int(p) for p in args.psms.split(",")]

    with tempfile.TemporaryDirectory() as tmp:
        for fn, d, reason in suspects:
            page_no = d["page"]
            old_text = page_text(d)
            old_score = score(old_text, 70.0)  # assume decent conf for existing text
            png_base = os.path.join(tmp, f"p{page_no}")
            r = subprocess.run(["pdftoppm", "-f", str(page_no), "-l", str(page_no),
                                "-r", str(args.dpi), "-png", args.pdf, png_base],
                               capture_output=True)
            pngs = glob.glob(png_base + "*.png")
            if r.returncode != 0 or not pngs:
                report.append({"id": d["id"], "page": page_no, "reason": reason,
                               "outcome": "render_failed", "psm": "", "oldChars": tamil_chars(old_text),
                               "newChars": "", "conf": ""})
                continue
            best = None
            for psm in psms:
                text, conf = run_tesseract(pngs[0], args.lang, psm, args.dpi)
                sc = score(text, conf)
                if best is None or sc > best[0]:
                    best = (sc, psm, text, conf)
            sc, psm, text, conf = best
            kept = (conf >= args.min_conf
                    and sc > old_score * args.min_gain
                    and tamil_chars(text) > tamil_chars(old_text))
            outcome = "kept" if kept else (
                "low_conf_junk" if conf < args.min_conf else "no_improvement")
            if kept and not args.dry_run:
                shutil.copyfile(fn, fn.replace(".json", ".orig.json"))
                d["paragraphs"] = [p for p in text.split("\n") if p.strip()]
                d["ocrStatus"] = "reocr"
                # pages that failed OCR can carry "engine": null — treat as empty
                d["engine"] = {**(d.get("engine") or {}),
                               "reocr": {"psm": psm, "lang": args.lang,
                                         "dpi": args.dpi, "meanConfidence": round(conf, 2),
                                         "at": datetime.now(timezone.utc).isoformat()}}
                json.dump(d, open(fn, "w", encoding="utf-8"), ensure_ascii=False)
            report.append({"id": d["id"], "page": page_no, "reason": reason,
                           "outcome": outcome, "psm": psm,
                           "oldChars": tamil_chars(old_text),
                           "newChars": tamil_chars(text), "conf": round(conf, 1)})
            print(f"  p{page_no}: {outcome} (psm {psm}, "
                  f"{tamil_chars(old_text)} → {tamil_chars(text)} Tamil chars, conf {conf:.0f})")

    with open(os.path.join(args.src, "reocr_report.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["id", "page", "reason", "outcome", "psm",
                                          "oldChars", "newChars", "conf"])
        w.writeheader(); w.writerows(report)
    kept_n = sum(1 for r in report if r["outcome"] == "kept")
    print(f"\nkept {kept_n}/{len(report)} re-OCR results -> {args.src}/reocr_report.csv")
    print("originals preserved as *.orig.json. Now re-run apply_corrections_v4.py.")

if __name__ == "__main__":
    main()
