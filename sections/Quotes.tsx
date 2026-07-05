"use client";

import { Quote as QuoteIcon } from "lucide-react";
import { quotes } from "@/data/quotes";
import { Reveal, SectionHeading } from "@/components/shared";

export default function Quotes() {
  return (
    <section
      id="quotes"
      className="mx-auto max-w-content px-4 py-24 sm:px-6"
      aria-labelledby="quotes-label"
    >
      <SectionHeading
        id="quotes"
        tamil="வாசகங்கள்"
        eyebrow="In his words"
        title="Fourteen lines that carry the story"
        lede="Brief excerpts spanning all six volumes, each verified against the source and cited to its chapter — the full passages live in the books themselves."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {quotes.map((q, i) => (
          <Reveal key={q.ref + i} delay={(i % 2) * 0.06}>
            <figure className="relative flex h-full flex-col rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-sm dark:border-white/10 dark:bg-night-surface/80">
              <QuoteIcon
                className="absolute right-5 top-5 h-6 w-6 text-brass/40"
                aria-hidden
              />
              <blockquote className="flex-1">
                <p
                  className="pr-8 font-tamil text-lg leading-relaxed text-marina dark:text-marina-light"
                  lang="ta"
                >
                  “{q.tamil}”
                </p>
                <p className="mt-3 font-display text-base italic text-ink/80 dark:text-night-text/80">
                  {q.english}
                </p>
              </blockquote>
              <figcaption className="mt-4 flex items-center justify-between gap-3 border-t border-ink/10 pt-3 dark:border-white/10">
                <span className="text-xs text-ink/60 dark:text-night-text/60">{q.context}</span>
                <a
                  href="#references"
                  className="focus-ring shrink-0 rounded-full border border-marina/30 px-2 py-0.5 text-[11px] font-medium text-marina hover:bg-marina hover:text-paper dark:text-marina-light"
                  title={`Volume ${q.ref.slice(1, 2)}, chapter ${q.ref.split("ch")[1]}`}
                >
                  {q.ref.replace(/^v(\d)-ch/, "V$1·")}
                </a>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
