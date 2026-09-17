/**
 * Wave 7 Batch 1 (Cinema) — P1 HIDDEN-BOUNDARY validator. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave7-b1-p1.ts
 *
 * Proves the 3 Batch-1 cinema payloads are vendored but change NO public surface: catalogue stays 216,
 * Cinema Writing stays 7, /read stays 77/40, sitemap stays 3909/0, none of the 3 slugs is a LibraryWork
 * or a public URL, and (when a build tree is present) no /cinema/<new> route is prerendered and the build
 * totals are unchanged (3918 prerender / 3913 HTML). Also proves each vendored payload + provenance loads
 * and is marked hidden. The published public surface is unchanged from the pre-P1 boundary.
 */
import fs from "node:fs";
import path from "node:path";
import { publishedWorks, LIBRARY_WORKS } from "../data/library";
import { discoveryShelves, LIBRARY_COLLECTIONS, COLLECTION_IDS } from "../data/collections";
import { STORY_SLUGS } from "../data/stories";
import sitemap from "../app/sitemap";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };

const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave7/b1-cinema.json"), "utf8")) as { works: { slug: string; titleTa: string; kind: string }[] };
const slugs = manifest.works.map((w) => w.slug);
eq(slugs.length, 3, "manifest has exactly 3 Batch-1 works");

// ── Payloads present + hidden ────────────────────────────────────────────────────────────────────────
for (const s of slugs) {
  let reader, prov;
  try { reader = JSON.parse(fs.readFileSync(path.join(root, "public/data/cinema", s, "reader.json"), "utf8")); } catch { fail.push(`${s}: reader.json failed to load`); checks++; continue; }
  try { prov = JSON.parse(fs.readFileSync(path.join(root, "public/data/cinema", s, "provenance.json"), "utf8")); } catch { fail.push(`${s}: provenance.json failed to load`); checks++; continue; }
  ok(!!reader && typeof reader === "object", `${s}: reader.json parses`);
  eq([prov.hidden?.discoverable, prov.hidden?.sitemapExposed, prov.hidden?.publicRoute], [false, false, false], `${s}: provenance marked hidden`);
}

// ── Public surface UNCHANGED (pre-P1 boundary) ─────────────────────────────────────────────────────────
const works = publishedWorks();
eq(works.length, 216, "catalogue still 216 works");
const byShelf: Record<string, number> = {};
for (const w of works) byShelf[w.shelf] = (byShelf[w.shelf] ?? 0) + 1;
eq(byShelf["cinema-writing"], 7, "Cinema Writing shelf still 7 works");
for (const s of slugs) {
  ok(!LIBRARY_WORKS.some((w) => w.slug === s || w.id === s), `${s} is not a LibraryWork`);
  ok(!COLLECTION_IDS.includes(s), `${s} is not a public collection id`);
  ok(!(STORY_SLUGS as readonly string[]).includes(s), `${s} is not a story slug`);
}
eq(LIBRARY_COLLECTIONS.length, 6, "public collections still 6");
const shelves = discoveryShelves();
eq(shelves.flatMap((x) => x.entries).length, 77, "/read discovery still 77 entries");
eq(shelves.reduce((n, x) => n + Math.min(x.entries.length, 6), 0), 40, "/read initially visible still 40");
eq(shelves.find((x) => x.shelf.id === "cinema-writing")!.entries.length, 7, "Cinema Writing discovery still 7 entries");

// ── Sitemap UNCHANGED — no Batch-1 cinema URL ──────────────────────────────────────────────────────────
const urls = sitemap().map((e) => e.url);
eq(urls.length, 3909, "sitemap still 3909 URLs");
eq(urls.length - new Set(urls).size, 0, "sitemap still 0 duplicates");
for (const s of slugs) ok(!urls.some((u) => u.includes(`/cinema/${s}`)), `${s} not exposed in sitemap`);

// ── Build boundary — no new prerendered route; totals unchanged ────────────────────────────────────────
const pm = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(pm)) {
  const keys = Object.keys((JSON.parse(fs.readFileSync(pm, "utf8")) as { routes: Record<string, unknown> }).routes);
  eq(keys.length, 3918, "build prerender routes still 3918 (0 new)");
  for (const s of slugs) ok(!keys.some((k) => k === `/cinema/${s}` || k.startsWith(`/cinema/${s}/`)), `${s}: no prerendered /cinema route`);
  let html = 0; const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith(".html")) html++; } };
  try { walk(path.join(root, ".next/server/app")); } catch { /* */ }
  eq(html, 3913, "build .html still 3913 (0 new)");
} else {
  console.error("  · BUILD-boundary check SKIPPED — no .next/prerender-manifest.json (CI runs this after build).");
}

if (fail.length) {
  console.error(`\nwave7-b1-p1 — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b1-p1 — ${checks} checks, 0 failed`);
console.log(`  3 cinema payloads vendored + hidden · catalogue 216 · Cinema 7 · /read 77/40 · sitemap 3909/0 · build 3918/3913 · 0 new public routes`);
