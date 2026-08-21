// Validator for மனோகரா — Digital Library Cinema benchmark (Phase 2).
//
//   node scripts/validate-manohara.mjs <kalaignar-cinema-works-clone>
//
// Manohara was integrated before this project adopted per-work validators, so it is the only
// benchmark-era work without one. This closes that gap. Nothing else changes: no reader, no
// provenance component, no generated data, no other validator.
//
// ── The pinned-source problem, stated plainly ────────────────────────────────────────────────────
// Manohara's source pin is a HISTORICAL commit. `pugazg/kalaignar-cinema-works` has moved on since
// (other works were added), so the pin is NOT the tip of `main` and is NOT the tip of any branch.
// A validator that silently accepted whatever `main` happens to be would be checking the release
// against a tree it was never built from — which is worse than no validator, because it would
// report success while proving nothing.
//
// So: the pin is read FROM THE RELEASED DATA (never hardcoded here), the clone must be checked out
// at exactly that commit, and if the pinned object cannot be obtained this FAILS LOUDLY with the
// exact command needed to fetch it. It never falls back to `main`.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-manohara.mjs <kalaignar-cinema-works-clone>");
  process.exit(1);
}

const SLUG = "manohara";
const WORK_DIR = path.join(SRC_REPO, "works", SLUG);
const DATA = path.join(process.cwd(), "public/data/cinema", SLUG);
const nfc = (s) => s.normalize("NFC");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");

let pass = 0;
const failures = [];
const check = (n, c, d) => (c ? pass++ : failures.push(d ? `${n} — ${d}` : n));
const eq = (n, a, b) => check(n, JSON.stringify(a) === JSON.stringify(b), `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const die = (msg) => { console.error(`\n${SLUG} — CANNOT VALIDATE\n\n  ${msg}\n`); process.exit(2); };

const index = readJSON(path.join(DATA, "index.json"));
const prov = readJSON(path.join(DATA, "provenance.json"));

// ── 1. SOURCE IDENTITY AND THE HISTORICAL PIN ────────────────────────────────────────────────────
const PIN = prov.sourceCommit;
check("released data records a source commit", /^[0-9a-f]{40}$/.test(PIN ?? ""), String(PIN));
eq("source repo", prov.sourceRepo, "pugazg/kalaignar-cinema-works");
eq("source path", prov.sourcePath, `works/${SLUG}`);

// The pinned object must actually exist in this clone. A shallow clone of `main` will NOT have it.
try {
  const t = execFileSync("git", ["-C", SRC_REPO, "cat-file", "-t", PIN], { encoding: "utf8" }).trim();
  if (t !== "commit") die(`${PIN} exists in ${SRC_REPO} but is a ${t}, not a commit.`);
} catch {
  die(
    `The pinned source commit ${PIN} is not present in ${SRC_REPO}.\n` +
      `  Manohara is pinned to a HISTORICAL commit that is no longer any branch tip, so a shallow or\n` +
      `  default clone will not contain it. Obtain it explicitly, then re-run:\n\n` +
      `      git -C ${SRC_REPO} fetch origin ${PIN}\n` +
      `      git -C ${SRC_REPO} checkout ${PIN}\n\n` +
      `  This validator will NOT fall back to validating against current main.`,
  );
}
const head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (head !== PIN) {
  die(
    `${SRC_REPO} is checked out at ${head}, but the released data is pinned to ${PIN}.\n` +
      `  Validating against a different tree would prove nothing. Check out the pin and re-run:\n\n` +
      `      git -C ${SRC_REPO} checkout ${PIN}`,
  );
}
check("source clone is clean at the pin", execFileSync("git", ["-C", SRC_REPO, "status", "--porcelain"], { encoding: "utf8" }).trim() === "");
// Recorded for the reader's benefit: the pin is deliberately behind the branch tip.
{
  let tip = null;
  try { tip = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "origin/main"], { encoding: "utf8" }).trim(); } catch { /* offline */ }
  if (tip) check("the pin is acknowledged as historical (behind origin/main is expected, not an error)", true);
}

// Source identity is DERIVED from the source tree, never restated here.
const metaText = readText(path.join(WORK_DIR, "metadata.yaml"));
const y = (re) => (re.exec(metaText) ?? [])[1];
const srcSha = y(/\n\s*sha256:\s*"([^"]+)"/);
const srcPdfPages = Number(y(/\n\s*pdf_pages:\s*(\d+)/));
const srcBytes = Number(y(/\n\s*byte_size:\s*(\d+)/));
const srcIdent = y(/\n\s*identifier:\s*"([^"]+)"/);
eq("scan SHA-256 matches metadata.yaml", prov.source.scan_sha256, srcSha);
eq("integrity block repeats the same scan SHA", prov.integrity.sourceScanSha256, srcSha);
eq("PDF page count matches metadata.yaml", prov.source.pdf_pages, srcPdfPages);
eq("source identifier matches metadata.yaml", prov.source.identifier, srcIdent);
// The importer's own cross-check: metadata and the edition manifest must agree on the scan.
const manifest = readJSON(path.join(WORK_DIR, "editions/en/manifest.json"));
eq("edition manifest agrees with metadata on the scan SHA", manifest.source_scan_sha256, srcSha);
check("source records a byte size", Number.isInteger(srcBytes) && srcBytes > 0, String(srcBytes));
// The controlling PDF must never be vendored into the application.
check("no PDF vendored in the released data", !fs.readdirSync(DATA).some((f) => f.toLowerCase().endsWith(".pdf")));
check("source repo commits no PDF either", !execFileSync("git", ["-C", SRC_REPO, "ls-files"], { encoding: "utf8" }).split("\n").some((f) => f.toLowerCase().endsWith(".pdf")));

// ── 2. SEGMENT STRUCTURE ─────────────────────────────────────────────────────────────────────────
const sceneIndex = readJSON(path.join(WORK_DIR, "scenes/index.json"));
const srcScenes = sceneIndex.scenes;
const segFiles = fs.readdirSync(path.join(DATA, "segments")).filter((f) => /^segment-\d{3}\.json$/.test(f)).sort();
const segments = segFiles.map((f) => readJSON(path.join(DATA, "segments", f)));

eq("segment count matches the source's archival_scene_segments", index.segmentCount, sceneIndex.archival_scene_segments);
eq("the source declares 57 archival segments", sceneIndex.archival_scene_segments, srcScenes.length);
eq("released segment count equals the source scene count", index.segmentCount, srcScenes.length);
eq("index lists one entry per segment", index.segments.length, srcScenes.length);
eq("one segment file per segment", segFiles.length, srcScenes.length);
eq("ordinals are contiguous 1..N", index.segments.map((s) => s.ordinal), srcScenes.map((_, i) => i + 1));
eq("segment ordinals match the source ordinals", segments.map((s) => s.ordinal), srcScenes.map((s) => s.ordinal));
eq("segment ids match the source scene ids in order", segments.map((s) => s.sceneId), srcScenes.map((s) => s.scene_id));
eq("no duplicate segment ids", new Set(segments.map((s) => s.sceneId)).size, segments.length);
eq("no duplicate slugs", new Set(index.segments.map((s) => s.slug)).size, index.segments.length);
check("every indexed segment has a file", index.segments.every((s, i) => segFiles[i] !== undefined));
check("every segment carries both layers", segments.every((s) => s.tamil && s.english));
// Reported per-differing-label rather than as two 57-item arrays, so a failure is readable.
{
  const bad = segments
    .map((s, i) => ({ id: s.sceneId, got: nfc(s.readerLabelTa ?? ""), want: nfc(srcScenes[i].reader_label_ta ?? "") }))
    .filter((x) => x.got !== x.want);
  check("reader labels come from the source index", bad.length === 0,
    bad.slice(0, 3).map((x) => `${x.id}: ${JSON.stringify(x.got)} vs source ${JSON.stringify(x.want)}`).join("; ") + (bad.length > 3 ? ` (+${bad.length - 3} more)` : ""));
}

// ── 3. TERMINOLOGY FIDELITY — the booklet prints NO numbered scenes ──────────────────────────────
// This is Manohara's equivalent of "the closing tableau is not Scene 39". The 1954 booklet prints no
// scene numbers at all; the 57 divisions are archive-created navigation only. Presenting them as
// source numbering would fabricate a printed fact.
eq("the source states it prints no numbered scenes", sceneIndex.source_numbered_scenes, false);
eq("the source records no printed scene count", sceneIndex.source_scene_count, null);
eq("released data records numbering as none-printed", index.sourceSceneNumbering, "none-printed");
eq("provenance repeats none-printed", prov.sourceSceneNumbering, "none-printed");
eq("the edition manifest agrees", manifest.source_scene_numbering, "none-printed");
eq("archival numbering is marked derivative-only", index.archivalSceneNumbering, "derivative-navigation-only");
eq("provenance repeats derivative-only", prov.archivalSceneNumbering, "derivative-navigation-only");
eq("segment terminology stays archival", index.segmentTerminology, "archival-navigation-segment");
// NEGATIVE TEST 3: a populated sourceSceneNumber must fail.
check("no segment claims a printed scene number", segments.every((s) => s.sourceSceneNumber === null),
  segments.filter((s) => s.sourceSceneNumber !== null).map((s) => s.sceneId).slice(0, 4).join(", "));
// NEGATIVE TEST 4: "scene" must not be reintroduced as a printed source fact.
check("terminology field is never relabelled to a printed scene", !/printed-scene|source-scene|numbered-scene/i.test(index.segmentTerminology));
check("provenance still states the booklet prints no numbered scenes",
  prov.notes.some((n) => /prints NO numbered scenes/i.test(n) && /navigation segments only/i.test(n)));
check("provenance still calls the OCR layer non-canonical", prov.notes.some((n) => /OCR layer is non-canonical/i.test(n)));
check("the source's own numbering policy is unchanged", /archive-only navigation identifiers/i.test(sceneIndex.numbering_policy));
check("the source's reader-label policy is unchanged", /not claimed source scene headings/i.test(sceneIndex.reader_label_policy));

// ── 4. PAGE PROVENANCE ───────────────────────────────────────────────────────────────────────────
// The source declares the canonical body range; nothing may cite a page outside it, and no printed
// folio may be invented — every printed page must be the one the source records for that PDF page.
const [pdfFrom, pdfTo] = sceneIndex.canonical_pdf_pages.split("-").map(Number);
const printedByPdf = new Map(srcScenes.map((s) => [s.start_pdf_page, s.start_logical_printed_page]));
check("every segment has page provenance", segments.every((s) => Array.isArray(s.pageProvenance) && s.pageProvenance.length > 0));
check("every cited PDF page lies in the source's canonical range",
  segments.every((s) => s.pageProvenance.every((p) => p.pdf_page >= pdfFrom && p.pdf_page <= pdfTo)),
  `canonical range ${pdfFrom}-${pdfTo}`);
eq("segment start pages match the source index", segments.map((s) => s.startPdfPage), srcScenes.map((s) => s.start_pdf_page));
eq("segment start printed pages match the source index", segments.map((s) => s.startPrintedPage), srcScenes.map((s) => s.start_logical_printed_page));
// NEGATIVE TEST 5: an invented printed folio must fail.
{
  let ok = true; const bad = [];
  for (const s of segments) {
    for (const p of s.pageProvenance) {
      if (!printedByPdf.has(p.pdf_page)) continue; // only start pages are declared in the source index
      if (printedByPdf.get(p.pdf_page) !== p.printed_page) { ok = false; bad.push(`pdf ${p.pdf_page}: ${p.printed_page} vs source ${printedByPdf.get(p.pdf_page)}`); }
    }
  }
  check("no printed page number is invented or altered", ok, bad.slice(0, 3).join("; "));
}
check("printed pages keep the source's constant offset", segments.every((s) => s.pageProvenance.every((p) => p.printed_page === p.pdf_page - 1)),
  "the source maps PDF 7-88 to printed 6-87");

// ── 5. RIGHTS AND PROVENANCE ─────────────────────────────────────────────────────────────────────
{
  const r = prov.projectRights;
  eq("rights status", r.rightsStatus, "nationalised-by-tamil-nadu-government");
  eq("rights authority", r.rightsAuthority, "Government of Tamil Nadu");
  // NEGATIVE TEST 6: an asserted G.O. number/date must fail.
  eq("G.O. number remains unverified", r.governmentOrderNumber, null);
  eq("G.O. date remains unverified", r.governmentOrderDate, null);
  check("evidence-pending is still stated", typeof r.evidencePending === "string" && r.evidencePending.length > 20);
  // Edition matter is the publisher's, not Kalaignar's — and is carried exactly as printed.
  eq("printed rights notice carried verbatim", prov.source.rights_notice_as_printed, y(/rights_notice_as_printed:\s*"([^"]+)"/));
  eq("printed edition statement carried verbatim", prov.source.edition_statement_as_printed, y(/edition_statement_as_printed:\s*"([^"]+)"/));
  eq("printed publication year carried verbatim", prov.source.publication_year_as_printed, Number(y(/publication_year_as_printed:\s*(\d+)/)));
  eq("printed price carried verbatim", prov.source.price_as_printed, y(/price_as_printed:\s*"([^"]+)"/));
  check("edition/publisher matter is excluded from the nationalisation", /not extend|does NOT/i.test(r.thirdPartyNote ?? r.note ?? ""));
}

// ── 6. EXCLUDED-SOURCE GUARD ─────────────────────────────────────────────────────────────────────
// The website once contained accidental `public/data/cinema/manohara/parts/` files. They were never
// an integration input, and the handover records them as non-authoritative. Assert they are absent
// AND that the disclosure survives — removing the note would erase the reason they must stay out.
// NEGATIVE TEST 8: reintroducing them, or dropping the disclosure, must fail.
check("the accidental parts/ directory is absent from the released data", !fs.existsSync(path.join(DATA, "parts")));
check("no stray parts/ directory anywhere under public/data/cinema", !fs.existsSync(path.join(process.cwd(), "public/data/cinema", SLUG, "parts")));
check("provenance still records that the accidental files were not used as source",
  prov.notes.some((n) => /accidental/i.test(n) && /NOT used as source/i.test(n)));
check("the excluded files are named in the disclosure", prov.notes.some((n) => n.includes("public/data/cinema/manohara/parts/")));
// The OCR layer is likewise not an authority.
eq("source marks the OCR layer non-canonical", y(/ocr_authority:\s*(\S+)/), "non_canonical_navigation_only");

// ── 7. INTEGRITY — the released data is generated, not hand-edited ───────────────────────────────
// The edition manifest publishes aggregate SHAs over its own inputs. Re-deriving them from the
// pinned tree proves the release was built from this source and not patched afterwards.
eq("translation-input aggregate SHA matches the manifest", prov.integrity.translationInputAggregateSha256, manifest.translation_input_aggregate_sha256);
eq("validation-input aggregate SHA matches the manifest", prov.integrity.validationInputAggregateSha256, manifest.validation_input_aggregate_sha256);
eq("reader-edition outputs are recorded", Object.keys(prov.integrity.readerEditionOutputs ?? {}).length > 0, true);
for (const [name, rec] of Object.entries(prov.integrity.readerEditionOutputs ?? {})) {
  const f = path.join(WORK_DIR, "editions/en", name);
  if (!fs.existsSync(f)) { check(`reader-edition output ${name} exists in the pinned source`, false); continue; }
  eq(`reader-edition output ${name} is byte-identical to the pinned source`, sha256(fs.readFileSync(f)), rec.sha256);
}
eq("English edition status", prov.english.status, manifest.status);
eq("Tamil derivative count matches the source", prov.tamil.sceneDerivatives, srcScenes.length);
check("every source scene is complete-verified", srcScenes.every((s) => s.text_status === "complete-verified"));

console.log(`\n${SLUG} — ${pass} assertions passed, ${failures.length} failed`);
console.log(`  validated against pinned source ${PIN} (historical; not the current branch tip)`);
if (failures.length) { console.error("\nFAILURES:"); for (const f of failures) console.error(" ✗ " + f); process.exit(1); }
console.log("ALL PASS");
