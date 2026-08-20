"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Home, Info, List, Minus, Newspaper, Plus } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import type { Article, ArticleBlock, EssayPublication } from "@/data/essays";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// One article of the publication. An article is ordinary prose — paragraphs, quoted passages and
// source-printed subheadings — so it gets a prose reader, not the speech, poem or scene reader.
export default function ArticleReader({
  pub,
  article,
  prev,
  next,
}: {
  pub: EssayPublication;
  article: Article;
  prev: Article | null;
  next: Article | null;
}) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [font, setFont] = useState(1);
  // Source-first: the verified Tamil is authoritative and is the default reading layer.
  const [showEn, setShowEn] = useState(false);

  const sizes = ["text-base", "text-lg", "text-xl"];
  const blocks = showEn ? article.english.blocks : article.tamil.blocks;
  const notes = article.english.notes;

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={`/essays/${pub.slug}`} className="focus-ring inline-flex items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60" aria-label={ta ? "பொருளடக்கம்" : "Contents"}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> <span>{ta ? "பொருளடக்கம்" : "Contents"}</span>
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/60 hover:text-marina dark:text-night-text/60" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            <p className="truncate font-tamil text-xs text-ink/60 dark:text-night-text/60" lang="ta">
              {article.number}. {article.titleTa}
            </p>
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
          <Newspaper className="h-3.5 w-3.5" aria-hidden />{" "}
          {ta ? `கட்டுரை ${article.number} / ${pub.articleCount}` : `Article ${article.number} of ${pub.articleCount}`}
        </p>
        <h1 className="mt-3 font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl" lang="ta">
          {article.titleTa}
        </h1>
        <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">{article.titleEn}</p>
        {/* The printed CONTENTS-page title is a separate source witness where it differs from the
            verified heading-page title. Both are kept; neither is normalized into the other. */}
        {article.contentsTitleTa && (
          <p className="mt-1.5 text-xs italic text-ink/45 dark:text-night-text/45" lang={ta ? "ta" : "en"}>
            {ta ? "அச்சுப் பொருளடக்கத்தில்: " : "As printed in the contents page: "}
            <span className="font-tamil not-italic" lang="ta">{article.contentsTitleTa}</span>
          </p>
        )}
        <p className="mt-2 text-xs text-ink/50 dark:text-night-text/50" lang={ta ? "ta" : "en"}>
          {ta ? "அச்சுப் பக்கம்" : "Printed pages"} {article.printedPages.from}–{article.printedPages.to}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
          <ShareButtons title={`${article.titleTa} · ${article.titleEn}`} path={`/essays/${pub.slug}/articles/${article.slug}`} />
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
              ? "இது திட்டத்தால் உருவாக்கப்பட்ட, முழுமையாக வெளியிடப்பட்ட ஆங்கில மொழிபெயர்ப்பு. தமிழ் மூலமே சான்றுநிலை."
              : "The project-created, release-complete English translation, carried exactly as released. The Tamil original remains authoritative."
            : ta
              ? "கீழே அச்சிட்ட மூலத்தின்படி சரிபார்க்கப்பட்ட தமிழ்க் கட்டுரை — சொற்கள், நிறுத்தக் குறிகள், மேற்கோள்கள், அச்சுத் துணைத்தலைப்புகள் அனைத்தும் மூலத்தின்படியே."
              : "The verified Tamil article, faithful to the printed source — wording, punctuation, quotations and printed subheadings exactly as the source has them."}
        </p>

        {/* THE ARTICLE. Printed-page transitions are provenance and are deliberately invisible here:
            a block that runs across a printed page is ONE block carrying both pages, so the prose is
            never interrupted by a page marker and never silently re-paragraphed. */}
        <div className={cn("mt-8", showEn ? "font-body" : "font-tamil", sizes[font])} lang={showEn ? "en" : "ta"}>
          {renderBlocks(blocks, article, ta)}
        </div>

        {/* Translator/editorial notes — released alongside the English article and labelled by the
            source itself as NOT part of Kalaignar's text. They live outside the body and are shown
            in a restrained, explicitly-labelled area so they can never read as his prose. */}
        {showEn && notes.length > 0 && (
          <aside className="mt-10 rounded-2xl border border-dashed border-ink/20 bg-ink/[0.02] p-4 dark:border-white/20 dark:bg-white/[0.03]" aria-label="Translator's note — not part of Kalaignar's text">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45">
              {ta ? "மொழிபெயர்ப்பாளர் குறிப்பு — கலைஞரின் உரை அல்ல" : "Translator's note — not part of Kalaignar's text"}
            </p>
            {notes.map((n, i) => (
              <p key={i} className="mt-2 text-xs leading-relaxed text-ink/65 dark:text-night-text/65" lang="en">
                {inline(n.text)}
              </p>
            ))}
          </aside>
        )}

        <nav className="mt-10 flex items-center justify-between gap-3 border-t border-ink/10 pt-5 dark:border-white/10" aria-label={ta ? "கட்டுரை வழிசெலுத்தல்" : "Article navigation"}>
          {prev ? (
            <Link href={`/essays/${pub.slug}/articles/${prev.slug}`} className="focus-ring group inline-flex max-w-[45%] items-center gap-1.5 rounded text-sm text-ink/70 hover:text-marina dark:text-night-text/70">
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate font-tamil" lang="ta">{prev.titleTa}</span>
            </Link>
          ) : (
            <span />
          )}
          <Link href={`/essays/${pub.slug}`} className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded text-xs text-ink/55 hover:text-marina dark:text-night-text/55">
            <List className="h-3.5 w-3.5" aria-hidden /> {ta ? "பொருளடக்கம்" : "Contents"}
          </Link>
          {next ? (
            <Link href={`/essays/${pub.slug}/articles/${next.slug}`} className="focus-ring group inline-flex max-w-[45%] items-center gap-1.5 rounded text-right text-sm text-ink/70 hover:text-marina dark:text-night-text/70">
              <span className="truncate font-tamil" lang="ta">{next.titleTa}</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>

        <p className="mt-8 text-xs italic leading-relaxed text-ink/45 dark:text-night-text/45" lang={ta ? "ta" : "en"}>
          {ta
            ? `${pub.author.ta} · ${pub.title.ta}. அச்சிட்ட மூலத்துடன் ஒப்பிட்டுச் சரிபார்க்கப்பட்டது. `
            : `${pub.author.en} · ${pub.title.en}. Verified against the printed source. `}
          <Link href={`/essays/${pub.slug}/source`} className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina dark:hover:text-marina-light">
            {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
          </Link>
        </p>
      </article>
    </div>
  );
}

// Render the block stream, inserting a neutral marker at any printed-page edge whose block relation
// the archive leaves UNRESOLVED. Such an edge must assert neither "same paragraph" nor "new
// paragraph": the marker is deliberately weaker than the paragraph gap above it, and it survives
// print (see globals.css) because dropping it on paper would silently assert a clean break.
function renderBlocks(blocks: ArticleBlock[], article: Article, ta: boolean) {
  const unresolved = new Map(
    article.pageTransitions.filter((t) => t.relation === "unknown").map((t) => [t.fromScan, t]),
  );
  const out: ReactNode[] = [];
  blocks.forEach((b, i) => {
    out.push(renderBlock(b, i));
    const last = b.sourcePages[b.sourcePages.length - 1];
    const nextFirst = blocks[i + 1]?.sourcePages[0];
    const t = last && nextFirst && nextFirst.scan === last.scan + 1 ? unresolved.get(last.scan) : undefined;
    if (t) out.push(<PageRelationRule key={`u${i}`} toPrinted={t.toPrinted} ta={ta} />);
  });
  return out;
}

// A restrained, prose-appropriate marker for an unresolved cross-page block relation. It is NOT
// authored text and is excluded from the reading measure by being a separator, not a paragraph.
function PageRelationRule({ toPrinted, ta }: { toPrinted: number; ta: boolean }) {
  const label = ta
    ? "மூலப் பக்க மாற்றம் — தொகுதித் தொடர்பு தீர்மானிக்கப்படவில்லை"
    : "Source page transition — block relationship unresolved";
  return (
    <div
      className="article-page-relation -mt-2 mb-5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink/30 dark:text-night-text/30"
      role="separator"
      aria-label={label}
      title={label}
    >
      <span className="article-page-relation-rule h-px w-5 bg-ink/10 dark:bg-white/10" aria-hidden />
      <span className="article-page-relation-label font-body normal-case tracking-normal" aria-hidden>
        {ta ? `அச்சுப் பக்கம் ${toPrinted}` : `printed page ${toPrinted}`}
        {/* Print-only: on paper there is no hover title or accessible name to explain the marker. */}
        <span className="article-page-relation-note">
          {ta ? " · தொகுதித் தொடர்பு தீர்மானிக்கப்படவில்லை" : " · block relation unresolved"}
        </span>
      </span>
      <span className="article-page-relation-rule h-px flex-1 bg-ink/10 dark:bg-white/10" aria-hidden />
    </div>
  );
}

function renderBlock(b: ArticleBlock, i: number) {
  if (b.kind === "subheading") {
    // A subheading PRINTED IN THE SOURCE, inside the article body.
    return (
      <h2 key={i} className="mb-3 mt-8 font-semibold leading-snug text-marina dark:text-marina-light">
        {inline(b.text)}
      </h2>
    );
  }
  if (b.kind === "attribution") {
    return (
      <p key={i} className="mb-5 pl-4 text-[0.9em] font-semibold text-ink/60 dark:text-night-text/60">
        {inline(b.text)}
      </p>
    );
  }
  // VOICE. A paragraph whose every segment is quoted may be set as a full quotation. A MIXED
  // paragraph — quoted text followed by Kalaignar's own framing, which this source does constantly —
  // stays a PARAGRAPH, with only its quoted runs marked inline. Wrapping the whole block in
  // <blockquote> would attribute his commentary to the person he is quoting.
  const allQuoted = b.segments.every((sg) => sg.kind === "quoted-text");
  const body = b.segments.map((sg, k) =>
    sg.kind === "quoted-text" ? (
      // Source quotation marks are retained inside the text; the styling is additional, not a
      // replacement for them.
      <span key={k} className="article-quoted text-ink/75 dark:text-night-text/75">
        {inline(sg.text)}
      </span>
    ) : (
      <span key={k}>{inline(sg.text)}</span>
    ),
  );
  if (allQuoted) {
    return (
      <blockquote key={i} className="mb-5 whitespace-pre-line border-l-2 border-marina/40 py-1 pl-4 leading-loose text-ink/80 dark:text-night-text/80">
        {body}
      </blockquote>
    );
  }
  return (
    <p key={i} className="mb-5 whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90" data-mixed-voice={b.mixedVoice ? "true" : undefined}>
      {body}
    </p>
  );
}

// Minimal, faithful inline Markdown: **bold** and *italic* as the release uses them (source-bolded
// citation lines, italicised publication names such as *Kalki*), plus `code` for cited source forms.
// Nothing else is interpreted; the text is otherwise verbatim.
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
