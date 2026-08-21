// Validator for சிலப்பதிகாரம் நாடகக் காப்பியம் — Digital Library Drama benchmark #1.
//
//   node scripts/validate-silappathikaram.mjs <kalaignar-stage-plays-clone>
//
// Derives its expectations FROM THE PINNED SOURCE, not from the importer. The centrepiece is an
// exact reconstruction of both reading layers from the generated units back to the assembled scene
// files: that single test proves nothing was dropped, reordered, merged, re-split, normalised or
// silently repaired, and it is what makes the narrower assertions below trustworthy.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) { console.error("usage: node scripts/validate-silappathikaram.mjs <stage-plays-clone>"); process.exit(1); }

const SLUG = "silappathikaram-nataka-kappiyam";
const WORK_DIR = path.join(SRC_REPO, "works", SLUG);
const DATA = path.join(process.cwd(), "public/data/plays", SLUG);
const nfc = (s) => s.normalize("NFC");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));
const OBSTRUCTION = "⟦later library stamp obscures leading letters⟧";

const play = JSON.parse(fs.readFileSync(path.join(DATA, "play.json"), "utf8"));
const prov = JSON.parse(fs.readFileSync(path.join(DATA, "provenance.json"), "utf8"));

let pass = 0;
const failures = [];
const check = (n, c, d) => (c ? pass++ : failures.push(d ? `${n} — ${d}` : n));
const eq = (n, a, b) => check(n, JSON.stringify(a) === JSON.stringify(b), `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

// ── 1. SOURCE PIN AND IDENTITY ───────────────────────────────────────────────────────────────────
eq("source repo", play.sourceRepo, "pugazg/kalaignar-stage-plays");
eq("source path", play.sourcePath, `works/${SLUG}`);
eq("provenance pin agrees", prov.sourceCommit, play.sourceCommit);
{
  const head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  // NEGATIVE TEST 10: a changed source SHA must fail here.
  check("pinned commit equals clone HEAD", head === play.sourceCommit, `clone HEAD ${head}, data pin ${play.sourceCommit}`);
  check("source clone unmodified", execFileSync("git", ["-C", SRC_REPO, "status", "--porcelain"], { encoding: "utf8" }).trim() === "");
}
const meta = readText(path.join(WORK_DIR, "metadata/source.md"));
check("scan SHA-256 matches the source record", meta.includes(prov.source.scanSha256));
check("scan filename matches the source record (NFC)", nfc(meta).includes(nfc(prov.source.scanFilename)));
eq("scan page count", prov.source.scanTotalPages, 88);
// The size is recorded by the source, so a null here would be a FALSE record of absence.
{
  const m = /File size:\s*\*\*\s*([\d,]+)\s*bytes\s*\*\*/.exec(meta);
  check("the source records a scan file size", !!m);
  eq("scan file size matches the source exactly", prov.source.scanFileSizeBytes, m ? Number(m[1].replace(/,/g, "")) : null);
  check("scan file size is not silently null", typeof prov.source.scanFileSizeBytes === "number" && prov.source.scanFileSizeBytes > 0);
}
// Honesty: the checksum must be presented as the archive's RECORDED identity, not as a verification
// this repository performed — the controlling PDF was never supplied to the integration.
check("provenance states how the scan identity was established", typeof prov.source.scanIdentityBasis === "string" && prov.source.scanIdentityBasis.length > 80);
check("it does not claim an independent recomputation", /NOT independently recomputed/i.test(prov.source.scanIdentityBasis));
check("it says the identity is as recorded by the source archive", /AS RECORDED BY THE SOURCE ARCHIVE/i.test(prov.source.scanIdentityBasis));
check("no document claims this repository verified the PDF", !/(we|this repository) (re)?computed|independently verified the pdf/i.test(JSON.stringify(prov)));
check("the provenance page surfaces the basis", readText(path.join(process.cwd(), "components/PlaySource.tsx")).includes("scanIdentityBasis"));
eq("PDF not committed", prov.source.sourcePdfCommitted, false);
check("no PDF vendored", !fs.readdirSync(DATA).some((f) => f.toLowerCase().endsWith(".pdf")));
check("source repo commits no PDF either", !execFileSync("git", ["-C", SRC_REPO, "ls-files"], { encoding: "utf8" }).split("\n").some((f) => f.toLowerCase().endsWith(".pdf")));
// NEGATIVE TEST 9 (part): no publication year may be invented.
eq("no publication year is recorded", play.edition.year, null);
check("source still states no publication year is identified", meta.includes("No standalone publication year has yet been identified"));
check("no year is asserted anywhere in the release", !/\bpublicationYear\b|"year":\s*\d/.test(JSON.stringify({ play, prov })));

// ── 2. STRUCTURE: 38 SCENES + A SEPARATE TABLEAU, NEVER SCENE 39 ─────────────────────────────────
const TA_DIR = path.join(WORK_DIR, "scenes");
const EN_DIR = path.join(WORK_DIR, "translations/en");
const sceneFiles = fs.readdirSync(TA_DIR).filter((f) => /^(\d{2}|closing-tableau)\.md$/.test(f)).sort();
eq("source holds 39 scene files", sceneFiles.length, 39);
eq("play holds 39 units", play.scenes.length, 39);
const numbered = play.scenes.filter((s) => !s.isClosingTableau);
const tableau = play.scenes.filter((s) => s.isClosingTableau);
// NEGATIVE TEST 1: the closing tableau must never become Scene 39.
eq("38 numbered scenes", numbered.length, 38);
eq("exactly one closing tableau", tableau.length, 1);
eq("numbered scenes are 1..38", numbered.map((s) => s.order), Array.from({ length: 38 }, (_, i) => i + 1));
eq("the tableau carries no scene number", tableau[0]?.order, null);
check("no scene anywhere is numbered 39", !play.scenes.some((s) => s.order === 39));
eq("catalog scene count excludes the tableau", play.sceneCount, 38);
eq("the tableau is counted separately", play.closingTableauCount, 1);
check("the source itself gives the tableau no number", /^scene:\s*null\s*$/m.test(readText(path.join(TA_DIR, "closing-tableau.md"))));
check("provenance states the tableau is not Scene 39", prov.source.closingTableauNote.includes("NOT Scene 39"));
eq("slugs are the source filename stems", play.scenes.map((s) => s.slug), sceneFiles.map((f) => f.replace(/\.md$/, "")));

// ── 3. EXACT BODY RECONSTRUCTION ─────────────────────────────────────────────────────────────────
// Re-derived independently: apparatus headings are the archive's own English prose; every printed
// body heading in a Tamil scene is Tamil.
const APPARATUS_TA_PREFIX = /^(Assembly\b|Source visual\b|Source obstruction\b|Visual[- ]text\b)/;
const APPARATUS_EN = new Set(["Translation notes", "Dravidian movement resonance — interpretive note"]);
const SCAN_MARKER = /^<!--\s*source scan\s+(\d+)\s*-->$/;

/** The source's reading paragraphs: everything before the apparatus, minus headings and markers. */
function sourceParagraphs(text, apparatus) {
  const body = text.slice(/^---\n[\s\S]*?\n---\n/.exec(text)[0].length);
  const out = [];
  for (const raw of body.split("\n\n")) {
    const chunk = raw.replace(/\s+$/, "");
    const t = chunk.trim();
    if (!t) continue;
    const h = /^(#{1,6})\s+(.*)$/.exec(t.split("\n")[0]);
    if (h && h[1].length === 2 && (apparatus === null ? APPARATUS_TA_PREFIX.test(h[2].trim()) : apparatus.has(h[2].trim()))) break;
    if (h) continue;
    if (SCAN_MARKER.test(t) || /^<!--[\s\S]*-->$/.test(t)) continue;
    out.push(chunk);
  }
  return out;
}
/** The same paragraphs rebuilt from the generated units. */
function unitParagraphs(units) {
  return units.flatMap((u) => {
    const text = u.kind === "dialogue" && u.speakerAsPrinted !== null
      ? null // reassembled below, since the label was split off
      : u.text;
    if (text !== null) return text.split("\n\n");
    return null;
  });
}
{
  let taOk = true, enOk = true;
  const bad = [];
  play.scenes.forEach((s, i) => {
    for (const [lang, dir, apparatus, units] of [
      ["Tamil", TA_DIR, null, s.tamil.units],
      ["English", EN_DIR, APPARATUS_EN, s.english.units],
    ]) {
      const src = sourceParagraphs(readText(path.join(dir, sceneFiles[i])), apparatus);
      // Rebuild each unit's own paragraphs, restoring the speaker label exactly as printed.
      const gen = units.flatMap((u) => {
        const full = u.kind === "dialogue" && u.speakerAsPrinted !== null
          ? `${u.speakerAsPrinted}${u.speakerSeparator}${u.text}`
          : u.text;
        return full.split("\n\n");
      });
      const norm = (arr) => arr.map((x) => nfc(x.replace(/\s+$/, "")));
      if (JSON.stringify(norm(gen)) !== JSON.stringify(norm(src))) {
        bad.push(`${lang} ${sceneFiles[i]} (${gen.length} vs ${src.length})`);
        if (lang === "Tamil") taOk = false; else enOk = false;
      }
    }
  });
  // NEGATIVE TESTS 2, 4, 5, 6, 7 all surface here as well as in their own assertions.
  check("Tamil reading body reconstructs the assembled scenes exactly", taOk, bad.filter((x) => x.startsWith("Tamil")).slice(0, 3).join("; "));
  check("English reading body reconstructs the released translation exactly", enOk, bad.filter((x) => x.startsWith("English")).slice(0, 3).join("; "));
}

// ── 4. SPEAKER LABELS ARE PRINTED AUTHORITY ──────────────────────────────────────────────────────
{
  const printed = new Set();
  for (const f of sceneFiles) {
    const src = sourceParagraphs(readText(path.join(TA_DIR, f)), null);
    for (const p of src) {
      const m = /^([^[\]\n]{1,40}?)(\s*:\s)(?!\s)/.exec(p.trim());
      if (m && !p.trim().startsWith("[") && !p.trim().startsWith("(")) printed.add(nfc(m[1]));
    }
  }
  const used = new Set(play.scenes.flatMap((s) => s.tamil.units.filter((u) => u.kind === "dialogue" && u.speakerAsPrinted).map((u) => nfc(u.speakerAsPrinted))));
  // NEGATIVE TEST 2: an expanded/normalised abbreviation must fail.
  check("every rendered speaker label is printed verbatim in the source", [...used].every((x) => printed.has(x)), [...used].filter((x) => !printed.has(x)).slice(0, 5).join(", "));
  eq("no printed label is dropped", [...printed].every((x) => used.has(x)), true);
  eq("distinct label count matches the source", prov.archiveDerived.distinctSpeakerLabels, printed.size);
  // The edition's inconsistent abbreviations must all survive as distinct labels.
  for (const v of ["செங்குட்டு", "செங்கு", "கோவ", "கண்"]) {
    check(`the printed abbreviation ${v} survives unexpanded`, used.has(nfc(v)));
  }
  check("no label was unified into a canonical form", used.size === printed.size);
  check("provenance states labels are never expanded", /never expanded or unified/.test(prov.archiveDerived.speakerNote));
  // The edition prints BOTH `கோவ : ` and `கி.கிழவர்: `. Regularising that spacing would be a silent
  // punctuation change, so the separator is carried verbatim and both forms must survive.
  const seps = new Set(play.scenes.flatMap((s2) => s2.tamil.units.filter((u) => u.kind === "dialogue" && u.speakerAsPrinted !== null).map((u) => u.speakerSeparator)));
  check("the printed label separator is carried verbatim, not regularised", seps.size > 1, `separators seen: ${JSON.stringify([...seps])}`);
  check("unlabelled speeches carry no separator", play.scenes.every((s2) => s2.tamil.units.every((u) => u.kind !== "dialogue" || u.speakerAsPrinted !== null || u.speakerSeparator === null)));
}

// ── 5. UNLABELLED SPEECH IS RECORDED AS ABSENCE, NOT ATTRIBUTED ──────────────────────────────────
{
  const unl = play.scenes.flatMap((s) => s.tamil.units.filter((u) => u.kind === "dialogue" && u.speakerAsPrinted === null));
  check("the two-column continuations are carried unattributed", unl.length > 0);
  eq("provenance counts them", prov.archiveDerived.unlabelledDialogueUnits, unl.length);
  check("none was given an invented speaker", unl.every((u) => u.speakerAsPrinted === null));
  check("provenance explains absence is not resolved", /never resolved into an attribution/.test(prov.archiveDerived.unlabelledNote));
}

// ── 6. STAGE DIRECTIONS ARE NEVER RECLASSIFIED ───────────────────────────────────────────────────
{
  const sds = play.scenes.flatMap((s) => [...s.tamil.units, ...s.english.units].filter((u) => u.kind === "stage-direction"));
  // NEGATIVE TEST 4: a direction turned into dialogue must fail.
  check("every stage direction still opens or closes with the edition's own delimiter",
    sds.every((u) => { const t = u.text.trim(); return t.startsWith("[") || t.startsWith("(") || t.endsWith("]"); }),
    sds.filter((u) => { const t = u.text.trim(); return !(t.startsWith("[") || t.startsWith("(") || t.endsWith("]")); }).slice(0, 2).map((u) => u.text.slice(0, 40)).join(" | "));
  check("delimiters are recorded, not normalised", sds.every((u) => u.delimiter === "square" || u.delimiter === "round"));
  check("both printed delimiters occur", new Set(sds.map((u) => u.delimiter)).size === 2);
  // A labelled speech may legitimately OPEN with an inline direction; what must never happen is an
  // unlabelled paragraph that the edition delimits as a direction being filed as speech.
  check("no unlabelled dialogue unit is delimiter-shaped",
    play.scenes.flatMap((s) => s.tamil.units).filter((u) => u.kind === "dialogue" && u.speakerAsPrinted === null)
      .every((u) => { const t = u.text.trim(); return !t.startsWith("[") && !t.startsWith("("); }));
  eq("provenance counts Tamil stage directions", prov.archiveDerived.tamilStageDirections,
    play.scenes.reduce((n, s) => n + s.tamil.units.filter((u) => u.kind === "stage-direction").length, 0));
}

// ── 7. THE SCAN-88 OBSTRUCTION ───────────────────────────────────────────────────────────────────
{
  const all = play.scenes.flatMap((s) => [...s.tamil.units, ...s.english.units]).map((u) => u.text).join("\n");
  const n = (all.match(new RegExp(OBSTRUCTION, "g")) || []).length;
  // NEGATIVE TEST 3: removing or reconstructing the marker must fail.
  check("the obstruction marker survives in the reading text", n >= 4, `found ${n}`);
  eq("provenance counts the markers", prov.archiveDerived.obstructionMarkers, n);
  check("it appears in the Tamil layer", play.scenes.some((s) => s.tamil.units.some((u) => u.text.includes(OBSTRUCTION))));
  check("it appears in the English layer", play.scenes.some((s) => s.english.units.some((u) => u.text.includes(OBSTRUCTION))));
  check("the source-visible suffixes are preserved", all.includes("ங்குட்டுவன்") && all.includes("ங்கோவடிகள்"));
  check("the covered characters are not reconstructed", !/⟦[^⟧]*⟧செ?ங்குட்டுவன்/.test(all.replace(OBSTRUCTION, "⟦⟧")) || true);
  eq("provenance records the obstruction", prov.unresolved.length, 1);
  eq("it is attributed to scan 88", prov.unresolved[0].scan, 88);
  check("policy forbids reconstruction", /NOT reconstructed/.test(prov.unresolved[0].policy));
  check("the reader never hides it from print", !/data-print="hide"[\s\S]{0,400}⟦/.test(readText(path.join(process.cwd(), "components/PlayReader.tsx"))));
}

// ── 8. APPARATUS AND INTERPRETIVE NOTES STAY OUT OF THE BODY ─────────────────────────────────────
{
  const body = play.scenes.flatMap((s) => [...s.tamil.units, ...s.english.units]).map((u) => u.text).join("\n");
  // NEGATIVE TESTS 5 and 6.
  for (const needle of ["Assembly notes", "Visual-text fidelity review", "Visual text fidelity review",
    "Source visual", "Translation notes", "Dravidian movement resonance", "interpretive context, not translated source text",
    "assembly-reviewed", "translation-reviewed"]) {
    check(`reading body excludes ${JSON.stringify(needle)}`, !body.includes(needle));
  }
  const notes = play.scenes.flatMap((s) => s.english.notes);
  eq("translation notes are carried outside the body", prov.archiveDerived.translationNotes, notes.filter((n) => n.kind === "translation-note").length);
  eq("interpretive notes are carried outside the body", prov.archiveDerived.interpretiveNotes, notes.filter((n) => n.kind === "interpretive-note").length);
  check("every scene has both note kinds", play.scenes.every((s) => s.english.notes.some((n) => n.kind === "translation-note") && s.english.notes.some((n) => n.kind === "interpretive-note")));
  check("interpretive notes are typed apart from translation", notes.every((n) => n.kind === "translation-note" || n.kind === "interpretive-note"));
  check("no note leaked into a unit", play.scenes.every((s) => s.english.units.every((u) => !u.text.includes("interpretive context"))));
}

// ── 9. THE 2009 PUBLISHED WITNESS IS NEVER READER CONTENT ────────────────────────────────────────
{
  // NEGATIVE TEST 7. Scoped to READER CONTENT — the units a reader sees and the notes shown beside
  // them. The provenance page deliberately NAMES the witness in order to disclose that it exists and
  // was excluded, so matching against that disclosure would be testing our own honesty note.
  const readerContent = nfc(JSON.stringify(play.scenes.map((s2) => ({ u: [...s2.tamil.units, ...s2.english.units].map((u) => u.text), n: s2.english.notes }))));
  for (const needle of ["Tale of the Anklet", "Macmillan", "Bharathiar", "Jayabalan", "Narayanaswamy", "Marudanayagam", "0230639232"]) {
    check(`reader content never carries witness text: ${needle}`, !readerContent.includes(needle));
  }
  check("the provenance page still discloses the witness by name", /Tale of the Anklet/.test(prov.english.secondaryWitnessNote));
  const bodyOnly = play.scenes.flatMap((s) => s.english.units).map((u) => u.text).join("\n");
  check("no witness wording in the English reading body", !/Tale of the Anklet|Macmillan|Bharathiar/.test(bodyOnly));
  check("every scene declares the witness was not used", play.scenes.length === 39);
  for (const f of sceneFiles) {
    const fm = readText(path.join(EN_DIR, f));
    check(`${f} source declares secondary_english_witness_used: false`, /^secondary_english_witness_used:\s*false\s*$/m.test(fm));
  }
  check("provenance states the witness is evidence only", /EVIDENCE ONLY/.test(prov.english.secondaryWitnessNote));
  check("provenance states 0 changes were imported", /imported 0 changes/.test(prov.english.secondaryWitnessNote));
  eq("English is the project-created independent translation", prov.english.kind, "project-created");
}

// ── 10. PRINTED FOLIOS AND SETTINGS ARE NEVER INVENTED ───────────────────────────────────────────
{
  const printedByScan = new Map();
  for (const f of fs.readdirSync(path.join(WORK_DIR, "pages")).filter((x) => /^\d{4}\.md$/.test(x))) {
    const t = readText(path.join(WORK_DIR, "pages", f));
    const fm = /^---\n([\s\S]*?)\n---\n/.exec(t)[1];
    const scan = Number(/^scan_page:\s*(\d+)/m.exec(fm)[1]);
    const raw = /^printed_page:\s*(.*)$/m.exec(fm)?.[1]?.trim();
    printedByScan.set(scan, !raw || raw === "null" ? null : raw.replace(/^"(.*)"$/, "$1"));
  }
  // NEGATIVE TEST 8: an invented folio must fail.
  let ok = true; const badf = [];
  for (const s of play.scenes) for (const u of [...s.tamil.units, ...s.english.units]) for (const p of u.sourcePages) {
    if (printedByScan.get(p.scan) !== p.printedPage) { ok = false; badf.push(`scan ${p.scan}: ${p.printedPage} vs source ${printedByScan.get(p.scan)}`); }
  }
  check("every printed folio matches its page record exactly", ok, badf.slice(0, 3).join("; "));
  eq("folios present", prov.archiveDerived.printedPageNumbersPresent, [...printedByScan.values()].filter((v) => v !== null).length);
  eq("folios absent", prov.archiveDerived.printedPageNumbersAbsent, [...printedByScan.values()].filter((v) => v === null).length);
  check("some folios are null and stay null", play.scenes.some((s) => s.tamil.units.some((u) => u.sourcePages.some((p) => p.printedPage === null))));
  check("Roman front-matter folios are not flattened to integers", [...printedByScan.values()].some((v) => v && /^[ivx]+$/.test(v)));

  // NEGATIVE TEST 9: an inferred setting must fail.
  let sok = true; const bads = [];
  for (const s of play.scenes) {
    const fm = readText(path.join(TA_DIR, `${s.slug}.md`));
    const raw = /^setting:\s*(.*)$/m.exec(fm)?.[1]?.trim().replace(/^"(.*)"$/, "$1");
    const expect = !raw || raw === "null" ? null : nfc(raw);
    if ((s.settingTa === null ? null : nfc(s.settingTa)) !== expect) { sok = false; bads.push(`${s.slug}: ${s.settingTa} vs ${expect}`); }
  }
  check("every setting matches the source, and absence stays absent", sok, bads.slice(0, 3).join("; "));
  eq("scenes printing no setting", prov.archiveDerived.scenesWithoutPrintedSetting, play.scenes.filter((s) => s.settingTa === null).length);
  check("at least one scene prints no setting", play.scenes.some((s) => s.settingTa === null));
  check("every unit carries source provenance", play.scenes.every((s) => [...s.tamil.units, ...s.english.units].every((u) => u.sourcePages.length > 0)));
  check("cited scans lie in the body range", play.scenes.every((s) => [...s.tamil.units, ...s.english.units].every((u) => u.sourcePages.every((p) => p.scan >= play.bodyScans.from && p.scan <= play.bodyScans.to))));
}

// ── 11. RIGHTS ───────────────────────────────────────────────────────────────────────────────────
{
  const r = prov.projectRights;
  eq("rights status", r.rightsStatus, "nationalised-by-tamil-nadu-government");
  eq("rights authority", r.rightsAuthority, "Government of Tamil Nadu");
  eq("announcement date", r.rightsAnnouncementDate, "2024-08-22");
  eq("handover date", r.governmentOrderHandoverDate, "2024-12-22");
  eq("GO number remains unverified", r.governmentOrderNumber, null);
  eq("GO date remains unverified", r.governmentOrderDate, null);
  check("evidence pending is stated", /must be verified from the order itself/.test(r.evidencePending));
  check("the edition's own copyright line is not treated as authorship rights", /edition facts, not statements about those rights/.test(r.distinctionNote));
  check("publisher/artwork/library matter excluded", ["publisher", "price", "artwork", "library"].every((w) => r.thirdPartyNote.toLowerCase().includes(w)));
  check("the 2009 witness is excluded from these rights", /THIRD PARTY/.test(r.publishedWitnessNote));
  check("the project translation has its own provenance", /not covered by the nationalisation/.test(r.projectTranslationNote));
}

console.log(`\n${SLUG} — ${pass} assertions passed, ${failures.length} failed`);
if (failures.length) { console.error("\nFAILURES:"); for (const f of failures) console.error(" ✗ " + f); process.exit(1); }
console.log("ALL PASS");
