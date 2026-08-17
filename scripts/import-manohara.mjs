// Deterministic, work-specific importer for மனோகரா / Manohara (Digital Library Phase 2).
//
// Reads the AUTHORITATIVE source from a local clone of pugazg/kalaignar-cinema-works
// (works/manohara) at a pinned commit, and vendors static bilingual reader data into
// this website under public/data/cinema/manohara/. Runtime never calls GitHub.
//
// It NEVER reads the accidental public/data/cinema/manohara/parts/ files — those are
// non-authoritative and are not used as source, reference, baseline or validation.
//
// Fidelity: Tamil is the verified scene derivative (HTML provenance comments stripped;
// page markers captured as structured metadata; all Tamil text, ★ separators, speaker
// labels, stage directions, ellipses and repetition preserved verbatim). English is the
// verified reader-edition units (kind + exact source speaker_label incl. null +
// english_text), never retranslated or normalized.
//
// Usage: node scripts/import-manohara.mjs <path-to-cinema-works-clone> <source-commit>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-manohara.mjs <cinema-works-clone> <source-commit>");
  process.exit(1);
}
const M = path.join(SRC_REPO, "works/manohara");
const OUT = path.join(process.cwd(), "public/data/cinema/manohara");
const SEG_OUT = path.join(OUT, "segments");

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// --- source integrity (authoritative) ---
const manifest = readJSON(path.join(M, "editions/en/manifest.json"));
const readerEd = readJSON(path.join(M, "editions/en/reader-edition.json"));
const sceneIndex = readJSON(path.join(M, "scenes/index.json"));
const metaYaml = fs.readFileSync(path.join(M, "metadata.yaml"), "utf8");

// Minimal source-fact extraction from metadata.yaml (source-derived, not hardcoded).
const y = (re) => (metaYaml.match(re)?.[1] ?? null);
const sourceFacts = {
  identifier: y(/identifier:\s*"([^"]+)"/),
  scan_sha256: y(/\n\s*sha256:\s*"([^"]+)"/),
  pdf_pages: Number(y(/pdf_pages:\s*(\d+)/)),
  edition_statement_as_printed: y(/edition_statement_as_printed:\s*"([^"]+)"/),
  publication_year_as_printed: Number(y(/publication_year_as_printed:\s*(\d+)/)),
  rights_notice_as_printed: y(/rights_notice_as_printed:\s*"([^"]+)"/),
  price_as_printed: y(/price_as_printed:\s*"([^"]+)"/),
  publisher_name: y(/publisher:\s*\n\s*name:\s*"([^"]+)"/),
  printer_as_printed: y(/printer_as_printed:\s*"([^"]+)"/),
  credit_role: y(/role:\s*"([^"]+)"/),
  credit_name: y(/name:\s*"(மு\.[^"]+)"/),
  main_text_pdf_pages: y(/main_text_pdf_pages:\s*"([^"]+)"/),
  main_text_logical_printed_pages: y(/main_text_logical_printed_pages:\s*"([^"]+)"/),
  ocr_authority: y(/ocr_authority:\s*(\w+)/),
};

// integrity guard: the scan SHA in metadata.yaml must match the edition manifest.
if (sourceFacts.scan_sha256 !== manifest.source_scan_sha256) {
  throw new Error("scan SHA mismatch between metadata.yaml and edition manifest");
}

// --- build per-segment bilingual data ---
fs.rmSync(SEG_OUT, { recursive: true, force: true });
fs.mkdirSync(SEG_OUT, { recursive: true });

const enByOrdinal = new Map(readerEd.scenes.map((s) => [s.archival_scene_ordinal, s]));
const segIndex = [];

for (const sc of sceneIndex.scenes) {
  const ord = sc.ordinal;
  const slug = `segment-${String(ord).padStart(3, "0")}`;

  // Tamil: verified scene derivative, comments stripped, text otherwise verbatim.
  const rawMd = fs.readFileSync(path.join(M, "scenes", sc.file), "utf8");
  // Capture page-provenance markers (structured) before stripping comments.
  const pageProv = [];
  const pageRe = /<!--\s*source:\s*pdf=(\d+)\s+printed(?:-logical)?=(\d+)[^>]*-->/g;
  let mm;
  while ((mm = pageRe.exec(rawMd)) !== null) {
    pageProv.push({ pdf_page: Number(mm[1]), printed_page: Number(mm[2]) });
  }
  const tamilText = rawMd.replace(/<!--[\s\S]*?-->/g, "").replace(/^\s+/, "").replace(/\s+$/, "");

  // English: verified reader-edition units for this ordinal (exact, unmodified).
  const enScene = enByOrdinal.get(ord);
  if (!enScene) throw new Error(`missing English reader scene for ordinal ${ord}`);
  const enUnits = enScene.units.map((u) => ({
    id: u.id,
    kind: u.kind, // dialogue | stage-direction | song-reference | chant | written-text
    speakerLabel: u.source.speaker_label ?? null, // exact source label; null preserved
    text: u.translation.english_text,
  }));

  const segment = {
    workId: "manohara",
    slug,
    ordinal: ord,
    sceneId: sc.scene_id, // derivative navigation id — NOT a printed scene number
    sourceSceneNumber: null, // the 1954 booklet prints no scene numbers
    readerLabelTa: sc.reader_label_ta ?? null,
    startPdfPage: sc.start_pdf_page,
    startPrintedPage: sc.start_logical_printed_page,
    canonicalPart: sc.canonical_part ?? null,
    pageProvenance: pageProv,
    tamil: { text: tamilText },
    english: { units: enUnits },
  };
  fs.writeFileSync(path.join(SEG_OUT, `${slug}.json`), JSON.stringify(segment, null, 1) + "\n");

  segIndex.push({
    slug,
    ordinal: ord,
    sceneId: sc.scene_id,
    readerLabelTa: sc.reader_label_ta ?? null,
    startPdfPage: sc.start_pdf_page,
    startPrintedPage: sc.start_logical_printed_page,
    englishUnitCount: enUnits.length,
  });
}

// --- index.json (work meta + segment stubs) ---
const index = {
  workId: "manohara",
  titleTa: readerEd.title_ta,
  titleEn: readerEd.title_en,
  shelf: "cinema-writing",
  readerStructure: "scene",
  segmentTerminology: "archival-navigation-segment", // NOT printed scene numbers
  segmentCount: segIndex.length,
  sourceSceneNumbering: manifest.source_scene_numbering, // "none-printed"
  archivalSceneNumbering: manifest.archival_scene_numbering, // "derivative-navigation-only"
  segments: segIndex,
};
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index, null, 1) + "\n");

// --- provenance.json (full integrity manifest) ---
const provenance = {
  workId: "manohara",
  sourceRepo: "pugazg/kalaignar-cinema-works",
  sourcePath: "works/manohara",
  sourceCommit: SRC_COMMIT,
  buildVersion: 1,
  source: sourceFacts,
  sourceSceneNumbering: manifest.source_scene_numbering,
  archivalSceneNumbering: manifest.archival_scene_numbering,
  segmentCount: segIndex.length,
  tamil: {
    sceneDerivatives: sceneIndex.scene_text_files_completed ?? sceneIndex.scenes.length,
    status: sceneIndex.scene_text_derivatives_status ?? "complete-verified",
  },
  english: {
    edition: manifest.edition,
    status: manifest.status,
    translationAuthority: manifest.translation_authority,
    translationUnits: manifest.translation_units,
    unitKindCounts: manifest.unit_kind_counts,
    immutableDialogueRecordsLinked: manifest.immutable_dialogue_records_linked,
    sourceUnlabelledSpokenUnits: manifest.source_unlabelled_spoken_units.length,
    crossPageUnits: manifest.cross_page_units.length,
    songOccurrenceLinks: (manifest.song_occurrence_links ?? []).length,
    qaStatus: manifest.qa_status,
  },
  integrity: {
    sourceScanSha256: manifest.source_scan_sha256,
    translationInputAggregateSha256: manifest.translation_input_aggregate_sha256,
    validationInputAggregateSha256: manifest.validation_input_aggregate_sha256,
    readerEditionOutputs: manifest.outputs, // md/html/json/QA hashes from source
  },
  notes: [
    "The 1954 booklet prints NO numbered scenes; the 57 divisions are archive-created navigation segments only.",
    "The rendered scan is the controlling archival source; the OCR layer is non-canonical navigation only.",
    "Tamil is the verified source scene derivative; English is the verified source reader translation. Neither was edited during import.",
    "The accidental website public/data/cinema/manohara/parts/ files were NOT used as source, reference, baseline or validation.",
  ],
};
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

console.log("segments written:", segIndex.length);
console.log("index.json sha256:", sha256(fs.readFileSync(path.join(OUT, "index.json"))));
console.log("provenance.json sha256:", sha256(fs.readFileSync(path.join(OUT, "provenance.json"))));
console.log("source facts:", JSON.stringify(sourceFacts));
