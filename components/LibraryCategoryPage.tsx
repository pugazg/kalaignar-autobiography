"use client";

import type { ReactNode } from "react";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ShelfId } from "@/data/library";
import { categoryForShelf, shelfForCategory, worksInCategory } from "@/data/read-categories";
import { useLang } from "@/lib/i18n";
import { WorkCard } from "./LibraryHome";

/**
 * One Reading Room category page (/read/<category>) — Reading Room IA v2, stage R2-A.
 *
 * Lists EVERY published canonical work on the shelf, individually, in catalogue order. There is no
 * disclosure cap, no sort and no pagination: Fiction shows all its works and Speeches all its works,
 * including every member of a collection — collection membership never suppresses a work here.
 *
 * The cards are the /read landing's own `WorkCard`, so a work looks and links the same on both surfaces.
 *
 * `corpus` is an optional server-rendered slot, used only by Letters: that category's single work is a
 * corpus, and its summary is derived from the Murasoli data on the server (see LettersCorpusSummary). It is
 * passed in as an element for the same reason /read passes in its Daily Kural — this is a client component.
 */
export default function LibraryCategoryPage({ shelf, corpus }: { shelf: ShelfId; corpus?: ReactNode }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const category = categoryForShelf(shelf);
  const labels = shelfForCategory(shelf);
  const works = worksInCategory(shelf);

  const backLink = (
    <Link
      href="/read"
      className="focus-ring inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {ta ? "மின்னூலகத்துக்குத் திரும்பு" : "Back to the Library"}
    </Link>
  );

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text" data-category={category.slug}>
      <header className="border-b border-ink/10 bg-mist/40 dark:border-white/10 dark:bg-night-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
          {backLink}
          <p className="mt-5 font-tamil text-sm text-marina/80 dark:text-marina-light/80" lang="ta">
            கலைஞர் மின்னூலகம்
          </p>
          <h1 className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-tamil text-3xl font-medium" lang="ta">
              {labels.ta}
            </span>
            <span className="font-display text-2xl font-medium tracking-tight text-ink/70 dark:text-night-text/70">
              {labels.en}
            </span>
          </h1>
          <p className="mt-3 text-sm tabular-nums text-ink/65 dark:text-night-text/65" data-testid="category-work-count">
            {ta
              ? `${works.length} ${works.length === 1 ? "படைப்பு" : "படைப்புகள்"}`
              : `${works.length} ${works.length === 1 ? "work" : "works"}`}
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <section aria-labelledby="category-works" className="mb-10">
          <h2
            id="category-works"
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/65 dark:text-night-text/65"
          >
            {ta ? (
              <span className="font-tamil text-sm normal-case tracking-normal" lang="ta">
                படைப்புகள்
              </span>
            ) : (
              "Works"
            )}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2" data-testid="category-works">
            {works.map((w) => (
              <WorkCard key={w.id} work={w} ta={ta} />
            ))}
          </div>
        </section>

        {corpus}

        <p className="mt-12">{backLink}</p>
      </main>
    </div>
  );
}
