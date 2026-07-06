"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Copy,
  GraduationCap,
  Home,
  Minus,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChapterRef } from "@/data/references";
import { volumeMeta } from "@/data/references";
import { chapterCitation, useResearch } from "@/lib/ResearchMode";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { chromeTa } from "@/data/i18n.ta";

type ChapterText = {
  id: string;
  volume: number;
  title: string;
  pages: { start: number; end: number };
  strategy: string;
  paragraphs: string[];
};

const FONT_STEPS = ["text-lg", "text-xl", "text-2xl"];

export default function Reader({
  chapter,
  prev,
  next,
}: {
  chapter: ChapterRef;
  prev: ChapterRef | null;
  next: ChapterRef | null;
}) {
  const [data, setData] = useState<ChapterText | null>(null);
  const [error, setError] = useState(false);
  const [font, setFont] = useState(1);
  const [marked, setMarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const { research, setResearch } = useResearch();
  const { lang } = useLang();
  const restored = useRef(false);
  const vol = volumeMeta.find((v) => v.volume === chapter.volume);

  // Load the chapter text (shipped as static JSON — the archive's open data layer).
  useEffect(() => {
    fetch(`/data/text/${chapter.id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, [chapter.id]);

  // Restore preferences, bookmark state, reading position; record "last read".
  useEffect(() => {
    try {
      const f = window.localStorage.getItem("nn-font");
      if (f !== null) setFont(Math.min(2, Math.max(0, Number(f))));
      const marks: string[] = JSON.parse(window.localStorage.getItem("nn-bookmarks") || "[]");
      setMarked(marks.includes(chapter.id));
      window.localStorage.setItem("nn-last", chapter.id);
    } catch {}
  }, [chapter.id]);

  useEffect(() => {
    if (!data || restored.current) return;
    restored.current = true;
    try {
      const pos = window.localStorage.getItem(`nn-pos:${chapter.id}`);
      if (pos) window.scrollTo({ top: Number(pos) * document.body.scrollHeight });
    } catch {}
  }, [data, chapter.id]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (t) return;
      t = setTimeout(() => {
        t = null;
        try {
          window.localStorage.setItem(
            `nn-pos:${chapter.id}`,
            String(window.scrollY / Math.max(1, document.body.scrollHeight)),
          );
        } catch {}
      }, 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapter.id]);

  const setFontStep = (n: number) => {
    const v = Math.min(2, Math.max(0, n));
    setFont(v);
    try {
      window.localStorage.setItem("nn-font", String(v));
    } catch {}
  };

  const toggleMark = () => {
    try {
      const marks: string[] = JSON.parse(window.localStorage.getItem("nn-bookmarks") || "[]");
      const nextMarks = marked ? marks.filter((m) => m !== chapter.id) : [...marks, chapter.id];
      window.localStorage.setItem("nn-bookmarks", JSON.stringify(nextMarks));
      setMarked(!marked);
    } catch {}
  };

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(chapterCitation(chapter));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      {/* Reading-room chrome: quiet, sticky, out of the text's way */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/read" className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60" aria-label="Back to the library">
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            <p className="truncate text-xs text-ink/60 dark:text-night-text/60">
              Vol {chapter.volume} · {chapter.id.replace(/^v(\d)-ch/, "V$1·")} · {chapter.pages}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setFontStep(font - 1)} className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina disabled:opacity-30 dark:text-night-text/60" disabled={font === 0} aria-label="Smaller text">
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <button onClick={() => setFontStep(font + 1)} className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina disabled:opacity-30 dark:text-night-text/60" disabled={font === 2} aria-label="Larger text">
              <Plus className="h-4 w-4" aria-hidden />
            </button>
            <button onClick={toggleMark} className={cn("focus-ring rounded p-1.5", marked ? "text-brass" : "text-ink/60 hover:text-marina dark:text-night-text/60")} aria-label={marked ? "Remove bookmark" : "Bookmark this chapter"} aria-pressed={marked}>
              {marked ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
            </button>
            <button onClick={() => setResearch(!research)} className={cn("focus-ring rounded p-1.5", research ? "text-marina" : "text-ink/60 hover:text-marina dark:text-night-text/60")} aria-label="Toggle research mode" aria-pressed={research} title="Research mode">
              <GraduationCap className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-brass">
          நெஞ்சுக்கு நீதி · Volume {chapter.volume}
          {vol ? ` · ${vol.period}` : ""}
        </p>
        <h1 className="mt-3 font-tamil text-3xl font-semibold leading-snug text-ink dark:text-night-text sm:text-4xl" lang="ta">
          {chapter.title}
        </h1>

        {research && (
          <aside className="mt-6 rounded-xl border border-marina/25 bg-marina/[0.04] p-4 text-sm dark:bg-marina/10" aria-label="Research metadata">
            <p className="font-semibold text-marina dark:text-marina-light">Research mode</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-ink/70 dark:text-night-text/70 sm:grid-cols-4">
              <div><dt className="text-ink/45 dark:text-night-text/45">Chapter id</dt><dd className="font-mono">{chapter.id}</dd></div>
              <div><dt className="text-ink/45 dark:text-night-text/45">Pages</dt><dd>{chapter.pages}</dd></div>
              <div><dt className="text-ink/45 dark:text-night-text/45">Extraction</dt><dd>{data?.strategy ?? "…"} (OCR)</dd></div>
              <div><dt className="text-ink/45 dark:text-night-text/45">Data</dt><dd><a className="text-marina underline-offset-2 hover:underline dark:text-marina-light" href={`/data/text/${chapter.id}.json`} download>chapter JSON</a></dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={copyCitation} className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-marina/40 px-3 py-1 text-xs font-medium text-marina hover:bg-marina hover:text-paper dark:text-marina-light">
                <Copy className="h-3 w-3" aria-hidden /> {copied ? "Citation copied" : "Copy citation"}
              </button>
              <a href={`/data/volume${chapter.volume}.index.json`} download className="focus-ring rounded-full border border-ink/15 px-3 py-1 text-xs text-ink/70 hover:border-marina/50 dark:border-white/15 dark:text-night-text/70">
                Volume {chapter.volume} index (JSON)
              </a>
            </div>
            <p className="mt-2 text-[11px] text-ink/45 dark:text-night-text/45">
              Uncorrected OCR text; page-image sync is reserved for the scan layer as it is acquired.
            </p>
          </aside>
        )}

        <article className={cn("prose-reading mt-10 space-y-6 font-tamil leading-loose text-ink/90 dark:text-night-text/90", FONT_STEPS[font])} lang="ta">
          {error && (
            <p className="rounded-xl border border-brass/40 bg-brass/5 p-4 font-body text-sm text-ink/70 dark:text-night-text/70">
              This chapter&rsquo;s text file isn&rsquo;t bundled in this deployment. Run{" "}
              <code>scripts/extract_chapter_text.py</code> with the volume source to generate it.
            </p>
          )}
          {!data && !error && <p className="font-body text-sm text-ink/50 dark:text-night-text/50">{lang === "ta" ? chromeTa.openingVolume : "Opening the volume…"}</p>}
          {data?.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </article>

        <nav className="mt-16 flex items-stretch justify-between gap-3 border-t border-ink/10 pt-6 dark:border-white/10" aria-label="Chapter navigation">
          {prev ? (
            <Link href={`/read/${prev.id}`} className="focus-ring group flex max-w-[48%] items-center gap-2 rounded-xl border border-ink/10 p-3 text-left hover:border-marina/50 dark:border-white/10">
              <ArrowLeft className="h-4 w-4 shrink-0 text-ink/40 group-hover:text-marina dark:text-night-text/40" aria-hidden />
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-ink/40 dark:text-night-text/40">{lang === "ta" ? chromeTa.previous : "Previous"}</span>
                <span className="block truncate font-tamil text-sm" lang="ta">{prev.title}</span>
              </span>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/read/${next.id}`} className="focus-ring group flex max-w-[48%] items-center gap-2 rounded-xl border border-ink/10 p-3 text-right hover:border-marina/50 dark:border-white/10">
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-ink/40 dark:text-night-text/40">{lang === "ta" ? chromeTa.next : "Next"}</span>
                <span className="block truncate font-tamil text-sm" lang="ta">{next.title}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink/40 group-hover:text-marina dark:text-night-text/40" aria-hidden />
            </Link>
          ) : <span />}
        </nav>
      </main>
    </div>
  );
}
