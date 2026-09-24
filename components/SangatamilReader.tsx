"use client";

import { Fragment, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Home, ImageIcon, List, Minus, Plus, Quote, ScrollText, Stamp, TriangleAlert } from "lucide-react";
import type { SangatamilBlock, SangatamilPage, SangatamilSection, SangatamilSectionSummary } from "@/lib/wave8-sangatamil-reader";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Nav = Pick<SangatamilSectionSummary, "slug" | "kind" | "headingTa" | "headingEn"> | null;

/**
 * One section of சங்கத் தமிழ் — its physical pages in scan order, each page's typed blocks in source order.
 *
 * Kalaignar's poem-commentary, the Sangam verse he quotes, his glosses, and the printed source citations are set
 * visibly apart: a citation is never read as his prose, and a gloss never as the poem. Every source line stays its
 * own line. Archive descriptions (illustrations, library marks) are framed as descriptions, never as the book's
 * text; a full-page illustration scan is marked as such. Scan 8's handwritten foreword letter is not transcribed —
 * the page says so as a permanent condition of this presentation.
 */
export default function SangatamilReader({
  titleTa,
  section,
  prev,
  next,
  initialShowEn,
}: {
  titleTa: string;
  section: SangatamilSection;
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
  const heading = (s: NonNullable<Nav>) => (ta || !s.headingEn ? s.headingTa : s.headingEn);

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/sangatamil" className="focus-ring inline-flex items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60">
              <ArrowLeft className="h-4 w-4" aria-hidden /> <span>{ta ? "பொருளடக்கம்" : "Contents"}</span>
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            <p className="truncate font-tamil text-xs text-ink/60 dark:text-night-text/60" lang="ta">{titleTa}</p>
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

      <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6" data-testid="sangatamil-section" data-section={section.slug}>
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-marina dark:text-marina-light" lang={ta ? "ta" : "en"}>
          <ScrollText className="h-3.5 w-3.5" aria-hidden />{" "}
          {section.kind === "section"
            ? ta ? `பகுதி ${section.seq} / 102` : `Section ${section.seq} of 102`
            : section.kind === "front-matter"
              ? ta ? "முன்பக்கங்கள்" : "Front matter"
              : ta ? "பின்னட்டை" : "Back cover"}
        </p>
        <h1 className={cn("mt-3 text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl", showEn && section.headingEn ? "font-display" : "font-tamil")} lang={showEn && section.headingEn ? "en" : "ta"}>
          {showEn && section.headingEn ? section.headingEn : section.headingTa}
        </h1>
        <p className="mt-2 text-xs text-ink/50 dark:text-night-text/50" lang={ta ? "ta" : "en"}>
          {ta ? "அச்சுப் பக்கம்" : "printed"} {section.printedPages} · {ta ? "ஸ்கேன்" : "scans"} {section.scans[0]}–{section.scans[1]}
          {section.illustrationScans.length > 0 && ` · ${ta ? "முழுப்பக்க ஓவியம்: ஸ்கேன்" : "full-page illustration: scan"} ${section.illustrationScans.join(", ")}`}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
          <div className="inline-flex overflow-hidden rounded-full border border-marina/40 text-xs font-medium">
            <button onClick={() => setShowEn(false)} className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={!showEn} lang="ta">தமிழ்</button>
            <button onClick={() => setShowEn(true)} className={cn("focus-ring px-3 py-1 transition", showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={showEn}>English</button>
          </div>
        </div>
        <p className={cn("mt-4 rounded-xl border border-dashed px-4 py-2.5 text-xs leading-relaxed", showEn ? "border-marina/40 bg-marina/[0.06] text-ink/70 dark:text-night-text/70" : "border-ink/15 bg-ink/[0.02] text-ink/60 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/60")} lang={ta ? "ta" : "en"} data-testid="layer-note">
          {showEn
            ? ta
              ? "இது இத்திட்டத்தால் உருவாக்கப்பட்ட ஆங்கில மொழிபெயர்ப்பு; சரிபார்க்கப்பட்ட தமிழ்ப் பக்கப் பதிவுகளிலிருந்து செய்யப்பட்டது. தமிழ் மூலமே சான்றுநிலை."
              : "A project-created English translation, made from the verified Tamil page records. The Tamil original remains authoritative."
            : ta
              ? "கீழே அச்சிட்ட நூலின் ஸ்கேனுடன் ஒப்பிட்டுச் சரிபார்க்கப்பட்ட தமிழ் உரை, பக்க வாரியாக; ஒவ்வொரு அச்சு வரியும் தனி வரியாக."
              : "Below is the Tamil text verified against the scanned printed book, page by page, each printed line kept as its own line."}
        </p>

        <div className={cn("mt-8", showEn ? "font-body" : "font-tamil", sizes[font])} lang={showEn ? "en" : "ta"} data-testid="sangatamil-body">
          {section.pages.map((p) => (
            <Page key={p.scan} page={p} showEn={showEn} ta={ta} />
          ))}
        </div>

        <nav className="mt-10 flex items-center justify-between gap-3 border-t border-ink/10 pt-5 dark:border-white/10" aria-label={ta ? "சங்கத் தமிழ் வழிசெலுத்தல்" : "Sangatamil navigation"}>
          {prev ? (
            <Link href={`/sangatamil/${prev.slug}`} className="focus-ring inline-flex max-w-[45%] items-center gap-1.5 rounded text-sm text-ink/70 hover:text-marina dark:text-night-text/70" data-testid="nav-prev">
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              <span className={cn("truncate", ta || !prev.headingEn ? "font-tamil" : "")}>{heading(prev)}</span>
            </Link>
          ) : <span />}
          <Link href="/sangatamil" className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded text-xs text-ink/55 hover:text-marina dark:text-night-text/55">
            <List className="h-3.5 w-3.5" aria-hidden /> {ta ? "பொருளடக்கம்" : "Contents"}
          </Link>
          {next ? (
            <Link href={`/sangatamil/${next.slug}`} className="focus-ring inline-flex max-w-[45%] items-center gap-1.5 rounded text-right text-sm text-ink/70 hover:text-marina dark:text-night-text/70" data-testid="nav-next">
              <span className={cn("truncate", ta || !next.headingEn ? "font-tamil" : "")}>{heading(next)}</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          ) : <span />}
        </nav>
        <p className="mt-8 text-xs italic leading-relaxed text-ink/45 dark:text-night-text/45" lang={ta ? "ta" : "en"}>
          {ta ? "கலைஞர் மு. கருணாநிதி · சங்கத் தமிழ். அச்சிட்ட மூலத்துடன் ஒப்பிட்டுச் சரிபார்க்கப்பட்டது. " : "Kalaignar M. Karunanidhi · Sangatamil. Verified against the printed source. "}
          <Link href="/sangatamil/source" className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina dark:hover:text-marina-light">{ta ? "மூலமும் சான்றும்" : "Source & provenance"}</Link>
        </p>
      </article>
    </div>
  );
}

function Page({ page: p, showEn, ta }: { page: SangatamilPage; showEn: boolean; ta: boolean }) {
  const blocks = showEn ? p.english : p.tamil;
  const body = blocks.map((b, i) => renderBlock(b, i, ta, p.illustration));
  return (
    <section
      aria-label={p.printedPage ? (ta ? `அச்சுப் பக்கம் ${p.printedPage}` : `Printed page ${p.printedPage}`) : ta ? `ஸ்கேன் ${p.scan}` : `Scan ${p.scan}`}
      data-scan={p.scan}
      data-printed-page={p.printedPage ?? ""}
      data-page-type={p.pageType}
      data-illustration={p.illustration ? "true" : undefined}
    >
      <div className="my-5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink/35 dark:text-night-text/35" role="separator" data-print="hide">
        <span className="h-px w-5 bg-ink/10 dark:bg-white/10" aria-hidden />
        <span className="font-body normal-case tracking-normal">
          {p.printedPage
            ? ta ? `அச்சுப் பக்கம் ${p.printedPage} · ஸ்கேன் ${p.scan}` : `p. ${p.printedPage} · scan ${p.scan}`
            : ta ? `ஸ்கேன் ${p.scan} · அச்சுப் பக்க எண் இல்லை` : `scan ${p.scan} · no printed page number`}
        </span>
        <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" aria-hidden />
      </div>
      {p.illustration ? (
        // A full-page illustration scan. Whatever the archive records here describes the image; it is framed as
        // that description and never read as the book's text.
        <figure className="mb-6 rounded-xl border border-dashed border-ink/20 bg-ink/[0.02] px-4 py-3 font-body text-[0.78em] leading-relaxed text-ink/60 dark:border-white/20 dark:bg-white/[0.03] dark:text-night-text/60" data-testid="illustration-page" data-presentation="archival">
          <figcaption className="mb-1.5 flex items-center gap-1.5 text-[0.85em] font-semibold uppercase tracking-wider text-ink/50 dark:text-night-text/50" lang={ta ? "ta" : "en"}>
            <ImageIcon className="h-3.5 w-3.5" aria-hidden /> {ta ? "முழுப்பக்க ஓவியம் — அச்சிட்ட உரை இல்லை" : "Full-page illustration — no printed text"}
          </figcaption>
          {body}
        </figure>
      ) : (
        body
      )}
      {p.sourceLimited && (
        <div className="mb-6 rounded-xl border border-dashed border-ink/30 bg-ink/[0.03] px-4 py-3 font-body text-[0.8em] leading-relaxed text-ink/70 dark:border-white/25 dark:bg-white/[0.04] dark:text-night-text/70" role="note" data-role="source-limited" data-kind={p.sourceLimited.kind}>
          <p className="flex items-center gap-1.5 text-[0.85em] font-semibold uppercase tracking-wider text-ink/55 dark:text-night-text/55" lang={ta ? "ta" : "en"}>
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> {ta ? "மூலத்தின் நிலையான வரம்பு" : "Permanent source condition"}
          </p>
          <p className="mt-1.5" lang={ta ? "ta" : "en"}>
            {ta
              ? "இப்பக்கத்திலுள்ள முழுப்பக்கக் கையெழுத்துக் கடிதம் படியெடுக்கப்படவில்லை; அதன் சொற்கள் இங்கு தரப்படுவதில்லை. இது இவ்வெளியீட்டின் நிலையான முடிவு. பக்கத்தின் தலைப்பும் அதன் காப்பக விவரிப்பும் மட்டுமே உள்ளன."
              : "The full-page handwritten letter on this page is not transcribed, and its words are not given here. This is a permanent decision of this edition; only the page's heading and the archive's description of it are shown."}
          </p>
        </div>
      )}
    </section>
  );
}

const ROLE_LABEL: Partial<Record<SangatamilBlock["role"], [string, string]>> = {
  "source-citation": ["மூல மேற்கோள்", "Source citation"],
  "source-note": ["மூலக் குறிப்பு", "Source note"],
  "copy-specific-marking": ["இப்படிக்குரிய குறிப்பு — நூலின் உரை அல்ல", "Copy-specific marking — not the book's text"],
};

/** Lines, each its own printed line: never re-flowed, never joined. */
function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <span data-line="">{inline(l)}</span>
        </Fragment>
      ))}
    </>
  );
}

function renderBlock(b: SangatamilBlock, i: number, ta: boolean, onIllustration: boolean): ReactNode {
  const data = {
    "data-role": b.role,
    "data-kind": b.kind,
    ...(b.citationIds ? { "data-citation-ids": b.citationIds.join(" ") } : {}),
    "data-presentation": onIllustration || b.role.startsWith("archival") || b.role === "copy-specific-marking" ? "archival" : "text",
  };
  if (onIllustration) {
    return <p key={i} className="mt-1" {...data}><Lines lines={b.lines} /></p>;
  }
  switch (b.role) {
    case "section-title":
      return <h2 key={i} className="mb-4 mt-6 text-[1.25em] font-semibold leading-snug text-marina dark:text-marina-light" {...data}><Lines lines={b.lines} /></h2>;
    case "printed-heading":
      return <h3 key={i} className="mb-3 mt-6 font-semibold leading-snug text-ink/85 dark:text-night-text/85" {...data}><Lines lines={b.lines} /></h3>;
    case "gloss-heading":
      return <h4 key={i} className="mb-2 mt-5 text-[0.8em] font-semibold uppercase tracking-wider text-ink/55 dark:text-night-text/55" {...data}><Lines lines={b.lines} /></h4>;
    case "gloss":
      return <p key={i} className="mb-3 border-l border-ink/15 pl-3 text-[0.85em] leading-relaxed text-ink/70 dark:border-white/15 dark:text-night-text/70" {...data}><Lines lines={b.lines} /></p>;
    case "quotation":
      // Printed Sangam verse: its own lineation, set apart from the commentary.
      return <blockquote key={i} className="mb-5 border-l-2 border-marina/40 py-1 pl-4 leading-loose text-ink/80 dark:text-night-text/80" {...data}><Lines lines={b.lines} /></blockquote>;
    case "source-citation":
    case "source-note":
      return (
        <p key={i} className={cn("mb-5 rounded-lg border border-ink/10 bg-ink/[0.02] px-3 py-2 text-[0.8em] leading-relaxed text-ink/65 dark:border-white/10 dark:bg-white/[0.03] dark:text-night-text/65", b.align === "right" && "text-right", b.align === "center" && "text-center")} {...data}>
          <span className="mb-0.5 flex items-center gap-1 font-body text-[0.8em] font-semibold uppercase tracking-wider text-ink/45 dark:text-night-text/45" lang={ta ? "ta" : "en"}>
            <Quote className="h-3 w-3" aria-hidden /> {ROLE_LABEL[b.role]![ta ? 0 : 1]}
          </span>
          <Lines lines={b.lines} />
        </p>
      );
    case "right-aligned-fragment":
      return <p key={i} className="-mt-3 mb-5 text-right leading-loose" {...data}><Lines lines={b.lines} /></p>;
    case "ornament":
      return <p key={i} className="my-6 text-center tracking-[0.5em] text-ink/35 dark:text-night-text/35" aria-hidden {...data}><Lines lines={b.lines} /></p>;
    case "archival-label":
      return (
        <p key={i} className="mb-1 mt-4 flex items-center gap-1.5 font-body text-[0.72em] font-semibold uppercase tracking-wider text-ink/50 dark:text-night-text/50" {...data}>
          <ImageIcon className="h-3.5 w-3.5" aria-hidden /> <Lines lines={b.lines} />
        </p>
      );
    case "archival-description":
      return <p key={i} className="mb-5 rounded-lg bg-ink/[0.03] px-3 py-2 font-body text-[0.75em] leading-relaxed text-ink/55 dark:bg-white/[0.04] dark:text-night-text/55" {...data}><Lines lines={b.lines} /></p>;
    case "copy-specific-marking":
      return (
        <div key={i} className="mb-5 rounded-lg border border-dashed border-ink/25 px-3 py-2 font-body text-[0.75em] leading-relaxed text-ink/55 dark:border-white/20 dark:text-night-text/55" {...data}>
          <p className="mb-0.5 flex items-center gap-1 text-[0.85em] font-semibold uppercase tracking-wider" lang={ta ? "ta" : "en"}>
            <Stamp className="h-3 w-3" aria-hidden /> {ROLE_LABEL[b.role]![ta ? 0 : 1]}
          </p>
          <Lines lines={b.lines} />
        </div>
      );
    case "front-matter-text":
    case "text":
    default:
      if (b.kind === "table") return <Table key={i} lines={b.lines} data={data} />;
      if (b.kind === "heading") return <h3 key={i} className="mb-3 mt-6 font-semibold leading-snug" {...data}><Lines lines={b.lines} /></h3>;
      return (
        <p key={i} className={cn("mb-5 leading-loose text-ink/90 dark:text-night-text/90", b.align === "right" && "text-right", b.align === "center" && "text-center")} {...data}>
          <Lines lines={b.lines} />
        </p>
      );
  }
}

/** A printed two-column colophon table (`| label | : value |`), carried row for row. */
function Table({ lines, data }: { lines: string[]; data: Record<string, string> }) {
  const rows = lines
    .filter((l) => !/^\|\s*-/.test(l))
    .map((l) => l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()))
    .filter((cells) => cells.some((c) => c));
  return (
    <table className="mb-6 w-full text-[0.85em]" {...data}>
      <tbody>
        {rows.map((cells, r) => (
          <tr key={r} className="align-top">
            {cells.map((c, k) => (
              <td key={k} className={cn("py-0.5 pr-3", k === 0 && "whitespace-nowrap text-ink/60 dark:text-night-text/60")}>
                <Lines lines={c.split(/\s*<br>\s*/)} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Faithful inline Markdown: `\*`-style escapes print the character itself (a printed asterisk), **bold**, *italic*
// and `code` render as such. Nothing else is interpreted.
function inline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const re = /\\([\\*_`[\]()#.!|-])|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|`([^`]+)`/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0; let buf = "";
  const flush = () => { if (buf) { nodes.push(buf); buf = ""; } };
  while ((m = re.exec(text)) !== null) {
    buf += text.slice(last, m.index);
    if (m[1] !== undefined) buf += m[1];
    else {
      flush();
      if (m[2] !== undefined) nodes.push(<strong key={k++} className="font-semibold">{m[2]}</strong>);
      else if (m[3] !== undefined) nodes.push(<em key={k++}>{m[3]}</em>);
      else nodes.push(<code key={k++} className="rounded bg-ink/[0.06] px-1 py-0.5 text-[0.9em] dark:bg-white/10">{m[4]}</code>);
    }
    last = m.index + m[0].length;
  }
  buf += text.slice(last);
  flush();
  return nodes;
}
