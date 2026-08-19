// Deterministic source-vs-vendored validation for அறப்போர் / Arappor (Phase 3, third benchmark —
// the first speech whose examined source establishes NO date, venue or event).
// Proves source identity, the source-ABSENCE contract, text fidelity, the explicit 16-transition
// boundary model (no punctuation / speaker-count / semantic-continuity heuristics), the English
// anchor audit, and the shared-UI regressions that keep the other two benchmarks correct.
// Usage: node scripts/validate-arappor.mjs <public-speeches-clone>

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) { console.error("usage: node scripts/validate-arappor.mjs <public-speeches-clone>"); process.exit(1); }
const SPEECH_DIR = path.join(SRC_REPO, "speeches/arappor");
const OUT_DIR = path.join(process.cwd(), "public/data/speeches/arappor");
const VEND = path.join(OUT_DIR, "speech.json");
const PROV = path.join(OUT_DIR, "provenance.json");
const IMPORTER = path.join(process.cwd(), "scripts/import-arappor.mjs");

const fails = [];
const check = (cond, msg) => { console.log((cond ? "  ok  " : "FAIL  ") + msg); if (!cond) fails.push(msg); };

const meta = JSON.parse(fs.readFileSync(path.join(SPEECH_DIR, "metadata.json"), "utf8"));
const tamilSrc = fs.readFileSync(path.join(SPEECH_DIR, "transcription-ta.md"), "utf8");
const englishSrc = fs.readFileSync(path.join(SPEECH_DIR, "translation-en.md"), "utf8");
const speech = JSON.parse(fs.readFileSync(VEND, "utf8"));
const prov = JSON.parse(fs.readFileSync(PROV, "utf8"));
const importerSrc = fs.readFileSync(IMPORTER, "utf8");
const readerSrc = fs.readFileSync(path.join(process.cwd(), "components/SpeechReader.tsx"), "utf8");
const sourceCompSrc = fs.readFileSync(path.join(process.cwd(), "components/SpeechSource.tsx"), "utf8");
const pageSrc = fs.readFileSync(path.join(process.cwd(), "app/speeches/[slug]/page.tsx"), "utf8");
const librarySrc = fs.readFileSync(path.join(process.cwd(), "data/library.ts"), "utf8");

const PAGE_RE = /^###\s+PDF page\s+(\d+)\s*[-—]\s*printed page\s+(\d+)\s*$/;
// EXPECTED audited Tamil boundary map (printed toPage → [relation, join]).
const EXPECT = {
  4: ["unknown", "end"], 5: ["same-paragraph", "space"], 6: ["unknown", "end"], 7: ["unknown", "end"],
  8: ["unknown", "end"], 9: ["same-paragraph", "space"], 10: ["same-paragraph", "space"], 11: ["unknown", "end"],
  12: ["unknown", "end"], 13: ["unknown", "end"], 14: ["unknown", "end"], 15: ["unknown", "end"],
  16: ["same-paragraph", "space"], 17: ["same-paragraph", "space"], 18: ["unknown", "end"], 19: ["unknown", "end"],
};
// The five cross-page word splits audit.md documents, and the printed page each ENTERS.
const WORD_SPLITS = { 5: "மௌனம்", 9: "நடராஜன்", 10: "அதற்காக", 16: "சுப்பராயன்", 17: "கடைசியாக" };
const UNKNOWN_PAGES = Object.entries(EXPECT).filter(([, v]) => v[0] === "unknown").map(([k]) => Number(k)).sort((a, b) => a - b);

function sourceBody(text, startHeading) {
  const body = text.split(startHeading)[1].split("\n## ")[0];
  const texts = [], notes = [], pages = new Set();
  let started = false;
  for (const raw of body.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    let m;
    if ((m = line.match(PAGE_RE))) { started = true; pages.add(Number(m[2])); continue; }
    if (!started) continue;
    if (line.trim() === "" || /^-{3,}$/.test(line) || line.trim().startsWith("|")) continue;
    if ((m = line.match(/^####\s+(.*)$/))) { texts.push(m[1].trim()); continue; }
    if ((m = line.match(/^>\s?(.*)$/))) { notes.push(m[1].trim()); continue; }
    if (/^#{1,3}\s+/.test(line)) continue;
    texts.push(line);
  }
  return { texts, notes, pages };
}
const srcTa = sourceBody(tamilSrc, "## Speech body");
const srcEn = sourceBody(englishSrc, "## Speech body");

function vendPieces(stream) {
  const texts = [], notes = [], pages = new Set(), unresolvedBreaks = [];
  for (const b of stream.blocks) {
    if (b.kind === "heading") { texts.push(b.text); if (b.sourcePage != null) pages.add(b.sourcePage); }
    else if (b.kind === "note") { notes.push(b.text); if (b.sourcePage != null) pages.add(b.sourcePage); }
    else if (b.kind === "unresolved-break") { unresolvedBreaks.push(b); if (b.toPage != null) pages.add(b.toPage); }
    else if (b.kind === "paragraph") for (const s of b.segments) { texts.push(s.text); if (s.sourcePage != null) pages.add(s.sourcePage); }
  }
  return { texts, notes, pages, unresolvedBreaks };
}
const vTa = vendPieces(speech.tamil);
const vEn = vendPieces(speech.english);
const renderPara = (p) => p.segments.map((s, i) => (i === 0 ? "" : p.segments[i - 1].joinToNext === "space" ? " " : p.segments[i - 1].joinToNext === "unknown" ? "␝" : "") + s.text).join("");

// ── SOURCE IDENTITY ───────────────────────────────────────────────────────────
check(speech.sourceRepo === "pugazg/kalaignar-public-speeches" && speech.sourcePath === "speeches/arappor" && speech.sourceCommit === "1ef73a709a343390befe55dcdfb029427f527bf4" && prov.sourceCommit === speech.sourceCommit, "1. exact source repo / path / pinned commit 1ef73a70 (speech + provenance)");
const nfc = (x) => x.normalize("NFC");
check(nfc(prov.source.scanFilename) === nfc(meta.source.filename) && nfc(prov.source.scanFilename) === nfc("TVA_BOK_0064122_அறப்போர்.pdf"), "2. exact controlling scan filename (Unicode-normalized compare)");
check(prov.source.scanSha256 === meta.source.sha256 && prov.source.scanSha256 === "8172cf4f04e804ebbcfe1b1e236c9d41bda2e07377952c162be4e4bb098ce01c", "3. exact scan SHA-256");
check(prov.source.scanFileSizeBytes === 31769752, "4. exact scan file size 31,769,752 bytes");
check(prov.source.scanTotalPages === 22, "5. 22 total PDF pages");
check(prov.source.speechScanPages === "4–20" && prov.source.frontMatterScanPages === "1–3" && prov.source.advertisementScanPages === "21–22", "6. body PDF 4–20, front matter 1–3, back matter 21–22");
check(prov.source.printedSpeechPages === "3–19", "7. printed speech pages 3–19");
check(JSON.stringify(speech.sourcePages) === JSON.stringify(Array.from({ length: 17 }, (_, i) => i + 3)) && prov.archiveDerived.sourcePagesCovered === 17, "8. exactly 17 source-body pages, printed 3–19, none omitted/duplicated");

// ── SOURCE-ABSENCE CONTRACT ───────────────────────────────────────────────────
check(speech.date === null && speech.year === null, "9. speech date and year are null (source states none)");
check(speech.venue == null && speech.event == null && speech.occasion == null && speech.audience == null, "9b. venue / event / occasion / audience absent (none inferred)");
const allJson = JSON.stringify(speech) + JSON.stringify(prov);
check(!/"date"\s*:\s*"1949/.test(JSON.stringify(speech)) && speech.date !== "1949-04", "10. April 1949 is NOT substituted as a speech date");
check(prov.source.editionTa.includes("1949") && prov.source.publicationDate.startsWith("1949"), "10b. April 1949 retained as publication/edition context");
check(Array.isArray(prov.source.speechFactsNotStated) && prov.source.speechFactsNotStated.length === 3, "11. provenance explicitly records the three not-stated speech facts");
check(!prov.blockers.some((b) => /date|venue|event/i.test(b.item)), "11b. absent date/venue/event are NOT recorded as blockers (they are source facts)");
const arapporCatalog = librarySrc.split('id: "arappor"')[1]?.split("},")[0] ?? "";
check(!/1949 speech|1949-05|speech of 1949/i.test(arapporCatalog), "12. Arappor catalog copy makes no '1949 speech' claim");
check(/publication\/edition|second-edition booklet|இரண்டாம் பதிப்பில்/.test(arapporCatalog), "12b. Arappor catalog presents 1949 as publication/edition context");
check(!/null|undefined/.test(vTa.texts.join(" ") + vEn.texts.join(" ")), "13. no literal null/undefined in imported canonical text");

// ── TEXT FIDELITY ─────────────────────────────────────────────────────────────
check(vTa.texts.join("␟") === srcTa.texts.join("␟"), "14. Tamil canonical text verbatim == strict-verified transcription body");
const enBodyTexts = vEn.texts;
check(enBodyTexts.join("␟") === srcEn.texts.join("␟"), "15. English canonical text verbatim == verified translation body");
// Audit-confirmed readings. For the printed p.9 quotation the discriminating token is
// `மொழிக்கும்தான்` (the superseded reading was the semantically different `மொழிக்கு மட்டும்`);
// the audit quotes it with a following word that is not contiguous in the printed line.
const HARD = ["வோட்டுகளே", "எம் மீது எவிய", "ஏற்றதுதானு?", "சிவகசிந்தாமணியைக்", "துடுப்புக்குச்சியை", "தீவட்டியுங்", "மார்க்குடியில்", "தெரித்தாலும்", "மொழிக்கும்தான்"];
const taAll = vTa.texts.join("\n");
check(HARD.every((h) => taAll.includes(h)), `16. audit-confirmed difficult source readings preserved (${HARD.length} checked)`);
const SUPERSEDED = ["வோட்டுக்களே", "மற்றுக் கட்சியினர்", "ஏற்றதுதானா?", "சிவசிந்தாமணியைக்", "துடுப்புக்குச் சிலை", "திவட்டியுங்", "இரண்டாம் மொழிக்கு மட்டும் கட்டாயம்", "தலைபிழந்த", "ஊமையாயிற்று"];
check(SUPERSEDED.every((x) => !taAll.includes(x)), "17. no superseded pre-audit reading survives in canonical Tamil");
check(vEn.notes.length >= 1 && vEn.notes.join(" ").includes("controlling archival layer"), "18. translator/source notes preserved as notes, not speech prose");

// ── TAMIL BOUNDARY MODEL ──────────────────────────────────────────────────────
check(Object.keys(EXPECT).length === 16, "19. exactly 16 Tamil source-page transitions (17 pages), each present once");
let relBad = [];
for (const [tp, [rel]] of Object.entries(EXPECT)) {
  const toPage = Number(tp);
  const spanned = speech.tamil.blocks.some((x) => x.kind === "paragraph" && x.sourcePages.includes(toPage) && x.sourcePages.includes(toPage - 1));
  const marker = vTa.unresolvedBreaks.some((u) => u.toPage === toPage);
  if (rel === "same-paragraph" && !spanned) relBad.push(`p→${toPage} expected same-paragraph run`);
  if (rel === "unknown" && (!marker || spanned)) relBad.push(`p→${toPage} expected unresolved-break`);
}
check(relBad.length === 0, `20. every transition matches its audited relation; no unknown relation is a semantic paragraph (${relBad.slice(0, 3).join("; ")})`);
check(/ev:/.test(importerSrc) && (importerSrc.match(/ev: "/g) || []).length >= 16, "21. every transition carries an explicit evidence note");
// the five documented word splits
let splitBad = [];
for (const [tp, word] of Object.entries(WORD_SPLITS)) {
  const toPage = Number(tp);
  const para = speech.tamil.blocks.find((x) => x.kind === "paragraph" && x.sourcePages.includes(toPage) && x.sourcePages.includes(toPage - 1));
  if (!para) { splitBad.push(`p→${toPage} not spanned`); continue; }
  const r = renderPara(para);
  if (!r.includes(word)) splitBad.push(`p→${toPage} missing ${word}`);
  const seg = para.segments.find((s, i) => para.segments[i + 1]?.sourcePage === toPage);
  // The archive already reassembled the split word into the PRECEDING page, so the surviving
  // segment join is an ordinary word boundary. A mid-word "none" here would corrupt the render.
  if (seg?.joinToNext !== "space") splitBad.push(`p→${toPage} join=${seg?.joinToNext}, expected space`);
  if (r.includes(word + para.segments[para.segments.findIndex((s, i) => para.segments[i + 1]?.sourcePage === toPage) + 1]?.text.split(" ")[0])) splitBad.push(`p→${toPage} rendered without a space`);
}
check(splitBad.length === 0, `22. all 5 documented cross-page word splits (${Object.values(WORD_SPLITS).join(", ")}) are same-paragraph continuations that render with a single space, never concatenated (${splitBad.slice(0, 3).join("; ")})`);
const gotUnknown = vTa.unresolvedBreaks.map((b) => b.toPage).sort((a, b) => a - b);
check(JSON.stringify(gotUnknown) === JSON.stringify(UNKNOWN_PAGES) && gotUnknown.length === 11, `23. the 11 unresolved paragraph relations stay unresolved-breaks, exactly at printed pages ${UNKNOWN_PAGES.join(",")}`);
const ba = prov.archiveDerived.boundaryAudit;
check(ba.tamilTransitions === 16 && ba.sameParagraph === 5 && ba.paragraphBoundary === 0 && ba.unknownParagraphRelation === 11, "24. boundary audit: 16 = 5 source-established continuations + 11 unresolved + 0 source-established clean paragraph boundaries");
check(ba.lexicalJoinNone === 0 && ba.lexicalJoinSpace === 5 && ba.lexicalJoinUnknown === 0, "24b. lexical joins none 0 / space 5 / unknown 0");
check(ba.unknownParagraphRelation === prov.blockers[0].count, "24c. blocker count agrees with the generated boundary audit");

// ── NO HEURISTICS ─────────────────────────────────────────────────────────────
check(/TA_BOUNDARY\[pendingToPage\]/.test(importerSrc), "25. paragraph relations come from the explicit TA_BOUNDARY table");
check(!/\/\^?\[[^\]]*[.!?][^\]]*\]/.test(importerSrc), "25b. no terminal-punctuation regex class (no punctuation heuristic)");
// Scope the anti-heuristic assertions to the per-transition EVIDENCE strings themselves: no
// transition may be justified by speaker count, semantic continuity or sentence completion.
const evidenceStrings = [...importerSrc.matchAll(/ev: "([^"]*)"/g)].map((m) => m[1]);
check(evidenceStrings.length === 16, "25c. all 16 transitions carry an evidence string");
check(!evidenceStrings.some((e) => /single[- ]speaker|speaker turn|speaker count/i.test(e)), "25d. no transition is justified by speaker count");
check(!evidenceStrings.some((e) => /semantic|continuity of thought|reads like|sentence completes|terminal punctuation/i.test(e)), "25e. no transition is justified by semantic continuity or punctuation");
check(evidenceStrings.filter((e) => /records no printed-paragraph relation/.test(e)).length === 11, "25f. all 11 unresolved transitions cite archive silence as the basis");

// ── ENGLISH ───────────────────────────────────────────────────────────────────
const eba = prov.archiveDerived.englishBoundaryAudit;
check(eba.englishAnchors === 17, "26. all 17 English printed-page anchors (3–19) explicitly classified");
check(eba.paragraphBoundary + eba.headingNoteBoundary + eba.sameParagraphContinuations === 17, "26b. English anchor classifications account for every anchor");
check(/EN_BOUNDARY/.test(importerSrc) && /NEVER from punctuation/.test(importerSrc), "26c. English audit is explicit, with no punctuation heuristic");

// ── BLOCKERS / DURABLE RESOLUTION ─────────────────────────────────────────────
check(prov.blockers.length === 1 && prov.blockers[0].item === "unresolved-paragraph-relationship" && prov.blockers[0].count === 11, "27. exactly one blocker class: 11 unresolved paragraph relationships");
check(/upstream source-archive visual review/.test(prov.blockers[0].resolution), "27b. blocker carries the durable upstream source-archive resolution rule");
const provAll = JSON.stringify(prov);
check(!["in this environment", "read-only here", "not accessible", "scan unavailable"].some((p) => provAll.includes(p)), "27c. no environment-specific availability wording in generated provenance");

// ── SHARED UI REGRESSION ──────────────────────────────────────────────────────
check(/\{speech\.date && \(/.test(readerSrc), "28. reader renders the date chip only when the source establishes a date");
check(/\{speech\.venue && \(/.test(readerSrc), "28b. reader renders the venue chip only when the source establishes a venue");
check(/function provenanceLine/.test(readerSrc), "28c. reader builds the provenance line from established parts only (stays grammatical without date/venue)");
check(/if \(s\.date\) clauses\.push/.test(pageSrc) && /a verified \$\{s\.subtype === "public-speech" \? "public speech"/.test(pageSrc), "29. SEO description is built conditionally from source-established facts");
check(/speechFactsNotStated/.test(sourceCompSrc), "29b. source page surfaces not-stated speech facts as source facts");
check(/Source-established paragraph boundaries/.test(sourceCompSrc) && !/speaker turn/.test(sourceCompSrc), "30. generic source-established boundary label retained (no speaker-turn wording)");
check(/b\.resolution/.test(sourceCompSrc) && /b\.detail/.test(sourceCompSrc), "30b. blocker detail + resolution rendering retained");

// ── OTHER BENCHMARKS UNAFFECTED ───────────────────────────────────────────────
const poon = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/speeches/poonthottam/speech.json"), "utf8"));
const udh = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/speeches/udhaya-kathir/speech.json"), "utf8"));
check(poon.date === "1951-12-06" && poon.venue?.ta === "சென்னை கிண்டி இன்ஜினியரிங் கல்லூரி", "31. Poonthottam still carries its source-established date + venue");
check(udh.date === "1970-09-09" && !!udh.legislature && !!udh.event, "31b. Udhaya still carries its date + legislature + event");

// ── NO PDF / SOURCE UNMODIFIED ────────────────────────────────────────────────
check(!fs.readdirSync(OUT_DIR).some((f) => /\.pdf$/i.test(f)), "32. no source PDF vendored under public/data/speeches/arappor");
check(/rev-parse", "HEAD"/.test(importerSrc) && /source-commit mismatch/.test(importerSrc), "33. importer retains the fail-closed source-HEAD guard");
let head = "", dirty = "?";
try { head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch {}
try { dirty = execFileSync("git", ["-C", SRC_REPO, "status", "--porcelain"], { encoding: "utf8" }).trim(); } catch {}
check(head === "1ef73a709a343390befe55dcdfb029427f527bf4" && dirty === "", "34. source clone unmodified: pinned commit checked out, working tree clean");

console.log();
console.log("RESULT:", fails.length === 0 ? "ALL PASS" : `${fails.length} FAILURE(S)`);
process.exit(fails.length === 0 ? 0 : 1);
