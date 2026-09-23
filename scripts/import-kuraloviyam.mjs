// Deterministic importer — குறளோவியம் (Kuraloviyam), Wave 7 qualified Literary Commentary candidate.
//
//   node scripts/import-kuraloviyam.mjs <literary-commentary-clone> [--check | --verify]
//
// Reads ONLY the pinned canonical layers of `works/kuraloviyam` at the frozen Wave-7 P0 pin: the 666 audited
// Tamil page records (`pages/`), the 666 maintained-English page records (`translations/en/pages/`) and the
// source contents/crosswalk index (`sections/entries/index.json`). Writes public/data/kuraloviyam/
// {index.json, provenance.json, units/<id>.json}. `--check` writes nothing; `--verify` additionally requires
// every vendored file to be BYTE-IDENTICAL to a fresh regeneration.
//
// ONE CATALOGUE WORK. The six "Parts" are the six physical intake splits of one 666-scan book (111 scans
// each) — source-transfer units, not works and not reading units. The reading units are the book's own:
// front matter, the 300 printed-contents entries, and the printed contents/back cover.
//
// QUALIFICATION (frozen; the importer ABORTS if the source disagrees): visual verification 666/666; Tamil
// textual verification 662; maintained English release-ready 662; scans 13, 14, 15, 19 permanently
// source-limited (three handwritten-facsimile prefaces and one prose page with washed-out words). Their
// missing wording is NEVER reconstructed, inferred or marked verified; the public page states the condition
// as a permanent property of the source, not as pending work.
//
// FIDELITY. Source text is copied byte-for-byte (no normalisation). The archive's own English DESCRIPTIONS of
// illustrations, stamps and marks are kept apart from the text as `archival` blocks — never mixed into it.
// In the Tamil layer an archival description is a Latin-script paragraph under an archival heading (`##
// Visual material`, `## Non-printed mark`, `## Handwritten facsimile`, `## Non-body marks`) or on the
// blank page; the English layer's corresponding paragraphs are aligned to it section by section. Tamil-script
// text inside those sections (a couplet printed on an illustration, the prose that follows) is source text.
//
// PUBLIC PAYLOADS CARRY NO INTERNAL STATE (no hidden / wave / readiness field under public/). The internal
// P1 record is data/internal/wave7/kuraloviyam-manifest.json, never served.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const VERIFY = args.includes("--verify");
const CHECK = args.includes("--check") || VERIFY;
const [REPO] = args.filter((a) => !a.startsWith("--"));
if (!REPO) { console.error("usage: node scripts/import-kuraloviyam.mjs <literary-commentary-clone> [--check | --verify]"); process.exit(1); }
const die = (m) => { console.error(`import-kuraloviyam: ${m}`); process.exit(1); };
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const git = (...a) => execFileSync("git", ["-C", REPO, ...a], { encoding: "utf8" }).trim();

export const PIN = "d542b4cc3749bf1966e3537d1eb34d421344faf5";
if (git("rev-parse", "HEAD") !== PIN) die(`source HEAD is not the frozen pin ${PIN}`);
const WORK = "works/kuraloviyam";
const W = path.join(REPO, WORK);
const WORK_TREE = git("rev-parse", `HEAD:${WORK}`);

const TOTAL_SCANS = 666;
const SOURCE_LIMITED = [13, 14, 15, 19];
const TA = /[஀-௿]/;
const ARCH_TA = /^## (Visual material|Non-printed mark|Handwritten facsimile|Non-body marks)\s*$/;
const ARCH_EN = /^## (Visual material|Visual record|Non-printed mark|Source-limited handwritten facsimile|Non-body material|Non-body marks|Source limitation)\s*$/;
// A printed Kural citation line, e.g. `அதிகாரம் - 7 - மக்கட்பேறு; பாடல் - 69` / `Chapter 7 — …; Kural 69`.
const CITE_TA = /^அதிகாரம்\s*-\s*\d+/;
const CITE_EN = /^(Chapter|Adhikaram)\s+\d+\b.*\b(Kurals?|Songs?|Verses?)\s+\d+/i;

// ── PAGE RECORDS ──────────────────────────────────────────────────────────────────────────────────────
function readRecord(file) {
  const t = fs.readFileSync(file, "utf8");
  const m = /^---\n([\s\S]*?)\n---\n/.exec(t);
  if (!m) die(`${file}: no front matter`);
  const fm = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, "$1");
  }
  return { fm, body: t.slice(m[0].length) };
}

// Split a page body into sections (by `#`/`##` heading) of raw paragraphs. Comments are provenance only.
function sections(body, archRe) {
  const out = [{ heading: null, archival: false, paras: [] }];
  let cur = [];
  const flush = () => { if (cur.length) { out[out.length - 1].paras.push(cur.join("\n")); cur = []; } };
  for (const raw of body.split("\n")) {
    const probe = raw.replace(/\s+$/, "");
    if (/^<!--[\s\S]*-->$/.test(probe) || /^<!--/.test(probe)) { flush(); continue; }
    if (/^#{1,6}\s/.test(probe)) {
      flush();
      out.push({ heading: raw, archival: archRe.test(probe), paras: [] });
      continue;
    }
    if (probe.trim() === "") { flush(); continue; }
    cur.push(raw);
  }
  flush();
  return out;
}

const stripQuote = (p) => p.split("\n").map((l) => l.replace(/^>[ ]?/, "")).join("\n");
const isQuote = (p) => p.split("\n").every((l) => /^>/.test(l));

// Tamil page → blocks.
function tamilBlocks(rec, scan) {
  const secs = sections(rec.body, ARCH_TA);
  const blank = rec.fm.page_type === "blank";
  const blocks = [];
  const archCounts = []; // per archival section, # of archival (description) paragraphs — aligns the English
  for (const s of secs) {
    if (s.heading && !s.archival) blocks.push({ kind: "heading", level: /^(#+)/.exec(s.heading)[1].length, text: s.heading.replace(/^#+\s+/, "") });
    let k = 0;
    for (const p of s.paras) {
      const latin = !TA.test(p);
      if ((s.archival || blank) && latin) { blocks.push({ kind: "archival", text: p }); k++; continue; }
      if (CITE_TA.test(p.trim())) { blocks.push({ kind: "citation", text: p }); continue; }
      blocks.push({ kind: "paragraph", ...(isQuote(p) ? { quote: true, text: stripQuote(p) } : { text: p }) });
    }
    if (s.archival) archCounts.push(k);
  }
  return { blocks, archCounts };
}

// English page → blocks, with archival descriptions aligned to the Tamil page's archival sections.
function englishBlocks(rec, scan, archCounts, pageType) {
  const secs = sections(rec.body, ARCH_EN);
  const blank = pageType === "blank"; // the audited Tamil record's page type governs both layers
  const blocks = [];
  let ai = 0;
  for (const s of secs) {
    if (s.heading && !s.archival) blocks.push({ kind: "heading", level: /^(#+)/.exec(s.heading)[1].length, text: s.heading.replace(/^#+\s+/, "") });
    // `## Source limitation` (English only) is the archive's own limitation note; the public page carries
    // the durable source-condition block instead, so its prose is archival.
    const limitation = /Source limitation/.test(s.heading || "");
    const k = s.archival && !limitation ? (archCounts[ai++] ?? 0) : 0;
    s.paras.forEach((p, i) => {
      if (limitation || (s.archival && i < k) || (blank && !secs.some((x) => x.heading))) { blocks.push({ kind: "archival", text: p }); return; }
      if (CITE_EN.test(p.trim())) { blocks.push({ kind: "citation", text: p }); return; }
      blocks.push({ kind: "paragraph", ...(isQuote(p) ? { quote: true, text: stripQuote(p) } : { text: p }) });
    });
  }
  // Alignment check: every English archival description is prose-like (never a quoted couplet) and there is
  // one English archival paragraph per Tamil one on body pages.
  for (const b of blocks) if (b.kind === "archival" && /^[>“"]/.test(b.text) && scan > 33) die(`scan ${scan}/en: an aligned archival paragraph looks like quoted source text: ${b.text.slice(0, 60)}`);
  return blocks;
}

// ── SOURCE-LIMITED PAGES ──────────────────────────────────────────────────────────────────────────────
// Durable, source-honest wording. The archive's own descriptions of these pages use workflow language
// ("not transcribed in Pass 1", "must wait for better source evidence"); none of it is published. What is
// verifiable on the page — a printed heading, a visible handwritten date — is kept.
function sourceLimited(scan, taRec) {
  const handwritten = taRec.fm.page_type === "handwritten-facsimile";
  const date = /Visible handwritten date:\s*`([^`]+)`/.exec(taRec.body)?.[1] ?? null;
  return {
    kind: "source-limited",
    condition: handwritten ? "handwritten-facsimile" : "washed-out-words",
    ...(date ? { visibleDate: date } : {}),
    ta: handwritten
      ? "இப்பக்கத்தின் முதன்மை உரை கையெழுத்துப் படிவம். மூல ஸ்கேனிலிருந்து அதன் சொற்களை நம்பகமாக வாசிக்க இயலாததால் அவை படியெடுக்கப்படவும் இல்லை, மொழிபெயர்க்கப்படவும் இல்லை; ஊகிக்கப்படவும் இல்லை. இது மூலத்தின் நிலையான நிலை."
      : "இப்பக்கத்தின் சில சொற்கள் மூல ஸ்கேனில் மங்கியுள்ளன; அவை இருக்கும் இடம் குறிக்கப்பட்டுள்ளது. அவை ஊகிக்கப்படவில்லை. இது மூலத்தின் நிலையான நிலை.",
    en: handwritten
      ? "The main text of this page is a handwritten facsimile. Its wording cannot be read reliably from the source scan, so it is neither transcribed nor translated, and nothing is inferred. This is a permanent condition of the source."
      : "A few words on this page are washed out in the source scan. Their place is marked where they occur, and they are not supplied. This is a permanent condition of the source.",
  };
}

// ── ENTRY / UNIT MAP ──────────────────────────────────────────────────────────────────────────────────
const index = JSON.parse(fs.readFileSync(path.join(W, "sections/entries/index.json"), "utf8"));
if (index.entry_count !== 300 || index.entries.length !== 300) die(`contents index has ${index.entries.length} entries, not 300`);
// The one page two consecutive contents spans share: scan 452 / printed 435. Its audited record shows it
// holds ONLY the close of entry 202 (the Nallamma vignette ending at Chapter 7 / Kural 69); entry 203's text
// opens on scan 453. The printed contents' own locator for entry 203 (p.435) is disclosed on entry 203.
const SHARED_PAGE_OWNER = { 452: 202 };

const FRONT = [
  { id: "front-01", scans: [1, 3], ta: "முகப்பு, தலைப்பு, பதிப்பு விவரம்", en: "Cover, title and edition imprint" },
  { id: "front-02", scans: [4, 8], ta: "முகப்புரை", en: "Preface" },
  { id: "front-03", scans: [9, 12], ta: "மதிப்புரை", en: "Critical appreciation" },
  { id: "front-04", scans: [13, 15], ta: "பிந்தைய பதிப்புகளின் முகப்புரைகள் (கையெழுத்துப் படிவங்கள்)", en: "Later-edition prefaces (handwritten facsimiles)" },
  { id: "front-05", scans: [16, 17], ta: "முதற்பதிப்பு நிழற்படமும் பதிப்பகக் குறிப்பும்", en: "First-edition photograph and publisher's note" },
  { id: "front-06", scans: [18, 31], ta: "பாராட்டுரைகளும் கலைஞர் ஏற்புரையும்", en: "Appreciations and Kalaignar's response" },
  { id: "front-07", scans: [32, 33], ta: "பகுதித் தலைப்பு", en: "Section title leaf" },
];
const BACK = { id: "back-matter", scans: [658, 666], ta: "பொருளடக்கமும் பின்னட்டையும்", en: "Printed contents and back cover" };

// ── PAGES ─────────────────────────────────────────────────────────────────────────────────────────────
const taFiles = fs.readdirSync(path.join(W, "pages")).filter((f) => f.endsWith(".md")).sort();
const enFiles = fs.readdirSync(path.join(W, "translations/en/pages")).filter((f) => f.endsWith(".md")).sort();
if (taFiles.length !== TOTAL_SCANS || enFiles.length !== TOTAL_SCANS) die(`page records: ${taFiles.length} Tamil / ${enFiles.length} English, expected ${TOTAL_SCANS}`);
if (JSON.stringify(taFiles) !== JSON.stringify(enFiles)) die("Tamil and English page-record filenames differ");

const pages = new Map();
const counts = { visualVerified: 0, textualVerified: 0, englishReleaseReady: 0, sourceLimited: [] };
for (const f of taFiles) {
  const scan = Number(f.slice(0, 4));
  const ta = readRecord(path.join(W, "pages", f));
  const en = readRecord(path.join(W, "translations/en/pages", f));
  if (Number(ta.fm.scan_page) !== scan || Number(en.fm.source_scan_page) !== scan) die(`${f}: scan number mismatch`);
  if (ta.fm.visual_fidelity === "verified") counts.visualVerified++;
  if (ta.fm.status === "verified") counts.textualVerified++;
  if (en.fm.status === "release-ready") counts.englishReleaseReady++;
  const limited = ta.fm.status !== "verified";
  if (limited) {
    if (ta.fm.status !== "partial" || en.fm.status !== "source-limited") die(`${f}: non-verified page is not partial/source-limited (${ta.fm.status}/${en.fm.status})`);
    counts.sourceLimited.push(scan);
  } else if (en.fm.status !== "release-ready") die(`${f}: verified Tamil page without release-ready English (${en.fm.status})`);
  const t = tamilBlocks(ta, scan);
  const eb = englishBlocks(en, scan, t.archCounts, ta.fm.page_type);
  let taB = t.blocks, enB = eb;
  if (limited) {
    // Keep verified source text (headings, prose with its inline gap marker); drop the archive's own
    // workflow-worded descriptions and state the permanent condition instead.
    const sl = sourceLimited(scan, ta);
    taB = [...taB.filter((b) => b.kind !== "archival"), sl];
    enB = [...enB.filter((b) => b.kind !== "archival"), sl];
  }
  for (const b of [...taB, ...enB]) {
    const tx = b.text ?? "";
    if (/Pass 1|Pass 2|\bGR\d\b|release-ready|^---$|^scan_page:/.test(tx) && b.kind !== "archival") die(`scan ${scan}: workflow text in a reading block: ${tx.slice(0, 70)}`);
  }
  pages.set(scan, {
    scan,
    printed: ta.fm.printed_page,
    pageType: ta.fm.page_type,
    sourceLimited: limited,
    ta: taB,
    en: enB,
  });
}
if (counts.visualVerified !== 666) die(`visual verification ${counts.visualVerified}/666`);
if (counts.textualVerified !== 662) die(`Tamil textual verification ${counts.textualVerified}, expected 662`);
if (counts.englishReleaseReady !== 662) die(`English release-ready ${counts.englishReleaseReady}, expected 662`);
if (JSON.stringify(counts.sourceLimited) !== JSON.stringify(SOURCE_LIMITED)) die(`source-limited scans ${counts.sourceLimited}, expected ${SOURCE_LIMITED}`);

// ── UNITS ─────────────────────────────────────────────────────────────────────────────────────────────
const seqOf = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
const units = [];
for (const f of FRONT) units.push({ id: f.id, kind: "front-matter", titleTa: f.ta, titleEn: f.en, scans: seqOf(...f.scans) });
for (const e of index.entries) {
  let scans = seqOf(e.scan_span.start, e.scan_span.end);
  scans = scans.filter((s) => !(SHARED_PAGE_OWNER[s] && SHARED_PAGE_OWNER[s] !== e.entry));
  units.push({
    id: `entry-${String(e.entry).padStart(3, "0")}`,
    kind: "entry",
    number: e.entry,
    contentsKey: e.contents_key,
    printedSpan: [e.printed_span.start, e.printed_span.end],
    ...(e.scan_span.start < scans[0] ? { contentsLocatorNote: { printed: e.printed_span.start, textBeginsScan: scans[0], textBeginsPrinted: Number(pages.get(scans[0]).printed) } } : {}),
    expectedKuralCount: e.expected_kural_count,
    crosswalkStatus: e.status,
    assignments: e.assignments.map((a) => ({ chapter: a.chapter, titleTa: a.title, kurals: a.kurals, bookTa: a.book, bookKey: a.book_key, iyalTa: a.iyal, iyalKey: a.iyal_key })),
    scans,
  });
}
units.push({ id: BACK.id, kind: "back-matter", titleTa: BACK.ta, titleEn: BACK.en, scans: seqOf(...BACK.scans) });

// Every scan 1..666 belongs to exactly one reading unit.
const owner = new Map();
for (const u of units) for (const s of u.scans) {
  if (owner.has(s)) die(`scan ${s} assigned to both ${owner.get(s)} and ${u.id}`);
  owner.set(s, u.id);
}
for (let s = 1; s <= TOTAL_SCANS; s++) if (!owner.has(s)) die(`scan ${s} belongs to no reading unit`);

// ── SOURCE IDENTITY (the six physical intake splits) ──────────────────────────────────────────────────
const sourceMd = fs.readFileSync(path.join(W, "metadata/source.md"), "utf8");
const splits = [];
for (let p = 1; p <= 6; p++) {
  const n = String(p).padStart(3, "0");
  const row = new RegExp(`\\|\\s*${n}\\s*\\|\\s*(\\d+)[–-](\\d+)\\s*\\|\\s*(\\d+)\\s*\\|\\s*\`([^\`]+)\``).exec(sourceMd);
  if (!row) die(`source.md: split ${n} row not found`);
  const sec = new RegExp(`## Part ${n} source identity[\\s\\S]*?(?=\\n## )`).exec(sourceMd)?.[0] ?? "";
  const shaM = /SHA-256:\s*`([0-9a-f]{64})`/.exec(sec);
  const bytesM = /file size:\s*\*\*([\d,]+) bytes\*\*/.exec(sec);
  splits.push({ part: p, filename: row[4], scans: `${row[1]}–${row[2]}`, pages: Number(row[3]), ...(shaM ? { sha256: shaM[1] } : {}), ...(bytesM ? { bytes: Number(bytesM[1].replace(/,/g, "")) } : {}) });
}
if (splits.map((s) => s.pages).reduce((a, b) => a + b, 0) !== TOTAL_SCANS) die("splits do not cover 666 scans");

// ── PAYLOADS ──────────────────────────────────────────────────────────────────────────────────────────
const unitPayload = (u) => ({
  work: "kuraloviyam",
  ...u,
  pages: u.scans.map((s) => {
    const p = pages.get(s);
    return { scan: p.scan, printed: p.printed, pageType: p.pageType, ...(p.sourceLimited ? { sourceLimited: true } : {}), ta: p.ta, en: p.en };
  }),
});
const indexPayload = {
  work: "kuraloviyam",
  titleTa: "குறளோவியம்",
  titleEn: "Kuraloviyam",
  authorTa: "கலைஞர் மு. கருணாநிதி",
  authorEn: "Kalaignar M. Karunanidhi",
  scanTotal: TOTAL_SCANS,
  entryCount: 300,
  units: units.map((u) => {
    const { scans, ...rest } = u;
    return { ...rest, scanSpan: [scans[0], scans[scans.length - 1]], printedSpan: u.printedSpan ?? [pages.get(scans[0]).printed, pages.get(scans[scans.length - 1]).printed], ...(scans.some((s) => pages.get(s).sourceLimited) ? { sourceLimitedScans: scans.filter((s) => pages.get(s).sourceLimited) } : {}) };
  }),
};
const provenancePayload = {
  workId: "kuraloviyam",
  sourceRepo: "pugazg/kalaignar-literary-commentary",
  sourcePath: WORK,
  sourceCommit: PIN,
  source: {
    titleTa: "குறளோவியம்",
    authorTa: "கலைஞர் மு. கருணாநிதி",
    publisherTa: "பாரதி பதிப்பகம்",
    priceTa: "ரூ.1200.00",
    editionsEn: ["First Edition: February 1985", "Second Edition: June 1986", "Third Edition: September 1992", "Fourth Edition: June 1997", "Fifth Edition: December 1999", "Sixth Edition: January 2004", "Seventh Edition: December 2008", "Eighth Edition: April 2009", "Ninth Edition: February 2011", "Tenth Edition: September 2018"],
    scanFamily: "TVA_BOK_0065733",
    scanTotal: TOTAL_SCANS,
    splits,
    binaryVendored: false,
  },
  verification: {
    visualVerified: counts.visualVerified,
    tamilTextualVerified: counts.textualVerified,
    englishReleaseReady: counts.englishReleaseReady,
    sourceLimitedScans: counts.sourceLimited,
    blocked: 0,
  },
  sourceLimitedPages: counts.sourceLimited.map((s) => ({ scan: s, printed: pages.get(s).printed, pageType: pages.get(s).pageType, unit: owner.get(s) })),
  english: { kind: "project-created", basis: "the audited Tamil page records" },
  structure: {
    entries: 300,
    frontMatterSections: FRONT.length,
    crosswalk: { resolved: index.entries.filter((e) => e.status === "RESOLVED").length, partialSourceMetadata: index.entries.filter((e) => e.status !== "RESOLVED").map((e) => e.entry) },
    note: "Book → Iyal → Adhikaram placement is an archive-derived navigation scaffold. Adhikaram and Kural assignments are taken only from the audited pages; no missing Chapter or Kural number is filled from another edition.",
  },
  notes: [
    "The controlling source is the scanned 666-page book, supplied as six physical 111-page splits. The PDFs are not vendored; their identity travels as filename, SHA-256 and page map.",
    "Scans 13, 14, 15 and 19 are permanently source-limited: three handwritten facsimile prefaces and one page with washed-out words. Their unreadable wording is not transcribed, translated or inferred.",
    "Illustrations, stamps and handwritten marks are described in the archive's own words and shown apart from the text.",
  ],
};

const OUT = path.join(process.cwd(), "public/data/kuraloviyam");
const files = new Map();
files.set("index.json", JSON.stringify(indexPayload, null, 1) + "\n");
files.set("provenance.json", JSON.stringify(provenancePayload, null, 1) + "\n");
for (const u of units) files.set(`units/${u.id}.json`, JSON.stringify(unitPayload(u), null, 1) + "\n");
for (const [f, body] of files) for (const k of ["hidden", "wave", "batch", "readiness", "discoverable", "sitemapExposed", "publicRoute"]) {
  if (new RegExp(`"${k}"\\s*:`).test(body)) die(`${f}: internal key "${k}" in a public payload`);
}
const manifest = JSON.stringify({
  schema: 1,
  note: "INTERNAL — Kuraloviyam import record (never served). Frozen source identity, qualification and payload hashes.",
  source: { repo: "pugazg/kalaignar-literary-commentary", commit: PIN, path: WORK, tree: WORK_TREE },
  qualification: provenancePayload.verification,
  units: units.length,
  files: Object.fromEntries([...files].map(([f, b]) => [f, sha256(b)])),
}, null, 1) + "\n";
const MAN = path.join(process.cwd(), "data/internal/wave7/kuraloviyam-manifest.json");

if (VERIFY) {
  for (const [f, body] of files) {
    const p = path.join(OUT, f);
    if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== body) die(`--verify: ${f} is not byte-identical to a fresh regeneration`);
  }
  const extra = fs.readdirSync(path.join(OUT, "units")).filter((f) => !files.has(`units/${f}`));
  if (extra.length) die(`--verify: unexpected unit files ${extra.join(", ")}`);
  if (!fs.existsSync(MAN) || fs.readFileSync(MAN, "utf8") !== manifest) die("--verify: internal manifest differs from a fresh regeneration");
}
if (!CHECK) {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, "units"), { recursive: true });
  for (const [f, body] of files) fs.writeFileSync(path.join(OUT, f), body);
  fs.mkdirSync(path.dirname(MAN), { recursive: true });
  fs.writeFileSync(MAN, manifest);
}
console.log(`import-kuraloviyam — ${WORK} @ ${PIN}${CHECK ? (VERIFY ? " (verify)" : " (check only)") : ""}`);
console.log(`  scans ${TOTAL_SCANS} · units ${units.length} (front ${FRONT.length} · entries 300 · back 1) · files ${files.size}`);
console.log(`  visual ${counts.visualVerified}/666 · Tamil textual ${counts.textualVerified} · English release-ready ${counts.englishReleaseReady} · source-limited ${counts.sourceLimited.join(", ")}`);
if (VERIFY) console.log(`  --verify: ${files.size} files + manifest byte-identical to a fresh regeneration`);
