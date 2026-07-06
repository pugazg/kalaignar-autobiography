"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { governance, govKindLabels, govTerms, type GovKind } from "@/data/governance";
import { RefChips, Reveal, SectionHeading } from "@/components/shared";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const KINDS = ["all", ...Array.from(new Set(governance.map((g) => g.kind)))] as const;

export default function Governance() {
  const [kind, setKind] = useState<string>("all");
  const { lang } = useLang();
  const t = (o: { en: string; ta: string }) => (lang === "ta" ? o.ta : o.en);

  const visibleTerms = govTerms
    .map((term) => ({
      term,
      entries: governance.filter((g) => g.term === term.id && (kind === "all" || g.kind === kind)),
    }))
    .filter((x) => x.entries.length > 0);

  return (
    <section id="governance" className="bg-mist/40 py-24 dark:bg-night-surface/40" aria-labelledby="governance-label">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading
          id="governance"
          tamil="சட்டங்களும் திட்டங்களும்"
          eyebrow="The governance ledger"
          title="Laws, schemes — and the record he kept himself"
          lede="Thirty entries the memoir itself records, from the Tamil Nadu renaming resolution to Sethusamudram — grouped by term of office, every one anchored to the chapter where the book keeps its own account."
        />

        <div className="mb-10 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Filter by kind">
          {KINDS.map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                kind === k
                  ? "bg-marina text-paper"
                  : "border border-ink/10 text-ink/60 hover:border-marina/50 hover:text-marina dark:border-white/10 dark:text-night-text/60",
              )}
              aria-pressed={kind === k}
            >
              {k === "all"
                ? lang === "ta" ? "அனைத்தும்" : "All"
                : t(govKindLabels[k as GovKind])}
            </button>
          ))}
        </div>

        <div className="space-y-10">
          {visibleTerms.map(({ term, entries }, ti) => (
            <Reveal key={term.id} delay={ti * 0.04}>
              <div>
                <h3 className="mb-4 flex items-center gap-3 font-display text-lg font-medium text-ink/80 dark:text-night-text/80">
                  <span className="h-px w-8 bg-brass/60" aria-hidden />
                  {t(term)}
                </h3>
                <ol className="grid gap-4 md:grid-cols-2">
                  {entries.map((g) => (
                    <li
                      key={g.id}
                      className="flex h-full flex-col rounded-2xl border border-ink/10 bg-white/70 p-5 dark:border-white/10 dark:bg-night-surface/80"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className={cn("font-medium leading-snug", lang === "ta" ? "font-tamil text-lg" : "font-display text-lg")} lang={lang}>
                          {t(g.name)}
                        </p>
                        <span className="shrink-0 rounded-full bg-brass/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brass">
                          {t(govKindLabels[g.kind])}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink/45 dark:text-night-text/45">{g.year}</p>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
                        {t(g.note)}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink/10 pt-3 dark:border-white/10">
                        <RefChips refs={g.refs} />
                        <Link
                          href={`/read/${g.refs[0]}`}
                          className="focus-ring inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-marina underline-offset-2 hover:underline dark:text-marina-light"
                          aria-label={`Read the source chapter for ${g.name.en}`}
                        >
                          <BookOpen className="h-3 w-3" aria-hidden />
                          {lang === "ta" ? "மூலத்தில் வாசிக்க" : "Read the source"}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
