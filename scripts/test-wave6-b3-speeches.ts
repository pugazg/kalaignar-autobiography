/**
 * Wave 6 P1–P3 Batch 3 — Speeches direct reader/route regression (ROUTE + RENDER level).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave6-b3-speeches.ts
 *
 * Batch 3 OWNS the Speech-family route derivation: this test proves the exact 6-route set (2 per
 * work — reader + source; no per-section child routes), that the batch manifest equals it, that the
 * provenance page renders the correct source semantics (date/venue null, two-House witness,
 * multi-section booklet, compilation), and — the P3 boundary — that none of the three works is
 * exposed in the sitemap, catalogue or discovery, and that existing speech readers are unaffected.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import SpeechSource from "../components/SpeechSource";
import type { Speech, SpeechProvenance } from "../data/speeches";
import { SPEECH_SLUGS } from "../data/speeches";
import { WAVE6_SPEECH_SLUGS } from "../lib/speeches-wave6-routes";
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
const speech = (slug: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/speeches", slug, "speech.json"), "utf8")) as Speech;
const prov = (slug: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/speeches", slug, "provenance.json"), "utf8")) as SpeechProvenance;
const renderSourceEn = (slug: string) => strip(renderToStaticMarkup(createElement(SpeechSource, { slug, prov: prov(slug) }))); // context default = English

// ── 1. EXACT ROUTE SET (registry-derived, fail-closed) ─────────────────────────
eq([...WAVE6_SPEECH_SLUGS], ["namathu-nilai", "idhaya-perikai", "palli-vazhkkai"], "Wave-6 speech slugs are exactly the three batch works");
const routes = WAVE6_SPEECH_SLUGS.flatMap((slug) => [`/speeches/${slug}`, `/speeches/${slug}/source`]);
eq(routes.length, 6, "6 direct routes (3 readers + 3 source pages)");
eq(new Set(routes).size, routes.length, "no duplicate route");
for (const slug of WAVE6_SPEECH_SLUGS) ok(!(SPEECH_SLUGS as readonly string[]).includes(slug), `${slug} is NOT in the discovered SPEECH_SLUGS`);

const batch = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/internal/wave6/batches/b3-speeches-routes.json"), "utf8")) as { batchId: string; workIds: string[]; collectionIds: string[]; readerFamily: string; discoverable: boolean; sitemapExposed: boolean; routes: string[] };
eq(batch.batchId, "b3-speeches", "Batch-3 batchId");
eq(uniqSort(batch.workIds), ["idhaya-perikai", "namathu-nilai", "palli-vazhkkai"], "Batch-3 workIds == the three speeches");
eq(batch.collectionIds, [], "Batch-3 collectionIds == [] (registers no public collection)");
ok((batch as unknown as { workId?: unknown }).workId === undefined, "Batch-3 manifest does not use the retired singular workId");
eq(batch.readerFamily, "speech", "Batch-3 readerFamily");
eq(uniqSort(batch.routes), uniqSort(routes), "Batch-3 route manifest == registry-derived routes (exact set)");
ok(batch.discoverable === false && batch.sitemapExposed === false, "Batch-3 manifest: discoverable=false, sitemapExposed=false");

// ── 2. P3 BOUNDARY — NOT in sitemap, catalogue or discovery ─────────────────────
const urls = sitemap().map((e) => e.url);
for (const slug of WAVE6_SPEECH_SLUGS) eq(urls.filter((u) => u === `${BASE}/speeches/${slug}` || u.startsWith(`${BASE}/speeches/${slug}/`)).length, 0, `ZERO ${slug} URLs in the sitemap (P3, not P4)`);
const works = publishedWorks();
eq(works.length, 78, "catalogue still 78 works (no P4 exposure)");
for (const slug of WAVE6_SPEECH_SLUGS) ok(!works.some((w) => w.slug === slug), `${slug} is NOT in the catalogue`);
const speechEntries = discoveryShelves().find((s) => s.shelf.id === "speeches")!.entries;
eq(speechEntries.length, 14, "Speeches discovery still 14 entries (no Wave-6 card)");
eq(LIBRARY_COLLECTIONS.length, 1, "public collection registry still exactly 1");

// ── 3. DATA SEMANTICS + RENDERED /source ────────────────────────────────────────
for (const slug of WAVE6_SPEECH_SLUGS) eq(speech(slug).date, null, `${slug}: speech.date is null`);
{
  // நமது நிலை — assembly, two-House witness, two editorial units.
  const s = speech("namathu-nilai") as Extract<Speech, { subtype: "assembly-speech" }>;
  eq(s.subtype, "assembly-speech", "namathu is an assembly speech");
  ok(/பேரவை/.test(s.legislature.nameTa) && /மேலவை/.test(s.legislature.nameTa), "namathu legislature names both Houses");
  eq(s.tamil.blocks.filter((b) => b.kind === "heading" && /^Editorial unit\s+\d/i.test((b as { text: string }).text)).length, 2, "namathu keeps two editorial units");
  const src = renderSourceEn("namathu-nilai");
  ok(/two-House|two House/i.test(src), "namathu /source renders the two-House witness note");
  ok(!/\b\d{4}-\d{2}-\d{2} speech\b/.test(src), "namathu /source asserts no single speech date");
}
{
  // இதய பேரிகை — 7 sections, all single-event fields null.
  const s = speech("idhaya-perikai") as Extract<Speech, { subtype: "public-speech" }>;
  eq(s.subtype, "public-speech", "idhaya is a public speech");
  eq([s.venue ?? null, s.event ?? null, s.occasion ?? null, s.audience ?? null], [null, null, null, null], "idhaya venue/event/occasion/audience all null");
  eq(s.tamil.blocks.filter((b) => b.kind === "heading").length, 7, "idhaya keeps the 7 printed sections");
  const src = renderSourceEn("idhaya-perikai");
  ok(/does not (?:establish|state)|not stated|no single/i.test(src), "idhaya /source states the source establishes no single date/venue");
}
{
  // பள்ளி வாழ்க்கை — compilation, all null, compiler recorded.
  const s = speech("palli-vazhkkai") as Extract<Speech, { subtype: "public-speech" }>;
  eq([s.venue ?? null, s.event ?? null, s.occasion ?? null, s.audience ?? null], [null, null, null, null], "palli venue/event/occasion/audience all null");
  const src = renderSourceEn("palli-vazhkkai");
  ok(/நமச்சிவாயம்|compil/i.test(src), "palli /source records the compilation / compiler");
}

// ── 4. EXISTING SPEECH READERS UNAFFECTED ───────────────────────────────────────
// A discovered speech's /source must not inherit Batch-3 semantics copy it does not carry.
for (const slug of ["poonthottam", "arappor"].filter((s) => (SPEECH_SLUGS as readonly string[]).includes(s))) {
  const p = prov(slug);
  ok(p.semantics === undefined, `existing speech ${slug} carries no Batch-3 semantics block`);
}

// ── 5. BUILD BOUNDARY (only if a production build tree is present) ───────────────
const manifestPath = path.join(process.cwd(), ".next/prerender-manifest.json");
if (fs.existsSync(manifestPath)) {
  const routeKeys = Object.keys((JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as { routes: Record<string, unknown> }).routes);
  for (const slug of WAVE6_SPEECH_SLUGS) {
    const built = routeKeys.filter((k) => k === `/speeches/${slug}` || k.startsWith(`/speeches/${slug}/`)).sort();
    eq(built, [`/speeches/${slug}`, `/speeches/${slug}/source`], `build prerenders exactly ${slug}'s 2 routes`);
  }
  for (const bad of ["/speeches/namathu-nilai/section-1", "/speeches/idhaya-perikai/1", "/speeches/palli-vazhkkai/source/x"]) {
    ok(!routeKeys.includes(bad), `build does NOT prerender invalid ${bad}`);
  }
} else {
  console.error("  · build boundary SKIPPED — no .next/prerender-manifest.json (run `npm run build` first; CI runs this after build).");
}

if (failures.length) {
  console.error(`\nwave6-b3-speeches — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave6-b3-speeches — ${checks} checks, 0 failed`);
console.log("  3 speeches · 6 direct routes (registry-derived, fail-closed) · two-House / 7-section / compilation semantics · date:null · 0 sitemap URLs · catalogue 78 · Speeches discovery 14");
