"use client";

import type { ReactNode } from "react";

import { BookOpen, BookText, ChevronDown, Clapperboard, Feather, Flower2, Home, Mail, Mic, Newspaper, Theater } from "lucide-react";
import Link from "next/link";
import { visibleShelves, type LibraryWork, type ShelfId } from "@/data/library";
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
      <span className="mt-0.5 text-xs text-ink/50 dark:text-night-text/50">{work.titleEn}</span>
      {desc && (
        <span className="mt-1.5 text-xs leading-snug text-ink/55 dark:text-night-text/55" lang={ta ? "ta" : undefined}>
          {desc}
        </span>
      )}
    </Link>
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
  const shelves = visibleShelves();

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

        {shelves.map(({ shelf, works }) => {
          // Presentation only: the same array, split. Declaration order from LIBRARY_WORKS is
          // preserved across both halves, so a work never moves shelf position by being deferred.
          const initial = works.slice(0, INITIAL_WORKS_PER_SHELF);
          const overflow = works.slice(INITIAL_WORKS_PER_SHELF);
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
                <span className="ml-auto shrink-0 font-normal tabular-nums text-ink/40 dark:text-night-text/40">
                  {ta
                    ? `${works.length} ${works.length === 1 ? "படைப்பு" : "படைப்புகள்"}`
                    : `${works.length} ${works.length === 1 ? "work" : "works"}`}
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {initial.map((w) => (
                  <WorkCard key={w.id} work={w} ta={ta} />
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
                      #A9A7A0 on #0C1116, 7.88:1. Light mode keeps marina at 7.10:1. */}
                  <summary className="focus-ring inline-flex min-h-11 cursor-pointer items-center gap-2 rounded py-2 text-xs text-marina dark:text-night-text/70">
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
                    {overflow.map((w) => (
                      <WorkCard key={w.id} work={w} ta={ta} />
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
