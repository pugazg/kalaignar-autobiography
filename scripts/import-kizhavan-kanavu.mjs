// Importer for கிழவன் கனவு — the Digital Library's first short story.
//
//   node scripts/import-kizhavan-kanavu.mjs <kalaignar-short-stories-clone> <source-commit>
//
// Deterministic, pinned and fail-closed. The source archive is READ-ONLY.
//
// ── WHAT THIS FILE IS CAREFUL ABOUT ─────────────────────────────────────────────────────────────
// A short story bound as a booklet is not the booklet. The physical copy is 26 scans, of which 24
// are verified and 2 are blocked — but both blocked scans are front matter, and the STORY occupies
// scans 7–22 with all 16 verified and no unresolved reading. Those are different facts and the
// generated provenance keeps them apart, so "24/26" can never be read as though the story were
// incomplete.
//
// Four separate authorities, deliberately not merged:
//   1. pages/0007..0022        the archival textual authority;
//   2. sections/…-kanavu.md    a derived reading assembly, used here only for paragraph structure
//                              and independently reconciled against (1) before anything is written;
//   3. translations/en/…       the project-created English, imported as released;
//   4. sections/…-errata.md    the publisher's printed corrections — a SEPARATE WITNESS that is
//                              never applied to the reading text. The archive itself rules this:
//                              scan 13 reads வைத்திருந்தான், the erratum says வைத்திருந்தாள், and
//                              both are recorded rather than one silently replacing the other.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-kizhavan-kanavu.mjs <short-stories-clone> <source-commit>");
  process.exit(1);
}
const die = (m) => { throw new Error(m); };
const nfc = (s) => s.normalize("NFC");
const read = (p) => nfc(fs.readFileSync(p, "utf8"));

// ── THE PIN IS HARD-LOCKED, NOT SUPPLIED ────────────────────────────────────────────────────────
// The reviewed source state for this work. Comparing the clone's HEAD against a CLI argument only
// proves the caller and the clone agree with each other — the archive could move to an unreviewed
// commit and both would happily agree on it. Authority lives here, in the file, and the argument
// is only an explicit confirmation that the caller means this same revision.
const APPROVED_SOURCE_COMMIT = "d9a411d40bd54d9770e5b28854ac5b4e804dd419";

let head;
try { head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
catch (e) { die(`unable to read git HEAD of ${SRC_REPO}: ${e.message}`); }

if (SRC_COMMIT !== APPROVED_SOURCE_COMMIT) {
  die(`supplied source commit ${SRC_COMMIT} is not the approved pin ${APPROVED_SOURCE_COMMIT}. ` +
      `A caller cannot redefine which revision this work was reviewed against.`);
}
if (head !== APPROVED_SOURCE_COMMIT) {
  die(`${SRC_REPO} is at ${head}, not the approved pin ${APPROVED_SOURCE_COMMIT}. ` +
      `Refusing to generate from an unreviewed revision even if the caller asked for it.`);
}

const SLUG = "kizhavan-kanavu";
const WORK = path.join(SRC_REPO, "stories", SLUG);
const OUT = path.join(process.cwd(), "public/data/stories", SLUG);

// ── LOCKED SOURCE IDENTITY ──────────────────────────────────────────────────────────────────────
const EXPECT = {
  title: "கிழவன் கனவு",
  authorship: "தீட்டியவர்: மு. கருணாநிதி.",
  edition: "இரண்டாம் பதிப்பு.",
  filename: "TVA_BOK_0014165_கிழவன்_கனவு.pdf",
  sha256: "cdea0e1c0d2ad657fc4163ed77c58027c18abbe58058221be7f32724b7ef8121",
  bytes: 11017627,
  scans: 26,
};
const STORY_FROM = 7, STORY_TO = 22, STORY_SCANS = 16;
const STORY_PAGE_TYPES = new Set(["story-body", "story-conclusion"]);
const CONCLUSION = "இதே கனவைத்தான் ராமசாமிப்பெரியாரும் காண்கிறார். வரப்போகும் திராவிடத்தின் அழியாத சித்திரம் ; அந்தக் கிழவன் கனவு.";
const ERRATA_COUNT = 10, ERRATA_SCAN = 23;
const EXPECT_TRANSITIONS = 15, EXPECT_JOINS = 9, EXPECT_UNRESOLVED = 6;

const sourceMd = read(path.join(WORK, "metadata/source.md"));
const grab = (re, what) => { const m = re.exec(sourceMd); if (!m) die(`metadata/source.md does not record ${what}`); return m[1].trim(); };
const gotFilename = grab(/Source filename:\s*`([^`]+)`/, "a source filename");
const gotSha = grab(/SHA-256:\s*`([0-9a-f]{64})`/, "a SHA-256");
const gotBytes = Number(grab(/File size:\s*\*\*([\d,]+)\s*bytes\*\*/, "a byte size").replace(/,/g, ""));
const gotScans = Number(grab(/Scan pages:\s*\*\*(\d+)\*\*/, "a scan count"));
const gotTitle = grab(/Title:\s*\*\*(.+?)\*\*/, "a printed title");
const gotAuthor = grab(/Authorship line:\s*\*\*(.+?)\*\*/, "a printed authorship line");
const gotEdition = grab(/Edition statement:\s*\*\*(.+?)\*\*/, "an edition statement");
for (const [label, got, want] of [
  ["source filename", gotFilename, EXPECT.filename], ["SHA-256", gotSha, EXPECT.sha256],
  ["byte size", gotBytes, EXPECT.bytes], ["scan count", gotScans, EXPECT.scans],
  ["printed title", gotTitle, EXPECT.title], ["authorship line", gotAuthor, EXPECT.authorship],
  ["edition statement", gotEdition, EXPECT.edition],
]) if (got !== want) die(`source identity changed — ${label}: expected ${JSON.stringify(want)}, archive now records ${JSON.stringify(got)}`);

// ── PAGE RECORDS: the archival authority ────────────────────────────────────────────────────────
const pageFiles = fs.readdirSync(path.join(WORK, "pages")).filter((f) => f.endsWith(".md")).sort();
if (pageFiles.length !== EXPECT.scans) die(`expected ${EXPECT.scans} page records, found ${pageFiles.length}`);

const pages = new Map();
for (const f of pageFiles) {
  const t = read(path.join(WORK, "pages", f));
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(t);
  if (!fm) die(`page record ${f} has no front matter`);
  const h = fm[1];
  const str = (k) => (new RegExp(`^${k}:\\s*"?([^"\\n]*)"?\\s*$`, "m").exec(h) ?? [])[1]?.trim();
  const scan = Number((/^scan_page:\s*(\d+)/m.exec(h) ?? [])[1]);
  const rawPrinted = (/^printed_page:\s*(.*)$/m.exec(h) ?? [])[1]?.trim();
  if (!Number.isInteger(scan)) die(`page record ${f} has no scan_page`);
  pages.set(scan, {
    file: f, scan, pageType: str("page_type"), status: str("status"), section: str("section"),
    // `null` stays null. Scan 7 states no printed page and none is inferred from its neighbour.
    printedPage: !rawPrinted || rawPrinted === "null" ? null : Number(rawPrinted),
    body: t.slice(fm[0].length),
  });
}

const storyPages = [];
for (let s = STORY_FROM; s <= STORY_TO; s++) {
  const p = pages.get(s);
  if (!p) die(`story scan ${s} has no page record`);
  if (!STORY_PAGE_TYPES.has(p.pageType)) die(`scan ${s} has page_type "${p.pageType}", which is not a story page type`);
  if (p.status !== "verified") die(`story scan ${s} has status "${p.status}" — refusing to publish an unverified story page`);
  storyPages.push(p);
}
if (storyPages.length !== STORY_SCANS) die(`expected ${STORY_SCANS} story scans, resolved ${storyPages.length}`);
if (new Set(storyPages.map((p) => p.scan)).size !== STORY_SCANS) die("duplicate story scan");
if (storyPages[0].printedPage !== null) {
  die(`scan ${STORY_FROM} now records printed page ${storyPages[0].printedPage}; the archive recorded none. ` +
      `A printed page must come from the source, never from the sequence.`);
}
// ── THE WHOLE COPY, ASSERTED RATHER THAN ASSUMED ────────────────────────────────────────────────
// provenance states "24 of 26 verified; the 2 that are not are non-story front matter". That
// sentence is a claim about the physical booklet, so every part of it is checked here — the counts,
// the exact identity of the blocked scans, and their classification. Checking only that
// `blocked.length === 2` would let the block silently move to a different page while the
// provenance kept asserting the same thing.
const EXPECT_VERIFIED = 24;
const EXPECT_BLOCKED_SCANS = [3, 4];
const EXPECT_BLOCKED_CLASSIFICATION = {
  3: { section: "front-matter", pageType: "reviews" },
  4: { section: "front-matter", pageType: "publisher-note" },
};
const allVerified = [...pages.values()].filter((p) => p.status === "verified").length;
const blocked = [...pages.values()].filter((p) => p.status === "blocked").map((p) => p.scan).sort((a, b) => a - b);
if (allVerified !== EXPECT_VERIFIED) die(`physical copy: expected ${EXPECT_VERIFIED} verified scans, found ${allVerified}`);
if (blocked.length !== EXPECT_BLOCKED_SCANS.length) die(`physical copy: expected ${EXPECT_BLOCKED_SCANS.length} blocked scans, found ${blocked.length} (${blocked})`);
if (JSON.stringify(blocked) !== JSON.stringify(EXPECT_BLOCKED_SCANS)) {
  die(`physical copy: blocked scans are ${JSON.stringify(blocked)}, expected ${JSON.stringify(EXPECT_BLOCKED_SCANS)}. ` +
      `The identity of a blocked page matters, not just how many there are.`);
}
for (const [scanStr, want] of Object.entries(EXPECT_BLOCKED_CLASSIFICATION)) {
  const p = pages.get(Number(scanStr));
  if (p.section !== want.section || p.pageType !== want.pageType) {
    die(`scan ${scanStr} is classified section "${p.section}" / page_type "${p.pageType}", expected ` +
        `"${want.section}" / "${want.pageType}". provenance may only call the blocked pages ` +
        `non-story front matter while that is what the archive records.`);
  }
}
// The story stays publishable: a blocked FRONT-MATTER page is not a story blocker, but a blocked
// STORY page would be, and that is checked separately above.
if (blocked.some((s) => s >= STORY_FROM && s <= STORY_TO)) die(`a blocked scan falls inside the story range: ${blocked}`);

// ── THE READING ASSEMBLY, RECONCILED BEFORE USE ─────────────────────────────────────────────────
const assembly = read(path.join(WORK, "sections/kizhavan-kanavu.md"));
const aLines = assembly.split("\n");
const MARK = /^<!--\s*source scan (\d+); printed page (.+?)\s*-->$/;
const marks = [];
aLines.forEach((l, i) => { const m = MARK.exec(l.trim()); if (m) marks.push({ i, scan: Number(m[1]), printed: m[2].trim() }); });
if (marks.length !== STORY_SCANS) die(`assembly carries ${marks.length} scan markers, expected ${STORY_SCANS}`);
if (marks[0].scan !== STORY_FROM || marks[marks.length - 1].scan !== STORY_TO) die("assembly scan range is not 7–22");
if (!/^[—\-?]?$/.test(marks[0].printed)) die(`assembly records a printed page for scan ${STORY_FROM}: "${marks[0].printed}"`);

const formLabel = (/^\*\(?(கற்பனையுரை)\)?\*$|^\((கற்பனையுரை)\)$|(கற்பனையுரை)/m.exec(assembly) ?? [])[0]?.replace(/[*()]/g, "").trim() ?? null;

/** Splits one scan's assembly text into blocks, preserving every fragment verbatim. */
function blocksFor(scan, raw, printedPage) {
  const out = [];
  for (const chunk of raw.split(/\n\s*\n/)) {
    const c = chunk.replace(/<!--[\s\S]*?-->/g, "").trim();
    if (!c) continue;
    const h = /^(#{1,6})\s+(.*)$/.exec(c);
    if (h) { out.push({ kind: "heading", text: h[2].trim(), sourceScan: scan, printedPage }); continue; }
    if (c.startsWith(">")) { out.push({ kind: "note", text: c.replace(/^>\s?/gm, "").trim(), sourceScan: scan, printedPage }); continue; }
    if (/^\*\(.*\)\*$/.test(c)) { out.push({ kind: "note", text: c.replace(/^\*|\*$/g, "").trim(), sourceScan: scan, printedPage }); continue; }
    out.push({ kind: "paragraph", segments: [{ text: c.replace(/\s+/g, " ").trim(), sourceScan: scan, printedPage, joinToNext: "end" }] });
  }
  return out;
}

const SENTENCE_END = /[.!?:;”"—]\s*$/;
const tamilBlocks = [];
let joins = 0, unresolved = 0;
marks.forEach((m, k) => {
  const end = k + 1 < marks.length ? marks[k + 1].i : aLines.length;
  let raw = aLines.slice(m.i + 1, end).join("\n");
  // Anything under a `##` heading that follows the LAST scan anchor is the assembly's own
  // control matter (its assembly/editorial note), not story prose. Cutting on position rather
  // than on a specific heading's wording keeps this true if the archive renames it.
  if (k === marks.length - 1) raw = raw.split(/^## .*$/m)[0];
  const pageRec = pages.get(m.scan);
  const blocks = blocksFor(m.scan, raw, pageRec.printedPage);
  if (!blocks.length) die(`scan ${m.scan} produced no story blocks`);

  if (k > 0) {
    const prevBlock = [...tamilBlocks].reverse().find((b) => b.kind === "paragraph");
    const firstNew = blocks[0];
    if (prevBlock && firstNew.kind === "paragraph") {
      const tail = prevBlock.segments[prevBlock.segments.length - 1].text;
      if (SENTENCE_END.test(tail)) {
        // The previous fragment closes a sentence at the scan edge. Whether the printed page
        // continued the same paragraph is not recoverable from the released text, and the archive
        // adjudicates no boundary here — so this asserts neither.
        tamilBlocks.push({ kind: "unresolved-break", toScan: m.scan, relation: "unknown" });
        unresolved++;
      } else {
        // ARCHIVE-POLICY CONTINUATION: one space, under the archive's normalisation rule. No claim
        // is made that this boundary was checked individually against the scan.
        prevBlock.segments[prevBlock.segments.length - 1].joinToNext = "space";
        prevBlock.segments.push(...firstNew.segments);
        prevBlock.segments[prevBlock.segments.length - 1].joinToNext = "end";
        joins++;
        blocks.shift();
      }
    }
  }
  tamilBlocks.push(...blocks);
});
if (marks.length - 1 !== EXPECT_TRANSITIONS) die(`expected ${EXPECT_TRANSITIONS} scan transitions, found ${marks.length - 1}`);
if (joins !== EXPECT_JOINS) die(`expected ${EXPECT_JOINS} policy joins, produced ${joins}`);
if (unresolved !== EXPECT_UNRESOLVED) die(`expected ${EXPECT_UNRESOLVED} unresolved boundaries, produced ${unresolved}`);

// ── FULL PER-SCAN RECONCILIATION AGAINST THE ARCHIVAL AUTHORITY ─────────────────────────────────
// The page records are the textual authority and the reading assembly is a derived convenience, so
// the WHOLE of every scan's text is compared, not a sample of it. An earlier version probed a
// handful of long words from the opening of each scan, which would have passed a page whose LATER
// paragraphs had drifted. Sampling cannot support the claim provenance makes.
//
// Normalisation is deliberately narrow: it removes only syntax that represents FORMATTING, never
// content. Punctuation, Tamil letters, words, quote marks, dashes and semicolons all survive, so a
// changed READING can never slip through disguised as a formatting difference.
//
// It runs against the raw sources and never touches what is written into story.json — the emphasis
// in **ரஷ்யாவில் அல்ல!—தமிழ் நாட்டில்!!** stays in the generated reading text.
const norm = (s) => nfc(s).replace(/[\s​]+/g, "");
const normalizeForAuthorityComparison = (s) =>
  norm(
    nfc(s)
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/^>\s?/gm, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, ""),
  );

const PRINTED_TEXT_HEADING = "# அச்சு உரை";
const PRINTED_TEXT_END = "## அச்சு அல்லாத";

/** The printed-text region of a page record — the part the archive presents as the page's text. */
function authorityRegion(p) {
  const i = p.body.indexOf(PRINTED_TEXT_HEADING);
  if (i === -1) die(`page record ${p.file} has no "${PRINTED_TEXT_HEADING}" section — cannot locate its printed text`);
  const rest = p.body.slice(i + PRINTED_TEXT_HEADING.length);
  const j = rest.indexOf(PRINTED_TEXT_END);
  // Physical-copy marks and audit notes below it are control matter, not printed text.
  return j === -1 ? rest : rest.slice(0, j);
}

{
  let matched = 0;
  for (let k = 0; k < marks.length; k++) {
    const scan = marks[k].scan;
    const rec = pages.get(scan);
    const end = k + 1 < marks.length ? marks[k + 1].i : aLines.length;
    let slice = aLines.slice(marks[k].i + 1, end).join("\n");
    if (k === marks.length - 1) slice = slice.split(/^## .*$/m)[0];
    const a = normalizeForAuthorityComparison(authorityRegion(rec));
    const b = normalizeForAuthorityComparison(slice);
    if (a !== b) {
      let at = 0;
      while (at < Math.min(a.length, b.length) && a[at] === b[at]) at++;
      die(
        `scan ${scan}: the reading assembly no longer matches its page record.\n` +
          `      first divergence at character ${at} (lengths ${a.length} / ${b.length})\n` +
          `      page record : ${a.slice(at, at + 48)}\n` +
          `      assembly    : ${b.slice(at, at + 48)}`,
      );
    }
    matched++;
  }
  if (matched !== STORY_SCANS) die(`reconciled ${matched} scans, expected ${STORY_SCANS}`);
  console.log(`  page-record reconciliation: ${matched}/${STORY_SCANS} full normalized matches`);
}

// ── STORY END GUARD ─────────────────────────────────────────────────────────────────────────────
const tamilFlat = tamilBlocks.flatMap((b) => b.kind === "paragraph" ? b.segments.map((s) => s.text) : []).join(" ");
if (!norm(tamilFlat).includes(norm(CONCLUSION))) die("the released story conclusion was not found in the imported Tamil — refusing to publish an unbounded story");
const after = norm(tamilFlat).split(norm(CONCLUSION))[1] ?? "";
if (after.trim().length) die(`story text continues past the conclusion by ${after.length} characters — commercial matter may have been ingested`);
for (const bad of ["விற்பனையாளர்", "பிரதிகள்", "விலை ரூ"]) {
  if (norm(tamilFlat).includes(norm(bad))) die(`excluded commercial matter appears in the story text: ${bad}`);
}

// ── ENGLISH: released layer only ────────────────────────────────────────────────────────────────
const enRaw = read(path.join(WORK, "translations/en/kizhavan-kanavu-en.md"));
const enFm = /^---\n([\s\S]*?)\n---\n/.exec(enRaw);
if (!enFm) die("English assembly has no front matter");
const enStatus = (/^status:\s*"([^"]+)"/m.exec(enFm[1]) ?? [])[1] ?? null;
const enTitle = (/^title_en:\s*"([^"]+)"/m.exec(enFm[1]) ?? [])[1];
const enBlocked = Number((/^blocked_source_locations:\s*(\d+)/m.exec(enFm[1]) ?? [])[1]);
if (enTitle !== "The Old Man's Dream") die(`English title changed: ${enTitle}`);
if (enBlocked !== 0) die(`English records ${enBlocked} blocked source locations`);
// A real blocked marker would sit INSIDE the story text, between two scan anchors. The file's
// header blockquote and its closing report both mention the term while stating there are none, so
// the guard looks only at the story region rather than at any occurrence of the words.
{
  const first = enRaw.indexOf("<!-- source scan 7");
  // Region = from the first scan anchor to the control heading that follows the last one.
  const lastAnchor = enRaw.lastIndexOf("<!-- source scan 22");
  const rel = enRaw.slice(lastAnchor).search(/^## .*$/m);
  const region = enRaw.slice(first, rel === -1 ? enRaw.length : lastAnchor + rel);
  const hits = region.split("\n").filter((l) => /SOURCE BLOCKED/.test(l));
  if (hits.length) die(`English story text carries a SOURCE BLOCKED marker: ${hits[0].slice(0, 90)}`);
}
const enLines = enRaw.split("\n");
const enMarks = [];
enLines.forEach((l, i) => { const m = MARK.exec(l.trim()); if (m) enMarks.push({ i, scan: Number(m[1]) }); });
if (enMarks.length !== STORY_SCANS) die(`English carries ${enMarks.length} scan anchors, expected ${STORY_SCANS}`);
const enScans = enMarks.map((m) => m.scan);
const taScans = marks.map((m) => m.scan);
if (JSON.stringify(enScans) !== JSON.stringify(taScans)) die(`English scan anchors do not match Tamil: ${enScans} vs ${taScans}`);

const englishBlocks = [];
enMarks.forEach((m, k) => {
  const end = k + 1 < enMarks.length ? enMarks[k + 1].i : enLines.length;
  let raw = enLines.slice(m.i + 1, end).join("\n");
  if (k === enMarks.length - 1) raw = raw.split(/^## .*$/m)[0];
  englishBlocks.push(...blocksFor(m.scan, raw, pages.get(m.scan).printedPage));
});
if (!englishBlocks.length) die("English produced no blocks");

// ── ERRATA: a witness, never an edit ────────────────────────────────────────────────────────────
const errataMd = read(path.join(WORK, "sections/kizhavan-kanavu-errata.md"));
const errataRows = [...errataMd.matchAll(/^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|$/gm)]
  .map((m) => ({ printedPage: Number(m[1]), sourceScan: Number(m[2]), line: Number(m[3]), printedCorrection: m[4].trim(), pageRecord: path.basename(m[5]) }));
if (errataRows.length !== ERRATA_COUNT) die(`expected ${ERRATA_COUNT} printed errata rows, parsed ${errataRows.length}`);
// The demonstrative case must remain a distinction, not a substitution.
if (norm(tamilFlat).includes(norm("வைத்திருந்தாள்"))) {
  die("the publisher erratum வைத்திருந்தாள் appears in the archival reading text — errata must never be applied silently");
}
if (!norm(tamilFlat).includes(norm("வைத்திருந்தான்"))) die("the archival reading வைத்திருந்தான் is missing from the imported story");

// ── OUTPUT ──────────────────────────────────────────────────────────────────────────────────────
const story = {
  workId: SLUG, slug: SLUG,
  sourceRepo: "pugazg/kalaignar-short-stories",
  sourcePath: `stories/${SLUG}`,
  sourceCommit: SRC_COMMIT,
  shelf: "fiction", subtype: "short-story", readerStructure: "story",
  title: { ta: EXPECT.title, en: enTitle },
  // The printed form marker, kept apart from the title: the work is கிழவன் கனவு, not
  // "கிழவன் கனவு — கற்பனையுரை".
  formLabel: formLabel ? { ta: formLabel } : null,
  author: { nameTa: "மு. கருணாநிதி", printedAuthorshipLineTa: EXPECT.authorship },
  tamil: { blocks: tamilBlocks },
  english: { blocks: englishBlocks },
  sourceScans: taScans,
};

const provenance = {
  workId: SLUG,
  sourceRepo: story.sourceRepo, sourcePath: story.sourcePath, sourceCommit: SRC_COMMIT,
  source: {
    printedTitleTa: EXPECT.title,
    printedAuthorshipLineTa: EXPECT.authorship,
    editionStatementTa: EXPECT.edition,
    scanFilename: gotFilename, scanSha256: gotSha, scanFileSizeBytes: gotBytes, scanTotalPages: gotScans,
    controllingSourceNote: "The controlling source is the supplied scanned PDF; it is not committed to either repository.",
  },
  // ── THE STORY, AND THE BOOK IT WAS BOUND IN, AS TWO DIFFERENT FACTS ──
  storyScope: {
    storyScans: `${STORY_FROM}–${STORY_TO}`, storyScanCount: STORY_SCANS,
    verified: STORY_SCANS, blocked: 0, unresolvedReadings: 0, complete: true,
    conclusionTa: CONCLUSION,
    boundaryNote:
      "The story ends at the conclusion above on scan 22. Salesperson, advertisement and " +
      "publisher/printer matter printed below it, and scans 23–26, are outside the story and are " +
      "not imported.",
  },
  physicalPublication: {
    totalScans: gotScans, verified: allVerified, blocked: blocked.length, blockedScans: blocked,
    blockedClassification: "non-story front matter",
    note:
      `${allVerified} of ${gotScans} scans of the physical copy are verified. The ${blocked.length} ` +
      `that are not (scans ${blocked.join(" and ")}) are front matter outside the story. This is a ` +
      "statement about the whole booklet, NOT about the story: the story itself is " +
      `${STORY_SCANS}/${STORY_SCANS} verified with no unresolved reading.`,
  },
  printedPageUncertainty: {
    scan: STORY_FROM, printedPage: null,
    note:
      "The archive establishes no printed page for scan 7. Scan 8 carries printed page 4, but 3 is " +
      "NOT inferred for scan 7: a printed page number must be read from the source, never derived " +
      "from its neighbour.",
  },
  errata: {
    correctionCount: errataRows.length, printedOnScan: ERRATA_SCAN,
    policy: "separate-source-witness",
    appliedToReadingText: false,
    demonstrativeCase: {
      printedPage: 9, sourceScan: 13,
      archivalReadingTa: "வைத்திருந்தான்", publisherErratumTa: "வைத்திருந்தாள்",
      note: "Two witnesses to the same line. The reading text keeps the archival page reading; the erratum is recorded here and never substituted.",
    },
    corrections: errataRows,
  },
  tamilAssembly: {
    authority: "pages/0007–0022",
    derivedAssembly: `sections/${SLUG}.md`,
    reconciled: true,
    note: "The reading assembly is a derived convenience. Every scan's text was reconciled against its own page record before generation; the page records remain the authority.",
  },
  crossScanJoinPolicy: {
    policy: "space", basis: "archive-normalisation-rule", individualAdjudication: false,
    transitions: EXPECT_TRANSITIONS, appliedBoundaries: joins, unresolvedBoundaries: unresolved,
    note:
      "Where a sentence runs on across a physical scan edge, the fragments are joined with one " +
      "space under the archive's normalisation rule. The archive records no per-boundary " +
      "adjudication for this story, so no boundary here is claimed to have been checked " +
      "individually against the scan. Where the preceding fragment closes a sentence, the " +
      "paragraph relationship is left explicitly unresolved rather than guessed.",
  },
  english: {
    titleEn: enTitle, sourceScans: `${STORY_FROM}–${STORY_TO}`, scanAnchors: enMarks.length,
    blockedSourceLocations: enBlocked, kind: "project-created",
    kindBasis: "An archive-produced translation derived from the project's own final Tamil reading, not a separately published translation.",
    archiveStatus: {
      statusAsRecorded: enStatus,
      note:
        "This is the source archive's recorded status label. It does not establish completed human " +
        "editorial review. The project's transcription and translation pipeline is machine-assisted, " +
        "and no claim of human review is made here.",
    },
    paragraphingNote: "The released English paragraphing is preserved as published. It follows the Tamil closely but is not forced to match it block for block.",
  },
  reviewQueue: {
    exists: true, file: "POSSIBLE_ERRORS_FOR_REVIEW.md",
    note:
      "The archive keeps a forward-looking recheck queue. An entry there does not mean the current " +
      "reading is wrong, does not downgrade the story's verified status, and does not establish that " +
      "a human review has been completed. It is a list of places worth looking at again, not a list " +
      "of known errors.",
  },
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "story.json"), JSON.stringify(story, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 2) + "\n");

const count = (bs, k) => bs.filter((b) => b.kind === k).length;
console.log(`${SLUG}  (source ${SRC_COMMIT.slice(0, 8)})`);
console.log(`  story scans ${STORY_FROM}–${STORY_TO} = ${STORY_SCANS} | verified ${STORY_SCANS}/${STORY_SCANS} | blocked 0`);
console.log(`  whole copy  ${allVerified}/${gotScans} verified | blocked ${blocked.join(",")} (non-story front matter)`);
console.log(`  tamil  blocks ${tamilBlocks.length} (paragraph ${count(tamilBlocks, "paragraph")}, heading ${count(tamilBlocks, "heading")}, note ${count(tamilBlocks, "note")}, unresolved-break ${count(tamilBlocks, "unresolved-break")})`);
console.log(`  english blocks ${englishBlocks.length} (paragraph ${count(englishBlocks, "paragraph")}, heading ${count(englishBlocks, "heading")}, note ${count(englishBlocks, "note")})`);
console.log(`  transitions ${EXPECT_TRANSITIONS} | policy joins ${joins} | unresolved ${unresolved}`);
console.log(`  scan 7 printed page: ${storyPages[0].printedPage === null ? "null (not inferred)" : storyPages[0].printedPage}`);
console.log(`  errata ${errataRows.length} on scan ${ERRATA_SCAN}, not applied | english anchors ${enMarks.length}/${STORY_SCANS}, status "${enStatus}"`);
