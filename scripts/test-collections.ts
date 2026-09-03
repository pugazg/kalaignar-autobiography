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
  collectionForWork,
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

eq(works.length, 71, "the catalogue still holds 71 published works");
eq(entries.length, 35, "the page holds 35 discovery entries");
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

// ── 3. Reverse lookup is derived, not stored ─────────────────────────────────────────────────────
for (const m of c.members) ok(collectionForWork(m.workId)?.id === BENCHMARK, `reverse lookup resolves ${m.workId}`);
ok(!collectionForWork("kizhavan-kanavu"), "kizhavan-kanavu belongs to no collection");
ok(!collectionForWork("balipeedam-nokki"), "balipeedam-nokki belongs to no collection");
const libSrc = fs.readFileSync(path.join(process.cwd(), "data/library.ts"), "utf-8");
ok(!libSrc.includes("collectionId"), "LibraryWork stores no collectionId — one direction only");

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
