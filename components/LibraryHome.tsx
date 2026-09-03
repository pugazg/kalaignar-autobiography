"use client";

import type { ReactNode } from "react";

import { BookOpen, BookText, ChevronDown, Clapperboard, Feather, Flower2, Home, Library, Mail, Mic, Newspaper, Theater } from "lucide-react";
import Link from "next/link";
import { type LibraryWork, type ShelfId } from "@/data/library";
import { discoveryShelves, type DiscoveryEntry, type LibraryCollection } from "@/data/collections";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

// Global Kalaignar Digital Library landing page. Catalog-driven: shelves and work
// cards come from `data/library.ts` (published entries only). Nenjukku Neethi no
// longer defines this page's identity — its memoir-specific search / stats live on
// the /read/nenjukku-neethi collection surface.

// Per-shelf presentation (UI only — kept out of the data model). Icons for the six
// currently-empty shelves are pre-mapped so Phase-2+ works render without changes.
const shelfIcon: Record<ShelfId, typeof BookOpen> = {
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

/**
 * How many work cards a shelf shows before the rest move behind a disclosure.
 *
 * Six fills exactly three rows of the `sm:grid-cols-2` grid below and stays a short scroll on a
 * phone. It is a PRESENTATION cap only: every published work is still rendered, still linked and
 * still in the catalogue — Fiction remains 39 works whether its disclosure is open or closed.
 */
const INITIAL_WORKS_PER_SHELF = 6;

// Two accents from the existing design language: brass for commentary, marina otherwise.
const accentFor = (shelf: ShelfId) =>
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
 * One catalogue card. Unchanged from the single-grid version — it is a component only so that the
 * cards above and below a shelf's disclosure are rendered by the same code and cannot drift apart.
 */
function WorkCard({ work, ta }: { work: LibraryWork; ta: boolean }) {
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
function CollectionCard({ collection, ta }: { collection: LibraryCollection; ta: boolean }) {
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

/** One discovery entry: a collection standing in for its members, or a work standing for itself. */
function DiscoveryCard({ entry, ta }: { entry: DiscoveryEntry; ta: boolean }) {
  return entry.kind === "collection" ? (
    <CollectionCard collection={entry.collection} ta={ta} />
  ) : (
    <WorkCard work={entry.work} ta={ta} />
  );
}

/**
 * `dailyKural` arrives as a rendered server component from app/read/page.tsx. It is a prop rather
 * than an import because this file is a client component and the panel must resolve its date on
 * the server. It sits at the top of <main>, immediately after the banner — deliberately NOT inside
 * the <header>, which the print stylesheet deletes outright.
 */
export default function LibraryHome({ dailyKural }: { dailyKural?: ReactNode }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const shelves = discoveryShelves();

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
        {dailyKural}

        {shelves.map(({ shelf, works, entries, collections }) => {
          // Presentation only: the same array, split. Declaration order is preserved across both
          // halves, so an entry never moves shelf position by being deferred.
          //
          // THE CAP APPLIES TO DISCOVERY ENTRIES, NOT WORKS — and that is the whole Phase-1 mechanism.
          // Fiction still holds 39 works, but they now arrive as 3 entries (the anthology plus two
          // standalone works), which is below the cap, so its disclosure simply does not render. No
          // shelf id appears anywhere in this logic: Speeches still has 14 entries and still gets its
          // disclosure, by exactly the same rule.
          const initial = entries.slice(0, INITIAL_WORKS_PER_SHELF);
          const overflow = entries.slice(INITIAL_WORKS_PER_SHELF);
          return (
            <section key={shelf.id} aria-labelledby={`shelf-${shelf.id}`} className="mb-10">
              <h2
                id={`shelf-${shelf.id}`}
                className="mb-3 flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50"
              >
                <span className="font-tamil text-sm normal-case tracking-normal text-ink/70 dark:text-night-text/70" lang="ta">
                  {shelf.ta}
                </span>
                <span>{shelf.en}</span>
                {/* THE SHELF COUNT IS THE WORK COUNT, ALWAYS. Fiction reads "39 works" even though
                    it renders 3 cards: the catalogue did not shrink, only the discovery density did.
                    The collection tally is appended where one exists, because "39 works" over three
                    cards would otherwise leave a reader wondering where the other 36 stories went.
                    Internal vocabulary — "discovery entries" — never reaches the page. */}
                {/* ink/65 rather than ink/40: this span now also carries Phase-1's "· 1 collection",
                    and at /40 that new copy measured 2.53:1 light and 3.32:1 dark. One span cannot hold
                    two contrast levels, so the shelf work count rises with it. */}
                <span className="ml-auto shrink-0 font-normal tabular-nums text-ink/65 dark:text-night-text/65">
                  {ta
                    ? `${works.length} ${works.length === 1 ? "படைப்பு" : "படைப்புகள்"}`
                    : `${works.length} ${works.length === 1 ? "work" : "works"}`}
                  {collections.length > 0 &&
                    (ta
                      ? ` \u00b7 ${collections.length} ${collections.length === 1 ? "தொகுப்பு" : "தொகுப்புகள்"}`
                      : ` \u00b7 ${collections.length} ${collections.length === 1 ? "collection" : "collections"}`)}
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {initial.map((e) => (
                  <DiscoveryCard key={e.key} entry={e} ta={ta} />
                ))}
              </div>
              {overflow.length > 0 && (
                // Native <details>, deliberately: the disclosure then works with JavaScript
                // unavailable, carries its own keyboard and expanded-state semantics without a
                // hand-written aria-expanded to fall out of sync, and — unlike a `hidden` div —
                // keeps the closed cards out of the tab order for free.
                <details className="library-shelf-overflow group/disclosure mt-3">
                  {/* min-h-11 is a 44px touch target. It is padding, not weight: the control stays a
                      small line of text, and the extra height is invisible on the page.

                      DARK MODE IS NOT `marina-light` HERE. The readers' <summary> elements use
                      `dark:text-marina-light`, but that is #1B7F87 on the #0C1116 Reading Room, which
                      measures 4.00:1 — under the 4.5:1 WCAG AA floor for text this size. Rather than
                      change a token shared with the whole app, this one control uses
                      `dark:text-night-text/70`, already used a few lines above for the shelf label:
                      #A9A7A0 on #0C1116, 7.88:1. Light mode keeps marina at 7.10:1.

                      THE FOCUS RING NEEDS THE SAME LOCAL TREATMENT. `.focus-ring` draws ring-marina
                      in both themes; in dark that is #0E5D63 against the #0C1116 offset and page,
                      2.5:1 — under the 3:1 that WCAG 1.4.11 (Level AA) asks of an author-supplied
                      focus indicator. The shared utility is left alone for the whole app and this
                      one control overrides only its dark ring colour, to the same night-text/70 the
                      label uses: 7.88:1. Light mode keeps marina on paper at 7.10:1 and is
                      untouched. Geometry is unchanged — still ring-2 with ring-offset-2. */}
                  <summary className="focus-ring inline-flex min-h-11 cursor-pointer items-center gap-2 rounded py-2 text-xs text-marina dark:text-night-text/70 dark:focus-visible:ring-night-text/70">
                    {/* `display:inline-flex` suppresses the native triangle, so the affordance is drawn
                        explicitly — the same compensation the readers' <summary> elements already make.
                        It flips instantly on open; no transition. The group is NAMED: the work cards
                        below carry their own bare `group` for title hover, and an unnamed group here
                        would make hovering anywhere in the overflow light up every title inside it. */}
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 group-open/disclosure:rotate-180" aria-hidden />
                    {ta
                      ? `மேலும் ${overflow.length} ${overflow.length === 1 ? "படைப்பைக்" : "படைப்புகளைக்"} காட்டு`
                      : `Show ${overflow.length} more ${overflow.length === 1 ? "work" : "works"}`}
                  </summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {overflow.map((e) => (
                      <DiscoveryCard key={e.key} entry={e} ta={ta} />
                    ))}
                  </div>
                </details>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
