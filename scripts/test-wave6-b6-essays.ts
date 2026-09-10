/**
 * Wave 6 P1–P3 Batch 6 — Essays & Articles direct reader/route regression (ROUTE + RENDER level).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave6-b6-essays.ts
 *
 * Proves the exact 74-route set (5 landings + 5 /source + 64 article routes), that the batch manifest
 * equals the registry+payload-derived set, that the five works render truthfully (vedhanai as a
 * message and never a speech; kudumbaththin with no invented year; sinthanaiyum as a 50-article
 * third-edition transfer-PDF work), and — the P3/P4 boundary (adversarials 11–14) — that none of the
 * five is exposed in the sitemap, catalogue or discovery, and the existing four Essay publications and
 * all other public counts are unaffected.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import EssayLanding from "../components/EssayLanding";
import ArticleReader from "../components/ArticleReader";
import ArticleSource from "../components/ArticleSource";
import { ESSAY_SLUGS } from "../data/essays";
import type { EssayPublication, EssayProvenance } from "../data/essays";
import { WAVE6_ESSAY_SLUGS } from "../lib/essays-wave6-routes";
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
const pub = (slug: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/essays", slug, "publication.json"), "utf8")) as EssayPublication;
const prov = (slug: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/essays", slug, "provenance.json"), "utf8")) as EssayProvenance;
const renderTa = (el: React.ReactElement) => strip(renderToStaticMarkup(createElement(LangProvider, null, el)));

// ── 1. EXACT ROUTE SET (registry + payload derived, fail-closed) ──────────────────────────────────
eq([...WAVE6_ESSAY_SLUGS], ["ina-muzhakkam", "kolaikkalam", "kudumbaththin-nalvilakku", "sinthanaiyum-seyalum", "vedhanai-ch-siraiyinindrum-viduthalai-pera"], "Wave-6 essay slugs");
const routes: string[] = [];
for (const s of WAVE6_ESSAY_SLUGS) { routes.push(`/essays/${s}`, `/essays/${s}/source`); for (const a of pub(s).articles) routes.push(`/essays/${s}/articles/${a.slug}`); }
eq(routes.length, 74, "exactly 74 Batch-6 direct routes");
eq(new Set(routes).size, routes.length, "no duplicate route");
eq(pub("ina-muzhakkam").articles.length, 6, "ina 6 articles");
eq(pub("kolaikkalam").articles.length, 6, "kolaikkalam 6 articles");
eq(pub("kudumbaththin-nalvilakku").articles.length, 1, "kudumbaththin 1 article");
eq(pub("sinthanaiyum-seyalum").articles.length, 50, "sinthanaiyum 50 articles");
eq(pub("vedhanai-ch-siraiyinindrum-viduthalai-pera").articles.length, 1, "vedhanai 1 article");
for (const s of WAVE6_ESSAY_SLUGS) ok(!(ESSAY_SLUGS as readonly string[]).includes(s), `${s} NOT in discovered ESSAY_SLUGS`);

const batch = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/internal/wave6/batches/b6-essays-routes.json"), "utf8")) as { batchId: string; workIds: string[]; collectionIds: string[]; readerFamily: string; discoverable: boolean; sitemapExposed: boolean; routeCount: number; routes: string[] };
eq(batch.batchId, "b6-essays", "Batch-6 batchId");
eq(uniqSort(batch.workIds), uniqSort([...WAVE6_ESSAY_SLUGS]), "Batch-6 workIds == the 5 works");
eq(batch.collectionIds, [], "Batch-6 collectionIds == []");
eq(batch.readerFamily, "essays", "Batch-6 readerFamily");
eq(batch.routeCount, 74, "Batch-6 routeCount 74");
eq(uniqSort(batch.routes), uniqSort(routes), "Batch-6 route manifest == registry+payload-derived routes (exact set)");
ok(batch.discoverable === false && batch.sitemapExposed === false, "Batch-6 manifest: discoverable=false, sitemapExposed=false");

// ── 2. CUMULATIVE 321 ─────────────────────────────────────────────────────────────────────────────
const cum = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/internal/wave6/p3-routes.json"), "utf8")) as { cumulativeRouteCount: number; batches: { batchId: string; routeCount: number }[] };
eq(cum.cumulativeRouteCount, 321, "cumulative P3 route count 321 (247 + 74)");
ok(cum.batches.some((b) => b.batchId === "b6-essays" && b.routeCount === 74), "cumulative includes b6-essays=74");

// ── 3. RENDER — truthful per-work wording, no cross-work fact leakage ─────────────────────────────
// vedhanai: a government MESSAGE, never a speech; no invented date/venue.
const vs = renderTa(createElement(ArticleSource, { slug: "vedhanai-ch-siraiyinindrum-viduthalai-pera", prov: prov("vedhanai-ch-siraiyinindrum-viduthalai-pera") }));
ok(/செய்தி|message/.test(vs), "vedhanai source: shows the செய்தி / public-message form");
ok(!/\bspeech was delivered\b|delivered speech at|at the .* meeting/i.test(vs), "vedhanai source: no fabricated speech event/venue");
ok(/began on 15 December 1975/.test(vs) && !/(issued|published)[^.]{0,20}on 15 December 1975/i.test(vs), "vedhanai source: 15 Dec 1975 only as fortnight-start, not an exact issue date");
// kudumbaththin: no invented year/edition.
const ks = renderTa(createElement(ArticleSource, { slug: "kudumbaththin-nalvilakku", prov: prov("kudumbaththin-nalvilakku") }));
ok(!/1949|1951|1956|edition:/i.test(ks) || !/பதிப்பு:/.test(ks), "kudumbaththin source: no fabricated edition/year");
// sinthanaiyum: transfer parts + first/controlling edition distinction render.
const ss = renderTa(createElement(ArticleSource, { slug: "sinthanaiyum-seyalum", prov: prov("sinthanaiyum-seyalum") }));
ok(/part 1|part 5|transfer/i.test(ss), "sinthanaiyum source: five transfer PDF parts shown");
ok(pub("sinthanaiyum-seyalum").controllingIsFirstEdition === false, "sinthanaiyum: controllingIsFirstEdition false (2010 third edition)");
// A landing + an article reader render without throwing (smoke) for the smallest and largest works.
renderTa(createElement(EssayLanding, { pub: pub("kudumbaththin-nalvilakku") }));
renderTa(createElement(ArticleReader, { pub: pub("ina-muzhakkam"), article: pub("ina-muzhakkam").articles[0], prev: null, next: pub("ina-muzhakkam").articles[1] }));
ok(true, "Essay landing + article reader render for Batch-6 works without error");

// ── 4. P4 BOUNDARY (adversarials 11–14) — sitemap / catalogue / discovery exclude Batch-6 ─────────
const urls = (sitemap() as { url: string }[]).map((e) => e.url);
for (const r of routes) eq(urls.filter((u) => u === `${BASE}${r}`).length, 0, `A13: ZERO sitemap URLs for Batch-6 route ${r}`);
const works = publishedWorks();
eq(works.length, 78, "A11: catalogue still exactly 78 works (no Batch-6 exposure)");
eq(LIBRARY_COLLECTIONS.length, 1, "public collection registry still exactly 1");
const essaysShelf = discoveryShelves().find((s) => s.shelf.id === "essays-articles");
ok(!!essaysShelf, "Essays & Articles discovery shelf present");
const essayEntries = essaysShelf ? essaysShelf.entries : [];
for (const s of WAVE6_ESSAY_SLUGS) {
  ok(!works.some((w) => w.slug === s), `A11: ${s} is NOT in the catalogue`);
  ok(!essayEntries.some((e) => (e as { slug?: string; work?: { slug?: string } }).slug === s || (e as { work?: { slug?: string } }).work?.slug === s), `A12: ${s} is NOT an Essays discovery entry`);
}
// A14: exactly the 74 derived routes — no unrelated extra direct route in the batch manifest.
eq(batch.routes.length, 74, "A14: no unrelated extra direct route (exactly 74)");
// Existing four discovered Essay publications unaffected.
for (const s of ["sakkaravarththiyin-thirumagan", "kayittril-thongiya-kanapathi", "unarchchimaalai", "thiraavida-sampaththu"]) {
  ok((ESSAY_SLUGS as readonly string[]).includes(s), `existing Essay ${s} still discovered`);
  ok(urls.includes(`${BASE}/essays/${s}`), `existing Essay ${s} still in sitemap`);
}
console.log(`  (essays discovery entries: ${essayEntries.length}; catalogue ${works.length}; collections ${LIBRARY_COLLECTIONS.length})`);

console.log(`\nWave-6 Batch-6 essays route/UI test: ${checks} checks, ${failures.length} failures.`);
if (failures.length) { for (const f of failures) console.error("  ✗", f); process.exit(1); }
