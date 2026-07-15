"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  Clock,
  ListOrdered,
  Search,
  GraduationCap,
  Home,
  Minus,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChapterRef } from "@/data/references";
import { chapterIndex, volumeMeta } from "@/data/references";
import { useResearch } from "@/lib/ResearchMode";
import CiteButton from "@/components/CiteButton";
import ShareButtons from "@/components/ShareButtons";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { chromeTa } from "@/data/i18n.ta";
import { queryForms } from "@/lib/transliterate";
import { quotes } from "@/data/quotes";
import { teasers } from "@/data/teasers";
import ShareQuote from "@/components/ShareQuote";

type ChapterText = {
  id: string;
  volume: number;
  title: string;
  pages: { start: number; end: number };
  strategy: string;
  paragraphs: string[];
};

// Sketches/photos placed into the chapter (public/data/visuals/<id>.json,
// built by pipeline/builders/build_volume1_visuals.py). afterParagraph = -1
// renders before the first paragraph; otherwise just after that paragraph.
type Visual = { src: string; type: string; afterParagraph: number; confidence: number };

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
  const [find, setFind] = useState("");
  const [progress, setProgress] = useState(0); // 0–100 scroll-through
  const [isRead, setIsRead] = useState(false);
  // English translation: exists only where a translation file has been
  // published (public/data/text-en/<id>.json). Tamil is authoritative.
  const [enParas, setEnParas] = useState<string[] | null>(null);
  const [enTitle, setEnTitle] = useState<string | null>(null);
  const [enStatus, setEnStatus] = useState<string | null>(null);
  const [showEn, setShowEn] = useState(false);
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const { research, setResearch } = useResearch();
  const { lang } = useLang();
  const restored = useRef(false);
  const vol = volumeMeta.find((v) => v.volume === chapter.volume);

  // In-chapter find: split each paragraph on the query and wrap matches.
  // The query matches in any form — as typed or transliterated to Tamil.
  const highlight = (text: string) => {
    const q = find.trim();
    if (q.length < 2) return text;
    try {
      const forms = queryForms(q);
      const rx = new RegExp(`(${forms.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
      const low = forms.map((f) => f.toLowerCase());
      const parts = text.split(rx);
      return parts.map((part, i) =>
        low.includes(part.toLowerCase()) ? (
          <mark key={i} className="rounded bg-brass/30 px-0.5 text-ink dark:bg-brass/40 dark:text-night-text">
            {part}
          </mark>
        ) : (
          part
        ),
      );
    } catch {
      return text;
    }
  };

  // Load the chapter text (shipped as static JSON — the archive's open data layer).
  useEffect(() => {
    setEnParas(null);
    setShowEn(false);
    setVisuals([]);
    fetch(`/data/text/${chapter.id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
    fetch(`/data/visuals/${chapter.id}.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Visual[]) => setVisuals(Array.isArray(d) ? d : []))
      .catch(() => setVisuals([]));
    fetch(`/data/text-en/${chapter.id}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.paragraphs?.length) {
          setEnParas(d.paragraphs);
          setEnTitle(d.title ?? null);
          setEnStatus(d.provenance?.status ?? null);
        }
      })
      .catch(() => {});
  }, [chapter.id]);

  // Deep link from full-text search: /read/<id>?find=<term> pre-fills the
  // in-chapter find box so the match is highlighted on arrival.
  useEffect(() => {
    try {
      const f = new URLSearchParams(window.location.search).get("find");
      if (f) setFind(f);
    } catch {}
  }, [chapter.id]);

  // Restore preferences, bookmark state, reading position; record "last read".
  useEffect(() => {
    try {
      const f = window.localStorage.getItem("nn-font");
      if (f !== null) setFont(Math.min(2, Math.max(0, Number(f))));
      const marks: string[] = JSON.parse(window.localStorage.getItem("nn-bookmarks") || "[]");
      setMarked(marks.includes(chapter.id));
      const read: string[] = JSON.parse(window.localStorage.getItem("nn-read") || "[]");
      setIsRead(read.includes(chapter.id));
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
          // surface the same measurement as visible progress, and auto-mark
          // the chapter read once the reader has scrolled essentially through
          const denom = Math.max(1, document.body.scrollHeight - window.innerHeight);
          const pct = Math.min(100, Math.round((window.scrollY / denom) * 100));
          setProgress(pct);
          if (pct >= 95) {
            const read: string[] = JSON.parse(window.localStorage.getItem("nn-read") || "[]");
            if (!read.includes(chapter.id)) {
              window.localStorage.setItem("nn-read", JSON.stringify([...read, chapter.id]));
              setIsRead(true);
            }
          }
        } catch {}
      }, 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapter.id]);

  const toggleRead = () => {
    try {
      const read: string[] = JSON.parse(window.localStorage.getItem("nn-read") || "[]");
      const next = isRead ? read.filter((r) => r !== chapter.id) : [...read, chapter.id];
      window.localStorage.setItem("nn-read", JSON.stringify(next));
      setIsRead(!isRead);
    } catch {}
  };

  // ~200 space-separated words per minute; Tamil agglutination makes real
  // words denser, so this reads as a floor, not a promise.
  const readMins = data
    ? Math.max(1, Math.round(data.paragraphs.join(" ").split(/\s+/).length / 200))
    : null;

  // Three more chapters from the same volume (following this one, wrapping).
  const alsoInVolume = (() => {
    const vol = chapterIndex.filter((c) => c.volume === chapter.volume);
    const i = vol.findIndex((c) => c.id === chapter.id);
    if (i === -1) return [];
    return [1, 2, 3].map((k) => vol[(i + k) % vol.length]).filter((c) => c.id !== chapter.id);
  })();

  // Verified data layers: teaser (data/teasers.ts, written against the text)
  // and pull quote (data/quotes.ts, verbatim-verified with chapter refs).
  const teaser = teasers[chapter.id];
  const pullQuote = quotes.find((q) => q.ref === chapter.id);
  const refLabel = chapter.id.toUpperCase().replace(/^V(\d)-CH/, "V$1·");

  // Sketches/photos anchored just after paragraph `i` (`-1` = before the text).
  // Shown only in the Tamil view, since the anchors index the Tamil paragraphs.
  const visualsAfter = (i: number) => {
    const here = visuals.filter((v) => v.afterParagraph === i);
    if (here.length === 0) return null;
    return here.map((v) => (
      <figure key={v.src} className="not-prose my-9" data-visual={v.type}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={v.src}
          alt={
            v.type === "photo"
              ? "Photograph from Nenjukku Neethi, Volume 1"
              : "Sketch from Nenjukku Neethi, Volume 1"
          }
          loading="lazy"
          className="mx-auto max-h-[75vh] w-auto max-w-full rounded-xl border border-ink/10 bg-white shadow-sm dark:border-white/10"
        />
      </figure>
    ));
  };

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

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      {/* Reading-room chrome: quiet, sticky, out of the text's way */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/read" className="focus-ring inline-flex items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60" aria-label={lang === "ta" ? "நூலடக்கத்திற்குத் திரும்பு" : "Back to contents"}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span>{lang === "ta" ? "நூலடக்கம்" : "Contents"}</span>
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            <p className="truncate text-xs text-ink/60 dark:text-night-text/60">
              Vol {chapter.volume} · {chapter.id.replace(/^v(\d)-ch/, "V$1·")} · {chapter.pages}
              {progress > 0 && <span className="ml-2 tabular-nums text-marina dark:text-marina-light">{progress}%</span>}
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
            <button onClick={toggleRead} className={cn("focus-ring rounded p-1.5", isRead ? "text-marina dark:text-marina-light" : "text-ink/60 hover:text-marina dark:text-night-text/60")} aria-label={lang === "ta" ? (isRead ? "வாசித்ததாகக் குறிக்கப்பட்டது" : "வாசித்ததாகக் குறிக்க") : (isRead ? "Marked as read" : "Mark as read")} aria-pressed={isRead} title={lang === "ta" ? "வாசித்ததா?" : "Mark as read"}>
              {isRead ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Circle className="h-4 w-4" aria-hidden />}
            </button>
            <button onClick={() => setResearch(!research)} className={cn("focus-ring rounded p-1.5", research ? "text-marina" : "text-ink/60 hover:text-marina dark:text-night-text/60")} aria-label="Toggle research mode" aria-pressed={research} title="Research mode">
              <GraduationCap className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-3xl items-center gap-2 border-t border-ink/5 px-4 py-1.5 dark:border-white/5" data-print="hide">
          <Search className="h-3.5 w-3.5 shrink-0 text-ink/40 dark:text-night-text/40" aria-hidden />
          <input
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder={lang === "ta" ? "இந்த அத்தியாயத்தில் தேடு…" : "Find in this chapter…"}
            className="w-full bg-transparent text-xs outline-none placeholder:text-ink/40 dark:placeholder:text-night-text/40"
            aria-label={lang === "ta" ? "இந்த அத்தியாயத்தில் தேடு" : "Find in this chapter"}
            lang="ta"
          />
          {find && (
            <button onClick={() => setFind("")} className="focus-ring shrink-0 rounded px-1.5 text-xs text-ink/50 hover:text-marina dark:text-night-text/50" aria-label="Clear search">
              ✕
            </button>
          )}
        </div>
        {/* thin scroll-through bar pinned to the header's lower edge */}
        <div className="h-0.5 w-full bg-transparent" aria-hidden>
          <div className="h-full bg-marina transition-[width] duration-300 dark:bg-marina-light" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-brass">
          நெஞ்சுக்கு நீதி · Volume {chapter.volume}
          {vol ? ` · ${vol.period}` : ""}
        </p>
        <h1 className="mt-3 font-tamil text-3xl font-semibold leading-snug text-ink dark:text-night-text sm:text-4xl" lang={showEn && enTitle ? "en" : "ta"}>
          {showEn && enTitle ? enTitle : chapter.title}
        </h1>
        {teaser && (
          <p className="mt-3 max-w-2xl border-l-2 border-brass/60 pl-4 font-tamil text-base leading-relaxed text-ink/70 dark:text-night-text/70" lang={showEn && teaser.en ? "en" : "ta"}>
            {showEn && teaser.en ? teaser.en : teaser.ta}
          </p>
        )}
        {readMins !== null && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink/50 dark:text-night-text/50">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {lang === "ta" ? `சுமார் ${readMins} நிமிட வாசிப்பு` : `~${readMins} min read`}
            {isRead && (
              <span className="ml-2 inline-flex items-center gap-1 text-marina dark:text-marina-light">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                {lang === "ta" ? "வாசித்தது" : "read"}
              </span>
            )}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
          <ShareButtons title={`${chapter.title} · நெஞ்சுக்கு நீதி`} path={`/read/${chapter.id}`} />
          {enParas && (
            <div className="inline-flex overflow-hidden rounded-full border border-marina/40 text-xs font-medium">
              <button
                onClick={() => setShowEn(false)}
                className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")}
                aria-pressed={!showEn}
              >
                தமிழ்
              </button>
              <button
                onClick={() => setShowEn(true)}
                className={cn("focus-ring px-3 py-1 transition", showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")}
                aria-pressed={showEn}
              >
                English
              </button>
            </div>
          )}
        </div>

        {showEn && enParas && (
          <p className="mt-4 rounded-xl border border-dashed border-brass/50 bg-brass/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70">
            {lang === "ta" ? "இது ஒரு மொழிபெயர்ப்பு" : "This is a translation"}
            {enStatus === "under_review" && (lang === "ta" ? " — சரிபார்ப்பில் உள்ளது" : " — under review")}
            {". "}
            {lang === "ta" ? "தமிழ் மூலமே சான்றுநிலை. " : "The Tamil original is authoritative. "}
            <a
              href={`https://github.com/pugazg/kalaignar-autobiography/issues/new?title=Translation%20correction%3A%20${chapter.id}&labels=correction&body=Chapter%20id%3A%20${chapter.id}%0AWhat%20should%20change%3A%20`}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina"
            >
              {lang === "ta" ? "திருத்தம் பரிந்துரைக்க" : "Suggest a correction"}
            </a>
          </p>
        )}

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
              <CiteButton chapter={chapter} />
              <a href={`/data/text/${chapter.id}.json`} download className="focus-ring rounded-full border border-ink/15 px-3 py-1 text-xs text-ink/70 hover:border-marina/50 dark:border-white/15 dark:text-night-text/70">
                {lang === "ta" ? "அத்தியாய JSON" : "Chapter JSON"}
              </a>
              <a href={`/data/volume${chapter.volume}.index.json`} download className="focus-ring rounded-full border border-ink/15 px-3 py-1 text-xs text-ink/70 hover:border-marina/50 dark:border-white/15 dark:text-night-text/70">
                {lang === "ta" ? `பாகம் ${chapter.volume} JSON` : `Volume ${chapter.volume} index (JSON)`}
              </a>
            </div>
            <p className="mt-2 text-[11px] text-ink/45 dark:text-night-text/45">
              Uncorrected OCR text; page-image sync is reserved for the scan layer as it is acquired.
            </p>
          </aside>
        )}

        <article className={cn("prose-reading mt-10 space-y-6 leading-loose text-ink/90 dark:text-night-text/90", showEn ? "font-body" : "font-tamil", FONT_STEPS[font])} lang={showEn ? "en" : "ta"}>
          {error && (
            <p className="rounded-xl border border-brass/40 bg-brass/5 p-4 font-body text-sm text-ink/70 dark:text-night-text/70">
              This chapter&rsquo;s text file isn&rsquo;t bundled in this deployment. Run{" "}
              <code>scripts/extract_chapter_text.py</code> with the volume source to generate it.
            </p>
          )}
          {!data && !error && <p className="font-body text-sm text-ink/50 dark:text-night-text/50">{lang === "ta" ? chromeTa.openingVolume : "Opening the volume…"}</p>}
          {data && data.paragraphs.length > 12 && !showEn && (
            <details className="not-prose rounded-xl border border-ink/10 bg-white/60 p-4 font-body text-sm dark:border-white/10 dark:bg-night-surface/60" data-print="hide">
              <summary className="focus-ring inline-flex cursor-pointer items-center gap-2 text-marina dark:text-marina-light">
                <ListOrdered className="h-4 w-4" aria-hidden />
                {lang === "ta" ? `பத்திகள் (${data.paragraphs.length}) — நேரடிச் செல்ல` : `Paragraphs (${data.paragraphs.length}) — jump to`}
              </summary>
              <ol className="mt-3 grid max-w-full gap-1 overflow-hidden sm:grid-cols-2">
                {data.paragraphs.map((p, i) => (
                  <li key={i} className="min-w-0">
                    <a href={`#para-${i}`} className="focus-ring block max-w-full truncate rounded px-1 py-0.5 font-tamil text-ink/70 hover:text-marina dark:text-night-text/70" lang="ta">
                      <span className="mr-1.5 font-mono text-[10px] text-ink/35 dark:text-night-text/35">{i + 1}</span>
                      {p.split(/\s+/).slice(0, 7).join(" ")}…
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          )}
          {data && !showEn && visualsAfter(-1)}
          {(showEn && enParas ? enParas : data?.paragraphs)?.map((p, i) => (
            <div key={i} className="contents">
              <p id={`para-${i}`} className="scroll-mt-28">{highlight(p)}</p>
              {!showEn && visualsAfter(i)}
              {i === 1 && pullQuote && !showEn && (
                <aside className="not-prose my-8 rounded-2xl border border-marina/25 bg-marina/[0.04] p-6 dark:bg-marina/10" aria-label={lang === "ta" ? "மேற்கோள்" : "Pull quote"}>
                  <p className="font-tamil text-xl font-semibold leading-relaxed text-marina dark:text-marina-light" lang="ta">
                    “{pullQuote.tamil}”
                  </p>
                  <p className="mt-2 font-body text-xs text-ink/55 dark:text-night-text/55">{pullQuote.english}</p>
                </aside>
              )}
            </div>
          ))}
          {data && (
            <p className="mt-10 border-t border-ink/10 pt-4 font-body text-xs italic text-ink/45 dark:border-white/10 dark:text-night-text/45" lang={lang}>
              {lang === "ta"
                ? "இந்த மூல தமிழ் உரை அச்சு நூலிலிருந்து எடுக்கப்பட்டது; அரிதாக எழுத்துப் பிழைகள் இருக்கலாம். திருத்தங்களைப் பரிந்துரைக்க வரவேற்கிறோம்."
                : "This original Tamil text is drawn from the printed volumes and may contain occasional transcription errors. Corrections are welcome via the link in the footer."}
            </p>
          )}
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

        {alsoInVolume.length > 0 && (
          <section className="mt-10" aria-label={lang === "ta" ? "இந்தத் தொகுதியில் மேலும்" : "Also in this volume"}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
              {lang === "ta" ? `தொகுதி ${chapter.volume}-இல் மேலும்` : `Also in Volume ${chapter.volume}`}
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {alsoInVolume.map((c) => (
                <li key={c.id}>
                  <Link href={`/read/${c.id}`} className="focus-ring block rounded-xl border border-ink/10 p-3 transition hover:border-marina/50 dark:border-white/10">
                    <span className="block text-[10px] text-ink/40 dark:text-night-text/40">{c.id.toUpperCase().replace(/^V(\d)-CH/, "V$1·")} · {c.pages}</span>
                    <span className="mt-0.5 block truncate font-tamil text-sm text-marina dark:text-marina-light" lang="ta">{c.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <ShareQuote title={chapter.title} refLabel={refLabel} />
    </div>
  );
}
