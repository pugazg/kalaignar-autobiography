"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Feather, Home, Info, Minus, Plus, Radio } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import type { Poem, PoemLayer } from "@/data/poems";
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

// The released English marks transliterated Tamil terms and cited titles with Markdown emphasis
// (*Muttamil*, *purappāṭṭu*, *Kalingattu Parani* …) — release typography, not literal asterisks in
// the poem. The DATA keeps every line verbatim, including the markers, so the validator's
// reconstruction stays byte-exact; only the RENDERING resolves them to <em>, exactly as the speech
// reader does. The Tamil layer carries no markup at all, so this is a no-op there.
function inline(text: string): ReactNode {
  if (!text.includes("*")) return text;
  const nodes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={k++} className="font-semibold">{m[1]}</strong>);
    else nodes.push(<em key={k++}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function lineStyle(indent: number): React.CSSProperties {
  const base = (indent / 4) * INDENT_EM;
  return { paddingLeft: `${base + HANG_EM}em`, textIndent: `-${HANG_EM}em` };
}

export default function PoemReader({ slug }: { slug: string }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [poem, setPoem] = useState<Poem | null>(null);
  const [error, setError] = useState(false);
  const [font, setFont] = useState(1);
  // Source-first: the verified Tamil is authoritative and is the default reading layer; the
  // RELEASE-COMPLETE English translation is one toggle away.
  const [showEn, setShowEn] = useState(false);

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
            <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">{poem.title.en}</p>
            <p className="mt-2 text-sm text-ink/60 dark:text-night-text/60" lang={lang}>
              {ta ? poem.author.nameTa : poem.author.nameEn}
            </p>

            {/* SOURCE CONTEXT — what the note printed above the poem establishes. It is metadata:
                not one word of it appears in the verse below. A publication/edition year is NOT
                shown, because the controlling scan establishes none. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/55 dark:text-night-text/55">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                <span lang={lang}>{ta ? "9.2.1969" : "9 February 1969"}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5" aria-hidden />
                <span lang={lang}>{ta ? poem.sourceContext.venue.ta : poem.sourceContext.venue.en}</span>
              </span>
              <span lang={lang}>{ta ? poem.sourceContext.occasion.ta : poem.sourceContext.occasion.en}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
              <ShareButtons title={`${poem.title.ta} · ${poem.title.en}`} path={`/poems/${slug}`} />
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
                  ? "இது திட்டத்தால் உருவாக்கப்பட்ட, முழு மதிப்பீடு நிறைவுற்ற ஆங்கில மொழிபெயர்ப்பு. வரி அமைப்பும் பத்தி அமைப்பும் வெளியிடப்பட்டபடியே. தமிழ் மூலமே சான்றுநிலை."
                  : "The project-created, release-complete English translation — its lineation and stanza structure exactly as released. The Tamil original remains authoritative."
                : ta
                  ? "கீழே அச்சிட்ட மூலத்தின்படி சரிபார்க்கப்பட்ட தமிழ்க் கவிதை — வரிகள், வரி வரிசை, பத்தி இடைவெளிகள், இடைவெளியிடல், நிறுத்தக் குறிகள் அனைத்தும் மூலத்தின்படியே."
                  : "The verified Tamil poem, faithful to the printed source — lines, line order, stanza gaps, indentation and punctuation all exactly as the source has them."}
            </p>
          </>
        )}

        {!poem && !error && <p className="mt-8 text-sm text-ink/50 dark:text-night-text/50">{ta ? "கவிதை ஏற்றப்படுகிறது…" : "Opening the poem…"}</p>}
        {error && <p className="mt-8 text-sm text-ink/50 dark:text-night-text/50">{ta ? "இந்தக் கவிதையை ஏற்ற முடியவில்லை." : "This poem could not be loaded."}</p>}

        {/* THE POEM. Each released stanza is one <section>; each source line is one <span> laid out
            as its own display line. A long line WRAPS on a narrow viewport (it is not clipped and
            forces no horizontal scrolling) while remaining ONE logical source line — the data model
            never splits it. Source-page transitions are deliberately invisible here: they are
            provenance, they live in the data and on the /source page, and interrupting verse with a
            marker between every page would be intrusive and would suggest a break that does not
            exist. */}
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
            {layer.stanzas.map((st, i) => (
              <section key={i} className="mb-7 last:mb-0" aria-label={ta ? `பத்தி ${i + 1}` : `Stanza ${i + 1}`}>
                {st.lines.map((l, j) => (
                  <span key={j} className="block leading-[1.85] text-ink/90 dark:text-night-text/90" style={lineStyle(l.indent)}>
                    {inline(l.text)}
                  </span>
                ))}
              </section>
            ))}
          </div>
        )}

        {/* Provenance / source note. */}
        {poem && (
          <p className="mt-10 border-t border-ink/10 pt-4 text-xs italic leading-relaxed text-ink/45 dark:border-white/10 dark:text-night-text/45" lang={lang}>
            {ta
              ? `${poem.author.nameTa} · ${poem.sourceContext.venue.ta}, 9.2.1969. அச்சிட்ட மூலத்துடன் ஒப்பிட்டு 14/14 கவிதைப் பக்கங்களும் சரிபார்க்கப்பட்டன. `
              : `${poem.author.nameEn} · ${poem.sourceContext.venue.en}, 9 February 1969. All 14 poem scans verified against the printed source. `}
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
