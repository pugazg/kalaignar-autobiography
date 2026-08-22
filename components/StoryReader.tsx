"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { Story, StoryBlock, StoryTextSegment } from "@/data/stories";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * கிழவன் கனவு and the Fiction short-story form — one continuous printed story, read straight through.
 *
 * A PUBLICATION INTERFACE, NOT AN EVIDENCE INTERFACE. This page is where the story is READ. It
 * carries no scan numbers, no printed-page markers, no boundary labels and no provenance annotation
 * — a reader who opens it should find a clean literary text, not an apparatus. Every archival fact
 * the library holds about this story is still published, in full, one link away at
 * `/stories/<slug>/source`: the scan mapping, the printed-page uncertainty on the opening scan, the
 * story scope against the whole booklet's, the publisher's erratum witness and the join policy. The
 * two interfaces are deliberately not mixed.
 *
 * ONE LANGUAGE AT A TIME. Tamil and English are two views of the same page, chosen by the toggle —
 * never a Tamil text with an English one appended after it. The toggle is the same pill control the
 * other bilingual Reading Rooms use (SpeechReader, PoemReader, NovelReader): Tamil is the default,
 * the Tamil original is authoritative, and only the selected stream is ever in the document. Because
 * the default is Tamil and this component still renders on the server for the first paint, the Tamil
 * source text is in the initial HTML — present for a crawler, for a reader with JavaScript off, and
 * for Print → Save as PDF — and printing produces the language on screen, never both.
 *
 * WHAT SURVIVES FROM THE SOURCE-FIDELITY MODEL. Blocks are still rendered in source order, verbatim,
 * with nothing dropped or merged, and the six unresolved paragraph boundaries are still neutral: the
 * runs either side stay inside one non-`<p>` group, so the markup asserts neither a paragraph break
 * nor a continuation. What changed is only their PRESENTATION — the labelled scan rule is gone, and
 * the two runs are set apart by a gap visibly smaller than an ordinary paragraph break. That asserts
 * less than either alternative: no rule to read as a deliberate scene break, no seamless join to read
 * as a continuation. The publisher's erratum is still never substituted into the reading text.
 *
 * PRINT. Everything carrying story text is a `div`/`section`/`article`, never a `header` or `footer`:
 * the global print stylesheet deletes `nav`, `header` and `footer` outright. Only the navigation and
 * the toggle itself are hidden from paper, where their removal is correct.
 */
export default function StoryReader({ story }: { story: Story }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  // Source-first: the verified Tamil is authoritative and shown by default; the English reading
  // translation is one toggle away. Only one of the two is ever rendered.
  const [showEn, setShowEn] = useState(false);
  const blocks = showEn ? story.english.blocks : story.tamil.blocks;

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label={ta ? "வழிசெலுத்தல்" : "Navigation"} className="mb-8 text-sm" data-print="hide">
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light">
          <span lang={lang}>{ta ? "மின்னூலகம்" : "The library"}</span>
        </Link>
      </nav>

      <article>
        {/* The form label the BOOKLET prints under its own title — the source's own word for what this
            is. It stays in Tamil in both views: the booklet prints no English form label, and one is
            not invented. */}
        <p className="font-tamil text-xs uppercase tracking-[0.18em] text-marina dark:text-marina-light" lang="ta">
          {story.formLabel.ta}
        </p>

        <h1 className="mt-3 font-tamil text-3xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">
          {story.title.ta}
        </h1>
        <p className="mt-1.5 font-display text-lg text-ink/60 dark:text-night-text/60">{story.title.en}</p>

        {/* The authorship line VERBATIM as the booklet prints it, not a reconstructed byline. */}
        <p className="mt-4 font-tamil text-sm text-ink/65 dark:text-night-text/65" lang="ta">
          {story.author.printedAuthorshipLineTa}
        </p>

        {/* The same pill toggle the other bilingual Reading Rooms use. Hidden from print: paper has
            no toggle, and what prints is the language on screen. */}
        <div className="mt-5 flex flex-wrap items-center gap-3" data-print="hide">
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

        {/* Said once, only in the English view, and only about what the English layer IS. A project
            translation must never be mistaken for Kalaignar's own words; that is a statement about
            authorship, not an archival annotation, so it belongs on the reading page. */}
        {showEn && (
          <p className="mt-4 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
            {ta
              ? "இது இத்திட்டத்தால் உருவாக்கப்பட்ட ஆங்கில வாசிப்பு மொழிபெயர்ப்பு. தமிழ் மூலமே சான்றுநிலை."
              : "A project-created English reading translation. The Tamil original remains authoritative."}
          </p>
        )}

        <div className={cn("mt-10 break-words", showEn ? "font-body text-base" : "font-tamil text-lg")} lang={showEn ? "en" : "ta"}>
          {renderBlocks(blocks, ta)}
        </div>

        {/* The one link out to the evidence interface. A div, so it survives print — and it names the
            provenance page without reproducing any of it here. */}
        <div className="mt-12 border-t border-ink/10 pt-5 text-xs leading-relaxed text-ink/45 dark:border-white/10 dark:text-night-text/45">
          <Link
            href={`/stories/${story.slug}/source`}
            className={cn("underline decoration-ink/20 underline-offset-2 hover:text-marina dark:decoration-white/20 dark:hover:text-marina-light", ta && "font-tamil")}
            lang={lang}
          >
            {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
          </Link>
        </div>
      </article>
    </main>
  );
}

// Render the ordered block stream. A run of [paragraph, unresolved-break, paragraph, …] is wrapped in
// ONE non-<p> group, so an unresolved paragraph relationship asserts neither a break nor a
// continuation; resolved paragraphs render as ordinary <p>.
function renderBlocks(blocks: StoryBlock[], ta: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.kind === "heading") {
      // The booklet's own printed title card, set as the text's opening heading.
      out.push(
        <h2 key={i} className="mb-6 text-center text-xl font-semibold leading-snug text-ink dark:text-night-text">
          {inline(b.text)}
        </h2>,
      );
      i++;
      continue;
    }
    if (b.kind === "note") {
      // The printed parenthetical under the title. Set apart so it never reads as the story's first line.
      out.push(
        <p key={i} className="mb-8 text-center text-[0.9em] italic text-ink/55 dark:text-night-text/55">
          {inline(b.text)}
        </p>,
      );
      i++;
      continue;
    }
    if (b.kind === "paragraph") {
      // Opening an unresolved-relationship run?
      if (blocks[i + 1]?.kind === "unresolved-break") {
        const group: StoryBlock[] = [b];
        i++;
        while (blocks[i]?.kind === "unresolved-break" && blocks[i + 1]?.kind === "paragraph") {
          group.push(blocks[i], blocks[i + 1]);
          i += 2;
        }
        out.push(<UnresolvedGroup key={"g" + i} items={group} ta={ta} />);
        continue;
      }
      out.push(
        <p key={i} className="mb-5 leading-loose text-ink/90 dark:text-night-text/90">
          {renderSegments(b.segments)}
        </p>,
      );
      i++;
      continue;
    }
    // A stray unresolved-break outside a group (does not occur in this dataset) → a quiet gap, never
    // a labelled marker.
    if (b.kind === "unresolved-break") out.push(<span key={i} className="block h-3" aria-hidden />);
    i++;
  }
  return out;
}

/**
 * A NEUTRAL group for an unresolved printed-paragraph relationship.
 *
 * The runs are `div`s, never `<p>` — a `<p>` would assert that the printed booklet began a new
 * paragraph here, which is exactly what is not known. They are set apart by a gap SMALLER than the
 * `mb-5` between ordinary paragraphs: a full paragraph break would claim separation, and no break at
 * all would claim continuation, so the presentation sits deliberately between the two and carries no
 * label, no rule and no number. The `aria-label` gives assistive technology the same grouping the
 * markup gives everyone else, in plain reading language; the archival detail — which scans, and why
 * the relationship is open — is published on the provenance page.
 */
function UnresolvedGroup({ items, ta }: { items: StoryBlock[]; ta: boolean }) {
  let run = 0;
  return (
    <div
      role="group"
      aria-label={ta ? "பத்தி எல்லை — தீர்மானிக்கப்படவில்லை" : "paragraph boundary — unresolved"}
      className="mb-5"
    >
      {items.map((it, k) =>
        it.kind === "paragraph" ? (
          <div key={k} className={cn("leading-loose text-ink/90 dark:text-night-text/90", run++ > 0 && "mt-2.5")}>
            {renderSegments(it.segments)}
          </div>
        ) : null,
      )}
    </div>
  );
}

// Render a logical paragraph's per-scan segments, joined per `joinToNext`:
//   "space"   → one space;
//   "none"    → nothing (the scan split a word);
//   "unknown" → a bare hairline gap — never a silent space and never a silent concatenation, but
//               carrying no label or number, because this page is not the evidence interface;
//   "end"     → last segment, nothing after it.
// `kizhavan-kanavu` uses only "space" and "end"; the other two are handled so that a story which does
// use them cannot be rendered as a guess.
function renderSegments(segments: StoryTextSegment[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  segments.forEach((s, i) => {
    nodes.push(<span key={"t" + i}>{inline(s.text)}</span>);
    if (s.joinToNext === "space") nodes.push(" ");
    else if (s.joinToNext === "unknown") {
      nodes.push(
        <span
          key={"j" + i}
          className="mx-1 inline-block h-[0.8em] w-px translate-y-[0.1em] bg-ink/20 align-baseline dark:bg-white/20"
          aria-hidden
        />,
      );
    }
    // "none" / "end" → no separator.
  });
  return nodes;
}

// Minimal, faithful inline rendering of the two emphasis forms the source text actually uses:
// **bold** (the story's shouted lines and the English layer's transliterated terms) and *italic* (a
// cited book title). Nothing else is interpreted; the text is otherwise verbatim.
function inline(text: string): ReactNode {
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
