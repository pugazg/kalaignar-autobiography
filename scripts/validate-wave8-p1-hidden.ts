/**
 * Wave 8 — HIDDEN-FOUNDATION validator (P1), written to evolve through P2–P4. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave8-p1-hidden.ts
 *
 * Wave 8 = 8 source publication inputs but only 2 new canonical LibraryWorks: Murasoli Volumes 42–47 expand the ONE
 * existing `murasoli-letters` work; `ore-mutham` (Drama) and `sangatamil` (Literary Commentary) are new. At P1 the
 * source-pinned data exists ONLY under data/internal/wave8/ and the public surface is exactly the frozen Wave-7
 * accepted baseline. This validator proves both:
 *   A. public invariants — catalogue / shelves / collections / discovery / sitemap / build / route registries unchanged,
 *      live Murasoli Vols 48–54 payload byte-identical, no Wave-8 identity or payload anywhere public;
 *   B. internal invariants — Murasoli 342/342 with source-faithful identity and the Vol-47 qualification,
 *      ஒரே முத்தம் 30 + 3 two-part structure, சங்கத் தமிழ் 497 scans with scan 8 permanently source-limited and every
 *      printed provenance record typed apart from Kalaignar's text;
 *   C. integrity — manifest artifact hashes, architecture-decision evidence, additive play-model change.
 * Later stages extend section A's expectations explicitly (never by weakening the P1 numbers recorded here).
 * Requires a production build (`npm run build`) for the build/route checks — CI runs it after Build.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { publishedWorks, LIBRARY_WORKS } from "../data/library";
import { discoveryShelves, LIBRARY_COLLECTIONS } from "../data/collections";
import sitemap from "../app/sitemap";
import { PLAY_SLUGS } from "../data/plays";
import { WAVE6_DRAMA_SLUGS } from "../lib/drama-wave6-routes";
import { WAVE7_DRAMA_SLUGS } from "../lib/drama-wave7-routes";
import { WAVE8_DRAMA_SLUGS } from "../lib/drama-wave8-routes";
import { READ_IA_R2_CONTRIBUTION as R2 } from "../lib/read-ia-r2-contribution";
// The /plays route registry is the de-duplicated union of these three lists (app/plays/[slug]/page.tsx).
const ALL_PLAY_SLUGS: readonly string[] = Array.from(new Set<string>([...PLAY_SLUGS, ...WAVE6_DRAMA_SLUGS, ...WAVE7_DRAMA_SLUGS]));

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const sha = (b: Buffer | string) => crypto.createHash("sha256").update(b).digest("hex");
const readJSON = <T,>(rel: string): T => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const W8 = "data/internal/wave8";

// ── Frozen P1 public boundary (the Wave-7 accepted baseline, unchanged by P1) ─────────────────────────
const P1_FROZEN = {
  catalogue: 333, letters: 1, drama: 10, literaryCommentary: 3, collections: 9, discovery: 96, visible: 41,
  sitemap: 4779, sitemapDup: 0, build: { prerender: 4788, html: 4783 },
  murasoliPublicVolumes: [48, 49, 50, 51, 52, 53, 54], murasoliPublicLetters: 346,
  // Byte-identity pins of the live Murasoli payload at the P1 base (cf769d06…): P1 must change 0 bytes.
  murasoliPublic: {
    files: 1000,
    aggregate: "2783e024dfb227a3c3ab087bad2b36e681b8cb9316a9fd9c7db09f8978d1f90b",
    indexJson: "b480055d7d9a5cbcf3c75f98ad2cc4c544e80f3db5cfe343d9040a46c72e2356",
    lettersIndexJson: "aeee7fe8480a1ef11fad775ac2500d7cdbd134b1a68aa67efdefff64cb856ac3",
  },
};

const manifest = readJSON<any>(`${W8}/wave8-p1-manifest.json`);
// Stage awareness (P3+): P3 makes the Wave-8 cohort DIRECTLY addressable (still undiscovered). Its committed route
// manifest is the only thing that extends the route-surface expectations below; every P1 number stays as recorded.
const P3_FILE = `${W8}/wave8-p3-routes.json`;
const P3 = fs.existsSync(path.join(process.cwd(), P3_FILE)) ? readJSON<{ stage: string; discoverable: boolean; sitemapExposed: boolean; counts: Record<string, number>; cohorts: Record<string, { routes: string[] }> }>(P3_FILE) : null;
const P3_ROUTES = P3 ? Object.values(P3.cohorts).flatMap((c) => c.routes) : [];
const P3_OK = !!P3 && P3.stage === "P3" && P3.discoverable === false && P3.sitemapExposed === false
  && JSON.stringify(P3.counts) === JSON.stringify({ murasoli: 342, oreMutham: 35, sangatamil: 106, total: 483, unique: 483 }) && new Set(P3_ROUTES).size === 483;
const P3_DELTA = P3 ? 483 : 0;
// Stage P4 (published): the committed publication record flips the PUBLIC-surface expectations to the published
// Wave-8 surface — two new works, Drama 11 / Literary Commentary 4, /read 98 / 42, sitemap 5262 (all 483 routes),
// Murasoli 42–54 / 688 letters — while every archival (section B) and integrity (section C) check is unchanged.
const P4_FILE = `${W8}/wave8-p4-publication.json`;
const P4 = fs.existsSync(path.join(process.cwd(), P4_FILE)) ? readJSON<{ stage: string; published: boolean }>(P4_FILE) : null;
const PUB = !!P4 && P4.stage === "P4" && P4.published === true;
const P4_EXPECT = {
  catalogue: 335, drama: 11, literaryCommentary: 4, discovery: 98, visible: 42, sitemap: 5262, playRegistry: 11,
  murasoliPublicVolumes: [42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54], murasoliPublicLetters: 688,
  // Pins computed from the P3 main (d04093e4): every Murasoli file except the two indexes, and the 48–54 entries
  // inside both indexes, stay byte-identical when Volumes 42–47 are published.
  murasoliOtherFilesAggregate: "5d062a772e392a5814ebd489e59c122cbbe5408269e3fcb03660cb3382098b05",
  legacyLettersVolumes: "f710be536495c40c59ce885c52708cce8884164bf7da699a2b8165af48f3832e",
  legacyIndexVolumes: "b3413a53909a1fb2dbba6bddc37c455f18957327b62991fdfb48c27aa1ffa3f0",
};
eq(manifest.stage, "P1", "manifest records stage P1");

// ══ A. Public invariants ════════════════════════════════════════════════════════════════════════════
const works = publishedWorks();
const byShelf: Record<string, number> = {};
for (const w of works) byShelf[w.shelf] = (byShelf[w.shelf] ?? 0) + 1;
eq(works.length, PUB ? P4_EXPECT.catalogue : P1_FROZEN.catalogue, PUB ? "catalogue 333 → 335 (P4: ore-mutham + sangatamil)" : "catalogue still 333");
eq(byShelf["letters"], P1_FROZEN.letters, "Letters still 1 (Murasoli 42–47 join the one murasoli-letters work)");
eq(byShelf["drama"], PUB ? P4_EXPECT.drama : P1_FROZEN.drama, PUB ? "Drama 10 → 11 (P4)" : "Drama still 10");
eq(byShelf["literary-commentary"], PUB ? P4_EXPECT.literaryCommentary : P1_FROZEN.literaryCommentary, PUB ? "Literary Commentary 3 → 4 (P4)" : "Literary Commentary still 3");
eq(LIBRARY_COLLECTIONS.length, P1_FROZEN.collections, "collections still 9 (no Wave-8 collection)");
const shelves = discoveryShelves();
eq(shelves.flatMap((s) => s.entries).length, PUB ? P4_EXPECT.discovery : P1_FROZEN.discovery, PUB ? "/read discovery 96 → 98 (P4)" : "/read discovery still 96");
eq(shelves.reduce((n, s) => n + Math.min(s.entries.length, 6), 0), PUB ? P4_EXPECT.visible : P1_FROZEN.visible, PUB ? "/read initially visible 41 → 42 (P4: Literary Commentary under the cap)" : "/read initially visible still 41");
const libIds = new Set<string>((LIBRARY_WORKS as { id: string; slug: string }[]).flatMap((w) => [w.id, w.slug]));
ok(PUB ? LIBRARY_WORKS.filter((w) => w.id === "ore-mutham").length === 1 : !libIds.has("ore-mutham"), PUB ? "ore-mutham is exactly one LibraryWork (P4)" : "ore-mutham is NOT a LibraryWork");
ok(PUB ? LIBRARY_WORKS.filter((w) => w.id === "sangatamil").length === 1 : !libIds.has("sangatamil"), PUB ? "sangatamil is exactly one LibraryWork (P4)" : "sangatamil is NOT a LibraryWork");
eq(LIBRARY_WORKS.filter((w) => w.id === "murasoli-letters").length, 1, "murasoli-letters remains exactly one LibraryWork");
eq(ALL_PLAY_SLUGS.length, PUB ? P4_EXPECT.playRegistry : 10, PUB ? "/plays route registry 10 → 11 (P4)" : "/plays route registry still 10 plays");
ok(PUB ? ALL_PLAY_SLUGS.filter((x) => x === "ore-mutham").length === 1 && P3_OK : !ALL_PLAY_SLUGS.includes("ore-mutham") && (P3 ? P3_OK && JSON.stringify(WAVE8_DRAMA_SLUGS) === '["ore-mutham"]' : !(WAVE8_DRAMA_SLUGS as readonly string[]).length), PUB ? "ore-mutham appears exactly once in the public /plays registry (P4)" : P3 ? "ore-mutham is in no public /plays registry — only the hidden Wave-8 direct-route registry (P3)" : "ore-mutham is in no /plays route registry");

const sm = (sitemap() as { url: string }[]).map((e) => e.url);
eq(sm.length, (PUB ? P4_EXPECT.sitemap : P1_FROZEN.sitemap) + R2.sitemap, PUB ? "sitemap 4779 → 5262 (P4) + later R2 category URLs" : "sitemap still 4779 (+ later R2 category URLs)");
eq(sm.length - new Set(sm).size, P1_FROZEN.sitemapDup, "sitemap 0 duplicates");
const w8InSitemap = sm.map((u) => new URL(u).pathname).filter((u) => /^\/plays\/ore-mutham|^\/sangatamil|^\/murasoli\/m4[2-7]-/.test(u)).sort();
ok(PUB ? JSON.stringify(w8InSitemap) === JSON.stringify([...P3_ROUTES].sort()) : w8InSitemap.length === 0, PUB ? "sitemap carries exactly the 483 P3 Wave-8 routes (P4)" : "no Wave-8 URL in the sitemap");

// Live Murasoli: Volumes 48–54 byte-identical; at P4, Volumes 42–47 are published ahead of them.
const mIndex = readJSON<{ volumes: { volume: number }[] }>("public/data/murasoli/index.json");
eq(mIndex.volumes.map((v) => v.volume), PUB ? P4_EXPECT.murasoliPublicVolumes : P1_FROZEN.murasoliPublicVolumes, PUB ? "public Murasoli index = Volumes 42–54 (P4)" : "public Murasoli index still Volumes 48–54");
const mLetters = readJSON<{ volumes: { volume: number; letters: unknown[] }[] }>("public/data/murasoli/letters-index.json");
eq(mLetters.volumes.map((v) => v.volume), PUB ? P4_EXPECT.murasoliPublicVolumes : P1_FROZEN.murasoliPublicVolumes, PUB ? "public Murasoli letters-index = Volumes 42–54 (P4)" : "public Murasoli letters-index still Volumes 48–54");
eq(mLetters.volumes.reduce((n, v) => n + v.letters.length, 0), PUB ? P4_EXPECT.murasoliPublicLetters : P1_FROZEN.murasoliPublicLetters, PUB ? "public Murasoli 346 → 688 letters (P4)" : "public Murasoli still 346 letters");
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const mFiles = walk("public/data/murasoli").sort();
eq(mFiles.length, P1_FROZEN.murasoliPublic.files, "public Murasoli file count unchanged (1000)");
const INDEXES = ["public/data/murasoli/index.json", "public/data/murasoli/letters-index.json"];
if (PUB) {
  eq(sha(mFiles.filter((f) => !INDEXES.includes(f.replace(/\\/g, "/"))).map((f) => f + "\u0000" + sha(fs.readFileSync(f))).join("\n")), P4_EXPECT.murasoliOtherFilesAggregate, "public Murasoli payload: every file except the two indexes (998) byte-identical (P4)");
  eq(sha(JSON.stringify(readJSON<{ volumes: { volume: number }[] }>(INDEXES[0]).volumes.filter((v) => v.volume >= 48))), P4_EXPECT.legacyIndexVolumes, "index.json: the Volume 48–54 entries byte-identical (P4)");
  eq(sha(JSON.stringify(mLetters.volumes.filter((v) => v.volume >= 48))), P4_EXPECT.legacyLettersVolumes, "letters-index.json: the Volume 48–54 entries byte-identical (P4)");
} else {
  eq(sha(mFiles.map((f) => f + "\u0000" + sha(fs.readFileSync(f))).join("\n")), P1_FROZEN.murasoliPublic.aggregate, "public Murasoli payload (all 1000 files, Vols 48–54) byte-identical");
  eq(sha(fs.readFileSync("public/data/murasoli/index.json")), P1_FROZEN.murasoliPublic.indexJson, "public/data/murasoli/index.json byte-identical");
  eq(sha(fs.readFileSync("public/data/murasoli/letters-index.json")), P1_FROZEN.murasoliPublic.lettersIndexJson, "public/data/murasoli/letters-index.json byte-identical");
}

// No Wave-8 payload anywhere public; no Wave-8 route registry membership.
ok(!fs.existsSync("public/data/plays/ore-mutham"), "no public ore-mutham payload");
ok(!walk("public").some((f) => /sangatamil|ore-mutham|m4[2-7]-l\d/i.test(f)), "no Wave-8 file anywhere under public/");
const appDirs = walk("app").map((f) => f.replace(/\\/g, "/"));
const w8App = appDirs.filter((f) => /sangatamil|ore-mutham/.test(f)).sort();
ok(P3 ? JSON.stringify(w8App) === JSON.stringify(["app/sangatamil/[section]/page.tsx", "app/sangatamil/page.tsx", "app/sangatamil/source/page.tsx"]) : w8App.length === 0,
  P3 ? "Wave-8 route files under app/ are exactly the P3 /sangatamil family (ore-mutham rides the generic /plays routes)" : "no Wave-8 route directory under app/");

// Built output (fail closed without a build): prerender / HTML unchanged, no Wave-8 page built.
const NEXT = path.join(root, ".next");
if (!fs.existsSync(path.join(NEXT, "prerender-manifest.json"))) {
  fail.push("no production build (.next/prerender-manifest.json) — run `npm run build`; the build-boundary check cannot be skipped"); checks++;
} else {
  const pm = JSON.parse(fs.readFileSync(path.join(NEXT, "prerender-manifest.json"), "utf8")) as { routes: Record<string, unknown> };
  const routes = Object.keys(pm.routes);
  eq(routes.length, P1_FROZEN.build.prerender + P3_DELTA + R2.build, P3 ? "build prerender routes = 4788 + 483 Wave-8 direct routes (P3) + later R2 category routes" : "build prerender routes still 4788 (+ later R2 category routes)");
  eq(walk(path.join(NEXT, "server/app")).filter((f) => f.endsWith(".html")).length, P1_FROZEN.build.html + P3_DELTA + R2.build, P3 ? "build .html files = 4783 + 483 (P3) + later R2 category routes" : "build .html files still 4783 (+ later R2 category routes)");
  const w8Built = routes.filter((r) => /\/plays\/ore-mutham|sangatamil|\/murasoli\/m4[2-7]-/.test(r)).sort();
  ok(P3 ? JSON.stringify(w8Built) === JSON.stringify([...P3_ROUTES].sort()) : w8Built.length === 0, P3 ? "Wave-8 prerendered routes are exactly the 483 P3 direct routes" : "no Wave-8 route prerendered");
}

// ══ B. Internal invariants ══════════════════════════════════════════════════════════════════════════
// B1 — Murasoli 42–47
type Letter = { id: string; routeSlug: string; volume: number; printedNumber: number; sourceStem: string; printedNumberUniqueInVolume: boolean; qualification?: { kind: string; missingPrintedPages: number[] }; dateSource?: string; tamil: { pages: { pdfPage: number; printedPage: number; tamil: string }[] }; english: { text: string; releaseState: string } };
const EXPECT = { 42: 64, 43: 56, 44: 53, 45: 55, 46: 55, 47: 59 } as Record<number, number>;
const vols = Object.keys(EXPECT).map((v) => readJSON<{ volume: number; letters: Letter[]; controllingSource: { sha256: string | null; filename: string; pdfPages: number } }>(`${W8}/murasoli/volume-${v}.json`));
eq(vols.map((v) => v.volume), [42, 43, 44, 45, 46, 47], "six Murasoli volumes imported (42–47)");
for (const v of vols) eq(v.letters.length, EXPECT[v.volume], `Vol ${v.volume}: ${EXPECT[v.volume]} source records`);
const letters = vols.flatMap((v) => v.letters);
eq(letters.length, 342, "Murasoli Tamil records = 342");
eq(letters.filter((l) => l.tamil.pages.length > 0 && l.tamil.pages.every((p) => p.tamil.trim().length > 0)).length, 342, "every Tamil record has non-empty page-segmented text");
eq(letters.filter((l) => l.english.text.trim().length > 0).length, 342, "Murasoli English records = 342 (released records only)");
eq(new Set(letters.map((l) => l.id)).size, 342, "342 unique canonical ids");
eq(new Set(letters.map((l) => l.routeSlug)).size, 342, "342 unique route slugs");
ok(letters.every((l) => l.id === `m${l.volume}-${l.sourceStem}` && l.sourceStem.startsWith(`${l.printedNumber}-`)), "ids are source-derived (m{vol}-{stem}) and carry the printed number unaltered");
const v42 = letters.filter((l) => l.volume === 42).map((l) => l.printedNumber);
ok(v42.includes(3154), "Vol 42 keeps printed 3154");
ok(!letters.some((l) => l.printedNumber === 3377), "no fabricated Letter 3377");
eq(letters.filter((l) => l.volume === 46 && l.printedNumber === 3637).length, 2, "Vol 46: both printed-3637 letters survive as distinct records");
ok(![3636, 3644, 3645, 3646].some((n) => letters.some((l) => l.volume === 46 && l.printedNumber === n)), "Vol 46: no 3636, no 3644–3646 invented");
for (const n of [3647, 3648, 3649]) eq(letters.filter((l) => l.printedNumber === n).map((l) => l.volume), [46, 47], `printed ${n} occurs independently in Vols 46 and 47`);
const l3681 = letters.filter((l) => l.qualification);
eq(l3681.map((l) => [l.volume, l.printedNumber, l.qualification!.kind, l.qualification!.missingPrintedPages]), [[47, 3681, "source-incomplete", [252]]], "sole qualification: Vol 47 Letter 3681 source-incomplete, printed page 252 missing");
ok(l3681.length === 1 && l3681[0].dateSource === "printed-contents" && l3681[0].english.releaseState === "release-ready-with-source-exception", "3681: date from printed contents; English carried as release-ready with the source exception");
ok(l3681.length === 1 && !l3681[0].tamil.pages.some((p) => p.printedPage === 252), "3681: no page 252 text supplied");
eq(vols.find((v) => v.volume === 45)!.controllingSource.sha256, null, "Vol 45 controlling-scan SHA-256 is null (not recorded by the archive; never invented)");
ok(vols.filter((v) => v.volume !== 45).every((v) => /^[0-9a-f]{64}$/.test(v.controllingSource.sha256 ?? "")), "Vols 42–44, 46–47 carry their recorded SHA-256");

// B2 — ஒரே முத்தம்
const ore = readJSON<any>(`${W8}/ore-mutham/ore-mutham.json`);
eq([ore.verification.pageRecords, ore.verification.pageStatus, ore.verification.blocked, ore.verification.needsReview], [131, { verified: 131 }, 0, 0], "ore-mutham: 131/131 page records verified, 0 blocked, 0 needs-review");
eq(ore.parts.map((p: any) => [p.id, p.unitCount, p.printedNumbers]), [["main-play", 30, Array.from({ length: 30 }, (_, i) => i + 1)], ["nagai-suvai-pagudhi", 3, [1, 2, 3]]], "ore-mutham: 30 main + 3 supplementary units; supplementary printed numbers exactly 1–3");
eq(ore.parts[1].headingTa, "நகைச் சுவைப் பகுதி.", "supplementary part heading exactly as printed");
eq(ore.units.length, 33, "ore-mutham: 33 reading units");
ok(!ore.units.some((u: any) => u.printedSceneNumber > 30), "no scene renumbered beyond 30 (never 31–33)");
eq(new Set(ore.units.map((u: any) => u.id)).size, 33, "33 unique source-derived unit ids");
ok(ore.units.every((u: any) => /^(main|nagai-suvai)-\d{2}$/.test(u.id) && u.partId), "unit ids are the source stems and every unit names its part");
eq(ore.units.filter((u: any) => u.tamil.text.trim() && u.english.text.trim()).length, 33, "Tamil 33 + English 33 scene texts");
ok(ore.units.every((u: any) => !/^## (Assembly provenance|Translation notes)/m.test(u.tamil.text + u.english.text) && !/<!--/.test(u.tamil.text + u.english.text)), "archival apparatus / comments carried apart from scene text");
eq(ore.verification.englishBatches.length, 7, "7 English batch reviews PASS / LOCKED");

// B3 — சங்கத் தமிழ்
const sg = readJSON<any>(`${W8}/sangatamil/sangatamil.json`);
eq(sg.pages.length, 497, "sangatamil: 497 scans");
eq(sg.pages.map((p: any) => p.scan), Array.from({ length: 497 }, (_, i) => i + 1), "each scan represented exactly once, in order");
const count = (xs: string[]) => xs.reduce((a: Record<string, number>, k) => ((a[k] = (a[k] ?? 0) + 1), a), {});
eq(count(sg.pages.map((p: any) => p.tamilStatus)), { verified: 496, partial: 1 }, "Tamil: 496 verified + 1 partial");
eq(count(sg.pages.map((p: any) => p.english.status)), { "release-ready": 496, "source-limited": 1 }, "English: 496 release-ready + 1 source-limited");
eq(sg.pages.filter((p: any) => p.sourceLimitation).map((p: any) => p.scan), [8], "scan 8 is the sole permanent source-limited record");
eq([sg.pages[7].tamilStatus, sg.pages[7].english.status, sg.pages[7].pageType], ["partial", "source-limited", "facsimile"], "scan 8: partial / source-limited facsimile (description only)");
ok(!sg.pages[7].tamil.blocks.some((b: any) => b.role === "text"), "scan 8: no transcribed body text (never reconstructed)");
ok(sg.pages.every((p: any) => !["blocked", "needs-review"].includes(p.tamilStatus)), "Tamil: 0 blocked / 0 needs-review");
eq(sg.sections.length, 104, "104 source-order sections");
const covered = sg.sections.flatMap((s: any) => Array.from({ length: s.scans[1] - s.scans[0] + 1 }, (_, i) => s.scans[0] + i));
eq([covered.length, new Set(covered).size], [497, 497], "sections cover 497 scans exactly once");
eq([sg.citations.filter((c: any) => c.kind === "formal-citation").length, sg.citations.filter((c: any) => c.kind === "source-note").length], [115, 4], "115 formal provenance units + 4 source-note-only records (119)");
eq(sg.sections.flatMap((s: any) => s.provenanceIds).length, 119, "section registers reference all 119 provenance records");
ok(sg.citations.every((c: any) => Array.isArray(c.tamilBlocks) && c.locatedBy), "every provenance record is located on its anchor page (tier recorded)");
const typedTa = sg.pages.flatMap((p: any) => p.tamil.blocks.filter((b: any) => b.role === "source-citation" || b.role === "source-note").flatMap((b: any) => b.provenanceIds));
eq(new Set(typedTa).size, 119, "all 119 records typed as Tamil source-citation / source-note blocks (never text)");
ok(sg.citations.every((c: any) => sg.pages[c.anchorScan - 1].english.blocks.some((b: any) => (b.role === "source-citation" || b.role === "source-note") && (b.provenanceIds ?? []).includes(c.id))), "every record's anchor page has typed English provenance");
ok(sg.pages.every((p: any) => [...p.tamil.blocks, ...p.english.blocks].every((b: any) => !b.lines.some((l: string) => /<!--|-->/.test(l)))), "archival comments never inside block text");
// A printed ornament (`*` separator) is never provenance: across EVERY Tamil and English block of every scan, an
// `ornament` block keeps role `ornament` and carries no provenance ids. Generic by construction — no scan or record
// is named. (A letters-only citation match once absorbed the separator printed before a citation into the run.)
const ornamentViolations = (doc: any): string[] =>
  doc.pages.flatMap((p: any) => (["tamil", "english"] as const).flatMap((lang) => p[lang].blocks.flatMap((b: any, i: number) =>
    b.type === "ornament" && (b.role !== "ornament" || b.provenanceIds !== undefined || b.role === "source-citation" || b.role === "source-note")
      ? [`scan ${p.scan} ${lang} block ${i}: ornament typed ${b.role}${b.provenanceIds ? ` / ${b.provenanceIds}` : ""}`] : [])));
eq(ornamentViolations(sg), [], "no ornament block (Tamil or English) is typed provenance or carries provenance ids");
ok(sg.citations.every((c: any) => sg.pages[c.anchorScan - 1].tamil.blocks.slice(c.tamilBlocks[0], c.tamilBlocks[1] + 1).every((b: any) => b.type !== "ornament" && (b.provenanceIds ?? []).includes(c.id))), "every located provenance run is ornament-free and carries its record id");
// Adversarial self-test: the invariant must catch an ornament given a provenance role or id (checked on a copy).
{
  const firstOrn = (doc: any) => doc.pages.flatMap((p: any) => p.tamil.blocks).find((b: any) => b.type === "ornament");
  const asRole = JSON.parse(JSON.stringify(sg)); firstOrn(asRole).role = "source-citation";
  const asId = JSON.parse(JSON.stringify(sg)); firstOrn(asId).provenanceIds = [sg.citations[0].id];
  const asNote = JSON.parse(JSON.stringify(sg)); firstOrn(asNote).role = "source-note";
  const base = ornamentViolations(sg).length;
  ok([asRole, asId, asNote].every((d) => ornamentViolations(d).length === base + 1), "adversarial: the ornament invariant fails closed on an ornament typed source-citation / source-note or carrying a provenance id");
}

// ══ C. Integrity ═══════════════════════════════════════════════════════════════════════════════════
for (const a of manifest.artifacts as { path: string; sha256: string; bytes: number }[]) {
  const buf = fs.readFileSync(path.join(root, a.path));
  ok(sha(buf) === a.sha256 && buf.length === a.bytes, `${a.path}: matches the manifest hash`);
}
eq(manifest.artifacts.length, 8, "manifest inventories 8 generated artifacts");
eq([manifest.accounting.sourcePublicationInputs, manifest.accounting.newCanonicalLibraryWorks, manifest.accounting.projectedCatalogueAfterPublication], [8, 2, 335], "accounting: 8 inputs, 2 new works, projected 335");
const decisions = readJSON<any>(`${W8}/p1-architecture-decisions.json`).decisions;
eq(decisions.map((d: any) => d.work), ["murasoli-letters", "ore-mutham", "sangatamil"], "architecture decisions recorded for all three segments");
ok(/commentary-unit family/.test(decisions[2].decision) && /REJECTED/.test(decisions[2].comparison["kural-commentary"]), "sangatamil: commentary-unit family, kural-commentary rejected");
ok(/104 source-order sections/.test(decisions[2].evidence.hierarchy) && /115 formal provenance units \+ 4 source-note-only records \(119 leaves\)/.test(decisions[2].evidence.hierarchy), "decision evidence counts agree with the generated data");
// Additive play model: no published play declares parts or partIds — except the one two-part work, ஒரே முத்தம்
// (Wave-8 registry; published at P4, served from the server-side model, never from a public payload).
for (const slug of ALL_PLAY_SLUGS.filter((x) => !(WAVE8_DRAMA_SLUGS as readonly string[]).includes(x))) {
  const p = readJSON<{ parts?: unknown; readingUnits: { partId?: string }[] }>(`public/data/plays/${slug}/play.json`);
  ok(p.parts === undefined && p.readingUnits.every((u) => u.partId === undefined), `${slug}: single-part play unaffected by the additive PlayPart model`);
}

if (fail.length) {
  console.error(`\nwave8-p1-hidden — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 50)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave8-p1-hidden — ${checks} checks, 0 failed`);
console.log(PUB ? "  P4: published — catalogue 335 · Drama 11 · Literary Commentary 4 · /read 98/42 · sitemap 5262/0 (all 483 Wave-8 routes) · build 5271/5266 · Murasoli 42–54 / 688 (48–54 byte-identical)" : P3 ? "  P3: 483 direct Wave-8 routes built (4788/4783 + 483), still undiscovered — catalogue / discovery / sitemap / Murasoli 48–54 unchanged" : "");
if (!PUB) console.log("  public boundary unchanged (333 · Letters 1 · Drama 10 · Lit Comm 3 · collections 9 · /read 96/41 · sitemap 4779/0 · build 4788/4783 · Murasoli 48–54 byte-identical) · Murasoli 42–47 342/342 · ஒரே முத்தம் 30+3 · சங்கத் தமிழ் 497 (scan 8 source-limited) · 119 provenance records typed");
