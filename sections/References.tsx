"use client";

import { BookMarked, ChevronDown } from "lucide-react";
import { useState } from "react";
import { siteMeta } from "@/data/meta";
import { chapterIndex, volumeMeta } from "@/data/references";
import { Reveal, SectionHeading } from "@/components/shared";

export default function References() {
  const [showAll, setShowAll] = useState(false);
  const [vol, setVol] = useState<number | 0>(0);
  const filtered = vol === 0 ? chapterIndex : chapterIndex.filter((c) => c.volume === vol);
  const visible = showAll ? filtered : filtered.slice(0, 24);

  return (
    <section id="references" className="mx-auto max-w-content px-4 py-24 sm:px-6" aria-labelledby="references-label">
      <SectionHeading
        id="references"
        tamil="மேற்கோள்"
        eyebrow="References"
        title="Every claim traces to a chapter"
        lede="Citations across this site use the pattern VN·NN — volume and chapter number. The complete extracted chapter index of each loaded volume appears below, with page ranges from the editions used."
      />

      <Reveal>
        <div className="mb-8 flex flex-col items-start gap-3 rounded-2xl border border-marina/25 bg-marina-faint p-6 dark:bg-marina/10 sm:flex-row sm:items-center">
          <BookMarked className="h-8 w-8 shrink-0 text-marina dark:text-marina-light" aria-hidden />
          <div>
            <p className="font-display text-lg font-medium">
              {siteMeta.source.workEnglish}{" "}
              <span className="font-tamil text-marina/80 dark:text-marina-light/80" lang="ta">
                ({siteMeta.source.workTamil})
              </span>
            </p>
            <p className="mt-1 text-sm text-ink/70 dark:text-night-text/70">
              {siteMeta.source.author} · first serialised in {siteMeta.source.firstSerialisedIn} · published by{" "}
              {siteMeta.source.publisher} · {siteMeta.source.pages} pages, {siteMeta.source.chapters} chapters ·
              covering {siteMeta.source.periodCovered}.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setVol(0); setShowAll(false); }}
            className={`focus-ring rounded-full border px-3 py-1 text-xs font-medium transition ${
              vol === 0
                ? "border-marina bg-marina text-paper"
                : "border-ink/15 text-ink/70 hover:border-marina/50 dark:border-white/15 dark:text-night-text/70"
            }`}
          >
            All volumes
          </button>
          {volumeMeta.map((v) => (
            <button
              key={v.volume}
              onClick={() => { setVol(v.volume); setShowAll(false); }}
              className={`focus-ring rounded-full border px-3 py-1 text-xs font-medium transition ${
                vol === v.volume
                  ? "border-marina bg-marina text-paper"
                  : "border-ink/15 text-ink/70 hover:border-marina/50 dark:border-white/15 dark:text-night-text/70"
              }`}
              title={`${v.chapters} chapters · ${v.pages} pages`}
            >
              Vol {v.volume} · {v.period}
            </button>
          ))}
        </div>
        <ol className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {visible.map((c) => (
            <li
              key={c.id}
              className="flex items-baseline gap-2 border-b border-ink/5 py-1.5 text-sm dark:border-white/5"
            >
              <span className="shrink-0 font-mono text-[11px] font-semibold text-marina dark:text-marina-light">
                {c.id.replace(/^v(\d)-ch/, "V$1·")}
              </span>
              <span className="min-w-0 flex-1 truncate font-tamil" lang="ta" title={c.title}>
                {c.title}
              </span>
              <span className="shrink-0 text-xs text-ink/45 dark:text-night-text/45">{c.pages}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2 text-sm font-medium hover:border-marina hover:text-marina dark:border-white/15 dark:hover:text-marina-light"
            aria-expanded={showAll}
          >
            {showAll ? "Show fewer chapters" : `Show all ${chapterIndex.length} chapters`}
            <ChevronDown className={showAll ? "h-4 w-4 rotate-180" : "h-4 w-4"} aria-hidden />
          </button>
        </div>
      </Reveal>
    </section>
  );
}
