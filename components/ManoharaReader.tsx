"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Home,
  Info,
  Minus,
  Music,
  Plus,
  ScrollText,
} from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import type { ManoharaSegment, ManoharaSegmentStub, ManoharaUnit } from "@/data/manohara";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useReaderProgress } from "@/lib/useReaderProgress";

type Props = {
  stub: ManoharaSegmentStub;
  total: number;
  prev: ManoharaSegmentStub | null;
  next: ManoharaSegmentStub | null;
};

const LAST_KEY = "manohara:last";
const POS_PREFIX = "manohara:pos:";

export default function ManoharaReader({ stub, total, prev, next }: Props) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [seg, setSeg] = useState<ManoharaSegment | null>(null);
  const [error, setError] = useState(false);
  const [font, setFont] = useState(1);
  // Source-first: Tamil (the authoritative text) is shown by default; the English
  // reading layer is one toggle away. Both are always present for every segment.
  const [showEn, setShowEn] = useState(false);

  useEffect(() => {
    setSeg(null);
    setError(false);
    fetch(`/data/cinema/manohara/segments/${stub.slug}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: ManoharaSegment) => setSeg(d))
      .catch(() => setError(true));
  }, [stub.slug]);

  // Cheap scroll progress + resume position + "last read" (no mark-as-read shelf).
  const { progress } = useReaderProgress({
    id: stub.slug,
    ready: !!seg,
    posPrefix: POS_PREFIX,
    lastKey: LAST_KEY,
  });

  const sizes = ["text-base", "text-lg", "text-xl"];

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/cinema/manohara"
              className="focus-ring inline-flex items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60 dark:hover:text-marina-light"
              aria-label={ta ? "மனோகரா உள்ளடக்கம்" : "Back to Manohara contents"}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> <span>{ta ? "மனோகரா" : "Manohara"}</span>
            </Link>
            <Link
              href="/read"
              className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60 dark:hover:text-marina-light"
              aria-label={ta ? "மின்னூலகம்" : "Library"}
            >
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            <p className="truncate text-xs text-ink/60 dark:text-night-text/60">
              {ta ? `பகுதி ${stub.ordinal} / ${total}` : `Segment ${stub.ordinal} / ${total}`}
              {progress > 0 && <span className="ml-2 tabular-nums text-marina dark:text-marina-light">{progress}%</span>}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFont(Math.max(0, font - 1))}
              disabled={font === 0}
              className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina disabled:opacity-30 dark:text-night-text/60"
              aria-label={ta ? "எழுத்து சிறிதாக" : "Smaller text"}
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <button
              onClick={() => setFont(Math.min(2, font + 1))}
              disabled={font === 2}
              className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina disabled:opacity-30 dark:text-night-text/60"
              aria-label={ta ? "எழுத்து பெரிதாக" : "Larger text"}
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="h-0.5 w-full bg-transparent" aria-hidden>
          <div className="h-full bg-marina transition-[width] duration-300 dark:bg-marina-light" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-marina dark:text-marina-light">
          <Clapperboard className="h-3.5 w-3.5" aria-hidden />
          {/* Archive-navigation position — deliberately NOT "scene N". */}
          {ta ? `காப்பகப் பகுதி ${stub.ordinal} / ${total}` : `Archive segment ${stub.ordinal} of ${total}`}
        </p>
        <h1 className="mt-3 font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl" lang="ta">
          {stub.readerLabelTa}
        </h1>
        <p className="mt-2 text-xs text-ink/45 dark:text-night-text/45" lang={lang}>
          {ta
            ? "வாசிப்பிற்கான காப்பக வழிசெலுத்தல் பகுதி — அச்சிடப்பட்ட காட்சி எண் அல்ல."
            : "An archive navigation segment for reading — not a printed scene number."}
        </p>

        {/* Tamil / English toggle. Tamil is the authoritative source text. */}
        <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
          <ShareButtons
            title={`${stub.readerLabelTa} · மனோகரா`}
            path={`/cinema/manohara/${stub.slug}`}
          />
          <div className="inline-flex overflow-hidden rounded-full border border-marina/40 text-xs font-medium">
            <button
              onClick={() => setShowEn(false)}
              className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")}
              aria-pressed={!showEn}
              lang="ta"
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
        </div>

        {showEn ? (
          <p className="mt-4 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
            {ta
              ? "இது இத்திட்டத்திற்காக உருவாக்கப்பட்ட, மூலத்துடன் இணைக்கப்பட்ட ஆங்கில வாசிப்பு அடுக்கு. தமிழ் மூலமே சான்றுநிலை. பேச்சாளர் பெயர்கள் மூலத்தில் உள்ளபடியே (தமிழில்) தரப்பட்டுள்ளன."
              : "This is a project-created, source-linked English reading layer. The Tamil original is authoritative. Speaker labels are given exactly as in the source (in Tamil)."}
          </p>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/60 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/60" lang={lang}>
            {ta
              ? "கீழே கலைஞரின் மூல தமிழ் உரை — அச்சிட்ட நூலின்படி, மாற்றமின்றி."
              : "Below is Kalaignar's original Tamil text, verbatim from the printed booklet, unaltered."}
          </p>
        )}

        {!seg && !error && (
          <p className="mt-8 text-sm text-ink/50 dark:text-night-text/50">
            {ta ? "பகுதி ஏற்றப்படுகிறது…" : "Opening the segment…"}
          </p>
        )}
        {error && (
          <p className="mt-8 text-sm text-ink/50 dark:text-night-text/50">
            {ta ? "இந்தப் பகுதியை ஏற்ற முடியவில்லை." : "This segment could not be loaded."}
          </p>
        )}

        {/* ── Tamil verbatim view ─────────────────────────────────────────── */}
        {seg && !showEn && (
          <div
            className={cn(
              "mt-8 whitespace-pre-wrap font-tamil leading-loose text-ink/90 dark:text-night-text/90",
              sizes[font],
            )}
            lang="ta"
          >
            {seg.tamil.text}
          </div>
        )}

        {/* ── English reading layer (structured units) ────────────────────── */}
        {seg && showEn && (
          <div className={cn("mt-8 space-y-4", sizes[font])}>
            {seg.english.units.map((u) => (
              <Unit key={u.id} unit={u} ta={ta} />
            ))}
          </div>
        )}

        {/* Provenance / source note. */}
        <p className="mt-10 border-t border-ink/10 pt-4 text-xs italic leading-relaxed text-ink/45 dark:border-white/10 dark:text-night-text/45" lang={lang}>
          {ta
            ? "மனோகரா · திரைக்கதை–வசனம், மு. கருணாநிதி (1954). மூல அச்சுநூலின் காப்பக மின்னாக்கத்திலிருந்து. "
            : "Manohara · screenplay-dialogue by M. Karunanidhi (1954). From the archival digitisation of the printed booklet. "}
          <Link
            href="/cinema/manohara/source"
            className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina dark:hover:text-marina-light"
          >
            {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
          </Link>
        </p>

        {/* Prev / next segment (boundaries at 1 and 57). */}
        <nav className="mt-8 flex items-center justify-between gap-3 border-t border-ink/10 pt-6 dark:border-white/10" aria-label={ta ? "பகுதி வழிசெலுத்தல்" : "Segment navigation"}>
          {prev ? (
            <Link
              href={`/cinema/manohara/${prev.slug}`}
              className="focus-ring inline-flex min-w-0 items-center gap-1.5 text-sm text-ink/70 hover:text-marina dark:text-night-text/70 dark:hover:text-marina-light"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-ink/40 dark:text-night-text/40">
                  {ta ? `பகுதி ${prev.ordinal}` : `Segment ${prev.ordinal}`}
                </span>
                <span className="block truncate font-tamil" lang="ta">{prev.readerLabelTa}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/cinema/manohara/${next.slug}`}
              className="focus-ring inline-flex min-w-0 items-center gap-1.5 text-right text-sm text-ink/70 hover:text-marina dark:text-night-text/70 dark:hover:text-marina-light"
            >
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-ink/40 dark:text-night-text/40">
                  {ta ? `பகுதி ${next.ordinal}` : `Segment ${next.ordinal}`}
                </span>
                <span className="block truncate font-tamil" lang="ta">{next.readerLabelTa}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>

        {/* Cross-links. */}
        <div className="mt-10 rounded-2xl border border-ink/10 bg-white/40 p-4 dark:border-white/10 dark:bg-night-surface/40" data-print="hide">
          <p className="text-[11px] uppercase tracking-wider text-marina dark:text-marina-light">
            {ta ? "கலைஞர் வேறிடங்களில்" : "Elsewhere Kalaignar writes"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Link href="/read/nenjukku-neethi" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-marina/50 dark:border-white/15" lang={lang}>
              <BookOpen className="h-3.5 w-3.5 text-marina" aria-hidden /> {ta ? "நெஞ்சுக்கு நீதி" : "Nenjukku Neethi"}
            </Link>
            <Link href="/cinema/manohara" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-marina/50 dark:border-white/15" lang={lang}>
              <Clapperboard className="h-3.5 w-3.5 text-marina" aria-hidden /> {ta ? "மனோகரா முழுவதும்" : "All of Manohara"}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

// ── One English unit ───────────────────────────────────────────────────────
// Each kind renders as a visually distinct block. Text is never altered; a null
// speaker label stays unlabelled (no invented attribution).
function Unit({ unit, ta }: { unit: ManoharaUnit; ta: boolean }) {
  const { kind, speakerLabel, text } = unit;

  if (kind === "stage-direction") {
    return (
      <p
        className="border-l-2 border-ink/15 pl-3 text-[0.9em] italic leading-relaxed text-ink/55 dark:border-white/15 dark:text-night-text/55"
        lang="en"
      >
        {text}
      </p>
    );
  }

  if (kind === "song-reference") {
    return (
      <p
        className="flex items-start gap-2 rounded-lg border border-brass/30 bg-brass/[0.06] px-3 py-2 text-[0.9em] italic leading-relaxed text-ink/70 dark:text-night-text/70"
        lang="en"
      >
        <Music className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass" aria-hidden />
        <span>
          <span className="mr-1.5 text-[10px] not-italic uppercase tracking-wider text-brass">{ta ? "பாடல்" : "Song"}</span>
          {text}
        </span>
      </p>
    );
  }

  if (kind === "written-text") {
    return (
      <blockquote className="rounded-lg border border-ink/15 bg-ink/[0.03] px-4 py-3 dark:border-white/15 dark:bg-white/[0.03]">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink/40 dark:text-night-text/40">
          <ScrollText className="h-3 w-3" aria-hidden /> {ta ? "எழுதப்பட்ட உரை" : "Written text"}
        </p>
        <p className="mt-1.5 whitespace-pre-wrap font-display text-[0.95em] leading-relaxed text-ink/85 dark:text-night-text/85" lang="en">
          {text}
        </p>
      </blockquote>
    );
  }

  // chant — a proclamation; keeps its source speaker label but is styled distinctly.
  if (kind === "chant") {
    return (
      <p className="rounded-lg border-l-2 border-marina/50 bg-marina/[0.05] px-3 py-2 leading-relaxed" lang="en">
        {speakerLabel != null && (
          <span className="mr-1.5 font-tamil text-[0.85em] font-semibold uppercase tracking-wide text-marina dark:text-marina-light" lang="ta">
            {speakerLabel}:
          </span>
        )}
        <span className="text-ink/90 dark:text-night-text/90">{text}</span>
      </p>
    );
  }

  // dialogue — speaker label exactly as in source (Tamil); null stays unlabelled.
  return (
    <p className="leading-relaxed text-ink/90 dark:text-night-text/90" lang="en">
      {speakerLabel != null && (
        <span className="mr-1.5 font-tamil font-semibold text-marina dark:text-marina-light" lang="ta">
          {speakerLabel}:
        </span>
      )}
      {text}
    </p>
  );
}
