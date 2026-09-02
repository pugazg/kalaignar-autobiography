// Bulk Onboarding Wave 3 — three Essays & Articles publications from `pugazg/kalaignar-essays`.
//
//   node scripts/import-wave3-essays.mjs <kalaignar-essays-clone> <source-commit>
//
// ONE shared parser/core plus THREE explicit work declarations. Deterministic, pinned, fail-closed,
// read-only against the source; the controlling PDFs are never vendored.
//
// ── WHY THIS IS NOT THE REFERENCE IMPORTER ──────────────────────────────────────────────────────────
// `சக்கரவர்த்தியின் திருமகன்` is one 2018 reprint of a 1956 collection: every article is a single
// ascending contiguous scan run, every page carries a printed numeral, and the publication prints a
// contents page that numbers its articles. Its importer could therefore assume all of that. None of
// those assumptions survives Wave 3:
//
//   * கயிற்றில் தொங்கிய கணபதி — ONE article; its opening scan prints no numeral;
//   * உணர்ச்சிமாலை — every article opening is unnumbered, and scan 20 shows a printed `1` that the
//     archive explicitly refuses to turn into `19`;
//   * திராவிட சம்பத்து — a DAMAGED pamphlet bound out of order. Its articles occupy non-contiguous,
//     partly DESCENDING scan runs (`5–6, 13–16` and `12, 3`), it prints no page numerals at all, its
//     reading order had to be reconstructed, and its Tamil articles carry `strict-reviewed` rather
//     than `verified`.
//
// So the shape is: shared parsing (identical file layout across the whole archive) + per-work frozen
// DECLARATIONS that state each publication's own facts and are checked against the source.
//
// ── FIVE SCAN-MARKER FORMS ──────────────────────────────────────────────────────────────────────────
// The archive does not use one marker syntax. All observed forms are parsed explicitly, and anything
// unrecognised fails closed rather than being skipped as prose:
//
//   <!-- scan N / printed M -->
//   <!-- scan N / printed numeral not visible -->
//   <!-- scan N / printed numeral not visible / source-recovered Gemini omission -->
//   <!-- scan N / printed page-position witness visible `1` only -->
//   <!-- மூல ஸ்கேன் பக்கம்: N -->
//
// and for English: `<!-- Tamil source: scan N ... -->` in the same variants.
//
// ── ARCHIVE ANNOTATIONS ARE NOT BODY TEXT ───────────────────────────────────────────────────────────
// These assemblies carry standalone HTML-comment annotations (`<!-- SOURCE DAMAGE: … -->`,
// `<!-- Article 10 ends here … -->`). They are the archive talking about the page, not the page. They
// are excluded from every block and the damage notes are surfaced on provenance instead.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-wave3-essays.mjs <kalaignar-essays-clone> <source-commit>");
  process.exit(1);
}
const die = (m) => { throw new Error(m); };
const nfc = (s) => s.normalize("NFC");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

import { execFileSync } from "node:child_process";
const git = (...a) => execFileSync("git", ["-C", SRC_REPO, ...a], { encoding: "utf8" }).trim();

// ── THE PIN IS HARD-LOCKED ──────────────────────────────────────────────────────────────────────────
// Authority lives here, not in the CLI argument. `publications/ina-muzhakkam/` advances constantly in
// this repository, so the COMMIT alone is a weak guard — the per-work TREE guards below are what make
// the freeze meaningful.
const APPROVED_SOURCE_COMMIT = "6814e979fd3c2cefa14cbeb17eeec28164ce28f5";

let head;
try { head = git("rev-parse", "HEAD"); }
catch (e) { die(`unable to read git HEAD of ${SRC_REPO}: ${e.message}`); }
if (SRC_COMMIT !== APPROVED_SOURCE_COMMIT) {
  die(`supplied source commit ${SRC_COMMIT} is not the approved pin ${APPROVED_SOURCE_COMMIT}.`);
}
if (head !== APPROVED_SOURCE_COMMIT) {
  die(`${SRC_REPO} is at ${head}, not the approved pin ${APPROVED_SOURCE_COMMIT}.`);
}

// ── THE AUTHORIZED BATCH ────────────────────────────────────────────────────────────────────────────
const WORKS = [
  {
    slug: "kayittril-thongiya-kanapathi",
    tree: "ca1c92591b9389e60d44b9683af849e3a682e528",
    titleTa: "கயிற்றில் தொங்கிய கணபதி",
    titleEn: "Ganapathi Who Hung from the Rope",
    subtype: "single-article-pamphlet",
    scanTotal: 17,
    scanSha256: "927d05fb27a2545d6732acd9bf8bde04dba2d22546d171b502703a773b40f45a",
    scanBytes: 26750146,
    scanFilename: "TVA_BOK_0064013_கயிற்றில்_தொங்கிய_கணபதி.pdf",
    acceptedArticleStatus: ["verified"],
    articleCount: 1,
    // Ordered scan runs per article, in source reading order.
    runs: [[{ from: 6, to: 15 }]],
    printedPages: [{ kind: "range", from: 6, to: 14, note: "scan 6 (the article opening) shows no printed numeral" }],
    firstEdition: { statementTa: "ஜூலை 1949", monthTa: "ஜூலை", year: 1949, publisherTa: "அறிவுப்பண்ணை", priceTa: "விலை அணா 3" },
    controllingIsFirstEdition: true,
    exclusions: [
      "scans 1–3 — cover / title-publisher / imprint",
      "scan 4 — பதிப்புரை",
      "scan 5 — blank physical scan",
      "scans 16–17 — independent printed advertisements / promotional matter",
    ],
    titleWitnessNotes: [
      "Cover (scan 1) prints the author as `மு.கருணாநிதி`; the title page (scan 2) prints `மு. கருணாநிதி` followed by `எழுதியது`. The spacing difference is source-visible and both witnesses are kept.",
    ],
    releaseWitness: "translations/en/RELEASE_REPORT.md — E7 PASSED, English release gate closed",
  },
  {
    slug: "unarchchimaalai",
    tree: "f49d77a0733ca75f7a96fb6a1cf4631e375b05d0",
    titleTa: "உணர்ச்சிமாலை",
    titleEn: "Garland of Emotion",
    subtype: "essay-collection",
    scanTotal: 50,
    scanSha256: "d2d45de049505218fd612bf71949135e34ecb317ffb5d003dfe59a3a0608461d",
    scanBytes: 79471633,
    scanFilename: "TVA_BOK_0063821_உணர்ச்சிமாலை.pdf",
    acceptedArticleStatus: ["verified"],
    articleCount: 10,
    runs: [
      [{ from: 6, to: 9 }], [{ from: 10, to: 15 }], [{ from: 16, to: 18 }], [{ from: 19, to: 29 }],
      [{ from: 30, to: 32 }], [{ from: 33, to: 38 }], [{ from: 39, to: 41 }], [{ from: 42, to: 44 }],
      [{ from: 45, to: 47 }], [{ from: 48, to: 49 }],
    ],
    printedPages: [
      { kind: "range", from: 6, to: 8, note: "scan 6 (the article opening) shows no printed numeral" },
      { kind: "range", from: 10, to: 14, note: "scan 10 (the article opening) shows no printed numeral" },
      { kind: "range", from: 16, to: 17, note: "scan 16 (the article opening) shows no printed numeral" },
      // Scan 19 is unnumbered and scan 20 shows a printed `1` only. The archive explicitly refuses to
      // infer `19`, so this article gets NO range — a partial witness, stated as such.
      { kind: "partial", note: "scan 19 (the article opening) shows no printed numeral; scan 20 shows a page-position witness `1` only. The archive does not infer `19`, and neither does this integration." },
      { kind: "range", from: 30, to: 31, note: "scan 30 (the article opening) shows no printed numeral" },
      { kind: "range", from: 33, to: 37, note: "scan 33 (the article opening) shows no printed numeral" },
      { kind: "range", from: 39, to: 40, note: "scan 39 (the article opening) shows no printed numeral" },
      { kind: "range", from: 42, to: 43, note: "scan 42 (the article opening) shows no printed numeral" },
      { kind: "range", from: 45, to: 46, note: "scan 45 (the article opening) shows no printed numeral" },
      { kind: "range", from: 48, to: 48, note: "scan 48 (the article opening) shows no printed numeral" },
    ],
    firstEdition: { statementTa: "முதற்பதிப்பு—1951", year: 1951, priceTa: "விலை அணா 8" },
    controllingIsFirstEdition: true,
    exclusions: [
      "scans 1–5 — front matter",
      "scan 50 — independent மணமகள் back-cover advertisement",
      "the printed publication-source note and printer imprint below the end of Article 10 on scan 49",
    ],
    titleWitnessNotes: [
      "The publication prints NO contents page. `indexes/contents.md` is an editorial, scan-derived map and is not a printed source witness, so the article ordinals here are archive reading ordinals.",
      "The archive's user-governed lexical baseline is controlling for wording; 18 source/baseline conflicts are documented upstream and retained, not silently resolved here.",
    ],
    releaseWitness: "PUBLICATION_COMPLETION_REVIEW.md — E6 PASS, E7 PASS, English COMPLETE / RELEASED / FROZEN",
  },
  {
    slug: "thiraavida-sampaththu",
    tree: "fe0f6ea0482ac2cd0e8c4558edd3b452e249dbdd",
    titleTa: "திராவிட சம்பத்து",
    titleEn: "Dravidian Wealth",
    subtype: "reconstructed-pamphlet",
    scanTotal: 16,
    scanSha256: "09d567abb30a0beacc1efd1e1fb757f01da93968f5582c9b1b8859b87dac2165",
    scanBytes: 26071193,
    scanFilename: "TVA_BOK_0064196_திராவிட_சம்பத்து.pdf",
    // The archive froze this publication's Tamil at `strict-reviewed`, not `verified`. That is the
    // real released status here and it is accepted DELIBERATELY and NARROWLY — not by relaxing the
    // gate to accept any status.
    acceptedArticleStatus: ["strict-reviewed"],
    articleCount: 2,
    // NON-CONTIGUOUS, and article 2 is DESCENDING. Neither may be flattened or sorted.
    runs: [
      [{ from: 5, to: 6 }, { from: 13, to: 16 }],
      [{ from: 12, to: 12 }, { from: 3, to: 3 }],
    ],
    printedPages: [
      { kind: "none", note: "The pamphlet shows no printed page numerals. Pencil folio marks on alternating scans are physical-copy marks, not printed pagination." },
      { kind: "none", note: "The pamphlet shows no printed page numerals. Pencil folio marks on alternating scans are physical-copy marks, not printed pagination." },
    ],
    // The PDF is not in publication reading order; the archive records a reading_order on every page.
    readingOrder: [1, 2, 9, 10, 5, 6, 13, 14, 15, 16, 7, 8, 11, 12, 3, 4],
    firstEdition: { statementTa: "முதல பதிப்பு, செப்டம்பர் 1951", monthTa: "செப்டம்பர்", year: 1951, publisherTa: "அறிவு மன்றம், சென்னை-1", priceTa: "விலை அணா மூன்று" },
    controllingIsFirstEdition: true,
    physicalCondition: {
      conditionTa: "damaged pamphlet — paper torn away in several places",
      reconstructionPolicy:
        "Text physically lost to tearing is NOT reconstructed from context. Where the source is torn the archive records the damage and leaves the gap; this integration carries that decision unchanged and adds nothing.",
    },
    exclusions: [
      "publisher / imprint matter",
      "the printed advertisement",
    ],
    titleWitnessNotes: [
      "The publication prints NO contents page, so the article ordinals here are archive reading ordinals rather than printed numbers.",
      "The PDF is not in publication reading order; the reading sequence was reconstructed from the physical scans and is recorded explicitly.",
    ],
    releaseWitness: "PUBLICATION_COMPLETION_REVIEW.md — E6 PASS, E7 PASS / RELEASE COMPLETE",
  },
];

// ── PER-WORK TREE GUARDS ────────────────────────────────────────────────────────────────────────────
for (const w of WORKS) {
  const live = git("rev-parse", `${APPROVED_SOURCE_COMMIT}:publications/${w.slug}`);
  if (live !== w.tree) {
    die(`source tree drift for ${w.slug}: archive has ${live}, this batch was frozen at ${w.tree}`);
  }
}
// Ina Muzhakkam is active upstream and is NOT in this batch.
if (WORKS.some((w) => w.slug === "ina-muzhakkam")) die("ina-muzhakkam is not a Wave-3 work");
if (WORKS.some((w) => w.slug === "sakkaravarththiyin-thirumagan")) die("the reference work is not a Wave-3 work");
if (WORKS.length !== 3) die(`the authorized batch is exactly 3 publications; got ${WORKS.length}`);

// ── SHARED PARSING CORE ─────────────────────────────────────────────────────────────────────────────
const OPEN_Q = "“";
const CLOSE_Q = "”";
const NON_BODY_HEADING = /^##\s+(Source note|Assembly note|Editorial \/ source note|Translation note)\s*$/;
const NOT_AUTHORED = "not part of Kalaignar's text";
const ATTRIBUTION = /^\*\*\(.*\)\*\*$/;

/** Every scan-marker form the archive actually uses. Returns null when the line is not a marker. */
function parseMarker(line, english) {
  const body = english
    ? /^<!--\s*Tamil source:\s*(.+?)\s*-->$/.exec(line)
    : /^<!--\s*(.+?)\s*-->$/.exec(line);
  if (!body) return null;
  const inner = body[1];
  // `மூல ஸ்கேன் பக்கம்: N`
  let m = /^மூல ஸ்கேன் பக்கம்:\s*(\d+)$/.exec(inner);
  if (m) return { scan: Number(m[1]), printed: null, note: null };
  // `scan N` with an optional printed clause
  m = /^scan (\d+)$/.exec(inner);
  if (m) return { scan: Number(m[1]), printed: null, note: null };
  m = /^scan (\d+)\s*\/\s*printed (?:p\.)?(\d+)$/.exec(inner);
  if (m) return { scan: Number(m[1]), printed: Number(m[2]), note: null };
  m = /^scan (\d+)\s*\/\s*printed numeral not visible(?:\s*\/\s*(.+))?$/.exec(inner);
  if (m) return { scan: Number(m[1]), printed: null, note: m[2] ?? null };
  m = /^scan (\d+)\s*\/\s*printed page-position witness visible\s*`?([^`]*)`?\s*only$/.exec(inner);
  if (m) return { scan: Number(m[1]), printed: null, note: `page-position witness visible \`${m[2]}\` only; no printed page number inferred` };
  return null;
}

/** A standalone archive annotation — never body text. */
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
  let cur = "";
  let voice = "authored-text";
  for (const ch of text) {
    if (ch === OPEN_Q && voice === "authored-text") {
      if (cur) segs.push({ kind: "authored-text", text: cur });
      cur = ch; voice = "quoted-text"; continue;
    }
    cur += ch;
    if (ch === CLOSE_Q && voice === "quoted-text") {
      segs.push({ kind: "quoted-text", text: cur });
      cur = ""; voice = "authored-text";
    }
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

/**
 * Parse one article assembly into ordered units tagged with the page they appear on.
 *
 * Two source shapes the reference publication never exhibits are handled here:
 *
 *  1. A PRINTED TITLE SET ACROSS TWO LINES. `உணர்ச்சிமாலை` articles 4, 8 and 10 print the heading as
 *     `# இராவணன்  ` followed by `நம் பாட்டன்` — a Markdown hard break, not a new paragraph. The two
 *     lines are the title, and the assembled title is checked against the frontmatter's `title_ta`
 *     so a mis-join can never pass silently.
 *
 *  2. CONTENT BEFORE THE FIRST SCAN MARKER. Article 10 additionally prints a bracketed epigraph
 *     (`[செல்வத்தை நினைக்கையிலே சிந்திய கண்ணீர்த்துளிகள்.]`) above the first marker. It is real
 *     printed source text and belongs to the article's OPENING scan — there is no earlier scan it
 *     could belong to. The opening scan is therefore established from the file's first marker, which
 *     must equal the declared opening scan, and pre-marker content is attributed to it rather than
 *     being dropped or left page-less.
 */
function parseArticle(text, english, ctx, openingScan) {
  const { fm, body } = frontMatter(text);
  const units = [];
  const notes = [];
  const damage = [];

  // Establish the opening page from the file's FIRST marker, and prove it is the declared one.
  let page = null;
  for (const raw of body.split("\n")) {
    const mk = parseMarker(raw.trim(), english);
    if (mk) {
      if (mk.scan !== openingScan) {
        die(`article opens with a marker for scan ${mk.scan}, but the frozen declaration says the article opens on scan ${openingScan}`);
      }
      page = { scan: mk.scan, printed: mk.printed };
      break;
    }
  }
  if (!page) die("article assembly carries no scan marker at all");
  let buf = [];
  let bufPage = null;
  let inNonBody = false;
  let quoteBuf = [];
  let titleOpen = false;

  const flushPara = () => {
    if (!buf.length) return;
    units.push({ kind: "text", text: buf.join("\n"), page: bufPage });
    buf = []; bufPage = null;
  };
  const flushQuote = () => {
    if (!quoteBuf.length) return;
    const t = quoteBuf.join("\n");
    if (t.includes(NOT_AUTHORED)) notes.push(t);
    else units.push({ kind: "blockquote", text: t, page: bufPage ?? page });
    quoteBuf = [];
  };

  for (const raw of body.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const t = line.trim();
    if (NON_BODY_HEADING.test(t)) { flushPara(); flushQuote(); inNonBody = true; continue; }
    if (inNonBody) continue;
    if (t === "---") { flushPara(); flushQuote(); continue; }
    const mk = parseMarker(t, english);
    if (mk) {
      flushPara(); flushQuote();
      page = { scan: mk.scan, printed: mk.printed };
      if (mk.note) ctx.pageNotes.push(`scan ${mk.scan}: ${mk.note}`);
      continue;
    }
    // A standalone archive annotation is NOT prose. Damage notes are captured for provenance; any
    // other annotation is dropped from the body but never silently swallowed as text.
    if (isAnnotation(t)) {
      flushPara(); flushQuote();
      if (isDamageNote(t)) damage.push(t.replace(/^<!--\s*/, "").replace(/\s*-->$/, ""));
      continue;
    }
    if (t === "") { flushPara(); flushQuote(); continue; }
    if (t.startsWith("> ")) { if (buf.length) flushPara(); quoteBuf.push(t.slice(2)); continue; }
    if (quoteBuf.length) flushQuote();
    if (/^#{1,6}\s/.test(t)) {
      flushPara();
      const level = t.match(/^#+/)[0].length;
      const value = t.replace(/^#+\s*/, "");
      if (level === 1) {
        // A trailing Markdown hard break means the printed heading continues on the next line.
        // NOTE: test the RAW line — `line` has already had its trailing whitespace stripped, so
        // testing it here could never match and silently lost the second half of the title.
        titleOpen = /\s{2,}$/.test(raw);
        units.push({ kind: "title", text: value, page });
      } else {
        units.push({ kind: "subheading", text: value, page });
      }
      continue;
    }
    if (titleOpen) {
      // Continuation of a two-line printed title — part of the heading, never a paragraph.
      const title = units[units.length - 1];
      title.text = `${title.text} ${t}`.replace(/\s+/g, " ").trim();
      titleOpen = false;
      continue;
    }
    if (!buf.length) bufPage = page;
    buf.push(line);
  }
  flushPara(); flushQuote();
  const titleUnit = units.find((u) => u.kind === "title");
  const declared = english ? fm.title_en : fm.title_ta;
  if (titleUnit && declared && titleUnit.text !== declared) {
    die(`assembled heading "${titleUnit.text}" does not equal the frontmatter title "${declared}" — a two-line printed title may have been joined wrongly`);
  }
  return { fm, units, notes, damage };
}

function buildBlocks(units) {
  const blocks = [];
  for (const u of units) {
    if (u.kind === "title") continue;
    if (!u.page) die(`a unit carries no source page: ${JSON.stringify(u.text.slice(0, 60))}`);
    if (u.kind === "subheading") {
      blocks.push({ kind: "subheading", segments: [{ kind: "authored-text", text: u.text }], text: u.text, mixedVoice: false, sourcePages: [u.page] });
      continue;
    }
    const kind = ATTRIBUTION.test(u.text) ? "attribution" : "paragraph";
    blocks.push({ kind, segments: null, text: u.text, mixedVoice: false, sourcePages: [u.page] });
  }
  for (const b of blocks) {
    if (!b.segments) {
      b.segments = segmentVoice(b.text);
      b.mixedVoice = b.segments.some((s) => s.kind === "authored-text" && s.text.trim())
        && b.segments.some((s) => s.kind === "quoted-text");
    }
  }
  return blocks;
}

/** Printed-page transitions inside one article, derived from the blocks' own source pages. */
function transitionsOf(blocks) {
  const seq = [];
  for (const b of blocks) for (const p of b.sourcePages) {
    if (!seq.length || seq[seq.length - 1].scan !== p.scan) seq.push(p);
  }
  const out = [];
  for (let i = 0; i + 1 < seq.length; i++) {
    out.push({
      fromScan: seq[i].scan, toScan: seq[i + 1].scan,
      fromPrinted: seq[i].printed, toPrinted: seq[i + 1].printed,
      // The Wave-3 archives record no per-edge continuation adjudication, so the honest relation is
      // `unknown`. It is never guessed from adjacency.
      relation: "unknown", evidence: [],
    });
  }
  return out;
}

// ── GENERATE ────────────────────────────────────────────────────────────────────────────────────────
const OUT_ROOT = path.join(process.cwd(), "public/data/essays");
const report = [];

for (const w of WORKS) {
  const PUB = path.join(SRC_REPO, "publications", w.slug);
  const ctx = { pageNotes: [] };

  // ---- page records ------------------------------------------------------------------------------
  const pageDir = path.join(PUB, "pages");
  const pageFiles = fs.readdirSync(pageDir).filter((f) => f.endsWith(".md")).sort();
  if (pageFiles.length !== w.scanTotal) die(`${w.slug}: expected ${w.scanTotal} page records, found ${pageFiles.length}`);
  const scansSeen = new Set();
  const readingOrderSeen = new Map();
  for (const f of pageFiles) {
    const t = readText(path.join(pageDir, f));
    const scan = Number(/scan_page:\s*(\d+)/.exec(t)[1]);
    const status = /status:\s*"([^"]*)"/.exec(t)[1];
    if (status !== "verified") die(`${w.slug}: page record scan ${scan} is "${status}", expected "verified"`);
    if (scansSeen.has(scan)) die(`${w.slug}: scan ${scan} appears in more than one page record`);
    scansSeen.add(scan);
    const ro = /reading_order:\s*(\d+)/.exec(t);
    if (ro) readingOrderSeen.set(scan, Number(ro[1]));
  }
  for (let s = 1; s <= w.scanTotal; s++) if (!scansSeen.has(s)) die(`${w.slug}: no page record for scan ${s}`);

  // The reconstructed reading order is a SOURCE fact and must match the archive exactly.
  if (w.readingOrder) {
    if (readingOrderSeen.size !== w.scanTotal) {
      die(`${w.slug}: declares a reconstructed reading order but only ${readingOrderSeen.size}/${w.scanTotal} page records carry reading_order`);
    }
    const fromArchive = [...readingOrderSeen.entries()].sort((a, b) => a[1] - b[1]).map(([scan]) => scan);
    if (JSON.stringify(fromArchive) !== JSON.stringify(w.readingOrder)) {
      die(`${w.slug}: reading order ${fromArchive.join(",")} does not match the declared ${w.readingOrder.join(",")}`);
    }
    if (JSON.stringify(fromArchive) === JSON.stringify([...fromArchive].sort((a, b) => a - b))) {
      die(`${w.slug}: the reconstructed reading order equals numeric scan order — the reconstruction has been lost`);
    }
  } else if (readingOrderSeen.size) {
    die(`${w.slug}: page records carry reading_order but the declaration does not — refusing to drop a source fact`);
  }

  // ---- articles ----------------------------------------------------------------------------------
  const taFiles = fs.readdirSync(path.join(PUB, "articles")).filter((f) => f.endsWith(".md")).sort();
  const enFiles = fs.readdirSync(path.join(PUB, "translations/en")).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
  if (taFiles.length !== w.articleCount) die(`${w.slug}: expected ${w.articleCount} Tamil assemblies, found ${taFiles.length}`);
  if (enFiles.length !== w.articleCount) die(`${w.slug}: expected ${w.articleCount} English articles, found ${enFiles.length}`);

  const articles = [];
  const damageNotes = [];
  for (let i = 0; i < taFiles.length; i++) {
    const openingScan = w.runs[i][0].from;
    const ta = parseArticle(readText(path.join(PUB, "articles", taFiles[i])), false, ctx, openingScan);
    const en = parseArticle(readText(path.join(PUB, "translations/en", enFiles[i])), true, ctx, openingScan);
    damageNotes.push(...ta.damage, ...en.damage);

    if (!w.acceptedArticleStatus.includes(ta.fm.status)) {
      die(`${w.slug} article ${i + 1}: Tamil status "${ta.fm.status}" is not one of the frozen accepted statuses ${JSON.stringify(w.acceptedArticleStatus)}`);
    }
    if (en.fm.translation_status !== "verified") {
      die(`${w.slug} article ${i + 1}: English translation_status is "${en.fm.translation_status}", expected "verified"`);
    }

    const taBlocks = buildBlocks(ta.units);
    const enBlocks = buildBlocks(en.units);
    if (!taBlocks.length) die(`${w.slug} article ${i + 1}: Tamil body extracted as EMPTY`);
    if (!enBlocks.length) die(`${w.slug} article ${i + 1}: English body extracted as EMPTY`);

    // Every cited scan must fall inside the article's DECLARED runs — the runs are the contract.
    const runs = w.runs[i];
    const inRuns = (s) => runs.some((r) => s >= Math.min(r.from, r.to) && s <= Math.max(r.from, r.to));
    for (const b of [...taBlocks, ...enBlocks]) {
      for (const p of b.sourcePages) {
        if (!inRuns(p.scan)) die(`${w.slug} article ${i + 1}: block cites scan ${p.scan}, outside the declared runs`);
      }
    }
    const declared = runs.flatMap((r) => {
      const step = r.to >= r.from ? 1 : -1;
      const out = [];
      for (let s = r.from; step > 0 ? s <= r.to : s >= r.to; s += step) out.push(s);
      return out;
    });
    const cited = [...new Set(taBlocks.flatMap((b) => b.sourcePages.map((p) => p.scan)))];
    for (const s of cited) if (!declared.includes(s)) die(`${w.slug} article ${i + 1}: cites undeclared scan ${s}`);

    articles.push({
      number: Number(ta.fm.article_number),
      // NONE of these publications prints a contents page, so the ordinal is the archive's reading
      // ordinal. It must never be described as printed in the publication.
      numberSource: "archive-ordinal",
      slug: taFiles[i].replace(/^\d\d-/, "").replace(/\.md$/, ""),
      titleTa: ta.fm.title_ta,
      titleEn: en.fm.title_en,
      scanRuns: runs.map((r) => ({ from: r.from, to: r.to })),
      printedPages: w.printedPages[i],
      tamil: { blocks: taBlocks },
      english: { blocks: enBlocks, notes: en.notes.map((t) => ({ kind: "translator-note", text: t, notPartOfAuthoredText: true })) },
      pageTransitions: transitionsOf(taBlocks),
    });
  }

  if (new Set(articles.map((a) => a.slug)).size !== articles.length) die(`${w.slug}: duplicate article slug`);
  if (new Set(articles.map((a) => a.number)).size !== articles.length) die(`${w.slug}: duplicate article number`);

  // ---- write --------------------------------------------------------------------------------------
  const publication = {
    workId: w.slug,
    slug: w.slug,
    sourceRepo: "pugazg/kalaignar-essays",
    sourcePath: `publications/${w.slug}`,
    sourceCommit: APPROVED_SOURCE_COMMIT,
    shelf: "essays-articles",
    readerStructure: "article",
    subtype: w.subtype,
    title: { ta: w.titleTa, en: w.titleEn },
    author: { ta: "கலைஞர் மு. கருணாநிதி", en: "Kalaignar M. Karunanidhi" },
    firstEdition: w.firstEdition,
    controllingIsFirstEdition: w.controllingIsFirstEdition,
    ...(w.readingOrder ? { readingOrder: w.readingOrder } : {}),
    articles,
    articleCount: articles.length,
  };

  const provenance = {
    workId: w.slug,
    sourceRepo: "pugazg/kalaignar-essays",
    sourcePath: `publications/${w.slug}`,
    sourceCommit: APPROVED_SOURCE_COMMIT,
    sourceTree: w.tree,
    source: {
      titleTa: w.titleTa,
      titleEn: w.titleEn,
      authorTa: "கலைஞர் மு. கருணாநிதி",
      scanFilename: w.scanFilename,
      scanSha256: w.scanSha256,
      scanFileSizeBytes: w.scanBytes,
      scanTotalPages: w.scanTotal,
      physicalVerification: `${w.scanTotal} / ${w.scanTotal} physical page records`,
      strictFidelityReview: `P5 strict visual text fidelity — ${w.scanTotal} / ${w.scanTotal} PASS`,
      articleAssemblies: `${w.articleCount} / ${w.articleCount} frozen`,
      unresolvedTamilFidelityItems: 0,
      editionWitnessesTa: [
        w.firstEdition.statementTa,
        ...(w.firstEdition.publisherTa ? [w.firstEdition.publisherTa] : []),
        ...(w.firstEdition.priceTa ? [w.firstEdition.priceTa] : []),
      ],
      ...(w.physicalCondition ? { physicalCondition: w.physicalCondition } : {}),
      ...(w.readingOrder
        ? { readingOrderNote: `The PDF is not in publication reading order. The archive records a reading_order on every physical page; the reconstructed reading sequence is ${w.readingOrder.join(" → ")}. Numeric scan order is NOT the reading order and must never replace it.` }
        : {}),
      sourcePdfCommitted: false,
      articleMap: articles.map((a) => ({
        number: a.number,
        titleTa: a.titleTa,
        titleEn: a.titleEn,
        scanPages: a.scanRuns.map((r) => (r.from === r.to ? `${r.from}` : `${r.from}–${r.to}`)).join(", "),
        printedPages: a.printedPages.kind === "range"
          ? `${a.printedPages.from}–${a.printedPages.to}${a.printedPages.note ? `; ${a.printedPages.note}` : ""}`
          : a.printedPages.note,
        numberSource: a.numberSource,
      })),
      titleWitnessNotes: w.titleWitnessNotes,
      lockedExclusions: w.exclusions,
    },
    english: {
      releaseTitle: w.titleEn,
      kind: "project-created",
      articlesVerified: `${w.articleCount} / ${w.articleCount} verified`,
      consistencyReview: "E6 publication-wide English consistency review — PASS",
      releaseCloseout: "E7 English release closeout — PASS",
      releaseGate: w.releaseWitness,
      unresolvedTranslationQuestions: 0,
      releaseBlockers: 0,
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
      ...(ctx.pageNotes.length ? { printedPageWitnessNotes: [...new Set(ctx.pageNotes)] } : {}),
      voiceNote: "Source block structure and voice structure are independent dimensions; a paragraph carrying both Kalaignar's framing and a quotation is never rendered wholly as a quote.",
      boundaryNote: "These archives record no per-edge continuation adjudication, so every in-article page transition is reported as `unknown` rather than guessed from adjacency.",
      provenanceGranularity: "Every block carries the exact scan it occupies; where the source prints no page numeral the printed page is null and nothing is inferred.",
      note: "Archive-derived counts, recomputed at import time from the frozen source.",
    },
    // NO projectRights. Wave-3 preflight found no publication-specific rights determination for these
    // three 1949–1951 pamphlets, and the reference work's block was never established for them.
    notes: [
      "Bulk Onboarding Wave 3. The controlling PDF is not vendored into this repository and is never fetched at runtime.",
      "This publication prints no contents page; article ordinals are archive reading ordinals.",
    ],
  };

  const dir = path.join(OUT_ROOT, w.slug);
  fs.mkdirSync(dir, { recursive: true });
  const pubJson = JSON.stringify(publication, null, 1) + "\n";
  const provJson = JSON.stringify(provenance, null, 1) + "\n";
  fs.writeFileSync(path.join(dir, "publication.json"), pubJson);
  fs.writeFileSync(path.join(dir, "provenance.json"), provJson);

  report.push({
    slug: w.slug, articles: articles.length,
    taBlocks: provenance.archiveDerived.tamilBlocks, enBlocks: provenance.archiveDerived.englishBlocks,
    mixed: provenance.archiveDerived.tamilMixedVoiceParagraphs,
    damage: damageNotes.length, pubSha: sha256(pubJson).slice(0, 16),
  });
}

console.log(`\nWave 3 — Essays & Articles`);
console.log(`  source pin ${APPROVED_SOURCE_COMMIT}\n`);
console.log("  slug                            arts  ta-blk  en-blk  mixed  damage  publication.json");
for (const r of report) {
  console.log(`  ${r.slug.padEnd(31)} ${String(r.articles).padStart(4)}  ${String(r.taBlocks).padStart(6)}  ${String(r.enBlocks).padStart(6)}  ${String(r.mixed).padStart(5)}  ${String(r.damage).padStart(6)}  ${r.pubSha}`);
}
console.log(`\n  சக்கரவர்த்தியின் திருமகன் untouched (separate work, separate pin)\n`);
