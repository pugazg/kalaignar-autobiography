"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Home, ImageIcon, List, Minus, Plus, ScrollText, TriangleAlert } from "lucide-react";
import type { KuraloviyamBlock, KuraloviyamUnit, KuraloviyamUnitSummary } from "@/data/kuraloviyam";
import { kuraloviyamUnitLabel } from "@/data/kuraloviyam";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Nav = Pick<KuraloviyamUnitSummary, "id" | "kind" | "number" | "contentsKey" | "titleTa" | "titleEn"> | null;

// One reading unit of குறளோவியம்: its audited pages in order. The verified Tamil is the default layer and the
// project-created English is one toggle away. Three things are kept visibly apart from the text: the archive's
// own descriptions of illustrations/marks (`archival`), printed Kural citations (`citation`), and — on the four
// permanently source-limited scans — a plain statement of the source condition. Missing wording is never shown
// as if it existed.
export default function KuraloviyamReader({
  unit,
  prev,
  next,
  initialShowEn,
}: {
  unit: KuraloviyamUnit;
  prev: Nav;
  next: Nav;
  /** Test/SSR seed for the English toggle; defaults to false (Tamil-first). */
  initialShowEn?: boolean;
}) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [font, setFont] = useState(1);
  const [showEn, setShowEn] = useState(initialShowEn ?? false);
  const sizes = ["text-base", "text-lg", "text-xl"];
  const isEntry = unit.kind === "entry";
  const label = kuraloviyamUnitLabel(unit, ta);

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/kuraloviyam" className="focus-ring inline-flex items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60" aria-label={ta ? "பொருளடக்கம்" : "Contents"}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> <span>{ta ? "பொருளடக்கம்" : "Contents"}</span>
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            <p className="truncate font-tamil text-xs text-ink/60 dark:text-night-text/60" lang="ta">குறளோவியம்</p>
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
      </header>

      <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-marina dark:text-marina-light" lang={ta ? "ta" : "en"}>
          <ScrollText className="h-3.5 w-3.5" aria-hidden />{" "}
          {isEntry ? (ta ? `பொருளடக்கம் ${unit.number} / 300` : `Contents entry ${unit.number} of 300`) : ta ? "குறளோவியம்" : "Kuraloviyam"}
        </p>
        <h1 className={cn("mt-3 text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl", isEntry || ta ? "font-tamil" : "")} lang={isEntry || ta ? "ta" : "en"}>
          {label}
        </h1>
        <p className="mt-2 text-xs text-ink/50 dark:text-night-text/50" lang={ta ? "ta" : "en"}>
          {ta ? "அச்சுப் பக்கம்" : "printed"} {unit.printedSpan[0]}–{unit.printedSpan[1]} · {ta ? "ஸ்கேன்" : "scans"} {unit.scans[0]}–{unit.scans[unit.scans.length - 1]}
          {unit.assignments?.length
            ? ` · ${unit.assignments.map((a) => `${ta ? "அதிகாரம்" : "Adhikaram"} ${a.chapter} (${a.titleTa}) — ${ta ? "குறள்" : "Kural"} ${a.kurals.join(", ")}`).join("; ")}`
            : ""}
        </p>
        {/* The printed contents sometimes locates an entry on the page that closes the previous one; the page
            records show where this entry's own text begins. Both facts are shown, neither is altered. */}
        {unit.contentsLocatorNote && (
          <p className="mt-1 text-[11px] leading-relaxed text-ink/45 dark:text-night-text/45" lang={ta ? "ta" : "en"} data-testid="contents-locator-note">
            {ta
              ? `அச்சிட்ட பொருளடக்கம் இப்பகுதியை அச்சுப் பக்கம் ${unit.contentsLocatorNote.printed}-இல் குறிக்கிறது; அப்பக்கம் முந்தைய பகுதியை நிறைவு செய்கிறது. இப்பகுதியின் உரை ஸ்கேன் ${unit.contentsLocatorNote.textBeginsScan} (அச்சுப் பக்கம் ${unit.contentsLocatorNote.textBeginsPrinted})-இல் தொடங்குகிறது.`
              : `The printed contents locates this entry at p. ${unit.contentsLocatorNote.printed}; that page closes the previous entry. This entry's text begins on scan ${unit.contentsLocatorNote.textBeginsScan} (p. ${unit.contentsLocatorNote.textBeginsPrinted}).`}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
          <div className="inline-flex overflow-hidden rounded-full border border-marina/40 text-xs font-medium">
            <button onClick={() => setShowEn(false)} className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={!showEn} lang="ta">தமிழ்</button>
            <button onClick={() => setShowEn(true)} className={cn("focus-ring px-3 py-1 transition", showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={showEn}>English</button>
          </div>
        </div>
        <p className={cn("mt-4 rounded-xl border border-dashed px-4 py-2.5 text-xs leading-relaxed", showEn ? "border-marina/40 bg-marina/[0.06] text-ink/70 dark:text-night-text/70" : "border-ink/15 bg-ink/[0.02] text-ink/60 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/60")} lang={ta ? "ta" : "en"}>
          {showEn
            ? ta
              ? "இது இத்திட்டத்தால் உருவாக்கப்பட்ட ஆங்கில மொழிபெயர்ப்பு; சரிபார்க்கப்பட்ட தமிழ்ப் பக்கப் பதிவுகளிலிருந்து செய்யப்பட்டது. தமிழ் மூலமே சான்றுநிலை."
              : "A project-created English translation, made from the audited Tamil page records. The Tamil original remains authoritative."
            : ta
              ? "கீழே அச்சிட்ட நூலின் ஸ்கேனுடன் ஒப்பிட்டுச் சரிபார்க்கப்பட்ட தமிழ் உரை, பக்க வாரியாக."
              : "Below is the Tamil text verified against the scanned printed book, page by page."}
        </p>

        <div className={cn("mt-8", showEn ? "font-body" : "font-tamil", sizes[font])} lang={showEn ? "en" : "ta"} data-testid="kuraloviyam-body">
          {unit.pages.map((p) => (
            <section key={p.scan} aria-label={ta ? `அச்சுப் பக்கம் ${p.printed}` : `Printed page ${p.printed}`} data-scan={p.scan}>
              <div className="my-5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink/35 dark:text-night-text/35" role="separator" data-print="hide">
                <span className="h-px w-5 bg-ink/10 dark:bg-white/10" aria-hidden />
                <span className="font-body normal-case tracking-normal">{ta ? `அச்சுப் பக்கம் ${p.printed} · ஸ்கேன் ${p.scan}` : `p. ${p.printed} · scan ${p.scan}`}</span>
                <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" aria-hidden />
              </div>
              {(showEn ? p.en : p.ta).length === 0 ? (
                // A page the source carries no text on (a full-page illustration, the back cover): said plainly.
                <p className="mb-5 font-body text-[0.75em] italic text-ink/45 dark:text-night-text/45" lang={ta ? "ta" : "en"} data-block="no-text-page">
                  {p.pageType === "back-cover"
                    ? ta ? "பின்னட்டை — இப்பக்கத்தில் அச்சிட்ட உரை இல்லை." : "Back cover — no printed text on this page."
                    : ta ? "முழுப்பக்க ஓவியம் — இப்பக்கத்தில் அச்சிட்ட உரை இல்லை." : "Full-page illustration — no printed text on this page."}
                </p>
              ) : (
                (showEn ? p.en : p.ta).map((b, i) => renderBlock(b, i, ta))
              )}
            </section>
          ))}
        </div>

        <nav className="mt-10 flex items-center justify-between gap-3 border-t border-ink/10 pt-5 dark:border-white/10" aria-label={ta ? "குறளோவியம் வழிசெலுத்தல்" : "Kuraloviyam navigation"}>
          {prev ? (
            <Link href={`/kuraloviyam/${prev.id}`} className="focus-ring inline-flex max-w-[45%] items-center gap-1.5 rounded text-sm text-ink/70 hover:text-marina dark:text-night-text/70">
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              <span className={cn("truncate", prev.kind === "entry" || ta ? "font-tamil" : "")}>{kuraloviyamUnitLabel(prev, ta)}</span>
            </Link>
          ) : <span />}
          <Link href="/kuraloviyam" className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded text-xs text-ink/55 hover:text-marina dark:text-night-text/55">
            <List className="h-3.5 w-3.5" aria-hidden /> {ta ? "பொருளடக்கம்" : "Contents"}
          </Link>
          {next ? (
            <Link href={`/kuraloviyam/${next.id}`} className="focus-ring inline-flex max-w-[45%] items-center gap-1.5 rounded text-right text-sm text-ink/70 hover:text-marina dark:text-night-text/70">
              <span className={cn("truncate", next.kind === "entry" || ta ? "font-tamil" : "")}>{kuraloviyamUnitLabel(next, ta)}</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          ) : <span />}
        </nav>
        <p className="mt-8 text-xs italic leading-relaxed text-ink/45 dark:text-night-text/45" lang={ta ? "ta" : "en"}>
          {ta ? "கலைஞர் மு. கருணாநிதி · குறளோவியம். அச்சிட்ட மூலத்துடன் ஒப்பிட்டுச் சரிபார்க்கப்பட்டது. " : "Kalaignar M. Karunanidhi · Kuraloviyam. Verified against the printed source. "}
          <Link href="/kuraloviyam/source" className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina dark:hover:text-marina-light">{ta ? "மூலமும் சான்றும்" : "Source & provenance"}</Link>
        </p>
      </article>
    </div>
  );
}

function renderBlock(b: KuraloviyamBlock, i: number, ta: boolean): ReactNode {
  switch (b.kind) {
    case "heading":
      return <h2 key={i} className="mb-3 mt-6 font-semibold leading-snug text-marina dark:text-marina-light">{inline(b.text)}</h2>;
    case "citation":
      return <p key={i} className="mb-5 text-[0.85em] font-semibold text-ink/60 dark:text-night-text/60" data-block="citation">{inline(b.text)}</p>;
    case "archival":
      // The archive's description of a visual element — shown small and labelled, never as the book's text.
      return (
        <p key={i} className="mb-5 flex gap-2 rounded-lg bg-ink/[0.03] px-3 py-2 font-body text-[0.72em] leading-relaxed text-ink/55 dark:bg-white/[0.04] dark:text-night-text/55" lang="en" data-block="archival">
          <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span><span className="font-semibold">{ta ? "காப்பக விவரிப்பு: " : "Archival description: "}</span>{inline(b.text)}</span>
        </p>
      );
    case "source-limited":
      return (
        <div key={i} className="mb-5 rounded-xl border border-dashed border-ink/30 bg-ink/[0.03] px-4 py-3 font-body text-[0.8em] leading-relaxed text-ink/70 dark:border-white/25 dark:bg-white/[0.04] dark:text-night-text/70" role="note" data-block="source-limited">
          <p className="flex items-center gap-1.5 text-[0.85em] font-semibold uppercase tracking-wider text-ink/55 dark:text-night-text/55">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> {ta ? "மூலத்தின் நிலையான வரம்பு" : "Permanent source condition"}
          </p>
          <p className="mt-1.5" lang={ta ? "ta" : "en"}>{ta ? b.ta : b.en}</p>
          {b.visibleDate && <p className="mt-1 text-ink/55 dark:text-night-text/55">{ta ? "தெரியும் கையெழுத்துத் தேதி: " : "Visible handwritten date: "}{b.visibleDate}</p>}
        </div>
      );
    case "paragraph":
      if (b.quote) return <blockquote key={i} className="mb-5 whitespace-pre-line border-l-2 border-marina/40 py-1 pl-4 leading-loose text-ink/80 dark:text-night-text/80">{inline(b.text)}</blockquote>;
      return <p key={i} className="mb-5 whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">{inline(b.text)}</p>;
  }
}

// Faithful inline Markdown (**bold**, *italic*, `code`) plus the archive's bracketed SOURCE-GAP marker — a
// place where washed-out words are not supplied — which is styled apart so it never reads as the author's words.
function inline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const re = /\*\*(\[[^\]]+\])\*\*|(\[[^\]]*(?:ஊகிக்கப்படவில்லை|unavailable)[^\]]*\])|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const gap = m[1] ?? m[2];
    if (gap !== undefined) nodes.push(<span key={k++} className="rounded bg-ink/[0.06] px-1 text-[0.85em] italic text-ink/55 dark:bg-white/10 dark:text-night-text/55" data-block="source-gap">{gap}</span>);
    else if (m[3] !== undefined) nodes.push(<strong key={k++} className="font-semibold">{m[3]}</strong>);
    else if (m[4] !== undefined) nodes.push(<em key={k++}>{m[4]}</em>);
    else nodes.push(<code key={k++} className="rounded bg-ink/[0.06] px-1 py-0.5 text-[0.9em] dark:bg-white/10">{m[5]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
