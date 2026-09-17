/**
 * Wave 6 — cumulative manifest + global build-boundary validator (FAMILY-AGNOSTIC).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave6-p3-build.ts
 *
 * This validator INHERITS the global build-delta responsibility that Wave-5 P4 A7 shed. Wave-5 P4 A7
 * now proves only the six frozen Wave-5 Cinema families (exact 346, build↔sitemap). Wave 6 P1–P3 added
 * the 321 reader routes recorded in the cumulative manifest; this gate owns:
 *   * cumulative-manifest self-consistency: the committed data/internal/wave6/p3-routes.json is exactly
 *     the disjoint union of the per-batch manifests (route/work/collection identity, field-for-field);
 *   * the exact whole-build growth = frozen pre-Wave-6 baseline + the cumulative Wave-6 route set;
 *   * proof, via the INDEPENDENTLY FROZEN base route-set hash, that the current build's pre-Wave-6
 *     remainder is byte-identical to a clean build of implementation base 632476ba… (so a same-count
 *     substitution ANYWHERE in the baseline fails — without committing 3360 route strings).
 *
 * The route/build boundary is phase-agnostic: P4 exposes these same 321 routes via catalogue, /read
 * discovery and sitemap but creates ZERO new routes, so the build totals below are unchanged by P4.
 * Public exposure (the inverse of the old "hidden until P4" assertions that once lived here) is now
 * proven by scripts/validate-wave6-p4-integration.ts.
 *
 * It knows NOTHING about how any reader family derives its routes — each batch owns its own derivation
 * (its per-batch manifest + route test). The cumulative manifest is composed by
 * scripts/build-wave6-p3-route-manifest.mjs. Future batches extend data/internal/wave6/batches/ only;
 * neither this gate nor Wave-5 A7 changes again.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const readJSON = <T,>(p: string): T => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

let checks = 0;
const failures: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) failures.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const uniqSorted = (a: string[]) => Array.from(new Set(a)).sort();
const diff = (a: string[], b: string[]) => a.filter((x) => !b.includes(x));

type BatchMeta = { batchId: string; workIds: string[]; collectionIds: string[]; readerFamily: string; discoverable: boolean; sitemapExposed: boolean; routeCount: number };
type BatchFull = BatchMeta & { routes: string[] };
type Cumulative = { batches: BatchMeta[]; cumulativeRouteCount: number; cumulativeRoutes: string[] };
const manifest = readJSON<Cumulative>("data/internal/wave6/p3-routes.json");
const baseline = readJSON<{ prerenderManifestRouteCount: number; htmlFileCount: number; routeSetSha256: string }>("data/internal/wave6/frozen-baseline.json");

// Per-batch manifests are the authority; re-compose here and require the committed cumulative to match.
const BATCH_DIR = "data/internal/wave6/batches";
const batchFiles = fs.existsSync(path.join(root, BATCH_DIR)) ? fs.readdirSync(path.join(root, BATCH_DIR)).filter((f) => f.endsWith(".json")).sort() : [];
const batchManifests = batchFiles.map((f) => readJSON<BatchFull>(`${BATCH_DIR}/${f}`));

// ── 1. CUMULATIVE MANIFEST SELF-CONSISTENCY (composed from per-batch manifests) ─
ok(batchManifests.length > 0, "at least one per-batch manifest exists");
eq(manifest.batches.length, batchManifests.length, "cumulative lists every per-batch manifest");
const composed = batchManifests.flatMap((b) => b.routes);
eq(new Set(composed).size, composed.length, "no route appears in two batches");
eq(uniqSorted(manifest.cumulativeRoutes), uniqSorted(composed), "cumulativeRoutes == union of per-batch routes");
eq(manifest.cumulativeRouteCount, manifest.cumulativeRoutes.length, "cumulativeRouteCount is exact");
for (const b of batchManifests) {
  eq(b.routes.length, b.routeCount, `batch ${b.batchId} routeCount exact`);
  eq(new Set(b.routes).size, b.routes.length, `batch ${b.batchId} no intra-batch duplicate`);
  ok(Array.isArray(b.workIds) && b.workIds.length > 0, `batch ${b.batchId} workIds non-empty array`);
  ok(Array.isArray(b.collectionIds), `batch ${b.batchId} collectionIds is an array`);
  ok((b as unknown as { workId?: unknown }).workId === undefined, `batch ${b.batchId} does not use the retired singular workId`);
  ok(b.discoverable === false, `batch ${b.batchId} discoverable=false`);
  ok(b.sitemapExposed === false, `batch ${b.batchId} sitemapExposed=false`);
}
for (const b of manifest.batches) { ok(b.discoverable === false, `cumulative ${b.batchId} discoverable=false`); ok(b.sitemapExposed === false, `cumulative ${b.batchId} sitemapExposed=false`); }

// EXACT cumulative batch-metadata equality: the cumulative manifest's per-batch identity
// (batchId, workIds, collectionIds, readerFamily, routeCount, discoverable, sitemapExposed) must equal
// the metadata recomposed from the per-batch manifests, field-for-field. A stale or altered batch
// identity in the cumulative file fails HERE even if the route union still happens to be correct.
const canonMeta = (b: BatchMeta) => ({
  batchId: b.batchId,
  workIds: [...b.workIds].sort(),
  collectionIds: [...b.collectionIds].sort(),
  readerFamily: b.readerFamily,
  routeCount: b.routeCount,
  discoverable: b.discoverable,
  sitemapExposed: b.sitemapExposed,
});
const bySortedId = <T extends { batchId: string }>(xs: T[]) => [...xs].sort((a, b) => a.batchId.localeCompare(b.batchId));
eq(
  bySortedId(manifest.batches).map(canonMeta),
  bySortedId(batchManifests).map(canonMeta),
  "cumulative batch metadata == recomposed per-batch metadata (batchId/workIds/collectionIds/readerFamily/routeCount/flags)",
);

// Batch identity hygiene: every batchId is a non-empty string and unique across manifests.
for (const b of batchManifests) ok(typeof b.batchId === "string" && b.batchId.length > 0, `batch ${b.batchId} has a non-empty batchId`);
const allBatchIds = batchManifests.map((b) => b.batchId);
eq(new Set(allBatchIds).size, allBatchIds.length, "no batchId appears in two manifests");

// Cross-batch identity disjointness: no workId or collectionId may appear in two batches.
const allWorkIds = batchManifests.flatMap((b) => b.workIds);
eq(new Set(allWorkIds).size, allWorkIds.length, "no workId appears in two batches");
const allCollectionIds = batchManifests.flatMap((b) => b.collectionIds);
eq(new Set(allCollectionIds).size, allCollectionIds.length, "no collectionId appears in two batches");

// ── 2. BUILD BOUNDARY — exact whole-build delta + baseline-hash proof (after a build) ─
// Phase-agnostic: P4 exposes these routes but adds none, so these totals are unchanged from P3.
// (The former "P4 remains hidden" sitemap/catalogue/discovery assertions moved, inverted, to
//  scripts/validate-wave6-p4-integration.ts.)
const manifestPath = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(manifestPath)) {
  const routeKeys = uniqSorted(Object.keys((JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as { routes: Record<string, unknown> }).routes));
  const htmlCount = countHtml(path.join(root, ".next/server/app"));
  // Batch 7 (short stories) published its own 232 story + 5 collection routes AFTER this cumulative
  // manifest was frozen; they are recorded in b7-p3-routes.json + b7-p4-integration.json and validated
  // there. Carry them here so the whole-build totals and the baseline-hash proof stay exact.
  const b7p3 = readJSON<{ routes: string[] }>("data/internal/wave6/b7-p3-routes.json");
  const b7rec = readJSON<{ collections: { id: string }[] }>("data/internal/wave6/b7-p4-integration.json");
  const b7Routes = [...b7p3.routes, ...b7rec.collections.map((c) => `/collections/${c.id}`)];
  const wave6AndB7 = new Set<string>([...manifest.cumulativeRoutes, ...b7Routes]);
  // Exact whole-build totals, DERIVED (baseline + Wave-6 cumulative + Batch-7), never a magic constant.
  eq(routeKeys.length, baseline.prerenderManifestRouteCount + manifest.cumulativeRouteCount + b7Routes.length, `build prerender routes == baseline ${baseline.prerenderManifestRouteCount} + Wave-6 ${manifest.cumulativeRouteCount} + Batch-7 ${b7Routes.length}`);
  eq(htmlCount, baseline.htmlFileCount + manifest.cumulativeRouteCount + b7Routes.length, `build .html == baseline ${baseline.htmlFileCount} + Wave-6 ${manifest.cumulativeRouteCount} + Batch-7 ${b7Routes.length}`);
  // Every Wave-6 route present; representative invalid routes absent.
  for (const r of manifest.cumulativeRoutes) ok(routeKeys.includes(r), `build prerenders Wave-6 route ${r}`);
  for (const bad of ["/cinema/ammaiyappan/scene-000", "/cinema/ammaiyappan/scene-064", "/cinema/ammaiyappan/scene-999", "/cinema/ammaiyappan/foo"]) {
    ok(!routeKeys.includes(bad), `build does NOT prerender invalid ${bad}`);
  }
  // Remove the Wave-6 cumulative AND the Batch-7 routes; the remainder must be the pre-Wave-6 baseline.
  const remainder = routeKeys.filter((k) => !wave6AndB7.has(k)).sort();
  eq(remainder.length, baseline.prerenderManifestRouteCount, "pre-Wave-6 build remainder count == frozen baseline (3360)");
  // BASELINE-HASH PROOF: the remainder is byte-identical to the independently captured clean base build.
  // Catches any unauthorized/substituted baseline route without committing 3360 route strings.
  const remainderSha = createHash("sha256").update(JSON.stringify(remainder)).digest("hex");
  eq(remainderSha, baseline.routeSetSha256, "pre-Wave-6 build remainder route-set SHA-256 == independently frozen base hash");
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
console.log(`  ${manifest.batches.length} batch(es) · cumulative ${manifest.cumulativeRouteCount} reader routes · build = frozen baseline ${baseline.prerenderManifestRouteCount} (hash-pinned) + ${manifest.cumulativeRouteCount} · public exposure proven by validate-wave6-p4-integration`);
