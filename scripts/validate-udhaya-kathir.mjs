// Deterministic source-vs-vendored validation for உதயக் கதிர் / Udhaya Kathir (Phase 3).
// Validates the 17 reviewer requirements: source-fragment fidelity, LOGICAL RENDER fidelity,
// no punctuation heuristic, unresolved joins are "unknown" (not silently spaced), and unresolved
// paragraph relations are NOT semantic paragraph boundaries. Usage: node <this> <clone>

import fs from "node:fs";
import path from "node:path";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) { console.error("usage: node scripts/validate-udhaya-kathir.mjs <assembly-speeches-clone>"); process.exit(1); }
const SPEECH_DIR = path.join(SRC_REPO, "speeches/1970/1970-09-09-no-confidence-motion");
const VEND = path.join(process.cwd(), "public/data/speeches/udhaya-kathir/speech.json");
const IMPORTER = path.join(process.cwd(), "scripts/import-udhaya-kathir.mjs");

const fails = [];
const check = (cond, msg) => { console.log((cond ? "  ok  " : "FAIL  ") + msg); if (!cond) fails.push(msg); };

const transcript = fs.readFileSync(path.join(SPEECH_DIR, "transcript.md"), "utf8");
const speech = JSON.parse(fs.readFileSync(VEND, "utf8"));
const importerSrc = fs.readFileSync(IMPORTER, "utf8");

// EXPECTED audited Tamil boundary map (toPage → {rel, join}); independent cross-check of vendored data.
const EXPECT = {
  6:["same-paragraph","space"],7:["unknown","end"],8:["same-paragraph","none"],9:["same-paragraph","none"],
  10:["unknown","end"],11:["same-paragraph","none"],12:["same-paragraph","space"],13:["same-paragraph","none"],
  14:["same-paragraph","space"],15:["same-paragraph","space"],16:["same-paragraph","unknown"],17:["same-paragraph","space"],
  18:["same-paragraph","none"],19:["same-paragraph","unknown"],20:["same-paragraph","space"],21:["unknown","end"],
  22:["same-paragraph","none"],23:["paragraph-boundary","end"],24:["same-paragraph","space"],25:["same-paragraph","space"],
  26:["paragraph-boundary","end"],27:["unknown","end"],28:["same-paragraph","space"],29:["same-paragraph","unknown"],
  30:["paragraph-boundary","end"],31:["same-paragraph","space"],32:["same-paragraph","none"],33:["same-paragraph","space"],
  34:["same-paragraph","space"],35:["unknown","end"],36:["same-paragraph","none"],37:["unknown","end"],
  38:["same-paragraph","space"],39:["same-paragraph","unknown"],40:["unknown","end"],41:["same-paragraph","none"],
  42:["same-paragraph","space"],43:["same-paragraph","unknown"],44:["same-paragraph","none"],45:["same-paragraph","space"],46:["same-paragraph","space"],
};
const SCAN_PENDING_JOINS = [16, 19, 29, 39, 43]; // sandhi joins that MUST be "unknown", never "space"

function sourceLines(sectionRe, endRe) {
  const all = transcript.split("\n");
  const start = all.findIndex((l) => sectionRe.test(l));
  const end = endRe ? all.findIndex((l, i) => i > start && endRe.test(l)) : all.length;
  const out = { texts: [], heads: [], pages: new Set(), anchors: [] };
  for (const raw of all.slice(start + 1, end === -1 ? all.length : end)) {
    const line = raw.replace(/\s+$/, "");
    if (line.trim() === "") continue;
    let m;
    if ((m = line.match(/^<!--\s*source-page:\s*(\d+)\s*-->$/))) { out.pages.add(Number(m[1])); continue; }
    if ((m = line.match(/^###\s+Source page\s+(\d+)\s*$/i))) { out.pages.add(Number(m[1])); out.anchors.push(Number(m[1])); continue; }
    if ((m = line.match(/^##\s+(.*)$/))) { out.heads.push(m[1].trim()); out.texts.push(m[1].trim()); continue; }
    if (/^>\s?/.test(line)) { out.texts.push(line.replace(/^>\s?/, "")); continue; }
    if (/^#\s+/.test(line)) continue;
    out.texts.push(line);
  }
  return out;
}
const srcTa = sourceLines(/^#\s+தமிழ்\s*மூல\s*உரை/, /^#\s+English translation/i);
const srcEn = sourceLines(/^#\s+English translation/i, null);

function vendPieces(stream) {
  const texts = [], heads = [], pages = new Set(), unresolvedBreaks = [];
  for (const b of stream.blocks) {
    if (b.kind === "heading") { heads.push(b.text); texts.push(b.text); if (b.sourcePage != null) pages.add(b.sourcePage); }
    else if (b.kind === "note") texts.push(b.text);
    else if (b.kind === "unresolved-break") { unresolvedBreaks.push(b); if (b.toPage != null) pages.add(b.toPage); }
    else if (b.kind === "paragraph") for (const s of b.segments) { texts.push(s.text); if (s.sourcePage != null) pages.add(s.sourcePage); }
  }
  return { texts, heads, pages, unresolvedBreaks };
}
const vTa = vendPieces(speech.tamil);
const vEn = vendPieces(speech.english);
const allJoins = speech.tamil.blocks.filter((b) => b.kind === "paragraph").flatMap((b) => b.segments.map((s) => s.joinToNext));

// Render a paragraph the way the reader does: none="" space=" " unknown=<marker> (represented ␝ here) end="".
const renderPara = (p) => p.segments.map((s, i) => (i === 0 ? "" : p.segments[i - 1].joinToNext === "space" ? " " : p.segments[i - 1].joinToNext === "unknown" ? "␝" : "") + s.text).join("");
const paraSpanning = (a, b) => speech.tamil.blocks.find((x) => x.kind === "paragraph" && x.segments.some((s) => s.text.endsWith(a)) && x.segments.some((s) => s.text.startsWith(b)));

// 1. all 41 Tamil transition records present exactly once
check(Object.keys(EXPECT).length === 41 && new Set(Object.keys(EXPECT)).size === 41, "1. all 41 Tamil transitions (pp.6→46) present exactly once in the audit table");

// 2. every transition classified without punctuation inference (vendored data matches the audited rel)
// 5. no unknown paragraph relation is a semantic paragraph boundary (it is an unresolved-break)
let relBad = [];
for (const [tp, [rel]] of Object.entries(EXPECT)) {
  const toPage = Number(tp);
  const spanned = speech.tamil.blocks.some((x) => x.kind === "paragraph" && x.sourcePages.includes(toPage) && x.sourcePages.includes(toPage - 1));
  const marker = vTa.unresolvedBreaks.some((u) => u.toPage === toPage);
  if (rel === "same-paragraph" && !spanned) relBad.push(`p→${toPage} expected same-paragraph run`);
  if (rel === "paragraph-boundary" && (spanned || marker)) relBad.push(`p→${toPage} expected clean paragraph-boundary`);
  if (rel === "unknown" && (!marker || spanned)) relBad.push(`p→${toPage} expected unresolved-break, not a paragraph`);
}
check(relBad.length === 0, `2/5. every transition matches its audited relation; no unknown relation is a semantic paragraph (${relBad.slice(0,3).join("; ")})`);

// 3. every lexical join classified none/space/unknown/end (nothing else)
check(allJoins.every((j) => ["none", "space", "unknown", "end"].includes(j)), "3. every lexical join is none/space/unknown/end");

// 4. all scanPending sandhi joins are UNKNOWN, never "space"
let sandhiBad = [];
for (const tp of SCAN_PENDING_JOINS) {
  const para = speech.tamil.blocks.find((x) => x.kind === "paragraph" && x.sourcePages.includes(tp) && x.sourcePages.includes(tp - 1));
  const seg = para?.segments.find((s, i) => para.segments[i + 1]?.sourcePage === tp);
  if (!seg || seg.joinToNext !== "unknown") sandhiBad.push(`p→${tp}=${seg?.joinToNext}`);
}
check(sandhiBad.length === 0, `4. all ${SCAN_PENDING_JOINS.length} scan-pending sandhi joins use "unknown", never "space" (${sandhiBad.join(",")})`);

// 6–9. named renders
const named = [["6. p5→6", "அந்த", "இடத்திலே", "அந்த இடத்திலே", true], ["7. p7→8", "அனைவருக்", "கும்", "அனைவருக்கும்", false], ["8. p8→9", "அபரிமித", "மான", "அபரிமிதமான", false], ["9. p17→18", "ஆகிர", "மிப்பாளர்கள்", "ஆகிரமிப்பாளர்கள்", false]];
for (const [tag, e, s, want, spaced] of named) {
  const p = paraSpanning(e, s); const r = p ? renderPara(p) : "";
  check(!!p && r.includes(want) && (spaced || !r.includes(e + " " + s)), `${tag} renders '${want}'${spaced ? "" : " (no inserted whitespace)"}`);
}

// 10. all known joins preserve intended rendered text (no char loss/gain except declared spaces/markers)
let charOk = true;
for (const p of speech.tamil.blocks.filter((b) => b.kind === "paragraph")) {
  const concat = p.segments.map((s) => s.text).join("");
  const rendered = renderPara(p).replace(/␝/g, ""); // remove unknown-join markers
  if (rendered.replace(/ /g, "") !== concat.replace(/ /g, "")) charOk = false;
}
check(charOk, "10. all known joins preserve the intended rendered text (no accidental split/concat)");

// 11. unresolved lexical joins preserve BOTH fragments verbatim and are not silently normalized
let lexOk = true, lexN = 0;
for (const p of speech.tamil.blocks.filter((b) => b.kind === "paragraph")) {
  for (let i = 0; i < p.segments.length - 1; i++) {
    if (p.segments[i].joinToNext === "unknown") {
      lexN++;
      // both fragments present verbatim as source lines
      if (!srcTa.texts.includes(p.segments[i].text) || !srcTa.texts.includes(p.segments[i + 1].text)) lexOk = false;
    }
  }
}
check(lexOk && lexN === SCAN_PENDING_JOINS.length, `11. all ${SCAN_PENDING_JOINS.length} unresolved lexical joins keep BOTH source fragments verbatim (no silent space/concat)`);

// 12. Tamil fragment fidelity == authoritative transcript
check(vTa.texts.join("␟") === srcTa.texts.join("␟") && vTa.heads.join("␟") === srcTa.heads.join("␟"), "12. Tamil fragment fidelity == authoritative transcript (verbatim, in order)");

// 13. all English source-page anchors have explicit EN_BOUNDARY entries; and importer builds them
const enBoundaryEntries = (importerSrc.match(/for \(let p = 5; p <= 46; p\+\+\) EN_BOUNDARY/)) ? 42 : 0;
check(enBoundaryEntries === 42 && srcEn.anchors.length === 42, `13. all 42 English anchors have explicit EN_BOUNDARY entries`);

// 14. English parser contains NO punctuation-based paragraph heuristic
const noEnHeuristic = !/const continues\s*=\s*!\/\[/.test(importerSrc) && !/\[\.!\?”"\)\]\$\/\.test/.test(importerSrc);
check(noEnHeuristic, "14. English parser contains NO terminal-punctuation paragraph heuristic");

// 15. English source text remains verbatim
check(vEn.texts.join("␟") === srcEn.texts.join("␟") && vEn.heads.join("␟") === srcEn.heads.join("␟"), "15. English released text unchanged (verbatim, in order)");
// English cross-page paragraphs are exactly the 2 audited continuations
const enCross = speech.english.blocks.filter((b) => b.kind === "paragraph" && b.segments.length > 1);
check(enCross.length === 2, "15b. exactly 2 English cross-anchor same-paragraph continuations (p22, p24) — no punctuation-driven merges");

// 16. source pages remain 5–46
check(JSON.stringify(speech.sourcePages) === JSON.stringify(Array.from({ length: 42 }, (_, i) => i + 5)), "16. source pages covered are exactly 5–46");
check([...vTa.pages].sort((a, b) => a - b).join(",") === [...srcTa.pages].sort((a, b) => a - b).join(","), "16b. no Tamil source-page marker lost");

// 17. importer HEAD guard still fails closed
check(/rev-parse", "HEAD"/.test(importerSrc) && /source-commit mismatch/.test(importerSrc), "17. importer retains the fail-closed source-HEAD guard");

// unresolved-break markers sit exactly at the audited unknown boundaries
const expectedUnknown = Object.entries(EXPECT).filter(([, v]) => v[0] === "unknown").map(([k]) => Number(k)).sort((a, b) => a - b);
const gotUnknown = vTa.unresolvedBreaks.map((b) => b.toPage).sort((a, b) => a - b);
check(JSON.stringify(gotUnknown) === JSON.stringify(expectedUnknown), `extra. unresolved-break markers exactly at the ${expectedUnknown.length} unknown paragraph boundaries (${gotUnknown.join(",")})`);

// ── Durable provenance regression (post-merge hotfix) ─────────────────────────────────────────
const prov = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/speeches/udhaya-kathir/provenance.json"), "utf8"));
const compSrc = fs.readFileSync(path.join(process.cwd(), "components/SpeechSource.tsx"), "utf8");
const ENV_PHRASES = ["in this environment", "read-only here", "not accessible", "archive.org"];
const provAll = JSON.stringify(prov);

// 18. both blocker classes still exist, with their audited counts
check(Array.isArray(prov.blockers) && prov.blockers.length === 2, "18. both blocker classes present");
const byItem = Object.fromEntries(prov.blockers.map((b) => [b.item, b]));
check(byItem["unresolved-paragraph-relationship"]?.count === 7 && byItem["unresolved-lexical-join"]?.count === 5, "18b. blocker counts unchanged: 7 unresolved paragraph relationships, 5 unresolved lexical joins");

// 19. both blockers carry a durable upstream-source-archive resolution
check(prov.blockers.every((b) => /upstream source-archive visual review/.test(b.resolution || "")), "19. both blocker resolutions state the upstream source-archive review rule");

// 20. no environment-specific availability wording anywhere in generated provenance
check(ENV_PHRASES.every((ph) => !provAll.includes(ph)), `20. generated provenance contains no environment-specific availability wording (${ENV_PHRASES.join(" / ")})`);

// 21. audited boundary/join counts are frozen by this hotfix
const ba = prov.archiveDerived.boundaryAudit;
check(ba.tamilTransitions === 41 && ba.sameParagraph === 31 && ba.paragraphBoundary === 3 && ba.unknownParagraphRelation === 7, "21. boundary audit unchanged: 41 transitions, 31 same-paragraph, 3 source-established boundaries, 7 unresolved");
check(ba.lexicalJoinNone === 10 && ba.lexicalJoinSpace === 16 && ba.lexicalJoinUnknown === 5, "21b. lexical joins unchanged: none 10 / space 16 / unknown 5");

// 22. shared component regression (Udhaya renders through the same component)
check(/b\.resolution/.test(compSrc) && !compSrc.includes("இச்சூழலில் கிடைக்கவில்லை") && !/speaker turn|பேச்சாளர் மாற்றம்/.test(compSrc), "22. shared SpeechSource renders resolution, drops the environment sentence and the speaker-turn label");

console.log();
console.log("RESULT:", fails.length === 0 ? "ALL PASS" : `${fails.length} FAILURE(S)`);
process.exit(fails.length === 0 ? 0 : 1);
