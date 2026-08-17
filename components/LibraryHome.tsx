"use client";

import { BookOpen, BookText, Clapperboard, Feather, Flower2, Home, Mail, Mic, Newspaper, Theater } from "lucide-react";
import Link from "next/link";
import { visibleShelves, type ShelfId } from "@/data/library";
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

export default function LibraryHome() {
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
        {shelves.map(({ shelf, works }) => (
          <section key={shelf.id} aria-labelledby={`shelf-${shelf.id}`} className="mb-10">
            <h2
              id={`shelf-${shelf.id}`}
              className="mb-3 flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50"
            >
              <span className="font-tamil text-sm normal-case tracking-normal text-ink/70 dark:text-night-text/70" lang="ta">
                {shelf.ta}
              </span>
              <span>{shelf.en}</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {works.map((w) => {
                const a = accentFor(w.shelf);
                const Icon = shelfIcon[w.shelf] ?? BookOpen;
                return (
                  <Link
                    key={w.id}
                    href={w.href}
                    className={cn(
                      "focus-ring group flex flex-col rounded-2xl border bg-white/60 p-4 transition dark:bg-night-surface/60",
                      a.border,
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", a.icon)} aria-hidden />
                    <span className="mt-2 font-tamil text-[15px] font-medium" lang="ta">
                      <span className={a.title}>{w.titleTa}</span>
                    </span>
                    <span className="mt-0.5 text-xs text-ink/50 dark:text-night-text/50">{w.titleEn}</span>
                    {(ta ? w.descTa : w.descEn) && (
                      <span
                        className="mt-1.5 text-xs leading-snug text-ink/55 dark:text-night-text/55"
                        lang={ta ? "ta" : undefined}
                      >
                        {ta ? w.descTa : w.descEn}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
