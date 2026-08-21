// Importer for திருக்குறள் — கலைஞர் உரை.
//
//   node scripts/import-thirukkural.mjs <kalaignar-literary-commentary-clone> <source-commit>
//
// Deterministic, work-specific, pinned and fail-closed. The source archive is READ-ONLY: this
// script only reads it. Generated data is never hand-edited.
//
// ── THE RULE THAT MATTERS MOST ───────────────────────────────────────────────────────────────────
// Only `page_type: commentary` may supply a Kural. The edition's front matter carries மதிப்புரை
// (appreciation) essays that QUOTE 19 Kurals, and 14 of those 19 quote a DIFFERENT sandhi from
// Kalaignar's own printed text — the reviewers write `குணமென்னும்` where the edition sets
// `குணமென்னுங்`, `தெய்வந் தொழாஅள்` where the edition sets `தெய்வம் தொழாஅள்`. Ingesting a review
// page would publish a reviewer's wording under Kalaignar's name.
//
// The exclusion is enforced twice, in opposite directions:
//   1. Extraction reads commentary pages only, so a quotation cannot enter the output by any path.
//   2. A separate ledger pass walks every NON-commentary page and records each quotation it finds.
//      That ledger must match the audited census exactly (19 quotations, all on `review` pages).
//      If the archive ever grows a Kural on a page type this importer has not reasoned about, the
//      count moves and the import ABORTS rather than silently including or silently dropping it.
// Scanning every page and aborting on the first quotation would abort on the archive's own
// documented, expected front matter and could never run; the ledger is how "fail closed" is made
// real against a source that legitimately contains quotations.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-thirukkural.mjs <literary-commentary-clone> <source-commit>");
  process.exit(1);
}

// ── FAIL-CLOSED SOURCE PIN ───────────────────────────────────────────────────────────────────────
let head;
try {
  head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch (e) {
  throw new Error(`unable to read git HEAD of source clone at ${SRC_REPO}: ${e.message}`);
}
if (head !== SRC_COMMIT) {
  throw new Error(
    `source-commit mismatch: supplied ${SRC_COMMIT} but ${SRC_REPO} HEAD is ${head}. ` +
      `Refusing to generate data with a commit SHA that does not match the checked-out source tree.`,
  );
}

const SLUG = "thirukkural";
const WORK = path.join(SRC_REPO, "works", SLUG);
const OUT = path.join(process.cwd(), "public/data", SLUG);
const nfc = (s) => s.normalize("NFC");
const read = (p) => nfc(fs.readFileSync(p, "utf8"));
const die = (m) => { throw new Error(m); };

const TOTAL_KURALS = 1330;
const TOTAL_ADHIKARAMS = 133;
const KURALS_PER_ADHIKARAM = 10;
const TOTAL_PAAL = 3;
const TOTAL_IYAL = 13;

// Audited census of Kural quotations outside the commentary body. A tripwire, not an allowance:
// these are the quotations this importer has examined and deliberately excluded.
const EXPECTED_QUOTATIONS = 19;
const EXPECTED_QUOTATION_PAGE_TYPES = ["review"];

// ── SOURCE IDENTITY — read from the upstream manifest, never restated here ───────────────────────
const manifest = JSON.parse(read(path.join(WORK, "metadata/source-manifest.json")));
if (manifest.identityStatus !== "verified") die(`source identity is "${manifest.identityStatus}", not verified — refusing to import`);
if (manifest.identityVerification?.level !== "content-correspondence-verified") {
  die(`source identity verification level is "${manifest.identityVerification?.level}" — refusing to import below content-correspondence-verified`);
}
const cs = manifest.controllingSource;
if (!/^[0-9a-f]{64}$/.test(cs?.sha256 ?? "")) die("controlling source has no valid sha256");
if (cs.pageCount !== manifest.totalScans) die("controlling source page count disagrees with totalScans");
if (manifest.pageCorrespondence?.type !== "one-to-one" || manifest.pageCorrespondence?.sourcePageEqualsArchiveScan !== true) {
  die("upstream manifest no longer records a one-to-one page correspondence — refusing to import");
}

// ── SEMANTIC HIERARCHY — paal → iyal → adhikaram ─────────────────────────────────────────────────
// Two README schemas exist upstream and are deliberately NOT unified there:
//   chapters 1–77   `# 38. ஊழ்`         + `- குறள்: 371–380`
//   chapters 78–133 `# Chapter 078: …`  + `- **Kural range**: 771–780`
// Both are accepted; anything else aborts rather than being guessed at.
const STRUCT = path.join(WORK, "structure");
const isDir = (...p) => fs.statSync(path.join(...p)).isDirectory();
const paalDirs = fs.readdirSync(STRUCT).filter((d) => /^\d\d-/.test(d) && isDir(STRUCT, d)).sort();
if (paalDirs.length !== TOTAL_PAAL) die(`expected ${TOTAL_PAAL} பால் directories, found ${paalDirs.length}`);

const adhikarams = [];
const iyalSet = new Map();
const iyalDeclared = new Map();
const schemaUse = { tamil: 0, english: 0 };
for (const pd of paalDirs) {
  const paalIndex = Number(pd.slice(0, 2));
  const paalTa = pd.slice(3);
  const iyalDirs = fs.readdirSync(path.join(STRUCT, pd)).filter((d) => /^\d\d-/.test(d) && isDir(STRUCT, pd, d)).sort();
  for (const idr of iyalDirs) {
    const iyalIndex = Number(idr.slice(0, 2));
    const iyalTa = idr.slice(3);
    iyalSet.set(`${paalIndex}/${iyalIndex}`, iyalTa);
    // The iyal README declares its own Kural span. It is a second, independent witness to the
    // hierarchy: if it ever disagrees with the adhikarams nested beneath it, the structure layer
    // has drifted and the import must not proceed on a guess about which record is right.
    const iyalReadme = path.join(STRUCT, pd, idr, "README.md");
    if (!fs.existsSync(iyalReadme)) die(`இயல் ${idr} has no README.md`);
    const iyalRange = /^-\s*(?:குறள்|\*\*Kural range\*\*):\s*(\d+)\s*[–—-]\s*(\d+)\s*$/m.exec(read(iyalReadme));
    if (!iyalRange) die(`இயல் ${idr} README declares no குறள் range — refusing to skip a cross-check the source provides`);
    iyalDeclared.set(`${paalIndex}/${iyalIndex}`, { from: Number(iyalRange[1]), to: Number(iyalRange[2]), dir: idr });
    const adDirs = fs.readdirSync(path.join(STRUCT, pd, idr)).filter((d) => /^\d{3}-/.test(d) && isDir(STRUCT, pd, idr, d)).sort();
    for (const ad of adDirs) {
      const f = path.join(STRUCT, pd, idr, ad, "README.md");
      if (!fs.existsSync(f)) die(`adhikaram ${ad} has no README.md`);
      const t = read(f);
      const hTa = /^#\s*(\d+)\.\s*(.+)$/m.exec(t);
      const hEn = /^#\s*Chapter\s*(\d+):\s*(.+)$/m.exec(t);
      const rTa = /^-\s*குறள்:\s*(\d+)\s*[–—-]\s*(\d+)\s*$/m.exec(t);
      const rEn = /^-\s*\*\*Kural range\*\*:\s*(\d+)\s*[–—-]\s*(\d+)\s*$/m.exec(t);
      const schema = hTa && rTa ? "tamil" : hEn && rEn ? "english" : null;
      if (!schema) {
        die(
          `adhikaram README ${pd}/${idr}/${ad} matches neither the Tamil schema (\`# N. title\` + \`- குறள்: a–b\`) ` +
            `nor the English schema (\`# Chapter NNN: title\` + \`- **Kural range**: a–b\`). ` +
            `Refusing to guess its number or Kural range.`,
        );
      }
      schemaUse[schema]++;
      const head2 = schema === "tamil" ? hTa : hEn;
      const range = schema === "tamil" ? rTa : rEn;
      const number = Number(head2[1]);
      const from = Number(range[1]);
      const to = Number(range[2]);
      if (Number(ad.slice(0, 3)) !== number) die(`adhikaram directory ${ad} disagrees with its README heading number ${number}`);
      if (to - from + 1 !== KURALS_PER_ADHIKARAM) die(`adhikaram ${number} covers ${to - from + 1} Kurals, expected ${KURALS_PER_ADHIKARAM}`);
      adhikarams.push({ number, ta: head2[2].trim(), from, to, paalIndex, paalTa, iyalIndex, iyalTa, schema });
    }
  }
}
adhikarams.sort((a, b) => a.number - b.number);
if (adhikarams.length !== TOTAL_ADHIKARAMS) die(`expected ${TOTAL_ADHIKARAMS} adhikarams, found ${adhikarams.length}`);
if (adhikarams.some((a, i) => a.number !== i + 1)) die("adhikaram numbers are not exactly 1..133");
{
  let prev = 0;
  for (const a of adhikarams) {
    if (a.from !== prev + 1) die(`adhikaram ${a.number} starts at Kural ${a.from}, expected ${prev + 1} — the hierarchy has a gap or overlap`);
    prev = a.to;
  }
  if (prev !== TOTAL_KURALS) die(`adhikaram ranges end at Kural ${prev}, expected ${TOTAL_KURALS}`);
}
if (iyalSet.size !== TOTAL_IYAL) die(`expected ${TOTAL_IYAL} இயல், found ${iyalSet.size}`);
// Cross-check: each இயல்'s declared span must equal the span of the adhikarams nested under it.
for (const [key, decl] of iyalDeclared) {
  const [pi, ii] = key.split("/").map(Number);
  const nested = adhikarams.filter((a) => a.paalIndex === pi && a.iyalIndex === ii);
  if (!nested.length) die(`இயல் ${decl.dir} declares Kurals ${decl.from}–${decl.to} but contains no adhikaram`);
  const lo = Math.min(...nested.map((a) => a.from));
  const hi = Math.max(...nested.map((a) => a.to));
  if (lo !== decl.from || hi !== decl.to) {
    die(
      `இயல் ${decl.dir} declares Kurals ${decl.from}–${decl.to}, but the adhikarams nested under it ` +
        `span ${lo}–${hi}. The structure layer's two witnesses disagree; refusing to choose between them.`,
    );
  }
}
const adhikaramOf = (n) => adhikarams.find((a) => n >= a.from && n <= a.to) ?? die(`Kural ${n} maps to no adhikaram`);

// ── PAGE RECORDS ─────────────────────────────────────────────────────────────────────────────────
const KURAL_BLOCK = /^\*\*(\d{1,4})\.\s+([\s\S]*?)\*\*$/;
const pageFiles = fs.readdirSync(path.join(WORK, "pages")).filter((f) => /\.md$/.test(f)).sort();
if (pageFiles.length !== manifest.totalScans) die(`expected ${manifest.totalScans} page records, found ${pageFiles.length}`);

const pages = pageFiles.map((file) => {
  const text = read(path.join(WORK, "pages", file));
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!fm) die(`page record ${file} has no front matter`);
  const h = fm[1];
  const str = (k) => (new RegExp(`^${k}:\\s*"?([^"\\n]*)"?\\s*$`, "m").exec(h) ?? [])[1]?.trim();
  const pageType = str("page_type");
  const scan = Number((/^scan_page:\s*(\d+)\s*$/m.exec(h) ?? [])[1]);
  const printedRaw = (/^printed_page:\s*(.*)$/m.exec(h) ?? [])[1]?.trim();
  if (!pageType) die(`page record ${file} has no page_type`);
  if (!Number.isInteger(scan)) die(`page record ${file} has no scan_page`);
  const sourceFilename = str("source_filename");
  if (!sourceFilename) die(`page record ${file} has no source_filename`);
  const blocks = text
    .slice(fm[0].length)
    .split("\n\n")
    .map((p) => p.replace(/\s+$/, ""))
    .filter((p) => p.trim());
  return {
    file,
    pageType,
    scan,
    status: str("status"),
    printedPage: !printedRaw || printedRaw === "null" ? null : printedRaw.replace(/^"(.*)"$/, "$1"),
    sourceFilename,
    blocks,
  };
});

// ── PASS 1 — EXCLUSION LEDGER over non-commentary pages ──────────────────────────────────────────
const quotations = [];
for (const p of pages) {
  if (p.pageType === "commentary") continue;
  for (const b of p.blocks) {
    const m = KURAL_BLOCK.exec(b.trim());
    if (m) quotations.push({ number: Number(m[1]), file: p.file, scan: p.scan, pageType: p.pageType });
  }
}
const quotedTypes = [...new Set(quotations.map((q) => q.pageType))].sort();
if (quotations.length !== EXPECTED_QUOTATIONS) {
  die(
    `exclusion ledger drift: found ${quotations.length} Kural quotations outside the commentary body, ` +
      `expected the audited ${EXPECTED_QUOTATIONS}. The archive's front matter has changed shape. ` +
      `Refusing to import until the new material is examined — a Kural must never enter the reading ` +
      `body from a page that quotes rather than sets it.\n  found on: ${quotedTypes.join(", ")}`,
  );
}
const unexpectedTypes = quotedTypes.filter((t) => !EXPECTED_QUOTATION_PAGE_TYPES.includes(t));
if (unexpectedTypes.length) {
  die(`exclusion ledger drift: Kural quotations appear on unexamined page type(s): ${unexpectedTypes.join(", ")}`);
}

// ── PASS 2 — EXTRACTION from commentary pages only ───────────────────────────────────────────────
const kurals = new Map();
const commentaryScans = new Set();
for (const p of pages) {
  if (p.pageType !== "commentary") continue;
  for (let i = 0; i < p.blocks.length; i++) {
    const m = KURAL_BLOCK.exec(p.blocks[i].trim());
    if (!m) continue;
    const number = Number(m[1]);

    if (p.status !== "verified") die(`${p.file}: commentary page carrying Kural ${number} has status "${p.status}"`);
    if (!Number.isInteger(number) || number < 1 || number > TOTAL_KURALS) {
      die(`${p.file}: Kural number ${number} is outside 1..${TOTAL_KURALS}`);
    }
    if (kurals.has(number)) {
      die(`Kural ${number} appears twice: scan ${kurals.get(number).source.scan} and scan ${p.scan}`);
    }

    // The couplet's two printed lines are carried separately and NEVER joined.
    const tamilText = m[2].split("\n").map((l) => l.trim()).filter(Boolean);
    if (tamilText.length !== 2) {
      die(`Kural ${number} on ${p.file} has ${tamilText.length} printed line(s); every Kural in this edition sets exactly 2`);
    }

    // The urai is the next prose paragraph: not a heading, not a comment, not the next Kural.
    let urai = null;
    for (let j = i + 1; j < p.blocks.length; j++) {
      const q = p.blocks[j].trim();
      if (q.startsWith("#") || q.startsWith("<!--")) continue;
      if (KURAL_BLOCK.test(q)) break;
      urai = p.blocks[j];
      break;
    }
    if (!urai?.trim()) die(`Kural ${number} on ${p.file} has no Kalaignar urai following it`);
    if (p.printedPage === null) die(`Kural ${number} on ${p.file} has no printed page; this edition prints one on every commentary page`);

    const ad = adhikaramOf(number);
    commentaryScans.add(p.scan);
    kurals.set(number, {
      number,
      paal: { index: ad.paalIndex, tamil: ad.paalTa },
      iyal: { index: ad.iyalIndex, tamil: ad.iyalTa },
      adhikaram: { number: ad.number, tamil: ad.ta, from: ad.from, to: ad.to },
      tamilText,
      kalaignarUrai: urai,
      source: { filename: p.sourceFilename, scan: p.scan, printedPage: p.printedPage, pageType: p.pageType, record: p.file },
      commentary: { author: "மு. கருணாநிதி", edition: manifest.edition },
    });
  }
}

// ── PRE-WRITE ASSERTIONS ─────────────────────────────────────────────────────────────────────────
const missing = [];
for (let n = 1; n <= TOTAL_KURALS; n++) if (!kurals.has(n)) missing.push(n);
if (missing.length) {
  die(`missing ${missing.length} Kural(s): ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? ` (+${missing.length - 20} more)` : ""}`);
}
if (kurals.size !== TOTAL_KURALS) die(`extracted ${kurals.size} Kurals, expected exactly ${TOTAL_KURALS}`);

for (const a of adhikarams) {
  const got = [];
  for (let n = a.from; n <= a.to; n++) if (kurals.has(n)) got.push(n);
  if (got.length !== KURALS_PER_ADHIKARAM) die(`adhikaram ${a.number} has ${got.length} Kurals, expected ${KURALS_PER_ADHIKARAM}`);
  for (const n of got) {
    if (kurals.get(n).adhikaram.number !== a.number) die(`Kural ${n} is mapped to adhikaram ${kurals.get(n).adhikaram.number}, expected ${a.number}`);
  }
}
// Nothing in the output may trace to a page that quotes rather than sets the Kural.
const quotedNumbers = new Set(quotations.map((q) => q.number));
for (const k of kurals.values()) {
  if (k.source.pageType !== "commentary") die(`Kural ${k.number} traces to page_type "${k.source.pageType}" — only commentary may supply a Kural`);
  if (k.tamilText.length !== 2) die(`Kural ${k.number} does not carry exactly 2 lines`);
  if (!k.kalaignarUrai?.trim()) die(`Kural ${k.number} has no urai`);
  if (!k.source.filename || !Number.isInteger(k.source.scan)) die(`Kural ${k.number} has incomplete source provenance`);
  if (k.source.printedPage === null) die(`Kural ${k.number} has no printed page`);
}
// Every quoted Kural must ALSO exist from commentary — proving the exclusion lost nothing.
for (const n of quotedNumbers) {
  if (!kurals.has(n)) die(`Kural ${n} exists only as a front-matter quotation and never as commentary — refusing to publish a quotation as source text`);
}

// ── OUTPUT ───────────────────────────────────────────────────────────────────────────────────────
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "adhikarams"), { recursive: true });
const ordered = [...kurals.values()].sort((a, b) => a.number - b.number);
const pad = (n) => String(n).padStart(3, "0");

// index.json — lightweight rows only. Full urai lives in the per-adhikaram files, so the Daily
// Kural panel and search never load 1330 commentaries.
const index = {
  workId: SLUG,
  title: { ta: "திருக்குறள்", en: "Thirukkural" },
  subtitle: { ta: "கலைஞர் உரை", en: "Kalaignar Urai" },
  poet: { ta: "திருவள்ளுவர்", en: "Thiruvalluvar" },
  commentator: { ta: "கலைஞர் மு. கருணாநிதி", en: "Kalaignar M. Karunanidhi" },
  sourceRepo: "pugazg/kalaignar-literary-commentary",
  sourcePath: `works/${SLUG}`,
  sourceCommit: SRC_COMMIT,
  counts: { kurals: TOTAL_KURALS, paal: TOTAL_PAAL, iyal: iyalSet.size, adhikarams: TOTAL_ADHIKARAMS },
  paal: paalDirs.map((d) => ({ index: Number(d.slice(0, 2)), tamil: d.slice(3) })),
  iyal: [...iyalSet].map(([k, v]) => ({ paal: Number(k.split("/")[0]), index: Number(k.split("/")[1]), tamil: v })),
  adhikarams: adhikarams.map((a) => ({
    number: a.number, tamil: a.ta, from: a.from, to: a.to,
    paal: { index: a.paalIndex, tamil: a.paalTa },
    iyal: { index: a.iyalIndex, tamil: a.iyalTa },
    file: `adhikarams/${pad(a.number)}.json`,
  })),
  kurals: ordered.map((k) => ({
    number: k.number,
    firstLine: k.tamilText[0],
    paal: k.paal.index,
    iyal: k.iyal.index,
    adhikaram: k.adhikaram.number,
  })),
};
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index, null, 1) + "\n");

for (const a of adhikarams) {
  const entries = [];
  for (let n = a.from; n <= a.to; n++) entries.push(kurals.get(n));
  fs.writeFileSync(
    path.join(OUT, "adhikarams", `${pad(a.number)}.json`),
    JSON.stringify({
      number: a.number, tamil: a.ta, from: a.from, to: a.to,
      paal: { index: a.paalIndex, tamil: a.paalTa },
      iyal: { index: a.iyalIndex, tamil: a.iyalTa },
      kurals: entries,
    }, null, 1) + "\n",
  );
}

// provenance.json — references the upstream identity; never restates, supplements or alters it.
const provenance = {
  workId: SLUG,
  sourceRepo: index.sourceRepo,
  sourcePath: index.sourcePath,
  sourceCommit: SRC_COMMIT,
  controllingSource: {
    filename: cs.filename,
    sha256: cs.sha256,
    byteSize: cs.byteSize,
    pageCount: cs.pageCount,
    committed: cs.committed,
    archiveIdentifier: cs.archiveIdentifier ?? null,
    repository: cs.repository ?? null,
  },
  identityStatus: manifest.identityStatus,
  identityVerification: {
    level: manifest.identityVerification.level,
    verifiedAgainst: manifest.identityVerification.verifiedAgainst ?? null,
    verificationMethod: manifest.identityVerification.verificationMethod ?? null,
  },
  identitySourceNote:
    "Source identity is owned by the archive and is reproduced here verbatim from " +
    `${index.sourceRepo} ${index.sourcePath}/metadata/source-manifest.json at the pinned commit. ` +
    "This application never computes, supplements or corrects it.",
  pageCorrespondence: manifest.pageCorrespondence,
  edition: {
    statement: manifest.edition ?? null,
    publisher: manifest.publisher ?? null,
    workTitleTa: manifest.workTitleTa ?? null,
    workSubtitleTa: manifest.workSubtitleTa ?? null,
    commentator: manifest.commentator ?? null,
  },
  derived: {
    kurals: TOTAL_KURALS,
    adhikarams: TOTAL_ADHIKARAMS,
    kuralsPerAdhikaram: KURALS_PER_ADHIKARAM,
    paal: TOTAL_PAAL,
    iyal: iyalSet.size,
    totalPageRecords: pages.length,
    commentaryPages: pages.filter((p) => p.pageType === "commentary").length,
    commentaryPagesCarryingKurals: commentaryScans.size,
    adhikaramReadmeSchemas: schemaUse,
  },
  textualFidelity:
    "The couplet's two printed lines are carried separately and never joined. Spelling, sandhi, " +
    "punctuation and spacing are reproduced exactly as printed; nothing is modernised or normalised.",
  excludedFromReadingBody: {
    rule:
      "Kural text and Kalaignar urai are taken ONLY from page records whose page_type is " +
      "\"commentary\". Pages that quote a Kural are never a source of its text.",
    quotationsExcluded: quotations.length,
    quotationPageTypes: quotedTypes,
    quotationLedger: quotations
      .slice()
      .sort((a, b) => a.number - b.number)
      .map((q) => ({ kural: q.number, record: q.file, scan: q.scan, pageType: q.pageType })),
    note:
      `The edition's front-matter மதிப்புரை essays quote ${quotations.length} Kurals. Many are quoted ` +
      "in a sandhi that differs from Kalaignar's own printed text, so admitting them would publish a " +
      "reviewer's wording under his name. Each quoted Kural is also independently present as " +
      "commentary, so excluding these pages loses nothing.",
    alsoOutsideReadingBody: [
      "the scan-8 handwritten facsimile, a documented partial record upstream",
      "the first-word index, blank leaves, cover and publication matter",
    ],
  },
};
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

const sha = (f) => execFileSync("shasum", ["-a", "256", f], { encoding: "utf8" }).split(" ")[0];
const du = (d) => execFileSync("du", ["-sk", d], { encoding: "utf8" }).split("\t")[0].trim();
console.log(`work: ${SLUG}  (source ${SRC_COMMIT.slice(0, 8)})`);
console.log(`kurals ${kurals.size} | adhikarams ${adhikarams.length} | iyal ${iyalSet.size} | paal ${paalDirs.length}`);
console.log(`adhikaram README schemas: tamil ${schemaUse.tamil}, english ${schemaUse.english}`);
console.log(`commentary pages ${provenance.derived.commentaryPages} of ${pages.length} records; ${commentaryScans.size} carry Kurals`);
console.log(`quotations excluded: ${quotations.length} on page type(s) ${quotedTypes.join(", ")}`);
console.log(`controlling source: ${cs.filename}`);
console.log(`  sha256 ${cs.sha256}`);
console.log(`  ${cs.byteSize.toLocaleString()} bytes | ${cs.pageCount} pages | ${manifest.identityVerification.level}`);
console.log(`index.json      sha256 ${sha(path.join(OUT, "index.json"))}`);
console.log(`provenance.json sha256 ${sha(path.join(OUT, "provenance.json"))}`);
console.log(`adhikaram files: ${fs.readdirSync(path.join(OUT, "adhikarams")).length} | total output ${du(OUT)} KB`);
