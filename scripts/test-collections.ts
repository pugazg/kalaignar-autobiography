/**
 * Tests for the collection layer (Reading Room Wayfinding, Phase 1).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-collections.ts
 *
 * THESE ARE IMPLEMENTATION TESTS, NOT ARCHIVAL ONES. They prove what the app renders and what the
 * registry exposes. Whether the declaration matches the frozen source archive is a different question,
 * proved separately and against a different witness by scripts/validate-collections.mjs — the source's
 * own collection registration. Keeping the two apart is deliberate: if both derived their expectations
 * from data/collections.ts, they would agree with each other about a wrong roster.
 *
 * So nothing below re-derives membership from the source. It asserts consequences instead: that a
 * member's own route survived, that the collection renders once, that the page lists every member in
 * ordinal order, that the catalogue still holds 71 works.
 *
 * Exits non-zero on failure so CI can run it beside the validators.
 */

import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LibraryHome from "../components/LibraryHome";
import CollectionLanding, { type CollectionMemberRow } from "../components/CollectionLanding";
import { publishedWorks } from "../data/library";
import { STORY_SLUGS } from "../data/stories";
import {
  COLLECTION_IDS,
  LIBRARY_COLLECTIONS,
  collectionById,
  collectionsForWork,
  collectionMemberWorks,
  discoveryShelves,
} from "../data/collections";

const BENCHMARK = "1977-kalaignar-karunanidhiyin-sirukathaigal";

let checks = 0;
const failures: string[] = [];
const ok = (cond: boolean, label: string) => {
  checks++;
  if (!cond) failures.push(label);
};
const eq = <T,>(a: T, b: T, label: string) => {
  checks++;
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    failures.push(`${label}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`);
  }
};

const works = publishedWorks();
const shelves = discoveryShelves();
const c = collectionById(BENCHMARK);

// ── 1. Registry ──────────────────────────────────────────────────────────────────────────────────
eq(LIBRARY_COLLECTIONS.length, 1, "exactly one collection is declared in Phase 1");
eq(COLLECTION_IDS, [BENCHMARK], "the route registry lists exactly the benchmark id");
ok(!!c, "the benchmark collection resolves by id");
if (!c) {
  console.error("collections — the benchmark collection is missing; nothing further can run");
  process.exit(1);
}
eq(c.shelf, "fiction", "the collection sits on the Fiction shelf");
eq(c.kind, "anthology", "the only declared kind is anthology");
eq(c.members.length, 37, "the roster holds 37 members");
eq(c.memberCount.value, 37, "memberCount states 37");
eq(new Set(c.members.map((m) => m.workId)).size, 37, "no duplicate member");
eq(
  [...c.members].map((m) => m.ordinal).sort((a, b) => (a ?? 0) - (b ?? 0)),
  Array.from({ length: 37 }, (_, i) => i + 1),
  "ordinals are exactly 1–37",
);
eq(c.href, `/collections/${BENCHMARK}`, "href matches the id");

// memberCount and unitCount are different concepts and must stay so.
ok(!("unitCount" in c), "the collection carries no unitCount");
eq(
  c.members.filter((m) => works.find((w) => w.id === m.workId)?.unitCount).map((m) => m.workId),
  [],
  "no member gained a unitCount by joining the collection",
);

// ── 2. Discovery ─────────────────────────────────────────────────────────────────────────────────
const html = renderToStaticMarkup(createElement(LibraryHome));
const entries = shelves.flatMap((s) => s.entries);

// Wave 4 P1 published three standalone Poetry works. A standalone poem is its own discovery entry,
// so both numbers move by the same three — which is exactly what distinguishes this from adding
// members to a collection, where works move and entries do not.
eq(works.length, 78, "the catalogue holds 78 published works");
eq(entries.length, 42, "the page holds 42 discovery entries");
eq(entries.filter((e) => e.kind === "collection").length, 1, "exactly one collection entry across all shelves");

const fiction = shelves.find((s) => s.shelf.id === "fiction");
ok(!!fiction, "the Fiction shelf is rendered");
eq(fiction!.works.length, 39, "Fiction still holds 39 works");
eq(fiction!.entries.length, 3, "Fiction shows 3 discovery entries");
eq(
  fiction!.entries.map((e) => (e.kind === "collection" ? e.collection.id : e.work.id)),
  [BENCHMARK, "balipeedam-nokki", "kizhavan-kanavu"],
  "Fiction shows the collection, then the two standalone works",
);

// The collection appears once; no member appears as its own card.
const cardHrefs = (html.match(/<a[^>]+href="([^"]+)"/g) ?? []).map((a) => /href="([^"]+)"/.exec(a)![1]);
eq(cardHrefs.filter((h) => h === c.href).length, 1, "the collection card renders exactly once");
const memberHrefsOnRead = c.members
  .map((m) => works.find((w) => w.id === m.workId)?.href)
  .filter((h) => h && cardHrefs.includes(h));
eq(memberHrefsOnRead, [], "no anthology member renders as its own card on /read");

// The two standalone Fiction works must still be there — collapsing must not over-reach.
ok(cardHrefs.includes("/novels/balipeedam-nokki"), "பலிபீடம் நோக்கி still renders");
ok(cardHrefs.includes("/stories/kizhavan-kanavu"), "கிழவன் கனவு still renders");

// Other shelves are untouched, and Phase 0 still governs the ones over the cap.
for (const s of shelves.filter((x) => x.shelf.id !== "fiction")) {
  eq(s.entries.length, s.works.length, `${s.shelf.en}: every work is still its own entry`);
}
const speeches = shelves.find((s) => s.shelf.id === "speeches");
eq(speeches!.entries.length, 14, "Speeches still has 14 entries");
ok(/<details/.test(html), "the Speeches disclosure survives Phase 1");
eq((html.match(/<details/g) ?? []).length, 1, "Fiction's disclosure is gone; only Speeches keeps one");

// The shelf heading states works, never entries.
const fictionSection = html.slice(html.indexOf('aria-labelledby="shelf-fiction"'));
const fictionHeading = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(fictionSection);
ok(!!fictionHeading && /\b39\b/.test(fictionHeading[1]), "the Fiction heading states 39 works, not 3");
ok(!!fictionHeading && /\b1\b/.test(fictionHeading[1]), "the Fiction heading states its 1 collection");

// ── 3. Reverse lookup is derived, plural, and not stored ─────────────────────────────────────────
for (const m of c.members) {
  const found = collectionsForWork(m.workId);
  eq(found.map((x) => x.id), [BENCHMARK], `reverse lookup resolves ${m.workId} to a one-item list`);
}
eq(collectionsForWork("kizhavan-kanavu").length, 0, "kizhavan-kanavu belongs to no collection");
eq(collectionsForWork("balipeedam-nokki").length, 0, "balipeedam-nokki belongs to no collection");
ok(Array.isArray(collectionsForWork("pugazhendhi")), "the reverse lookup returns a list, not one collection");
const libSrc = fs.readFileSync(path.join(process.cwd(), "data/library.ts"), "utf-8");
ok(!libSrc.includes("collectionId"), "LibraryWork stores no collectionId — one direction only");

// MULTIPLICITY, proved without inventing production data. A second synthetic collection sharing a
// member must yield BOTH, not silently overwrite the first — which is exactly what a
// Map<string, Collection> would have done.
{
  const shared = "pugazhendhi";
  const synthetic = { ...c, id: "synthetic-second-collection", members: [{ workId: shared, ordinal: 1 }] };
  const map = new Map<string, (typeof c)[]>();
  for (const col of [c, synthetic]) {
    for (const m of col.members) {
      const list = map.get(m.workId);
      if (list) list.push(col as typeof c);
      else map.set(m.workId, [col as typeof c]);
    }
  }
  eq(
    map.get(shared)!.map((x) => x.id),
    [BENCHMARK, "synthetic-second-collection"],
    "the derivation keeps both collections for a work that appears in two",
  );
}

// ── 3b. Member resolution fails closed ───────────────────────────────────────────────────────────
// A declared member that resolves to nothing must stop the build, never quietly shrink the page from
// 37 rows to 36 — the failure mode where nothing on screen says anything is missing.
{
  const broken = { ...c, members: [...c.members, { workId: "no-such-work", ordinal: 38 }] };
  let threw = false;
  let message = "";
  try {
    collectionMemberWorks(broken);
  } catch (e) {
    threw = true;
    message = e instanceof Error ? e.message : String(e);
  }
  ok(threw, "an unresolved declared member throws rather than being filtered away");
  ok(message.includes("no-such-work"), "the error names the unresolved workId");
  ok(message.includes(c.id), "the error names the collection");
}

// ── 4. Collection page ───────────────────────────────────────────────────────────────────────────
const ordered = collectionMemberWorks(c);
eq(ordered.length, 37, "the page resolves all 37 members");
eq(
  ordered.map(({ member }) => member.ordinal),
  Array.from({ length: 37 }, (_, i) => i + 1),
  "members are ordered by source ordinal, ascending",
);
// Order must be the ordinal's, NOT the catalogue's declaration order or an alphabetical sort.
const alphabetical = [...ordered].map(({ work }) => work.titleTa).sort();
ok(
  JSON.stringify(ordered.map(({ work }) => work.titleTa)) !== JSON.stringify(alphabetical),
  "the page order is the printed ordinal's, not alphabetical",
);

const rows: CollectionMemberRow[] = ordered.map(({ member, work }) => ({
  ordinal: member.ordinal,
  workId: work.id,
  titleTa: work.titleTa,
  titleEn: work.titleEn,
  href: work.href,
}));
const pageHtml = renderToStaticMarkup(createElement(CollectionLanding, { collection: c, members: rows }));
const pageHrefs = (pageHtml.match(/<a[^>]+href="([^"]+)"/g) ?? []).map((a) => /href="([^"]+)"/.exec(a)![1]);
for (const { work } of ordered) {
  eq(pageHrefs.filter((h) => h === work.href).length, 1, `the page links ${work.id} exactly once`);
}
eq(
  pageHrefs.filter((h) => h.startsWith("/stories/")),
  ordered.map(({ work }) => work.href),
  "member links appear in ordinal order and point at the existing story routes",
);
// React escapes text on render, so an apostrophe arrives as `&#x27;`. Compare decoded text rather
// than raw markup — otherwise the assertion tests the escaping, not the content.
const decoded = pageHtml
  .replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&#x2F;/g, "/")
  .replace(/&amp;/g, "&");
ok(decoded.includes(c.titleTa), "the page shows the Tamil collection title");
ok(decoded.includes(c.titleEn), "the page shows the English collection title");
ok(decoded.includes(c.editionStatementTa!), "the page shows the printed edition statement");
ok(decoded.includes(c.publisherTa!), "the page shows the printed publisher imprint");
// The page is a navigation surface, not a second reader.
ok(!/<article/.test(pageHtml), "the collection page renders no article body");
ok(pageHrefs.includes("/read"), "the page links back to the Reading Room");

// ── 4b. Accessibility guards for the new Phase-1 controls ────────────────────────────────────────
// These pin decisions that were measured, so a later edit cannot quietly reintroduce a token that
// fails on this surface. The classes are the record of the measurement.
// JUDGE THE CODE, NOT THE PROSE ABOUT IT. A comment explaining why `dark:group-hover:text-marina-light`
// is wrong here necessarily quotes it, and scanning raw source would flag the explanation instead of
// the defect — the same trap the Wave-3 metadata validator hit.
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const homeSrc = stripComments(fs.readFileSync(path.join(process.cwd(), "components/LibraryHome.tsx"), "utf-8"));
const landingSrc = stripComments(fs.readFileSync(path.join(process.cwd(), "components/CollectionLanding.tsx"), "utf-8"));
const collectionCardSrc = homeSrc.slice(homeSrc.indexOf("function CollectionCard("), homeSrc.indexOf("function DiscoveryCard("));

ok(collectionCardSrc.includes("dark:focus-visible:ring-night-text/70"), "the collection card overrides its dark focus ring");
ok(!collectionCardSrc.includes("dark:group-hover:text-marina-light"), "the collection card title has no marina-light dark hover (3.8:1)");
// POSITIVE, not just negative. Removing the bad class is not the same as stating a good one:
// `group-hover:text-marina` on its own applies in BOTH themes and would hover the dark title down to
// #0E5D63 on a #10171E card. The dark half has to be present, so it is asserted.
ok(collectionCardSrc.includes("dark:group-hover:text-night-text"), "the collection card title states an explicit dark hover");
ok(!collectionCardSrc.includes("a.title"), "the collection card does not reuse accentFor()'s shared hover");
ok(landingSrc.includes("dark:focus-visible:ring-night-text/70"), "the collection page overrides its dark focus rings");
eq(
  (landingSrc.match(/dark:focus-visible:ring-night-text\/70/g) ?? []).length,
  2,
  "both the back link and the member rows carry the dark focus override",
);
ok(!landingSrc.includes("dark:group-hover:text-marina-light"), "member titles have no marina-light dark hover");
ok(landingSrc.includes("dark:group-hover:text-night-text"), "member titles state an explicit dark hover");
// An unqualified marina hover with no dark counterpart is the exact defect this pair guards against.
ok(
  !/group-hover:text-marina(?!-)(?![^"]*dark:group-hover:)/.test(landingSrc),
  "no member title hovers to marina without a dark counterpart",
);
ok(landingSrc.includes("dark:hover:text-night-text"), "the back link states an accessible dark hover");
ok(/<span className="text-ink\/65 dark:text-night-text\/65">Contents<\/span>/.test(landingSrc), "the Contents label states an accessible token");
ok(!/text-ink\/40|dark:text-night-text\/40/.test(landingSrc), "no /40 text remains on the collection page");
const shelfCount = /className="ml-auto shrink-0 font-normal tabular-nums ([^"]*)"/.exec(homeSrc);
ok(!!shelfCount && shelfCount[1].includes("text-ink/65"), "the shelf work/collection count uses an accessible token");

// Print: the identity block is exempted, the Back link is not.
const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf-8");
const printBlock = css.slice(css.indexOf("@media print"));
ok(/header\.collection-landing-header\s*\{\s*display:\s*block\s*!important/.test(printBlock), "print exempts the collection identity header");
ok(printBlock.indexOf("header.collection-landing-header") > printBlock.indexOf("nav, header, footer"), "the exemption comes after the generic header rule");
ok(landingSrc.includes("collection-landing-header"), "the collection page carries the print hook class");
ok(/data-print="hide"/.test(landingSrc), "the Back link is hidden in print");

// ── 5. Member identity regression ────────────────────────────────────────────────────────────────
for (const m of c.members) {
  const w = works.find((x) => x.id === m.workId);
  ok(!!w, `${m.workId} is still a published work`);
  eq(w!.href, `/stories/${m.workId}`, `${m.workId} keeps its own route`);
  ok((STORY_SLUGS as readonly string[]).includes(m.workId), `${m.workId} is still in STORY_SLUGS`);
}
eq(STORY_SLUGS.length, 38, "STORY_SLUGS still holds 38 slugs — 37 members plus the standalone booklet");
eq(
  works.map((w) => w.href).sort(),
  publishedWorks().map((w) => w.href).sort(),
  "no catalogue href changed",
);

// ── Report ───────────────────────────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`collections — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exitCode = 1;
} else {
  console.log(`collections — ${checks} checks, 0 failed`);
  console.log(
    `  ${works.length} works · ${LIBRARY_COLLECTIONS.length} collection · ${entries.length} discovery entries · ` +
      `Fiction ${fiction!.works.length} works / ${fiction!.entries.length} entries`,
  );
}
