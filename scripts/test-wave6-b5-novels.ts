/**
 * Wave 6 P1–P3 Batch 5 — Novels direct reader/route regression (ROUTE + RENDER level).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave6-b5-novels.ts
 *
 * Batch 5 owns the Novels-family Wave-6 route derivation. This test proves the exact 63-route set
 * (பெரிய இடத்துப் பெண்: landing + source + 7 sections = 9; புதையல்: landing + source + 52 sections
 * = 54), that the batch manifest equals the registry+payload-derived set, that the reader renders
 * பெரிய as archive reading divisions and புதையல் as an Introduction + numbered source chapters, that
 * NO Balipeedam-specific prose (April 1947 / Erimalai Pathippagam, Thuraiyur / the embedded film) or
 * page metadata leaks onto either Batch-5 work, and — the P3/P4 boundary — that neither work is
 * exposed in the sitemap, catalogue or discovery, and that balipeedam-nokki is unaffected.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import NovelLanding from "../components/NovelLanding";
import NovelReader from "../components/NovelReader";
import NovelSource from "../components/NovelSource";
import { NOVEL_SLUGS } from "../data/novels";
import type { Novel, NovelProvenance } from "../data/novels";
import { WAVE6_NOVEL_SLUGS } from "../lib/novels-wave6-routes";
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
const novelOf = (slug: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/novels", slug, "novel.json"), "utf8")) as Novel;
const provOf = (slug: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/novels", slug, "provenance.json"), "utf8")) as NovelProvenance;
const renderTa = (el: React.ReactElement) => strip(renderToStaticMarkup(createElement(LangProvider, null, el)));
const renderEnDefault = (el: React.ReactElement) => renderToStaticMarkup(createElement(LangProvider, null, el));

// ── 1. EXACT ROUTE SET (registry + payload derived, fail-closed) ──────────────────────────────────
eq([...WAVE6_NOVEL_SLUGS], ["periya-idathup-pen", "pudhaiyal"], "Wave-6 novel slugs");
const routes: string[] = [];
for (const s of WAVE6_NOVEL_SLUGS) { routes.push(`/novels/${s}`, `/novels/${s}/source`); for (const sec of novelOf(s).sections) routes.push(`/novels/${s}/${sec.slug}`); }
eq(routes.length, 63, "exactly 63 Batch-5 direct routes");
eq(new Set(routes).size, routes.length, "no duplicate route");
eq(novelOf("periya-idathup-pen").sections.length, 7, "periya 7 sections → 9 routes");
eq(novelOf("pudhaiyal").sections.length, 52, "pudhaiyal 52 sections → 54 routes");
for (const s of WAVE6_NOVEL_SLUGS) ok(!(NOVEL_SLUGS as readonly string[]).includes(s), `${s} NOT in discovered NOVEL_SLUGS`);

const batch = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/internal/wave6/batches/b5-novels-routes.json"), "utf8")) as { batchId: string; workIds: string[]; collectionIds: string[]; readerFamily: string; discoverable: boolean; sitemapExposed: boolean; routeCount: number; routes: string[] };
eq(batch.batchId, "b5-novels", "Batch-5 batchId");
eq(uniqSort(batch.workIds), uniqSort([...WAVE6_NOVEL_SLUGS]), "Batch-5 workIds == the 2 works");
eq(batch.collectionIds, [], "Batch-5 collectionIds == [] (registers no public collection)");
eq(batch.readerFamily, "novels", "Batch-5 readerFamily");
eq(batch.routeCount, 63, "Batch-5 routeCount 63");
eq(uniqSort(batch.routes), uniqSort(routes), "Batch-5 route manifest == registry+payload-derived routes (exact set)");
ok(batch.discoverable === false && batch.sitemapExposed === false, "Batch-5 manifest: discoverable=false, sitemapExposed=false");

// ── 2. CUMULATIVE MANIFEST 247 ────────────────────────────────────────────────────────────────────
const cum = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/internal/wave6/p3-routes.json"), "utf8")) as { cumulativeRouteCount: number; batches: { batchId: string; routeCount: number }[] };
eq(cum.cumulativeRouteCount, 247, "cumulative P3 route count 247 (184 + 63)");
ok(cum.batches.some((b) => b.batchId === "b5-novels" && b.routeCount === 63), "cumulative includes b5-novels=63");

// ── 3. STRUCTURE MODEL — periya archive divisions vs pudhaiyal source chapters ────────────────────
const periya = novelOf("periya-idathup-pen");
const pudh = novelOf("pudhaiyal");
eq(periya.readingUnitKind, "archive-division", "periya readingUnitKind archive-division");
eq(pudh.readingUnitKind, "source-chapters", "pudhaiyal readingUnitKind source-chapters");
eq(periya.sections.map((s) => s.slug), ["opening", "uthandi", "kannamma-first", "kumudha", "veeran", "ulaganathar", "kannamma-conclusion"], "periya section slugs/order");
ok(pudh.sections[0].isIntroduction === true && pudh.sections[0].slug === "arimugam", "pudhaiyal first unit is the Introduction");
eq(pudh.sections.slice(1).map((s) => s.chapterNumber), Array.from({ length: 51 }, (_, k) => k + 1), "pudhaiyal chapters 1..51 in order");

// ── 4. RENDER — landing pages, no cross-work fact leakage ─────────────────────────────────────────
const periyaLanding = renderTa(createElement(NovelLanding, { novel: periya }));
const pudhLanding = renderTa(createElement(NovelLanding, { novel: pudh }));
for (const [name, html] of [["periya", periyaLanding], ["pudhaiyal", pudhLanding]] as const) {
  ok(!/1947/.test(html), `${name} landing: no 1947 (Balipeedam) date`);
  ok(!/Erimalai|எரிமலை/.test(html), `${name} landing: no Erimalai (Balipeedam) publisher`);
  ok(!/Thuraiyur|துறையூர்/.test(html), `${name} landing: no Thuraiyur (Balipeedam) place`);
  ok(!/Sacrificial Altar|பலிபீடம்/.test(html), `${name} landing: no Balipeedam title leakage`);
}
ok(/எட்டாம் பதிப்பு|திராவிடன்/.test(periyaLanding), "periya landing shows its own 1953 eighth-edition / Dravidian publisher");
ok(/அன்பு|பொறையார்/.test(pudhLanding), "pudhaiyal landing shows its own Anbu Pathippagam / Poraiyar");

// Reader render — pudhaiyal chapter shows chapter framing (not "archive division" / not 1947).
const pudhCh1 = pudh.sections[1];
const pudhReader = renderTa(createElement(NovelReader, { novel: pudh, section: pudhCh1, prev: pudh.sections[0], next: pudh.sections[2] }));
ok(!/1947/.test(pudhReader), "pudhaiyal reader: no 1947 date");
ok(!/reading division|வாசிப்புப் பிரிவு/.test(pudhReader), "pudhaiyal reader: chapters are NOT labelled archive reading divisions");
ok(/அத்தியாயம்/.test(pudhReader), "pudhaiyal reader: chapter is labelled as a chapter (அத்தியாயம்)");
// Reader render — periya section shows archive-division framing (its titles are archive labels).
const periyaSec1 = periya.sections[0];
const periyaReader = renderTa(createElement(NovelReader, { novel: periya, section: periyaSec1, prev: null, next: periya.sections[1] }));
ok(!/1947/.test(periyaReader), "periya reader: no 1947 date");
ok(!/Sacrificial Altar|பலிபீடம்/.test(periyaReader), "periya reader: no Balipeedam title leakage");

// Source page render — no embedded-sequence card for Batch-5; structure card present; SHA handling.
const pudhSource = renderTa(createElement(NovelSource, { slug: "pudhaiyal", prov: provOf("pudhaiyal") }));
ok(!/உள்ளமைந்த திரைப்படக் காட்சி/.test(pudhSource), "pudhaiyal source: no embedded-sequence CARD");
ok(/நூல் அமைப்பு/.test(pudhSource), "pudhaiyal source: shows the Work-structure card");
ok(/pending|நிலுவை/i.test(pudhSource), "pudhaiyal source: SHA shown as pending (source records it pending; not invented)");
const periyaSource = renderTa(createElement(NovelSource, { slug: "periya-idathup-pen", prov: provOf("periya-idathup-pen") }));
ok(!/உள்ளமைந்த திரைப்படக் காட்சி/.test(periyaSource), "periya source: no embedded-sequence CARD");
ok(/நூல் அமைப்பு/.test(periyaSource), "periya source: shows the Work-structure card");

// ── 5. P4 BOUNDARY — sitemap / catalogue / discovery exclude Batch-5 ──────────────────────────────
const urls = (sitemap() as { url: string }[]).map((e) => e.url);
for (const r of routes) eq(urls.filter((u) => u === `${BASE}${r}`).length, 0, `ZERO sitemap URLs for Batch-5 route ${r}`);
const works = publishedWorks();
eq(works.length, 78, "catalogue still exactly 78 works (no P4 exposure)");
eq(LIBRARY_COLLECTIONS.length, 1, "public collection registry still exactly 1");
const fiction = discoveryShelves().find((s) => s.shelf.id === "fiction");
ok(!!fiction, "fiction discovery shelf present");
const fictionEntries = fiction ? fiction.entries : [];
for (const s of WAVE6_NOVEL_SLUGS) {
  ok(!works.some((w) => w.slug === s), `${s} is NOT in the catalogue`);
  ok(!fictionEntries.some((e) => (e as { work?: { slug?: string }; slug?: string }).slug === s || (e as { work?: { slug?: string } }).work?.slug === s), `${s} is NOT a Fiction discovery entry`);
}
// balipeedam-nokki (the discovered novel) is UNAFFECTED and still discovered.
ok((NOVEL_SLUGS as readonly string[]).includes("balipeedam-nokki"), "balipeedam-nokki still in discovered NOVEL_SLUGS");
ok(urls.includes(`${BASE}/novels/balipeedam-nokki`), "balipeedam-nokki still in sitemap");
ok(works.some((w) => w.slug === "balipeedam-nokki"), "balipeedam-nokki still in catalogue");
console.log(`  (fiction discovery entries: ${fictionEntries.length} — Batch-5 adds none)`);

console.log(`\nWave-6 Batch-5 novels route/UI test: ${checks} checks, ${failures.length} failures.`);
if (failures.length) { for (const f of failures) console.error("  ✗", f); process.exit(1); }
