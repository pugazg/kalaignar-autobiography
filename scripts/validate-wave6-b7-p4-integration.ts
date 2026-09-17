/**
 * Wave 6 — Batch 7 P4 publication validator (the AUTHORITATIVE published-surface + collection gate).
 * Fails closed. Independent: it imports no importer/generator and re-parses the source itself.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave6-b7-p4-integration.ts [<source-checkout>]
 *
 * With a source checkout it ALSO re-derives every collection's membership + ordinals from that
 * publication's own indexes/story-inventory.md and proves the committed data equals it (so the ordering
 * is the SOURCE printed order, never the P1 planning arrays). Without it, that block is skipped (CI's
 * source-integrity job supplies the pinned clone); every other section always runs.
 *
 * Proves:
 *   1. CATALOGUE 100→216, Fiction 41→157, the 116 published once with source-faithful metadata.
 *   2. STORY_SLUGS 38→154 (unique), containing exactly the 38 base + 116 Batch-7 slugs.
 *   3. COLLECTIONS 1→6: the 5 new anthologies, contiguous source ordinals, resolvable members, pins.
 *   4. PLURAL membership: exactly jaadi-kutti-poduma & kuruvi-rameswaram in two; no duplicate work; the
 *      11 existing 2009 members are already-published 1977 canonicals, not new works.
 *   5. COLLECTION-LOCAL extent: every 2009 member carries its own pagination; a member that is also a
 *      1977 work shows the 2009 pages, never the 1977 edition's (proven on the rendered landing page).
 *   6. DISCOVERY 64→77 (40 visible), Fiction 5→18 (6 collections + 12 standalone), Fiction over the cap.
 *   7. SITEMAP 3672→3909 (0 dup): +232 story +5 collection URLs.
 *   8. BUILD 3918 prerender / 3913 HTML (when a build tree is present).
 *   9. The durable record (b7-p4-integration.json) matches live.
 *  10. SOURCE re-derivation (with a checkout): ordinals/membership/2009 extents == the source inventories.
 *  11. ADVERSARIAL: the exclusions stay out; the two near-namesakes stay distinct; no leakage/fabrication.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CollectionLanding, { type CollectionMemberRow } from "../components/CollectionLanding";
import { publishedWorks, LIBRARY_WORKS } from "../data/library";
import {
  LIBRARY_COLLECTIONS, COLLECTION_IDS, collectionById, collectionsForWork, collectionMemberWorks,
  discoveryShelves, type LibraryCollection,
} from "../data/collections";
import { STORY_SLUGS } from "../data/stories";
import sitemap from "../app/sitemap";
import { WAVE6_B7_STORY_SLUGS } from "../lib/stories-wave6-routes";

const root = process.cwd();
const SRC = process.argv[2] && fs.existsSync(path.join(process.argv[2], "collections")) ? process.argv[2] : "";
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const uniqSorted = (a: string[]) => Array.from(new Set(a)).sort();
const readJSON = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const storyJSON = (slug: string) => readJSON(`public/data/stories/${slug}/story.json`);
const provJSON = (slug: string) => readJSON(`public/data/stories/${slug}/provenance.json`);

const manifest = readJSON("data/internal/wave6/b7-short-stories.json") as {
  groups: Array<{ group: string; collectionDir: string | null; collectionSubtreePin: string | null; publicCollectionPlanned?: boolean; plannedCollectionMemberCount: number; slugs: { slug: string }[] }>;
  sourceCommit: string; exclusions: Record<string, unknown>;
};
const record = readJSON("data/internal/wave6/b7-p4-integration.json") as {
  publish: { catalogue: { after: number }; fiction: { after: number }; storySlugs: { after: number }; collections: { after: number; new: { id: string; members: number }[] }; discovery: { after: number; fictionEntries: { after: number }; visible: { after: number } }; sitemap: { after: number }; build: { prerender: { after: number }; html: { after: number } } };
  pluralMembers: string[];
  collections: { id: string; memberCount: number; members: { ordinal: number; workId: string; localPages?: string; localScans?: string }[] }[];
  nonCollectionNewWorks: string[];
};

const b7Slugs = manifest.groups.flatMap((g) => g.slugs.map((s) => s.slug));
const NEW_COLLECTION_IDS = manifest.groups.filter((g) => g.publicCollectionPlanned).map((g) => (g.collectionDir as string).split("/").pop()!);

// ── 1. CATALOGUE ────────────────────────────────────────────────────────────────────────────────────
const works = publishedWorks();
eq(works.length, 216, "catalogue is 216 published works (100 + 116 Batch-7)");
const byShelf: Record<string, number> = {};
for (const w of works) byShelf[w.shelf] = (byShelf[w.shelf] ?? 0) + 1;
eq(byShelf.fiction, 157, "Fiction shelf is 157 works (41 + 116)");
eq(Object.keys(byShelf).sort(), ["cinema-writing", "drama", "essays-articles", "fiction", "letters", "life-writing", "literary-commentary", "poetry", "speeches"], "still exactly 9 non-empty shelves");
const bySlug = new Map(works.map((w) => [w.slug, w] as const));
for (const slug of b7Slugs) {
  const w = bySlug.get(slug);
  ok(!!w, `${slug} is a published catalogue work`);
  if (!w) continue;
  eq([w.shelf, w.subtype, w.readerStructure, w.state], ["fiction", "short-story", "story", "published"], `${slug}: fiction/short-story/story/published`);
  eq([w.href, w.provenanceHref], [`/stories/${slug}`, `/stories/${slug}/source`], `${slug}: reader + provenance hrefs`);
  eq([w.tamil, w.english, w.englishKind], ["complete", "complete", "project-created"], `${slug}: complete Tamil + project-created English`);
  ok(!!w.descTa && !!w.descEn, `${slug}: carries a Tamil + English description`);
}
eq(works.filter((w) => b7Slugs.includes(w.slug)).length, 116, "exactly the 116 Batch-7 works are published (each once)");
eq(new Set(works.map((w) => w.slug)).size, works.length, "no duplicate slug in the catalogue");

// ── 2. STORY_SLUGS ──────────────────────────────────────────────────────────────────────────────────
eq(STORY_SLUGS.length, 154, "STORY_SLUGS holds 154 slugs");
eq(new Set(STORY_SLUGS).size, 154, "STORY_SLUGS is duplicate-free");
for (const s of b7Slugs) ok((STORY_SLUGS as readonly string[]).includes(s), `${s} promoted into STORY_SLUGS`);
eq((STORY_SLUGS as readonly string[]).filter((s) => !b7Slugs.includes(s)).length, 38, "the non-Batch-7 remainder of STORY_SLUGS is the original 38");
eq(uniqSorted([...WAVE6_B7_STORY_SLUGS]), uniqSorted(b7Slugs), "route helper still equals the 116 manifest slugs");

// ── 3. COLLECTIONS ──────────────────────────────────────────────────────────────────────────────────
eq(LIBRARY_COLLECTIONS.length, 6, "6 public collections (1977 + 5 Batch-7)");
eq(uniqSorted(COLLECTION_IDS.filter((id) => id !== "1977-kalaignar-karunanidhiyin-sirukathaigal")), uniqSorted(NEW_COLLECTION_IDS), "the 5 non-1977 collection ids are exactly the planned Batch-7 collections");
const groupById = new Map(manifest.groups.filter((g) => g.collectionDir).map((g) => [(g.collectionDir as string).split("/").pop()!, g] as const));
for (const id of NEW_COLLECTION_IDS) {
  const c = collectionById(id) as LibraryCollection;
  ok(!!c, `${id}: collection resolves`);
  if (!c) continue;
  const g = groupById.get(id)!;
  eq([c.shelf, c.kind], ["fiction", "anthology"], `${id}: fiction anthology`);
  eq(c.href, `/collections/${id}`, `${id}: href`);
  eq(c.memberCount.value, c.members.length, `${id}: memberCount.value == members.length`);
  eq(c.members.length, g.plannedCollectionMemberCount, `${id}: member count matches manifest plan (${g.plannedCollectionMemberCount})`);
  eq(c.source.pinnedCommit, manifest.sourceCommit, `${id}: pinned to the manifest source commit`);
  eq(c.source.collectionTree, g.collectionSubtreePin, `${id}: collection tree == manifest subtree pin`);
  eq(c.source.collectionPath, g.collectionDir, `${id}: collectionPath == manifest collectionDir`);
  // ordinals are a contiguous 1..N run, unique, and every member resolves to a live work (fails closed).
  const ords = c.members.map((m) => m.ordinal).sort((a, b) => (a ?? 0) - (b ?? 0));
  eq(ords, Array.from({ length: c.members.length }, (_, i) => i + 1), `${id}: ordinals are a contiguous 1..${c.members.length}`);
  eq(new Set(c.members.map((m) => m.workId)).size, c.members.length, `${id}: no duplicate member workId`);
  const resolved = collectionMemberWorks(c); // throws if a member does not resolve
  eq(resolved.length, c.members.length, `${id}: every member resolves to a catalogue work`);
  for (const { work } of resolved) eq(work.shelf, "fiction", `${id}: member ${work.id} is on the Fiction shelf`);
}

// ── 4. PLURAL membership ────────────────────────────────────────────────────────────────────────────
const coll2009 = collectionById("2009-16-kathaiyinile")!;
const existing2009 = coll2009.members.filter((m) => !b7Slugs.includes(m.workId)).map((m) => m.workId);
eq(existing2009.length, 11, "2009 has exactly 11 members that are pre-existing canonicals");
// Two DIFFERENT plural facts, both correct:
//  (a) within the 5 Batch-7 collections, exactly jaadi & kuruvi are cross-listed (2008↔1987, 2004↔1987);
//  (b) across all 6 collections, those two PLUS the 11 reprinted 1977 stories (1977↔2009) are plural.
const b7Colls = LIBRARY_COLLECTIONS.filter((c) => c.id !== "1977-kalaignar-karunanidhiyin-sirukathaigal");
const b7InternalCount = new Map<string, number>();
for (const c of b7Colls) for (const m of c.members) b7InternalCount.set(m.workId, (b7InternalCount.get(m.workId) ?? 0) + 1);
eq(uniqSorted(Array.from(b7InternalCount).filter(([, n]) => n > 1).map(([w]) => w)), ["jaadi-kutti-poduma", "kuruvi-rameswaram"], "within the Batch-7 collections, exactly jaadi & kuruvi are plural");
const allCount = new Map<string, number>();
for (const c of LIBRARY_COLLECTIONS) for (const m of c.members) allCount.set(m.workId, (allCount.get(m.workId) ?? 0) + 1);
eq(uniqSorted(Array.from(allCount).filter(([, n]) => n > 1).map(([w]) => w)), uniqSorted(["jaadi-kutti-poduma", "kuruvi-rameswaram", ...existing2009]), "across all 6 collections, plural = jaadi, kuruvi, and the 11 reprinted 1977 stories");
eq(uniqSorted(collectionsForWork("jaadi-kutti-poduma").map((c) => c.id)), uniqSorted(["1987-kalaignar-sonna-kuttik-kathaigal", "2008-kalaignar-sonna-kathaigal"]), "jaadi-kutti-poduma belongs to 2008 + 1987");
eq(uniqSorted(collectionsForWork("kuruvi-rameswaram").map((c) => c.id)), uniqSorted(["1987-kalaignar-sonna-kuttik-kathaigal", "2004-kalaignarin-kuttik-kathaigal"]), "kuruvi-rameswaram belongs to 2004 + 1987");
// A plural member is still ONE LibraryWork, never duplicated.
for (const id of ["jaadi-kutti-poduma", "kuruvi-rameswaram"]) eq(LIBRARY_WORKS.filter((w) => w.id === id).length, 1, `${id}: exactly one LibraryWork despite plural membership`);
const coll1977Members = new Set(collectionById("1977-kalaignar-karunanidhiyin-sirukathaigal")!.members.map((m) => m.workId));
for (const id of existing2009) {
  ok(!b7Slugs.includes(id), `${id}: 2009 existing member is not a new Batch-7 work (no duplicate)`);
  ok(coll1977Members.has(id), `${id}: 2009 existing member is also a 1977 anthology member (plural)`);
  ok(LIBRARY_WORKS.filter((w) => w.id === id).length === 1, `${id}: still exactly one LibraryWork`);
}
eq(coll2009.members.filter((m) => b7Slugs.includes(m.workId)).length, 5, "2009 has exactly 5 new Batch-7 works");

// ── 5. COLLECTION-LOCAL extent (the reprint must never show 1977 pages) ───────────────────────────────
for (const m of coll2009.members) { ok(!!m.localPages && !!m.localScans, `2009 member ${m.workId}: carries collection-local pages + scans`); }
for (const id of existing2009) {
  const m = coll2009.members.find((x) => x.workId === id)!;
  const anthologyPages = storyJSON(id)?.anthology?.printedPages as { first: number; last: number } | undefined;
  if (anthologyPages) ok(m.localPages !== `${anthologyPages.first}–${anthologyPages.last}`, `${id}: 2009 local pages differ from its 1977 anthology pages`);
}
// Prove it on the rendered landing page: the 2009 page shows a 2009 page label and never a 1977 one.
{
  const rows: CollectionMemberRow[] = collectionMemberWorks(coll2009).map(({ member, work }) => ({
    ordinal: member.ordinal, workId: work.id, titleTa: work.titleTa, titleEn: work.titleEn, href: work.href,
    pages: member.localPages, scans: member.localScans,
  }));
  const html = renderToStaticMarkup(createElement(CollectionLanding, { collection: coll2009, members: rows }));
  const sumanthaval = coll2009.members.find((m) => m.workId === "sumanthaval")!;
  ok(html.includes(sumanthaval.localPages!.replace(/–/g, "–")), "2009 landing renders sumanthaval's 2009 page range");
  const anth = storyJSON("sumanthaval")?.anthology?.printedPages;
  if (anth) ok(!html.includes(`pp. ${anth.first}–${anth.last}`) || sumanthaval.localPages === `${anth.first}–${anth.last}`, "2009 landing does not show sumanthaval's 1977 pages");
}

// ── 6. DISCOVERY ────────────────────────────────────────────────────────────────────────────────────
const shelves = discoveryShelves();
const CAP = 6;
eq(shelves.flatMap((s) => s.entries).length, 77, "/read discovery is 77 entries");
eq(shelves.reduce((n, s) => n + Math.min(s.entries.length, CAP), 0), 40, "40 discovery entries initially visible");
const fiction = shelves.find((s) => s.shelf.id === "fiction")!;
eq(fiction.works.length, 157, "fiction discovery works 157");
eq(fiction.entries.length, 18, "fiction discovery entries 18");
eq(fiction.entries.filter((e) => e.kind === "collection").length, 6, "fiction shows 6 collection cards");
eq(fiction.entries.filter((e) => e.kind === "work").length, 12, "fiction shows 12 standalone work cards");
// The 8 non-collection Batch-7 works are standalone fiction entries; no Batch-7 collection member is.
const standaloneIds = new Set(fiction.entries.filter((e) => e.kind === "work").map((e) => (e as { work: { id: string } }).work.id));
for (const id of record.nonCollectionNewWorks) ok(standaloneIds.has(id), `${id} is a standalone Fiction discovery entry`);
eq(record.nonCollectionNewWorks.length, 8, "exactly 8 Batch-7 works belong to no collection");
for (const c of LIBRARY_COLLECTIONS) for (const m of c.members) ok(!standaloneIds.has(m.workId) || collectionsForWork(m.workId).length === 0, `collection member ${m.workId} is not also a standalone card`);
eq(uniqSorted(shelves.filter((s) => s.entries.length > CAP).map((s) => s.shelf.id)), uniqSorted(["fiction", "poetry", "drama", "cinema-writing", "speeches", "essays-articles"]), "six over-cap shelves (Fiction joined)");

// ── 7. SITEMAP ──────────────────────────────────────────────────────────────────────────────────────
const urls = sitemap().map((e) => e.url);
eq(urls.length, 3909, "sitemap has 3909 URLs");
eq(urls.length - new Set(urls).size, 0, "sitemap has 0 duplicates");
const urlSet = new Set(urls.map((u) => u.replace(/^https?:\/\/[^/]+/, "")));
for (const s of b7Slugs) { ok(urlSet.has(`/stories/${s}`), `sitemap has /stories/${s}`); ok(urlSet.has(`/stories/${s}/source`), `sitemap has /stories/${s}/source`); }
for (const id of NEW_COLLECTION_IDS) ok(urlSet.has(`/collections/${id}`), `sitemap has /collections/${id}`);
ok(urlSet.has(`/collections/1977-kalaignar-karunanidhiyin-sirukathaigal`), "sitemap still has the 1977 collection");

// ── 8. BUILD boundary ─────────────────────────────────────────────────────────────────────────────────
const pm = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(pm)) {
  const keys = new Set(Object.keys((JSON.parse(fs.readFileSync(pm, "utf8")) as { routes: Record<string, unknown> }).routes));
  eq(keys.size, 3918, "build prerender routes == 3918");
  let html = 0; const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith(".html")) html++; } };
  try { walk(path.join(root, ".next/server/app")); } catch { /* */ }
  eq(html, 3913, "build .html == 3913");
  for (const s of b7Slugs) { ok(keys.has(`/stories/${s}`), `${s}: reader prerendered`); ok(keys.has(`/stories/${s}/source`), `${s}: source prerendered`); }
  for (const id of NEW_COLLECTION_IDS) ok(keys.has(`/collections/${id}`), `${id}: collection landing prerendered`);
} else {
  console.error("  · BUILD-boundary check SKIPPED — no .next/prerender-manifest.json (CI runs this after build).");
}

// ── 9. DURABLE RECORD cross-check ─────────────────────────────────────────────────────────────────────
eq(record.publish.catalogue.after, works.length, "record catalogue.after == live");
eq(record.publish.fiction.after, byShelf.fiction, "record fiction.after == live");
eq(record.publish.storySlugs.after, STORY_SLUGS.length, "record storySlugs.after == live");
eq(record.publish.collections.after, LIBRARY_COLLECTIONS.length, "record collections.after == live");
eq(record.publish.discovery.after, shelves.flatMap((s) => s.entries).length, "record discovery.after == live");
eq(record.publish.discovery.fictionEntries.after, fiction.entries.length, "record fiction discovery entries == live");
eq(record.publish.discovery.visible.after, shelves.reduce((n, s) => n + Math.min(s.entries.length, CAP), 0), "record visible == live");
eq(record.publish.sitemap.after, urls.length, "record sitemap.after == live");
eq(uniqSorted(record.pluralMembers), ["jaadi-kutti-poduma", "kuruvi-rameswaram"], "record plural members");
for (const rc of record.collections) {
  const c = collectionById(rc.id)!;
  eq(rc.memberCount, c.members.length, `record ${rc.id} member count == live`);
  eq(rc.members.map((m) => [m.ordinal, m.workId]), c.members.map((m) => [m.ordinal ?? 0, m.workId]), `record ${rc.id} ordinal→workId == live`);
  for (const rm of rc.members.filter((m) => m.localPages)) {
    const m = c.members.find((x) => x.workId === rm.workId)!;
    eq([m.localPages, m.localScans], [rm.localPages, rm.localScans], `record ${rc.id}/${rm.workId} local extent == live`);
  }
}

// ── 10. SOURCE re-derivation (independent inventory re-parse) ──────────────────────────────────────────
if (SRC) {
  // Build a Tamil-title → slug map from the LIVE catalogue (independent of the generator's payload map).
  const norm = (s: string) => (s || "").normalize("NFC").replace(/[\s​-‍]/g, "").replace(/[!?.,…\-‘’'"“”:;()]/g, "");
  const titleToSlug = new Map<string, string>();
  for (const w of LIBRARY_WORKS) if (w.shelf === "fiction") titleToSlug.set(norm(w.titleTa), w.id);
  for (const s of b7Slugs) { const t = provJSON(s)?.source?.printedTitleTa; if (t) titleToSlug.set(norm(t), s); }
  const layout: Record<string, { heading: number; disp: number; pages?: number; scans?: number }> = {
    "2008-kalaignar-sonna-kathaigal": { heading: 2, disp: 6 },
    "2004-kalaignarin-kuttik-kathaigal": { heading: 1, disp: 5 },
    "1987-kalaignar-sonna-kuttik-kathaigal": { heading: 1, disp: 4 },
    "1982-mudiyatha-thodarkathai": { heading: 2, disp: 6 },
    "2009-16-kathaiyinile": { heading: 2, disp: 5, pages: 3, scans: 4 },
  };
  for (const id of NEW_COLLECTION_IDS) {
    const g = groupById.get(id)!;
    const inv = fs.readFileSync(path.join(SRC, g.collectionDir as string, "indexes/story-inventory.md"), "utf8");
    const lay = layout[id];
    const derived = inv.split("\n").filter((l) => /^\|\s*\d+\s*\|/.test(l)).map((l) => {
      const cells = l.split("|").slice(1, -1).map((x) => x.trim());
      const ordinal = Number(cells[0]);
      const disp = cells[lay.disp] ?? "";
      const pathHit = /stories\/([a-z0-9-]+)\//.exec(disp) || /stories\/([a-z0-9-]+)\//.exec(cells[lay.heading]);
      let slug = pathHit?.[1];
      if (!slug) {
        const cands = [...Array.from(disp.matchAll(/`([^`]+)`/g), (m) => m[1]), cells[lay.heading].replace(/`/g, "")];
        for (const cnd of cands) { const s = titleToSlug.get(norm(cnd)); if (s) { slug = s; break; } }
      }
      const row: { ordinal: number; workId: string; localPages?: string; localScans?: string } = { ordinal, workId: slug ?? `UNRESOLVED(${cells[lay.heading]})` };
      if (lay.pages !== undefined) { row.localPages = cells[lay.pages].replace(/\*\*/g, "").trim(); row.localScans = cells[lay.scans!].replace(/\*\*/g, "").trim(); }
      return row;
    }).sort((a, b) => a.ordinal - b.ordinal);
    const live = (collectionById(id) as LibraryCollection).members.map((m) => {
      const r: { ordinal: number; workId: string; localPages?: string; localScans?: string } = { ordinal: m.ordinal ?? 0, workId: m.workId };
      if (m.localPages) { r.localPages = m.localPages; r.localScans = m.localScans; }
      return r;
    }).sort((a, b) => a.ordinal - b.ordinal);
    eq(derived, live, `${id}: committed membership+ordinals(+2009 extent) == source inventory (printed order)`);
  }
  console.error("  · SOURCE re-derivation ran against the pinned checkout.");
} else {
  console.error("  · SOURCE re-derivation SKIPPED — no source checkout given (CI's source job passes one).");
}

// ── 11. ADVERSARIAL ───────────────────────────────────────────────────────────────────────────────────
const allSlugs = new Set(LIBRARY_WORKS.map((w) => w.slug));
const storySlugSet = new Set(STORY_SLUGS as readonly string[]);
// A1–A2: excluded works never entered the catalogue or the story registry.
for (const ex of Object.keys(manifest.exclusions)) { ok(!allSlugs.has(ex), `excluded ${ex} is not a LibraryWork`); ok(!storySlugSet.has(ex), `excluded ${ex} is not in STORY_SLUGS`); }
// A3–A6: the two near-namesakes remain SEPARATE works, both in 1982 at their own ordinals.
ok(allSlugs.has("nandiyur-nariyappan") && allSlugs.has("nariyur-nandiyappan"), "நந்தியூர் நரியப்பன் and நரியூர் நந்தியப்பன் are both distinct LibraryWorks");
eq(storyJSON("nandiyur-nariyappan").title.ta !== storyJSON("nariyur-nandiyappan").title.ta, true, "the two namesakes have distinct printed titles");
{
  const m = collectionById("1982-mudiyatha-thodarkathai")!.members;
  ok(m.some((x) => x.workId === "nandiyur-nariyappan") && m.some((x) => x.workId === "nariyur-nandiyappan"), "both namesakes are 1982 members");
  ok(m.find((x) => x.workId === "nandiyur-nariyappan")!.ordinal !== m.find((x) => x.workId === "nariyur-nandiyappan")!.ordinal, "the two namesakes hold different 1982 ordinals");
}
// A7: no Batch-7 collection id collides with a work slug (a collection is never a work).
for (const id of NEW_COLLECTION_IDS) ok(!allSlugs.has(id), `collection id ${id} is not also a work slug`);
// A8: no member ordinal is derived from array position — a shuffled copy yields the same sorted result.
for (const id of NEW_COLLECTION_IDS) { const c = collectionById(id)! as LibraryCollection; const shuffled = [...c.members].reverse(); eq(collectionMemberWorks({ ...c, members: shuffled }).map((r) => r.member.ordinal), c.members.slice().sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0)).map((m) => m.ordinal), `${id}: member order is ordinal-driven, not array-position`); }
// A9: the 2009 reprint's five NEW works carry no 1977 anthology block (they are genuinely new).
for (const m of coll2009.members.filter((x) => b7Slugs.includes(x.workId))) ok(!storyJSON(m.workId)?.anthology, `2009 new work ${m.workId} has no 1977 anthology block`);
// A10: every published Batch-7 work resolves a provenance file with batch === 7 (no legacy mislabel).
for (const s of b7Slugs) eq(provJSON(s).batch, 7, `${s}: provenance batch === 7`);
// A11: no Batch-7 description fabricates a first-publication year (provenance-only copy).
for (const s of b7Slugs) { const w = bySlug.get(s)!; ok(!/\b(18|19|20)\d{2}\b/.test(`${w.descTa} ${w.descEn}`), `${s}: description states no fabricated year`); }
// A12: catalogue growth is exactly +116 over the pre-Batch-7 100.
eq(works.length - 116, 100, "pre-Batch-7 catalogue was exactly 100");
// A13: Fiction is the ONLY shelf whose census changed.
const sortObj = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
eq(sortObj({ ...byShelf, fiction: byShelf.fiction - 116 }), sortObj({ "life-writing": 1, letters: 1, fiction: 41, poetry: 14, drama: 8, "cinema-writing": 7, speeches: 17, "essays-articles": 9, "literary-commentary": 2 }), "only the Fiction shelf grew (all others unchanged)");
// A14: the union of the 5 collections' distinct members equals 97 new + 16 (2009) − 0… i.e. new works in collections = 108.
const inAnyCollection = new Set<string>(); for (const c of LIBRARY_COLLECTIONS.filter((x) => x.id !== "1977-kalaignar-karunanidhiyin-sirukathaigal")) for (const m of c.members) inAnyCollection.add(m.workId);
eq(Array.from(inAnyCollection).filter((s) => b7Slugs.includes(s)).length, 108, "108 of the 116 new works belong to a Batch-7 collection (8 stand alone)");
// A15: sitemap has NO story route for an unpublished/699 slug (fail-closed shape).
ok(!urlSet.has("/stories/not-a-real-story") && !urlSet.has("/collections/not-a-real-collection"), "sitemap contains no fabricated story/collection route");
// A16: memberCount labels are non-empty for every Batch-7 collection.
for (const id of NEW_COLLECTION_IDS) { const c = collectionById(id)!; ok(!!c.memberCount.labelTa && !!c.memberCount.labelEn, `${id}: memberCount labels present`); }
// A17: every collection member is itself a discovered story (has a /stories route + STORY_SLUGS entry).
for (const c of LIBRARY_COLLECTIONS) for (const m of c.members) ok(storySlugSet.has(m.workId), `collection member ${m.workId} is a discovered story slug`);
// A18: no duplicate LibraryWork anywhere (plural membership never duplicated a work).
eq(new Set(LIBRARY_WORKS.map((w) => w.id)).size, LIBRARY_WORKS.length, "LIBRARY_WORKS has no duplicate id");

if (fail.length) {
  console.error(`\nwave6-b7-p4-integration — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 50)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave6-b7-p4-integration — ${checks} checks, 0 failed`);
console.log(`  116 works published · catalogue 216 · Fiction 157 · STORY_SLUGS 154 · 6 collections (source-ordered, plural jaadi/kuruvi) · discovery 77/40 · sitemap 3909/0 · build 3918/3913${SRC ? " · source order re-derived" : ""}`);
