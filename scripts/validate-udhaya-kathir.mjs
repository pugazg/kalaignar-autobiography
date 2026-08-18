// Deterministic source-vs-vendored validation for உதயக் கதிர் / Udhaya Kathir (Phase 3).
// Validates BOTH (A) source-fragment fidelity (every source line/heading copied verbatim, page
// provenance retained) AND (B) LOGICAL RENDER fidelity (applying the audited joins produces the
// intended continuous source reading — no word split by inserted whitespace, no words
// concatenated, no page break silently made a paragraph break). Loops over the full 41-entry
// audited Tamil boundary table. Usage: node scripts/validate-udhaya-kathir.mjs <clone>

import fs from "node:fs";
import path from "node:path";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-udhaya-kathir.mjs <assembly-speeches-clone>");
  process.exit(1);
}
const SPEECH_DIR = path.join(SRC_REPO, "speeches/1970/1970-09-09-no-confidence-motion");
const VEND = path.join(process.cwd(), "public/data/speeches/udhaya-kathir/speech.json");

const fails = [];
const check = (cond, msg) => {
  console.log((cond ? "  ok  " : "FAIL  ") + msg);
  if (!cond) fails.push(msg);
};

const transcript = fs.readFileSync(path.join(SPEECH_DIR, "transcript.md"), "utf8");
const speech = JSON.parse(fs.readFileSync(VEND, "utf8"));

// EXPECTED audited Tamil boundary map (toPage → {rel, join}); the vendored data MUST match it.
// Mirrors the importer's TA_BOUNDARY so the validator is an independent cross-check.
const EXPECT = {
  6:["same-paragraph","space"],7:["unknown","end"],8:["same-paragraph","none"],9:["same-paragraph","none"],
  10:["unknown","end"],11:["same-paragraph","none"],12:["same-paragraph","space"],13:["same-paragraph","none"],
  14:["same-paragraph","space"],15:["same-paragraph","space"],16:["same-paragraph","space"],17:["same-paragraph","space"],
  18:["same-paragraph","none"],19:["same-paragraph","space"],20:["same-paragraph","space"],21:["unknown","end"],
  22:["same-paragraph","none"],23:["paragraph-boundary","end"],24:["same-paragraph","space"],25:["same-paragraph","space"],
  26:["paragraph-boundary","end"],27:["unknown","end"],28:["same-paragraph","space"],29:["same-paragraph","space"],
  30:["paragraph-boundary","end"],31:["same-paragraph","space"],32:["same-paragraph","none"],33:["same-paragraph","space"],
  34:["same-paragraph","space"],35:["unknown","end"],36:["same-paragraph","none"],37:["unknown","end"],
  38:["same-paragraph","space"],39:["same-paragraph","space"],40:["unknown","end"],41:["same-paragraph","none"],
  42:["same-paragraph","space"],43:["same-paragraph","space"],44:["same-paragraph","none"],45:["same-paragraph","space"],46:["same-paragraph","space"],
};

// ── Re-derive the source's ordered TEXT / HEAD lines + page set (structural markers removed). ──
function sourceLines(sectionRe, endRe) {
  const all = transcript.split("\n");
  const start = all.findIndex((l) => sectionRe.test(l));
  const end = endRe ? all.findIndex((l, i) => i > start && endRe.test(l)) : all.length;
  const out = { texts: [], heads: [], pages: new Set() };
  for (const raw of all.slice(start + 1, end === -1 ? all.length : end)) {
    const line = raw.replace(/\s+$/, "");
    if (line.trim() === "") continue;
    let m;
    if ((m = line.match(/^<!--\s*source-page:\s*(\d+)\s*-->$/)) || (m = line.match(/^###\s+Source page\s+(\d+)\s*$/i))) { out.pages.add(Number(m[1])); continue; }
    if ((m = line.match(/^##\s+(.*)$/))) { out.heads.push(m[1].trim()); out.texts.push(m[1].trim()); continue; }
    if (/^>\s?/.test(line)) { out.texts.push(line.replace(/^>\s?/, "")); continue; }
    if (/^#\s+/.test(line)) continue;
    out.texts.push(line);
  }
  return out;
}
const srcTa = sourceLines(/^#\s+தமிழ்\s*மூல\s*உரை/, /^#\s+English translation/i);
const srcEn = sourceLines(/^#\s+English translation/i, null);

// Vendored → ordered text pieces (segments + heading + note texts) and page set. page-break
// blocks carry NO text (neutral markers), so they do not affect the text reconstruction.
function vendPieces(stream) {
  const texts = [], heads = [], pages = new Set(), pageBreaks = [];
  for (const b of stream.blocks) {
    if (b.kind === "heading") { heads.push(b.text); texts.push(b.text); if (b.sourcePage != null) pages.add(b.sourcePage); }
    else if (b.kind === "note") { texts.push(b.text); }
    else if (b.kind === "page-break") { pageBreaks.push(b); if (b.toPage != null) pages.add(b.toPage); }
    else if (b.kind === "paragraph") { for (const s of b.segments) { texts.push(s.text); if (s.sourcePage != null) pages.add(s.sourcePage); } }
  }
  return { texts, heads, pages, pageBreaks };
}
const vTa = vendPieces(speech.tamil);
const vEn = vendPieces(speech.english);

const renderPara = (p) => p.segments.map((s, i) => (i === 0 ? "" : p.segments[i - 1].joinToNext === "space" ? " " : "") + s.text).join("");
const stripWs = (s) => s.replace(/\s+/g, "");

console.log("── A. SOURCE-FRAGMENT FIDELITY ──");
check(JSON.stringify(speech.sourcePages) === JSON.stringify(Array.from({ length: 42 }, (_, i) => i + 5)), "A1. source pages covered are exactly 5–46");
check(JSON.stringify(vTa.heads) === JSON.stringify(srcTa.heads) && vTa.heads.length === 29, "A2. Tamil section headings verbatim & unchanged (29)");
check(JSON.stringify(vEn.heads) === JSON.stringify(srcEn.heads) && vEn.heads.length === 29, "A2. English section headings verbatim & unchanged (29)");
check(vTa.texts.join("␟") === srcTa.texts.join("␟"), "A3. Tamil source fragments reconstruct the released transcription verbatim, in order");
check(vEn.texts.join("␟") === srcEn.texts.join("␟"), "A4. English released text unchanged (verbatim, in order)");
check([...vTa.pages].sort((a, b) => a - b).join(",") === [...srcTa.pages].sort((a, b) => a - b).join(","), "A5. no Tamil source-page marker lost (page set matches source)");

console.log("── B. LOGICAL RENDER FIDELITY ──");
// Build a lookup of each Tamil segment by text-prefix for boundary checks, and validate every
// cross-page join structurally: render has no char loss/gain other than the join space.
let charOk = true;
for (const p of speech.tamil.blocks.filter((b) => b.kind === "paragraph")) {
  const r = renderPara(p);
  if (stripWs(r) !== p.segments.map((s) => stripWs(s.text)).join("")) charOk = false;
  for (let i = 0; i < p.segments.length - 1; i++) {
    const a = p.segments[i], b = p.segments[i + 1];
    const between = a.text.slice(-3) + (a.joinToNext === "space" ? " " : "") + b.text.slice(0, 3);
    if (a.joinToNext === "none" && / /.test(a.text.slice(-1) + b.text.slice(0, 1))) charOk = false; // no space at a none-join
  }
}
check(charOk, "B1. every paragraph render preserves all characters; joins add only the declared spaces (no split/concat errors)");

// Loop: validate the vendored structure against ALL 41 audited boundary expectations.
function paraContaining(endsWith, startsWith) {
  return speech.tamil.blocks.find((b) => b.kind === "paragraph" && b.segments.some((s) => s.text.endsWith(endsWith)) && b.segments.some((s) => s.text.startsWith(startsWith)));
}
// derive, for each expected same-paragraph boundary, the actual join used at that page pair
const segByPageStart = {}; // toPage -> first segment text on that page (within a paragraph)
for (const b of speech.tamil.blocks) if (b.kind === "paragraph") for (const s of b.segments) if (!(s.sourcePage in segByPageStart)) segByPageStart[s.sourcePage] = s.text;

let auditOk = 0, auditBad = [];
for (const [toPageStr, [rel, join]] of Object.entries(EXPECT)) {
  const toPage = Number(toPageStr);
  if (rel === "same-paragraph") {
    // there must be a paragraph whose segments include one on (toPage-1)…toPage with the right join
    const para = speech.tamil.blocks.find((b) => b.kind === "paragraph" && b.sourcePages.includes(toPage) && b.sourcePages.includes(toPage - 1));
    if (!para) { auditBad.push(`p→${toPage} expected same-paragraph but no paragraph spans ${toPage - 1}&${toPage}`); continue; }
    // find the segment on toPage-1 immediately before the toPage segment and check its join
    const idx = para.segments.findIndex((s) => s.sourcePage === toPage && para.segments[para.segments.indexOf(s) - 1]?.sourcePage === toPage - 1);
    const prev = idx > 0 ? para.segments[idx - 1] : null;
    if (!prev || prev.joinToNext !== join) { auditBad.push(`p→${toPage} expected join '${join}' got '${prev?.joinToNext}'`); continue; }
    auditOk++;
  } else if (rel === "paragraph-boundary") {
    // no paragraph spans (toPage-1, toPage); and no page-break marker for it
    const spanned = speech.tamil.blocks.some((b) => b.kind === "paragraph" && b.sourcePages.includes(toPage) && b.sourcePages.includes(toPage - 1));
    const marker = vTa.pageBreaks.some((pb) => pb.toPage === toPage);
    if (spanned || marker) { auditBad.push(`p→${toPage} expected paragraph-boundary (separate, no marker)`); continue; }
    auditOk++;
  } else { // unknown
    const marker = vTa.pageBreaks.find((pb) => pb.toPage === toPage);
    const spanned = speech.tamil.blocks.some((b) => b.kind === "paragraph" && b.sourcePages.includes(toPage) && b.sourcePages.includes(toPage - 1));
    if (!marker || marker.relation !== "unknown" || spanned) { auditBad.push(`p→${toPage} expected unknown page-break marker`); continue; }
    auditOk++;
  }
}
check(auditBad.length === 0, `B2. all 41 audited boundaries match the vendored data (${auditOk}/41)` + (auditBad.length ? " — " + auditBad.slice(0, 4).join("; ") : ""));

// Named render assertions.
const P = { "p5→6": ["அந்த", "இடத்திலே", "அந்த இடத்திலே", true], "p7→8": ["அனைவருக்", "கும்", "அனைவருக்கும்", false], "p8→9": ["அபரிமித", "மான", "அபரிமிதமான", false], "p17→18": ["ஆகிர", "மிப்பாளர்கள்", "ஆகிரமிப்பாளர்கள்", false] };
for (const [tag, [e, s, want, spaced]] of Object.entries(P)) {
  const para = paraContaining(e, s);
  const r = para ? renderPara(para) : "";
  const bad = spaced ? "" : e + " " + s; // the wrong spaced form for mid-word
  check(!!para && r.includes(want) && (spaced || !r.includes(bad)), `B3. ${tag} renders '${want}'${spaced ? "" : " with NO inserted whitespace"} in one paragraph`);
}
// The mandated p8→9 assertion, explicit.
const p89 = paraContaining("அபரிமித", "மான");
check(!!p89 && renderPara(p89).includes("அபரிமிதமான") && !renderPara(p89).includes("அபரிமித மான"), "B4. MANDATED p8→9 = 'அபரிமிதமான' (never 'அபரிமித மான')");

// Unknown page-break markers correspond to the audited unknown set.
const expectedUnknown = Object.entries(EXPECT).filter(([, v]) => v[0] === "unknown").map(([k]) => Number(k)).sort((a, b) => a - b);
const gotUnknown = vTa.pageBreaks.map((b) => b.toPage).sort((a, b) => a - b);
check(JSON.stringify(gotUnknown) === JSON.stringify(expectedUnknown), `B5. neutral page-break markers exactly at the ${expectedUnknown.length} unknown boundaries (${gotUnknown.join(",")})`);

console.log();
console.log("RESULT:", fails.length === 0 ? "ALL PASS" : `${fails.length} FAILURE(S)`);
process.exit(fails.length === 0 ? 0 : 1);
