// Independent validator for the released திருக்குறள் — கலைஞர் உரை data.
//
//   node scripts/validate-thirukkural.mjs <kalaignar-literary-commentary-clone> [--data <dir>]
//
// EXIT CODES — the contract in docs/VALIDATOR_CONTRACT.md:
//
//   0  every assertion passed; the released data matches the archive.
//   1  DATA INTEGRITY FAILURE. The archive and the released data disagree, and someone must look
//      at the text.
//   2  COULD NOT RUN. No argument, missing or unreadable source clone, a clone at the wrong
//      commit, missing or unparseable released data, or an upstream identity level below the one
//      the work was released under.
//
// The 1/2 distinction is load-bearing. Exit 1 says the library's content is wrong; exit 2 says
// nothing was learned either way. A run that could not fetch its source must never be mistaken for
// a run that found nothing wrong — absence of validation is not evidence of validity.
//
// This validator is the reference implementation for that contract. Its four paths are proven by
// scripts/test-validator-contract.mjs, which corrupts disposable COPIES and never writes to the
// source archive.
//
// This file shares NO code with scripts/import-thirukkural.mjs. It re-parses the archive from
// scratch and re-derives every expectation from the source, so that a defect in the importer
// cannot hide behind the importer's own idea of what is correct. Nothing here is checked against
// the importer; everything is checked against the archive.
//
// Counts are derived, never assumed. The validator does not "know" there are 1330 Kurals: it reads
// the adhikaram ranges the archive declares and computes the total from them. If the edition were
// a different length, this validator would expect that different length.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SLUG = "thirukkural";
const args = process.argv.slice(2);
const SRC_REPO = args.find((a) => !a.startsWith("--"));
const dataFlag = args.indexOf("--data");
const DATA = dataFlag === -1 ? path.join(process.cwd(), "public/data", SLUG) : path.resolve(args[dataFlag + 1]);

const bail = (msg) => {
  console.error(`\n${SLUG} — CANNOT VALIDATE\n\n  ${msg}\n`);
  process.exit(2);
};
if (!SRC_REPO) bail("usage: node scripts/validate-thirukkural.mjs <literary-commentary-clone> [--data <dir>]");
if (!fs.existsSync(SRC_REPO)) bail(`source clone not found: ${SRC_REPO}`);
if (!fs.existsSync(DATA)) bail(`released data not found: ${DATA}`);

const nfc = (s) => s.normalize("NFC");
const read = (p) => nfc(fs.readFileSync(p, "utf8"));
const readJson = (p) => {
  if (!fs.existsSync(p)) bail(`required file missing: ${p}`);
  try { return JSON.parse(read(p)); } catch (e) { bail(`${p} is not valid JSON: ${e.message}`); }
};

// ── ASSERTION LEDGER ─────────────────────────────────────────────────────────────────────────────
let assertions = 0;
const failures = [];
const ok = (cond, label) => {
  assertions++;
  if (!cond) failures.push(label);
  return cond;
};
const eq = (actual, expected, label) => ok(actual === expected, `${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);

// ── SOURCE PIN ───────────────────────────────────────────────────────────────────────────────────
const provenance = readJson(path.join(DATA, "provenance.json"));
const index = readJson(path.join(DATA, "index.json"));
if (!provenance.sourceCommit) bail("provenance.json records no sourceCommit — cannot verify what the data was built from");
let head;
try {
  head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch (e) {
  bail(`unable to read git HEAD of ${SRC_REPO}: ${e.message}`);
}
if (head !== provenance.sourceCommit) {
  bail(
    `source pin mismatch: released data was built from ${provenance.sourceCommit}, but the supplied ` +
      `clone is at ${head}. Validating against a different revision would prove nothing.`,
  );
}

const WORK = path.join(SRC_REPO, "works", SLUG);
if (!fs.existsSync(WORK)) bail(`source clone has no works/${SLUG}`);
const manifest = readJson(path.join(WORK, "metadata/source-manifest.json"));

// ── RE-DERIVE THE HIERARCHY FROM SOURCE ──────────────────────────────────────────────────────────
// Both upstream README schemas are read here independently of the importer's parser.
const STRUCT = path.join(WORK, "structure");
if (!fs.existsSync(STRUCT)) bail(`source clone has no works/${SLUG}/structure`);
const isDir = (...p) => fs.existsSync(path.join(...p)) && fs.statSync(path.join(...p)).isDirectory();
const numbered = (dir, re) => fs.readdirSync(dir).filter((d) => re.test(d) && isDir(dir, d)).sort();

const srcAdhikarams = [];
const srcIyal = [];
const srcPaal = [];
for (const pd of numbered(STRUCT, /^\d\d-/)) {
  const paalIndex = Number(pd.slice(0, 2));
  const paalTa = pd.slice(3);
  srcPaal.push({ index: paalIndex, tamil: paalTa });
  for (const id of numbered(path.join(STRUCT, pd), /^\d\d-/)) {
    const iyalIndex = Number(id.slice(0, 2));
    srcIyal.push({ paal: paalIndex, index: iyalIndex, tamil: id.slice(3) });
    for (const ad of numbered(path.join(STRUCT, pd, id), /^\d{3}-/)) {
      const f = path.join(STRUCT, pd, id, ad, "README.md");
      if (!fs.existsSync(f)) bail(`source adhikaram ${ad} has no README.md`);
      const t = read(f);
      const h = /^#\s*(\d+)\.\s*(.+)$/m.exec(t) ?? /^#\s*Chapter\s*(\d+):\s*(.+)$/m.exec(t);
      const r = /^-\s*(?:குறள்|\*\*Kural range\*\*):\s*(\d+)\s*[–—-]\s*(\d+)\s*$/m.exec(t);
      if (!h || !r) bail(`source adhikaram README ${ad} uses a schema this validator does not recognise`);
      srcAdhikarams.push({
        number: Number(h[1]), tamil: h[2].trim(),
        from: Number(r[1]), to: Number(r[2]),
        paal: { index: paalIndex, tamil: paalTa },
        iyal: { index: iyalIndex, tamil: id.slice(3) },
      });
    }
  }
}
srcAdhikarams.sort((a, b) => a.number - b.number);
if (!srcAdhikarams.length) bail("source structure layer declares no adhikarams");

// Derived, not assumed: the edition's length is whatever the archive's own ranges add up to.
const EXPECTED_KURALS = srcAdhikarams.reduce((n, a) => n + (a.to - a.from + 1), 0);
const EXPECTED_ADHIKARAMS = srcAdhikarams.length;
const EXPECTED_PAAL = srcPaal.length;
const EXPECTED_IYAL = srcIyal.length;
const EXPECTED_PER_ADHIKARAM = srcAdhikarams[0].to - srcAdhikarams[0].from + 1;

// ── RE-DERIVE THE TEXT FROM SOURCE PAGE RECORDS ──────────────────────────────────────────────────
const KURAL_BLOCK = /^\*\*(\d{1,4})\.\s+([\s\S]*?)\*\*$/;
const PAGES = path.join(WORK, "pages");
if (!fs.existsSync(PAGES)) bail(`source clone has no works/${SLUG}/pages`);

const srcKurals = new Map();       // number -> canonical record, from commentary pages only
const srcDuplicates = [];          // a Kural set on more than one commentary page
const quotations = new Map();      // number -> [{ text, pageType, record }] from every other page type

for (const file of fs.readdirSync(PAGES).filter((f) => f.endsWith(".md")).sort()) {
  const text = read(path.join(PAGES, file));
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!fm) bail(`source page record ${file} has no front matter`);
  const h = fm[1];
  const field = (k) => (new RegExp(`^${k}:\\s*"?([^"\\n]*)"?\\s*$`, "m").exec(h) ?? [])[1]?.trim();
  const pageType = field("page_type");
  const scan = Number((/^scan_page:\s*(\d+)\s*$/m.exec(h) ?? [])[1]);
  const rawPrinted = (/^printed_page:\s*(.*)$/m.exec(h) ?? [])[1]?.trim();
  const printedPage = !rawPrinted || rawPrinted === "null" ? null : rawPrinted.replace(/^"(.*)"$/, "$1");
  const sourceFilename = field("source_filename");
  const blocks = text.slice(fm[0].length).split("\n\n").map((b) => b.replace(/\s+$/, "")).filter((b) => b.trim());

  for (let i = 0; i < blocks.length; i++) {
    const m = KURAL_BLOCK.exec(blocks[i].trim());
    if (!m) continue;
    const number = Number(m[1]);
    const lines = m[2].split("\n").map((l) => l.trim()).filter(Boolean);

    if (pageType !== "commentary") {
      if (!quotations.has(number)) quotations.set(number, []);
      quotations.get(number).push({ text: lines, pageType, record: file });
      continue;
    }
    let urai = null;
    for (let j = i + 1; j < blocks.length; j++) {
      const q = blocks[j].trim();
      if (q.startsWith("#") || q.startsWith("<!--")) continue;
      if (KURAL_BLOCK.test(q)) break;
      urai = blocks[j];
      break;
    }
    if (srcKurals.has(number)) srcDuplicates.push(number);
    srcKurals.set(number, { number, lines, urai, scan, printedPage, sourceFilename, record: file, pageType });
  }
}
if (!srcKurals.size) bail("no Kurals could be re-derived from the source commentary pages");

// ── LOAD RELEASED DATA ───────────────────────────────────────────────────────────────────────────
const adhDir = path.join(DATA, "adhikarams");
if (!fs.existsSync(adhDir)) bail(`released data has no adhikarams/ directory`);
const released = new Map();
const releasedAdhikaramFiles = fs.readdirSync(adhDir).filter((f) => f.endsWith(".json")).sort();
const releasedAdhikarams = [];
let duplicateScan = 0;
for (const f of releasedAdhikaramFiles) {
  const j = readJson(path.join(adhDir, f));
  releasedAdhikarams.push({ ...j, file: f });
  for (const k of j.kurals ?? []) {
    duplicateScan++;
    if (released.has(k.number)) {
      const first = released.get(k.number).fromFile;
      failures.push(
        first === f
          ? `Kural ${k.number} appears more than once inside ${f}`
          : `Kural ${k.number} appears in two adhikaram files: ${first} and ${f}`,
      );
    }
    released.set(k.number, { ...k, fromFile: f });
  }
}

assertions += duplicateScan; // one uniqueness assertion per released entry
console.log(`\n${SLUG} — independent validation against ${provenance.sourceCommit.slice(0, 8)}`);
console.log(`  derived from source: ${EXPECTED_KURALS} Kurals · ${EXPECTED_ADHIKARAMS} adhikarams · ${EXPECTED_IYAL} இயல் · ${EXPECTED_PAAL} பால்\n`);

// ── 1. SOURCE INTEGRITY ──────────────────────────────────────────────────────────────────────────
eq(srcDuplicates.length, 0, `source sets a Kural on more than one commentary page: ${srcDuplicates.join(", ")}`);
eq(srcKurals.size, EXPECTED_KURALS, "source commentary pages yield the number of Kurals the structure layer declares");
ok(manifest.identityStatus === "verified", `upstream identityStatus is "${manifest.identityStatus}", not "verified"`);
eq(manifest.identityVerification?.level, "content-correspondence-verified", "upstream identity verification level");

// ── 2. KURAL COVERAGE ────────────────────────────────────────────────────────────────────────────
eq(released.size, EXPECTED_KURALS, "released Kural count");
const missing = [];
const unexpected = [];
for (let n = 1; n <= EXPECTED_KURALS; n++) if (!released.has(n)) missing.push(n);
for (const n of released.keys()) if (n < 1 || n > EXPECTED_KURALS || !srcKurals.has(n)) unexpected.push(n);
eq(missing.length, 0, `missing Kural numbers: ${missing.slice(0, 15).join(", ")}${missing.length > 15 ? "…" : ""}`);
eq(unexpected.length, 0, `released Kural numbers with no counterpart in the source commentary: ${unexpected.slice(0, 15).join(", ")}`);
const releasedNumbers = [...released.keys()].sort((a, b) => a - b);
ok(releasedNumbers.length === new Set(releasedNumbers).size, "released data contains duplicate Kural numbers");
eq(releasedNumbers[0], 1, "lowest released Kural number");
eq(releasedNumbers[releasedNumbers.length - 1], EXPECTED_KURALS, "highest released Kural number");

// ── 3. ADHIKARAM STRUCTURE ───────────────────────────────────────────────────────────────────────
eq(releasedAdhikaramFiles.length, EXPECTED_ADHIKARAMS, "released adhikaram file count");
for (const a of srcAdhikarams) {
  const rel = releasedAdhikarams.find((r) => r.number === a.number);
  if (!ok(rel, `adhikaram ${a.number} is absent from released data`)) continue;
  eq(rel.tamil, a.tamil, `adhikaram ${a.number} title`);
  eq(rel.from, a.from, `adhikaram ${a.number} range start`);
  eq(rel.to, a.to, `adhikaram ${a.number} range end`);
  eq(rel.kurals.length, EXPECTED_PER_ADHIKARAM, `adhikaram ${a.number} Kural count`);
  const nums = rel.kurals.map((k) => k.number);
  ok(nums.every((n, i) => n === a.from + i), `adhikaram ${a.number} does not contain exactly Kurals ${a.from}–${a.to} in order`);
  for (const k of rel.kurals) {
    eq(k.adhikaram?.number, a.number, `Kural ${k.number} adhikaram mapping`);
    eq(k.paal?.index, a.paal.index, `Kural ${k.number} பால் mapping`);
    eq(k.iyal?.index, a.iyal.index, `Kural ${k.number} இயல் mapping`);
  }
}
// every Kural is reachable through exactly one adhikaram whose range contains it
for (const [n, k] of released) {
  const owner = srcAdhikarams.find((a) => n >= a.from && n <= a.to);
  ok(owner && k.adhikaram?.number === owner.number, `Kural ${n} is filed under adhikaram ${k.adhikaram?.number}, but the source ranges place it in ${owner?.number}`);
}

// ── 4. பால் AND இயல் ─────────────────────────────────────────────────────────────────────────────
eq(index.paal?.length, EXPECTED_PAAL, "index பால் count");
for (const p of srcPaal) {
  const rel = index.paal?.find((x) => x.index === p.index);
  eq(rel?.tamil, p.tamil, `பால் ${p.index} name`);
}
eq(index.iyal?.length, EXPECTED_IYAL, "index இயல் count");
for (const i of srcIyal) {
  const rel = index.iyal?.find((x) => x.paal === i.paal && x.index === i.index);
  eq(rel?.tamil, i.tamil, `இயல் ${i.paal}/${i.index} name`);
}
// contiguity: adhikaram ranges must tile 1..N with no gap and no overlap
{
  let cursor = 0;
  let contiguous = true;
  for (const a of srcAdhikarams) {
    if (a.from !== cursor + 1) contiguous = false;
    cursor = a.to;
  }
  ok(contiguous, "source adhikaram ranges are not contiguous");
  eq(cursor, EXPECTED_KURALS, "adhikaram ranges do not tile the full edition");
}
// each இயல்'s span, taken from its adhikarams, must not overlap another இயல்'s
{
  const spans = srcIyal.map((i) => {
    const nested = srcAdhikarams.filter((a) => a.paal.index === i.paal && a.iyal.index === i.index);
    return { key: `${i.paal}/${i.index}`, from: Math.min(...nested.map((a) => a.from)), to: Math.max(...nested.map((a) => a.to)) };
  }).sort((a, b) => a.from - b.from);
  let overlap = false;
  for (let i = 1; i < spans.length; i++) if (spans[i].from <= spans[i - 1].to) overlap = true;
  ok(!overlap, "இயல் spans overlap");
  ok(spans.every((s, i) => i === 0 || s.from === spans[i - 1].to + 1), "இயல் spans leave a gap");
}

// ── 5. TEXT FIDELITY ─────────────────────────────────────────────────────────────────────────────
for (const [n, src] of srcKurals) {
  const rel = released.get(n);
  if (!rel) continue; // already recorded as missing
  ok(Array.isArray(rel.tamilText), `Kural ${n} tamilText is not an array`);
  eq(rel.tamilText?.length, 2, `Kural ${n} line count (the couplet must never be joined)`);
  ok(rel.tamilText?.every((l) => typeof l === "string" && l.trim()), `Kural ${n} contains an empty line`);
  // byte-exact against the archive: no normalisation, no punctuation edits, no spelling changes
  ok(JSON.stringify(rel.tamilText) === JSON.stringify(src.lines),
    `Kural ${n} Tamil text differs from the source commentary\n      source:   ${JSON.stringify(src.lines)}\n      released: ${JSON.stringify(rel.tamilText)}`);
  ok(typeof rel.kalaignarUrai === "string" && rel.kalaignarUrai.trim(), `Kural ${n} has no Kalaignar urai`);
  ok(rel.kalaignarUrai === src.urai, `Kural ${n} urai differs from the source commentary`);
}

// ── 6. SOURCE PROVENANCE ─────────────────────────────────────────────────────────────────────────
const declaredSplits = new Map((manifest.derivedFiles ?? []).map((d) => [d.filename, d]));
ok(declaredSplits.size > 0, "upstream manifest declares no derivedFiles");
for (const [n, src] of srcKurals) {
  const rel = released.get(n);
  if (!rel) continue;
  eq(rel.source?.scan, src.scan, `Kural ${n} scan number`);
  eq(rel.source?.printedPage, src.printedPage, `Kural ${n} printed page`);
  ok(rel.source?.printedPage !== null && rel.source?.printedPage !== undefined, `Kural ${n} has no printed page`);
  eq(rel.source?.record, src.record, `Kural ${n} page record`);
  eq(rel.source?.filename, src.sourceFilename, `Kural ${n} transcription witness filename`);
  // the cited file must be a split the archive declares, and must not be the controlling source
  ok(declaredSplits.has(rel.source?.filename), `Kural ${n} cites "${rel.source?.filename}", which the archive does not declare in derivedFiles`);
  eq(rel.source?.role, declaredSplits.get(rel.source?.filename)?.role, `Kural ${n} source role`);
  eq(rel.source?.role, "processing-split", `Kural ${n} source role must remain processing-split`);
  ok(rel.source?.filename !== manifest.controllingSource.filename, `Kural ${n} claims the controlling source as its transcription witness`);
}
// each Kural resolves to exactly one commentary page record in the source
{
  const perNumber = new Map();
  for (const [n, s] of srcKurals) perNumber.set(n, s.record);
  let conflicts = 0;
  for (const [n, rel] of released) {
    if (!perNumber.has(n)) continue;
    if (rel.source?.record !== perNumber.get(n)) conflicts++;
  }
  eq(conflicts, 0, "released Kurals citing a page record other than the one that sets them");
}

// ── 7. COMMENTARY SOURCE RULE ────────────────────────────────────────────────────────────────────
// Only page_type "commentary" may supply Kural text.
for (const [n, rel] of released) {
  eq(rel.source?.pageType, "commentary", `Kural ${n} claims page type "${rel.source?.pageType}"`);
  const src = srcKurals.get(n);
  ok(src && src.pageType === "commentary", `Kural ${n} does not trace to a commentary page in the source`);
}
// The archive's front matter QUOTES Kurals, often in a different sandhi. Those readings must not
// appear in the released text. Only quotations that actually differ can be tested for absence —
// where a reviewer happens to quote the edition exactly, absence would be the wrong assertion.
let variantsChecked = 0;
let identicalQuotations = 0;
for (const [n, quotes] of quotations) {
  const src = srcKurals.get(n);
  ok(src, `Kural ${n} is quoted in the front matter but never set as commentary`);
  const rel = released.get(n);
  if (!src || !rel) continue;
  for (const q of quotes) {
    const differs = JSON.stringify(q.text) !== JSON.stringify(src.lines);
    if (!differs) { identicalQuotations++; continue; }
    variantsChecked++;
    ok(JSON.stringify(rel.tamilText) !== JSON.stringify(q.text),
      `Kural ${n} carries the ${q.pageType}-page wording from ${q.record}, not Kalaignar's printed text\n      quotation: ${JSON.stringify(q.text)}\n      edition:   ${JSON.stringify(src.lines)}`);
    // and the variant must not appear anywhere in the released corpus, under any number
    const needle = q.text.join("\n");
    const corpus = releasedAdhikarams.map((a) => JSON.stringify(a.kurals)).join("\n");
    ok(!corpus.includes(JSON.stringify(q.text).slice(1, -1).split('","').join('\\n')) && !corpus.includes(needle),
      `the ${q.pageType}-page variant of Kural ${n} appears somewhere in the released corpus`);
  }
}
ok(variantsChecked > 0, "no differing front-matter quotations were found to test against — the exclusion rule is untested");

// ── 8. PROVENANCE FILE ───────────────────────────────────────────────────────────────────────────
const cs = manifest.controllingSource;
eq(provenance.controllingSource?.filename, cs.filename, "provenance controlling source filename");
eq(provenance.controllingSource?.sha256, cs.sha256, "provenance controlling source sha256");
eq(provenance.controllingSource?.byteSize, cs.byteSize, "provenance controlling source byteSize");
eq(provenance.controllingSource?.pageCount, cs.pageCount, "provenance controlling source pageCount");
eq(provenance.identityStatus, manifest.identityStatus, "provenance identityStatus");
eq(provenance.identityVerification?.level, manifest.identityVerification.level, "provenance identity verification level");
ok(/^[0-9a-f]{64}$/.test(provenance.controllingSource?.sha256 ?? ""), "provenance controlling source sha256 is not a 64-character hex digest");
// the controlling source is named in provenance.json and nowhere else in the released data
{
  const corpus = releasedAdhikaramFiles.map((f) => read(path.join(adhDir, f))).join("\n") + read(path.join(DATA, "index.json"));
  ok(!corpus.includes(cs.filename), "the controlling source filename appears outside provenance.json");
  ok(!corpus.includes(cs.sha256), "the controlling source digest appears outside provenance.json");
}
eq(provenance.excludedFromReadingBody?.quotationsExcluded, [...quotations.values()].reduce((n, q) => n + q.length, 0),
  "provenance quotation ledger count matches what the source actually contains");

// ── 9. INDEX CONSISTENCY ─────────────────────────────────────────────────────────────────────────
eq(index.kurals?.length, EXPECTED_KURALS, "index row count");
eq(index.counts?.kurals, EXPECTED_KURALS, "index declared Kural count");
eq(index.counts?.adhikarams, EXPECTED_ADHIKARAMS, "index declared adhikaram count");
eq(index.counts?.iyal, EXPECTED_IYAL, "index declared இயல் count");
eq(index.counts?.paal, EXPECTED_PAAL, "index declared பால் count");
for (const row of index.kurals ?? []) {
  const src = srcKurals.get(row.number);
  if (!src) { failures.push(`index row ${row.number} has no source counterpart`); assertions++; continue; }
  eq(row.firstLine, src.lines[0], `index row ${row.number} first line`);
  ok(!("kalaignarUrai" in row), `index row ${row.number} carries the full urai — the index must stay lightweight`);
}
for (const a of index.adhikarams ?? []) {
  ok(fs.existsSync(path.join(DATA, a.file)), `index points at a missing adhikaram file: ${a.file}`);
}

// ── REPORT ───────────────────────────────────────────────────────────────────────────────────────
const passed = assertions - failures.length;
console.log(`  assertions ${assertions} · passed ${passed} · failed ${failures.length}`);
console.log(`  ${srcKurals.size}/${EXPECTED_KURALS} Kurals independently reconstructed from source page records`);
console.log(`  front-matter quotations examined: ${[...quotations.values()].reduce((n, q) => n + q.length, 0)} (${variantsChecked} differing, ${identicalQuotations} identical)`);
if (failures.length) {
  console.error(`\nFAILURES (${failures.length}):`);
  for (const f of failures.slice(0, 40)) console.error("  ✗ " + f);
  if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
  console.error("");
  process.exit(1);
}
console.log(`\n  ${SLUG.toUpperCase()} — RELEASED DATA FAITHFUL TO SOURCE\n`);
process.exit(0);
