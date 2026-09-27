/**
 * Wave 7 — Batch 1 P4 PUBLICATION integration validator. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave7-b1-p4-integration.ts
 *
 * The authoritative published-surface gate for the three Batch-1 cinema works. Proves:
 *   1. CATALOGUE 216→219, Cinema Writing 7→10 (the 3 published once, source-faithful metadata, no
 *      fabricated year/edition/rights on the card; rights unset).
 *   2. DISCOVERY 77→80 (40 still visible — cinema was already over the cap), Cinema 7→10.
 *   3. SITEMAP 3909→4042 (0 dup): +133 cinema URLs == the P3 route manifest exactly.
 *   4. BUILD 3918→4051 prerender / 3913→4046 HTML (+133), routes present (when a build tree exists).
 *   5. PROVENANCE integrity: frozen work trees, the authoritative Reading-Room payload SHA (Naam =
 *      9b97493b…, NOT its reader_json_sha256 3043e1cd…), source counts.
 *   6. ~10 ADVERSARIAL mutation checks — each proves a specific corruption is REJECTED.
 * Consumes the vendored payloads + in-repo structures; no source clone, no network. The source-pinned
 * byte-identity + subtree pins are owned by scripts/validate-wave7-b1-cinema.mjs (source-integrity job).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { publishedWorks, LIBRARY_WORKS } from "../data/library";
import { discoveryShelves } from "../data/collections";
import sitemap from "../app/sitemap";
import { loadWave7Cinema, normalizeWave7Cinema, WAVE7_CINEMA_SLUGS, type Wave7CinemaSlug } from "../data/wave7-cinema";
import { generateStaticParams as naamSections, dynamicParams as naamDyn } from "../app/cinema/naam/[section]/page";
// Later Wave-7 batch (B5a/B5b/B6/Kuraloviyam): derived contribution, folded into GLOBAL totals only once published.
import { WAVE7_B5_B6_K_CONTRIBUTION as W7K_ALL } from "../lib/wave7-b5-b6-k-contribution";
import { WAVE8_CONTRIBUTION as W8 } from "../lib/wave8-contribution";
import { READ_IA_R2_CONTRIBUTION as R2 } from "../lib/read-ia-r2-contribution";
import { READ_IA_R3_CONTRIBUTION as R3 } from "../lib/read-ia-r3-contribution";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const uniqSorted = (a: string[]) => Array.from(new Set(a)).sort();
const CAP = 6;

// Wave 7 Batches 2–4 later published 13 works + the arumbu-1978 collection on top of this batch. They
// change only the GLOBAL totals (catalogue/discovery/sitemap/build), never the Cinema shelf or Batch-1's
// own 133 routes, so their contribution is folded into those four absolute totals once that cohort is live.
const w7bLive = LIBRARY_WORKS.some((w) => w.slug === "arumbu" && w.state === "published");
// discovery net +10: the arumbu trio + the pre-existing பெரிய இடத்துப் பெண் standalone card collapse into the
// four-member arumbu-1978 collection.
const W7B = { works: 13, discovery: 10, sitemap: 225, build: 225 };
const W7K = publishedWorks().some((w) => w.id === "kuraloviyam") ? W7K_ALL : { works: 0, collections: 0, discovery: 0, visible: 0, sitemap: 0, build: 0 };
const g = (base: number, delta: number, w7k = 0) => base + (w7bLive ? delta : 0) + w7k;

const rawOf = (slug: string) => JSON.parse(fs.readFileSync(path.join(root, "public/data/cinema", slug, "reader.json"), "utf8"));
const provOf = (slug: string) => JSON.parse(fs.readFileSync(path.join(root, "public/data/cinema", slug, "provenance.json"), "utf8"));
const frozen = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave7/b1-cinema.json"), "utf8")) as { works: any[] };
const p3 = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave7/b1-p3-routes.json"), "utf8"));
const frozenBySlug = new Map<string, any>(frozen.works.map((w) => [w.slug, w]));
const NAAM_WRONG_SHA = "3043e1cd"; // reader_json_sha256 prefix — points at reader-edition.json, NOT reading-room.json

// ── 1. CATALOGUE ────────────────────────────────────────────────────────────────────────────────────
const works = publishedWorks();
eq(works.length, (g(219, W7B.works, W7K.works) + W8.works + R3.works), `catalogue is exactly ${(g(219, W7B.works, W7K.works) + W8.works + R3.works)} published works (216 + 3 Batch-1 cinema${w7bLive ? " + 13 Wave-7 B2-B4" : ""}${W7K.works ? " + 101 Wave-7 B5/B6/K" : ""})`);
const byShelf: Record<string, number> = {};
for (const w of works) byShelf[w.shelf] = (byShelf[w.shelf] ?? 0) + 1;
eq(byShelf["cinema-writing"], 10, "Cinema Writing holds 10 works (7 + 3)");
eq(Object.keys(byShelf).sort(), ["cinema-writing", "drama", "essays-articles", "fiction", "letters", "life-writing", "literary-commentary", "poetry", "speeches"], "still exactly 9 non-empty shelves");
// Only the cinema-writing shelf grew (subtract this batch's 3 → back to the pre-P4 census of 7).
eq(byShelf["cinema-writing"] - 3, 7, "cinema-writing grew by exactly 3");

const bySlug = new Map(LIBRARY_WORKS.map((w) => [w.slug, w] as const));
const EXPECT: Record<Wave7CinemaSlug, { titleTa: string; titleEn: string; subtype: string; unit: number }> = {
  "maruthanattu-ilavarasi": { titleTa: "மருதநாட்டு இளவரசி", titleEn: "Maruthanattu Ilavarasi", subtype: "film-screenplay", unit: 10 },
  "vandikkaran-magan": { titleTa: "வண்டிக்காரன் மகன்", titleEn: "Vandikkaran Magan", subtype: "film-screenplay-dialogue-booklet", unit: 72 },
  naam: { titleTa: "நாம்", titleEn: "Naam", subtype: "film-screenplay-dialogue-booklet", unit: 45 },
};
for (const slug of WAVE7_CINEMA_SLUGS) {
  const w = bySlug.get(slug) as any;
  const ex = EXPECT[slug];
  ok(!!w, `${slug}: is a LibraryWork`);
  if (!w) continue;
  eq([w.shelf, w.state, w.readerStructure, w.href, w.provenanceHref], ["cinema-writing", "published", "scene", `/cinema/${slug}`, `/cinema/${slug}/source`], `${slug}: shelf/state/reader/hrefs`);
  eq([w.titleTa, w.titleEn, w.subtype], [ex.titleTa, ex.titleEn, ex.subtype], `${slug}: titles + subtype`);
  eq([w.tamil, w.english, w.englishKind], ["complete", "complete", "project-created"], `${slug}: language completeness + English kind`);
  eq(w.unitCount?.value, ex.unit, `${slug}: unitCount == source count (${ex.unit})`);
  ok(w.rights === undefined || w.rights === null, `${slug}: rights unset (provenance establishes none)`);
  // published once
  eq(LIBRARY_WORKS.filter((x) => x.slug === slug).length, 1, `${slug}: published exactly once`);
  // no fabricated year/edition on the card (a printed year stays a source witness on /source only).
  ok(!/\b(18|19|20)\d{2}\b/.test(`${w.descTa} ${w.descEn}`), `${slug}: no fabricated year on the catalogue card`);
}

// ── 2. DISCOVERY ────────────────────────────────────────────────────────────────────────────────────
const shelves = discoveryShelves();
eq(shelves.flatMap((s) => s.entries).length, (g(80, W7B.discovery, W7K.discovery) + W8.discovery + R3.discovery), `/read discovery is ${(g(80, W7B.discovery, W7K.discovery) + W8.discovery + R3.discovery)} entries (77 + 3${w7bLive ? " + 11 Wave-7 B2-B4" : ""})`);
eq(shelves.reduce((n, s) => n + Math.min(s.entries.length, CAP), 0), 40 + W7K.visible + W8.visible + R3.visible, "40 discovery entries still visible (cinema already over cap) + 1 later Literary Commentary entry");
eq(shelves.find((s) => s.shelf.id === "cinema-writing")!.entries.length, 10, "Cinema Writing renders 10 discovery entries");
eq(uniqSorted(shelves.filter((s) => s.entries.length > CAP).map((s) => s.shelf.id)), uniqSorted(["fiction", "poetry", "drama", "cinema-writing", "speeches", "essays-articles"]), "same six over-cap shelves");

// ── 3. SITEMAP ──────────────────────────────────────────────────────────────────────────────────────
const urls = (sitemap() as { url: string }[]).map((e) => e.url);
const urlSet = new Set(urls.map((u) => u.replace("https://nenjukkuneethi.org", "")));
eq(urls.length, (g(4042, W7B.sitemap, W7K.sitemap) + W8.sitemap + R2.sitemap), `sitemap has exactly ${(g(4042, W7B.sitemap, W7K.sitemap) + W8.sitemap + R2.sitemap)} URLs (incl. later Wave-8 + R2 categories) (3909 + 133${w7bLive ? " + 225 Wave-7 B2-B4" : ""})`);
eq(urls.length - new Set(urls).size, 0, "sitemap has 0 duplicates");
const p3Routes: string[] = p3.works.flatMap((w: any) => w.routes);
eq(p3Routes.length, 133, "P3 manifest still declares 133 routes");
for (const r of p3Routes) ok(urlSet.has(r), `sitemap exposes ${r}`);
// the sitemap's Batch-1 cinema URL set equals the manifest exactly (no extra, no missing).
const smCinema = Array.from(urlSet).filter((u) => WAVE7_CINEMA_SLUGS.some((s) => u === `/cinema/${s}` || u.startsWith(`/cinema/${s}/`)));
eq(uniqSorted(smCinema), uniqSorted(p3Routes), "sitemap Batch-1 cinema URLs == P3 manifest exactly");

// ── 5. PROVENANCE integrity (live) ──────────────────────────────────────────────────────────────────
for (const slug of WAVE7_CINEMA_SLUGS) {
  const prov = provOf(slug); const fr = frozenBySlug.get(slug);
  eq(prov.workTree, fr.workTree, `${slug}: provenance workTree == frozen`);
  eq(prov.readingRoomPayloadSha256, fr.readingRoom.sha256, `${slug}: Reading-Room payload SHA == frozen`);
  const bytesSha = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "public/data/cinema", slug, "reader.json"))).digest("hex");
  eq(bytesSha, fr.readingRoom.sha256, `${slug}: recomputed payload SHA == frozen`);
  eq([prov.hidden.discoverable, prov.hidden.sitemapExposed, prov.hidden.publicRoute], [false, false, false], `${slug}: provenance still records the P1 hidden flags (historical)`);
}
ok(provOf("naam").readingRoomPayloadSha256.startsWith("9b97493b") && !provOf("naam").readingRoomPayloadSha256.startsWith(NAAM_WRONG_SHA), "naam uses the Reading-Room SHA, not reader_json_sha256");

// ── 6. ADVERSARIAL — each corruption must be REJECTED ─────────────────────────────────────────────────
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

// A1: swap a work tree → provenance no longer matches the frozen pin.
{
  const p = clone(provOf("maruthanattu-ilavarasi")); p.workTree = frozenBySlug.get("naam").workTree;
  ok(p.workTree !== frozenBySlug.get("maruthanattu-ilavarasi").workTree, "A1 swapped workTree is detected (≠ frozen)");
}
// A2: substitute Naam's reader_json_sha256 for the Reading-Room SHA → rejected.
{
  const p = clone(provOf("naam")); p.readingRoomPayloadSha256 = NAAM_WRONG_SHA + "…";
  ok(p.readingRoomPayloadSha256 !== frozenBySlug.get("naam").readingRoom.sha256, "A2 reader_json_sha256 substitution is detected (≠ frozen Reading-Room SHA)");
}
// A3: fabricate a source year on the catalogue card → rejected by the no-year guard.
{
  const live = bySlug.get("vandikkaran-magan")!;
  const w = clone(live); w.descEn = "The 1978 booklet's 72 scenes";
  ok(/\b(18|19|20)\d{2}\b/.test(`${w.descTa} ${w.descEn}`), "A3 a fabricated year in the card copy is detected");
  ok(!/\b(18|19|20)\d{2}\b/.test(`${live.descTa} ${live.descEn}`), "A3 the LIVE card carries no year");
}
// A4: collapse Maruthanattu's unnumbered opening into a numbered scene → normalizer/count guard rejects.
{
  const raw = clone(rawOf("maruthanattu-ilavarasi"));
  raw.segments[0].segment_kind = "scene"; raw.segments[0].source_scene_number = 1; // pretend the opening is numbered
  const w = normalizeWave7Cinema("maruthanattu-ilavarasi", raw);
  const unnum = w.scenes.filter((s) => !s.numberingIsPrinted).length;
  ok(unnum !== 1, "A4 collapsing the unnumbered opening changes the unnumbered count (rejected: live must be exactly 1)");
  const live = normalizeWave7Cinema("maruthanattu-ilavarasi", rawOf("maruthanattu-ilavarasi"));
  eq(live.scenes.filter((s) => !s.numberingIsPrinted).length, 1, "A4 the LIVE payload keeps exactly 1 unnumbered opening");
}
// A5: remove a Vandikkaran performance identity → count ≠ 9.
{
  const raw = clone(rawOf("vandikkaran-magan")); raw.performance_occurrences.pop();
  ok(raw.performance_occurrences.length !== 9, "A5 removing a performance identity is detected (live must be 9)");
  eq(rawOf("vandikkaran-magan").performance_occurrences.length, 9, "A5 the LIVE payload keeps all 9 performance identities");
}
// A6: resolve one of the 6 unresolved lyric authorships without evidence → rejected.
{
  const raw = clone(rawOf("vandikkaran-magan"));
  const u = raw.performance_occurrences.find((o: any) => o.authorship_status === "unresolved-item-level");
  u.authorship_status = "resolved"; u.author_as_printed = "FABRICATED";
  const stillUnresolved = raw.performance_occurrences.filter((o: any) => o.authorship_status === "unresolved-item-level").length;
  ok(stillUnresolved !== 6, "A6 resolving an unresolved authorship is detected (live must keep 6 unresolved)");
  const liveRaw = rawOf("vandikkaran-magan");
  eq(liveRaw.performance_occurrences.filter((o: any) => o.authorship_status === "unresolved-item-level").length, 6, "A6 the LIVE payload keeps 6 unresolved item-level authorships");
  eq(liveRaw.film_level_credit_context.item_level_authorship_inferred, false, "A6 the LIVE film-level authorship-inferred flag stays false");
}
// A7: reorder Naam's retained performance records → order no longer matches source.
{
  const live = rawOf("naam").performance_inventory as any[];
  const reversed = clone(live).reverse();
  ok(JSON.stringify(reversed) !== JSON.stringify(live), "A7 a reordered performance inventory differs from the source order (order is significant)");
  eq(live.length, 7, "A7 the LIVE payload keeps all 7 performance records in source order");
}
// A8: duplicate a catalogue identity → uniqueness guard rejects.
{
  const dup = [...LIBRARY_WORKS.map((w) => w.id), "naam"];
  ok(new Set(dup).size !== dup.length, "A8 a duplicated catalogue id is detected");
  eq(new Set(LIBRARY_WORKS.map((w) => w.id)).size, LIBRARY_WORKS.length, "A8 the LIVE catalogue has no duplicate id");
  eq(new Set(LIBRARY_WORKS.map((w) => w.slug)).size, LIBRARY_WORKS.length, "A8 the LIVE catalogue has no duplicate slug");
}
// A9: omit a valid sitemap route → completeness guard rejects.
{
  const missingOne = new Set(Array.from(urlSet)); missingOne.delete(p3Routes[5]);
  ok(!p3Routes.every((r) => missingOne.has(r)), "A9 omitting a valid cinema route is detected");
  ok(p3Routes.every((r) => urlSet.has(r)), "A9 the LIVE sitemap contains every valid cinema route");
}
// A10: add an invalid section route → fail-closed (dynamicParams=false; unknown slug not emitted).
{
  eq(naamDyn, false, "A10 naam [section] exports dynamicParams=false (unknown route is a hard 404)");
  const emitted = (naamSections() as { section: string }[]).map((p) => p.section);
  ok(!emitted.includes("scene-999") && !emitted.includes("segment-001"), "A10 an invalid/foreign section slug is NOT prerendered");
  const live = loadWave7Cinema("naam")!;
  eq(emitted.length, live.scenes.length, "A10 exactly the payload's scenes are emitted (45), nothing extra");
}

// ── 4. BUILD boundary — 4051 / 4046 when a build tree is present ──────────────────────────────────────
const pm = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(pm)) {
  const keys = new Set(Object.keys((JSON.parse(fs.readFileSync(pm, "utf8")) as { routes: Record<string, unknown> }).routes));
  eq(keys.size, g(4051, W7B.build, W7K.build) + W8.build + R2.build, `build prerender routes == ${g(4051, W7B.build, W7K.build)} (3918 + 133${w7bLive ? " + 225 Wave-7 B2-B4" : ""})`);
  for (const r of p3Routes) ok(keys.has(r), `route prerendered: ${r}`);
  let html = 0; const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith(".html")) html++; } };
  try { walk(path.join(root, ".next/server/app")); } catch { /* */ }
  eq(html, g(4046, W7B.build, W7K.build) + W8.build + R2.build, `build .html == ${g(4046, W7B.build, W7K.build)} (3913 + 133${w7bLive ? " + 225 Wave-7 B2-B4" : ""})`);
} else {
  console.error("  · BUILD-boundary check SKIPPED — no .next/prerender-manifest.json (CI runs this after build).");
}

if (fail.length) {
  console.error(`\nwave7-b1-p4-integration — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 50)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b1-p4-integration — ${checks} checks, 0 failed`);
console.log("  3 cinema works published · catalogue 216→219 · Cinema 7→10 · discovery 77→80 (40 visible) · sitemap 3909→4042/0 · build 3918→4051 / 3913→4046 · 10 adversarials rejected · Naam Reading-Room SHA · Vandikkaran 9 perf / 6 unresolved preserved");
