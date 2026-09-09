// Independent fidelity + semantic validator for the Wave 6 Batch 2 Drama works.
//
//   node scripts/validate-drama-wave6.mjs <kalaignar-stage-plays-clone> [source-commit]
//
// This is the Ammaiyappan-strength gate for the Drama family. It NEVER calls the importer. It:
//   * fails closed on the source commit AND each work's frozen subtree tree;
//   * pins each generated play.json / provenance.json by SHA-256, and each scan by SHA-256;
//   * INDEPENDENTLY re-derives every reading unit's Tamil and English reading text straight from the
//     raw source Markdown (a different code path from the importer) and requires it to equal — BYTE
//     FOR BYTE — the reading text reconstructed from the generated play.json. Any NFC/NFD change,
//     whitespace collapse, punctuation edit, dropped/added/re-ordered unit, or fabricated string makes
//     S ≠ G and fails the gate. This proves source→generated textual equality with NO normalization;
//   * proves each work's archival safeguards (no invented Scene 22/23; compressed range; unnumbered
//     `காட்சி`; 47 numbered scenes; 7 editorial SRUs; the `உதயசூரியன் கோலம்` intertitle preserved and
//     not promoted; no invented `முற்றும்`; source-condition holds carried verbatim; the 1962 Madurai
//     claim recorded as user context and never promoted into the reading body or as a source fact).

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3]; // optional; when given it must equal the frozen pin
if (!SRC_REPO) { console.error("usage: node scripts/validate-drama-wave6.mjs <stage-plays-clone> [source-commit]"); process.exit(1); }

const root = process.cwd();
let checks = 0; const failures = [];
const ok = (c, l) => { checks++; if (!c) failures.push(l); };
const eq = (a, b, l) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const sha256File = (p) => createHash("sha256").update(fs.readFileSync(p)).digest("hex");

// ── FROZEN PINS ────────────────────────────────────────────────────────────────────────────────
const FROZEN_SOURCE_COMMIT = "61c0f410fd24b1419779532a4a1b049cdff10bf7";
const WORKS = {
  kagithapoo: {
    subtree: "ac924511710eb07df1dac748f3718505b4465714",
    scanSha: "b0a6499ba072a7346f8c2544a8a61c2363d83a60cad5227482008043cd310ec1",
    playSha: "1c0e1ace5a33be990b844360c1e495a266aa22620adbe3c60d32a8dfb341f3a3",
    provSha: "637318aa581d41dc67890343574e4a0ce2c910772ec20be3a37f358b3b49b8c7",
    titleFrom: "first-heading", structureKind: "scene-sequence", readingUnits: 23,
  },
  manimagudam: {
    subtree: "e38f31d4bbd76bfb04f9b73efd889e5987a406b0",
    scanSha: "a629509c3404fcc5c2844f5b693e72a41aca03ad2e2494588807af4ff8f16f3b",
    playSha: "c5eb54b39f7422e6ddd738441c0ed7027f98340104be41088c18bf5c5e08453b",
    provSha: "3bcc5b9cc01fcc7df9b6581745d47466d33f75056c3943952f717e1897366389",
    titleFrom: "first-heading", structureKind: "scene-sequence", readingUnits: 47,
  },
  "thiruvalar-desiyampillai": {
    subtree: "368cd37e6469b6ea94099cff7c065dfd293935af",
    scanSha: "b336bbebb326803badecbaa93de4ca4d63d80f68137fe70673b07a884c4910eb",
    playSha: "9d791c755448405e6b3042bc29b53bd49a465ac0d7a3fe0cbaea7465594261da",
    provSha: "d41c1347b8d2926d841ecc2d8221b8b72fa6366bf0cc06a6a003828a118108bf",
    titleFrom: "editorial-label", structureKind: "editorial-sru-sequence", readingUnits: 7,
  },
};

// ── FAIL-CLOSED SOURCE PIN ─────────────────────────────────────────────────────────────────────
let head;
try { head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
catch (e) { console.error(`unable to read source clone HEAD: ${e.message}`); process.exit(1); }
// CI fetches this source BY the SHA recorded in each work's provenance (the frozen pin), so the clone
// HEAD is that pin. The per-work subtree-tree pins below are the real guard: they stay identical even
// if the clone is at a later main advanced for unrelated works.
eq(head, FROZEN_SOURCE_COMMIT, "source clone HEAD == frozen source commit");
if (SRC_COMMIT) eq(SRC_COMMIT, FROZEN_SOURCE_COMMIT, "supplied source-commit argument == frozen pin");

// ── INDEPENDENT READING-TEXT DERIVATIONS (a different code path from the importer) ───────────────
// Source side: strip front matter, cut at the FIRST apparatus heading, drop HTML-comment paragraphs,
// strip heading `#` markers (keep the heading text), and join the remaining paragraphs with a blank
// line. This is the raw reading text, untouched but for structural Markdown.
function sourceReadingText(text, { english }) {
  const b = text.replace(/^---\n[\s\S]*?\n---\n/, "");
  const paras = b.split("\n\n").map((x) => x.replace(/\s+$/, "")).filter((x) => x.trim());
  const out = [];
  for (const p of paras) {
    const t = p.trim();
    const h = /^(#{1,6})\s+(.+)$/.exec(t);
    if (h) {
      const ht = h[2].replace(/\s+$/, "").trim();
      if ((english && ht === "Translation notes") || (!english && /^Assembly\b/.test(ht))) break;
      out.push(h[2].replace(/\s+$/, ""));
      continue;
    }
    if (/^<!--[\s\S]*-->$/.test(t)) continue;
    out.push(p);
  }
  return out.join("\n\n");
}
// Generated side: rebuild the reading text from the play.json units alone. A dialogue unit re-prepends
// its printed speaker label + separator, so the reconstruction reproduces the original paragraph.
function generatedReadingText(unit, layer, titleText) {
  const parts = [];
  if (titleText != null) parts.push(titleText);
  for (const u of unit[layer].units) {
    if (u.kind === "dialogue") parts.push((u.speakerAsPrinted !== null ? u.speakerAsPrinted + (u.speakerSeparator ?? "") : "") + u.text);
    else parts.push(u.text);
  }
  return parts.join("\n\n");
}

for (const [slug, W] of Object.entries(WORKS)) {
  // Per-work subtree freeze — live source main may advance for unrelated works; the work's tree cannot.
  let subtree;
  try { subtree = execFileSync("git", ["-C", SRC_REPO, "rev-parse", `HEAD:works/${slug}`], { encoding: "utf8" }).trim(); } catch { subtree = "(missing)"; }
  eq(subtree, W.subtree, `${slug}: frozen subtree tree`);

  const dir = path.join(root, "public/data/plays", slug);
  eq(sha256File(path.join(dir, "play.json")), W.playSha, `${slug}: play.json SHA-256 pinned`);
  eq(sha256File(path.join(dir, "provenance.json")), W.provSha, `${slug}: provenance.json SHA-256 pinned`);
  const play = JSON.parse(fs.readFileSync(path.join(dir, "play.json"), "utf8"));
  const prov = JSON.parse(fs.readFileSync(path.join(dir, "provenance.json"), "utf8"));

  eq(prov.source.scanSha256, W.scanSha, `${slug}: provenance records the frozen scan SHA-256`);
  eq(play.sourceCommit, FROZEN_SOURCE_COMMIT, `${slug}: play.sourceCommit frozen`);
  eq(play.structureKind, W.structureKind, `${slug}: structureKind`);
  eq(play.readingUnits.length, W.readingUnits, `${slug}: reading-unit count`);
  eq(play.edition.year, null, `${slug}: no publication year promoted (year:null)`);
  eq(prov.projectRights.rightsStatus, "nationalised-by-tamil-nadu-government", `${slug}: nationalisation rights recorded`);

  // ── THE FIDELITY GATE: source reading text == generated reading text, byte for byte ──────────
  const TA_DIR = path.join(SRC_REPO, "works", slug, "scenes");
  const EN_DIR = path.join(SRC_REPO, "works", slug, "translations/en");
  for (const u of play.readingUnits) {
    const taRaw = fs.readFileSync(path.join(TA_DIR, `${u.slug}.md`), "utf8");
    const enRaw = fs.readFileSync(path.join(EN_DIR, `${u.slug}.md`), "utf8");
    const taTitle = W.titleFrom === "first-heading" ? u.headingTa : null;
    const enTitle = W.titleFrom === "first-heading" ? u.headingEn : null;
    eq(generatedReadingText(u, "tamil", taTitle), sourceReadingText(taRaw, { english: false }), `${slug}/${u.slug}: Tamil source→generated reading text is byte-identical`);
    eq(generatedReadingText(u, "english", enTitle), sourceReadingText(enRaw, { english: true }), `${slug}/${u.slug}: English source→generated reading text is byte-identical`);
    // Verbatim spot-proof: every printed speaker label + separator exists verbatim in the raw source.
    for (const d of u.tamil.units.filter((x) => x.kind === "dialogue" && x.speakerAsPrinted !== null)) {
      ok(taRaw.includes(d.speakerAsPrinted + d.speakerSeparator), `${slug}/${u.slug}: speaker label "${d.speakerAsPrinted}" verbatim in source`);
    }
  }
}

// ── PER-WORK SEMANTIC SAFEGUARDS ─────────────────────────────────────────────────────────────────
const load = (slug) => JSON.parse(fs.readFileSync(path.join(root, "public/data/plays", slug, "play.json"), "utf8"));
const loadProv = (slug) => JSON.parse(fs.readFileSync(path.join(root, "public/data/plays", slug, "provenance.json"), "utf8"));

// காகிதப்பூ
{
  const p = load("kagithapoo"); const pr = loadProv("kagithapoo");
  const numbered = p.readingUnits.filter((u) => u.kind === "scene").map((u) => u.order);
  eq(numbered, [1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24, 25, 26, 27], "kagithapoo numbered scenes are exactly the source's own (no 22/23, no renumbering)");
  ok(!p.readingUnits.some((u) => u.order === 22 || u.order === 23), "kagithapoo assigns no Scene 22/23");
  const comp = p.readingUnits.find((u) => u.kind === "compressed-scene-range");
  eq(comp?.sceneRange, [2, 3, 4, 5], "kagithapoo compressed range is exactly [2,3,4,5]");
  const un = p.readingUnits.find((u) => u.kind === "unnumbered-scene");
  eq(un?.sourceHeadingTa, "காட்சி,", "kagithapoo unnumbered unit carries the printed `காட்சி,` heading verbatim");
  ok(!!pr.source.compressedSceneNote && !!pr.source.unnumberedSceneNote, "kagithapoo provenance records the compressed-range and unnumbered-scene safeguards");
  const lastTa = p.readingUnits[p.readingUnits.length - 1].tamil.units.map((u) => u.text).join("\n");
  ok(/முற்றும்/.test(lastTa), "kagithapoo carries the printed `(முற்றும்)` closure the source prints on scan 131");
  ok(pr.notes.some((n) => /author attribution is user-supplied/i.test(n)), "kagithapoo records author attribution as user-supplied (not promoted)");
  // Structured authorship-evidence qualification: the selected source range prints no author line.
  const aa = p.authorAttribution;
  ok(!!aa, "kagithapoo carries a structured authorAttribution");
  eq(aa?.basis, "user-supplied-catalogue", "kagithapoo authorAttribution.basis is user-supplied-catalogue");
  eq(aa?.printedInSelectedSourceRange, false, "kagithapoo authorAttribution: the selected source range does not print an author line");
  eq(aa?.attribution, p.author.en, "kagithapoo authorAttribution.attribution == the attributed author");
}

// மணிமகுடம்
{
  const p = load("manimagudam"); const pr = loadProv("manimagudam");
  eq(p.readingUnits.map((u) => u.order), Array.from({ length: 47 }, (_, k) => k + 1), "manimagudam is exactly scenes 1..47 in order");
  ok(p.readingUnits.every((u) => u.kind === "scene"), "manimagudam units are all source-numbered scenes");
  ok((pr.performanceWitnesses ?? []).some((w) => /1956/.test(w.date)) && (pr.performanceWitnesses ?? []).some((w) => /1963/.test(w.date)), "manimagudam records the scan's own May-1956 and Sept-1963 stagings as witnesses");
  const ctx = pr.userSuppliedContext ?? [];
  ok(ctx.some((c) => /1962/.test(c.claim) && /Madurai/i.test(c.claim)), "manimagudam records the 1962 Madurai claim as user-supplied context");
  ok(ctx.every((c) => /never promoted|not promoted|context/i.test(c.status)), "manimagudam marks the 1962 claim as NOT promoted to a source fact");
  // The unverified 1962 claim must NEVER appear in the reading body of any scene.
  const body = p.readingUnits.flatMap((u) => [...u.tamil.units, ...u.english.units]).map((u) => u.text).join("\n");
  ok(!/1962/.test(body), "manimagudam does NOT inject the unverified 1962 claim into the reading text");
  ok(!!p.edition.editionStatementTa && /2010/.test(p.edition.editionStatementTa), "manimagudam carries the printed 6th-edition/2010 statement as a witness");
}

// திருவாளர் தேசீயம்பிள்ளை
{
  const p = load("thiruvalar-desiyampillai"); const pr = loadProv("thiruvalar-desiyampillai");
  eq(p.readingUnits.length, 7, "thiruvalar has exactly 7 editorial SRUs");
  ok(p.readingUnits.every((u) => u.kind === "source-representation-unit" && u.order === null), "thiruvalar units are all SRUs with no source scene number");
  ok(p.readingUnits.every((u) => /^SRU-\d\d$/.test(u.editorialUnitId ?? "")), "thiruvalar SRUs carry editorial SRU ids, never scene numbers");
  const holdUnits = p.readingUnits.filter((u) => u.assembledFromVerifiedPages === false).map((u) => u.slug).sort();
  eq(holdUnits, ["sru-01-yama-court", "sru-04-gandhi-journey"], "thiruvalar flags exactly SRU-01 and SRU-04 as carrying source-condition holds");
  const allTa = p.readingUnits.flatMap((u) => u.tamil.units).map((u) => u.text).join("\n");
  ok(/\[paper loss\]/.test(allTa), "thiruvalar carries `[paper loss]` markers verbatim in the reading text");
  ok(/\[unresolved glyph cluster\]/.test(allTa) && /\[unresolved descriptive cluster\]/.test(allTa), "thiruvalar carries the unresolved-cluster markers verbatim");
  const isClosure = (t) => /^\(?\s*முற்றும்\s*\)?[.।]?$/.test(t.trim());
  ok(!p.readingUnits.flatMap((u) => u.tamil.units).some((u) => isClosure(u.text)), "thiruvalar carries NO invented `முற்றும்` closure");
  const sru7 = p.readingUnits.find((u) => u.slug === "sru-07-udayasuriyan-kolam-close");
  ok(!!sru7 && sru7.tamil.units.some((u) => u.kind === "heading" && u.text.trim() === "உதயசூரியன் கோலம்"), "thiruvalar preserves the scan-47 `உதயசூரியன் கோலம்` intertitle inside SRU-07 (never a scene title)");
  ok((pr.sourceConditionHolds ?? []).length === 5, "thiruvalar records its 5 documented DRAMATIC-BODY source-condition holds");
  ok(!!pr.source.sruStructureNote && !!pr.source.intertitleNote && !!pr.source.printedClosureNote, "thiruvalar provenance records the SRU / intertitle / no-முற்றும் safeguards");
  ok(!!p.edition.editionStatementTa && /1965/.test(p.edition.editionStatementTa), "thiruvalar carries the printed 2nd-edition/1965 statement as a witness");

  // ── PAGE-LAYER QUALIFICATION, independently derived from the frozen audit ─────────────────────
  // The whole point of this block is that the WORK-LEVEL 9 needs-review page records are never
  // collapsed to the 5 dramatic-body holds. Everything below is re-derived from the audit Markdown,
  // then the generated provenance is required to reproduce it exactly.
  const audit = fs.readFileSync(path.join(SRC_REPO, "works/thiruvalar-desiyampillai/PAGE_LAYER_COMPLETION_AUDIT.md"), "utf8");
  const num = (re, l) => { const m = re.exec(audit); ok(!!m, `audit records: ${l}`); return m ? Number(m[1]) : NaN; };
  const scanList = (re, l) => { const m = re.exec(audit); ok(!!m, `audit records: ${l}`); return m ? m[1].split(",").map((x) => Number(x.trim())).filter((x) => Number.isInteger(x)) : []; };
  const auditPhysical = num(/physical scans registered:\s*\*\*(\d+)\s*\/\s*\d+\*\*/, "physical scans registered");
  const auditProcessed = num(/direct source processing complete:\s*\*\*(\d+)\s*\/\s*\d+\*\*/, "49/49 processed");
  const auditVerified = num(/visually verified page records:\s*\*\*(\d+)\s*\/\s*\d+\*\*/, "verified page records");
  const auditNeedsReview = num(/`needs-review`:\s*\*\*(\d+)\s*\/\s*\d+\*\*/, "needs-review count");
  const auditNeedsScans = scanList(/`needs-review`:\s*\*\*\d+\s*\/\s*\d+\*\*\s*\(`([0-9,\s]+)`\)/, "the 9 needs-review scans");
  const auditClusters = num(/unresolved visual\/source clusters:\s*\*\*(\d+)\*\*/, "unresolved visual clusters");
  const auditFrontMatter = scanList(/### Front-matter physical-source holds\s*\n\s*\nScans\s*\*\*([0-9,\s]+)\*\*/, "front-matter hold scans");
  // Independently: the audit says 49/49 processed, 40/49 verified, 9/49 needs-review, 3 clusters,
  // front-matter holds 1,3,4,5 — and the body holds are the needs-review scans that are NOT front-matter.
  eq(auditPhysical, 49, "audit: 49 physical scans");
  eq(auditProcessed, 49, "audit: 49 / 49 PROCESSED");
  eq(auditVerified, 40, "audit: 40 / 49 verified");
  eq(auditNeedsReview, 9, "audit: 9 / 49 needs-review");
  eq(auditNeedsScans, [1, 3, 4, 5, 7, 8, 9, 35, 36], "audit: the exact 9 needs-review scans");
  eq(auditFrontMatter, [1, 3, 4, 5], "audit: the exact 4 front-matter hold scans");
  eq(auditClusters, 3, "audit: 3 unresolved visual clusters");
  const auditBodyHolds = auditNeedsScans.filter((s) => !auditFrontMatter.includes(s));
  eq(auditBodyHolds, [7, 8, 9, 35, 36], "audit: the exact 5 dramatic-body hold scans (needs-review minus front-matter)");
  // Now the generated provenance must reproduce that qualification EXACTLY.
  const q = pr.pageLayerQualification;
  ok(!!q, "thiruvalar provenance carries the pageLayerQualification");
  eq(q?.physicalScans, auditPhysical, "provenance physicalScans == audit");
  eq(q?.processedPageRecords, auditProcessed, "provenance processedPageRecords == audit (49)");
  eq(q?.verifiedPageRecords, auditVerified, "provenance verifiedPageRecords == audit (40)");
  eq(q?.needsReviewPageRecords, auditNeedsReview, "provenance needsReviewPageRecords == audit (9) — NOT the 5 body holds");
  eq([...(q?.needsReviewScans ?? [])].sort((a, b) => a - b), auditNeedsScans, "provenance needsReviewScans == audit");
  eq([...(q?.frontMatterHoldScans ?? [])].sort((a, b) => a - b), auditFrontMatter, "provenance frontMatterHoldScans == audit (4)");
  eq([...(q?.dramaticBodyHoldScans ?? [])].sort((a, b) => a - b), auditBodyHolds, "provenance dramaticBodyHoldScans == audit (5)");
  eq(q?.unresolvedVisualClusters, auditClusters, "provenance unresolvedVisualClusters == audit (3)");
  // The archive-derived count is the BODY holds only (5), explicitly not the 9 page records.
  eq(pr.archiveDerived.bodySourceConditionHolds, 5, "archiveDerived.bodySourceConditionHolds == 5 (renamed; not the 9 page-layer records)");
  ok(q && q.needsReviewPageRecords !== q.dramaticBodyHoldScans.length, "9 page-level review holds are NOT collapsed to the 5 body-hold scans");
}

if (failures.length) {
  console.error(`\nvalidate-drama-wave6 — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures.slice(0, 40)) console.error("  ✗ " + f);
  if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
  process.exit(1);
}
console.log(`\nvalidate-drama-wave6 — ${checks} checks, 0 failed`);
console.log("  3 Drama works · source→generated reading text byte-identical across every Tamil & English unit · safeguards proven");
console.log("  காகிதப்பூ 23 units (no Scene 22/23; compressed 2–5; unnumbered காட்சி) · மணிமகுடம் 47 scenes (1962 not promoted) · திருவாளர் 7 SRUs (holds verbatim; no முற்றும்)");
