"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Feather, Home, Minus, Plus } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import WitnessNote from "@/components/WitnessNote";
import type { WitnessLink } from "@/lib/witness";
import { renderElements } from "@/components/PoemReader";
import type { PoetryItem } from "@/data/poems";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** One reading item inside a poetry publication. Reuses the poem reader's element renderer. */
export default function PublicationItemReader({
  pubSlug,
  pubTitleTa,
  item,
  index,
  total,
  prev,
  next,
  witnessLinks = [],
}: {
  pubSlug: string;
  pubTitleTa: string;
  item: PoetryItem;
  index: number;
  total: number;
  prev: { slug: string; titleTa: string } | null;
  next: { slug: string; titleTa: string } | null;
  witnessLinks?: WitnessLink[];
}) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [font, setFont] = useState(1);
  const [showEn, setShowEn] = useState(false);
  const sizes = ["text-base", "text-lg", "text-xl"];
  const layer = showEn ? item.english : item.tamil;

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={`/poems/${pubSlug}`} className="focus-ring inline-flex items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60 dark:hover:text-marina-light" aria-label={ta ? "தொகுப்புக்குத் திரும்பு" : "Back to the collection"}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> <span className="truncate font-tamil" lang="ta">{pubTitleTa}</span>
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setFont(Math.max(0, font - 1))} disabled={font === 0} className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina disabled:opacity-30 dark:text-night-text/60" aria-label={ta ? "எழுத்து சிறிதாக" : "Smaller text"}>
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <button onClick={() => setFont(Math.min(2, font + 1))} disabled={font === 2} className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina disabled:opacity-30 dark:text-night-text/60" aria-label={ta ? "எழுத்து பெரிதாக" : "Larger text"}>
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-2xl px-5 py-10 sm:px-6">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-brass">
          <Feather className="h-3.5 w-3.5" aria-hidden />
          {ta ? `கவிதை ${item.ordinal} / ${total}` : `Poem ${item.ordinal} of ${total}`}
          {/* The title page's printed item number, where it disagrees with the canonical sequence —
              carried as a source anomaly, never a correction of the ordinal. */}
          {item.printedOrdinal !== undefined && item.printedOrdinal !== item.ordinal && (
            <span className="ml-1 normal-case tracking-normal text-ink/45 dark:text-night-text/45">
              {ta ? `(மூலத்தில் அச்சிடப்பட்ட எண்: ${item.printedOrdinal})` : `(printed in the source as no. ${item.printedOrdinal})`}
            </span>
          )}
        </p>
        <h1 className="mt-3 font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl" lang="ta">
          {item.titleTa}
        </h1>
        <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">{item.titleEn}</p>

        {/* The contents-page witness, where it differs from the title-page (canonical) title. It is a
            SEPARATE SOURCE WITNESS, shown as such — the canonical title above is not corrected from it
            and it is not corrected from the canonical title. */}
        {item.contentsTitleTa && (
          <p className="mt-2 rounded-lg border border-dashed border-ink/15 bg-ink/[0.02] px-3 py-2 text-xs leading-relaxed text-ink/60 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/60" lang="ta">
            {ta ? "பொருளடக்கப் பக்கத்தில் இக்கவிதையின் தலைப்பு: " : "In the contents page this poem's title reads: "}
            <span className="font-tamil text-ink/80 dark:text-night-text/80">{item.contentsTitleTa}</span>
          </p>
        )}

        <WitnessNote links={witnessLinks} />

        <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
          <ShareButtons title={`${item.titleTa} · ${item.titleEn}`} path={`/poems/${pubSlug}/${item.slug}`} />
          <div className="inline-flex overflow-hidden rounded-full border border-brass/50 text-xs font-medium">
            <button onClick={() => setShowEn(false)} className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-brass text-paper" : "text-brass hover:bg-brass/10")} aria-pressed={!showEn} lang="ta">தமிழ்</button>
            <button onClick={() => setShowEn(true)} className={cn("focus-ring px-3 py-1 transition", showEn ? "bg-brass text-paper" : "text-brass hover:bg-brass/10")} aria-pressed={showEn}>English</button>
          </div>
        </div>

        <div
          className={cn("mt-9", showEn ? "font-body" : "font-tamil", sizes[font])}
          lang={showEn ? "en" : "ta"}
          role="group"
          aria-label={ta ? (showEn ? "கவிதை — ஆங்கில மொழிபெயர்ப்பு" : "கவிதை — மூல தமிழ்") : showEn ? "The poem, English translation" : "The poem, Tamil source"}
        >
          {renderElements(layer.elements, ta)}
        </div>

        {/* Prev / next within the publication's canonical order. */}
        <nav className="mt-12 flex items-stretch justify-between gap-3 border-t border-ink/10 pt-6 dark:border-white/10" data-print="hide">
          {prev ? (
            <Link href={`/poems/${pubSlug}/${prev.slug}`} className="focus-ring group flex max-w-[46%] flex-col rounded-lg px-3 py-2 text-left hover:bg-ink/[0.03] dark:hover:bg-white/[0.04]">
              <span className="inline-flex items-center gap-1 text-xs text-ink/45 dark:text-night-text/45"><ChevronLeft className="h-3.5 w-3.5" aria-hidden />{ta ? "முந்தையது" : "Previous"}</span>
              <span className="mt-0.5 truncate font-tamil text-sm text-ink/75 group-hover:text-marina dark:text-night-text/75 dark:group-hover:text-night-text" lang="ta">{prev.titleTa}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/poems/${pubSlug}/${next.slug}`} className="focus-ring group flex max-w-[46%] flex-col items-end rounded-lg px-3 py-2 text-right hover:bg-ink/[0.03] dark:hover:bg-white/[0.04]">
              <span className="inline-flex items-center gap-1 text-xs text-ink/45 dark:text-night-text/45">{ta ? "அடுத்தது" : "Next"}<ChevronRight className="h-3.5 w-3.5" aria-hidden /></span>
              <span className="mt-0.5 truncate font-tamil text-sm text-ink/75 group-hover:text-marina dark:text-night-text/75 dark:group-hover:text-night-text" lang="ta">{next.titleTa}</span>
            </Link>
          ) : <span />}
        </nav>

        <p className="mt-6 text-center text-xs text-ink/45 dark:text-night-text/45" data-print="hide">
          <Link href={`/poems/${pubSlug}/source`} className="focus-ring rounded underline decoration-dotted underline-offset-2 hover:text-marina dark:hover:text-marina-light">
            {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
          </Link>
        </p>
      </article>
    </div>
  );
}
