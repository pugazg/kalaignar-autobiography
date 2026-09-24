/**
 * Wave 7 — B5a / B5b / B6 / Kuraloviyam — HIDDEN-BOUNDARY validator, STAGE-AWARE (P1 → P3 → P4). Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave7-b5-b6-k-p1-hidden.ts
 *
 * The frozen PRE-IMPORT baseline (live main 4e638180 before this work) is recorded verbatim and never weakened:
 *   catalogue 232 · Speeches 17 · Literary Commentary 2 · Drama 10 · Fiction 162 · Essays 15 · Cinema 10 ·
 *   collections 7 · /read discovery 90 · sitemap 4267 / 0 duplicates.
 * Stage is DERIVED from the implementation, never declared:
 *   • P1/P3 (hidden) — none of the 101 works is a LibraryWork, a discovery entry or a sitemap URL, no
 *     முத்துக் குளியல் collection exists, and every baseline number above holds exactly;
 *   • P4 (published) — the flip is ATOMIC: all 101 are LibraryWorks (exactly once), catalogue = 232 + 101,
 *     Speeches = 17 + 100, Literary Commentary = 2 + 1, collections = 7 + 2, other shelves unchanged. The
 *     exact published surface (discovery, sitemap, build) is owned by the P4 integration validator.
 * At every stage: internal import records live under data/internal (never public/), and no public payload
 * of the new works carries an internal hidden / wave / batch / readiness key.
 */
import fs from "node:fs";
import path from "node:path";
import { LIBRARY_WORKS, publishedWorks } from "../data/library";
import { discoveryShelves, LIBRARY_COLLECTIONS } from "../data/collections";
import sitemap from "../app/sitemap";
import { WAVE8_CONTRIBUTION as W8 } from "../lib/wave8-contribution";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

const BASELINE = { catalogue: 232, speeches: 17, literaryCommentary: 2, drama: 10, fiction: 162, essays: 15, cinema: 10, collections: 7, discovery: 90, sitemap: 4267 };
const readJSON = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const sman = readJSON("data/internal/wave7/b5-b6-speeches-manifest.json") as { works: { slug: string; batch: string }[] };
const kman = readJSON("data/internal/wave7/kuraloviyam-manifest.json") as { units: number };
const SPEECHES = sman.works.map((w) => w.slug);
const NEW_IDS = [...SPEECHES, "kuraloviyam"];
eq(SPEECHES.length, 100, "manifest: 100 speeches (B5a 61 + B5b 36 + B6 3)");
eq(NEW_IDS.length, 101, "population: exactly 101 new works");
eq(kman.units, 308, "Kuraloviyam: 308 reading units");

const works = publishedWorks();
const shelf = (id: string) => works.filter((w) => w.shelf === id).length;
const present = NEW_IDS.filter((id) => LIBRARY_WORKS.some((w) => w.id === id));
const stage = present.length === 0 ? "hidden" : "published";
const urls = (sitemap() as { url: string }[]).map((e) => e.url);
const discovery = discoveryShelves();
const discoveryWorkIds = discovery.flatMap((s) => s.entries.filter((e) => e.kind === "work").map((e) => (e as { work: { id: string } }).work.id));
const MUTHU = ["muthukkuliyal-part-1", "muthukkuliyal-part-2"];

if (stage === "hidden") {
  eq(works.length, BASELINE.catalogue, "hidden: catalogue == frozen baseline 232");
  eq({ speeches: shelf("speeches"), literaryCommentary: shelf("literary-commentary"), drama: shelf("drama"), fiction: shelf("fiction"), essays: shelf("essays-articles"), cinema: shelf("cinema-writing") },
    { speeches: 17, literaryCommentary: 2, drama: 10, fiction: 162, essays: 15, cinema: 10 }, "hidden: shelf counts == frozen baseline");
  eq(LIBRARY_COLLECTIONS.length, BASELINE.collections, "hidden: collections == 7");
  ok(!LIBRARY_COLLECTIONS.some((c) => MUTHU.includes(c.id)), "hidden: no முத்துக் குளியல் collection yet");
  eq(discovery.reduce((n, s) => n + s.entries.length, 0), BASELINE.discovery, "hidden: /read discovery == 90");
  eq(urls.length, BASELINE.sitemap, "hidden: sitemap == 4267");
  ok(NEW_IDS.every((id) => !discoveryWorkIds.includes(id)), "hidden: none of the 101 is a discovery entry");
  ok(SPEECHES.every((s) => !urls.some((u) => u.endsWith(`/speeches/${s}`) || u.endsWith(`/speeches/${s}/source`))), "hidden: no new speech URL in the sitemap");
  ok(!urls.some((u) => /\/kuraloviyam(\/|$)/.test(u)), "hidden: no Kuraloviyam URL in the sitemap");
} else {
  eq(present.length, 101, "published: the P4 flip is atomic — all 101 are LibraryWorks");
  eq(NEW_IDS.filter((id) => LIBRARY_WORKS.filter((w) => w.id === id).length !== 1), [], "published: each new work appears exactly once");
  eq(works.length, BASELINE.catalogue + 101 + W8.works, "published: catalogue == 232 + 101 (+ later Wave-8)");
  eq(shelf("speeches"), BASELINE.speeches + 100, "published: Speeches == 17 + 100");
  eq(shelf("literary-commentary"), BASELINE.literaryCommentary + 1 + W8.literaryCommentary, "published: Literary Commentary == 2 + 1 (+ later Wave-8 sangatamil)");
  eq({ drama: shelf("drama"), fiction: shelf("fiction"), essays: shelf("essays-articles"), cinema: shelf("cinema-writing") }, { drama: 10 + W8.drama, fiction: 162, essays: 15, cinema: 10 }, "published: other shelves unchanged (+ later Wave-8 ore-mutham)");
  eq(LIBRARY_COLLECTIONS.length, BASELINE.collections + 2, "published: collections == 7 + 2 (the two முத்துக் குளியல் publications)");
  ok(MUTHU.every((id) => LIBRARY_COLLECTIONS.some((c) => c.id === id)), "published: both முத்துக் குளியல் collections exist");
  ok(!LIBRARY_WORKS.some((w) => MUTHU.includes(w.id) || /irulum|முத்துக்/.test(w.id)), "published: no collection container is a LibraryWork");
}

// ── Every stage ───────────────────────────────────────────────────────────────────────────────────────
ok(fs.existsSync(path.join(root, "data/internal/wave7/b5-b6-speeches-manifest.json")) && fs.existsSync(path.join(root, "data/internal/wave7/kuraloviyam-manifest.json")), "internal import records live under data/internal (never served)");
const FORBIDDEN = /"(hidden|wave|batch|readiness|discoverable|sitemapExposed|publicRoute)"\s*:/;
for (const s of SPEECHES) for (const f of ["speech.json", "provenance.json"]) {
  ok(!FORBIDDEN.test(fs.readFileSync(path.join(root, "public/data/speeches", s, f), "utf8")), `${s}/${f}: no internal state in a public payload`);
}
for (const f of ["index.json", "provenance.json"]) ok(!FORBIDDEN.test(fs.readFileSync(path.join(root, "public/data/kuraloviyam", f), "utf8")), `kuraloviyam/${f}: no internal state in a public payload`);

if (fail.length) {
  console.error(`\nwave7-b5-b6-k-p1-hidden — ${checks} checks, ${fail.length} FAILED (stage ${stage})\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b5-b6-k-p1-hidden — ${checks} checks, 0 failed (stage ${stage === "hidden" ? "P1–P3 hidden" : "P4 published"})`);
