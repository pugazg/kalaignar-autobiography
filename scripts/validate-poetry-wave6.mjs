// Wave 6 P1–P3 Batch 4 (Poetry) — dedicated INDEPENDENT source/provenance validator.
//
//   node scripts/validate-poetry-wave6.mjs <kalaignar-poems-clone>
//
// This validator derives source truth on its OWN code path: it never imports or calls the importer
// (scripts/lib/standalone-poem.mjs, scripts/lib/poetry-publication.mjs) or its source-dialect adapters.
// It re-pins every work tree, re-reads the source identities, and reconstructs the reading text of each
// work straight from the raw released source files, requiring it to equal — LINE FOR LINE, byte for
// byte — the reading text reconstructed from the generated JSON payload (S===G), for both Tamil and
// English. It also proves the Batch-4 structural facts: the eight frozen subtree pins; the six
// standalone poems; the 1975 publication's real source ordinals [1,2,4] with intake-03 (scan 66)
// excluded as the non-Kalaignar Rajaji poem and its items still poems; the oruthalaik-kathal verse-
// novel's eleven SECTIONS (not poems) with 95/95 main-work coverage (84 text + 11 illustration); the
// narrowly-scoped, source-declared heading-level equivalence; and zero new witness relations.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

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
const STANDALONE = ["thalaikettan-thambi", "aanthaiyum-arasanum", "poomudi", "anna-kaviyarangam", "gunanayagar-nehru", "kanchithan-annan"];
const PUB_POEMS = "kalaignarin-kaviyaranga-kavithaigal-1975";
const PUB_SECTIONS = "oruthalaik-kathal";

// ── INDEPENDENT source reading-text reconstruction ─────────────────────────────────────────────────
// Strips only structural scaffolding (front matter, HTML comments incl. scan markers, ```text fences,
// blank lines) and, from the head, the exact title/attribution lines named in `stripHead`. A Markdown
// heading keeps its TEXT (the `#`s removed) — that is exactly how the payload stores a source heading,
// and a plain source-heading line (anna's handoff lines) keeps its text unchanged; either way only the
// literary text is compared. Nothing is normalised. `dropRun` removes the item title where it sits in
// the head after a printed date line (the 1975 publication).
function srcReadingLines(raw, { stripHead = [], dropRun = null } = {}) {
  let text = raw.replace(/^---\n[\s\S]*?\n---\n?/, "");
  let lines = text.split("\n");
  if (dropRun && dropRun.length) {
    const norm = (s) => s.replace(/\s+$/, "");
    const want = dropRun.map(norm);
    for (let i = 0; i + want.length <= lines.length; i++) {
      let hit = true;
      for (let k = 0; k < want.length; k++) if (norm(lines[i + k]) !== want[k]) { hit = false; break; }
      if (hit) { lines.splice(i, want.length); break; }
    }
  }
  const out = [];
  const headLeft = [...stripHead];
  let started = false;
  for (const rawLine of lines) {
    const t = rawLine.trim();
    if (/^<!--/.test(t)) continue;      // HTML comment / scan marker
    if (/^```/.test(t)) continue;       // fenced code block delimiter
    if (t === "") continue;             // blank
    const hm = /^(#{1,6})\s+(.*\S)\s*$/.exec(t);
    const content = hm ? hm[2] : rawLine.replace(/\s+$/, "");
    // Strip exact leading title/attribution lines (the head), in order, before verse begins.
    if (!started && headLeft.length && content === headLeft[0]) { headLeft.shift(); continue; }
    started = true;
    out.push(content);
  }
  return out;
}
// Reading text reconstructed FROM THE GENERATED PAYLOAD (line indent restored; heading text as stored).
function genReadingLines(layer) {
  return layer.elements
    .filter((e) => e.kind === "line" || e.kind === "source-heading")
    .map((e) => (e.kind === "line" ? " ".repeat(e.indent || 0) + e.text : e.text));
}
const APPARATUS = ["REVIEWED", "batch-reviewed", "translation_status", "voice_policy", "Translator notes", "Batch-stage closure", "Source-sensitive decisions"];

// ── 0. TREE PINS ─────────────────────────────────────────────────────────────────────────────────
eq(rev("HEAD"), SRC_COMMIT, "source clone HEAD == frozen Batch-4 source commit");
eq(rev(`${SRC_COMMIT}:poems`), POEMS_TREE, "poems/ tree == frozen");
for (const slug of Object.keys(SUBTREE)) eq(rev(`${SRC_COMMIT}:poems/${slug}`), SUBTREE[slug], `${slug}: work subtree == frozen pin`);

// ── source identity (re-read metadata) ─────────────────────────────────────────────────────────────
function checkIdentity(slug, prov) {
  const meta = readSrc(`poems/${slug}/metadata/source.md`);
  ok(meta.includes(prov.source.scanFilename), `${slug}: metadata records the payload scan filename`);
  ok(meta.includes(prov.source.scanSha256), `${slug}: metadata records the payload scan SHA-256`);
  eq(prov.sourceCommit, SRC_COMMIT, `${slug}: provenance sourceCommit == consumed commit`);
}

// ── 1. STANDALONE POEMS ────────────────────────────────────────────────────────────────────────────
for (const slug of STANDALONE) {
  const poem = readOut(slug, "poem.json");
  const prov = readOut(slug, "provenance.json");
  eq(poem.readerStructure, "poem", `${slug}: readerStructure poem`);
  eq(poem.subtype, "poem", `${slug}: subtype poem`);
  checkIdentity(slug, prov);
  // Independent S===G. Tamil from the section file; English from the RELEASED assembly (-en.md) — a
  // different artifact than the reviewed section the importer consumed. The title (and any printed
  // author line the payload excludes) is stripped from the head by exact match.
  const taFile = slug === "anna-kaviyarangam" ? `poems/${slug}/sections/anna-kaviyarangam.md` : `poems/${slug}/sections/01.md`;
  const enFile = `poems/${slug}/translations/en/${slug}-en.md`;
  const genTa = genReadingLines(poem.tamil);
  const genEn = genReadingLines(poem.english);
  // Head lines to strip = the source title/attribution lines that the payload does NOT carry, taken
  // as the difference between the raw head and the first generated reading line.
  const srcTa = srcReadingLines(readSrc(taFile), { stripHead: headStrip(readSrc(taFile), genTa[0]) });
  const srcEn = srcReadingLines(readSrc(enFile), { stripHead: headStrip(readSrc(enFile), genEn[0]) });
  eq(genTa, srcTa, `${slug}: Tamil source→generated reading text byte-identical (S===G)`);
  eq(genEn, srcEn, `${slug}: English source→generated reading text byte-identical (S===G)`);
  ok(genTa.length > 0 && genEn.length > 0, `${slug}: non-empty reading text both layers`);
  for (const ap of APPARATUS) ok(!genTa.concat(genEn).some((l) => l.includes(ap)), `${slug}: no apparatus phrase "${ap}" in reading text`);
  // No unsupported metadata: publicationYear is null OR the metadata states it.
  if (poem.publicationYear !== null) ok(readSrc(`poems/${slug}/metadata/source.md`).includes(String(poem.publicationYear)), `${slug}: publicationYear ${poem.publicationYear} is source-stated`);
}

// Compute the exact head lines (title/attribution) the payload dropped: raw head reading lines up to
// (but excluding) the first generated line. Independent of the importer's dropLeadingLines.
function headStrip(raw, firstGen) {
  const all = srcReadingLines(raw, {}); // no stripping
  const idx = all.indexOf(firstGen);
  return idx > 0 ? all.slice(0, idx) : [];
}

// ── 2. 1975 PUBLICATION (poems; ordinals [1,2,4]; scan 66 = Rajaji excluded) ───────────────────────
{
  const slug = PUB_POEMS;
  const pub = readOut(slug, "publication.json");
  const prov = readOut(slug, "provenance.json");
  eq(pub.readerStructure, "poetry-publication", `${slug}: poetry-publication`);
  ok(pub.readingUnitKind === undefined || pub.readingUnitKind === "poem", `${slug}: reading units are poems (not sections)`);
  eq(prov.sourceTree, SUBTREE[slug], `${slug}: provenance sourceTree == frozen subtree`);
  checkIdentity(slug, prov);
  eq(pub.items.map((i) => i.ordinal), [1, 2, 4], `${slug}: source ordinals exactly [1,2,4] (no invented 03)`);
  // Intake-03 / scan 66 is the non-Kalaignar Rajaji poem, excluded — proved from the source page record.
  const rec66 = readSrc(`poems/${slug}/pages/0066.md`);
  ok(/section:\s*"non-kalaignar-rajaji/i.test(rec66), `${slug}: scan-66 page record marks the non-Kalaignar Rajaji context`);
  ok(!pub.items.some((i) => i.physicalScans.some((r) => 66 >= r.first && 66 <= r.last)), `${slug}: scan 66 is not inside any Kalaignar item's scans`);
  // Independent S===G per item.
  for (const it of pub.items) {
    const nn = String(it.ordinal).padStart(2, "0");
    const genTa = genReadingLines(it.tamil), genEn = genReadingLines(it.english);
    const taRaw = readSrc(`poems/${slug}/sections/${nn}.md`);
    const enRaw = readSrc(`poems/${slug}/translations/en/sections/${nn}.md`);
    // The item title is a source-heading run at the head; strip it independently (exact title lines).
    const titleTa = it.titleTa.split(" / ");
    const titleEn = it.titleEn.split(" / ");
    eq(genTa, srcReadingLines(taRaw, { dropRun: titleTa }), `${slug} item ${it.ordinal}: Tamil S===G`);
    eq(genEn, srcReadingLines(enRaw, { stripHead: titleEn }), `${slug} item ${it.ordinal}: English S===G`);
  }
}

// ── 3. oruthalaik-kathal (verse-novel; 11 SECTIONS; 95/95 = 84 text + 11 illustration) ─────────────
{
  const slug = PUB_SECTIONS;
  const pub = readOut(slug, "publication.json");
  const prov = readOut(slug, "provenance.json");
  eq(pub.readingUnitKind, "section", `${slug}: readingUnitKind "section" (verse-novel; NOT poems)`);
  ok(pub.workForm && /நாவல்|verse-novel/i.test(pub.workForm.en + pub.workForm.ta), `${slug}: workForm records the verse-novel form`);
  eq(pub.items.length, 11, `${slug}: exactly 11 sections`);
  eq(pub.items.map((i) => i.ordinal), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], `${slug}: section ordinals 1..11 in order`);
  eq(prov.sourceTree, SUBTREE[slug], `${slug}: provenance sourceTree == frozen subtree`);
  checkIdentity(slug, prov);
  // Coverage: union of all sections' physical scans == 6..100 (95), each exactly once.
  const scanCounts = new Map();
  for (const it of pub.items) for (const r of it.physicalScans) for (let s = r.first; s <= r.last; s++) scanCounts.set(s, (scanCounts.get(s) || 0) + 1);
  const allScans = [...scanCounts.keys()].sort((a, b) => a - b);
  eq(allScans, Array.from({ length: 95 }, (_, i) => 6 + i), `${slug}: main-work scans == 6..100 (95/95)`);
  ok([...scanCounts.values()].every((c) => c === 1), `${slug}: every main-work scan accounted exactly once`);
  const ILLUS = [8, 16, 22, 32, 40, 48, 58, 66, 76, 84, 94];
  // Text-bearing scans = scans that carry a Tamil verse line; illustration scans carry none.
  const textScans = new Set();
  for (const it of pub.items) for (const e of it.tamil.elements) if (e.kind === "line") textScans.add(e.sourceScan);
  eq(textScans.size, 84, `${slug}: 84 text-bearing scans`);
  for (const s of ILLUS) ok(!textScans.has(s), `${slug}: illustration scan ${s} carries no fabricated verse line`);
  eq(ILLUS.filter((s) => allScans.includes(s)).length, 11, `${slug}: all 11 illustration scans accounted in coverage`);
  // Independent S===G per section (Tamil section H1 + English section H1 stripped as the section title).
  for (const it of pub.items) {
    const nn = String(it.ordinal).padStart(2, "0");
    const genTa = genReadingLines(it.tamil), genEn = genReadingLines(it.english);
    const taRaw = readSrc(`poems/${slug}/sections/${nn}.md`);
    const enRaw = readSrc(`poems/${slug}/translations/en/sections/${nn}.md`);
    eq(genTa, srcReadingLines(taRaw, { stripHead: [it.titleTa] }), `${slug} section ${it.ordinal}: Tamil S===G`);
    eq(genEn, srcReadingLines(enRaw, { stripHead: [it.titleEn] }), `${slug} section ${it.ordinal}: English S===G`);
  }
  // Heading-level equivalence is narrow + source-declared: the work-title reprint "One-Sided Love"
  // appears at `##` in the reviewed section and `###` in the released assembly. Prove it here on the
  // raw artifacts (independent of the importer's adapter).
  const sec1 = readSrc(`poems/${slug}/translations/en/sections/01.md`);
  const asm = readSrc(`poems/${slug}/translations/en/${slug}-en.md`);
  ok(/^##\s+One-Sided Love\s*$/m.test(sec1), `${slug}: reviewed section reprints the work title at "## One-Sided Love"`);
  ok(/^###\s+One-Sided Love\s*$/m.test(asm), `${slug}: released assembly reprints the work title at "### One-Sided Love"`);
}

// ── 4. WITNESS RELATIONS — zero new; existing two preserved ─────────────────────────────────────────
{
  const poemsTs = fs.readFileSync("data/poems.ts", "utf8");
  const ids = [...poemsTs.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  eq(ids.sort(), ["idhayathai-thanthidu-anna--kalaignarin-kavithaigal--item-01", "thennan-kathai--kalaignarin-kavithaigal--item-02"].sort(),
    "POETRY_WITNESS_RELATIONS: exactly the two frozen Wave-4 relations; zero new Batch-4 relations");
  // The relation block references only the two Wave-4 endpoints; no Batch-4 work appears as an endpoint.
  const relBlock = (poemsTs.match(/POETRY_WITNESS_RELATIONS[\s\S]*?\n\];/) || [""])[0];
  for (const slug of Object.keys(SUBTREE)) ok(!relBlock.includes(`slug: "${slug}"`), `no witness relation references Batch-4 work ${slug}`);
}

if (failures.length) {
  console.error(`\nvalidate-poetry-wave6 — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nvalidate-poetry-wave6 — ${checks} checks, 0 failed`);
console.log("  8 works · 8 subtree pins · independent S===G (Tamil & English) · 1975 ordinals [1,2,4] + scan-66 Rajaji excluded · oruthalaik 11 sections 95/95 (84 text + 11 illustration) · 0 new witness relations");
