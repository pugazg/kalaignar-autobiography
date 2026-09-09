/**
 * Wave 6 P1–P3 Batch 4 — Poetry direct reader/route regression (ROUTE + RENDER level).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave6-b4-poetry.ts
 *
 * Batch 4 owns the Poetry-family Wave-6 route derivation: this test proves the exact 30-route set
 * (6 standalone × [landing+source]; the 1975 publication landing+source + 3 source-item routes for
 * ordinals 01/02/04; the oruthalaik-kathal verse-novel landing+source + 11 section routes), that the
 * batch manifest equals the registry-derived set, that the reader renders the verse-novel as SECTIONS
 * (never poems) and the 1975 work as poems with no invented ordinal 03, and — the P3/P4 boundary —
 * that none of the eight works is exposed in the sitemap, catalogue or discovery, and that the six
 * existing Poetry works are unaffected.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import PublicationLanding from "../components/PublicationLanding";
import type { PublicationBrief } from "../components/PublicationLanding";
import PublicationItemReader from "../components/PublicationItemReader";
import { POEM_SLUGS, POETRY_PUBLICATION_SLUGS } from "../data/poems";
import type { Poem, PoetryPublication } from "../data/poems";
import { WAVE6_POEM_SLUGS, WAVE6_POETRY_PUBLICATION_SLUGS } from "../lib/poems-wave6-routes";
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
const pub = (slug: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", slug, "publication.json"), "utf8")) as PoetryPublication;
const poem = (slug: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", slug, "poem.json"), "utf8")) as Poem;

const brief = (p: PoetryPublication): PublicationBrief => ({
  slug: p.slug, titleTa: p.title.ta, titleEn: p.title.en, authorTa: p.author.nameTa, authorEn: p.author.nameEn,
  editionStatement: p.editionStatement, publicationYear: p.publicationYear, itemCount: p.itemCount,
  readingUnitKind: p.readingUnitKind ?? "poem", workForm: p.workForm,
  items: p.items.map((i) => ({ ordinal: i.ordinal, slug: i.slug, titleTa: i.titleTa, contentsTitleTa: i.contentsTitleTa, titleEn: i.titleEn, printedOrdinal: i.printedOrdinal, scanFirst: i.physicalScans[0].first, scanLast: i.physicalScans[i.physicalScans.length - 1].last })),
  groups: p.groups?.map((g) => ({ ordinal: g.ordinal, titleTa: g.titleTa, titleEn: g.titleEn, itemOrdinals: g.itemOrdinals })),
});
// LangProvider server-renders in Tamil (the site's primary language); assertions use Tamil wording.
const renderTa = (el: React.ReactElement) => strip(renderToStaticMarkup(createElement(LangProvider, null, el)));

// ── 1. EXACT ROUTE SET (registry-derived, fail-closed) ──────────────────────────
eq([...WAVE6_POEM_SLUGS], ["thalaikettan-thambi", "aanthaiyum-arasanum", "poomudi", "anna-kaviyarangam", "gunanayagar-nehru", "kanchithan-annan"], "Wave-6 standalone poem slugs");
eq([...WAVE6_POETRY_PUBLICATION_SLUGS], ["kalaignarin-kaviyaranga-kavithaigal-1975", "oruthalaik-kathal"], "Wave-6 publication slugs");
const routes: string[] = [];
for (const s of WAVE6_POEM_SLUGS) routes.push(`/poems/${s}`, `/poems/${s}/source`);
for (const s of WAVE6_POETRY_PUBLICATION_SLUGS) { routes.push(`/poems/${s}`, `/poems/${s}/source`); for (const it of pub(s).items) routes.push(`/poems/${s}/${it.slug}`); }
eq(routes.length, 30, "exactly 30 Batch-4 direct routes");
eq(new Set(routes).size, routes.length, "no duplicate route");
for (const s of WAVE6_POEM_SLUGS) ok(!(POEM_SLUGS as readonly string[]).includes(s), `${s} NOT in discovered POEM_SLUGS`);
for (const s of WAVE6_POETRY_PUBLICATION_SLUGS) ok(!(POETRY_PUBLICATION_SLUGS as readonly string[]).includes(s), `${s} NOT in discovered POETRY_PUBLICATION_SLUGS`);

const batch = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/internal/wave6/batches/b4-poetry-routes.json"), "utf8")) as { batchId: string; workIds: string[]; collectionIds: string[]; readerFamily: string; discoverable: boolean; sitemapExposed: boolean; routeCount: number; routes: string[] };
eq(batch.batchId, "b4-poetry", "Batch-4 batchId");
eq(uniqSort(batch.workIds), uniqSort([...WAVE6_POEM_SLUGS, ...WAVE6_POETRY_PUBLICATION_SLUGS]), "Batch-4 workIds == the 8 works");
eq(batch.workIds.length, 8, "Batch-4 has exactly 8 workIds");
eq(batch.collectionIds, [], "Batch-4 collectionIds == [] (registers no public collection)");
ok((batch as unknown as { workId?: unknown }).workId === undefined, "Batch-4 manifest does not use the retired singular workId");
eq(batch.readerFamily, "poetry", "Batch-4 readerFamily");
eq(uniqSort(batch.routes), uniqSort(routes), "Batch-4 route manifest == registry-derived routes (exact set)");
ok(batch.discoverable === false && batch.sitemapExposed === false, "Batch-4 manifest: discoverable=false, sitemapExposed=false");
// No invented ordinal 03 for the 1975 publication; no numeric-alias child routes anywhere.
eq(pub("kalaignarin-kaviyaranga-kavithaigal-1975").items.map((i) => i.ordinal), [1, 2, 4], "1975 publication ordinals [1,2,4] (no invented 03)");
ok(!routes.some((r) => /\/poems\/kalaignarin-kaviyaranga-kavithaigal-1975\/(3|03)$/.test(r)), "no /…/03 route for the 1975 publication");
ok(!routes.some((r) => /\/poems\/[^/]+\/\d+$/.test(r)), "no numeric-alias child route exists");

// ── 2. P3/P4 BOUNDARY — not in sitemap, catalogue or discovery ──────────────────
const urls = sitemap().map((e) => e.url);
for (const r of routes) eq(urls.filter((u) => u === `${BASE}${r}`).length, 0, `ZERO sitemap URLs for ${r} (P3, not P4)`);
const works = publishedWorks();
eq(works.length, 78, "catalogue still 78 works (no P4 exposure)");
for (const s of [...WAVE6_POEM_SLUGS, ...WAVE6_POETRY_PUBLICATION_SLUGS]) ok(!works.some((w) => w.slug === s), `${s} is NOT in the catalogue`);
const poetryEntries = discoveryShelves().find((s) => s.shelf.id === "poetry")!.entries;
eq(poetryEntries.length, 6, "Poetry discovery still 6 entries (no Wave-6 card)");
eq(LIBRARY_COLLECTIONS.length, 1, "public collection registry still exactly 1");

// ── 3. RENDER SEMANTICS (Tamil render — the SSR primary language) ────────────────
{
  // oruthalaik-kathal — verse-novel: SECTIONS (பிரிவுகள்), never poems (கவிதைகள்).
  const p = pub("oruthalaik-kathal");
  eq(p.readingUnitKind, "section", "oruthalaik readingUnitKind section");
  const land = renderTa(createElement(PublicationLanding, { pub: brief(p) }));
  ok(/11 பிரிவுகள்/.test(land), "oruthalaik landing badge says '11 பிரிவுகள்' (sections)");
  ok(!/11 கவிதைகள்/.test(land), "oruthalaik landing does NOT say '11 கவிதைகள்' (poems)");
  ok(/ஓவியக் கவிதை நாவல்/.test(land), "oruthalaik landing shows the verse-novel work form");
  const it = p.items[0];
  const reader = renderTa(createElement(PublicationItemReader, { pubSlug: p.slug, pubTitleTa: p.title.ta, readingUnitKind: "section", item: it as never, index: 0, total: p.items.length, prev: null, next: { slug: p.items[1].slug, titleTa: p.items[1].titleTa } }));
  ok(/பிரிவு 1 \/ 11/.test(reader), "oruthalaik item reader says 'பிரிவு 1 / 11' (Section 1 of 11)");
  ok(!/கவிதை 1 \/ 11/.test(reader), "oruthalaik item reader does NOT say 'கவிதை 1 / 11' (Poem)");
}
{
  // 1975 publication — poems (கவிதைகள்), not sections.
  const p = pub("kalaignarin-kaviyaranga-kavithaigal-1975");
  ok(p.readingUnitKind === undefined || p.readingUnitKind === "poem", "1975 reading units are poems");
  const land = renderTa(createElement(PublicationLanding, { pub: brief(p) }));
  ok(/3 கவிதைகள்/.test(land), "1975 landing badge says '3 கவிதைகள்' (poems)");
  ok(!/3 பிரிவுகள்/.test(land), "1975 landing does not call its items sections");
}
{
  // A standalone poem: title present, no fabricated date; anna carries a source-context date.
  const anna = poem("anna-kaviyarangam");
  eq(anna.publicationYear, 1968, "anna publicationYear 1968 (source-established)");
  ok(!!anna.sourceContext && anna.sourceContext.dateIso === "1968-01-07", "anna sourceContext date 1968-01-07 (source-established)");
  const pm = poem("poomudi");
  ok(pm.publicationYear === 1965 && pm.sourceContext === undefined, "poomudi: publication 1965, no invented context note");
  // PoemReader loads its payload client-side (fetch), so the standalone reader's render is covered by
  // the existing Wave-4 standalone UI test; here the payload title basis is asserted directly.
  eq([pm.title.ta, pm.title.en], ["பூமுடி", "Flower Crown"], "poomudi payload carries the approved bilingual title");
  const tt = poem("thalaikettan-thambi");
  ok(tt.title.en !== tt.title.ta, "thalaikettan carries an approved (non-fallback) English title");
}

// ── 4. EXISTING SIX POETRY WORKS UNAFFECTED (no Batch-4 wording / semantics leak) ─
for (const s of POETRY_PUBLICATION_SLUGS) {
  const p = pub(s);
  ok(p.readingUnitKind === undefined, `existing publication ${s} carries no readingUnitKind (byte-frozen)`);
  ok(p.workForm === undefined, `existing publication ${s} carries no workForm`);
}
for (const s of POEM_SLUGS) ok(fs.existsSync(path.join(process.cwd(), "public/data/poems", s, "poem.json")), `existing standalone ${s} still present`);

// ── 5. BUILD BOUNDARY (only if a production build tree is present) ───────────────
const manifestPath = path.join(process.cwd(), ".next/prerender-manifest.json");
if (fs.existsSync(manifestPath)) {
  const routeKeys = Object.keys((JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as { routes: Record<string, unknown> }).routes);
  for (const r of routes) ok(routeKeys.includes(r), `build prerenders Batch-4 route ${r}`);
  for (const bad of ["/poems/kalaignarin-kaviyaranga-kavithaigal-1975/03", "/poems/oruthalaik-kathal/section-0", "/poems/oruthalaik-kathal/section-12", "/poems/poomudi/section-1"]) {
    ok(!routeKeys.includes(bad), `build does NOT prerender invalid ${bad}`);
  }
} else {
  console.error("  · build boundary SKIPPED — no .next/prerender-manifest.json (run `npm run build` first; CI runs this after build).");
}

if (failures.length) {
  console.error(`\nwave6-b4-poetry — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave6-b4-poetry — ${checks} checks, 0 failed`);
console.log("  8 works · 30 direct routes (registry-derived, fail-closed) · verse-novel renders as 11 sections · 1975 [1,2,4] no invented 03 · catalogue 78 · Poetry discovery 6 · 0 sitemap URLs");
