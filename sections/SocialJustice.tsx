"use client";

import { reservationArc, justicePillars } from "@/data/socialjustice";
import { RefChips, Reveal, SectionHeading } from "@/components/shared";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function SocialJustice() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <section id="socialjustice" className="mx-auto max-w-content px-4 py-24 sm:px-6" aria-labelledby="socialjustice-label">
      <SectionHeading
        id="socialjustice"
        tamil="சமூக நீதி"
        eyebrow="The founding purpose"
        title="Social justice — more than reservation"
        lede="For Kalaignar social justice was never quotas alone: it was reservation joined to welfare, to Tamil self-respect, to women's empowerment, to the dismantling of ritual hierarchy. The interlocking pillars below, and the reservation arc the memoir documents."
      />

      {/* The interlocking pillars */}
      <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {justicePillars.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 0.05}>
            <article className="flex h-full flex-col rounded-2xl border border-ink/10 bg-white/70 p-5 dark:border-white/10 dark:bg-night-surface/80">
              <p className="font-tamil text-lg text-marina dark:text-marina-light" lang="ta">{p.tamil}</p>
              <h3 className="font-display text-lg font-medium">{ta ? p.tamil : p.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
                {ta ? p.note.ta : p.note.en}
              </p>
              <div className="mt-3"><RefChips refs={p.refs} /></div>
            </article>
          ))}
        </div>

      {/* The reservation arc */}
      <Reveal>
        <h3 className="mb-6 text-center font-display text-xl font-medium">
          {ta ? "இட ஒதுக்கீட்டின் வளர்ச்சி" : "How reservation evolved"}
        </h3>
      </Reveal>
      <ol className="mx-auto max-w-3xl space-y-3">
        {reservationArc.map((r, i) => (
          <Reveal key={r.year} delay={i * 0.04}>
            <li className={cn(
              "flex gap-4 rounded-2xl border p-5",
              r.inMemoir
                ? "border-marina/20 bg-marina/[0.04] dark:border-marina/25 dark:bg-marina/10"
                : "border-dashed border-ink/15 bg-transparent dark:border-white/15",
            )}>
              <span className="font-display text-lg font-semibold text-brass whitespace-nowrap">{r.year}</span>
              <div>
                <p className={cn("font-medium", ta ? "font-tamil" : "")} lang={ta ? "ta" : undefined}>
                  {ta ? r.label.ta : r.label.en}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
                  {ta ? r.detail.ta : r.detail.en}
                </p>
                {r.inMemoir ? (
                  <div className="mt-2"><RefChips refs={r.refs} /></div>
                ) : (
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-ink/40 dark:text-night-text/40">
                    {ta ? "நினைவேட்டுக்குப் பிந்தையது" : "After the memoir's timeline"}
                  </p>
                )}
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
