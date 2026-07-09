"use client";

import { Bookmark, ChevronDown, Home, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { chapterIndex, volumeMeta } from "@/data/references";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { chromeTa } from "@/data/i18n.ta";

export default function Library() {
  const [open, setOpen] = useState<number>(1);
  const { lang } = useLang();
  const [last, setLast] = useState<string | null>(null);
  const [marks, setMarks] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [volFilter, setVolFilter] = useState<number | null>(null);

  useEffect(() => {
    try {
      setLast(window.localStorage.getItem("nn-last"));
      setMarks(JSON.parse(window.localStorage.getItem("nn-bookmarks") || "[]"));
    } catch {}
  }, []);

  const byId = new Map(chapterIndex.map((c) => [c.id, c]));
  const lastCh = last ? byId.get(last) : null;

  // Client-side filter: keyword-in-title (Tamil or id) + volume. No theme/year
  // here on purpose — theme discovery lives in the "Find by theme" section, and
  // chapters aren't dated, so those would duplicate or fabricate.
  const q = query.trim().toLowerCase();
  const filtering = q.length > 0 || volFilter !== null;
  const matches = (c: (typeof chapterIndex)[number]) =>
    (volFilter === null || c.volume === volFilter) &&
    (q.length === 0 ||
      c.title.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q));
  const filtered = chapterIndex.filter(matches);

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 bg-mist/40 dark:border-white/10 dark:bg-night-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
          <Link href="/" className="focus-ring inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60">
            <Home className="h-3.5 w-3.5" aria-hidden /> Kalaignar Digital Library
          </Link>
          <p className="mt-5 font-tamil text-2xl text-marina/80 dark:text-marina-light/80" lang="ta">
            நெஞ்சுக்கு நீதி
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">{lang === "ta" ? chromeTa.readingRoom : "The Reading Room"}</h1>
          <p className="mt-3 max-w-xl text-sm text-ink/65 dark:text-night-text/65">
            The complete memoir in its original Tamil — six volumes, 391 chapters, 4,234 pages of
            uncorrected OCR text, each chapter a citable unit of the archive.
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        {(lastCh || marks.length > 0) && (
          <section aria-label="Your shelf" className="mb-8 rounded-2xl border border-brass/30 bg-brass/[0.06] p-4">
            {lastCh && (
              <p className="text-sm">
                <span className="text-ink/55 dark:text-night-text/55">{lang === "ta" ? chromeTa.continueReading : "Continue reading"} · </span>
                <Link href={`/read/${lastCh.id}`} className="focus-ring font-tamil text-marina underline-offset-2 hover:underline dark:text-marina-light" lang="ta">
                  {lastCh.title}
                </Link>
                <span className="text-ink/45 dark:text-night-text/45"> (Vol {lastCh.volume})</span>
              </p>
            )}
            {marks.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 text-ink/55 dark:text-night-text/55">
                  <Bookmark className="h-3.5 w-3.5 text-brass" aria-hidden /> {lang === "ta" ? chromeTa.bookmarks : "Bookmarks"}
                </span>
                {marks.map((id) => {
                  const c = byId.get(id);
                  return c ? (
                    <Link key={id} href={`/read/${id}`} className="focus-ring rounded-full border border-ink/15 px-2.5 py-0.5 font-tamil text-xs hover:border-marina/50 dark:border-white/15" lang="ta">
                      {c.title.length > 26 ? c.title.slice(0, 26) + "…" : c.title}
                    </Link>
                  ) : null;
                })}
              </div>
            )}
          </section>
        )}

        <div className="mb-6" data-print="hide">
          <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-white/70 px-4 py-2.5 dark:border-white/15 dark:bg-night-surface/70">
            <Search className="h-4 w-4 shrink-0 text-ink/40 dark:text-night-text/40" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "ta" ? "தலைப்பில் தேடு…" : "Search chapter titles…"}
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40 dark:placeholder:text-night-text/40"
              aria-label={lang === "ta" ? "அத்தியாயத் தலைப்பில் தேடு" : "Search chapter titles"}
              lang="ta"
            />
            {query && (
              <button onClick={() => setQuery("")} className="focus-ring shrink-0 rounded px-1.5 text-xs text-ink/50 hover:text-marina dark:text-night-text/50" aria-label="Clear search">
                ✕
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={lang === "ta" ? "தொகுதி வடிகட்டி" : "Filter by volume"}>
            <button
              onClick={() => setVolFilter(null)}
              className={cn(
                "focus-ring rounded-full px-3 py-1 text-xs transition-colors",
                volFilter === null ? "bg-marina text-paper" : "border border-ink/10 text-ink/60 hover:border-marina/50 dark:border-white/10 dark:text-night-text/60",
              )}
              aria-pressed={volFilter === null}
            >
              {lang === "ta" ? "அனைத்தும்" : "All volumes"}
            </button>
            {volumeMeta.map((v) => (
              <button
                key={v.volume}
                onClick={() => setVolFilter(volFilter === v.volume ? null : v.volume)}
                className={cn(
                  "focus-ring rounded-full px-3 py-1 text-xs transition-colors",
                  volFilter === v.volume ? "bg-marina text-paper" : "border border-ink/10 text-ink/60 hover:border-marina/50 dark:border-white/10 dark:text-night-text/60",
                )}
                aria-pressed={volFilter === v.volume}
              >
                {lang === "ta" ? `${chromeTa.vol} ${v.volume}` : `Vol ${v.volume}`}
              </button>
            ))}
          </div>
          {filtering && (
            <p className="mt-3 text-xs text-ink/50 dark:text-night-text/50" role="status">
              {filtered.length === 0
                ? lang === "ta" ? "பொருத்தம் இல்லை." : "No chapters match."
                : lang === "ta" ? `${filtered.length} அத்தியாயங்கள்` : `${filtered.length} chapters`}
            </p>
          )}
        </div>

        {/* Filtered flat list (when searching/filtering) */}
        {filtering ? (
          <ol className="space-y-1.5">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/read/${c.id}`}
                  className="focus-ring flex items-center gap-3 rounded-xl border border-ink/10 bg-white/70 p-3 transition hover:border-marina/40 dark:border-white/10 dark:bg-night-surface/70"
                >
                  <span className="shrink-0 text-xs font-semibold text-brass/50">
                    {c.id.toUpperCase().replace(/^V(\d)-CH/, "V$1·")}
                  </span>
                  <span className="flex-1 font-tamil text-marina dark:text-marina-light" lang="ta">{c.title}</span>
                  <span className="shrink-0 text-xs text-ink/40 dark:text-night-text/40">{c.pages}</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
        <div className="space-y-4">
          {volumeMeta.map((v) => {
            const isOpen = open === v.volume;
            const chapters = chapterIndex.filter((c) => c.volume === v.volume);
            return (
              <section key={v.volume} className="overflow-hidden rounded-2xl border border-ink/10 bg-white/60 dark:border-white/10 dark:bg-night-surface/60">
                <button
                  onClick={() => setOpen(isOpen ? 0 : v.volume)}
                  className="focus-ring flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <div>
                    <p className="font-display text-lg font-medium">
                      {lang === "ta" ? chromeTa.vol : "Volume"} {v.volume} <span className="text-ink/45 dark:text-night-text/45">· {v.period}</span>
                    </p>
                    <p className="text-xs text-ink/55 dark:text-night-text/55">
                      {v.chapters} {lang === "ta" ? chromeTa.chapters : "chapters"} · {v.pages} {lang === "ta" ? chromeTa.pages : "pages"}
                      {"serialisedIn" in v && v.serialisedIn ? ` · first serialised in ${v.serialisedIn}` : ""}
                    </p>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink/40 transition-transform dark:text-night-text/40", isOpen && "rotate-180")} aria-hidden />
                </button>
                {isOpen && (
                  <ol className="grid gap-x-6 border-t border-ink/10 px-5 py-4 dark:border-white/10 sm:grid-cols-2">
                    {chapters.map((c, i) => (
                      <li key={c.id}>
                        <Link href={`/read/${c.id}`} className="focus-ring group flex items-baseline gap-2 rounded px-1 py-1 text-sm hover:bg-marina/[0.05]">
                          <span className="w-7 shrink-0 text-right font-mono text-[11px] text-ink/35 dark:text-night-text/35">{i + 1}</span>
                          <span className="min-w-0 truncate font-tamil group-hover:text-marina dark:group-hover:text-marina-light" lang="ta">{c.title}</span>
                          <span className="ml-auto shrink-0 text-[10px] text-ink/35 dark:text-night-text/35">{c.pages.replace("pp. ", "")}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            );
          })}
        </div>
        )}
      </main>
    </div>
  );
}
