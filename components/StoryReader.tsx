import Link from "next/link";
import type { ReactNode } from "react";
import type { Story, StoryBlock, StoryTextSegment } from "@/data/stories";

/**
 * கிழவன் கனவு and the Fiction short-story form — one continuous printed story, read straight through.
 *
 * A SERVER COMPONENT. The older Reading Rooms (SpeechReader, NovelLanding) are client components that
 * fetch their JSON in an effect and keep a Tamil/English toggle in React state. This one does not, and
 * the difference is deliberate: with no interactive toggle to hold, there is nothing for client state to
 * do, and rendering on the server puts the Tamil INTO THE INITIAL HTML — so the source text is present
 * for a crawler, for a reader with JavaScript off, and for Print → Save as PDF, instead of arriving one
 * network round-trip later. Both languages are rendered as ordered sections of the same document rather
 * than as two states of one region.
 *
 * TAMIL FIRST, AND TAMIL AUTHORITATIVE. The Tamil reading section comes first and is what the page is;
 * the English section follows, labelled as a project-created reading translation. Nothing in this
 * component claims the text was reviewed by a person, and nothing here corrects it: the publisher's
 * erratum sheet is a separate witness recorded on the provenance page, never a substitution in the
 * reading body. The line the erratum disputes — `வைத்திருந்தான்` on printed page 9 — is rendered exactly
 * as the archival page reading has it.
 *
 * PRINT. Every element carrying story text or provenance is a `div`/`section`/`article`, never a
 * `header` or `footer`: the global print stylesheet deletes `nav`, `header` and `footer` outright, so
 * story prose placed in one would silently vanish from a printed copy. Only the navigation links sit in
 * a `nav`, where their removal from paper is correct.
 */
export default function StoryReader({ story }: { story: Story }) {
  const scans = story.sourceScans;
  const scanRange = scans.length ? `${scans[0]}–${scans[scans.length - 1]}` : "";

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light">
          <span lang="ta">மின்னூலகம்</span>
        </Link>
      </nav>

      <article>
        {/* The form label the BOOKLET prints under its own title. The source's word for what this is. */}
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

        {/* Source extent. A div, so it prints: a printed copy with no source line would present the
            story as if it came from nowhere. */}
        <div className="mt-2 font-body text-xs text-ink/45 dark:text-night-text/45">
          <span className="font-tamil" lang="ta">மூல ஸ்கேன்கள்</span> {scanRange}
        </div>

        {/* ── TAMIL — the authoritative reading ─────────────────────────────────────────────────── */}
        <section aria-label="மூல தமிழ் உரை" className="mt-12 border-t border-ink/10 pt-8 dark:border-white/10">
          <h2 className="font-tamil text-sm font-semibold tracking-wide text-marina dark:text-marina-light" lang="ta">
            மூல தமிழ் உரை
          </h2>
          {/* `break-words` only ever acts on a token that CANNOT fit the column — at 375px, Tamil
              compounds such as `திருவிளையாடலுக்கெல்லையுமுண்டோ` are wider than the measure and would
              otherwise spill past the viewport and make the whole page scroll sideways. It changes no
              character of the text; it only gives the line-breaker a last resort. */}
          <div className="mt-6 break-words font-tamil text-lg" lang="ta">
            {renderBlocks(story.tamil.blocks, true)}
          </div>
        </section>

        {/* ── ENGLISH — a project-created reading translation ───────────────────────────────────── */}
        <section aria-label="English translation" className="mt-14 border-t border-ink/10 pt-8 dark:border-white/10">
          <h2 className="font-body text-sm font-semibold tracking-wide text-marina dark:text-marina-light">
            English translation
          </h2>
          {/* What this layer IS, stated before it is read. No review claim is made for it. */}
          <p className="mt-2 font-body text-xs leading-relaxed text-ink/50 dark:text-night-text/50">
            A project-created English reading translation, derived from the project&rsquo;s own final Tamil
            reading. The Tamil above remains authoritative.
          </p>
          <div className="mt-6 break-words font-body text-base" lang="en">
            {renderBlocks(story.english.blocks, false)}
          </div>
        </section>

        {/* Provenance. A div, so it survives print. */}
        <div className="mt-12 border-t border-ink/10 pt-5 font-body text-xs leading-relaxed text-ink/45 dark:border-white/10 dark:text-night-text/45">
          <span className="font-tamil" lang="ta">மூலம்</span>
          {" · "}
          <span className="font-tamil" lang="ta">ஸ்கேன்கள்</span> {scanRange}
          {" · "}
          {story.sourceRepo} · {story.sourceCommit.slice(0, 12)}
          {" · "}
          <Link
            href={`/stories/${story.slug}/source`}
            className="font-tamil underline decoration-ink/20 underline-offset-2 hover:text-marina dark:decoration-white/20 dark:hover:text-marina-light"
            lang="ta"
          >
            மூலமும் சான்றும்
          </Link>
        </div>
      </article>
    </main>
  );
}

// Render the ordered block stream. A run of [paragraph, unresolved-break, paragraph, …] is wrapped in
// ONE non-<p> `role="group"`, so an unresolved paragraph relationship asserts neither a break nor a
// continuation; resolved paragraphs render as ordinary <p>. This is the speech Reading Room's rule and
// it is followed exactly, because the archival problem is the same one.
function renderBlocks(blocks: StoryBlock[], ta: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.kind === "heading") {
      // The booklet's own printed title card. An h3 under the language section's h2 — it is a heading
      // the SOURCE prints, nested inside the section that says which language stream it belongs to.
      out.push(
        <h3 key={i} className="mb-6 text-center text-xl font-semibold leading-snug text-ink dark:text-night-text">
          {inline(b.text)}
        </h3>,
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
          {renderSegments(b.segments, ta)}
        </p>,
      );
      i++;
      continue;
    }
    // A stray unresolved-break outside a group (does not occur in this dataset) → still neutral.
    if (b.kind === "unresolved-break") out.push(<ScanRule key={i} toScan={b.toScan} note={b.note} ta={ta} />);
    i++;
  }
  return out;
}

// A NEUTRAL group for an unresolved printed-paragraph relationship: the runs are <div>s (NOT <p>) and
// the scan rule sits between them. role="group" + aria-label say, in words, that the printed paragraph
// relationship across this scan edge is unresolved.
function UnresolvedGroup({ items, ta }: { items: StoryBlock[]; ta: boolean }) {
  return (
    <div
      role="group"
      aria-label={
        ta
          ? "மூல ஸ்கேன் எல்லை — அச்சுப் பத்தி உறவு தீர்மானிக்கப்படவில்லை"
          : "source scan boundary — printed paragraph relationship unresolved"
      }
      className="mb-5"
    >
      {items.map((it, k) =>
        it.kind === "unresolved-break" ? (
          <ScanRule key={k} toScan={it.toScan} note={it.note} ta={ta} />
        ) : it.kind === "paragraph" ? (
          <div key={k} className="leading-loose text-ink/90 dark:text-night-text/90">
            {renderSegments(it.segments, ta)}
          </div>
        ) : null,
      )}
    </div>
  );
}

// A subtle labelled scan rule. It asserts no paragraph relationship — it marks where the physical scan
// changed and the relationship stopped being knowable.
//
// UNLIKE the speech reader's page rule, this one is NOT `data-print="hide"`. Hiding it would let the two
// runs of a group abut on paper with nothing between them, which reads as one continuous paragraph —
// exactly the claim the group exists to withhold. The rule is evidence, not chrome, so it prints.
function ScanRule({ toScan, note, ta }: { toScan: number; note?: string; ta: boolean }) {
  const label = ta
    ? `மூல ஸ்கேன் ${toScan} எல்லை — அச்சுப் பத்தி உறவு தீர்மானிக்கப்படவில்லை`
    : `source scan ${toScan} boundary — printed paragraph relationship unresolved`;
  return (
    <div
      className="my-4 flex items-center gap-2 font-body text-[10px] uppercase tracking-wider text-ink/35 dark:text-night-text/35"
      title={note}
      role="separator"
      aria-label={label}
    >
      <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" aria-hidden />
      <span className="normal-case tracking-normal" aria-hidden>
        {ta ? `ஸ்கேன் ${toScan}` : `scan ${toScan}`}
      </span>
      <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" aria-hidden />
    </div>
  );
}

// Render a logical paragraph's per-scan segments, joined per `joinToNext`:
//   "space"   → one space;
//   "none"    → nothing (the scan split a word);
//   "unknown" → a NEUTRAL inline scan marker, never a silent space and never a silent concatenation;
//   "end"     → last segment, nothing after it.
// `kizhavan-kanavu` uses only "space" and "end"; the other two are handled so that a story which does
// use them cannot be rendered as a guess.
function renderSegments(segments: StoryTextSegment[], ta: boolean): ReactNode[] {
  const nodes: ReactNode[] = [];
  segments.forEach((s, i) => {
    nodes.push(<span key={"t" + i}>{inline(s.text)}</span>);
    if (s.joinToNext === "space") nodes.push(" ");
    else if (s.joinToNext === "unknown") {
      const n = segments[i + 1]?.sourceScan;
      const label = ta
        ? `மூல ஸ்கேன் ${n} எல்லை — சரியான இடைவெளி தீர்மானிக்கப்படவில்லை`
        : `source scan ${n} boundary — exact printed spacing unresolved`;
      nodes.push(
        <span
          key={"j" + i}
          className="mx-0.5 select-none align-baseline font-body text-[0.7em] text-ink/35 dark:text-night-text/35"
          title={label}
          role="separator"
          aria-label={label}
        >
          {"⟨"}
          {ta ? `ஸ்.${n}` : `sc.${n}`}
          {"⟩"}
        </span>,
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
