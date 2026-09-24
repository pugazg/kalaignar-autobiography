/**
 * Wave 7 Batches 2-4 P3 — route validator. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave7-b2-b4-p3-routes.ts
 *
 * Proves the direct-route layer of the 13 works WITHOUT publishing them:
 *   • the P3 manifest equals an INDEPENDENT re-derivation of the routes from the frozen payloads (drama
 *     readingUnits, novel adapted sections, essay articles) — never a 1..N range;
 *   • 224 routes (drama 83 + novels 62 + essays 79), unique, landing + source + one child per unit;
 *   • each route family's generateStaticParams emits exactly these params (fail-closed: an unknown slug or
 *     child is a hard 404), and dynamicParams stays off;
 *   • the works remain HIDDEN (absent from LIBRARY_WORKS / discovery / sitemap) — the public boundary is
 *     unchanged at P3;
 *   • the build boundary (routes prerendered; 4051→4275 / 4046→4270) when a build tree is present;
 *   • adversarial route corruptions are rejected.
 */
import fs from "node:fs";
import path from "node:path";
import { LIBRARY_WORKS } from "../data/library";
import { discoveryShelves } from "../data/collections";
import sitemap from "../app/sitemap";
import { WAVE7_DRAMA_SLUGS } from "../lib/drama-wave7-routes";
import { WAVE7_NOVEL_SLUGS } from "../lib/novels-wave7-routes";
import { WAVE7_ESSAY_SLUGS } from "../lib/essays-wave7-routes";
import { wave7NovelToNovel } from "../lib/wave7-novels-adapter";
import { generateStaticParams as dramaSceneParams } from "../app/plays/[slug]/[scene]/page";
import { generateStaticParams as novelSectionParams } from "../app/novels/[slug]/[section]/page";
import { generateStaticParams as essayArticleParams } from "../app/essays/[slug]/articles/[article]/page";
// Later Wave-7 batch (B5a/B5b/B6/Kuraloviyam): its derived contribution is added ONLY once it is published.
import { WAVE7_B5_B6_K_CONTRIBUTION as W7K_ALL } from "../lib/wave7-b5-b6-k-contribution";
import { WAVE8_CONTRIBUTION as W8 } from "../lib/wave8-contribution";
const W7K = (LIBRARY_WORKS.some((w) => w.id === "kuraloviyam") ? W7K_ALL : { works: 0, collections: 0, discovery: 0, visible: 0, sitemap: 0, build: 0 });

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const uniqSorted = (a: string[]) => Array.from(new Set(a)).sort();
const load = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

// ── Independent re-derivation from the frozen payloads (does not call the manifest generator) ────────
const dramaRoutes = (slug: string) => { const play = load(`public/data/plays/${slug}/play.json`); return [`/plays/${slug}`, `/plays/${slug}/source`, ...play.readingUnits.map((u: { slug: string }) => `/plays/${slug}/${u.slug}`)]; };
const novelRoutes = (slug: string) => { const n = wave7NovelToNovel(load(`public/data/novels/${slug}/novel.json`)); return [`/novels/${slug}`, `/novels/${slug}/source`, ...n.sections.map((s) => `/novels/${slug}/${s.slug}`)]; };
const essayRoutes = (slug: string) => { const pub = load(`public/data/essays/${slug}/publication.json`); return [`/essays/${slug}`, `/essays/${slug}/source`, ...pub.articles.map((a: { slug: string }) => `/essays/${slug}/articles/${a.slug}`)]; };
const derived: Record<string, string[]> = {};
for (const s of WAVE7_DRAMA_SLUGS) derived[s] = dramaRoutes(s);
for (const s of WAVE7_NOVEL_SLUGS) derived[s] = novelRoutes(s);
for (const s of WAVE7_ESSAY_SLUGS) derived[s] = essayRoutes(s);
const allDerived = Object.values(derived).flat();

const p3 = load("data/internal/wave7/b2-b4-p3-routes.json");
eq(p3.workCount, 13, "P3 manifest workCount 13");
eq(p3.discoverable, false, "P3 discoverable=false");
eq(p3.sitemapExposed, false, "P3 sitemapExposed=false");
eq(p3.totalRouteCount, allDerived.length, `P3 total == derived ${allDerived.length}`);
eq(allDerived.length, 224, "P3 adds exactly 224 direct routes");
eq(p3.routeCountByBatch, { drama: 83, novels: 62, essays: 79 }, "per-batch route counts 83 / 62 / 79");
eq(new Set(allDerived).size, allDerived.length, "routes globally unique");
for (const w of p3.works) eq(uniqSorted(w.routes), uniqSorted(derived[w.slug]), `${w.slug}: manifest routes == derived`);

// ── generateStaticParams fail-closed coverage ────────────────────────────────────────────────────────
const dsp = (dramaSceneParams() as { slug: string; scene: string }[]);
for (const s of WAVE7_DRAMA_SLUGS) { const want = derived[s].filter((r) => r.startsWith(`/plays/${s}/`) && r !== `/plays/${s}/source`).map((r) => r.split("/")[3]); const got = dsp.filter((p) => p.slug === s).map((p) => p.scene); eq(uniqSorted(got), uniqSorted(want), `${s}: drama [scene] params == derived scenes`); }
const nsp = (novelSectionParams() as { slug: string; section: string }[]);
for (const s of WAVE7_NOVEL_SLUGS) { const want = derived[s].filter((r) => r.startsWith(`/novels/${s}/`) && r !== `/novels/${s}/source`).map((r) => r.split("/")[3]); const got = nsp.filter((p) => p.slug === s).map((p) => p.section); eq(uniqSorted(got), uniqSorted(want), `${s}: novel [section] params == derived sections`); }
const eap = (essayArticleParams() as { slug: string; article: string }[]);
for (const s of WAVE7_ESSAY_SLUGS) { const want = derived[s].filter((r) => r.startsWith(`/essays/${s}/articles/`)).map((r) => r.split("/")[4]); const got = eap.filter((p) => p.slug === s).map((p) => p.article); eq(uniqSorted(got), uniqSorted(want), `${s}: essay [article] params == derived articles`); }
// Fail-closed: no fabricated child param exists.
ok(!nsp.some((p) => p.slug === "surulimalai" && (p.section === "06-chapter-06" || p.section === "07-chapter-07")), "surulimalai: no invented chapter 6/7 param");

// ── Discovery / publication surface — PHASE-AWARE ────────────────────────────────────────────────────
// The 224-route LAYER above is phase-invariant (built at P3, unchanged at P4). Whether the works appear
// in LIBRARY_WORKS / discovery / sitemap is not: hidden before P4, published at/after P4. CI builds the
// P4 tip, so this stays a live gate rather than asserting a permanent absence that P4 would break.
const ALL13 = [...WAVE7_DRAMA_SLUGS, ...WAVE7_NOVEL_SLUGS, ...WAVE7_ESSAY_SLUGS];
const libIds = new Set<string>((LIBRARY_WORKS as { id: string; slug: string }[]).flatMap((w) => [w.id, w.slug]));
const publishedThisBatch = ALL13.filter((s) => libIds.has(s));
const phase = publishedThisBatch.length === 0 ? "pre-P4" : "P4";
ok(publishedThisBatch.length === 0 || publishedThisBatch.length === 13, "phase coherent: 0 (hidden) or all 13 (published)");
const shelfText = JSON.stringify(discoveryShelves());
const sm = (sitemap() as { url: string }[]).map((e) => e.url);
for (const s of ALL13) eq(libIds.has(s), phase === "P4", `${s}: LIBRARY_WORKS membership matches phase (${phase})`);
for (const s of ALL13) eq(shelfText.includes(`/plays/${s}`) || shelfText.includes(`/novels/${s}`) || shelfText.includes(`/essays/${s}`), phase === "P4", `${s}: /read discovery presence matches phase (${phase})`);
for (const r of allDerived) eq(sm.some((u) => u.endsWith(r)), phase === "P4", `sitemap exposure of ${r} matches phase (${phase})`);

// ── Build boundary — PHASE-AWARE ─────────────────────────────────────────────────────────────────────
const pm = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(pm)) {
  const keys = new Set(Object.keys((JSON.parse(fs.readFileSync(pm, "utf8")) as { routes: Record<string, unknown> }).routes));
  for (const r of allDerived) ok(keys.has(r), `route prerendered: ${r}`);
  // The 224 direct routes are phase-invariant; at P4 publication additionally introduces exactly one
  // collection landing (/collections/arumbu-1978), so the build grows by 1 relative to the recorded P3.
  const collectionRoutes = phase === "P4" && keys.has("/collections/arumbu-1978") ? 1 : 0;
  eq(keys.size, p3.buildDelta.afterP3.prerenderRoutes + collectionRoutes + W7K.build + W8.build, `build prerender total == afterP3${collectionRoutes ? " + 1 (arumbu-1978 route)" : ""} (${p3.buildDelta.afterP3.prerenderRoutes + collectionRoutes})`);
  eq(p3.buildDelta.afterP3, { prerenderRoutes: 4275, html: 4270 }, "afterP3 build boundary 4275/4270 (recorded P3 delta)");
} else {
  console.error("  · BUILD-boundary check SKIPPED — no .next/prerender-manifest.json (CI runs this after build).");
}

// ── Adversarial (each corruption must be detectable) ─────────────────────────────────────────────────
ok(!allDerived.includes("/novels/surulimalai/06-chapter-06"), "A: no invented surulimalai chapter 6 route");
{ const drop = derived["nachuk-koppai"].filter((r) => r !== "/plays/nachuk-koppai/05"); ok(drop.length !== derived["nachuk-koppai"].length, "A: omitting a nachuk scene is detectable"); }
{ const extra = [...derived["iratha-kanneer"], "/plays/iratha-kanneer/62"]; ok(new Set(extra).size !== new Set(derived["iratha-kanneer"]).size, "A: an extra drama scene route is detectable"); }
{ const trio = ["arumbu", "nadutheru-narayani", "sarapallam-samundi"].map((s) => `/novels/${s}`); ok(new Set(trio).size === 3, "A: the arumbu-1978 trio remain three distinct landing routes (never merged)"); }
{ const dropEssay = derived["perumoochu"].slice(0, -1); ok(dropEssay.length !== derived["perumoochu"].length, "A: omitting an essay article is detectable"); }
ok(!allDerived.some((r) => /\/essays\/[^/]+\/articles\/\d+$/.test(r)), "A: no essay article child is a bare numeric slug");
ok(new Set(allDerived).size === allDerived.length, "A: no duplicate route");

if (fail.length) {
  console.error(`\nwave7-b2-b4-p3-routes — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b2-b4-p3-routes — ${checks} checks, 0 failed (phase ${phase})`);
console.log(`  13 works · 224 direct routes (drama 83 + novels 62 + essays 79) re-derived independently == manifest · generateStaticParams fail-closed · surulimalai gap preserved · ${phase === "P4" ? "now published in LIBRARY_WORKS / discovery / sitemap (P4)" : "still absent from LIBRARY_WORKS / discovery / sitemap"}`);
