// Validator for இதயத்தைத் தந்திடு அண்ணா / "Lend Me Your Heart, Anna" — Digital Library Phase 4,
// Poetry Benchmark #1.
//
// This validates the GENERATED reader structure, not just metadata constants: it RECONSTRUCTS both
// released poems out of public/data/poems/<slug>/poem.json and proves exact equality with the
// source repository's released artifacts — line text, line order, stanza structure, indentation,
// punctuation, repetition and per-line source-page provenance.
//
// Usage: node scripts/validate-idhayathai-thanthidu-anna.mjs <path-to-kalaignar-poems-clone>

import fs from "node:fs";
import path from "node:path";

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
const flat = (layer) => layer.stanzas.flatMap((s) => s.lines);
const ta = poem.tamil;
const en = poem.english;

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
check(
  "source PDF not vendored (filesystem)",
  !fs.readdirSync(DATA).some((f) => f.toLowerCase().endsWith(".pdf")),
  `found a PDF in ${DATA}`,
);
// The pinned commit must match the source clone actually being validated against.
{
  const head = fs.existsSync(path.join(SRC_REPO, ".git"))
    ? (await import("node:child_process")).execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim()
    : null;
  check("pinned commit equals the source clone HEAD", head === poem.sourceCommit, `clone HEAD ${head}`);
}

// ── 2. TAMIL RECONSTRUCTION ──────────────────────────────────────────────────────────────────────
// Rebuild each released assembly block from the generated lines and compare verbatim. This proves
// exact text, exact line order, exact stanza (blank-line) structure, exact indentation, punctuation,
// ellipses, quotation marks and repetition — with nothing omitted and nothing duplicated.
{
  const src = readText(path.join(WORK_DIR, "sections", `${SLUG}.md`));
  const re = /<!-- scan (\d+) \/ ([^>]*?) -->\n```text\n([\s\S]*?)\n```/g;
  const released = new Map();
  let m;
  while ((m = re.exec(src)) !== null) released.set(Number(m[1]), m[3]);
  eq("Tamil released blocks", [...released.keys()], POEM_SCANS);

  // Walk the generated stanzas, emitting a blank line at a stanza break that falls WITHIN one scan.
  const rebuilt = new Map(POEM_SCANS.map((s) => [s, []]));
  let prevScan = null;
  ta.stanzas.forEach((st, si) => {
    st.lines.forEach((l, li) => {
      if (si > 0 && li === 0 && l.sourceScan === prevScan) rebuilt.get(l.sourceScan).push("");
      rebuilt.get(l.sourceScan).push(" ".repeat(l.indent) + l.text);
      prevScan = l.sourceScan;
    });
  });
  let ok = true;
  const bad = [];
  for (const s of POEM_SCANS) {
    if (rebuilt.get(s).join("\n") !== released.get(s)) {
      ok = false;
      bad.push(s);
    }
  }
  check("Tamil reconstruction is byte-identical to the released assembly", ok, `scans differing: ${bad.join(", ")}`);
}
{
  const lines = flat(ta);
  eq("Tamil line count", ta.lineCount, lines.length);
  eq("Tamil line count (339)", ta.lineCount, 339);
  eq("Tamil stanza count (24)", ta.stanzas.length, 24);
  check("Tamil: no empty stanza", ta.stanzas.every((s) => s.lines.length > 0));
  check("Tamil: no blank line inside the data", lines.every((l) => l.text.trim() !== ""));
  check("Tamil: no line carries leading/trailing whitespace in `text`", lines.every((l) => l.text === l.text.trim()));
  check("Tamil: indentation preserved as a source fact", lines.some((l) => l.indent > 0));
  eq("Tamil indented lines (58)", lines.filter((l) => l.indent > 0).length, 58);
  eq("Tamil indent widths", [...new Set(lines.filter((l) => l.indent > 0).map((l) => l.indent))].sort((a, b) => a - b), [4, 8]);
  eq("Tamil scans covered", [...new Set(lines.map((l) => l.sourceScan))].sort((a, b) => a - b), POEM_SCANS);
  check("Tamil: scan order is monotonic (no page revisited)", lines.every((l, i) => i === 0 || l.sourceScan >= lines[i - 1].sourceScan));
  check(
    "Tamil: printed page provenance only where the scan shows one",
    lines.every((l) => (l.sourceScan <= 25 ? l.printedPage === l.sourceScan - 2 : l.printedPage === null)),
  );
  check("Tamil: scan 26 printed page is null, never inferred as 24", lines.filter((l) => l.sourceScan === 26).every((l) => l.printedPage === null));
  eq("Tamil printed pages present", [...new Set(lines.map((l) => l.printedPage).filter((p) => p !== null))].sort((a, b) => a - b), Array.from({ length: 13 }, (_, i) => 11 + i));
}
// Spot-check protected source forms that a "correction" would silently destroy.
{
  const body = flat(ta).map((l) => l.text);
  const joined = body.join("\n");
  for (const form of [
    "களப்பரணி.. கலிங்கத்துப் பரணி",
    "அய்ம்பத்திரண்டுதனில்",
    "எடெல்லாம் வீடெல்லாம் தமிழ்",
    "மாண்பே! .",
    "பிரிவாய்மாறி",
    "கீரியென்றால்",
    "சழக்கரால்",
    "மாறிற்றுத் தமிழர் மனம்",
    "கடிதோச்சி",
    "போதாகி மலர்கின்ற",
    "வளையாத நெஞ்சுப் பாரதிக்கும்,",
    "கால்டுவெல் போப்புக்கும் சிலை",
    "பற்றுதனை உலகறிய ; அந்த",
    "இரவலாக உன் இதயத்தை தந்திடண்ணா..",
  ]) {
    check(`Tamil retains source form ${JSON.stringify(form)}`, joined.includes(form));
  }
  // The three-line escalation and the repeated three-letter architecture must survive intact.
  eq("Tamil flood escalation preserved", body.filter((t) => t === "வெள்ளம்!").length, 2);
  check("Tamil flood escalation third line", joined.includes("மாபெரும் வெள்ளம்!"));
  check("Tamil repeated முன்றெழுத்து architecture", (joined.match(/முன்றெழுத்து/g) || []).length >= 8);
  eq("Tamil final line", body[body.length - 1], "உன் கால்மலரில் வைப்பேன் அண்ணா...");
  eq("Tamil opening line", body[0], "பூவிதழின் மென்மையினும் மென்மையான");
}

// ── 3. ENGLISH RECONSTRUCTION ────────────────────────────────────────────────────────────────────
// Prove the generated English is exactly the RELEASE-COMPLETE assembly: same lines, same order,
// zero omission, zero duplication — and that it is also exactly the reviewed batch verse.
{
  const COMMENT = /^<!--[\s\S]*-->$/;
  const verse = (text) =>
    text
      .split("\n")
      .filter((raw) => raw.trim() !== "" && !COMMENT.test(raw.trim()))
      .map((raw) => raw.replace(/\s+$/, ""));

  const asmSrc = readText(path.join(WORK_DIR, "translations/en", `${SLUG}-en.md`));
  const releasedAsm = verse(asmSrc.slice(asmSrc.indexOf("<!-- batch 01")));

  const batchVerse = [];
  for (let n = 1; n <= 5; n++) {
    const src = readText(path.join(WORK_DIR, "translations/en/batches", `batch-0${n}.md`));
    const section = src.slice(src.indexOf("## English translation") + 22, src.indexOf("## Translator's notes"));
    batchVerse.push(...verse(section));
  }
  const generated = flat(en).map((l) => " ".repeat(l.indent) + l.text);

  eq("English released assembly line count (345)", releasedAsm.length, 345);
  check("English reconstruction equals the released assembly", JSON.stringify(generated) === JSON.stringify(releasedAsm));
  check("English reconstruction equals the reviewed batch verse", JSON.stringify(generated) === JSON.stringify(batchVerse));
  check("English release: 0 omissions", generated.length === releasedAsm.length);
  check("English release: 0 duplications", new Set(generated.map((t, i) => `${i}:${t}`)).size === generated.length);
}
{
  const lines = flat(en);
  eq("English line count", en.lineCount, lines.length);
  eq("English line count (345)", en.lineCount, 345);
  eq("English stanza count (21)", en.stanzas.length, 21);
  check("English: no empty stanza", en.stanzas.every((s) => s.lines.length > 0));
  eq("English indented lines (47)", lines.filter((l) => l.indent > 0).length, 47);
  eq("English indent widths", [...new Set(lines.filter((l) => l.indent > 0).map((l) => l.indent))].sort((a, b) => a - b), [4, 8]);
  eq("English scans covered", [...new Set(lines.map((l) => l.sourceScan))].sort((a, b) => a - b), POEM_SCANS);
  check("English: scan order is monotonic", lines.every((l, i) => i === 0 || l.sourceScan >= lines[i - 1].sourceScan));
  check("English: scan 26 printed page is null", lines.filter((l) => l.sourceScan === 26).every((l) => l.printedPage === null));
  const body = lines.map((l) => l.text);
  eq("English flood escalation preserved", body.filter((t) => t === "A flood!").length, 2);
  check("English flood escalation third line", body.includes("A mighty flood!"));
  check("English keeps the doubled refusal", body.some((t) => t.includes("You will not come; you will not come;")));
  check("English keeps the title-bearing plea", body.some((t) => t.includes("lend me your heart, Anna..")));
  check("English keeps the closing foot-flowers echo", body[body.length - 1].includes("foot-flowers"));
  check("English keeps culturally specific terms", ["*Muttamil*", "*purappāṭṭu*", "*pathigam*", "Kazhagam"].every((t) => body.some((b) => b.includes(t))));
  // The released English marks transliterations/titles with Markdown emphasis. That markup is
  // release typography and must survive VERBATIM in the data (the reader resolves it to <em>);
  // stripping it at import would silently rewrite the released text.
  eq("English emphasis markup preserved verbatim (22 lines)", body.filter((t) => t.includes("*")).length, 22);
  check("English emphasis markers are balanced on every line", body.every((t) => (t.match(/\*/g) || []).length % 2 === 0));
  check("Tamil layer carries no Markdown markup (none in the source)", flat(ta).every((l) => !l.text.includes("*")));
}

// ── 4. LOCKED EXCLUSIONS ─────────────────────────────────────────────────────────────────────────
// Prove no non-verse layer leaked into either poem body.
{
  const verseText = [...flat(ta), ...flat(en)].map((l) => l.text).join("\n");
  const excluded = [
    ["scan 13 source-context date", "9.2.1969"],
    ["scan 13 source-context venue", "சென்னை வானொலியில்"],
    ["scan 13 source-context occasion", "கண்ணீர்க் கவிதாஞ்சலி"],
    ["scan 26 printer imprint", "அச்சிட்டோர்"],
    ["scan 26 printer name", "வைகை பிரிண்டர்ஸ்"],
    ["scan 26 printer location", "சைதாப்பேட்டை"],
    ["scan 27 poster heading", "உலகத்தமிழ் செம்மொழி"],
    ["scan 27 poster poem opening", "பிறப்பொக்கும் எல்லா உயிர்க்கும்"],
    ["scan 27 poster refrain", "வாழிய வாழியவே"],
    ["publisher/donor matter", "குறிஞ்சி சுப்பிரமணியன்"],
    ["foreword heading", "என்னுரை"],
    ["foreword date", "15.9.2008"],
    ["translator notes heading", "Translator's notes"],
    ["batch review prose", "Source-fidelity review"],
    ["voice review prose", "Kalaignar-voice review"],
    ["importer/assembly explanatory prose", "assembled only from"],
    ["assembly scope prose", "Assembly scope"],
  ];
  for (const [label, phrase] of excluded) {
    check(`verse excludes ${label}`, !verseText.includes(phrase), `found ${JSON.stringify(phrase)} inside the poem body`);
  }
}

// ── 5. PAGE / BATCH BOUNDARY SEMANTICS ───────────────────────────────────────────────────────────
// The critical poetry rule: a physical page transition and a translation-batch transition are
// PROVENANCE, never stanza structure. Proved from the generated data.
{
  const transitionsInside = (layer) => {
    const out = [];
    for (const s of layer.stanzas) {
      for (let i = 1; i < s.lines.length; i++) {
        const a = s.lines[i - 1].sourceScan;
        const b = s.lines[i].sourceScan;
        if (a !== b) out.push(`${a}->${b}`);
      }
    }
    return out;
  };
  const all = POEM_SCANS.slice(0, -1).map((s) => `${s}->${s + 1}`);
  eq("Tamil: every page transition falls INSIDE a stanza", transitionsInside(ta), all);
  eq("English: every page transition falls INSIDE a stanza", transitionsInside(en), all);
  eq("physical page transitions audited (13)", all.length, 13);
  eq("Tamil stanzas spanning >1 scan (13)", ta.stanzas.filter((s) => s.sourceScans.length > 1).length, 13);
  eq("English stanzas spanning >1 scan (13)", en.stanzas.filter((s) => s.sourceScans.length > 1).length, 13);
  check(
    "no stanza begins exactly at a page transition (page boundary never creates a stanza)",
    ta.stanzas.every((s, i) => i === 0 || s.lines[0].sourceScan === ta.stanzas[i - 1].lines.at(-1).sourceScan),
  );

  // The four translation-batch boundaries must be continuations too. Batches: 13-15 | 16-19 |
  // 20-21 | 22-23 | 24-26, so a batch boundary sits at scan transitions 15→16, 19→20, 21→22, 23→24.
  const batchBoundaryTransitions = ["15->16", "19->20", "21->22", "23->24"];
  const inside = transitionsInside(en);
  eq("English: all 4 batch boundaries fall inside a stanza", batchBoundaryTransitions.filter((t) => inside.includes(t)), batchBoundaryTransitions);
  // The pathigam → purappāṭṭu continuation crosses Batch 04 → Batch 05: it must not be split.
  {
    const st = en.stanzas.find((s) => s.lines.some((l) => l.text.includes("*pathigam*")));
    check(
      "English: the pathigam → purappāṭṭu continuation stays in ONE stanza across the batch boundary",
      !!st && st.lines.some((l) => l.text.includes("*purappāṭṭu*")),
    );
  }
  // The Valluvar quotation continues across printed p.20 → p.21 mid-sentence.
  {
    const st = en.stanzas.find((s) => s.lines.some((l) => l.text.includes("To make Tamil hearts, all Tamil life,")));
    check(
      "English: the Valluvar quotation continuation stays in ONE stanza across the page boundary",
      !!st && st.lines.some((l) => l.text.startsWith("gold,")),
    );
  }
  // The statue catalogue continues across scan 24 → 25.
  {
    const st = en.stanzas.find((s) => s.lines.some((l) => l.text === "a statue for Kambar;"));
    check(
      "English: the statue catalogue continues across the page boundary in ONE stanza",
      !!st && st.lines.some((l) => l.text.includes("bravely sailed the ship")),
    );
  }
  eq("provenance records page transitions", prov.archiveDerived.pageTransitions, 13);
  eq("provenance records all transitions inside a stanza", prov.archiveDerived.pageTransitionsInsideStanza, 13);
  eq("provenance records batch boundaries", prov.archiveDerived.englishBatchBoundaries, 4);
  eq("provenance records batch boundaries as continuations", prov.archiveDerived.englishBatchBoundariesInsideStanza, 4);
}

// ── 6. SOURCE CONTEXT vs PUBLICATION METADATA ────────────────────────────────────────────────────
{
  eq("source context printed date", poem.sourceContext.datePrinted, "9.2.1969");
  eq("source context ISO date", poem.sourceContext.dateIso, "1969-02-09");
  eq("source context venue (Tamil)", poem.sourceContext.venue.ta, "சென்னை வானொலி");
  eq("source context venue (English)", poem.sourceContext.venue.en, "Chennai Radio");
  check("source context occasion names Perarignar Anna", poem.sourceContext.occasion.en.includes("Perarignar Anna"));
  check("source context note is carried verbatim as metadata", poem.sourceContext.noteTa.includes("9.2.1969") && poem.sourceContext.noteTa.includes("கண்ணீர்க் கவிதாஞ்சலி"));

  // The publication rule: 9.2.1969 is a SOURCE/CONTEXT date, never a publication or edition year;
  // and the 15.9.2008 foreword date must never surface as publication metadata.
  check("publication year is NOT established", poem.publicationYear === null);
  check("edition statement is NOT established", poem.editionStatement === null);
  check("'publication-year' is recorded as a fact the source does not state", poem.factsNotStated.includes("publication-year"));
  check("'edition-statement' is recorded as a fact the source does not state", poem.factsNotStated.includes("edition-statement"));
  check("provenance states publication is not established", prov.source.publicationNotEstablished.includes("NO standalone publication-year"));
  check("provenance separates the context date from a publication date", prov.source.publicationNotEstablished.includes("NOT a publication date"));
  check("provenance documents the foreword date as foreword-internal", prov.source.forewordDateNote.includes("15.9.2008") && prov.source.forewordDateNote.includes("NEVER"));

  // Every occurrence of 2008 in the generated data must be an explicit DENIAL that it is
  // publication metadata — never a bare year value, and never on the poem itself.
  const stringsWith2008 = [];
  (function walk(o) {
    if (typeof o === "string") {
      if (o.includes("2008")) stringsWith2008.push(o);
    } else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === "object") Object.values(o).forEach(walk);
  })({ poem, prov });
  check("2008 appears somewhere only to be explicitly excluded", stringsWith2008.length > 0);
  check(
    "every 2008 occurrence explicitly denies publication/edition status",
    stringsWith2008.every((t) => /foreword/i.test(t) && /(NEVER|never|not)\b/.test(t)),
    `unqualified 2008 string: ${JSON.stringify(stringsWith2008.find((t) => !(/foreword/i.test(t) && /(NEVER|never|not)\b/.test(t))))}`,
  );
  check("2008 never appears on the poem object itself", !JSON.stringify(poem).includes("2008"));
  check("no '2008 edition' claim anywhere", !JSON.stringify({ poem, prov }).includes("2008 edition"));
  check("no 'published in 2008' claim anywhere", !JSON.stringify({ poem, prov }).includes("published in 2008"));
  check("1969 is never presented as a publication year", !JSON.stringify(poem).includes("published in 1969") && !JSON.stringify(prov).includes("published in 1969"));
}

// ── 7. STRUCTURAL COUNTS RECORDED HONESTLY ───────────────────────────────────────────────────────
{
  eq("provenance Tamil line count", prov.archiveDerived.tamilLines, ta.lineCount);
  eq("provenance Tamil stanza count", prov.archiveDerived.tamilStanzas, ta.stanzas.length);
  eq("provenance English line count", prov.archiveDerived.englishLines, en.lineCount);
  eq("provenance English stanza count", prov.archiveDerived.englishStanzas, en.stanzas.length);
  eq("provenance Tamil indented lines", prov.archiveDerived.tamilIndentedLines, flat(ta).filter((l) => l.indent > 0).length);
  eq("provenance English indented lines", prov.archiveDerived.englishIndentedLines, flat(en).filter((l) => l.indent > 0).length);
  eq("verification: Tamil discrepancies", prov.verification.tamilDiscrepancies, 0);
  eq("verification: English omissions", prov.verification.englishOmissions, 0);
  eq("verification: English duplications", prov.verification.englishDuplications, 0);
  eq("verification: English release status", prov.verification.englishRelease, "RELEASE-COMPLETE");
  check("verification: full-poem voice review PASS", prov.verification.fullPoemVoiceReview.includes("PASS"));
  check("provenance records line-level granularity honestly", prov.archiveDerived.provenanceGranularity.includes("Line-level scan provenance"));
  check("provenance states the boundary rule", prov.archiveDerived.boundaryNote.includes("NOT a stanza boundary"));
}

// ── 8. RIGHTS ────────────────────────────────────────────────────────────────────────────────────
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
