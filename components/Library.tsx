"use client";

import { Bookmark, ChevronDown, Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { chapterIndex, volumeMeta } from "@/data/references";
import { cn } from "@/lib/utils";

export default function Library() {
  const [open, setOpen] = useState<number>(1);
  const [last, setLast] = useState<string | null>(null);
  const [marks, setMarks] = useState<string[]>([]);

  useEffect(() => {
    try {
      setLast(window.localStorage.getItem("nn-last"));
      setMarks(JSON.parse(window.localStorage.getItem("nn-bookmarks") || "[]"));
    } catch {}
  }, []);

  const byId = new Map(chapterIndex.map((c) => [c.id, c]));
  const lastCh = last ? byId.get(last) : null;

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
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">The Reading Room</h1>
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
                <span className="text-ink/55 dark:text-night-text/55">Continue reading · </span>
                <Link href={`/read/${lastCh.id}`} className="focus-ring font-tamil text-marina underline-offset-2 hover:underline dark:text-marina-light" lang="ta">
                  {lastCh.title}
                </Link>
                <span className="text-ink/45 dark:text-night-text/45"> (Vol {lastCh.volume})</span>
              </p>
            )}
            {marks.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 text-ink/55 dark:text-night-text/55">
                  <Bookmark className="h-3.5 w-3.5 text-brass" aria-hidden /> Bookmarks
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
                      Volume {v.volume} <span className="text-ink/45 dark:text-night-text/45">· {v.period}</span>
                    </p>
                    <p className="text-xs text-ink/55 dark:text-night-text/55">
                      {v.chapters} chapters · {v.pages} pages
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
      </main>
    </div>
  );
}
