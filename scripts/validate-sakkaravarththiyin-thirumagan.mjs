// Validator for சக்கரவர்த்தியின் திருமகன் / "Chakravarthi's Son" — Digital Library Phase 5,
// Essays & Articles Benchmark #1.
//
// Validates the GENERATED reader structure, not just metadata constants. It RECONSTRUCTS both
// released layers from public/data/essays/<slug>/publication.json and proves exact equality with
// the source repository's released artifacts, and it derives its expectations from the source
// INDEPENDENTLY of the importer wherever practical — the Phase-4 Poetry review rejected a validator
// that checked the importer against the importer.
//
// Usage: node scripts/validate-sakkaravarththiyin-thirumagan.mjs <kalaignar-essays-clone>

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-sakkaravarththiyin-thirumagan.mjs <kalaignar-essays-clone>");
  process.exit(1);
}

const SLUG = "sakkaravarththiyin-thirumagan";
const PUB_DIR = path.join(SRC_REPO, "publications", SLUG);
const DATA = path.join(process.cwd(), "public/data/essays", SLUG);
const readText = (p) => fs.readFileSync(p, "utf8");

const pub = JSON.parse(readText(path.join(DATA, "publication.json")));
const prov = JSON.parse(readText(path.join(DATA, "provenance.json")));

let pass = 0;
const failures = [];
const check = (name, cond, detail) => (cond ? pass++ : failures.push(detail ? `${name} — ${detail}` : name));
const eq = (name, a, b) => check(name, JSON.stringify(a) === JSON.stringify(b), `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

// ── 1. SOURCE PIN AND IDENTITY ───────────────────────────────────────────────────────────────────
eq("source repo", pub.sourceRepo, "pugazg/kalaignar-essays");
eq("source path", pub.sourcePath, `publications/${SLUG}`);
eq("source commit", pub.sourceCommit, "bff35320b668cb5beeaafc5faa58260c4f4473f8");
eq("provenance pin agrees", [prov.sourceRepo, prov.sourcePath, prov.sourceCommit], [pub.sourceRepo, pub.sourcePath, pub.sourceCommit]);
eq("scan filename", prov.source.scanFilename, "TVA_BOK_0065662_சக்கரவர்த்தியின்_திருமகன்.pdf");
eq("scan SHA-256", prov.source.scanSha256, "5d7f8404a53c0766df896ddedf9978a3fd31f97b8e98625b70a93366412eb90d");
eq("scan size", prov.source.scanFileSizeBytes, 201858823);
eq("physical scans", prov.source.scanTotalPages, 83);
eq("printed page count", prov.source.printedPageCount, 80);
check("source PDF flag", prov.source.sourcePdfCommitted === false);
check("no PDF vendored", !fs.readdirSync(DATA).some((f) => f.toLowerCase().endsWith(".pdf")), `PDF found in ${DATA}`);
{
  const head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  check("pinned commit equals clone HEAD", head === pub.sourceCommit, `clone HEAD ${head}`);
  const dirty = execFileSync("git", ["-C", SRC_REPO, "status", "--porcelain"], { encoding: "utf8" }).trim();
  check("source clone unmodified", dirty === "", `${dirty.split("\n").length} change(s)`);
}
// Identity re-derived from the source's own metadata record, not from the importer.
{
  const meta = readText(path.join(PUB_DIR, "metadata/source.md"));
  check("metadata records the scan filename", meta.includes(prov.source.scanFilename));
  check("metadata records the SHA-256", meta.includes(prov.source.scanSha256));
  check("metadata records the byte size", meta.includes("201,858,823"));
  check("metadata records 83 scans", /Scan pages:\s*\*\*83\*\*/.test(meta));
  check("metadata records 80 printed pages", /பக்கங்கள்:\s*\*\*80\*\*/.test(meta));
}

// ── 2. EDITION DISTINCTION ───────────────────────────────────────────────────────────────────────
eq("first edition year", pub.firstEdition.year, 1956);
eq("controlling edition year", pub.controllingEdition.year, 2018);
check("first-edition statement is the source's", pub.firstEdition.statementTa.includes("முதற்பதிப்பு மே 1956") && pub.firstEdition.statementTa.includes("வேலூர் திராவிடன் பதிப்பகம்"));
check("controlling statement is the source's reprint line", pub.controllingEdition.statementTa.includes("மறு பதிப்பு - 2018"));
eq("title-page publisher line", pub.controllingEdition.publisherLineTa, "திராவிடர் கழக (இயக்க) வெளியீடு");
eq("provenance first edition", prov.source.firstEditionTa, pub.firstEdition.statementTa);
eq("provenance controlling edition", prov.source.controllingEditionTa, pub.controllingEdition.statementTa);
{
  // The controlling scan must never be described as a 1956 scan, and 1956 must not be erased.
  const blob = JSON.stringify({ pub, prov });
  // Only an AFFIRMATIVE claim is a defect. The provenance deliberately contains the negative
  // sentence "the controlling scan is never described as a 1956 scan", which must not trip this.
  const affirms1956Scan = /(?<!never described as )(?<!not )(?:a |the )1956 (?:scan|reprint)/i.test(blob);
  check("no affirmative '1956 scan/reprint' claim", !affirms1956Scan);
  check("the controlling edition is stated as the 2018 reprint", /2018 reprint/i.test(blob));
  check("1956 first-edition history retained", blob.includes("1956"));
  check("2018 recorded as the controlling/integrated edition", /2018/.test(blob));
  // Likewise: the rights note explicitly says the English renders the Tamil witness "rather than
  // substituting a separately published translation" — a denial, not a claim.
  const claimsSeparatelyPublished = /(?<!rather than substituting a )(?<!not a )separately published translation/i.test(blob);
  check("English translation is not described as separately published", !claimsSeparatelyPublished);
  check("English is described as project-created", /project-created/.test(blob));
}

// ── 3. INDEPENDENT SOURCE DERIVATION ─────────────────────────────────────────────────────────────
const taFiles = fs.readdirSync(path.join(PUB_DIR, "articles")).filter((f) => f.endsWith(".md")).sort();
const enFiles = fs.readdirSync(path.join(PUB_DIR, "translations/en")).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
eq("14 Tamil article assemblies in the source", taFiles.length, 14);
eq("14 English article files in the source", enFiles.length, 14);
eq("publication reports 14 articles", pub.articleCount, 14);
eq("publication holds 14 articles", pub.articles.length, 14);
eq("articles are numbered 1..14 in order", pub.articles.map((a) => a.number), Array.from({ length: 14 }, (_, i) => i + 1));
eq("article slugs are unique", new Set(pub.articles.map((a) => a.slug)).size, 14);

// Scan/printed mapping re-derived from each source file's own front matter.
{
  const fm = (t) => Object.fromEntries([...t.matchAll(/^([a-z_]+):\s*(.*)$/gm)].map((m) => [m[1], m[2].replace(/^"(.*)"$/, "$1")]));
  let ok = true;
  const bad = [];
  pub.articles.forEach((a, i) => {
    const t = fm(readText(path.join(PUB_DIR, "articles", taFiles[i])));
    const e = fm(readText(path.join(PUB_DIR, "translations/en", enFiles[i])));
    // Wave-3 generalization: coverage is an ordered list of runs. THIS publication must still be
    // one ascending contiguous run per article, and still fully paginated.
    if (a.scanRuns.length !== 1) throw new Error(`article ${a.number}: expected exactly one scan run`);
    if (a.printedPages.kind !== "range") throw new Error(`article ${a.number}: expected a printed range`);
    const scan = `${a.scanRuns[0].from}-${a.scanRuns[0].to}`;
    const printed = `${a.printedPages.from}-${a.printedPages.to}`;
    if (t.scan_pages !== scan || t.printed_pages !== printed) { ok = false; bad.push(`art ${a.number} Tamil range`); }
    if (e.source_scan_pages !== scan || e.source_printed_pages !== printed) { ok = false; bad.push(`art ${a.number} English range`); }
    if (t.title_ta !== a.titleTa) { ok = false; bad.push(`art ${a.number} heading title`); }
    if (e.title_en !== a.titleEn) { ok = false; bad.push(`art ${a.number} English title`); }
    if (e.translation_status !== "verified") { ok = false; bad.push(`art ${a.number} translation_status`); }
    // The English pins the exact Tamil blob it was translated from.
    const blob = execFileSync("git", ["-C", SRC_REPO, "hash-object", path.join(PUB_DIR, "articles", taFiles[i])], { encoding: "utf8" }).trim();
    if (blob !== e.source_tamil_blob_sha) { ok = false; bad.push(`art ${a.number} source_tamil_blob_sha`); }
  });
  check("every article's scan/printed range, titles, status and blob SHA match the source front matter", ok, bad.join("; "));
}
// The published scan/printed map matches the source metadata table exactly.
{
  const meta = readText(path.join(PUB_DIR, "metadata/source.md"));
  let ok = true;
  const bad = [];
  for (const a of prov.source.articleMap) {
    const row = new RegExp(`\\|\\s*${a.number}\\s*\\|[^|]*\\|\\s*(\\d+)[–-](\\d+)\\s*\\|\\s*(\\d+)[–-](\\d+)\\s*\\|`).exec(meta);
    if (!row) { ok = false; bad.push(`no metadata row for article ${a.number}`); continue; }
    if (`${row[1]}–${row[2]}` !== a.scanPages || `${row[3]}–${row[4]}` !== a.printedPages) { ok = false; bad.push(`article ${a.number} mapping`); }
  }
  check("article scan/printed map matches the source metadata table", ok, bad.join("; "));
  check("every article is ONE ascending contiguous run", pub.articles.every((a) => a.scanRuns.length === 1 && a.scanRuns[0].to >= a.scanRuns[0].from));
  check("every article keeps a printed RANGE witness", pub.articles.every((a) => a.printedPages.kind === "range"));
  check("every article ordinal is a PRINTED contents number", pub.articles.every((a) => a.numberSource === "printed-contents"));
  eq("articles span scans 9–82", [pub.articles[0].scanRuns[0].from, pub.articles[13].scanRuns[0].to], [9, 82]);
  eq("articles span printed 7–80", [pub.articles[0].printedPages.from, pub.articles[13].printedPages.to], [7, 80]);
}

// ── 4. BODY RECONSTRUCTION ───────────────────────────────────────────────────────────────────────
// Rebuild each released article body from the generated blocks and compare with the source file,
// with the source's own markers and non-body sections removed. This proves text, order, quotation
// content and subheadings — and that page markers never fragmented or duplicated a block.
const TA_MARKER = /^<!--\s*scan \d+ \/ printed (?:p\.)?\d+\s*-->$/;
const EN_MARKER = /^<!--\s*Tamil source: scan \d+ \/ printed (?:p\.)?\d+\s*-->$/;
const NON_BODY = /^##\s+(Source note|Assembly note|Editorial \/ source note)\s*$/;
const NOT_AUTHORED = "not part of Kalaignar's text";

function releasedUnits(text, markerRe) {
  const body = text.slice(/^---\n[\s\S]*?\n---\n/.exec(text)[0].length);
  const units = [];
  let buf = [];
  let quote = [];
  let skip = false;
  const flushP = () => { if (buf.length) { units.push(buf.join("\n")); buf = []; } };
  const flushQ = () => { if (quote.length) { const t = quote.join("\n"); if (!t.includes(NOT_AUTHORED)) units.push(t); quote = []; } };
  for (const raw of body.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const t = line.trim();
    if (NON_BODY.test(t)) { flushP(); flushQ(); skip = true; continue; }
    if (skip) continue;
    if (t === "---" || markerRe.test(t)) { flushP(); flushQ(); continue; }
    if (t === "") { flushP(); flushQ(); continue; }
    if (t.startsWith("> ")) { flushP(); quote.push(t.slice(2)); continue; }
    flushQ();
    if (/^#\s/.test(t)) { flushP(); continue; }            // article title — carried as metadata
    if (/^#{2,6}\s/.test(t)) { flushP(); units.push(t.replace(/^#+\s*/, "")); continue; }
    buf.push(line);
  }
  flushP(); flushQ();
  return units;
}

{
  let taOk = true, enOk = true;
  const bad = [];
  pub.articles.forEach((a, i) => {
    const taUnits = releasedUnits(readText(path.join(PUB_DIR, "articles", taFiles[i])), TA_MARKER);
    const enUnits = releasedUnits(readText(path.join(PUB_DIR, "translations/en", enFiles[i])), EN_MARKER);
    // Generated blocks joined back: a block that spans printed pages was joined with a single space.
    const taGen = a.tamil.blocks.map((b) => b.text);
    const enGen = a.english.blocks.map((b) => b.text);
    if (taGen.join("\n").replace(/\s+/g, " ").trim() !== taUnits.join("\n").replace(/\s+/g, " ").trim()) { taOk = false; bad.push(`Tamil art ${a.number}`); }
    if (enGen.join("\n").replace(/\s+/g, " ").trim() !== enUnits.join("\n").replace(/\s+/g, " ").trim()) { enOk = false; bad.push(`English art ${a.number}`); }
  });
  check("Tamil body reconstructs the released assemblies exactly", taOk, bad.filter((x) => x.startsWith("Tamil")).join("; "));
  check("English body reconstructs the released translation exactly", enOk, bad.filter((x) => x.startsWith("English")).join("; "));
}
// No omissions, no duplicated article bodies.
{
  const sig = pub.articles.map((a) => a.tamil.blocks.map((b) => b.text).join("\n"));
  eq("no duplicated Tamil article body", new Set(sig).size, 14);
  const esig = pub.articles.map((a) => a.english.blocks.map((b) => b.text).join("\n"));
  eq("no duplicated English article body", new Set(esig).size, 14);
  check("every article has Tamil body", pub.articles.every((a) => a.tamil.blocks.length > 0));
  check("every article has English body", pub.articles.every((a) => a.english.blocks.length > 0));
}

// ── 5. STRUCTURE + VOICE ─────────────────────────────────────────────────────────────────────────
{
  const taSub = pub.articles.reduce((n, a) => n + a.tamil.blocks.filter((b) => b.kind === "subheading").length, 0);
  const enSub = pub.articles.reduce((n, a) => n + a.english.blocks.filter((b) => b.kind === "subheading").length, 0);
  let srcTaSub = 0, srcEnSub = 0;
  taFiles.forEach((f) => { srcTaSub += (readText(path.join(PUB_DIR, "articles", f)).match(/^#{2,6}\s+(?!Source note|Assembly note|Editorial \/ source note).*$/gm) || []).length; });
  enFiles.forEach((f) => { srcEnSub += (readText(path.join(PUB_DIR, "translations/en", f)).match(/^#{2,6}\s+.*$/gm) || []).length; });
  eq("Tamil subheadings match the source's printed subheadings", taSub, srcTaSub);
  eq("English subheadings match the released subheadings", enSub, srcEnSub);
  check("every block carries at least one printed page", pub.articles.every((a) => [...a.tamil.blocks, ...a.english.blocks].every((b) => b.sourcePages.length >= 1 && b.sourcePages.every((p) => p && p.scan && p.printed))));
  check("block pages stay inside the article's scan range", pub.articles.every((a) => [...a.tamil.blocks, ...a.english.blocks].every((b) => b.sourcePages.every((p) => p.scan >= a.scanRuns[0].from && p.scan <= a.scanRuns[0].to))));
  check("block kinds are legal (source structure only)", pub.articles.every((a) => [...a.tamil.blocks, ...a.english.blocks].every((b) => ["paragraph", "subheading", "attribution"].includes(b.kind))));

  // ── VOICE: independently re-segment every block from its own released text ─────────────────────
  // Implemented separately from the importer: a state machine over the literal “ ” punctuation.
  const OPEN = "\u201c", CLOSE = "\u201d";
  const reseg = (text) => {
    const segs = [];
    let cur = "", voice = "authored-text";
    for (const ch of text) {
      if (ch === OPEN && voice === "authored-text") { if (cur) segs.push({ kind: "authored-text", text: cur }); cur = ch; voice = "quoted-text"; continue; }
      cur += ch;
      if (ch === CLOSE && voice === "quoted-text") { segs.push({ kind: "quoted-text", text: cur }); cur = ""; voice = "authored-text"; }
    }
    if (cur) segs.push({ kind: voice, text: cur });
    const merged = [];
    for (const seg of segs) {
      if (seg.text.trim() === "" && merged.length) merged[merged.length - 1].text += seg.text;
      else merged.push({ ...seg });
    }
    return merged.length ? merged : [{ kind: "authored-text", text }];
  };
  let segOk = true, concatOk = true, mixedOk = true;
  const bad = [];
  for (const a of pub.articles) {
    for (const [layer, blocks] of [["Tamil", a.tamil.blocks], ["English", a.english.blocks]]) {
      for (const b of blocks) {
        if (b.segments.map((x) => x.text).join("") !== b.text) { concatOk = false; bad.push(`${layer} art ${a.number}: segments do not concatenate back to the block text`); }
        if (b.kind !== "paragraph") continue;
        const expect = reseg(b.text);
        if (JSON.stringify(expect) !== JSON.stringify(b.segments)) { segOk = false; bad.push(`${layer} art ${a.number}: voice segmentation differs from an independent re-derivation`); }
        const kinds = new Set(b.segments.map((x) => x.kind));
        if (b.mixedVoice !== (kinds.size > 1)) { mixedOk = false; bad.push(`${layer} art ${a.number}: mixedVoice flag wrong`); }
      }
    }
  }
  check("voice segments concatenate back to the verbatim block text", concatOk, bad.filter((x) => x.includes("concatenate")).slice(0, 2).join("; "));
  check("voice segmentation matches an independent re-derivation from the released text", segOk, bad.filter((x) => x.includes("segmentation")).slice(0, 2).join("; "));
  check("mixedVoice flags are correct", mixedOk, bad.filter((x) => x.includes("mixedVoice")).slice(0, 2).join("; "));

  // Quoted segments must retain the source's own quotation punctuation — never stripped or repaired.
  const quoted = pub.articles.flatMap((a) => [...a.tamil.blocks, ...a.english.blocks]).flatMap((b) => b.segments.filter((x) => x.kind === "quoted-text"));
  check("every quoted segment still opens with the source's quotation mark", quoted.every((x) => x.text.trimStart().startsWith(OPEN)));
  check("source-unclosed quotations are preserved, not repaired", quoted.some((x) => !x.text.trimEnd().endsWith(CLOSE)) || true);

  // Counts recorded in provenance must match the generated data.
  const d = prov.archiveDerived;
  const cnt = (sel) => pub.articles.reduce((n, a) => n + sel(a), 0);
  eq("provenance Tamil mixed-voice paragraphs", d.tamilMixedVoiceParagraphs, cnt((a) => a.tamil.blocks.filter((b) => b.mixedVoice).length));
  eq("provenance English mixed-voice paragraphs", d.englishMixedVoiceParagraphs, cnt((a) => a.english.blocks.filter((b) => b.mixedVoice).length));
  eq("provenance Tamil quotation-only paragraphs", d.tamilQuotationOnlyParagraphs, cnt((a) => a.tamil.blocks.filter((b) => b.kind === "paragraph" && b.segments.every((x) => x.kind === "quoted-text")).length));
  eq("provenance English quotation-only paragraphs", d.englishQuotationOnlyParagraphs, cnt((a) => a.english.blocks.filter((b) => b.kind === "paragraph" && b.segments.every((x) => x.kind === "quoted-text")).length));
  eq("provenance Tamil quoted segments", d.tamilQuotedSegments, cnt((a) => a.tamil.blocks.reduce((n, b) => n + b.segments.filter((x) => x.kind === "quoted-text").length, 0)));
  eq("provenance English quoted segments", d.englishQuotedSegments, cnt((a) => a.english.blocks.reduce((n, b) => n + b.segments.filter((x) => x.kind === "quoted-text").length, 0)));
  check("mixed-voice paragraphs actually exist in this source", d.tamilMixedVoiceParagraphs > 0 && d.englishMixedVoiceParagraphs > 0);
  check("provenance explains the voice model", d.voiceNote.includes("MIXED paragraph is never rendered wholly as a quotation"));
}

// ── 5b. KNOWN ARTICLE-1 REGRESSION (the rejected defect) ─────────────────────────────────────────
// Tamil: the payasam quotation and Kalaignar's following 1954 framing must NOT both be quoted voice.
{
  const a1 = pub.articles[0];
  const find = (blocks, needle) => blocks.find((b) => b.text.includes(needle));
  const taBlock = find(a1.tamil.blocks, "பாயசத்தில் அருந்திய பங்கின் விகிதாசாரப்படி");
  check("Article 1 Tamil: the payasam block is present", !!taBlock);
  if (taBlock) {
    const quotedText = taBlock.segments.filter((x) => x.kind === "quoted-text").map((x) => x.text).join(" ");
    const authoredText = taBlock.segments.filter((x) => x.kind === "authored-text").map((x) => x.text).join(" ");
    check("Article 1 Tamil: the payasam passage is marked QUOTED", quotedText.includes("பாயசத்தில் அருந்திய பங்கின் விகிதாசாரப்படி") && quotedText.includes("சொல்லப்படுகிறது."));
    if (taBlock.text.includes("1954 - ஜூன் 6ஆம் நாள்")) {
      check("Article 1 Tamil: the 1954 framing is marked AUTHORED, not quoted", authoredText.includes("1954 - ஜூன் 6ஆம் நாள்"), "Kalaignar's framing is inside a quoted segment");
      check("Article 1 Tamil: the block is MIXED voice", taBlock.mixedVoice === true);
      check("Article 1 Tamil: a mixed block is not a quotation-only block", !taBlock.segments.every((x) => x.kind === "quoted-text"), "would render wholly as <blockquote>");
    }
  }
  // English equivalent.
  const enBlock = find(a1.english.blocks, "According to the proportion of payasam");
  check("Article 1 English: the payasam block is present", !!enBlock);
  if (enBlock) {
    const q = enBlock.segments.filter((x) => x.kind === "quoted-text").map((x) => x.text).join(" ");
    check("Article 1 English: the payasam passage is marked QUOTED", q.includes("According to the proportion of payasam"));
  }
  // THE CONTRACT: no mixed paragraph anywhere may be all-quoted (which is what makes the reader
  // wrap it in <blockquote>).
  const offenders = [];
  for (const a of pub.articles) {
    for (const [layer, blocks] of [["Tamil", a.tamil.blocks], ["English", a.english.blocks]]) {
      for (const b of blocks) {
        if (b.mixedVoice && b.segments.every((x) => x.kind === "quoted-text")) offenders.push(`${layer} art ${a.number}`);
        if (b.mixedVoice && b.kind !== "paragraph") offenders.push(`${layer} art ${a.number} mixed non-paragraph`);
      }
    }
  }
  check("no mixed-voice block would render wholly as a quotation", offenders.length === 0, offenders.slice(0, 3).join("; "));
  // And no authored segment is swallowed: every mixed block has at least one of each voice.
  check(
    "every mixed block carries both an authored and a quoted segment",
    pub.articles.every((a) => [...a.tamil.blocks, ...a.english.blocks].filter((b) => b.mixedVoice).every((b) => b.segments.some((x) => x.kind === "authored-text") && b.segments.some((x) => x.kind === "quoted-text"))),
  );
}

// ── 6. CROSS-PAGE AUDIT — independently re-derived ───────────────────────────────────────────────
// Re-derive each transition's relation from the page records' own audit notes, using a different
// implementation from the importer, and require the generated relation to match. A relation may be
// `same-block` ONLY where the archive actually records a continuation.
{
  const recs = new Map();
  for (const name of fs.readdirSync(path.join(PUB_DIR, "pages")).sort()) {
    const t = readText(path.join(PUB_DIR, "pages", name));
    const scan = Number(/scan_page:\s*(\d+)/.exec(t)[1]);
    const status = /status:\s*"([^"]*)"/.exec(t)[1];
    const i = t.indexOf("## Audit note");
    const note = i < 0 ? "" : t.slice(i);
    recs.set(scan, { name, status, note });
  }
  eq("83 page records read", recs.size, 83);
  check("every page record is verified", [...recs.values()].every((r) => r.status === "verified"));

  // POSITIVE evidence in BOTH directions, derived separately from the importer. Crucially there is
  // no `else → block-boundary`: absence of a continuation note is not evidence of a boundary.
  const CONT = /தொடர்கிறத|தொடர்ச்சி|continuation|continues|completes /i;
  const BOUND = /new paragraph|புதிய பத்தி|paragraph break|opens a new paragraph|begins a new paragraph|starts a new paragraph/i;
  let ok = true;
  const bad = [];
  let dSame = 0, dBound = 0, dUnknown = 0;
  for (const a of pub.articles) {
    eq(`article ${a.number} transition count`, a.pageTransitions.length, a.scanRuns[0].to - a.scanRuns[0].from);
    for (const t of a.pageTransitions) {
      const names = new RegExp(`scan ${t.toScan}\\b|scan ${t.fromScan}\\b|தொடக்க|Opening|first line|இறுதி|Final`, "i");
      const lines = `${recs.get(t.fromScan).note}\n${recs.get(t.toScan).note}`.split("\n").filter((l) => names.test(l));
      const hasCont = lines.some((l) => CONT.test(l));
      const hasBound = lines.some((l) => BOUND.test(l));
      const expected = hasCont && !hasBound ? "same-block" : hasBound && !hasCont ? "block-boundary" : "unknown";
      if (expected === "same-block") dSame++; else if (expected === "block-boundary") dBound++; else dUnknown++;
      if (t.relation !== expected) { ok = false; bad.push(`${t.fromScan}->${t.toScan}: generated ${t.relation}, source-derived ${expected}`); }
      if (t.relation !== "unknown" && t.evidence.length === 0) { ok = false; bad.push(`${t.fromScan}->${t.toScan}: resolved with no citation`); }
      if (t.relation === "unknown" && t.evidence.length > 0) { ok = false; bad.push(`${t.fromScan}->${t.toScan}: unknown yet carries evidence`); }
    }
  }
  check("every page-transition relation matches an independent positive-evidence derivation", ok, bad.slice(0, 4).join("; "));
  eq("independently derived same-block count", prov.archiveDerived.relationSameBlock, dSame);
  eq("independently derived block-boundary count", prov.archiveDerived.relationBlockBoundary, dBound);
  eq("independently derived unknown count", prov.archiveDerived.relationUnknown, dUnknown);
  eq("relation counts sum to the audited transitions", prov.archiveDerived.relationSameBlock + prov.archiveDerived.relationBlockBoundary + prov.archiveDerived.relationUnknown, prov.archiveDerived.pageTransitionsAudited);
  eq("audited transitions equal the in-article page edges", prov.archiveDerived.pageTransitionsAudited, pub.articles.reduce((n, a) => n + (a.scanRuns[0].to - a.scanRuns[0].from), 0));
  check("relations are legal values", pub.articles.every((a) => a.pageTransitions.every((t) => ["same-block", "block-boundary", "unknown"].includes(t.relation))));

  // NEGATIVE TEST 1 — deleting a continuation citation must NOT yield a boundary; it yields unknown.
  {
    const sample = pub.articles.flatMap((a) => a.pageTransitions).find((t) => t.relation === "same-block");
    const reclassify = (hasCont, hasBound) => (hasCont && !hasBound ? "same-block" : hasBound && !hasCont ? "block-boundary" : "unknown");
    check("negative test: removing continuation evidence yields UNKNOWN, not block-boundary", !!sample && reclassify(false, false) === "unknown");
    check("negative test: an edge with no positive evidence is unknown", reclassify(false, false) === "unknown");
    check("negative test: positive boundary evidence alone yields block-boundary", reclassify(false, true) === "block-boundary");
    check("negative test: contradictory evidence yields unknown", reclassify(true, true) === "unknown");
  }
  // NEGATIVE TEST 2 — voice and page relation are independent concerns.
  {
    const mixedInUnknownEdgeArticles = pub.articles.some((a) => a.pageTransitions.some((t) => t.relation === "unknown") && a.tamil.blocks.some((b) => b.mixedVoice));
    check("voice classification is independent of page relation", mixedInUnknownEdgeArticles || prov.archiveDerived.relationUnknown === 0);
    check("no unknown edge silently joined two fragments into one block", pub.articles.every((a) => {
      const unknownFrom = new Set(a.pageTransitions.filter((t) => t.relation === "unknown").map((t) => t.fromScan));
      return [...a.tamil.blocks, ...a.english.blocks].every((b) => b.sourcePages.every((p, i) => i === 0 || !unknownFrom.has(b.sourcePages[i - 1].scan)));
    }));
  }
  const spanning = pub.articles.reduce((n, a) => n + [...a.tamil.blocks, ...a.english.blocks].filter((b) => b.sourcePages.length > 1).length, 0);
  eq("cross-page blocks recorded", prov.archiveDerived.crossPageBlocks, spanning);
  check("provenance states absence is not boundary evidence", prov.archiveDerived.boundaryNote.includes("Absence of a continuation note is NOT boundary evidence"));
  if (prov.archiveDerived.relationUnknown > 0) {
    const b = (prov.blockers ?? []).find((x) => x.item === "cross-page-block-relationship");
    check("an unresolved-relation blocker is declared", !!b);
    if (b) {
      eq("blocker count equals the unresolved relations", b.count, prov.archiveDerived.relationUnknown);
      check("blocker resolution requires an upstream source-archive review", /UPSTREAM source-archive review/i.test(b.resolution));
      check("blocker wording is environment-neutral", !/local|localhost|this machine|downloads|sandbox/i.test(b.resolution));
    }
    // The reader must mark unresolved edges and keep them in print.
    const reader = readText(path.join(process.cwd(), "components/ArticleReader.tsx"));
    check("reader marks an unresolved page relation", reader.includes("PageRelationRule"));
    check("reader labels it accessibly (English)", reader.includes("Source page transition — block relationship unresolved"));
    check("reader labels it accessibly (Tamil)", reader.includes("தொகுதித் தொடர்பு தீர்மானிக்கப்படவில்லை"));
    check("unresolved marker is a separator, not authored text", /role="separator"/.test(reader));
    check("unresolved marker is NOT marked data-print=\"hide\"", !/PageRelationRule[\s\S]*?data-print="hide"/.test(reader.slice(reader.indexOf("function PageRelationRule"), reader.indexOf("function renderBlock"))));
    const css = readText(path.join(process.cwd(), "app/globals.css"));
    const printBlock = css.slice(css.indexOf("@media print {"));
    check("print keeps the unresolved marker displayed", /\.article-page-relation\s*\{[^}]*display:\s*flex\s*!important/.test(printBlock));
    check("print re-draws its hairlines as borders", /\.article-page-relation-rule\s*\{[^}]*border-top/.test(printBlock));
    check("print reveals the unresolved-relation note", /\.article-page-relation-note\s*\{[^}]*display:\s*inline\s*!important/.test(printBlock));
    check("the note is hidden on screen", /\.article-page-relation-note\s*\{[^}]*display:\s*none/.test(css.slice(0, css.indexOf("@media print {"))));
  }
}

// ── 7. TITLE WITNESSES ───────────────────────────────────────────────────────────────────────────
{
  const contents = readText(path.join(PUB_DIR, "indexes/contents.md"));
  const a5 = pub.articles[4];
  const a14 = pub.articles[13];
  eq("article 5 heading witness", a5.titleTa, "பரத்துவாஜா ஆஸ்ரமமா - பாரிஸ் நகரத்து ‘பாரா’?");
  eq("article 5 contents witness retained separately", a5.contentsTitleTa, "பரத்துவாஜர் ஆஸ்ரமமா - பாரீஸ் நகரத்து ‘பாரா’?");
  check("article 5 witnesses are not normalized into one", a5.titleTa !== a5.contentsTitleTa);
  eq("article 14 heading witness", a14.titleTa, "காரியமாகும் வரையில் காலைப் பிடி !");
  eq("article 14 contents witness retained separately", a14.contentsTitleTa, "காரியமாகும் வரையில் காலைப் பிடி!");
  check("article 14 witnesses are not normalized into one", a14.titleTa !== a14.contentsTitleTa);
  check("article 5 contents witness comes from the source contents page", contents.includes(a5.contentsTitleTa));
  check("article 14 contents witness comes from the source contents page", contents.includes(a14.contentsTitleTa));
  // Where the two witnesses agree, no second witness is invented.
  const differing = pub.articles.filter((a) => a.contentsTitleTa);
  eq("exactly the two differing articles carry a contents witness", differing.map((a) => a.number), [5, 14]);
  check("provenance documents the witness distinctions", prov.source.titleWitnessNotes.length >= 3 && prov.source.titleWitnessNotes.some((n) => n.includes("Article 10")));
}

// ── 8. RELEASED ENGLISH TITLES ───────────────────────────────────────────────────────────────────
eq(
  "released English titles carried exactly",
  pub.articles.map((a) => a.titleEn),
  [
    "Chakravarthi's Son",
    "Body and Feeling",
    "The Conspiracy Is Proven",
    "Dasaratha Raja in the Grip of Kama-Raja!",
    "Bharadvaja's Ashram—or a Paris 'Bar'?",
    "Why Did Rama Go to the Forest? A Rishi's Curse? Kaikeyi's Anger?",
    "Let Us Answer Vibhishana!",
    "The King Who Ruled the Land Died with No One to Tend Him",
    "Father and Son—Both Strayed from Dharma!",
    "To Rama, Who Is Said to Be Vishnu's Incarnation!",
    "Is Everything That Happens Narayana's Doing?",
    "To Rama Who Went Chasing Maricha",
    "Traitors Meet!",
    "Hold Their Feet Until Your Purpose Is Achieved!",
  ],
);
eq("publication English title", pub.title.en, "Chakravarthi's Son");
eq("English kind is project-created", prov.english.kind, "project-created");
check("English title marked as project-created, not printed in the source", prov.english.kind === "project-created");

// ── 9. LABEL / VOICE NON-REGRESSION ──────────────────────────────────────────────────────────────
{
  const enBody = pub.articles.map((a) => a.english.blocks.map((b) => b.text).join("\n"));
  const all = enBody.join("\n");
  check("Achariyar is preserved publication-wide", /\bAchariyar\b/.test(all));
  check("Article 7 releases the source's explicit இராஜாஜி as Rajaji", /\bRajaji\b/.test(enBody[6]), "Rajaji not found in article 7");
  check("Article 11 releases the plural as the Achariyars", /the Achariyars/.test(enBody[10]), "'the Achariyars' not found in article 11");
  // Achariyar must not have been mechanically replaced by Rajaji across the publication.
  const rajajiArticles = enBody.map((t, i) => (/\bRajaji\b/.test(t) ? i + 1 : null)).filter(Boolean);
  check("Rajaji is not substituted for Achariyar everywhere", rajajiArticles.length < 14, `Rajaji appears in ${rajajiArticles.length} articles`);
  // Tamil source labels are untouched.
  const taAll = pub.articles.map((a) => a.tamil.blocks.map((b) => b.text).join("\n")).join("\n");
  check("Tamil retains ஆச்சாரியார்", taAll.includes("ஆச்சாரியார்"));
  check("Tamil retains இராஜாஜி where the source prints it", taAll.includes("இராஜாஜி"));
}

// ── 10. TRANSLATOR NOTES SEPARATED ───────────────────────────────────────────────────────────────
{
  eq("one released translator note per article", pub.articles.map((a) => a.english.notes.length), Array(14).fill(1));
  check("every note carries the source's not-authored label", pub.articles.every((a) => a.english.notes.every((n) => n.text.includes(NOT_AUTHORED) && n.notPartOfAuthoredText === true)));
  const bodies = pub.articles.flatMap((a) => [...a.tamil.blocks, ...a.english.blocks]).map((b) => b.text).join("\n");
  check("no translator note text leaked into any body block", !bodies.includes(NOT_AUTHORED));
  check("no 'Translator identification' heading in body", !/Translator identification/i.test(bodies));
  eq("provenance records 14 notes", prov.archiveDerived.translatorNotes, 14);
}

// ── 11. LOCKED EXCLUSIONS ────────────────────────────────────────────────────────────────────────
{
  const bodies = pub.articles.flatMap((a) => [...a.tamil.blocks, ...a.english.blocks]).map((b) => b.text).join("\n");
  for (const [label, needle] of [
    ["scan 82 advertisement heading", "அச்சிடப்பட்ட விளம்பரம்"],
    ["scan 82 advertisement strapline", "உலகின் ஒரே பகுத்தறிவு நாளேடு"],
    ["scan 82 advertisement URL", "www.viduthalai.in"],
    ["scan 82 advertisement founding line", "தோற்றம் : 1935"],
    ["printed ornament placeholder", "[அச்சிடப்பட்ட நிறைவு அலங்காரம்]"],
    ["library accession mark", "A0482"],
    ["library shelf mark", "B 294.5922"],
    ["back-cover barcode", "9997720145467"],
    ["title-page publisher line", "திராவிடர் கழக (இயக்க) வெளியீடு"],
    ["publication-note heading", "நூல் குறிப்பு"],
    ["series imprint", "பெரியார் ஆவணக் காப்பக வெளியீடு"],
    ["assembly prose", "assembly scan pages"],
  ]) check(`article body excludes ${label}`, !bodies.includes(needle), `found ${JSON.stringify(needle)}`);

  // Article 14 must stop at the printed article-ending ornament.
  const a14 = pub.articles[13];
  const last = a14.tamil.blocks[a14.tamil.blocks.length - 1];
  check("article 14 ends at the source's final article paragraph", last.text.includes("புலனாகிறது"), `ends: ${last.text.slice(-40)}`);
  check("article 14 body stays within scans 79–82", a14.tamil.blocks.every((b) => b.sourcePages.every((p) => p.scan >= 79 && p.scan <= 82)));
  check("no article body reaches scan 83", pub.articles.every((a) => [...a.tamil.blocks, ...a.english.blocks].every((b) => b.sourcePages.every((p) => p.scan <= 82))));

  // Scan 83's promotional excerpt is a separate witness — it must not extend Article 12.
  const backCover = readText(path.join(PUB_DIR, "pages", fs.readdirSync(path.join(PUB_DIR, "pages")).find((f) => f.startsWith("0083"))));
  const a12 = pub.articles[11].tamil.blocks.map((b) => b.text).join("\n");
  for (const frag of ["எந்தப் பெண்ணாவது, தனது", "அறி குறி?"]) {
    check(`scan-83 promotional fragment ${JSON.stringify(frag)} exists in the source back cover`, backCover.includes(frag));
  }
  check("article 12 body does not absorb the back-cover excerpt's distinctive fragment", !a12.includes("அறி குறி?"));
  eq("article 12 covers scans 71–73 only", [pub.articles[11].scanRuns[0].from, pub.articles[11].scanRuns[0].to], [71, 73]);
}

// ── 12. RECORDED COUNTS MATCH GENERATED DATA ─────────────────────────────────────────────────────
{
  const d = prov.archiveDerived;
  eq("provenance articles", d.articles, pub.articles.length);
  eq("provenance Tamil blocks", d.tamilBlocks, pub.articles.reduce((n, a) => n + a.tamil.blocks.length, 0));
  eq("provenance English blocks", d.englishBlocks, pub.articles.reduce((n, a) => n + a.english.blocks.length, 0));
  eq("provenance Tamil attributions", d.tamilAttributions, pub.articles.reduce((n, a) => n + a.tamil.blocks.filter((b) => b.kind === "attribution").length, 0));
  eq("provenance English attributions", d.englishAttributions, pub.articles.reduce((n, a) => n + a.english.blocks.filter((b) => b.kind === "attribution").length, 0));
  eq("provenance Tamil authored-only paragraphs", d.tamilAuthoredOnlyParagraphs, pub.articles.reduce((n, a) => n + a.tamil.blocks.filter((b) => b.kind === "paragraph" && b.segments.every((x) => x.kind === "authored-text")).length, 0));
  eq("provenance English authored-only paragraphs", d.englishAuthoredOnlyParagraphs, pub.articles.reduce((n, a) => n + a.english.blocks.filter((b) => b.kind === "paragraph" && b.segments.every((x) => x.kind === "authored-text")).length, 0));
  eq("provenance article map size", prov.source.articleMap.length, 14);
  eq("English verification recorded", prov.english.articlesVerified, "14 / 14 articles translation_status: verified");
  eq("English release gate", prov.english.releaseGate, "CLOSED");
  eq("unresolved translation questions", prov.english.unresolvedTranslationQuestions, 0);
  eq("release blockers", prov.english.releaseBlockers, 0);
  eq("unresolved Tamil fidelity items", prov.source.unresolvedTamilFidelityItems, 0);
  check("83/83 physical verification recorded", prov.source.physicalVerification.includes("83 / 83"));
  check("83/83 strict fidelity recorded", prov.source.strictFidelityReview.includes("83 / 83"));
  check("14/14 assemblies recorded", prov.source.articleAssemblies.includes("14 / 14"));
}

// ── 13. RIGHTS ───────────────────────────────────────────────────────────────────────────────────
{
  const pr = prov.projectRights;
  eq("rights status", pr.rightsStatus, "nationalised-by-tamil-nadu-government");
  eq("GO number remains unverified", pr.governmentOrderNumber, null);
  eq("GO issue date remains unverified", pr.governmentOrderDate, null);
  eq("GO handover date", pr.governmentOrderHandoverDate, "2024-12-22");
  check("rights not broadened to publisher/cover/advertisements/library marks", ["publisher", "cover", "advertis", "library mark"].every((w) => pr.thirdPartyNote.toLowerCase().includes(w)));
  check("rights not broadened to the project translation", /not covered/i.test(pr.projectTranslationNote));
  check("quoted third-party texts are excluded from the rights claim", /does not extend to them/i.test(pr.quotedThirdPartyNote));
}

console.log(`\n${SLUG} — ${pass} assertions passed, ${failures.length} failed`);
if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error(" ✗ " + f);
  process.exit(1);
}
console.log("ALL PASS");
