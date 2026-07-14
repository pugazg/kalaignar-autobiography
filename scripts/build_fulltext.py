#!/usr/bin/env python3
"""
build_fulltext.py — compact per-volume full-text bundles for the Reading Room's
whole-corpus search.

Reads  public/data/text/vN-chNN.json  (391 chapters)
Writes public/data/fulltext/vN.json   one file per volume:
       [{"i": chapter id, "t": title, "x": full text (paragraphs joined)}]

The Library fetches volumes lazily on the first full-text query and caches
them client-side, so the memoir's ~4M characters never load unless asked for.
Re-run after any change to the chapter text data.
"""
import glob, json, os, re
from collections import defaultdict

SRC = "public/data/text"
OUT = "public/data/fulltext"

def main():
    os.makedirs(OUT, exist_ok=True)
    vols = defaultdict(list)
    for fn in sorted(glob.glob(f"{SRC}/v*-ch*.json")):
        d = json.load(open(fn, encoding="utf-8"))
        text = re.sub(r"\s+", " ", " ".join(d.get("paragraphs", [])))
        vols[d["volume"]].append({"i": d["id"], "t": d.get("title", ""), "x": text})
    total = 0
    for v, chapters in sorted(vols.items()):
        chapters.sort(key=lambda c: c["i"])
        path = f"{OUT}/v{v}.json"
        json.dump(chapters, open(path, "w", encoding="utf-8"),
                  ensure_ascii=False, separators=(",", ":"))
        size = os.path.getsize(path)
        total += size
        print(f"v{v}: {len(chapters)} chapters, {size/1e6:.2f} MB")
    print(f"total {total/1e6:.2f} MB across {len(vols)} volumes")

if __name__ == "__main__":
    main()
