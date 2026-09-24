"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock, Home, ListOrdered, Minus, Plus, TriangleAlert } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import ShareQuote from "@/components/ShareQuote";
import type { MurasoliLetterMeta } from "@/data/murasoli";
import type { Wave8MurasoliLetter } from "@/lib/wave8-murasoli-reader";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { queryForms } from "@/lib/transliterate";
import { useReaderProgress } from "@/lib/useReaderProgress";

type Letter = MurasoliLetterMeta & { volume: number };

type Props = {
  letter: Letter;
  prev: Letter | null;
  next: Letter | null;
  alsoInVolume: Letter[];
  sourceUrl?: string;
  /**
   * Wave 8 (Vols 42–47): the complete, source-pinned reader payload, injected by the server. When present the letter
   * renders from it — page-segmented Tamil, released English, source-condition qualification — and NOTHING is
   * fetched. When absent (Vols 48–54) the original fetch path runs unchanged.
   */
  content?: Wave8MurasoliLetter;
  /** Test/SSR seed for the English toggle (injected letters only); defaults to Tamil. */
  initialShowEn?: boolean;
};

const READ_KEY = "mu:read";
const LAST_KEY = "mu:last";
const POS_PREFIX = "mu:pos:";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${Number(d)}.${Number(m)}.${y}`;
}

export default function MurasoliLetterReader({ letter, prev, next, alsoInVolume, sourceUrl, content, initialShowEn }: Props) {
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
  const [showEn, setShowEn] = useState(content ? initialShowEn ?? false : false);

  useEffect(() => {
    if (content) return; // Wave-8 letters are injected in full; the legacy public-JSON fetch never runs for them.
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

  // Shared reading behaviour: scroll progress, position restore, mark-as-read
  // (auto at ~95% + manual toggle), and recording this as the resume point.
  const { progress, isRead, toggleRead } = useReaderProgress({
    id: letter.id,
    ready: !!paras || !!content,
    readKey: READ_KEY,
    posPrefix: POS_PREFIX,
    lastKey: LAST_KEY,
  });
  const readMins = content
    ? Math.max(1, Math.round(content.tamilPages.map((p) => p.text).join(" ").split(/\s+/).length / 200))
    : paras ? Math.max(1, Math.round(paras.join(" ").split(/\s+/).length / 200)) : null;

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

  const displayParas = showEn && enParas ? enParas : paras;

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
              {progress > 0 && <span className="ml-2 tabular-nums text-marina dark:text-marina-light">{progress}%</span>}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setFont(Math.max(0, font - 1))} disabled={font === 0} className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina disabled:opacity-30 dark:text-night-text/60" aria-label="Smaller text">
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <button onClick={() => setFont(Math.min(2, font + 1))} disabled={font === 2} className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina disabled:opacity-30 dark:text-night-text/60" aria-label="Larger text">
              <Plus className="h-4 w-4" aria-hidden />
            </button>
            <button onClick={toggleRead} className={cn("focus-ring rounded p-1.5", isRead ? "text-marina dark:text-marina-light" : "text-ink/60 hover:text-marina dark:text-night-text/60")} aria-label={ta ? (isRead ? "வாசித்ததாகக் குறிக்கப்பட்டது" : "வாசித்ததாகக் குறிக்க") : (isRead ? "Marked as read" : "Mark as read")} aria-pressed={isRead} title={ta ? "வாசித்ததா?" : "Mark as read"}>
              {isRead ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Circle className="h-4 w-4" aria-hidden />}
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
        {/* thin scroll-through bar pinned to the header's lower edge */}
        <div className="h-0.5 w-full bg-transparent" aria-hidden>
          <div className="h-full bg-marina transition-[width] duration-300 dark:bg-marina-light" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-brass">
          {ta ? "முரசொலி கடிதங்கள்" : "Murasoli Letters"}
          {letter.number != null && <> · {letter.number}</>}
        </p>
        <h1 className="mt-3 font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl" lang="ta">
          {content ? (showEn ? content.title.en : letter.title.ta) : showEn && enTitle ? enTitle : letter.title.ta}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50 dark:text-night-text/50">
          {letter.date && <span>{ta ? "நாள்" : "Dated"} {formatDate(letter.date)}</span>}
          {content?.date.fromPrintedContents && (
            <span data-testid="date-from-contents">{ta ? "(தேதி: அச்சிட்ட பொருளடக்கத்திலிருந்து)" : "(date from the printed contents)"}</span>
          )}
          {readMins !== null && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {ta ? `சுமார் ${readMins} நிமிட வாசிப்பு` : `~${readMins} min read`}
            </span>
          )}
          {isRead && (
            <span className="inline-flex items-center gap-1 text-marina dark:text-marina-light">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              {ta ? "வாசித்தது" : "read"}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
          <ShareButtons title={`${letter.title.ta} · முரசொலி`} path={`/murasoli/${letter.id}`} />
          {(enParas || content) && (
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

        {content && <Wave8Notices content={content} ta={ta} showEn={showEn} />}

        {!content && showEn && enParas && (
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

        {!content && showEn && enNote && (
          <p className="mt-3 text-xs italic leading-relaxed text-ink/55 dark:text-night-text/55">
            {enNote}
          </p>
        )}

        {/* In-letter jump list for long letters (Tamil view only; mechanical labels) */}
        {!content && !showEn && paras && paras.length > 12 && (
          <details className="not-prose mt-6 rounded-xl border border-ink/10 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-night-surface/60" data-print="hide">
            <summary className="focus-ring inline-flex cursor-pointer items-center gap-2 text-marina dark:text-marina-light">
              <ListOrdered className="h-4 w-4" aria-hidden />
              {ta ? `பத்திகள் (${paras.length}) — நேரடிச் செல்ல` : `Paragraphs (${paras.length}) — jump to`}
            </summary>
            <ol className="mt-3 grid max-w-full gap-1 overflow-hidden sm:grid-cols-2">
              {paras.map((p, i) => (
                <li key={i} className="min-w-0">
                  <a href={`#mu-para-${i}`} className="focus-ring block max-w-full truncate rounded px-1 py-0.5 font-tamil text-ink/70 hover:text-marina dark:text-night-text/70" lang="ta">
                    <span className="mr-1.5 font-mono text-[10px] text-ink/35 dark:text-night-text/35">{i + 1}</span>
                    {p.split(/\s+/).slice(0, 7).join(" ")}…
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        {content && <Wave8Body content={content} ta={ta} showEn={showEn} sizeClass={sizes[font]} />}

        {!content && <div className={cn("mt-8 space-y-5 leading-loose text-ink/90 dark:text-night-text/90", showEn ? "font-body" : "font-tamil", sizes[font])} lang={showEn ? "en" : "ta"}>
          {!paras && !error && <p className="text-sm text-ink/50 dark:text-night-text/50">{ta ? "கடிதம் ஏற்றப்படுகிறது…" : "Loading the letter…"}</p>}
          {error && <p className="text-sm text-ink/50 dark:text-night-text/50">{ta ? "இந்தக் கடிதத்தை ஏற்ற முடியவில்லை." : "This letter could not be loaded."}</p>}
          {!showEn && paras && salutation && <p className="font-medium text-marina dark:text-marina-light">{salutation}</p>}
          {showEn && enParas && <p className="font-medium text-marina dark:text-marina-light">{enSalutation ?? "Udanpirappē,"}</p>}
          {displayParas?.map((p, i) => <p key={i} id={showEn ? undefined : `mu-para-${i}`} className={showEn ? undefined : "scroll-mt-28"}>{highlight(p)}</p>)}
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
        </div>}

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

        {alsoInVolume.length > 0 && (
          <section className="mt-10" aria-label={ta ? "இந்தத் தொகுதியில் மேலும்" : "Also in this volume"}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
              {ta ? `தொகுதி ${letter.volume}-இல் மேலும் கடிதங்கள்` : `More in Volume ${letter.volume}`}
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {alsoInVolume.map((l) => (
                <li key={l.id}>
                  <Link href={`/murasoli/${l.id}`} className="focus-ring block rounded-xl border border-ink/10 p-3 transition hover:border-marina/50 dark:border-white/10">
                    <span className="block text-[10px] text-ink/40 dark:text-night-text/40">
                      {l.number != null ? (ta ? `கடிதம் ${l.number}` : `Letter ${l.number}`) : `Vol ${l.volume}`}
                      {l.date ? ` · ${formatDate(l.date)}` : ""}
                    </span>
                    <span className="mt-0.5 block truncate font-tamil text-sm text-marina dark:text-marina-light" lang="ta">{l.title.ta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
      <ShareQuote title={letter.title.ta} refLabel={letter.number != null ? (ta ? `கடிதம் ${letter.number}` : `Letter ${letter.number}`) : `முரசொலி · தொகுதி ${letter.volume}`} />
    </div>
  );
}

// ── Wave 8 (Vols 42–47): injected, source-pinned letters ─────────────────────────────────────────────────────────────
// Faithful inline Markdown the archive uses in its transcriptions (**bold**, *italic*, `code`, `\*` escapes).
function inline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const re = /\\([*_`])|\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`]+)`/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(m[1]);
    else if (m[2] !== undefined) nodes.push(<strong key={k++} className="font-semibold">{m[2]}</strong>);
    else if (m[3] !== undefined) nodes.push(<em key={k++}>{m[3]}</em>);
    else nodes.push(<code key={k++} className="rounded bg-ink/[0.06] px-1 py-0.5 text-[0.9em] dark:bg-white/10">{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Split a source text into blank-line-separated blocks, keeping every source line (hard breaks stay line breaks). */
function blocks(text: string): string[] {
  return text.split(/\n[ \t]*\n/).map((b) => b.replace(/[ \t]+$/gm, "")).filter((b) => b.trim() !== "");
}

function renderBlock(b: string, key: number, lang: "ta" | "en"): ReactNode {
  const h = /^(#{1,6}) (.+)$/.exec(b);
  if (h && !b.includes("\n")) return <h2 key={key} className="mt-6 font-semibold leading-snug text-marina dark:text-marina-light" data-block="heading">{inline(h[2])}</h2>;
  if (b.split("\n").every((l) => l.startsWith(">"))) {
    return <blockquote key={key} className="whitespace-pre-line border-l-2 border-marina/40 py-1 pl-4 text-ink/80 dark:text-night-text/80" data-block="quotation">{inline(b.split("\n").map((l) => l.replace(/^> ?/, "")).join("\n"))}</blockquote>;
  }
  return <p key={key} className="whitespace-pre-line" data-block={lang === "ta" ? "tamil" : "english"}>{inline(b)}</p>;
}

function Wave8Notices({ content, ta, showEn }: { content: Wave8MurasoliLetter; ta: boolean; showEn: boolean }) {
  const q = content.qualification;
  return (
    <>
      {q && (
        <div className="mt-4 rounded-xl border border-dashed border-ink/30 bg-ink/[0.03] px-4 py-3 text-xs leading-relaxed text-ink/75 dark:border-white/25 dark:bg-white/[0.04] dark:text-night-text/75" role="note" data-testid="source-condition" data-kind={q.kind} data-missing-printed-pages={q.missingPrintedPages.join(",")}>
          <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-ink/60 dark:text-night-text/60">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> {ta ? "மூலத்தின் நிலையான குறைவு" : "Permanent source condition"}
          </p>
          <p className="mt-1.5" lang={ta ? "ta" : "en"}>
            {ta
              ? `இக்கடிதம் மூலத்திலேயே முழுமையற்றது: அச்சுப் பக்கம் ${q.missingPrintedPages.join(", ")} கிடைக்கும் ஒரே மூல நூலில் இல்லை. கிடைக்கும் பக்கங்களின் உரை மட்டுமே இங்கு உள்ளது; விடுபட்ட தொடர்ச்சி, நிறைவுப் பகுதி, கையொப்பம், தேதி எவையும் உருவாக்கப்படவில்லை.`
              : `This letter is incomplete in the source itself: printed page ${q.missingPrintedPages.join(", ")} is absent from the only available source volume. Only the surviving pages are given here; no continuation, closing, signature or date has been supplied.`}
          </p>
        </div>
      )}
      <p className={cn("mt-4 rounded-xl border border-dashed px-4 py-2.5 text-xs leading-relaxed", showEn ? "border-brass/50 bg-brass/[0.06] text-ink/70 dark:text-night-text/70" : "border-ink/15 bg-ink/[0.02] text-ink/60 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/60")} lang={ta ? "ta" : "en"} data-testid="layer-note">
        {showEn
          ? ta
            ? "இது இத்திட்டத்தின் ஆங்கில மொழிபெயர்ப்பு — மூலத்துடன் ஒப்பிட்டுச் சரிபார்த்து, இருமொழி இணைவு மற்றும் பதிப்பாய்வு முடிந்து வெளியிடப்பட்டது. தமிழ் மூலமே சான்றுநிலை."
            : "A project English translation, released after source-checking, bilingual alignment and editorial review. The Tamil original remains authoritative."
          : ta
            ? "கீழே அச்சிட்ட நூலின் ஸ்கேனுடன் நேரடியாக ஒப்பிட்டுச் சரிபார்க்கப்பட்ட தமிழ் உரை, மூலப் பக்க வாரியாக."
            : "Below is the Tamil text verified directly against the scanned printed volume, page by source page."}
      </p>
      {showEn && content.english.translatorNote && (
        <p className="mt-3 text-xs italic leading-relaxed text-ink/55 dark:text-night-text/55" data-testid="translator-note">
          {inline(content.english.translatorNote.split("\n").map((l) => l.replace(/^> ?/, "")).filter((l) => l.trim()).join(" "))}
        </p>
      )}
    </>
  );
}

function Wave8Body({ content, ta, showEn, sizeClass }: { content: Wave8MurasoliLetter; ta: boolean; showEn: boolean; sizeClass: string }) {
  const q = content.qualification;
  const end = q && (
    <p className="mt-6 rounded-lg bg-ink/[0.04] px-3 py-2 font-body text-xs italic text-ink/60 dark:bg-white/[0.05] dark:text-night-text/60" data-testid="source-ends" lang={ta ? "ta" : "en"}>
      {ta
        ? `[மூலம் இங்கு முடிகிறது — அச்சுப் பக்கம் ${q.missingPrintedPages.join(", ")} இல்லை. தொடர்ச்சி, நிறைவு, கையொப்பம், தேதி எதுவும் சேர்க்கப்படவில்லை.]`
        : `[The surviving source ends here — printed page ${q.missingPrintedPages.join(", ")} is absent. No continuation, closing, signature or date has been supplied.]`}
    </p>
  );
  return (
    <div className={cn("mt-8 space-y-5 leading-loose text-ink/90 dark:text-night-text/90", showEn ? "font-body" : "font-tamil", sizeClass)} lang={showEn ? "en" : "ta"} data-testid="wave8-letter-body">
      {showEn ? (
        <>
          {content.english.subtitle && <p className="text-sm text-ink/60 dark:text-night-text/60" data-block="subtitle">{inline(content.english.subtitle)}</p>}
          {blocks(content.english.text).map((b, i) => renderBlock(b, i, "en"))}
        </>
      ) : (
        content.tamilPages.map((p) => (
          <section key={p.pdfPage} data-pdf-page={p.pdfPage} data-printed-page={p.printedPage ?? ""} aria-label={ta ? `அச்சுப் பக்கம் ${p.printedPage ?? "—"}` : `Printed page ${p.printedPage ?? "—"}`} className="space-y-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink/35 dark:text-night-text/35" role="separator" data-print="hide">
              <span className="h-px w-5 bg-ink/10 dark:bg-white/10" aria-hidden />
              <span className="font-body normal-case tracking-normal">
                {ta ? `அச்சுப் பக்கம் ${p.printedPage ?? "—"} · PDF ${p.pdfPage}` : `p. ${p.printedPage ?? "—"} · PDF ${p.pdfPage}`}
              </span>
              <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" aria-hidden />
            </div>
            {blocks(p.text).map((b, i) => renderBlock(b, i, "ta"))}
          </section>
        ))
      )}
      {end}
      <p className="mt-10 border-t border-ink/10 pt-4 text-xs italic text-ink/45 dark:border-white/10 dark:text-night-text/45" lang={ta ? "ta" : "en"} data-testid="wave8-provenance">
        {ta
          ? `மூலம்: கலைஞரின் கடிதங்கள் — தொகுதி ${content.volume} (சீதை பதிப்பகம்), ${content.source.filename}; PDF பக்கம் ${content.pdfPages[0]}–${content.pdfPages[1]}. தமிழ் உரை அச்சிட்ட நூலின் ஸ்கேனுடன் நேரடியாகச் சரிபார்க்கப்பட்டது; அச்சிட்ட கடித எண் மாற்றமின்றித் தரப்பட்டுள்ளது.`
          : `Source: Kalaignarin Kaditangal — Volume ${content.volume} (Seethai Pathippagam), ${content.source.filename}; PDF pages ${content.pdfPages[0]}–${content.pdfPages[1]}. The Tamil text is verified directly against the scanned printed volume; the letter number is given exactly as printed.`}
      </p>
    </div>
  );
}
