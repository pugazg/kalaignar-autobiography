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
eq(works.length, 100, "catalogue is exactly 100 published works");
eq(WAVE6_WORK_SLUGS.length, 22, "exactly 22 Wave-6 work slugs are enumerated");
const catBy: Record<string, number> = {};
for (const w of works) catBy[w.shelf] = (catBy[w.shelf] ?? 0) + 1;
eqMap(catBy, {
  "life-writing": 1,
  letters: 1,
  fiction: 41,
  poetry: 14,
  drama: 8,
  "cinema-writing": 7,
  speeches: 17,
  "essays-articles": 9,
  "literary-commentary": 2,
}, "catalogue per-shelf census matches the P4 target");
eq(Object.values(catBy).reduce((a, b) => a + b, 0), 100, "shelf census sums to 100");
eq(Object.keys(catBy).length, 9, "exactly 9 non-empty shelves");
const slugCount = (slug: string) => works.filter((w) => w.slug === slug).length;
for (const s of WAVE6_WORK_SLUGS) eq(slugCount(s), 1, `Wave-6 work ${s} appears exactly once in the catalogue`);
eq(new Set(works.map((w) => w.slug)).size, works.length, "no duplicate slug in the catalogue");
// No leakage: the only Wave-6-registry works in the catalogue are the 22 expected ones.
const registrySet = new Set<string>(WAVE6_WORK_SLUGS);
const publishedWave6 = works.map((w) => w.slug).filter((s) => registrySet.has(s));
eq(uniqSorted(publishedWave6), uniqSorted([...WAVE6_WORK_SLUGS]), "exactly the 22 Wave-6 works are published (no Batch-7+ leakage)");

// ── 2. COLLECTIONS — exactly 1 (the 1977 anthology); no Wave-6 work became a collection ──
eq(LIBRARY_COLLECTIONS.length, 1, "public collection registry is exactly 1");
eq(LIBRARY_COLLECTIONS.map((c) => c.id), ["1977-kalaignar-karunanidhiyin-sirukathaigal"], "the sole collection is the 1977 short-story anthology");
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
eq(discTotal, 64, "/read discovery is exactly 64 entries");
eqMap(discBy, {
  "life-writing": 1,
  letters: 1,
  fiction: 5,
  poetry: 14,
  drama: 8,
  "cinema-writing": 7,
  speeches: 17,
  "essays-articles": 9,
  "literary-commentary": 2,
}, "/read discovery per-shelf census matches the P4 target");
eq(visible, 39, "39 discovery entries are initially visible under the disclosure cap");
eq(uniqSorted(overCap), uniqSorted(["poetry", "drama", "cinema-writing", "speeches", "essays-articles"]), "exactly the five expected shelves are over the disclosure cap");
eq(discBy.fiction, 5, "fiction discovery stays 5 (1977 anthology collapses to one entry; 2 Wave-6 novels added)");

// ── 4. SITEMAP — 3672 URLs, 0 duplicates, Wave-6 set == p3 cumulativeRoutes EXACTLY ──
const urls = sitemap().map((e) => e.url);
eq(urls.length, 3672, "sitemap has exactly 3672 URLs");
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
  eq(routeKeys.length, baseline.prerenderManifestRouteCount + manifest.cumulativeRouteCount, `build prerender routes == baseline ${baseline.prerenderManifestRouteCount} + Wave-6 ${manifest.cumulativeRouteCount} (3681)`);
  eq(htmlCount, baseline.htmlFileCount + manifest.cumulativeRouteCount, `build .html == baseline ${baseline.htmlFileCount} + Wave-6 ${manifest.cumulativeRouteCount} (3676)`);
  const remainder = routeKeys.filter((k) => !new Set(manifest.cumulativeRoutes).has(k)).sort();
  eq(remainder.length, baseline.prerenderManifestRouteCount, "pre-Wave-6 build remainder count == frozen baseline");
  eq(createHash("sha256").update(JSON.stringify(remainder)).digest("hex"), baseline.routeSetSha256, "pre-Wave-6 build remainder route-set SHA-256 == frozen base hash (no new routes)");
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
eq(rec.workCount, 22, "record workCount == 22");
eq(rec.collectionsAdded, 0, "record collectionsAdded == 0");
eq(rec.catalogue.after, works.length, "record catalogue.after == live catalogue count");
eqMap(rec.catalogue.shelfCensusAfter, catBy, "record catalogue shelf census == live");
eq(rec.collections.after, LIBRARY_COLLECTIONS.length, "record collections.after == live");
eq(rec.discovery.after, discTotal, "record discovery.after == live");
eq(rec.discovery.initiallyVisible, visible, "record discovery.initiallyVisible == live");
eqMap(rec.discovery.perShelfAfter, discBy, "record discovery per-shelf census == live");
eq(uniqSorted(rec.discovery.overCapShelves), uniqSorted(overCap), "record over-cap shelves == live");
eq(rec.sitemap.after, urls.length, "record sitemap.after == live sitemap count");
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
console.log(`  22 works published · catalogue 78→100 · discovery 42→64 (39 visible) · collections 1 · sitemap 3351→3672 (0 dup, set-equal to 321 P3 routes) · 0 new routes · build 3681/3676`);
