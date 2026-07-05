"use client";

import { ArrowRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { pillars } from "@/data/meta";
import { people } from "@/data/people";
import { places } from "@/data/places";
import { quotes } from "@/data/quotes";
import { chapterIndex } from "@/data/references";
import { themes } from "@/data/themes";
import { timeline } from "@/data/timeline";
import { cn } from "@/lib/utils";

type Entry = {
  category: "Timeline" | "Theme" | "Person" | "Place" | "Pillar" | "Quote" | "Chapter";
  title: string;
  text: string;
  anchor: string;
  href?: string; // overrides anchor navigation (e.g. open in the Reader)
  meta?: string; // volume/pages line shown with the result
};

const CATEGORIES = ["All", "Timeline", "Theme", "Person", "Place", "Quote", "Chapter"] as const;

function buildIndex(): Entry[] {
  const entries: Entry[] = [];
  for (const m of timeline)
    entries.push({ category: "Timeline", title: `${m.year} — ${m.title}`, text: m.summary, anchor: "timeline" });
  for (const t of themes)
    entries.push({
      category: "Theme",
      title: t.title,
      text: [t.narrative, ...t.initiatives, ...t.achievements].join(" "),
      anchor: `theme-${t.id}`,
    });
  for (const p of pillars)
    entries.push({ category: "Pillar", title: p.title, text: `${p.short} ${p.detail}`, anchor: "pillars" });
  for (const per of people)
    entries.push({
      category: "Person",
      title: `${per.name} · ${per.tamil}`,
      text: `${per.role}. ${per.relationship}`,
      anchor: "people",
    });
  for (const pl of places)
    entries.push({
      category: "Place",
      title: `${pl.name} · ${pl.tamil}`,
      text: pl.note,
      anchor: "journey",
    });
  for (const q of quotes)
    entries.push({ category: "Quote", title: q.english, text: `${q.tamil} ${q.context}`, anchor: "quotes" });
  for (const c of chapterIndex)
    entries.push({
      category: "Chapter",
      title: c.title,
      text: c.title,
      anchor: "references",
      href: `/read/${c.id}`,
      meta: `Vol ${c.volume} · ${c.pages}`,
    });
  return entries;
}

export default function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const inputRef = useRef<HTMLInputElement>(null);
  const index = useMemo(buildIndex, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      };
    }
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = index
      .filter((e) => category === "All" || e.category === category)
      .map((e) => {
        if (tokens.length === 0) return { e, score: e.category === "Chapter" ? 0 : 1 };
        const title = e.title.toLowerCase();
        const text = e.text.toLowerCase();
        let score = 0;
        for (const t of tokens) {
          if (title.includes(t)) score += 3;
          else if (text.includes(t)) score += 1;
          else return { e, score: -1 }; // every token must match somewhere
        }
        if (title.startsWith(tokens[0])) score += 2;
        return { e, score };
      })
      .filter((r) => r.score >= (tokens.length ? 1 : 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
    return scored.map((r) => r.e);
  }, [index, query, category]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-ink/50 backdrop-blur-sm dark:bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onClick={onClose}
    >
      <div
        className="mx-auto mt-20 w-[min(44rem,92vw)] overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-2xl dark:border-white/10 dark:bg-night-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3 dark:border-white/10">
          <Search className="h-5 w-5 shrink-0 text-marina dark:text-marina-light" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, places, chapters, quotes… Tamil works too; chapters open in the Reader"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40 dark:placeholder:text-night-text/40"
            aria-label="Search query"
          />
          <button onClick={onClose} className="focus-ring rounded p-1" aria-label="Close search">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-ink/10 px-4 py-2 dark:border-white/10">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "focus-ring rounded-full px-3 py-1 text-xs font-medium",
                category === c
                  ? "bg-marina text-paper"
                  : "border border-ink/15 text-ink/70 dark:border-white/15 dark:text-night-text/70"
              )}
              aria-pressed={category === c}
            >
              {c}
            </button>
          ))}
        </div>

        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-ink/60 dark:text-night-text/60">
              Nothing matches yet — try a year (“1953”), a place (“Kallakudi”), or a Tamil chapter title.
            </li>
          )}
          {results.map((r, i) => (
            <li key={i}>
              <a
                href={r.href ?? `#${r.anchor}`}
                onClick={onClose}
                className="focus-ring group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-marina-faint dark:hover:bg-white/5"
              >
                <span className="mt-0.5 rounded-full border border-marina/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-marina dark:text-marina-light">
                  {r.category}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.title}</span>
                  <span className="block truncate text-xs text-ink/60 dark:text-night-text/60">
                    {r.meta ?? r.text.slice(0, 110)}
                  </span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ink/30 transition-transform group-hover:translate-x-0.5 dark:text-night-text/30" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
