"""Emit per-chapter Tamil text JSON for the Reader.

Usage: python3 scripts/extract_chapter_text.py path/to/volumeN.md N
Writes: public/data/text/vN-chNN.json for every chapter in the volume index.
"""
import json, os, re, sys

def clean_page(body: str) -> str:
    lines = []
    for l in body.split("\n"):
        s = l.strip().lstrip("\u2060").strip()
        if not s:
            lines.append("")
            continue
        if "\u2756" in s:  # ❖ running header
            continue
        if re.fullmatch(r"\d{1,4}", s):  # bare page number
            continue
        lines.append(s)
    return "\n".join(lines)

def main(path, vol):
    idx = json.load(open(f"data/extracted/volume{vol}.index.json", encoding="utf-8"))
    text = open(path, encoding="utf-8").read()
    parts = re.split(r"<!-- PAGE (\d+) -->", text)
    pages = {int(parts[i]): parts[i + 1] for i in range(1, len(parts) - 1, 2)}
    os.makedirs("public/data/text", exist_ok=True)
    for ch in idx["chapters"]:
        raw = "\n".join(clean_page(pages.get(p, "")) for p in range(ch["startPage"], ch["endPage"] + 1))
        # paragraphs: blank-line separated; merge single line-breaks
        paras = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", raw)]
        paras = [p for p in paras if p]
        out = {
            "id": ch["id"], "volume": vol, "title": ch["title"],
            "pages": {"start": ch["startPage"], "end": ch["endPage"]},
            "strategy": idx.get("strategy", "wordjoiner"), "paragraphs": paras,
        }
        json.dump(out, open(f"public/data/text/{ch['id']}.json", "w", encoding="utf-8"), ensure_ascii=False)
    print(f"v{vol}: {idx['chapterCount']} chapter files")

if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]))
