#!/usr/bin/env python3
"""
build_retrieval_index.py — Layer 1 analyzer for safe semantic retrieval.

Builds a CONCEPT index over the 391 chapters so a reader can ask "show me
chapters about the anti-Hindi agitation" and get REAL chapters back, ranked,
each with its citation. Computed entirely at build time from the corpus.

INTEGRITY BY CONSTRUCTION: this system can only ever return chapter IDs that
exist in the corpus. It never generates prose, never paraphrases, never
summarises. The AI-as-librarian constraint is enforced structurally, not by
policy — there is no generation step to misbehave.

Method: a curated set of CONCEPTS (bilingual query aliases → the Tamil terms
that signal the concept in the text). For each concept we score every chapter by
term frequency, and keep the chapters that actually discuss it. A reader's query
is matched to concepts by alias; results are real chapters, ranked by score.

Reads:  public/data/text/*.json
Writes: public/data/retrieval.json  { concepts:[{id, aliases, chapters:[{id,score}]}] }
"""
import json, glob, os, re, collections

# concept id -> (English+Tamil query aliases, signal terms in the text)
CONCEPTS = {
  "anti-hindi": {
    "aliases": ["anti-hindi agitation", "hindi imposition", "language protest",
                "இந்தி எதிர்ப்பு", "இந்தித் திணிப்பு", "மொழிப் போர்"],
    "terms": ["இந்தி", "மொழிப் போர்", "திணிப்பு", "இருமொழி"],
  },
  "reservation": {
    "aliases": ["reservation", "social justice quota", "backward classes",
                "இட ஒதுக்கீடு", "பிற்படுத்தப்பட்டோர்", "சமூக நீதி"],
    "terms": ["இட ஒதுக்கீடு", "ஒதுக்கீடு", "பிற்படுத்தப்பட்ட", "மிகவும் பிற்படுத்தப்பட்ட"],
  },
  "prison": {
    "aliases": ["prison", "jail", "imprisonment", "arrest",
                "சிறை", "சிறைவாசம்", "கைது"],
    "terms": ["சிறை", "சிறைவாச", "கைது", "பிடிவாரண்ட்"],
  },
  "eelam": {
    "aliases": ["eelam", "sri lanka", "tamil eelam", "lankan tamils",
                "ஈழம்", "இலங்கை", "ஈழத் தமிழர்"],
    "terms": ["ஈழ", "இலங்கை", "சிங்கள", "புலிகள்"],
  },
  "elections": {
    "aliases": ["elections", "electoral victory", "polls",
                "தேர்தல்", "வாக்கு", "வெற்றி"],
    "terms": ["தேர்தல்", "வாக்கு", "சட்டமன்றத் தேர்தல்", "எம்.எல்.ஏ"],
  },
  "cinema": {
    "aliases": ["cinema", "films", "screenwriting", "movies",
                "திரைப்படம்", "சினிமா", "வசனம்"],
    "terms": ["திரைப்பட", "சினிமா", "வசன", "படம்", "நாடக"],
  },
  "self-respect": {
    "aliases": ["self-respect movement", "rationalism", "periyar",
                "சுயமரியாதை", "பகுத்தறிவு", "மூடநம்பிக்கை"],
    "terms": ["சுயமரியாத", "பகுத்தறிவு", "மூடநம்பிக்கை", "பெரியார்"],
  },
  "state-autonomy": {
    "aliases": ["state autonomy", "federalism", "centre-state",
                "மாநில சுயாட்சி", "கூட்டாட்சி", "மாநில உரிமை"],
    "terms": ["சுயாட்சி", "கூட்டாட்சி", "மாநில உரிமை", "இராஜமன்னார்"],
  },
  "women": {
    "aliases": ["women's rights", "women empowerment", "property rights women",
                "பெண்கள் உரிமை", "மகளிர்", "சம சொத்துரிமை"],
    "terms": ["பெண்", "மகளிர்", "சொத்துரிமை", "சுயமரியாதைத் திருமண"],
  },
  "temple-entry": {
    "aliases": ["temple priests", "archakas", "caste in temples",
                "அர்ச்சகர்", "கோயில் நுழைவு"],
    "terms": ["அர்ச்சகர்", "கோயில்", "ஆலய"],
  },
  "emergency": {
    "aliases": ["emergency 1975", "dismissal", "indira emergency",
                "நெருக்கடி நிலை", "ஆட்சி கலைப்பு"],
    "terms": ["நெருக்கடி நிலை", "அவசரநிலை", "ஆட்சி கலைப்பு", "பணிநீக்க"],
  },
  "anna": {
    "aliases": ["anna", "annadurai", "the leader",
                "அண்ணா", "அண்ணாதுரை"],
    "terms": ["அறிஞர் அண்ணா", "அண்ணாதுரை", "பேரறிஞர் அண்ணா"],
  },
}

def main():
    corpus = {}
    for fn in sorted(glob.glob("public/data/text/*.json")):
        d = json.load(open(fn, encoding="utf-8"))
        corpus[d["id"]] = {
            "volume": d["volume"], "title": d["title"],
            "pages": d.get("pages", {}),
            "text": " ".join(d["paragraphs"]),
            "len": sum(len(p) for p in d["paragraphs"]) or 1,
        }

    concepts_out = []
    for cid, spec in CONCEPTS.items():
        scored = []
        for chid, ch in corpus.items():
            hits = sum(len(re.findall(re.escape(t), ch["text"])) for t in spec["terms"])
            if hits:
                # normalise by chapter length so long chapters don't dominate
                score = round(hits * 1000 / ch["len"], 3)
                scored.append({"id": chid, "score": score, "hits": hits,
                               "volume": ch["volume"], "title": ch["title"]})
        scored.sort(key=lambda x: -x["score"])
        # keep chapters that genuinely discuss it (>=2 hits), top 12
        kept = [s for s in scored if s["hits"] >= 2][:12]
        concepts_out.append({
            "id": cid, "aliases": spec["aliases"],
            "chapterCount": len(kept), "chapters": kept,
        })
        print(f"{cid:16s} {len(kept):2d} chapters (top: {kept[0]['id'] if kept else '-'})")

    out = {"schemaVersion": "1.0", "origin": "analyzer",
           "note": "Retrieval index: queries map to real, cited chapters. No generation.",
           "concepts": concepts_out}
    json.dump(out, open("public/data/retrieval.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    print(f"\nretrieval.json: {len(concepts_out)} concepts")

if __name__ == "__main__":
    main()
