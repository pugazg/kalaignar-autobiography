/**
 * Wave 6 P1–P3 — global build-boundary validator (cumulative across batches).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave6-p3-build.ts
 *
 * This validator INHERITS the global build-delta responsibility that Wave-5 P4 A7 used to hold. Wave-5
 * P4 A7 now proves only the six frozen Wave-5 Cinema families (exact 346, build↔sitemap). Wave 6 P1–P3
 * adds AUTHORIZED direct-but-undiscovered reader routes; this gate owns:
 *   * the exact whole-build growth = frozen pre-Wave-6 baseline + the cumulative Wave-6 P3 route manifest
 *     (so an unrelated extra prerender route, or a same-count substitution anywhere in the build, fails);
 *   * proof that every Wave-6 P3 route is registry-derived and present in the build;
 *   * proof that NO Wave-6 P3 route/work is exposed in sitemap, catalogue or /read discovery until P4.
 *
 * Future batches extend data/internal/wave6/p3-routes.json only; this gate and the Wave-5 A7 gate do
 * not change again.
 */
import fs from "node:fs";
import path from "node:path";
import { publishedWorks } from "../data/library";
import { discoveryShelves } from "../data/collections";
import sitemap from "../app/sitemap";

const BASE = "https://nenjukkuneethi.org";
const root = process.cwd();
const readJSON = <T,>(p: string): T => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

let checks = 0;
const failures: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) failures.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const uniqSorted = (a: string[]) => Array.from(new Set(a)).sort();
const diff = (a: string[], b: string[]) => a.filter((x) => !b.includes(x));

type Batch = { batchId: string; workId: string; readerFamily: string; discoverable: boolean; sitemapExposed: boolean; routeCount: number; routes: string[] };
type Manifest = {
  frozenBaseline: { prerenderManifestRouteCount: number; htmlFileCount: number; sitemapUrls: number; sitemapCinemaRoutes: number; catalogueWorks: number; publicCollections: number };
  batches: Batch[]; cumulativeRouteCount: number; cumulativeRoutes: string[];
};
const manifest = readJSON<Manifest>("data/internal/wave6/p3-routes.json");
const baseline = readJSON<{ prerenderManifestRouteCount: number; routes: string[] }>("data/internal/wave6/frozen-baseline-prerender-routes.json");

// ── 1. MANIFEST SELF-CONSISTENCY ────────────────────────────────────────────────
const flat = manifest.batches.flatMap((b) => b.routes);
eq(new Set(flat).size, flat.length, "manifest: no route appears in two batches");
eq(uniqSorted(manifest.cumulativeRoutes), uniqSorted(flat), "manifest: cumulativeRoutes == union of batch routes");
eq(manifest.cumulativeRouteCount, manifest.cumulativeRoutes.length, "manifest: cumulativeRouteCount is exact");
for (const b of manifest.batches) {
  eq(b.routes.length, b.routeCount, `manifest: ${b.batchId} routeCount exact`);
  ok(b.discoverable === false, `manifest: ${b.batchId} discoverable=false`);
  ok(b.sitemapExposed === false, `manifest: ${b.batchId} sitemapExposed=false`);
}

// ── 2. MANIFEST ROUTES ARE REGISTRY-DERIVED (not a hand list) ───────────────────
// Re-derive each batch's routes from the vendored released payload and require exact equality.
const deriveCinemaScene = (workId: string): string[] => {
  const r = readJSON<{ screenplayScenes: { archivalSceneOrdinal: number }[] }>(`public/data/cinema/${workId}/reader.json`);
  return [
    `/cinema/${workId}`,
    `/cinema/${workId}/source`,
    ...r.screenplayScenes.map((s) => `/cinema/${workId}/scene-${String(s.archivalSceneOrdinal).padStart(3, "0")}`),
  ];
};
for (const b of manifest.batches) {
  let derived: string[] | null = null;
  if (b.readerFamily === "cinema-scene") derived = deriveCinemaScene(b.workId);
  if (derived === null) { ok(false, `manifest: no registry derivation known for family ${b.readerFamily} (${b.batchId})`); continue; }
  eq(uniqSorted(b.routes), uniqSorted(derived), `manifest: ${b.batchId} routes == registry-derived set`);
}

// ── 3. P4 BOUNDARY — undiscovered in sitemap / catalogue / discovery ────────────
const urls = sitemap().map((e) => e.url);
eq(urls.length, manifest.frozenBaseline.sitemapUrls, "sitemap URL count unchanged (frozen baseline)");
eq(new Set(urls).size, urls.length, "sitemap has 0 duplicates");
for (const r of manifest.cumulativeRoutes) ok(!urls.includes(`${BASE}${r}`), `sitemap excludes undiscovered route ${r}`);
const works = publishedWorks();
eq(works.length, manifest.frozenBaseline.catalogueWorks, "catalogue works unchanged (frozen baseline)");
const entrySlugs = new Set(discoveryShelves().flatMap((s) => s.entries).map((e) => (e.kind === "collection" ? e.collection.id : e.work.slug)));
for (const b of manifest.batches) {
  ok(!works.some((w) => w.slug === b.workId), `catalogue excludes Wave-6 work ${b.workId}`);
  ok(!entrySlugs.has(b.workId), `/read discovery excludes Wave-6 work ${b.workId}`);
}

// ── 4. BUILD BOUNDARY (exact whole-build delta; runs after a build) ─────────────
const manifestPath = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(manifestPath)) {
  const routeKeys = uniqSorted(Object.keys((JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as { routes: Record<string, unknown> }).routes));
  const htmlCount = countHtml(path.join(root, ".next/server/app"));
  const expectedPrerender = baseline.prerenderManifestRouteCount + manifest.cumulativeRouteCount;
  const expectedHtml = manifest.frozenBaseline.htmlFileCount + manifest.cumulativeRouteCount;
  // Exact whole-build totals, DERIVED (baseline + cumulative), never a magic constant.
  eq(routeKeys.length, expectedPrerender, `build prerender routes == baseline ${baseline.prerenderManifestRouteCount} + Wave-6 ${manifest.cumulativeRouteCount}`);
  eq(htmlCount, expectedHtml, `build .html == baseline ${manifest.frozenBaseline.htmlFileCount} + Wave-6 ${manifest.cumulativeRouteCount}`);
  // EXACT whole-build set == baseline ∪ cumulative Wave-6 routes. Catches any unrelated extra route AND
  // any same-count substitution anywhere in the build (a swapped baseline route would be missing here).
  const expectedSet = uniqSorted([...baseline.routes, ...manifest.cumulativeRoutes]);
  eq(routeKeys, expectedSet, "build route set == frozen baseline ∪ Wave-6 P3 manifest (exact)");
  eq(diff(routeKeys, expectedSet), [], "no unauthorized build route (build − expected == [])");
  eq(diff(expectedSet, routeKeys), [], "no missing expected build route (expected − build == [])");
  // Belt-and-braces: every manifest route present; representative invalid routes absent.
  for (const r of manifest.cumulativeRoutes) ok(routeKeys.includes(r), `build prerenders Wave-6 route ${r}`);
  for (const bad of ["/cinema/ammaiyappan/scene-000", "/cinema/ammaiyappan/scene-064", "/cinema/ammaiyappan/scene-999", "/cinema/ammaiyappan/foo"]) {
    ok(!routeKeys.includes(bad), `build does NOT prerender invalid ${bad}`);
  }
  // Cross-check the frozen baseline itself still carries exactly the six Wave-5 Cinema families' 346.
  const baseCinema = baseline.routes.filter((r) => r.startsWith("/cinema/"));
  eq(baseCinema.length, manifest.frozenBaseline.sitemapCinemaRoutes, "frozen baseline holds exactly 346 Wave-5 Cinema routes");
} else {
  console.error("  · build boundary SKIPPED — no .next/prerender-manifest.json (run `npm run build` first; CI runs this after build).");
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
  console.error(`\nwave6-p3-build — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave6-p3-build — ${checks} checks, 0 failed`);
console.log(`  ${manifest.batches.length} batch(es) · cumulative ${manifest.cumulativeRouteCount} authorized-undiscovered routes · build = baseline ${baseline.prerenderManifestRouteCount} + ${manifest.cumulativeRouteCount} · sitemap/catalogue/discovery unchanged`);
