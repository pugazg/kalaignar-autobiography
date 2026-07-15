"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Home, Minus, Plus } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import type { MurasoliLetterMeta } from "@/data/murasoli";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { queryForms } from "@/lib/transliterate";

type Props = {
  letter: MurasoliLetterMeta & { volume: number };
  prev: (MurasoliLetterMeta & { volume: number }) | null;
  next: (MurasoliLetterMeta & { volume: number }) | null;
  sourceUrl?: string;
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${Number(d)}.${Number(m)}.${y}`;
}

export default function MurasoliLetterReader({ letter, prev, next, sourceUrl }: Props) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [paras, setParas] = useState<string[] | null>(null);
  const [salutation, setSalutation] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [font, setFont] = useState(1);
  const [find, setFind] = useState("");
  // English translation: Tamil is the authoritative text; the English view
  // exists only when a translation file has been published for this letter.
  const [enParas, setEnParas] = useState<string[] | null>(null);
  const [enStatus, setEnStatus] = useState<string | null>(null);
  const [enTitle, setEnTitle] = useState<string | null>(null);
  const [enSalutation, setEnSalutation] = useState<string | null>(null);
  const [enNote, setEnNote] = useState<string | null>(null);
  const [showEn, setShowEn] = useState(false);

  useEffect(() => {
    setParas(null);
    setError(false);
    setEnParas(null);
    setShowEn(false);
    fetch(`/data/murasoli/letters/${letter.id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setParas(d.paragraphs ?? []);
        setSalutation(d.salutation ?? null);
      })
      .catch(() => setError(true));
    fetch(`/data/murasoli/letters-en/${letter.id}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.paragraphs?.length) {
          setEnParas(d.paragraphs);
          setEnStatus(d.provenance?.status ?? null);
          setEnTitle(d.title ?? null);
          setEnSalutation(d.salutation ?? null);
          setEnNote(d.translatorNote ?? null);
        }
      })
      .catch(() => {});
  }, [letter.id]);

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
              <span>{ta ? "அடக்கம்" : "Contents"}</span>
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/read" className="focus-ring hidden items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60 sm:inline-flex" aria-label={ta ? "வாசிப்பு அறை" : "Reading Room"}>
              <BookOpen className="h-3.5 w-3.5" aria-hidden /> {ta ? "வாசிப்பு அறை" : "Reading Room"}
            </Link>
            <p className="truncate text-xs text-ink/60 dark:text-night-text/60">
              {ta ? "முரசொலி" : "Murasoli"} · {ta ? `தொகுதி ${letter.volume}` : `Vol ${letter.volume}`}
              {letter.number != null && <> · {ta ? `கடிதம் ${letter.number}` : `Letter ${letter.number}`}</>}
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
            placeholder={ta ? "இந்தக் கடிதத்தில் தேடு…" : "Find in this letter…"}
            className="w-full bg-transparent text-xs outline-none placeholder:text-ink/40 dark:placeholder:text-night-text/40"
            aria-label={ta ? "இந்தக் கடிதத்தில் தேடு" : "Find in this letter"}
            lang="ta"
          />
          {find && <button onClick={() => setFind("")} className="focus-ring shrink-0 rounded px-1.5 text-xs text-ink/50 dark:text-night-text/50" aria-label="Clear">✕</button>}
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-brass">
          {ta ? "முரசொலி கடிதங்கள்" : "Murasoli Letters"}
          {letter.number != null && <> · {letter.number}</>}
        </p>
        <h1 className="mt-3 font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl" lang="ta">
          {showEn && enTitle ? enTitle : letter.title.ta}
        </h1>
        {letter.date && (
          <p className="mt-2 text-xs text-ink/50 dark:text-night-text/50">
            {ta ? "நாள்" : "Dated"} {formatDate(letter.date)}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
          <ShareButtons title={`${letter.title.ta} · முரசொலி`} path={`/murasoli/${letter.id}`} />
          {enParas && (
            <div className="inline-flex overflow-hidden rounded-full border border-marina/40 text-xs font-medium">
              <button
                onClick={() => setShowEn(false)}
                className={`focus-ring px-3 py-1 transition ${!showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light"}`}
                aria-pressed={!showEn}
              >
                தமிழ்
              </button>
              <button
                onClick={() => setShowEn(true)}
                className={`focus-ring px-3 py-1 transition ${showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light"}`}
                aria-pressed={showEn}
              >
                English
              </button>
            </div>
          )}
        </div>

        {showEn && enParas && (
          <p className="mt-4 rounded-xl border border-dashed border-brass/50 bg-brass/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70">
            {ta
              ? "இது ஒரு மொழிபெயர்ப்பு"
              : "This is a translation"}
            {enStatus === "under_review" && (ta ? " — சரிபார்ப்பில் உள்ளது" : " — under review")}
            {". "}
            {ta ? "தமிழ் மூலமே சான்றுநிலை. " : "The Tamil original is authoritative. "}
            <a
              href={`https://github.com/pugazg/kalaignar-autobiography/issues/new?title=Translation%20correction%3A%20${letter.id}&labels=correction&body=Letter%20id%3A%20${letter.id}%0AWhat%20should%20change%3A%20`}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina"
            >
              {ta ? "திருத்தம் பரிந்துரைக்க" : "Suggest a correction"}
            </a>
          </p>
        )}

        {showEn && enNote && (
          <p className="mt-3 text-xs italic leading-relaxed text-ink/55 dark:text-night-text/55">
            {enNote}
          </p>
        )}

        <div className={cn("mt-8 space-y-5 leading-loose text-ink/90 dark:text-night-text/90", showEn ? "font-body" : "font-tamil", sizes[font])} lang={showEn ? "en" : "ta"}>
          {!paras && !error && <p className="text-sm text-ink/50 dark:text-night-text/50">{ta ? "கடிதம் ஏற்றப்படுகிறது…" : "Loading the letter…"}</p>}
          {error && <p className="text-sm text-ink/50 dark:text-night-text/50">{ta ? "இந்தக் கடிதத்தை ஏற்ற முடியவில்லை." : "This letter could not be loaded."}</p>}
          {!showEn && paras && salutation && <p className="font-medium text-marina dark:text-marina-light">{salutation}</p>}
          {showEn && enParas && <p className="font-medium text-marina dark:text-marina-light">{enSalutation ?? "Udanpirappē,"}</p>}
          {(showEn && enParas ? enParas : paras)?.map((p, i) => <p key={i}>{highlight(p)}</p>)}
          {paras && (
            <p className="mt-10 border-t border-ink/10 pt-4 text-xs italic text-ink/45 dark:border-white/10 dark:text-night-text/45" lang={lang}>
              {ta
                ? "இந்தக் கடிதம் அச்சு நூலிலிருந்து OCR மூலம் தொகுக்கப்பட்டது; அரிதாகப் பிழைகள் இருக்கலாம். மூலம்: "
                : "This letter is assembled by OCR from the printed volume and may contain occasional errors. Source: "}
              {sourceUrl ? (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina">
                  {ta ? "தமிழ் இணைய நூலகம் — சென்னைப் பல்கலைக்கழக ஆவணம்" : "Tamil Digital Library — University of Madras holdings"}
                </a>
              ) : (
                <span>{ta ? "தமிழ் இணைய நூலகம் (tamildigitallibrary.in)" : "Tamil Digital Library (tamildigitallibrary.in)"}</span>
              )}
              {". "}
              <a
                href={`https://github.com/pugazg/kalaignar-autobiography/issues/new?title=Murasoli%20correction%3A%20${letter.id}&labels=correction&body=Letter%20id%3A%20${letter.id}%0AWhat%20should%20change%3A%20%0ASource%2Freason%3A%20`}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina"
              >
                {ta ? "பிழை கண்டீர்களா? தெரிவியுங்கள்" : "Spotted an error? Tell us"}
              </a>
            </p>
          )}
        </div>

        <nav className="mt-12 flex items-center justify-between gap-3 border-t border-ink/10 pt-6 dark:border-white/10" aria-label="Letter navigation">
          {prev ? (
            <Link href={`/murasoli/${prev.id}`} className="focus-ring inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-marina dark:text-night-text/70">
              <ChevronLeft className="h-4 w-4" aria-hidden /> {ta ? "முந்தைய கடிதம்" : "Previous letter"}
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/murasoli/${next.id}`} className="focus-ring inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-marina dark:text-night-text/70">
              {ta ? "அடுத்த கடிதம்" : "Next letter"} <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : <span />}
        </nav>
      </article>
    </div>
  );
}
