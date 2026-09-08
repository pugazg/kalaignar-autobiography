#!/usr/bin/env node
// Wave 6 P1–P3 cumulative direct-route manifest generator.
//
//   node scripts/build-wave6-p3-route-manifest.mjs
//
// Emits data/internal/wave6/p3-routes.json — the authoritative, Wave-6-OWNED registry of every
// authorized-but-undiscovered direct reader route added by the Wave 6 P1–P3 batches. It is generated
// from the vendored, released reader payloads (public/data/cinema/<slug>/reader.json, etc.), never a
// hand-guessed list, so it cannot drift from what the readers actually serve. Each batch is
// `discoverable: false` / `sitemapExposed: false` until Wave 6 P4 (not authorized). Later batches extend
// the BATCHES array below; the Wave-6 P3 build validator derives the whole-build delta from this file
// plus the frozen pre-Wave-6 baseline — so the Wave-5 P4 A7 gate never has to change again.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

// ── Batch registry (extended per authorized batch) ─────────────────────────────
// Each spec derives its exact route list from the released payload via `routesOf`.
const BATCHES = [
  {
    batchId: "b1-cinema-ammaiyappan",
    workId: "ammaiyappan",
    readerFamily: "cinema-scene",
    payload: "public/data/cinema/ammaiyappan/reader.json",
    routesOf: (r) => [
      "/cinema/ammaiyappan",
      "/cinema/ammaiyappan/source",
      ...r.screenplayScenes.map((s) => `/cinema/ammaiyappan/scene-${String(s.archivalSceneOrdinal).padStart(3, "0")}`),
    ],
  },
];

const batches = BATCHES.map((b) => {
  const reader = readJSON(b.payload);
  const routes = b.routesOf(reader);
  const uniq = Array.from(new Set(routes));
  if (uniq.length !== routes.length) { console.error(`build-wave6-p3-route-manifest: duplicate route within ${b.batchId}`); process.exit(1); }
  return {
    batchId: b.batchId,
    workId: b.workId,
    readerFamily: b.readerFamily,
    discoverable: false,
    sitemapExposed: false,
    routeCount: routes.length,
    routes: [...routes].sort(),
  };
});

const cumulativeRoutes = Array.from(new Set(batches.flatMap((b) => b.routes))).sort();
if (cumulativeRoutes.length !== batches.reduce((n, b) => n + b.routeCount, 0)) {
  console.error("build-wave6-p3-route-manifest: cross-batch duplicate route"); process.exit(1);
}

const out = {
  note: "Wave 6 P1–P3 cumulative direct-route manifest. Authorized direct readers that are prerendered in the build but intentionally ABSENT from sitemap/catalogue/discovery until Wave 6 P4 (not authorized). Generated from released payloads; do not edit by hand.",
  wave: 6,
  phase: "P1-P3",
  frozenBaseline: {
    implementationBaselineCommit: "632476baa40ebbe94083ec41a6c8f4a26dfec77c",
    prerenderManifestRouteCount: 3360,
    htmlFileCount: 3355,
    sitemapUrls: 3351,
    sitemapCinemaRoutes: 346,
    catalogueWorks: 78,
    publicCollections: 1,
  },
  batches,
  cumulativeRouteCount: cumulativeRoutes.length,
  cumulativeRoutes,
};

const OUT = path.join(root, "data/internal/wave6/p3-routes.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`build-wave6-p3-route-manifest — OK`);
console.log(`  ${batches.length} batch(es) · cumulative ${cumulativeRoutes.length} direct routes · discoverable=false · sitemapExposed=false`);
