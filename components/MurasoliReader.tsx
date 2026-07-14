"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Home, Minus, Plus } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { queryForms } from "@/lib/transliterate";

type Pg = { id: string; page: number; title: { en: string; ta: string }; volume: number; pageType: string };

export default function MurasoliReader({ page, prev, next }: { page: Pg; prev: Pg | null; next: Pg | null }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [paras, setParas] = useState<string[] | null>(null);
  const [error, setError] = useState(false);
  const [font, setFont] = useState(1);
  const [find, setFind] = useState("");

  useEffect(() => {
    setParas(null);
    setError(false);
    fetch(`/data/murasoli/text/${page.id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setParas(d.paragraphs ?? []))
      .catch(() => setError(true));
  }, [page.id]);

  const title = ta ? page.title.ta : page.title.en;
  const sizes = ["text-base", "text-lg", "text-xl"];

  const highlight = (text: string) => {
    const q = find.trim();
    if (q.length < 2) return text;
    try {
      const forms = queryForms(q);
      const rx = new RegExp(`(${forms.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
      const low = forms.map((f) => f.toLowerCase());
      const parts = text.split(rx);
      return parts.map((part, i) =>
        low.includes(part.toLowerCase())
          ? <mark key={i} className="rounded bg-brass/30 px-0.5 dark:bg-brass/40">{part}</mark>
          : part,
      );
    } catch {
      return text;
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/murasoli" className="focus-ring inline-flex items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60" aria-label={ta ? "கடித அடக்கத்திற்குத் திரும்பு" : "Back to contents"}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{ta ? "அடக்கம்" : "Contents"}</span>
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/read" className="focus-ring hidden items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60 sm:inline-flex" aria-label={ta ? "வாசிப்பு அறை" : "Reading Room"}>
              <BookOpen className="h-3.5 w-3.5" aria-hidden /> {ta ? "வாசிப்பு அறை" : "Reading Room"}
            </Link>
            <p className="truncate text-xs text-ink/60 dark:text-night-text/60">
              {ta ? "முரசொலி" : "Murasoli"} · {ta ? `தொகுதி ${page.volume}` : `Vol ${page.volume}`} · {ta ? `பக். ${page.page}` : `p. ${page.page}`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setFont(Math.max(0, font - 1))} disabled={font === 0} className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina disabled:opacity-30 dark:text-night-text/60" aria-label="Smaller text">
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <button onClick={() => setFont(Math.min(2, font + 1))} disabled={font === 2} className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina disabled:opacity-30 dark:text-night-text/60" aria-label="Larger text">
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-3xl items-center gap-2 border-t border-ink/5 px-4 py-1.5 dark:border-white/5" data-print="hide">
          <input
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder={ta ? "இந்தப் பக்கத்தில் தேடு…" : "Find on this page…"}
            className="w-full bg-transparent text-xs outline-none placeholder:text-ink/40 dark:placeholder:text-night-text/40"
            aria-label={ta ? "இந்தப் பக்கத்தில் தேடு" : "Find on this page"}
            lang="ta"
          />
          {find && <button onClick={() => setFind("")} className="focus-ring shrink-0 rounded px-1.5 text-xs text-ink/50 dark:text-night-text/50" aria-label="Clear">✕</button>}
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-brass">
          {ta ? "முரசொலி கடிதங்கள்" : "Murasoli Letters"}
        </p>
        <h1 className="mt-3 font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl" lang={ta ? "ta" : undefined}>
          {title}
        </h1>

        <div className="mt-4" data-print="hide">
          <ShareButtons title={`${title} · முரசொலி`} path={`/murasoli/${page.id}`} />
        </div>

        <div className={cn("mt-8 space-y-5 font-tamil leading-loose text-ink/90 dark:text-night-text/90", sizes[font])} lang="ta">
          {!paras && !error && <p className="text-sm text-ink/50 dark:text-night-text/50">{ta ? "பக்கம் ஏற்றப்படுகிறது…" : "Loading the page…"}</p>}
          {error && <p className="text-sm text-ink/50 dark:text-night-text/50">{ta ? "இந்தப் பக்கத்தை ஏற்ற முடியவில்லை." : "This page could not be loaded."}</p>}
          {paras?.map((p, i) => <p key={i}>{highlight(p)}</p>)}
          {paras && (
            <p className="mt-10 border-t border-ink/10 pt-4 text-xs italic text-ink/45 dark:border-white/10 dark:text-night-text/45" lang={lang}>
              {ta
                ? "இந்தப் பக்கம் அச்சு நூலிலிருந்து OCR மூலம் எடுக்கப்பட்டது; அரிதாகப் பிழைகள் இருக்கலாம். மூலம்: தமிழ்நாடு அரசு மின்னூலகம்."
                : "This page is OCR-extracted from the printed volume and may contain occasional errors. Source: Tamil Nadu Government Digital Library."}
            </p>
          )}
        </div>

        <nav className="mt-12 flex items-center justify-between gap-3 border-t border-ink/10 pt-6 dark:border-white/10" aria-label="Page navigation">
          {prev ? (
            <Link href={`/murasoli/${prev.id}`} className="focus-ring inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-marina dark:text-night-text/70">
              <ChevronLeft className="h-4 w-4" aria-hidden /> {ta ? "முந்தைய" : "Previous"}
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/murasoli/${next.id}`} className="focus-ring inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-marina dark:text-night-text/70">
              {ta ? "அடுத்து" : "Next"} <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : <span />}
        </nav>
      </article>
    </div>
  );
}
