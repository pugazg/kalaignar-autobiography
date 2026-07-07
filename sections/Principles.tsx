"use client";

import { declarations, principles } from "@/data/principles";
import { RefChips, Reveal, SectionHeading } from "@/components/shared";
import { useLang } from "@/lib/i18n";

export default function Principles() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <section id="principles" className="mx-auto max-w-content px-4 py-24 sm:px-6" aria-labelledby="principles-label">
      <SectionHeading
        id="principles"
        tamil="ஐம்பெரும் முழக்கங்கள்"
        eyebrow="The founding charter"
        title="The Five Great Declarations"
        lede="Proclaimed by Karunanidhi at a Trichy conference in February 1970 and recorded in his own words in the memoir — the DMK's five great declarations (ஐம்பெரும் முழக்கங்கள்): the charter beneath a movement, from Anna's path to autonomy and federalism."
      />

      {/* The five declarations — the verbatim charter, numbered as he numbered them */}
      <ol className="mb-16 space-y-3">
        {declarations.map((d, i) => (
          <Reveal key={d.id} delay={i * 0.05}>
            <li className="flex gap-4 rounded-2xl border border-marina/20 bg-marina/[0.04] p-5 dark:border-marina/25 dark:bg-marina/10">
              <span className="font-display text-3xl font-semibold text-marina/40 dark:text-marina-light/40">
                {i + 1}
              </span>
              <div>
                <p className="font-tamil text-lg font-medium text-marina dark:text-marina-light" lang="ta">
                  {d.tamil}
                </p>
                <p className="mt-0.5 font-display text-sm text-ink/60 dark:text-night-text/60">{d.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
                  {ta ? d.body.ta : d.body.en}
                </p>
                <div className="mt-2">
                  <RefChips refs={d.refs} />
                </div>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>

      <Reveal>
        <p className="mb-8 text-center font-display text-lg text-ink/70 dark:text-night-text/70">
          {ta ? "இம்முழக்கங்களின் வேர்கள்" : "The roots beneath the declarations"}
        </p>
      </Reveal>

      {/* The deeper founding principles the declarations rest on */}
      <div className="grid gap-5 md:grid-cols-2">
        {principles.map((p, i) => (
          <Reveal key={p.id} delay={(i % 2) * 0.05}>
            <article className="flex h-full flex-col rounded-2xl border border-ink/10 bg-white/70 p-6 dark:border-white/10 dark:bg-night-surface/80">
              <p className="font-tamil text-lg text-marina dark:text-marina-light" lang="ta">{p.tamil}</p>
              <h3 className="font-display text-xl font-medium">{ta ? p.tamil : p.title}</h3>
              {p.motto && (
                <p className="mt-3 border-l-2 border-brass/50 pl-3 font-display text-sm italic text-ink/70 dark:text-night-text/70">
                  {ta ? p.motto.ta : p.motto.en}
                </p>
              )}
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
                {ta ? p.body.ta : p.body.en}
              </p>
              <div className="mt-4">
                <RefChips refs={p.refs} />
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
