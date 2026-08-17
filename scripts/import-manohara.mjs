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
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-manohara.mjs <cinema-works-clone> <source-commit>");
  process.exit(1);
}

// Fail closed: the source clone's actual git HEAD must equal the supplied <source-commit>,
// so we never record a caller-supplied SHA that does not correspond to the checked-out tree.
let actualHead;
try {
  actualHead = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch (e) {
  throw new Error(`unable to read git HEAD of source clone at ${SRC_REPO}: ${e.message}`);
}
if (actualHead !== SRC_COMMIT) {
  throw new Error(
    `source-commit mismatch: supplied ${SRC_COMMIT} but ${SRC_REPO} HEAD is ${actualHead}. ` +
      `Refusing to generate data with a commit SHA that does not match the checked-out source tree.`,
  );
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

  // English: verified reader-edition units for this ordinal (exact, unmodified). Every
  // authoritative source-linked provenance field is copied DIRECTLY — none reconstructed,
  // no source paths/record ids converted into invented website ids.
  const enScene = enByOrdinal.get(ord);
  if (!enScene) throw new Error(`missing English reader scene for ordinal ${ord}`);
  const enUnits = enScene.units.map((u) => {
    const src = u.source;
    const tr = u.translation;
    // Reading text: normally translation.english_text. A very small number of units instead
    // carry translation.english_lines (discrete quoted lines); the authoritative editions
    // render those joined by a line break (.md newline / .html <br>), so we join with "\n".
    // No text is invented or normalized.
    const text =
      tr.english_text != null
        ? tr.english_text
        : Array.isArray(tr.english_lines)
          ? tr.english_lines.join("\n")
          : (() => {
              throw new Error(`unit ${u.id} has neither english_text nor english_lines`);
            })();

    const unit = {
      id: u.id,
      kind: u.kind, // dialogue | stage-direction | song-reference | chant | written-text
      speakerLabel: src.speaker_label ?? null, // exact source label; null preserved
      text,
      // Source-linked audit trail, verbatim from the authoritative reader record.
      source: {
        sourcePath: src.source_path,
        canonicalScenePath: src.canonical_scene_path,
        sourceRecordId: src.source_record_id ?? null, // null for non-dialogue-linked units
        sourceOccurrenceId: src.source_occurrence_id ?? null, // song/performance occurrence id where present
        sourceLocator: src.source_locator ?? null, // structured locator where present; verbatim
        pageProvenance: src.page_provenance, // exact source array of {pdf_page, printed_page}
      },
      // Translation-layer metadata, verbatim. Editorial notes are never altered/regenerated.
      translation: { mode: tr.mode },
    };
    // Preserve the exact physical-page split only where the source supplies it (cross-page units).
    if (Array.isArray(tr.english_page_segments)) {
      unit.translation.englishPageSegments = tr.english_page_segments.map((s) => ({
        pdf_page: s.pdf_page,
        printed_page: s.printed_page,
        english_text: s.english_text,
      }));
    }
    // Preserve discrete source lines where the unit is represented that way.
    if (Array.isArray(tr.english_lines)) {
      unit.translation.englishLines = tr.english_lines.slice();
    }
    // Retain authoritative editorial notes as static metadata (omit when empty).
    if (Array.isArray(tr.notes) && tr.notes.length > 0) {
      unit.translation.notes = tr.notes.slice();
    }
    return unit;
  });

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
  // Present project-level rights status of the UNDERLYING Kalaignar-authored work. These are
  // PROJECT-LEVEL verified facts (not from the source repo) and are kept DISTINCT from the 1954
  // edition's printed rights notice (source.rights_notice_as_printed above). The Government Order
  // number is null until verified from the GO itself — it is never invented.
  projectRights: {
    appliesTo: "underlying-work-authored-by-kalaignar",
    rightsStatus: "nationalised-by-tamil-nadu-government",
    rightsAuthority: "Government of Tamil Nadu",
    rightsAction: "nationalisation",
    rightsAnnouncementDate: "2024-08-22",
    governmentOrderNumber: null,
    governmentOrderDateStated: "December 2024",
    distinctionNote:
      "The 1954 edition's printed rights notice and the later Tamil Nadu Government nationalisation are two different historical/provenance facts; the printed notice does not describe the present rights status.",
    thirdPartyNote:
      "The nationalisation applies to Kalaignar's underlying authored work. It does not extend to third-party contributions (other authors' prefaces/essays, separately published translations, secondary source/witness editions, or photographs/illustrations/cover/publisher material), which retain their own independent provenance and rights.",
    projectTranslationNote:
      "The English reading layer is a project-created derivative (englishKind: project-created) and retains its own distinct provenance, separate from the rights status of the underlying Tamil work.",
    evidencePending:
      "The exact Government Order number/date must be captured and verified from the Government Order or another authoritative government record before being recorded here.",
  },
  notes: [
    "The 1954 booklet prints NO numbered scenes; the 57 divisions are archive-created navigation segments only.",
    "The rendered scan is the controlling archival source; the OCR layer is non-canonical navigation only.",
    "Tamil is the verified source scene derivative; English is the verified source reader translation. Neither was edited during import.",
    "Each English unit preserves the authoritative source-linked audit trail verbatim (source_path, canonical_scene_path, source_record_id, source_occurrence_id, source_locator, page_provenance) plus the exact cross-page english_page_segments, translation mode and editorial notes. These are copied directly from the source reader record and are never reconstructed.",
    "The accidental website public/data/cinema/manohara/parts/ files were NOT used as source, reference, baseline or validation, and were subsequently removed from the website repository.",
  ],
};
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

console.log("segments written:", segIndex.length);
console.log("index.json sha256:", sha256(fs.readFileSync(path.join(OUT, "index.json"))));
console.log("provenance.json sha256:", sha256(fs.readFileSync(path.join(OUT, "provenance.json"))));
console.log("source facts:", JSON.stringify(sourceFacts));
