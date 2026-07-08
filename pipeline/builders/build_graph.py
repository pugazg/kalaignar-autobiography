#!/usr/bin/env python3
"""
build_graph.py — Layer 2 (website builder).

Projects the generic entity archive (Layer 1) into render-ready website JSON for
the relationship-graph section. This layer has NO historical knowledge: it only
joins analyzer output (person-<id>, mentions, edges) with the curated display
names/roles from data/people.ts, and lays out node positions on a circle.

Reads:  archive/people.json, archive/cooccurrence.json
        data/people.ts   (for display names + roles, parsed loosely)
Writes: public/data/graph.json   { nodes:[...], edges:[...] }
"""
import json, re, math, os

# --- curated display data, parsed from the TS source (id -> {en, ta, role}) ---
def parse_people_ts(path="data/people.ts"):
    src = open(path, encoding="utf-8").read()
    people = {}
    # match blocks: id: "x", ... tamil: "...", ... role: "..."
    for m in re.finditer(r'id:\s*"([a-z-]+)".*?tamil:\s*"([^"]*)".*?role:\s*"([^"]*)"', src, re.DOTALL):
        pid, tamil, role = m.group(1), m.group(2), m.group(3)
        people[pid] = {"ta": tamil, "role": role}
    # english name: try a name/en field if present
    for m in re.finditer(r'id:\s*"([a-z-]+)".*?(?:name|en):\s*"([^"]*)"', src, re.DOTALL):
        pid, en = m.group(1), m.group(2)
        if pid in people and "en" not in people[pid]:
            people[pid]["en"] = en
    return people

def main():
    people_arch = json.load(open("archive/people.json", encoding="utf-8"))["records"]
    edges_arch = json.load(open("archive/cooccurrence.json", encoding="utf-8"))["edges"]
    curated = parse_people_ts()

    # analyzer id "person-anna" -> curated key "anna"
    def short(pid): return pid.replace("person-", "")

    # build nodes only for people present in BOTH analyzer output and curation,
    # so every graph node has a real display name (no bare ids on screen)
    recs = {r["id"]: r for r in people_arch}
    node_ids = [pid for pid in recs if short(pid) in curated]

    # size by mention count (sqrt-scaled so big ones don't dominate)
    max_m = max(recs[p]["mentionCount"] for p in node_ids) or 1
    N = len(node_ids)
    nodes = []
    for i, pid in enumerate(sorted(node_ids, key=lambda p: -recs[p]["mentionCount"])):
        c = curated[short(pid)]
        m = recs[pid]["mentionCount"]
        angle = (i / N) * 2 * math.pi - math.pi / 2
        nodes.append({
            "id": pid,
            "en": c.get("en", short(pid).title()),
            "ta": c.get("ta", ""),
            "role": c.get("role", ""),
            "mentions": m,
            "chapters": recs[pid]["chapterCount"],
            "firstChapter": recs[pid]["firstAppearance"],
            "r": round(14 + 26 * math.sqrt(m / max_m), 1),  # radius 14..40
            # circle layout in a 900x900 viewBox
            "x": round(450 + 330 * math.cos(angle), 1),
            "y": round(450 + 330 * math.sin(angle), 1),
        })

    present = set(node_ids)
    max_w = max((e["weight"] for e in edges_arch), default=1)
    edges = [
        {"source": e["source"], "target": e["target"], "weight": e["weight"],
         "strength": round(e["weight"] / max_w, 3)}
        for e in edges_arch
        if e["source"] in present and e["target"] in present
    ]

    out = {"schemaVersion": "1.0", "origin": "merged",
           "nodes": nodes, "edges": edges}
    os.makedirs("public/data", exist_ok=True)
    json.dump(out, open("public/data/graph.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    print(f"graph.json: {len(nodes)} nodes, {len(edges)} edges")
    print("nodes:", ", ".join(f"{n['en']}({n['mentions']})" for n in nodes[:8]))

if __name__ == "__main__":
    main()
