// Deterministic Novel-family importer — Wave 7 Batch 3 (P1, HIDDEN). FIVE works on the Fiction shelf from
// pugazg/kalaignar-novels.
//
//   node scripts/import-wave7-b3-novels.mjs <kalaignar-novels-clone> [source-commit]
//
// The kalaignar-novels repo advances constantly for unrelated works, so the repo COMMIT alone is a weak
// guard — the per-work SUBTREE pins below are the meaningful freeze (each equals `HEAD:works/<slug>` at
// the frozen tree, byte-identical between the Wave-7 P0 novel pin 9f9c187f… and the current pin cc5c7fe5…).
// Fail-closed, read-only; the controlling PDFs are never vendored.
//
// Reading layer: each work's `sections/NN-*.md` (Tamil, `layer: assembled-reading`) paired with
// `translations/en/sections/NN-*.md` (English). Deterministic transform (documented, reproducible): strip
// YAML front matter and standalone HTML-comment scan markers (recorded as provenance), preserve every
// literary byte, fold runs of 3+ newlines to a paragraph break. No text is reconstructed, modernised,
// renumbered or invented; a source chapter-number gap (e.g. surulimalai prints no chapters 6–7) is kept.
//
// arumbu, nadutheru-narayani and sarapallam-samundi are THREE separate canonical works that share ONE 1978
// source publication (the அரும்பு-1978 compilation, SHA 04a3013e…); they are never collapsed into one work.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const WAVE7_P0_NOVELS_CURRENT = "cc5c7fe535c5fab35e87f91b8325d6801afec46c";
const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3] || WAVE7_P0_NOVELS_CURRENT;
if (!SRC_REPO) { console.error("usage: node scripts/import-wave7-b3-novels.mjs <kalaignar-novels-clone> [source-commit]"); process.exit(1); }
const die = (m) => { console.error(`import-wave7-b3-novels: ${m}`); process.exit(1); };
const readText = (p) => fs.readFileSync(p, "utf8"); // IDENTITY copy — no normalization of literary bytes.
const git = (...a) => execFileSync("git", ["-C", SRC_REPO, ...a], { encoding: "utf8" }).trim();

let head; try { head = git("rev-parse", "HEAD"); } catch (e) { die(`unable to read git HEAD of ${SRC_REPO}: ${e.message}`); }
if (head !== SRC_COMMIT) die(`source-commit mismatch: supplied ${SRC_COMMIT} but clone HEAD is ${head}`);

const ARUMBU_1978 = { collectionId: "arumbu-1978", scanFilename: "TVA_BOK_0064361_அரும்பு.pdf", scanSha256: "04a3013e1f58a1800867acc5d2f159976c47994a64478036e6fe0201edf120bc", scanBytes: 117270339, scanTotal: 92 };
const WORKS = [
  {
    slug: "arumbu", subtree: "5020fa5d130003cfd1710644f3ba111c56f85f44",
    titleTa: "அரும்பு", titleEn: "The Bud",
    edition: { editionStatementTa: "முதற் பதிப்பு — 1978", year: 1978, publisherTa: "தமிழ்க்கனி பதிப்பகம், சென்னை-28" },
    scan: { ...ARUMBU_1978, workScans: "6–23" }, collection: ARUMBU_1978.collectionId,
    expect: { sections: 1 },
  },
  {
    slug: "nadutheru-narayani", subtree: "91865cf5641faf466ccfff6963abf584ab4f8302",
    titleTa: "நடுத்தெரு நாராயணி", titleEn: "Nadutheru Narayani",
    edition: { editionStatementTa: "முதற் பதிப்பு — 1978", year: 1978, publisherTa: "தமிழ்க்கனி பதிப்பகம், சென்னை-28" },
    scan: { ...ARUMBU_1978, workScans: "16 physical scans within the compilation" }, collection: ARUMBU_1978.collectionId,
    expect: { sections: 1 },
  },
  {
    slug: "sarapallam-samundi", subtree: "77532e7ad00c6ed847476f86be3279f56722d5b4",
    titleTa: "சாரப்பள்ளம் சாமுண்டி", titleEn: "Sarapallam Samundi",
    edition: { editionStatementTa: "முதற் பதிப்பு — 1978", year: 1978, publisherTa: "தமிழ்க்கனி பதிப்பகம், சென்னை-28" },
    scan: { ...ARUMBU_1978, workScans: "24–48 (25 scans)" }, collection: ARUMBU_1978.collectionId,
    expect: { sections: 1 },
  },
  {
    slug: "surulimalai", subtree: "39e5908a1fdb65737178886cd21eed3744425af6",
    titleTa: "சுருளிமலை", titleEn: "Surulimalai",
    edition: { editionStatementTa: "இரண்டாம் பதிப்பு — 1968", year: 1968, publisherTa: "திராவிடப்பண்ணை" },
    scan: { scanFilename: "TVA_BOK_0064107_சுருளிமலை.pdf", scanSha256: "3d940115bed12e818b8f3cbfbdfca56def0285aef803334f8711acf27f7408ea", scanBytes: 268529598, scanTotal: 198, workScans: "5–197 (front matter 1–4; back cover 198)" },
    expect: { sections: 26 },
    structureNote: "The source prints chapters with no chapters 6 or 7 in its own numbering; the assembled reading layer preserves that gap exactly and invents no chapter 6/7.",
  },
  {
    slug: "vellikkizhamai", subtree: "1eb0681c87882e8dd1110b50a83c329016692496",
    titleTa: "வெள்ளிக்கிழமை", titleEn: "Vellikkizhamai",
    edition: { editionStatementTa: "இரண்டாம் பதிப்பு — 1968", year: 1968, publisherTa: "திராவிடப்பண்ணை" },
    scan: { scanFilename: "TVA_BOK_0064233_வெள்ளிக்கிழமை.pdf", scanSha256: "ac241cbfbe3d47d76f22140f43c662176ba29a91521b826a1a8f5c75cf3081d3", scanBytes: 251126214, scanTotal: 179, workScans: "story body across the printed chapters" },
    expect: { sections: 23 },
  },
];

// Front matter + a single YAML value.
function frontMatter(text, file) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) die(`${file}: missing front matter`);
  const fm = {};
  for (const line of m[1].split("\n")) { const kv = /^([a-z_]+):\s*(.*)$/.exec(line); if (kv) fm[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, "$1"); }
  return { fm, body: text.slice(m[0].length) };
}
// Documented deterministic transform: drop standalone HTML-comment scan markers (recorded separately),
// preserve all literary bytes, fold 3+ newline runs to a paragraph break. Returns { text, scans }.
function readingText(body) {
  const scans = [];
  const kept = [];
  for (const line of body.split("\n")) {
    const c = /^<!--\s*([\s\S]*?)\s*-->\s*$/.exec(line.trim());
    if (c) { const sm = /scan\s+(\d+)/.exec(c[1]); if (sm) scans.push(Number(sm[1])); continue; } // marker → provenance only
    kept.push(line);
  }
  const text = kept.join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "").replace(/\s+$/, "");
  return { text, scans: Array.from(new Set(scans)).sort((a, b) => a - b) };
}
const isSection = (f) => /^\d.*\.md$/.test(f);

function buildWork(cfg) {
  const WORK_DIR = path.join(SRC_REPO, "works", cfg.slug);
  const liveSubtree = git("rev-parse", `HEAD:works/${cfg.slug}`);
  if (liveSubtree !== cfg.subtree) die(`${cfg.slug}: work subtree drift — archive has ${liveSubtree}, frozen at ${cfg.subtree}`);
  const meta = readText(path.join(WORK_DIR, "metadata/source.md"));
  if (!meta.includes(cfg.scan.scanSha256)) die(`${cfg.slug}: metadata no longer records the pinned scan SHA-256`);

  const TA_DIR = path.join(WORK_DIR, "sections");
  const EN_DIR = path.join(WORK_DIR, "translations/en/sections");
  const taFiles = fs.readdirSync(TA_DIR).filter(isSection).sort();
  // Pair TA↔EN by the leading order-number prefix, not the full filename: the English intro may use a
  // different slug (e.g. TA `00-arimugam` ↔ EN `00-introduction`) while carrying the same section_order.
  const ord = (f) => Number(/^(\d+)/.exec(f)[1]);
  const enFilesByOrd = new Map(fs.readdirSync(EN_DIR).filter(isSection).map((f) => [ord(f), f]));
  const sections = taFiles.map((file) => {
    const ta = frontMatter(readText(path.join(TA_DIR, file)), `${cfg.slug}/sections/${file}`);
    const enFile = enFilesByOrd.get(ord(file));
    if (!enFile) die(`${cfg.slug}: missing English section for order ${ord(file)} (TA ${file})`);
    const en = frontMatter(readText(path.join(EN_DIR, enFile)), `${cfg.slug}/translations/en/sections/${enFile}`);
    // Tamil sections are the verified assembled-reading layer. English section state is recorded from
    // whichever field the layer uses (`status` or `translation_status`); its value is carried through so
    // the manifest can state each work's true English readiness rather than flatten it.
    const TA_OK = new Set(["verified"]);
    const EN_OK = new Set(["verified", "source-checked", "reviewed", "translation-reviewed", "complete"]);
    if (!TA_OK.has(ta.fm.status)) die(`${file}: Tamil section status "${ta.fm.status}" != verified`);
    const enStatus = en.fm.status || en.fm.translation_status;
    if (!EN_OK.has(enStatus)) die(`${file}: English section status "${enStatus}" not an accepted reviewed state`);
    const taR = readingText(ta.body);
    const enR = readingText(en.body);
    if (!taR.text.length) die(`${file}: empty Tamil reading text`);
    if (!enR.text.length) die(`${file}: empty English reading text`);
    return {
      order: Number(ta.fm.section_order),
      slug: file.replace(/\.md$/, ""),
      sectionTitleTa: ta.fm.section_title || null,
      sectionTitleEn: en.fm.section_title || null,
      tamilStatus: ta.fm.status,
      englishStatus: enStatus,
      sourceScans: taR.scans,
      sourceScansDeclared: (ta.fm.source_scans || "").replace(/^"|"$/g, "") || null,
      tamilText: taR.text,
      englishText: enR.text,
    };
  }).sort((a, b) => a.order - b.order);
  // Distinct English readiness states across this work's sections (recorded honestly, never flattened).
  const englishStates = Array.from(new Set(sections.map((s) => s.englishStatus))).sort();

  // ── Structural safeguards ─────────────────────────────────────────────────────────────────────
  if (sections.length !== cfg.expect.sections) die(`${cfg.slug}: ${sections.length} sections != expected ${cfg.expect.sections}`);
  if (new Set(sections.map((s) => s.order)).size !== sections.length) die(`${cfg.slug}: duplicate section_order`);
  if (new Set(sections.map((s) => s.slug)).size !== sections.length) die(`${cfg.slug}: duplicate section slug`);

  const novel = {
    workId: cfg.slug, slug: cfg.slug,
    sourceRepo: "pugazg/kalaignar-novels", sourcePath: `works/${cfg.slug}`, sourceCommit: SRC_COMMIT, sourceTree: cfg.subtree,
    shelf: "fiction", readerStructure: "novel", subtype: "novel",
    title: { ta: cfg.titleTa, en: cfg.titleEn }, titleEnIsEditorial: true,
    edition: { ...cfg.edition },
    tamilState: "verified", englishState: englishStates.length === 1 ? englishStates[0] : englishStates.join("+"),
    ...(cfg.collection ? { sourceCompilation: cfg.collection } : {}),
    sectionCount: sections.length,
    sections,
  };
  const provenance = {
    workId: cfg.slug, sourceRepo: novel.sourceRepo, sourcePath: novel.sourcePath, sourceCommit: SRC_COMMIT, sourceTree: cfg.subtree,
    wave: 7, batch: 3, shelf: "fiction", readiness: "ready",
    hidden: { discoverable: false, sitemapExposed: false, publicRoute: false, note: "Wave 7 Batch 3 P1 hidden foundation." },
    source: {
      scanFilename: cfg.scan.scanFilename, scanSha256: cfg.scan.scanSha256, scanFileSizeBytes: cfg.scan.scanBytes,
      scanTotalPages: cfg.scan.scanTotal, workScans: cfg.scan.workScans, sourcePdfCommitted: false,
      scanIdentityBasis: "Scan identity (filename, SHA-256, byte size, page count) is carried AS RECORDED BY THE SOURCE ARCHIVE metadata. The controlling PDF is held outside the repositories and was not supplied to this integration, so the checksum was NOT independently recomputed here.",
      publicationYearNote: "No numeric publication year is promoted to the catalogue. Any printed edition statement is carried verbatim in `edition.editionStatementTa` as a source witness only.",
      ...(cfg.structureNote ? { structureNote: cfg.structureNote } : {}),
    },
    ...(cfg.collection ? { sourceCompilation: { collectionId: cfg.collection, note: "This work shares a single 1978 source publication (the அரும்பு-1978 compilation) with the other arumbu-1978 member works. They remain SEPARATE canonical works; the compilation is a source publication relationship, not another work. No collection page is created at P1." } } : {}),
    english: { kind: "project-created", perSectionStates: englishStates, status: `${sections.length}/${sections.length} sections (${englishStates.join(", ")})`, independence: "The reader's English is the project-created independent translation, reviewed against the audited Tamil source." },
    derived: { sections: sections.length, tamilChars: sections.reduce((n, s) => n + s.tamilText.length, 0), englishChars: sections.reduce((n, s) => n + s.englishText.length, 0) },
    projectRights: {
      appliesTo: "underlying-work-authored-by-kalaignar", rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu", rightsAction: "nationalisation", rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null, governmentOrderDate: null, governmentOrderHandoverDate: "2024-12-22",
      projectTranslationNote: "The English reading layer is a project-created, source-linked independent translation; it is not covered by the nationalisation of the Tamil work.",
    },
    notes: [
      "The controlling source is the supplied scanned PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan count.",
      "The reading layer is a deterministic transform of the pinned assembled-reading sections: front matter and HTML-comment scan markers removed, all literary bytes preserved, 3+ newline runs folded to a paragraph break.",
    ],
  };

  const OUT = path.join(process.cwd(), "public/data/novels", cfg.slug);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "novel.json"), JSON.stringify(novel, null, 1) + "\n");
  fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");
  const sha = (f) => execFileSync("shasum", ["-a", "256", path.join(OUT, f)], { encoding: "utf8" }).split(" ")[0];
  console.log(`\n${cfg.slug}: ${sections.length} section(s)${cfg.collection ? ` · compilation ${cfg.collection}` : ""}`);
  console.log(`  novel.json ${sha("novel.json")}`);
  console.log(`  provenance.json ${sha("provenance.json")}`);
  return { slug: cfg.slug, sections: sections.length };
}

console.log(`import-wave7-b3-novels — source ${SRC_REPO} @ ${SRC_COMMIT}`);
for (const cfg of WORKS) buildWork(cfg);
console.log(`\nimport-wave7-b3-novels — OK (${WORKS.length} works; arumbu/nadutheru/sarapallam share the அரும்பு-1978 compilation, kept as separate works)`);
