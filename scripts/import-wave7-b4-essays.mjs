// Wave 7 Batch 4 (P1, HIDDEN) — Essays & Articles. SIX publications from pugazg/kalaignar-essays.
//
//   node scripts/import-wave7-b4-essays.mjs <kalaignar-essays-clone> [source-commit]
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
const SRC_COMMIT = process.argv[3] || "b5fd2922898a56a8b6a75bf564bdfa91cd22869a"; // default to the Wave-7 P0 essay pin
if (!SRC_REPO) {
  console.error("usage: node scripts/import-wave7-b4-essays.mjs <kalaignar-essays-clone> [source-commit]");
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
const APPROVED_SOURCE_COMMIT = "b5fd2922898a56a8b6a75bf564bdfa91cd22869a"; // Wave-7 P0 essay pin
let head;
try { head = git("rev-parse", "HEAD"); } catch (e) { die(`unable to read git HEAD of ${SRC_REPO}: ${e.message}`); }
if (SRC_COMMIT !== APPROVED_SOURCE_COMMIT) die(`supplied source commit ${SRC_COMMIT} is not the approved pin ${APPROVED_SOURCE_COMMIT}.`);
if (head !== APPROVED_SOURCE_COMMIT) die(`${SRC_REPO} is at ${head}, not the approved pin ${APPROVED_SOURCE_COMMIT}.`);

const KAL = "கலைஞர் மு. கருணாநிதி";

// ── THE AUTHORIZED BATCH — EXACTLY FIVE ─────────────────────────────────────────────────────────────
const WORKS = [
  {
    slug: "aaru-maatha-kadungkaaval", tree: "ce8c98a509d636adf60c724cf5a38ad0331c2274",
    titleTa: "ஆறுமாதக் கடுங்காவல்", titleEn: "Six Months of Rigorous Imprisonment", subtype: "essay-collection",
    scanFilename: "TVA_BOK_0064140_ஆறுமாதக்_கடுங்காவல்.pdf", scanSha256: "8d4b227547144dd16a78d3f7e22edc3d955d754788ba96317c0c6ddd68d0ca69",
    scanBytes: 282020019, scanTotal: 224, acceptedArticleStatus: ["verified"], articleCount: 3,
    firstEdition: { statementTa: "முதல் பதிப்பு, 1953", year: 1953, publisherTa: "திராவிடப் பண்ணை" },
    controllingIsFirstEdition: true,
    exclusions: ["cover / title-page / front-matter scans excluded from the prose", "back-cover / publisher-device scan excluded"],
    titleWitnessNotes: ["Article ordinals are archive reading ordinals, not printed article numbers."],
    releaseWitness: "P4 source audit / P3 article assembly review — RELEASE-READY; Tamil verified; English verified.",
  },
  {
    slug: "thudikkum-ilamai", tree: "b37c084977aca26a16cece1ce8f838084bbc3db6",
    titleTa: "துடிக்கும் இளமை", titleEn: "Restless Youth", subtype: "essay-collection",
    scanFilename: "TVA_BOK_0063985_துடிக்கும்_இளமை.pdf", scanSha256: "309042a481db1d198d331b1c16f11ea7acce5ad0cc4ab78ee53c2a702e0ecb11",
    scanBytes: 50703452, scanTotal: 33, acceptedArticleStatus: ["strict-reviewed"], articleCount: 4,
    firstEdition: { statementTa: "முதற் பதிப்பு", year: null },
    controllingIsFirstEdition: true,
    exclusions: ["cover / front-matter scans excluded from the prose", "library / ownership / bookseller stamps are not merged into the literary text"],
    titleWitnessNotes: ["Article ordinals are archive reading ordinals, not printed article numbers."],
    releaseWitness: "Publication assembly/review — RELEASE-READY; Tamil strict-reviewed; English verified.",
  },
  {
    slug: "perumoochu", tree: "7e39cc529e104c6d3491db6f475eb94e0a52062c",
    titleTa: "பெருமூச்சு", titleEn: "The Deep Sigh", subtype: "essay-collection",
    scanFilename: "TVA_BOK_0064124_பெருமூச்சு.pdf", scanSha256: "18947f2deb1ece71b03b59c1e52d9f483a45baa5bf436ab2c3e89a48b5f2dc38",
    scanBytes: 122052025, scanTotal: 83, acceptedArticleStatus: ["strict-reviewed"], articleCount: 13,
    firstEdition: { statementTa: "முதற் பதிப்பு—'52", year: 1952 },
    controllingEdition: { statementTa: "இரண்டாம் பதிப்பு—'53", year: 1953 },
    controllingIsFirstEdition: false,
    exclusions: ["cover / front-matter scans excluded from the prose", "advertisement / catalogue scans excluded"],
    titleWitnessNotes: ["Both the first-edition ('52) and second-edition ('53) statements are printed in the scan and are preserved verbatim; neither is merged into the other."],
    releaseWitness: "Publication assembly/review — RELEASE-READY; Tamil strict-reviewed; English verified.",
  },
  {
    slug: "viduthalai-kilarcci", tree: "763ff9e6d58ac9c7f16d232baa169571b5f62ef7",
    titleTa: "விடுதலைக் கிளர்ச்சி", titleEn: "The Freedom Uprising", subtype: "essay-collection",
    scanFilename: "TVA_BOK_0064066_விடுதலைக்கிளர்ச்சி.pdf", scanSha256: "444ff76695154b5ee9d53f4647873fde72659a3d52a76aa833fdc502fb518809",
    scanBytes: 101127153, scanTotal: 69, acceptedArticleStatus: ["strict-reviewed"], articleCount: 2,
    firstEdition: { statementTa: null, year: null },
    controllingEdition: { statementTa: "இரண்டாம் பதிப்பு—1953", year: 1953 },
    controllingIsFirstEdition: false,
    exclusions: ["cover / preliminary-verse / front-matter scans excluded from the prose", "printed marginal folios recorded only where visible; null where none is printed"],
    titleWitnessNotes: ["The controlling scan prints the second-edition (1953) statement; no first-edition statement is printed and none is invented."],
    releaseWitness: "Publication assembly/review — RELEASE-READY; Tamil strict-reviewed; English verified.",
  },
  {
    slug: "meesai-mulaiththa-vayathil", tree: "45deb93933b961b72e80f0fad61072441aad7075",
    titleTa: "மீசை முளைத்த வயதில்", titleEn: "At the Age the Moustache Sprouted", subtype: "essay-collection",
    scanFilename: "TVA_BOK_0065746_மீசை_முளைத்த_வயதில்.pdf", scanSha256: "9054aa8ed82c68050b82ffe57d772c32fdcad0605f72d7983de490162669527d",
    scanBytes: 374123900, scanTotal: 146, acceptedArticleStatus: ["source-complete"], articleCount: 26,
    firstEdition: { statementTa: "முதற் பதிப்பு: 3.6.2002", year: 2002 },
    controllingEdition: { statementTa: "இரண்டாம் பதிப்பு: அக்டோபர் 2006", monthTa: "அக்டோபர்", year: 2006, publisherTa: "தமிழ்க்கனி பதிப்பகம்", priceTa: "ரூ.70/-" },
    controllingIsFirstEdition: false,
    exclusions: ["cover / front-matter scans excluded from the prose", "back-cover / promotional witness excluded"],
    titleWitnessNotes: ["The controlling scan is the second edition (October 2006); the first-edition witness (3.6.2002) is a distinct printed fact and the two are never merged."],
    releaseWitness: "P3 26/26 assemblies, 128/128 main-work pages — source-complete; English verified.",
  },
  {
    slug: "pesum-kalai-valarppom", tree: "976d88a074945dd7e6000c441a4e0d6c994590cc",
    // The supplied witness prints NO contents page; the source shows numbered section openings 1–19 with no
    // descriptive titles (indexes/contents.md). Model these as source-visible numbered SECTIONS, not archive
    // reading ordinals and not descriptively-titled articles.
    numberModel: "source-section",
    titleTa: "பேசும் கலை வளர்ப்போம்", titleEn: "Let Us Cultivate the Art of Speaking", subtype: "essay-collection",
    scanFilename: "TVA_BOK_0063826_பேசும்கலை_வளர்ப்போம்.pdf", scanSha256: "73972aca1b615a7cbe9d5fe4361d2312b9d4e47f9ee022b2450572807c88bbf7",
    scanBytes: 105698402, scanTotal: 82, acceptedArticleStatus: ["source-complete"], articleCount: 19,
    firstEdition: { statementTa: null, year: null },
    controllingEdition: { statementTa: "எட்டாம் பதிப்பு — செப்டம்பர் 1996", monthTa: "செப்டம்பர்", year: 1996 },
    controllingIsFirstEdition: false,
    exclusions: ["cover / front-matter / suppressed-folio scans excluded from the prose"],
    titleWitnessNotes: ["The supplied controlling scan is the eighth edition (செப்டம்பர் 1996); a பதிப்புரை dated 15-7-81 is a distinct printed witness. No first-edition statement is invented."],
    releaseWitness: "Publication assembly/review — source-complete; English verified.",
  },
];

// ── PER-WORK TREE GUARDS + not-in-batch guards ─────────────────────────────────────────────────────
for (const w of WORKS) {
  const live = git("rev-parse", `${APPROVED_SOURCE_COMMIT}:publications/${w.slug}`);
  if (live !== w.tree) die(`source tree drift for ${w.slug}: archive has ${live}, this batch was frozen at ${w.tree}`);
}
// Essays publications that are NOT in the Wave-7 Batch-4 cohort (already-published Wave-6/earlier works and
// other publications in the archive). Guards against accidentally onboarding a non-cohort publication here.
const NOT_IN_BATCH = ["ina-muzhakkam", "kolaikkalam", "kudumbaththin-nalvilakku", "sinthanaiyum-seyalum", "vedhanai-ch-siraiyinindrum-viduthalai-pera", "sakkaravarththiyin-thirumagan", "kayittril-thongiya-kanapathi", "unarchchimaalai", "thiraavida-sampaththu"];
for (const s of NOT_IN_BATCH) if (WORKS.some((w) => w.slug === s)) die(`${s} is NOT a Wave-7 Batch-4 work`);
if (WORKS.length !== 6) die(`the authorized batch is exactly 6 publications; got ${WORKS.length}`);

// ── SHARED PARSING CORE ─────────────────────────────────────────────────────────────────────────────
const OPEN_Q = "“";
const CLOSE_Q = "”";
// Non-body headings: editorial/source notes AND the archive's own project-audit sections (assembly
// provenance + the P-phase audit/revalidation trailers). These are archive/project metadata, never
// Kalaignar's authored text, and always appear as an end-of-file trailer after the literary body. Matching
// them here keeps them out of the public reading body. The forms are English project vocab and can never
// collide with a Tamil literary heading.
const NON_BODY_HEADING = /^##\s+(Source note|Assembly note|Editorial \/ source note|Translation note|Source \/ assembly note|Assembly provenance|P\d+ assembly audit|P\d+ strict visual review|P\d+ strict visual[- ]fidelity revalidation)\s*$/;
const NOT_AUTHORED = "not part of Kalaignar's text";
const ATTRIBUTION = /^\*\*\(.*\)\*\*$/;

/** Every scan-marker form the Batch-6 archive uses (Tamil and English), else null (annotation). */
function parseMarker(line) {
  const body = /^<!--\s*([\s\S]+?)\s*-->$/.exec(line.trim());
  if (!body) return null;
  let inner = body[1].replace(/^Tamil source:\s*/i, "");
  // Scan-marker forms the archive uses, Tamil and English: `scan 6`, `scan: 6`, `source scan: 6`,
  // `மூல ஸ்கேன் பக்கம்: 6`. The `source scan:` / colon form is used by pesum-kalai-valarppom and
  // meesai-mulaiththa-vayathil; without it their markers were misread as plain comments (annotations),
  // collapsing each section's recorded coverage to a single scan. Anything else is a comment → annotation.
  let m = /^(?:source\s+)?scan:?\s+(\d+)\b/.exec(inner) || /^மூல ஸ்கேன் பக்கம்:\s*(\d+)/.exec(inner);
  if (!m) return null; // a standalone comment that is not a scan marker → annotation
  const scan = Number(m[1]);
  const pm = /printed(?:\s*page)?:?\s+(\d+)/.exec(inner); // "printed 6" / "printed page 6" / "printed page: 6"
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
  // Some publications (e.g. thudikkum-ilamai, viduthalai-kilarcci) carry NO inline scan markers — their
  // scan provenance is declared at ARTICLE LEVEL in the front matter (`source_scans` / `scan_pages`, e.g.
  // "5-12"). Seed from the FULL declared span (not just its first scan), so the recorded coverage is the
  // whole article, not a single page. Inline markers are provenance only; the reading text is parsed from
  // the body verbatim either way, so this changes no literary byte.
  if (!page) {
    const rangeStr = String(fm.source_scans || fm.scan_pages || "").replace(/^"|"$/g, "");
    const rm = /(\d+)/.exec(rangeStr);
    if (rm) page = { scan: Number(rm[1]), printed: null, fromFrontMatterRange: rangeStr };
  }
  if (!page) die("article assembly carries no scan marker and no front-matter source_scans/scan_pages range");
  const noteScan = (p) => { if (!pageSeq.length || pageSeq[pageSeq.length - 1].scan !== p.scan) pageSeq.push({ scan: p.scan, printed: p.printed }); };
  noteScan(page);
  // NOTE: the full declared span is unioned into pageSeq after the parse loop below (see the coverage
  // block), which covers both no-marker articles and articles whose markers are mid-paragraph.

  let buf = [], bufPage = null, bufPages = [], inNonBody = false, quoteBuf = [], titleOpen = false;
  // Every source page a paragraph occupies, in reading order (a paragraph can straddle a physical page
  // boundary — see consumeInline). The block emitted for the paragraph records ALL of them.
  const pushBufPage = (p) => { if (!bufPages.length || bufPages[bufPages.length - 1].scan !== p.scan) bufPages.push({ scan: p.scan, printed: p.printed }); };
  const flushPara = () => { if (!buf.length) return; units.push({ kind: "text", text: buf.join("\n"), page: bufPage, pages: bufPages.length ? bufPages : [bufPage] }); buf = []; bufPage = null; bufPages = []; };
  const flushQuote = () => {
    if (!quoteBuf.length) return;
    const t = quoteBuf.join("\n");
    if (t.includes(NOT_AUTHORED)) notes.push(t); else units.push({ kind: "blockquote", text: t, page: bufPage ?? page });
    quoteBuf = [];
  };
  // Consume every INLINE HTML comment inside a source line. A scan marker (`<!-- scan N -->`,
  // `<!-- source scan: N / printed page: M -->`, `<!-- Tamil source: scan N / printed M -->`, the Tamil
  // form, …) advances the active source page and is recorded via onPage; a SOURCE DAMAGE note is routed to
  // the damage channel; any other project/editorial comment is dropped. In every case the comment SYNTAX
  // is removed from the emitted literary text, joining the surrounding characters EXACTLY — a boundary
  // marker embedded inside a word rejoins the word (`பிரச்<!-- scan 9 -->சினை` → `பிரச்சினை`). Returns the
  // cleaned literary text; never leaves `<!--`/`-->` in the reading copy.
  const consumeInline = (text, onPage) => {
    const re = /<!--[\s\S]*?-->/g;
    let out = "", last = 0, m;
    while ((m = re.exec(text)) !== null) {
      out += text.slice(last, m.index);
      last = m.index + m[0].length;
      const mk = parseMarker(m[0]);
      if (mk) { page = { scan: mk.scan, printed: mk.printed }; noteScan(page); onPage(page); }
      else if (isDamageNote(m[0])) damage.push(m[0].replace(/^<!--\s*/, "").replace(/\s*-->$/, ""));
      // else: a non-scan project/editorial comment → dropped from the literary text
    }
    return out + text.slice(last);
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
    if (t.startsWith("> ")) { if (buf.length) flushPara(); quoteBuf.push(consumeInline(t.slice(2), () => {})); continue; }
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
    // Paragraph body. Seed the paragraph's page list with the page active at its start, then consume any
    // inline markers (which advance the page mid-paragraph and extend the list). The comment syntax is
    // stripped from the emitted text; the block will record every contributing source page.
    if (!buf.length) { bufPage = page; bufPages = [{ scan: page.scan, printed: page.printed }]; }
    buf.push(consumeInline(line, pushBufPage));
  }
  flushPara(); flushQuote();
  // Authoritative COVERAGE = the front-matter declared span. Some assemblies place their `<!-- scan N -->`
  // markers MID-PARAGRAPH (embedded in a line, not on their own line), so the line-level marker scan does
  // not observe every page — which would leave a section's recorded span disjoint (e.g. [7,7],[12,12]).
  // The article/section front matter declares the true contiguous source span (`source_scans` /
  // `scan_pages`, e.g. "7-12"); union it into the page sequence so coverage is the whole declared span.
  // Additive and source-backed: it only ADDS declared-range scans (printed numerals are remapped from the
  // page records afterwards), and it never shrinks a span or invents a scan outside the declared range.
  {
    const rangeStr = String(fm.source_scans || fm.scan_pages || "").replace(/^"|"$/g, "");
    const rm = /(\d+)\s*[-–]\s*(\d+)/.exec(rangeStr);
    if (rm) {
      const lo = Number(rm[1]), hi = Number(rm[2]);
      const have = new Set(pageSeq.map((p) => p.scan));
      for (let s = lo; s <= hi; s++) if (!have.has(s)) pageSeq.push({ scan: s, printed: null });
      pageSeq.sort((a, b) => a.scan - b.scan);
    }
  }
  // Guard against a two-line printed title being joined wrongly, using a NORMALIZED PROBE only
  // (trailing sentence punctuation / whitespace differences between the printed heading witness and
  // the assembly's declared title are legitimate — e.g. `ஆரியம் பேசுகிறது.` vs `ஆரியம் பேசுகிறது`).
  // The emitted display title is the front-matter value, verbatim; nothing is normalized in output.
  const titleUnit = units.find((u) => u.kind === "title");
  const declared = english ? fm.title_en : (fm.title_ta || fm.title);
  const probe = (x) => x.replace(/[\s.!?…।]+$/u, "").replace(/\s+/g, " ").trim();
  // Some publications carry only a bare-ordinal placeholder title in front matter (e.g. `title_en: "1"`);
  // there the printed `#` heading is the authoritative title, so the join-guard is inapplicable.
  const declaredIsPlaceholder = declared && /^\d+$/.test(String(declared).trim());
  if (titleUnit && declared && !declaredIsPlaceholder && probe(titleUnit.text) !== probe(declared)) {
    die(`assembled heading "${titleUnit.text}" differs from frontmatter title "${declared}" beyond trailing punctuation — a two-line printed title may have been joined wrongly`);
  }
  return { fm, units, notes, damage, pageSeq };
}

// The reading title: a substantive front-matter title if present, else the article's printed `#` heading.
function substantiveTitle(declared, units) {
  const d = declared == null ? "" : String(declared).trim();
  if (d && !/^\d+$/.test(d)) return d;
  const h = units.find((u) => u.kind === "title");
  return h ? h.text : d || null;
}

function buildBlocks(units) {
  const blocks = [];
  for (const u of units) {
    if (u.kind === "title") continue;
    if (!u.page) die(`a unit carries no source page: ${JSON.stringify(u.text.slice(0, 60))}`);
    if (u.kind === "subheading") { blocks.push({ kind: "subheading", segments: [{ kind: "authored-text", text: u.text }], text: u.text, mixedVoice: false, sourcePages: [u.page] }); continue; }
    const kind = ATTRIBUTION.test(u.text) ? "attribution" : "paragraph";
    // A paragraph records EVERY source page it occupies (in reading order) — a paragraph that straddles a
    // physical page boundary carries both pages, from the inline markers consumed while parsing it.
    blocks.push({ kind, segments: null, text: u.text, mixedVoice: false, sourcePages: (u.pages && u.pages.length ? u.pages : [u.page]).map((p) => ({ scan: p.scan, printed: p.printed })) });
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
    // Page-record status vocab varies across publications (verified / VERIFIED / strict-reviewed /
    // source-complete / passed). Accept the source's completed-review vocab case-insensitively; reject
    // anything that is not a completed review (e.g. draft / needs-review / hold).
    const status = (/status:\s*"([^"]*)"/.exec(t) || [])[1];
    const PAGE_OK = new Set(["verified", "strict-reviewed", "source-complete", "passed", "assembly-reviewed"]);
    if (!status || !PAGE_OK.has(status.toLowerCase())) die(`${w.slug}: page record scan ${scan} status "${status}" is not an accepted completed-review status`);
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

    // SOURCE-SECTION works (e.g. pesum-kalai-valarppom): the source prints no contents page and no
    // descriptive titles — only source-visible numbered section openings 1..N. The section NUMBER is the
    // identity; the publication-title echo (`# <title>`) and the bare number heading (`## N` / `# N`) are
    // structural, not authored body. Drop the number heading from the body (the `#` title echo is dropped
    // by buildBlocks already) and assert the source-visible number matches the reading position.
    const sourceSection = w.numberModel === "source-section";
    const sectionNum = String(i + 1);
    if (sourceSection && String(ta.fm.title ?? "").trim() !== sectionNum) die(`${w.slug} section ${i + 1}: front-matter title "${ta.fm.title}" is not the source-visible section number ${sectionNum}`);
    const stripNumberHeading = (units) => sourceSection ? units.filter((u) => !(u.kind === "subheading" && u.text.trim() === sectionNum)) : units;
    const taUnits = stripNumberHeading(ta.units);
    const enUnits = stripNumberHeading(en.units);

    // AUTHORITATIVE printed numerals come from the page records, not the assembly markers (several
    // Batch-6 assemblies use bare `<!-- scan N -->` markers). Remap every block's page + the page
    // sequence to the page-record printed numeral, failing closed on any scan with no page record.
    const remap = (blocks) => { for (const b of blocks) for (const p of b.sourcePages) { if (!scanPrinted.has(p.scan)) die(`${w.slug} article ${i + 1}: block cites scan ${p.scan} with no page record`); p.printed = scanPrinted.get(p.scan); } };
    for (const p of ta.pageSeq) p.printed = scanPrinted.get(p.scan) ?? null;
    if (!w.acceptedArticleStatus.includes(ta.fm.status)) die(`${w.slug} article ${i + 1}: Tamil status "${ta.fm.status}" not in ${JSON.stringify(w.acceptedArticleStatus)}`);
    if (en.fm.translation_status !== "verified") die(`${w.slug} article ${i + 1}: English translation_status "${en.fm.translation_status}", expected "verified"`);

    const taBlocks = buildBlocks(taUnits);
    const enBlocks = buildBlocks(enUnits);
    if (!taBlocks.length) die(`${w.slug} article ${i + 1}: Tamil body EMPTY`);
    if (!enBlocks.length) die(`${w.slug} article ${i + 1}: English body EMPTY`);
    remap(taBlocks); remap(enBlocks);

    const runs = deriveRuns(ta.pageSeq);
    const printedPages = derivePrinted(ta.pageSeq, w.articleCount === 1 ? "pamphlet" : "article");

    // Every Tamil block's cited scan must fall inside the derived runs.
    const inRuns = (s) => runs.some((r) => s >= r.from && s <= r.to);
    for (const b of taBlocks) for (const p of b.sourcePages) if (!inRuns(p.scan)) die(`${w.slug} article ${i + 1}: block cites scan ${p.scan} outside derived runs`);

    // The reading number is the archive reading ORDINAL (1..N in sorted file order) — not the source's own
    // printed article number, which varies across publications (0-based, or absent). The printed number is
    // preserved as a source witness where present; it is never used to renumber or reorder the reading.
    const printedArticleNumber = ta.fm.article_number != null && String(ta.fm.article_number).trim() !== "" ? Number(ta.fm.article_number) : null;
    articles.push({
      number: i + 1,
      // "source-section": the number is a source-visible section number (no printed contents page, no
      // descriptive title). "archive-ordinal": archive reading order, number not printed in the source.
      numberSource: sourceSection ? "source-section" : "archive-ordinal",
      // For a source-section work the source-visible number IS the section number; there is no separate
      // printed article number. Otherwise carry the printed article-number witness where present.
      sourceArticleNumberAsPrinted: sourceSection ? (i + 1) : (Number.isFinite(printedArticleNumber) ? printedArticleNumber : null),
      slug: taFiles[i].replace(/^\d\d-/, "").replace(/\.md$/, ""),
      // Reading title: the substantive front-matter title where present; otherwise the printed `#` heading
      // (front matter may carry only a bare-ordinal placeholder). A source-section work has NO descriptive
      // title — the section is identified by its number alone, so the title is left empty (never the bare
      // numeral, never the publication-title echo).
      titleTa: sourceSection ? "" : substantiveTitle(ta.fm.title_ta || ta.fm.title, ta.units),
      titleEn: sourceSection ? "" : substantiveTitle(en.fm.title_en || en.fm.title, en.units),
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

  // Public reading-unit noun for provenance prose: a source-section work's units are numbered SECTIONS, not
  // articles (every other work keeps "article", so its output is byte-identical).
  const unit = w.numberModel === "source-section" ? "section" : "article";
  const unitSg = unit === "section" ? "a section" : "an article";

  const provenance = {
    workId: w.slug, sourceRepo: "pugazg/kalaignar-essays", sourcePath: `publications/${w.slug}`,
    sourceCommit: APPROVED_SOURCE_COMMIT, sourceTree: w.tree,
    wave: 7, batch: 4, shelf: "essays-articles", readiness: "ready",
    // Wave 7 Batch 4 P1 — vendored HIDDEN. Not in LIBRARY_WORKS, no /essays route, no /read discovery, no
    // sitemap URL until this cohort's authorized P4.
    hidden: { discoverable: false, sitemapExposed: false, publicRoute: false, note: "Wave 7 Batch 4 P1 hidden foundation." },
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
        `Quoted third-party material inside ${unitSg} stays a separate voice from Kalaignar's own framing.`,
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
      boundaryNote: `These archives record no per-edge continuation adjudication, so every in-${unit} page transition is reported as \`unknown\` rather than guessed from adjacency.`,
      provenanceGranularity: "Every block carries the exact scan it occupies; where the source prints no page numeral the printed page is null and nothing is inferred.",
      note: `Archive-derived counts, recomputed at import time from the frozen source. Per-${unit} scan runs and printed-page evidence are derived from each assembly's own scan markers.`,
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

console.log(`\nWave 7 Batch 4 — Essays & Articles (P1, hidden)`);
console.log(`  source pin ${APPROVED_SOURCE_COMMIT}\n`);
console.log("  slug                                          arts  routes  ta-blk  en-blk  publication.json  provenance.json");
let totalArts = 0, totalRoutes = 0;
for (const r of report) {
  totalArts += r.articles; totalRoutes += r.routes;
  console.log(`  ${r.slug.padEnd(44)} ${String(r.articles).padStart(4)}  ${String(r.routes).padStart(6)}  ${String(r.taBlocks).padStart(6)}  ${String(r.enBlocks).padStart(6)}  ${r.pubSha}  ${r.provSha}`);
}
console.log(`\n  totals: ${totalArts} literary articles · ${totalRoutes} direct routes across ${report.length} publications`);
