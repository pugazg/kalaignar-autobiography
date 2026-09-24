/**
 * Wave 7 — B5a / B5b / B6 / Kuraloviyam — P4 PUBLIC INTEGRATION validator. The authoritative gate for the exact
 * published surface of this batch. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave7-b5-b6-k-p4-integration.ts
 *
 * Proves, from the live registries (and the build tree when present):
 *   1. CATALOGUE 232→333: each of the 101 works exactly once; Speeches 17→117, Literary Commentary 2→3, every
 *      other shelf unchanged; ids unique; no collection container, இருளும் ஒளியும், C37 duplicate, Audio-06 or
 *      Kuraloviyam intake Part is a LibraryWork; no new work carries a `rights` record; condensed English is
 *      "partial" and said on the card; Kuraloviyam is ONE commentary-unit work whose card states its qualification.
 *   2. COLLECTIONS 7→9: muthukkuliyal-part-1 = the 61 B5a works, muthukkuliyal-part-2 = the 36 B5b works, in the
 *      source's printed order with ordinals 1..N, no member duplicated, memberCount == roster; members resolve to
 *      speech LibraryWorks with their own routes; the 3 assembly speeches belong to no collection.
 *   3. DISCOVERY 90→96 (visible 40→41): Speeches = 2 collection cards + 20 standalone speeches; Literary
 *      Commentary 3; no முத்துக் குளியல் member appears as its own card.
 *   4. SITEMAP 4267→4779 / 0 duplicates: exactly the 512 new routes added (set-equal), nothing else moved.
 *   5. BUILD 4276/4271 → 4788/4783 when a build tree is present.
 *   6. SPEECH_SLUGS holds each new slug exactly once; the route registry equals the frozen manifest.
 */
import fs from "node:fs";
import path from "node:path";
import { LIBRARY_WORKS, publishedWorks } from "../data/library";
import { LIBRARY_COLLECTIONS, discoveryShelves, collectionsForWork, collectionMemberWorks } from "../data/collections";
import { SPEECH_SLUGS } from "../data/speeches";
import { WAVE7_SPEECH_SLUGS } from "../lib/speeches-wave7-routes";
import { WAVE7_B5_B6_K_ROUTES } from "../lib/wave7-b5-b6-k-contribution";
import sitemap from "../app/sitemap";
import { WAVE8_CONTRIBUTION as W8 } from "../lib/wave8-contribution";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const readJSON = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

const BASE = { catalogue: 232, discovery: 90, visible: 40, collections: 7, sitemap: 4267, build: { prerender: 4276, html: 4271 } };
const sman = readJSON("data/internal/wave7/b5-b6-speeches-manifest.json") as { works: { slug: string; batch: string; englishForm: string; ordinal: number | null }[]; collections: Record<string, { members: string[]; total: number }> };
const B5A = sman.works.filter((w) => w.batch === "B5a").map((w) => w.slug);
const B5B = sman.works.filter((w) => w.batch === "B5b").map((w) => w.slug);
const B6 = sman.works.filter((w) => w.batch === "B6").map((w) => w.slug);
const NEW = [...B5A, ...B5B, ...B6, "kuraloviyam"];
eq([B5A.length, B5B.length, B6.length, NEW.length], [61, 36, 3, 101], "population: B5a 61 · B5b 36 · B6 3 · Kuraloviyam 1 = 101");

// ── 1. CATALOGUE ──────────────────────────────────────────────────────────────────────────────────────
const works = publishedWorks();
const byShelf = (id: string) => works.filter((w) => w.shelf === id).length;
eq(works.length, BASE.catalogue + 101, "catalogue 232 → 333");
eq(new Set(works.map((w) => w.id)).size, works.length, "no duplicate catalogue id");
eq(new Set(works.map((w) => w.slug)).size, works.length, "no duplicate catalogue slug");
eq({ speeches: byShelf("speeches"), literaryCommentary: byShelf("literary-commentary"), drama: byShelf("drama"), fiction: byShelf("fiction"), essays: byShelf("essays-articles"), cinema: byShelf("cinema-writing"), poetry: byShelf("poetry"), lifeWriting: byShelf("life-writing"), letters: byShelf("letters") },
  { speeches: 117, literaryCommentary: 3, drama: 10, fiction: 162, essays: 15, cinema: 10, poetry: 14, lifeWriting: 1, letters: 1 }, "shelf census: Speeches 17→117, Literary Commentary 2→3, every other shelf unchanged");
for (const id of NEW) eq(LIBRARY_WORKS.filter((w) => w.id === id).length, 1, `${id}: exactly one LibraryWork`);
for (const bad of ["muthukkuliyal-part-1", "muthukkuliyal-part-2", "irulum-oliyum", "1973-irulum-oliyum", "pazhaiya-varalarum-ilaiya-thalaimuraiyum", "kalaivanar-nsk-memorial-day-audio-06"]) ok(!LIBRARY_WORKS.some((w) => w.id === bad || w.slug === bad), `negative guard: ${bad} is not a LibraryWork`);
ok(!LIBRARY_WORKS.some((w) => /kuraloviyam-part|part-00[1-6]/.test(w.id)), "negative guard: no Kuraloviyam intake Part is a LibraryWork");
ok(!LIBRARY_WORKS.some((w) => /இருளும்/.test(w.titleTa)), "negative guard: இருளும் ஒளியும் is provenance only, never a work title");
const newWorks = works.filter((w) => NEW.includes(w.id));
ok(newWorks.every((w) => !w.rights), "no new work inherits a rights record");
ok(newWorks.every((w) => w.state === "published" && w.provenanceHref && w.sourceCommit), "every new work is published with a provenance page and a pinned source commit");
for (const w of sman.works) {
  const lw = works.find((x) => x.id === w.slug)!;
  ok(lw.href === `/speeches/${w.slug}` && lw.readerStructure === "speech" && lw.shelf === "speeches", `${w.slug}: speech LibraryWork routed to /speeches/${w.slug}`);
  ok(w.englishForm === "condensed" ? lw.english === "partial" && /condensed/.test(lw.descEn ?? "") : lw.english === "complete" && !/condensed/.test(lw.descEn ?? ""), `${w.slug}: English coverage/card match the measured English form`);
}
const k = works.find((w) => w.id === "kuraloviyam")!;
ok(k.shelf === "literary-commentary" && k.readerStructure === "commentary-unit" && k.href === "/kuraloviyam" && k.unitCount?.value === 300, "Kuraloviyam: one commentary-unit work of 300 entries at /kuraloviyam");
ok(k.tamil === "partial" && /13, 14, 15 and 19/.test(k.descEn ?? "") && /not reconstructed/.test(k.descEn ?? ""), "Kuraloviyam card states its permanent qualification (Tamil coverage partial; scans 13/14/15/19 not reconstructed)");

// ── 2. COLLECTIONS ────────────────────────────────────────────────────────────────────────────────────
eq(LIBRARY_COLLECTIONS.length, BASE.collections + 2, "collections 7 → 9");
for (const [id, want] of [["muthukkuliyal-part-1", B5A], ["muthukkuliyal-part-2", B5B]] as const) {
  const c = LIBRARY_COLLECTIONS.find((x) => x.id === id);
  ok(!!c, `${id} exists`);
  if (!c) continue;
  eq(c.shelf, "speeches", `${id}: on the Speeches shelf`);
  eq(c.kind, "anthology", `${id}: an anthology (a publication container, not a work)`);
  eq(c.members.map((m) => m.workId), sman.collections[id].members, `${id}: members in the source's printed order`);
  eq([...c.members.map((m) => m.workId)].sort(), [...want].sort(), `${id}: member set == the frozen census batch`);
  eq(c.members.map((m) => m.ordinal), Array.from({ length: want.length }, (_, i) => i + 1), `${id}: printed ordinals 1..${want.length}`);
  eq(new Set(c.members.map((m) => m.workId)).size, c.members.length, `${id}: no member duplicated`);
  eq(c.memberCount.value, want.length, `${id}: memberCount == roster (${want.length})`);
  eq(collectionMemberWorks(c).length, want.length, `${id}: every member resolves to a LibraryWork`);
  ok(c.members.every((m) => (sman.works.find((w) => w.slug === m.workId)?.ordinal) === m.ordinal), `${id}: ordinals == the source constituent numbers`);
}
for (const s of B6) eq(collectionsForWork(s).length, 0, `${s}: an assembly speech belongs to no collection`);
eq(collectionsForWork("kuraloviyam").length, 0, "Kuraloviyam belongs to no collection");

// ── 3. DISCOVERY ──────────────────────────────────────────────────────────────────────────────────────
const shelves = discoveryShelves();
const entries = shelves.flatMap((s) => s.entries);
eq(entries.length, BASE.discovery + 6, "/read discovery 90 → 96");
eq(shelves.reduce((n, s) => n + Math.min(s.entries.length, 6), 0), BASE.visible + 1, "initially visible 40 → 41 (Speeches already over the cap; Literary Commentary 3 under it)");
const sp = shelves.find((s) => s.shelf.id === "speeches")!;
eq(sp.entries.length, 22, "Speeches discovery = 2 collection cards + 20 standalone speeches");
eq(sp.entries.filter((e) => e.kind === "collection").map((e) => (e.kind === "collection" ? e.collection.id : "")), ["muthukkuliyal-part-1", "muthukkuliyal-part-2"], "Speeches collection cards");
ok(sp.entries.every((e) => e.kind !== "work" || ![...B5A, ...B5B].includes(e.work.id)), "no முத்துக் குளியல் member appears as its own discovery card");
ok(B6.every((s) => sp.entries.some((e) => e.kind === "work" && e.work.id === s)), "the 3 assembly speeches are standalone discovery entries");
eq(shelves.find((s) => s.shelf.id === "literary-commentary")!.entries.length, 3, "Literary Commentary discovery = 3");

// ── 4. SITEMAP ────────────────────────────────────────────────────────────────────────────────────────
const urls = (sitemap() as { url: string }[]).map((e) => e.url);
const paths = urls.map((u) => new URL(u).pathname);
eq(urls.length, BASE.sitemap + 512, "sitemap 4267 → 4779");
eq(urls.length - new Set(urls).size, 0, "sitemap has 0 duplicates");
eq(WAVE7_B5_B6_K_ROUTES.length, 512, "new routes = 200 speech + 310 Kuraloviyam + 2 collection landings");
ok(WAVE7_B5_B6_K_ROUTES.every((r) => paths.includes(r)), "every new route is in the sitemap");
ok(!paths.some((p) => /pazhaiya-varalarum-ilaiya|audio-06|irulum|kuraloviyam\/part/.test(p)), "no excluded identity has a sitemap URL");

// ── 5. BUILD ──────────────────────────────────────────────────────────────────────────────────────────
const PM = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(PM)) {
  const keys = Object.keys(JSON.parse(fs.readFileSync(PM, "utf8")).routes);
  let html = 0; const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith(".html")) html++; } };
  walk(path.join(root, ".next/server/app"));
  eq({ prerender: keys.length, html }, { prerender: BASE.build.prerender + 512 + W8.build, html: BASE.build.html + 512 + W8.build }, `build 4276/4271 → 4788/4783${W8.build ? ` (+ later Wave-8 ${W8.build})` : ""}`);
  ok(WAVE7_B5_B6_K_ROUTES.every((r) => keys.includes(r)), "every new route is prerendered");
} else console.log("  (no build tree — build boundary skipped; CI runs this after Build)");

// ── 6. REGISTRIES ─────────────────────────────────────────────────────────────────────────────────────
eq([...WAVE7_SPEECH_SLUGS].sort(), sman.works.map((w) => w.slug).sort(), "WAVE7_SPEECH_SLUGS == frozen manifest");
for (const s of WAVE7_SPEECH_SLUGS) eq((SPEECH_SLUGS as readonly string[]).filter((x) => x === s).length, 1, `${s}: exactly once in SPEECH_SLUGS`);
eq(new Set(SPEECH_SLUGS).size, SPEECH_SLUGS.length, "SPEECH_SLUGS has no duplicate");

if (fail.length) {
  console.error(`\nwave7-b5-b6-k-p4-integration — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b5-b6-k-p4-integration — ${checks} checks, 0 failed`);
console.log("  101 works published · catalogue 232→333 (Speeches 117 · Literary Commentary 3 · others unchanged) · collections 7→9 (61 + 36, printed order) · discovery 90→96 / visible 41 · sitemap 4267→4779/0 · build 4788/4783 · negative guards: no C37 duplicate / Audio-06 / இருளும் ஒளியும் / Kuraloviyam Part as a work");
