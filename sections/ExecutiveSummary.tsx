"use client";

import { summaryCards } from "@/data/meta";
import { useLang } from "@/lib/i18n";
import { summaryCardsTa } from "@/data/i18n.ta";
import { Card, Icon, Reveal, SectionHeading } from "@/components/shared";

export default function ExecutiveSummary() {
  const { lang } = useLang();
  return (
    <section id="summary" className="mx-auto max-w-content px-4 py-24 sm:px-6" aria-labelledby="summary-label">
      <SectionHeading
        id="summary"
        tamil="சுருக்கம்"
        eyebrow="Executive summary"
        title="One life, eight movements"
        lede="The complete memoir spans six volumes, 1924 to 2005 — a delta childhood, a language war, a leaflet that became an institution, a screen that became a pulpit, prisons that became schools, power won and dismissed, adversity weathered, the return, and a final innings that never conceded. The eight movements below are Volume 1's; the timeline carries the whole arc."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((raw, i) => {
          const c = lang === "ta" && summaryCardsTa[i] ? { ...raw, ...summaryCardsTa[i] } : raw;
          return (
          <Reveal key={c.heading} delay={i * 0.05}>
            <Card as="article" className="h-full">
              <div className="mb-4 inline-flex rounded-xl bg-marina-faint p-3 text-marina dark:bg-marina/20 dark:text-marina-light">
                <Icon name={c.icon} className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-medium">{c.heading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70 dark:text-night-text/70">
                {c.text}
              </p>
            </Card>
          </Reveal>
        );
        })}
      </div>
    </section>
  );
}
