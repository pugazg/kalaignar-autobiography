"use client";

import { eelamThread } from "@/data/eelam";
import { RefChips, Reveal, SectionHeading } from "@/components/shared";
import { useLang } from "@/lib/i18n";

export default function Eelam() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <section id="eelam" className="bg-mist/40 py-24 dark:bg-night-surface/40" aria-labelledby="eelam-label">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading
          id="eelam"
          tamil="ஈழம்"
          eyebrow="A cause beyond the border"
          title="The Eelam question"
          lede="The Sri Lankan Tamil struggle is one of the memoir's deepest threads — over four hundred mentions across all six volumes, and a cluster of chapters in Volume 3 devoted to it. He frames it consistently as a rights struggle, binding Tamil Nadu's politics to the fate of the island's Tamils while urging a negotiated settlement."
        />
        <div className="relative mx-auto max-w-3xl">
          <div className="absolute left-4 top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-brass/50 via-marina/30 to-transparent" aria-hidden />
          <ol className="space-y-6">
            {eelamThread.map((e, i) => (
              <Reveal key={e.id} delay={(i % 2) * 0.05}>
                <li className="relative pl-12">
                  <span className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-paper bg-marina font-display text-xs font-semibold text-paper shadow dark:border-night">
                    {i + 1}
                  </span>
                  <div className="rounded-2xl border border-ink/10 bg-white/70 p-5 dark:border-white/10 dark:bg-night-surface/80">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-sm font-semibold text-brass">{e.year}</span>
                      <p className="font-tamil text-lg font-medium text-marina dark:text-marina-light" lang="ta">
                        {e.title.ta}
                      </p>
                    </div>
                    {!ta && <p className="font-display text-sm text-ink/60 dark:text-night-text/60">{e.title.en}</p>}
                    <p className="mt-2 text-sm leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
                      {ta ? e.note.ta : e.note.en}
                    </p>
                    <div className="mt-3">
                      <RefChips refs={e.refs} />
                    </div>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
