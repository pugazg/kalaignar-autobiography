"use client";

import { ExternalLink, GraduationCap, ShieldAlert } from "lucide-react";
import { scholarship, scholarshipNote } from "@/data/scholarship";
import { Reveal, SectionHeading } from "@/components/shared";
import { useLang } from "@/lib/i18n";

export default function Scholarship() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <section id="scholarship" className="bg-mist/40 py-24 dark:bg-night-surface/40" aria-labelledby="scholarship-label">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading
          id="scholarship"
          tamil="ஆய்வுக் கட்டுரைகள்"
          eyebrow="Secondary readings"
          title="Scholarship on the memoir"
          lede="Academic writing about Nenjukku Neethi, shelved separately from the archive itself. These are external readings — reviewed before listing, but their claims remain their authors' own."
        />

        <Reveal>
          <div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-dashed border-brass/50 bg-brass/5 p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brass" aria-hidden />
              <p className="text-sm leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
                {ta ? scholarshipNote.ta : scholarshipNote.en}
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mx-auto max-w-3xl space-y-6">
          {scholarship.map((s, i) => (
            <Reveal key={s.id} delay={(i % 2) * 0.05}>
              <article className="rounded-2xl border border-ink/10 bg-white/70 p-6 dark:border-white/10 dark:bg-night-surface/80">
                <div className="flex items-start gap-3">
                  <GraduationCap className="mt-1 h-6 w-6 shrink-0 text-marina dark:text-marina-light" aria-hidden />
                  <div>
                    <h3 className="font-display text-lg font-semibold leading-snug">{s.title}</h3>
                    <p className="mt-1 text-sm text-ink/60 dark:text-night-text/60">
                      {s.author}
                      {s.affiliation ? ` · ${s.affiliation}` : ""} · {s.venue} · {s.year}
                      {s.pages ? ` · ${s.pages}` : ""}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-ink/75 dark:text-night-text/75" lang={lang}>
                  {ta ? s.summary.ta : s.summary.en}
                </p>

                {s.memoirCites && (
                  <p className="mt-3 text-xs leading-relaxed text-ink/55 dark:text-night-text/55" lang={lang}>
                    {ta ? s.memoirCites.ta : s.memoirCites.en}
                  </p>
                )}

                {s.caveat && (
                  <p className="mt-3 rounded-lg border border-dashed border-ink/20 px-3 py-2 text-xs leading-relaxed text-ink/60 dark:border-white/20 dark:text-night-text/60" lang={lang}>
                    {ta ? s.caveat.ta : s.caveat.en}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-marina/40 px-3 py-1 text-xs font-medium text-marina transition hover:bg-marina hover:text-paper dark:text-marina-light"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    {ta ? "மூலக் கட்டுரை (SSRN)" : "Read the paper (SSRN)"}
                  </a>
                  {s.doi && (
                    <span className="text-xs text-ink/50 dark:text-night-text/50">DOI: {s.doi}</span>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
