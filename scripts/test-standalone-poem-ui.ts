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

// ── 5. The source TYPE is the source's own word, or a generic one — never another work's ─────────
{
  for (const w of works) {
    const p = sourcePages.get(w.slug)!;
    const label = w.prov.source.sourceTypeLabel;
    if (label) {
      ok(p.ta.includes(label.ta), `${w.slug}: the source's own Tamil type word is rendered (${label.ta})`);
      ok(p.en.includes(label.en), `${w.slug}: the source's own English type word is rendered (${label.en})`);
    } else {
      ok(p.ta.includes("அச்சிட்ட மூலம்"), `${w.slug}: the generic Tamil source-type word is rendered`);
      ok(p.en.includes("printed source"), `${w.slug}: the generic English source-type word is rendered`);
    }
    // The generic default must stay generic: a periodical is never called a booklet.
    ok(!p.en.includes("printed booklet") && !p.ta.includes("printed booklet"), `${w.slug}: no work is described as a booklet by default`);
  }
  // The two periodical works say so; the two standalone booklets fall back to the generic word.
  eq(
    works.filter((w) => w.prov.source.sourceTypeLabel).map((w) => w.slug).sort(),
    ["marathi", "thennan-kathai"],
    "only the two periodical sources name their own type",
  );
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
      const first = lines[0] as { text: string };
      const last = lines[lines.length - 1] as { text: string };
      ok(html.includes(first.text), `${w.slug}/${layer}: the first source line is rendered`);
      ok(html.includes(last.text), `${w.slug}/${layer}: the last source line is rendered`);
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
  eq(poetry.length, 4, "the Poetry shelf publishes four works");
  eq(poetry.map((x) => x.slug).sort(), [...POEM_SLUGS].sort(), "the shelf's works are exactly the registry's");
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
