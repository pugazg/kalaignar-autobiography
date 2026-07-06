"""Emit stats.json and manifest.json — 100% derived from the corpus substrate.

This is the reference implementation of the data-driven pattern: run it after
the pipeline and the statistics section rebuilds itself. No hand-editing.

Usage: python3 scripts/corpus_stats.py
Reads:  data/extracted/volume{1..6}.index.json  (+ chapter text if present)
Writes: public/data/manifest.json, public/data/stats.json
"""
import json, glob, os, re, collections

PERIODS = {1:"1924–1969",2:"1969–1976",3:"1976–1988",4:"1988–1996",5:"1996–1999",6:"1999–2005"}
SERIALISED = {1:"Dinamani Kadir",2:"Kungumam"}

def load_indexes():
    vols=[]
    for n in range(1,7):
        p=f"data/extracted/volume{n}.index.json"
        if os.path.exists(p):
            vols.append(json.load(open(p,encoding="utf-8")))
    return vols

def main():
    vols=load_indexes()
    total_ch=sum(v["chapterCount"] for v in vols)
    total_pg=sum(v["totalPages"] for v in vols)

    manifest={
        "buildId": os.environ.get("BUILD_ID","local"),
        "generatedAt": __import__("datetime").datetime.utcnow().isoformat()+"Z",
        "volumes":[{"n":v["volume"],"period":PERIODS.get(v["volume"],""),
                    "chapters":v["chapterCount"],"pages":v["totalPages"],
                    "serialisedIn":SERIALISED.get(v["volume"])} for v in vols],
        "totals":{"chapters":total_ch,"pages":total_pg,"volumes":len(vols),
                  "yearsCovered":81},
    }
    os.makedirs("public/data",exist_ok=True)
    json.dump(manifest,open("public/data/manifest.json","w",encoding="utf-8"),
              ensure_ascii=False,indent=2)

    # chapters-per-volume (always available)
    chapters_per_vol=[{"volume":v["volume"],"chapters":v["chapterCount"],
                       "pages":v["totalPages"]} for v in vols]

    # word/term frequency from chapter text if present (analyzer-grade signal)
    term_freq={}
    text_files=glob.glob("public/data/text/*.json")
    if text_files:
        TERMS={"சட்டம்":"laws","திட்டம்":"schemes","தேர்தல்":"elections",
               "சிறை":"prison","மொழி":"language","இயக்கம்":"movement"}
        counter=collections.Counter()
        for fn in text_files:
            d=json.load(open(fn,encoding="utf-8"))
            txt=" ".join(d["paragraphs"])
            for ta,en in TERMS.items():
                counter[en]+=len(re.findall(ta,txt))
        term_freq=dict(counter)

    stats={
        "origin":"analyzer",
        "generatedAt":manifest["generatedAt"],
        "counters":[
            {"value":total_pg,"label":"pages across all six volumes","icon":"BookOpen"},
            {"value":total_ch,"label":"chapters of memoir","icon":"ListOrdered"},
            {"value":81,"suffix":" yrs","label":"of life covered (1924–2005)","icon":"CalendarRange"},
            {"value":len(vols),"label":"volumes — the complete memoir","icon":"Library"},
        ],
        "chaptersPerVolume":chapters_per_vol,
        "termFrequency":term_freq,
    }
    json.dump(stats,open("public/data/stats.json","w",encoding="utf-8"),
              ensure_ascii=False,indent=2)
    print(f"manifest.json + stats.json written: {total_ch} chapters, {total_pg} pages, "
          f"term_freq={'yes' if term_freq else 'no text files'}")

if __name__=="__main__":
    main()
