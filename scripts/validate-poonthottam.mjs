// Deterministic source-vs-vendored validation for பூந்தோட்டம் / Poonthottam (Phase 3, second
// benchmark — the first public speech). Proves source-fragment fidelity, LOGICAL RENDER fidelity,
// no punctuation heuristic, unresolved paragraph relations are NOT semantic paragraph boundaries,
// the source-established public-speech metadata (date/venue; event/occasion/audience unset), and
// that only the speech body (not the prefatory poem or publisher preface) is imported.
// Usage: node scripts/validate-poonthottam.mjs <public-speeches-clone>

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) { console.error("usage: node scripts/validate-poonthottam.mjs <public-speeches-clone>"); process.exit(1); }
const SPEECH_DIR = path.join(SRC_REPO, "speeches/poonthottam");
const OUT_DIR = path.join(process.cwd(), "public/data/speeches/poonthottam");
const VEND = path.join(OUT_DIR, "speech.json");
const PROV = path.join(OUT_DIR, "provenance.json");
const IMPORTER = path.join(process.cwd(), "scripts/import-poonthottam.mjs");

const fails = [];
const check = (cond, msg) => { console.log((cond ? "  ok  " : "FAIL  ") + msg); if (!cond) fails.push(msg); };

const meta = JSON.parse(fs.readFileSync(path.join(SPEECH_DIR, "metadata.json"), "utf8"));
const tamilSrc = fs.readFileSync(path.join(SPEECH_DIR, "transcription-ta.md"), "utf8");
const englishSrc = fs.readFileSync(path.join(SPEECH_DIR, "translation-en.md"), "utf8");
const speech = JSON.parse(fs.readFileSync(VEND, "utf8"));
const prov = JSON.parse(fs.readFileSync(PROV, "utf8"));
const importerSrc = fs.readFileSync(IMPORTER, "utf8");

const PAGE_RE = /^##\s+PDF page\s+(\d+)\s*\/\s*printed page\s+(\d+)\s*$/;
// EXPECTED audited Tamil boundary map (printed toPage → {rel, join}); independent cross-check.
const EXPECT = {
  6: ["same-paragraph", "space"], 7: ["same-paragraph", "space"], 8: ["unknown", "end"], 9: ["unknown", "end"],
  10: ["unknown", "end"], 11: ["same-paragraph", "space"], 12: ["unknown", "end"], 13: ["unknown", "end"],
  14: ["unknown", "end"], 15: ["unknown", "end"], 16: ["unknown", "end"],
};
const SPACE_CONTINUATIONS = [6, 7, 11]; // the ONLY same-paragraph cross-page joins (all spaced)
const UNKNOWN_PAGES = [8, 9, 10, 12, 13, 14, 15, 16]; // unresolved paragraph relationships

// Extract the verbatim body of a source file the way the importer does: bounded from the first
// PDF-page marker to the first non-page `##`; skip page markers, the `#` title, `---` rules, blank
// lines. English `>` translator notes are captured as note texts.
function sourceBody(text) {
  const texts = [], notes = [], pages = new Set();
  let started = false;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    let m;
    if ((m = line.match(PAGE_RE))) { started = true; pages.add(Number(m[2])); continue; }
    if (!started) continue;
    if (line.trim() === "" || /^-{3,}$/.test(line)) continue;
    if (/^##\s+/.test(line)) break;
    if ((m = line.match(/^>\s?(.*)$/))) { notes.push(m[1].trim()); continue; }
    if (/^#\s+/.test(line)) continue;
    texts.push(line);
  }
  return { texts, notes, pages };
}
const srcTa = sourceBody(tamilSrc);
const srcEn = sourceBody(englishSrc);

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
const allJoins = speech.tamil.blocks.filter((b) => b.kind === "paragraph").flatMap((b) => b.segments.map((s) => s.joinToNext));

const renderPara = (p) => p.segments.map((s, i) => (i === 0 ? "" : p.segments[i - 1].joinToNext === "space" ? " " : p.segments[i - 1].joinToNext === "unknown" ? "␝" : "") + s.text).join("");
const paraSpanning = (a, b) => speech.tamil.blocks.find((x) => x.kind === "paragraph" && x.segments.some((s) => s.text.endsWith(a)) && x.segments.some((s) => s.text.startsWith(b)));

// 1. source-commit pin: vendored + provenance record the pinned public-speeches commit
check(speech.sourceCommit === "1ef73a709a343390befe55dcdfb029427f527bf4" && prov.sourceCommit === speech.sourceCommit && speech.sourceRepo === "pugazg/kalaignar-public-speeches", "1. source commit pinned to the corrected public-speeches 1ef73a7 (speech + provenance)");

// 2. source SHA-256 provenance matches the authoritative metadata (and the known checksum)
check(prov.source.scanSha256 === meta.source.sha256 && prov.source.scanSha256 === "2a8bf5f6f42970ee95912f41662f9bc448581a5aaca15a55fee9b44ba20a4c52" && prov.source.scanFileSizeBytes === 49297657, "2. source SHA-256 + file size recorded, matching metadata.json");

// 3. 12 speech pages, printed 5-16, none omitted/duplicated
check(JSON.stringify(speech.sourcePages) === JSON.stringify(Array.from({ length: 12 }, (_, i) => i + 5)), "3. exactly 12 speech pages, printed 5–16, none omitted/duplicated");
check([...vTa.pages].sort((a, b) => a - b).join(",") === [...srcTa.pages].sort((a, b) => a - b).join(",") && srcTa.pages.size === 12, "3b. no Tamil source-page marker lost (12 page markers)");

// 4. all 11 physical transitions represented explicitly in the audit
check(Object.keys(EXPECT).length === 11, "4. all 11 physical page transitions (printed 5→6 … 15→16) present exactly once in the audit table");

// 5. every transition matches its audited relation; no unknown relation is a semantic paragraph
let relBad = [];
for (const [tp, [rel]] of Object.entries(EXPECT)) {
  const toPage = Number(tp);
  const spanned = speech.tamil.blocks.some((x) => x.kind === "paragraph" && x.sourcePages.includes(toPage) && x.sourcePages.includes(toPage - 1));
  const marker = vTa.unresolvedBreaks.some((u) => u.toPage === toPage);
  if (rel === "same-paragraph" && !spanned) relBad.push(`p→${toPage} expected same-paragraph run`);
  if (rel === "unknown" && (!marker || spanned)) relBad.push(`p→${toPage} expected unresolved-break, not a paragraph`);
}
check(relBad.length === 0, `5. every transition matches its audited relation; no unknown relation is a semantic paragraph (${relBad.slice(0, 3).join("; ")})`);

// 6. unresolved paragraph relationships (8) remain unresolved — markers exactly at the audited pages
const gotUnknown = vTa.unresolvedBreaks.map((b) => b.toPage).sort((a, b) => a - b);
check(JSON.stringify(gotUnknown) === JSON.stringify(UNKNOWN_PAGES) && gotUnknown.length === 8, `6. the ${UNKNOWN_PAGES.length} unresolved paragraph relationships stay unresolved-breaks, exactly at pages ${UNKNOWN_PAGES.join(",")}`);

// 7. no punctuation-derived paragraph inference: paragraph relations are driven by the EXPLICIT
// TA_BOUNDARY / EN_BOUNDARY tables, and the importer has no terminal-punctuation regex char-class.
const usesExplicitTables = /TA_BOUNDARY\[pendingToPage\]/.test(importerSrc) && /EN_BOUNDARY\[pendingAnchor\]/.test(importerSrc);
const noTerminalPunctClass = !/\/\^?\[[^\]]*[.!?][^\]]*\]/.test(importerSrc); // no regex like /[.!?…]/ classifying sentence-final punctuation
check(usesExplicitTables && noTerminalPunctClass, "7. paragraph relations come from explicit TA_BOUNDARY/EN_BOUNDARY tables; NO terminal-punctuation heuristic");

// 8. every lexical join is none/space/unknown/end; the 3 continuations are spaced (no mid-word split)
check(allJoins.every((j) => ["none", "space", "unknown", "end"].includes(j)), "8. every lexical join is none/space/unknown/end");
check(prov.archiveDerived.boundaryAudit.lexicalJoinSpace === 3 && prov.archiveDerived.boundaryAudit.lexicalJoinNone === 0 && prov.archiveDerived.boundaryAudit.lexicalJoinUnknown === 0, "8b. lexical joins: none 0 / space 3 / unknown 0 (no mid-word split, no scan-ambiguous join)");

// 9. the three audited continuations render with a space, as one spanned paragraph
const named = [["p5→6", "பண்படுத்த", "வேண்டும்.", "பண்படுத்த வேண்டும்."], ["p6→7", "தரும்", "தென்றலாக,", "தரும் தென்றலாக,"], ["p10→11", "ஓய்வு", "பெறுகிறவர்", "ஓய்வு பெறுகிறவர்"]];
for (const [tag, e, s, want] of named) {
  const p = paraSpanning(e, s); const r = p ? renderPara(p) : "";
  check(!!p && r.includes(want), `9. ${tag} renders '${want}' as one spanned paragraph (single space, no mid-word split)`);
}

// 10. all joins preserve intended rendered text (no accidental split/concat)
let charOk = true;
for (const p of speech.tamil.blocks.filter((b) => b.kind === "paragraph")) {
  const concat = p.segments.map((s) => s.text).join("");
  const rendered = renderPara(p).replace(/␝/g, "");
  if (rendered.replace(/ /g, "") !== concat.replace(/ /g, "")) charOk = false;
}
check(charOk, "10. all joins preserve the intended rendered text (no accidental split/concat)");

// 11. frozen Tamil is verbatim (fragments in order == source body)
check(vTa.texts.join("␟") === srcTa.texts.join("␟"), "11. frozen Tamil is verbatim (fragments, in order, == transcription-ta.md body)");

// 12. verified English is verbatim (text + translator notes in order == source body)
check(vEn.texts.join("␟") === srcEn.texts.join("␟"), "12. verified English text is verbatim (== translation-en.md body)");
check(vEn.notes.join("␟") === srcEn.notes.join("␟") && vEn.notes.length === 5, "12b. exactly 5 translator notes preserved verbatim, in order (was 6 before the source correction)");

// 13. difficult source-supported forms retained verbatim (not normalized)
// The FIVE forms the corrected source archive still keeps transparent. மானிடம் is deliberately
// NOT here: the archive establishes it as the ordinary noun for humanity and now translates it.
const HARD = ["அகம்புற மென்ற அன்றலர்ந்த", "அயோத்தியானுக்கு", "தண்ட காரணயத்திலே", "பெய்ப்படி", "வழக்கு மன்றத்திற்கு"];
const taAll = vTa.texts.join("\n");
check(HARD.every((h) => taAll.includes(h)), `13. all ${HARD.length} difficult source-supported Tamil forms retained verbatim (மானிடம் no longer among them)`);

// 14. English boundary audit: 12 anchors, exactly ONE cross-anchor same-paragraph continuation (p5→6)
const enCross = speech.english.blocks.filter((b) => b.kind === "paragraph" && b.segments.length > 1);
check(prov.archiveDerived.englishBoundaryAudit.englishAnchors === 12 && prov.archiveDerived.englishBoundaryAudit.sameParagraphContinuations === 1 && enCross.length === 1, "14. English: 12 explicit anchors, exactly 1 audited cross-page continuation (p5→6) — no punctuation merges");

// 15. public-speech metadata: date, venue exact; event/occasion/audience unset; NO legislature
check(speech.subtype === "public-speech" && !("legislature" in speech), "15. subtype public-speech with NO legislature object");
check(speech.date === "1951-12-06" && speech.year === 1951 && speech.date === meta.speech.date, "15b. speech date = 1951-12-06 (source-established, not the 2019 edition)");
check(speech.venue?.ta === meta.speech.venue_ta && speech.venue.ta === "சென்னை கிண்டி இன்ஜினியரிங் கல்லூரி", "15c. venue exact = சென்னை கிண்டி இன்ஜினியரிங் கல்லூரி");
check(speech.event == null && speech.occasion == null && speech.audience == null, "15d. event / occasion / audience remain unset (not inferred from venue)");

// 16. prefatory poem and publisher preface are NOT imported as speech body
const bodyAll = (vTa.texts.join("\n") + "\n" + vEn.texts.join("\n"));
const CONTAMINANTS = ["எரிமலை", "பதிப்புரை", "கி. வீரமணி", "நூல் குறிப்பு", "பஞ்சாங்கம்"];
check(CONTAMINANTS.every((c) => !bodyAll.includes(c)), "16. prefatory poem (எரிமலை!), publisher preface and bibliographic front matter are NOT in the speech body");
check(vTa.texts[0]?.startsWith("தலைவர் அவர்களே! தோழர்களே!") && /வணக்கம்/.test(vTa.texts[vTa.texts.length - 1]), "16b. speech body starts at the opening address and ends at வணக்கம்");

// 17. no PDF vendored anywhere under the vendored data dir
const noPdf = !fs.readdirSync(OUT_DIR).some((f) => /\.pdf$/i.test(f));
check(noPdf, "17. no source PDF vendored under public/data/speeches/poonthottam");

// 18. importer retains the fail-closed source-HEAD guard
check(/rev-parse", "HEAD"/.test(importerSrc) && /source-commit mismatch/.test(importerSrc), "18. importer retains the fail-closed source-HEAD guard");

// 19. one blocker class (8 unresolved paragraph relationships); no lexical-join blocker
check(Array.isArray(prov.blockers) && prov.blockers.length === 1 && prov.blockers[0].item === "unresolved-paragraph-relationship" && prov.blockers[0].count === 8, "19. exactly one blocker class recorded: 8 unresolved paragraph relationships (no lexical-join blocker)");

// 20. no source-repository modification: the clone is at the pinned commit with a clean tree
let head = "", dirty = "?";
try { head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch {}
try { dirty = execFileSync("git", ["-C", SRC_REPO, "status", "--porcelain"], { encoding: "utf8" }).trim(); } catch {}
check(head === "1ef73a709a343390befe55dcdfb029427f527bf4" && dirty === "", "20. source clone unmodified: pinned commit checked out, working tree clean");

// ── Corrected-source assertions (source PR #1, merged as 1ef73a7) ──────────────
const taAllText = vTa.texts.join("\n");
const enAllText = vEn.texts.concat(vEn.notes).join("\n");
const finalEn = vEn.texts.find((t) => t.includes("artistic feast")) || "";

// 21. the scan-established Tamil correction is present and the superseded reading is gone
check(taAllText.includes("மாடப்புறா") && !taAllText.includes("மாட்டுப்புறா"), "21. canonical Tamil carries the scan-established மாடப்புறா; superseded மாட்டுப்புறா absent");

// 22. dependent English corrections
check(finalEn.includes("humanity") && finalEn.includes("the dove"), "22. corrected final English sentence renders 'humanity' and 'dove'");
check(!enAllText.includes("mattuppura"), "22b. superseded transliteration 'mattuppura' absent from canonical English");
check(!enAllText.includes("`மானிடம்`"), "22c. no untranslated/backticked மானிடம் survives in canonical English");

// 23. the transparent-form list is exactly the five surviving forms (no six-form state anywhere)
check(HARD.length === 5 && !HARD.includes("மானிடம்"), "23. transparent-form list is the five surviving forms; மானிடம் is not one of them");

// 24. ZERO source-established clean paragraph boundaries — and that count is not derived from
// speaker count. The archive establishes 3 continuations; the other 8 it does not speak to.
const ba = prov.archiveDerived.boundaryAudit;
check(ba.tamilTransitions === 11 && ba.sameParagraph === 3 && ba.paragraphBoundary === 0 && ba.unknownParagraphRelation === 8, "24. boundary audit: 11 transitions = 3 source-established continuations + 8 unresolved + 0 source-established clean paragraph boundaries");
check(ba.lexicalJoinNone === 0 && ba.lexicalJoinSpace === 3 && ba.lexicalJoinUnknown === 0, "24b. lexical joins none/space/unknown = 0/3/0");

// 25. the importer must NOT justify paragraph structure by speaker count anywhere
const speakerInference = /single[- ]speaker|no speaker turns|single continuous speaker/i.test(importerSrc.replace(/NEVER from how many[\s\S]*?different facts\)/i, ""));
check(!speakerInference, "25. importer contains NO 'single speaker ⇒ paragraph structure' inference");

// 26. neither generated artifact encodes the pre-correction state
const provText = JSON.stringify(prov);
check(!/six translator notes|six difficult/i.test(provText) && !provText.includes("மாட்டுப்புறா"), "26. generated provenance encodes no six-note / six-form / superseded-reading state");

console.log();
console.log("RESULT:", fails.length === 0 ? "ALL PASS" : `${fails.length} FAILURE(S)`);
process.exit(fails.length === 0 ? 0 : 1);
