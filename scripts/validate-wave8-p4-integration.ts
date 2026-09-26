/**
 * Wave 8 P4 — INDEPENDENT publication-integration validator. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave8-p4-integration.ts
 *
 * Verifies the publication semantics against independent authorities — the frozen internal P1 records
 * (data/internal/wave8/*.json, read directly: never the P2 model or the P4 generator), the frozen P3 route record and
 * the live registries / route modules / build:
 *   CATALOGUE 333→335 (one Murasoli work; ore-mutham, sangatamil exactly once; exact identity and shelf census) ·
 *   COLLECTIONS 9 · DISCOVERY 98 / 42 · MURASOLI public indexes 42–54 / 688 (metadata allowlist, no body, no invented
 *   page ids, anomalies kept, 48–54 unchanged) · NAVIGATION one continuous 42 → 54 sequence · SITEMAP 5262 / 0
 *   (exactly the 483 P3 routes added) · BUILD unchanged from P3 (5271 / 5266) · PUBLIC SAFETY (no hidden field in the
 *   indexes, catalogue cards, or built /source pages).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import { publishedWorks, LIBRARY_WORKS, type LibraryWork } from "../data/library";
import { discoveryShelves, LIBRARY_COLLECTIONS } from "../data/collections";
import { PLAY_SLUGS } from "../data/plays";
import sitemap from "../app/sitemap";
import * as MurasoliRoute from "../app/murasoli/[id]/page";
import { READ_IA_R2_CONTRIBUTION as R2, READ_IA_R2_ROUTES } from "../lib/read-ia-r2-contribution";

let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const root = process.cwd();
const readJSON = <T,>(rel: string): T => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const sha = (s: string | Buffer) => crypto.createHash("sha256").update(s).digest("hex");
const RAW = /"(releaseState|apparatus|annotations|currentCheckpoint|verification|provenanceIds|tamilStatus|englishStatus|visualFidelity|locatedBy|chapterDialect|printedNumberUniqueInVolume|assembledFromVerifiedPages|sourceConditionScans|englishReview|secondaryEnglishWitnessUsed|translatorNote|qualification|sourceStem|sourceId|tamil|english|text|body|notes|workTree|repoTree|dateSource|titleTaContents)"\s*:/;

// ══ CATALOGUE ═══════════════════════════════════════════════════════════════════════════════════════════════════
const works = publishedWorks();
eq(works.length, 335, "catalogue 333 → 335");
eq(new Set(works.map((w) => w.id)).size, works.length, "unique catalogue ids");
eq(new Set(works.map((w) => w.slug)).size, works.length, "unique catalogue slugs");
const byShelf: Record<string, number> = {};
for (const w of works) byShelf[w.shelf] = (byShelf[w.shelf] ?? 0) + 1;
const sortObj = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
eq(sortObj(byShelf), sortObj({ "life-writing": 1, letters: 1, fiction: 162, poetry: 14, drama: 11, "cinema-writing": 10, speeches: 117, "essays-articles": 15, "literary-commentary": 4 }), "shelf census: Drama 10→11, Literary Commentary 3→4, every other shelf unchanged");
eq(LIBRARY_WORKS.filter((w) => w.id === "murasoli-letters").length, 1, "exactly ONE Murasoli LibraryWork");
eq(works.filter((w) => w.shelf === "letters").map((w) => w.id), ["murasoli-letters"], "the Letters shelf is the one murasoli-letters work");
const mw = works.find((w) => w.id === "murasoli-letters")!;
ok(mw.tamil === "partial" && mw.english === "partial" && !mw.sourceCommit && /42–54/.test(mw.descEn ?? ""), "murasoli-letters: coverage partial/partial (13 of 54 volumes), no single invented source commit, description states 42–54");
ok(!LIBRARY_WORKS.some((w) => w.id !== "murasoli-letters" && (w.readerStructure === "letter" || w.shelf === "letters")) && !LIBRARY_WORKS.some((w) => /(vol(ume)?[-\s]?4[2-7]|^m4[2-7]-|murasoli.*(vol|4[2-7]))/i.test(`${w.id} ${w.slug}`)), "negative guard: no Murasoli volume (42–47) is a LibraryWork (no other letter-structured / Letters-shelf work)");
ok(!LIBRARY_WORKS.some((w) => /nagai|சுவைப்|comedy/i.test(w.id + w.slug + w.titleTa + w.titleEn)), "negative guard: நகைச் சுவைப் பகுதி. is not a second work");
ok(!LIBRARY_WORKS.some((w) => /^\d{3}-|sangatamil-/.test(w.id) || (w.id !== "sangatamil" && /சங்கத் தமிழ்/.test(w.titleTa))), "negative guard: no Sangatamil section is a LibraryWork");
const one = (id: string) => LIBRARY_WORKS.filter((w) => w.id === id);
eq(one("ore-mutham").length, 1, "ore-mutham exactly once");
eq(one("sangatamil").length, 1, "sangatamil exactly once");
const ore = one("ore-mutham")[0] as LibraryWork;
eq({ id: ore.id, slug: ore.slug, titleTa: ore.titleTa, titleEn: ore.titleEn, shelf: ore.shelf, subtype: ore.subtype, readerStructure: ore.readerStructure, href: ore.href, state: ore.state, sourceRepo: ore.sourceRepo, sourcePath: ore.sourcePath, sourceCommit: ore.sourceCommit, tamil: ore.tamil, english: ore.english, englishKind: ore.englishKind, provenanceHref: ore.provenanceHref },
  { id: "ore-mutham", slug: "ore-mutham", titleTa: "ஒரே முத்தம்", titleEn: "Ore Mutham", shelf: "drama", subtype: "stage-play", readerStructure: "stage-play", href: "/plays/ore-mutham", state: "published", sourceRepo: "pugazg/kalaignar-stage-plays", sourcePath: "works/ore-mutham", sourceCommit: "521fe5452e3e9ed54baa81e672325ce6ba501c5e", tamil: "complete", english: "complete", englishKind: "project-created", provenanceHref: "/plays/ore-mutham/source" }, "ore-mutham LibraryWork identity");
const oreP1 = readJSON<{ editionTa: string }>("data/internal/wave8/ore-mutham/ore-mutham.json");
ok(ore.edition === oreP1.editionTa, "ore-mutham edition statement is the frozen P1 statement, verbatim");
ok(/\b30\b/.test(ore.descEn ?? "") && /1–3/.test(ore.descEn ?? "") && /not Scenes 31–33/.test(ore.descEn ?? "") && /நகைச் சுவைப் பகுதி\./.test(ore.descTa ?? ""), "ore-mutham card: 30 scenes + a separately titled comedy section numbered 1–3 afresh (never 31–33)");
ok(ore.rights?.rightsStatus === "nationalised-by-tamil-nadu-government" && ore.rights.governmentOrderNumber === null && ore.rights.governmentOrderDate === null && /does not extend to the project-created English/.test(ore.rights.note ?? ""), "ore-mutham rights: the Drama shelf's nationalisation record, scoped to the Tamil play; GO number/date not invented");
const sg = one("sangatamil")[0] as LibraryWork;
eq({ id: sg.id, slug: sg.slug, titleTa: sg.titleTa, titleEn: sg.titleEn, shelf: sg.shelf, subtype: sg.subtype, readerStructure: sg.readerStructure, href: sg.href, state: sg.state, sourceRepo: sg.sourceRepo, sourcePath: sg.sourcePath, sourceCommit: sg.sourceCommit, tamil: sg.tamil, english: sg.english, englishKind: sg.englishKind, provenanceHref: sg.provenanceHref },
  { id: "sangatamil", slug: "sangatamil", titleTa: "சங்கத் தமிழ்", titleEn: "Sangatamil", shelf: "literary-commentary", subtype: "commentary", readerStructure: "commentary-unit", href: "/sangatamil", state: "published", sourceRepo: "pugazg/kalaignar-literary-commentary", sourcePath: "works/sangatamil", sourceCommit: "e23548b09547a2308407e60e5e67c1a03fee5354", tamil: "partial", english: "partial", englishKind: "project-created", provenanceHref: "/sangatamil/source" }, "sangatamil LibraryWork identity (partial: scan 8)");
ok(/scan 8/.test(sg.descEn ?? "") && /not transcribed/.test(sg.descEn ?? "") && /ஸ்கேன் 8/.test(sg.descTa ?? "") && !/pending/i.test((sg.descEn ?? "") + (sg.descTa ?? "")), "sangatamil card discloses the permanent scan-8 limitation (never 'pending')");
ok(sg.unitCount?.value === 104 && /reading sections/.test(sg.unitCount.labelEn) && /102 sections/.test(sg.descEn ?? ""), "sangatamil: 104 READING sections (unitCount) vs 102 literary sections (card) — distinct");
ok(!sg.rights, "sangatamil: no rights record (none established by its provenance; never inherited)");
ok(sg.readerStructure !== ("kural-commentary" as never), "sangatamil is not a kural-commentary");

// ══ COLLECTIONS / DISCOVERY ═════════════════════════════════════════════════════════════════════════════════════
eq(LIBRARY_COLLECTIONS.length, 9, "collections stay 9");
ok(!LIBRARY_COLLECTIONS.some((c) => /murasoli|ore-mutham|sangatamil|nagai/i.test(c.id)), "no Wave-8 collection");
const shelves = discoveryShelves();
const entries = shelves.flatMap((s) => s.entries);
eq(entries.length, 98, "/read discovery 96 → 98");
eq(shelves.reduce((n, s) => n + Math.min(s.entries.length, 6), 0), 42, "/read initially visible 41 → 42 (Drama already over the cap; Literary Commentary 3 → 4 under it)");
const shelfEntries = (id: string) => shelves.find((s) => s.shelf.id === id)?.entries ?? [];
ok(shelfEntries("drama").some((e) => e.kind === "work" && e.work.id === "ore-mutham") && shelfEntries("drama").length === 11, "Drama discovery: ore-mutham a standalone entry (11 entries)");
ok(shelfEntries("literary-commentary").some((e) => e.kind === "work" && e.work.id === "sangatamil") && shelfEntries("literary-commentary").length === 4, "Literary Commentary discovery: sangatamil a standalone entry (4 entries)");
eq(shelfEntries("letters").map((e) => (e.kind === "work" ? e.work.id : e.key)), ["murasoli-letters"], "Letters discovery: still ONE Murasoli entry");
eq((PLAY_SLUGS as readonly string[]).filter((s) => s === "ore-mutham").length, 1, "ore-mutham exactly once in the public PLAY_SLUGS");
eq(PLAY_SLUGS.length, 11, "public Drama registry 10 → 11");

// ══ MURASOLI public indexes — independently re-derived from the frozen P1 volume records ═════════════════════
type P1L = { routeSlug: string; volume: number; printedNumber: number; titleTa: string; titleEn: string; dateIso: string | null; pdfPages: [number, number]; tamil: { pages: { printedPage: number | null }[] }; qualification?: { missingPrintedPages: number[] } };
const W8V = [42, 43, 44, 45, 46, 47];
const p1 = W8V.map((v) => readJSON<{ controllingSource: { pdfPages: number }; letters: P1L[] }>(`data/internal/wave8/murasoli/volume-${v}.json`));
type Meta = { id: string; number: number | null; date: string | null; title: { en: string; ta: string }; pages: string[]; pageCount?: number };
const LI = readJSON<{ volumes: { volume: number; letterCount: number; letters: Meta[] }[] }>("public/data/murasoli/letters-index.json");
const IX = readJSON<{ volumes: { volume: number; pageCount: number; pages: { id: string }[]; sourceUrl?: string; textProvenance?: string }[]; totalPages: number; volumeCount: number; rights: string }>("public/data/murasoli/index.json");
const VOLS = [42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54];
eq(IX.volumes.map((v) => v.volume), VOLS, "index.json volumes exactly 42–54 in order");
eq(LI.volumes.map((v) => v.volume), VOLS, "letters-index volumes exactly 42–54 in order");
eq(IX.volumeCount, 13, "13 volumes");
eq(LI.volumes.map((v) => v.letters.length), [64, 56, 53, 55, 55, 59, 58, 53, 50, 49, 50, 50, 36], "per-volume letter counts (42–47 from the source; 48–54 unchanged)");
eq(LI.volumes.map((v) => v.letterCount), LI.volumes.map((v) => v.letters.length), "letterCount == letters listed");
eq(LI.volumes.reduce((n, v) => n + v.letters.length, 0), 688, "688 letters (342 + 346)");
const ids = LI.volumes.flatMap((v) => v.letters.map((l) => l.id));
eq(new Set(ids).size, 688, "688 unique route ids (printed numbers are NOT unique and never used as identity)");
eq(IX.totalPages, IX.volumes.reduce((n, v) => n + v.pageCount, 0), "totalPages == Σ volume pageCount");
eq(IX.volumes.filter((v) => W8V.includes(v.volume)).map((v) => v.pageCount), p1.map((v) => v.controllingSource.pdfPages), "Vols 42–47 pageCount == each frozen controlling scan's physical pages");
eq(IX.totalPages, 2732 + p1.reduce((n, v) => n + v.controllingSource.pdfPages, 0), "totalPages == 2732 (48–54) + Σ frozen 42–47 scans");
eq(IX.totalPages, 5141, "totalPages 5141");
for (let k = 0; k < W8V.length; k++) {
  const vol = W8V[k];
  const pub = LI.volumes.find((v) => v.volume === vol)!.letters;
  const src = [...p1[k].letters].sort((a, b) => a.pdfPages[0] - b.pdfPages[0]);
  eq(pub.map((l) => l.id), src.map((l) => l.routeSlug), `Vol ${vol}: route ids and book order == the frozen records`);
  eq(pub.map((l) => l.number), src.map((l) => l.printedNumber), `Vol ${vol}: printed numbers exactly as printed`);
  eq(pub.map((l) => [l.title.ta, l.title.en]), src.map((l) => [l.titleTa, l.titleEn]), `Vol ${vol}: bilingual titles`);
  eq(pub.map((l) => l.date), src.map((l) => l.dateIso), `Vol ${vol}: dates as established`);
  eq(pub.map((l) => l.pageCount), src.map((l) => l.tamil.pages.length), `Vol ${vol}: pageCount == the letter's real source pages`);
  ok(pub.every((l) => Array.isArray(l.pages) && l.pages.length === 0), `Vol ${vol}: no fabricated legacy page ids`);
  ok(pub.every((l) => JSON.stringify(Object.keys(l)) === JSON.stringify(["id", "number", "date", "title", "pages", "pageCount"]) && JSON.stringify(Object.keys(l.title)) === JSON.stringify(["en", "ta"])), `Vol ${vol}: metadata allowlist only (id, number, date, title, pages[], pageCount)`);
  ok((l => l)(pub).every((l) => (l.pageCount ?? 0) > 0), `Vol ${vol}: no letter claims zero pages`);
}
const w8Meta = LI.volumes.filter((v) => W8V.includes(v.volume)).flatMap((v) => v.letters);
ok(!RAW.test(JSON.stringify(LI)) && !RAW.test(JSON.stringify(IX)), `public indexes carry no body / note / provenance / workflow field (${(JSON.stringify(LI) + JSON.stringify(IX)).match(RAW)?.[1]})`);
eq(w8Meta.filter((l) => l.number === 3637).map((l) => l.id), ["m46-l3637-en-uyirinumelana-anbu-udanpirappukkale", "m46-l3637-indre-selga-inithe-velga"].sort((a, b) => ids.indexOf(a) - ids.indexOf(b)), "Vol 46: two distinct printed-3637 records");
ok(!w8Meta.some((l) => l.number === 3377 || l.number === 3636 || [3644, 3645, 3646].includes(l.number ?? 0)), "no fabricated 3377 / 3636 / 3644–3646");
const v42 = LI.volumes[0].letters, i3154 = v42.findIndex((l) => l.number === 3154);
ok(i3154 > 0 && v42[i3154 - 1].number === 3376 && v42[i3154 + 1].number === 3378, "Vol 42: printed 3154 kept between 3376 and 3378");
for (const n of [3647, 3648, 3649]) eq([46, 47].map((v) => LI.volumes.find((x) => x.volume === v)!.letters.filter((l) => l.number === n).length), [1, 1], `${n}: one record in Vol 46 and one in Vol 47`);
const s3681 = p1[5].letters.find((l) => l.printedNumber === 3681)!;
const m3681 = w8Meta.find((l) => l.number === 3681)!;
ok(!!m3681 && m3681.pageCount === s3681.tamil.pages.length && !s3681.tamil.pages.some((p) => p.printedPage === 252) && JSON.stringify(s3681.qualification?.missingPrintedPages) === "[252]", "3681: surviving pages only (printed page 252 missing, nothing reconstructed)");
ok(IX.volumes.filter((v) => W8V.includes(v.volume)).every((v) => v.textProvenance === "source-verified-page-records" && !v.sourceUrl && v.pages.length === 0), "Vols 42–47: source-verified provenance flag; no invented external source URL; no page ids");
eq(sha(JSON.stringify(LI.volumes.filter((v) => v.volume >= 48))), "f710be536495c40c59ce885c52708cce8884164bf7da699a2b8165af48f3832e", "letters-index: Vols 48–54 entries byte-identical to the P3 main");
eq(sha(JSON.stringify(IX.volumes.filter((v) => v.volume >= 48))), "b3413a53909a1fb2dbba6bddc37c455f18957327b62991fdfb48c27aa1ffa3f0", "index.json: Vols 48–54 entries byte-identical to the P3 main");

// ══ NAVIGATION — one continuous 42 → 54 sequence ═════════════════════════════════════════════════════════════════
const render = (id: string) => { try { return renderToStaticMarkup(createElement(LangProvider, { initialLang: "ta", children: (MurasoliRoute.default as (p: { params: { id: string } }) => ReactElement)({ params: { id } }) })); } catch { return ""; } };
const navOf = (h: string) => Array.from(h.matchAll(/href="\/murasoli\/(m\d\d-[^"]+)"/g)).map((m) => m[1]);
const last47 = LI.volumes[5].letters.at(-1)!.id, first48 = LI.volumes[6].letters[0].id;
const h47 = render(last47), h48 = render(first48);
ok(!!h47 && navOf(h47).includes(first48), `last Vol-47 letter ${last47} → next is the first Vol-48 letter ${first48}`);
ok(!!h48 && navOf(h48).includes(last47), `first Vol-48 letter ${first48} → previous is the last Vol-47 letter ${last47}`);
ok(h47.includes('data-testid="wave8-letter-body"') && !h48.includes('data-testid="wave8-letter-body"'), "boundary letters keep their own reader paths (Wave-8 model / legacy fetch)");
// No gap anywhere in the sequence: every adjacent pair of the published order links forward.
let gaps = 0;
for (let i = 0; i < ids.length - 1; i += 23) { const h = render(ids[i]); if (!navOf(h).includes(ids[i + 1])) gaps++; }
ok(gaps === 0, `sequential navigation (sampled every 23rd letter across 42–54): ${gaps} gaps`);
ok(render("m42-l3377") === "" && render("m46-l3636") === "", "fabricated letter ids still 404");

// ══ SITEMAP ═════════════════════════════════════════════════════════════════════════════════════════════════════
const urls = (sitemap() as { url: string }[]).map((e) => new URL(e.url).pathname);
eq(urls.length, 5262 + R2.sitemap, "sitemap 4779 → 5262 (+ later R2 category URLs)");
eq(urls.length - new Set(urls).size, 0, "0 duplicate sitemap URLs");
const P3 = readJSON<{ cohorts: Record<"murasoli" | "oreMutham" | "sangatamil", { routes: string[] }> }>("data/internal/wave8/wave8-p3-routes.json");
const inSm = new Set(urls);
for (const k of ["murasoli", "oreMutham", "sangatamil"] as const) eq(P3.cohorts[k].routes.filter((r) => inSm.has(r)).length, { murasoli: 342, oreMutham: 35, sangatamil: 106 }[k], `sitemap carries every P3 ${k} route`);
const p3All = new Set(Object.values(P3.cohorts).flatMap((c) => c.routes));
eq(urls.filter((u) => !p3All.has(u) && !READ_IA_R2_ROUTES.includes(u)).length, 4779, "the sitemap minus the 483 P3 routes (and the later R2 category URLs) is exactly the pre-P4 4779 (delta exactly +483)");
ok(!urls.some((u) => /\/murasoli\/m42-l3377|\/plays\/ore-mutham\/(31|main-31|nagai-suvai-04)$|\/sangatamil\/(105|section-)/.test(u)), "no fabricated route in the sitemap");
ok(urls.filter((u) => u === "/murasoli").length === 1, "the existing /murasoli landing is listed once (not a new URL)");

// ══ BUILD — P4 adds zero routes ═════════════════════════════════════════════════════════════════════════════════
const NEXT = path.join(root, ".next");
if (!fs.existsSync(path.join(NEXT, "prerender-manifest.json"))) ok(false, "no production build — run `npm run build`; the build checks cannot be skipped");
else {
  const routes = Object.keys((JSON.parse(fs.readFileSync(path.join(NEXT, "prerender-manifest.json"), "utf8")) as { routes: Record<string, unknown> }).routes);
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const html = walk(path.join(NEXT, "server/app")).filter((f) => f.endsWith(".html"));
  eq({ prerender: routes.length, html: html.length }, { prerender: 5271 + R2.build, html: 5266 + R2.build }, `build unchanged from P3: 5271 prerender / 5266 html (P4 adds no route) + later R2 categories ${R2.build}`);
  eq(routes.filter((r) => p3All.has(r)).length, 483, "all 483 P3 routes still prerendered");
  ok(!routes.some((r) => /^\/plays\/ore-mutham\/(31|main-31)$|^\/murasoli\/m42-l3377$/.test(r)), "no fabricated route built");
  for (const r of ["/plays/ore-mutham/source", "/sangatamil/source", "/plays/ore-mutham", "/sangatamil"]) {
    const f = path.join(NEXT, "server/app", `${r}.html`);
    const h = fs.existsSync(f) ? fs.readFileSync(f, "utf8").replace(/\\"/g, '"') : "";
    ok(!!h && !/"(releaseState|apparatus|annotations|currentCheckpoint|verification|provenanceIds|tamilStatus|visualFidelity|locatedBy)"\s*:/.test(h), `${r}: built page carries no hidden-record field`);
  }
}
// Catalogue cards: no hidden field on the new entries.
ok(!/"(releaseState|verification|annotations|currentCheckpoint|apparatus|workflow|readiness|hidden|wave|batch)"\s*:/.test(JSON.stringify([ore, sg, mw])), "catalogue cards carry no hidden / workflow field");

if (fail.length) {
  console.error(`\nwave8-p4-integration — ${checks} checks, ${fail.length} FAILED`);
  for (const f of fail.slice(0, 50)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`wave8-p4-integration — ${checks} checks, 0 failed`);
console.log("  catalogue 335 (Drama 11 · Lit Comm 4 · one Murasoli work) · collections 9 · /read 98/42 · Murasoli 42–54 / 688 / 5141 pages (48–54 unchanged) · continuous 47→48 · sitemap 5262/0 (+483) · build 5271/5266 unchanged");
