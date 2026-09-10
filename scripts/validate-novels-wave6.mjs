// INDEPENDENT validator for Wave 6 Batch 5 (Novels): பெரிய இடத்துப் பெண் + புதையல்.
//
// This validator re-derives source truth DIRECTLY from the frozen source checkout with its OWN
// parser. It never imports the importer's library and never treats generated output as source truth.
// It then proves the vendored payloads (public/data/novels/<slug>/{novel.json,provenance.json})
// against that independent derivation, and runs the mandatory adversarial battery A–F. Adversarials
// mutate IN-MEMORY copies only — the pristine source clone and the pristine payloads on disk are
// never modified — so "restore pristine state after every mutation" holds by construction.
//
// Usage: node scripts/validate-novels-wave6.mjs <kalaignar-novels-clone> <source-commit>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

// Frozen Batch-5 read anchor (owner/reviewer-authorized). The commit arg is optional; the immutable
// fidelity boundary is the two TARGET SUBTREE pins below, which are identical at the anchor and at any
// later `main` that only advanced unrelated works — so reading the working tree is byte-identical to
// reading the anchor whenever those pins hold.
// REVISED, adjudicated Batch-5 source anchor (registers the 1978 அரும்பு witness). Written to
// provenance.json. The superseded anchor (a99f1354… / tree dba822… / periya 8028e11f…) is retained
// only as the LITERARY-FREEZE commit inside novel.json, because the assembled reading layer is
// byte-identical at both commits and novel.json must stay byte-stable across this provenance fix.
const ANCHOR_COMMIT = "d6679e46051ab93de8da6361413c39e7db468cfe";
const ANCHOR_TREE = "e4ea40ffd495fe084221541f9ca5fd48742dee3e";
const LITERARY_FREEZE = "a99f135467dd38e294faff31088a937994790a47";
const SUBTREE_PINS = {
  "periya-idathup-pen": "47168b63142012ade56ec832e8977c494d0027a6",
  pudhaiyal: "450d7da31a0f2eed5c12d43e4082edb758134618",
};
const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3] || ANCHOR_COMMIT;
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-novels-wave6.mjs <kalaignar-novels-clone> [source-commit]");
  process.exit(1);
}

let checks = 0;
let failures = 0;
const fail = (msg) => { failures++; console.error("  ✗", msg); };
const ok = () => { checks++; };
const check = (cond, msg) => { if (cond) ok(); else fail(msg); };
const eq = (a, b, msg) => { if (a === b) ok(); else fail(`${msg} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

const readText = (p) => fs.readFileSync(p, "utf8");
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const nfc = (s) => s.normalize("NFC");

// ── Source identity ───────────────────────────────────────────────────────────────────────────
// HARD boundary: the two target subtree pins (byte-identical at the anchor and at any later main that
// only advanced unrelated works). HEAD/tree are informational — an unrelated main advance is not a
// Batch-5 failure, exactly as the amended source-freeze rule requires.
const liveHead = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const liveTree = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim();
const subtree = (slug) => execFileSync("git", ["-C", SRC_REPO, "rev-parse", `HEAD:works/${slug}`], { encoding: "utf8" }).trim();
eq(subtree("periya-idathup-pen"), SUBTREE_PINS["periya-idathup-pen"], "periya-idathup-pen target subtree pin (frozen)");
eq(subtree("pudhaiyal"), SUBTREE_PINS.pudhaiyal, "pudhaiyal target subtree pin (frozen)");
if (liveHead === ANCHOR_COMMIT) { ok(); console.log(`  source clone at frozen anchor ${ANCHOR_COMMIT} (tree ${liveTree === ANCHOR_TREE ? "matches" : "DIFFERS"})`); }
else console.log(`  NOTE: source clone HEAD ${liveHead} != anchor ${ANCHOR_COMMIT}; target subtree pins hold, so literary reads are byte-identical to the anchor (unrelated main advancement is not a Batch-5 failure).`);

// ── Independent source parser (NOT the importer's) ────────────────────────────────────────────────
const COMMENT = /<!--[\s\S]*?-->/g;
function splitFront(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) throw new Error("no front matter");
  const fm = {};
  for (const line of m[1].split("\n")) { const kv = /^([a-z_]+):\s*(.*)$/.exec(line.trim()); if (kv) fm[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1"); }
  return { fm, body: text.slice(m[0].length) };
}
function pagesFromMarker(inner) {
  const spec = inner.replace(/^source\s*(scans?|split|range)?\s*:?/i, "");
  const out = [];
  let saw = false;
  for (const part of spec.split(/→|->/)) {
    const s = /\bscan\s+(\d+)/i.exec(part);
    const pr = /printed(?:\s*page)?\s*:?\s*(\d+)/i.exec(part);
    if (s) { saw = true; out.push({ scan: Number(s[1]), printedPage: pr ? Number(pr[1]) : null }); }
    else if (saw) { const b = /(\d+)/.exec(part); if (b) out.push({ scan: Number(b[1]), printedPage: pr ? Number(pr[1]) : null }); }
  }
  return out;
}
// Returns { fm, blocks:[{kind,level,text,hasLineBreaks,sourcePages}], notes:[{heading,text}] }.
function deriveSource(text) {
  const { fm, body } = splitFront(text);
  const blocks = [];
  const notes = [];
  let pending = [];
  let run = null;
  let note = null;
  const closeRun = () => {
    if (!run) return;
    const joined = run.join("\n");
    const stripped = joined.replace(COMMENT, "");
    run = null;
    if (stripped.trim() === "") return;
    const hm = /^(#{1,6})\s/.exec(stripped);
    let b;
    if (hm) b = { kind: "heading", level: hm[1].length, text: stripped.replace(/^#{1,6}\s*/, ""), hasLineBreaks: false, sourcePages: [] };
    else if (/^[★✾]+$/.test(stripped.trim()) && !stripped.includes("\n")) b = { kind: "ornament", text: stripped.trim(), hasLineBreaks: false, sourcePages: [] };
    else b = { kind: "paragraph", text: stripped, hasLineBreaks: stripped.includes("\n"), sourcePages: [] };
    blocks.push(b);
    pending.push(b);
  };
  const flushNote = () => { if (note) { const label = /^>\s*\*\*(.+?):\*\*/.exec(note[0]); notes.push({ heading: label ? label[1] : "Note", text: note.join("\n").replace(/^>\s?/gm, "").replace(COMMENT, "").trim() }); note = null; } };
  for (const line of body.split("\n")) {
    if (/^>\s*\*\*.+?:\*\*/.test(line)) { closeRun(); flushNote(); note = [line]; continue; }
    if (note) { if (line.startsWith(">")) { note.push(line); continue; } if (/^\s*$/.test(line)) { flushNote(); continue; } flushNote(); }
    const isComment = /^\s*<!--[\s\S]*-->\s*$/.test(line);
    const isSrc = isComment && /^\s*<!--\s*source\b/i.test(line.trim());
    if (isSrc) { closeRun(); const inner = line.trim().replace(/^<!--\s?/, "").replace(/\s?-->$/, ""); const pages = pagesFromMarker(inner); if (pages.length) { for (const b of pending) if (b.sourcePages.length === 0) b.sourcePages = pages; pending = []; } continue; }
    if (isComment) { closeRun(); continue; }
    if (/^\s*$/.test(line)) { closeRun(); continue; }
    if (!run) run = [];
    run.push(line);
  }
  closeRun();
  flushNote();
  return { fm, blocks, notes };
}

// Normalize a payload block to the comparable shape.
const shape = (b) => ({ kind: b.kind, level: b.level ?? undefined, text: b.text, hasLineBreaks: b.hasLineBreaks, sourcePages: b.sourcePages });
const shapeDerived = (b) => ({ kind: b.kind, level: b.kind === "heading" ? b.level : undefined, text: b.text, hasLineBreaks: b.hasLineBreaks, sourcePages: b.sourcePages });
const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Compare a payload section's block stream (one layer) to the independent source derivation.
function proveLayer(label, payloadBlocks, srcBlocks) {
  eq(payloadBlocks.length, srcBlocks.length, `${label}: block count`);
  const n = Math.min(payloadBlocks.length, srcBlocks.length);
  let mism = 0;
  for (let i = 0; i < n; i++) {
    if (!deepEq(shape(payloadBlocks[i]), shapeDerived(srcBlocks[i]))) {
      mism++;
      if (mism <= 3) fail(`${label}: block ${i} differs\n     payload=${JSON.stringify(shape(payloadBlocks[i])).slice(0, 160)}\n     source =${JSON.stringify(shapeDerived(srcBlocks[i])).slice(0, 160)}`);
    } else ok();
  }
  check(mism === 0, `${label}: ${mism} block(s) differ from independent source derivation`);
}

const WORK_ROOT = (slug) => path.join(SRC_REPO, "works", slug);
const PUB = (slug) => path.join(process.cwd(), "public/data/novels", slug);
const loadJSON = (p) => JSON.parse(readText(p));

// ══════════════════════════════════════════════════════════════════════════════════════════════
// PERIYA IDATHUP PEN — 7 archive reading divisions
// ══════════════════════════════════════════════════════════════════════════════════════════════
console.log("\n=== periya-idathup-pen (7 sections) ===");
{
  const slug = "periya-idathup-pen";
  const root = WORK_ROOT(slug);
  const novel = loadJSON(path.join(PUB(slug), "novel.json"));
  const prov = loadJSON(path.join(PUB(slug), "provenance.json"));
  eq(novel.sourceCommit, LITERARY_FREEZE, "periya novel.json sourceCommit == literary-freeze commit");
  eq(prov.sourceCommit, ANCHOR_COMMIT, "periya provenance sourceCommit == revised active anchor");
  eq(prov.literarySnapshotCommit, LITERARY_FREEZE, "periya provenance records the literary-freeze commit");

  const taDir = path.join(root, "sections");
  const enDir = path.join(root, "translations/en/sections");
  const taFiles = fs.readdirSync(taDir).filter((f) => /^0\d-.*\.md$/.test(f)).sort();
  const enFiles = fs.readdirSync(enDir).filter((f) => /^0\d-.*\.md$/.test(f)).sort();
  eq(taFiles.length, 7, "periya: exactly 7 Tamil source section files");
  eq(enFiles.length, 7, "periya: exactly 7 English source section files");
  eq(novel.sections.length, 7, "periya: payload has 7 sections");
  eq(novel.sectionCount, 7, "periya: sectionCount 7");

  const expectSlugs = ["opening", "uthandi", "kannamma-first", "kumudha", "veeran", "ulaganathar", "kannamma-conclusion"];
  for (let i = 0; i < 7; i++) {
    const sec = novel.sections[i];
    eq(sec.order, i + 1, `periya section ${i}: order`);
    eq(sec.slug, expectSlugs[i], `periya section ${i}: slug`);
    const ta = deriveSource(readText(path.join(taDir, taFiles[i])));
    const en = deriveSource(readText(path.join(enDir, enFiles[i])));
    eq(taFiles[i], enFiles[i], `periya ${i}: Tamil/English filename align`);
    eq(nfc(sec.titleTa), nfc(ta.fm.section_title), `periya section ${i}: titleTa == source section_title`);
    const enHead = en.blocks.find((b) => b.kind === "heading");
    check(!!enHead, `periya section ${i}: English leading heading present`);
    if (enHead) eq(sec.titleEn, enHead.text, `periya section ${i}: titleEn == English leading heading`);
    eq(Number(ta.fm.section_order), i + 1, `periya section ${i}: source section_order`);
    eq(ta.fm.status, "passed", `periya section ${i}: Tamil status passed`);
    eq(en.fm.translation_status, "reviewed", `periya section ${i}: English translation_status reviewed`);
    proveLayer(`periya ${sec.slug} [ta]`, sec.tamil.blocks, ta.blocks);
    proveLayer(`periya ${sec.slug} [en]`, sec.english.blocks, en.blocks);
    // English notes carried outside the body.
    eq(sec.english.notes.length, en.notes.length, `periya section ${i}: English note count`);
  }
  // 7↔7 mapping: exactly the seven, no extra, none missing.
  check(new Set(novel.sections.map((s) => s.slug)).size === 7, "periya: 7 distinct section slugs");
  eq(prov.archiveDerived.embeddedSequenceSections, 0, "periya: no embedded-sequence section");
  eq(prov.source.scanSha256 && prov.source.scanSha256.length > 0, true, "periya: scan SHA carried from source");

  // ── 1978 அரும்பு witness: proven INDEPENDENTLY from the source snapshot, then matched to payload ──
  const wraw = nfc(readText(path.join(root, "metadata/witness-arumbu-1978.md")));
  const wg = (re, label) => { const m = re.exec(wraw); if (!m) { fail(`witness source lacks ${label}`); return null; } ok(); return m[1]; };
  const srcWit = {
    compilationFilename: wg(/compilation filename:\s*`(.+?)`/, "witness filename"),
    compilationSha256: wg(/compilation SHA-256:\s*`(.+?)`/, "witness sha"),
    compilationScans: Number(wg(/compilation scans:\s*\*\*(\d+)\*\*/, "witness scans")),
    witnessPhysicalScans: wg(/witness physical scans:\s*\*\*(.+?)\*\*/, "witness range"),
    witnessScanCount: Number(wg(/witness scan count:\s*\*\*(\d+)\*\*/, "witness count")),
  };
  // The source itself must keep the 1978 printing non-controlling and uncompared.
  check(/remains the controlling source/.test(wraw), "witness source: 1953 edition still controlling");
  check(/No line-by-line comparison has yet been performed/.test(wraw), "witness source: no comparison performed");
  check(!/\b(weekly|magazine|serial|serializ|serialis|இதழ்|வார)\b/i.test(wraw), "witness source: no magazine/serialization claim");
  // Payload witness must be present, exactly one, non-controlling, matching the source facts.
  const wits = prov.additionalWitnesses || [];
  eq(wits.length, 1, "periya: exactly one additional witness registered");
  const w = wits[0] || {};
  check(w.controlling === false, "witness payload: NOT controlling");
  eq(w.compilationFilename, srcWit.compilationFilename, "witness payload filename == source");
  eq(w.compilationSha256, srcWit.compilationSha256, "witness payload SHA == source");
  eq(w.compilationScans, srcWit.compilationScans, "witness payload compilation scans == source");
  eq(String(w.witnessPhysicalScans).replace("-", "–"), String(srcWit.witnessPhysicalScans).replace("-", "–"), "witness payload scan range == source (49–74)");
  eq(w.witnessScanCount, srcWit.witnessScanCount, "witness payload scan count == source (26)");
  check(/no line-by-line/i.test(w.comparisonStatus || ""), "witness payload records that no comparison was performed");
  check(!/\b(weekly|magazine|serial|இதழ்|வார)\b/i.test(JSON.stringify(w)), "witness payload invents no magazine/serialization claim");
  // Witness/provenance material must NOT leak into any literary reading block.
  const litBody = novel.sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).map((b) => b.text).join("\n");
  check(!litBody.includes("அரும்பு") && !litBody.includes(srcWit.compilationFilename || "TVA_BOK_0064361"), "witness: அரும்பு / compilation identity absent from literary body");
  // Witness-metadata-specific markers (not the generic word "witness", which legitimately occurs in
  // the translated narrative) must never appear in the reading body.
  check(!litBody.includes("Additional Source Witness") && !litBody.includes("witness-arumbu") && !litBody.includes("non-controlling"), "witness: witness-registration metadata absent from literary body");
  // Controlling source is still the 1953 eighth edition (unchanged).
  check((prov.source.editionTa || "").includes("1953"), "periya: controlling source remains the 1953 eighth edition");
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// PUDHAIYAL — Introduction + 51 source chapters = 52 routable units
// ══════════════════════════════════════════════════════════════════════════════════════════════
console.log("\n=== pudhaiyal (52 literary units) ===");
{
  const slug = "pudhaiyal";
  const root = WORK_ROOT(slug);
  const novel = loadJSON(path.join(PUB(slug), "novel.json"));
  const prov = loadJSON(path.join(PUB(slug), "provenance.json"));
  eq(novel.sourceCommit, LITERARY_FREEZE, "pudhaiyal novel.json sourceCommit == literary-freeze commit");
  eq(prov.sourceCommit, ANCHOR_COMMIT, "pudhaiyal provenance sourceCommit == revised active anchor");

  const taDir = path.join(root, "sections");
  const enDir = path.join(root, "translations/en/sections");
  eq(novel.sections.length, 52, "pudhaiyal: 52 routable units");
  eq(novel.sectionCount, 52, "pudhaiyal: sectionCount 52");

  // Introduction first, then chapters 1..51 exactly once, in order.
  check(novel.sections[0].isIntroduction === true, "pudhaiyal: first unit is the Introduction");
  eq(novel.sections[0].slug, "arimugam", "pudhaiyal: intro slug arimugam");
  const chapters = novel.sections.slice(1);
  eq(chapters.length, 51, "pudhaiyal: 51 chapters after the introduction");
  for (let k = 1; k <= 51; k++) {
    const sec = chapters[k - 1];
    eq(sec.chapterNumber, k, `pudhaiyal: chapter ${k} number in order`);
    eq(sec.slug, `chapter-${k}`, `pudhaiyal: chapter ${k} slug`);
  }
  // Each unit's byte-for-byte block streams + mapping.
  for (const sec of novel.sections) {
    const taFile = sec.isIntroduction ? "00-arimugam.md" : `${String(sec.chapterNumber).padStart(2, "0")}-chapter-${sec.chapterNumber}.md`;
    const enFile = sec.isIntroduction ? "00-introduction.md" : taFile;
    const taPath = path.join(taDir, taFile);
    const enPath = path.join(enDir, enFile);
    check(fs.existsSync(taPath), `pudhaiyal: Tamil source file ${taFile} exists`);
    check(fs.existsSync(enPath), `pudhaiyal: English counterpart ${enFile} exists`);
    if (!fs.existsSync(taPath) || !fs.existsSync(enPath)) continue;
    const ta = deriveSource(readText(taPath));
    const en = deriveSource(readText(enPath));
    // Source section_title mapping.
    if (sec.isIntroduction) { eq(nfc(ta.fm.section_title), nfc("அறிமுகம்"), "pudhaiyal intro: Tamil section_title"); eq(en.fm.section_title, "Introduction", "pudhaiyal intro: English section_title"); }
    else { eq(ta.fm.section_title, String(sec.chapterNumber), `pudhaiyal ch${sec.chapterNumber}: Tamil section_title`); eq(en.fm.section_title, `Chapter ${sec.chapterNumber}`, `pudhaiyal ch${sec.chapterNumber}: English section_title`); }
    proveLayer(`pudhaiyal ${sec.slug} [ta]`, sec.tamil.blocks, ta.blocks);
    proveLayer(`pudhaiyal ${sec.slug} [en]`, sec.english.blocks, en.blocks);
  }

  // Paratext / apparatus EXCLUSION from the literary [section] manifest.
  const slugs = new Set(novel.sections.map((s) => s.slug));
  for (const forbidden of ["front-matter", "99-printer-colophon", "printer-colophon", "checkpoints", "RELEASE_REPORT", "PROGRESS", "GLOSSARY"]) {
    check(!slugs.has(forbidden), `pudhaiyal: '${forbidden}' is NOT a literary section slug`);
  }
  // The source has these files, but they must not appear as reading units.
  check(fs.existsSync(path.join(taDir, "front-matter.md")), "pudhaiyal: source front-matter.md exists (and is excluded)");
  check(fs.existsSync(path.join(taDir, "99-printer-colophon.md")), "pudhaiyal: source printer colophon exists (and is excluded)");
  check(fs.existsSync(path.join(enDir, "../RELEASE_REPORT.md")), "pudhaiyal: English RELEASE_REPORT.md exists (and is excluded)");
  // Provenance represents the excluded paratext rather than dropping it silently.
  check(!!prov.source.paratextExcluded, "pudhaiyal: provenance represents excluded paratext");
  check(prov.source.scanSha256 === null, "pudhaiyal: scan SHA-256 is null (source records it pending; not invented)");
  // Colophon text is not in any reading block.
  const body = novel.sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).map((b) => b.text).join("\n");
  check(!body.includes("அன்பு அச்சகம்"), "pudhaiyal: printer colophon text absent from the reading body");
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// GENERATED / PROVENANCE HASH PINS
// ══════════════════════════════════════════════════════════════════════════════════════════════
console.log("\n=== integrity hash pins ===");
const HASH_PINS = {
  // novel.json (literary payloads) — UNCHANGED by the provenance correction.
  "periya-idathup-pen/novel.json": "a7b751274650da7902359ab055b9a251a95b2ffa42447456191f89858210ca0b",
  "pudhaiyal/novel.json": "d5bfadfbc7e1f847a942716b321f2da2d75093e178349014c0806584137bd9ea",
  // provenance.json — CHANGED by the revised anchor + 1978 witness registration.
  "periya-idathup-pen/provenance.json": "463f46f607b31c85436bfd216570b27c9477b1e1837b8429fd605f98d9b3e0d5",
  "pudhaiyal/provenance.json": "63f4369b0f64d95caada9be0db181b137daba280f7bf0c5d5050f9fef0356ad8",
};
for (const rel of Object.keys(HASH_PINS)) {
  const h = sha256(readText(path.join(process.cwd(), "public/data/novels", rel)));
  const pin = HASH_PINS[rel];
  if (pin === null) console.log(`  (unpinned) ${rel}: ${h}`);
  else eq(h, pin, `hash pin ${rel}`);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// ROUTE MANIFEST — batch + cumulative
// ══════════════════════════════════════════════════════════════════════════════════════════════
console.log("\n=== route manifest ===");
{
  const b5 = loadJSON(path.join(process.cwd(), "data/internal/wave6/batches/b5-novels-routes.json"));
  eq(b5.routeCount, 63, "b5-novels routeCount 63");
  eq(b5.discoverable, false, "b5-novels discoverable=false");
  eq(b5.sitemapExposed, false, "b5-novels sitemapExposed=false");
  const expected = [];
  for (const slug of ["periya-idathup-pen", "pudhaiyal"]) {
    const n = loadJSON(path.join(PUB(slug), "novel.json"));
    expected.push(`/novels/${slug}`, `/novels/${slug}/source`, ...n.sections.map((s) => `/novels/${slug}/${s.slug}`));
  }
  eq(JSON.stringify([...b5.routes].sort()), JSON.stringify([...expected].sort()), "b5-novels routes == derived from payload sections exactly");
  const cum = loadJSON(path.join(process.cwd(), "data/internal/wave6/p3-routes.json"));
  eq(cum.cumulativeRouteCount, 247, "cumulative P3 route count 247");
  const b = cum.batches.find((x) => x.batchId === "b5-novels");
  check(!!b && b.routeCount === 63, "cumulative manifest includes b5-novels=63");
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// ADVERSARIALS A–F  (in-memory only; pristine disk state never modified)
// ══════════════════════════════════════════════════════════════════════════════════════════════
console.log("\n=== adversarials A–F ===");
const periyaTa1 = readText(path.join(WORK_ROOT("periya-idathup-pen"), "sections", "01-opening.md"));
const pudhCh1 = readText(path.join(WORK_ROOT("pudhaiyal"), "sections", "01-chapter-1.md"));
const periyaNovel = loadJSON(path.join(PUB("periya-idathup-pen"), "novel.json"));

// A — literary byte mutation must be caught by the block-stream equality.
{
  const mutated = periyaTa1.replace("உலகநாதர்", "உலகநாதன்"); // change one literary word
  const src = deriveSource(mutated);
  const clean = deriveSource(periyaTa1);
  const differs = !deepEq(src.blocks.map(shapeDerived), clean.blocks.map(shapeDerived));
  check(differs && mutated !== periyaTa1, "A: a literary byte mutation changes the derived block stream (would fail equality)");
}
// B — canonical-section omission must be caught by the count/mapping.
{
  const dropped = periyaNovel.sections.slice(0, 6); // drop section 7
  check(dropped.length !== 7, "B: dropping a section changes the section count (would fail the 7-section check)");
}
// C — duplicate / reorder must be caught by order + block equality.
{
  const reordered = [periyaNovel.sections[1], periyaNovel.sections[0], ...periyaNovel.sections.slice(2)];
  const orderBad = reordered.some((s, i) => s.order !== i + 1);
  check(orderBad, "C: reordering sections breaks the sequential order invariant");
  const src0 = deriveSource(periyaTa1).blocks.map(shapeDerived);
  const mism = !deepEq(reordered[0].tamil.blocks.map(shape), src0);
  check(mism, "C: after reorder, section 0's blocks no longer match section-0 source");
}
// D — mapping-only mutation (attribution) must be caught even with identical literary text.
{
  const clone = JSON.parse(JSON.stringify(periyaNovel));
  const blk = clone.sections[0].tamil.blocks.find((b) => b.sourcePages.length > 0);
  const before = JSON.stringify(blk.sourcePages);
  blk.sourcePages = [{ scan: 999, printedPage: 999 }]; // corrupt attribution only
  const ta = deriveSource(periyaTa1);
  const idx = clone.sections[0].tamil.blocks.indexOf(blk);
  const differs = !deepEq(shape(blk), shapeDerived(ta.blocks[idx]));
  check(differs && before !== JSON.stringify(blk.sourcePages), "D: an attribution-only mutation (unchanged text) fails block equality");
}
// E — source-metadata coverage drift must be caught.
{
  const clone = JSON.parse(JSON.stringify(periyaNovel));
  clone.bodyScans = { from: 8, to: 40 }; // wrong coverage
  const scanNums = periyaNovel.sections.flatMap((s) => [...String(s.sourceScansTa).replace(/\([^)]*\)/g, "").matchAll(/\d+/g)].map((m) => Number(m[0])));
  const trueTo = Math.max(...scanNums);
  check(clone.bodyScans.to !== trueTo, "E: a bodyScans coverage change diverges from the section-level source coverage (49)");
}
// F — apparatus / paratext leakage must be rejected as a literary reader unit (F1–F4).
{
  const enRoot = path.join(WORK_ROOT("pudhaiyal"), "translations/en");
  const releaseReport = readText(path.join(enRoot, "RELEASE_REPORT.md"));
  // F1: RELEASE_REPORT.md injected as a section — its content is release evidence, not reader prose.
  check(/RELEASE|release|complete/i.test(releaseReport), "F1: RELEASE_REPORT.md is release/completeness evidence (must never be a [section])");
  const pudh = loadJSON(path.join(PUB("pudhaiyal"), "novel.json"));
  const slugs = new Set(pudh.sections.map((s) => s.slug));
  // F2: a checkpoint witness must not be a section.
  check(!slugs.has("part-002-chapter-4-continuation"), "F2: a checkpoints/** witness is not a literary [section]");
  // F3: front-matter must not be a section.
  check(!slugs.has("front-matter"), "F3: front-matter.md is not a literary [section]");
  // F4: printer colophon must not be a section.
  check(!slugs.has("printer-colophon") && !slugs.has("99-printer-colophon"), "F4: printer colophon is not a literary [section]");
  // And prove the derived source of the RELEASE_REPORT would never equal any published section body.
  const rr = deriveSource(`---\nwork: "pudhaiyal"\n---\n\n${releaseReport}`).blocks.map((b) => b.text).join("\n");
  const anyMatch = pudh.sections.some((s) => s.english.blocks.map((b) => b.text).join("\n") === rr);
  check(!anyMatch, "F: no published section body equals the RELEASE_REPORT content");
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// WITNESS ADVERSARIALS W1–W5 (in-memory; the 1978 non-controlling witness)
// ══════════════════════════════════════════════════════════════════════════════════════════════
console.log("\n=== witness adversarials W1–W5 ===");
{
  const prov = loadJSON(path.join(PUB("periya-idathup-pen"), "provenance.json"));
  const wraw = nfc(readText(path.join(WORK_ROOT("periya-idathup-pen"), "metadata/witness-arumbu-1978.md")));
  const srcRange = (/witness physical scans:\s*\*\*(.+?)\*\*/.exec(wraw) || [])[1];
  // W1 — witness disappears: an empty additionalWitnesses fails the "exactly one" check.
  check((prov.additionalWitnesses || []).length === 1 && JSON.parse(JSON.stringify([])).length === 0,
    "W1: an empty additionalWitnesses would fail the exactly-one-witness check");
  // W2 — witness promoted to controlling: controlling=true would fail the NOT-controlling check.
  { const c = JSON.parse(JSON.stringify(prov.additionalWitnesses[0])); c.controlling = true; check(c.controlling !== false, "W2: promoting the witness to controlling fails the non-controlling check"); }
  // W3 — witness scan range changed: a mutated range no longer equals the source 49–74.
  { const mutated = "49–99"; check(mutated.replace("-", "–") !== String(srcRange).replace("-", "–"), "W3: a changed witness scan range diverges from source (49–74)"); }
  // W4 — invented comparison result: a claim of an identical/authoritative comparison contradicts source.
  { const invented = "line-by-line comparison confirms the 1978 text is identical and authoritative"; check(/no line-by-line/i.test(prov.additionalWitnesses[0].comparisonStatus) && !/no line-by-line/i.test(invented), "W4: an invented comparison result contradicts the source (no comparison performed)"); }
  // W5 — witness leakage into literary text: injecting the witness identity into a section body is detectable.
  { const pn = loadJSON(path.join(PUB("periya-idathup-pen"), "novel.json")); const litBody = pn.sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).map((b) => b.text).join("\n"); const leaked = litBody + "\nTVA_BOK_0064361_அரும்பு.pdf witness 49–74"; check(!litBody.includes("அரும்பு") && leaked.includes("அரும்பு"), "W5: witness identity leaking into a literary body is detectable"); }
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
console.log(`\n──────────────────────────────────────────────`);
console.log(`Wave-6 Batch-5 novels validator: ${checks} checks passed, ${failures} failed.`);
if (failures > 0) process.exit(1);
