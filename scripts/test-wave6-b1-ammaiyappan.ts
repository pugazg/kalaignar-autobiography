/**
 * Wave 6 P1–P3 Batch 1 — அம்மையப்பன் / Ammayappan direct reader/route regression (RENDER + ROUTE level).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave6-b1-ammaiyappan.ts
 *
 * Proves the P3 direct readers/routes for Ammayappan, that the exact route set is registry-derived and
 * fail-closed, that the reader renders the correct source semantics in Tamil and English, and — the P3
 * boundary — that the work is NOT yet exposed in the sitemap or the catalogue (that is P4).
 *
 * Positive AND negative assertions (the Wayfinding lesson: proving a bad state absent is not enough
 * where a specific good state must be present). If the production build tree is present, it also proves
 * the exact build route set and its absence from the sitemap.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import AmmaiyappanLanding from "../components/AmmaiyappanLanding";
import AmmaiyappanReaderView from "../components/AmmaiyappanReader";
import AmmaiyappanSource from "../components/AmmaiyappanSource";
import { ammaiyappanSectionSlugs } from "../lib/cinema-wave6-routes";
import sitemap from "../app/sitemap";
import { publishedWorks } from "../data/library";
import { discoveryShelves } from "../data/collections";
import type { AmmaiyappanReader } from "../data/ammaiyappan";

const BASE = "https://nenjukkuneethi.org";
let checks = 0;
const failures: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) failures.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };

const reader: AmmaiyappanReader = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/cinema/ammaiyappan/reader.json"), "utf-8"));
const prov = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/cinema/ammaiyappan/provenance.json"), "utf-8"));

// ── 1. READER DATA INVARIANTS ─────────────────────────────────────────────────
eq(reader.screenplayScenes.length, 63, "reader has 63 archival scenes");
eq(reader.counts.scenes, 63, "counts.scenes = 63");
eq(reader.counts.sourceNumberedScenes, 0, "0 source-numbered scenes");
ok(reader.screenplayScenes.every((s) => s.sourceSceneNumber === null), "no scene carries a source scene number");
ok(reader.screenplayScenes.every((s, i) => s.archivalSceneOrdinal === i + 1), "scene ordinals are 1..63 in order");
ok(reader.navigation.screenplaySceneNumbersAreSourceNumbers === false, "navigation: scenes are not source-numbered");
ok(reader.navigation.screenplaySceneNavigationIsEditorial === true, "navigation: scene navigation is editorial");
ok(reader.screenplayScenes.every((s) => s.tamilText.length > 0), "every scene has verbatim Tamil");

// ── 2. EXACT ROUTE SET (registry-derived, fail-closed) ─────────────────────────
const sectionSlugs = ammaiyappanSectionSlugs(reader);
eq(sectionSlugs.length, 63, "63 section slugs");
const routes = ["/cinema/ammaiyappan", "/cinema/ammaiyappan/source", ...sectionSlugs.map((s) => `/cinema/ammaiyappan/${s}`)];
eq(routes.length, 65, "65 direct routes (landing + source + 63 segments)");
eq(new Set(routes).size, routes.length, "no duplicate route");
eq(sectionSlugs[0], "scene-001", "first segment slug scene-001");
eq(sectionSlugs[62], "scene-063", "last segment slug scene-063");
// Fail-closed: out-of-range / arbitrary slugs are not in the registry.
for (const bad of ["scene-000", "scene-064", "scene-1", "scene-099", "foo", ""]) {
  ok(!sectionSlugs.includes(bad), `invalid slug rejected by registry: ${bad || "(empty)"}`);
}
// Batch 1 OWNS cinema-scene route derivation: the per-batch manifest must equal the reader-registry-
// derived route set exactly (the family-agnostic global validator does not know how to derive these).
const uniqSort = (a: string[]) => Array.from(new Set(a)).sort();
const batch = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/internal/wave6/batches/b1-cinema-ammaiyappan-routes.json"), "utf-8")) as { workId: string; discoverable: boolean; sitemapExposed: boolean; routes: string[] };
eq(uniqSort(batch.routes), uniqSort(routes), "Batch-1 route manifest == reader-registry-derived routes (exact set)");
eq(batch.routes.filter((r) => !routes.includes(r)), [], "no manifest route outside the registry");
eq(routes.filter((r) => !batch.routes.includes(r)), [], "no registry route missing from the manifest");
eq(batch.workId, "ammaiyappan", "Batch-1 manifest workId");
ok(batch.discoverable === false && batch.sitemapExposed === false, "Batch-1 manifest: discoverable=false, sitemapExposed=false");

// ── 3. P3 BOUNDARY — NOT in sitemap, NOT in catalogue/discovery ─────────────────
const urls = sitemap().map((e) => e.url);
eq(urls.filter((u) => u.startsWith(`${BASE}/cinema/ammaiyappan`)).length, 0, "ZERO ammaiyappan URLs in the sitemap (P3, not P4)");
const works = publishedWorks();
eq(works.length, 78, "catalogue still 78 works (no P4 exposure)");
ok(!works.some((w) => w.slug === "ammaiyappan"), "ammaiyappan is NOT in the catalogue");
const cinemaEntries = discoveryShelves().find((s) => s.shelf.id === "cinema-writing")!.entries;
eq(cinemaEntries.length, 6, "Cinema discovery still 6 entries (no ammaiyappan card)");

// ── 4. RENDERED SEMANTICS ───────────────────────────────────────────────────────
const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const ta = (el: React.ReactElement) => strip(renderToStaticMarkup(createElement(LangProvider, null, el))); // Tamil default
const en = (el: React.ReactElement) => strip(renderToStaticMarkup(el)); // context default = English

const landingTa = ta(createElement(AmmaiyappanLanding, { reader }));
ok(/களஞ்சியப் பகுதி/.test(landingTa), "landing frames segments as களஞ்சியப் பகுதி (archive)");
ok(/களஞ்சிய வழிசெலுத்தல்/.test(landingTa), "landing labels the list archive navigation");
ok(/திரை இசைப் பாடல்கள்/.test(landingTa), "landing states it is NOT the Film Songs anthology");
ok(!/காட்சி\s*\d+\s*\(அச்சு\)/.test(landingTa), "landing does not present segments as printed scene numbers");

const scene1Ta = ta(createElement(AmmaiyappanReaderView, { reader, slug: "scene-001" }));
const scene1En = en(createElement(AmmaiyappanReaderView, { reader, slug: "scene-001" }));
ok(/களஞ்சியப் பகுதி 1/.test(scene1Ta), "reader: scene-001 shows களஞ்சியப் பகுதி 1 (TA)");
ok(/மூல எண்ணிடல் அல்ல/.test(scene1Ta), "reader: scene-001 says not source-numbered (TA)");
ok(/Archive segment 1/.test(scene1En), "reader: scene-001 shows Archive segment 1 (EN)");
ok(/not source-numbered/.test(scene1En), "reader: scene-001 says not source-numbered (EN)");
ok(!/\bScene 1\b/.test(scene1En), "reader: scene-001 does NOT call it 'Scene 1'");
ok(reader.screenplayScenes[0].tamilText.slice(0, 20).length > 0 && scene1Ta.includes(reader.screenplayScenes[0].tamilText.slice(0, 12)), "reader: scene-001 renders its verbatim Tamil");

const sourceTa = ta(createElement(AmmaiyappanSource, { reader, prov }));
ok(/கதை வசனம்/.test(sourceTa) && /மு\. கருணாநிதி/.test(sourceTa), "source: printed கதை வசனம் : மு. கருணாநிதி witness present");
ok(/1954/.test(sourceTa), "source: printed 1954 edition witness present");
ok(/அச்சில் தோன்றும் மூலச் சான்றுகள்|அச்சுச் சான்றுகள்/.test(sourceTa), "source: printed facts framed as witnesses");
ok(/உய்த்துணரப்படவில்லை|கூறப்படவில்லை/.test(sourceTa), "source: rights explicitly not inferred");
ok(/உயர்த்தப்படவில்லை/.test(sourceTa), "source: song occurrences not upgraded to authored lyrics");
ok(/TVA_BOK_0064230/.test(sourceTa), "source: controlling scan archive id shown");

// ── 5. SEMANTIC SAFEGUARDS (provenance) ─────────────────────────────────────────
ok(prov.rights.publicationYear === null && prov.rights.rightsStatus === null && prov.rights.editionStatement === null, "provenance asserts no year/edition/rights");
ok(prov.structuralExceptions.some((e: { id: string }) => e.id === "not-the-film-songs-anthology"), "provenance records the not-Film-Songs safeguard");
ok(prov.structuralExceptions.some((e: { id: string }) => e.id === "retained-song-occurrences-not-lyric-authorship"), "provenance records the song-occurrence safeguard");

// ── 6. BUILD BOUNDARY (only if a production build tree is present) ───────────────
const manifestPath = path.join(process.cwd(), ".next/prerender-manifest.json");
if (fs.existsSync(manifestPath)) {
  const routeKeys = Object.keys((JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as { routes: Record<string, unknown> }).routes);
  const buildAmmai = routeKeys.filter((k) => k === "/cinema/ammaiyappan" || k.startsWith("/cinema/ammaiyappan/")).sort();
  const expected = [...routes].sort();
  eq(buildAmmai, expected, "build prerenders exactly the 65 expected ammaiyappan routes");
  for (const bad of ["/cinema/ammaiyappan/scene-000", "/cinema/ammaiyappan/scene-064", "/cinema/ammaiyappan/foo"]) {
    ok(!routeKeys.includes(bad), `build does NOT prerender invalid ${bad}`);
  }
} else {
  console.error("  · build boundary SKIPPED — no .next/prerender-manifest.json (run `npm run build` first; CI runs this after build).");
}

if (failures.length) {
  console.error(`\nwave6-b1-ammaiyappan — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave6-b1-ammaiyappan — ${checks} checks, 0 failed`);
console.log("  63 archival scenes · 65 direct routes (registry-derived, fail-closed) · archive-segment semantics · not-Film-Songs · song occurrences not upgraded · 0 sitemap URLs · catalogue still 78");
