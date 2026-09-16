/**
 * Wave 6 — Batch 7 P3 route/UI validator. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave6-b7-p3-routes.ts
 *
 * Proves the 116 Batch-7 short stories are DIRECT-ADDRESSABLE but STILL HIDDEN:
 *   • the route helper equals the frozen P1 manifest (116 slugs);
 *   • 232 routes (reader + source per slug), unique, no missing / extra / duplicate;
 *   • both route families' generateStaticParams cover every Batch-7 slug (deduped with STORY_SLUGS);
 *   • every payload loads and every reader (Tamil default) + provenance page renders without throwing;
 *   • NOTHING leaked: no Batch-7 slug in STORY_SLUGS / LIBRARY_WORKS / LIBRARY_COLLECTIONS / sitemap;
 *   • the public boundary is unchanged (catalogue 100, collections 1, /read 64/39, Fiction 41, sitemap 3672/0);
 *   • the P3 build boundary is 3913 prerender / 3908 HTML when a build tree is present.
 * Fail-closed: an unknown slug is not in the union, so the route returns notFound().
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import StoryReader from "../components/StoryReader";
import StorySourceB7 from "../components/StorySourceB7";
import { STORY_SLUGS } from "../data/stories";
import { publishedWorks, LIBRARY_WORKS } from "../data/library";
import { discoveryShelves, LIBRARY_COLLECTIONS, COLLECTION_IDS } from "../data/collections";
import sitemap from "../app/sitemap";
import { WAVE6_B7_STORY_SLUGS } from "../lib/stories-wave6-routes";
import { generateStaticParams as readerParams } from "../app/stories/[slug]/page";
import { generateStaticParams as sourceParams } from "../app/stories/[slug]/source/page";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual ${JSON.stringify(a)}`); };
const uniqSorted = (a: string[]) => Array.from(new Set(a)).sort();
const hasTamil = (s: string) => /[஀-௿]/.test(s);

const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave6/b7-short-stories.json"), "utf8"));
const p3 = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave6/b7-p3-routes.json"), "utf8"));
const b7: string[] = manifest.groups.flatMap((g: { slugs: { slug: string }[] }) => g.slugs.map((s) => s.slug));

// ── Registry + route identity ───────────────────────────────────────────────────────────────────────
eq(uniqSorted([...WAVE6_B7_STORY_SLUGS]), uniqSorted(b7), "route helper WAVE6_B7_STORY_SLUGS == manifest 116 slugs");
eq(WAVE6_B7_STORY_SLUGS.length, 116, "route helper has 116 slugs");
eq(p3.workCount, 116, "P3 record workCount 116");
eq(uniqSorted(p3.workIds), uniqSorted(b7), "P3 record workIds == manifest 116");
const expectedRoutes = b7.flatMap((s) => [`/stories/${s}`, `/stories/${s}/source`]);
eq(p3.routeCount, 232, "P3 record routeCount 232");
eq(uniqSorted(p3.routes), uniqSorted(expectedRoutes), "P3 routes == exactly reader+source per slug");
eq(new Set(p3.routes).size, 232, "232 unique P3 routes (no duplicate)");
eq(p3.discoverable, false, "P3 discoverable=false");
eq(p3.sitemapExposed, false, "P3 sitemapExposed=false");
eq(p3.publicCollectionRoutes, 0, "P3 public collection routes 0");

// ── generateStaticParams coverage (both families cover every Batch-7 slug, deduped) ──────────────────
const rp = (readerParams() as { slug: string }[]).map((p) => p.slug);
const sp = (sourceParams() as { slug: string }[]).map((p) => p.slug);
eq(new Set(rp).size, rp.length, "reader generateStaticParams has no duplicate");
eq(new Set(sp).size, sp.length, "source generateStaticParams has no duplicate");
for (const s of b7) { ok(rp.includes(s), `reader route prerenders ${s}`); ok(sp.includes(s), `source route prerenders ${s}`); }
eq(rp.length, (STORY_SLUGS as readonly string[]).length + 116, "reader params == 38 published + 116 Batch-7 (deduped)");
eq(sp.length, (STORY_SLUGS as readonly string[]).length + 116, "source params == 38 published + 116 Batch-7 (deduped)");

// ── Payloads load + reader/provenance render ─────────────────────────────────────────────────────────
for (const slug of b7) {
  let story, prov;
  try { story = JSON.parse(fs.readFileSync(path.join(root, "public/data/stories", slug, "story.json"), "utf8")); } catch { fail.push(`${slug}: story.json failed to load`); checks++; continue; }
  try { prov = JSON.parse(fs.readFileSync(path.join(root, "public/data/stories", slug, "provenance.json"), "utf8")); } catch { fail.push(`${slug}: provenance.json failed to load`); checks++; continue; }
  let r = "", src = "";
  try { r = renderToStaticMarkup(createElement(LangProvider, null, createElement(StoryReader, { story }))); } catch (e) { fail.push(`${slug}: reader threw ${(e as Error).message}`); checks++; }
  try { src = renderToStaticMarkup(createElement(StorySourceB7, { slug, prov })); } catch (e) { fail.push(`${slug}: provenance threw ${(e as Error).message}`); checks++; }
  ok(hasTamil(r), `${slug}: reader shows literary Tamil on initial render`);
  ok(src.length > 0, `${slug}: provenance page renders`);
}

// ── Hidden boundary — nothing leaked into any public surface ─────────────────────────────────────────
for (const slug of b7) {
  ok(!(STORY_SLUGS as readonly string[]).includes(slug), `${slug} not in STORY_SLUGS`);
  ok(!LIBRARY_WORKS.some((w) => w.slug === slug || w.id === slug), `${slug} not a LibraryWork`);
  ok(!COLLECTION_IDS.includes(slug), `${slug} not a public collection id`);
}
eq(publishedWorks().length, 100, "catalogue still 100");
eq(LIBRARY_COLLECTIONS.length, 1, "public collections still 1");
const shelves = discoveryShelves();
eq(shelves.flatMap((s) => s.entries).length, 64, "/read discovery still 64");
eq(shelves.reduce((n, s) => n + Math.min(s.entries.length, 6), 0), 39, "initially visible still 39");
eq(shelves.find((s) => s.shelf.id === "fiction")!.works.length, 41, "Fiction shelf still 41");
const urls = sitemap().map((e) => e.url);
eq(urls.length, 3672, "sitemap still 3672");
eq(urls.length - new Set(urls).size, 0, "sitemap 0 duplicates");
for (const slug of b7) ok(!urls.some((u) => u.endsWith(`/stories/${slug}`) || u.includes(`/stories/${slug}/`)), `${slug} not in sitemap`);

// ── Build boundary (when a build tree is present) ────────────────────────────────────────────────────
const pm = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(pm)) {
  const routeKeys = Object.keys((JSON.parse(fs.readFileSync(pm, "utf8")) as { routes: Record<string, unknown> }).routes);
  eq(routeKeys.length, 3913, "build prerender routes == 3913 (baseline 3681 + 232)");
  for (const s of b7) { ok(routeKeys.includes(`/stories/${s}`), `${s}: reader route prerendered`); ok(routeKeys.includes(`/stories/${s}/source`), `${s}: source route prerendered`); }
  let html = 0; const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith(".html")) html++; } };
  try { walk(path.join(root, ".next/server/app")); } catch { /* */ }
  eq(html, 3908, "build .html == 3908 (baseline 3676 + 232)");
} else {
  console.error("  · BUILD-boundary check SKIPPED — no .next/prerender-manifest.json (CI runs this after build).");
}

if (fail.length) {
  console.error(`\nwave6-b7-p3-routes — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave6-b7-p3-routes — ${checks} checks, 0 failed`);
console.log(`  116 Batch-7 works · 232 direct routes (reader+source), still undiscovered · catalogue 100 · /read 64/39 · sitemap 3672/0 · build 3913/3908`);
