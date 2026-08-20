"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Home, Info, Newspaper } from "lucide-react";
import type { EssayPublication } from "@/data/essays";
import { useLang } from "@/lib/i18n";

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

          {/* EDITION CONTEXT — the first edition and the CONTROLLING scanned edition are shown as
              two distinct facts. The integrated source is the 2018 reprint; it is never presented
              as a 1956 scan, and the 1956 history is never dropped. */}
          <dl className="mt-4 grid gap-1 text-xs text-ink/55 dark:text-night-text/55 sm:grid-cols-[auto_1fr] sm:gap-x-3">
            <dt>{ta ? "முதற்பதிப்பு" : "First edition"}</dt>
            <dd className="font-tamil sm:mb-0" lang="ta">{pub.firstEdition.statementTa}</dd>
            <dt>{ta ? "பயன்படுத்திய பதிப்பு" : "Edition used here"}</dt>
            <dd className="font-tamil" lang="ta">
              {pub.controllingEdition.statementTa} · {pub.controllingEdition.publisherLineTa}
            </dd>
          </dl>

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
          {ta ? `பொருளடக்கம் — ${pub.articleCount} கட்டுரைகள்` : `Contents — ${pub.articleCount} articles`}
        </h2>
        {/* Article numbers 1–14 are shown because the PRINTED contents page numbers them; this is
            source-supported publication ordering, not archive-created navigation numbering. */}
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
                  <span className="mt-0.5 block text-[11px] text-ink/40 dark:text-night-text/40">
                    {ta ? "அச்சுப் பக்கம்" : "printed"} {a.printedPages.from}–{a.printedPages.to}
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
