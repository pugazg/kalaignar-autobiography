/**
 * Wave 7 combined Batches 2-4 — P1 HIDDEN-BOUNDARY validator. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave7-b2-b4-p1-hidden.ts
 *
 * Proves the 13 onboarded works (2 Drama + 5 Novels + 6 Essays) are vendored but change NO public surface:
 * catalogue stays 219, Drama 8, Fiction 157, Essays & Articles 9, Cinema Writing 10, /read 80/40, sitemap
 * 4042/0, and (when a build tree is present) build stays 4051 prerender / 4046 HTML with ZERO new B2-B4
 * routes. None of the 13 slugs is a LibraryWork, a public collection id, or a public URL.
 */
import fs from "node:fs";
import path from "node:path";
import { publishedWorks, LIBRARY_WORKS } from "../data/library";
import { discoveryShelves, LIBRARY_COLLECTIONS, COLLECTION_IDS } from "../data/collections";
import sitemap from "../app/sitemap";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };

const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave7/b2-b4-p1-manifest.json"), "utf8")) as { works: { slug: string; batch: number; shelf: string; payloadFile: string }[] };
const slugs = manifest.works.map((w) => w.slug);
eq(slugs.length, 13, "manifest enumerates exactly 13 works");
eq(new Set(slugs).size, 13, "the 13 slugs are unique");

// ── Payloads present + provenance marked hidden ──────────────────────────────────────────────────────
for (const w of manifest.works) {
  ok(fs.existsSync(path.join(root, w.payloadFile)), `${w.slug}: payload present (${w.payloadFile})`);
  const provPath = path.join(root, path.dirname(w.payloadFile), "provenance.json");
  ok(fs.existsSync(provPath), `${w.slug}: provenance present`);
  if (fs.existsSync(provPath)) {
    const prov = JSON.parse(fs.readFileSync(provPath, "utf8"));
    eq([prov.hidden?.discoverable, prov.hidden?.sitemapExposed, prov.hidden?.publicRoute], [false, false, false], `${w.slug}: provenance marked hidden`);
  }
}

// ── Public surface UNCHANGED (post-Batch-1 boundary) ────────────────────────────────────────────────
const works = publishedWorks();
eq(works.length, 219, "catalogue still 219 works");
const byShelf: Record<string, number> = {};
for (const w of works) byShelf[w.shelf] = (byShelf[w.shelf] ?? 0) + 1;
eq(byShelf["drama"], 8, "Drama shelf still 8");
eq(byShelf["fiction"], 157, "Fiction shelf still 157");
eq(byShelf["essays-articles"], 9, "Essays & Articles shelf still 9");
eq(byShelf["cinema-writing"], 10, "Cinema Writing shelf still 10");
for (const s of slugs) {
  ok(!LIBRARY_WORKS.some((w) => w.slug === s || w.id === s), `${s} is not a LibraryWork`);
  ok(!COLLECTION_IDS.includes(s), `${s} is not a public collection id`);
}
ok(!COLLECTION_IDS.includes("arumbu-1978"), "arumbu-1978 compilation is not a public collection at P1");
const shelves = discoveryShelves();
eq(shelves.flatMap((x) => x.entries).length, 80, "/read discovery still 80 entries");
eq(shelves.reduce((n, x) => n + Math.min(x.entries.length, 6), 0), 40, "/read initially visible still 40");
eq(LIBRARY_COLLECTIONS.length, 6, "public collections still 6");

// ── Sitemap UNCHANGED — no B2-B4 URL ────────────────────────────────────────────────────────────────
const urls = sitemap().map((e) => e.url);
eq(urls.length, 4042, "sitemap still 4042 URLs");
eq(urls.length - new Set(urls).size, 0, "sitemap still 0 duplicates");
const prefixOf = (shelf: string) => (shelf === "drama" ? "/plays/" : shelf === "fiction" ? "/stories/" : "/essays/");
for (const w of manifest.works) {
  const p1 = `/plays/${w.slug}`, p2 = `/novels/${w.slug}`, p3 = `/essays/${w.slug}`, p4 = `/stories/${w.slug}`;
  ok(!urls.some((u) => u.includes(p1) || u.includes(p2) || u.includes(p3) || u.includes(p4)), `${w.slug} not exposed in sitemap`);
}

// ── Build boundary — no new prerendered route; totals unchanged ─────────────────────────────────────
const pm = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(pm)) {
  const keys = Object.keys((JSON.parse(fs.readFileSync(pm, "utf8")) as { routes: Record<string, unknown> }).routes);
  eq(keys.length, 4051, "build prerender routes still 4051 (0 new)");
  for (const w of manifest.works) ok(!keys.some((k) => k.includes(`/${w.slug}`) && (k.startsWith("/plays/") || k.startsWith("/novels/") || k.startsWith("/essays/") || k.startsWith("/stories/"))), `${w.slug}: no new prerendered route`);
  let html = 0; const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith(".html")) html++; } };
  try { walk(path.join(root, ".next/server/app")); } catch { /* */ }
  eq(html, 4046, "build .html still 4046 (0 new)");
} else {
  console.error("  · BUILD-boundary check SKIPPED — no .next/prerender-manifest.json (CI runs this after build).");
}

if (fail.length) {
  console.error(`\nwave7-b2-b4-p1-hidden — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b2-b4-p1-hidden — ${checks} checks, 0 failed`);
console.log("  13 works vendored + hidden · catalogue 219 · Drama 8 · Fiction 157 · Essays 9 · Cinema 10 · /read 80/40 · sitemap 4042/0 · build 4051/4046 · 0 new B2-B4 routes");
