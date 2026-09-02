// Deterministic, work-specific importer for சக்கரவர்த்தியின் திருமகன் / "Chakravarthi's Son"
// (Digital Library Phase 5 — Essays & Articles; first benchmark). A 14-article publication by
// Kalaignar M. Karunanidhi answering Rajaji's "Chakravarthi Thirumagan" serial in Kalki.
//
// Reads the AUTHORITATIVE source from a local clone of pugazg/kalaignar-essays
// (publications/sakkaravarththiyin-thirumagan) at a pinned commit, and vendors static bilingual
// reader data into this website under public/data/essays/sakkaravarththiyin-thirumagan/. Runtime
// never calls GitHub. The source PDF is never read and never vendored. The source clone is never
// modified.
//
// ── PAGE BOUNDARY ≠ PARAGRAPH BOUNDARY (the Phase-4 Poetry lesson, carried forward) ─────────────
// Both released layers carry hidden `<!-- scan N / printed P -->` markers written with a blank line
// on each side. That formatting proves NOTHING about paragraph structure — in Poetry, trusting it
// produced a rejected claim. So this importer never lets a marker's surrounding blank lines decide
// whether a block continues.
//
// Instead the relation at every in-article page transition is taken from the SOURCE ARCHIVE's own
// per-page audit notes. This publication's archive is unusually explicit:
//
//   * every one of the 83 page records is `verified`, which the processing guide defines as having
//     confirmed "text, punctuation, paragraph structure and non-text marks" directly against the
//     scan, at 83/83 strict visual-fidelity PASS;
//   * the strict review checks "every visible word, word boundary/spacing, punctuation mark,
//     quotation mark, heading, date, number, paragraph continuation" against the page record;
//   * and where a paragraph or quotation runs across a page, the page record's `## Audit note`
//     SAYS SO — e.g. pages/0010 "இறுதி quotation scan 11 / printed page 9-ல் தொடர்கிறது",
//     pages/0027 "The first line completes scan 26's unfinished sentence".
//
// So: an explicit continuation record ⇒ `same-block` and the two fragments are JOINED into one
// block carrying both printed pages. A verified page pair with NO continuation record ⇒
// `block-boundary`. Each classification carries its verbatim citation, and `unknown` remains
// available for any transition neither could establish (currently none).
//
// Usage: node scripts/import-sakkaravarththiyin-thirumagan.mjs <kalaignar-essays-clone> <source-commit>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-sakkaravarththiyin-thirumagan.mjs <kalaignar-essays-clone> <source-commit>");
  process.exit(1);
}

// Fail closed BEFORE anything is written: the clone's actual git HEAD must equal the supplied SHA.
let actualHead;
try {
  actualHead = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch (e) {
  throw new Error(`unable to read git HEAD of source clone at ${SRC_REPO}: ${e.message}`);
}
if (actualHead !== SRC_COMMIT) {
  throw new Error(
    `source-commit mismatch: supplied ${SRC_COMMIT} but ${SRC_REPO} HEAD is ${actualHead}. ` +
      `Refusing to generate data with a commit SHA that does not match the checked-out source tree.`,
  );
}

const SLUG = "sakkaravarththiyin-thirumagan";
const PUB_DIR = path.join(SRC_REPO, "publications", SLUG);
const OUT = path.join(process.cwd(), "public/data/essays", SLUG);
const readText = (p) => fs.readFileSync(p, "utf8");
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// ── Source identity, asserted against the source repository's own metadata record ────────────────
const SCAN_FILENAME = "TVA_BOK_0065662_சக்கரவர்த்தியின்_திருமகன்.pdf";
const SCAN_SHA256 = "5d7f8404a53c0766df896ddedf9978a3fd31f97b8e98625b70a93366412eb90d";
const SCAN_SIZE = 201858823;
const SCAN_PAGES = 83;
const PRINTED_PAGE_COUNT = 80;

const sourceMeta = readText(path.join(PUB_DIR, "metadata/source.md"));
for (const [label, needle] of [
  ["scan filename", SCAN_FILENAME],
  ["scan SHA-256", SCAN_SHA256],
  ["scan size", "201,858,823"],
  ["scan count", "**83**"],
  ["first edition", "முதற்பதிப்பு மே 1956"],
  ["controlling reprint", "மறு பதிப்பு - 2018"],
]) {
  if (!sourceMeta.includes(needle)) {
    throw new Error(`source identity mismatch: metadata/source.md does not record the expected ${label} (${needle})`);
  }
}

// ── Markdown parsing ─────────────────────────────────────────────────────────────────────────────
// Marker formats actually present in the release: "printed 7" and "printed p.69".
const TA_MARKER = /^<!--\s*scan (\d+) \/ printed (?:p\.)?(\d+)\s*-->$/;
const EN_MARKER = /^<!--\s*Tamil source: scan (\d+) \/ printed (?:p\.)?(\d+)\s*-->$/;
// Sections that follow the article body and are NOT authored text.
const NON_BODY_HEADING = /^##\s+(Source note|Assembly note|Editorial \/ source note)\s*$/;
// The source's own label establishing that a blockquote is not Kalaignar's text.
const NOT_AUTHORED = "not part of Kalaignar's text";

function frontMatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) throw new Error("missing YAML front matter");
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line.trim());
    if (kv) fm[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1");
  }
  return { fm, body: text.slice(m[0].length) };
}

// ── VOICE SEGMENTATION (independent review correction) ──────────────────────────────────────────
// An earlier revision typed a whole paragraph "quotation" when it merely OPENED with a quotation
// mark. In this publication a single printed paragraph regularly closes a quotation and then
// continues in Kalaignar's own voice — Article 1's `“பாயசத்தில் … சொல்லப்படுகிறது.”` followed by
// `1954 - ஜூன் 6ஆம் நாள் …` is exactly that shape. Typing the block as a quotation rendered his
// framing inside <blockquote>, attributing his words to the man he was quoting.
//
// Voice is therefore segmented INSIDE the block from the released text's own quotation punctuation,
// tracking state across multiple quotations in one paragraph and across page-spanning quotations.
// Speaker identity is never inferred from meaning, and punctuation is never repaired: the archive
// documents source-irregular/unclosed quotations, and an unclosed quotation simply leaves the block
// ending in quoted voice, exactly as the source leaves it.
const OPEN_Q = "\u201c"; // “
const CLOSE_Q = "\u201d"; // ”

function segmentVoice(text) {
  const segs = [];
  let cur = "";
  let voice = "authored-text";
  for (const ch of text) {
    if (ch === OPEN_Q && voice === "authored-text") {
      if (cur) segs.push({ kind: "authored-text", text: cur });
      cur = ch;
      voice = "quoted-text";
      continue;
    }
    cur += ch;
    if (ch === CLOSE_Q && voice === "quoted-text") {
      segs.push({ kind: "quoted-text", text: cur });
      cur = "";
      voice = "authored-text";
    }
  }
  if (cur) segs.push({ kind: voice, text: cur });
  // Never DROP a run: a whitespace-only run between two quotations is merged into the previous
  // segment so the segments always concatenate back to the block verbatim.
  const merged = [];
  for (const seg of segs) {
    if (seg.text.trim() === "" && merged.length) merged[merged.length - 1].text += seg.text;
    else merged.push({ ...seg });
  }
  if (merged.map((x) => x.text).join("") !== text) throw new Error(`voice segmentation lost text: ${JSON.stringify(text.slice(0, 60))}`);
  return merged.length ? merged : [{ kind: "authored-text", text }];
}

// A source-bolded citation line closing a quotation, e.g. **(மே. 23, ‘கல்கியில் ஆச்சாரியார்.)**
const ATTRIBUTION = /^\*\*\(.*\)\*\*$/;

/** Parse one article file into ordered raw units, each tagged with the page it appears on. */
function parseArticle(text, markerRe) {
  const { fm, body } = frontMatter(text);
  const units = [];
  const notes = [];
  let page = null;
  let buf = [];
  let bufPage = null;
  let inNonBody = false;
  let quoteBuf = [];

  const flushPara = () => {
    if (!buf.length) return;
    const t = buf.join("\n");
    units.push({ kind: "text", text: t, page: bufPage });
    buf = [];
    bufPage = null;
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
    if (NON_BODY_HEADING.test(t)) {
      flushPara(); flushQuote(); inNonBody = true; continue;
    }
    if (inNonBody) continue;
    if (t === "---") { flushPara(); flushQuote(); continue; }
    const mk = markerRe.exec(t);
    if (mk) { flushPara(); flushQuote(); page = { scan: Number(mk[1]), printed: Number(mk[2]) }; continue; }
    if (t === "") { flushPara(); flushQuote(); continue; }
    if (t.startsWith("> ")) { if (buf.length) flushPara(); quoteBuf.push(t.slice(2)); continue; }
    if (quoteBuf.length) flushQuote();
    if (/^#{1,6}\s/.test(t)) {
      flushPara();
      const level = t.match(/^#+/)[0].length;
      const value = t.replace(/^#+\s*/, "");
      if (level === 1) units.push({ kind: "title", text: value, page });
      else units.push({ kind: "subheading", text: value, page });
      continue;
    }
    if (!buf.length) bufPage = page;
    buf.push(line);
  }
  flushPara(); flushQuote();
  return { fm, units, notes };
}

// ── Cross-page audit, derived from the page records ─────────────────────────────────────────────
// POSITIVE evidence only, for BOTH directions. Absence of a continuation note is NOT boundary
// evidence — nothing in the pinned source repository states that continuation notes are exhaustive,
// and the only "new …" statement in the archive concerns a new ARTICLE (scan 29→30), not an
// in-article paragraph break. Where neither is positively established the relation is `unknown`.
const CONTINUATION = /தொடர்கிறத|தொடர்ச்சி|continuation|continues|completes /i;
const BOUNDARY = /new paragraph|புதிய பத்தி|paragraph break|opens a new paragraph|begins a new paragraph|starts a new paragraph/i;

function pageRecords() {
  const dir = path.join(PUB_DIR, "pages");
  const recs = new Map();
  for (const name of fs.readdirSync(dir).sort()) {
    const t = readText(path.join(dir, name));
    const scan = Number(/scan_page:\s*(\d+)/.exec(t)[1]);
    const art = /article:\s*"([^"]*)"/.exec(t);
    const status = /status:\s*"([^"]*)"/.exec(t)[1];
    // NOTE: `$` (no /m flag), not `\Z` — JavaScript has no `\Z` anchor, and the Audit note is the
    // LAST `##` section of a page record, so an alternation that only matched `\n## ` silently
    // found nothing and made every transition look like a block boundary.
    const note = /## Audit note\n([\s\S]*?)(?=\n## |$)/.exec(t);
    recs.set(scan, {
      file: `pages/${name}`,
      article: art ? art[1] : null,
      status,
      note: note ? note[1].split("\n").map((x) => x.trim()).filter(Boolean) : [],
    });
  }
  return recs;
}

const RECS = pageRecords();
if (RECS.size !== SCAN_PAGES) throw new Error(`expected ${SCAN_PAGES} page records, found ${RECS.size}`);
for (const [scan, r] of RECS) {
  if (r.status !== "verified") throw new Error(`page record for scan ${scan} is "${r.status}", expected "verified"`);
}

/** Audit one in-article page edge from the archive's own statements — positive evidence only. */
function auditTransition(fromScan, toScan) {
  const a = RECS.get(fromScan);
  const b = RECS.get(toScan);
  const names = new RegExp(`scan ${toScan}\\b|scan ${fromScan}\\b|தொடக்க|Opening|first line|இறுதி|Final`, "i");
  const cont = [];
  const bound = [];
  for (const [rec, line] of [...a.note.map((n) => [a, n]), ...b.note.map((n) => [b, n])]) {
    if (!names.test(line)) continue;
    const cite = `${rec.file}: ${line.replace(/^-\s*/, "")}`;
    if (CONTINUATION.test(line)) cont.push(cite);
    if (BOUNDARY.test(line)) bound.push(cite);
  }
  if (cont.length && !bound.length) return { relation: "same-block", evidence: [...new Set(cont)] };
  if (bound.length && !cont.length) return { relation: "block-boundary", evidence: [...new Set(bound)] };
  // Neither positively established (or contradictory) → honestly unresolved, never guessed.
  return { relation: "unknown", evidence: [] };
}

// ── Build the 14 articles ────────────────────────────────────────────────────────────────────────
const contentsMd = readText(path.join(PUB_DIR, "indexes/contents.md"));

const taFiles = fs.readdirSync(path.join(PUB_DIR, "articles")).filter((f) => f.endsWith(".md")).sort();
const enFiles = fs.readdirSync(path.join(PUB_DIR, "translations/en")).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
if (taFiles.length !== 14) throw new Error(`expected 14 Tamil article assemblies, found ${taFiles.length}`);
if (enFiles.length !== 14) throw new Error(`expected 14 English article files, found ${enFiles.length}`);

/**
 * Fold raw units into blocks. A page edge the archive POSITIVELY records as continuing joins the two
 * fragments into ONE block carrying both printed pages. An `unknown` edge is NEVER silently joined
 * and never presented as a clean paragraph break — the two fragments stay separate blocks and the
 * unresolved edge is carried in `pageTransitions` for the reader to mark neutrally.
 */
function buildBlocks(units, transitions) {
  const contAt = new Map(transitions.filter((t) => t.relation === "same-block").map((t) => [t.toScan, t]));
  const blocks = [];
  for (const u of units) {
    if (u.kind === "title") continue;
    if (u.kind === "subheading") {
      blocks.push({ kind: "subheading", segments: [{ kind: "authored-text", text: u.text }], text: u.text, mixedVoice: false, sourcePages: [u.page] });
      continue;
    }
    const kind = ATTRIBUTION.test(u.text) ? "attribution" : "paragraph";
    const prev = blocks[blocks.length - 1];
    const cont = u.page && contAt.get(u.page.scan);
    const firstOnPage = prev && prev.sourcePages[prev.sourcePages.length - 1].scan === u.page.scan - 1;
    if (cont && prev && firstOnPage && prev.kind === "paragraph" && kind === "paragraph") {
      prev.text = `${prev.text} ${u.text}`;
      prev.sourcePages.push(u.page);
      continue;
    }
    blocks.push({ kind, segments: null, text: u.text, mixedVoice: false, sourcePages: [u.page] });
  }
  // Segment voice AFTER cross-page joining, so a quotation that spans a printed page is one segment.
  for (const b of blocks) {
    if (b.segments) continue;
    b.segments = segmentVoice(b.text);
    const kinds = new Set(b.segments.map((x) => x.kind));
    b.mixedVoice = kinds.size > 1;
  }
  return blocks;
}

const articles = [];
for (let i = 0; i < 14; i++) {
  const ta = parseArticle(readText(path.join(PUB_DIR, "articles", taFiles[i])), TA_MARKER);
  const en = parseArticle(readText(path.join(PUB_DIR, "translations/en", enFiles[i])), EN_MARKER);
  const num = Number(ta.fm.article_number);
  if (num !== i + 1) throw new Error(`${taFiles[i]}: article_number ${num}, expected ${i + 1}`);
  if (Number(en.fm.article_number) !== num) throw new Error(`${enFiles[i]}: article_number disagrees with Tamil`);
  if (en.fm.translation_status !== "verified") throw new Error(`${enFiles[i]}: translation_status "${en.fm.translation_status}"`);

  // English front matter pins the exact Tamil blob it was translated from — verify it.
  const blob = execFileSync("git", ["-C", SRC_REPO, "hash-object", path.join(PUB_DIR, "articles", taFiles[i])], { encoding: "utf8" }).trim();
  if (blob !== en.fm.source_tamil_blob_sha) {
    throw new Error(`${enFiles[i]}: source_tamil_blob_sha ${en.fm.source_tamil_blob_sha} does not match the current Tamil blob ${blob}`);
  }

  const [sf, st] = ta.fm.scan_pages.split("-").map(Number);
  const [pf, pt] = ta.fm.printed_pages.split("-").map(Number);
  if (en.fm.source_scan_pages !== ta.fm.scan_pages) throw new Error(`${enFiles[i]}: scan range disagrees with Tamil`);
  if (en.fm.source_printed_pages !== ta.fm.printed_pages) throw new Error(`${enFiles[i]}: printed range disagrees with Tamil`);

  const transitions = [];
  for (let s = sf; s < st; s++) {
    const a = auditTransition(s, s + 1);
    transitions.push({ fromScan: s, toScan: s + 1, fromPrinted: pf + (s - sf), toPrinted: pf + (s + 1 - sf), ...a });
  }

  const taBlocks = buildBlocks(ta.units, transitions);
  const enBlocks = buildBlocks(en.units, transitions);

  // Contents-page witness, retained separately ONLY where it differs from the heading witness.
  // Anchor to the start of a table ROW: an unanchored `| 14 |` also matches the start-page cell of
  // article 2 (`| 2 | தேகமும் உணர்வும் | 14 |`), which silently captured an empty title.
  const cm = new RegExp(`^\\|\\s*${num}\\s*\\|\\s*([^|]+?)\\s*\\|`, "m").exec(contentsMd);
  const contentsTitle = cm ? cm[1].trim() : null;

  articles.push({
    number: num,
    // This publication DOES print a contents page numbering its articles 1–14, so the ordinal is a
    // printed source fact here. The Wave-3 publications print no contents page and use
    // "archive-ordinal"; the two must never be described in the same words.
    numberSource: "printed-contents",
    slug: taFiles[i].replace(/^\d\d-/, "").replace(/\.md$/, ""),
    titleTa: ta.fm.title_ta,
    ...(contentsTitle && contentsTitle !== ta.fm.title_ta ? { contentsTitleTa: contentsTitle } : {}),
    titleEn: en.fm.title_en,
    // Every article here is ONE ascending contiguous run, fully paginated — the simple case of the
    // generalized model, written out explicitly rather than special-cased.
    scanRuns: [{ from: sf, to: st }],
    printedPages: { kind: "range", from: pf, to: pt },
    tamil: { blocks: taBlocks },
    english: { blocks: enBlocks, notes: en.notes.map((t) => ({ kind: "translator-note", text: t, notPartOfAuthoredText: true })) },
    pageTransitions: transitions,
  });
}

// ── Exclusions (LOCKED) ──────────────────────────────────────────────────────────────────────────
// NOTE the needles are the ADVERTISEMENT's own distinctive strings, not the bare word விடுதலை —
// that word ("liberation") legitimately appears in Kalaignar's prose in Article 11, and excluding
// it by itself would be a false positive rather than a real leak.
const EXCLUDED = [
  ["scan 82 advertisement heading", "அச்சிடப்பட்ட விளம்பரம்"],
  ["scan 82 advertisement strapline", "உலகின் ஒரே பகுத்தறிவு நாளேடு"],
  ["scan 82 advertisement URL", "www.viduthalai.in"],
  ["scan 82 advertisement founding line", "தோற்றம் : 1935"],
  ["printed ornament placeholder", "[அச்சிடப்பட்ட நிறைவு அலங்காரம்]"],
  ["library accession mark A0482", "A0482"],
  ["library shelf mark", "B 294.5922"],
  ["back-cover barcode", "9997720145467"],
  ["donation/price line", "நன்கொடை"],
  ["title-page publisher line", "திராவிடர் கழக (இயக்க) வெளியீடு"],
  ["publication-note heading", "நூல் குறிப்பு"],
  ["series imprint", "பெரியார் ஆவணக் காப்பக வெளியீடு"],
  ["translator-note label", NOT_AUTHORED],
  ["assembly prose", "assembly scan pages"],
];
{
  const body = articles
    .flatMap((a) => [...a.tamil.blocks, ...a.english.blocks])
    .map((b) => b.text)
    .join("\n");
  for (const [label, needle] of EXCLUDED) {
    if (body.includes(needle)) throw new Error(`article body contains locked-excluded material (${label}): ${JSON.stringify(needle)}`);
  }
}

// ── Assemble ─────────────────────────────────────────────────────────────────────────────────────
const count = (sel) => articles.reduce((n, a) => n + sel(a), 0);
const allTx = articles.flatMap((a) => a.pageTransitions);
const rel = (r) => allTx.filter((t) => t.relation === r).length;

const publication = {
  workId: SLUG,
  slug: SLUG,
  sourceRepo: "pugazg/kalaignar-essays",
  sourcePath: `publications/${SLUG}`,
  sourceCommit: SRC_COMMIT,
  shelf: "essays-articles",
  readerStructure: "article",
  subtype: "essay-collection",
  title: { ta: "சக்கரவர்த்தியின் திருமகன்", en: "Chakravarthi's Son" },
  author: { ta: "கலைஞர் மு.கருணாநிதி", en: "Kalaignar M. Karunanidhi" },
  firstEdition: { statementTa: "முதற்பதிப்பு மே 1956 (வேலூர் திராவிடன் பதிப்பகம்)", year: 1956, monthTa: "மே", publisherTa: "வேலூர் திராவிடன் பதிப்பகம்" },
  controllingEdition: { statementTa: "மறு பதிப்பு - 2018", year: 2018, publisherLineTa: "திராவிடர் கழக (இயக்க) வெளியீடு" },
  // The scan integrated here is the 2018 REPRINT, not the 1956 first edition. That distinction is
  // real for this publication and is why the field exists; the Wave-3 pamphlets set this true
  // because their controlling scan IS the first edition.
  controllingIsFirstEdition: false,
  printedPageCount: PRINTED_PAGE_COUNT,
  articles,
  articleCount: articles.length,
};

const provenance = {
  workId: SLUG,
  sourceRepo: publication.sourceRepo,
  sourcePath: publication.sourcePath,
  sourceCommit: SRC_COMMIT,
  source: {
    titleTa: publication.title.ta,
    titleEn: publication.title.en,
    authorTa: publication.author.ta,
    scanFilename: SCAN_FILENAME,
    scanSha256: SCAN_SHA256,
    scanFileSizeBytes: SCAN_SIZE,
    scanTotalPages: SCAN_PAGES,
    physicalVerification: "83 / 83 physical scans verified and classified",
    strictFidelityReview: "83 / 83 physical scans strict visual-text-fidelity PASS",
    articleAssemblies: "14 / 14 article assemblies complete, rechecked and frozen",
    unresolvedTamilFidelityItems: 0,
    firstEditionTa: "முதற்பதிப்பு மே 1956 (வேலூர் திராவிடன் பதிப்பகம்)",
    controllingEditionTa: "மறு பதிப்பு - 2018",
    titlePagePublisherTa: "திராவிடர் கழக (இயக்க) வெளியீடு",
    printedPageCount: PRINTED_PAGE_COUNT,
    sourcePdfCommitted: false,
    articleMap: articles.map((a) => ({
      number: a.number,
      titleTa: a.titleTa,
      ...(a.contentsTitleTa ? { contentsTitleTa: a.contentsTitleTa } : {}),
      titleEn: a.titleEn,
      scanPages: a.scanRuns.map((r) => (r.from === r.to ? `${r.from}` : `${r.from}–${r.to}`)).join(", "),
      printedPages: `${a.printedPages.from}–${a.printedPages.to}`,
      numberSource: a.numberSource,
    })),
    titleWitnessNotes: [
      "Article 5 — contents-page witness `பரத்துவாஜர் ஆஸ்ரமமா - பாரீஸ் நகரத்து ‘பாரா’?` differs from the verified heading-page witness `பரத்துவாஜா ஆஸ்ரமமா - பாரிஸ் நகரத்து ‘பாரா’?`. Both are retained; the reader shows the heading witness.",
      "Article 14 — contents-page witness `காரியமாகும் வரையில் காலைப் பிடி!` differs from the heading-page witness `காரியமாகும் வரையில் காலைப் பிடி !` in the space before the exclamation mark. Both are retained; neither is normalized into the other.",
      "Article 10 — contents and heading agree (`விஷ்ணு அவதாரம் எனப்படும் ராமனிடம்!`), while the scan-63 body phrase reads `விஷ்ணு அவதாரம் என்பதும் ராமனிடமே`. The body phrase is left exactly where the source prints it and is never promoted to a title.",
    ],
    lockedExclusions: [
      "front matter before Article 1 — cover, gift notice, title page, நூல் குறிப்பு publication note, the three preface pages and the printed contents page",
      "scan 82 — everything below the printed article-ending ornament, including the விடுதலை advertisement and the physical-copy marks (library stamp, handwritten A0482 and B 294.5922)",
      "scan 83 — the physical back cover: colour artwork, barcode 9997720145467, donation line, and the promotional excerpt from Article 12, which is a SEPARATE source witness and never extends or overwrites canonical Article 12 body",
      "library ownership stamps, handwriting, accession marks, bleed-through and paper-tone artifacts throughout",
      "translator/editorial notes released with the English articles, which the source itself labels as not part of Kalaignar's text",
      "the Tamil assemblies' trailing `Source note` / `Assembly note` / `Editorial / source note` sections",
    ],
  },
  english: {
    releaseTitle: "Chakravarthi's Son",
    kind: "project-created",
    articlesVerified: "14 / 14 articles translation_status: verified",
    consistencyReview: "publication-level E6 consistency review PASSED",
    releaseCloseout: "E7 English release closeout PASSED",
    releaseGate: "CLOSED",
    unresolvedTranslationQuestions: 0,
    releaseBlockers: 0,
    translatorNotesSeparated:
      "Each English article carries exactly one released translator/editorial note, labelled in the source as not part of Kalaignar's text. Those notes are stored outside the authored body and rendered in a separate, clearly-labelled area — never as Kalaignar's prose.",
    labelPolicy: [
      "Publication-wide: the source's recurring `ஆச்சாரியார்` is released as **Achariyar** and is NEVER mechanically replaced with Rajaji.",
      "Article 7: the source's explicit `இராஜாஜி` is released as **Rajaji**.",
      "Article 11: the source's plural `ஆச்சாரியார்களுக்கு` is released as **the Achariyars**.",
      "The released English is carried verbatim: direct address, commands, rhetorical questions, repetition, sarcasm, ridicule, polemical labels, exclamations, political terminology and literary wordplay are not softened, polished or retranslated downstream.",
    ],
  },
  archiveDerived: {
    articles: articles.length,
    tamilBlocks: count((a) => a.tamil.blocks.length),
    englishBlocks: count((a) => a.english.blocks.length),
    tamilSubheadings: count((a) => a.tamil.blocks.filter((b) => b.kind === "subheading").length),
    englishSubheadings: count((a) => a.english.blocks.filter((b) => b.kind === "subheading").length),
    tamilAttributions: count((a) => a.tamil.blocks.filter((b) => b.kind === "attribution").length),
    englishAttributions: count((a) => a.english.blocks.filter((b) => b.kind === "attribution").length),
    tamilAuthoredOnlyParagraphs: count((a) => a.tamil.blocks.filter((b) => b.kind === "paragraph" && b.segments.every((x) => x.kind === "authored-text")).length),
    englishAuthoredOnlyParagraphs: count((a) => a.english.blocks.filter((b) => b.kind === "paragraph" && b.segments.every((x) => x.kind === "authored-text")).length),
    tamilQuotationOnlyParagraphs: count((a) => a.tamil.blocks.filter((b) => b.kind === "paragraph" && b.segments.every((x) => x.kind === "quoted-text")).length),
    englishQuotationOnlyParagraphs: count((a) => a.english.blocks.filter((b) => b.kind === "paragraph" && b.segments.every((x) => x.kind === "quoted-text")).length),
    tamilMixedVoiceParagraphs: count((a) => a.tamil.blocks.filter((b) => b.mixedVoice).length),
    englishMixedVoiceParagraphs: count((a) => a.english.blocks.filter((b) => b.mixedVoice).length),
    tamilQuotedSegments: count((a) => a.tamil.blocks.reduce((n, b) => n + b.segments.filter((x) => x.kind === "quoted-text").length, 0)),
    englishQuotedSegments: count((a) => a.english.blocks.reduce((n, b) => n + b.segments.filter((x) => x.kind === "quoted-text").length, 0)),
    translatorNotes: count((a) => a.english.notes.length),
    pageTransitionsAudited: allTx.length,
    relationSameBlock: rel("same-block"),
    relationBlockBoundary: rel("block-boundary"),
    relationUnknown: rel("unknown"),
    crossPageBlocks: count((a) => [...a.tamil.blocks, ...a.english.blocks].filter((b) => b.sourcePages.length > 1).length),
    voiceNote:
      "SOURCE BLOCK STRUCTURE and VOICE are separate dimensions. A block is a paragraph, a printed subheading or a source-bolded attribution line; inside a paragraph, ordered segments carry either Kalaignar's authored text or quoted third-party text, segmented from the released text's own quotation punctuation. A single printed paragraph regularly closes a quotation and then continues in Kalaignar's voice, so a MIXED paragraph is never rendered wholly as a quotation — doing so would attribute his framing to the person he quotes. Only a paragraph whose every segment is quoted may render as a full quotation. Source quotation punctuation is preserved and never repaired: the archive documents source-irregular and unclosed quotations, and an unclosed quotation simply leaves the block ending in quoted voice.",
    boundaryNote:
      "A printed-page transition is PROVENANCE; it does not by itself establish a new paragraph, the same paragraph, a new quotation or a continued quotation, and the hidden page markers' surrounding blank lines are never read as structure. Every in-article edge is classified from POSITIVE evidence in the pinned source repository: a page record that records a continuation gives `same-block` and joins the fragments into ONE block carrying both printed pages; a page record that positively records a new paragraph would give `block-boundary`. Absence of a continuation note is NOT boundary evidence — nothing in the source repository states that continuation notes are exhaustive, and the archive's only 'new …' statement concerns a new ARTICLE, not an in-article paragraph break. Edges the archive establishes neither way remain `unknown`: their fragments are kept separate and the reader marks the edge neutrally rather than asserting a paragraph break or a continuation.",
    provenanceGranularity:
      "Block-level printed-page provenance. Every block records each printed page it occupies, so a block joined across a page edge carries both — provenance never forces a block to be split, and the reader does not interrupt prose with page markers except at an edge the archive leaves unresolved.",
    note: "Derived structure only. The Tamil assemblies are the authoritative source layer; the English is the RELEASE-COMPLETE project-created translation. Neither was retranslated, re-paragraphed or normalized during import: text, order, quotation punctuation, source-printed subheadings and emphasis are carried exactly as released.",
  },
  blockers: rel("unknown")
    ? [
        {
          item: "cross-page-block-relationship",
          count: rel("unknown"),
          detail: `${rel("unknown")} in-article printed-page transitions for which the source archive positively establishes NEITHER a continuation nor a new paragraph. They are represented as unresolved: the two fragments are kept separate, neither joined nor presented as a clean paragraph break, and the reader marks the edge neutrally on screen and in print. The relation is never inferred from semantic flow, punctuation, or the blank lines around a page marker.`,
          resolution:
            "Resolution requires an UPSTREAM source-archive review of the controlling scan TVA_BOK_0065662_சக்கரவர்த்தியின்_திருமகன்.pdf that explicitly records the paragraph relation at each of these page edges — or an explicit archive convention stating that its continuation notes are exhaustive. This Digital Library integration does not establish those typographic facts independently.",
        },
      ]
    : [],
  projectRights: {
    appliesTo: "underlying-work-authored-by-kalaignar",
    rightsStatus: "nationalised-by-tamil-nadu-government",
    rightsAuthority: "Government of Tamil Nadu",
    rightsAction: "nationalisation",
    rightsAnnouncementDate: "2024-08-22",
    governmentOrderNumber: null,
    governmentOrderDate: null,
    governmentOrderHandoverDate: "2024-12-22",
    distinctionNote:
      "This is the PRESENT project-level rights status of Kalaignar's underlying articles. The edition's own publisher/imprint matter is an edition fact, not a statement about those rights.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored articles. It does NOT extend to publisher matter, the cover/design, advertisements, library marks, or any third-party contribution in the edition — each retains its own distinct provenance.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked translation (englishKind: project-created) with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
    quotedThirdPartyNote:
      "The articles quote other writers and works inside Kalaignar's argument. Those quoted texts are third-party material reproduced as the source reproduces them; the rights status of Kalaignar's articles does not extend to them, and the English renders the Tamil quotation witness the source received rather than substituting a separately published translation.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
  },
  notes: [
    "The controlling source is the supplied scanned PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan map.",
    "EDITION DISTINCTION: the publication's first edition is மே 1956 (வேலூர் திராவிடன் பதிப்பகம்); the CONTROLLING supplied source integrated here is the 2018 reprint (title-page line திராவிடர் கழக (இயக்க) வெளியீடு). The controlling scan is never described as a 1956 scan, and the 1956 history is never erased.",
    "This is ONE catalog publication containing 14 source-numbered articles — never 14 catalog works. The printed contents page numbers them 1–14 and each article boundary was verified against its heading page, so 1–14 is source-supported publication ordering, not archive-created navigation numbering.",
    "Article 14 ends on scan 82 at the printed article-ending ornament. Everything below that ornament — the விடுதலை advertisement and the physical-copy marks — is outside the article body.",
    "Scan 83 is the physical back cover. Its promotional excerpt from Article 12 is a separate source witness and never overwrites, duplicates or extends canonical Article 12 body.",
    "Contents-page and heading-page title witnesses are retained separately wherever they differ (articles 5 and 14) and are never normalized into a single string.",
  ],
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "publication.json"), JSON.stringify(publication, null, 1) + "\n");
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

const d = provenance.archiveDerived;
console.log("publication:", SLUG);
console.log("articles:", d.articles);
console.log("Tamil   blocks", d.tamilBlocks, "| authored-only", d.tamilAuthoredOnlyParagraphs, "| quotation-only", d.tamilQuotationOnlyParagraphs, "| MIXED", d.tamilMixedVoiceParagraphs, "| attributions", d.tamilAttributions, "| subheadings", d.tamilSubheadings, "| quoted segments", d.tamilQuotedSegments);
console.log("English blocks", d.englishBlocks, "| authored-only", d.englishAuthoredOnlyParagraphs, "| quotation-only", d.englishQuotationOnlyParagraphs, "| MIXED", d.englishMixedVoiceParagraphs, "| attributions", d.englishAttributions, "| subheadings", d.englishSubheadings, "| quoted segments", d.englishQuotedSegments);
console.log("translator notes:", d.translatorNotes, "| cross-page blocks:", d.crossPageBlocks);
console.log("page transitions:", d.pageTransitionsAudited, "— same-block", d.relationSameBlock, "/ block-boundary", d.relationBlockBoundary, "/ UNKNOWN", d.relationUnknown);
console.log("publication.json sha256:", sha256(readText(path.join(OUT, "publication.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
