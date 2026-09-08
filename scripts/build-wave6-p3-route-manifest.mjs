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
  for (const k of ["batchId", "workIds", "collectionIds", "readerFamily", "routes"]) if (b[k] === undefined) die(`${f} missing ${k}`);
  if (b.workId !== undefined) die(`${f} uses the retired singular workId; use workIds:[...] and collectionIds:[...]`);
  if (b.discoverable !== false) die(`${f} must be discoverable:false`);
  if (b.sitemapExposed !== false) die(`${f} must be sitemapExposed:false`);
  // A batch may onboard many works and/or collections at once, but the identity arrays must be well-formed:
  // workIds is a non-empty string[] (every implementation batch releases at least one direct reader work);
  // collectionIds is a string[] (possibly empty — Batch 1 registers no collection).
  if (!Array.isArray(b.workIds) || b.workIds.length === 0 || !b.workIds.every((w) => typeof w === "string" && w.length > 0)) die(`${f} workIds must be a non-empty array of non-empty strings`);
  if (new Set(b.workIds).size !== b.workIds.length) die(`${f} has duplicate workId within the batch`);
  if (!Array.isArray(b.collectionIds) || !b.collectionIds.every((c) => typeof c === "string" && c.length > 0)) die(`${f} collectionIds must be an array of non-empty strings`);
  if (new Set(b.collectionIds).size !== b.collectionIds.length) die(`${f} has duplicate collectionId within the batch`);
  if (!Array.isArray(b.routes) || b.routes.length === 0) die(`${f} has no routes`);
  if (new Set(b.routes).size !== b.routes.length) die(`${f} has duplicate routes within the batch`);
  if (b.routeCount !== b.routes.length) die(`${f} routeCount ${b.routeCount} != ${b.routes.length}`);
  return {
    batchId: b.batchId, workIds: [...b.workIds], collectionIds: [...b.collectionIds], readerFamily: b.readerFamily,
    discoverable: false, sitemapExposed: false, routeCount: b.routes.length, routes: [...b.routes].sort(),
  };
});

// Cross-batch disjointness of routes, workIds and collectionIds — no identity or route may recur.
const seen = new Map();
for (const b of batches) for (const r of b.routes) {
  if (seen.has(r)) die(`route ${r} appears in both ${seen.get(r)} and ${b.batchId}`);
  seen.set(r, b.batchId);
}
const cumulativeRoutes = Array.from(seen.keys()).sort();
const seenWork = new Map();
for (const b of batches) for (const w of b.workIds) {
  if (seenWork.has(w)) die(`workId ${w} appears in both ${seenWork.get(w)} and ${b.batchId}`);
  seenWork.set(w, b.batchId);
}
const seenColl = new Map();
for (const b of batches) for (const c of b.collectionIds) {
  if (seenColl.has(c)) die(`collectionId ${c} appears in both ${seenColl.get(c)} and ${b.batchId}`);
  seenColl.set(c, b.batchId);
}

const out = {
  note: "Wave 6 P1–P3 CUMULATIVE direct-route manifest, composed from data/internal/wave6/batches/*.json. Authorized direct readers that are prerendered but intentionally ABSENT from sitemap/catalogue/discovery until Wave 6 P4 (not authorized). Generated; do not edit by hand — edit/add a per-batch manifest instead.",
  wave: 6,
  phase: "P1-P3",
  frozenBaselineRef: "data/internal/wave6/frozen-baseline.json",
  batches: batches.map((b) => ({ batchId: b.batchId, workIds: [...b.workIds].sort(), collectionIds: [...b.collectionIds].sort(), readerFamily: b.readerFamily, discoverable: b.discoverable, sitemapExposed: b.sitemapExposed, routeCount: b.routeCount })),
  cumulativeRouteCount: cumulativeRoutes.length,
  cumulativeRoutes,
};
const OUT = path.join(root, "data/internal/wave6/p3-routes.json");
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`build-wave6-p3-route-manifest — OK`);
console.log(`  ${batches.length} batch(es): ${batches.map((b) => b.batchId).join(", ")} · cumulative ${cumulativeRoutes.length} routes · discoverable=false · sitemapExposed=false`);
