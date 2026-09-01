// Source-linked BATCH validator for the four dramatic works of கலைஞரின் நான்மணி மாலை.
//
//   node scripts/validate-naanmani-malai-plays.mjs <kalaignar-stage-plays-clone>
//
// One coherent released batch, one validation step — but every work is validated INDEPENDENTLY and
// reported with its own PASS/FAIL, so a failure names the work rather than the batch. Any single
// work failing fails the process.
//
// It is source-linked and fail-closed: it re-derives its expectations from the pinned source tree
// rather than from the generated data, and refuses to run unless the clone is checked out at the
// exact commit the released provenance records.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-naanmani-malai-plays.mjs <stage-plays-clone>");
  process.exit(1);
}

const PIN = "145e52e88dbd009286f749a7f0e3520386e63244";
const SCAN_FILENAME = "TVA_BOK_0065576_நான்மணி_மாலை.pdf";
const SCAN_SHA256 = "18d2b1405544b03507e9f92067d287cb28f5a92eaf02bed7054e6e78e5e38c89";
const SCAN_SIZE = 146754449;
const SCAN_PAGES = 54;

const nfc = (s) => s.normalize("NFC");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));
const DATA = path.join(process.cwd(), "public/data/plays");
const IMPORTER = path.join(process.cwd(), "scripts/import-naanmani-malai-plays.mjs");
const LIBRARY = readText(path.join(process.cwd(), "data/library.ts"));
const PLAYS_TS = readText(path.join(process.cwd(), "data/plays.ts"));
const SITEMAP = readText(path.join(process.cwd(), "app/sitemap.ts"));
const importerSrc = readText(IMPORTER);

const WORKS = [
  { slug: "bharathayanam", titleTa: "பரதாயணம்", titleEn: "Bharathayanam", scans: [6, 17], structure: "continuous-play", scenes: 0, files: [], witness: false, unitCount: null },
  { slug: "anarkali", titleTa: "அனார்கலி", titleEn: "Anarkali", scans: [18, 26], structure: "scene-sequence", scenes: 4, files: ["01", "02", "03", "04"], witness: true, unitCount: 4 },
  { slug: "socrates", titleTa: "சாக்ரடீஸ்", titleEn: "Socrates", scans: [27, 43], structure: "scene-sequence", scenes: 5, files: ["01", "02", "03", "04", "05"], witness: true, unitCount: 5, introPages: [27, 28] },
  { slug: "cheran-senguttuvan", titleTa: "சேரன் செங்குட்டுவன்", titleEn: "Cheran Senguttuvan", scans: [44, 53], structure: "scene-sequence", scenes: 4, files: ["01", "02", "03", "04"], witness: true, unitCount: 4 },
];

// ── per-work result collection ───────────────────────────────────────────────────────────────────
let cur = null;
const results = [];
const check = (cond, msg) => {
  cur.n++;
  if (!cond) cur.fails.push(msg);
  console.log((cond ? "    ok  " : "  FAIL  ") + msg);
};
const eq = (msg, a, b) => check(JSON.stringify(a) === JSON.stringify(b), `${msg} (${JSON.stringify(a)} === ${JSON.stringify(b)})`);

// ── BATCH-WIDE PRECONDITIONS ─────────────────────────────────────────────────────────────────────
cur = { slug: "batch preconditions", n: 0, fails: [] };
console.log("\nBATCH PRECONDITIONS");

let head = "", dirty = "?";
try { head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch {}
try { dirty = execFileSync("git", ["-C", SRC_REPO, "status", "--porcelain"], { encoding: "utf8" }).trim(); } catch {}
check(head === PIN, `source clone HEAD is exactly the pinned commit ${PIN.slice(0, 8)}`);
check(dirty === "", "source clone working tree is clean — the source repository is unmodified");
if (head !== PIN) {
  // Everything below re-derives from the source tree; validating against the wrong tree would be
  // meaningless, so this stops rather than reporting confident nonsense.
  console.log("\nBATCH RESULT: CANNOT VALIDATE — source clone is not at the pinned commit");
  process.exit(2);
}

const REG = path.join(SRC_REPO, "sources/naanmani-malai-tamil");
const regMeta = readText(path.join(REG, "metadata/source.md"));
const regReadme = readText(path.join(REG, "README.md"));
const coverage = readText(path.join(REG, "COVERAGE_AUDIT.md"));
const englishClosure = readText(path.join(REG, "ENGLISH_PHASE_CLOSURE_AUDIT.md"));
check(regMeta.includes(SCAN_SHA256), "composite source metadata records the pinned scan SHA-256");
check(nfc(regMeta).includes(nfc(SCAN_FILENAME)), "composite source metadata records the pinned scan filename");
check(/Scan pages:\s*\*\*54\*\*/.test(regMeta), "composite source records 54 scan pages");
check(regMeta.includes("No standalone publication year has been established"), "composite source states NO publication year is established");
check(/Status:\s*\*\*PASS \/ COMPLETE\*\*/.test(coverage), "composite 54-scan coverage audit is PASS / COMPLETE");
check(/Status:\s*\*\*PASS \/ COMPLETE\*\*/.test(englishClosure), "composite English-phase closure audit is PASS / COMPLETE");
check(/Count:\s*\*\*4 \/ 4 independent English translations COMPLETE\*\*/.test(regReadme), "composite registry reports 4/4 independent English translations complete");
// The batch must never absorb the work whose source processing is still active upstream.
check(fs.existsSync(path.join(SRC_REPO, "works/manimagudam")), "மணிமகுடம் exists upstream (so its exclusion is a real exclusion)");
check(!fs.existsSync(path.join(DATA, "manimagudam")), "மணிமகுடம் is NOT imported — its source processing is still active");
check(!new RegExp('"manimagudam"').test(PLAYS_TS), "மணிமகுடம் is not registered in PLAY_SLUGS");
check(!new RegExp('"manimagudam"').test(LIBRARY), "மணிமகுடம் has no catalogue entry");
check(!/works\/manimagudam\//.test(importerSrc), "the importer reads no file inside மணிமகுடம் — it only probes that the directory exists, to prove the exclusion is real");
// The batch importer must never open the 2009 published English witness.
check(!/one-act-plays-2009/.test(importerSrc.replace(/^\s*\/\/.*$/gm, "")), "the importer never reads the 2009 published English witness tree");
check(/rev-parse", "HEAD"/.test(importerSrc) && /source-commit mismatch/.test(importerSrc), "the importer retains its fail-closed source-HEAD guard");
// The batch checkout must stay independent of Silappathikaram's older, different pin.
const silapProv = JSON.parse(readText(path.join(DATA, "silappathikaram-nataka-kappiyam/provenance.json")));
check(silapProv.sourceCommit !== PIN, `Silappathikaram keeps its own different pin (${silapProv.sourceCommit.slice(0, 8)}), not the batch pin`);
results.push(cur);

// ── PER-WORK VALIDATION ──────────────────────────────────────────────────────────────────────────
/** Re-derive a source file's reading body the way the importer bounds it. */
const TA_APPARATUS = new Set(["Assembly notes", "Visual text fidelity review", "Page-record fidelity review", "Provenance and page-boundary handling"]);
const EN_APPARATUS = new Set(["Translation notes", "Dravidian movement resonance — interpretive note"]);

function sourceBody(text, { english }) {
  const m = /^---\n[\s\S]*?\n---\n/.exec(text);
  const body = text.slice(m[0].length);
  const apparatus = english ? EN_APPARATUS : TA_APPARATUS;
  const out = [];
  const heads = [];
  for (const chunk of body.split("\n\n").map((x) => x.replace(/^\n+/, "").replace(/\s+$/, "")).filter((x) => x.trim())) {
    const t = chunk.trim();
    const h = /^(#{1,6})\s+(.*)$/.exec(t.split("\n")[0]);
    if (h) {
      const txt = h[2].trim();
      if (apparatus.has(txt)) { if (!english) break; else return { texts: out, heads, stopped: true }; }
      heads.push({ level: h[1].length, text: txt, index: out.length });
      continue;
    }
    out.push(chunk);
  }
  return { texts: out, heads, stopped: false };
}
/** English apparatus ends the reading body too, but its notes follow, so cut at the first one. */
function sourceBodyEn(text) {
  const m = /^---\n[\s\S]*?\n---\n/.exec(text);
  const body = text.slice(m[0].length);
  const out = [];
  const heads = [];
  for (const chunk of body.split("\n\n").map((x) => x.replace(/^\n+/, "").replace(/\s+$/, "")).filter((x) => x.trim())) {
    const t = chunk.trim();
    const h = /^(#{1,6})\s+(.*)$/.exec(t.split("\n")[0]);
    if (h) {
      const txt = h[2].trim();
      if (EN_APPARATUS.has(txt)) break;
      heads.push({ level: h[1].length, text: txt, index: out.length });
      continue;
    }
    out.push(chunk);
  }
  return { texts: out, heads };
}
/**
 * A page record's `## Printed text` paragraphs, verbatim — extracted INDEPENDENTLY of the importer.
 *
 * This previously used the same whitespace-delimited pattern the importer did. Both terminated at
 * the blank line under the heading and returned nothing, so the "verbatim" comparison below became
 * `[] === []` and certified a section the source demonstrably fills. The boundary is now the next
 * H2 (or EOF), and `expectNonEmpty` makes an empty extraction a failure rather than an answer.
 */
function pageRecordText(file) {
  const t = readText(file);
  const body = t.slice(/^---\n[\s\S]*?\n---\n/.exec(t)[0].length);
  const HEAD = "## Printed text";
  const at = body.indexOf(HEAD);
  if (at === -1) return [];
  const after = body.slice(at + HEAD.length);
  const nextH2 = after.search(/^## /m);
  const section = nextH2 === -1 ? after : after.slice(0, nextH2);
  return section.split("\n\n").map((x) => x.replace(/^\n+/, "").replace(/\s+$/, "")).filter((x) => x.trim());
}
/** The rendered text of a unit list, for verbatim comparison. */
const unitText = (u) => (u.kind === "dialogue" && u.speakerAsPrinted !== null ? u.speakerAsPrinted + u.speakerSeparator + u.text : u.text);

for (const W of WORKS) {
  cur = { slug: W.slug, n: 0, fails: [] };
  console.log(`\n${W.titleEn.toUpperCase()} — ${W.titleTa}`);
  const dir = path.join(SRC_REPO, "works", W.slug);
  const out = path.join(DATA, W.slug);

  check(fs.existsSync(dir), "target work exists in the pinned source");
  check(fs.existsSync(path.join(out, "play.json")) && fs.existsSync(path.join(out, "provenance.json")), "generated play.json and provenance.json exist");
  const play = JSON.parse(readText(path.join(out, "play.json")));
  const prov = JSON.parse(readText(path.join(out, "provenance.json")));

  // 1. source identity and pin
  eq("source repository", play.sourceRepo, "pugazg/kalaignar-stage-plays");
  eq("source path", play.sourcePath, `works/${W.slug}`);
  eq("source commit is the historical batch pin", play.sourceCommit, PIN);
  eq("provenance carries the same pin", prov.sourceCommit, PIN);
  eq("controlling scan filename", prov.source.scanFilename, SCAN_FILENAME);
  eq("controlling scan SHA-256", prov.source.scanSha256, SCAN_SHA256);
  eq("controlling scan byte size", prov.source.scanFileSizeBytes, SCAN_SIZE);
  eq("controlling scan page count", prov.source.scanTotalPages, SCAN_PAGES);
  check(prov.source.sourcePdfCommitted === false, "the source PDF is not committed and not vendored");

  // 2. scan range, and the composite matter that belongs to no play
  const meta = readText(path.join(dir, "metadata/source.md"));
  check(new RegExp(`Work scan range:\\s*\\*\\*${W.scans[0]}–${W.scans[1]}\\*\\*`).test(meta), `work metadata records scan range ${W.scans[0]}–${W.scans[1]}`);
  const citedScans = play.readingUnits.flatMap((u) => u.sourceScans).concat(play.openingNote ? play.openingNote.sourceScans : []);
  check(Math.min(...citedScans) >= W.scans[0] && Math.max(...citedScans) <= W.scans[1], "every cited scan lies inside the work's declared range");
  check(!citedScans.includes(54), "no reading unit cites scan 54 (composite back matter)");
  check(!citedScans.some((s) => s >= 1 && s <= 5), "no reading unit cites the composite's shared front matter (scans 1–5)");

  // 3. archive completion gates, read from the source
  const readme = readText(path.join(dir, "README.md"));
  check(/PASS/.test(readme), "work README still reports its fidelity gates as PASS");
  const yearLine = /^-\s*Publication year:\s*(.*)$/m.exec(meta);
  check(!yearLine || /not established/.test(yearLine[1]), "the work establishes NO publication year");
  eq("no year is recorded in the generated data", play.edition.year, null);
  check(!/edition:/.test(new RegExp(`id: "${W.slug}"[\\s\\S]*?provenanceHref: "[^"]*"`).exec(LIBRARY)?.[0] ?? "edition:"), "the catalogue entry carries NO invented edition statement");

  // 4. structure — the heart of this batch
  eq("structure kind", play.structureKind, W.structure);
  eq("source-printed scene count", play.sceneCount, W.scenes);
  eq("closing tableau count", play.closingTableauCount, 0);
  eq("scan provenance kind", play.scanProvenance, "per-unit-group");
  check(!play.readingUnits.some((u) => u.sourcePages), "no unit claims per-unit scan precision the assembled source does not publish");

  if (W.structure === "continuous-play") {
    eq("exactly one reading unit", play.readingUnits.length, 1);
    eq("its kind is a continuous body", play.readingUnits[0].kind, "continuous-body");
    eq("its slug is the editorial navigation slug", play.readingUnits[0].slug, "continuous-play");
    check(play.readingUnits[0].order === null, "the continuous body carries NO scene number");
    check(play.sceneCount === 0, "the source scene count is 0 — not fabricated as 1");
    // NO "Scene 1" ANYWHERE in the generated data or the catalogue.
    // Scanned over the reading text, the unit identity and the catalogue entry — the places a
    // "Scene 1" would actually mislead. Provenance prose that exists precisely to FORBID the label
    // is excluded, or the assertion would fail on its own safeguard.
    const identity = JSON.stringify(play.readingUnits.map((u) => ({ s: u.slug, o: u.order, ht: u.headingTa, he: u.headingEn, tt: u.titleTa, te: u.titleEn })));
    const readingBlob = JSON.stringify(play.readingUnits.map((u) => [...u.tamil.units, ...u.english.units].map((x) => x.text)));
    for (const [where, blob] of [["reading text", readingBlob], ["unit identity", identity], ["catalogue entry", new RegExp(`id: "${W.slug}"[\\s\\S]*?provenanceHref: "[^"]*"`).exec(LIBRARY)[0]]]) {
      check(!/Scene 1\b/.test(blob) && !/scene-01|scene-1\b/.test(blob) && !/காட்சி\s*[-—]?\s*1/.test(blob), `no 'Scene 1' or scene-shaped slug in the ${where}`);
    }
    check(!!prov.source.continuousStructureNote, "provenance explains the continuous structure");
    // The archive's own record must still say the work has no scene.
    const taSrc = readText(path.join(dir, "scenes/continuous-play.md"));
    check(/^scene:\s*null\s*$/m.test(taSrc), "the source assembly still records `scene: null`");
    // Catalogue must carry no unit count.
    const entry = new RegExp(`id: "${W.slug}"[\\s\\S]*?provenanceHref: "[^"]*"`).exec(LIBRARY)[0];
    check(!/unitCount/.test(entry), "the catalogue entry carries NO unitCount");
  } else {
    eq("reading units are exactly the source scenes", play.readingUnits.map((u) => u.slug), W.files);
    check(play.readingUnits.every((u) => u.kind === "scene"), "every reading unit is a source scene");
    eq("scene numbers are 1..N in order", play.readingUnits.map((u) => u.order), W.files.map((_, i) => i + 1));
    check(!play.readingUnits.some((u) => u.kind === "continuous-body"), "no continuous body is invented");
    const entry = new RegExp(`id: "${W.slug}"[\\s\\S]*?provenanceHref: "[^"]*"`).exec(LIBRARY)[0];
    check(new RegExp(`unitCount: \\{ value: ${W.unitCount},`).test(entry), `the catalogue entry reports ${W.unitCount} scenes`);
  }

  // 5. printed pre-dramatic material is never a scene
  if (W.slug === "socrates") {
    check(!!play.openingNote, "the printed introductory note is carried");
    eq("it is attached to scene 1, not given a route", play.openingNote.attachedTo, "01");
    eq("it cites the source scans the archive verifies it on", play.openingNote.sourceScans, W.introPages);
    check(play.sceneCount === 5, "the scene count stays 5 — the note is not counted as a sixth");
    check(!play.readingUnits.some((u) => u.slug === "00-introduction" || u.slug === "00"), "the note has NO reading route of its own");
    check(!/Introduction scene|Scene 0\b/.test(JSON.stringify(play)), "no 'Introduction scene' or 'Scene 0' is invented");

    // ── ANTI-EMPTY GATE ────────────────────────────────────────────────────────────────────────
    // A validator must never be able to certify `[] === []` as "verbatim complete" for a source
    // section that demonstrably contains text. Each side is proved non-empty BEFORE they are
    // compared, and the per-page counts are asserted individually so a half-empty extraction
    // cannot hide inside a matching total either.
    const perPage = W.introPages.map((n) => pageRecordText(path.join(dir, "pages", `${String(n).padStart(4, "0")}.md`)));
    perPage.forEach((paras, i) => check(paras.length > 0, `source page ${W.introPages[i]} '## Printed text' extracts NON-EMPTY (${paras.length} paragraphs)`));
    const src = perPage.flat();
    check(src.length > 0, `the source-derived Tamil introductory note is NON-EMPTY (${src.length} paragraphs)`);
    const got = play.openingNote.tamil.units.map(unitText);
    check(got.length > 0, `the generated Tamil introductory note is NON-EMPTY (${got.length} units)`);
    eq("generated intro unit count equals the source-derived paragraph count", got.length, src.length);
    eq("the Tamil note is verbatim from the verified page records", got, src);

    // Source-sensitive spot guards, on BOTH sides.
    const OPENING = "ஃ சாக்ரடீஸ் கிரேக்கம் தந்த தத்துவாசிரியன்";
    check(nfc(src[0]).trimStart().startsWith(nfc(OPENING)), "the SOURCE intro opens with the expected printed form");
    check(nfc(got[0]).trimStart().startsWith(nfc(OPENING)), "the GENERATED intro opens with the expected printed form");
    check(src[src.length - 1].trim() === "*", "the SOURCE intro ends with the printed ornament *");
    const lastUnit = play.openingNote.tamil.units[play.openingNote.tamil.units.length - 1];
    check(lastUnit.kind === "ornament" && lastUnit.text.trim() === "*", "the GENERATED intro ends with the printed ornament *");
    const bracket = play.openingNote.tamil.units.filter((u) => u.kind === "stage-direction" && u.delimiter === "square");
    eq("the bracketed scan-28 setup is carried as one square stage-direction", bracket.length, 1);
    check(/முதற்காட்சி/.test(bracket[0]?.text ?? ""), "that bracketed setup is the source's own முதற்காட்சி description");
    // The archive reverted assistant substitutions to these readings; none may be normalised.
    const introText = nfc(got.join("\n"));
    for (const form of ["மார்க்சும், எஞ்சல்சும்", "ஹெகல்", "‘ஜாடை’ காட்டினான்", "தூசு நிகர் காரணங்களைக்கொண்டு", "‘சோக்ரதர்’", "ஆஸ்திகப்பழமாக்கியிருக்கிறார்", "நானோ", "சபைன்"]) {
      check(introText.includes(nfc(form)), `protected source form retained in the intro: ${form}`);
    }
    // The printed line structure is preserved, not assembled away.
    check(play.openingNote.tamil.units.some((u) => u.hasLineBreaks), "the intro keeps the source's printed line structure (no wraps joined)");
  } else if (W.slug === "cheran-senguttuvan") {
    check(!!play.openingNote, "the printed pre-scene framing is carried");
    eq("it is attached to scene 1", play.openingNote.attachedTo, "01");
    check(play.sceneCount === 4, "the scene count stays 4 — the framing is not counted as a scene");
  } else if (W.slug === "bharathayanam") {
    check(!!play.openingNote, "the printed opening note is carried");
    eq("it is attached to the continuous body", play.openingNote.attachedTo, "continuous-play");
  } else {
    check(!play.openingNote, "no opening note is invented for a work that prints none");
  }

  // 6. VERBATIM TAMIL AND ENGLISH — the fidelity gate
  if (W.structure === "continuous-play") {
    const ta = sourceBody(readText(path.join(dir, "scenes/continuous-play.md")), { english: false });
    const en = sourceBodyEn(readText(path.join(dir, "translations/en/continuous-play.md")));
    const gotTa = (play.openingNote.tamil.units.concat(play.readingUnits[0].tamil.units)).map(unitText);
    const gotEn = (play.openingNote.english.units.concat(play.readingUnits[0].english.units)).map(unitText);
    eq("Tamil reading body is verbatim and complete", gotTa, ta.texts);
    eq("English reading body is verbatim and complete", gotEn, en.texts);
  } else {
    let taAll = [], enAll = [], gotTa = [], gotEn = [];
    for (const stem of W.files) {
      const ta = sourceBody(readText(path.join(dir, "scenes", `${stem}.md`)), { english: false });
      const en = sourceBodyEn(readText(path.join(dir, "translations/en", `${stem}.md`)));
      taAll.push(...ta.texts); enAll.push(...en.texts);
      const u = play.readingUnits.find((x) => x.slug === stem);
      const note = play.openingNote && play.openingNote.attachedTo === stem ? play.openingNote : null;
      // Pre-scene framing was split off the front of scene 1; recombining must reproduce the file.
      gotTa.push(...(note && W.slug === "cheran-senguttuvan" ? note.tamil.units : []).concat(u.tamil.units).map(unitText));
      gotEn.push(...(note && W.slug === "cheran-senguttuvan" ? note.english.units : []).concat(u.english.units).map(unitText));
    }
    eq("Tamil reading bodies are verbatim and complete across all scenes", gotTa, taAll);
    eq("English reading bodies are verbatim and complete across all scenes", gotEn, enAll);
  }

  // 7. no archive apparatus, no secondary-witness leakage
  const readerText = JSON.stringify(
    play.readingUnits.map((u) => [...u.tamil.units, ...u.english.units].map(unitText))
      .concat(play.openingNote ? [[...play.openingNote.tamil.units, ...play.openingNote.english.units].map(unitText)] : []),
  );
  for (const a of ["Assembly notes", "Visual text fidelity review", "Page-record fidelity review", "Provenance and page-boundary handling", "assembled_from_verified_pages", "SECONDARY_WITNESS", "Jayabalan", "One Act Plays"]) {
    check(!readerText.includes(a), `no archive apparatus in the reading body: "${a}"`);
  }
  check(!/2009/.test(readerText), "no 2009 published-witness reference in the reading body");
  // Translation notes are apparatus and must stay outside the body.
  check(play.readingUnits.every((u) => u.english.notes.every((n) => n.kind === "translation-note" || n.kind === "interpretive-note")), "English apparatus is typed as notes, held outside the reading body");

  // 8. English authority
  eq("English is project-created", prov.english.kind, "project-created");
  check(/independent translation/.test(prov.english.independence), "provenance records the English as the archive's independent translation");
  if (W.witness) check(/SECONDARY COMPARISON WITNESS/.test(prov.english.secondaryWitnessNote), "provenance records the 2009 witness as secondary evidence only");
  else check(/NO Bharathayanam/.test(prov.english.secondaryWitnessNote), "provenance records that no 2009 witness applies to this work");
  for (const stem of (W.structure === "continuous-play" ? ["continuous-play"] : W.files)) {
    const enFm = readText(path.join(dir, "translations/en", `${stem}.md`));
    check(/^secondary_english_witness_used:\s*false\s*$/m.test(enFm), `English ${stem} declares the published witness was not used`);
    check(/^translation_review:\s*"?passed"?\s*$/m.test(enFm), `English ${stem} passed its translation review`);
  }

  // 9. rights scope
  const r = prov.projectRights;
  eq("rights apply to the underlying Kalaignar work", r.appliesTo, "underlying-work-authored-by-kalaignar");
  eq("rights status", r.rightsStatus, "nationalised-by-tamil-nadu-government");
  eq("rights authority", r.rightsAuthority, "Government of Tamil Nadu");
  eq("announcement date", r.rightsAnnouncementDate, "2024-08-22");
  eq("GO number is unverified", r.governmentOrderNumber, null);
  eq("GO issue date is unverified", r.governmentOrderDate, null);
  eq("GO handover date", r.governmentOrderHandoverDate, "2024-12-22");
  check(/project-created English translation/.test(r.thirdPartyNote), "rights exclude the project-created English translation");
  check(/imprint matter/.test(r.thirdPartyNote), "rights exclude the volume's imprint matter");
  if (W.witness) check(!!r.publishedWitnessNote && /THIRD PARTY/.test(r.publishedWitnessNote), "rights exclude the third-party 2009 published English");
  else check(!r.publishedWitnessNote, "no third-party witness claim is made where no witness exists");
  const entry = new RegExp(`id: "${W.slug}"[\\s\\S]*?provenanceHref: "[^"]*"`).exec(LIBRARY)[0];
  check(/nationalised-by-tamil-nadu-government/.test(entry), "the catalogue entry carries the nationalisation status");
  check(/does not extend to the\s*\n?\s*"?\s*project-created English translation|does not extend to the project-created English/.test(entry.replace(/\s+/g, " ")), "the catalogue rights note excludes the project English");

  // 10. catalogue identity and route registry
  for (const [label, v] of [["id", `id: "${W.slug}"`], ["slug", `slug: "${W.slug}"`], ["shelf", 'shelf: "drama"'], ["subtype", 'subtype: "stage-play"'], ["readerStructure", 'readerStructure: "stage-play"'], ["href", `href: "/plays/${W.slug}"`], ["state", 'state: "published"'], ["provenanceHref", `provenanceHref: "/plays/${W.slug}/source"`], ["sourcePath", `sourcePath: "works/${W.slug}"`], ["pin", `sourceCommit: "${PIN}"`], ["tamil", 'tamil: "complete"'], ["english", 'english: "complete"'], ["englishKind", 'englishKind: "project-created"']]) {
    check(entry.includes(v), `catalogue ${label} exact`);
  }
  check(entry.includes(`titleTa: "${W.titleTa}"`) && entry.includes(`titleEn: "${W.titleEn}"`), "catalogue titles exact");
  check(new RegExp(`"${W.slug}",`).test(PLAYS_TS), "the slug is registered in PLAY_SLUGS");
  // The sitemap must derive routes from generated data, never name a work.
  check(!new RegExp(W.slug).test(SITEMAP), "app/sitemap.ts names no work-specific route for this work");

  results.push(cur);
}

// ── BATCH-WIDE OPENING-NOTE GATE ─────────────────────────────────────────────────────────────────
cur = { slug: "batch opening notes", n: 0, fails: [] };
console.log("\nBATCH OPENING NOTES");
for (const W of WORKS) {
  const play = JSON.parse(readText(path.join(DATA, W.slug, "play.json")));
  if (!play.openingNote) { check(true, `${W.titleEn}: prints no pre-dramatic material — none invented`); continue; }
  // Applies to EVERY work, not just the one that failed: an opening note that exists must carry
  // text in both layers, or it is a silent loss of source material.
  check(play.openingNote.tamil.units.length > 0, `${W.titleEn}: Tamil opening note is NON-EMPTY (${play.openingNote.tamil.units.length} units)`);
  check(play.openingNote.english.units.length > 0, `${W.titleEn}: English opening note is NON-EMPTY (${play.openingNote.english.units.length} units)`);
  check(play.openingNote.sourceScans.length > 0, `${W.titleEn}: the opening note cites its source scans`);
}
results.push(cur);

// ── SITEMAP / ROUTE CONTRACT ─────────────────────────────────────────────────────────────────────
cur = { slug: "batch route contract", n: 0, fails: [] };
console.log("\nBATCH ROUTE CONTRACT");
check(/loadPlayReadingUnitSlugs/.test(SITEMAP), "the sitemap loader is named for reading units, not scenes");
check(/play\.readingUnits\.map/.test(SITEMAP), "the sitemap derives routes from the generated reading-unit registry");
let expected = 0;
for (const W of WORKS) {
  const play = JSON.parse(readText(path.join(DATA, W.slug, "play.json")));
  expected += 2 + play.readingUnits.length;
}
eq("the batch contributes exactly 22 public routes (4 landings + 4 source pages + 14 reading units)", expected, 22);
results.push(cur);

// ── REPORT ───────────────────────────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(72));
let failed = 0;
for (const r of results) {
  const ok = r.fails.length === 0;
  if (!ok) failed++;
  const w = WORKS.find((x) => x.slug === r.slug);
  const name = w ? w.titleEn : r.slug;
  console.log(`${name.toUpperCase().padEnd(24)} ${ok ? "PASS" : "FAIL"}  (${r.n} assertions, ${r.fails.length} failed)`);
  for (const f of r.fails) console.log(`    ✗ ${f}`);
}
const total = results.reduce((n, r) => n + r.n, 0);
const totalFails = results.reduce((n, r) => n + r.fails.length, 0);
console.log("─".repeat(72));
console.log(`naanmani-malai-plays — ${total} assertions, ${totalFails} failed across ${results.length} groups`);
console.log(`BATCH RESULT: ${failed === 0 ? "ALL PASS" : `${failed} GROUP(S) FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
