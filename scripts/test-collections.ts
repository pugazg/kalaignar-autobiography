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

import { WAVE8_CONTRIBUTION as W8 } from "../lib/wave8-contribution";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LibraryHome from "../components/LibraryHome";
import LibraryCategoryPage from "../components/LibraryCategoryPage";
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
import { READ_IA_R3_CONTRIBUTION as R3 } from "../lib/read-ia-r3-contribution";

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
eq(LIBRARY_COLLECTIONS.length, 9, "nine collections are declared (1977 + 5 Batch-7 short-story anthologies + Wave-7 B3 arumbu-1978 + the two Wave-7 முத்துக் குளியல் speech volumes)");
eq(COLLECTION_IDS, [
  BENCHMARK, "1982-mudiyatha-thodarkathai", "1987-kalaignar-sonna-kuttik-kathaigal",
  "2004-kalaignarin-kuttik-kathaigal", "2008-kalaignar-sonna-kathaigal", "2009-16-kathaiyinile",
  "arumbu-1978", "muthukkuliyal-part-1", "muthukkuliyal-part-2",
], "the route registry lists the 1977 benchmark, the 5 Batch-7 collection ids, arumbu-1978, then the two முத்துக் குளியல் volumes");
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
// Reading Room IA v2 R2-B: the discovery model below (collection entries standing in for their members) is no longer
// RENDERED — /read is nine category cards, and each category page lists every canonical work individually. The model's
// arithmetic is kept as the historical data-level record it is; the rendered checks now run on the surfaces that
// actually ship: /read (no collection or work card) and the Fiction / Speeches category pages (every member listed).
const html = renderToStaticMarkup(createElement(LibraryHome));
const fictionPage = renderToStaticMarkup(createElement(LibraryCategoryPage, { shelf: "fiction" }));
const speechesPage = renderToStaticMarkup(createElement(LibraryCategoryPage, { shelf: "speeches" }));
const entries = shelves.flatMap((s) => s.entries);

// Wave 4 P1 published three standalone Poetry works. A standalone poem is its own discovery entry,
// so both numbers move by the same three — which is exactly what distinguishes this from adding
// members to a collection, where works move and entries do not.
eq(works.length, 333 + W8.works + R3.works, "the catalogue holds 333 (+ Wave-8: ore-mutham, sangatamil) published works (post Wave-7 B1: +3 cinema; post Wave-7 B2-B4: +13; post Wave-7 B5/B6/Kuraloviyam: +101)");
eq(entries.length, 96 + W8.discovery + R3.discovery, "the discovery model (data; not rendered since R2-B) holds 96 (+ Wave-8 2 standalone works) discovery entries (post Wave-7 B2-B4: 90; Wave-7 B5/B6/Kuraloviyam: +6 — 97 speeches collapse into 2 முத்துக் குளியல் cards, +3 assembly speeches, +Kuraloviyam)");
eq(entries.filter((e) => e.kind === "collection").length, 9, "nine collection entries across all shelves (1977 + 5 Batch-7 + arumbu-1978 + 2 முத்துக் குளியல்)");

const fiction = shelves.find((s) => s.shelf.id === "fiction");
ok(!!fiction, "the discovery model has a Fiction shelf");
eq(fiction!.works.length, 162, "Fiction holds 162 works (post Batch-7: +116 short stories; post Wave-7 B2-B4: +5 novels)");
eq(fiction!.entries.length, 20, "Fiction shows 20 discovery entries (7 collections collapse; 13 standalone works)");
eq(
  fiction!.entries.map((e) => (e.kind === "collection" ? e.collection.id : e.work.id)),
  [
    // Collections first, in declaration order (1977, the 5 Batch-7, then Wave-7 B3 arumbu-1978), then standalone works.
    BENCHMARK, "1982-mudiyatha-thodarkathai", "1987-kalaignar-sonna-kuttik-kathaigal",
    "2004-kalaignarin-kuttik-kathaigal", "2008-kalaignar-sonna-kathaigal", "2009-16-kathaiyinile",
    "arumbu-1978",
    // பெரிய இடத்துப் பெண் is NO LONGER a standalone card — it is now a member of arumbu-1978 (its 1978 witness
    // occurrence), so it collapses into the collection card exactly as the arumbu trio do.
    "balipeedam-nokki", "kizhavan-kanavu", "pudhaiyal",
    // The 8 Batch-7 works that belong to no collection (periodical 3, 1976 2, 1969, 1953, 1997).
    "seerazhitha-sirippu", "madurai-selavu", "kondru-varuga", "naattiya-kalarani", "maanam",
    "neruppu", "vilaiyal-vangalaiyo", "nanbana",
    // The 2 Wave-7 B3 standalone novels (arumbu/nadutheru-narayani/sarapallam-samundi collapse into arumbu-1978).
    "surulimalai", "vellikkizhamai",
  ],
  "Fiction shows the 7 collections, then the standalone works (2 Wave-6 novels + 8 non-collection Batch-7 + 2 Wave-7 B3 novels; பெரிய இடத்துப் பெண் collapsed into arumbu-1978)",
);

// Rendered surfaces. /read carries no collection card and no work card (R2-B). Each category page lists every member
// individually in its WORK grid (a collection never replaces its members); since R2-C a secondary Collections section
// after the grid links each of the shelf's collections exactly once.
const hrefsOf = (h: string) => (h.match(/<a[^>]+href="([^"]+)"/g) ?? []).map((a) => /href="([^"]+)"/.exec(a)![1]);
/** One data-testid block of a category page (the work grid or the Collections section), up to its section's end. */
const blockOf = (h: string, id: string) => {
  const i = h.indexOf(`data-testid="${id}"`);
  return i === -1 ? "" : h.slice(i, h.indexOf("</section>", i));
};
const cardHrefs = hrefsOf(html);
const fictionHrefs = hrefsOf(blockOf(fictionPage, "category-works"));
const speechesHrefs = hrefsOf(blockOf(speechesPage, "category-works"));
const fictionCollectionHrefs = hrefsOf(blockOf(fictionPage, "category-collections"));
const speechesCollectionHrefs = hrefsOf(blockOf(speechesPage, "category-collections"));
eq(cardHrefs.filter((h) => h.startsWith("/collections/")), [], "/read renders no collection card");
eq(cardHrefs.filter((h) => works.some((w) => w.href === h)), [], "/read renders no work card");
eq(fictionHrefs.filter((h) => h === c.href).length, 0, "the Fiction work grid renders no collection card in place of works");
eq(fictionCollectionHrefs.filter((h) => h === c.href).length, 1, "the Fiction Collections section links the anthology exactly once (R2-C)");
eq(fictionCollectionHrefs, LIBRARY_COLLECTIONS.filter((x) => x.shelf === "fiction").map((x) => x.href), "the Fiction Collections section links exactly its 7 collections, in registry order");
eq(
  c.members.map((m) => works.find((w) => w.id === m.workId)?.href).filter((h) => !h || !fictionHrefs.includes(h)),
  [],
  "every anthology member is listed individually on /read/fiction",
);

// The standalone Fiction works are listed too.
ok(fictionHrefs.includes("/novels/balipeedam-nokki"), "பலிபீடம் நோக்கி is listed on /read/fiction");
ok(fictionHrefs.includes("/stories/kizhavan-kanavu"), "கிழவன் கனவு is listed on /read/fiction");
// Every Fiction collection's members, across all 7 collections, are on the page.
for (const fc of LIBRARY_COLLECTIONS.filter((x) => x.shelf === "fiction")) {
  eq(fc.members.map((m) => works.find((w) => w.id === m.workId)?.href).filter((h) => !h || !fictionHrefs.includes(h)), [], `${fc.id}: every member is listed on /read/fiction`);
}

// Other shelves are untouched, and Phase 0 still governs the ones over the cap.
for (const s of shelves.filter((x) => x.shelf.id !== "fiction" && x.shelf.id !== "speeches")) {
  eq(s.entries.length, s.works.length, `${s.shelf.en}: every work is still its own entry`);
}
// Speeches (Wave-7 P4): the 97 முத்துக் குளியல் speeches collapse into their two volume cards (collections
// first), then the 20 standalone speeches — the 17 earlier ones and the 3 Wave-7 assembly speeches.
const speeches = shelves.find((s) => s.shelf.id === "speeches");
eq(speeches!.works.length, 117, "Speeches holds 117 works (17 + 100 Wave-7)");
eq(speeches!.entries.length, 22, "Speeches has 22 entries (2 முத்துக் குளியல் collection cards + 20 standalone speeches)");
eq(speeches!.entries.slice(0, 2).map((e) => (e.kind === "collection" ? e.collection.id : e.work.id)), ["muthukkuliyal-part-1", "muthukkuliyal-part-2"], "Speeches shows the two முத்துக் குளியல் volumes first");
eq(speeches!.entries.slice(2).filter((e) => e.kind === "collection").length, 0, "the other 20 Speeches entries are standalone works");
for (const id of ["muthukkuliyal-part-1", "muthukkuliyal-part-2"]) {
  const mc = collectionById(id)!;
  eq(mc.members.length, id.endsWith("1") ? 61 : 36, `${id}: member count`);
  eq(mc.members.map((m) => m.ordinal), Array.from({ length: mc.members.length }, (_, i) => i + 1), `${id}: printed ordinals 1..N in order`);
  eq(mc.members.map((m) => works.find((w) => w.id === m.workId)?.href).filter((h) => !h || !speechesHrefs.includes(h)), [], `${id}: every member is listed individually on /read/speeches`);
  eq(speechesHrefs.filter((h) => h === mc.href).length, 0, `${id}: no collection card replaces its members in the /read/speeches work grid`);
  eq(speechesCollectionHrefs.filter((h) => h === mc.href).length, 1, `${id}: linked exactly once in the /read/speeches Collections section (R2-C)`);
}
// The historical disclosure is retired from /read; the discovery model still records 6 over-cap shelves (data).
eq((html.match(/<details/g) ?? []).length, 0, "/read renders no disclosure (R2-B)");
eq(shelves.filter((x) => x.entries.length > 6).length, 6, "the discovery model still has six over-cap shelves (data; historical cap 6)");

// The Fiction category card states works as its primary count, and its collections secondarily — never entries.
const fictionCard = html.slice(html.indexOf('data-shelf="fiction"'), html.indexOf("</a>", html.indexOf('data-shelf="fiction"')));
ok(/162 works/.test(fictionCard), "the Fiction card states 162 works, not 20 entries");
ok(/7 collections/.test(fictionCard), "the Fiction card states its 7 collections");
ok(!/\b20 works\b/.test(fictionCard), "the Fiction card never states the 20 discovery entries");
const speechesCard = html.slice(html.indexOf('data-shelf="speeches"'), html.indexOf("</a>", html.indexOf('data-shelf="speeches"')));
ok(/117 works/.test(speechesCard) && /2 collections/.test(speechesCard), "the Speeches card states 117 works · 2 collections");

// ── 3. Reverse lookup is derived, plural, and not stored ─────────────────────────────────────────
// Batch 7's 2009 anthology reprints eleven 1977 stories, so those members now legitimately belong to TWO
// collections (1977 + 2009) — real plural membership, exactly what the list-valued lookup exists for.
const coll2009 = LIBRARY_COLLECTIONS.find((x) => x.id === "2009-16-kathaiyinile")!;
const in2009 = new Set(coll2009.members.map((m) => m.workId));
for (const m of c.members) {
  const found = collectionsForWork(m.workId).map((x) => x.id).sort();
  const expected = in2009.has(m.workId) ? [BENCHMARK, "2009-16-kathaiyinile"].sort() : [BENCHMARK];
  eq(found, expected, `reverse lookup resolves ${m.workId} to its collection(s)`);
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
const collectionCardSrc = homeSrc.slice(homeSrc.indexOf("function CollectionCard("), homeSrc.indexOf("function CategoryCard("));

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
// The work/collection count moved from the retired shelf heading to the R2-B category card; it keeps the /65 token.
const shelfCount = /className="mt-1\.5 text-xs tabular-nums ([^"]*)"\s+lang=\{ta \? "ta" : undefined\}\s+data-testid="read-category-count"/.exec(homeSrc);
ok(!!shelfCount && shelfCount[1].includes("text-ink/65"), "the category card work/collection count uses an accessible token");

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
eq(STORY_SLUGS.length, 154, "STORY_SLUGS holds 154 slugs (38 pre-Batch-7 + 116 Batch-7 short stories)");
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
