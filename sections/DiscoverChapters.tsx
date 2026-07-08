"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Search, Sparkles } from "lucide-react";
import type { RetrievalIndex, RetrievalConcept } from "@/data/retrieval";
import { Reveal, SectionHeading } from "@/components/shared";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// human-friendly concept labels (bilingual)
const CONCEPT_LABELS: Record<string, { en: string; ta: string }> = {
  "anti-hindi": { en: "Anti-Hindi agitation", ta: "இந்தி எதிர்ப்பு" },
  reservation: { en: "Reservation & social justice", ta: "இட ஒதுக்கீடு" },
  prison: { en: "Prison & struggle", ta: "சிறை & போராட்டம்" },
  eelam: { en: "Eelam / Sri Lanka", ta: "ஈழம்" },
  elections: { en: "Elections", ta: "தேர்தல்கள்" },
  cinema: { en: "Cinema & stage", ta: "திரையும் நாடகமும்" },
  "self-respect": { en: "Self-respect & rationalism", ta: "சுயமரியாதை" },
  "state-autonomy": { en: "State autonomy", ta: "மாநில சுயாட்சி" },
  women: { en: "Women's rights", ta: "பெண்கள் உரிமை" },
  "temple-entry": { en: "Temple priesthood", ta: "அர்ச்சகர் உரிமை" },
  emergency: { en: "The Emergency", ta: "நெருக்கடி நிலை" },
  anna: { en: "Arignar Anna", ta: "அறிஞர் அண்ணா" },
};

export default function DiscoverChapters() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [index, setIndex] = useState<RetrievalIndex | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/retrieval.json")
      .then((r) => (r.ok ? r.json() : null))
      .then(setIndex)
      .catch(() => setIndex(null));
  }, []);

  // match a free-text query to a concept by alias substring
  const matched = useMemo<RetrievalConcept | null>(() => {
    if (!index) return null;
    const chosen = active ?? null;
    if (chosen) return index.concepts.find((c) => c.id === chosen) ?? null;
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;
    // best concept whose alias contains the query (or vice versa)
    for (const c of index.concepts) {
      if (c.aliases.some((a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))) {
        return c;
      }
    }
    return null;
  }, [index, query, active]);

  return (
    <section id="discover" className="bg-mist/40 py-24 dark:bg-night-surface/40" aria-labelledby="discover-label">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading
          id="discover"
          tamil="தலைப்பு வழி தேடல்"
          eyebrow="Find chapters by theme"
          title="Ask the archive by topic"
          lede="Search by idea — 'the anti-Hindi agitation', 'reservation', 'the Emergency' — and the archive points you to the real chapters that discuss it, each opening in the Reading Room with its citation. The archive only ever points to the text; it never paraphrases or invents."
        />

        {/* query box */}
        <div className="mx-auto mb-6 flex max-w-xl items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 py-2.5 dark:border-white/15 dark:bg-night-surface">
          <Search className="h-4 w-4 text-ink/40 dark:text-night-text/40" aria-hidden />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(null);
            }}
            placeholder={ta ? "ஒரு தலைப்பைத் தட்டச்சு செய்யுங்கள்…" : "Type a theme — e.g. anti-Hindi, reservation, Eelam…"}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40 dark:placeholder:text-night-text/40"
            aria-label="Search chapters by theme"
          />
        </div>

        {/* concept chips */}
        <div className="mb-10 flex flex-wrap justify-center gap-1.5">
          {index?.concepts.map((c) => {
            const l = CONCEPT_LABELS[c.id] ?? { en: c.id, ta: c.id };
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActive(active === c.id ? null : c.id);
                  setQuery("");
                }}
                className={cn(
                  "focus-ring rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  matched?.id === c.id
                    ? "bg-marina text-paper"
                    : "border border-ink/10 text-ink/60 hover:border-marina/50 hover:text-marina dark:border-white/10 dark:text-night-text/60",
                )}
                aria-pressed={matched?.id === c.id}
              >
                {ta ? l.ta : l.en}
              </button>
            );
          })}
        </div>

        {/* results — real chapters, ranked, cited */}
        {matched ? (
          <Reveal>
            <div className="mx-auto max-w-2xl">
              <p className="mb-4 flex items-center gap-2 text-sm text-ink/60 dark:text-night-text/60">
                <Sparkles className="h-4 w-4 text-brass" aria-hidden />
                {ta
                  ? `${matched.chapterCount} அத்தியாயங்கள் — “${CONCEPT_LABELS[matched.id]?.ta ?? matched.id}”`
                  : `${matched.chapterCount} chapters on “${CONCEPT_LABELS[matched.id]?.en ?? matched.id}”`}
              </p>
              <ol className="space-y-2">
                {matched.chapters.map((ch, i) => (
                  <li key={ch.id}>
                    <Link
                      href={`/read/${ch.id}`}
                      className="focus-ring group flex items-center gap-3 rounded-xl border border-ink/10 bg-white/70 p-3 transition hover:border-marina/40 dark:border-white/10 dark:bg-night-surface/80"
                    >
                      <span className="font-display text-sm font-semibold text-brass/50">{i + 1}</span>
                      <span className="flex-1">
                        <span className="font-tamil text-marina dark:text-marina-light" lang="ta">{ch.title}</span>
                        <span className="mt-0.5 block text-xs text-ink/45 dark:text-night-text/45">
                          {ch.id.toUpperCase().replace("-CH", "·ch")} · {ta ? `பாகம் ${ch.volume}` : `Volume ${ch.volume}`}
                        </span>
                      </span>
                      <BookOpen className="h-4 w-4 text-ink/30 group-hover:text-marina dark:text-night-text/30" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        ) : query.trim().length >= 2 ? (
          <p className="text-center text-sm text-ink/50 dark:text-night-text/50">
            {ta
              ? "அந்தத் தலைப்புக்குப் பொருத்தம் இல்லை — கீழுள்ள தலைப்புகளில் ஒன்றை முயற்சிக்கவும்."
              : "No matching theme yet — try one of the topic chips above."}
          </p>
        ) : (
          <p className="text-center text-sm text-ink/40 dark:text-night-text/40">
            {ta ? "தொடங்க ஒரு தலைப்பைத் தேர்ந்தெடுக்கவும்." : "Pick a theme above, or type one, to see the chapters that discuss it."}
          </p>
        )}
      </div>
    </section>
  );
}
