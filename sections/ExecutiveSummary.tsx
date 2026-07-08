"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { summaryCards } from "@/data/meta";
import { useLang } from "@/lib/i18n";
import { summaryCardsTa } from "@/data/i18n.ta";
import { Card, Icon, Reveal, SectionHeading } from "@/components/shared";
import { cn } from "@/lib/utils";

export default function ExecutiveSummary() {
  const { lang } = useLang();
  const [both, setBoth] = useState(false);

  return (
    <section id="summary" className="mx-auto max-w-content px-4 py-24 sm:px-6" aria-labelledby="summary-label">
      <SectionHeading
        id="summary"
        tamil="சுருக்கம்"
        eyebrow="Executive summary"
        title="One life, eight movements"
        lede="The complete memoir spans six volumes, 1924 to 2005 — a delta childhood, a language war, a leaflet that became an institution, a screen that became a pulpit, prisons that became schools, power won and dismissed, adversity weathered, the return, and a final innings that never conceded. The eight movements below are Volume 1's; the timeline carries the whole arc."
      />

      {/* Side-by-side toggle: show both languages at once, for readers and researchers */}
      <div className="mb-8 flex justify-center">
        <button
          onClick={() => setBoth((b) => !b)}
          className={cn(
            "focus-ring inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            both
              ? "bg-marina text-paper"
              : "border border-ink/15 text-ink/70 hover:border-marina/50 dark:border-white/15 dark:text-night-text/70",
          )}
          aria-pressed={both}
        >
          <Languages className="h-4 w-4" aria-hidden />
          {lang === "ta" ? "தமிழ் + English" : "Tamil + English"}
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((raw, i) => {
          const ta = summaryCardsTa[i];
          // single-language view respects the site toggle; "both" stacks EN + TA
          const primary = lang === "ta" && ta ? { ...raw, ...ta } : raw;
          return (
            <Reveal key={raw.heading} delay={i * 0.05}>
              <Card as="article" className="h-full">
                <div className="mb-4 inline-flex rounded-xl bg-marina-faint p-3 text-marina dark:bg-marina/20 dark:text-marina-light">
                  <Icon name={raw.icon} className="h-6 w-6" />
                </div>
                {both ? (
                  <>
                    <h3 className="font-display text-lg font-medium">{raw.heading}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70 dark:text-night-text/70">{raw.text}</p>
                    {ta && (
                      <div className="mt-3 border-t border-ink/10 pt-3 dark:border-white/10">
                        <h4 className="font-tamil text-base font-medium text-marina dark:text-marina-light" lang="ta">{ta.heading}</h4>
                        <p className="mt-1 font-tamil text-sm leading-relaxed text-ink/70 dark:text-night-text/70" lang="ta">{ta.text}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className={cn("font-display text-lg font-medium", lang === "ta" && "font-tamil")} lang={lang}>
                      {primary.heading}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
                      {primary.text}
                    </p>
                  </>
                )}
              </Card>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
