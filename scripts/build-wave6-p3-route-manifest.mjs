#!/usr/bin/env node
// Wave 6 P1–P3 cumulative direct-route manifest generator — GENERIC.
//
//   node scripts/build-wave6-p3-route-manifest.mjs
//
// Composes every approved per-batch route manifest under data/internal/wave6/batches/*.json into the
// cumulative data/internal/wave6/p3-routes.json. It knows NOTHING about individual reader families
// (cinema, drama, poetry, speeches, novels, essays, short stories): each batch owns its own
// family-specific route derivation and commits its own manifest (the batch's route test proves that
// manifest equals its released reader registry). A future batch just adds its own batches/*.json — this
// generator and the global build validator never need architectural changes.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const BATCH_DIR = path.join(root, "data/internal/wave6/batches");
const die = (m) => { console.error(`build-wave6-p3-route-manifest: ${m}`); process.exit(1); };

const files = fs.existsSync(BATCH_DIR)
  ? fs.readdirSync(BATCH_DIR).filter((f) => f.endsWith(".json")).sort()
  : [];
if (files.length === 0) die(`no per-batch manifests under ${BATCH_DIR}`);

const batches = files.map((f) => {
  const b = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, f), "utf8"));
  for (const k of ["batchId", "workId", "readerFamily", "routes"]) if (b[k] === undefined) die(`${f} missing ${k}`);
  if (b.discoverable !== false) die(`${f} must be discoverable:false`);
  if (b.sitemapExposed !== false) die(`${f} must be sitemapExposed:false`);
  if (!Array.isArray(b.routes) || b.routes.length === 0) die(`${f} has no routes`);
  if (new Set(b.routes).size !== b.routes.length) die(`${f} has duplicate routes within the batch`);
  if (b.routeCount !== b.routes.length) die(`${f} routeCount ${b.routeCount} != ${b.routes.length}`);
  return {
    batchId: b.batchId, workId: b.workId, readerFamily: b.readerFamily,
    discoverable: false, sitemapExposed: false, routeCount: b.routes.length, routes: [...b.routes].sort(),
  };
});

// Cross-batch disjointness.
const seen = new Map();
for (const b of batches) for (const r of b.routes) {
  if (seen.has(r)) die(`route ${r} appears in both ${seen.get(r)} and ${b.batchId}`);
  seen.set(r, b.batchId);
}
const cumulativeRoutes = Array.from(seen.keys()).sort();

const out = {
  note: "Wave 6 P1–P3 CUMULATIVE direct-route manifest, composed from data/internal/wave6/batches/*.json. Authorized direct readers that are prerendered but intentionally ABSENT from sitemap/catalogue/discovery until Wave 6 P4 (not authorized). Generated; do not edit by hand — edit/add a per-batch manifest instead.",
  wave: 6,
  phase: "P1-P3",
  frozenBaselineRef: "data/internal/wave6/frozen-baseline.json",
  batches: batches.map((b) => ({ batchId: b.batchId, workId: b.workId, readerFamily: b.readerFamily, discoverable: b.discoverable, sitemapExposed: b.sitemapExposed, routeCount: b.routeCount })),
  cumulativeRouteCount: cumulativeRoutes.length,
  cumulativeRoutes,
};
const OUT = path.join(root, "data/internal/wave6/p3-routes.json");
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`build-wave6-p3-route-manifest — OK`);
console.log(`  ${batches.length} batch(es): ${batches.map((b) => b.batchId).join(", ")} · cumulative ${cumulativeRoutes.length} routes · discoverable=false · sitemapExposed=false`);
