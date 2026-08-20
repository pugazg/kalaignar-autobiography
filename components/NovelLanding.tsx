"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Film, Home, Info } from "lucide-react";
import type { Novel } from "@/data/novels";
import { useLang } from "@/lib/i18n";

// The novel's landing page: identity, edition facts and the three assembled reading sections.
export default function NovelLanding({ novel }: { novel: Novel }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const first = novel.sections[0];

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
            <BookOpen className="h-3.5 w-3.5" aria-hidden /> {ta ? "புனைகதை" : "Fiction"}
          </p>
          <h1 className="mt-2 font-tamil text-3xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">
            {novel.title.ta}
          </h1>
          <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">{novel.title.en}</p>
          <p className="mt-2 text-sm text-ink/60 dark:text-night-text/60" lang={ta ? "ta" : "en"}>
            {ta ? novel.author.ta : novel.author.en}
          </p>

          {/* Edition facts exactly as the scan prints them. */}
          <dl className="mt-4 grid gap-1 text-xs text-ink/55 dark:text-night-text/55 sm:grid-cols-[auto_1fr] sm:gap-x-3">
            <dt>{ta ? "பதிப்பு" : "Edition"}</dt>
            <dd className="font-tamil" lang="ta">{novel.edition.statementTa}</dd>
            <dt>{ta ? "பதிப்பகம்" : "Publisher"}</dt>
            <dd className="font-tamil" lang="ta">{novel.edition.publisherTa}, {novel.edition.placeTa} ({novel.edition.districtTa})</dd>
            <dt>{ta ? "தொடர்" : "Series"}</dt>
            <dd className="font-tamil" lang="ta">{novel.edition.seriesTa}</dd>
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href={`/novels/${novel.slug}/${first.slug}`} className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-marina px-4 py-1.5 text-sm font-medium text-paper hover:bg-marina/90">
              <BookOpen className="h-4 w-4" aria-hidden /> {ta ? "வாசிக்கத் தொடங்கு" : "Start reading"}
            </Link>
            <Link href={`/novels/${novel.slug}/source`} className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-1.5 text-sm hover:border-marina/50 dark:border-white/15">
              <Info className="h-4 w-4 text-marina" aria-hidden /> {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-marina dark:text-marina-light">
          {ta ? `பகுதிகள் — ${novel.sectionCount}` : `Sections — ${novel.sectionCount}`}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-ink/55 dark:text-night-text/55" lang={ta ? "ta" : "en"}>
          {ta
            ? "இது ஒரே தொடர்ச்சியான படைப்பு. கீழுள்ள பகுதிகளும் அவற்றின் தலைப்புகளும் மூலக் காப்பகத்தின் வாசிப்புத் தொகுப்பின் பிரிவுகளும் விளக்கக் குறிப்புகளுமே; 1947 பதிப்பின் அத்தியாயங்களோ அச்சுத் தலைப்புகளோ அல்ல."
            : "This is one continuous work. The sections below — and their titles — are the source archive's own assembled reading divisions and descriptive labels, not chapters or printed headings of the 1947 edition."}
        </p>
        <ol className="mt-3">
          {novel.sections.map((s) => (
            <li key={s.slug} className="border-b border-ink/5 last:border-0 dark:border-white/5">
              <Link href={`/novels/${novel.slug}/${s.slug}`} className="focus-ring flex gap-3 rounded py-3 hover:text-marina dark:hover:text-marina-light">
                <span className="w-5 shrink-0 pt-0.5 text-right text-xs tabular-nums text-ink/40 dark:text-night-text/40">{s.order}</span>
                <span className="min-w-0">
                  <span className="block font-tamil text-[0.98rem] leading-snug text-ink/90 dark:text-night-text/90" lang="ta">{s.titleTa}</span>
                  <span className="mt-0.5 block text-sm text-ink/55 dark:text-night-text/55">{s.titleEn}</span>
                  {s.isEmbeddedSequence && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-marina/80 dark:text-marina-light/80" lang={ta ? "ta" : "en"}>
                      <Film className="h-3 w-3" aria-hidden />
                      {ta ? "நூலுக்குள் அமைந்த திரைப்படக் காட்சி — தனி நூல் அல்ல" : "internal cinematic sequence — not a separate work"}
                    </span>
                  )}
                  <span className="mt-0.5 block text-[11px] text-ink/40 dark:text-night-text/40">
                    {ta ? "மூல ஸ்கேன்" : "scans"} {s.sourceScansTa}
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
