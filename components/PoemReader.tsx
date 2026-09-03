"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Feather, Home, Info, Minus, Plus, Radio } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import WitnessNote from "@/components/WitnessNote";
import type { WitnessLink } from "@/lib/witness";
import type { Poem, PoemElement, PoemLayer } from "@/data/poems";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useReaderProgress } from "@/lib/useReaderProgress";

const LAST_KEY = "poems:last";
const POS_PREFIX = "poems:pos:";

// Source indentation (4 / 8 spaces) becomes a bounded left inset, in `em` so it scales with the
// reader's font size. This preserves the source's stepped lineation WITHOUT putting the poem in a
// <pre>: each line stays a normal flow element that can still wrap on a narrow screen.
const INDENT_EM = 1.6;

// A long source line WRAPS on a narrow viewport. Without help, that visual second row would look
// exactly like a new poetic line — so continuation rows get a hanging indent: the line box is
// pushed right by HANG_EM and the FIRST row is pulled back by the same amount, leaving the source
// line starting on its own margin and every wrapped row visibly inset under it. The data model is
// untouched: a wrapped line is still ONE PoemLine.
const HANG_EM = 1.15;

// ── Markdown emphasis across source lines ────────────────────────────────────────────────────────
// The released English of one work opens a strong-emphasis span on one source line and closes it on
// the next:
//
//     **Autonomy for the states;
//     federalism at the Centre!**
//
// The previous line-local renderer could not pair those, so both delimiters were visible. The DATA is
// correct and stays byte-exact — this is a rendering concern only, and it is resolved here rather
// than by rewriting released text.
//
// The pairing is deliberately narrow, because a permissive one would silently emphasise the rest of
// a poem after any stray asterisk:
//
//   * only inside ONE VERSE RUN — a maximal run of consecutive lines. A run ends at a stanza break,
//     a page transition, a source heading or the end of the poem, and a span never crosses one.
//   * only when a matching close of the SAME length appears on a LATER line of that run, so
//     existing same-line rendering is untouched.
//   * flanking rules, as Markdown has them: an opener must be followed by a non-space character and
//     a closer preceded by one. A lone `*` on its own line is therefore neither — which is what
//     keeps மறத்தி's literal `*` ornament literal instead of pairing it with unrelated later text.
//   * anything left unmatched stays literal, exactly as it does today.
//
// One DOM line wrapper per source line is preserved throughout: emphasis wraps the text INSIDE each
// line, never across the wrappers, so lineation is unaffected.
type EmphTag = "em" | "strong";
type Piece = { text: string; tag: EmphTag | null };
type Delim = { line: number; start: number; end: number; len: number; canOpen: boolean; canClose: boolean; role: "open" | "close" | "literal" };
type Span = { start: number; end: number; innerStart: number; innerEnd: number; tag: EmphTag };

const BALANCED_RE = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/** Same-line balanced matches, and the `*` runs left over outside them. */
function scanLine(text: string, lineIndex: number): { spans: Span[]; delims: Delim[] } {
  const spans: Span[] = [];
  BALANCED_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BALANCED_RE.exec(text)) !== null) {
    const strong = m[1] !== undefined;
    const d = strong ? 2 : 1;
    spans.push({ start: m.index, end: m.index + m[0].length, innerStart: m.index + d, innerEnd: m.index + m[0].length - d, tag: strong ? "strong" : "em" });
  }
  const inSpan = (i: number) => spans.some((sp) => sp.start <= i && i < sp.end);
  const delims: Delim[] = [];
  for (let i = 0; i < text.length; ) {
    if (text[i] !== "*" || inSpan(i)) {
      i++;
      continue;
    }
    let j = i;
    while (j < text.length && text[j] === "*" && !inSpan(j)) j++;
    const after = text[j];
    const before = text[i - 1];
    delims.push({
      line: lineIndex,
      start: i,
      end: j,
      len: j - i,
      canOpen: after !== undefined && after !== " ",
      canClose: before !== undefined && before !== " ",
      role: "literal",
    });
    i = j;
  }
  return { spans, delims };
}

/**
 * Resolve one verse run into per-line pieces, each carrying the emphasis tag in force.
 * Returns one entry per input line, so the caller emits one wrapper per source line.
 */
function resolveRun(texts: string[]): Piece[][] {
  const scanned = texts.map((t, i) => scanLine(t, i));
  const all = scanned.flatMap((s) => s.delims);
  // Pair leftovers, opener first, close on a LATER line only.
  let open: Delim | null = null;
  for (let k = 0; k < all.length; k++) {
    const d = all[k];
    if (open === null) {
      if (!d.canOpen || d.len > 2) continue;
      const close = all.slice(k + 1).find((c) => c.len === d.len && c.canClose && c.line > d.line);
      if (!close) continue;
      d.role = "open";
      open = d;
    } else if (d.len === open.len && d.canClose && d.line > open.line) {
      d.role = "close";
      open = null;
    }
  }

  const out: Piece[][] = [];
  let carry: EmphTag | null = null;
  texts.forEach((text, i) => {
    const { spans, delims } = scanned[i];
    const features = [
      ...spans.map((sp) => ({ at: sp.start, end: sp.end, span: sp as Span | null, delim: null as Delim | null })),
      ...delims.map((d) => ({ at: d.start, end: d.end, span: null as Span | null, delim: d as Delim | null })),
    ].sort((a, b) => a.at - b.at);
    const pieces: Piece[] = [];
    const push = (t: string, tag: EmphTag | null) => {
      if (!t) return;
      const last = pieces[pieces.length - 1];
      if (last && last.tag === tag) last.text += t;
      else pieces.push({ text: t, tag });
    };
    let idx = 0;
    for (const f of features) {
      push(text.slice(idx, f.at), carry);
      if (f.span) push(text.slice(f.span.innerStart, f.span.innerEnd), f.span.tag);
      else if (f.delim!.role === "open") carry = f.delim!.len === 2 ? "strong" : "em";
      else if (f.delim!.role === "close") carry = null;
      else push(text.slice(f.at, f.end), carry); // unmatched: literal, exactly as before
      idx = f.end;
    }
    push(text.slice(idx), carry);
    out.push(pieces);
  });
  return out;
}

function piecesToNodes(pieces: Piece[]): ReactNode {
  if (pieces.length === 1 && pieces[0].tag === null) return pieces[0].text;
  return pieces.map((p, i) =>
    p.tag === "strong" ? (
      <strong key={i} className="font-semibold">{p.text}</strong>
    ) : p.tag === "em" ? (
      <em key={i}>{p.text}</em>
    ) : (
      <span key={i}>{p.text}</span>
    ),
  );
}

// Render the ordered element stream. Consecutive lines are grouped into an unlabelled verse run
// (a plain <div>, never an <h*> and never announced as a "stanza"); boundaries render between runs.
//
// Exported for testing. The reader fetches its payload in an effect, so a server render of the
// component shows no verse at all — and a test that could not see the verse could not prove that
// four structurally different poems render correctly. This function is the verse: pure, taking the
// element stream and the language, so the tests exercise the real rendering path rather than a
// re-implementation of it.
export function renderElements(elements: PoemElement[], ta: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  let run: ReactNode[] = [];
  let key = 0;
  const flush = (gap: string) => {
    if (run.length) {
      out.push(
        <div key={"r" + key++} className={gap}>
          {run}
        </div>,
      );
      run = [];
    }
  };
  // Lines are buffered rather than emitted one at a time, because an emphasis span may open on one
  // line and close on the next and the pairing is only decidable once the whole run is known. The
  // buffer is flushed at every boundary, which is exactly what confines a span to one verse run.
  let pending: { el: Extract<PoemElement, { kind: "line" }>; i: number }[] = [];
  const flushLines = () => {
    if (!pending.length) return;
    const resolved = resolveRun(pending.map((p) => p.el.text));
    pending.forEach((p, n) => {
      run.push(
        <span key={"l" + p.i} className="block leading-[1.85] text-ink/90 dark:text-night-text/90" style={lineStyle(p.el.indent)}>
          {piecesToNodes(resolved[n])}
        </span>,
      );
    });
    pending = [];
  };
  elements.forEach((el, i) => {
    if (el.kind === "line") {
      pending.push({ el, i });
      return;
    }
    flushLines();
    if (el.kind === "stanza-break") {
      // Source-established: a blank line inside one printed page. A full stanza gap is warranted.
      flush("mb-7");
      return;
    }
    if (el.kind === "source-heading") {
      // A heading the SOURCE prints inside the poem. It is marked up as a heading rather than styled
      // to look like one, so it reaches assistive technology as the structure it is — and it is
      // rendered smaller and quieter than the poem's own title, which stays the page's h1, so the
      // reader can tell a heading inside the work from the name of the work.
      flush("mb-7");
      out.push(
        <h2
          key={"h" + i}
          className="mb-5 font-display text-lg text-ink/80 dark:text-night-text/80"
          data-source-heading={el.sourceScan}
        >
          {el.text}
        </h2>,
      );
      return;
    }
    // A physical page transition. Only a source-ESTABLISHED same-stanza relation may close up
    // without a marker; an established boundary gets the stanza gap; anything unresolved gets the
    // neutral marker, which asserts neither.
    if (el.stanzaRelation === "same-stanza") {
      flush("");
      return;
    }
    if (el.stanzaRelation === "stanza-boundary") {
      flush("mb-7");
      return;
    }
    flush("mb-2");
    out.push(<PageTransitionRule key={"p" + i} toScan={el.toScan} ta={ta} />);
  });
  flushLines();
  flush("");
  return out;
}

// A deliberately restrained marker for an UNRESOLVED cross-page stanza relationship. Its vertical
// space is smaller than a stanza gap so it never reads as a stanza break, and it is visible so the
// lines on either side are not silently presented as continuous. The poem stays visually primary.
//
// PRINT FIDELITY (independent review defect). This marker deliberately does NOT carry
// `data-print="hide"`: that class is for interactive chrome, and the print stylesheet removes it
// entirely. A marker for an UNRESOLVED relation is PROVENANCE, not chrome — dropping it from
// Print → Save as PDF would leave the lines on either side silently continuous, which is exactly
// the assertion the source does not support. The `poem-page-transition` class carries a small,
// local print rule (see globals.css) so the marker survives on paper: its hairlines are re-drawn as
// borders, because background-colour rules are commonly dropped by printers, and the label gains an
// explicit "stanza relation unresolved" suffix in print, where no hover title or accessible name is
// available to explain it.
function PageTransitionRule({ toScan, ta }: { toScan: number; ta: boolean }) {
  const label = ta
    ? `மூலப் பக்க மாற்றம் — அச்சுப் பத்தித் தொடர்பு தீர்மானிக்கப்படவில்லை`
    : `Source page transition — stanza relationship unresolved`;
  return (
    <div
      className="poem-page-transition mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink/30 dark:text-night-text/30"
      role="separator"
      aria-label={label}
      title={label}
    >
      <span className="poem-page-transition-rule h-px w-6 bg-ink/10 dark:bg-white/10" aria-hidden />
      <span className="poem-page-transition-label font-body normal-case tracking-normal" aria-hidden>
        {ta ? `மூல ஸ்கேன் ${toScan}` : `source scan ${toScan}`}
        {/* Print-only suffix. On screen the marker stays terse (the accessible name and the hover
            title carry the explanation); on paper neither is available, so the printed marker spells
            the unresolved relation out. It is a real DOM node rather than CSS `content` so it
            follows the reader's language and can be verified in the rendered output. */}
        <span className="poem-page-transition-print-note">
          {ta ? " · அச்சுப் பத்தித் தொடர்பு தீர்மானிக்கப்படவில்லை" : " · stanza relation unresolved"}
        </span>
      </span>
      <span className="poem-page-transition-rule h-px flex-1 bg-ink/10 dark:bg-white/10" aria-hidden />
    </div>
  );
}

function lineStyle(indent: number): React.CSSProperties {
  const base = (indent / 4) * INDENT_EM;
  return { paddingLeft: `${base + HANG_EM}em`, textIndent: `-${HANG_EM}em` };
}

export default function PoemReader({ slug, witnessLinks = [] }: { slug: string; witnessLinks?: WitnessLink[] }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [poem, setPoem] = useState<Poem | null>(null);
  const [error, setError] = useState(false);
  const [font, setFont] = useState(1);
  // Source-first: the verified Tamil is authoritative and is the default reading layer; the
  // RELEASE-COMPLETE English translation is one toggle away.
  const [showEn, setShowEn] = useState(false);

  // ── Work-driven context values ──────────────────────────────────────────────────────────────────
  // Each is undefined/empty where the work's own source establishes nothing, so a poem printing no
  // context note simply renders no date, venue or occasion. Nothing here is specific to one poem.
  //
  // The Tamil date is the source's own printed form, verbatim. The English date is formatted from
  // the ISO date the source establishes — never re-parsed from the printed Tamil string, whose
  // format is a property of that edition rather than a date encoding.
  const ctx = poem?.sourceContext;
  const dateLabel = ta
    ? ctx?.datePrinted
    : ctx?.dateIso
      ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
          new Date(`${ctx.dateIso}T00:00:00Z`),
        )
      : ctx?.datePrinted;
  const venueClause = ctx?.venue ? ` · ${ta ? ctx.venue.ta : ctx.venue.en}` : "";
  const dateClause = dateLabel ? `, ${dateLabel}` : "";
  const scans = poem?.poemScans.length ?? 0;

  useEffect(() => {
    setPoem(null);
    setError(false);
    fetch(`/data/poems/${slug}/poem.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Poem) => setPoem(d))
      .catch(() => setError(true));
  }, [slug]);

  const { progress } = useReaderProgress({ id: slug, ready: !!poem, posPrefix: POS_PREFIX, lastKey: LAST_KEY });

  const sizes = ["text-base", "text-lg", "text-xl"];
  const layer: PoemLayer | null = poem ? (showEn ? poem.english : poem.tamil) : null;

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/read" className="focus-ring inline-flex items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60 dark:hover:text-marina-light" aria-label={ta ? "மின்னூலகம்" : "Library"}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> <span>{ta ? "கவிதைகள்" : "Poetry"}</span>
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            {poem && (
              <p className="truncate font-tamil text-xs text-ink/60 dark:text-night-text/60" lang="ta">
                {poem.title.ta}
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
          <div className="h-full bg-brass transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <article className="mx-auto max-w-2xl px-5 py-10 sm:px-6">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-brass">
          <Feather className="h-3.5 w-3.5" aria-hidden /> {ta ? "கவிதை" : "Poem"}
        </p>
        <h1 className="mt-3 font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl" lang="ta">
          {poem?.title.ta ?? (ta ? "ஏற்றப்படுகிறது…" : "Loading…")}
        </h1>
        {poem && (
          <>
            {/* The secondary title is a TRANSLATED title, so it renders only where one exists. Where
                the frozen release approves no English title, `title.en` falls back to the canonical
                Tamil title, and repeating it here would present the Tamil title as its own English
                translation. The equality test is the condition precisely because it is a fact about
                the data rather than a list of slugs: any work whose English title is unestablished
                behaves the same way, with no per-work branch to keep in sync. */}
            {poem.title.en !== poem.title.ta && (
              <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">{poem.title.en}</p>
            )}
            <p className="mt-2 text-sm text-ink/60 dark:text-night-text/60" lang={lang}>
              {ta ? poem.author.nameTa : poem.author.nameEn}
            </p>

            {/* SOURCE CONTEXT — what the note printed above the poem establishes. It is metadata:
                not one word of it appears in the verse below. A publication/edition year is NOT
                shown, because the controlling scan establishes none.

                EVERY PART IS CONDITIONAL, AND NONE OF IT IS THIS WORK'S. The date, venue and occasion
                were literals here while Poetry held one poem, which meant the next poem would have
                silently inherited 9.2.1969 and Chennai Radio. They are now read from the work's own
                source context, and each renders only where its own source establishes it. A poem
                whose scan prints no context note renders no row at all. */}
            {poem.sourceContext && (dateLabel || poem.sourceContext.venue || poem.sourceContext.occasion) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/55 dark:text-night-text/55">
                {dateLabel && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" aria-hidden />
                    <span lang={lang}>{dateLabel}</span>
                  </span>
                )}
                {poem.sourceContext.venue && (
                  <span className="inline-flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5" aria-hidden />
                    <span lang={lang}>{ta ? poem.sourceContext.venue.ta : poem.sourceContext.venue.en}</span>
                  </span>
                )}
                {poem.sourceContext.occasion && (
                  <span lang={lang}>{ta ? poem.sourceContext.occasion.ta : poem.sourceContext.occasion.en}</span>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
              <ShareButtons title={poem.title.en === poem.title.ta ? poem.title.ta : `${poem.title.ta} · ${poem.title.en}`} path={`/poems/${slug}`} />
              <div className="inline-flex overflow-hidden rounded-full border border-brass/50 text-xs font-medium">
                <button onClick={() => setShowEn(false)} className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-brass text-paper" : "text-brass hover:bg-brass/10")} aria-pressed={!showEn} lang="ta">
                  தமிழ்
                </button>
                <button onClick={() => setShowEn(true)} className={cn("focus-ring px-3 py-1 transition", showEn ? "bg-brass text-paper" : "text-brass hover:bg-brass/10")} aria-pressed={showEn}>
                  English
                </button>
              </div>
            </div>

            <p className={cn("mt-4 rounded-xl border border-dashed px-4 py-2.5 text-xs leading-relaxed", showEn ? "border-brass/40 bg-brass/[0.06] text-ink/70 dark:text-night-text/70" : "border-ink/15 bg-ink/[0.02] text-ink/60 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/60")} lang={lang}>
              {showEn
                ? ta
                  ? "இது திட்டத்தால் உருவாக்கப்பட்ட, முழு மதிப்பீடு நிறைவுற்ற ஆங்கில மொழிபெயர்ப்பு — வரிகளும் வரி வரிசையும் வெளியிடப்பட்டபடியே. ஒரு பக்கத்திற்குள் உள்ள பத்தி இடைவெளிகள் தக்கவைக்கப்படுகின்றன; பக்க மாற்றத்தில் அச்சுப் பத்தித் தொடர்பு மூலத்தால் நிறுவப்படாததால் நடுநிலையாகக் காட்டப்படுகிறது. தமிழ் மூலமே சான்றுநிலை."
                  : "The project-created, release-complete English translation — lines and line order exactly as released. Stanza gaps within a printed page are preserved; at a page transition the printed stanza relationship is not established by the source, so it is shown neutrally. The Tamil original remains authoritative."
                : ta
                  ? "கீழே அச்சிட்ட மூலத்தின்படி சரிபார்க்கப்பட்ட தமிழ்க் கவிதை — வரிகள், வரி வரிசை, இடைவெளியிடல், நிறுத்தக் குறிகள் அனைத்தும் மூலத்தின்படியே. ஒரு பக்கத்திற்குள் உள்ள பத்தி இடைவெளிகள் தக்கவைக்கப்படுகின்றன; பக்க மாற்றத்தில் அச்சுப் பத்தித் தொடர்பு தீர்மானிக்கப்படவில்லை."
                  : "The verified Tamil poem, faithful to the printed source — lines, line order, indentation and punctuation exactly as the source has them. Stanza gaps within a printed page are preserved; across a page transition the printed stanza relationship is unresolved and is marked as such."}
            </p>
          </>
        )}

        {poem && <WitnessNote links={witnessLinks} />}

        {!poem && !error && <p className="mt-8 text-sm text-ink/50 dark:text-night-text/50">{ta ? "கவிதை ஏற்றப்படுகிறது…" : "Opening the poem…"}</p>}
        {error && <p className="mt-8 text-sm text-ink/50 dark:text-night-text/50">{ta ? "இந்தக் கவிதையை ஏற்ற முடியவில்லை." : "This poem could not be loaded."}</p>}

        {/* THE POEM. Each source line is one display line; a long line WRAPS on a narrow viewport
            (hanging indent, no horizontal scrolling) while remaining ONE logical source line.
            Boundaries carry their own meaning:
              * a source-established stanza break (a blank line inside one printed page) renders as
                a full stanza gap;
              * a PAGE TRANSITION whose printed stanza relation the source does not establish renders
                as a NEUTRAL, restrained source-page marker: smaller than a stanza gap, so it does
                not assert a new stanza, and visible, so it does not assert continuation either.
            Runs are never labelled "stanza": where a run touches an unresolved page edge, the
            printed stanza it belongs to is simply not established. */}
        {poem && layer && (
          <div
            className={cn("mt-9", showEn ? "font-body" : "font-tamil", sizes[font])}
            lang={showEn ? "en" : "ta"}
            role="group"
            aria-label={
              ta
                ? showEn
                  ? "கவிதை — ஆங்கில மொழிபெயர்ப்பு"
                  : "கவிதை — மூல தமிழ்"
                : showEn
                  ? "The poem, English translation"
                  : "The poem, Tamil source"
            }
          >
            {renderElements(layer.elements, ta)}
          </div>
        )}

        {/* Provenance / source note. */}
        {poem && (
          <p className="mt-10 border-t border-ink/10 pt-4 text-xs italic leading-relaxed text-ink/45 dark:border-white/10 dark:text-night-text/45" lang={lang}>
            {/* Venue, date and scan count are the WORK'S, not this component's. The venue and date
                clauses appear only where the source establishes them; the scan count is counted from
                the work's own scan list rather than written out, so it can never disagree with it. */}
            {ta
              ? `${poem.author.nameTa}${venueClause}${dateClause}. அச்சிட்ட மூலத்துடன் ஒப்பிட்டு ${scans}/${scans} கவிதைப் பக்கங்களும் சரிபார்க்கப்பட்டன. `
              : `${poem.author.nameEn}${venueClause}${dateClause}. All ${scans} poem scans verified against the printed source. `}
            <Link href={`/poems/${slug}/source`} className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-brass">
              {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
            </Link>
          </p>
        )}

        {/* Cross-links. */}
        <div className="mt-10 rounded-2xl border border-ink/10 bg-white/40 p-4 dark:border-white/10 dark:bg-night-surface/40" data-print="hide">
          <p className="text-[11px] uppercase tracking-wider text-brass">{ta ? "கலைஞர் வேறிடங்களில்" : "Elsewhere Kalaignar writes"}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Link href="/read/nenjukku-neethi" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-brass/50 dark:border-white/15" lang={lang}>
              <BookOpen className="h-3.5 w-3.5 text-brass" aria-hidden /> {ta ? "நெஞ்சுக்கு நீதி" : "Nenjukku Neethi"}
            </Link>
            <Link href="/read" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-brass/50 dark:border-white/15" lang={lang}>
              <Info className="h-3.5 w-3.5 text-brass" aria-hidden /> {ta ? "மின்னூலகம்" : "The library"}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
