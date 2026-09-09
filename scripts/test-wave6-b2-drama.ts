/**
 * Wave 6 P1–P3 Batch 2 — Drama direct reader/route regression (RENDER + ROUTE level).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave6-b2-drama.ts
 *
 * Batch 2 OWNS the Drama-family route derivation: this test proves the exact 83-route set is derived
 * from the three released play.json registries, that the batch manifest equals it, that the readers
 * render the correct source semantics in Tamil and English (no invented Scene 22/23; source-compressed
 * range; unnumbered காட்சி; 47 numbered scenes; 7 editorial SRUs; the உதயசூரியன் கோலம் intertitle
 * preserved; source-condition holds visible; the 1962 Madurai claim never promoted into the body), and
 * — the P3 boundary — that none of the three works is exposed in the sitemap, catalogue or discovery.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import PlayLanding from "../components/PlayLanding";
import PlayReader from "../components/PlayReader";
import PlaySource from "../components/PlaySource";
import type { Play, PlayProvenance } from "../data/plays";
import { WAVE6_DRAMA_SLUGS, wave6DramaSceneSlugs } from "../lib/drama-wave6-routes";
import { playLandingDescription, playSceneDescription } from "../lib/play-metadata";
import sitemap from "../app/sitemap";
import { publishedWorks } from "../data/library";
import { discoveryShelves, LIBRARY_COLLECTIONS } from "../data/collections";

const BASE = "https://nenjukkuneethi.org";
let checks = 0;
const failures: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) failures.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const uniqSort = (a: string[]) => Array.from(new Set(a)).sort();
const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const ta = (el: React.ReactElement) => strip(renderToStaticMarkup(createElement(LangProvider, null, el))); // Tamil default
const en = (el: React.ReactElement) => strip(renderToStaticMarkup(el)); // context default = English

const load = (slug: string) => ({
  play: JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/plays", slug, "play.json"), "utf8")) as Play,
  prov: JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/plays", slug, "provenance.json"), "utf8")) as PlayProvenance,
});

// ── 1. EXACT ROUTE SET (registry-derived, fail-closed) ─────────────────────────
eq([...WAVE6_DRAMA_SLUGS], ["kagithapoo", "manimagudam", "thiruvalar-desiyampillai"], "Wave-6 Drama slugs are exactly the three batch works");
const routes = WAVE6_DRAMA_SLUGS.flatMap((slug) => [
  `/plays/${slug}`, `/plays/${slug}/source`, ...wave6DramaSceneSlugs(slug).map((u) => `/plays/${slug}/${u}`),
]);
eq(routes.length, 83, "83 direct routes (3 landings + 3 sources + 23+47+7 units)");
eq(new Set(routes).size, routes.length, "no duplicate route");
eq(wave6DramaSceneSlugs("kagithapoo").length, 23, "kagithapoo 23 reading units");
eq(wave6DramaSceneSlugs("manimagudam").length, 47, "manimagudam 47 reading units");
eq(wave6DramaSceneSlugs("thiruvalar-desiyampillai").length, 7, "thiruvalar 7 SRUs");

// Batch 2 OWNS the family route derivation: the per-batch manifest must equal the registry set exactly.
const batch = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/internal/wave6/batches/b2-drama-routes.json"), "utf8")) as { batchId: string; workIds: string[]; collectionIds: string[]; readerFamily: string; discoverable: boolean; sitemapExposed: boolean; routes: string[] };
eq(batch.batchId, "b2-drama", "Batch-2 batchId");
eq(uniqSort(batch.workIds), ["kagithapoo", "manimagudam", "thiruvalar-desiyampillai"], "Batch-2 workIds == the three plays");
eq(batch.collectionIds, [], "Batch-2 collectionIds == [] (registers no public collection)");
ok((batch as unknown as { workId?: unknown }).workId === undefined, "Batch-2 manifest does not use the retired singular workId");
eq(batch.readerFamily, "drama", "Batch-2 readerFamily");
eq(uniqSort(batch.routes), uniqSort(routes), "Batch-2 route manifest == registry-derived routes (exact set)");
eq(batch.routes.filter((r) => !routes.includes(r)), [], "no manifest route outside the registry");
eq(routes.filter((r) => !batch.routes.includes(r)), [], "no registry route missing from the manifest");
ok(batch.discoverable === false && batch.sitemapExposed === false, "Batch-2 manifest: discoverable=false, sitemapExposed=false");

// ── 2. P3 BOUNDARY — NOT in sitemap, catalogue or discovery ─────────────────────
const urls = sitemap().map((e) => e.url);
for (const slug of WAVE6_DRAMA_SLUGS) eq(urls.filter((u) => u === `${BASE}/plays/${slug}` || u.startsWith(`${BASE}/plays/${slug}/`)).length, 0, `ZERO ${slug} URLs in the sitemap (P3, not P4)`);
const works = publishedWorks();
eq(works.length, 78, "catalogue still 78 works (no P4 exposure)");
for (const slug of WAVE6_DRAMA_SLUGS) ok(!works.some((w) => w.slug === slug), `${slug} is NOT in the catalogue`);
const dramaEntries = discoveryShelves().find((s) => s.shelf.id === "drama")!.entries;
eq(dramaEntries.length, 5, "Drama discovery still 5 entries (no Wave-6 card)");
eq(LIBRARY_COLLECTIONS.length, 1, "public collection registry still exactly 1");

// ── 3. RENDERED SEMANTICS ───────────────────────────────────────────────────────
// காகிதப்பூ — compressed range + unnumbered காட்சி + printed முற்றும், no Scene 22/23.
{
  const { play, prov } = load("kagithapoo");
  const landingTa = ta(createElement(PlayLanding, { play }));
  ok(/மூலம் தொகுத்த காட்சிகள்\s*2, 3, 4, 5|source-compressed scenes 2, 3, 4, 5/.test(landingTa + en(createElement(PlayLanding, { play }))), "kagithapoo landing marks the source-compressed 2–5 range");
  ok(/எண்ணிடப்படாத காட்சி/.test(landingTa), "kagithapoo landing marks the unnumbered காட்சி");
  const comp = play.readingUnits.find((u) => u.kind === "compressed-scene-range")!;
  const compEn = en(createElement(PlayReader, { play, scene: comp, prev: null, next: null }));
  ok(/no separate scene is reconstructed or invented/i.test(compEn), "kagithapoo compressed-range reader explains no scene invented");
  const un = play.readingUnits.find((u) => u.kind === "unnumbered-scene")!;
  const unEn = en(createElement(PlayReader, { play, scene: un, prev: null, next: null }));
  ok(/No Scene 22 or 23 number is assigned/i.test(unEn), "kagithapoo unnumbered reader states no Scene 22/23");
  ok(!play.readingUnits.some((u) => u.order === 22 || u.order === 23), "kagithapoo assigns no reading unit the order 22 or 23");
  const srcEn = en(createElement(PlaySource, { play, prov }));
  ok(/1967/.test(srcEn), "kagithapoo source shows the 1967 edition witness");
}

// மணிமகுடம் — 47 scenes; 1962 claim recorded as context and never in the body.
{
  const { play, prov } = load("manimagudam");
  const srcEn = en(createElement(PlaySource, { play, prov }));
  ok(/1962/.test(srcEn) && /User-supplied catalogue context/i.test(srcEn), "manimagudam source records the 1962 Madurai claim as user-supplied context");
  ok(/May 1956/i.test(srcEn) && /1963/.test(srcEn), "manimagudam source shows the scan's own 1956 & 1963 stagings");
  const sceneEn = en(createElement(PlayReader, { play, scene: play.readingUnits[0], prev: null, next: play.readingUnits[1] }));
  ok(/Scene 1 of 47/i.test(sceneEn), "manimagudam reader shows Scene 1 of 47");
  ok(!/1962/.test(play.readingUnits.flatMap((u) => [...u.tamil.units, ...u.english.units]).map((u) => u.text).join(" ")), "manimagudam reading body never contains the unverified 1962 claim");
}

// திருவாளர் — 7 SRUs; intertitle preserved; holds visible; no invented முற்றும்.
{
  const { play, prov } = load("thiruvalar-desiyampillai");
  const landingEn = en(createElement(PlayLanding, { play }));
  ok(/Source-representation units — 7/.test(landingEn), "thiruvalar landing shows 7 SRUs");
  ok(/an editorial unit, not a scene number/i.test(landingEn), "thiruvalar landing marks SRUs as not scene numbers");
  const sru1 = play.readingUnits.find((u) => u.slug === "sru-01-yama-court")!;
  const sru1En = en(createElement(PlayReader, { play, scene: sru1, prev: null, next: null }));
  ok(/Source-representation unit 1 of 7/i.test(sru1En), "thiruvalar reader shows SRU 1 of 7, not Scene 1");
  ok(/\[paper loss\]/.test(sru1En), "thiruvalar SRU-01 renders the [paper loss] markers verbatim");
  ok(/documented source-condition loss/i.test(sru1En), "thiruvalar SRU-01 flags documented source-condition loss");
  const sru7 = play.readingUnits.find((u) => u.slug === "sru-07-udayasuriyan-kolam-close")!;
  const sru7Ta = ta(createElement(PlayReader, { play, scene: sru7, prev: null, next: null }));
  ok(/உதயசூரியன் கோலம்/.test(sru7Ta), "thiruvalar SRU-07 renders the உதயசூரியன் கோலம் intertitle");
  const srcEn = en(createElement(PlaySource, { play, prov }));
  ok(/Documented source-condition holds/i.test(srcEn), "thiruvalar source shows the documented-holds card");
  ok(/1965/.test(en(createElement(PlayLanding, { play }))), "thiruvalar landing shows the 2nd-edition/1965 witness");
}

// ── 3b. STRUCTURE-AWARE NEXT.JS METADATA (the exact helper the pages call) ───────
{
  // காகிதப்பூ landing — must state the real mixed structure, never merely "21 scenes".
  const { play } = load("kagithapoo");
  const landing = playLandingDescription(play);
  ok(/source-compressed Scenes 2–5 block/.test(landing), "kagithapoo landing metadata mentions the compressed Scenes 2–5 block");
  ok(/unnumbered scene/.test(landing), "kagithapoo landing metadata mentions the unnumbered scene");
  ok(/23 source-visible dramatic reading units/.test(landing), "kagithapoo landing metadata states 23 source-visible reading units");
  ok(!/^A One-Act Play by .* — 21 scenes/.test(landing) && !/\b21 scenes\b/.test(landing), "kagithapoo landing metadata does NOT reduce the work to '21 scenes'");
  // Authorship must be qualified — no unqualified "by Kalaignar M. Karunanidhi".
  ok(!/by Kalaignar M\. Karunanidhi/.test(landing), "kagithapoo landing metadata does NOT use the unqualified 'by Kalaignar M. Karunanidhi'");
  ok(/Catalogue attribution to Kalaignar M\. Karunanidhi is user-supplied/.test(landing) && /does not itself print an author line/.test(landing), "kagithapoo landing metadata qualifies authorship as user-supplied catalogue");

  // காகிதப்பூ compressed child — source-compressed 2–5, no "Scene null", no invented Scene 2.
  const comp = play.readingUnits.find((u) => u.kind === "compressed-scene-range")!;
  const compMeta = playSceneDescription(play, comp);
  ok(/Source-compressed Scenes 2–5, preserved as one reading unit/.test(compMeta), "kagithapoo compressed child metadata says source-compressed 2–5, one reading unit");
  ok(!/Scene null/.test(compMeta) && !/Scene 2 of/.test(compMeta), "kagithapoo compressed child metadata never says 'Scene null' or 'Scene 2 of …'");

  // காகிதப்பூ unnumbered child — unnumbered, no 22/23 assignment, no "Scene null".
  const un = play.readingUnits.find((u) => u.kind === "unnumbered-scene")!;
  const unMeta = playSceneDescription(play, un);
  ok(/unnumbered scene between Scene 21 and Scene 24/.test(unMeta), "kagithapoo unnumbered child metadata locates it between Scene 21 and Scene 24");
  ok(/no Scene 22 or 23 number is assigned/.test(unMeta), "kagithapoo unnumbered child metadata states no Scene 22/23 assignment");
  ok(!/Scene null/.test(unMeta), "kagithapoo unnumbered child metadata never says 'Scene null'");

  // காகிதப்பூ ordinary source-numbered scene — mixed work, prefer 'Source-numbered Scene N'.
  const sc1 = play.readingUnits.find((u) => u.kind === "scene" && u.order === 1)!;
  ok(/Source-numbered Scene 1/.test(playSceneDescription(play, sc1)) && !/Scene 1 of 21/.test(playSceneDescription(play, sc1)), "kagithapoo numbered child metadata says 'Source-numbered Scene 1', not 'Scene 1 of 21'");
}
{
  // மணிமகுடம் — 47 source-numbered scenes; child Scene 1 of 47.
  const { play } = load("manimagudam");
  ok(/47 source-numbered scenes/.test(playLandingDescription(play)), "manimagudam landing metadata states 47 source-numbered scenes");
  ok(/Scene 1 of 47/.test(playSceneDescription(play, play.readingUnits[0])), "manimagudam Scene 1 child metadata says 'Scene 1 of 47'");
}
{
  // திருவாளர் — 7 editorial SRUs; never "0 scenes", never "Scene null", never "Scene 1".
  const { play } = load("thiruvalar-desiyampillai");
  const landing = playLandingDescription(play);
  ok(/7 editorial source-representation units/.test(landing), "thiruvalar landing metadata states 7 editorial source-representation units");
  ok(/the source prints no scene numbers or acts/.test(landing), "thiruvalar landing metadata says the source prints no scene numbers or acts");
  ok(!/\b0 scenes\b/.test(landing), "thiruvalar landing metadata never says '0 scenes'");
  const sruMeta = playSceneDescription(play, play.readingUnits[0]);
  ok(/Source-representation unit 1 of 7 — editorial navigation, not a source scene number/.test(sruMeta), "thiruvalar SRU child metadata says 'Source-representation unit 1 of 7', not a scene");
  ok(!/Scene null/.test(sruMeta) && !/\bScene 1\b/.test(sruMeta) && !/Scene 1 of 0/.test(sruMeta), "thiruvalar SRU child metadata never says 'Scene null' / 'Scene 1' / 'Scene 1 of 0'");
}
// Global: no Wave-6 Drama child metadata ever emits "Scene null" or "Scene N of 0".
for (const slug of WAVE6_DRAMA_SLUGS) {
  const { play } = load(slug);
  for (const u of play.readingUnits) {
    const m = playSceneDescription(play, u);
    ok(!/Scene null/.test(m), `${slug}/${u.slug} metadata has no 'Scene null'`);
    ok(!/Scene \d+ of 0\b/.test(m), `${slug}/${u.slug} metadata has no 'Scene N of 0'`);
  }
}

// ── 3c. AUTHORSHIP-BOUNDARY (rendered landing + source) ──────────────────────────
{
  const { play, prov } = load("kagithapoo");
  const landingTa = ta(createElement(PlayLanding, { play }));
  const landingEn = en(createElement(PlayLanding, { play }));
  ok(/கலைஞர் மு\. கருணாநிதி/.test(landingTa), "kagithapoo landing renders the attribution");
  ok(/பயனர் வழங்கிய பட்டியல் தகவல்/.test(landingTa), "kagithapoo landing labels the attribution user-supplied catalogue (TA)");
  ok(/user-supplied catalogue metadata/i.test(landingEn) && /does not itself print an author line/i.test(landingEn), "kagithapoo landing labels the attribution user-supplied and notes no printed author line (EN)");
  // Provenance / Source retains the same qualification.
  ok(prov.notes.some((n) => /user-supplied catalogue metadata at intake/i.test(n) && /does not itself print an author line/i.test(n)), "kagithapoo source/provenance retains the authorship qualification");
  ok(play.authorAttribution?.printedInSelectedSourceRange === false, "kagithapoo authorAttribution: selected source range does not print the author line");
}

// ── 4. BUILD BOUNDARY (only if a production build tree is present) ───────────────
const manifestPath = path.join(process.cwd(), ".next/prerender-manifest.json");
if (fs.existsSync(manifestPath)) {
  const routeKeys = Object.keys((JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as { routes: Record<string, unknown> }).routes);
  for (const slug of WAVE6_DRAMA_SLUGS) {
    const built = routeKeys.filter((k) => k === `/plays/${slug}` || k.startsWith(`/plays/${slug}/`)).sort();
    const expected = [`/plays/${slug}`, `/plays/${slug}/source`, ...wave6DramaSceneSlugs(slug).map((u) => `/plays/${slug}/${u}`)].sort();
    eq(built, expected, `build prerenders exactly ${slug}'s routes`);
  }
  for (const bad of ["/plays/kagithapoo/scene-22", "/plays/kagithapoo/22", "/plays/thiruvalar-desiyampillai/sru-08", "/plays/manimagudam/48"]) {
    ok(!routeKeys.includes(bad), `build does NOT prerender invalid ${bad}`);
  }
} else {
  console.error("  · build boundary SKIPPED — no .next/prerender-manifest.json (run `npm run build` first; CI runs this after build).");
}

if (failures.length) {
  console.error(`\nwave6-b2-drama — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave6-b2-drama — ${checks} checks, 0 failed`);
console.log("  3 Drama works · 83 direct routes (registry-derived, fail-closed) · compressed range / unnumbered காட்சி / 47 scenes / 7 SRUs / intertitle / holds · 0 sitemap URLs · catalogue 78 · Drama discovery 5");
