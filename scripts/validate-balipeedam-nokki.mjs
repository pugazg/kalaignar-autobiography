// Validator for பலிபீடம் நோக்கி / "Towards the Sacrificial Altar" — Digital Library Fiction
// benchmark #1.
//
// Validates the GENERATED reader structure, not just metadata constants: it reconstructs both
// released layers from public/data/novels/<slug>/novel.json and proves exact equality with the
// source archive's own assembled reading layer, and derives its expectations from the source
// INDEPENDENTLY of the importer wherever practical.
//
// Usage: node scripts/validate-balipeedam-nokki.mjs <kalaignar-novels-clone>

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-balipeedam-nokki.mjs <kalaignar-novels-clone>");
  process.exit(1);
}

const SLUG = "balipeedam-nokki";
const WORK_DIR = path.join(SRC_REPO, "works", SLUG);
const DATA = path.join(process.cwd(), "public/data/novels", SLUG);
const nfc = (s) => s.normalize("NFC");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));

// Parse data/library.ts into one record per catalog entry.
//
// Regex-counting the whole file cannot tell WHICH entry a match belongs to, so an assertion built
// on it can only ever count occurrences — which is how the old fiction-shelf check came to test the
// wrong thing. Splitting the array into entries first means every assertion below can be stated
// about a specific work.
//
// Comments are stripped before brace-matching (they contain both braces and backticks), and string
// literals are respected so a brace inside a Tamil description cannot split an entry. data/library.ts
// uses no template literals, which this relies on and which the parse-shape check below would catch.
function catalogEntries(src) {
  let s = "";
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'") {
      const q = c;
      let j = i + 1;
      while (j < src.length && src[j] !== q) j += src[j] === "\\" ? 2 : 1;
      s += src.slice(i, j + 1);
      i = j;
    } else if (c === "/" && src[i + 1] === "/") {
      const nl = src.indexOf("\n", i);
      s += " ".repeat((nl === -1 ? src.length : nl) - i);
      i = (nl === -1 ? src.length : nl) - 1;
    } else if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      s += src.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop - 1;
    } else s += c;
  }
  const decl = s.indexOf("LIBRARY_WORKS");
  // The array opener is the LAST "[" before the first entry — `s.indexOf("[", decl)` would find the
  // one in the `LibraryWork[]` type annotation instead.
  const open = s.lastIndexOf("[", s.indexOf("{", decl));
  const body = s.slice(open + 1, s.indexOf("\n];", open));
  const spans = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '"' || c === "'") {
      const q = c;
      while (++i < body.length && body[i] !== q) if (body[i] === "\\") i++;
    } else if (c === "{") {
      if (depth++ === 0) start = i;
    } else if (c === "}") {
      if (--depth === 0) spans.push([start, i + 1]);
    }
  }
  // Offsets come from the comment-blanked copy, which is character-for-character aligned with the
  // original — so the ORIGINAL text (comments intact) is sliced for each entry, letting the mention
  // checks see the notes.
  // Span offsets are relative to `body`; shift them to absolute file offsets before slicing.
  return spans.map(([a, b]) => {
    const [from, to] = [open + 1 + a, open + 1 + b];
    const stripped = s.slice(from, to);
    const field = (k) => (stripped.match(new RegExp(`^\\s*${k}: "([^"]*)"`, "m")) || [])[1];
    return {
      src: src.slice(from, to),
      id: field("id"),
      slug: field("slug"),
      shelf: field("shelf"),
      href: field("href"),
      sourcePath: field("sourcePath"),
      provenanceHref: field("provenanceHref"),
    };
  });
}

const novel = JSON.parse(fs.readFileSync(path.join(DATA, "novel.json"), "utf8"));
const prov = JSON.parse(fs.readFileSync(path.join(DATA, "provenance.json"), "utf8"));

let pass = 0;
const failures = [];
const check = (n, c, d) => (c ? pass++ : failures.push(d ? `${n} — ${d}` : n));
const eq = (n, a, b) => check(n, JSON.stringify(a) === JSON.stringify(b), `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

// ── 1. SOURCE PIN AND IDENTITY ───────────────────────────────────────────────────────────────────
eq("source repo", novel.sourceRepo, "pugazg/kalaignar-novels");
eq("source path", novel.sourcePath, `works/${SLUG}`);
eq("source commit", novel.sourceCommit, "9e80c567d4a2165178c5374a02210240140685bf");
eq("provenance pin agrees", [prov.sourceRepo, prov.sourcePath, prov.sourceCommit], [novel.sourceRepo, novel.sourcePath, novel.sourceCommit]);
eq("scan SHA-256", prov.source.scanSha256, "c4700c9043da8eadbf25144e7127a66a9270326512c095d99e1113a4feb464fe");
eq("scan size", prov.source.scanFileSizeBytes, 69724254);
eq("physical scans", prov.source.scanTotalPages, 34);
check("scan filename matches the source (NFC)", nfc(prov.source.scanFilename) === nfc("TVA_BOK_0065570_பலிபீடம்_நோக்கி.pdf"));
check("source PDF flag", prov.source.sourcePdfCommitted === false);
check("no PDF vendored", !fs.readdirSync(DATA).some((f) => f.toLowerCase().endsWith(".pdf")));
check("no PDF committed in the source repository either", !execFileSync("git", ["-C", SRC_REPO, "ls-files"], { encoding: "utf8" }).split("\n").some((f) => f.toLowerCase().endsWith(".pdf")));
{
  const head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  check("pinned commit equals clone HEAD", head === novel.sourceCommit, `clone HEAD ${head}`);
  const dirty = execFileSync("git", ["-C", SRC_REPO, "status", "--porcelain"], { encoding: "utf8" }).trim();
  check("source clone unmodified", dirty === "", `${dirty.split("\n").length} change(s)`);
}
// Identity re-derived from the source's own metadata record.
{
  const meta = readText(path.join(WORK_DIR, "metadata/source.md"));
  check("metadata records the SHA-256", meta.includes(prov.source.scanSha256));
  check("metadata records the byte size", meta.includes("69,724,254"));
  check("metadata records 34 scans", /Scan pages:\s*\*\*34\*\*/.test(meta));
  check("metadata records the 1947 first edition", meta.includes("ஏப்ரல் 1947"));
  check("metadata records the publisher", meta.includes("எரிமலைப் பதிப்பகம்"));
  check("metadata records the printer", meta.includes("ஊழியன் பிரஸ்"));
  eq("edition year", novel.edition.year, 1947);
  eq("edition statement", novel.edition.statementTa, "முதற்பதிப்பு ஏப்ரல் 1947");
  // The scan IS the first edition — there is no reprint to confuse it with.
  check("no reprint claim anywhere", !/reprint/i.test(JSON.stringify({ novel, prov })));
}

// ── 2. THE EMBEDDED-SEQUENCE RULE ────────────────────────────────────────────────────────────────
// The single most important structural fact: ராயசம் வெங்கண்ணா is a SECTION, never a separate work.
{
  const meta = readText(path.join(WORK_DIR, "metadata/source.md"));
  check("source still states the one-work rule", meta.includes("This scan contains one work"));
  check("source still calls the sequence embedded", meta.includes("embedded cinematic / historical sequence inside"));
  check("source forbids a separate work identity", /no separate work directory/i.test(meta));
  const embedded = novel.sections.filter((s) => s.isEmbeddedSequence);
  eq("exactly one embedded-sequence section", embedded.length, 1);
  eq("the embedded section is section 2", embedded[0]?.order, 2);
  eq("provenance records one embedded-sequence section", prov.archiveDerived.embeddedSequenceSections, 1);
  check("the embedded section keeps the novel's work id", novel.sections.every(() => novel.workId === SLUG));
  // The sequence must have NO catalog work, no identity and no route of its own. The catalog may
  // legitimately DESCRIBE it — that is the point of the note — but never name it as a work.
  //
  // These checks used to be anchored on a count: `shelf: "fiction"` had to occur exactly once. That
  // was a PROXY, valid only while the fiction shelf happened to hold this one novel, and it tested
  // the wrong thing — it would have passed a second fiction entry called `rayasam-venganna` if this
  // novel had been removed, and it fails an unrelated second fiction work that has nothing to do
  // with the sequence. The invariant is about IDENTITY, so it is asserted on identity: this novel
  // appears exactly once, and no fiction entry — however many there are — is the sequence.
  const entries = catalogEntries(readText(path.join(process.cwd(), "data/library.ts")));
  const IS_SEQUENCE = /rayasam|venganna|ராயசம்|வெங்கண்ணா/i;
  const idFields = (e) => [e.id, e.slug, e.href, e.sourcePath, e.provenanceHref].filter(Boolean);

  eq("the catalog parses into entries", entries.length > 0, true);
  const named = entries.filter((e) => idFields(e).some((v) => IS_SEQUENCE.test(v)));
  check("no catalog identity names the sequence", named.length === 0, named.map((e) => e.id).join(", "));

  const fiction = entries.filter((e) => e.shelf === "fiction");
  check("the fiction shelf carries this novel", fiction.some((e) => e.id === SLUG));
  eq("the novel appears exactly once in the catalog", entries.filter((e) => e.id === SLUG).length, 1);
  eq("the novel appears exactly once on the fiction shelf", fiction.filter((e) => e.id === SLUG).length, 1);
  // Deliberately NOT a count of the shelf: fiction may hold any number of unrelated works. What is
  // forbidden is a fiction entry that IS the sequence.
  const seqOnShelf = fiction.filter((e) => idFields(e).some((v) => IS_SEQUENCE.test(v)));
  check("no fiction work is the embedded sequence", seqOnShelf.length === 0, seqOnShelf.map((e) => e.id).join(", "));

  // Every mention of the sequence anywhere in the catalog must sit in a free-text field, and inside
  // THIS novel's entry — not merely in some entry's prose.
  const mentions = entries.flatMap((e) =>
    [...e.src.matchAll(new RegExp(IS_SEQUENCE.source, "gi"))].map((m) => ({
      entry: e,
      line: e.src.slice(e.src.lastIndexOf("\n", m.index) + 1, m.index),
    })),
  );
  check("the sequence is mentioned somewhere (the note still exists)", mentions.length > 0);
  check(
    "every mention of the sequence is free text inside this novel's entry",
    mentions.every((m) => m.entry.id === SLUG && /^\s*(?:\/\/|\*|desc(?:Ta|En):|note:)/.test(m.line)),
    mentions.filter((m) => !(m.entry.id === SLUG && /^\s*(?:\/\/|\*|desc(?:Ta|En):|note:)/.test(m.line))).map((m) => `${m.entry.id}: ${m.line.trim().slice(0, 40)}`).join(" | "),
  );
  check("no separate route for the sequence", !fs.readdirSync(path.join(process.cwd(), "app/novels")).some((d) => IS_SEQUENCE.test(d)));
  eq("provenance explains the rule", typeof prov.source.embeddedSequenceNote, "string");
  check("provenance states it is not a separate work", prov.source.embeddedSequenceNote.includes("NOT a separate work"));
  check("source continuity is recorded", prov.source.sourceContinuity.length >= 6);
}

// ── 3. INDEPENDENT SOURCE DERIVATION ─────────────────────────────────────────────────────────────
const TA_DIR = path.join(WORK_DIR, "sections");
const EN_DIR = path.join(WORK_DIR, "translations/en/sections");
const taFiles = fs.readdirSync(TA_DIR).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
const enFiles = fs.readdirSync(EN_DIR).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
eq("3 assembled Tamil sections in the source", taFiles.length, 3);
eq("3 English sections in the source", enFiles.length, 3);
eq("novel holds 3 sections", novel.sections.length, 3);
eq("sections are ordered 1..3", novel.sections.map((s) => s.order), [1, 2, 3]);
eq("section slugs are unique", new Set(novel.sections.map((s) => s.slug)).size, 3);
eq("section count recorded", novel.sectionCount, 3);
{
  const fm = (t) => Object.fromEntries([...t.matchAll(/^([a-z_]+):\s*(.*)$/gm)].map((m) => [m[1], m[2].replace(/^"(.*)"$/, "$1")]));
  let ok = true;
  const bad = [];
  novel.sections.forEach((s, i) => {
    const t = fm(readText(path.join(TA_DIR, taFiles[i])));
    const e = fm(readText(path.join(EN_DIR, enFiles[i])));
    if (t.section_title !== s.titleTa) { ok = false; bad.push(`section ${s.order} Tamil title`); }
    if (e.section_title !== s.titleEn) { ok = false; bad.push(`section ${s.order} English title`); }
    if (t.source_scans !== s.sourceScansTa) { ok = false; bad.push(`section ${s.order} Tamil scans`); }
    if (e.source_scans !== s.sourceScansEn) { ok = false; bad.push(`section ${s.order} English scans`); }
    if (t.status !== "verified") { ok = false; bad.push(`section ${s.order} Tamil status`); }
    if (e.status !== "reviewed") { ok = false; bad.push(`section ${s.order} English status`); }
    if (t.work !== SLUG || e.work !== SLUG) { ok = false; bad.push(`section ${s.order} work identity`); }
  });
  check("every section's titles, scan coverage, status and work identity match the source front matter", ok, bad.join("; "));
}

// ── 3b. PRINTED HEADINGS vs THE ARCHIVE'S SECTION LABELS ─────────────────────────────────────────
// Re-derived here straight from the canonical page records, independently of the importer. A
// heading may appear in the reading body only if the 1947 edition prints it; the assembled layer's
// own section label must never be published as Kalaignar's text, nor be given page provenance.
const PAGES_DIR = path.join(WORK_DIR, "pages");
const APPARATUS_HEADING = /^#{1,6}\s+(Scan observations|Non-text \/ copy-specific marks|Verification note|Page record)\s*$/;
const printed = new Map();
for (const f of fs.readdirSync(PAGES_DIR).filter((x) => /^\d{4}.*\.md$/.test(x)).sort()) {
  const text = readText(path.join(PAGES_DIR, f));
  const fm = /^---\n[\s\S]*?\n---\n/.exec(text);
  if (!fm || !/^page_type:\s*"body"\s*$/m.test(fm[0])) continue;
  for (const line of text.slice(fm[0].length).split("\n")) {
    if (!/^#{1,6}\s/.test(line)) continue;
    if (APPARATUS_HEADING.test(line.trim())) break;
    const t = line.trim().replace(/^#+\s*/, "");
    if (!printed.has(t)) printed.set(t, []);
    printed.get(t).push(Number(f.slice(0, 4)));
  }
}
{
  eq("the edition prints exactly 3 body headings", printed.size, 3);
  eq("printed headings re-derive identically", prov.archiveDerived.printedHeadingsInSource.map((h) => [nfc(h.text), h.scans]), [...printed.entries()].map(([t, sc]) => [t, sc]));
  // Every heading in the reading body is printed, and cited to a scan that prints it.
  const heads = novel.sections.flatMap((s) => s.tamil.blocks.filter((b) => b.kind === "heading").map((b) => ({ s: s.order, b })));
  check("every Tamil heading in the body is one the edition prints", heads.every((h) => printed.has(nfc(h.b.text))), heads.filter((h) => !printed.has(nfc(h.b.text))).map((h) => h.b.text).join("; "));
  check("every Tamil heading is cited to a scan that prints it", heads.every((h) => h.b.sourcePages.some((pg) => printed.get(nfc(h.b.text))?.includes(pg.scan))));
  // The archive's section labels are not in the body, in either layer.
  const bodyText = novel.sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).map((b) => b.text);
  for (const s of novel.sections) {
    check(`section ${s.order}: the archive's Tamil label is not body text`, !bodyText.includes(s.titleTa), s.titleTa);
    check(`section ${s.order}: the archive's English label is not body text`, !bodyText.includes(s.titleEn), s.titleEn);
  }
  // Section 3's label is the one the edition does not print: scan 30 runs straight into the return.
  eq("exactly one section carried an archive-only label", prov.archiveDerived.sectionsWithArchiveOnlyTitle, novel.sections.filter((s) => s.carriesArchiveSectionLabel).length);
  eq("that section is section 3", novel.sections.filter((s) => s.carriesArchiveSectionLabel).map((s) => s.order), [3]);
  check("section 3 opens on the narrator's own return, not a heading", novel.sections[2].tamil.blocks[0].kind === "paragraph" && novel.sections[2].tamil.blocks[0].text.startsWith("படம் முடிந்துவிட்டது."));
  check("no section title is claimed as printed", novel.sections.every((s) => s.titleIsPrintedHeading === printed.has(nfc(s.titleTa))));
  check("the reader states a non-printed title is the archive's label", readText(path.join(process.cwd(), "components/NovelReader.tsx")).includes("!section.titleIsPrintedHeading"));
  check("the landing page states the titles are the archive's, not printed headings", /not chapters or printed headings/.test(readText(path.join(process.cwd(), "components/NovelLanding.tsx"))));

  // The ENGLISH layer's typography is the translation's own editorial structure and is never
  // promoted into a claim about what the 1947 edition prints. The printed set is Tamil-only, and
  // the English layer may typeset a printed LINE as a heading (`Erimalai 'Release'`) where the
  // authoritative Tamil layer keeps it as a paragraph — that is the translation's choice, carried
  // as released, and it must not add to or subtract from the Tamil record.
  check("the printed-heading record is derived from the Tamil layer only", prov.archiveDerived.printedHeadingsInSource.every((h) => !/[A-Za-z]/.test(h.text)));
  const enHeads = novel.sections.flatMap((s) => s.english.blocks.filter((b) => b.kind === "heading").map((b) => b.text));
  check("no English heading is recorded as a heading the edition prints", enHeads.every((t) => !printed.has(nfc(t))));
  check("English headings carry their own page provenance", novel.sections.every((s) => s.english.blocks.filter((b) => b.kind === "heading").every((b) => b.sourcePages.length > 0)));
  // Every heading the edition prints is present in the Tamil body; the English layer's extra
  // headings are its own typesetting and add nothing to that record. (That the Tamil layer is
  // otherwise complete and unaltered is proved by the exact reconstruction in section 4.)
  const taHeads = novel.sections.flatMap((s) => s.tamil.blocks.filter((b) => b.kind === "heading").map((b) => nfc(b.text)));
  eq("every printed heading survives in the Tamil body", [...printed.keys()].every((t) => taHeads.includes(t)), true);
  check("English headings never outnumber Tamil ones by more than its own editorial additions", enHeads.length >= taHeads.length);
  check("the English layer is the released translation, not an invented one", prov.english.kind === "project-created" && /VERIFIED/.test(prov.english.status));
}

// ── 3c. THE EMBEDDED SEQUENCE'S NAME, DERIVED FROM THE SOURCE ───────────────────────────────────
// The canonical name is taken from the source, never asserted here: the printed title card on the
// scan that carries it, cross-checked against the source's own English glossary, which fixes the
// English rendering and records which alternative readings it rejects. If the archive ever revises
// the name, these assertions fail until a re-import carries the revision through — and any form the
// source does not print is rejected on the spot.
{
  // (a) The Tamil name as the audited page record prints it on the sequence's title card.
  const scan8 = [...printed.entries()].filter(([, scans]) => scans.includes(8)).map(([t]) => nfc(t));
  const nameTa = scan8.find((t) => t.startsWith("ராயசம் "));
  check("the source prints the sequence's title card on scan 8", !!nameTa, `scan-8 headings: ${scan8.join(" | ")}`);
  const bare = nameTa ? nameTa.replace(/^ராயசம்\s+/, "") : "";

  // (b) The English rendering the source's own glossary mandates for that exact Tamil form.
  const glossary = readText(path.join(WORK_DIR, "translations/en/GLOSSARY.md"));
  const row = new RegExp(`^\\|\\s*\`${bare.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\`\\s*\\|\\s*\\*\\*(.+?)\\*\\*\\s*\\|\\s*(.*?)\\s*\\|\\s*$`, "m").exec(glossary);
  check("the glossary fixes an English rendering for the printed Tamil name", !!row, `no glossary row for \`${bare}\``);
  const nameEn = row ? row[1].trim() : "";
  const glossNote = row ? row[2].trim() : "";

  // (c) The generated data must use exactly those forms — and no other form of the name.
  const embedded = novel.sections.find((s) => s.isEmbeddedSequence);
  check("the embedded section is titled with the printed Tamil name", embedded?.titleTa.includes(nameTa || "\u0000"), embedded?.titleTa);
  check("the embedded section's English title uses the glossary's mandated form", embedded?.titleEn.includes(nameEn || "\u0000"), embedded?.titleEn);
  check("the section slug is the source's own filename stem", embedded?.slug === taFiles[1].replace(/^\d\d-/, "").replace(/\.md$/, ""), embedded?.slug);
  check("the slug transliterates the glossary's English form", embedded?.slug.includes(nameEn.toLowerCase()), `${embedded?.slug} vs ${nameEn.toLowerCase()}`);

  // (d) No variant of the name that the source does not print may appear anywhere in the release.
  const released = nfc(JSON.stringify({ novel, prov }));
  const variants = [...released.matchAll(/வெங்கண்ண[\u0BBE-\u0BCD]?/g)].map((m) => m[0]);
  const stray = [...new Set(variants)].filter((v) => !nfc(v).startsWith(bare.slice(0, v.length)) || !bare.startsWith(v));
  check("no variant spelling of the Tamil name appears in the released data", stray.length === 0, `unsupported form(s): ${stray.join(", ")}`);
  const sourceText = [...taFiles.map((f) => readText(path.join(TA_DIR, f))), readText(path.join(WORK_DIR, "audit.md")), readText(path.join(WORK_DIR, "metadata/source.md"))].join("\n");
  for (const v of new Set(variants)) {
    check(`the form ${v} is one the source itself prints`, sourceText.includes(v), `${v} appears in the release but nowhere in the pinned source`);
  }

  // (e) Where the glossary records a rejected alternative reading, that reading must not be used.
  // Whatever readings the glossary note marks as wrong must not appear in the release. The note's
  // wording is the source's own, so every form it names after "do not …" is collected rather than
  // matching one fixed phrasing.
  const rejectedPart = /do not[^|]*/.exec(glossNote);
  const rejected = rejectedPart ? [...rejectedPart[0].matchAll(/[`*]?([A-Za-z\u0B80-\u0BFF]{4,})[`*]?/g)].map((m) => m[1]).filter((w) => !/^(do|not|read|or|render|it|as|change|to|the|printed|final|sign|is|old|style|form|mandatory)$/i.test(w)) : [];
  check("the glossary still records which readings are wrong", rejected.length > 0, `note: ${glossNote}`);
  for (const r of new Set(rejected)) {
    check(`the glossary's rejected reading "${r}" is not used in the release`, !released.includes(r), `the source marks ${r} as wrong for \`${bare}\``);
  }
  eq("the source records the name's audited status", /Pages marked \`needs-review\` \| \*\*0\*\*/.test(readText(path.join(WORK_DIR, "audit.md"))), true);
}

// ── 4. BODY RECONSTRUCTION ───────────────────────────────────────────────────────────────────────
// Rebuild the reading body from the generated blocks and compare with the source file, with the
// source's own provenance comments and (for English) its apparatus removed. This proves text, order
// and paragraph structure — and that no comment or apparatus leaked into the body.
const SRC_MARKER = /^<!--\s*source:\s*(.+?)\s*-->$/;
const INLINE = /<!--\s*source (?:join|boundary):\s*[\s\S]*?-->/g;
const EN_NOTE = /^#{2,3}\s+(Pilot translation notes|Batch \d+ translation notes|Batch \d+ review result|Internal-sequence translation status)\s*$/;
const EN_SCAF = /^#{2,3}\s+Batch \d+\s*(—|-)\s*.+$/;

function releasedBlocks(text, english) {
  const body = text.slice(/^---\n[\s\S]*?\n---\n/.exec(text)[0].length);
  const chunks = [];
  for (const para of body.split(/\n\s*\n/)) {
    let buf = [];
    for (const line of para.split("\n")) {
      if (/^<!--[\s\S]*-->$/.test(line.trim())) { if (buf.length) { chunks.push(buf.join("\n")); buf = []; } chunks.push(line); }
      else buf.push(line);
    }
    if (buf.length) chunks.push(buf.join("\n"));
  }
  const out = [];
  let inNote = false;
  for (const raw of chunks) {
    const c = raw.replace(/^(?:[ \t]*\n)+/, "").replace(/\s+$/, "");
    const t = c.trim();
    if (!t) continue;
    const first = t.split("\n")[0];
    if (english && EN_NOTE.test(first)) { inNote = true; continue; }
    if (english && EN_SCAF.test(first)) { inNote = false; const rest = t.split("\n").slice(1).join("\n").trim(); if (!rest) continue; }
    if (inNote) { if (/^#{1,6}\s/.test(t)) inNote = false; else continue; }
    if (english && /^>\s*\*\*Translator's note:\*\*/.test(t)) continue;
    if (t === "---") continue;
    if (/^<!--[\s\S]*-->$/.test(t)) continue;
    out.push(c.replace(INLINE, "").replace(/[ \t]{2,}\n/g, "\n").replace(/[ \t]+$/gm, ""));
  }
  return out;
}

{
  let taOk = true, enOk = true;
  const bad = [];
  novel.sections.forEach((s, i) => {
    const taSrc = releasedBlocks(readText(path.join(TA_DIR, taFiles[i])), false);
    const enSrc = releasedBlocks(readText(path.join(EN_DIR, enFiles[i])), true);
    // Drop the assembled layer's own section label: Tamil by the printed-heading test above,
    // English by position, since its label is worded differently from the Tamil one.
    const taFirst = taSrc[0] ?? "";
    if (/^#{1,6}\s/.test(taFirst) && !printed.has(nfc(taFirst.replace(/^#+\s*/, "").split("\n")[0]))) {
      taSrc.shift();
      if (/^#{1,6}\s/.test(enSrc[0] ?? "")) enSrc.shift();
    }
    const taGen = s.tamil.blocks.map((b) => (b.kind === "heading" ? `${"#".repeat(b.level)} ${b.text}` : b.text));
    const enGen = s.english.blocks.map((b) => (b.kind === "heading" ? `${"#".repeat(b.level)} ${b.text}` : b.text));
    if (JSON.stringify(taGen.map(nfc)) !== JSON.stringify(taSrc.map(nfc))) { taOk = false; bad.push(`Tamil section ${s.order} (${taGen.length} vs ${taSrc.length})`); }
    if (JSON.stringify(enGen.map(nfc)) !== JSON.stringify(enSrc.map(nfc))) { enOk = false; bad.push(`English section ${s.order} (${enGen.length} vs ${enSrc.length})`); }
  });
  check("Tamil body reconstructs the assembled layer exactly", taOk, bad.filter((x) => x.startsWith("Tamil")).join("; "));
  check("English body reconstructs the released translation exactly", enOk, bad.filter((x) => x.startsWith("English")).join("; "));
}
// No omissions, no duplicated section bodies.
{
  const sig = novel.sections.map((s) => s.tamil.blocks.map((b) => b.text).join("\n"));
  eq("no duplicated Tamil section body", new Set(sig).size, 3);
  eq("no duplicated English section body", new Set(novel.sections.map((s) => s.english.blocks.map((b) => b.text).join("\n"))).size, 3);
  check("every section has both layers", novel.sections.every((s) => s.tamil.blocks.length > 0 && s.english.blocks.length > 0));
  check("block kinds are legal", novel.sections.every((s) => [...s.tamil.blocks, ...s.english.blocks].every((b) => ["paragraph", "heading", "ornament"].includes(b.kind))));
  check("every block carries source provenance", novel.sections.every((s) => [...s.tamil.blocks, ...s.english.blocks].every((b) => b.sourcePages.length > 0)));
  check("block scans stay within the body range", novel.sections.every((s) => [...s.tamil.blocks, ...s.english.blocks].every((b) => b.sourcePages.every((p) => p.scan >= 4 && p.scan <= 33))));
  eq("body scans", [novel.bodyScans.from, novel.bodyScans.to], [4, 33]);
  eq("provenance body scans", prov.source.bodyScans, "4–33");
  // A printed page number is carried only where the scan shows one.
  check("printedPage is a number or null, never inferred", novel.sections.every((s) => [...s.tamil.blocks, ...s.english.blocks].every((b) => b.sourcePages.every((p) => p.printedPage === null || Number.isInteger(p.printedPage)))));
  check("at least one block has no printed number (the source page map records `—`)", novel.sections.some((s) => s.tamil.blocks.some((b) => b.sourcePages.some((p) => p.printedPage === null))));
}

// ── 5. INTENTIONAL SOURCE LINE BREAKS ────────────────────────────────────────────────────────────
// The film credits and the closing lineated address carry hard breaks inside one block. Collapsing
// them would be the Phase-4 Poetry mistake in prose form.
{
  const withBreaks = novel.sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).filter((b) => b.hasLineBreaks);
  check("intentional source line breaks are preserved", withBreaks.length > 0);
  check("hasLineBreaks agrees with the text", novel.sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).every((b) => b.hasLineBreaks === b.text.includes("\n")));
  eq("provenance Tamil line-break blocks", prov.archiveDerived.tamilBlocksWithLineBreaks, novel.sections.reduce((n, s) => n + s.tamil.blocks.filter((b) => b.hasLineBreaks).length, 0));
  eq("provenance English line-break blocks", prov.archiveDerived.englishBlocksWithLineBreaks, novel.sections.reduce((n, s) => n + s.english.blocks.filter((b) => b.hasLineBreaks).length, 0));
  const credits = novel.sections[1].tamil.blocks.find((b) => b.text.includes("டைரக்ஷன்"));
  check("the film-credit block keeps its source line break", !!credits && credits.hasLineBreaks);
  const reader = readText(path.join(process.cwd(), "components/NovelReader.tsx"));
  check("reader renders source line breaks", reader.includes("whitespace-pre-line"));
}

// ── 6. SOURCE-ESTABLISHED JOINS — independently re-derived ───────────────────────────────────────
// The assembled layer's README lists every verified page-boundary join. Most also carry an inline
// comment; one (12→13) is a quotation continuity with no inline marker, so BOTH sources are read.
{
  const readme = readText(path.join(TA_DIR, "README.md"));
  const documented = [...readme.matchAll(/^-\s*scans\s*(\d+)\s*→\s*(\d+)\s*:/gm)].map((m) => [Number(m[1]), Number(m[2])]);
  eq("the assembled layer documents 7 verified joins", documented.length, 7);
  const generated = prov.archiveDerived.joins.map((j) => [j.fromScan, j.toScan]);
  eq("every documented join is represented", documented.every((d) => generated.some((g) => g[0] === d[0] && g[1] === d[1])), true);
  eq("no join is invented beyond the documented set", generated.every((g) => documented.some((d) => d[0] === g[0] && d[1] === g[1])), true);
  eq("join count", prov.archiveDerived.sourceEstablishedJoins, documented.length);
  check("every join carries verbatim source evidence", prov.archiveDerived.joins.every((j) => typeof j.evidence === "string" && j.evidence.length > 10));
  // The inline-only and README-only evidence must both be present somewhere.
  const inlineJoins = [];
  for (const f of taFiles) {
    for (const m of readText(path.join(TA_DIR, f)).matchAll(/<!--\s*source (?:join|boundary):\s*scan\s*(\d+)[\s\S]*?scan\s*(\d+)[\s\S]*?-->/g)) inlineJoins.push([Number(m[1]), Number(m[2])]);
  }
  eq("6 joins carry an inline marker at the join point", inlineJoins.length, 6);
  const quotationOnly = documented.filter((d) => !inlineJoins.some((i) => i[0] === d[0] && i[1] === d[1]));
  eq("the remaining documented join is the 12→13 quotation continuity", quotationOnly, [[12, 13]]);
  check("the 12→13 join cites the README, not an invented inline marker", prov.archiveDerived.joins.find((j) => j.fromScan === 12)?.evidence.includes("sections/README.md"));
  check("provenance states joins were established before assembly", prov.archiveDerived.joinNote.includes("never invents a join"));

  // Evidence KIND, re-derived from the README's own wording: a continuity the audit established by
  // reading must never be presented as a printed word split.
  const fragmentEvidence = /`[^`]+`\s*\+\s*`[^`]+`/;
  const readmeLines = Object.fromEntries([...readme.matchAll(/^-\s*scans\s*(\d+)\s*→\s*(\d+)\s*:(.*)$/gm)].map((m) => [`${m[1]}-${m[2]}`, m[3]]));
  for (const j of prov.archiveDerived.joins) {
    const expected = fragmentEvidence.test(readmeLines[`${j.fromScan}-${j.toScan}`] ?? "") ? "page-edge-fragments" : "narrative-continuity";
    eq(`join ${j.fromScan}→${j.toScan} evidence kind`, j.evidenceKind, expected);
  }
  eq("exactly one join rests on narrative continuity", prov.archiveDerived.joins.filter((j) => j.evidenceKind === "narrative-continuity").map((j) => [j.fromScan, j.toScan]), [[12, 13]]);
  check("every page-edge-fragment join is marked inline at the join point", prov.archiveDerived.joins.every((j) => j.evidenceKind !== "page-edge-fragments" || j.hasInlineMarker));
  check("the narrative continuity carries no inline marker it does not have", prov.archiveDerived.joins.every((j) => j.evidenceKind !== "narrative-continuity" || !j.hasInlineMarker));
  eq("inline-marked joins match the assembled layer", prov.archiveDerived.joins.filter((j) => j.hasInlineMarker).length, inlineJoins.length);
  check("the provenance page labels the two evidence kinds apart", /never presented as printed paragraph structure/.test(readText(path.join(process.cwd(), "components/NovelSource.tsx"))));
}

// ── 7. TRANSLATOR APPARATUS SEPARATED ────────────────────────────────────────────────────────────
{
  const notes = novel.sections.flatMap((s) => s.english.notes);
  check("translator notes are carried", notes.length > 0);
  eq("provenance records the note count", prov.archiveDerived.translatorNotes, notes.length);
  check("every section carries its translator's note", novel.sections.every((s) => s.english.notes.some((n) => /Translator's note/i.test(n.heading))));
  const body = novel.sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).map((b) => b.text).join("\n");
  for (const [label, needle] of [
    ["translator's-note label", "**Translator's note:**"],
    ["batch notes label", "translation notes"],
    ["review-result label", "review result"],
    ["release status label", "RELEASE-READY"],
    ["batch scaffolding heading", "Batch 3 — Continuation"],
    ["internal status heading", "Internal-sequence translation status"],
    ["provenance comment", "<!-- source:"],
    ["source-join comment", "source join:"],
    ["source-boundary comment", "source boundary:"],
    ["assembled-layer authority prose", "controlling archival text"],
    ["library stamp note", "library/ownership stamps"],
    ["bleed-through note", "bleed-through"],
  ]) check(`reading body excludes ${label}`, !body.includes(needle), `found ${JSON.stringify(needle)}`);
}

// ── 8. RECORDED COUNTS MATCH GENERATED DATA ─────────────────────────────────────────────────────
{
  const d = prov.archiveDerived;
  const cnt = (sel) => novel.sections.reduce((n, s) => n + sel(s), 0);
  eq("provenance sections", d.sections, novel.sections.length);
  eq("provenance Tamil blocks", d.tamilBlocks, cnt((s) => s.tamil.blocks.length));
  eq("provenance English blocks", d.englishBlocks, cnt((s) => s.english.blocks.length));
  eq("provenance Tamil paragraphs", d.tamilParagraphs, cnt((s) => s.tamil.blocks.filter((b) => b.kind === "paragraph").length));
  eq("provenance English paragraphs", d.englishParagraphs, cnt((s) => s.english.blocks.filter((b) => b.kind === "paragraph").length));
  eq("provenance Tamil headings", d.tamilHeadings, cnt((s) => s.tamil.blocks.filter((b) => b.kind === "heading").length));
  eq("provenance English headings", d.englishHeadings, cnt((s) => s.english.blocks.filter((b) => b.kind === "heading").length));
  eq("provenance ornaments", d.ornaments, cnt((s) => [...s.tamil.blocks, ...s.english.blocks].filter((b) => b.kind === "ornament").length));
  check("printed ornaments are retained", d.ornaments > 0);
  eq("English kind", prov.english.kind, "project-created");
  check("English status recorded", prov.english.status.includes("VERIFIED"));
  check("page records verified 34/34", prov.source.pageRecordsVerified.includes("34 / 34"));
  check("source audit PASSED", prov.source.sourceAudit.includes("PASSED"));
  check("assembled layer PASSED", prov.source.assembledLayer.includes("PASSED"));
}

// ── 9. RIGHTS ────────────────────────────────────────────────────────────────────────────────────
{
  const pr = prov.projectRights;
  eq("rights status", pr.rightsStatus, "nationalised-by-tamil-nadu-government");
  eq("GO number remains unverified", pr.governmentOrderNumber, null);
  eq("GO issue date remains unverified", pr.governmentOrderDate, null);
  eq("GO handover date", pr.governmentOrderHandoverDate, "2024-12-22");
  check("rights not broadened to edition/publisher/cover/printer/library matter", ["publisher", "cover", "printer", "library"].every((w) => pr.thirdPartyNote.toLowerCase().includes(w)));
  check("rights not broadened to the project translation", /not covered/i.test(pr.projectTranslationNote));
  check("RELEASE-READY is qualified as an archival, not rights, judgement", /NOT, by itself, a copyright/i.test(pr.archivalStatusNote));
}

console.log(`\n${SLUG} — ${pass} assertions passed, ${failures.length} failed`);
if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error(" ✗ " + f);
  process.exit(1);
}
console.log("ALL PASS");
