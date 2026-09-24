/**
 * Wave 8 P4 — publication generator (deterministic; `--verify` fails unless every output is byte-identical).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/build-wave8-p4-publication.ts            # write
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/build-wave8-p4-publication.ts --verify   # check
 *
 * 1. The PUBLIC Murasoli indexes (public/data/murasoli/index.json, letters-index.json) gain Volumes 42–47 — metadata
 *    only, derived from the frozen P1/P2 reader model: route id, the printed number exactly as printed, the established
 *    date, the bilingual title and the letter's physical page count (`pageCount`). No body, note, provenance, release
 *    or workflow field, and NO invented legacy page ids (`pages` stays empty: these letters have no page-fetch
 *    contract; the reader is served from the server-side model). Volumes 48–54 are carried byte-for-byte. Volume page
 *    counts come from each frozen volume's controlling scan (the index's existing physical-page semantics).
 * 2. The durable P4 publication record (data/internal/wave8/wave8-p4-publication.json), computed from the live
 *    registries (catalogue, collections, discovery, sitemap) and the frozen P3 route record — never copied numbers.
 * The P3 route manifest stays frozen as the P3 record.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadWave8MurasoliLetters, loadWave8MurasoliVolume, WAVE8_MURASOLI_VOLUMES } from "../lib/wave8-murasoli-reader";

const root = process.cwd();
const IDX = path.join(root, "public/data/murasoli/index.json");
const LETTERS = path.join(root, "public/data/murasoli/letters-index.json");
const RECORD = path.join(root, "data/internal/wave8/wave8-p4-publication.json");
const P3 = path.join(root, "data/internal/wave8/wave8-p3-routes.json");
const W8 = new Set<number>(WAVE8_MURASOLI_VOLUMES);
// Measured on the clean P2 merge (e1086f3d) before any Wave-8 route existed; P3 added exactly its route set.
const PRE_P3_BUILD = { prerender: 4788, html: 4783, generatedStaticPages: 4791 };
const PRE_P4_SURFACE = { catalogue: 333, collections: 9, discovery: 96, visible: 41, sitemap: 4779 };

/** The legacy pipeline's serializer (Python json.dumps, ensure_ascii=False, default separators). */
const py = (v: unknown): string =>
  Array.isArray(v) ? "[" + v.map(py).join(", ") + "]"
  : v && typeof v === "object" ? "{" + Object.entries(v as Record<string, unknown>).map(([k, x]) => JSON.stringify(k) + ": " + py(x)).join(", ") + "}"
  : JSON.stringify(v);

type LetterMeta = { id: string; number: number | null; date: string | null; title: { en: string; ta: string }; pages: string[]; pageCount?: number };
type LettersIndex = { collection: string; volumes: { volume: number; letterCount: number; letters: LetterMeta[] }[] };
type Vol = { volume: number; pageCount: number; pages: unknown[]; sourceUrl?: string; textProvenance?: string };
type Index = { collection: string; title: unknown; rights: string; volumes: Vol[]; totalPages: number; volumeCount: number };

export function buildMurasoliIndexes(): { index: string; letters: string } {
  const idx = JSON.parse(fs.readFileSync(IDX, "utf8")) as Index;
  const li = JSON.parse(fs.readFileSync(LETTERS, "utf8")) as LettersIndex;
  // Idempotent: the existing (pre-Wave-8) volumes are whatever is not a Wave-8 volume, carried unchanged.
  const legacyVols = idx.volumes.filter((v) => !W8.has(v.volume));
  const legacyLetterVols = li.volumes.filter((v) => !W8.has(v.volume));
  const letters = loadWave8MurasoliLetters(); // reading order: volume, then the book's page order
  const w8LetterVols = WAVE8_MURASOLI_VOLUMES.map((n) => {
    const ls = letters.filter((l) => l.volume === n).map((l): LetterMeta => ({
      id: l.id,
      number: l.printedNumber, // exactly as printed — never unique, never corrected
      date: l.date.iso,
      title: { en: l.title.en, ta: l.title.ta },
      pages: [], // no legacy page-fetch contract: never invented ids
      pageCount: l.tamilPages.length, // the letter's physical source pages (3681: its surviving pages only)
    }));
    return { volume: n, letterCount: ls.length, letters: ls };
  });
  const w8Vols: Vol[] = WAVE8_MURASOLI_VOLUMES.map((n) => ({
    volume: n,
    pageCount: loadWave8MurasoliVolume(n).controllingSource.pdfPages,
    pages: [],
    textProvenance: "source-verified-page-records",
  }));
  const volumes = [...w8Vols, ...legacyVols].sort((a, b) => a.volume - b.volume);
  const out: Index = {
    ...idx,
    // Collection-level: source details now differ by volume and are carried with each volume / reader.
    rights: "Nationalised. Source details are carried with each integrated volume and letter.",
    volumes,
    totalPages: volumes.reduce((n, v) => n + v.pageCount, 0),
    volumeCount: volumes.length,
  };
  const outLetters: LettersIndex = { ...li, volumes: [...w8LetterVols, ...legacyLetterVols].sort((a, b) => a.volume - b.volume) };
  return { index: JSON.stringify(out, null, 2), letters: py(outLetters) };
}

export async function buildRecord() {
  // Registries are imported lazily: they read the (freshly written) public indexes.
  const { publishedWorks, LIBRARY_WORKS } = await import("../data/library");
  const { discoveryShelves, LIBRARY_COLLECTIONS } = await import("../data/collections");
  const { PLAY_SLUGS } = await import("../data/plays");
  const sitemap = (await import("../app/sitemap")).default;
  const p3 = JSON.parse(fs.readFileSync(P3, "utf8")) as { counts: Record<string, number>; cohorts: Record<string, { routes: string[] }> };
  const p3Routes = Object.values(p3.cohorts).flatMap((c) => c.routes);
  const works = publishedWorks();
  const byShelf: Record<string, number> = {};
  for (const w of works) byShelf[w.shelf] = (byShelf[w.shelf] ?? 0) + 1;
  const shelves = discoveryShelves();
  const discovery = shelves.flatMap((s) => s.entries).length;
  const visible = shelves.reduce((n, s) => n + Math.min(s.entries.length, 6), 0);
  const urls = (sitemap() as { url: string }[]).map((e) => new URL(e.url).pathname);
  const inSitemap = new Set(urls);
  const li = JSON.parse(fs.readFileSync(LETTERS, "utf8")) as LettersIndex;
  const idx = JSON.parse(fs.readFileSync(IDX, "utf8")) as Index;
  const newWorks = ["ore-mutham", "sangatamil"];
  return {
    stage: "P4",
    published: true,
    note: "Wave 8 publication: Murasoli Volumes 42–47 join the ONE existing murasoli-letters work; ore-mutham (Drama) and sangatamil (Literary Commentary) are new works. The 483 routes P3 built become discoverable; P4 adds no route. P1–P3 records are unchanged.",
    newLibraryWorks: newWorks.filter((id) => (LIBRARY_WORKS as { id: string }[]).some((w) => w.id === id)),
    /** Per-shelf growth from the new works (Murasoli 42–47 add no work). */
    newWorkShelves: Object.fromEntries(Object.entries(
      (LIBRARY_WORKS as { id: string; shelf: string; state: string }[]).filter((w) => newWorks.includes(w.id) && w.state === "published")
        .reduce((m: Record<string, number>, w) => ((m[w.shelf] = (m[w.shelf] ?? 0) + 1), m), {}),
    )),
    catalogue: { before: PRE_P4_SURFACE.catalogue, after: works.length, delta: works.length - PRE_P4_SURFACE.catalogue, shelves: byShelf },
    collections: { before: PRE_P4_SURFACE.collections, after: LIBRARY_COLLECTIONS.length, delta: LIBRARY_COLLECTIONS.length - PRE_P4_SURFACE.collections },
    discovery: { before: PRE_P4_SURFACE.discovery, after: discovery, delta: discovery - PRE_P4_SURFACE.discovery },
    visible: { before: PRE_P4_SURFACE.visible, after: visible, delta: visible - PRE_P4_SURFACE.visible },
    playSlugs: { count: PLAY_SLUGS.length, oreMuthamOccurrences: (PLAY_SLUGS as readonly string[]).filter((s) => s === "ore-mutham").length },
    sitemap: {
      before: PRE_P4_SURFACE.sitemap, after: urls.length, delta: urls.length - PRE_P4_SURFACE.sitemap, duplicates: urls.length - inSitemap.size,
      wave8Routes: p3Routes.filter((r) => inSitemap.has(r)).length,
      wave8ByFamily: Object.fromEntries(Object.entries(p3.cohorts).map(([k, c]) => [k, c.routes.filter((r) => inSitemap.has(r)).length])),
    },
    build: {
      routeDeltaFromP3: 0,
      prerender: PRE_P3_BUILD.prerender + p3Routes.length,
      html: PRE_P3_BUILD.html + p3Routes.length,
      generatedStaticPages: PRE_P3_BUILD.generatedStaticPages + p3Routes.length,
    },
    p3RouteSet: { count: p3Routes.length, sha256: crypto.createHash("sha256").update(JSON.stringify(p3Routes)).digest("hex") },
    murasoli: {
      volumes: idx.volumes.map((v) => v.volume),
      volumeCount: idx.volumeCount,
      letters: li.volumes.reduce((n, v) => n + v.letters.length, 0),
      lettersByVolume: Object.fromEntries(li.volumes.map((v) => [v.volume, v.letters.length])),
      totalPages: idx.totalPages,
    },
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) (async () => {
  const verify = process.argv.includes("--verify");
  const { index, letters } = buildMurasoliIndexes();
  const bad: string[] = [];
  if (verify) {
    if (fs.readFileSync(IDX, "utf8") !== index) bad.push("public/data/murasoli/index.json");
    if (fs.readFileSync(LETTERS, "utf8") !== letters) bad.push("public/data/murasoli/letters-index.json");
  } else { fs.writeFileSync(IDX, index); fs.writeFileSync(LETTERS, letters); }
  const rec = JSON.stringify(await buildRecord(), null, 1) + "\n";
  if (verify) { if (!fs.existsSync(RECORD) || fs.readFileSync(RECORD, "utf8") !== rec) bad.push("data/internal/wave8/wave8-p4-publication.json"); }
  else fs.writeFileSync(RECORD, rec);
  if (bad.length) { console.error(`wave8 P4 publication outputs are not the deterministic regeneration: ${bad.join(", ")}`); process.exit(1); }
  console.log(verify ? "wave8 P4 publication — Murasoli indexes + publication record verified byte-identical" : `wave8 P4 publication written — ${rec.length} B record`);
})();
