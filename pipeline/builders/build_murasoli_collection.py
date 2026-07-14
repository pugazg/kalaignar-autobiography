#!/usr/bin/env python3
"""
build_murasoli_collection.py — Layer 2 builder for the Murasoli letters collection.

Converts the maintainer's corrected OCR page JSON (03_corrected_json_v3/text/*.json)
into the shape the Reading Room consumes, and writes a collection index. Designed to
run uniformly across ALL 54 volumes — point it at each volume's corrected folder and
it appends to the same collection.

Reads:  <corrected>/text/mNN-pXXXX.json  (one per page; the OCR schema)
Writes: public/data/murasoli/text/mNN-pXXXX.json   (reader-ready page text)
        public/data/murasoli/index.json            (collection index: volumes + pages)

Reader-ready page schema (mirrors the memoir chapter shape the Reader expects):
    { id, collection, volume, page, pageType, title, paragraphs[], ocrStatus }

Usage:
    python3 build_murasoli_collection.py --src path/to/03_corrected_json_v3 --volume 54
    # repeat per volume; index.json accumulates.
"""
import argparse, glob, json, os, re

OUT_DIR = "public/data/murasoli"
TEXT_DIR = f"{OUT_DIR}/text"
INDEX = f"{OUT_DIR}/index.json"

def derive_title(page_type, page_no, first_para):
    """Pages aren't chapters — give each a human display title.
    Prefer a date if the page opens with one; else a page label."""
    # look for a dd.mm.yyyy or dd-mm-yyyy date in the first paragraph
    if first_para:
        m = re.search(r"(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})", first_para)
        if m:
            return {"en": f"Letter · {m.group(0)}", "ta": f"கடிதம் · {m.group(0)}"}
    if page_type == "frontmatter":
        return {"en": f"Front matter · p. {page_no}", "ta": f"முன்னுரை · பக். {page_no}"}
    return {"en": f"Page {page_no}", "ta": f"பக்கம் {page_no}"}

def load_existing_index():
    if os.path.exists(INDEX):
        return json.load(open(INDEX, encoding="utf-8"))
    return {"collection": "murasoli",
            "title": {"en": "Murasoli — Letters to Udanpirappukkal",
                      "ta": "முரசொலி — உடன்பிறப்புகளுக்கு"},
            "rights": "Nationalised. Source: Tamil Digital Library (tamildigitallibrary.in), University of Madras holdings.",
            "volumes": []}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="corrected volume folder (has text/)")
    ap.add_argument("--volume", type=int, required=True)
    ap.add_argument("--source-url", default=None,
                    help="URL of the source scan (e.g. the Tamil Digital Library "
                         "entry) — shown as the volume's attribution on the site")
    args = ap.parse_args()

    os.makedirs(TEXT_DIR, exist_ok=True)
    src_text = os.path.join(args.src, "text")
    files = sorted(glob.glob(f"{src_text}/m{args.volume}-p*.json"))
    if not files:
        raise SystemExit(f"No page JSON found in {src_text}")

    pages = []
    for fn in files:
        d = json.load(open(fn, encoding="utf-8"))
        paras = [p for p in d.get("paragraphs", []) if isinstance(p, str) and p.strip()]
        # skip pages the OCR marked unusable or that are empty after correction
        if d.get("ocrStatus") == "skip" or not paras:
            continue
        title = derive_title(d.get("pageType"), d.get("page"), paras[0] if paras else "")
        rec = {
            "id": d["id"],
            "collection": "murasoli",
            "volume": args.volume,
            "page": d.get("page"),
            "pageType": d.get("pageType", "body"),
            "title": title,
            "paragraphs": paras,
            "ocrStatus": d.get("ocrStatus", "ok"),
        }
        json.dump(rec, open(f"{TEXT_DIR}/{d['id']}.json", "w", encoding="utf-8"),
                  ensure_ascii=False)
        pages.append({"id": d["id"], "page": d.get("page"),
                      "title": title, "pageType": d.get("pageType", "body")})

    idx = load_existing_index()
    # replace any existing entry for this volume, then re-sort;
    # keep a previously recorded sourceUrl unless a new one is given
    prev = next((v for v in idx["volumes"] if v["volume"] == args.volume), None)
    source_url = args.source_url or (prev or {}).get("sourceUrl")
    idx["volumes"] = [v for v in idx["volumes"] if v["volume"] != args.volume]
    entry = {
        "volume": args.volume,
        "pageCount": len(pages),
        "pages": pages,
    }
    if source_url:
        entry["sourceUrl"] = source_url
    idx["volumes"].append(entry)
    idx["volumes"].sort(key=lambda v: v["volume"])
    idx["totalPages"] = sum(v["pageCount"] for v in idx["volumes"])
    idx["volumeCount"] = len(idx["volumes"])
    json.dump(idx, open(INDEX, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    print(f"volume {args.volume}: {len(pages)} pages written")
    print(f"collection now: {idx['volumeCount']} volumes, {idx['totalPages']} pages")

if __name__ == "__main__":
    main()
