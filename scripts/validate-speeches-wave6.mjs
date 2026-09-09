// Independent fidelity + semantic validator for the Wave 6 Batch 3 Speeches.
//
//   node scripts/validate-speeches-wave6.mjs <assembly-speeches-clone> <public-speeches-clone>
//
// The Ammaiyappan/Drama-strength gate for the Speech family. It NEVER calls the importer. It:
//   * fails closed on each source repo commit AND each work's frozen subtree tree;
//   * pins each generated speech.json / provenance.json by SHA-256 and each scan by SHA-256;
//   * INDEPENDENTLY re-derives every work's Tamil and English reading text straight from the raw
//     canonical transcript/translation (a different code path from the importer) and requires it to
//     equal — BYTE FOR BYTE — the reading text reconstructed from the generated speech.json (S===G).
//     Apparatus, page-marker lines and heading markers are the only things dropped; any NFC change,
//     whitespace edit, dropped/added/re-ordered block or fabricated string fails the gate;
//   * proves the governance safeguards: `date: null` for all three; namathu's two-House witness (both
//     Houses in the legislature name, scope note, two editorial units, no invented venue/date); idhaya
//     seven printed sections with every single-event field null; palli compilation with every
//     single-event field null and no manufactured component dates/venues; English is project-created,
//     never presented as source-published.

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const [, , AS_REPO, PS_REPO] = process.argv;
if (!AS_REPO || !PS_REPO) { console.error("usage: node scripts/validate-speeches-wave6.mjs <assembly-clone> <public-clone>"); process.exit(1); }

const root = process.cwd();
let checks = 0; const failures = [];
const ok = (c, l) => { checks++; if (!c) failures.push(l); };
const eq = (a, b, l) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const sha256File = (p) => createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const rev = (repo, ref) => { try { return execFileSync("git", ["-C", repo, "rev-parse", ref], { encoding: "utf8" }).trim(); } catch { return "(missing)"; } };

// ── FROZEN PINS ────────────────────────────────────────────────────────────────────────────────
const AS_COMMIT = "10ccbf4f18b82d078b818892b9c4a745e2eb30d7";
const PS_COMMIT = "b7b0933cdd68c3fea6f237a4c63fd9a100efc74f";
const WORKS = {
  "namathu-nilai": {
    repo: AS_REPO, sourcePath: "speeches/1971/1971-namathu-nilai", subtree: "6aafbb1e5573ceb4561e6d5e27413396de635144",
    scanSha: "5cfbf0e5d01a9cedb252a12168e9e6a14a9a2061c7d78848dde692d5fa241acb",
    speechSha: "5d15a03c11831812ae7e48028c3b367a0ed962b18264d1135c7d830c73cf0faa",
    provSha: "e771c069326e06662570548eebffd279a9007790dbfa1826a4191261bc14316f",
    files: { ta: "transcript.md", en: "translation.md" }, pageMarker: "html-comment",
    wrapperTa: /^#\s+தமிழ்\s*மூல\s*உரை\s*$/, wrapperEn: /^#\s+English translation\s*$/,
    subtype: "assembly-speech",
    pages: { from: 3, to: 60, count: 58 },
  },
  "idhaya-perikai": {
    repo: PS_REPO, sourcePath: "speeches/idhaya-perikai", subtree: "065a6354d0215762509b109ded4f7951d617ca60",
    scanSha: "4217717379b028de17ed9830dac4bdfd54ae7256705b891c207d646707640b9d",
    speechSha: "80c3f6c2f1a75acc03d6dbfc35c982fac5a5ab4b70ce7f934e9414dff7b969db",
    provSha: "f292bcb4bfe07ac923524a41f3e33110fc0bd720bb75d1d9f239d3e62e288d70",
    files: { ta: "transcription-ta.md", en: "translation-en.md" }, pageMarker: "pdf-printed",
    subtype: "public-speech",
    pages: { from: 3, to: 34, count: 32 }, printedSections: 7,
  },
  "palli-vazhkkai": {
    repo: PS_REPO, sourcePath: "speeches/palli-vazhkkai", subtree: "46d49f25d0c2d6543a4888034d77f637cd654382",
    scanSha: "e20bf80e8e5b65abbfdb5bcefbdaf85b8e5385112f6de8efcc0e733ed3aceea3",
    speechSha: "5111c7af64062dec4d2881f173b9047ce95155a721757b86b819940cfb6c059b",
    provSha: "12d64c29c14b48cf1e8891aa054e8669b7f34aba163a250a4e3c3061e1a6d546",
    files: { ta: "transcription-ta.md", en: "translation-en.md" }, pageMarker: "pdf-printed",
    subtype: "public-speech",
    pages: { from: 5, to: 80, count: 76 },
  },
};

// Fail-closed pins.
eq(rev(AS_REPO, "HEAD"), AS_COMMIT, "assembly-speeches clone HEAD == frozen commit");
eq(rev(PS_REPO, "HEAD"), PS_COMMIT, "public-speeches clone HEAD == frozen commit");

const PDF_PAGE_RE = /^#{1,6}\s+PDF page\s+(\d+)\s*(?:[—–-])\s*printed page\s+(\d+)\s*$/;
const HTML_PAGE_RE = /^<!--\s*source-page:\s*(\d+)\s*-->\s*$/;
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;

// INDEPENDENT source reading text: the ordered reading strings (heading texts and paragraph texts)
// drawn straight from the raw transcript/translation, joined by "\n". Apparatus, page markers and
// heading markers are the only things removed; literary text is untouched.
// This re-derivation is INDEPENDENT of the importer: it re-reads the RAW source and preserves every
// literary byte (paragraph text and heading content) EXACTLY — a trailing-whitespace-tolerant probe is
// used for structural recognition only, never applied to the literary strings themselves. It returns
// the reading text plus page coverage so the coverage gate can prove the whole body was consumed.
function sourceReading(text, W, layer) {
  const lines = text.split("\n");
  const isPageMarker = (l) => (W.pageMarker === "html-comment" ? HTML_PAGE_RE.exec(l) : PDF_PAGE_RE.exec(l));
  const pageOf = (m) => (W.pageMarker === "html-comment" ? Number(m[1]) : Number(m[2]));
  let start;
  if (W.pageMarker === "html-comment") {
    const wrap = layer === "ta" ? W.wrapperTa : W.wrapperEn;
    start = lines.findIndex((l) => wrap.test(l.replace(/\s+$/, ""))) + 1;
  } else {
    start = lines.findIndex((l) => isPageMarker(l.replace(/\s+$/, "")));
  }
  const out = [];
  const pages = new Set();
  let page = null, stoppedAt = null;
  for (let i = start; i < lines.length; i++) {
    const rawLine = lines[i];
    const probe = rawLine.replace(/\s+$/, "");
    const pm = isPageMarker(probe);
    if (pm) { page = pageOf(pm); pages.add(page); continue; }
    if (probe.trim() === "") continue;
    if (/^-{3,}$/.test(probe)) { if (page === W.pages.to) { stoppedAt = page; break; } continue; }
    if (/^<!--[\s\S]*-->$/.test(probe)) continue;
    const hm = /^(#{1,6})[ \t]+/.exec(rawLine);
    if (hm) { if (W.pageMarker === "pdf-printed" && hm[1].length === 2) { stoppedAt = page; break; } out.push(rawLine.slice(hm[0].length)); continue; }
    out.push(rawLine);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  return { text: out.join("\n"), first: sorted[0] ?? null, last: sorted[sorted.length - 1] ?? null, count: sorted.length, stoppedAt };
}
// Generated reading text: the same ordered reading strings, reconstructed from speech.json blocks.
function generatedReadingText(stream) {
  const out = [];
  for (const b of stream.blocks) {
    if (b.kind === "heading") out.push(b.text);
    else if (b.kind === "paragraph") out.push(b.segments.map((s) => s.text).join(""));
    else if (b.kind === "note") out.push(b.text);
  }
  return out.join("\n");
}

for (const [slug, W] of Object.entries(WORKS)) {
  eq(rev(W.repo, `HEAD:${W.sourcePath}`), W.subtree, `${slug}: frozen subtree tree`);
  const dir = path.join(root, "public/data/speeches", slug);
  eq(sha256File(path.join(dir, "speech.json")), W.speechSha, `${slug}: speech.json SHA-256 pinned`);
  eq(sha256File(path.join(dir, "provenance.json")), W.provSha, `${slug}: provenance.json SHA-256 pinned`);
  const speech = JSON.parse(fs.readFileSync(path.join(dir, "speech.json"), "utf8"));
  const prov = JSON.parse(fs.readFileSync(path.join(dir, "provenance.json"), "utf8"));

  eq(speech.date, null, `${slug}: date is null`);
  eq(speech.shelf, "speeches", `${slug}: shelf speeches`);
  eq(speech.subtype, W.subtype, `${slug}: subtype`);
  eq(speech.sourceCommit, W.subtype === "assembly-speech" ? AS_COMMIT : PS_COMMIT, `${slug}: sourceCommit frozen`);
  eq(prov.source.scanSha256, W.scanSha, `${slug}: provenance records the frozen scan SHA-256`);
  eq(prov.projectRights.rightsStatus, "nationalised-by-tamil-nadu-government", `${slug}: nationalisation recorded`);
  eq(prov.translation.englishKind, "project-created", `${slug}: English is project-created (not source-published)`);

  // ── THE FIDELITY GATE ────────────────────────────────────────────────────────────────────────
  const taRaw = fs.readFileSync(path.join(W.repo, W.sourcePath, W.files.ta), "utf8");
  const enRaw = fs.readFileSync(path.join(W.repo, W.sourcePath, W.files.en), "utf8");
  const taSrc = sourceReading(taRaw, W, "ta");
  const enSrc = sourceReading(enRaw, W, "en");
  eq(generatedReadingText(speech.tamil), taSrc.text, `${slug}: Tamil source→generated reading text byte-identical`);
  eq(generatedReadingText(speech.english), enSrc.text, `${slug}: English source→generated reading text byte-identical`);
  // Verbatim spot-proof: every generated heading text exists verbatim in the raw source.
  for (const b of speech.tamil.blocks.filter((x) => x.kind === "heading")) ok(taRaw.includes(b.text), `${slug}: Tamil heading "${b.text.slice(0, 24)}…" verbatim in source`);

  // ── COVERAGE: the whole canonical body was consumed; a trailing-apparatus stop (HR after the final
  // page, or a non-page H2) fired only AT the final expected body page, never earlier. Independently
  // derived from raw source and cross-checked against the generated payload's own sourcePages.
  for (const [layer, src] of [["ta", taSrc], ["en", enSrc]]) {
    eq(src.first, W.pages.from, `${slug}/${layer}: reading body starts at source page ${W.pages.from}`);
    eq(src.last, W.pages.to, `${slug}/${layer}: reading body reaches the final source page ${W.pages.to}`);
    eq(src.count, W.pages.count, `${slug}/${layer}: exactly ${W.pages.count} source body pages`);
    ok(src.stoppedAt === null || src.stoppedAt === W.pages.to, `${slug}/${layer}: any trailing-apparatus stop fired only at the final body page (not early)`);
  }
  eq(speech.sourcePages, Array.from({ length: W.pages.count }, (_, k) => W.pages.from + k), `${slug}: generated sourcePages == exact contiguous body range ${W.pages.from}–${W.pages.to}`);
  if (W.printedSections) eq(speech.tamil.blocks.filter((b) => b.kind === "heading").length, W.printedSections, `${slug}: exactly ${W.printedSections} printed section headings`);
}

// ── PER-WORK SEMANTIC SAFEGUARDS ─────────────────────────────────────────────────────────────────
const load = (s) => JSON.parse(fs.readFileSync(path.join(root, "public/data/speeches", s, "speech.json"), "utf8"));
const loadProv = (s) => JSON.parse(fs.readFileSync(path.join(root, "public/data/speeches", s, "provenance.json"), "utf8"));

// நமது நிலை — edited two-House witness
{
  const s = load("namathu-nilai"); const pr = loadProv("namathu-nilai");
  eq(s.date, null, "namathu date null (not a single dated Assembly/Council transcript)");
  ok(/பேரவை/.test(s.legislature.nameTa) && /மேலவை/.test(s.legislature.nameTa), "namathu legislature names BOTH Houses (Assembly + Council)");
  ok(/Assembly/.test(s.legislature.nameEn) && /Council/.test(s.legislature.nameEn), "namathu legislature English names both Houses");
  ok(!!s.event && !!s.event.ta && !!s.event.en, "namathu carries the compilation event (not a single sitting)");
  const eu = s.tamil.blocks.filter((b) => b.kind === "heading" && /^Editorial unit\s+\d/i.test(b.text));
  eq(eu.length, 2, "namathu keeps the two editorial units distinct");
  ok(pr.semantics.twoHouseWitness === true && !!pr.semantics.legislatureScopeNote, "namathu provenance records the two-House witness + scope note");
  // TEXTUAL-AUTHORITY GATE (replaces the removed always-passing tautology). Read the frozen Namathu source
  // metadata independently and require the machine-readable authority facts, then require the generated
  // provenance to reproduce them EXACTLY. This is provenance evidence, not a prose scan for a phrase.
  const nnMeta = JSON.parse(fs.readFileSync(path.join(WORKS["namathu-nilai"].repo, WORKS["namathu-nilai"].sourcePath, "metadata.json"), "utf8"));
  eq(nnMeta.source.only_textual_authority, true, "namathu SOURCE: only_textual_authority === true");
  eq(nnMeta.transcription.external_legislative_text_imported, false, "namathu SOURCE: transcription.external_legislative_text_imported === false");
  eq(nnMeta.translation.external_legislative_wording_imported, false, "namathu SOURCE: translation.external_legislative_wording_imported === false");
  eq(pr.source.onlyTextualAuthority, true, "namathu provenance reproduces onlyTextualAuthority === true");
  eq(pr.source.externalLegislativeTextImported, false, "namathu provenance reproduces externalLegislativeTextImported === false");
  eq(pr.source.externalLegislativeWordingImported, false, "namathu provenance reproduces externalLegislativeWordingImported === false");
}

// இதய பேரிகை — multi-section booklet
{
  const s = load("idhaya-perikai"); const pr = loadProv("idhaya-perikai");
  eq(s.date, null, "idhaya date null"); eq(s.venue, null, "idhaya venue null"); eq(s.event, null, "idhaya event null");
  eq(s.occasion, null, "idhaya occasion null"); eq(s.audience, null, "idhaya audience null");
  eq(s.year, null, "idhaya year null (publication year not substituted for a speech year)");
  const secs = s.tamil.blocks.filter((b) => b.kind === "heading").length;
  eq(secs, 7, "idhaya preserves the seven printed sections as headings");
  ok(pr.semantics.dateNull && pr.semantics.venueNull && pr.semantics.eventNull && pr.semantics.occasionNull && pr.semantics.audienceNull, "idhaya provenance records all five single-event fields null");
}

// பள்ளி வாழ்க்கை — compilation
{
  const s = load("palli-vazhkkai"); const pr = loadProv("palli-vazhkkai");
  eq(s.date, null, "palli date null"); eq(s.venue, null, "palli venue null"); eq(s.event, null, "palli event null");
  eq(s.occasion, null, "palli occasion null"); eq(s.audience, null, "palli audience null");
  eq(s.year, null, "palli year null (publication year not substituted for a speech year)");
  ok(!!pr.semantics.compiler, "palli provenance records the compiler (compilation, not a single speech)");
  ok(!!pr.semantics.namedVenueTa && !!pr.semantics.otherVenuesSourceText, "palli provenance records the named venue + 'other places' source text, not a single venue field");
  ok(pr.semantics.dateNull && pr.semantics.venueNull, "palli provenance records date/venue null");
}

if (failures.length) {
  console.error(`\nvalidate-speeches-wave6 — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures.slice(0, 40)) console.error("  ✗ " + f);
  if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
  process.exit(1);
}
console.log(`\nvalidate-speeches-wave6 — ${checks} checks, 0 failed`);
console.log("  3 speeches · source→generated reading text byte-identical (Tamil & English) · date:null everywhere");
console.log("  நமது நிலை two-House witness · இதய பேரிகை 7 sections (all single-event fields null) · பள்ளி வாழ்க்கை compilation (no component dates/venues)");
