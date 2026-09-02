"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Home, Info, Newspaper } from "lucide-react";
import type { EssayPublication } from "@/data/essays";
import { useLang } from "@/lib/i18n";
import { Fragment } from "react";
import { articleNumberingNote, editionRows, printedPagesLabel, scanRunsLabel } from "@/lib/essay-source-facts";

// The publication landing: title, author, source-edition context and the source-numbered table of
// contents. The publication is ONE catalog work; its 14 articles are reading units inside it.
export default function EssayLanding({ pub }: { pub: EssayPublication }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const first = pub.articles[0];

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 bg-mist/40 dark:border-white/10 dark:bg-night-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
          <div className="flex items-center gap-3 text-xs text-ink/60 dark:text-night-text/60">
            <Link href="/read" className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {ta ? "மின்னூலகம்" : "The library"}
            </Link>
            <Link href="/" className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light" aria-label="Home">
              <Home className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <p className="mt-5 flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-marina dark:text-marina-light">
            <Newspaper className="h-3.5 w-3.5" aria-hidden /> {ta ? "கட்டுரைகள்" : "Essays & Articles"}
          </p>
          <h1 className="mt-2 font-tamil text-3xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">
            {pub.title.ta}
          </h1>
          <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">{pub.title.en}</p>
          <p className="mt-2 text-sm text-ink/60 dark:text-night-text/60" lang={ta ? "ta" : "en"}>
            {ta ? pub.author.ta : pub.author.en}
          </p>

          {/* EDITION CONTEXT — source-form aware. Where the publication was reprinted, the first
              edition and the CONTROLLING scanned edition are shown as two distinct facts so the
              reprint is never read as a scan of the original. Where the controlling scan IS the
              first edition — every Wave-3 pamphlet — exactly one row is shown, and the publication
              is never described as following a reprint it does not have. */}
          {editionRows(pub, ta).length > 0 && (
            <dl className="mt-4 grid gap-1 text-xs text-ink/55 dark:text-night-text/55 sm:grid-cols-[auto_1fr] sm:gap-x-3">
              {editionRows(pub, ta).map((row) => (
                <Fragment key={row.label}>
                  <dt>{row.label}</dt>
                  <dd className="font-tamil sm:mb-0" lang="ta">{row.value}</dd>
                </Fragment>
              ))}
            </dl>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/essays/${pub.slug}/articles/${first.slug}`}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-marina px-4 py-1.5 text-sm font-medium text-paper hover:bg-marina/90"
            >
              <BookOpen className="h-4 w-4" aria-hidden /> {ta ? "வாசிக்கத் தொடங்கு" : "Start reading"}
            </Link>
            <Link href={`/essays/${pub.slug}/source`} className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-1.5 text-sm hover:border-marina/50 dark:border-white/15">
              <Info className="h-4 w-4 text-marina" aria-hidden /> {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-marina dark:text-marina-light">
          {pub.articleCount === 1
            ? (ta ? "கட்டுரை" : "The essay")
            : ta
              ? `பொருளடக்கம் — ${pub.articleCount} கட்டுரைகள்`
              : `Contents — ${pub.articleCount} articles`}
        </h2>
        {/* The ordinals shown here are printed contents-page numbers for one publication and the
            archive's reading ordinals for the Wave-3 pamphlets, which print no contents page. The
            note says which, so an archive ordinal is never read as a printed one. */}
        <p className="mt-1 text-[11px] text-ink/45 dark:text-night-text/45">{articleNumberingNote(pub, ta)}</p>
        <ol className="mt-3">
          {pub.articles.map((a) => (
            <li key={a.slug} className="border-b border-ink/5 last:border-0 dark:border-white/5">
              <Link
                href={`/essays/${pub.slug}/articles/${a.slug}`}
                className="focus-ring group flex gap-3 rounded py-3 hover:text-marina dark:hover:text-marina-light"
              >
                <span className="w-6 shrink-0 pt-0.5 text-right text-xs tabular-nums text-ink/40 dark:text-night-text/40">{a.number}</span>
                <span className="min-w-0">
                  <span className="block font-tamil text-[0.98rem] leading-snug text-ink/90 dark:text-night-text/90" lang="ta">
                    {a.titleTa}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink/55 dark:text-night-text/55">{a.titleEn}</span>
                  {/* Printed pagination where the source shows it; the scan coverage otherwise.
                      Never an empty or fabricated range. */}
                  <span className="mt-0.5 block text-[11px] text-ink/40 dark:text-night-text/40">
                    {printedPagesLabel(a.printedPages, ta) ?? scanRunsLabel(a, ta)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
