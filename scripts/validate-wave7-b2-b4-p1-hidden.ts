/**
 * Wave 7 Batches 2-4 — HIDDEN-BOUNDARY validator, STAGE-AWARE (reconciled across P1→P4). Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave7-b2-b4-p1-hidden.ts
 *
 * P1's historical claim — vendoring the 13 works changed NO public surface (catalogue 219, Drama 8,
 * Fiction 157, Essays 9, Cinema 10, /read 80/40, collections 6, sitemap 4042/0, build 4051/4046, 0 direct
 * B2-B4 routes) — is PRESERVED verbatim below as the frozen P1 boundary. This validator stays a live gate
 * through publication by being stage-aware:
 *   • before P3 (no direct routes built): live surface == frozen P1 boundary, build 4051/4046, 0 routes;
 *   • at P3 (routes prerendered, still hidden): surface still == frozen P1 boundary and the 13 works are
 *     absent from LIBRARY_WORKS / discovery / sitemap, but the build carries the recorded +224 direct
 *     routes (4275 / 4270) — the ONLY change from P1;
 *   • at P4 (published): the 13 works ARE LibraryWorks and their routes are in the sitemap; the exact
 *     published surface (catalogue 232 …) is owned by the P4 integration validator. Here we assert the
 *     publication FLIP and that catalogue grew by exactly the 13 works.
 * The P1 numbers are never weakened; the route reconciliation P1(0) → P3(+224) → P4(published) is explicit.
 */
import fs from "node:fs";
import path from "node:path";
import { publishedWorks, LIBRARY_WORKS } from "../data/library";
import { discoveryShelves, LIBRARY_COLLECTIONS } from "../data/collections";
import sitemap from "../app/sitemap";
// Later Wave-7 batch (B5a/B5b/B6/Kuraloviyam): its derived contribution is added ONLY once it is published.
import { WAVE7_B5_B6_K_CONTRIBUTION as W7K_ALL } from "../lib/wave7-b5-b6-k-contribution";
import { WAVE8_CONTRIBUTION as W8 } from "../lib/wave8-contribution";
const W7K = (LIBRARY_WORKS.some((w) => w.id === "kuraloviyam") ? W7K_ALL : { works: 0, collections: 0, discovery: 0, visible: 0, sitemap: 0, build: 0 });

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };

const P1_FROZEN = { catalogue: 219, drama: 8, fiction: 157, essays: 9, cinema: 10, discovery: 80, visible: 40, collections: 6, sitemap: 4042, sitemapDup: 0, build: { prerender: 4051, html: 4046 }, directRoutes: 0 };
const P3_ROUTES = 224; // recorded direct-route contribution (drama 83 + novels 62 + essays 79)

const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave7/b2-b4-p1-manifest.json"), "utf8")) as { works: { slug: string; batch: number; shelf: string; payloadFile: string }[] };
const slugs = manifest.works.map((w) => w.slug);
eq(slugs.length, 13, "manifest enumerates exactly 13 works");

// ── Payloads present + P1 provenance hidden markers (frozen P1 record, phase-independent) ────────────
for (const w of manifest.works) {
  ok(fs.existsSync(path.join(root, w.payloadFile)), `${w.slug}: payload present`);
  const provPath = path.join(root, path.dirname(w.payloadFile), "provenance.json");
  if (fs.existsSync(provPath)) { const prov = JSON.parse(fs.readFileSync(provPath, "utf8")); eq([prov.hidden?.discoverable, prov.hidden?.sitemapExposed, prov.hidden?.publicRoute], [false, false, false], `${w.slug}: P1 provenance hidden markers preserved`); }
}

// ── Phase detection ──────────────────────────────────────────────────────────────────────────────────
const libIds = new Set<string>((LIBRARY_WORKS as { id: string; slug: string }[]).flatMap((w) => [w.id, w.slug]));
const publishedCount = slugs.filter((s) => libIds.has(s)).length;
ok(publishedCount === 0 || publishedCount === 13, "publication is all-or-nothing for the 13-work cohort");
const routeFor = (w: { slug: string; shelf: string }) => (w.shelf === "drama" ? `/plays/${w.slug}` : w.shelf === "fiction" ? `/novels/${w.slug}` : `/essays/${w.slug}`);
const sm = (sitemap() as { url: string }[]).map((e) => e.url);
const inSitemap = manifest.works.filter((w) => sm.some((u) => u.endsWith(routeFor(w)))).length;
const phase = publishedCount === 13 ? "P4" : "pre-P4";

// ── Public surface ────────────────────────────────────────────────────────────────────────────────
const works = publishedWorks();
const byShelf: Record<string, number> = {};
for (const w of works) byShelf[w.shelf] = (byShelf[w.shelf] ?? 0) + 1;
if (phase === "pre-P4") {
  eq(works.length, P1_FROZEN.catalogue, "catalogue still 219 (hidden)");
  eq(byShelf["drama"], P1_FROZEN.drama, "Drama still 8");
  eq(byShelf["fiction"], P1_FROZEN.fiction, "Fiction still 157");
  eq(byShelf["essays-articles"], P1_FROZEN.essays, "Essays still 9");
  eq(byShelf["cinema-writing"], P1_FROZEN.cinema, "Cinema still 10");
  eq(LIBRARY_COLLECTIONS.length, P1_FROZEN.collections, "collections still 6");
  const shelves = discoveryShelves();
  eq(shelves.flatMap((x) => x.entries).length, P1_FROZEN.discovery, "/read discovery still 80");
  eq(shelves.reduce((n, x) => n + Math.min(x.entries.length, 6), 0), P1_FROZEN.visible, "/read visible still 40");
  for (const s of slugs) ok(!libIds.has(s), `${s}: absent from LIBRARY_WORKS`);
  eq(sm.length, P1_FROZEN.sitemap, "sitemap still 4042");
  eq(sm.length - new Set(sm).size, P1_FROZEN.sitemapDup, "sitemap 0 duplicates");
  eq(inSitemap, 0, "no B2-B4 landing exposed in the sitemap");
} else {
  // P4: publication flip — exact published surface owned by the P4 integration validator.
  eq(works.length, P1_FROZEN.catalogue + 13 + W7K.works, "catalogue grew by exactly the 13 works (232) — plus the later Wave-7 B5/B6/K 101 once published");
  for (const s of slugs) ok(libIds.has(s), `${s}: now a published LibraryWork`);
  eq(inSitemap, 13, "all 13 B2-B4 landings now in the sitemap");
  ok(sm.length >= P1_FROZEN.sitemap + P3_ROUTES, "sitemap grew by at least the 224 direct routes");
}

// ── Build boundary — stage-aware route reconciliation P1(0) → P3(+224) → P4(+224) ────────────────────
const pm = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(pm)) {
  const keys = Object.keys((JSON.parse(fs.readFileSync(pm, "utf8")) as { routes: Record<string, unknown> }).routes);
  const directBuilt = manifest.works.filter((w) => keys.includes(routeFor(w))).length; // landings prerendered
  const routesBuilt = directBuilt === 13; // all 13 direct route families present ⇒ P3 or later
  const expectedNew = routesBuilt ? P3_ROUTES : P1_FROZEN.directRoutes;
  // At P4 publication introduces exactly one collection landing (/collections/arumbu-1978); pre-P4 none.
  const collectionRoutes = phase === "P4" && keys.includes("/collections/arumbu-1978") ? 1 : 0;
  // Count the actual wave7 direct routes present.
  let wave7Routes = 0;
  for (const w of manifest.works) { const base = routeFor(w); wave7Routes += keys.filter((k) => k === base || k.startsWith(`${base}/`)).length; }
  eq(wave7Routes, expectedNew, `direct B2-B4 routes in build == ${expectedNew} (${routesBuilt ? "P3/P4" : "P1/P2"})`);
  eq(keys.length, P1_FROZEN.build.prerender + expectedNew + collectionRoutes + W7K.build + W8.build, `build prerender == 4051${expectedNew ? ` + ${expectedNew}` : ""}${collectionRoutes ? ` + ${collectionRoutes} (arumbu-1978 route)` : ""}`);
  let html = 0; const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith(".html")) html++; } };
  try { walk(path.join(root, ".next/server/app")); } catch { /* */ }
  eq(html, P1_FROZEN.build.html + expectedNew + collectionRoutes + W7K.build + W8.build, `build .html == 4046${expectedNew ? ` + ${expectedNew}` : ""}${collectionRoutes ? ` + ${collectionRoutes}` : ""}`);
} else {
  console.error("  · BUILD-boundary check SKIPPED — no .next/prerender-manifest.json (CI runs this after build).");
}

if (fail.length) {
  console.error(`\nwave7-b2-b4-p1-hidden — ${checks} checks, ${fail.length} FAILED (phase ${phase})\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b2-b4-p1-hidden — ${checks} checks, 0 failed (phase ${phase})`);
console.log(phase === "pre-P4"
  ? "  frozen P1 boundary intact: catalogue 219 · Drama 8 · Fiction 157 · Essays 9 · Cinema 10 · /read 80/40 · collections 6 · sitemap 4042/0 · direct routes stage-aware (0 pre-P3 / 224 at P3)"
  : "  P4 publication flip: 13 works published (catalogue 232), 224 direct routes now in the sitemap; exact P4 surface owned by the P4 integration validator");
