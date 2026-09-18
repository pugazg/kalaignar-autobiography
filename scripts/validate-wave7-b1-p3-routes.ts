/**
 * Wave 7 — Batch 1 P3 route validator. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave7-b1-p3-routes.ts
 *
 * Proves the Batch-1 cinema ROUTE LAYER without publishing the works:
 *   • the P3 route manifest equals an INDEPENDENT re-derivation of the route set from the raw vendored
 *     payloads (this validator computes the section-slug scheme itself; it does not call the manifest
 *     generator), so a hand-edited manifest or a drifted slug scheme fails here;
 *   • each work's [section] generateStaticParams emits EXACTLY its manifest section slugs, and each page
 *     module exports dynamicParams === false (fail-closed: an unknown section is a hard 404, never
 *     rendered on demand);
 *   • 133 total routes (landing + per-scene section + source), unique, no missing / extra / duplicate;
 *   • the three works stay HIDDEN: none appears in LIBRARY_WORKS, in the /read discovery shelves, or as a
 *     sitemap URL — the public boundary is unchanged at P3;
 *   • the build boundary (routes prerendered) is checked when a build tree is present.
 * The PUBLISHED public surface (catalogue 219 / Cinema 10 / sitemap deltas) is owned by the P4 integration
 * validator. Reads only the vendored payloads + app source — no network.
 */
import fs from "node:fs";
import path from "node:path";
import { loadWave7Cinema, WAVE7_CINEMA_SLUGS, type Wave7CinemaSlug } from "../data/wave7-cinema";
import { LIBRARY_WORKS } from "../data/library";
import { discoveryShelves } from "../data/collections";
import sitemap from "../app/sitemap";
// Static route-module imports (top-level await is unavailable under the app tsconfig). Importing each
// module also proves it evaluates without throwing.
import { generateStaticParams as maruSections, dynamicParams as maruDyn } from "../app/cinema/maruthanattu-ilavarasi/[section]/page";
import { generateStaticParams as vandiSections, dynamicParams as vandiDyn } from "../app/cinema/vandikkaran-magan/[section]/page";
import { generateStaticParams as naamSections, dynamicParams as naamDyn } from "../app/cinema/naam/[section]/page";
import "../app/cinema/maruthanattu-ilavarasi/page";
import "../app/cinema/maruthanattu-ilavarasi/source/page";
import "../app/cinema/vandikkaran-magan/page";
import "../app/cinema/vandikkaran-magan/source/page";
import "../app/cinema/naam/page";
import "../app/cinema/naam/source/page";

const SECTION_MOD: Record<Wave7CinemaSlug, { params: () => { section: string }[]; dyn: unknown }> = {
  "maruthanattu-ilavarasi": { params: maruSections as () => { section: string }[], dyn: maruDyn },
  "vandikkaran-magan": { params: vandiSections as () => { section: string }[], dyn: vandiDyn },
  naam: { params: naamSections as () => { section: string }[], dyn: naamDyn },
};

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual ${JSON.stringify(a)}`); };
const uniqSorted = (a: string[]) => Array.from(new Set(a)).sort();

// Per-work adapter facts needed to re-derive the slug scheme INDEPENDENTLY of data/wave7-cinema.ts.
const IND: Record<Wave7CinemaSlug, { arrayKey: string; prefix: string; ordinal: (s: any, i: number) => number }> = {
  "maruthanattu-ilavarasi": { arrayKey: "segments", prefix: "segment", ordinal: (s, i) => (typeof s.derivative_ordinal === "number" ? s.derivative_ordinal : i + 1) },
  "vandikkaran-magan": { arrayKey: "screenplay_scenes", prefix: "scene", ordinal: (s, i) => (typeof s.archival_scene_ordinal === "number" ? s.archival_scene_ordinal : i + 1) },
  naam: { arrayKey: "scenes", prefix: "scene", ordinal: (s, i) => (typeof s.source_scene_number === "number" ? s.source_scene_number : i + 1) },
};
const pad = (n: number) => String(n).padStart(3, "0");

// INDEPENDENT re-derivation of each work's routes straight from the raw payload.
function independentRoutes(slug: Wave7CinemaSlug): string[] {
  const raw = JSON.parse(fs.readFileSync(path.join(root, "public/data/cinema", slug, "reader.json"), "utf8"));
  const a = IND[slug];
  const arr = raw[a.arrayKey] as any[];
  const sections = arr.map((s, i) => `${a.prefix}-${pad(a.ordinal(s, i))}`);
  return [`/cinema/${slug}`, ...sections.map((s) => `/cinema/${slug}/${s}`), `/cinema/${slug}/source`];
}

const p3 = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave7/b1-p3-routes.json"), "utf8"));
eq(p3.workCount, 3, "P3 record workCount 3");
eq(p3.discoverable, false, "P3 discoverable=false");
eq(p3.sitemapExposed, false, "P3 sitemapExposed=false");
eq(uniqSorted(p3.works.map((w: any) => w.slug)), uniqSorted([...WAVE7_CINEMA_SLUGS]), "P3 record works == 3-work roster");

const expectedByWork: Record<string, string[]> = {};
let expectedTotal: string[] = [];
for (const slug of WAVE7_CINEMA_SLUGS) {
  const ind = independentRoutes(slug);
  expectedByWork[slug] = ind;
  expectedTotal = expectedTotal.concat(ind);
  const rec = p3.works.find((w: any) => w.slug === slug);
  ok(!!rec, `${slug}: present in P3 manifest`);
  if (rec) {
    eq(uniqSorted(rec.routes), uniqSorted(ind), `${slug}: manifest routes == independent re-derivation`);
    eq(rec.routeCount, ind.length, `${slug}: manifest routeCount == derived (${ind.length})`);
    eq(rec.sectionRouteCount, ind.length - 2, `${slug}: section route count == scenes`);
    ok(rec.routes.every((r: string) => r.startsWith(`/cinema/${slug}`)), `${slug}: all routes under /cinema/${slug}`);
  }
}
eq(p3.totalRouteCount, expectedTotal.length, `P3 total route count == derived ${expectedTotal.length}`);
eq(new Set(expectedTotal).size, expectedTotal.length, "P3 routes globally unique");
// Expected split: maruthanattu 12, vandikkaran 74, naam 47 → 133.
eq(expectedTotal.length, 133, "P3 adds exactly 133 direct cinema routes");

// Recorded build delta: each route is one static page, so both build totals grow by exactly 133 over the
// P1 hidden-boundary baseline (3918 / 3913 → 4051 / 4046). The build tree, when present, is checked below.
eq(p3.buildDelta.added, 133, "P3 build delta records +133 pages");
eq(p3.buildDelta.baseline, { prerenderRoutes: 3918, html: 3913 }, "P3 build delta baseline == P1 boundary");
eq(p3.buildDelta.afterP3, { prerenderRoutes: 4051, html: 4046 }, "P3 build delta after == 4051 / 4046");

// ── generateStaticParams + fail-closed, per work ─────────────────────────────────────────────────────
for (const slug of WAVE7_CINEMA_SLUGS) {
  const mod = SECTION_MOD[slug];
  eq(mod.dyn, false, `${slug}: [section] page exports dynamicParams=false (fail-closed)`);
  const params = mod.params().map((p) => p.section);
  eq(new Set(params).size, params.length, `${slug}: generateStaticParams has no duplicate`);
  const expectedSections = expectedByWork[slug].filter((r) => r !== `/cinema/${slug}` && r !== `/cinema/${slug}/source`).map((r) => r.split("/").pop()!);
  eq(uniqSorted(params), uniqSorted(expectedSections), `${slug}: [section] params == derived section slugs`);
  // an unknown section is not emitted → with dynamicParams=false it is a hard 404.
  ok(!params.includes("segment-999") && !params.includes("scene-999"), `${slug}: no out-of-range section emitted`);
  ok(!!loadWave7Cinema(slug), `${slug}: payload loads for the route`);
}

// ── Still hidden — public boundary unchanged at P3 ───────────────────────────────────────────────────
const libIds = new Set<string>((LIBRARY_WORKS as any[]).flatMap((w) => [w.id, w.slug, w.href].filter(Boolean)));
for (const slug of WAVE7_CINEMA_SLUGS) {
  ok(!libIds.has(slug) && !libIds.has(`/cinema/${slug}`), `${slug}: absent from LIBRARY_WORKS`);
}
const shelfText = JSON.stringify(discoveryShelves());
for (const slug of WAVE7_CINEMA_SLUGS) ok(!shelfText.includes(`/cinema/${slug}`), `${slug}: absent from /read discovery shelves`);
const sm = (sitemap() as { url: string }[]).map((e) => e.url);
for (const r of expectedTotal) ok(!sm.some((u) => u.endsWith(r)), `sitemap does NOT expose ${r}`);
for (const slug of WAVE7_CINEMA_SLUGS) ok(!sm.some((u) => u.includes(`/cinema/${slug}`)), `${slug}: no sitemap URL mentions it`);

// ── Build boundary — routes prerendered when a build tree is present ─────────────────────────────────
const pm = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(pm)) {
  const routeKeys = new Set(Object.keys((JSON.parse(fs.readFileSync(pm, "utf8")) as { routes: Record<string, unknown> }).routes));
  for (const r of expectedTotal) ok(routeKeys.has(r), `route prerendered: ${r}`);
  eq(routeKeys.size, p3.buildDelta.afterP3.prerenderRoutes, `build prerender total == recorded afterP3 (${p3.buildDelta.afterP3.prerenderRoutes})`);
} else {
  console.error("  · BUILD-boundary check SKIPPED — no .next/prerender-manifest.json (CI runs this after build).");
}

if (fail.length) {
  console.error(`\nwave7-b1-p3-routes — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b1-p3-routes — ${checks} checks, 0 failed`);
console.log("  3 cinema works · 133 direct routes (landing + per-scene section + source) re-derived independently == manifest · generateStaticParams fail-closed (dynamicParams=false) · still absent from LIBRARY_WORKS / discovery / sitemap");
