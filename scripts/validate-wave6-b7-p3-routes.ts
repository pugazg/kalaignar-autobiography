/**
 * Wave 6 — Batch 7 P3 route/UI validator. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave6-b7-p3-routes.ts
 *
 * Proves the Batch-7 ROUTE LAYER, which is phase-invariant — it holds in the P3 tree (routes hidden)
 * and in the P4 tree (works published), so it stays green after P4 promotes the slugs:
 *   • the route helper equals the frozen P1 manifest (116 slugs);
 *   • 232 routes (reader + source per slug), unique, no missing / extra / duplicate;
 *   • both route families' generateStaticParams equal the dedup union STORY_SLUGS ∪ Batch-7 (same 154
 *     whether the 116 are unioned in at P3 or promoted into STORY_SLUGS at P4);
 *   • every payload loads and every reader (Tamil default) + provenance page renders without throwing;
 *   • the 232 reader+source routes are prerendered when a build tree is present.
 * Fail-closed: an unknown slug is not in the union, so the route returns notFound(). The PUBLISHED public
 * surface (catalogue/discovery/sitemap/build totals) is owned by scripts/validate-wave6-b7-p4-integration.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import StoryReader from "../components/StoryReader";
import StorySourceB7 from "../components/StorySourceB7";
import { STORY_SLUGS } from "../data/stories";
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
// PHASE-INVARIANT. At P3, STORY_SLUGS held 38 and the union added the 116; at P4 the 116 were promoted
// INTO STORY_SLUGS, so the Set-union is the same 154 either way. This validator therefore asserts the
// route set equals the dedup union — true in both trees — and never a hidden/published count that P4 flips.
const union = Array.from(new Set<string>([...(STORY_SLUGS as readonly string[]), ...WAVE6_B7_STORY_SLUGS]));
const rp = (readerParams() as { slug: string }[]).map((p) => p.slug);
const sp = (sourceParams() as { slug: string }[]).map((p) => p.slug);
eq(new Set(rp).size, rp.length, "reader generateStaticParams has no duplicate");
eq(new Set(sp).size, sp.length, "source generateStaticParams has no duplicate");
for (const s of b7) { ok(rp.includes(s), `reader route prerenders ${s}`); ok(sp.includes(s), `source route prerenders ${s}`); }
eq(uniqSorted(rp), uniqSorted(union), "reader params == dedup union of STORY_SLUGS ∪ Batch-7 slugs");
eq(uniqSorted(sp), uniqSorted(union), "source params == dedup union of STORY_SLUGS ∪ Batch-7 slugs");

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

// ── Build boundary — the 232 Batch-7 routes are prerendered (when a build tree is present) ───────────
// PHASE-INVARIANT: the reader+source routes exist from P3 onward, so this asserts their PRESENCE, never
// a global total (3913 at P3, 3918 at P4) — the P4 integration validator owns the published totals and
// the published public surface (catalogue/discovery/sitemap). See scripts/validate-wave6-b7-p4-integration.ts.
const pm = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(pm)) {
  const routeKeys = new Set(Object.keys((JSON.parse(fs.readFileSync(pm, "utf8")) as { routes: Record<string, unknown> }).routes));
  for (const s of b7) { ok(routeKeys.has(`/stories/${s}`), `${s}: reader route prerendered`); ok(routeKeys.has(`/stories/${s}/source`), `${s}: source route prerendered`); }
} else {
  console.error("  · BUILD-boundary check SKIPPED — no .next/prerender-manifest.json (CI runs this after build).");
}

if (fail.length) {
  console.error(`\nwave6-b7-p3-routes — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave6-b7-p3-routes — ${checks} checks, 0 failed`);
console.log(`  116 Batch-7 works · 232 direct routes (reader+source) derived from the manifest, fail-closed · every payload loads + renders`);
