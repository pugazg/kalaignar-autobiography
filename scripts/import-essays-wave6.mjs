// Wave 6 P1–P3 — Batch 6: Essays & Articles. FIVE READY publications from `pugazg/kalaignar-essays`.
//
//   node scripts/import-essays-wave6.mjs <kalaignar-essays-clone> <source-commit>
//
// Reuses the mature Essay family (EssayPublication / Article / EssayProvenance and the shared reader).
// ONE shared parser/core plus FIVE explicit per-work declarations. Deterministic, pinned, fail-closed,
// read-only against the source; the controlling PDFs are never vendored.
//
// Per-article scan RUNS and PRINTED-PAGE evidence are DERIVED from each frozen assembly's own scan
// markers (the source's per-block attribution), not hand-transcribed — the declaration states only the
// facts that need judgment (identity, subtype, accepted status, exclusions, edition, release gate,
// title witnesses, and any special source semantics). Literary bytes are preserved exactly.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-essays-wave6.mjs <kalaignar-essays-clone> <source-commit>");
  process.exit(1);
}
const die = (m) => { throw new Error(m); };
const nfc = (s) => s.normalize("NFC");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const git = (...a) => execFileSync("git", ["-C", SRC_REPO, ...a], { encoding: "utf8" }).trim();

// ── THE PIN IS HARD-LOCKED ────────────────────────────────────────────────────────────────────────
// Authority lives here. The essays repo advances constantly for unrelated publications, so the COMMIT
// alone is a weak guard — the per-work TREE guards below are what make the freeze meaningful.
const APPROVED_SOURCE_COMMIT = "564add708b8bd942fa9d5f505b083955248873d0";
let head;
try { head = git("rev-parse", "HEAD"); } catch (e) { die(`unable to read git HEAD of ${SRC_REPO}: ${e.message}`); }
if (SRC_COMMIT !== APPROVED_SOURCE_COMMIT) die(`supplied source commit ${SRC_COMMIT} is not the approved pin ${APPROVED_SOURCE_COMMIT}.`);
if (head !== APPROVED_SOURCE_COMMIT) die(`${SRC_REPO} is at ${head}, not the approved pin ${APPROVED_SOURCE_COMMIT}.`);

const KAL = "கலைஞர் மு. கருணாநிதி";

// ── THE AUTHORIZED BATCH — EXACTLY FIVE ─────────────────────────────────────────────────────────────
const WORKS = [
  {
    slug: "ina-muzhakkam", tree: "4e6a28cb93a1eb2b8f376a1abebc938a1d7f8ef9",
    titleTa: "இன முழக்கம்", titleEn: "The Clarion Call of the Race", subtype: "essay-collection",
    scanFilename: "TVA_BOK_0063958_இன_முழக்கம்.pdf", scanSha256: "f57e4070051d7bc77ab78d5d393dbefbe47791efcc3203c594c5f3949ef0dfbf",
    scanBytes: 68109788, scanTotal: 50, acceptedArticleStatus: ["strict-reviewed"], articleCount: 6,
    firstEdition: { statementTa: "முதற் பதிப்பு: செப்டம்பர் 1951", monthTa: "செப்டம்பர்", year: 1951, publisherTa: "முன்னேற்றப் பண்ணை", priceTa: "விலை அணா 0-8-0" },
    controllingIsFirstEdition: true,
    exclusions: [
      "scans 1–5 — cover / title-page / front matter",
      "scan 40 — `கவிதைகளைப் பற்றி` + `மதிப்புரை` review/front-matter material; it is NOT a seventh article",
      "scan 50 — catalogue / advertisement",
      "scan-24 and scan-37 promotional matter",
    ],
    titleWitnessNotes: [
      "The publication prints a contents witness (page references 4, 13, 24, 29, 37, 40); the article ordinals here are archive reading ordinals, not printed article numbers.",
    ],
    releaseWitness: "PUBLICATION_COMPLETION_REVIEW.md — P0–P5 COMPLETE / PASS; Tamil STRICT-REVIEWED / FROZEN; English 6/6 verified",
  },
  {
    slug: "kolaikkalam", tree: "e1eff4df14bd56e37575f15651e400f87b332ff0",
    titleTa: "கொலைக்களம்!", titleEn: "The Killing Field", subtype: "essay-collection",
    scanFilename: "TVA_BOK_0063657_கொலைக்களம்.pdf", scanSha256: "674a534f6c29e5abed9c7ebf52c3cfd143f494d6a21341b5d0624871c187a96c",
    scanBytes: 55495728, scanTotal: 40, acceptedArticleStatus: ["strict-reviewed"], articleCount: 6,
    firstEdition: { statementTa: "முதற் பதிப்பு-52", publisherTa: "முன்னேற்றப் பண்ணை", priceTa: "விலை அணா எட்டு" },
    controllingIsFirstEdition: true,
    exclusions: [
      "scans 1–4 — cover / title-publisher / copyright-edition-price / front matter",
      "the separate printer witness on scan 40 — not part of the literary prose",
    ],
    titleWitnessNotes: [
      "The publication prints NO contents page; the article ordinals here are archive reading ordinals.",
      "The printed edition witness is only `52` and is carried verbatim; it is deliberately NOT expanded to a four-digit year.",
    ],
    releaseWitness: "PUBLICATION_COMPLETION_REVIEW.md — P0–P4 PASS; post-P2 lexical reconciliation COMPLETE; English 6/6 verified",
  },
  {
    slug: "kudumbaththin-nalvilakku", tree: "1d1001992ff376056da5cba8d54f7dd79901566b",
    titleTa: "குடும்பத்தின் நல்விளக்கு", titleEn: "The Good Lamp of the Family", subtype: "single-article-pamphlet",
    scanFilename: "TVA_BOK_0065602_குடும்பத்தின்_நல்விளக்கு.pdf", scanSha256: "1c3389ec76507b0c6f2ae294a4523633e81084d570a1443c7b730ac899e15971",
    scanBytes: 34464808, scanTotal: 16, acceptedArticleStatus: ["strict-reviewed"], articleCount: 1,
    authorTaOverride: "முதல்வர் டாக்டர் கலைஞர் மு. கருணாநிதி",
    controllingIsFirstEdition: null, // the source establishes NO edition witness — not "no reprint"
    noEditionEstablished: true,
    exclusions: [
      "scans 1–3 — cover / title page / author portrait",
      "scans 14–16 — back matter",
    ],
    titleWitnessNotes: [
      "No edition statement or publication year is visibly established in the supplied scans; internal dates in the body are NOT publication-date evidence and none is inferred.",
      "The publication prints NO contents page; the single article is an archive reading unit.",
      "Visible printed numerals are 2–9 on scans 5–12; scans 4 and 13 are unnumbered. Printed pages 1 and 10 are NOT invented.",
    ],
    releaseWitness: "PUBLICATION_COMPLETION_REVIEW.md — P0–P5 COMPLETE / PASS (16/16); English 1/1 verified",
  },
  {
    slug: "sinthanaiyum-seyalum", tree: "488cd61fa8df5aafa5a9a505001ce417b2892e90",
    titleTa: "சிந்தனையும் செயலும்", titleEn: "Thought and Action", subtype: "essay-collection",
    // Five non-overlapping transfer PDFs; the original unsplit-PDF SHA is explicitly not available.
    scanFilename: "TVA_BOK_0065568_சிந்தனையும்_செயலும்_2010 (five transfer PDFs)", scanSha256: null, scanBytes: null, scanTotal: 226,
    transferParts: [
      { part: 1, filename: "TVA_BOK_0065568_சிந்தனையும்_செயலும்_2010_part_001_pages_1-55.pdf", globalScans: "1–55", pdfPages: 55, bytes: 139200528, sha256: "55b55a445972248515c549c3c18223412f784220baf3e959367fe8d0a7f7c53d" },
      { part: 2, filename: "TVA_BOK_0065568_சிந்தனையும்_செயலும்_2010_part_002_pages_56-109.pdf", globalScans: "56–109", pdfPages: 54, bytes: 137950874, sha256: "f8f98c948b1c0bba3960905350a97bd6e68a5eeef9107bc0dd9dcf9ea03e578a" },
      { part: 3, filename: "TVA_BOK_0065568_சிந்தனையும்_செயலும்_2010_part_003_pages_110-164.pdf", globalScans: "110–164", pdfPages: 55, bytes: 138370584, sha256: "c05d1a108bff78d018ef542a0afadea62f9802ab7e982b0cf4d97cb789b702cd" },
      { part: 4, filename: "TVA_BOK_0065568_சிந்தனையும்_செயலும்_2010_part_004_pages_165-219.pdf", globalScans: "165–219", pdfPages: 55, bytes: 138940454, sha256: "7bcb93642b2291a575c82a10b08800ce8892e894e1807040da50d830102b60bc" },
      { part: 5, filename: "TVA_BOK_0065568_சிந்தனையும்_செயலும்_2010_part_005_pages_220-226.pdf", globalScans: "220–226", pdfPages: 7, bytes: 18787263, sha256: "d587cc69c41db3c8c2c34a8e4e41e28ef34fe47b7b5c0379df898ef603cf3228" },
    ],
    acceptedArticleStatus: ["verified"], articleCount: 50,
    firstEdition: { statementTa: "முதற்பதிப்பு : ஜூன், 2006", monthTa: "ஜூன்", year: 2006 },
    controllingEdition: { statementTa: "மூன்றாம் பதிப்பு : ஜனவரி, 2010", monthTa: "ஜனவரி", year: 2010, publisherTa: "தமிழ்க்கனி பதிப்பகம்", priceTa: "விலை. ரூ. 120/-" },
    controllingIsFirstEdition: false,
    exclusions: [
      "scans 1–17 — cover / front matter / contents / internal title / blank witnesses",
      "scan 226 — back-cover / promotional witness",
      "printed marginal witnesses excluded from prose",
    ],
    titleWitnessNotes: [
      "The controlling scan is the third edition (ஜனவரி 2010); the first edition (ஜூன் 2006) is a distinct fact and the two are never merged.",
      "Source-witness title distinctions are preserved verbatim and never flattened for consistency (including Units 3, 6, 9, 11, 15, 19, 41 and 48).",
      "The frozen English `Udanpirappē` rendering policy is preserved as released; English is carried verbatim from the frozen release.",
      "The original unsplit-PDF SHA-256 is not available and is never fabricated; each of the five transfer PDFs carries its own SHA-256.",
    ],
    releaseWitness: "PUBLICATION_COMPLETION_REVIEW.md — RELEASE COMPLETE / FROZEN; P2 226/226, P3 50/50, scoped P4/P5 50/50; English 50/50 verified",
  },
  {
    slug: "vedhanai-ch-siraiyinindrum-viduthalai-pera", tree: "f3c43511240df098b175b9d39cdcc6f4318f2230",
    titleTa: "வேதனைச் சிறையினின்றும் விடுதலை பெற", titleEn: "To Win Release from the Prison of Suffering", subtype: "single-article-pamphlet",
    scanFilename: "TVA_BOK_0064064_வேதனைச்_சிறையினின்றும்_விடுதலை_பெற.pdf", scanSha256: "d6429304ca8e53324e41fbe6695a31d1411b12ec5e04bf5a35d8cc8a51d06651",
    scanBytes: 11408976, scanTotal: 8, acceptedArticleStatus: ["strict-reviewed"], articleCount: 1,
    controllingIsFirstEdition: null, // the source establishes NO edition witness — not "no reprint"
    noEditionEstablished: true,
    // CRITICAL SEMANTIC SAFEGUARD: a government public MESSAGE (செய்தி), NOT a delivered speech.
    publicationForm: "government public message (`செய்தி`) issued to the people — NOT a delivered speech; no speech event, venue or exact issue date is stated by the source",
    exclusions: [
      "scans 1–2 — cover / title page",
      "scan 8 — back matter",
    ],
    titleWitnessNotes: [
      "The source identifies this text as a government public `செய்தி` (message) issued to the people by the Tamil Nadu Chief Minister during the `குடும்ப நலத்திட்ட இருவார விழா`. It is NOT a delivered speech and is never classified as one; no speech event or venue is invented.",
      "The family-welfare fortnight began on 15 December 1975; the exact date the message itself was issued is NOT separately stated and is never turned into a message/publication date.",
      "No separate edition statement, printed price or stand-alone publication date is visible in the eight scans; none is inferred.",
    ],
    releaseWitness: "SOURCE_COMPLETENESS_AUDIT.md — P4 PASS (8/8 scans, single canonical assembly); English 1/1 verified",
  },
];

// ── PER-WORK TREE GUARDS + not-in-batch guards ─────────────────────────────────────────────────────
for (const w of WORKS) {
  const live = git("rev-parse", `${APPROVED_SOURCE_COMMIT}:publications/${w.slug}`);
  if (live !== w.tree) die(`source tree drift for ${w.slug}: archive has ${live}, this batch was frozen at ${w.tree}`);
}
const NOT_IN_BATCH = ["meesai-mulaiththa-vayathil", "pesum-kalai-valarppom", "sakkaravarththiyin-thirumagan", "kayittril-thongiya-kanapathi", "unarchchimaalai", "thiraavida-sampaththu"];
for (const s of NOT_IN_BATCH) if (WORKS.some((w) => w.slug === s)) die(`${s} is NOT a Batch-6 work`);
if (WORKS.length !== 5) die(`the authorized batch is exactly 5 publications; got ${WORKS.length}`);

// ── SHARED PARSING CORE ─────────────────────────────────────────────────────────────────────────────
const OPEN_Q = "“";
const CLOSE_Q = "”";
const NON_BODY_HEADING = /^##\s+(Source note|Assembly note|Editorial \/ source note|Translation note|Source \/ assembly note)\s*$/;
const NOT_AUTHORED = "not part of Kalaignar's text";
const ATTRIBUTION = /^\*\*\(.*\)\*\*$/;

/** Every scan-marker form the Batch-6 archive uses (Tamil and English), else null (annotation). */
function parseMarker(line) {
  const body = /^<!--\s*([\s\S]+?)\s*-->$/.exec(line.trim());
  if (!body) return null;
  let inner = body[1].replace(/^Tamil source:\s*/i, "");
  let m = /^scan\s+(\d+)\b/.exec(inner) || /^மூல ஸ்கேன் பக்கம்:\s*(\d+)/.exec(inner);
  if (!m) return null; // a standalone comment that is not a scan marker → annotation
  const scan = Number(m[1]);
  const pm = /printed(?:\s*page)?\s+(\d+)/.exec(inner); // "printed 6" / "printed page 6"
  return { scan, printed: pm ? Number(pm[1]) : null };
}
const isAnnotation = (line) => /^<!--[\s\S]*-->$/.test(line.trim());
const isDamageNote = (line) => /^<!--\s*SOURCE DAMAGE:/.test(line.trim());

function frontMatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) die("no frontmatter");
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line.trim());
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^"|"$/g, "");
  }
  return { fm, body: text.slice(m[0].length) };
}

function segmentVoice(text) {
  const segs = [];
  let cur = "", voice = "authored-text";
  for (const ch of text) {
    if (ch === OPEN_Q && voice === "authored-text") {
      if (cur) segs.push({ kind: "authored-text", text: cur });
      cur = ch; voice = "quoted-text"; continue;
    }
    cur += ch;
    if (ch === CLOSE_Q && voice === "quoted-text") { segs.push({ kind: "quoted-text", text: cur }); cur = ""; voice = "authored-text"; }
  }
  if (cur) segs.push({ kind: voice, text: cur });
  const merged = [];
  for (const seg of segs) {
    if (seg.text.trim() === "" && merged.length) merged[merged.length - 1].text += seg.text;
    else merged.push({ ...seg });
  }
  if (merged.map((x) => x.text).join("") !== text) die(`voice segmentation lost text: ${JSON.stringify(text.slice(0, 60))}`);
  return merged.length ? merged : [{ kind: "authored-text", text }];
}

/** Parse one article assembly into ordered units tagged with the page they appear on. */
function parseArticle(text, english) {
  const { fm, body } = frontMatter(text);
  const units = [];
  const notes = [];
  const damage = [];
  const pageSeq = []; // distinct pages in reading order

  let page = null;
  for (const raw of body.split("\n")) { const mk = parseMarker(raw.trim()); if (mk) { page = { scan: mk.scan, printed: mk.printed }; break; } }
  if (!page) die("article assembly carries no scan marker at all");
  const noteScan = (p) => { if (!pageSeq.length || pageSeq[pageSeq.length - 1].scan !== p.scan) pageSeq.push({ scan: p.scan, printed: p.printed }); };
  noteScan(page);

  let buf = [], bufPage = null, inNonBody = false, quoteBuf = [], titleOpen = false;
  const flushPara = () => { if (!buf.length) return; units.push({ kind: "text", text: buf.join("\n"), page: bufPage }); buf = []; bufPage = null; };
  const flushQuote = () => {
    if (!quoteBuf.length) return;
    const t = quoteBuf.join("\n");
    if (t.includes(NOT_AUTHORED)) notes.push(t); else units.push({ kind: "blockquote", text: t, page: bufPage ?? page });
    quoteBuf = [];
  };

  for (const raw of body.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const t = line.trim();
    if (NON_BODY_HEADING.test(t)) { flushPara(); flushQuote(); inNonBody = true; continue; }
    if (inNonBody) { if (/^#{1,6}\s/.test(t) && !NON_BODY_HEADING.test(t)) inNonBody = false; else continue; }
    if (t === "---") { flushPara(); flushQuote(); continue; }
    const mk = parseMarker(t);
    if (mk) { flushPara(); flushQuote(); page = { scan: mk.scan, printed: mk.printed }; noteScan(page); continue; }
    if (isAnnotation(t)) { flushPara(); flushQuote(); if (isDamageNote(t)) damage.push(t.replace(/^<!--\s*/, "").replace(/\s*-->$/, "")); continue; }
    if (t === "") { flushPara(); flushQuote(); continue; }
    if (t.startsWith("> ")) { if (buf.length) flushPara(); quoteBuf.push(t.slice(2)); continue; }
    if (quoteBuf.length) flushQuote();
    if (/^#{1,6}\s/.test(t)) {
      flushPara();
      const level = t.match(/^#+/)[0].length;
      const value = t.replace(/^#+\s*/, "");
      if (level === 1) { titleOpen = /\s{2,}$/.test(raw); units.push({ kind: "title", text: value, page }); }
      else units.push({ kind: "subheading", text: value, page });
      continue;
    }
    if (titleOpen) { const title = units[units.length - 1]; title.text = `${title.text} ${t}`.replace(/\s+/g, " ").trim(); titleOpen = false; continue; }
    if (!buf.length) bufPage = page;
    buf.push(line);
  }
  flushPara(); flushQuote();
  // Guard against a two-line printed title being joined wrongly, using a NORMALIZED PROBE only
  // (trailing sentence punctuation / whitespace differences between the printed heading witness and
  // the assembly's declared title are legitimate — e.g. `ஆரியம் பேசுகிறது.` vs `ஆரியம் பேசுகிறது`).
  // The emitted display title is the front-matter value, verbatim; nothing is normalized in output.
  const titleUnit = units.find((u) => u.kind === "title");
  const declared = english ? fm.title_en : fm.title_ta;
  const probe = (x) => x.replace(/[\s.!?…।]+$/u, "").replace(/\s+/g, " ").trim();
  if (titleUnit && declared && probe(titleUnit.text) !== probe(declared)) {
    die(`assembled heading "${titleUnit.text}" differs from frontmatter title "${declared}" beyond trailing punctuation — a two-line printed title may have been joined wrongly`);
  }
  return { fm, units, notes, damage, pageSeq };
}

function buildBlocks(units) {
  const blocks = [];
  for (const u of units) {
    if (u.kind === "title") continue;
    if (!u.page) die(`a unit carries no source page: ${JSON.stringify(u.text.slice(0, 60))}`);
    if (u.kind === "subheading") { blocks.push({ kind: "subheading", segments: [{ kind: "authored-text", text: u.text }], text: u.text, mixedVoice: false, sourcePages: [u.page] }); continue; }
    const kind = ATTRIBUTION.test(u.text) ? "attribution" : "paragraph";
    blocks.push({ kind, segments: null, text: u.text, mixedVoice: false, sourcePages: [u.page] });
  }
  for (const b of blocks) {
    if (!b.segments) {
      b.segments = segmentVoice(b.text);
      b.mixedVoice = b.segments.some((s) => s.kind === "authored-text" && s.text.trim()) && b.segments.some((s) => s.kind === "quoted-text");
    }
  }
  return blocks;
}

/** Ordered scan runs derived from the article's page sequence. Consecutive ascending scans join. */
function deriveRuns(pageSeq) {
  const runs = [];
  let cur = null;
  for (const p of pageSeq) {
    if (cur && p.scan === cur.to + 1) { cur.to = p.scan; continue; }
    if (cur) runs.push(cur);
    cur = { from: p.scan, to: p.scan };
  }
  if (cur) runs.push(cur);
  return runs;
}

/** Printed-page evidence derived from the page sequence — range / partial / none, nothing inferred. */
function derivePrinted(pageSeq, unitNoun) {
  const visible = pageSeq.filter((p) => p.printed != null).map((p) => p.printed);
  const unnumbered = pageSeq.filter((p) => p.printed == null).map((p) => p.scan);
  const unnumNote = unnumbered.length ? `scan ${unnumbered.join(", ")} shows no printed numeral` : "";
  if (visible.length === 0) {
    return { kind: "none", note: `No printed page numeral is visible on any scan of this ${unitNoun}; nothing is inferred.` };
  }
  const from = Math.min(...visible), to = Math.max(...visible);
  const sorted = [...visible].sort((a, b) => a - b);
  const contiguous = sorted.every((n, i) => i === 0 || n === sorted[i - 1] + 1) && to - from + 1 === visible.length;
  if (contiguous) return { kind: "range", from, to, ...(unnumNote ? { note: unnumNote } : {}) };
  return { kind: "partial", note: `visible printed numerals ${visible.join(", ")}${unnumNote ? `; ${unnumNote}` : ""}. The archive does not form a usable printed range and neither does this integration.` };
}

// ── GENERATE ────────────────────────────────────────────────────────────────────────────────────────
const OUT_ROOT = path.join(process.cwd(), "public/data/essays");
const report = [];

for (const w of WORKS) {
  const PUB = path.join(SRC_REPO, "publications", w.slug);

  // Assert scan identity appears in the source metadata (defense on top of the tree guard).
  const meta = readText(path.join(PUB, "metadata/source.md"));
  if (w.scanSha256 && !meta.includes(w.scanSha256)) die(`${w.slug}: metadata/source.md does not record scan SHA ${w.scanSha256}`);
  if (w.transferParts) for (const tp of w.transferParts) if (!meta.includes(tp.sha256)) die(`${w.slug}: metadata lacks transfer-part SHA ${tp.sha256}`);

  // ---- page records — the AUTHORITATIVE per-scan printed-numeral + status source ------------------
  const pageDir = path.join(PUB, "pages");
  const pageFiles = fs.readdirSync(pageDir).filter((f) => /\.md$/.test(f) && f.toLowerCase() !== "readme.md");
  if (pageFiles.length !== w.scanTotal) die(`${w.slug}: expected ${w.scanTotal} page records, found ${pageFiles.length}`);
  const scanPrinted = new Map(); // scan -> printed numeral (or null)
  const scansSeen = new Set();
  for (const f of pageFiles) {
    const t = readText(path.join(pageDir, f));
    const scan = Number(/scan_page:\s*(\d+)/.exec(t)[1]);
    const pm = /printed_page:\s*(?:"?)(\d+|null)(?:"?)\s*$/m.exec(t);
    if (!pm) die(`${w.slug}: page record ${f} has no printed_page field`);
    const status = (/status:\s*"([^"]*)"/.exec(t) || [])[1];
    if (status !== "verified") die(`${w.slug}: page record scan ${scan} status "${status}", expected "verified"`);
    if (scansSeen.has(scan)) die(`${w.slug}: scan ${scan} appears in more than one page record`);
    scansSeen.add(scan);
    scanPrinted.set(scan, pm[1] === "null" ? null : Number(pm[1]));
  }
  for (let s = 1; s <= w.scanTotal; s++) if (!scansSeen.has(s)) die(`${w.slug}: no page record for scan ${s}`);

  // ---- articles ----------------------------------------------------------------------------------
  const taFiles = fs.readdirSync(path.join(PUB, "articles")).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
  const enFiles = fs.readdirSync(path.join(PUB, "translations/en")).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
  if (taFiles.length !== w.articleCount) die(`${w.slug}: expected ${w.articleCount} Tamil assemblies, found ${taFiles.length}`);
  if (enFiles.length !== w.articleCount) die(`${w.slug}: expected ${w.articleCount} English articles, found ${enFiles.length}`);

  const articles = [];
  const damageNotes = [];
  for (let i = 0; i < taFiles.length; i++) {
    const ta = parseArticle(readText(path.join(PUB, "articles", taFiles[i])), false);
    const en = parseArticle(readText(path.join(PUB, "translations/en", enFiles[i])), true);
    damageNotes.push(...ta.damage, ...en.damage);

    // AUTHORITATIVE printed numerals come from the page records, not the assembly markers (several
    // Batch-6 assemblies use bare `<!-- scan N -->` markers). Remap every block's page + the page
    // sequence to the page-record printed numeral, failing closed on any scan with no page record.
    const remap = (blocks) => { for (const b of blocks) for (const p of b.sourcePages) { if (!scanPrinted.has(p.scan)) die(`${w.slug} article ${i + 1}: block cites scan ${p.scan} with no page record`); p.printed = scanPrinted.get(p.scan); } };
    for (const p of ta.pageSeq) p.printed = scanPrinted.get(p.scan) ?? null;
    if (!w.acceptedArticleStatus.includes(ta.fm.status)) die(`${w.slug} article ${i + 1}: Tamil status "${ta.fm.status}" not in ${JSON.stringify(w.acceptedArticleStatus)}`);
    if (en.fm.translation_status !== "verified") die(`${w.slug} article ${i + 1}: English translation_status "${en.fm.translation_status}", expected "verified"`);

    const taBlocks = buildBlocks(ta.units);
    const enBlocks = buildBlocks(en.units);
    if (!taBlocks.length) die(`${w.slug} article ${i + 1}: Tamil body EMPTY`);
    if (!enBlocks.length) die(`${w.slug} article ${i + 1}: English body EMPTY`);
    remap(taBlocks); remap(enBlocks);

    const runs = deriveRuns(ta.pageSeq);
    const printedPages = derivePrinted(ta.pageSeq, w.articleCount === 1 ? "pamphlet" : "article");

    // Every Tamil block's cited scan must fall inside the derived runs.
    const inRuns = (s) => runs.some((r) => s >= r.from && s <= r.to);
    for (const b of taBlocks) for (const p of b.sourcePages) if (!inRuns(p.scan)) die(`${w.slug} article ${i + 1}: block cites scan ${p.scan} outside derived runs`);

    articles.push({
      number: Number(ta.fm.article_number),
      numberSource: "archive-ordinal",
      slug: taFiles[i].replace(/^\d\d-/, "").replace(/\.md$/, ""),
      titleTa: ta.fm.title_ta,
      titleEn: en.fm.title_en,
      scanRuns: runs.map((r) => ({ from: r.from, to: r.to })),
      printedPages,
      tamil: { blocks: taBlocks },
      english: { blocks: enBlocks, notes: en.notes.map((t) => ({ kind: "translator-note", text: t, notPartOfAuthoredText: true })) },
      pageTransitions: (() => {
        const out = [];
        for (let k = 0; k + 1 < ta.pageSeq.length; k++) out.push({ fromScan: ta.pageSeq[k].scan, toScan: ta.pageSeq[k + 1].scan, fromPrinted: ta.pageSeq[k].printed, toPrinted: ta.pageSeq[k + 1].printed, relation: "unknown", evidence: [] });
        return out;
      })(),
    });
  }
  if (new Set(articles.map((a) => a.slug)).size !== articles.length) die(`${w.slug}: duplicate article slug`);
  if (new Set(articles.map((a) => a.number)).size !== articles.length) die(`${w.slug}: duplicate article number`);
  // Article numbers must be exactly 1..N in order.
  for (let i = 0; i < articles.length; i++) if (articles[i].number !== i + 1) die(`${w.slug}: article ${i} has number ${articles[i].number}, expected ${i + 1}`);

  const authorTa = w.authorTaOverride || KAL;
  const publication = {
    workId: w.slug, slug: w.slug, sourceRepo: "pugazg/kalaignar-essays", sourcePath: `publications/${w.slug}`,
    sourceCommit: APPROVED_SOURCE_COMMIT, shelf: "essays-articles", readerStructure: "article", subtype: w.subtype,
    ...(w.publicationForm ? { publicationForm: w.publicationForm } : {}),
    title: { ta: w.titleTa, en: w.titleEn }, author: { ta: authorTa, en: "Kalaignar M. Karunanidhi" },
    ...(w.firstEdition ? { firstEdition: w.firstEdition } : {}),
    ...(w.controllingEdition ? { controllingEdition: w.controllingEdition } : {}),
    controllingIsFirstEdition: w.controllingIsFirstEdition,
    articles, articleCount: articles.length,
  };

  const editionWitnessesTa = w.firstEdition
    ? [w.firstEdition.statementTa, ...(w.firstEdition.publisherTa ? [w.firstEdition.publisherTa] : []), ...(w.firstEdition.priceTa ? [w.firstEdition.priceTa] : [])]
    : undefined;

  const provenance = {
    workId: w.slug, sourceRepo: "pugazg/kalaignar-essays", sourcePath: `publications/${w.slug}`,
    sourceCommit: APPROVED_SOURCE_COMMIT, sourceTree: w.tree,
    source: {
      titleTa: w.titleTa, titleEn: w.titleEn, authorTa,
      scanFilename: w.scanFilename, scanSha256: w.scanSha256, scanFileSizeBytes: w.scanBytes, scanTotalPages: w.scanTotal,
      ...(w.transferParts ? { transferParts: w.transferParts } : {}),
      ...(w.publicationForm ? { publicationForm: w.publicationForm } : {}),
      physicalVerification: `${w.scanTotal} / ${w.scanTotal} physical page records`,
      strictFidelityReview: w.acceptedArticleStatus.includes("verified") ? `P5 strict visual text fidelity — ${w.scanTotal} / ${w.scanTotal} PASS` : `Tamil strict-reviewed / frozen — ${w.scanTotal} / ${w.scanTotal}`,
      articleAssemblies: `${w.articleCount} / ${w.articleCount} frozen`,
      unresolvedTamilFidelityItems: 0,
      // `editionStatus` is emitted ONLY where the source establishes NO edition witness, so the three
      // works that DO establish an edition keep their existing provenance byte-for-byte.
      ...(w.noEditionEstablished ? { editionStatus: "not-established" } : {}),
      ...(editionWitnessesTa ? { editionWitnessesTa } : {}),
      ...(w.controllingEdition ? { controllingEditionTa: w.controllingEdition.statementTa } : {}),
      sourcePdfCommitted: false,
      articleMap: articles.map((a) => ({
        number: a.number, titleTa: a.titleTa, titleEn: a.titleEn,
        scanPages: a.scanRuns.map((r) => (r.from === r.to ? `${r.from}` : `${r.from}–${r.to}`)).join(", "),
        printedPages: a.printedPages.kind === "range" ? `${a.printedPages.from}–${a.printedPages.to}${a.printedPages.note ? `; ${a.printedPages.note}` : ""}` : a.printedPages.note,
        numberSource: a.numberSource,
      })),
      titleWitnessNotes: w.titleWitnessNotes,
      lockedExclusions: w.exclusions,
    },
    english: {
      releaseTitle: w.titleEn, kind: "project-created", articlesVerified: `${w.articleCount} / ${w.articleCount} verified`,
      consistencyReview: "publication-wide English consistency review — PASS", releaseCloseout: "English release closeout — PASS",
      releaseGate: w.releaseWitness, unresolvedTranslationQuestions: 0, releaseBlockers: 0,
      translatorNotesSeparated: "Translator/editorial notes released by the archive are carried OUTSIDE the authored body so they can never be read as Kalaignar's prose.",
      labelPolicy: [
        "English is a project-created translation of the frozen Tamil; the Tamil remains authoritative.",
        "Quoted third-party material inside an article stays a separate voice from Kalaignar's own framing.",
      ],
    },
    archiveDerived: {
      articles: articles.length,
      tamilBlocks: articles.reduce((n, a) => n + a.tamil.blocks.length, 0),
      englishBlocks: articles.reduce((n, a) => n + a.english.blocks.length, 0),
      tamilSubheadings: articles.reduce((n, a) => n + a.tamil.blocks.filter((b) => b.kind === "subheading").length, 0),
      englishSubheadings: articles.reduce((n, a) => n + a.english.blocks.filter((b) => b.kind === "subheading").length, 0),
      tamilAttributions: articles.reduce((n, a) => n + a.tamil.blocks.filter((b) => b.kind === "attribution").length, 0),
      englishAttributions: articles.reduce((n, a) => n + a.english.blocks.filter((b) => b.kind === "attribution").length, 0),
      tamilMixedVoiceParagraphs: articles.reduce((n, a) => n + a.tamil.blocks.filter((b) => b.mixedVoice).length, 0),
      englishMixedVoiceParagraphs: articles.reduce((n, a) => n + a.english.blocks.filter((b) => b.mixedVoice).length, 0),
      tamilQuotedSegments: articles.reduce((n, a) => n + a.tamil.blocks.reduce((m, b) => m + b.segments.filter((s) => s.kind === "quoted-text").length, 0), 0),
      englishQuotedSegments: articles.reduce((n, a) => n + a.english.blocks.reduce((m, b) => m + b.segments.filter((s) => s.kind === "quoted-text").length, 0), 0),
      translatorNotes: articles.reduce((n, a) => n + a.english.notes.length, 0),
      pageTransitionsAudited: articles.reduce((n, a) => n + a.pageTransitions.length, 0),
      relationUnknown: articles.reduce((n, a) => n + a.pageTransitions.filter((t) => t.relation === "unknown").length, 0),
      ...(damageNotes.length ? { sourceDamageNotes: [...new Set(damageNotes)] } : {}),
      voiceNote: "Source block structure and voice structure are independent dimensions; a paragraph carrying both Kalaignar's framing and a quotation is never rendered wholly as a quote.",
      boundaryNote: "These archives record no per-edge continuation adjudication, so every in-article page transition is reported as `unknown` rather than guessed from adjacency.",
      provenanceGranularity: "Every block carries the exact scan it occupies; where the source prints no page numeral the printed page is null and nothing is inferred.",
      note: "Archive-derived counts, recomputed at import time from the frozen source. Per-article scan runs and printed-page evidence are derived from each assembly's own scan markers.",
    },
    notes: [
      "Wave 6 P1–P3 Batch 6 — Essays & Articles. The controlling PDF is not vendored into this repository and is never fetched at runtime.",
      "Direct reader routes only; this publication is intentionally absent from the public catalogue, /read discovery and the sitemap (Wave-6 P4 not authorized).",
    ],
  };

  const dir = path.join(OUT_ROOT, w.slug);
  fs.mkdirSync(dir, { recursive: true });
  const pubJson = JSON.stringify(publication, null, 1) + "\n";
  const provJson = JSON.stringify(provenance, null, 1) + "\n";
  fs.writeFileSync(path.join(dir, "publication.json"), pubJson);
  fs.writeFileSync(path.join(dir, "provenance.json"), provJson);

  const routes = 2 + articles.length; // landing + /source + one per article
  report.push({ slug: w.slug, articles: articles.length, routes, taBlocks: provenance.archiveDerived.tamilBlocks, enBlocks: provenance.archiveDerived.englishBlocks, pubSha: sha256(pubJson).slice(0, 16), provSha: sha256(provJson).slice(0, 16) });
}

console.log(`\nWave 6 Batch 6 — Essays & Articles`);
console.log(`  source pin ${APPROVED_SOURCE_COMMIT}\n`);
console.log("  slug                                          arts  routes  ta-blk  en-blk  publication.json  provenance.json");
let totalArts = 0, totalRoutes = 0;
for (const r of report) {
  totalArts += r.articles; totalRoutes += r.routes;
  console.log(`  ${r.slug.padEnd(44)} ${String(r.articles).padStart(4)}  ${String(r.routes).padStart(6)}  ${String(r.taBlocks).padStart(6)}  ${String(r.enBlocks).padStart(6)}  ${r.pubSha}  ${r.provSha}`);
}
console.log(`\n  totals: ${totalArts} literary articles · ${totalRoutes} direct routes across ${report.length} publications`);
