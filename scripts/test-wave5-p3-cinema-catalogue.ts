/**
 * Wave 5 P3 — Cinema catalogue / discovery / sitemap exposure.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave5-p3-cinema-catalogue.ts
 *
 * Proves P3 turned the two already-live P2 cinema works into normal Reading Room catalogue/discovery/
 * sitemap members, at exactly the intended counts, without touching any other shelf, without adding new
 * reader routes, and without overclaiming authorship or scene numbering on the catalogue cards.
 */
import fs from "node:fs";
import path from "node:path";
import { LIBRARY_WORKS, publishedWorks } from "../data/library";
import { LIBRARY_COLLECTIONS, discoveryShelves } from "../data/collections";
import sitemap from "../app/sitemap";
import { manthiriItemSlugs, rajaSectionSlugs } from "../lib/cinema-wave5-routes";
import type { ManthiriReader } from "../data/manthiri-kumari";
import type { RajaRaniReader } from "../data/raja-rani";

const CAP = 6; // must match INITIAL_WORKS_PER_SHELF
let checks = 0;
const failures: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) failures.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };

const readerOf = <T,>(slug: string): T => JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/cinema", slug, "reader.json"), "utf-8"));
const M = readerOf<ManthiriReader>("manthiri-kumari");
const R = readerOf<RajaRaniReader>("raja-rani");

// ── CATALOGUE ───────────────────────────────────────────────────────────────────
const works = publishedWorks();
eq(works.length, 78, "catalogue holds 78 published works");
const man = LIBRARY_WORKS.filter((w) => w.slug === "manthiri-kumari");
const raja = LIBRARY_WORKS.filter((w) => w.slug === "raja-rani");
eq(man.length, 1, "exactly one Manthiri Kumari work record");
eq(raja.length, 1, "exactly one Raja Rani work record");
eq(man[0]?.shelf, "cinema-writing", "Manthiri is on Cinema Writing");
eq(raja[0]?.shelf, "cinema-writing", "Raja is on Cinema Writing");
eq(man[0]?.href, "/cinema/manthiri-kumari", "Manthiri landing href");
eq(raja[0]?.href, "/cinema/raja-rani", "Raja landing href");
eq(man[0]?.state, "published", "Manthiri is published");
eq(raja[0]?.state, "published", "Raja is published");
const byShelf: Record<string, number> = {};
for (const w of works) byShelf[w.shelf] = (byShelf[w.shelf] || 0) + 1;
eq(byShelf["cinema-writing"], 6, "Cinema Writing holds 6 works");
// Every OTHER shelf unchanged from the pre-P3 baseline.
eq(byShelf["poetry"], 6, "Poetry unchanged (6)");
eq(byShelf["fiction"], 39, "Fiction unchanged (39)");
eq(byShelf["drama"], 5, "Drama unchanged (5)");
eq(byShelf["speeches"], 14, "Speeches unchanged (14)");
eq(byShelf["essays-articles"], 4, "Essays & Articles unchanged (4)");
eq(byShelf["literary-commentary"], 2, "Literary Commentary unchanged (2)");
eq(byShelf["life-writing"], 1, "Life Writing unchanged (1)");
eq(byShelf["letters"], 1, "Letters unchanged (1)");
eq(Object.keys(byShelf).length, 9, "exactly 9 non-empty shelves");
eq(LIBRARY_COLLECTIONS.length, 1, "collections remain 1");

// ── DISCOVERY ─────────────────────────────────────────────────────────────────
const shelves = discoveryShelves();
const entries = shelves.flatMap((s) => s.entries);
eq(entries.length, 42, "42 discovery entries");
const initiallyVisible = shelves.reduce((n, s) => n + Math.min(s.entries.length, CAP), 0);
eq(initiallyVisible, 34, "34 initially visible discovery entries");
const cinema = shelves.find((s) => s.shelf.id === "cinema-writing")!;
eq(cinema.entries.length, 6, "Cinema Writing renders 6 discovery entries");
ok(cinema.entries.length <= CAP, "Cinema Writing is within the cap — no disclosure control");
const cinemaHrefs = cinema.entries.map((e) => (e.kind === "collection" ? e.collection.href : e.work.href));
ok(cinemaHrefs.includes("/cinema/manthiri-kumari") && cinemaHrefs.includes("/cinema/raja-rani"), "both new works resolve in Cinema discovery");
// Deterministic onboarding order (LIBRARY_WORKS declaration order).
eq(cinemaHrefs, [
  "/cinema/manohara", "/cinema/parasakthi", "/cinema/tirumbippaar",
  "/cinema/thirai-isai-paadalgal", "/cinema/manthiri-kumari", "/cinema/raja-rani",
], "Cinema shelf order is manohara · parasakthi · tirumbippaar · film-songs · manthiri · raja");
// Only over-cap shelves get a disclosure; adding 2 cinema works (6 ≤ cap) adds none.
eq(shelves.filter((s) => s.entries.length > CAP).length, 1, "exactly one shelf over the cap (Fiction), unchanged by P3");

// ── SITEMAP ─────────────────────────────────────────────────────────────────────
const urls = sitemap().map((e) => e.url);
const origin = new URL(urls[0]).origin;
eq(urls.length, 3351, "sitemap holds 3351 URLs");
eq(new Set(urls).size, urls.length, "sitemap has 0 duplicate URLs");
const manUrls = urls.filter((u) => u.startsWith(`${origin}/cinema/manthiri-kumari`));
const rajaUrls = urls.filter((u) => u.startsWith(`${origin}/cinema/raja-rani`));
eq(manUrls.length, 18, "18 Manthiri sitemap URLs");
eq(rajaUrls.length, 71, "71 Raja Rani sitemap URLs");
eq(manUrls.length + rajaUrls.length, 89, "89 Wave-5 cinema URLs added");
// Exact expected sets from the frozen registries.
const expMan = new Set([`${origin}/cinema/manthiri-kumari`, `${origin}/cinema/manthiri-kumari/source`, ...manthiriItemSlugs(M).map((s) => `${origin}/cinema/manthiri-kumari/${s}`)]);
const expRaja = new Set([`${origin}/cinema/raja-rani`, `${origin}/cinema/raja-rani/source`, ...rajaSectionSlugs(R).map((s) => `${origin}/cinema/raja-rani/${s}`)]);
eq(new Set(manUrls), expMan, "Manthiri sitemap set == registry (landing + source + summary + 15 performances)");
eq(new Set(rajaUrls), expRaja, "Raja sitemap set == registry (landing + source + 58 segments + 11 songs)");
// Presence spot-checks.
for (const u of ["/cinema/manthiri-kumari", "/cinema/manthiri-kumari/source", "/cinema/manthiri-kumari/story-summary", "/cinema/manthiri-kumari/performance-01", "/cinema/manthiri-kumari/performance-15",
  "/cinema/raja-rani", "/cinema/raja-rani/source", "/cinema/raja-rani/scene-001", "/cinema/raja-rani/scene-058", "/cinema/raja-rani/song-01", "/cinema/raja-rani/song-11"]) {
  ok(urls.includes(`${origin}${u}`), `sitemap includes ${u}`);
}
// Fail-closed absence — nothing outside the registries.
for (const u of ["/cinema/manthiri-kumari/performance-16", "/cinema/raja-rani/scene-059", "/cinema/raja-rani/song-12", "/cinema/raja-rani/scene-000"]) {
  ok(!urls.includes(`${origin}${u}`), `sitemap excludes non-existent ${u}`);
}

// ── SEMANTIC RESTRAINT on the catalogue cards ────────────────────────────────────
const mCopy = `${man[0].titleEn} ${man[0].descEn} ${man[0].descTa}`;
ok(!/full screenplay|complete screenplay|screenplay/i.test(mCopy), "Manthiri card does not call it a screenplay");
ok(!/15 (songs|lyrics) by|songs by kalaignar|lyrics by/i.test(mCopy), "Manthiri card claims no blanket song authorship");
ok(man[0].edition === undefined, "Manthiri card asserts no edition/year");
ok(man[0].rights === undefined, "Manthiri card asserts no rights status");
const rCopy = `${raja[0].titleEn} ${raja[0].descEn} ${raja[0].descTa}`;
ok(!/\b58 (numbered )?scenes\b|numbered scenes/i.test(rCopy), "Raja card claims no 58 numbered scenes");
ok(!/11 (songs|lyrics) by|songs by kalaignar/i.test(rCopy), "Raja card claims no blanket song authorship");
ok(/archive segment|களஞ்சியப் பகுதி/.test(rCopy), "Raja card frames the 58 as archive segments");
ok(raja[0].edition === undefined, "Raja card asserts no edition/year");
ok(raja[0].rights === undefined, "Raja card asserts no rights status");

if (failures.length) {
  console.error(`\nwave5-p3-cinema-catalogue — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  x " + f);
  process.exit(1);
}
console.log(`\nwave5-p3-cinema-catalogue — ${checks} checks, 0 failed`);
console.log("  78 works · Cinema Writing 6 · discovery 42 / visible 34 · collections 1 · sitemap 3351 (+89, 0 dup) · deterministic order · no overclaims");
