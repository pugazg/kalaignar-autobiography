/**
 * Wave 5 P4 — Cinema cross-work integrity gate.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave5-p4-cinema-integrity.ts
 *
 * A durable, higher-level regression contract over the COMPLETED P1/P2/P3 Cinema Writing
 * implementation. It does NOT duplicate the earlier stages:
 *   - P1 already proves source → generated-data fidelity (needs the source clone). This gate instead
 *     pins the already-approved vendored payload BYTES so later changes cannot silently mutate them.
 *   - P2 already proves reader/render semantics per work.
 *   - P3 already proves the two new works' catalogue/discovery/sitemap exposure.
 * P4's job is CROSS-WORK: prove that the six Cinema works keep their distinct source semantics while
 * sharing a shelf, a reader structure and shared route/sitemap machinery — so a future edit cannot
 * flatten one into another, reorder the shelf, convert archival navigation into printed scene numbers,
 * upgrade unresolved authorship, invent a role credit or rights/edition, drift the sitemap from the
 * routes, or add/drop a Cinema work unnoticed.
 *
 * Requires NO source clone: it consumes the vendored approved payloads and the real in-repo
 * structures (catalogue, discovery, the sitemap, the Wave-5 route registry).
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { LIBRARY_WORKS, publishedWorks, type LibraryWork } from "../data/library";
import { LIBRARY_COLLECTIONS, discoveryShelves } from "../data/collections";
import sitemap from "../app/sitemap";
import { manthiriItemSlugs, rajaSectionSlugs } from "../lib/cinema-wave5-routes";
import type { ManthiriReader } from "../data/manthiri-kumari";
import type { RajaRaniReader } from "../data/raja-rani";

const CAP = 6; // must match INITIAL_WORKS_PER_SHELF in components/LibraryHome.tsx
const BASE = "https://nenjukkuneethi.org";
const root = process.cwd();

let checks = 0;
const failures: string[] = [];
const ok = (cond: boolean, label: string) => { checks++; if (!cond) failures.push(label); };
const eq = <T,>(a: T, b: T, label: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${label}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };

const sha256 = (p: string) => createHash("sha256").update(fs.readFileSync(path.join(root, p))).digest("hex");
const readJson = <T,>(p: string): T => JSON.parse(fs.readFileSync(path.join(root, p), "utf-8"));

// ── A1. Wave-5 payload immutability ───────────────────────────────────────────────────────────────
// Exact byte equality (SHA-256), not presence/length. These are the four approved P1 artifacts; the
// source-linked P1 validators independently derive them from the freeze, so pinning the bytes here
// closes the "someone hand-edits the vendored JSON" gap without a source clone.
const APPROVED_HASHES: Record<string, string> = {
  "public/data/cinema/manthiri-kumari/reader.json": "ebdbf54fde3031a5027eb0bd61874c2c606a4c765676d2b2f2802082c965bffe",
  "public/data/cinema/manthiri-kumari/provenance.json": "1355625046f020110e815c12b5aa16e006afa9dd9deb375aea44838c646a67b2",
  "public/data/cinema/raja-rani/reader.json": "f1c28efe2a3be14a7a4e379ac7f7ebd41d080ebd59566074854fffe12e7c4acf",
  "public/data/cinema/raja-rani/provenance.json": "2dbcbd4786672dfcce6b9d97a9c0ca90bf3b990fbafe4a08d8e1bdc37097ec1b",
};
for (const [p, want] of Object.entries(APPROVED_HASHES)) eq(sha256(p), want, `A1 approved bytes unchanged: ${p}`);

// ── A2. Six-work Cinema Writing census and identity ─────────────────────────────────────────────
const CINEMA_ORDER = [
  "manohara", "parasakthi", "tirumbippaar", "kalaignar-thirai-isai-paadalgal", "manthiri-kumari", "raja-rani",
];
const cinema = publishedWorks().filter((w) => w.shelf === "cinema-writing");
eq(cinema.length, 6, "A2 Cinema Writing holds exactly 6 published works");
eq(cinema.map((w) => w.id), CINEMA_ORDER, "A2 Cinema ids are the six works, in onboarding order");
eq(new Set(cinema.map((w) => w.id)).size, 6, "A2 Cinema ids are unique");
eq(new Set(cinema.map((w) => w.slug)).size, 6, "A2 Cinema slugs are unique");
eq(new Set(cinema.map((w) => w.href)).size, 6, "A2 Cinema hrefs are unique");
ok(!LIBRARY_WORKS.some((w) => w.shelf === "cinema-writing" && !CINEMA_ORDER.includes(w.id)), "A2 no seventh Cinema work record");
const byId = (id: string): LibraryWork => cinema.find((w) => w.id === id)!;

// ── A3. Preserve cross-work structural distinctions (POSITIVE assertions) ─────────────────────────
// Sharing a shelf or a readerStructure must NOT flatten source semantics. Each assertion states the
// required good state, per the Wayfinding lesson, rather than only banning a bad word.
const man = byId("manthiri-kumari");
const raja = byId("raja-rani");

// Manohara — screenplay-dialogue booklet; 57 ARCHIVE-CREATED navigation segments (not printed scenes);
// it is the ONE cinema work whose whole-work nationalisation rights model applies.
{
  const w = byId("manohara");
  eq(w.readerStructure, "scene", "A3 Manohara readerStructure scene");
  eq(w.subtype, "screenplay-dialogue", "A3 Manohara subtype screenplay-dialogue");
  eq(w.unitCount?.value, 57, "A3 Manohara 57 units");
  eq(w.unitCount?.labelEn, "archival segments", "A3 Manohara units are archival segments, not printed scenes");
  ok(w.rights?.rightsStatus === "nationalised-by-tamil-nadu-government", "A3 Manohara keeps its nationalisation rights model");
}
// Parasakthi — dialogue+songs; 46 SOURCE-PRINTED scenes; composite → no blanket rights, no edition.
{
  const w = byId("parasakthi");
  eq(w.readerStructure, "scene", "A3 Parasakthi readerStructure scene");
  eq(w.subtype, "dialogue-songs", "A3 Parasakthi subtype dialogue-songs");
  eq(w.unitCount?.value, 46, "A3 Parasakthi 46 units");
  eq(w.unitCount?.labelEn, "scenes", "A3 Parasakthi units are printed scenes (distinct from Manohara's segments)");
  ok(w.rights === undefined, "A3 Parasakthi asserts no blanket rights (composite)");
  ok(w.edition === undefined, "A3 Parasakthi infers no edition/year");
}
// Tirumbippaar — story/dialogue; 93 PRINTED scenes; composite → no rights; but it DOES print its own
// 1953 edition statement, which is preserved verbatim (distinct from Manthiri/Raja, which print none).
{
  const w = byId("tirumbippaar");
  eq(w.readerStructure, "scene", "A3 Tirumbippaar readerStructure scene");
  eq(w.subtype, "story-dialogue", "A3 Tirumbippaar subtype story-dialogue");
  eq(w.unitCount?.value, 93, "A3 Tirumbippaar 93 units");
  eq(w.unitCount?.labelEn, "scenes", "A3 Tirumbippaar units are printed scenes");
  ok(w.rights === undefined, "A3 Tirumbippaar asserts no blanket rights (composite)");
  eq(w.edition, "முதல் பதிப்பு: 1953", "A3 Tirumbippaar keeps its printed 1953 edition statement");
}
// Film Songs — film→lyric collection; 54 is a CORPUS count, never an authorship count; no rights.
{
  const w = byId("kalaignar-thirai-isai-paadalgal");
  eq(w.readerStructure, "film-song", "A3 Film Songs readerStructure film-song");
  eq(w.subtype, "film-song-collection", "A3 Film Songs subtype film-song-collection");
  eq(w.unitCount?.value, 54, "A3 Film Songs 54 corpus units");
  ok(w.rights === undefined, "A3 Film Songs asserts no blanket rights (six unresolved lyrics)");
  const copy = `${w.titleEn} ${w.descEn} ${w.descTa}`;
  ok(!/54 (songs|lyrics) (by|of) kalaignar|songs by kalaignar/i.test(copy), "A3 Film Songs card claims no 54-song authorship");
}
// Manthiri — film BOOKLET (not screenplay); 15 song/performance blocks; source-backed story/dialogue
// credit; no edition, no rights. Reader semantics: 15 unresolved, ordinals are archival navigation,
// block 11 is the sole anthology witness, perf-13 heading stays distinct.
{
  const w = man;
  eq(w.readerStructure, "film-booklet", "A3 Manthiri readerStructure film-booklet (not scene)");
  eq(w.subtype, "film-story-song-booklet", "A3 Manthiri subtype film-story-song-booklet");
  eq(w.unitCount?.value, 15, "A3 Manthiri 15 song/performance blocks");
  ok(w.edition === undefined, "A3 Manthiri infers no edition/year");
  ok(w.rights === undefined, "A3 Manthiri asserts no rights");
  const copy = `${w.descEn} ${w.descTa}`;
  ok(/story and dialogue/i.test(copy) && /கதை–வசனம்/.test(copy), "A3 Manthiri keeps its source-backed story/dialogue credit");
  ok(!/screenplay/i.test(copy), "A3 Manthiri is not called a screenplay");
  ok(!/15 (songs|lyrics) by|songs by kalaignar/i.test(copy), "A3 Manthiri claims no blanket song authorship");

  const M = readJson<ManthiriReader>("public/data/cinema/manthiri-kumari/reader.json");
  eq(M.performances.length, 15, "A3 Manthiri reader has 15 performance blocks");
  ok(M.performances.every((p) => p.sourceOrderIsPrintedNumbering === false), "A3 Manthiri ordinals are archival navigation, not printed numbering");
  ok(M.performances.every((p) => p.authorshipStatus === "unresolved"), "A3 Manthiri all 15 item lyricists remain unresolved");
  const witnesses = M.performances.filter((p) => p.anthologyRecordId);
  eq(witnesses.map((p) => p.sourceOrder), [11], "A3 Manthiri block 11 is the SOLE anthology witness");
  eq(witnesses[0]?.anthologyRecordId, "kalaignar-song-001", "A3 Manthiri block 11 witnesses kalaignar-song-001");
  const p13 = M.performances.find((p) => p.sourceOrder === 13);
  eq(p13?.headingTa, "பார்த்திபன்—மந்திரிகுமாரி", "A3 Manthiri perf-13 keeps its printed compound heading");
}
// Raja — dialogue-screenplay; 58 ARCHIVE segments (0 source-numbered scenes) + 11 source-numbered
// songs; NEUTRAL card, no role credit, no edition, no rights. Reader: 6 unresolved / 5 attributed,
// song-11↔scene-58 review-level, the three verified relations are songs 3@4 / 5@16 / 8@40.
{
  const w = raja;
  eq(w.readerStructure, "scene", "A3 Raja readerStructure scene");
  eq(w.subtype, "dialogue-screenplay", "A3 Raja subtype dialogue-screenplay");
  eq(w.unitCount?.value, 58, "A3 Raja 58 units");
  eq(w.unitCount?.labelEn, "archive segments", "A3 Raja units are archive segments, not source-numbered scenes");
  ok(w.edition === undefined, "A3 Raja infers no edition/year");
  ok(w.rights === undefined, "A3 Raja asserts no rights");
  const copy = `${w.descEn} ${w.descTa}`;
  ok(/archive segments/i.test(copy) && /களஞ்சியப் பகுதி/.test(copy), "A3 Raja frames the 58 as archive segments");
  ok(!/Kalaignar's story and dialogue/i.test(copy) && !/கலைஞரின் கதை–வசனம்/.test(copy), "A3 Raja infers no Manthiri-style story/dialogue role credit");
  ok(!/\b58 (numbered )?scenes\b|numbered scenes/i.test(copy), "A3 Raja claims no 58 numbered scenes");

  const R = readJson<RajaRaniReader>("public/data/cinema/raja-rani/reader.json");
  eq(R.screenplayScenes.length, 58, "A3 Raja reader has 58 screenplay segments");
  ok(R.screenplayScenes.every((s) => s.sourceSceneNumber === null), "A3 Raja segments carry NO source scene number (archival ordinals only)");
  eq(R.numberedSongs.length, 11, "A3 Raja reader has 11 numbered songs");
  const auth: Record<string, number> = {};
  for (const s of R.numberedSongs) auth[s.authorshipStatus] = (auth[s.authorshipStatus] || 0) + 1;
  const sortEntries = (o: Record<string, number>) => Object.entries(o).sort((a, b) => a[0].localeCompare(b[0]));
  eq(sortEntries(auth), sortEntries({ unresolved: 6, "anthology-attributed": 5 }), "A3 Raja song authorship frozen at 5 attributed / 6 unresolved");
  const links = R.numberedSongs.flatMap((s) => (s.performanceLinks ?? []).map((l) => ({ song: s.numberedSongNumber, scene: Number(l.scene), status: String(l.status) })));
  const s11 = links.find((l) => l.song === 11);
  eq(s11, { song: 11, scene: 58, status: "review" }, "A3 Raja song-11↔scene-58 stays REVIEW-level");
  const verified = links.filter((l) => l.status === "verified").map((l) => `${l.song}@${l.scene}`).sort();
  eq(verified, ["3@4", "5@16", "8@40"], "A3 Raja's three verified relations are 3@4 / 5@16 / 8@40");
}

// ── A4. Exact Cinema route-set coverage — ALL SIX families (from the REAL sitemap vs the released
// registries; no numeric reconstruction). Every family is proven by EXACT MEMBERSHIP, not by count
// alone: a same-sized route substitution inside any family must fail. Each expected set is derived
// INDEPENDENTLY from that work's own released registry:
//   * legacy four — the generated index.json child registry (segments/scenes/songs), NOT a 1..N range
//     (Parasakthi never prints headings 23/34; Film Songs has no /source route);
//   * Wave-5 two — the frozen reader.json via lib/cinema-wave5-routes (unchanged in principle).
const urls = sitemap().map((e) => e.url);
const fam = (slug: string) => urls.filter((u) => u === `${BASE}/cinema/${slug}` || u.startsWith(`${BASE}/cinema/${slug}/`));
const uniqSorted = (a: string[]) => Array.from(new Set(a)).sort();
const diff = (a: string[], b: string[]) => a.filter((x) => !b.includes(x));

// Independently-derived child slugs for the four legacy families, straight from the released registry.
const legacyChildSlugs = (slug: string, key: "segments" | "scenes" | "songs"): string[] =>
  (readJson<Record<string, { slug: string }[]>>(`public/data/cinema/${slug}/index.json`)[key]).map((x) => x.slug);
const withBase = (slug: string, children: string[], withSource: boolean): string[] => [
  `${BASE}/cinema/${slug}`,
  ...(withSource ? [`${BASE}/cinema/${slug}/source`] : []),
  ...children.map((c) => `${BASE}/cinema/${slug}/${c}`),
];
const M = readJson<ManthiriReader>("public/data/cinema/manthiri-kumari/reader.json");
const R = readJson<RajaRaniReader>("public/data/cinema/raja-rani/reader.json");

// Expected exact URL set per family + the pinned family size. The size constant pins BOTH the sitemap
// AND the registry to the same count, so a registry that itself drifted is also caught.
const EXPECT_FAMILY: { slug: string; count: number; expected: string[] }[] = [
  { slug: "manohara", count: 59, expected: withBase("manohara", legacyChildSlugs("manohara", "segments"), true) },
  { slug: "parasakthi", count: 48, expected: withBase("parasakthi", legacyChildSlugs("parasakthi", "scenes"), true) },
  { slug: "tirumbippaar", count: 95, expected: withBase("tirumbippaar", legacyChildSlugs("tirumbippaar", "scenes"), true) },
  { slug: "thirai-isai-paadalgal", count: 55, expected: withBase("thirai-isai-paadalgal", legacyChildSlugs("thirai-isai-paadalgal", "songs"), false) },
  { slug: "manthiri-kumari", count: 18, expected: withBase("manthiri-kumari", manthiriItemSlugs(M), true) },
  { slug: "raja-rani", count: 71, expected: withBase("raja-rani", rajaSectionSlugs(R), true) },
];
for (const { slug, count, expected } of EXPECT_FAMILY) {
  const actual = fam(slug);
  // 0. the registry itself is the expected size (guards a registry that drifted its own count).
  eq(expected.length, count, `A4 ${slug} registry-derived family size == ${count}`);
  // 1. sitemap family length == expected length.
  eq(actual.length, count, `A4 ${slug} sitemap family length == ${count}`);
  // 5. no duplicate URL within the family.
  eq(new Set(actual).size, actual.length, `A4 ${slug} family has no duplicate URL`);
  // 2. sorted exact URL arrays equal.
  eq(uniqSorted(actual), uniqSorted(expected), `A4 ${slug} sitemap set == released registry (exact membership)`);
  // 3 + 4. bidirectional set-difference empty (no substitution can hide in a same-sized set).
  eq(diff(actual, expected), [], `A4 ${slug} has no sitemap URL outside its registry`);
  eq(diff(expected, actual), [], `A4 ${slug} has no registry URL missing from the sitemap`);
}

// Global Cinema invariants.
const cinemaUrls = urls.filter((u) => u.startsWith(`${BASE}/cinema/`));
eq(cinemaUrls.length, 346, "A4 Cinema route total = 346");
eq(new Set(cinemaUrls).size, cinemaUrls.length, "A4 no duplicate Cinema URL");
// Every Cinema URL belongs to exactly one of the six families (no cross-family collision).
const familySlugs = EXPECT_FAMILY.map((f) => f.slug);
for (const u of cinemaUrls) {
  const owners = familySlugs.filter((slug) => u === `${BASE}/cinema/${slug}` || u.startsWith(`${BASE}/cinema/${slug}/`));
  ok(owners.length === 1, `A4 ${u} belongs to exactly one Cinema family (got ${owners.length})`);
}
// The six exact families partition the whole Cinema route set — nothing else lives under /cinema/.
const allExpectedCinema = uniqSorted(EXPECT_FAMILY.flatMap((f) => f.expected));
eq(uniqSorted(cinemaUrls), allExpectedCinema, "A4 the six families exactly partition the Cinema route set");
eq(fam("manthiri-kumari").length + fam("raja-rani").length, 89, "A4 Wave-5 subset is exactly 18 + 71 = 89");

// ── A5. Global Reading Room invariants ────────────────────────────────────────────────────────────
const works = publishedWorks();
eq(works.length, 78, "A5 published works = 78");
const byShelf: Record<string, number> = {};
for (const w of works) byShelf[w.shelf] = (byShelf[w.shelf] || 0) + 1;
// Compare as sorted [shelf, count] pairs so a change in LIBRARY_WORKS declaration order (which sets
// the object's key order) is not mistaken for a census change.
const sortedCensus = (o: Record<string, number>) => Object.entries(o).sort((a, b) => a[0].localeCompare(b[0]));
eq(sortedCensus(byShelf), sortedCensus({
  "life-writing": 1, letters: 1, fiction: 39, poetry: 6, drama: 5,
  "cinema-writing": 6, speeches: 14, "essays-articles": 4, "literary-commentary": 2,
}), "A5 shelf census unchanged");
eq(Object.keys(byShelf).length, 9, "A5 exactly 9 non-empty shelves");
eq(LIBRARY_COLLECTIONS.length, 1, "A5 collections = 1");
const shelves = discoveryShelves();
const entries = shelves.flatMap((s) => s.entries);
eq(entries.length, 42, "A5 discovery entries = 42");
eq(shelves.reduce((n, s) => n + Math.min(s.entries.length, CAP), 0), 34, "A5 initially visible discovery entries = 34");
const cin = shelves.find((s) => s.shelf.id === "cinema-writing")!;
eq(cin.entries.length, 6, "A5 Cinema renders 6 discovery entries (at the cap)");
ok(cin.entries.length <= CAP, "A5 Cinema is within the cap — no disclosure control");
eq(shelves.filter((s) => s.entries.length > CAP).map((s) => s.shelf.id).sort(), ["speeches"], "A5 Speeches is the sole over-cap shelf");
eq(shelves.find((s) => s.shelf.id === "fiction")!.entries.length, 3, "A5 Fiction has 3 discovery entries despite 39 works");

// ── A6. Sitemap boundary ────────────────────────────────────────────────────────────────────────
eq(urls.length, 3351, "A6 sitemap holds 3351 URLs");
eq(new Set(urls).size, urls.length, "A6 sitemap has 0 duplicate URLs");

// ── A7. Build-output boundary (uses REAL Next artifacts; runs after a build) ──────────────────────
// Honest degradation: without a build there is no prerender manifest to read, so rather than restate
// constants (a fake proof) we skip with a visible note. In CI this step runs AFTER `npm run build`,
// so the artifacts are present and the assertions execute.
const manifestPath = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as { routes: Record<string, unknown> };
  const routeKeys = Object.keys(manifest.routes);
  eq(routeKeys.length, 3360, "A7 prerender-manifest routes = 3360");
  const htmlCount = countHtml(path.join(root, ".next/server/app"));
  eq(htmlCount, 3355, "A7 prerendered .html files = 3355");
  // The Wave-5 routes exist in the build; representative invalid children do not.
  const present = ["/cinema/manthiri-kumari", "/cinema/manthiri-kumari/story-summary", "/cinema/manthiri-kumari/performance-15",
    "/cinema/raja-rani", "/cinema/raja-rani/scene-058", "/cinema/raja-rani/song-11"];
  for (const r of present) ok(routeKeys.includes(r), `A7 build prerenders ${r}`);
  for (const r of ["/cinema/manthiri-kumari/performance-16", "/cinema/raja-rani/scene-059", "/cinema/raja-rani/song-12", "/cinema/raja-rani/scene-000"]) {
    ok(!routeKeys.includes(r), `A7 build does NOT prerender invalid ${r}`);
  }
  // Build-vs-sitemap same-size drift gap: prove the WHOLE Cinema route set the production build
  // actually prerenders equals the Cinema route set the sitemap advertises — as EXACT sets, so a
  // same-sized substitution (a build route not in the sitemap, or vice versa) cannot hide behind a
  // matching 346 count. The manifest routes are pathnames; convert the sitemap Cinema URLs likewise.
  // (Empirically the manifest represents every Cinema route — landings, /source and children — as a
  // /cinema/… key, so this comparison is truthful; if a future Next release changed that
  // representation the equality would surface it rather than being silently weakened.)
  const buildCinema = uniqSorted(routeKeys.filter((k) => k.startsWith("/cinema/")));
  const sitemapCinemaPaths = uniqSorted(cinemaUrls.map((u) => u.replace(BASE, "")));
  eq(buildCinema.length, 346, "A7 build prerenders exactly 346 Cinema routes");
  eq(buildCinema, sitemapCinemaPaths, "A7 build Cinema route set == sitemap Cinema route set (exact)");
  eq(diff(buildCinema, sitemapCinemaPaths), [], "A7 no build-only Cinema route");
  eq(diff(sitemapCinemaPaths, buildCinema), [], "A7 no sitemap-only Cinema route");
} else {
  console.error("  · A7 build-output boundary SKIPPED — no .next/prerender-manifest.json (run `npm run build` first; CI runs this step after build).");
}

function countHtml(dir: string): number {
  let n = 0;
  const walk = (d: string) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith(".html")) n++;
    }
  };
  try { walk(dir); } catch { /* no build tree */ }
  return n;
}

// ── Report ──────────────────────────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`\nwave5-p4-cinema-integrity — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exitCode = 1;
} else {
  console.log(`\nwave5-p4-cinema-integrity — ${checks} checks, 0 failed`);
  console.log("  6 Cinema works · 4 payloads byte-pinned · route families 59/48/95/55/18/71 = 346 · Wave-5 89 = 18+71 · 78 works · sitemap 3351/0");
}
