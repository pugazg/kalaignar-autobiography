"use client";

import { BookMarked, ChevronDown } from "lucide-react";
import { useState } from "react";
import { siteMeta } from "@/data/meta";
import { chapterIndex, volumeMeta } from "@/data/references";
import { Reveal, SectionHeading } from "@/components/shared";
import { useResearch } from "@/lib/ResearchMode";

export default function References() {
  const [showAll, setShowAll] = useState(false);
  const [vol, setVol] = useState<number | 0>(0);
  const { research, setResearch } = useResearch();
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
          <button
            onClick={() => setResearch(!research)}
            className={`focus-ring ml-auto rounded-full border px-3 py-1 text-xs font-medium transition ${
              research
                ? "border-brass bg-brass text-paper"
                : "border-ink/15 text-ink/70 hover:border-brass/60 dark:border-white/15 dark:text-night-text/70"
            }`}
            aria-pressed={research}
          >
            Research mode {research ? "on" : "off"}
          </button>
        </div>
        {research && (
          <div className="mb-6 rounded-xl border border-marina/25 bg-marina/[0.04] p-4 text-xs dark:bg-marina/10">
            <p className="font-semibold text-marina dark:text-marina-light">Provenance & open data</p>
            <p className="mt-1 text-ink/65 dark:text-night-text/65">
              Chapters were auto-extracted from OCR of the printed editions — Vol 1 by title markers,
              Vols 2 & 4 by a title-and-drop-cap heuristic, Vols 3, 5 & 6 by their numbered headings.
              Text is uncorrected OCR; every chapter is downloadable as JSON, and each has a stable
              URL in the Reader for citation.
            </p>
            <p className="mt-2 flex flex-wrap gap-2">
              {volumeMeta.map((v) => (
                <a
                  key={v.volume}
                  href={`/data/volume${v.volume}.index.json`}
                  download
                  className="focus-ring rounded-full border border-marina/30 px-2.5 py-0.5 text-marina hover:bg-marina hover:text-paper dark:text-marina-light"
                >
                  Vol {v.volume} index.json
                </a>
              ))}
            </p>
          </div>
        )}
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
