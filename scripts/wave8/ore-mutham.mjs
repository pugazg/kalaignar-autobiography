// Wave 8 P1 — B2 ஒரே முத்தம் (`ore-mutham`): one new Drama LibraryWork, stage-play family, HIDDEN foundation.
//
// Source authority (pinned `works/ore-mutham`): `scenes/*.md` (assembled Tamil, one file per reading unit), the
// released English `translations/en/*.md`, the 131 canonical `pages/NNNN.md` records (verification state), the
// batch / final English reviews and the closed Tamil review. The work prints TWO numbering scopes: the main play
// (காட்சி 1–30) and a separately titled `நகைச் சுவைப் பகுதி.` whose scenes are numbered 1–3 again. Both scopes are
// carried as PARTS; supplementary scenes keep their printed numbers 1–3 and are never renumbered 31–33. Unit ids
// are the source's own file stems (`main-NN`, `nagai-suvai-NN`).
import fs from "node:fs";
import path from "node:path";
import { WAVE8_PINS, die, readSource, splitFrontMatter, parseFlatYaml, trimBlankLines, splitComments, toJson } from "./common.mjs";

const PART_BY_SECTION = { "main-play": "main-play", "supplementary-comedy": "nagai-suvai-pagudhi" };

// Trailing archival sections that follow the scene text: Tamil `## Assembly provenance`, English `## Translation notes`.
const APPARATUS_H2 = /^## (Assembly provenance|Translation notes)\s*$/;

function readUnit(file, kind) {
  const t = readSource(file);
  const { fm, body } = splitFrontMatter(t);
  if (fm === null) die(`${file}: no front matter`);
  const y = parseFlatYaml(fm);
  let partHeading = null, sceneHeading = null;
  const rest = [], apparatus = [];
  let inApparatus = false;
  for (const l of body.split("\n")) {
    if (inApparatus) { apparatus.push(l); continue; }
    if (APPARATUS_H2.test(l)) { inApparatus = true; apparatus.push(l); continue; }
    if (!sceneHeading && /^# /.test(l)) {
      const h = l.slice(2).trim();
      // Tamil `# நகைச் சுவைப் பகுதி.` / English `# Comedy Section` = part heading; `# Scene N` = unit heading;
      // `# நகைச் சுவைப் பகுதி. — காட்சி 3` / `# Comedy Section — Scene 3` = both on one line.
      const both = h.match(/^(.+?) — ((?:காட்சி|Scene) \d+)$/);
      if (both) { partHeading = both[1]; sceneHeading = both[2]; }
      else if (/^(Scene \d+|காட்சி \d+)$/.test(h)) sceneHeading = h;
      else partHeading = h;
      continue;
    }
    if (!sceneHeading && /^## /.test(l)) { sceneHeading = l.slice(3).trim(); continue; }
    rest.push(l);
  }
  if (!sceneHeading) die(`${file}: no scene heading`);
  if (!apparatus.length) die(`${file}: expected trailing ${kind === "Tamil" ? "Assembly provenance" : "Translation notes"} section`);
  const { text, annotations } = splitComments(rest.join("\n"));
  const out = { y, partHeading, sceneHeading, text: trimBlankLines(text), annotations, apparatus: trimBlankLines(apparatus.join("\n")) };
  if (!out.text) die(`${file}: empty ${kind} scene text`);
  return out;
}

export function importOreMutham(src) {
  const pin = WAVE8_PINS.oreMutham;
  const work = path.join(src, pin.workPath);
  const sceneFiles = fs.readdirSync(path.join(work, "scenes")).filter((f) => /^(main|nagai-suvai)-\d{2}\.md$/.test(f));
  const order = (f) => (f.startsWith("main-") ? 0 : 1) * 1000 + Number(f.match(/(\d{2})\.md$/)[1]);
  sceneFiles.sort((a, b) => order(a) - order(b));

  // ── Page-level verification (the 131 canonical records) ──────────────────────────────────────────
  const pageFiles = fs.readdirSync(path.join(work, "pages")).filter((f) => /^\d{4}\.md$/.test(f)).sort();
  const pageStatus = {};
  for (const f of pageFiles) {
    const { fm } = splitFrontMatter(readSource(path.join(work, "pages", f)));
    if (fm === null) die(`pages/${f}: no front matter`);
    const y = parseFlatYaml(fm);
    if (y.scan_page !== Number(f.slice(0, 4))) die(`pages/${f}: scan_page ${y.scan_page} mismatch`);
    pageStatus[y.status] = (pageStatus[y.status] ?? 0) + 1;
  }

  // ── Closure evidence (gates recorded by the archive) ─────────────────────────────────────────────
  const read = (rel) => readSource(path.join(work, rel));
  const holds = read("TERMINAL_SOURCE_CONDITION_HOLDS.md");
  if (!/Status: \*\*CLOSED — 0 CURRENT-SOURCE-CONDITION HOLDS; 131 \/ 131 SCANS VERIFIED\*\*/.test(holds)) die("holds ledger is not CLOSED / 0");
  if (!/^Status: \*\*PASS — TAMIL TRANSCRIPTION/m.test(read("TAMIL_CLOSURE_REVIEW.md"))) die("Tamil closure review not PASS");
  const finalEn = read("translations/en/TRANSLATION_REVIEW.md").match(/^Status: \*\*(PASS \/ COMPLETE[^*]*)\*\*/m);
  if (!finalEn) die("final English review not PASS");
  const batches = fs.readdirSync(path.join(work, "translations/en")).filter((f) => /^BATCH_\d{2}_REVIEW\.md$/.test(f)).sort()
    .map((f) => ({ file: `translations/en/${f}`, result: /\*\*PASS \/ LOCKED\*\*/.test(read(`translations/en/${f}`)) ? "PASS / LOCKED" : die(`${f}: not PASS / LOCKED`) }));

  // ── Controlling source identity (metadata/source.md) ─────────────────────────────────────────────
  const src_md = read("metadata/source.md");
  const g = (re, label) => { const m = src_md.match(re); if (!m) die(`metadata/source.md: ${label} not found`); return m[1]; };
  const controllingSource = {
    filename: g(/^Filename: `([^`]+)`/m, "filename"),
    sha256: g(/SHA-256: \*\*`([0-9a-f]{64})`\*\*/, "SHA-256"),
    fileSizeBytes: Number(g(/file size: \*\*([\d,]+) bytes\*\*/, "size").replace(/,/g, "")),
    physicalScans: Number(g(/physical PDF scans: \*\*(\d+)\*\*/, "scans")),
  };
  const identity = {
    titleTa: g(/^- title: \*\*(.+)\*\*$/m, "title"),
    authorTa: g(/^- author: \*\*(.+)\*\*$/m, "author"),
    publisherTa: g(/^- publisher: \*\*(.+)\*\*$/m, "publisher"),
  };

  // ── Reading units ────────────────────────────────────────────────────────────────────────────────
  const parts = new Map();
  const units = sceneFiles.map((f) => {
    const stem = f.replace(/\.md$/, "");
    const ta = readUnit(path.join(work, "scenes", f), "Tamil");
    const enFile = path.join(work, "translations/en", f);
    if (!fs.existsSync(enFile)) die(`translations/en/${f}: missing English unit`);
    const en = readUnit(enFile, "English");
    const partId = PART_BY_SECTION[ta.y.section] ?? die(`${f}: unknown section ${ta.y.section}`);
    if (PART_BY_SECTION[en.y.section] !== partId) die(`${f}: English section ${en.y.section} disagrees with Tamil ${ta.y.section}`);
    const n = ta.y.scene;
    if (!Number.isInteger(n) || n !== Number(stem.slice(-2)) || en.y.scene !== n) die(`${f}: printed scene number mismatch`);
    if (!new RegExp(`^காட்சி ${n}$`).test(ta.sceneHeading)) die(`${f}: Tamil heading ${ta.sceneHeading} is not காட்சி ${n}`);
    if (!parts.has(partId)) parts.set(partId, { id: partId, headingTa: null, headingEn: null, firstUnit: stem });
    const p = parts.get(partId);
    if (ta.partHeading) { if (p.headingTa && p.headingTa !== ta.partHeading) die(`${f}: conflicting part heading`); p.headingTa = ta.partHeading; }
    if (en.partHeading) { if (p.headingEn && p.headingEn !== en.partHeading) die(`${f}: conflicting English part heading`); p.headingEn = en.partHeading; }
    return {
      id: stem,
      partId,
      printedSceneNumber: n,
      headingTa: ta.sceneHeading,
      headingEn: en.sceneHeading,
      sourceScans: ta.y.source_scan_pages,
      printedPages: ta.y.printed_pages,
      tamilStatus: ta.y.status,
      assembledFromVerifiedPages: ta.y.assembled_from_verified_pages,
      sourceConditionScans: ta.y.source_condition_scans,
      englishStatus: en.y.status,
      englishReview: en.y.translation_review ?? null,
      secondaryEnglishWitnessUsed: en.y.secondary_english_witness_used ?? null,
      tamil: { text: ta.text, ...(ta.annotations.length ? { annotations: ta.annotations } : {}), apparatus: ta.apparatus },
      english: { text: en.text, ...(en.annotations.length ? { annotations: en.annotations } : {}), apparatus: en.apparatus },
    };
  });
  const partList = [...parts.values()].map((p) => ({ ...p, unitCount: units.filter((u) => u.partId === p.id).length, printedNumbers: units.filter((u) => u.partId === p.id).map((u) => u.printedSceneNumber) }));

  return {
    id: "ore-mutham",
    slug: "ore-mutham",
    ...identity,
    editionTa: "ஐந்தாம் பதிப்பு, 1964",
    editionEvidence: "Source-visible: scan 3 title page `ஐந்தாம் பதிப்பு.`; scan 4 edition history through the fifth edition, December 1964 (metadata/source.md).",
    source: { repo: pin.repo, commit: pin.commit, repoTree: pin.repoTree, path: pin.workPath, workTree: pin.workTree },
    controllingSource,
    verification: {
      pageRecords: pageFiles.length,
      pageStatus,
      blocked: pageStatus["blocked"] ?? 0,
      needsReview: pageStatus["needs-review"] ?? 0,
      holdsLedger: "TERMINAL_SOURCE_CONDITION_HOLDS.md — CLOSED — 0 current-source-condition holds (historical ledger only)",
      tamilClosure: "TAMIL_CLOSURE_REVIEW.md — PASS",
      englishBatches: batches,
      englishFinalReview: `translations/en/TRANSLATION_REVIEW.md — ${finalEn[1]}`,
    },
    parts: partList,
    units,
  };
}

export const oreMuthamFiles = (om) => ({ "ore-mutham/ore-mutham.json": toJson(om) });
