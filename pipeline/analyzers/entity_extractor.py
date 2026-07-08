#!/usr/bin/env python3
"""
entity_extractor.py — Layer 1 analyzer.

Reads the corpus (public/data/text/vN-chNN.json) and emits GENERIC archive JSON:
every mention of a known person or place, with its chapter and a stable id.
This is the substrate that powers relationship graphs and semantic retrieval.

Design choices (deliberate, for a Tamil corpus):
  • Gazetteer-based, not statistical NER. Tamil NER models are unreliable; a
    curated controlled vocabulary of KNOWN figures (each with spelling variants)
    is accurate and auditable. Every entity is one we can verify in the text.
  • Chapter-anchored ids (person-periyar), never page-anchored — stable across
    OCR re-runs.
  • Emits co-occurrence (who appears with whom, in which chapter) so the website
    builder can draw the relationship graph without any historical knowledge.

Usage:
    python3 pipeline/analyzers/entity_extractor.py
Writes:
    archive/people.json          (mentions[] per person)
    archive/places.json          (mentions[] per place)
    archive/cooccurrence.json    (person-person edges, by shared chapter)
"""
import json, glob, os, re, collections

# ---- Controlled vocabulary. Each entity: stable id + Tamil surface variants ----
# TIGHTENED to proper-noun forms to avoid common-word collisions. The classic
# trap: bare "அண்ணா" also means "elder brother" — it over-counted ~8x. We use
# the honorific forms ("அறிஞர் அண்ணா", "அண்ணாதுரை") instead. Every variant here
# was checked in-context before inclusion.
PEOPLE = {
    "person-periyar":  ["பெரியார்", "ஈ.வெ.ரா", "இ.வெ.ரா"],
    "person-anna":     ["அறிஞர் அண்ணா", "அண்ணாதுரை", "பேரறிஞர் அண்ணா"],
    "person-mgr":      ["எம்.ஜி.ஆர்", "எம்.ஜி.இராமச்சந்திரன்"],
    "person-kamaraj":  ["காமராஜ்", "காமராசர்", "காமராஜர்"],
    "person-rajaji":   ["ராஜாஜி", "இராஜாஜி", "இராஜகோபாலாச்சாரி"],
    "person-sivaji":   ["சிவாஜி கணேசன்"],
    "person-maran":    ["முரசொலி மாறன்"],
    "person-stalin":   ["ஸ்டாலின்"],
    "person-nehru":    ["நேரு"],
    "person-indira":   ["இந்திரா"],
    "person-rajiv":    ["ராஜீவ்"],
    "person-chelva":   ["செல்வநாயகம்", "செல்வநாயகன்"],
    "person-vairamuthu": ["வைரமுத்து"],
    "person-ambedkar": ["அம்பேத்கர்"],
    # Added after corpus verification. NSK: bare "கிருஷ்ணன்" over-counts (matches
    # the god Krishna in folk-theatre passages), so only precise forms are used.
    "person-nsk":      ["என்.எஸ்.கே", "என்.எஸ். கிருஷ்ணன்"],
    "person-jayalalithaa": ["ஜெயலலிதா"],
    "person-nedunchezhiyan": ["நெடுஞ்செழியன்"],
    "person-kannadasan": ["கண்ணதாசன்"],
    "person-bharathidasan": ["பாரதிதாசன்"],
}

PLACES = {
    "place-thirukkuvalai": ["திருக்குவளை"],
    "place-tiruvarur":     ["திருவாரூர்"],
    "place-kallakudi":     ["கல்லக்குடி", "டால்மியாபுரம்"],
    "place-trichy":        ["திருச்சி", "திருச்சிராப்பள்ளி"],
    "place-palayamkottai": ["பாளையங்கோட்டை"],
    "place-chennai":       ["சென்னை", "மதராஸ்", "மெட்ராஸ்"],
    "place-madurai":       ["மதுரை"],
    "place-kanyakumari":   ["கன்னியாகுமரி"],
    "place-delhi":         ["டெல்லி", "தில்லி"],
    "place-eelam":         ["ஈழம்", "இலங்கை"],
}

def load_corpus():
    corpus = {}
    for fn in sorted(glob.glob("public/data/text/*.json")):
        d = json.load(open(fn, encoding="utf-8"))
        corpus[d["id"]] = (d["volume"], " ".join(d["paragraphs"]))
    return corpus

def extract(vocab, corpus):
    records = {}
    # chapter -> set of entity ids present (for co-occurrence)
    chapter_entities = collections.defaultdict(set)
    for eid, variants in vocab.items():
        mentions = []
        vols = set()
        for cid, (vol, txt) in corpus.items():
            count = sum(len(re.findall(re.escape(v), txt)) for v in variants)
            if count:
                mentions.append({"chapter": cid, "count": count})
                vols.add(vol)
                chapter_entities[cid].add(eid)
        if mentions:
            mentions.sort(key=lambda m: m["chapter"])
            records[eid] = {
                "id": eid,
                "type": eid.split("-")[0],
                "variants": variants,
                "mentionCount": sum(m["count"] for m in mentions),
                "chapterCount": len(mentions),
                "volumes": sorted(vols),
                "firstAppearance": mentions[0]["chapter"],
                "mentions": mentions,
                "origin": "analyzer",
            }
    return records, chapter_entities

def cooccurrence(chapter_entities):
    """Edges: two people sharing a chapter. Weight = shared-chapter count."""
    edges = collections.Counter()
    for cid, ents in chapter_entities.items():
        people = sorted(e for e in ents if e.startswith("person-"))
        for i in range(len(people)):
            for j in range(i + 1, len(people)):
                edges[(people[i], people[j])] += 1
    return [
        {"source": a, "target": b, "weight": w}
        for (a, b), w in sorted(edges.items(), key=lambda x: -x[1])
    ]

def main():
    os.makedirs("archive", exist_ok=True)
    corpus = load_corpus()
    people, ppl_chapters = extract(PEOPLE, corpus)
    places, plc_chapters = extract(PLACES, corpus)

    # co-occurrence uses people + places together for chapter sets
    all_chapters = collections.defaultdict(set)
    for cid, s in ppl_chapters.items(): all_chapters[cid] |= s
    edges = cooccurrence(ppl_chapters)

    def wrap(records):
        return {"schemaVersion": "1.0", "origin": "analyzer",
                "records": list(records.values())}

    json.dump(wrap(people), open("archive/people.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    json.dump(wrap(places), open("archive/places.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    json.dump({"schemaVersion": "1.0", "origin": "analyzer", "edges": edges},
              open("archive/cooccurrence.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    print(f"people: {len(people)} entities, {sum(r['mentionCount'] for r in people.values())} mentions")
    print(f"places: {len(places)} entities")
    print(f"cooccurrence: {len(edges)} edges")
    print("top 5 edges:")
    for e in edges[:5]:
        print(f"  {e['source']} — {e['target']}: {e['weight']} chapters")

if __name__ == "__main__":
    main()
