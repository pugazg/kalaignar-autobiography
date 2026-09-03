// Validator for இதயத்தைத் தந்திடு அண்ணா / "Lend Me Your Heart, Anna" — Digital Library Phase 4,
// Poetry Benchmark #1.
//
// This validates the GENERATED reader structure, not just metadata constants. It RECONSTRUCTS both
// released poems out of public/data/poems/<slug>/poem.json and proves exact equality with the
// source repository's released artifacts, and it INDEPENDENTLY re-derives the structural evidence
// rather than checking the importer against the importer.
//
// ── WHY THIS FILE WAS REWRITTEN (independent review) ─────────────────────────────────────────────
// The first version had a tautology: its English reconstruction helper filtered out every blank
// line before comparing. That proved line text and line order but was structurally blind — it could
// not see stanza gaps at all — and the "all 13 transitions inside a stanza" check then compared the
// generated data against a hard-coded array that originated in the importer itself. Both are fixed:
//
//   * blank-line / in-page stanza structure is now derived from the source artifacts and compared;
//   * every cross-page relation is checked against an INDEPENDENT search of the pinned source for
//     explicit typographic evidence — implemented differently from the importer (sentence-level,
//     requiring both scan numbers) — and where no such evidence exists the generated relation MUST
//     be `unknown`. No expected relation array is hard-coded.
//
// Usage: node scripts/validate-idhayathai-thanthidu-anna.mjs <path-to-kalaignar-poems-clone>

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-idhayathai-thanthidu-anna.mjs <kalaignar-poems-clone>");
  process.exit(1);
}

const SLUG = "idhayathai-thanthidu-anna";
const WORK_DIR = path.join(SRC_REPO, "poems", SLUG);
const DATA = path.join(process.cwd(), "public/data/poems", SLUG);
const readText = (p) => fs.readFileSync(p, "utf8");

const poem = JSON.parse(readText(path.join(DATA, "poem.json")));
const prov = JSON.parse(readText(path.join(DATA, "provenance.json")));

let pass = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) pass++;
  else failures.push(detail ? `${name} — ${detail}` : name);
}
const eq = (name, actual, expected) =>
  check(name, JSON.stringify(actual) === JSON.stringify(expected), `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);

const POEM_SCANS = Array.from({ length: 14 }, (_, i) => 13 + i);
const TRANSITION_KEYS = POEM_SCANS.slice(0, -1).map((s) => [s, s + 1]);
const ta = poem.tamil;
const en = poem.english;
const linesOf = (layer) => layer.elements.filter((e) => e.kind === "line");
const pagesOf = (layer) => layer.elements.filter((e) => e.kind === "page-transition");
const breaksOf = (layer) => layer.elements.filter((e) => e.kind === "stanza-break");

// ── 1. SOURCE PIN ────────────────────────────────────────────────────────────────────────────────
eq("source repo", poem.sourceRepo, "pugazg/kalaignar-poems");
eq("source path", poem.sourcePath, `poems/${SLUG}`);
eq("source commit", poem.sourceCommit, "42c156d7242fa799ea80adbb0c5f2b9eba078fe9");
eq("provenance source repo", prov.sourceRepo, poem.sourceRepo);
eq("provenance source path", prov.sourcePath, poem.sourcePath);
eq("provenance source commit", prov.sourceCommit, poem.sourceCommit);
eq("scan filename", prov.source.scanFilename, "TVA_BOK_0064132_இதயத்தைத்_தந்திடு_அண்ணா.pdf");
eq("scan SHA-256", prov.source.scanSha256, "152cfb251a2049662102a2296487220f6f227f243657c9456df34105520676fe");
eq("scan size (bytes)", prov.source.scanFileSizeBytes, 26816066);
eq("physical scans", prov.source.scanTotalPages, 28);
eq("physical verification", prov.source.physicalVerification, "28 / 28 verified");
eq("poem scan range", prov.source.poemScanPages, "13–26");
eq("poem verification", prov.source.poemVerification, "14 / 14 verified");
eq("poem scans", poem.poemScans, POEM_SCANS);
check("source PDF not vendored (flag)", prov.source.sourcePdfCommitted === false);
check("source PDF not vendored (filesystem)", !fs.readdirSync(DATA).some((f) => f.toLowerCase().endsWith(".pdf")), `found a PDF in ${DATA}`);
{
  const head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  check("pinned commit equals the source clone HEAD", head === poem.sourceCommit, `clone HEAD ${head}`);
  const dirty = execFileSync("git", ["-C", SRC_REPO, "status", "--porcelain"], { encoding: "utf8" }).trim();
  check("source clone is unmodified", dirty === "", `working tree has ${dirty.split("\n").length} change(s)`);
}

// ── 2. INDEPENDENT SOURCE DERIVATION ─────────────────────────────────────────────────────────────
// Parsed here from scratch, deliberately NOT reusing the importer's parsing strategy.

// (a) Tamil: the released assembly, one fenced block per scan.
const tamilBlocks = new Map();
{
  const src = readText(path.join(WORK_DIR, "sections", `${SLUG}.md`));
  const re = /<!-- scan (\d+) \/ ([^>]*?) -->\n```text\n([\s\S]*?)\n```/g;
  let m;
  while ((m = re.exec(src)) !== null) tamilBlocks.set(Number(m[1]), m[3]);
  eq("Tamil released blocks present", [...tamilBlocks.keys()], POEM_SCANS);
}

// (b) English: the reviewed batch files, split into per-scan regions and blank-delimited runs.
const BATCH_SCANS = { 1: [13, 14, 15], 2: [16, 17, 18, 19], 3: [20, 21], 4: [22, 23], 5: [24, 25, 26] };
const enRegions = [];
{
  const COMMENT = /^<!--[\s\S]*-->$/;
  for (let n = 1; n <= 5; n++) {
    const src = readText(path.join(WORK_DIR, "translations/en/batches", `batch-0${n}.md`));
    const section = src.slice(src.indexOf("## English translation") + 22, src.indexOf("## Translator's notes"));
    const seen = [];
    let cur = null;
    for (const raw of section.split("\n")) {
      const t = raw.trim();
      if (COMMENT.test(t)) {
        const scan = Number(/scan (\d+)/.exec(t)[1]);
        seen.push(scan);
        cur = { scan, batch: n, runs: [[]] };
        enRegions.push(cur);
        continue;
      }
      if (!cur) continue;
      if (t === "") {
        if (cur.runs.at(-1).length) cur.runs.push([]);
        continue;
      }
      cur.runs.at(-1).push(raw.replace(/\s+$/, ""));
    }
    eq(`batch-0${n} scan regions match the source map`, seen, BATCH_SCANS[n]);
  }
  for (const r of enRegions) r.runs = r.runs.filter((x) => x.length);
  eq("English scan regions cover the poem scans in order", enRegions.map((r) => r.scan), POEM_SCANS);
}

// ── 3. A. EXACT LINE STREAMS ─────────────────────────────────────────────────────────────────────
{
  // Tamil: rebuild each released block from the generated elements, byte for byte. This exercises
  // stanza-break placement too (a break inside a page must reproduce the source's blank line).
  const rebuilt = new Map(POEM_SCANS.map((s) => [s, []]));
  let curScan = null;
  for (const el of ta.elements) {
    if (el.kind === "line") {
      rebuilt.get(el.sourceScan).push(" ".repeat(el.indent) + el.text);
      curScan = el.sourceScan;
    } else if (el.kind === "stanza-break") {
      check("Tamil stanza-break carries its page", el.sourceScan === curScan, `break tagged scan ${el.sourceScan} after scan ${curScan}`);
      rebuilt.get(el.sourceScan).push("");
    }
  }
  const bad = POEM_SCANS.filter((s) => rebuilt.get(s).join("\n") !== tamilBlocks.get(s));
  check("Tamil reconstruction is byte-identical to the released assembly (text + blank lines)", bad.length === 0, `scans differing: ${bad.join(", ")}`);

  // English: rebuild the released assembly's verse line stream AND the reviewed batch verse.
  const generated = linesOf(en).map((l) => " ".repeat(l.indent) + l.text);
  const asmSrc = readText(path.join(WORK_DIR, "translations/en", `${SLUG}-en.md`));
  const releasedAsm = asmSrc
    .slice(asmSrc.indexOf("<!-- batch 01"))
    .split("\n")
    .filter((raw) => raw.trim() !== "" && !/^<!--[\s\S]*-->$/.test(raw.trim()))
    .map((raw) => raw.replace(/\s+$/, ""));
  const batchVerse = enRegions.flatMap((r) => r.runs.flat());
  eq("English released assembly line count (345)", releasedAsm.length, 345);
  eq("English reconstruction equals the released assembly", generated, releasedAsm);
  eq("English reconstruction equals the reviewed batch verse", generated, batchVerse);
  check("English release: 0 omissions", generated.length === releasedAsm.length);
  check("English release: 0 duplications", new Set(generated.map((t, i) => `${i}:${t}`)).size === generated.length);
}
{
  const l = linesOf(ta);
  eq("Tamil line count", ta.lineCount, l.length);
  eq("Tamil line count (339)", ta.lineCount, 339);
  eq("Tamil indented lines (58)", l.filter((x) => x.indent > 0).length, 58);
  eq("Tamil indent widths", [...new Set(l.filter((x) => x.indent > 0).map((x) => x.indent))].sort((a, b) => a - b), [4, 8]);
  check("Tamil: no blank line inside the data", l.every((x) => x.text.trim() !== ""));
  check("Tamil: `text` carries no leading/trailing whitespace", l.every((x) => x.text === x.text.trim()));
  eq("Tamil scans covered", [...new Set(l.map((x) => x.sourceScan))].sort((a, b) => a - b), POEM_SCANS);
  check("Tamil: scan order is monotonic", l.every((x, i) => i === 0 || x.sourceScan >= l[i - 1].sourceScan));
  check("Tamil: printed page only where the scan shows one", l.every((x) => (x.sourceScan <= 25 ? x.printedPage === x.sourceScan - 2 : x.printedPage === null)));
  check("Tamil: scan 26 printed page is null, never inferred as 24", l.filter((x) => x.sourceScan === 26).every((x) => x.printedPage === null));
  const e = linesOf(en);
  eq("English line count (345)", en.lineCount, 345);
  eq("English indented lines (47)", e.filter((x) => x.indent > 0).length, 47);
  eq("English indent widths", [...new Set(e.filter((x) => x.indent > 0).map((x) => x.indent))].sort((a, b) => a - b), [4, 8]);
  eq("English scans covered", [...new Set(e.map((x) => x.sourceScan))].sort((a, b) => a - b), POEM_SCANS);
  check("English: scan order is monotonic", e.every((x, i) => i === 0 || x.sourceScan >= e[i - 1].sourceScan));
  check("English: scan 26 printed page is null", e.filter((x) => x.sourceScan === 26).every((x) => x.printedPage === null));
}
// Protected source forms a silent "correction" would destroy.
{
  const joined = linesOf(ta).map((l) => l.text).join("\n");
  for (const form of [
    "களப்பரணி.. கலிங்கத்துப் பரணி", "அய்ம்பத்திரண்டுதனில்", "எடெல்லாம் வீடெல்லாம் தமிழ்", "மாண்பே! .",
    "பிரிவாய்மாறி", "கீரியென்றால்", "சழக்கரால்", "மாறிற்றுத் தமிழர் மனம்", "கடிதோச்சி", "போதாகி மலர்கின்ற",
    "வளையாத நெஞ்சுப் பாரதிக்கும்,", "கால்டுவெல் போப்புக்கும் சிலை", "பற்றுதனை உலகறிய ; அந்த", "இரவலாக உன் இதயத்தை தந்திடண்ணா..",
  ]) check(`Tamil retains source form ${JSON.stringify(form)}`, joined.includes(form));
  const body = linesOf(ta).map((l) => l.text);
  eq("Tamil flood escalation preserved", body.filter((t) => t === "வெள்ளம்!").length, 2);
  check("Tamil flood escalation third line", joined.includes("மாபெரும் வெள்ளம்!"));
  check("Tamil repeated முன்றெழுத்து architecture", (joined.match(/முன்றெழுத்து/g) || []).length >= 8);
  eq("Tamil opening line", body[0], "பூவிதழின் மென்மையினும் மென்மையான");
  eq("Tamil final line", body.at(-1), "உன் கால்மலரில் வைப்பேன் அண்ணா...");
  const eb = linesOf(en).map((l) => l.text);
  eq("English flood escalation preserved", eb.filter((t) => t === "A flood!").length, 2);
  check("English flood escalation third line", eb.includes("A mighty flood!"));
  check("English keeps the doubled refusal", eb.some((t) => t.includes("You will not come; you will not come;")));
  check("English keeps the title-bearing plea", eb.some((t) => t.includes("lend me your heart, Anna..")));
  check("English keeps the closing foot-flowers echo", eb.at(-1).includes("foot-flowers"));
  check("English keeps culturally specific terms", ["*Muttamil*", "*purappāṭṭu*", "*pathigam*", "Kazhagam"].every((t) => eb.some((b) => b.includes(t))));
  eq("English emphasis markup preserved verbatim (22 lines)", eb.filter((t) => t.includes("*")).length, 22);
  check("English emphasis markers are balanced on every line", eb.every((t) => (t.match(/\*/g) || []).length % 2 === 0));
  check("Tamil layer carries no Markdown markup", linesOf(ta).every((l) => !l.text.includes("*")));
}

// ── 4. B. WITHIN-PAGE STANZA STRUCTURE (derived from the source, then compared) ──────────────────
{
  // Tamil: independently count blank lines strictly inside each fenced block.
  const expected = [];
  for (const s of POEM_SCANS) {
    const rows = tamilBlocks.get(s).split("\n");
    rows.forEach((r, i) => {
      if (r.trim() === "" && i > 0 && i < rows.length - 1) expected.push(s);
    });
  }
  const actual = breaksOf(ta).map((b) => b.sourceScan);
  eq("Tamil in-page stanza breaks match the source blank lines (position and page)", actual, expected);
  eq("Tamil in-page stanza break count", ta.inPageStanzaBreaks, expected.length);
  check("Tamil stanza breaks all cite a source blank line", breaksOf(ta).every((b) => b.evidence === "source-blank-line"));

  // English: independently count blank-delimited run joins inside each scan region.
  const expEn = [];
  for (const r of enRegions) for (let i = 1; i < r.runs.length; i++) expEn.push(r.scan);
  eq("English in-page stanza breaks match the source blank runs (position and page)", breaksOf(en).map((b) => b.sourceScan), expEn);
  eq("English in-page stanza break count", en.inPageStanzaBreaks, expEn.length);
  check("English stanza breaks all cite a source blank line", breaksOf(en).every((b) => b.evidence === "source-blank-line"));
}

// ── 5. C. CROSS-PAGE RELATIONS — independent evidence search ─────────────────────────────────────
// Implemented differently from the importer on purpose: every .md in the pinned work directory is
// split into SENTENCES, and a sentence counts as cross-page typographic evidence only if it names
// BOTH scans of the transition AND speaks about the printed stanza/verse-group relation. Nothing is
// inferred from punctuation, sentence completion, meaning, indentation, or a fence edge.
const pinnedDocs = [];
{
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (name.endsWith(".md")) pinnedDocs.push({ rel: path.relative(WORK_DIR, full), text: readText(full) });
    }
  };
  walk(WORK_DIR);
  for (const extra of ["README.md", "HANDOVER.md", "POEM_PROCESSING_GUIDE.md"]) {
    const full = path.join(SRC_REPO, extra);
    if (fs.existsSync(full)) pinnedDocs.push({ rel: extra, text: readText(full) });
  }
  check("pinned source documents were read for the evidence audit", pinnedDocs.length >= 25, `only ${pinnedDocs.length} documents`);
}

const TYPOGRAPHIC = /\b(stanza|verse group|verse-group|verse paragraph)\b|பத்தி/i;
function typographicEvidenceFor(from, to) {
  const hits = [];
  for (const d of pinnedDocs) {
    for (const sentence of d.text.split(/(?<=[.!?;:])\s+|\n/)) {
      const s = sentence.trim();
      if (!s || !TYPOGRAPHIC.test(s)) continue;
      // Must actually name this page edge — both scans, or the explicit arrow form.
      const arrow = new RegExp(`scan\\s*${from}\\s*(?:→|->|—>|to)\\s*${to}\\b`, "i").test(s);
      const both = new RegExp(`\\b${from}\\b`).test(s) && new RegExp(`\\b${to}\\b`).test(s) && /scan/i.test(s);
      if (arrow || both) hits.push(`${d.rel}: ${s}`);
    }
  }
  return hits;
}

{
  const gen = pagesOf(ta);
  eq("Tamil page transitions are the 13 physical edges, in order", gen.map((p) => [p.fromScan, p.toScan]), TRANSITION_KEYS);
  eq("English page transitions are the 13 physical edges, in order", pagesOf(en).map((p) => [p.fromScan, p.toScan]), TRANSITION_KEYS);
  eq("provenance audits 13 transitions", prov.archiveDerived.pageTransitionsAudited, TRANSITION_KEYS.length);

  let derivedUnknown = 0;
  for (const [from, to] of TRANSITION_KEYS) {
    const evidence = typographicEvidenceFor(from, to);
    const row = prov.archiveDerived.transitions.find((t) => t.fromScan === from && t.toScan === to);
    check(`transition ${from}→${to} is present in the provenance audit table`, !!row);
    if (!row) continue;
    if (evidence.length === 0) {
      derivedUnknown++;
      // THE CORE ASSERTION: with no explicit typographic statement in the pinned source, the
      // generated relation must be `unknown` — not same-stanza, not stanza-boundary.
      eq(`transition ${from}→${to}: no source typographic evidence → relation must be unknown`, row.stanzaRelation, "unknown");
      eq(`transition ${from}→${to}: no typographic citations recorded`, row.stanzaEvidence, []);
    } else {
      check(`transition ${from}→${to}: resolved relation cites its source evidence`, row.stanzaEvidence.length > 0, `relation ${row.stanzaRelation} with no citation`);
    }
    // Both layers must carry the same audited relation for the same physical edge.
    const t1 = gen.find((p) => p.fromScan === from);
    const t2 = pagesOf(en).find((p) => p.fromScan === from);
    check(`transition ${from}→${to}: Tamil and English carry the same audited relation`, t1.stanzaRelation === row.stanzaRelation && t2.stanzaRelation === row.stanzaRelation);
    check(`transition ${from}→${to}: relation is a legal value`, ["same-stanza", "stanza-boundary", "unknown"].includes(row.stanzaRelation));
  }
  eq("independently derived unresolved count matches the provenance total", prov.archiveDerived.stanzaRelationUnresolved, derivedUnknown);
  eq("same-stanza count is derived, not assumed", prov.archiveDerived.stanzaRelationSameStanza, TRANSITION_KEYS.length - derivedUnknown - prov.archiveDerived.stanzaRelationStanzaBoundary);
  eq(
    "stanza-relation counts sum to the audited transitions",
    prov.archiveDerived.stanzaRelationSameStanza + prov.archiveDerived.stanzaRelationStanzaBoundary + prov.archiveDerived.stanzaRelationUnresolved,
    TRANSITION_KEYS.length,
  );
}

// ── 6. D. TEXTUAL CONTINUITY — recorded, and kept OUT of the stanza dimension ────────────────────
{
  // Independently derive the SOURCE_MAP's explicit cross-page continuity inventory from its own
  // "### Scan N → M" headings.
  const smap = readText(path.join(WORK_DIR, "translations/en/SOURCE_MAP.md"));
  const mapped = [...smap.matchAll(/^###\s*Scan\s*(\d+)\s*(?:→|->)\s*(\d+)\s*$/gm)].map((m) => [Number(m[1]), Number(m[2])]);
  eq("SOURCE_MAP records 7 explicit cross-page continuity points", mapped.length, 7);
  for (const [from, to] of mapped) {
    const row = prov.archiveDerived.transitions.find((t) => t.fromScan === from && t.toScan === to);
    check(`SOURCE_MAP continuity ${from}→${to} is recorded as textual continuation`, row && row.textualRelation === "source-established-continuation", row && `got ${row.textualRelation}`);
    check(`SOURCE_MAP continuity ${from}→${to} carries textual citations`, row && row.textualEvidence.length > 0);
    // THE SEPARATION: a documented textual continuation must NOT resolve the stanza relation.
    check(`SOURCE_MAP continuity ${from}→${to} does NOT resolve the stanza relation`, row && row.stanzaRelation === "unknown", row && `stanza relation is ${row.stanzaRelation}`);
  }
  // The page record for scan 25 explicitly records a NON-continuation onto scan 26.
  const p25 = readText(path.join(WORK_DIR, "pages/0025.md"));
  check("pages/0025.md records a textual NON-continuation onto scan 26", /continues thematically, but not textually/i.test(p25));
  const r2526 = prov.archiveDerived.transitions.find((t) => t.fromScan === 25);
  eq("25→26 is recorded as a source-established non-continuation", r2526.textualRelation, "source-established-non-continuation");
  eq("25→26 stanza relation is still unresolved (a non-continuation is not a stanza boundary)", r2526.stanzaRelation, "unknown");
  // Every textual classification is a legal value, and the counts add up.
  const legal = ["source-established-continuation", "source-established-non-continuation", "not-specifically-recorded"];
  check("every textual relation is a legal value", prov.archiveDerived.transitions.every((t) => legal.includes(t.textualRelation)));
  eq(
    "textual-relation counts sum to the audited transitions",
    prov.archiveDerived.textualContinuations + prov.archiveDerived.textualNonContinuations + prov.archiveDerived.textualNotRecorded,
    TRANSITION_KEYS.length,
  );
  eq("recorded textual continuations match the audit table", prov.archiveDerived.textualContinuations, prov.archiveDerived.transitions.filter((t) => t.textualRelation === "source-established-continuation").length);
  check("a transition with no textual record carries no textual citations", prov.archiveDerived.transitions.filter((t) => t.textualRelation === "not-specifically-recorded").every((t) => t.textualEvidence.length === 0));
  // The two dimensions must be independent: textual evidence never appears as stanza evidence.
  check(
    "no textual citation is reused as typographic stanza evidence",
    prov.archiveDerived.transitions.every((t) => t.stanzaEvidence.every((c) => !t.textualEvidence.includes(c))),
  );
}

// ── 7. E. UNRESOLVED RELATIONS ARE NEITHER MERGED NOR RENAMED ───────────────────────────────────
{
  for (const [name, layer] of [["Tamil", ta], ["English", en]]) {
    const unresolved = pagesOf(layer).filter((p) => p.stanzaRelation === "unknown");
    eq(`${name}: unresolved page transitions are represented explicitly`, layer.unresolvedStanzaRelations, unresolved.length);
    check(`${name}: no unresolved transition was silently merged away`, pagesOf(layer).length === TRANSITION_KEYS.length);
    // A run touching an unresolved edge must NOT be counted as a source-established stanza.
    check(
      `${name}: source-established stanza count excludes runs bounded by an unresolved page edge`,
      layer.sourceEstablishedStanzas < layer.verseRuns,
      `${layer.sourceEstablishedStanzas} of ${layer.verseRuns}`,
    );
    check(`${name}: verse-run count is not reported as a stanza count`, layer.verseRuns !== layer.sourceEstablishedStanzas);
  }
  // The withdrawn claims must not reappear anywhere in the generated data.
  const blob = JSON.stringify({ poem, prov });
  for (const claim of ["stanzasSpanningPages", "pageTransitionsInsideStanza", "englishBatchBoundariesInsideStanza", "marker-removal artefact"]) {
    check(`withdrawn claim ${JSON.stringify(claim)} is absent from the generated data`, !blob.includes(claim));
  }
  check("provenance states the two dimensions are separate", prov.archiveDerived.boundaryNote.includes("separate dimensions"));
  check("provenance uses neutral wording about marker-adjacent blank lines", prov.archiveDerived.boundaryNote.includes("does not by itself establish"));
  check("provenance defines the verse-run terminology", prov.archiveDerived.terminologyNote.includes("VERSE RUN"));
}

// ── 8. F. RENDERING CONTRACT ─────────────────────────────────────────────────────────────────────
// The reader must represent an unresolved transition neutrally, and must not call generated runs
// stanzas. Checked against the component source so a regression cannot ship silently.
{
  const reader = readText(path.join(process.cwd(), "components/PoemReader.tsx"));
  check("reader renders a neutral page-transition marker", reader.includes("PageTransitionRule"));
  check("reader labels the unresolved relation accessibly (English)", reader.includes("Source page transition — stanza relationship unresolved"));
  check("reader labels the unresolved relation accessibly (Tamil)", reader.includes("அச்சுப் பத்தித் தொடர்பு தீர்மானிக்கப்படவில்லை"));
  check("reader marks the transition as a separator role", /role="separator"/.test(reader));
  check("reader no longer labels generated runs as stanzas", !/aria-label=\{[^}]*Stanza \$\{/.test(reader) && !reader.includes("`பத்தி ${"));
  check("reader gives an unresolved transition LESS space than a stanza break", reader.includes('flush("mb-2")') && reader.includes('flush("mb-7")'));
  check("reader only closes up a transition when the source establishes same-stanza", reader.includes('el.stanzaRelation === "same-stanza"'));
  check("reader keeps the hanging indent for visually wrapped lines", reader.includes("HANG_EM") && reader.includes("textIndent"));

  // ── PRINT FIDELITY (independent review defect) ─────────────────────────────────────────────────
  // An unresolved cross-page marker is PROVENANCE, not interactive chrome. If it were marked
  // data-print="hide" the print stylesheet would delete it, and Print → Save as PDF would present
  // the source lines on either side as silently continuous — asserting a continuation the source
  // does not establish. These assertions lock that regression out.
  {
    // The slice is anchored on the NEXT top-level declaration rather than on one function's name,
    // and it fails closed if either anchor is missing. Anchoring on a specific neighbour is what
    // broke this check once already: when that neighbour was removed, indexOf returned -1, the slice
    // silently widened to most of the file, and the assertion started reading unrelated code.
    const fnStart = reader.indexOf("function PageTransitionRule");
    check("the page-transition marker component is present to check", fnStart >= 0);
    const rest = reader.slice(fnStart + 1);
    const nextDecl = rest.search(/\n(?:export )?(?:function|const|type) /);
    check("the marker component's extent can be determined", nextDecl >= 0);
    const fn = nextDecl >= 0 ? rest.slice(0, nextDecl) : "";
    check("unresolved page-transition marker is NOT marked data-print=\"hide\"", !fn.includes('data-print="hide"'), "the marker would be deleted in print");
    check("unresolved page-transition marker carries its print class", fn.includes("poem-page-transition"));
    check("unresolved page-transition marker carries the source scan in its label", /source scan \$\{toScan\}/.test(fn) && /மூல ஸ்கேன் \$\{toScan\}/.test(fn));
    // Interactive chrome must still be hidden in print — the exception is narrow.
    check("interactive reader chrome is still marked data-print=\"hide\"", (reader.match(/data-print="hide"/g) || []).length >= 2);

    const css = readText(path.join(process.cwd(), "app/globals.css"));
    const printBlock = css.slice(css.indexOf("@media print {"));
    check("print stylesheet keeps the unresolved marker displayed", /\.poem-page-transition\s*\{[^}]*display:\s*flex\s*!important/.test(printBlock));
    check("print stylesheet re-draws the hairlines as borders (backgrounds are dropped by printers)", /\.poem-page-transition-rule\s*\{[^}]*border-top/.test(printBlock));
    check("print-only note is shown in print", /\.poem-page-transition-print-note\s*\{[^}]*display:\s*inline\s*!important/.test(printBlock));
    check("print-only note is hidden on screen", /\.poem-page-transition-print-note\s*\{[^}]*display:\s*none/.test(css.slice(0, css.indexOf("@media print {"))));
    check("printed note explains that the stanza relation is unresolved (English)", fn.includes("· stanza relation unresolved"));
    check("printed note has a Tamil equivalent", fn.includes("· அச்சுப் பத்தித் தொடர்பு தீர்மானிக்கப்படவில்லை"));
    check("printed note follows the reader language (a DOM node, not CSS content)", fn.includes("poem-page-transition-print-note") && !printBlock.includes("content: \" · stanza"));
    // No print rule may hide the marker.
    check(
      "no print rule hides the unresolved marker",
      !/\.poem-page-transition[^{]*\{[^}]*display:\s*none/.test(printBlock),
      "a print rule sets display:none on the marker",
    );
  }
  const src = readText(path.join(process.cwd(), "components/PoemSource.tsx"));
  check("source page shows the per-transition audit table", src.includes("d.transitions.map"));
  check("source page separates textual continuity from stanza relationship", src.includes("Textual / rhetorical continuity") && src.includes("Typographic stanza relationship"));
  check("source page renders the blocker when relations are unresolved", src.includes("prov.blockers"));
}

// ── 9. G. BLOCKER ────────────────────────────────────────────────────────────────────────────────
{
  const unresolved = prov.archiveDerived.stanzaRelationUnresolved;
  const blockers = prov.blockers ?? [];
  if (unresolved > 0) {
    const b = blockers.find((x) => x.item === "cross-page-stanza-relationship");
    check("a cross-page-stanza-relationship blocker is declared", !!b);
    if (b) {
      eq("blocker count equals the generated unresolved relations", b.count, unresolved);
      check("blocker resolution requires an UPSTREAM source-archive review", /upstream source-archive/i.test(b.resolution));
      check("blocker resolution names the controlling scan", b.resolution.includes("TVA_BOK_0064132"));
      check("blocker states the Digital Library does not establish typographic facts itself", /does not establish those typographic facts independently/i.test(b.resolution));
      check("blocker wording is environment-neutral", !/local|localhost|this machine|downloads|my |sandbox/i.test(b.resolution));
      check("blocker states the relation is never inferred", /never inferred/i.test(b.detail));
    }
  } else {
    check("no blocker is declared when nothing is unresolved", blockers.length === 0);
  }
  check("'cross-page-stanza-relationships' is recorded as a fact the source does not state", poem.factsNotStated.includes("cross-page-stanza-relationships"));
}

// ── 10. SOURCE CONTEXT vs PUBLICATION METADATA ───────────────────────────────────────────────────
{
  eq("source context printed date", poem.sourceContext.datePrinted, "9.2.1969");
  eq("source context ISO date", poem.sourceContext.dateIso, "1969-02-09");
  eq("source context venue (Tamil)", poem.sourceContext.venue.ta, "சென்னை வானொலி");
  eq("source context venue (English)", poem.sourceContext.venue.en, "Chennai Radio");
  check("source context occasion names Perarignar Anna", poem.sourceContext.occasion.en.includes("Perarignar Anna"));
  check("source context note carried verbatim as metadata", poem.sourceContext.noteTa.includes("9.2.1969") && poem.sourceContext.noteTa.includes("கண்ணீர்க் கவிதாஞ்சலி"));
  check("publication year is NOT established", poem.publicationYear === null);
  check("edition statement is NOT established", poem.editionStatement === null);
  check("'publication-year' recorded as not stated", poem.factsNotStated.includes("publication-year"));
  check("'edition-statement' recorded as not stated", poem.factsNotStated.includes("edition-statement"));
  check("provenance states publication is not established", prov.source.publicationNotEstablished.includes("NO standalone publication-year"));
  check("provenance separates the context date from a publication date", prov.source.publicationNotEstablished.includes("NOT a publication date"));
  check("provenance documents the foreword date as foreword-internal", prov.source.forewordDateNote.includes("15.9.2008") && prov.source.forewordDateNote.includes("NEVER"));
  const with2008 = [];
  (function walk(o) {
    if (typeof o === "string") { if (o.includes("2008")) with2008.push(o); }
    else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === "object") Object.values(o).forEach(walk);
  })({ poem, prov });
  check("2008 appears only to be explicitly excluded", with2008.length > 0);
  check("every 2008 occurrence denies publication/edition status", with2008.every((t) => /foreword/i.test(t) && /(NEVER|never|not)\b/.test(t)));
  check("2008 never appears on the poem object itself", !JSON.stringify(poem).includes("2008"));
  check("no '2008 edition' claim anywhere", !JSON.stringify({ poem, prov }).includes("2008 edition"));
  check("no 'published in 1969' claim anywhere", !JSON.stringify({ poem, prov }).includes("published in 1969"));
}

// ── 11. LOCKED EXCLUSIONS ────────────────────────────────────────────────────────────────────────
{
  const verse = [...linesOf(ta), ...linesOf(en)].map((l) => l.text).join("\n");
  for (const [label, phrase] of [
    ["scan 13 source-context date", "9.2.1969"], ["scan 13 source-context venue", "சென்னை வானொலியில்"],
    ["scan 13 source-context occasion", "கண்ணீர்க் கவிதாஞ்சலி"], ["scan 26 printer imprint", "அச்சிட்டோர்"],
    ["scan 26 printer name", "வைகை பிரிண்டர்ஸ்"], ["scan 26 printer location", "சைதாப்பேட்டை"],
    ["scan 27 poster heading", "உலகத்தமிழ் செம்மொழி"], ["scan 27 poster poem opening", "பிறப்பொக்கும் எல்லா உயிர்க்கும்"],
    ["scan 27 poster refrain", "வாழிய வாழியவே"], ["publisher/donor matter", "குறிஞ்சி சுப்பிரமணியன்"],
    ["foreword heading", "என்னுரை"], ["foreword date", "15.9.2008"],
    ["translator notes heading", "Translator's notes"], ["batch review prose", "Source-fidelity review"],
    ["voice review prose", "Kalaignar-voice review"], ["assembly explanatory prose", "assembled only from"],
    ["assembly scope prose", "Assembly scope"],
  ]) check(`verse excludes ${label}`, !verse.includes(phrase), `found ${JSON.stringify(phrase)} inside the poem body`);
}

// ── 12. RECORDED COUNTS MATCH THE GENERATED DATA ────────────────────────────────────────────────
{
  eq("provenance Tamil lines", prov.archiveDerived.tamilLines, ta.lineCount);
  eq("provenance Tamil in-page stanza breaks", prov.archiveDerived.tamilInPageStanzaBreaks, ta.inPageStanzaBreaks);
  eq("provenance Tamil verse runs", prov.archiveDerived.tamilVerseRuns, ta.verseRuns);
  eq("provenance Tamil source-established stanzas", prov.archiveDerived.tamilSourceEstablishedStanzas, ta.sourceEstablishedStanzas);
  eq("provenance English lines", prov.archiveDerived.englishLines, en.lineCount);
  eq("provenance English in-page stanza breaks", prov.archiveDerived.englishInPageStanzaBreaks, en.inPageStanzaBreaks);
  eq("provenance English verse runs", prov.archiveDerived.englishVerseRuns, en.verseRuns);
  eq("provenance English source-established stanzas", prov.archiveDerived.englishSourceEstablishedStanzas, en.sourceEstablishedStanzas);
  eq("provenance Tamil indented lines", prov.archiveDerived.tamilIndentedLines, linesOf(ta).filter((l) => l.indent > 0).length);
  eq("provenance English indented lines", prov.archiveDerived.englishIndentedLines, linesOf(en).filter((l) => l.indent > 0).length);
  eq("verification: Tamil discrepancies", prov.verification.tamilDiscrepancies, 0);
  eq("verification: English omissions", prov.verification.englishOmissions, 0);
  eq("verification: English duplications", prov.verification.englishDuplications, 0);
  eq("verification: English release status", prov.verification.englishRelease, "RELEASE-COMPLETE");
  check("verification: full-poem voice review PASS", prov.verification.fullPoemVoiceReview.includes("PASS"));
}

// ── 13. RIGHTS ───────────────────────────────────────────────────────────────────────────────────
{
  const pr = prov.projectRights;
  eq("rights status", pr.rightsStatus, "nationalised-by-tamil-nadu-government");
  eq("rights authority", pr.rightsAuthority, "Government of Tamil Nadu");
  eq("rights announcement date", pr.rightsAnnouncementDate, "2024-08-22");
  eq("GO number remains unverified", pr.governmentOrderNumber, null);
  eq("GO formal issue date remains unverified", pr.governmentOrderDate, null);
  eq("GO handover date", pr.governmentOrderHandoverDate, "2024-12-22");
  check("rights do not extend to third-party layers", ["foreword", "photograph", "publisher", "imprint", "cover"].every((w) => pr.thirdPartyNote.toLowerCase().includes(w)));
  check("rights do not extend to the project translation", pr.projectTranslationNote.includes("not covered"));
}

// ── REPORT ───────────────────────────────────────────────────────────────────────────────────────
console.log(`\nidhayathai-thanthidu-anna — ${pass} assertions passed, ${failures.length} failed`);
if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error(" ✗ " + f);
  process.exit(1);
}
console.log("ALL PASS");
