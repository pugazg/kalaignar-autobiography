/**
 * Tests for the /read shelf progressive disclosure (Reading Room Wayfinding, Phase 0).
 *
 *   npx tsx scripts/test-shelf-disclosure.ts
 *
 * Plain assertions run by tsx, matching scripts/test-daily-kural.ts — the repo has no test runner,
 * and adding one for a presentation cap would be a larger change than the thing under test.
 *
 * These assertions run against the RENDERED MARKUP rather than against a re-implementation of the
 * slice. That distinction is the whole point of the test: the cap is a display decision, and the
 * risk it introduces is that a work stops being delivered — dropped from the HTML, duplicated
 * across the two grids, or reordered. Checking `works.slice(0, 6)` again would prove none of that,
 * because it would share the defect with the code it is checking. Rendering the component and
 * counting the anchors it actually emits is what proves every published work still ships.
 *
 * Exits non-zero on failure so it can be wired into CI alongside the archival validators.
 */

import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LibraryHome from "../components/LibraryHome";
import { publishedWorks } from "../data/library";
import { discoveryShelves } from "../data/collections";

const CAP = 6; // must match INITIAL_WORKS_PER_SHELF in components/LibraryHome.tsx

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

// ── Render ───────────────────────────────────────────────────────────────────────────────────────
// createElement rather than JSX so this file stays .ts: the components use Next's automatic JSX
// runtime and do not import React, which a standalone tsx run outside Next cannot supply.
const html = renderToStaticMarkup(createElement(LibraryHome));
const shelves = discoveryShelves();
const works = publishedWorks();

/** The markup for one shelf <section>, sliced out by its aria-labelledby anchor. */
function sectionHtml(shelfId: string): string {
  const start = html.indexOf(`aria-labelledby="shelf-${shelfId}"`);
  if (start === -1) return "";
  const rest = html.slice(start);
  const end = rest.indexOf("</section>");
  return end === -1 ? rest : rest.slice(0, end);
}

/** exec loop rather than [...matchAll]: the app's tsconfig target predates downlevelIteration. */
function hrefsIn(s: string): string[] {
  const re = /<a[^>]+href="([^"]+)"/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out.push(m[1]);
  return out;
}

// ── 1. Every discovery entry is delivered, exactly once ──────────────────────────────────────────
// The inventory check: a display cap must never change what the page ships. Since Phase 1 the unit of
// display is the DISCOVERY ENTRY, not the work — a collection entry stands in for its members — so the
// inventory is checked against the entries the catalogue derives, and the work count is asserted
// separately below precisely because the two numbers are no longer the same.
const entries = shelves.flatMap((s) => s.entries);
const entryHrefs = entries.map((e) => (e.kind === "collection" ? e.collection.href : e.work.href));
const allCardHrefs = shelves.flatMap((s) => hrefsIn(sectionHtml(s.shelf.id)));
eq(allCardHrefs.length, entries.length, `every discovery entry is rendered (${entries.length} card links)`);
eq(new Set(allCardHrefs).size, entries.length, "no entry is rendered twice");
eq([...allCardHrefs].sort(), [...entryHrefs].sort(), "the rendered hrefs are exactly the derived entry hrefs");

// The catalogue did not shrink. Works and cards are different measurements and this pins both.
ok(works.length > entries.length, `the catalogue holds more works (${works.length}) than the page holds cards (${entries.length})`);

// ── 2–6. Per shelf: cap, disclosure presence, split, order, remainder ────────────────────────────
for (const { shelf, works: shelfWorks, entries: shelfEntries } of shelves) {
  const s = sectionHtml(shelf.id);
  const label = `${shelf.en} (${shelfWorks.length} works / ${shelfEntries.length} entries)`;
  const entryHref = (e: (typeof shelfEntries)[number]) => (e.kind === "collection" ? e.collection.href : e.work.href);
  ok(s.length > 0, `${label}: shelf section is rendered`);

  const detailsAt = s.indexOf("<details");
  const hasDisclosure = detailsAt !== -1;

  // THE CAP COUNTS ENTRIES, NOT WORKS. Fiction has 39 works but 3 entries, so it must have no
  // disclosure — and that must follow from the count, not from any test for the Fiction shelf.
  if (shelfEntries.length <= CAP) {
    ok(!hasDisclosure, `${label}: no disclosure on a shelf of ${shelfEntries.length} ≤ ${CAP} entries`);
    eq(hrefsIn(s), shelfEntries.map(entryHref), `${label}: all entries shown, in derived order`);
  } else {
    ok(hasDisclosure, `${label}: has a disclosure`);
    const before = hrefsIn(s.slice(0, detailsAt));
    const inside = hrefsIn(s.slice(detailsAt));

    eq(before.length, CAP, `${label}: exactly ${CAP} cards before the disclosure`);
    eq(before, shelfEntries.slice(0, CAP).map(entryHref), `${label}: the first ${CAP} are the first ${CAP} derived`);
    eq(inside, shelfEntries.slice(CAP).map(entryHref), `${label}: the overflow is the remainder, in derived order`);
    eq([...before, ...inside], shelfEntries.map(entryHref), `${label}: derived order is preserved across the split`);

    // The summary must state the true remainder — a wrong number here is a promise the page breaks.
    const summary = /<summary[^>]*>([\s\S]*?)<\/summary>/.exec(s.slice(detailsAt));
    ok(!!summary, `${label}: the disclosure has a <summary>`);
    const remainder = shelfEntries.length - CAP;
    ok(
      !!summary && new RegExp(`\\b${remainder}\\b`).test(summary[1]),
      `${label}: the summary names the remainder (${remainder})`,
    );
    ok(!!summary && summary[1].replace(/<[^>]*>/g, "").trim().length > 0, `${label}: the summary has a text label, not only a marker`);
  }

  // The shelf heading carries the shelf's TOTAL, not the visible count.
  const heading = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(s);
  ok(
    !!heading && new RegExp(`\\b${shelfWorks.length}\\b`).test(heading[1]),
    `${label}: the heading states the full published count`,
  );
}

// ── 7. Native disclosure semantics, so it survives without JavaScript ────────────────────────────
const detailsCount = (html.match(/<details/g) ?? []).length;
const summaryCount = (html.match(/<summary/g) ?? []).length;
eq(detailsCount, shelves.filter((s) => s.entries.length > CAP).length, "one <details> per over-cap shelf");
eq(summaryCount, detailsCount, "every <details> has exactly one <summary>");
ok(!/aria-expanded/.test(html), "no hand-written aria-expanded duplicating native <details> state");
ok(!/\shidden(=|\s|>)/.test(html), "no `hidden` attribute — that would stay hidden without JavaScript");

// ── 8. The disclosure's dark-mode text stays above the AA floor ──────────────────────────────────
// `dark:text-marina-light` is #1B7F87 on the #0C1116 Reading Room: 4.00:1, under the 4.5:1 WCAG AA
// minimum for text this size. The class is correct elsewhere in the app on other backgrounds, which
// is exactly why a reviewer could reinstate it here without noticing. This pins the decision.
const summaries = /<summary[^>]*class="([^"]*)"/.exec(html);
ok(!!summaries, "the disclosure summary carries a class list");
ok(!!summaries && !summaries[1].includes("dark:text-marina-light"),
   "the summary does not use dark:text-marina-light (4.00:1, below AA)");
ok(!!summaries && summaries[1].includes("dark:text-night-text/70"),
   "the summary uses the accessible dark class dark:text-night-text/70 (7.88:1)");
// Same reasoning for the focus indicator: .focus-ring draws ring-marina, which is 2.5:1 against the
// dark offset and page — under the 3:1 WCAG 1.4.11 (AA) asks of an author-supplied focus indicator.
// The shared utility stays as it is for the rest of the app; this control overrides its dark ring.
ok(!!summaries && summaries[1].includes("dark:focus-visible:ring-night-text/70"),
   "the summary overrides its dark focus ring to night-text/70 (7.88:1, not marina's 2.5:1)");

// ── 9. Phase 1 boundaries ────────────────────────────────────────────────────────────────────────
// A guard, not a feature test: the collection architecture is a separately authorized phase, and
// this file is the cheapest place to notice it arriving early.
const root = path.join(process.cwd());
// Phase 0's guard here asserted that data/collections.ts did NOT exist, to keep that PR from drifting
// into the collection model. Phase 1 IS that model, so the guard is replaced rather than deleted: the
// shelf component must still hold no collection logic and no shelf special-case — it renders whatever
// entries the catalogue derives, and the grouping rules live in data/collections.ts, where the
// source-linked validator can reach them.
const home = fs.readFileSync(path.join(root, "components/LibraryHome.tsx"), "utf-8");
ok(fs.existsSync(path.join(root, "data/collections.ts")), "the collection model lives in data/collections.ts");
for (const forbidden of ['=== "fiction"', '=== "speeches"', "shelf.id ===", "shelfId ==="]) {
  ok(!home.includes(forbidden), `LibraryHome special-cases no shelf: ${forbidden}`);
}
ok(!/collectionForWork|LIBRARY_COLLECTIONS/.test(home), "LibraryHome derives no membership itself");

// ── Report ───────────────────────────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`shelf-disclosure — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exitCode = 1;
} else {
  console.log(`shelf-disclosure — ${checks} checks, 0 failed`);
  console.log(
    `  ${works.length} works across ${shelves.length} shelves · ` +
      `${entries.length} discovery entries · ` +
      `${shelves.reduce((n2, s) => n2 + Math.min(CAP, s.entries.length), 0)} initially visible · ` +
      `${detailsCount} ${detailsCount === 1 ? "disclosure" : "disclosures"}`,
  );
}
