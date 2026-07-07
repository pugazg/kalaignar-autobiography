#!/usr/bin/env python3
"""
ocr_extract.py — OCR a scanned Tamil PDF (e.g. a Murasoli letters volume) into
the archive's chapter-JSON format, ready for the Reading Room.

This is a REFERENCE implementation. It is not run here (the container has no
network and no Tamil OCR engine installed); it documents the exact, working
approach and produces files in the same shape as scripts/extract_chapter_text.py.

──────────────────────────────────────────────────────────────────────────────
DEPENDENCIES (install once, locally — NOT on Vercel):
    # System — the OCR engine + Tamil language data + PDF rasteriser
    #   macOS:   brew install tesseract tesseract-lang poppler
    #   Ubuntu:  sudo apt install tesseract-ocr tesseract-ocr-tam poppler-utils
    # Python:
    pip install pdf2image pytesseract pillow

    Verify Tamil is present:   tesseract --list-langs   # must include 'tam'
──────────────────────────────────────────────────────────────────────────────

USAGE:
    python3 pipeline/ocr_extract.py /path/to/murasoli-vol-01.pdf --collection murasoli --volume 1

OUTPUT (mirrors the autobiography's data layer):
    public/data/murasoli/text/m1-p0001.json ... one JSON per page (or per letter)
    public/data/murasoli/volume1.index.json  ... the page/letter index
"""
import argparse, json, os, re, sys

def rasterise(pdf_path, dpi):
    """PDF pages -> PIL images. 300 dpi is the sweet spot for Tamil OCR."""
    from pdf2image import convert_from_path
    return convert_from_path(pdf_path, dpi=dpi)

def preprocess(img):
    """Grayscale + light binarisation lifts Tamil OCR accuracy on old scans."""
    from PIL import ImageOps
    g = ImageOps.grayscale(img)
    g = ImageOps.autocontrast(g)
    return g

def ocr_page(img, psm=6):
    """Run Tesseract in Tamil. psm 6 = 'assume a uniform block of text'."""
    import pytesseract
    cfg = f"--oem 1 --psm {psm} -l tam"
    return pytesseract.image_to_string(img, config=cfg)

def clean(text):
    """Normalise whitespace; drop obvious page-furniture lines."""
    lines = []
    for ln in text.split("\n"):
        s = ln.strip()
        if not s:
            lines.append("")
            continue
        if re.fullmatch(r"[-—.\u00b7\s\d]+", s):   # rule lines, bare page nos
            continue
        lines.append(s)
    # paragraphs = blank-line-separated
    paras = [re.sub(r"[ \t]+", " ", p).strip()
             for p in re.split(r"\n\s*\n", "\n".join(lines)) if p.strip()]
    return paras

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--collection", default="murasoli")
    ap.add_argument("--volume", type=int, required=True)
    ap.add_argument("--dpi", type=int, default=300)
    ap.add_argument("--start-page", type=int, default=1)
    args = ap.parse_args()

    out_dir = f"public/data/{args.collection}/text"
    os.makedirs(out_dir, exist_ok=True)

    print(f"Rasterising {args.pdf} at {args.dpi} dpi …", file=sys.stderr)
    images = rasterise(args.pdf, args.dpi)
    index = []
    for i, img in enumerate(images, start=args.start_page):
        page_id = f"m{args.volume}-p{i:04d}"
        paras = clean(ocr_page(preprocess(img)))
        # crude confidence proxy: share of chars in the Tamil block
        joined = " ".join(paras)
        tamil = sum(1 for c in joined if "\u0B80" <= c <= "\u0BFF")
        conf = round(tamil / max(1, len(joined)), 2)
        rec = {
            "id": page_id, "collection": args.collection, "volume": args.volume,
            "page": i, "paragraphs": paras,
            "ocrConfidence": conf, "origin": "analyzer",
            "source": {"pdf": os.path.basename(args.pdf), "page": i},
        }
        json.dump(rec, open(f"{out_dir}/{page_id}.json", "w", encoding="utf-8"),
                  ensure_ascii=False)
        index.append({"id": page_id, "page": i, "confidence": conf,
                      "preview": (paras[0][:40] if paras else "")})
        print(f"  page {i:4d}  conf={conf}", file=sys.stderr)

    json.dump({"collection": args.collection, "volume": args.volume,
               "pageCount": len(images), "pages": index},
              open(f"public/data/{args.collection}/volume{args.volume}.index.json",
                   "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"Done: {len(images)} pages -> {out_dir}/", file=sys.stderr)

if __name__ == "__main__":
    main()
