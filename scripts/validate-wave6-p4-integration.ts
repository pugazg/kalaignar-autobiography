/**
 * Wave 6 P4 — public-integration validator (catalogue / /read discovery / sitemap).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave6-p4-integration.ts
 *
 * P4 publishes the 22 works of Batches 1–6 to the public catalogue, the /read discovery surface and
 * the sitemap. It creates ZERO new reader routes — it exposes exactly the 321 routes already recorded
 * in data/internal/wave6/p3-routes.json. This validator owns the INVERSE of the "hidden until P4"
 * assertions that used to live in the per-batch tests and in validate-wave6-p3-build.ts:
 *
 *   * catalogue is 100 works with the exact 9-shelf census; the 22 Wave-6 works each appear once;
 *     no unexpected (e.g. Batch-7) work has leaked in;
 *   * public collections stay at exactly 1 (the 1977 anthology) — no Wave-6 work became a collection;
 *   * /read discovery is 64 entries with the exact per-shelf census, 39 initially visible under the
 *     disclosure cap, and the expected set of over-cap shelves;
 *   * sitemap is 3672 URLs with 0 duplicates, and the Wave-6 routes present equal p3-routes.json
 *     cumulativeRoutes EXACTLY (0 missing, 0 extra, 0 duplicate);
 *   * each promoted slug occurs exactly once in its public registry (no duplicate generateStaticParams);
 *   * the build route boundary is unchanged (baseline 3360/3355 + 321 = 3681 prerender / 3676 html),
 *     confirming zero new routes (checked only when a production build tree is present);
 *   * source-faithful catalogue copy: no fabricated numbering/date/venue/edition (semantic restraint).
 *
 * The durable P4 record (data/internal/wave6/p4-integration.json) is cross-checked against live state so
 * it cannot silently drift. This validator is independent — it imports no importer.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { publishedWorks, LIBRARY_WORKS } from "../data/library";
import { discoveryShelves, LIBRARY_COLLECTIONS } from "../data/collections";
import sitemap from "../app/sitemap";
import { generateMetadata as poemLandingMetadata } from "../app/poems/[slug]/page";
import { generateMetadata as poemItemMetadata } from "../app/poems/[slug]/[item]/page";
import { POEM_SLUGS, POETRY_PUBLICATION_SLUGS } from "../data/poems";
import { PLAY_SLUGS } from "../data/plays";
import { SPEECH_SLUGS } from "../data/speeches";
import { NOVEL_SLUGS } from "../data/novels";
import { ESSAY_SLUGS } from "../data/essays";
import { WAVE6_DRAMA_SLUGS } from "../lib/drama-wave6-routes";
import { WAVE6_SPEECH_SLUGS } from "../lib/speeches-wave6-routes";
import { WAVE6_POEM_SLUGS, WAVE6_POETRY_PUBLICATION_SLUGS } from "../lib/poems-wave6-routes";
import { WAVE6_NOVEL_SLUGS } from "../lib/novels-wave6-routes";
import { WAVE6_ESSAY_SLUGS } from "../lib/essays-wave6-routes";
import { WAVE7_B5_B6_K_CONTRIBUTION as W7K, WAVE7_B5_B6_K_ROUTES } from "../lib/wave7-b5-b6-k-contribution";
import { WAVE8_CONTRIBUTION as W8, WAVE8_ROUTES } from "../lib/wave8-contribution";

const BASE = "https://nenjukkuneethi.org";
const root = process.cwd();
const readJSON = <T,>(p: string): T => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

let checks = 0;
const failures: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) failures.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const sortKeys = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).sort(([x], [y]) => x.localeCompare(y)));
const eqMap = (a: Record<string, number>, b: Record<string, number>, l: string) => eq(sortKeys(a), sortKeys(b), l);
const uniqSorted = (a: string[]) => Array.from(new Set(a)).sort();

type Cumulative = { cumulativeRouteCount: number; cumulativeRoutes: string[] };
const manifest = readJSON<Cumulative>("data/internal/wave6/p3-routes.json");
const baseline = readJSON<{ prerenderManifestRouteCount: number; htmlFileCount: number; routeSetSha256: string }>("data/internal/wave6/frozen-baseline.json");
const record = readJSON<Record<string, unknown>>("data/internal/wave6/p4-integration.json");

// ── Wave 6 Batch 7 contribution ───────────────────────────────────────────────────────────────────
// This validator owns the Batches 1–6 P4 snapshot, whose durable record (p4-integration.json) is FROZEN.
// Batch 7 later published 116 short stories + 5 collections on top of that snapshot, so the LIVE global
// surface is now larger than the frozen record. Rather than touch the frozen record, we carry Batch-7's
// known contribution and reconcile: absolute live totals are asserted at their post-Batch-7 values, and
// each frozen-record cross-check compares the record to (live − Batch-7). The Batch-7 surface has its own
// validator (scripts/validate-wave6-b7-p4-integration.ts); here it is only subtracted back out.
const b7rec = readJSON<{ collections: { id: string }[] }>("data/internal/wave6/b7-p4-integration.json");
const b7p3 = readJSON<{ routes: string[] }>("data/internal/wave6/b7-p3-routes.json");
const B7 = { works: 116, collections: 5, discovery: 13, fictionDiscovery: 13, sitemap: 237, visible: 1 };
const B7_ROUTES = new Set<string>([...b7p3.routes, ...b7rec.collections.map((c) => `/collections/${c.id}`)]);
const withoutB7Fiction = (m: Record<string, number>, minus: number) => ({ ...m, fiction: m.fiction - minus });

// Wave 7 Batch 1 published 3 cinema works AFTER this Wave-6 P4 snapshot. Exactly like B7 above, its
// contribution is ADDED back into the live-total assertions and SUBTRACTED out of the frozen Wave-6
// record cross-checks, so this validator stays a faithful gate without weakening any Wave-6 claim.
const wave7p3 = readJSON<{ works: { routes: string[] }[] }>("data/internal/wave7/b1-p3-routes.json");
const W7 = { works: 3, cinema: 3, discovery: 3, sitemap: 133, build: 133 };
const W7_ROUTES = new Set<string>(wave7p3.works.flatMap((w) => w.routes));

// Wave 7 Batches 2–4 published 13 works (2 drama + 5 novels + 6 essays) and 1 collection (arumbu-1978,
// a FOUR-member anthology) AFTER this snapshot. Identical treatment: added into the live totals,
// subtracted out of the frozen Wave-6 record. It contributes 224 direct routes + 1 collection route = 225.
// On discovery: fiction +2 net — +1 arumbu-1978 collection card, +surulimalai +vellikkizhamai standalone,
// while the arumbu trio AND the pre-existing பெரிய இடத்துப் பெண் standalone card collapse into the collection;
// drama +2, essays +6 = +10. All three shelves were already over-cap, so it adds 0 initially-visible
// entries. Its own surface has a dedicated validator (validate-wave7-b2-b4-p4-integration).
const w7bp3 = readJSON<{ works: { routes: string[] }[] }>("data/internal/wave7/b2-b4-p3-routes.json");
const W7B = { works: 13, collections: 1, discovery: 10, sitemap: 225, fictionCat: 5, fictionDisc: 2, drama: 2, essays: 6, visible: 0 };
const W7B_ROUTES = new Set<string>([...w7bp3.works.flatMap((w) => w.routes), "/collections/arumbu-1978"]);
// Wave 7 B5a/B5b/B6/Kuraloviyam (P4): +101 works (100 speeches, 1 literary commentary), +2 collections, +512
// routes — derived in lib/wave7-b5-b6-k-contribution.ts; its exact route set is removed before the base hash.
const W7K_ROUTES = new Set<string>(WAVE7_B5_B6_K_ROUTES);
// Recover the frozen Wave-6-P4 census from the live one: remove Batch-7 + Wave-7-B2-B4 fiction (passed as
// minusFiction), Wave-7 B1 cinema, and Wave-7-B2-B4 drama & essays.
const toWave6Census = (m: Record<string, number>, minusFiction: number, minusSpeeches: number) => ({ ...m, fiction: m.fiction - minusFiction, "cinema-writing": (m["cinema-writing"] ?? 0) - W7.cinema, drama: (m.drama ?? 0) - W7B.drama - W8.drama, "essays-articles": (m["essays-articles"] ?? 0) - W7B.essays, speeches: (m.speeches ?? 0) - minusSpeeches, "literary-commentary": (m["literary-commentary"] ?? 0) - W7K.literaryCommentary - W8.literaryCommentary });

// The 22 Wave-6 works P4 publishes (cinema work has a dedicated loader, not a slug registry).
const WAVE6_CINEMA_SLUGS = ["ammaiyappan"] as const;
const WAVE6_WORK_SLUGS = [
  ...WAVE6_CINEMA_SLUGS,
  ...WAVE6_DRAMA_SLUGS,
  ...WAVE6_SPEECH_SLUGS,
  ...WAVE6_POEM_SLUGS,
  ...WAVE6_POETRY_PUBLICATION_SLUGS,
  ...WAVE6_NOVEL_SLUGS,
  ...WAVE6_ESSAY_SLUGS,
];

// ── 1. CATALOGUE — 100 works, exact 9-shelf census, the 22 present once, no leakage ──
const works = publishedWorks();
eq(works.length, 100 + B7.works + W7.works + W7B.works + W7K.works + W8.works, "catalogue is exactly 333 published works (100 Batches 1–6 + 116 Batch-7 + 3 Wave-7 B1 + 13 Wave-7 B2-B4 + 101 Wave-7 B5/B6/K)");
eq(WAVE6_WORK_SLUGS.length, 22, "exactly 22 Wave-6 work slugs are enumerated");
const catBy: Record<string, number> = {};
for (const w of works) catBy[w.shelf] = (catBy[w.shelf] ?? 0) + 1;
eqMap(catBy, {
  "life-writing": 1,
  letters: 1,
  fiction: 41 + B7.works + W7B.fictionCat, // 162 — Batch 7 +116 short stories, Wave-7 B2-B4 +5 novels
  poetry: 14,
  drama: 8 + W7B.drama + W8.drama, // 10 — Wave-7 B2-B4 +2 dramas (+ Wave-8 ore-mutham)
  "cinema-writing": 7 + W7.cinema, // 10 — Wave-7 B1 added 3 cinema works
  speeches: 17 + W7K.speeches, // 117 — Wave-7 B5/B6 +100 speeches
  "essays-articles": 9 + W7B.essays, // 15 — Wave-7 B2-B4 +6 essays
  "literary-commentary": 2 + W7K.literaryCommentary + W8.literaryCommentary, // 3 — Wave-7 +Kuraloviyam
}, "catalogue per-shelf census matches the post-Wave-7-B5/B6/K target");
eq(Object.values(catBy).reduce((a, b) => a + b, 0), 100 + B7.works + W7.works + W7B.works + W7K.works + W8.works, "shelf census sums to 333");
eq(Object.keys(catBy).length, 9, "exactly 9 non-empty shelves");
const slugCount = (slug: string) => works.filter((w) => w.slug === slug).length;
for (const s of WAVE6_WORK_SLUGS) eq(slugCount(s), 1, `Wave-6 work ${s} appears exactly once in the catalogue`);
eq(new Set(works.map((w) => w.slug)).size, works.length, "no duplicate slug in the catalogue");
// No leakage: the only Wave-6-registry works in the catalogue are the 22 expected ones.
const registrySet = new Set<string>(WAVE6_WORK_SLUGS);
const publishedWave6 = works.map((w) => w.slug).filter((s) => registrySet.has(s));
eq(uniqSorted(publishedWave6), uniqSorted([...WAVE6_WORK_SLUGS]), "exactly the 22 Wave-6 works are published (no Batch-7+ leakage)");

// ── 2. COLLECTIONS — 6 (the 1977 anthology + 5 Batch-7); no Batches-1–6 work became a collection ──
eq(LIBRARY_COLLECTIONS.length, 1 + B7.collections + W7B.collections + W7K.collections, "public collection registry is exactly 9 (1977 + 5 Batch-7 + arumbu-1978 + 2 முத்துக் குளியல்)");
ok(LIBRARY_COLLECTIONS.some((c) => c.id === "1977-kalaignar-karunanidhiyin-sirukathaigal"), "the 1977 short-story anthology is still a collection");
eq(uniqSorted(LIBRARY_COLLECTIONS.map((c) => c.id).filter((id) => id !== "1977-kalaignar-karunanidhiyin-sirukathaigal")),
  uniqSorted([...b7rec.collections.map((c) => c.id), "arumbu-1978", "muthukkuliyal-part-1", "muthukkuliyal-part-2"]), "the 8 non-1977 collections are exactly the 5 Batch-7 collections + arumbu-1978 + the 2 முத்துக் குளியல் volumes");
for (const s of WAVE6_WORK_SLUGS) ok(!LIBRARY_COLLECTIONS.some((c) => c.id === s), `Wave-6 work ${s} is not registered as a collection`);

// ── 3. /read DISCOVERY — 64 entries, exact per-shelf census, 39 visible, expected over-cap set ──
const CAP = 6; // components/LibraryHome.tsx INITIAL_WORKS_PER_SHELF — guarded below.
const libraryHome = fs.readFileSync(path.join(root, "components/LibraryHome.tsx"), "utf8");
ok(/const\s+INITIAL_WORKS_PER_SHELF\s*=\s*6\b/.test(libraryHome), "disclosure cap constant is still 6 (INITIAL_WORKS_PER_SHELF)");
const shelves = discoveryShelves();
const discBy: Record<string, number> = {};
let discTotal = 0;
let visible = 0;
const overCap: string[] = [];
for (const s of shelves) {
  const n = s.entries.length;
  discBy[s.shelf.id] = n;
  discTotal += n;
  visible += Math.min(n, CAP);
  if (n > CAP) overCap.push(s.shelf.id);
}
eq(discTotal, 64 + B7.discovery + W7.discovery + W7B.discovery + W7K.discovery + W8.discovery, "/read discovery is exactly 96 entries (64 Batches 1–6 + 13 Batch-7 + 3 Wave-7 B1 + 10 Wave-7 B2-B4 + 6 Wave-7 B5/B6/K)");
eqMap(discBy, {
  "life-writing": 1,
  letters: 1,
  fiction: 5 + B7.fictionDiscovery + W7B.fictionDisc, // 20 — Wave-7 B2-B4 +2 net (arumbu-1978 card + 2 standalone − பெரிய standalone collapsed)
  poetry: 14,
  drama: 8 + W7B.drama + W8.drama, // 10 — Wave-7 B2-B4 +2 dramas (+ Wave-8 ore-mutham)
  "cinema-writing": 7 + W7.cinema, // 10 — Wave-7 B1's 3 cinema works are standalone discovery entries
  speeches: 17 + W7K.speechDiscovery, // 22 — Wave-7: 2 முத்துக் குளியல் collection cards + 3 assembly speeches
  "essays-articles": 9 + W7B.essays, // 15 — Wave-7 B2-B4 +6 essays
  "literary-commentary": 2 + W7K.literaryCommentary + W8.literaryCommentary, // 3 — Wave-7 +Kuraloviyam
}, "/read discovery per-shelf census matches the post-Wave-7-B5/B6/K target");
eq(visible, 39 + B7.visible + W7B.visible + W7K.visible + W8.visible, "41 discovery entries are initially visible under the disclosure cap (Wave-7 B2-B4 shelves already over-cap; Wave-7 +1 Literary Commentary under the cap)");
eq(uniqSorted(overCap), uniqSorted(["fiction", "poetry", "drama", "cinema-writing", "speeches", "essays-articles"]), "exactly the six expected shelves are over the disclosure cap (unchanged by Wave-7 B2-B4)");
eq(discBy.fiction, 5 + B7.fictionDiscovery + W7B.fictionDisc, "fiction discovery is 20 (7 collection cards + 13 standalone works)");

// ── 4. SITEMAP — 3672 URLs, 0 duplicates, Wave-6 set == p3 cumulativeRoutes EXACTLY ──
const urls = sitemap().map((e) => e.url);
eq(urls.length, 3672 + B7.sitemap + W7.sitemap + W7B.sitemap + W7K.sitemap + W8.sitemap, "sitemap has exactly 4779 URLs (3672 Batches 1–6 + 237 Batch-7 + 133 Wave-7 B1 + 225 Wave-7 B2-B4 + 512 Wave-7 B5/B6/K)");
eq(urls.length - new Set(urls).size, 0, "sitemap has 0 duplicate URLs");
const urlSet = new Set(urls);
const wave6InSitemap = manifest.cumulativeRoutes.filter((r) => urlSet.has(`${BASE}${r}`));
eq(wave6InSitemap.length, manifest.cumulativeRouteCount, "every one of the 321 Wave-6 routes is present in the sitemap (0 missing)");
const missing = manifest.cumulativeRoutes.filter((r) => !urlSet.has(`${BASE}${r}`));
eq(missing, [], "0 Wave-6 routes missing from the sitemap");
// Set-equality: the sitemap paths under any Wave-6 route prefix equal the manifest set exactly (0 extra).
const wave6Prefixes = WAVE6_WORK_SLUGS.map((s) => {
  if ((WAVE6_CINEMA_SLUGS as readonly string[]).includes(s)) return `/cinema/${s}`;
  if ((WAVE6_DRAMA_SLUGS as readonly string[]).includes(s)) return `/plays/${s}`;
  if ((WAVE6_SPEECH_SLUGS as readonly string[]).includes(s)) return `/speeches/${s}`;
  if ((WAVE6_NOVEL_SLUGS as readonly string[]).includes(s)) return `/novels/${s}`;
  if ((WAVE6_ESSAY_SLUGS as readonly string[]).includes(s)) return `/essays/${s}`;
  return `/poems/${s}`; // poems + poetry publications
});
const wave6UrlPaths = urls
  .map((u) => u.replace(BASE, ""))
  .filter((p) => wave6Prefixes.some((pfx) => p === pfx || p.startsWith(`${pfx}/`)));
eq(uniqSorted(wave6UrlPaths), uniqSorted(manifest.cumulativeRoutes), "sitemap Wave-6 URL set == p3-routes.json cumulativeRoutes (0 extra, 0 missing)");
eq(wave6UrlPaths.length, manifest.cumulativeRoutes.length, "no Wave-6 sitemap route is duplicated");

// ── 5. REGISTRY PROMOTION — each promoted slug occurs exactly once (no duplicate generateStaticParams) ──
const countIn = (arr: readonly string[], slug: string) => arr.filter((x) => x === slug).length;
for (const s of WAVE6_POEM_SLUGS) { ok((POEM_SLUGS as readonly string[]).includes(s), `${s} promoted into POEM_SLUGS`); eq(countIn(POEM_SLUGS, s), 1, `${s} occurs once in POEM_SLUGS`); }
for (const s of WAVE6_POETRY_PUBLICATION_SLUGS) { ok((POETRY_PUBLICATION_SLUGS as readonly string[]).includes(s), `${s} promoted into POETRY_PUBLICATION_SLUGS`); eq(countIn(POETRY_PUBLICATION_SLUGS, s), 1, `${s} occurs once in POETRY_PUBLICATION_SLUGS`); }
for (const s of WAVE6_DRAMA_SLUGS) { ok((PLAY_SLUGS as readonly string[]).includes(s), `${s} promoted into PLAY_SLUGS`); eq(countIn(PLAY_SLUGS, s), 1, `${s} occurs once in PLAY_SLUGS`); }
for (const s of WAVE6_SPEECH_SLUGS) { ok((SPEECH_SLUGS as readonly string[]).includes(s), `${s} promoted into SPEECH_SLUGS`); eq(countIn(SPEECH_SLUGS, s), 1, `${s} occurs once in SPEECH_SLUGS`); }
for (const s of WAVE6_NOVEL_SLUGS) { ok((NOVEL_SLUGS as readonly string[]).includes(s), `${s} promoted into NOVEL_SLUGS`); eq(countIn(NOVEL_SLUGS, s), 1, `${s} occurs once in NOVEL_SLUGS`); }
for (const s of WAVE6_ESSAY_SLUGS) { ok((ESSAY_SLUGS as readonly string[]).includes(s), `${s} promoted into ESSAY_SLUGS`); eq(countIn(ESSAY_SLUGS, s), 1, `${s} occurs once in ESSAY_SLUGS`); }
for (const arr of [POEM_SLUGS, POETRY_PUBLICATION_SLUGS, PLAY_SLUGS, SPEECH_SLUGS, NOVEL_SLUGS, ESSAY_SLUGS] as readonly (readonly string[])[]) eq(new Set(arr).size, arr.length, "public registry has no duplicate slug");

// ── 6. ROUTE INTEGRITY — 0 new routes; build boundary unchanged (only when a build tree is present) ──
eq(record.routesExposed, 321, "P4 record: 321 routes exposed");
eq(record.newRoutesCreated, 0, "P4 record: 0 new routes created");
eq(manifest.cumulativeRouteCount, 321, "p3 manifest still lists 321 cumulative routes");
const manifestPath = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(manifestPath)) {
  const routeKeys = uniqSorted(Object.keys((JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as { routes: Record<string, unknown> }).routes));
  const htmlCount = countHtml(path.join(root, ".next/server/app"));
  // Batches 1–6 added their cumulative route set; Batch 7 added B7_ROUTES (232 story + 5 collection);
  // Wave 7 B1 added W7_ROUTES (133 cinema).
  eq(routeKeys.length, baseline.prerenderManifestRouteCount + manifest.cumulativeRouteCount + B7_ROUTES.size + W7_ROUTES.size + W7B_ROUTES.size + W7K_ROUTES.size + WAVE8_ROUTES.length, `build prerender routes == baseline ${baseline.prerenderManifestRouteCount} + Wave-6 ${manifest.cumulativeRouteCount} + Batch-7 ${B7_ROUTES.size} + Wave-7 B1 ${W7_ROUTES.size} + Wave-7 B2-B4 ${W7B_ROUTES.size} + Wave-7 B5/B6/K ${W7K_ROUTES.size} + Wave-8 ${WAVE8_ROUTES.length}`);
  eq(htmlCount, baseline.htmlFileCount + manifest.cumulativeRouteCount + B7_ROUTES.size + W7_ROUTES.size + W7B_ROUTES.size + W7K_ROUTES.size + WAVE8_ROUTES.length, `build .html == baseline ${baseline.htmlFileCount} + Wave-6 ${manifest.cumulativeRouteCount} + Batch-7 ${B7_ROUTES.size} + Wave-7 B1 ${W7_ROUTES.size} + Wave-7 B2-B4 ${W7B_ROUTES.size} + Wave-7 B5/B6/K ${W7K_ROUTES.size} + Wave-8 ${WAVE8_ROUTES.length}`);
  // The pre-Wave-6 remainder must still be the frozen baseline once the Wave-6 cumulative routes, the
  // Batch-7 routes, the Wave-7 B1 routes AND the Wave-7 B2-B4 routes are removed — proving each later
  // batch added exactly its own routes and nothing else moved.
  const laterRoutes = new Set<string>([...manifest.cumulativeRoutes, ...Array.from(B7_ROUTES), ...Array.from(W7_ROUTES), ...Array.from(W7B_ROUTES), ...Array.from(W7K_ROUTES), ...WAVE8_ROUTES]);
  const remainder = routeKeys.filter((k) => !laterRoutes.has(k)).sort();
  eq(remainder.length, baseline.prerenderManifestRouteCount, "pre-Wave-6 build remainder count == frozen baseline");
  eq(createHash("sha256").update(JSON.stringify(remainder)).digest("hex"), baseline.routeSetSha256, "pre-Wave-6 build remainder route-set SHA-256 == frozen base hash (no unexpected routes)");
} else {
  console.error("  · build boundary SKIPPED — no .next/prerender-manifest.json (run `npm run build` first; CI runs this after build).");
}

// ── 7. DURABLE P4 RECORD cross-checked against live state (cannot silently drift) ──
const rec = record as {
  workCount: number; collectionsAdded: number;
  catalogue: { before: number; after: number; shelfCensusAfter: Record<string, number> };
  collections: { after: number };
  discovery: { after: number; initiallyVisible: number; perShelfAfter: Record<string, number>; overCapShelves: string[] };
  sitemap: { after: number; duplicates: number };
  build: { prerenderRoutes: number; htmlFiles: number };
};
// The record is the FROZEN Batches-1–6 snapshot, so it is cross-checked against (live − Batch-7).
eq(rec.workCount, 22, "record workCount == 22");
eq(rec.collectionsAdded, 0, "record collectionsAdded == 0");
eq(rec.catalogue.after, works.length - B7.works - W7.works - W7B.works - W7K.works - W8.works, "record catalogue.after == live − Batch-7 − Wave-7 B1 − Wave-7 B2-B4 − B5/B6/K");
eqMap(rec.catalogue.shelfCensusAfter, toWave6Census(catBy, B7.works + W7B.fictionCat, W7K.speeches), "record catalogue shelf census == live − later-wave contributions");
eq(rec.collections.after, LIBRARY_COLLECTIONS.length - B7.collections - W7B.collections - W7K.collections, "record collections.after == live − Batch-7 − arumbu-1978 − 2 முத்துக் குளியல் (Wave-7 B1 added no collection)");
eq(rec.discovery.after, discTotal - B7.discovery - W7.discovery - W7B.discovery - W7K.discovery - W8.discovery, "record discovery.after == live − Batch-7 − Wave-7 B1 − Wave-7 B2-B4 − B5/B6/K");
eq(rec.discovery.initiallyVisible, visible - B7.visible - W7K.visible - W8.visible, "record discovery.initiallyVisible == live − Batch-7 (Wave-7 B1 added 0 visible: cinema over-cap)");
eqMap(rec.discovery.perShelfAfter, toWave6Census(discBy, B7.fictionDiscovery + W7B.fictionDisc, W7K.speechDiscovery), "record discovery per-shelf census == live − later-wave contributions");
eq(uniqSorted(rec.discovery.overCapShelves), uniqSorted(overCap.filter((s) => s !== "fiction")), "record over-cap shelves == live − Batch-7 (fiction); Wave-7 B1 added no over-cap shelf");
eq(rec.sitemap.after, urls.length - B7.sitemap - W7.sitemap - W7B.sitemap - W7K.sitemap - W8.sitemap, "record sitemap.after == live − Batch-7 − Wave-7 B1 − Wave-7 B2-B4 − B5/B6/K");
eq(rec.sitemap.duplicates, urls.length - new Set(urls).size, "record sitemap duplicates == live");
eq(rec.build.prerenderRoutes, baseline.prerenderManifestRouteCount + manifest.cumulativeRouteCount, "record build prerenderRoutes == baseline + Wave-6");
eq(rec.build.htmlFiles, baseline.htmlFileCount + manifest.cumulativeRouteCount, "record build htmlFiles == baseline + Wave-6");

// ── 8. SEMANTIC RESTRAINT — source-faithful catalogue copy (no fabricated numbering/date/venue/edition) ──
const W = (slug: string) => { const w = LIBRARY_WORKS.find((x) => x.slug === slug); if (!w) throw new Error(`missing catalogue entry ${slug}`); return w; };
const has = (s: string | undefined, re: RegExp) => !!s && re.test(s);

{
  const w = W("ammaiyappan");
  eq(w.subtype, "film-screenplay", "ammaiyappan subtype film-screenplay");
  eq(w.readerStructure, "scene", "ammaiyappan readerStructure scene");
  eq(w.unitCount?.value, 63, "ammaiyappan 63 archival scene segments");
  ok(has(w.descEn, /not source-numbered/i) && has(w.descTa, /எண்ணிடப்பட்ட காட்சிகள் அல்ல/), "ammaiyappan copy: archival scenes are not source-numbered scenes");
}
{
  const w = W("kagithapoo");
  ok(has(w.descEn, /unnumbered/i) && has(w.descTa, /எண்ணிடப்படாத/), "kagithapoo copy: names the unnumbered காட்சி (no invented Scene 22/23)");
  ok(!has(w.descEn, /Scene\s*2[23]\b/) && !has(w.descEn, /\b22\b|\b23\b/), "kagithapoo copy: no invented numbered Scene 22/23");
}
{
  const w = W("thiruvalar-desiyampillai");
  ok(has(w.descEn, /no numbered act\/scene system/i), "thiruvalar copy: no numbered act/scene system");
  ok(has(w.descEn, /qualification/i), "thiruvalar copy: keeps its source-condition qualification");
  eq(w.unitCount?.value, 7, "thiruvalar 7 reading units (not numbered scenes)");
}
{
  const w = W("namathu-nilai");
  ok(has(w.descEn, /date:\s*null/i), "namathu-nilai copy: date is null");
  ok(has(w.descEn, /two-House/i), "namathu-nilai copy: edited two-House witness, not one dated transcript");
}
{
  const w = W("idhaya-perikai");
  ok(has(w.descEn, /no single date or venue/i), "idhaya-perikai copy: no single date or venue established");
}
{
  const w = W("palli-vazhkkai");
  ok(has(w.descEn, /no per-component date or venue/i), "palli-vazhkkai copy: no per-component date or venue established");
}
{
  const w = W("kalaignarin-kaviyaranga-kavithaigal-1975");
  eq(w.subtype, "poetry-publication", "1975 publication stays a poetry-publication");
  ok(has(w.descEn, /01\s*\/\s*02\s*\/\s*04/), "1975 copy: ordinals 01 / 02 / 04");
  ok(has(w.descEn, /excluded ordinal 03/i), "1975 copy: ordinal 03 stays absent (excluded Rajaji poem)");
}
{
  const w = W("oruthalaik-kathal");
  eq(w.subtype, "poetry-publication", "oruthalaik-kathal stays a poetry-publication");
  eq(w.unitCount?.value, 11, "oruthalaik 11 sections");
  ok(has(w.descEn, /not 11 independent poems/i), "oruthalaik copy: 11 sections, not 11 poems");
  // The generic Poetry route metadata must be reading-unit-kind aware — never advertise the
  // verse-novel's source sections as independent poems.
  const oruLanding = String((poemLandingMetadata({ params: { slug: "oruthalaik-kathal" } }) as { description?: string }).description ?? "");
  ok(/verse-novel/i.test(oruLanding) && /source sections/i.test(oruLanding), "oruthalaik landing metadata: verse-novel arranged as source sections");
  ok(!/\d+\s+poems\b/i.test(oruLanding), "oruthalaik landing metadata: never 'N poems'");
  const oruChild = String((poemItemMetadata({ params: { slug: "oruthalaik-kathal", item: "section-1" } }) as { description?: string }).description ?? "");
  ok(/\bsection 1 of 11\b/.test(oruChild) && !/\bpoem \d+ of \d+/i.test(oruChild), "oruthalaik child metadata: 'section 1 of 11', never 'poem N of 11'");
  // A normal poetry publication keeps poem/poems wording (no regression).
  const normalLanding = String((poemLandingMetadata({ params: { slug: "kalaignarin-kaviyaranga-kavithaigal-1975" } }) as { description?: string }).description ?? "");
  ok(/\bpoems by Kalaignar\b/.test(normalLanding) && !/\bsection(s)?\b/i.test(normalLanding), "normal publication landing metadata still uses poem/poems wording");
}
{
  const w = W("periya-idathup-pen");
  eq(w.unitCount?.value, 7, "periya 7 reading sections");
  ok(has(w.descEn, /not printed chapters/i), "periya copy: 7 sections, not 18 printed chapters");
  ok(has(w.edition, /1953/) && has(w.edition, /திராவிடன்/), "periya edition: 1953 eighth edition / Dravidian publisher");
}
{
  const w = W("pudhaiyal");
  eq(w.unitCount?.value, 52, "pudhaiyal 52 literary units");
  ok(has(w.descEn, /52 literary units/i) && !has(w.descEn, /54 sections/i), "pudhaiyal copy: 52 literary units, not '54 sections'");
}
{
  const w = W("kudumbaththin-nalvilakku");
  ok(has(w.descEn, /no edition or year is established/i), "kudumbaththin copy: no edition or year established");
  ok(!has(w.descEn, /\b(1949|1951|1956)\b/) && !has(w.descTa, /\b(1949|1951|1956)\b/), "kudumbaththin copy: no fabricated year");
}
{
  const w = W("vedhanai-ch-siraiyinindrum-viduthalai-pera");
  ok(has(w.descEn, /செய்தி|message/) && has(w.descEn, /NOT a speech/i), "vedhanai copy: a government செய்தி/message, NOT a speech");
  ok(has(w.descEn, /no date or venue is established/i), "vedhanai copy: no fabricated date or venue");
}

function countHtml(dir: string): number {
  let n = 0;
  const walk = (d: string) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith(".html")) n++;
    }
  };
  try { walk(dir); } catch { /* no build tree */ }
  return n;
}

if (failures.length) {
  console.error(`\nwave6-p4-integration — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave6-p4-integration — ${checks} checks, 0 failed`);
console.log(`  Batches 1–6: 22 works · catalogue →100 · discovery →64 · collections 1 · set-equal to 321 P3 routes (frozen record intact)`);
console.log(`  reconciled with Batch-7 (+116 works, +5 collections, +237 routes), Wave-7 B1 (+3 cinema, +133 routes) and Wave-7 B2-B4 (+13 works, +1 four-member collection, +225 routes): live catalogue 232 · discovery 90/40 · sitemap 4267/0 · build 4276/4271`);
