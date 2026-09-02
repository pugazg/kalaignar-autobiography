// Source-linked batch validator — Bulk Onboarding Wave 3, three Essays & Articles publications.
//
//   node scripts/validate-wave3-essays.mjs <kalaignar-essays-clone>
//
// INDEPENDENT OF THE IMPORTER. Every expectation is re-derived here from the pinned source with this
// file's own extraction code; nothing is imported from the importer, so an importer defect cannot
// certify itself. Where both sides must agree the SOURCE side is proved present and structured first
// and only then compared — `empty == empty` may never certify completeness.
//
// Exit codes: 0 all pass · 1 a validation failure · 2 cannot validate (pin/source mismatch).
// Normal completion sets `process.exitCode`, never `process.exit()`, so a full report survives a pipe.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-wave3-essays.mjs <kalaignar-essays-clone>");
  process.exit(2);
}
const nfc = (s) => s.normalize("NFC");
const read = (p) => nfc(fs.readFileSync(p, "utf8"));
const DATA = path.join(process.cwd(), "public/data/essays");

const PIN = "6814e979fd3c2cefa14cbeb17eeec28164ce28f5";
const REFERENCE = "sakkaravarththiyin-thirumagan";
const REFERENCE_PIN = "bff35320b668cb5beeaafc5faa58260c4f4473f8";

// Declared independently of the importer's table — same facts, written out again on purpose.
const WORKS = [
  {
    slug: "kayittril-thongiya-kanapathi", tree: "ca1c92591b9389e60d44b9683af849e3a682e528",
    articles: 1, scans: 17, subtype: "single-article-pamphlet",
    sha: "927d05fb27a2545d6732acd9bf8bde04dba2d22546d171b502703a773b40f45a", bytes: 26750146,
    status: ["verified"],
    runs: [[[6, 15]]],
    printed: ["range"],
    excluded: [1, 2, 3, 4, 5, 16, 17],
  },
  {
    slug: "unarchchimaalai", tree: "f49d77a0733ca75f7a96fb6a1cf4631e375b05d0",
    articles: 10, scans: 50, subtype: "essay-collection",
    sha: "d2d45de049505218fd612bf71949135e34ecb317ffb5d003dfe59a3a0608461d", bytes: 79471633,
    status: ["verified"],
    runs: [[[6, 9]], [[10, 15]], [[16, 18]], [[19, 29]], [[30, 32]], [[33, 38]], [[39, 41]], [[42, 44]], [[45, 47]], [[48, 49]]],
    printed: ["range", "range", "range", "partial", "range", "range", "range", "range", "range", "range"],
    excluded: [1, 2, 3, 4, 5, 50],
  },
  {
    slug: "thiraavida-sampaththu", tree: "fe0f6ea0482ac2cd0e8c4558edd3b452e249dbdd",
    articles: 2, scans: 16, subtype: "reconstructed-pamphlet",
    sha: "09d567abb30a0beacc1efd1e1fb757f01da93968f5582c9b1b8859b87dac2165", bytes: 26071193,
    status: ["strict-reviewed"],
    runs: [[[5, 6], [13, 16]], [[12, 12], [3, 3]]],
    printed: ["none", "none"],
    readingOrder: [1, 2, 9, 10, 5, 6, 13, 14, 15, 16, 7, 8, 11, 12, 3, 4],
    excluded: [],
  },
];

// ── HARNESS ─────────────────────────────────────────────────────────────────────────────────────────
const results = [];
let cur = null;
const group = (name) => { cur = { name, n: 0, fails: [] }; results.push(cur); console.log(`\n${name}`); };
function check(label, ok) {
  cur.n++;
  if (ok) console.log(`    ok  ${label}`);
  else { cur.fails.push(label); console.log(`  FAIL  ${label}`); }
}
const eq = (label, got, want) =>
  check(`${label} (${JSON.stringify(got)} === ${JSON.stringify(want)})`,
        JSON.stringify(got) === JSON.stringify(want));

function cannotValidate(msg) {
  console.log(`\n  ${msg}`);
  console.log("\nBATCH RESULT: CANNOT VALIDATE\n");
  process.exit(2);
}

// ── PIN GATE (fail closed before anything else) ─────────────────────────────────────────────────────
const git = (...a) => execFileSync("git", ["-C", SRC_REPO, ...a], { encoding: "utf8" }).trim();
let head;
try { head = git("rev-parse", "HEAD"); }
catch (e) { cannotValidate(`unable to read git HEAD of ${SRC_REPO}: ${e.message}`); }
if (head !== PIN) cannotValidate(`source clone is at ${head}, not the reviewed pin ${PIN}`);

// ── INDEPENDENT SOURCE EXTRACTION ───────────────────────────────────────────────────────────────────
const MARKER_TA = [
  /^<!--\s*scan (\d+)\s*\/\s*printed (?:p\.)?(\d+)\s*-->$/,
  /^<!--\s*scan (\d+)\s*\/\s*printed numeral not visible(?:\s*\/\s*.+)?\s*-->$/,
  /^<!--\s*scan (\d+)\s*\/\s*printed page-position witness visible.*only\s*-->$/,
  /^<!--\s*மூல ஸ்கேன் பக்கம்:\s*(\d+)\s*-->$/,
];
const MARKER_EN = MARKER_TA.map((r) => new RegExp(r.source.replace("<!--\\s*", "<!--\\s*Tamil source:\\s*")));

function markerScan(line, english) {
  for (const re of (english ? MARKER_EN : MARKER_TA)) {
    const m = re.exec(line.trim());
    if (m) return { scan: Number(m[1]), printed: m[2] !== undefined ? Number(m[2]) : null };
  }
  return null;
}

/** Ordered scans cited by an assembly's markers — the source's own coverage, order preserved. */
function assemblyScans(file, english) {
  const t = read(file);
  const body = t.slice(/^---\n[\s\S]*?\n---\n/.exec(t)[0].length);
  const out = [];
  for (const line of body.split("\n")) {
    const m = markerScan(line, english);
    if (m && (!out.length || out[out.length - 1].scan !== m.scan)) out.push(m);
  }
  return out;
}

const fmOf = (file) => {
  const t = read(file);
  const m = /^---\n([\s\S]*?)\n---\n/.exec(t);
  const fm = {};
  for (const l of m[1].split("\n")) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(l.trim());
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^"|"$/g, "");
  }
  return fm;
};

const flatten = (blocks) => blocks.map((b) => b.text).join("\n");

const OPEN_Q = "\u201c";
const CLOSE_Q = "\u201d";

/** Recompute the voice split from a block's own text — deliberately not the importer's function. */
function expectedVoices(text) {
  const out = [];
  let cur = "";
  let voice = "authored-text";
  for (const ch of text) {
    if (ch === OPEN_Q && voice === "authored-text") {
      if (cur) out.push({ kind: "authored-text", text: cur });
      cur = ch; voice = "quoted-text"; continue;
    }
    cur += ch;
    if (ch === CLOSE_Q && voice === "quoted-text") {
      out.push({ kind: "quoted-text", text: cur });
      cur = ""; voice = "authored-text";
    }
  }
  if (cur) out.push({ kind: voice, text: cur });
  const merged = [];
  for (const s of out) {
    if (s.text.trim() === "" && merged.length) merged[merged.length - 1].text += s.text;
    else merged.push({ ...s });
  }
  return merged.length ? merged : [{ kind: "authored-text", text }];
}

// ── 1. BATCH PRECONDITIONS ──────────────────────────────────────────────────────────────────────────
group("BATCH PRECONDITIONS");
eq("the authorized batch is exactly 3 publications", WORKS.length, 3);
eq("no duplicate slug", new Set(WORKS.map((w) => w.slug)).size, 3);
eq("source clone HEAD is exactly the reviewed pin", head, PIN);
check("the reference publication is NOT in this batch", !WORKS.some((w) => w.slug === REFERENCE));
check("ina-muzhakkam is NOT in this batch", !WORKS.some((w) => w.slug === "ina-muzhakkam"));
check("ina-muzhakkam exists upstream but is untouched here",
      fs.existsSync(path.join(SRC_REPO, "publications", "ina-muzhakkam")) &&
      !fs.existsSync(path.join(DATA, "ina-muzhakkam")));
for (const w of WORKS) {
  eq(`${w.slug}: frozen source tree unchanged`, git("rev-parse", `${PIN}:publications/${w.slug}`), w.tree);
}

// ── 2. PER-PUBLICATION ──────────────────────────────────────────────────────────────────────────────
for (const w of WORKS) {
  group(`${w.slug.toUpperCase()}`);
  const PUB = path.join(SRC_REPO, "publications", w.slug);
  const pubPath = path.join(DATA, w.slug, "publication.json");
  const provPath = path.join(DATA, w.slug, "provenance.json");
  check("generated publication.json exists", fs.existsSync(pubPath));
  check("generated provenance.json exists", fs.existsSync(provPath));
  if (!fs.existsSync(pubPath) || !fs.existsSync(provPath)) continue;
  const pub = JSON.parse(read(pubPath));
  const prov = JSON.parse(read(provPath));

  // ---- source release state ----------------------------------------------------------------------
  const review = read(path.join(PUB, "PUBLICATION_COMPLETION_REVIEW.md"));
  check("source completion review exists and is non-empty", review.length > 200);
  check("Tamil is recorded COMPLETE / FROZEN", /COMPLETE\s*\/\s*FROZEN/i.test(review));
  const releaseReport = path.join(PUB, "translations/en/RELEASE_REPORT.md");
  const englishReleased =
    /E7[^\n]*PASS/i.test(review) || (fs.existsSync(releaseReport) && /E7 PASSED/i.test(read(releaseReport)));
  check("English release gate (E7) is recorded PASS by an authoritative record", englishReleased);
  check("no unresolved blockers recorded", /blockers[^\n]*\b0\b|\b0\b[^\n]*blockers/i.test(review));

  // ---- source structure --------------------------------------------------------------------------
  const pageFiles = fs.readdirSync(path.join(PUB, "pages")).filter((f) => f.endsWith(".md")).sort();
  eq("physical page records match the declared scan count", pageFiles.length, w.scans);
  const pageScans = pageFiles.map((f) => Number(/scan_page:\s*(\d+)/.exec(read(path.join(PUB, "pages", f)))[1]));
  eq("every physical scan is represented exactly once",
     [...pageScans].sort((a, b) => a - b), Array.from({ length: w.scans }, (_, i) => i + 1));

  const taFiles = fs.readdirSync(path.join(PUB, "articles")).filter((f) => f.endsWith(".md")).sort();
  const enFiles = fs.readdirSync(path.join(PUB, "translations/en")).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
  eq("Tamil article assemblies", taFiles.length, w.articles);
  eq("English article files", enFiles.length, w.articles);
  eq("generated articleCount", pub.articleCount, w.articles);
  eq("generated articles length", pub.articles.length, w.articles);
  eq("publication form", pub.subtype, w.subtype);
  eq("generated data records the reviewed pin", pub.sourceCommit, PIN);
  eq("provenance records the frozen tree", prov.sourceTree, w.tree);
  eq("controlling scan SHA-256", prov.source.scanSha256, w.sha);
  eq("controlling scan byte size", prov.source.scanFileSizeBytes, w.bytes);
  eq("controlling scan page count", prov.source.scanTotalPages, w.scans);

  check("article slugs are unique", new Set(pub.articles.map((a) => a.slug)).size === pub.articles.length);
  check("article numbers are unique", new Set(pub.articles.map((a) => a.number)).size === pub.articles.length);

  // ---- per article --------------------------------------------------------------------------------
  for (let i = 0; i < w.articles; i++) {
    const tag = `article ${i + 1}`;
    // Defensive: a missing article must produce a clean assertion failure, never a TypeError that
    // kills the run before it prints its report.
    const a = pub.articles[i];
    check(`${tag}: generated article is present`, !!a);
    if (!a) continue;
    const taFm = fmOf(path.join(PUB, "articles", taFiles[i]));
    const enFm = fmOf(path.join(PUB, "translations/en", enFiles[i]));

    // Status vocabulary: accepted DELIBERATELY and NARROWLY, never "anything goes".
    check(`${tag}: Tamil status is one of the frozen accepted statuses`, w.status.includes(taFm.status));
    check(`${tag}: Tamil status is NOT silently widened`, w.status.length === 1);
    eq(`${tag}: English translation_status`, enFm.translation_status, "verified");

    // Ordered scan runs — never flattened, never sorted.
    eq(`${tag}: scan runs match the frozen declaration`,
       a.scanRuns.map((r) => [r.from, r.to]), w.runs[i]);
    const declaredScans = w.runs[i].flatMap(([f, t2]) => {
      const step = t2 >= f ? 1 : -1; const out = [];
      for (let s = f; step > 0 ? s <= t2 : s >= t2; s += step) out.push(s);
      return out;
    });
    // The SOURCE assembly's own marker order must equal the declared order, so a reordering in
    // either the declaration or the generated data is caught.
    const srcScans = assemblyScans(path.join(PUB, "articles", taFiles[i]), false).map((x) => x.scan);
    check(`${tag}: source assembly cites ${declaredScans.length} scans`, srcScans.length > 0);
    eq(`${tag}: source assembly scan ORDER equals the declared order`, srcScans, declaredScans);

    // Generated block coverage, in order.
    const genScans = [];
    for (const b of a.tamil.blocks) for (const p of b.sourcePages) {
      if (!genScans.length || genScans[genScans.length - 1] !== p.scan) genScans.push(p.scan);
    }
    eq(`${tag}: generated Tamil block scan ORDER equals the source order`, genScans, declaredScans);
    check(`${tag}: no generated block cites an excluded scan`,
          !a.tamil.blocks.some((b) => b.sourcePages.some((p) => w.excluded.includes(p.scan))));

    // Printed-page evidence: the discriminant must match, and nothing may be invented.
    eq(`${tag}: printed-page witness kind`, a.printedPages.kind, w.printed[i]);
    if (w.printed[i] !== "range") {
      check(`${tag}: no printed range is invented`,
            a.printedPages.from === undefined && a.printedPages.to === undefined);
      check(`${tag}: the source's own qualification is carried`, typeof a.printedPages.note === "string" && a.printedPages.note.length > 0);
    }
    // Every printed value must come from a source marker — never inferred.
    const srcPrinted = new Map(assemblyScans(path.join(PUB, "articles", taFiles[i]), false).map((x) => [x.scan, x.printed]));
    check(`${tag}: every generated printed page equals the source marker (or is null)`,
          a.tamil.blocks.every((b) => b.sourcePages.every((p) => p.printed === (srcPrinted.get(p.scan) ?? null))));

    // Ordinals are archive reading ordinals here — never described as printed.
    eq(`${tag}: number source is the archive reading ordinal`, a.numberSource, "archive-ordinal");
    check(`${tag}: no printed contents-page title is invented`, a.contentsTitleTa === undefined);

    // Titles verbatim from the frozen source frontmatter.
    eq(`${tag}: Tamil title matches the frozen assembly`, a.titleTa, taFm.title_ta);
    eq(`${tag}: English title matches the released translation`, a.titleEn, enFm.title_en);

    // Presence → structure → equality.
    check(`${tag}: generated Tamil blocks are NON-EMPTY (${a.tamil.blocks.length})`, a.tamil.blocks.length > 0);
    check(`${tag}: generated English blocks are NON-EMPTY (${a.english.blocks.length})`, a.english.blocks.length > 0);
    const taBody = read(path.join(PUB, "articles", taFiles[i]));
    check(`${tag}: source Tamil assembly is NON-EMPTY`, taBody.length > 400);
    // Every generated Tamil block's text must appear verbatim in the frozen source assembly.
    {
      // Compare against the source with Markdown BLOCKQUOTE markers stripped. `> ` is syntax, not
      // text: a quoted verse is stored as its own lines in the assembly and the importer strips the
      // marker, so leaving it in here would report correct output as missing.
      const src = nfc(taBody).replace(/^>\s?/gm, "").replace(/\s+/g, " ");
      const missing = a.tamil.blocks.filter((b) => !src.includes(b.text.replace(/\s+/g, " ")));
      eq(`${tag}: every generated Tamil block is present verbatim in the source`, missing.length, 0);
    }
    // No archive annotation may have become body text.
    check(`${tag}: no generated block contains an HTML comment`,
          !a.tamil.blocks.some((b) => b.text.includes("<!--")) &&
          !a.english.blocks.some((b) => b.text.includes("<!--")));
    // Voice segments must concatenate back to the block exactly, and a mixed block is never a quote.
    check(`${tag}: every block carries at least one source page`,
          [...a.tamil.blocks, ...a.english.blocks].every((b) => Array.isArray(b.sourcePages) && b.sourcePages.length > 0));
    check(`${tag}: voice segments reconstruct every block verbatim`,
          [...a.tamil.blocks, ...a.english.blocks].every((b) => b.segments.map((s) => s.text).join("") === b.text));
    // INDEPENDENT voice check: the split is recomputed from the block text here, so a quotation
    // re-typed as Kalaignar's own words — or his framing re-typed as a quotation — is caught even
    // though the block still reconstructs verbatim and its mixedVoice flag agrees with itself.
    check(`${tag}: voice typing matches an independent re-segmentation of the block text`,
          [...a.tamil.blocks, ...a.english.blocks].every((b) => {
            const want = expectedVoices(b.text);
            return JSON.stringify(want.map((s) => [s.kind, s.text])) ===
                   JSON.stringify(b.segments.map((s) => [s.kind, s.text]));
          }));
    check(`${tag}: mixedVoice is set exactly when both voices are present`,
          [...a.tamil.blocks, ...a.english.blocks].every((b) => {
            const hasAuth = b.segments.some((s) => s.kind === "authored-text" && s.text.trim());
            const hasQuot = b.segments.some((s) => s.kind === "quoted-text");
            return b.mixedVoice === (hasAuth && hasQuot);
          }));
    // Translator notes stay outside the authored body.
    check(`${tag}: translator notes are carried outside the body`,
          a.english.notes.every((n) => n.notPartOfAuthoredText === true) &&
          !a.english.blocks.some((b) => a.english.notes.some((n) => n.text === b.text)));
  }

  // ---- publication-level absences and reading order -----------------------------------------------
  eq("controllingIsFirstEdition", pub.controllingIsFirstEdition, true);
  check("no reprint edition is invented", pub.controllingEdition === undefined);
  check("no publication-wide printed page count is invented", pub.printedPageCount === undefined);
  check("no project-rights block is invented", prov.projectRights === undefined);
  check("the source's own edition witnesses are recorded",
        Array.isArray(prov.source.editionWitnessesTa) && prov.source.editionWitnessesTa.length > 0);
  // Each of these publications records at least one source-witness distinction the integration must
  // preserve — an author-initial spacing witness, or the absence of a printed contents page.
  check("source title/contents witness notes are preserved",
        Array.isArray(prov.source.titleWitnessNotes) && prov.source.titleWitnessNotes.length > 0);
  check("the locked exclusions are recorded",
        Array.isArray(prov.source.lockedExclusions) && prov.source.lockedExclusions.length > 0);
  eq("provenance article map length", prov.source.articleMap.length, w.articles);
  check("every article-map row is an archive ordinal",
        prov.source.articleMap.every((m) => m.numberSource === "archive-ordinal"));

  if (w.readingOrder) {
    eq("reconstructed reading order is preserved", pub.readingOrder, w.readingOrder);
    check("the reading order is NOT numeric scan order",
          JSON.stringify(pub.readingOrder) !== JSON.stringify([...pub.readingOrder].sort((x, y) => x - y)));
    // and it must equal the archive's own reading_order fields
    const fromArchive = pageFiles
      .map((f) => read(path.join(PUB, "pages", f)))
      .map((t) => [Number(/scan_page:\s*(\d+)/.exec(t)[1]), Number(/reading_order:\s*(\d+)/.exec(t)[1])])
      .sort((x, y) => x[1] - y[1]).map(([s]) => s);
    eq("reading order equals the archive's own reading_order fields", pub.readingOrder, fromArchive);
    check("source damage is recorded and not reconstructed", !!prov.source.physicalCondition);
    check("the no-reconstruction policy is stated",
          /not reconstructed|NOT reconstructed/.test(prov.source.physicalCondition.reconstructionPolicy));
  } else {
    check("no reading-order reconstruction is invented", pub.readingOrder === undefined);
  }
}

// ── 3. CATALOGUE AND ROUTES ─────────────────────────────────────────────────────────────────────────
group("CATALOGUE AND ROUTES");
{
  const lib = read(path.join(process.cwd(), "data/library.ts"));
  const essays = read(path.join(process.cwd(), "data/essays.ts"));
  for (const w of WORKS) {
    check(`${w.slug} is registered in ESSAY_SLUGS`, new RegExp(`"${w.slug}"`).test(essays));
    const start = lib.indexOf(`id: "${w.slug}"`);
    check(`${w.slug} has exactly one catalogue entry`,
          start !== -1 && lib.indexOf(`id: "${w.slug}"`, start + 1) === -1);
    const next = lib.indexOf("\n  {", start);
    const entry = lib.slice(start, next === -1 ? lib.length : next);
    check(`${w.slug}: catalogue entry carries the reviewed pin`, entry.includes(PIN));
    check(`${w.slug}: catalogue invents NO edition`, !/\bedition:/.test(entry));
    check(`${w.slug}: catalogue invents NO unitCount`, !/\bunitCount:/.test(entry));
    check(`${w.slug}: catalogue invents NO rights block`, !/\brights:/.test(entry));
    check(`${w.slug}: English marked project-created`, entry.includes('englishKind: "project-created"'));
  }
  check(`${REFERENCE} remains catalogued`, lib.includes(`id: "${REFERENCE}"`));
  check(`${REFERENCE} remains in ESSAY_SLUGS`, essays.includes(`"${REFERENCE}"`));
  const sitemap = read(path.join(process.cwd(), "app/sitemap.ts"));
  check("essay routes are driven by ESSAY_SLUGS, not hard-coded", sitemap.includes("ESSAY_SLUGS"));
  eq("no Wave-3 slug is hard-coded into the sitemap",
     WORKS.filter((w) => sitemap.includes(w.slug)).length, 0);
}

// ── 4. REFERENCE REGRESSION ─────────────────────────────────────────────────────────────────────────
group("SAKKARAVARTHTHIYIN THIRUMAGAN REGRESSION");
{
  const pub = JSON.parse(read(path.join(DATA, REFERENCE, "publication.json")));
  const prov = JSON.parse(read(path.join(DATA, REFERENCE, "provenance.json")));
  eq("keeps its own EARLIER source pin", pub.sourceCommit, REFERENCE_PIN);
  eq("still 14 articles", pub.articleCount, 14);
  eq("still an essay-collection", pub.subtype, "essay-collection");
  check("keeps its reprint distinction", pub.controllingIsFirstEdition === false && !!pub.controllingEdition);
  check("keeps its first-edition record", !!pub.firstEdition && pub.firstEdition.year === 1956);
  eq("keeps its printed page count", pub.printedPageCount, 80);
  check("keeps its project-rights record", !!prov.projectRights);
  check("its ordinals remain PRINTED contents numbers",
        pub.articles.every((a) => a.numberSource === "printed-contents"));
  check("its contents-page title witnesses survive",
        pub.articles.some((a) => a.contentsTitleTa));
  check("every article is one contiguous ascending run",
        pub.articles.every((a) => a.scanRuns.length === 1 && a.scanRuns[0].to >= a.scanRuns[0].from));
  check("every article keeps a printed range", pub.articles.every((a) => a.printedPages.kind === "range"));
  check("mixed-voice blocks survive", pub.articles.some((a) => a.tamil.blocks.some((b) => b.mixedVoice)));
  check("no anthology/pamphlet-only field is attached",
        pub.readingOrder === undefined && prov.source.physicalCondition === undefined);
}

// ── REPORT ──────────────────────────────────────────────────────────────────────────────────────────
const total = results.reduce((n, r) => n + r.n, 0);
const failed = results.reduce((n, r) => n + r.fails.length, 0);
console.log("\n" + "─".repeat(74));
for (const r of results) {
  console.log(`  ${r.name.padEnd(46)} ${r.fails.length ? "FAIL" : "PASS"}  (${r.n} assertions, ${r.fails.length} failed)`);
}
console.log("─".repeat(74));
console.log(`  wave3-essays — ${total} assertions, ${failed} failed across ${results.length} groups`);
if (failed) {
  console.log("\n  failed assertions:");
  for (const r of results) for (const f of r.fails) console.log(`    · ${r.name} — ${f}`);
}
console.log(`\nBATCH RESULT: ${failed ? "FAILURES PRESENT" : "ALL PASS"}\n`);
process.exitCode = failed ? 1 : 0;
