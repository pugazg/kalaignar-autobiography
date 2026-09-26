/**
 * Tests for /read shelf delivery — re-scoped for Reading Room IA v2 R2-B.
 *
 *   npx tsx scripts/test-shelf-disclosure.ts
 *
 * HISTORY. This file was written for the Phase-0 progressive disclosure: /read rendered every shelf's discovery
 * entries with the first 6 visible and the rest behind a native <details>. R2-B retired that public surface. /read is
 * now nine category cards, and every work is delivered by its category page (/read/<category>) in full, with no
 * disclosure at all.
 *
 * What is kept, and where:
 *   1. The discovery DATA MODEL, `discoveryShelves()`, is unchanged and is still recorded here as a historical
 *      data-level invariant (98 entries, 42 within the historical 6-per-shelf cap, 6 over-cap shelves), with its
 *      derivation rules. It is no longer claimed to be rendered anywhere.
 *   2. The inventory guarantee this file existed for — a display decision must never stop a work being delivered —
 *      is now proven on the RENDERED category pages: every published work's link is emitted exactly once, in
 *      catalogue order, and none is hidden behind a disclosure.
 *   3. The landing is proven to be the category landing: 9 cards, no work/collection card, no <details>.
 *   4. The accessibility decisions pinned for the old disclosure (dark text and focus ring on night-text/70) are
 *      carried to the control that replaced it, the category card.
 *
 * These assertions run against RENDERED MARKUP, not a re-implementation, for the reason this file always gave:
 * counting the anchors a page actually emits is what proves every published work still ships.
 *
 * Exits non-zero on failure so it can be wired into CI alongside the archival validators.
 */

import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LibraryHome from "../components/LibraryHome";
import LibraryCategoryPage from "../components/LibraryCategoryPage";
import { SHELVES, publishedWorks } from "../data/library";
import { LIBRARY_COLLECTIONS, discoveryShelves } from "../data/collections";
import { READ_CATEGORIES, READ_CATEGORY_ROUTES } from "../data/read-categories";

/** The HISTORICAL /read disclosure cap (Phase 0 → R2-A). Kept only to state the frozen discovery arithmetic below. */
const HISTORICAL_CAP = 6;

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

/** exec loop rather than [...matchAll]: the app's tsconfig target predates downlevelIteration. */
function hrefsIn(s: string): string[] {
  const re = /<a[^>]+href="([^"]+)"/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out.push(m[1]);
  return out;
}

// createElement rather than JSX so this file stays .ts: the components use Next's automatic JSX runtime and do not
// import React, which a standalone tsx run outside Next cannot supply.
const home = renderToStaticMarkup(createElement(LibraryHome));
const works = publishedWorks();
const shelves = discoveryShelves();

// ── 1. The discovery data model — historical, data-level ─────────────────────────────────────────────────────
// Frozen at R2-A (the last stage that rendered it): 335 works → 98 entries, 42 within the cap, 6 over-cap shelves.
const entries = shelves.flatMap((s) => s.entries);
const entryHref = (e: (typeof entries)[number]) => (e.kind === "collection" ? e.collection.href : e.work.href);
eq(entries.length, 98, "discoveryShelves(): 98 discovery entries (historical)");
eq(new Set(entries.map(entryHref)).size, entries.length, "discoveryShelves(): every entry is distinct");
eq(shelves.reduce((n, s) => n + Math.min(HISTORICAL_CAP, s.entries.length), 0), 42, "discoveryShelves(): 42 entries within the historical 6-per-shelf cap");
eq(shelves.filter((s) => s.entries.length > HISTORICAL_CAP).length, 6, "discoveryShelves(): 6 shelves over the historical cap");
eq(shelves.reduce((n, s) => n + s.works.length, 0), works.length, "discoveryShelves(): its shelves still hold every published work");
ok(works.length > entries.length, `the catalogue holds more works (${works.length}) than the discovery model has entries (${entries.length})`);
for (const s of shelves) {
  // The derivation rule that made the entry count smaller than the work count: a collection entry stands in for its
  // members, and every other work stands for itself. Checked as data, per shelf.
  const members = new Set(s.collections.flatMap((c) => c.members.map((m) => m.workId)));
  const standalone = s.works.filter((w) => !members.has(w.id));
  eq(s.entries.length, s.collections.length + standalone.length, `${s.shelf.en}: entries = collections + standalone works (data)`);
}

// ── 2. The landing is the category landing ───────────────────────────────────────────────────────────────────
const homeHrefs = hrefsIn(home);
eq(homeHrefs.filter((h) => h !== "/"), [...READ_CATEGORY_ROUTES], "/read links only to the 9 category routes (plus Home), in order");
eq((home.match(/data-testid="read-category-card"/g) ?? []).length, 9, "/read renders exactly 9 category cards");
eq(homeHrefs.filter((h) => works.some((w) => w.href === h)).length, 0, "/read renders no work card");
eq(homeHrefs.filter((h) => h.startsWith("/collections/")).length, 0, "/read renders no collection card");
eq((home.match(/<details/g) ?? []).length, 0, "/read has no shelf disclosure <details>");
eq((home.match(/<summary/g) ?? []).length, 0, "/read has no <summary>");
ok(!/aria-expanded/.test(home), "/read has no hand-written aria-expanded");
ok(!/\shidden(=|\s|>)/.test(home), "/read hides nothing behind a `hidden` attribute");

// ── 3. Full delivery, now through the category pages ─────────────────────────────────────────────────────────
// The guarantee this file exists for: every published work is delivered, exactly once, in derived order, with nothing
// behind a disclosure — measured on what the category pages actually emit.
const delivered: string[] = [];
for (const c of READ_CATEGORIES) {
  const page = renderToStaticMarkup(createElement(LibraryCategoryPage, { shelf: c.shelf }));
  const start = page.indexOf('data-testid="category-works"');
  const grid = start === -1 ? "" : page.slice(start, page.indexOf("</section>", start));
  const expected = works.filter((w) => w.shelf === c.shelf).map((w) => w.href);
  eq(hrefsIn(grid), expected, `${c.route}: every work on the shelf is delivered, in catalogue order`);
  eq((page.match(/<details/g) ?? []).length, 0, `${c.route}: no disclosure — nothing is deferred`);
  ok(!/\shidden(=|\s|>)/.test(page), `${c.route}: nothing is hidden`);
  delivered.push(...hrefsIn(grid));
}
eq(delivered.length, works.length, `category pages deliver ${works.length} work links in total`);
eq(new Set(delivered).size, works.length, "no work is delivered twice");
eq([...delivered].sort(), works.map((w) => w.href).sort(), "the delivered links are exactly the published works");

// ── 4. The landing card's count is the WORK count, never the discovery-entry count ───────────────────────────
for (const shelf of SHELVES) {
  const i = home.indexOf(`data-shelf="${shelf.id}"`);
  const card = i === -1 ? "" : home.slice(i, home.indexOf("</a>", i));
  const n = works.filter((w) => w.shelf === shelf.id).length;
  const d = shelves.find((s) => s.shelf.id === shelf.id)?.entries.length ?? 0;
  ok(new RegExp(`>${n} works?`).test(card), `${shelf.en}: the card states its ${n} works`);
  if (d !== n) ok(!new RegExp(`>${d} works?`).test(card), `${shelf.en}: the card does not state the ${d} discovery entries as its count`);
}

// ── 5. Accessibility decisions carried to the control that replaced the disclosure ───────────────────────────
// `.focus-ring` draws ring-marina, 2.5:1 against the dark page — under WCAG 1.4.11's 3:1. The disclosure overrode its
// dark ring to night-text/70 (7.88:1); the category card, now the landing's only control, carries the same override.
// Its title hover is written locally, not from accentFor()'s `dark:group-hover:text-marina-light` (3.8:1 on the card).
const cardClass = /<a[^>]+data-testid="read-category-card"[^>]*class="([^"]*)"|<a[^>]+class="([^"]*)"[^>]*data-testid="read-category-card"/.exec(home);
const cls = cardClass ? cardClass[1] ?? cardClass[2] : "";
ok(cls.includes("dark:focus-visible:ring-night-text/70"), "category card overrides its dark focus ring to night-text/70");
ok(!home.includes("dark:group-hover:text-marina-light"), "no category-card title hovers to marina-light in dark mode (3.8:1)");

// ── 6. Boundaries ────────────────────────────────────────────────────────────────────────────────────────────
// The landing holds no membership and no shelf special-case: it renders the registry, and counts come from the
// catalogue and the collection registry through data/read-categories.ts.
const root = process.cwd();
// Comments are stripped: the file's own history notes name the retired model, and only code counts here.
const src = fs
  .readFileSync(path.join(root, "components/LibraryHome.tsx"), "utf-8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");
for (const forbidden of ['=== "fiction"', '=== "speeches"', "shelf.id ===", "shelfId ==="]) {
  ok(!src.includes(forbidden), `LibraryHome special-cases no shelf: ${forbidden}`);
}
ok(!/collectionForWork|LIBRARY_COLLECTIONS/.test(src), "LibraryHome derives no membership itself");
ok(!/discoveryShelves|INITIAL_WORKS_PER_SHELF|<details/.test(src), "LibraryHome no longer renders the discovery model or a disclosure");
eq(LIBRARY_COLLECTIONS.length, 9, "the collection registry is unchanged: 9 collections");

// ── Report ───────────────────────────────────────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`shelf-disclosure — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exitCode = 1;
} else {
  console.log(`shelf-disclosure — ${checks} checks, 0 failed`);
  console.log(
    `  /read: 9 category cards, 0 disclosures · ${delivered.length} works delivered by 9 category pages · ` +
      `discovery model (data only): ${entries.length} entries · 42 within the historical cap · 6 over-cap shelves`,
  );
}
