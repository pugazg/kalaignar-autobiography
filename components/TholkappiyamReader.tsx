"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock, Flower2, Home, ListOrdered, Mail, Minus, Plus } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import ShareQuote from "@/components/ShareQuote";
import type { TpMalarMeta } from "@/data/tholkappiyam";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { queryForms } from "@/lib/transliterate";
import { useReaderProgress } from "@/lib/useReaderProgress";

type Props = {
  malar: TpMalarMeta;
  prev: TpMalarMeta | null;
  next: TpMalarMeta | null;
  alsoInAdhikaram: TpMalarMeta[];
  collection: { publisher: string; year: number; sourceRepo: string; work: { ta: string; en: string } };
};

const READ_KEY = "tp:read";
const LAST_KEY = "tp:last";
const POS_PREFIX = "tp:pos:";

// Proper sandhi'd full forms of the three அதிகாரங்கள் (the index stores the short label).
const ADHIKARAM_FULL: Record<string, string> = {
  ezhuttu: "எழுத்ததிகாரம்",
  sol: "சொல்லதிகாரம்",
  porul: "பொருளதிகாரம்",
};

export default function TholkappiyamReader({ malar, prev, next, alsoInAdhikaram, collection }: Props) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [paras, setParas] = useState<string[] | null>(null);
  const [error, setError] = useState(false);
  const [font, setFont] = useState(1);
  const [find, setFind] = useState("");

  useEffect(() => {
    setParas(null);
    setError(false);
    fetch(`/data/tholkappiyam/text/${malar.id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setParas(d.paragraphs ?? []))
      .catch(() => setError(true));
  }, [malar.id]);

  // Shared reading behaviour: scroll progress, position restore, mark-as-read
  // (auto at ~95% + manual toggle), and recording this as the resume point.
  const { progress, isRead, toggleRead } = useReaderProgress({
    id: malar.id,
    ready: !!paras,
    readKey: READ_KEY,
    posPrefix: POS_PREFIX,
    lastKey: LAST_KEY,
  });
  const readMins = paras ? Math.max(1, Math.round(paras.join(" ").split(/\s+/).length / 200)) : null;

  const sizes = ["text-base", "text-lg", "text-xl"];

  const highlight = (text: string) => {
    const q = find.trim();
    if (q.length < 2) return text;
    try {
      const forms = queryForms(q);
      const rx = new RegExp(`(${forms.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
      const low = forms.map((f) => f.toLowerCase());
      return text.split(rx).map((part, i) =>
        low.includes(part.toLowerCase())
          ? <mark key={i} className="rounded bg-brass/30 px-0.5 dark:bg-brass/40">{part}</mark>
          : part,
      );
    } catch {
      return text;
    }
  };

  const isMalar = malar.kind === "malar";

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/tholkappiyam" className="focus-ring inline-flex items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-brass dark:text-night-text/60" aria-label={ta ? "பூங்காவின் உள்ளடக்கம்" : "Back to contents"}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> <span>{ta ? "பூங்கா" : "Contents"}</span>
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/60 hover:text-brass dark:text-night-text/60" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            <p className="truncate text-xs text-ink/60 dark:text-night-text/60" lang="ta">
              தொல்காப்பியப் பூங்கா{isMalar ? ` · மலர் ${malar.number}` : ""}
              {progress > 0 && <span className="ml-2 tabular-nums text-brass">{progress}%</span>}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setFont(Math.max(0, font - 1))} disabled={font === 0} className="focus-ring rounded p-1.5 text-ink/60 hover:text-brass disabled:opacity-30 dark:text-night-text/60" aria-label="Smaller text">
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <button onClick={() => setFont(Math.min(2, font + 1))} disabled={font === 2} className="focus-ring rounded p-1.5 text-ink/60 hover:text-brass disabled:opacity-30 dark:text-night-text/60" aria-label="Larger text">
              <Plus className="h-4 w-4" aria-hidden />
            </button>
            <button onClick={toggleRead} className={cn("focus-ring rounded p-1.5", isRead ? "text-brass" : "text-ink/60 hover:text-brass dark:text-night-text/60")} aria-label={ta ? (isRead ? "வாசித்ததாகக் குறிக்கப்பட்டது" : "வாசித்ததாகக் குறிக்க") : (isRead ? "Marked as read" : "Mark as read")} aria-pressed={isRead} title={ta ? "வாசித்ததா?" : "Mark as read"}>
              {isRead ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Circle className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-3xl items-center gap-2 border-t border-ink/5 px-4 py-1.5 dark:border-white/5" data-print="hide">
          <input
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder={ta ? "இந்த மலரில் தேடு…" : "Find in this blossom…"}
            className="w-full bg-transparent text-xs outline-none placeholder:text-ink/40 dark:placeholder:text-night-text/40"
            aria-label={ta ? "இந்த மலரில் தேடு" : "Find in this blossom"}
            lang="ta"
          />
          {find && <button onClick={() => setFind("")} className="focus-ring shrink-0 rounded px-1.5 text-xs text-ink/50 dark:text-night-text/50" aria-label="Clear">✕</button>}
        </div>
        {/* thin scroll-through bar pinned to the header's lower edge */}
        <div className="h-0.5 w-full bg-transparent" aria-hidden>
          <div className="h-full bg-brass transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-brass">
          <Flower2 className="h-3.5 w-3.5" aria-hidden />
          {isMalar ? (ta ? `மலர் ${malar.number}` : `Blossom ${malar.number}`) : (ta ? "பூங்கா நடைபாதை" : "Enter the garden")}
        </p>
        <h1 className="mt-3 font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl" lang="ta">
          {malar.title.ta}
        </h1>
        {readMins !== null && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink/50 dark:text-night-text/50">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {ta ? `சுமார் ${readMins} நிமிட வாசிப்பு` : `~${readMins} min read`}
            {isRead && (
              <span className="ml-2 inline-flex items-center gap-1 text-brass">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                {ta ? "வாசித்தது" : "read"}
              </span>
            )}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
          <ShareButtons title={`${malar.title.ta} · தொல்காப்பியப் பூங்கா`} path={`/tholkappiyam/${malar.id}`} />
        </div>

        {/* நூற்பா reference block — clearly the Tolkāppiyam source Kalaignar comments on,
            visually distinct (brass rule) from his commentary below. */}
        {isMalar && malar.adhikaram && (
          <aside className="mt-6 rounded-xl border-l-4 border-brass bg-brass/[0.06] py-3 pl-4 pr-4 dark:bg-brass/[0.1]" lang="ta">
            <p className="text-[11px] uppercase tracking-wider text-brass">{ta ? "மூல நூல் · தொல்காப்பியம்" : "Source · Tolkāppiyam"}</p>
            <p className="mt-1 font-tamil text-[15px] text-ink/80 dark:text-night-text/80">
              {ADHIKARAM_FULL[malar.adhikaram.key] ?? malar.adhikaram.ta}{malar.iyal ? ` › ${malar.iyal}` : ""}
              {malar.sutras.length > 0 && (
                <>
                  {" · "}
                  <span className="font-semibold">நூற்பா {malar.sutras.join(", ")}</span>
                </>
              )}
            </p>
            {malar.summary && (
              <p className="mt-2 font-tamil text-sm leading-relaxed text-ink/65 dark:text-night-text/65">{malar.summary}</p>
            )}
          </aside>
        )}
        {!isMalar && malar.summary && (
          <p className="mt-5 font-tamil text-base italic leading-relaxed text-ink/65 dark:text-night-text/65" lang="ta">{malar.summary}</p>
        )}

        {/* In-blossom jump list for long commentaries (mechanical, first-words labels) */}
        {paras && paras.length > 12 && (
          <details className="not-prose mt-8 rounded-xl border border-ink/10 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-night-surface/60" data-print="hide">
            <summary className="focus-ring inline-flex cursor-pointer items-center gap-2 text-brass">
              <ListOrdered className="h-4 w-4" aria-hidden />
              {ta ? `பத்திகள் (${paras.length}) — நேரடிச் செல்ல` : `Paragraphs (${paras.length}) — jump to`}
            </summary>
            <ol className="mt-3 grid max-w-full gap-1 overflow-hidden sm:grid-cols-2">
              {paras.map((p, i) => (
                <li key={i} className="min-w-0">
                  <a href={`#tp-para-${i}`} className="focus-ring block max-w-full truncate rounded px-1 py-0.5 font-tamil text-ink/70 hover:text-brass dark:text-night-text/70" lang="ta">
                    <span className="mr-1.5 font-mono text-[10px] text-ink/35 dark:text-night-text/35">{i + 1}</span>
                    {p.split(/\s+/).slice(0, 7).join(" ")}…
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        {/* Kalaignar's commentary */}
        <div className={cn("mt-8 space-y-5 font-tamil leading-loose text-ink/90 dark:text-night-text/90", sizes[font])} lang="ta">
          {!paras && !error && <p className="text-sm text-ink/50 dark:text-night-text/50">{ta ? "மலர் ஏற்றப்படுகிறது…" : "Opening the blossom…"}</p>}
          {error && <p className="text-sm text-ink/50 dark:text-night-text/50">{ta ? "இந்த மலரை ஏற்ற முடியவில்லை." : "This blossom could not be loaded."}</p>}
          {paras?.map((p, i) => <p key={i} id={`tp-para-${i}`} className="scroll-mt-28">{highlight(p)}</p>)}
        </div>

        {/* Cross-links to Kalaignar's other works */}
        <div className="mt-10 rounded-2xl border border-ink/10 bg-white/40 p-4 dark:border-white/10 dark:bg-night-surface/40" data-print="hide">
          <p className="text-[11px] uppercase tracking-wider text-brass">{ta ? "கலைஞர் வேறிடங்களில்" : "Elsewhere Kalaignar writes"}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Link href="/read" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-marina/50 dark:border-white/15" lang={lang}>
              <BookOpen className="h-3.5 w-3.5 text-marina" aria-hidden /> {ta ? "நெஞ்சுக்கு நீதி — வாழ்க்கை வரலாறு" : "Nenjukku Neethi — the memoir"}
            </Link>
            <Link href="/murasoli" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-marina/50 dark:border-white/15" lang={lang}>
              <Mail className="h-3.5 w-3.5 text-marina" aria-hidden /> {ta ? "முரசொலி கடிதங்கள்" : "Murasoli letters"}
            </Link>
          </div>
        </div>

        {/* Provenance */}
        <p className="mt-8 border-t border-ink/10 pt-4 text-xs italic leading-relaxed text-ink/45 dark:border-white/10 dark:text-night-text/45" lang={lang}>
          {ta
            ? `கலைஞரின் உரை · ${collection.publisher}, ${collection.year}. மூல அச்சுப் பக்கங்களுடன் ஒப்பிட்டுப் பதிவுசெய்யப்பட்டது. `
            : `Kalaignar's commentary · ${collection.publisher}, ${collection.year}. Transcribed and checked against the printed source. `}
          <a href={collection.sourceRepo} target="_blank" rel="noopener noreferrer" className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-brass">
            {ta ? "மூல மின்னாக்கம்" : "Source transcription"}
          </a>
          {". "}
          <a
            href={`https://github.com/pugazg/kalaignar-autobiography/issues/new?title=Tholkappiyam%20correction%3A%20${malar.id}&labels=correction&body=Malar%20id%3A%20${malar.id}%0AWhat%20should%20change%3A%20`}
            target="_blank" rel="noopener noreferrer"
            className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-brass"
          >
            {ta ? "பிழை கண்டீர்களா? தெரிவியுங்கள்" : "Spotted an error? Tell us"}
          </a>
        </p>

        <nav className="mt-10 flex items-center justify-between gap-3 border-t border-ink/10 pt-6 dark:border-white/10" aria-label="Malar navigation">
          {prev ? (
            <Link href={`/tholkappiyam/${prev.id}`} className="focus-ring inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-brass dark:text-night-text/70">
              <ChevronLeft className="h-4 w-4" aria-hidden /> {ta ? "முந்தையது" : "Previous"}
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/tholkappiyam/${next.id}`} className="focus-ring inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-brass dark:text-night-text/70">
              {ta ? "அடுத்தது" : "Next"} <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : <span />}
        </nav>

        {alsoInAdhikaram.length > 0 && (
          <section className="mt-10" aria-label={ta ? "இந்த அதிகாரத்தில் மேலும்" : "More in this adhikāram"}>
            <h2 className="font-tamil text-xs font-semibold uppercase tracking-[0.2em] text-brass" lang="ta">
              {ta
                ? `${malar.adhikaram?.ta ?? "பூங்கா"}-இல் மேலும் மலர்கள்`
                : `More in ${malar.adhikaram?.en ?? "the garden"}`}
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {alsoInAdhikaram.map((m) => (
                <li key={m.id}>
                  <Link href={`/tholkappiyam/${m.id}`} className="focus-ring block rounded-xl border border-ink/10 p-3 transition hover:border-brass/50 dark:border-white/10">
                    <span className="block text-[10px] text-ink/40 dark:text-night-text/40">
                      {ta ? `மலர் ${m.number}` : `Blossom ${m.number}`}{m.sutras.length > 0 ? ` · நூற்பா ${m.sutras.join(", ")}` : ""}
                    </span>
                    <span className="mt-0.5 block truncate font-tamil text-sm text-brass" lang="ta">{m.title.ta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
      <ShareQuote title={malar.title.ta} refLabel={isMalar ? (ta ? `மலர் ${malar.number}` : `Malar ${malar.number}`) : "தொல்காப்பியப் பூங்கா"} />
    </div>
  );
}
