"use client";

import { BookMarked, BookOpen, BookText, Clapperboard, Feather, Flower2, Home, Library, Mail, Mic, Newspaper, Theater } from "lucide-react";
import Link from "next/link";
import { type LibraryPublication, type LibraryWork, type ShelfId } from "@/data/library";
import { type LibraryCollection } from "@/data/collections";
import { READ_CATEGORIES, collectionsInCategory, shelfForCategory, worksInCategory, type ReadCategory } from "@/data/read-categories";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

// Global Kalaignar Digital Library landing page (/read). Since Reading Room IA v2 R2-B it is CATEGORY-FIRST: exactly
// nine category cards, one per shelf, each linking to its category page (/read/<category>), which lists every
// canonical work. The landing itself renders no work card, no collection card and no Daily Kural. Routes come from the
// category registry (data/read-categories.ts); labels from `SHELVES`; counts are derived, never typed.
//
// The historical discovery view (collection-substituted entries under a 6-per-shelf disclosure) is retired from this
// page. Its data model, `discoveryShelves()` in data/collections.ts, is kept unchanged for the validators that record
// it. `WorkCard` and `CollectionCard` stay here as the shared card presentation reused by the category pages.

// Per-shelf presentation (UI only — kept out of the data model). Icons for the six
// currently-empty shelves are pre-mapped so Phase-2+ works render without changes.
export const shelfIcon: Record<ShelfId, typeof BookOpen> = {
  "life-writing": BookText,
  letters: Mail,
  fiction: BookOpen,
  poetry: Feather,
  drama: Theater,
  "cinema-writing": Clapperboard,
  speeches: Mic,
  "essays-articles": Newspaper,
  "literary-commentary": Flower2,
};

// Two accents from the existing design language: brass for commentary, marina otherwise.
export const accentFor = (shelf: ShelfId) =>
  shelf === "literary-commentary" || shelf === "poetry" || shelf === "essays-articles"
    ? {
        border: "border-brass/30 hover:border-brass/60",
        icon: "text-brass",
        title: "group-hover:text-brass",
      }
    : {
        border: "border-marina/30 hover:border-marina/60",
        icon: "text-marina dark:text-marina-light",
        title: "group-hover:text-marina dark:group-hover:text-marina-light",
      };

/**
 * One catalogue work card, visually unchanged. Since R2-B it is rendered by the category pages
 * (components/LibraryCategoryPage.tsx), not by this landing; it lives here so both surfaces share one card.
 */
export function WorkCard({ work, ta }: { work: LibraryWork; ta: boolean }) {
  const a = accentFor(work.shelf);
  const Icon = shelfIcon[work.shelf] ?? BookOpen;
  const desc = ta ? work.descTa : work.descEn;
  return (
    <Link
      href={work.href}
      className={cn(
        "focus-ring group flex flex-col rounded-2xl border bg-white/60 p-4 transition dark:bg-night-surface/60",
        a.border,
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", a.icon)} aria-hidden />
      <span className="mt-2 font-tamil text-[15px] font-medium" lang="ta">
        <span className={a.title}>{work.titleTa}</span>
      </span>
      {/* The English line is a TRANSLATED title. Where no English title is approved upstream, the
          catalogue's English slot falls back to the canonical Tamil title rather than to an invented
          translation, and repeating it here would render that title as its own translation. */}
      {work.titleEn !== work.titleTa && (
        <span className="mt-0.5 text-xs text-ink/50 dark:text-night-text/50">{work.titleEn}</span>
      )}
      {desc && (
        <span className="mt-1.5 text-xs leading-snug text-ink/55 dark:text-night-text/55" lang={ta ? "ta" : undefined}>
          {desc}
        </span>
      )}
    </Link>
  );
}

/**
 * A collection's discovery card — the same card family as a work, one step heavier.
 *
 * It has to read as a DIFFERENT KIND of thing without becoming a different design: it spans the grid,
 * carries a stacked-books icon, and states its own member count and printed edition. None of that is
 * colour-only — the "Collection" label and the count line carry the distinction in text, so the card
 * still reads as a collection with colour unavailable.
 *
 * `1977` appears here because `முதல் பதிப்பு: 1977` is the anthology's own printed edition statement.
 * It is a fact about the PUBLICATION and is never pushed down onto a member story as its own first
 * publication date, which the source records deliberately keep apart.
 */
export function CollectionCard({ collection, ta }: { collection: LibraryCollection; ta: boolean }) {
  const a = accentFor(collection.shelf);
  const desc = ta ? collection.descTa : collection.descEn;
  const count = collection.memberCount;
  return (
    <Link
      href={collection.href}
      // dark:focus-visible:ring-night-text/70 for the same reason the Phase-0 disclosure needed it:
      // .focus-ring draws ring-marina, which is 2.5:1 against the dark page and offset — under the 3:1
      // WCAG 1.4.11 asks of an author-supplied focus indicator. The shared utility is untouched; this
      // new control overrides only its dark ring colour.
      className={cn(
        "focus-ring group flex flex-col rounded-2xl border bg-white/60 p-4 transition sm:col-span-2 dark:bg-night-surface/60 dark:focus-visible:ring-night-text/70",
        a.border,
      )}
    >
      <span className="flex items-center gap-2">
        <Library className={cn("h-5 w-5 shrink-0", a.icon)} aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/65 dark:text-night-text/65">
          {ta ? "தொகுப்பு" : "Collection"}
        </span>
      </span>
      {/* NOT `a.title`. accentFor()'s hover is `dark:group-hover:text-marina-light`, and #1B7F87 on
          this card's dark surface is 3.8:1 — under 4.5:1 for a title this size. accentFor() is shared
          with all 71 work cards and is not this PR's to change, so the hover is written locally.

          BOTH HALVES ARE STATED. `group-hover:text-marina` alone is not a light-mode rule — it applies
          in dark too, where it would override the inherited night-text and hover the title down to
          #0E5D63 on a #10171E card. The dark half is therefore explicit: marina in light (7.10:1),
          full night-text in dark (14.66:1), with the border hover carrying the cue in both. */}
      <span
        className="mt-2 font-tamil text-[17px] font-medium group-hover:text-marina dark:group-hover:text-night-text"
        lang="ta"
      >
        {collection.titleTa}
      </span>
      <span className="mt-0.5 text-xs text-ink/65 dark:text-night-text/65">{collection.titleEn}</span>
      <span className="mt-1.5 text-xs tabular-nums text-ink/65 dark:text-night-text/65">
        {collection.editionStatementTa && (
          <>
            <span className="font-tamil" lang="ta">
              {collection.editionStatementTa}
            </span>
            {" \u00b7 "}
          </>
        )}
        {count.value}{" "}
        {ta ? (
          <span className="font-tamil" lang="ta">
            {count.labelTa}
          </span>
        ) : (
          count.labelEn
        )}
      </span>
      {desc && (
        <span className="mt-1.5 text-xs leading-snug text-ink/65 dark:text-night-text/65" lang={ta ? "ta" : undefined}>
          {desc}
        </span>
      )}
    </Link>
  );
}

/**
 * A SOURCE PUBLICATION card (Reading Room IA v2 R3): a printed book whose units are canonical works or witnesses, shown
 * in a category page's secondary Publications section. Deliberately not a WorkCard — it states "Publication" in text
 * (not colour alone) and its unit count, and it links the publication's existing contents page.
 * The title hover and dark focus ring follow CollectionCard's measured local treatment.
 */
export function PublicationCard({ publication, ta }: { publication: LibraryPublication; ta: boolean }) {
  const a = accentFor(publication.shelf);
  const desc = ta ? publication.descTa : publication.descEn;
  const count = publication.unitCount;
  return (
    <Link
      href={publication.href}
      data-testid="publication-card"
      className={cn(
        "focus-ring group flex flex-col rounded-2xl border bg-white/60 p-4 transition sm:col-span-2 dark:bg-night-surface/60 dark:focus-visible:ring-night-text/70",
        a.border,
      )}
    >
      <span className="flex items-center gap-2">
        <BookMarked className={cn("h-5 w-5 shrink-0", a.icon)} aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/65 dark:text-night-text/65">
          {ta ? "நூல்" : "Publication"}
        </span>
      </span>
      <span className="mt-2 font-tamil text-[17px] font-medium group-hover:text-marina dark:group-hover:text-night-text" lang="ta">
        {publication.titleTa}
      </span>
      <span className="mt-0.5 text-xs text-ink/65 dark:text-night-text/65">{publication.titleEn}</span>
      {(publication.edition || count) && (
        <span className="mt-1.5 text-xs tabular-nums text-ink/65 dark:text-night-text/65">
          {publication.edition && (
            <span className="font-tamil" lang="ta">
              {publication.edition}
            </span>
          )}
          {publication.edition && count && " \u00b7 "}
          {count && (
            <>
              {count.value}{" "}
              {ta ? (
                <span className="font-tamil" lang="ta">
                  {count.labelTa}
                </span>
              ) : (
                count.labelEn
              )}
            </>
          )}
        </span>
      )}
      {desc && (
        <span className="mt-1.5 text-xs leading-snug text-ink/65 dark:text-night-text/65" lang={ta ? "ta" : undefined}>
          {desc}
        </span>
      )}
    </Link>
  );
}

/**
 * One /read category card: the shelf's labels, its icon, and its CANONICAL WORK COUNT as the primary figure.
 *
 * The collection count is secondary metadata, appended only where the shelf has collections (Fiction, Speeches) —
 * a collection never replaces its members, and the old collection-substituted "discovery entry" count is never
 * shown. Both numbers are derived from the catalogue and the collection registry at render time.
 *
 * The title hover is written locally rather than taken from accentFor(): its dark half
 * (`dark:group-hover:text-marina-light`) measures 3.8:1 on this card's dark surface, under 4.5:1 for a title this
 * size — the same local treatment CollectionCard uses. The dark focus ring is overridden to night-text/70 because
 * `.focus-ring`'s ring-marina is 2.5:1 against the dark page, under the 3:1 WCAG 1.4.11 asks of it.
 */
export function CategoryCard({ category, ta }: { category: ReadCategory; ta: boolean }) {
  const a = accentFor(category.shelf);
  const Icon = shelfIcon[category.shelf] ?? BookOpen;
  const labels = shelfForCategory(category.shelf);
  const works = worksInCategory(category.shelf).length;
  const collections = collectionsInCategory(category.shelf).length;
  const count = ta
    ? `${works} ${works === 1 ? "படைப்பு" : "படைப்புகள்"}` +
      (collections > 0 ? ` \u00b7 ${collections} ${collections === 1 ? "தொகுப்பு" : "தொகுப்புகள்"}` : "")
    : `${works} ${works === 1 ? "work" : "works"}` +
      (collections > 0 ? ` \u00b7 ${collections} ${collections === 1 ? "collection" : "collections"}` : "");
  return (
    <Link
      href={category.route}
      data-testid="read-category-card"
      data-shelf={category.shelf}
      className={cn(
        "focus-ring group flex h-full flex-col rounded-2xl border bg-white/60 p-4 transition dark:bg-night-surface/60 dark:focus-visible:ring-night-text/70",
        a.border,
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", a.icon)} aria-hidden />
      <span
        className="mt-2 font-tamil text-[17px] font-medium group-hover:text-marina dark:group-hover:text-night-text"
        lang="ta"
      >
        {labels.ta}
      </span>
      <span className="mt-0.5 text-xs text-ink/65 dark:text-night-text/65">{labels.en}</span>
      <span
        className="mt-1.5 text-xs tabular-nums text-ink/65 dark:text-night-text/65"
        lang={ta ? "ta" : undefined}
        data-testid="read-category-count"
      >
        {count}
      </span>
    </Link>
  );
}

export default function LibraryHome() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 bg-mist/40 dark:border-white/10 dark:bg-night-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60"
          >
            <Home className="h-3.5 w-3.5" aria-hidden /> {ta ? "முகப்பு" : "Home"}
          </Link>
          <p className="mt-5 font-tamil text-2xl text-marina/80 dark:text-marina-light/80" lang="ta">
            கலைஞர் மின்னூலகம்
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Kalaignar Digital Library</h1>
          <p className="mt-3 max-w-xl text-sm text-ink/65 dark:text-night-text/65" lang={lang}>
            {ta
              ? "கலைஞர் மு. கருணாநிதியின் படைப்புகளை மூல தமிழில் வாசிக்கும் ஒரு மின்னூலகம் — ஒவ்வொரு படைப்பும் அதற்குரிய வடிவில், மேற்கோளிடத்தக்க ஆவணமாக."
              : "A digital library of the works of Kalaignar M. Karunanidhi in the original Tamil — each work in its own source-faithful form, as a citable part of the archive."}
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <section aria-labelledby="read-categories" className="mb-10">
          <h2
            id="read-categories"
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/65 dark:text-night-text/65"
          >
            {ta ? (
              <span className="font-tamil text-sm normal-case tracking-normal" lang="ta">
                வகை வாரியாக
              </span>
            ) : (
              "Browse by category"
            )}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2" data-testid="read-categories">
            {READ_CATEGORIES.map((c) => (
              <li key={c.shelf}>
                <CategoryCard category={c} ta={ta} />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
