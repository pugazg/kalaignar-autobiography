"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Home, Info, Landmark, MapPin, Mic, Minus, Plus } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import type { Speech, SpeechBlock } from "@/data/speeches";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useReaderProgress } from "@/lib/useReaderProgress";

const LAST_KEY = "speeches:last";
const POS_PREFIX = "speeches:pos:";

export default function SpeechReader({ slug }: { slug: string }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [error, setError] = useState(false);
  const [font, setFont] = useState(1);
  // Source-first: the verified Tamil is authoritative and shown by default; the verified
  // English reading translation is one toggle away.
  const [showEn, setShowEn] = useState(false);

  useEffect(() => {
    setSpeech(null);
    setError(false);
    fetch(`/data/speeches/${slug}/speech.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Speech) => setSpeech(d))
      .catch(() => setError(true));
  }, [slug]);

  const { progress } = useReaderProgress({ id: slug, ready: !!speech, posPrefix: POS_PREFIX, lastKey: LAST_KEY });

  const sizes = ["text-base", "text-lg", "text-xl"];
  const blocks = speech ? (showEn ? speech.english.blocks : speech.tamil.blocks) : [];

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/read" className="focus-ring inline-flex items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60 dark:hover:text-marina-light" aria-label={ta ? "மின்னூலகம்" : "Library"}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> <span>{ta ? "உரைகள்" : "Speeches"}</span>
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            {speech && (
              <p className="truncate font-tamil text-xs text-ink/60 dark:text-night-text/60" lang="ta">
                {speech.title.ta}
                {progress > 0 && <span className="ml-2 tabular-nums text-marina dark:text-marina-light">{progress}%</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setFont(Math.max(0, font - 1))} disabled={font === 0} className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina disabled:opacity-30 dark:text-night-text/60" aria-label={ta ? "எழுத்து சிறிதாக" : "Smaller text"}>
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <button onClick={() => setFont(Math.min(2, font + 1))} disabled={font === 2} className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina disabled:opacity-30 dark:text-night-text/60" aria-label={ta ? "எழுத்து பெரிதாக" : "Larger text"}>
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
          <Mic className="h-3.5 w-3.5" aria-hidden />{" "}
          {speech
            ? speech.subtype === "public-speech"
              ? ta ? "பொது உரை" : "Public speech"
              : ta ? "சட்டமன்ற உரை" : "Assembly speech"
            : ta ? "உரை" : "Speech"}
        </p>
        <h1 className="mt-3 font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl" lang="ta">
          {speech?.title.ta ?? (ta ? "ஏற்றப்படுகிறது…" : "Loading…")}
        </h1>
        {speech && (
          <>
            <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">{speech.title.en}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/55 dark:text-night-text/55">
              {/* Chips render ONLY for facts the source establishes. A source that states no speech
                  date simply has no date chip — never a publication date, a guess or an empty slot. */}
              {speech.date && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden /> {formatDate(speech.date, ta)}
                </span>
              )}
              {/* Assembly speeches show the legislature (Landmark); public speeches show the
                  source-established venue (MapPin). No fake legislature/event is shown for a public
                  speech, and no event is shown unless the source establishes one. */}
              {speech.subtype === "public-speech" ? (
                <>
                  {speech.venue && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      <span lang={lang}>{ta ? speech.venue.ta : speech.venue.en}</span>
                    </span>
                  )}
                  {speech.event && <span lang={lang}>{ta ? speech.event.ta : speech.event.en}</span>}
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <Landmark className="h-3.5 w-3.5" aria-hidden />
                    <span lang={lang}>{ta ? speech.legislature.nameTa : speech.legislature.nameEn}</span>
                  </span>
                  <span lang={lang}>{ta ? speech.event.ta : speech.event.en}</span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-xs text-ink/50 dark:text-night-text/50" lang={lang}>
              {speakerLine(speech, ta)}
            </p>
            {/* One concise source-honest line when the source states no date/venue — the provenance
                page carries the full record, so the reading page stays undominated by absence. */}
            {absentFactsNote(speech, ta) && (
              <p className="mt-1 text-xs italic text-ink/40 dark:text-night-text/40" lang={lang}>
                {absentFactsNote(speech, ta)}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
              <ShareButtons title={`${speech.title.ta} · ${speech.title.en}`} path={`/speeches/${slug}`} />
              <div className="inline-flex overflow-hidden rounded-full border border-marina/40 text-xs font-medium">
                <button onClick={() => setShowEn(false)} className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={!showEn} lang="ta">
                  தமிழ்
                </button>
                <button onClick={() => setShowEn(true)} className={cn("focus-ring px-3 py-1 transition", showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={showEn}>
                  English
                </button>
              </div>
            </div>

            <p className={cn("mt-4 rounded-xl border border-dashed px-4 py-2.5 text-xs leading-relaxed", showEn ? "border-marina/40 bg-marina/[0.06] text-ink/70 dark:text-night-text/70" : "border-ink/15 bg-ink/[0.02] text-ink/60 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/60")} lang={lang}>
              {showEn
                ? ta
                  ? "இது மூலத் தமிழுடன் இணைக்கப்பட்ட, சரிபார்க்கப்பட்ட நம்பகமான ஆங்கில வாசிப்பு மொழிபெயர்ப்பு. தமிழ் மூலமே சான்றுநிலை."
                  : "A verified, source-linked faithful English reading translation. The Tamil original remains authoritative."
                : ta
                  ? "கீழே அச்சிட்ட நூலின்படி சரிபார்க்கப்பட்ட மூல தமிழ் உரை — மாற்றமின்றி; அச்சுத் தலைப்புகளும் பக்க எல்லைகளும் தக்கவைக்கப்பட்டுள்ளன."
                  : "Below is the verified original Tamil, faithful to the printed source booklet — printed section headings and source-page boundaries preserved."}
            </p>
          </>
        )}

        {!speech && !error && <p className="mt-8 text-sm text-ink/50 dark:text-night-text/50">{ta ? "உரை ஏற்றப்படுகிறது…" : "Opening the speech…"}</p>}
        {error && <p className="mt-8 text-sm text-ink/50 dark:text-night-text/50">{ta ? "இந்த உரையை ஏற்ற முடியவில்லை." : "This speech could not be loaded."}</p>}

        {/* Source-order blocks: printed section headings, resolved logical paragraphs, and —
            where the paragraph relationship is scan-pending — a NEUTRAL group (not separate
            paragraphs) with a source-page rule between the runs. */}
        {speech && (
          <div className={cn("mt-8", showEn ? "font-body" : "font-tamil", sizes[font])} lang={showEn ? "en" : "ta"}>
            {renderBlocks(blocks, ta)}
          </div>
        )}

        {/* Provenance / source note. */}
        {speech && (
          <p className="mt-10 border-t border-ink/10 pt-4 text-xs italic leading-relaxed text-ink/45 dark:border-white/10 dark:text-night-text/45" lang={lang}>
            {ta
              ? `${provenanceLine(speech, true)} அச்சிட்ட மூலத்துடன் ஒப்பிட்டுச் சரிபார்க்கப்பட்டது. `
              : `${provenanceLine(speech, false)} Transcribed and verified against the printed source. `}
            <Link href={`/speeches/${slug}/source`} className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina dark:hover:text-marina-light">
              {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
            </Link>
          </p>
        )}

        {/* Cross-links. */}
        <div className="mt-10 rounded-2xl border border-ink/10 bg-white/40 p-4 dark:border-white/10 dark:bg-night-surface/40" data-print="hide">
          <p className="text-[11px] uppercase tracking-wider text-marina dark:text-marina-light">{ta ? "கலைஞர் வேறிடங்களில்" : "Elsewhere Kalaignar writes"}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Link href="/read/nenjukku-neethi" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-marina/50 dark:border-white/15" lang={lang}>
              <BookOpen className="h-3.5 w-3.5 text-marina" aria-hidden /> {ta ? "நெஞ்சுக்கு நீதி" : "Nenjukku Neethi"}
            </Link>
            <Link href="/read" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-marina/50 dark:border-white/15" lang={lang}>
              <Info className="h-3.5 w-3.5 text-marina" aria-hidden /> {ta ? "மின்னூலகம்" : "The library"}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

// `whitespace-pre-line` on the paragraph/run containers preserves INTENTIONAL source line breaks
// (a Markdown hard break inside one source paragraph, e.g. the lineated p.9 language-policy
// quotation) while still collapsing ordinary wrapping whitespace. Texts without a newline are
// unaffected, so this changes nothing for Udhaya or Poonthottam.
// Render the ordered block stream. A run of [paragraph, unresolved-break, paragraph, …] is
// wrapped in ONE non-<p> `role="group"` so an unresolved paragraph relationship asserts neither
// a break nor a continuation; standalone resolved paragraphs render as <p>.
function renderBlocks(blocks: SpeechBlock[], ta: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.kind === "heading") {
      out.push(
        <h2 key={i} className={cn("mb-3 mt-8 font-semibold leading-snug text-marina dark:text-marina-light")}>
          {inline(b.text)}
        </h2>,
      );
      i++;
      continue;
    }
    if (b.kind === "note") {
      out.push(
        <p key={i} className="mb-6 rounded-xl border-l-2 border-ink/15 bg-ink/[0.02] py-2.5 pl-4 pr-4 text-[0.9em] italic leading-relaxed text-ink/60 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/60">
          {inline(b.text)}
        </p>,
      );
      i++;
      continue;
    }
    if (b.kind === "paragraph") {
      // Part of an unresolved-relationship group?
      if (blocks[i + 1]?.kind === "unresolved-break") {
        const group: SpeechBlock[] = [b];
        i++;
        while (blocks[i]?.kind === "unresolved-break" && blocks[i + 1]?.kind === "paragraph") {
          group.push(blocks[i], blocks[i + 1]);
          i += 2;
        }
        out.push(<UnresolvedGroup key={"g" + i} items={group} ta={ta} />);
        continue;
      }
      out.push(
        <p key={i} className="mb-5 whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">
          {renderSegments(b.segments, ta)}
        </p>,
      );
      i++;
      continue;
    }
    // A stray unresolved-break (shouldn't occur outside a group) → neutral marker.
    if (b.kind === "unresolved-break") {
      out.push(<PageRule key={i} toPage={b.toPage} note={b.note} ta={ta} />);
    }
    i++;
  }
  return out;
}

// A NEUTRAL group for an unresolved printed-paragraph relationship: the runs are <div>s (NOT
// <p>) and the source-page rule sits between them. role="group" + aria-label communicate that
// the printed paragraph relationship across these source pages is unresolved.
function UnresolvedGroup({ items, ta }: { items: SpeechBlock[]; ta: boolean }) {
  return (
    <div
      role="group"
      aria-label={ta ? "மூலப் பக்க எல்லை — அச்சுப் பத்தி உறவு தீர்மானிக்கப்படவில்லை" : "source page boundary — printed paragraph relationship unresolved"}
      className="mb-5"
    >
      {items.map((it, k) =>
        it.kind === "unresolved-break" ? (
          <PageRule key={k} toPage={it.toPage} note={it.note} ta={ta} />
        ) : it.kind === "paragraph" ? (
          <div key={k} className="whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">
            {renderSegments(it.segments, ta)}
          </div>
        ) : null,
      )}
    </div>
  );
}

// A subtle labelled source-page rule (neutral — asserts no paragraph relationship).
function PageRule({ toPage, note, ta }: { toPage: number; note?: string; ta: boolean }) {
  return (
    <div className="my-4 flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink/35 dark:text-night-text/35" title={note} data-print="hide" role="separator" aria-label={ta ? `மூலப் பக்கம் ${toPage} எல்லை — அச்சுப் பத்தி உறவு தீர்மானிக்கப்படவில்லை` : `source page ${toPage} boundary — printed paragraph relationship unresolved`}>
      <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" aria-hidden />
      <span className="font-body normal-case tracking-normal" aria-hidden>{ta ? `மூலப் பக்கம் ${toPage}` : `source p. ${toPage}`}</span>
      <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" aria-hidden />
    </div>
  );
}

// Render a paragraph's per-source-page segments as inline nodes, joined per `joinToNext`:
// "none" = no space (mid-word split); "space" = a single space; "unknown" = a NEUTRAL inline
// source-page marker (the exact printed spacing is unresolved — never silently spaced or
// concatenated); "end" = last segment. Each fragment keeps faithful inline Markdown.
function renderSegments(segments: { text: string; sourcePage: number | null; joinToNext: string }[], ta: boolean): ReactNode[] {
  const nodes: ReactNode[] = [];
  segments.forEach((s, i) => {
    nodes.push(<span key={"t" + i}>{inline(s.text)}</span>);
    if (s.joinToNext === "space") nodes.push(" ");
    else if (s.joinToNext === "unknown") {
      const p = segments[i + 1]?.sourcePage;
      nodes.push(
        <span
          key={"j" + i}
          className="mx-0.5 select-none align-baseline text-[0.7em] text-ink/35 dark:text-night-text/35"
          title={ta ? `மூலப் பக்கம் ${p} எல்லை — சரியான இடைவெளி தீர்மானிக்கப்படவில்லை` : `source page ${p} boundary — exact printed spacing unresolved`}
          role="separator"
          aria-label={ta ? `மூலப் பக்கம் ${p} எல்லை — சரியான இடைவெளி தீர்மானிக்கப்படவில்லை` : `source page ${p} boundary — exact printed spacing unresolved`}
        >
          {"⟨"}
          {ta ? `ப.${p}` : `p.${p}`}
          {"⟩"}
        </span>,
      );
    }
    // "none" / "end" → no separator (fragments abut with no space).
  });
  return nodes;
}

// Minimal, faithful inline Markdown rendering for the source text: **bold** (used by the
// source for parliamentary interjection speaker labels and the subtitle), *italic* (used for
// interjections such as *(Laughter.)* and cited publication names), and `code` (used by the
// public-speech translator notes to cite verbatim source-supported Tamil forms). Nothing else is
// interpreted; the text is otherwise verbatim.
function inline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={k++} className="font-semibold">{m[1]}</strong>);
    else if (m[2] !== undefined) nodes.push(<em key={k++}>{m[2]}</em>);
    else nodes.push(<code key={k++} className="rounded bg-ink/[0.06] px-1 py-0.5 text-[0.9em] dark:bg-white/10">{m[3]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// Speaker's bare name (no honorific/role). Used in the provenance line.
function speakerName(s: Speech, ta: boolean): string {
  return ta ? s.speaker.nameTa : s.speaker.nameEn;
}

// The speaker line under the title. An assembly speech shows the parliamentary office AFTER the
// name ("name — Chief Minister"); a public speech shows the source's honorific/style BEFORE the
// name ("தோழர் மு.கருணாநிதி"), exactly as the booklet attributes it — and just the name if none.
function speakerLine(s: Speech, ta: boolean): string {
  const name = ta ? s.speaker.nameTa : s.speaker.nameEn;
  const role = ta ? s.speaker.roleTa : s.speaker.roleEn;
  if (!role) return name;
  return s.subtype === "public-speech" ? `${role} ${name}` : `${name} — ${role}`;
}

// The context shown in the provenance line: legislature for an assembly speech, the source-stated
// venue for a public speech — or, when the source states none, the neutral speech-kind label.
function speechContext(s: Speech, ta: boolean): string {
  if (s.subtype === "public-speech") {
    if (s.venue) return ta ? s.venue.ta : s.venue.en;
    return ta ? "பொது உரை" : "Public speech";
  }
  return ta ? s.legislature.nameTa : s.legislature.nameEn;
}

// Build the provenance line from ONLY the parts the source establishes, so it stays grammatical
// when a speech has no stated date (and, for a public speech, no stated venue):
//   "M. Karunanidhi · Tamil Nadu Legislative Assembly, 9 September 1970."
//   "M. Karunanidhi · Public speech."
// It never emits "null", "undefined" or a dangling comma.
function provenanceLine(s: Speech, ta: boolean): string {
  const parts = [speechContext(s, ta)];
  if (s.date) parts.push(formatDate(s.date, ta));
  return `${speakerName(s, ta)} · ${parts.join(", ")}.`;
}

// One concise, source-honest sentence when the examined source states neither a date nor a venue.
// The provenance page carries the full documentation; the reading page just avoids silent absence.
function absentFactsNote(s: Speech, ta: boolean): string | null {
  const noDate = !s.date;
  const noVenue = s.subtype === "public-speech" && !s.venue;
  if (!noDate && !noVenue) return null;
  if (noDate && noVenue) {
    return ta
      ? "இவ்வுரையின் தேதியையோ இடத்தையோ பரிசோதிக்கப்பட்ட மூலம் குறிப்பிடவில்லை."
      : "Speech date and venue are not stated in the examined source.";
  }
  if (noDate) {
    return ta
      ? "இவ்வுரையின் தேதியைப் பரிசோதிக்கப்பட்ட மூலம் குறிப்பிடவில்லை."
      : "The speech date is not stated in the examined source.";
  }
  return ta
    ? "இவ்வுரையின் இடத்தைப் பரிசோதிக்கப்பட்ட மூலம் குறிப்பிடவில்லை."
    : "The speech venue is not stated in the examined source.";
}

function formatDate(iso: string, ta: boolean) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return iso;
  if (ta) return `${d}-${m}-${y}`;
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return d ? `${d} ${months[m - 1]} ${y}` : `${months[m - 1]} ${y}`;
}
