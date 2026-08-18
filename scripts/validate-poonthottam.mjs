// Independent source-vs-vendored validator for Phase 3 Benchmark #2: Poonthottam.
// Usage: node scripts/validate-poonthottam.mjs <path-to-public-speeches-clone>

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-poonthottam.mjs <public-speeches-clone>");
  process.exit(1);
}

const DIR = path.join(SRC_REPO, "speeches/poonthottam");
const VEND = path.join(process.cwd(), "public/data/speeches/poonthottam/speech.json");
const PROV = path.join(process.cwd(), "public/data/speeches/poonthottam/provenance.json");
const IMPORTER = path.join(process.cwd(), "scripts/import-poonthottam.mjs");
const speech = JSON.parse(fs.readFileSync(VEND, "utf8"));
const prov = JSON.parse(fs.readFileSync(PROV, "utf8"));
const meta = JSON.parse(fs.readFileSync(path.join(DIR, "metadata.json"), "utf8"));
const importerSrc = fs.readFileSync(IMPORTER, "utf8");
const tamilSource = fs.readFileSync(path.join(DIR, "transcription-ta.md"), "utf8");
const englishSource = fs.readFileSync(path.join(DIR, "translation-en.md"), "utf8");
const sourceHead = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();

const fails = [];
const check = (cond, msg) => {
  console.log((cond ? "  ok  " : "FAIL  ") + msg);
  if (!cond) fails.push(msg);
};

const EXPECT = {
  7: ["same-paragraph", "space"],
  8: ["same-paragraph", "space"],
  9: ["unknown", "end"],
  10: ["unknown", "end"],
  11: ["unknown", "end"],
  12: ["same-paragraph", "space"],
  13: ["unknown", "end"],
  14: ["unknown", "end"],
  15: ["unknown", "end"],
  16: ["unknown", "end"],
  17: ["unknown", "end"],
};

function sourceUnits(markdown) {
  const units = [];
  let current = null;
  const flushPage = () => { current = null; };
  for (const raw of markdown.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const page = line.match(/^##\s+PDF page\s+(\d+)\s*\/\s*printed page\s+(\d+)\s*$/i);
    if (page) {
      const pdfPage = Number(page[1]);
      current = pdfPage >= 6 && pdfPage <= 17 ? { page: pdfPage, group: [] } : null;
      continue;
    }
    if (!current) continue;
    if (/^##\s+/.test(line)) { flushPage(); break; }
    if (line.trim() === "---") continue;
    if (line.trim() === "") {
      if (current.group.length) {
        units.push(classify(current.page, current.group));
        current.group = [];
      }
    } else {
      current.group.push(line);
    }
  }
  if (current?.group.length) units.push(classify(current.page, current.group));
  return units;
}

function classify(page, lines) {
  if (lines.length === 1 && /^#\s+/.test(lines[0])) return { page, kind: "heading", text: lines[0].replace(/^#\s+/, "") };
  if (lines.every((l) => /^>\s?/.test(l))) return { page, kind: "note", text: lines.map((l) => l.replace(/^>\s?/, "")).join("\n") };
  return { page, kind: "paragraph", text: lines.join("\n") };
}

function vendoredUnits(stream) {
  const units = [];
  for (const b of stream.blocks) {
    if (b.kind === "heading" || b.kind === "note") units.push({ page: b.sourcePage, kind: b.kind, text: b.text });
    if (b.kind === "paragraph") for (const s of b.segments) units.push({ page: s.sourcePage, kind: "paragraph", text: s.text });
  }
  return units;
}

const unitKey = (u) => `${u.page}\u241f${u.kind}\u241f${u.text}`;
const compareUnitMultiset = (source, vendored) => {
  const a = source.map(unitKey).sort();
  const b = vendored.map(unitKey).sort();
  return JSON.stringify(a) === JSON.stringify(b);
};

const srcTa = sourceUnits(tamilSource);
const srcEn = sourceUnits(englishSource);
const vTa = vendoredUnits(speech.tamil);
const vEn = vendoredUnits(speech.english);
const wantedPages = Array.from({ length: 12 }, (_, i) => i + 6);

check(sourceHead === speech.sourceCommit && sourceHead === prov.sourceCommit, "1. vendored source commit equals actual public-speeches checkout HEAD");
check(sourceHead === "c8abf95834e1d2549644e3607be3dd6f87b802c2", "2. Benchmark #2 is pinned to the reviewed public-speeches main SHA");
check(speech.subtype === "public-speech" && speech.readerStructure === "speech" && speech.shelf === "speeches", "3. Poonthottam reuses the shared Speeches shelf / speech reader as public-speech subtype");
check(speech.legislature == null && speech.event == null, "4. no Assembly/event metadata is invented for the public speech");
check(speech.date === "1951-12-06" && speech.venue?.ta === "சென்னை கிண்டி இன்ஜினியரிங் கல்லூரி", "5. source-established date and venue are retained");
check(meta.workflow.tamil_transcription === "verified-complete" && meta.workflow.english_translation === "verified-complete", "6. source repository still reports verified-complete Tamil and English");
check(JSON.stringify(speech.sourcePages) === JSON.stringify(wantedPages), "7. speech source pages are exactly PDF 6-17");
check(prov.source.scanSha256 === meta.source.sha256 && prov.source.scanSha256 === "2a8bf5f6f42970ee95912f41662f9bc448581a5aaca15a55fee9b44ba20a4c52", "8. controlling scan SHA-256 matches authoritative source metadata");
check(compareUnitMultiset(srcTa, vTa), "9. every Tamil source unit is vendored verbatim exactly once (including headings) ");
check(compareUnitMultiset(srcEn, vEn), "10. every released English source unit/note is vendored verbatim exactly once");

const unknownPages = Object.entries(EXPECT).filter(([, v]) => v[0] === "unknown").map(([p]) => Number(p));
const samePages = Object.entries(EXPECT).filter(([, v]) => v[0] === "same-paragraph").map(([p]) => Number(p));
for (const [label, stream] of [["Tamil", speech.tamil], ["English", speech.english]]) {
  const unresolved = stream.blocks.filter((b) => b.kind === "unresolved-break").map((b) => b.toPage).sort((a, b) => a - b);
  check(JSON.stringify(unresolved) === JSON.stringify(unknownPages), `11. ${label}: unresolved-break markers occur exactly at the 8 unrecorded printed-paragraph relationships`);
  const missingSame = samePages.filter((p) => !stream.blocks.some((b) => b.kind === "paragraph" && b.sourcePages.includes(p - 1) && b.sourcePages.includes(p)));
  check(missingSame.length === 0, `12. ${label}: all 3 source-audited same-sentence continuations span the physical page edge`);
}

const tamilCross = speech.tamil.blocks.filter((b) => b.kind === "paragraph" && b.segments.length > 1);
check(tamilCross.length === 3, "13. Tamil has exactly 3 explicitly audited cross-page paragraphs");
check(tamilCross.every((p) => p.segments.slice(0, -1).every((s) => s.joinToNext === "space")), "14. all known Poonthottam lexical joins use one explicit space; no split-word/unknown lexical join is fabricated");

const findCross = (toPage) => speech.tamil.blocks.find((b) => b.kind === "paragraph" && b.sourcePages.includes(toPage - 1) && b.sourcePages.includes(toPage));
const render = (p) => p.segments.map((s, i) => (i ? (p.segments[i - 1].joinToNext === "space" ? " " : "") : "") + s.text).join("");
check(render(findCross(7)).includes("பண்படுத்த வேண்டும்."), "15a. PDF 6→7 renders the audited 'பண்படுத்த வேண்டும்.' continuation");
check(render(findCross(8)).includes("தரும் தென்றலாக,"), "15b. PDF 7→8 renders the audited fragrance/breeze continuation");
check(render(findCross(12)).includes("ஓய்வு பெறுகிறவர்"), "15c. PDF 11→12 renders the audited Rajaji continuation");

check(Object.keys(EXPECT).length === 11, "16. all 11 physical speech-page transitions have one explicit work-specific audit entry");
check(!/terminal[\s_-]*punctuation.*decid/i.test(importerSrc) && !/endsWith\(["']\.["']\)/.test(importerSrc), "17. importer contains no punctuation-driven paragraph inference");
check(/rev-parse", \[?"HEAD"/.test(importerSrc) || (/rev-parse/.test(importerSrc) && /source-commit mismatch/.test(importerSrc)), "18. importer retains a fail-closed source HEAD/commit guard");
check(prov.archiveDerived.boundaryAudit.tamilTransitions === 11 && prov.archiveDerived.boundaryAudit.sameParagraph === 3 && prov.archiveDerived.boundaryAudit.unknownParagraphRelation === 8, "19. provenance exposes the 11 = 3 resolved-continuation + 8 unresolved boundary audit");
check(prov.archiveDerived.boundaryAudit.lexicalJoinNone === 0 && prov.archiveDerived.boundaryAudit.lexicalJoinSpace === 3 && prov.archiveDerived.boundaryAudit.lexicalJoinUnknown === 0, "20. provenance lexical-join counts are exact (0 none / 3 space / 0 unknown)");
check(prov.blockers?.length === 1 && prov.blockers[0].item === "unresolved-paragraph-relationship" && prov.blockers[0].count === 8, "21. only the genuinely unresolved printed-paragraph evidence class is surfaced as a blocker");
check(prov.projectRights.governmentOrderNumber === null && prov.projectRights.governmentOrderDate === null && prov.projectRights.governmentOrderHandoverDate === "2024-12-22", "22. nationalisation model does not invent GO number/date and keeps handover date distinct");
check(/does not extend to/i.test(prov.projectRights.thirdPartyNote) && /project-created/i.test(prov.projectRights.projectTranslationNote), "23. underlying Tamil, project English, and non-Kalaignar/third-party material remain rights-distinct");

console.log();
console.log("RESULT:", fails.length === 0 ? "ALL PASS" : `${fails.length} FAILURE(S)`);
process.exit(fails.length === 0 ? 0 : 1);
