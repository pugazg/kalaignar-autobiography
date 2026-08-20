"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Film, Home, Info, List, Minus, Plus } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import type { Novel, NovelBlock, NovelSection } from "@/data/novels";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// One section of the novel. The work is ONE continuous narrative; the three sections are the source
// archive's own assembled reading divisions, not archive-invented chapters.
export default function NovelReader({
  novel,
  section,
  prev,
  next,
}: {
  novel: Novel;
  section: NovelSection;
  prev: NovelSection | null;
  next: NovelSection | null;
}) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [font, setFont] = useState(1);
  // Source-first: the verified Tamil is authoritative and is the default reading layer.
  const [showEn, setShowEn] = useState(false);

  const sizes = ["text-base", "text-lg", "text-xl"];
  const blocks = showEn ? section.english.blocks : section.tamil.blocks;
  const notes = section.english.notes;

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={`/novels/${novel.slug}`} className="focus-ring inline-flex items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60" aria-label={ta ? "நூல் முகப்பு" : "Contents"}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> <span>{ta ? "பொருளடக்கம்" : "Contents"}</span>
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            <p className="truncate font-tamil text-xs text-ink/60 dark:text-night-text/60" lang="ta">{novel.title.ta}</p>
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
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-marina dark:text-marina-light">
          <BookOpen className="h-3.5 w-3.5" aria-hidden />{" "}
          {ta ? `பகுதி ${section.order} / ${novel.sectionCount}` : `Part ${section.order} of ${novel.sectionCount}`}
        </p>
        <h1 className="mt-3 font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl" lang="ta">
          {section.titleTa}
        </h1>
        <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">{section.titleEn}</p>

        {/* A section title is the ARCHIVE's descriptive label for a division it made for reading,
            not a heading the 1947 edition prints. Where the edition does print a heading, that
            heading appears in the body below, cited to the scan that prints it. Saying so here keeps
            an archival label from being read as Kalaignar's own chapter title. */}
        {!section.titleIsPrintedHeading && (
          <p className="mt-2 text-xs leading-relaxed text-ink/45 dark:text-night-text/45" lang={ta ? "ta" : "en"}>
            {ta
              ? "இத்தலைப்பு மூலக் காப்பகத்தின் வாசிப்புப் பிரிவுக்கான விளக்கக் குறிப்பே; 1947 பதிப்பில் அச்சிடப்பட்ட தலைப்பு அல்ல."
              : "This title is the source archive's descriptive label for its reading division — not a heading printed in the 1947 edition."}
          </p>
        )}

        {/* THE EMBEDDED-SEQUENCE RULE, stated where a reader meets it. This section is an internal
            film inside the novel — never a separate work. */}
        {section.isEmbeddedSequence && (
          <p className="mt-3 inline-flex items-start gap-1.5 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-3 py-2 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={ta ? "ta" : "en"}>
            <Film className="mt-0.5 h-3.5 w-3.5 shrink-0 text-marina" aria-hidden />
            <span>
              {ta
                ? "இது தனி நூல் அல்ல — ‘பலிபீடம் நோக்கி’ நூலுக்குள் திரைப்படக் காட்சியாக அமைந்த உள்ளமைந்த வரலாற்றுப் பகுதி."
                : "Not a separate work — this is the cinematic-historical sequence staged inside Towards the Sacrificial Altar."}
            </span>
          </p>
        )}

        <p className="mt-2 text-xs text-ink/50 dark:text-night-text/50" lang={ta ? "ta" : "en"}>
          {ta ? "மூல ஸ்கேன்" : "Source scans"} {showEn ? section.sourceScansEn : section.sourceScansTa}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
          <ShareButtons title={`${novel.title.ta} · ${section.titleEn}`} path={`/novels/${novel.slug}/${section.slug}`} />
          <div className="inline-flex overflow-hidden rounded-full border border-marina/40 text-xs font-medium">
            <button onClick={() => setShowEn(false)} className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={!showEn} lang="ta">
              தமிழ்
            </button>
            <button onClick={() => setShowEn(true)} className={cn("focus-ring px-3 py-1 transition", showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={showEn}>
              English
            </button>
          </div>
        </div>

        <p className={cn("mt-4 rounded-xl border border-dashed px-4 py-2.5 text-xs leading-relaxed", showEn ? "border-marina/40 bg-marina/[0.06] text-ink/70 dark:text-night-text/70" : "border-ink/15 bg-ink/[0.02] text-ink/60 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/60")} lang={ta ? "ta" : "en"}>
          {showEn
            ? ta
              ? "இது திட்டத்தால் உருவாக்கப்பட்ட, சரிபார்க்கப்பட்ட ஆங்கில மொழிபெயர்ப்பு. தமிழ் மூலமே சான்றுநிலை."
              : "The project-created, verified English translation, carried exactly as released. The Tamil original remains authoritative."
            : ta
              ? "கீழே 1947 முதற்பதிப்பின்படி சரிபார்க்கப்பட்ட தமிழ் உரை — சொற்கள், நிறுத்தக் குறிகள், வரலாற்று எழுத்துமுறை அனைத்தும் மூலத்தின்படியே."
              : "The verified Tamil text of the 1947 first edition — wording, punctuation and historical spelling exactly as the source has them."}
        </p>

        {/* THE NOVEL. Paragraph structure comes from the archive's own assembled reading layer and is
            never re-split or merged here. Intentional source line breaks inside a block (the film
            credits, the closing lineated address) are preserved with `whitespace-pre-line`. */}
        <div className={cn("mt-8", showEn ? "font-body" : "font-tamil", sizes[font])} lang={showEn ? "en" : "ta"}>
          {blocks.map((b, i) => renderBlock(b, i))}
        </div>

        {/* Translator/editorial apparatus — released with the English layer and held outside the
            body so it can never read as Kalaignar's prose. */}
        {showEn && notes.length > 0 && (
          <aside className="mt-10 rounded-2xl border border-dashed border-ink/20 bg-ink/[0.02] p-4 dark:border-white/20 dark:bg-white/[0.03]" aria-label="Translator's notes — not part of Kalaignar's text">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45">
              {ta ? "மொழிபெயர்ப்பாளர் குறிப்புகள் — கலைஞரின் உரை அல்ல" : "Translator's notes — not part of Kalaignar's text"}
            </p>
            {notes.map((n, i) => (
              <div key={i} className="mt-3">
                <p className="text-[11px] font-semibold text-ink/60 dark:text-night-text/60" lang="en">{n.heading}</p>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink/65 dark:text-night-text/65" lang="en">{inline(n.text)}</p>
              </div>
            ))}
          </aside>
        )}

        <nav className="mt-10 flex items-center justify-between gap-3 border-t border-ink/10 pt-5 dark:border-white/10" aria-label={ta ? "பகுதி வழிசெலுத்தல்" : "Section navigation"}>
          {prev ? (
            <Link href={`/novels/${novel.slug}/${prev.slug}`} className="focus-ring inline-flex max-w-[45%] items-center gap-1.5 rounded text-sm text-ink/70 hover:text-marina dark:text-night-text/70">
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate font-tamil" lang="ta">{prev.titleTa}</span>
            </Link>
          ) : (
            <span />
          )}
          <Link href={`/novels/${novel.slug}`} className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded text-xs text-ink/55 hover:text-marina dark:text-night-text/55">
            <List className="h-3.5 w-3.5" aria-hidden /> {ta ? "பொருளடக்கம்" : "Contents"}
          </Link>
          {next ? (
            <Link href={`/novels/${novel.slug}/${next.slug}`} className="focus-ring inline-flex max-w-[45%] items-center gap-1.5 rounded text-right text-sm text-ink/70 hover:text-marina dark:text-night-text/70">
              <span className="truncate font-tamil" lang="ta">{next.titleTa}</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>

        <p className="mt-8 text-xs italic leading-relaxed text-ink/45 dark:text-night-text/45" lang={ta ? "ta" : "en"}>
          {ta
            ? `${novel.author.ta} · ${novel.title.ta}, ${novel.edition.statementTa}. அச்சிட்ட மூலத்துடன் ஒப்பிட்டுச் சரிபார்க்கப்பட்டது. `
            : `${novel.author.en} · ${novel.title.en}, first edition April ${novel.edition.year}. Verified against the printed source. `}
          <Link href={`/novels/${novel.slug}/source`} className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina dark:hover:text-marina-light">
            {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
          </Link>
        </p>
      </article>
    </div>
  );
}

function renderBlock(b: NovelBlock, i: number) {
  if (b.kind === "heading") {
    // A heading PRINTED IN THE SOURCE (the work title, the internal sequence's title card).
    const cls = "mb-3 mt-8 font-semibold leading-snug text-marina dark:text-marina-light";
    if (b.level === 1) return <h2 key={i} className={cn(cls, "text-[1.15em]")}>{inline(b.text)}</h2>;
    if (b.level === 2) return <h3 key={i} className={cls}>{inline(b.text)}</h3>;
    return <h4 key={i} className={cn(cls, "text-[0.95em]")}>{inline(b.text)}</h4>;
  }
  if (b.kind === "ornament") {
    // A printed ornament belonging to the work — decorative in the source, so decorative here, but
    // never dropped.
    return (
      <p key={i} className="my-7 text-center text-[1.1em] text-marina/60 dark:text-marina-light/60" aria-hidden>
        {b.text}
      </p>
    );
  }
  return (
    <p key={i} className="mb-5 whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">
      {inline(b.text)}
    </p>
  );
}

// Minimal, faithful inline Markdown: **bold** and *italic* / _italic_ as the release uses them for
// retained Tamil terms and on-screen text. Nothing else is interpreted; the text is otherwise verbatim.
function inline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={k++} className="font-semibold">{m[1]}</strong>);
    else if (m[2] !== undefined) nodes.push(<em key={k++}>{m[2]}</em>);
    else if (m[3] !== undefined) nodes.push(<em key={k++}>{m[3]}</em>);
    else nodes.push(<code key={k++} className="rounded bg-ink/[0.06] px-1 py-0.5 text-[0.9em] dark:bg-white/10">{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
