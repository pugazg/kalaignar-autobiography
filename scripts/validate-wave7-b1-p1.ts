/**
 * Wave 7 Batch 1 (Cinema) — P1 HIDDEN-BOUNDARY validator, RECONCILED at P4. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave7-b1-p1.ts
 *
 * P1's historical claim was: vendoring the 3 cinema payloads changed NO public surface — catalogue 216,
 * Cinema Writing 7, /read 77/40, sitemap 3909/0, build 3918/3913, 0 new /cinema routes. Those numbers are
 * PRESERVED verbatim below as the frozen P1 boundary (P1_FROZEN); this validator does not weaken or delete
 * them. It is now PHASE-AWARE so it stays a live gate through publication:
 *   • before P4 (none of the 3 is a published LibraryWork) it proves the live surface still EQUALS the
 *     frozen P1 boundary exactly — the original P1 assertion, unchanged;
 *   • at/after P4 it proves the live surface equals the frozen P1 boundary PLUS this batch's recorded
 *     contribution (WAVE7_B1_CONTRIBUTION) and nothing more — i.e. the only delta since P1 is exactly the
 *     3 works this batch published. That is strictly STRONGER than the P1 snapshot, not a relaxation.
 * The payloads-present + P1 provenance hidden markers are checked as the frozen P1 record regardless of phase.
 */
import fs from "node:fs";
import path from "node:path";
import { publishedWorks, LIBRARY_WORKS } from "../data/library";
import { discoveryShelves, LIBRARY_COLLECTIONS, COLLECTION_IDS } from "../data/collections";
import { STORY_SLUGS } from "../data/stories";
import sitemap from "../app/sitemap";
import { WAVE7_B1_CONTRIBUTION } from "../lib/wave7-b1-contribution";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };

// ── FROZEN P1 boundary — the exact public surface at the P1 (pre-publication) tree. Preserved verbatim. ──
const P1_FROZEN = {
  catalogue: 216, cinemaWorks: 7, collections: 6,
  discovery: 77, visible: 40, cinemaDiscovery: 7,
  sitemap: 3909, sitemapDup: 0,
  build: { prerender: 3918, html: 3913 }, newCinemaRoutes: 0,
} as const;

const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave7/b1-cinema.json"), "utf8")) as { works: { slug: string; titleTa: string; kind: string }[] };
const slugs = manifest.works.map((w) => w.slug);
eq(slugs.length, 3, "manifest has exactly 3 Batch-1 works");

// ── Payloads present + P1 provenance hidden markers (frozen P1 record, phase-independent) ────────────────
for (const s of slugs) {
  let reader, prov;
  try { reader = JSON.parse(fs.readFileSync(path.join(root, "public/data/cinema", s, "reader.json"), "utf8")); } catch { fail.push(`${s}: reader.json failed to load`); checks++; continue; }
  try { prov = JSON.parse(fs.readFileSync(path.join(root, "public/data/cinema", s, "provenance.json"), "utf8")); } catch { fail.push(`${s}: provenance.json failed to load`); checks++; continue; }
  ok(!!reader && typeof reader === "object", `${s}: reader.json parses`);
  eq([prov.hidden?.discoverable, prov.hidden?.sitemapExposed, prov.hidden?.publicRoute], [false, false, false], `${s}: P1 provenance hidden markers preserved (frozen P1 record)`);
}

// ── Phase detection ──────────────────────────────────────────────────────────────────────────────────
const published = publishedWorks();
const publishedThisBatch = slugs.filter((s) => LIBRARY_WORKS.some((w) => (w.slug === s || w.id === s) && w.state === "published"));
const phase = publishedThisBatch.length === 0 ? "pre-P4" : "P4";
ok(publishedThisBatch.length === 0 || publishedThisBatch.length === 3, "phase is coherent: 0 (hidden) or all 3 (published) Batch-1 works are public");
const C = WAVE7_B1_CONTRIBUTION;
// Expected live surface = frozen P1 boundary + (this batch's contribution IF published).
const add = (base: number, delta: number) => base + (phase === "P4" ? delta : 0);
// Wave 7 Batches 2–4 later published 13 works + the arumbu-1978 collection on top of this batch. They
// touch only the GLOBAL totals (catalogue/collections/discovery/sitemap/build), never the Cinema shelf, so
// gAdd folds their contribution into the global assertions once that cohort is live — keeping this a live
// gate at the P4 tip without weakening any Batch-1 claim.
const w7bPublished = LIBRARY_WORKS.some((w) => w.slug === "arumbu" && w.state === "published");
const W7B = { works: 13, collections: 1, discovery: 11, sitemap: 225, build: 225 };
const gAdd = (base: number, b1delta: number, w7bDelta: number) => add(base, b1delta) + (w7bPublished ? w7bDelta : 0);

// ── Public surface: frozen P1 boundary (+ this batch's contribution once published) ──────────────────────
eq(published.length, gAdd(P1_FROZEN.catalogue, C.works, W7B.works), `catalogue == P1 ${P1_FROZEN.catalogue}${phase === "P4" ? ` + ${C.works}` : ""}${w7bPublished ? ` + ${W7B.works} (Wave-7 B2-B4)` : ""}`);
const byShelf: Record<string, number> = {};
for (const w of published) byShelf[w.shelf] = (byShelf[w.shelf] ?? 0) + 1;
eq(byShelf["cinema-writing"], add(P1_FROZEN.cinemaWorks, C.cinema), `Cinema Writing == P1 ${P1_FROZEN.cinemaWorks}${phase === "P4" ? ` + ${C.cinema}` : ""}`);
eq(LIBRARY_COLLECTIONS.length, gAdd(P1_FROZEN.collections, C.collections, W7B.collections), "public collections: unchanged by this cinema batch, +1 (arumbu-1978) once Wave-7 B2-B4 is live");
// Membership: hidden before P4, published (and NEVER a collection or a story slug) at P4.
for (const s of slugs) {
  const isWork = LIBRARY_WORKS.some((w) => w.slug === s || w.id === s);
  eq(isWork, phase === "P4", `${s}: LibraryWork membership matches phase (${phase})`);
  ok(!COLLECTION_IDS.includes(s), `${s} is never a public collection id`);
  ok(!(STORY_SLUGS as readonly string[]).includes(s), `${s} is never a story slug`);
}
const shelves = discoveryShelves();
eq(shelves.flatMap((x) => x.entries).length, gAdd(P1_FROZEN.discovery, C.discovery, W7B.discovery), `/read discovery == P1 ${P1_FROZEN.discovery}${phase === "P4" ? ` + ${C.discovery}` : ""}${w7bPublished ? ` + ${W7B.discovery} (Wave-7 B2-B4)` : ""}`);
eq(shelves.reduce((n, x) => n + Math.min(x.entries.length, 6), 0), P1_FROZEN.visible, "/read initially visible still 40 (cinema already over cap)");
eq(shelves.find((x) => x.shelf.id === "cinema-writing")!.entries.length, add(P1_FROZEN.cinemaDiscovery, C.cinema), `Cinema Writing discovery == P1 ${P1_FROZEN.cinemaDiscovery}${phase === "P4" ? ` + ${C.cinema}` : ""}`);

// ── Sitemap: P1 boundary (+ this batch's URLs once published) ────────────────────────────────────────
const urls = sitemap().map((e) => e.url);
eq(urls.length, gAdd(P1_FROZEN.sitemap, C.sitemap, W7B.sitemap), `sitemap == P1 ${P1_FROZEN.sitemap}${phase === "P4" ? ` + ${C.sitemap}` : ""}${w7bPublished ? ` + ${W7B.sitemap} (Wave-7 B2-B4)` : ""}`);
eq(urls.length - new Set(urls).size, P1_FROZEN.sitemapDup, "sitemap still 0 duplicates");
for (const s of slugs) {
  const exposed = urls.some((u) => u.includes(`/cinema/${s}`));
  eq(exposed, phase === "P4", `${s}: sitemap exposure matches phase (${phase})`);
}

// ── Build boundary: P1 totals (+ this batch's routes once published) ─────────────────────────────────────
const pm = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(pm)) {
  const keys = Object.keys((JSON.parse(fs.readFileSync(pm, "utf8")) as { routes: Record<string, unknown> }).routes);
  eq(keys.length, gAdd(P1_FROZEN.build.prerender, C.build, W7B.build), `build prerender routes == P1 ${P1_FROZEN.build.prerender}${phase === "P4" ? ` + ${C.build}` : ""}${w7bPublished ? ` + ${W7B.build} (Wave-7 B2-B4)` : ""}`);
  // At P1 there were 0 new /cinema routes; from P3 on the 133 exist. Assert the count matches the phase.
  const newCinema = keys.filter((k) => slugs.some((s) => k === `/cinema/${s}` || k.startsWith(`/cinema/${s}/`))).length;
  eq(newCinema, phase === "P4" ? C.build : P1_FROZEN.newCinemaRoutes, `new /cinema prerendered routes match phase (${phase})`);
  let html = 0; const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith(".html")) html++; } };
  try { walk(path.join(root, ".next/server/app")); } catch { /* */ }
  eq(html, gAdd(P1_FROZEN.build.html, C.build, W7B.build), `build .html == P1 ${P1_FROZEN.build.html}${phase === "P4" ? ` + ${C.build}` : ""}${w7bPublished ? ` + ${W7B.build} (Wave-7 B2-B4)` : ""}`);
} else {
  console.error("  · BUILD-boundary check SKIPPED — no .next/prerender-manifest.json (CI runs this after build).");
}

if (fail.length) {
  console.error(`\nwave7-b1-p1 — ${checks} checks, ${fail.length} FAILED (phase ${phase})\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b1-p1 — ${checks} checks, 0 failed (phase ${phase})`);
console.log(phase === "P4"
  ? `  frozen P1 boundary (216/7/77-40/3909/3918-3913) + Batch-1 (+${C.works} works, +${C.sitemap} routes)${w7bPublished ? ` + Wave-7 B2-B4 (+${W7B.works} works, +${W7B.sitemap} routes)` : ""} == the live surface; Cinema shelf shaped by Batch-1 alone`
  : `  frozen P1 boundary intact: catalogue 216 · Cinema 7 · /read 77/40 · sitemap 3909/0 · build 3918/3913 · 0 new /cinema routes`);
