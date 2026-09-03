/**
 * UI/component contract tests for the four STANDALONE poems.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-standalone-poem-ui.ts
 *
 * P1 is the first time the components generalized in P0 meet heterogeneous real data, and the
 * failure mode those components exist to prevent is a work-specific fact being printed on a work
 * that does not have it. So every assertion below is run across ALL FOUR works and is written as a
 * DIFFERENCE: the same component, the same code path, four payloads, and a card that must appear on
 * exactly the works whose source establishes the thing it describes.
 *
 * These are deterministic component tests against the real published payloads, not screenshots.
 * `renderElements` is imported from the reader because the reader fetches its payload in an effect:
 * a server render of the whole component shows no verse, so testing the component alone would prove
 * nothing about how four structurally different poems actually render.
 *
 * Exits non-zero on failure so it can be wired into CI alongside the archival validators.
 */

import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PoemSource from "../components/PoemSource";
import { LangProvider } from "../lib/i18n";
import { renderElements } from "../components/PoemReader";
import { POEM_SLUGS } from "../data/poems";
import type { Poem, PoemProvenance } from "../data/poems";
import { publishedWorks } from "../data/library";
import LibraryHome from "../components/LibraryHome";

let checks = 0;
const failures: string[] = [];
const ok = (cond: boolean, label: string) => {
  checks++;
  if (!cond) failures.push(label);
};
const eq = <T,>(a: T, b: T, label: string) => {
  checks++;
  if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${label}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`);
};

const BASE = "https://nenjukkuneethi.org";
const DATA = path.join(process.cwd(), "public/data/poems");
const read = <T,>(slug: string, file: string): T => JSON.parse(fs.readFileSync(path.join(DATA, slug, file), "utf-8"));

const works = POEM_SLUGS.map((slug) => ({
  slug,
  poem: read<Poem>(slug, "poem.json"),
  prov: read<PoemProvenance>(slug, "provenance.json"),
}));

eq(works.length, 4, "all four standalone poems are under test");

/**
 * The provenance page for one work, in BOTH languages.
 *
 * The bare LangContext default is English and LangProvider's is Tamil, so rendering with and without
 * the provider exercises both reading languages through the same component. Both are asserted
 * everywhere below: a card that appears in one language and not the other is a real defect, and
 * checking a single language would hide it.
 */
function sourceHtml(w: (typeof works)[number], ta: boolean): string {
  const el = createElement(PoemSource, { slug: w.slug, prov: w.prov, exceptions: w.poem.editorialExceptions });
  return renderToStaticMarkup(ta ? createElement(LangProvider, null, el) : el);
}
const sourcePages = new Map(works.map((w) => [w.slug, { ta: sourceHtml(w, true), en: sourceHtml(w, false) }]));
/** Assert a bilingual card's presence (or absence) in both languages at once. */
const inBoth = (slug: (typeof POEM_SLUGS)[number], labels: { ta: string; en: string }) => {
  const p = sourcePages.get(slug)!;
  return { ta: p.ta.includes(labels.ta), en: p.en.includes(labels.en) };
};
/** React escapes text on render, so a needle taken from the data must be escaped the same way. */
const esc = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const CARD = {
  context: { ta: "மூலச் சூழல்", en: "Source context" },
  publication: { ta: "வெளியீட்டுச் சான்று", en: "Publication evidence" },
  notEstablished: { ta: "நிறுவப்படவில்லை", en: "NOT established" },
  exception: { ta: "பதிப்பாசிரியர் விதிவிலக்கு", en: "Editorial exception" },
};

/** The verse of one layer, rendered through the reader's real element renderer. */
function verseHtml(w: (typeof works)[number], layer: "tamil" | "english"): string {
  return renderToStaticMarkup(createElement("div", null, renderElements(w[  "poem"][layer].elements, layer === "tamil")));
}

// ── 1. Source context: rendered where the source prints one, absent where it does not ────────────
// A card headed "printed above the poem" is a claim about where words appear. Three of the four
// poems print no such note, and an empty card on those pages would make that claim falsely.
{
  const withContext = works.filter((w) => w.poem.sourceContext);
  const without = works.filter((w) => !w.poem.sourceContext);
  ok(withContext.length >= 1, `at least one work prints a source context (${withContext.length})`);
  ok(without.length >= 1, `at least one work prints none (${without.length})`);

  for (const w of withContext) {
    const p = sourcePages.get(w.slug)!;
    eq(inBoth(w.slug, CARD.context), { ta: true, en: true }, `${w.slug}: the source-context card renders in both languages`);
    // and it renders the source's OWN words, not a placeholder
    const firstFragment = w.poem.sourceContext!.noteTa.split("\n")[0].replace(/^\(/, "");
    ok(p.ta.includes(firstFragment) && p.en.includes(firstFragment), `${w.slug}: the card carries the printed note verbatim`);
    if (w.poem.sourceContext!.venue) {
      ok(p.ta.includes(w.poem.sourceContext!.venue!.ta), `${w.slug}: the printed venue is rendered in Tamil`);
      ok(p.en.includes(w.poem.sourceContext!.venue!.en), `${w.slug}: the printed venue is rendered in English`);
    }
  }
  for (const w of without) {
    const p = sourcePages.get(w.slug)!;
    eq(inBoth(w.slug, CARD.context), { ta: false, en: false }, `${w.slug}: NO empty source-context card in either language`);
    // Nor may any other work's context leak in through a shared literal.
    for (const other of withContext) {
      const ctx = other.poem.sourceContext;
      ok(!ctx?.venue || (!p.ta.includes(ctx.venue.ta) && !p.en.includes(ctx.venue.en)), `${w.slug}: does not show ${other.slug}'s venue`);
      ok(!ctx?.datePrinted || (!p.ta.includes(ctx.datePrinted) && !p.en.includes(ctx.datePrinted)), `${w.slug}: does not show ${other.slug}'s date`);
    }
  }
}

// ── 2. Publication evidence: established and NOT-established are different cards ─────────────────
{
  const established = works.filter((w) => w.prov.source.publicationEstablished);
  const notEstablished = works.filter((w) => !w.prov.source.publicationEstablished);
  eq(established.map((w) => w.slug), ["thennan-kathai"], "exactly one work establishes a publication");
  ok(notEstablished.length === 3, `three works establish none (${notEstablished.length})`);

  for (const w of established) {
    const p = sourcePages.get(w.slug)!;
    const pe = w.prov.source.publicationEstablished!;
    eq(inBoth(w.slug, CARD.publication), { ta: true, en: true }, `${w.slug}: the publication-evidence card renders in both languages`);
    ok(p.ta.includes(pe.publicationTa) && p.en.includes(pe.publicationTa), `${w.slug}: the established publication name is rendered`);
    ok(p.ta.includes(String(pe.year)) && p.en.includes(String(pe.year)), `${w.slug}: the established year is rendered`);
    // The established case must NOT also render the "NOT established" notice.
    eq(inBoth(w.slug, CARD.notEstablished), { ta: false, en: false }, `${w.slug}: does not also claim the publication is unestablished`);
  }
  for (const w of notEstablished) {
    const p = sourcePages.get(w.slug)!;
    eq(inBoth(w.slug, CARD.notEstablished), { ta: true, en: true }, `${w.slug}: the card states the publication is NOT established`);
    // No fabricated publication: the one established publication name may not be rendered as this
    // work's publication, and no year may be presented as its own.
    const other = established[0].prov.source.publicationEstablished!;
    ok(!p.ta.includes(`>${other.publicationTa}<`) && !p.en.includes(`>${other.publicationTa}<`), `${w.slug}: does not render another work's publication`);
    eq(w.poem.publicationYear, null, `${w.slug}: publication year stays null`);
    eq(w.poem.editionStatement, null, `${w.slug}: edition statement stays null`);
  }
}

// ── 3. The unnumbered-scan notice appears only where the source has unnumbered scans ─────────────
// The mixed case is the interesting one: one work numbers most scans and leaves one unnumbered, and
// three number none at all. A notice about "one unnumbered scan" on a work with no printed numbers
// anywhere would describe a situation that does not exist.
{
  for (const w of works) {
    const html = sourcePages.get(w.slug)!.ta;
    const note = w.prov.source.unnumberedScanNote;
    const printed = w.poem.tamil.elements.filter((e) => e.kind === "line").map((e) => (e as { printedPage: number | null }).printedPage);
    const anyNumbered = printed.some((p) => typeof p === "number");
    if (note) ok(html.includes(note.slice(0, 40)), `${w.slug}: the unnumbered-scan note is rendered`);
    else ok(!html.includes("no visible printed page number"), `${w.slug}: no unnumbered-scan notice is rendered`);
    // A work with no printed numbers anywhere must not display one.
    if (!anyNumbered) ok(printed.every((p) => p === null), `${w.slug}: no printed page number is shown for any line`);
  }
  // Exactly one of the four numbers some scans and not others.
  const mixed = works.filter((w) => {
    const p = w.poem.tamil.elements.filter((e) => e.kind === "line").map((e) => (e as { printedPage: number | null }).printedPage);
    return p.some((x) => typeof x === "number") && p.some((x) => x === null);
  });
  eq(mixed.map((w) => w.slug), ["idhayathai-thanthidu-anna"], "one work has a genuinely mixed printed-page map");
}

// ── 4. Scan counts and ranges are work-driven ────────────────────────────────────────────────────
{
  const expected: Record<string, [number, number, number]> = {
    // slug: [total scans in the controlling PDF, first poem scan, last poem scan]
    "anaiya-vilakku-anna": [19, 7, 17],
    "idhayathai-thanthidu-anna": [28, 13, 26],
    marathi: [248, 59, 61],
    "thennan-kathai": [218, 145, 152],
  };
  for (const w of works) {
    const [total, first, last] = expected[w.slug];
    const html = sourcePages.get(w.slug)!.ta;
    eq(w.prov.source.scanTotalPages, total, `${w.slug}: physical page count`);
    eq(w.poem.poemScans[0], first, `${w.slug}: first poem scan`);
    eq(w.poem.poemScans[w.poem.poemScans.length - 1], last, `${w.slug}: last poem scan`);
    eq(w.poem.poemScans.length, last - first + 1, `${w.slug}: poem scan count`);
    ok(html.includes(String(total)), `${w.slug}: the page count on the page is this work's own`);
    // No other work's page count may appear as this work's total.
    for (const [otherSlug, [otherTotal]] of Object.entries(expected)) {
      if (otherSlug === w.slug) continue;
      ok(w.prov.source.scanTotalPages !== otherTotal, `${w.slug}: page count is not ${otherSlug}'s`);
    }
  }
}

// ── 5. The source TYPE renders as COMPLETE, well-formed wording ──────────────────────────────────
// `sourceTypeLabel` is a NOUN PHRASE naming the kind of printed source, because the page composes it
// into running English: `Source facts (the ${label})` and `source facts (the ${label} / scan)`. P1
// first shipped "from a printed periodical" here, which is a prepositional phrase, and produced
// "Source facts (the from a printed periodical)" on two public pages.
//
// Asserting that the raw label "occurs somewhere" is exactly what failed to catch that — the label
// did occur, inside broken wording. So the assertions below check the WHOLE composed string, and
// separately check that the malformed shapes are absent.
{
  for (const w of works) {
    const p = sourcePages.get(w.slug)!;
    const label = w.prov.source.sourceTypeLabel;
    const en = label?.en ?? "printed source";
    const ta = label?.ta ?? "அச்சிட்ட மூலம்";
    // The complete rendered heading and the complete rendered intro sentence, both languages.
    ok(p.en.includes(`Source facts (the ${en})`), `${w.slug}: renders "Source facts (the ${en})"`);
    ok(p.en.includes(`source facts (the ${en} / scan)`), `${w.slug}: renders the intro clause "(the ${en} / scan)"`);
    ok(p.ta.includes(`மூல உண்மைகள் (${ta})`), `${w.slug}: renders "மூல உண்மைகள் (${ta})"`);
    ok(p.ta.includes(`(${ta}/scan)`), `${w.slug}: renders the Tamil intro clause "(${ta}/scan)"`);
    // A prepositional phrase in the label shows up as these shapes, in either language.
    for (const bad of ["the from", "the a ", "the an ", "(the )"]) {
      ok(!p.en.includes(bad), `${w.slug}: the English page contains no "${bad}"`);
    }
    ok(!/\(\s*(இலிருந்து|இருந்து)/.test(p.ta), `${w.slug}: the Tamil label is not a postpositional phrase`);
    // The generic default must stay generic: a periodical is never called a booklet.
    ok(!p.en.includes("printed booklet") && !p.ta.includes("printed booklet"), `${w.slug}: no work is described as a booklet by default`);
  }
  // Exactly the two periodical sources name their own type; the other two fall back to the generic
  // noun phrase, and neither inherits the periodical label.
  eq(
    works.filter((w) => w.prov.source.sourceTypeLabel).map((w) => w.slug).sort(),
    ["marathi", "thennan-kathai"],
    "only the two periodical sources name their own type",
  );
  for (const w of works.filter((x) => !x.prov.source.sourceTypeLabel)) {
    const p = sourcePages.get(w.slug)!;
    ok(!p.en.includes("printed periodical"), `${w.slug}: does not inherit the periodical label (English)`);
    ok(!p.ta.includes("அச்சிட்ட இதழ்"), `${w.slug}: does not inherit the periodical label (Tamil)`);
    ok(p.en.includes("Source facts (the printed source)"), `${w.slug}: renders the generic noun phrase`);
  }
  for (const w of works.filter((x) => x.prov.source.sourceTypeLabel)) {
    eq(w.prov.source.sourceTypeLabel!.en, "printed periodical", `${w.slug}: English label is the noun phrase`);
    eq(w.prov.source.sourceTypeLabel!.ta, "அச்சிட்ட இதழ்", `${w.slug}: Tamil label is the noun phrase`);
  }
}

// ── 6. The editorial exception renders for exactly the one work that has one ─────────────────────
{
  const withException = works.filter((w) => w.poem.editorialExceptions?.length);
  eq(withException.map((w) => w.slug), ["thennan-kathai"], "exactly one work carries an editorial exception");
  for (const w of works) {
    const p = sourcePages.get(w.slug)!;
    const has = Boolean(w.poem.editorialExceptions?.length);
    eq(inBoth(w.slug, CARD.exception), { ta: has, en: has }, `${w.slug}: the exception card renders in both languages iff the work has one`);
    if (has) {
      const e = w.poem.editorialExceptions![0];
      const html = p.ta;
      ok(html.includes(String(e.scan)) && p.en.includes(String(e.scan)), `${w.slug}: the card names the scan the exception applies to`);
      ok(html.includes(esc(e.summary.slice(0, 50))), `${w.slug}: the card states what was done`);
      ok(html.includes(esc(e.consequence.slice(0, 40))), `${w.slug}: the card states the effect on completeness`);
      ok(html.includes(esc(e.restoration.slice(0, 40))), `${w.slug}: the card states that restoration is upstream-only`);
      for (const c of e.citations) ok(html.includes(esc(c)), `${w.slug}: the card shows the citation ${c.split(":")[0]}`);
      ok(e.omittedTermReproduced === false, `${w.slug}: the omitted term is declared not reproduced`);
      // It must be presented as an exception, NOT folded into the locked exclusions.
      ok(!w.prov.source.lockedExclusions.some((x) => /omission|omitted/i.test(x)), `${w.slug}: not filed as a locked exclusion`);
    }
  }
}

// ── 7. The verse renders: every element kind, on every work ──────────────────────────────────────
{
  for (const w of works) {
    for (const layer of ["tamil", "english"] as const) {
      const html = verseHtml(w, layer);
      const lines = w.poem[layer].elements.filter((e) => e.kind === "line");
      ok(lines.length > 50, `${w.slug}/${layer}: the layer is non-trivial (${lines.length} lines)`);
      // PRESENCE, positively: the first and last source lines must actually be in the output.
      // Compared against the READING text: emphasis delimiters are markup the renderer resolves, so
      // a line whose source text carries them appears without them. The words must all be there.
      const reading = (t: string) => t.replace(/\*\*([^*]+)\*\*|\*([^*]+)\*/g, "$1$2").replace(/^\*+|\*+$/g, "");
      const first = lines[0] as { text: string };
      const last = lines[lines.length - 1] as { text: string };
      ok(html.includes(reading(first.text)), `${w.slug}/${layer}: the first source line is rendered`);
      ok(html.includes(reading(last.text)), `${w.slug}/${layer}: the last source line is rendered`);
      // Every unresolved page transition draws the neutral marker — it asserts neither relation.
      const unresolved = w.poem[layer].elements.filter((e) => e.kind === "page-transition" && (e as { stanzaRelation: string }).stanzaRelation === "unknown").length;
      eq((html.match(/poem-page-transition /g) ?? []).length, unresolved, `${w.slug}/${layer}: one neutral marker per unresolved transition`);
      // No Markdown heading syntax ever reaches the reader.
      ok(!/>#{1,6}\s/.test(html), `${w.slug}/${layer}: no raw Markdown heading syntax is rendered`);
    }
  }
}

// ── 8. A printed source heading renders AS a heading, and only where the source prints one ───────
{
  for (const w of works) {
    const count = w.poem.tamil.sourceHeadings ?? 0;
    for (const layer of ["tamil", "english"] as const) {
      const html = verseHtml(w, layer);
      eq((html.match(/data-source-heading=/g) ?? []).length, count, `${w.slug}/${layer}: ${count} printed source heading(s) rendered`);
      const headings = w.poem[layer].elements.filter((e) => e.kind === "source-heading") as { text: string }[];
      for (const h of headings) {
        ok(html.includes(`<h2 class=`) && html.includes(h.text), `${w.slug}/${layer}: "${h.text}" is marked up as a heading, not verse`);
      }
    }
  }
  eq(works.filter((w) => (w.poem.tamil.sourceHeadings ?? 0) > 0).map((w) => w.slug), ["anaiya-vilakku-anna"], "exactly one work prints a heading inside the poem");
}

// ── 9. The existing poem still renders exactly as it did ─────────────────────────────────────────
// Its payload is byte-pinned by the validator; this proves the RENDERING of it did not drift when
// the components were generalized to carry three more works.
{
  const w = works.find((x) => x.slug === "idhayathai-thanthidu-anna")!;
  const html = sourcePages.get(w.slug)!.ta;
  eq(inBoth(w.slug, CARD.context), { ta: true, en: true }, "idhayathai: still renders its printed source context");
  ok(html.includes("9.2.1969"), "idhayathai: still renders its printed date");
  ok(html.includes("சென்னை வானொலி"), "idhayathai: still renders its printed venue");
  eq(inBoth(w.slug, CARD.notEstablished), { ta: true, en: true }, "idhayathai: still states that no publication is established");
  ok(html.includes("என்னுரை"), "idhayathai: still names the foreword among its locked exclusions");
  eq(inBoth(w.slug, CARD.exception), { ta: false, en: false }, "idhayathai: still shows no editorial exception");
  const ta = verseHtml(w, "tamil");
  ok(ta.includes("இதயத்தைத் தந்திடு அண்ணா..") || ta.includes("இதயத்தை"), "idhayathai: the Tamil verse still renders");
  eq((ta.match(/data-source-heading=/g) ?? []).length, 0, "idhayathai: still renders no printed heading");
}

// ── 10. The catalogue and the payloads agree ─────────────────────────────────────────────────────
{
  const poetry = publishedWorks().filter((x) => x.shelf === "poetry");
  // The Poetry shelf now also holds the P2 publication, so the STANDALONE works are a subset: every
  // POEM_SLUGS entry is on the shelf, and the shelf additionally carries the publication.
  const standaloneOnShelf = poetry.filter((x) => (POEM_SLUGS as readonly string[]).includes(x.slug));
  eq(standaloneOnShelf.length, 4, "the four standalone poems are on the Poetry shelf");
  eq(standaloneOnShelf.map((x) => x.slug).sort(), [...POEM_SLUGS].sort(), "the standalone works are exactly the registry's");
  for (const w of works) {
    const entry = poetry.find((x) => x.slug === w.slug)!;
    ok(!!entry, `${w.slug}: has a catalogue entry`);
    eq(entry.titleTa, w.poem.title.ta, `${w.slug}: catalogue Tamil title matches the payload`);
    eq(entry.titleEn, w.poem.title.en, `${w.slug}: catalogue English title matches the payload`);
    eq(entry.sourceCommit, w.poem.sourceCommit, `${w.slug}: catalogue pin matches the payload pin`);
    eq(entry.href, `/poems/${w.slug}`, `${w.slug}: catalogue href`);
    eq(entry.provenanceHref, `/poems/${w.slug}/source`, `${w.slug}: catalogue provenance href`);
    // `edition` is set on exactly the work whose source establishes one.
    eq(Boolean(entry.edition), Boolean(w.prov.source.publicationEstablished), `${w.slug}: catalogue edition iff publication established`);
  }
}

// ── 10b. Markdown emphasis: what the READER sees, not what the payload holds ─────────────────────
// These two are different questions and P1's first report conflated them, asserting that released
// delimiters "are carried into the reading layer exactly as released, which means a reader currently
// sees the asterisks". The payload half is true and deliberate — the text is byte-exact. The reader
// half was false: PoemReader's `inline()` resolves balanced same-line `**…**` into <strong> and
// `*…*` into <em>, so those delimiters never reach a reader.
//
// The claim was wrong because it was inferred from the JSON instead of measured on the rendered
// output. So it is measured here, through the real `renderElements()` path, on real released lines.
{
  const byText = (w: (typeof works)[number], layer: "tamil" | "english", needle: string) =>
    w.poem[layer].elements.filter((e) => e.kind === "line" && (e as { text: string }).text.includes(needle));
  /** Render just the given elements through the reader's own renderer. */
  const render = (els: unknown[], ta: boolean) =>
    renderToStaticMarkup(createElement("div", null, renderElements(els as never, ta)));

  // (1) An existing Idhayathai `*…*` term renders as <em>, with no delimiter left behind.
  {
    const w = works.find((x) => x.slug === "idhayathai-thanthidu-anna")!;
    const els = byText(w, "english", "tangu sani");
    eq(els.length, 1, "idhayathai: the *tangu sani vēl* line is present exactly once");
    const html = render(els, false);
    ok(html.includes("<em>tangu sani vēl</em>"), "idhayathai: *tangu sani vēl* renders as <em>");
    ok(!html.includes("*"), "idhayathai: no asterisk survives into the rendered output");
    // The payload itself is untouched — the delimiters are still in the data, byte-exact.
    ok((els[0] as { text: string }).text.includes("*tangu sani vēl*"), "idhayathai: the payload still holds the delimiters verbatim");
  }

  // (2) Anaiya's italic work-title renders as <em>.
  {
    const w = works.find((x) => x.slug === "anaiya-vilakku-anna")!;
    const els = byText(w, "english", "By the Riverbank");
    eq(els.length, 1, "anaiya: the *By the Riverbank* line is present exactly once");
    const html = render(els, false);
    ok(html.includes("<em>By the Riverbank</em>"), "anaiya: *By the Riverbank* renders as <em>By the Riverbank</em>");
    ok(!html.includes("*"), "anaiya: no asterisk survives on that line");
  }

  // (3) Anaiya's bold refrain renders as <strong>.
  {
    const w = works.find((x) => x.slug === "anaiya-vilakku-anna")!;
    const els = byText(w, "english", "Kazhagam saranam gacchami");
    eq(els.length, 1, "anaiya: the Kazhagam refrain line is present exactly once");
    const html = render(els, false);
    ok(/<strong[^>]*>Kazhagam saranam gacchami!<\/strong>/.test(html), "anaiya: **Kazhagam saranam gacchami!** renders as <strong>");
    ok(!html.includes("*"), "anaiya: no asterisk survives on that line");
  }

  // (4) Marathi's genuinely literal standalone `*` stays literal and is not swallowed as emphasis.
  //     The archive's own decorative separators are `★`; this is a different character carried
  //     verbatim from the source, and a renderer that "cleaned it up" would delete source content.
  {
    const w = works.find((x) => x.slug === "marathi")!;
    for (const layer of ["tamil", "english"] as const) {
      const els = w.poem[layer].elements.filter((e) => e.kind === "line" && (e as { text: string }).text === "*");
      eq(els.length, 1, `marathi/${layer}: the literal * line is present exactly once`);
      const html = render(els, layer === "tamil");
      ok(html.includes("*"), `marathi/${layer}: the literal * survives rendering`);
      ok(!html.includes("<em>") && !html.includes("<strong"), `marathi/${layer}: the literal * is not read as emphasis`);
    }
  }

  // (5) The census counts, pinned per category so neither can grow unnoticed. `balanced` is markup
  //     the reader resolves; `leftover` is `*` the line-local renderer cannot pair — correct for a
  //     literal, and the visible residue of an emphasis that opens on one line and closes on another.
  const BAL = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  const census = (w: (typeof works)[number], layer: "tamil" | "english") => {
    let balanced = 0;
    let leftover = 0;
    for (const e of w.poem[layer].elements) {
      if (e.kind !== "line") continue;
      const t = (e as { text: string }).text;
      if (!t.includes("*")) continue;
      const spans: [number, number][] = [];
      BAL.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = BAL.exec(t)) !== null) spans.push([m.index, m.index + m[0].length]);
      if (spans.length) balanced++;
      let loose = 0;
      for (let i = 0; i < t.length; i++) if (t[i] === "*" && !spans.some(([a, b]) => a <= i && i < b)) loose++;
      if (loose) leftover++;
    }
    return { balanced, leftover };
  };
  const EXPECTED: Record<string, { tamil: [number, number]; english: [number, number] }> = {
    // slug: { layer: [balanced, leftover] }
    "idhayathai-thanthidu-anna": { tamil: [0, 0], english: [22, 0] },
    "anaiya-vilakku-anna": { tamil: [0, 0], english: [8, 2] },
    marathi: { tamil: [0, 1], english: [0, 1] },
    "thennan-kathai": { tamil: [0, 0], english: [0, 0] },
  };
  for (const w of works) {
    for (const layer of ["tamil", "english"] as const) {
      const [balanced, leftover] = EXPECTED[w.slug][layer];
      eq(census(w, layer), { balanced, leftover }, `${w.slug}/${layer}: Markdown-marker census`);
    }
  }
  // (6) THE CROSS-LINE EMPHASIS. One strong span opens on one source line and closes on the next.
  //     The data keeps both delimiters byte-exact; the renderer now pairs them within the verse run.
  {
    const w = works.find((x) => x.slug === "anaiya-vilakku-anna")!;
    const els = w.poem.english.elements;
    const openIdx = els.findIndex((e) => e.kind === "line" && (e as { text: string }).text === "**Autonomy for the states;");
    const closeIdx = els.findIndex((e) => e.kind === "line" && (e as { text: string }).text === "federalism at the Centre!**");
    ok(openIdx >= 0 && closeIdx >= 0, "anaiya: both halves of the cross-line emphasis are present");
    eq(closeIdx - openIdx, 1, "anaiya: they are consecutive elements, with no boundary between them");
    eq((els[openIdx] as { sourceScan: number }).sourceScan, 17, "anaiya: the span is on scan 17");

    // Rendered through the reader's own path, as part of its real verse run.
    const html = render(els.slice(openIdx, closeIdx + 1), false);
    ok(!html.includes("**"), "anaiya: no literal ** survives the cross-line pairing");
    ok(!html.includes("*"), "anaiya: no asterisk at all survives on those two lines");
    ok(html.includes("Autonomy for the states;"), "anaiya: the opening line's text is rendered");
    ok(html.includes("federalism at the Centre!"), "anaiya: the closing line's text is rendered");
    // BOTH source lines keep their own wrapper — lineation is untouched by the emphasis.
    eq((html.match(/<span class="block/g) ?? []).length, 2, "anaiya: two source lines, two line wrappers");
    // Both are emphasised, and the emphasis is INSIDE each wrapper rather than around them.
    eq((html.match(/<strong/g) ?? []).length, 2, "anaiya: each line carries its own <strong>");
    ok(/<span class="block[^"]*"[^>]*><strong[^>]*>Autonomy for the states;<\/strong><\/span>/.test(html), "anaiya: the opening line renders as strong text inside its wrapper");
    ok(/<strong[^>]*>federalism at the Centre!<\/strong>/.test(html), "anaiya: the closing line renders as strong text");
    // The payload is untouched: the delimiters are still there, byte-exact.
    ok((els[openIdx] as { text: string }).text.startsWith("**"), "anaiya: the payload still opens with ** verbatim");
    ok((els[closeIdx] as { text: string }).text.endsWith("**"), "anaiya: the payload still closes with ** verbatim");
  }

  // (7) A span must NEVER cross a boundary. Rendering the whole layer must not leave the rest of the
  //     poem emphasised, and the run-scoped pairing is what guarantees it.
  {
    for (const w of works) {
      for (const layer of ["tamil", "english"] as const) {
        const html = render(w.poem[layer].elements, layer === "tamil");
        const lines = w.poem[layer].elements.filter((e) => e.kind === "line").length;
        eq((html.match(/<span class="block/g) ?? []).length, lines, `${w.slug}/${layer}: one wrapper per source line, whole poem`);
        const strongs = (html.match(/<strong/g) ?? []).length;
        ok(strongs <= 4, `${w.slug}/${layer}: emphasis stays bounded (${strongs} <strong>), not leaked across the poem`);
      }
    }
  }
}

// ── 10c. A work with no approved English title publishes none ────────────────────────────────────
// The frozen release for one work declares no English title and its SOURCE_MAP says the batch
// translates the poem body only unless one is separately approved. `title.en` therefore falls back
// to the canonical Tamil title, and every surface that would otherwise present a translated title
// must suppress the duplicate rather than render the Tamil title as its own translation.
{
  const REJECTED = "The Lay of the Southern King";
  const noTitle = works.filter((w) => w.poem.title.en === w.poem.title.ta);
  eq(noTitle.map((w) => w.slug), ["thennan-kathai"], "exactly one work publishes no English title");

  for (const w of works) {
    const p = sourcePages.get(w.slug)!;
    const hasTitle = w.poem.title.en !== w.poem.title.ta;
    // The provenance page's secondary title and Work row show the English title only where one exists.
    const workRow = `<span class="font-tamil" lang="ta">${w.poem.title.ta}</span> · ${w.poem.title.en}`;
    eq(p.ta.includes(workRow), hasTitle, `${w.slug}: the Work row pairs both titles only where both exist`);
    // The rejected label must appear on no page, in either language, for any work.
    ok(!p.ta.includes(REJECTED) && !p.en.includes(REJECTED), `${w.slug}: the rejected label is absent from the provenance page`);
  }

  // The reader shows no duplicated secondary title, and the catalogue card shows no invented one.
  for (const w of works) {
    const hasTitle = w.poem.title.en !== w.poem.title.ta;
    const reader = renderToStaticMarkup(
      createElement("div", null, renderElements(w.poem.tamil.elements.slice(0, 1) as never, true)),
    );
    void reader;
    const home = renderToStaticMarkup(createElement(LibraryHome));
    const entry = publishedWorks().find((x) => x.slug === w.slug)!;
    ok(home.includes(entry.titleTa), `${w.slug}: the catalogue card shows the canonical Tamil title`);
    if (!hasTitle) {
      // The English line would be the Tamil title again — it must not be emitted twice on the card.
      const card = home.slice(home.indexOf(entry.titleTa), home.indexOf(entry.titleTa) + 900);
      eq((card.match(new RegExp(entry.titleTa.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length, 1, `${w.slug}: the card renders the title once, not as its own translation`);
    }
    ok(!home.includes(REJECTED), `${w.slug}: the rejected label is absent from the catalogue`);
  }

  // The provenance page states the source status explicitly, in both languages.
  {
    const w = noTitle[0];
    const p = sourcePages.get(w.slug)!;
    ok(typeof w.prov.source.englishTitleNote === "string", `${w.slug}: an englishTitleNote is recorded`);
    // The Tamil must say WHERE approval is absent — the source repository — rather than describing
    // the quality of a review. `மேலோட்டமாக அங்கீகரிக்கப்படவில்லை` said "not approved superficially",
    // which is a different claim entirely, so its absence is asserted as well as the correct wording
    // being present: proving the bad string is gone is not the same as proving the good one is there.
    ok(p.en.includes("none approved upstream"), `${w.slug}: the English page states no title is approved upstream`);
    ok(p.ta.includes("மூலக் களஞ்சியத்தில் இறுதியாக அங்கீகரிக்கப்படவில்லை"), `${w.slug}: the Tamil page names the source repository as where approval is absent`);
    ok(!p.ta.includes("மேலோட்டமாக"), `${w.slug}: the Tamil page does not say "superficially"`);
    ok(!p.en.includes("மேலோட்டமாக"), `${w.slug}: the superseded Tamil wording is absent in English mode too`);
    const note = esc(w.prov.source.englishTitleNote!);
    ok(p.en.includes(note) && p.ta.includes(note), `${w.slug}: the full note is rendered in both languages`);
    ok(/RELEASE-COMPLETE/.test(w.prov.source.englishTitleNote!), `${w.slug}: the note says the TRANSLATION is release-complete, only the title unapproved`);
    ok(/replaces this fallback/.test(w.prov.source.englishTitleNote!), `${w.slug}: the note says an approved title can replace the fallback`);
    ok(w.poem.factsNotStated.includes("english-title"), `${w.slug}: english-title is named among the unstated facts`);
  }

  // And nothing anywhere in the published data carries the rejected label.
  ok(!JSON.stringify(works).includes(REJECTED), "the rejected label is absent from every payload");
}

// ── 11. The BUILT sitemap: two URLs per poem, no duplicates ──────────────────────────────────────
// This proof lives here rather than in the P1 validator because it needs build output. The validator
// runs in the archival-validators job, which fetches source clones but never builds, so its own
// sitemap check falls back to proving the registry it derives from is duplicate-free. This job DOES
// build before it runs tests, so the actual emitted sitemap is checked here and the strongest form
// of the proof runs in CI rather than only on a developer's machine.
{
  const body = path.join(process.cwd(), ".next/server/app/sitemap.xml.body");
  if (fs.existsSync(body)) {
    // exec loop rather than [...matchAll]: the app's tsconfig target predates downlevelIteration.
    const urls: string[] = [];
    const re = /<loc>([^<]+)<\/loc>/g;
    const xml = fs.readFileSync(body, "utf-8");
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) urls.push(m[1]);
    ok(urls.length > 100, `the built sitemap is non-trivial (${urls.length} URLs)`);
    eq(urls.length - new Set(urls).size, 0, "the built sitemap has no duplicate URLs");
    // Restrict to the STANDALONE poems: the P2 publication also lives under /poems/ but has its own
    // 60-route family (landing + source + 58 items), validated by the P2 validator, not here.
    const standaloneUrls = POEM_SLUGS.flatMap((slug) => [`${BASE}/poems/${slug}`, `${BASE}/poems/${slug}/source`]);
    for (const url of standaloneUrls) ok(urls.includes(url), `the built sitemap carries ${url.replace(BASE, "")}`);
    const poemUrls = urls.filter((u) => /\/poems\//.test(u));
    eq(new Set(poemUrls).size, poemUrls.length, "the built sitemap's poem URLs are unique");
    for (const slug of POEM_SLUGS) {
      ok(poemUrls.some((u) => u.endsWith(`/poems/${slug}`)), `the built sitemap carries /poems/${slug}`);
      ok(poemUrls.some((u) => u.endsWith(`/poems/${slug}/source`)), `the built sitemap carries /poems/${slug}/source`);
    }
    // Every prerendered poem page exists on disk — a sitemap URL with no page behind it is a 404.
    for (const slug of POEM_SLUGS) {
      ok(fs.existsSync(path.join(process.cwd(), ".next/server/app/poems", `${slug}.html`)), `${slug}: the landing page is prerendered`);
      ok(fs.existsSync(path.join(process.cwd(), ".next/server/app/poems", slug, "source.html")), `${slug}: the source page is prerendered`);
    }
  } else {
    console.log("  (note: no build output — the built-sitemap checks were skipped; run `npm run build` first)");
  }
}

// ── Report ───────────────────────────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`standalone-poem-ui — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exitCode = 1;
} else {
  console.log(`standalone-poem-ui — ${checks} checks, 0 failed`);
  console.log(`  ${works.length} standalone poems · ${works.filter((w) => w.poem.sourceContext).length} with printed source context · ` +
    `${works.filter((w) => w.prov.source.publicationEstablished).length} with established publication · ` +
    `${works.filter((w) => w.poem.editorialExceptions?.length).length} with an editorial exception · ` +
    `${works.filter((w) => (w.poem.tamil.sourceHeadings ?? 0) > 0).length} with a printed heading`);
}
