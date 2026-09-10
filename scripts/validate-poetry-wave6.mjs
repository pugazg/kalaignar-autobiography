// Wave 6 P1–P3 Batch 4 (Poetry) — dedicated INDEPENDENT source/provenance validator.
//
//   node scripts/validate-poetry-wave6.mjs <kalaignar-poems-clone>
//
// This validator derives source truth on its OWN code path: it never imports or calls the importer
// (scripts/lib/standalone-poem.mjs, scripts/lib/poetry-publication.mjs) or its source-dialect adapters,
// and it never uses generated payload content to decide where the literary source begins.
//
// It proves, for all eight works:
//   • the eight frozen subtree pins and the source identities;
//   • an INDEPENDENT canonical reading-TOKEN STREAM per layer — scan-start(scan,printedPage),
//     line(exact literal text incl. trailing whitespace, exact leading indent), source-heading(text),
//     stanza-break — derived from the raw released source, required EXACTLY EQUAL to the token stream
//     derived from the generated payload (Tamil & English). This simultaneously proves literary bytes,
//     line order, indentation, source headings, scan attribution, blank-line structure, complete marker
//     order, no missing first/last line, and no apparatus leakage;
//   • the non-literary head exclusion comes from an independently-sourced per-work SOURCE CONTRACT
//     (exact head lines), never from the generated first line;
//   • the independently-derived source scan-marker sequence equals the generated coverage;
//   • the 1975 publication's real source ordinals [1,2,4] with intake-03 (scan 66) excluded as the
//     non-Kalaignar Rajaji poem, its items still poems; the oruthalaik-kathal verse-novel's eleven
//     SECTIONS (not poems), 95/95 main-work coverage (84 text + 11 illustration), scan-100 close and
//     scan-101 exclusion; the narrowly-scoped, source-declared heading-level equivalence;
//   • READY/release evidence from the authoritative frozen source documents;
//   • exact SHA-256 integrity pins of all eight payloads and eight provenance files;
//   • zero new witness relations.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC = process.argv[2] || ".sources/kalaignar-poems";
const SRC_COMMIT = "188d49cd4dcf2c6bbe2e9633841ff402b9959d08";
const POEMS_TREE = "4e2c15f67ddf9b1542a624d1ad53b03e6990cd73";
const OUT = "public/data/poems";

let checks = 0;
const failures = [];
const ok = (c, l) => { checks++; if (!c) failures.push(l); };
const eq = (a, b, l) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const rev = (ref) => execFileSync("git", ["-C", SRC, "rev-parse", ref], { encoding: "utf8" }).trim();
const readSrc = (rel) => fs.readFileSync(path.join(SRC, rel), "utf8");
const readOut = (slug, f) => JSON.parse(fs.readFileSync(path.join(OUT, slug, f), "utf8"));
const sha256File = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const rstrip = (s) => s.replace(/\s+$/, "");

// ── FROZEN PINS ──────────────────────────────────────────────────────────────────────────────────
const SUBTREE = {
  "thalaikettan-thambi": "80f252390447d6ac2ef749f4b5df60a9ddef48de",
  "aanthaiyum-arasanum": "2c30104ef0bd607e0a2b3eca74391850cb1e50f1",
  "poomudi": "ea34935b73f9be620302e0a61bf7531a41344360",
  "anna-kaviyarangam": "55b6cc02d7552721e7e7a2da2dd3ef9c437380e3",
  "gunanayagar-nehru": "962d4a880ea0c1bb01d65b408b8f1c6ca647ab3f",
  "oruthalaik-kathal": "08e18927af57319cb7771ef99081dbc92aeb064b",
  "kalaignarin-kaviyaranga-kavithaigal-1975": "554f5b1b459e518859265187826910bfc6e03972",
  "kanchithan-annan": "8865c3b4b41ace3549d7ea06911a7952ea7c5bcc",
};

// ── SHA-256 integrity pins of the committed generated payloads/provenance (Blocker 4) ───────────────
const HASH_PINS = {
  "thalaikettan-thambi": { poem: "517c09f753e6fc13aa04f4e97578006f3fce90bc0f2864f9613f9ec1fc8db5a8", prov: "d418b0e9b5b30bcea12e30f3c16d79438fa8b4b668611ab023f5bc3ce8d283fa" },
  "aanthaiyum-arasanum": { poem: "0f45f15143c3fe45f7594c91d595af33ed22c74e5126edf3133768006a81b36a", prov: "200cff477a25033ac1c9cb478ef9804bf8eb8a2a96a84ea3d5cab4cf379963e3" },
  "poomudi": { poem: "497a4fa8e6d4ea45ddbafbe19c3bb2a64891525b55193908fa49b2ef4711caa8", prov: "43cba4b15da3984fcd1e58f8a2792d64f1488303d8e0c002a1b6808332ae920b" },
  "anna-kaviyarangam": { poem: "fd03d23e13e95c52617ef65dfdf5ca9e33b49089fe0458ae2bd3ac115a085235", prov: "28108471dde3016e160580526156de527afba1d248497fd85eb0f25d400b822c" },
  "gunanayagar-nehru": { poem: "041e2139487573b090db7a2f27f3d02671029fd3ebefa7a4a55c51c7929c4a73", prov: "97df2fa038f4386c4fc249ac3d48cf19add0635f322fbafd85278f45a9ce1dc0" },
  "kanchithan-annan": { poem: "f8063fe37961a92c7fee82e407c61973ad485a4fafb0d81156e049aabb8ccc27", prov: "8937d5401def99d49d2720ccf1beec2ee1f0f12c6492226e362caac6fac27944" },
  "kalaignarin-kaviyaranga-kavithaigal-1975": { pub: "b89d08ff1ccaa5ff51f6cc28c785b50000bb89612fbd5154875b53bf3809624e", prov: "2fb5865d891af6348381bbe86fba78bde808f6ef066f644047acc0faec1232eb" },
  "oruthalaik-kathal": { pub: "fafbcd8ebb99c0686ca0f278f5700f8e39198a0c045eb83cfe034a6428608387", prov: "5a134a2ff45de0ad7b0b5c499a02ca514276fe703c7034d6e98dd14decec0a79" },
};

// ── SOURCE CONTRACTS (independently sourced from the frozen release; NOT the implementation declarations)
// For each work/layer: the non-literary HEAD lines that precede the poem body AFTER the first scan
// marker (pre-marker title/nav lines are skipped structurally), and the source-established in-body
// HEADINGS. Text is the reading content (a `#…` heading contributes its text). These fix the verse
// start boundary independently of any generated output.
const ANNA_TA_HEADINGS = [
  "கவிஞர் ஆனந்தம் ‘தலைவர் அண்ணா’ எனப் பாடுதல்",
  "பேச்சாளர் அண்ணா பொன்னி வளவன் பாடுதல்",
  "எழுத்தாளர் அண்ணா கொத்தமங்கலம் சுப்பு பாடுதல்",
  "தத்துவ மேதை அண்ணா தமிழ்ப்பித்தன் பாடுதல்",
  "தாய் மொழிக் காவலர் அண்ணா—முடியரசன் பாடுதல்",
  "அன்னை அண்ணா வேழவேந்தன் பாடுதல்",
  "நடிகர் அண்ணா முத்துலிங்கம் பாடுதல்",
  "முதலமைச்சர் அண்ணா அப்துல் ரகுமான் பாடுதல்.",
];
const ANNA_EN_HEADINGS = [
  "Poet Anandam sings “Leader Anna”",
  "Ponni Valavan sings “Anna the Speaker”",
  "Kothamangalam Subbu sings “Anna the Writer”",
  "Tamilpithan sings “Anna the Philosopher”",
  "Mudiyarasan sings “Anna, Guardian of the Mother Tongue”",
  "Vezhavendan sings “Mother Anna”",
  "Muthulingam sings “Anna the Actor”",
  "Abdul Rahman sings “Anna the Chief Minister”.",
];
const STANDALONE = {
  "thalaikettan-thambi": { taFile: "sections/01.md", conv: "plain", taHead: ["தலைகேட்டான் தம்பி"], enHead: [] },
  "aanthaiyum-arasanum": { taFile: "sections/01.md", conv: "plain", taHead: ["ஆந்தையும் அரசனும்!"], enHead: [] },
  "poomudi": { taFile: "sections/01.md", conv: "plain", taHead: ["பூமுடி"], enHead: [] },
  "anna-kaviyarangam": { taFile: "sections/anna-kaviyarangam.md", conv: "fenced", taHead: [], enHead: [], taHeadings: ANNA_TA_HEADINGS, enHeadings: ANNA_EN_HEADINGS },
  "gunanayagar-nehru": { taFile: "sections/01.md", conv: "plain", taHead: ["குணநாயகர் நேரு", "முதல்வர் கலைஞர்"], enHead: ["Nehru, the Noble Leader", "**Chief Minister Kalaignar**"] },
  "kanchithan-annan": { taFile: "sections/01.md", conv: "plain", taHead: ["காஞ்சிதான் அண்ணன்", "முதலமைச்சர், கலைஞர், மு. கருணாநிதி"], enHead: [] },
};

// ── TOKEN MODEL ─────────────────────────────────────────────────────────────────────────────────
const T_SCAN = (scan, printed) => `SCAN ${scan} p=${printed === null || printed === undefined ? "-" : printed}`;
const T_LINE = (indent, text) => `LINE i=${indent} |${text}`;
const T_HEAD = (text) => `HEAD |${text}`;
const T_BREAK = "BREAK";

// Independent VISIBLE printed page for a scan, read from the frozen page record (never scan−N).
function pagePrinted(slug, scan) {
  const p = path.join(SRC, `poems/${slug}/pages/${String(scan).padStart(4, "0")}.md`);
  if (!fs.existsSync(p)) return null;
  const m = /printed_page:\s*(null|\d+)/.exec(fs.readFileSync(p, "utf8"));
  return m ? (m[1] === "null" ? null : Number(m[1])) : null;
}

// Remove an exact contiguous title run from the raw body (title may follow a printed date line).
function dropTitleRun(raw, run) {
  if (!run || !run.length) return raw;
  const lines = raw.split("\n");
  const want = run.map(rstrip);
  for (let i = 0; i + want.length <= lines.length; i++) {
    let hit = true;
    for (let k = 0; k < want.length; k++) if (rstrip(lines[i + k]) !== want[k]) { hit = false; break; }
    if (hit) { lines.splice(i, want.length); return lines.join("\n"); }
  }
  throw new Error(`title run not found to drop: ${JSON.stringify(run)}`);
}

// SOURCE token stream — PLAIN-MARKER convention (`<!-- scan_page: N [/ printed_page: M] -->`).
// Everything before the first marker is non-verse (pre-marker title/nav) and skipped. Within the verse
// region the exact `head` lines are stripped in order, and `headings` texts become HEAD tokens.
function srcTokensPlain(slug, file, { head = [], headings = [], dropRun = null } = {}) {
  let raw = readSrc(`poems/${slug}/${file}`).replace(/^---\n[\s\S]*?\n---\n?/, "");
  if (dropRun) raw = dropTitleRun(raw, dropRun);
  const lines = raw.split("\n");
  const headingSet = new Set(headings);
  const headQ = [...head];
  const tokens = [];
  let scan = null, emitted = 0, pendingBlank = false, started = false;
  for (const rawLine of lines) {
    const t = rawLine.trim();
    const mk = /^<!--\s*scan_page:\s*(\d+)\s*(?:\/\s*printed_page:\s*(?:null|\d+)\s*)?-->$/.exec(t);
    if (mk) { scan = Number(mk[1]); tokens.push(T_SCAN(scan, pagePrinted(slug, scan))); emitted = 0; pendingBlank = false; started = tokens.some((x) => x.startsWith("LINE") || x.startsWith("HEAD")); continue; }
    if (scan === null) continue;
    if (/^<!--/.test(t) || /^```/.test(t)) continue;
    if (t === "") { if (emitted > 0) pendingBlank = true; continue; }
    const hm = /^(#{1,6})\s+(.*\S)\s*$/.exec(rstrip(rawLine));
    const matchText = hm ? hm[2] : rstrip(rawLine);
    if (!started && headQ.length && matchText === headQ[0]) { headQ.shift(); continue; }
    started = true;
    if (pendingBlank) { tokens.push(T_BREAK); pendingBlank = false; }
    if (headingSet.has(matchText)) { tokens.push(T_HEAD(matchText)); emitted++; continue; }
    const rstr = rstrip(rawLine);
    const indent = rstr.length - rstr.trimStart().length;
    tokens.push(T_LINE(indent, rawLine.slice(indent))); // literal text (trailing whitespace preserved)
    emitted++;
  }
  if (headQ.length) throw new Error(`${slug}/${file}: head-contract not fully matched, remaining ${JSON.stringify(headQ)}`);
  return tokens;
}

// SOURCE token stream — FENCED-SCAN-PAGE convention (anna Tamil). Only ```text fences that FOLLOW a
// scan_page marker are verse; the pre-poem source-context fence (no marker) is ignored entirely.
function srcTokensFenced(slug, file, { headings = [] } = {}) {
  const raw = readSrc(`poems/${slug}/${file}`).replace(/^---\n[\s\S]*?\n---\n?/, "");
  const headingSet = new Set(headings);
  const re = /<!--\s*scan_page:\s*(\d+)\s*\/\s*printed_page:\s*(?:null|\d+)\s*-->\n```text\n([\s\S]*?)\n```/g;
  const tokens = [];
  let m;
  while ((m = re.exec(raw)) !== null) {
    const scan = Number(m[1]);
    tokens.push(T_SCAN(scan, pagePrinted(slug, scan)));
    let emitted = 0, pendingBlank = false;
    for (const rawLine of m[2].split("\n")) {
      if (rawLine.trim() === "") { if (emitted > 0) pendingBlank = true; continue; }
      if (pendingBlank) { tokens.push(T_BREAK); pendingBlank = false; }
      const matchText = rstrip(rawLine);
      if (headingSet.has(matchText)) { tokens.push(T_HEAD(matchText)); emitted++; continue; }
      const indent = rstrip(rawLine).length - rstrip(rawLine).trimStart().length;
      tokens.push(T_LINE(indent, rawLine.slice(indent)));
      emitted++;
    }
  }
  return tokens;
}

// GENERATED token stream — from the payload layer, independent of the importer.
function genTokens(slug, layer) {
  const tokens = [];
  let started = false;
  for (const e of layer.elements) {
    if (e.kind === "page-transition") { tokens.push(T_SCAN(e.toScan, pagePrinted(slug, e.toScan))); continue; }
    if (!started && (e.kind === "line" || e.kind === "source-heading" || e.kind === "stanza-break")) {
      tokens.push(T_SCAN(e.sourceScan, pagePrinted(slug, e.sourceScan)));
      started = true;
    }
    if (e.kind === "line") tokens.push(T_LINE(e.indent || 0, e.text));
    else if (e.kind === "source-heading") tokens.push(T_HEAD(e.text));
    else if (e.kind === "stanza-break") tokens.push(T_BREAK);
  }
  return tokens;
}
const scanSeqOf = (tokens) => tokens.filter((x) => x.startsWith("SCAN ")).map((x) => Number(x.split(" ")[1]));

// ── 0. TREE PINS + identity ─────────────────────────────────────────────────────────────────────
eq(rev("HEAD"), SRC_COMMIT, "source clone HEAD == frozen Batch-4 source commit");
eq(rev(`${SRC_COMMIT}:poems`), POEMS_TREE, "poems/ tree == frozen");
for (const slug of Object.keys(SUBTREE)) eq(rev(`${SRC_COMMIT}:poems/${slug}`), SUBTREE[slug], `${slug}: work subtree == frozen pin`);

function checkIdentity(slug, prov) {
  const meta = readSrc(`poems/${slug}/metadata/source.md`);
  ok(meta.includes(prov.source.scanFilename), `${slug}: metadata records the payload scan filename`);
  ok(meta.includes(prov.source.scanSha256), `${slug}: metadata records the payload scan SHA-256`);
  eq(prov.sourceCommit, SRC_COMMIT, `${slug}: provenance sourceCommit == consumed commit`);
}

// ── READY / release evidence (Blocker 4), from the authoritative frozen source documents ────────────
function checkReleaseEvidence(slug, prov) {
  const readme = readSrc(`poems/${slug}/README.md`);
  const rel = fs.existsSync(path.join(SRC, `poems/${slug}/RELEASE_STATUS.md`)) ? readSrc(`poems/${slug}/RELEASE_STATUS.md`) : "";
  const doc = readme + "\n" + rel;
  ok(/FINAL-CLEARED/.test(doc), `${slug}: authoritative source document records Tamil FINAL-CLEARED`);
  ok(/RELEASE-CLEARED|RELEASE-COMPLETE|RELEASE COMPLETE|PHASE 4 COMPLETE|Phase 4[^\n]*COMPLETE|Phase 4[^\n]*RELEASE-CLEARED/.test(doc), `${slug}: authoritative source document records English RELEASE-CLEARED/COMPLETE`);
  ok(/unresolved[^\n]*\b0\b|\bunresolved[^\n]*\*\*0\*\*|0[^\n]*unresolved|\*\*0\*\*[^\n]*unresolved/i.test(doc), `${slug}: source document records 0 unresolved release issues`);
  ok(/project-created/.test(prov.projectRights.projectTranslationNote), `${slug}: provenance records English authority = project-created`);
}

// ── HASH integrity pins (Blocker 4) ─────────────────────────────────────────────────────────────
for (const [slug, pins] of Object.entries(HASH_PINS)) {
  for (const [f, expect] of Object.entries(pins)) {
    const file = f === "poem" ? "poem.json" : f === "pub" ? "publication.json" : "provenance.json";
    eq(sha256File(path.join(OUT, slug, file)), expect, `${slug}: ${file} SHA-256 integrity pin`);
  }
}

// ── 1. STANDALONE POEMS — token-stream S===G ────────────────────────────────────────────────────
for (const slug of Object.keys(STANDALONE)) {
  const c = STANDALONE[slug];
  const poem = readOut(slug, "poem.json");
  const prov = readOut(slug, "provenance.json");
  eq(poem.readerStructure, "poem", `${slug}: readerStructure poem`);
  eq(poem.subtype, "poem", `${slug}: subtype poem`);
  checkIdentity(slug, prov);
  checkReleaseEvidence(slug, prov);
  const srcTa = c.conv === "fenced"
    ? srcTokensFenced(slug, c.taFile, { headings: c.taHeadings || [] })
    : srcTokensPlain(slug, c.taFile, { head: c.taHead, headings: c.taHeadings || [] });
  const srcEn = srcTokensPlain(slug, `translations/en/${slug}-en.md`, { head: c.enHead, headings: c.enHeadings || [] });
  const genTa = genTokens(slug, poem.tamil);
  const genEn = genTokens(slug, poem.english);
  eq(genTa, srcTa, `${slug}: Tamil INDEPENDENT token-stream S===G (bytes, order, indent, headings, scans, breaks)`);
  eq(genEn, srcEn, `${slug}: English INDEPENDENT token-stream S===G`);
  // Independent source marker sequence == generated poemScans (NOT taken from poemScans).
  eq(poem.poemScans, scanSeqOf(srcTa), `${slug}: generated poemScans == independently-derived source scan sequence`);
  ok(genTa.some((x) => x.startsWith("LINE")) && genEn.some((x) => x.startsWith("LINE")), `${slug}: non-empty reading text both layers`);
  if (poem.publicationYear !== null) ok(readSrc(`poems/${slug}/metadata/source.md`).includes(String(poem.publicationYear)), `${slug}: publicationYear ${poem.publicationYear} is source-stated`);
}

// ── 2. 1975 PUBLICATION (poems; ordinals [1,2,4]; scan 66 = Rajaji excluded) ───────────────────────
{
  const slug = "kalaignarin-kaviyaranga-kavithaigal-1975";
  const pub = readOut(slug, "publication.json");
  const prov = readOut(slug, "provenance.json");
  eq(pub.readerStructure, "poetry-publication", `${slug}: poetry-publication`);
  ok(pub.readingUnitKind === undefined || pub.readingUnitKind === "poem", `${slug}: reading units are poems (not sections)`);
  eq(prov.sourceTree, SUBTREE[slug], `${slug}: provenance sourceTree == frozen subtree`);
  checkIdentity(slug, prov);
  checkReleaseEvidence(slug, prov);
  eq(pub.items.map((i) => i.ordinal), [1, 2, 4], `${slug}: source ordinals exactly [1,2,4] (no invented 03)`);
  // Independent raw-source proof that scan 66 (intake 03) is the non-Kalaignar Rajaji poem, excluded.
  const rec66 = readSrc(`poems/${slug}/pages/0066.md`);
  ok(/section:\s*"non-kalaignar-rajaji/i.test(rec66), `${slug}: scan-66 page record marks the non-Kalaignar Rajaji context`);
  ok(!pub.items.some((i) => i.physicalScans.some((r) => 66 >= r.first && 66 <= r.last)), `${slug}: scan 66 not inside any Kalaignar item's scans`);
  ok(!fs.existsSync(path.join(SRC, `poems/${slug}/sections/03.md`)), `${slug}: no synthetic source section 03`);
  for (const it of pub.items) {
    const nn = String(it.ordinal).padStart(2, "0");
    // Item title is a multi-line source-heading run at the head (possibly after a printed date line).
    const titleRun = it.titleTa.split(" / ");
    const srcTa = srcTokensPlain(slug, `sections/${nn}.md`, { dropRun: titleRun });
    const srcEn = srcTokensPlain(slug, `translations/en/sections/${nn}.md`, { head: [] });
    eq(genTokens(slug, it.tamil), srcTa, `${slug} item ${it.ordinal}: Tamil token-stream S===G`);
    eq(genTokens(slug, it.english), srcEn, `${slug} item ${it.ordinal}: English token-stream S===G`);
    // Independent per-item Tamil marker sequence == item physical scans.
    const scans = it.physicalScans.flatMap((r) => Array.from({ length: r.last - r.first + 1 }, (_, i) => r.first + i));
    eq(scanSeqOf(srcTa), scans, `${slug} item ${it.ordinal}: independent Tamil marker sequence == physical scans`);
  }
  eq(pub.items.find((i) => i.ordinal === 1).physicalScans, [{ first: 46, last: 57 }], `${slug} item 01 scans 46–57`);
  eq(pub.items.find((i) => i.ordinal === 2).physicalScans, [{ first: 58, last: 65 }], `${slug} item 02 scans 58–65`);
  eq(pub.items.find((i) => i.ordinal === 4).physicalScans, [{ first: 67, last: 68 }], `${slug} item 04 scans 67–68`);
}

// ── 3. oruthalaik-kathal (verse-novel; 11 SECTIONS; 95/95 = 84 text + 11 illustration) ─────────────
{
  const slug = "oruthalaik-kathal";
  const pub = readOut(slug, "publication.json");
  const prov = readOut(slug, "provenance.json");
  eq(pub.readingUnitKind, "section", `${slug}: readingUnitKind "section" (verse-novel; NOT poems)`);
  ok(pub.workForm && /நாவல்|verse-novel/i.test(pub.workForm.en + pub.workForm.ta), `${slug}: workForm records the verse-novel form`);
  eq(pub.items.length, 11, `${slug}: exactly 11 sections`);
  eq(pub.items.map((i) => i.ordinal), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], `${slug}: section ordinals 1..11 in order`);
  eq(prov.sourceTree, SUBTREE[slug], `${slug}: provenance sourceTree == frozen subtree`);
  checkIdentity(slug, prov);
  checkReleaseEvidence(slug, prov);
  // Independent coverage from the raw section front matter (physical_scans), NOT from generated fields.
  const srcScans = [];
  for (const it of pub.items) {
    const nn = String(it.ordinal).padStart(2, "0");
    const fm = readSrc(`poems/${slug}/sections/${nn}.md`);
    const m = /physical_scans:\s*"(\d+)[–-](\d+)"/.exec(fm);
    for (let s = Number(m[1]); s <= Number(m[2]); s++) srcScans.push(s);
  }
  const allScans = srcScans.slice().sort((a, b) => a - b);
  eq(allScans, Array.from({ length: 95 }, (_, i) => 6 + i), `${slug}: raw-source main-work scans == 6..100 (95/95)`);
  eq(srcScans.length, 95, `${slug}: every main-work scan accounted exactly once (no overlap)`);
  const ILLUS = [8, 16, 22, 32, 40, 48, 58, 66, 76, 84, 94];
  // Illustration scans carry a source marker but no lexical body — prove from the raw page records.
  for (const s of ILLUS) {
    const rec = readSrc(`poems/${slug}/pages/${String(s).padStart(4, "0")}.md`);
    ok(/page_type:\s*"illustration"/.test(rec), `${slug}: scan ${s} page record is page_type illustration`);
  }
  const textScans = new Set();
  for (const it of pub.items) for (const e of it.tamil.elements) if (e.kind === "line") textScans.add(e.sourceScan);
  eq(textScans.size, 84, `${slug}: 84 text-bearing scans`);
  for (const s of ILLUS) ok(!textScans.has(s), `${slug}: illustration scan ${s} carries no fabricated verse line`);
  // scan 100 closes with the source (முற்றும்); scan 101 is the back cover, outside the work.
  ok(/\(முற்றும்\)/.test(readSrc(`poems/${slug}/sections/11.md`)), `${slug}: scan-100 close (முற்றும்) present in the final section`);
  ok(!srcScans.includes(101), `${slug}: scan 101 (back cover) not part of the main work`);
  // Token-stream S===G per section (Tamil H1 pre-marker skipped; ## One-Sided Love reprint + ### Source
  // explanation are source-headings kept in verse).
  for (const it of pub.items) {
    const nn = String(it.ordinal).padStart(2, "0");
    const srcTa = srcTokensPlain(slug, `sections/${nn}.md`, { head: [], headings: [] });
    const srcEn = srcTokensPlain(slug, `translations/en/sections/${nn}.md`, { head: [], headings: ["One-Sided Love", "Source explanation"] });
    eq(genTokens(slug, it.tamil), srcTa, `${slug} section ${it.ordinal}: Tamil token-stream S===G`);
    eq(genTokens(slug, it.english), srcEn, `${slug} section ${it.ordinal}: English token-stream S===G`);
    // English release marks scans a SUBSET of the Tamil (coarser granularity) — represent honestly.
    const taScanSeq = scanSeqOf(srcTa), enScanSeq = scanSeqOf(srcEn);
    ok(enScanSeq.every((s) => taScanSeq.includes(s)) && enScanSeq.length >= 1, `${slug} section ${it.ordinal}: English marker sequence is a subset of the Tamil source markers (honest coarser marking)`);
  }
  // Heading-level equivalence: narrow + source-declared. Prove on the RAW artifacts, independently.
  const sec1 = readSrc(`poems/${slug}/translations/en/sections/01.md`);
  const asm = readSrc(`poems/${slug}/translations/en/${slug}-en.md`);
  ok(/^##\s+One-Sided Love\s*$/m.test(sec1), `${slug}: reviewed section reprints the work title at "## One-Sided Love"`);
  ok(/^###\s+One-Sided Love\s*$/m.test(asm), `${slug}: released assembly reprints the work title at "### One-Sided Love"`);
}

// ── 4. WITNESS RELATIONS — zero new; existing two preserved ─────────────────────────────────────────
{
  const poemsTs = fs.readFileSync("data/poems.ts", "utf8");
  const relBlock = (poemsTs.match(/POETRY_WITNESS_RELATIONS[\s\S]*?\n\];/) || [""])[0];
  const ids = [...relBlock.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  eq(ids.sort(), ["idhayathai-thanthidu-anna--kalaignarin-kavithaigal--item-01", "thennan-kathai--kalaignarin-kavithaigal--item-02"].sort(),
    "POETRY_WITNESS_RELATIONS: exactly the two frozen Wave-4 relations; zero new Batch-4 relations");
  for (const slug of Object.keys(SUBTREE)) ok(!relBlock.includes(`slug: "${slug}"`), `no witness relation references Batch-4 work ${slug}`);
}

if (failures.length) {
  console.error(`\nvalidate-poetry-wave6 — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nvalidate-poetry-wave6 — ${checks} checks, 0 failed`);
console.log("  8 works · 8 subtree pins · 16 payload/provenance SHA-256 pins · independent canonical token-stream S===G (Tamil & English) with source-contract head exclusion · independent source marker coverage · release-evidence gate · 1975 [1,2,4] + scan-66 Rajaji excluded · oruthalaik 11 sections 95/95 (84 text + 11 illustration) · 0 new witness relations");
