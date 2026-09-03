"use client";

import Link from "next/link";
import { BookOpen, Feather, Home, Layers } from "lucide-react";
import { useLang } from "@/lib/i18n";

export type PublicationItemBrief = {
  ordinal: number;
  slug: string;
  titleTa: string;
  contentsTitleTa?: string;
  titleEn: string;
  printedOrdinal?: number;
  scanFirst: number;
  scanLast: number;
};

export type PublicationBrief = {
  slug: string;
  titleTa: string;
  titleEn: string;
  authorTa: string;
  authorEn: string;
  editionStatement: string | null;
  publicationYear: number | null;
  itemCount: number;
  items: PublicationItemBrief[];
};

/** The publication landing: source-backed publication info and all reading items, in canonical order. */
export default function PublicationLanding({ pub }: { pub: PublicationBrief }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 dark:border-white/10">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
          <div className="flex items-center gap-3 text-xs text-ink/60 dark:text-night-text/60">
            <Link href="/read" className="focus-ring inline-flex items-center gap-1 rounded p-1 hover:text-marina dark:hover:text-marina-light">
              <Home className="h-3.5 w-3.5" aria-hidden /> {ta ? "மின்னூலகம்" : "Library"}
            </Link>
          </div>
          <p className="mt-5 flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-brass">
            <Feather className="h-3.5 w-3.5" aria-hidden /> {ta ? "கவிதைத் தொகுப்பு" : "Poetry collection"}
          </p>
          <h1 className="mt-3 font-tamil text-3xl font-semibold leading-snug text-ink dark:text-night-text sm:text-4xl" lang="ta">{pub.titleTa}</h1>
          <p className="mt-1 font-display text-xl text-ink/65 dark:text-night-text/65">{pub.titleEn}</p>
          <p className="mt-2 text-sm text-ink/60 dark:text-night-text/60" lang={lang}>{ta ? pub.authorTa : pub.authorEn}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/55 dark:text-night-text/55">
            <span className="inline-flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" aria-hidden />{ta ? `${pub.itemCount} கவிதைகள்` : `${pub.itemCount} poems`}</span>
            {pub.editionStatement && <span lang="ta">{pub.editionStatement}</span>}
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/65 dark:text-night-text/65" lang={lang}>
            {ta
              ? "இந்த நூலின் எண்ணிடப்பட்ட முதல் பாகத்தில் உள்ள 58 கவிதைகள். ஒவ்வொன்றும் தனித்தனியே வாசிக்கலாம்; கீழே வரிசைப்படி பட்டியலிடப்பட்டுள்ளன."
              : "The 58 poems of this book's numbered first part. Each can be read on its own; they are listed below in the book's order."}
          </p>
          <p className="mt-4 text-xs text-ink/50 dark:text-night-text/50" data-print="hide">
            <Link href={`/poems/${pub.slug}/source`} className="focus-ring rounded underline decoration-dotted underline-offset-2 hover:text-marina dark:hover:text-marina-light">
              <BookOpen className="mr-1 inline h-3.5 w-3.5" aria-hidden />{ta ? "மூலமும் சான்றும்" : "Source & provenance"}
            </Link>
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
        <ol className="divide-y divide-ink/8 dark:divide-white/8">
          {pub.items.map((it) => (
            <li key={it.slug}>
              <Link href={`/poems/${pub.slug}/${it.slug}`} className="focus-ring group flex items-baseline gap-3 rounded-lg px-2 py-3 hover:bg-ink/[0.03] dark:hover:bg-white/[0.04]">
                <span className="w-7 shrink-0 text-right font-body text-sm tabular-nums text-ink/40 dark:text-night-text/40">{it.ordinal}</span>
                <span className="min-w-0">
                  <span className="block font-tamil text-[15px] text-ink/85 group-hover:text-marina dark:text-night-text/85 dark:group-hover:text-night-text" lang="ta">{it.titleTa}</span>
                  <span className="mt-0.5 block text-xs text-ink/50 dark:text-night-text/50">{it.titleEn}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
