// Deterministic Speech-family importer — Wave 6 P1–P3 Batch 3.
//
//   node scripts/import-speeches-wave6.mjs <assembly-speeches-clone> <assembly-commit> <public-speeches-clone> <public-commit>
//
// ONE importer for the three Batch-3 speeches, with per-work adapters for the two source-repository
// structures. It reads ONLY the pinned canonical source layer of each work — metadata.json + the
// frozen Tamil transcript + the verified English translation — and vendors bilingual reader data to
// public/data/speeches/<slug>/{speech.json, provenance.json}. Runtime never calls GitHub; no source
// PDF/binary is vendored (identity travels as filename + SHA-256 + size + page map).
//
// Fidelity (proved independently by scripts/validate-speeches-wave6.mjs): the frozen Tamil is the
// textual authority and the verified English is the faithful reading translation. Text is copied
// BYTE-FOR-BYTE — no NFC/NFD, no whitespace collapse, no punctuation/orthographic change; source
// Markdown emphasis is kept. The importer never parses audit/progress/handover logs as literary text:
// it bounds the reading body to the canonical assembled layer and drops apparatus, page-marker lines
// and heading markers only. Section/unit order is preserved exactly.
//
// Governance safeguards (import ABORTS otherwise):
//   * நமது நிலை — edited two-House witness: `date: null` (no single Assembly/Council transcript date),
//     the two-House legislature name + scope note preserved, no invented venue/event date, the two
//     editorial units kept distinct (not collapsed into one homogeneous event).
//   * இதய பேரிகை — multi-section booklet: `date/venue/event/occasion/audience` all null, the seven
//     printed sections preserved as headings in source order, no global date/venue invented.
//   * பள்ளி வாழ்க்கை — printed compilation: single-event fields null, component dates/venues never
//     manufactured, compilation boundaries (component headings) preserved.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const [, , AS_REPO, AS_COMMIT, PS_REPO, PS_COMMIT] = process.argv;
if (!AS_REPO || !AS_COMMIT || !PS_REPO || !PS_COMMIT) {
  console.error("usage: node scripts/import-speeches-wave6.mjs <assembly-clone> <assembly-commit> <public-clone> <public-commit>");
  process.exit(1);
}
const die = (m) => { console.error(`import-speeches-wave6: ${m}`); process.exit(1); };
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const readText = (p) => fs.readFileSync(p, "utf8");
const readJSON = (p) => JSON.parse(readText(p));

// Fail-closed source pins.
const head = (repo) => { try { return execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch (e) { die(`cannot read HEAD of ${repo}: ${e.message}`); } };
if (head(AS_REPO) !== AS_COMMIT) die(`assembly-speeches HEAD ${head(AS_REPO)} != ${AS_COMMIT}`);
if (head(PS_REPO) !== PS_COMMIT) die(`public-speeches HEAD ${head(PS_REPO)} != ${PS_COMMIT}`);

// ── PER-WORK CONFIG ──────────────────────────────────────────────────────────────────────────────
// pageMarker "html-comment": `<!-- source-page: N -->` (N = scan page). "pdf-printed": a heading line
// `#..# PDF page X — printed page Y` (any level); the reader is keyed by the PRINTED page.
// bodyStart "wrapper": begin AFTER the wrapper heading (namathu); "first-page-marker": begin at the
// first page marker, everything before is apparatus (idhaya/palli).
const WORKS = [
  {
    slug: "namathu-nilai", repo: () => AS_REPO, commit: AS_COMMIT,
    sourceRepo: "pugazg/kalaignar-assembly-speeches", sourcePath: "speeches/1971/1971-namathu-nilai",
    subtype: "assembly-speech",
    files: { ta: "transcript.md", en: "translation.md" },
    pageMarker: "html-comment",
    bodyStart: "wrapper", wrapperTa: /^#\s+தமிழ்\s*மூல\s*உரை\s*$/, wrapperEn: /^#\s+English translation\s*$/,
    titleTa: "நமது நிலை", titleEn: "Our Position",
    sectionTitleTa: "தமிழ் மூல உரை", sectionTitleEn: "English translation",
    pageBasis: "scan",
    expect: { editorialUnits: 2, dateNull: true, pages: { from: 3, to: 60, count: 58 } },
  },
  {
    slug: "idhaya-perikai", repo: () => PS_REPO, commit: PS_COMMIT,
    sourceRepo: "pugazg/kalaignar-public-speeches", sourcePath: "speeches/idhaya-perikai",
    subtype: "public-speech",
    files: { ta: "transcription-ta.md", en: "translation-en.md" },
    pageMarker: "pdf-printed",
    bodyStart: "first-page-marker",
    titleTa: "இதய பேரிகை", titleEn: "Idhaya Perikai",
    sectionTitleTa: "தமிழ் மூல உரை", sectionTitleEn: "English translation",
    pageBasis: "printed",
    expect: { printedSections: 7, dateNull: true, pages: { from: 3, to: 34, count: 32 } },
  },
  {
    slug: "palli-vazhkkai", repo: () => PS_REPO, commit: PS_COMMIT,
    sourceRepo: "pugazg/kalaignar-public-speeches", sourcePath: "speeches/palli-vazhkkai",
    subtype: "public-speech",
    files: { ta: "transcription-ta.md", en: "translation-en.md" },
    pageMarker: "pdf-printed",
    bodyStart: "first-page-marker",
    titleTa: "பள்ளி வாழ்க்கை", titleEn: "Palli Vazhkkai",
    sectionTitleTa: "தமிழ் மூல உரை", sectionTitleEn: "English translation",
    pageBasis: "printed",
    expect: { compilation: true, dateNull: true, pages: { from: 5, to: 80, count: 76 } },
  },
];

const PDF_PAGE_RE = /^#{1,6}\s+PDF page\s+(\d+)\s*(?:[—–-])\s*printed page\s+(\d+)\s*$/;
const HTML_PAGE_RE = /^<!--\s*source-page:\s*(\d+)\s*-->\s*$/;
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;

// ── PARSER — canonical reading layer → SpeechBlock[] ─────────────────────────────────────────────
// Deterministic and byte-faithful: page-marker lines set the current source page (provenance only);
// non-page heading lines become `heading` blocks (marker stripped, text verbatim); blank-separated
// runs of text become `paragraph` blocks (one segment on the current page). No apparatus, no page
// marker and no heading marker enters the reading TEXT; nothing is normalised.
function parseLayer(text, cfg, layer) {
  const lines = text.split("\n");
  const isPageMarker = (l) => (cfg.pageMarker === "html-comment" ? HTML_PAGE_RE.exec(l) : PDF_PAGE_RE.exec(l));
  const pageOf = (m) => (cfg.pageMarker === "html-comment" ? Number(m[1]) : Number(m[2])); // printed page for pdf-printed

  // Establish the reading-body start.
  let start = 0;
  if (cfg.bodyStart === "wrapper") {
    const wrap = layer === "ta" ? cfg.wrapperTa : cfg.wrapperEn;
    const idx = lines.findIndex((l) => wrap.test(l.replace(/\s+$/, "")));
    if (idx < 0) die(`${cfg.slug}/${layer}: wrapper heading not found`);
    start = idx + 1;
  } else {
    const idx = lines.findIndex((l) => isPageMarker(l.replace(/\s+$/, "")));
    if (idx < 0) die(`${cfg.slug}/${layer}: no page marker found`);
    start = idx;
  }

  const blocks = [];
  const pages = new Set();
  const markers = []; // full ordered page-marker sequence, BOTH coordinates for pdf-printed
  let page = null;
  let para = null; // { lines: [] }
  const flush = () => {
    if (para && para.lines.length) {
      const t = para.lines.join("\n");
      blocks.push({ kind: "paragraph", segments: [{ text: t, sourcePage: page, joinToNext: "end" }], sourcePages: page == null ? [] : [page] });
    }
    para = null;
  };
  let stoppedAt = null; // the page a trailing-apparatus stop fired at (for coverage proof)
  for (let i = start; i < lines.length; i++) {
    // rawLine is the EXACT source bytes (split has removed only the "\n"). Structural recognition
    // uses a trailing-whitespace-tolerant PROBE, but literary content — paragraph text and heading
    // content after the marker — is taken from rawLine verbatim: never trimmed, collapsed or NFC'd.
    const rawLine = lines[i];
    const probe = rawLine.replace(/\s+$/, "");
    const pm = isPageMarker(probe);
    if (pm) {
      flush(); page = pageOf(pm); pages.add(page);
      // Retain the FULL marker: both PDF and printed coordinates for pdf-printed sources, the scan
      // coordinate for html-comment sources. This is the coverage evidence proved against metadata.
      markers.push(cfg.pageMarker === "html-comment" ? { scanPage: Number(pm[1]) } : { pdfPage: Number(pm[1]), printedPage: Number(pm[2]) });
      continue;
    }
    if (probe.trim() === "") { flush(); continue; }        // structural blank separator
    if (/^-{3,}$/.test(probe)) {
      // A horizontal rule AFTER the final expected body page terminates the reading body — it is the
      // separator before a trailing workflow/status footer (idhaya's `**Stage … complete**` block),
      // which is process apparatus, never literary speech. Before the final page it is an ordinary
      // in-body separator (e.g. namathu's rule between its two editorial units), so it just flushes.
      if (page === cfg.expect.pages.to) { flush(); stoppedAt = page; break; }
      flush(); continue;
    }
    if (/^<!--[\s\S]*-->$/.test(probe)) { continue; }         // stray HTML comment (non-page) — apparatus
    const hm = /^(#{1,6})[ \t]+/.exec(rawLine);               // Markdown heading marker (syntax only)
    if (hm) {
      // Trailing-apparatus stop: in the pdf-printed works the reading-body page markers are H2/H3
      // and printed section headings are H3/H4, so a bare level-2 heading that is NOT a page marker
      // (e.g. `## English workflow progress`) marks the end of the reading body. namathu's body ends
      // at EOF (no trailing apparatus) and its printed sections are H2, so it uses no such stop. The
      // coverage assertions below independently prove this stop never truncated a canonical body.
      if (cfg.pageMarker === "pdf-printed" && hm[1].length === 2) { flush(); stoppedAt = page; break; }
      // Heading CONTENT after the marker+separator is kept exactly (trailing whitespace included).
      flush(); blocks.push({ kind: "heading", text: rawLine.slice(hm[0].length), sourcePage: page }); continue;
    }
    (para ||= { lines: [] }).lines.push(rawLine);            // EXACT literary line
  }
  flush();
  const sorted = [...pages].sort((a, b) => a - b);
  return { blocks, pages: sorted, markers, firstPage: sorted[0] ?? null, lastPage: sorted[sorted.length - 1] ?? null, stoppedAt };
}

// Expand a frozen "A-B" page-range string into the inclusive integer sequence [A..B].
function rangeSeq(spec, label) {
  const m = /^(\d+)\s*[-–—]\s*(\d+)$/.exec(String(spec).trim());
  if (!m) die(`${label}: unparseable page range ${JSON.stringify(spec)}`);
  const from = Number(m[1]), to = Number(m[2]);
  if (to < from) die(`${label}: inverted page range ${spec}`);
  return Array.from({ length: to - from + 1 }, (_, k) => from + k);
}

const finalizeBlocks = (blocks) => blocks; // already in model shape

// ── BUILD ONE WORK ───────────────────────────────────────────────────────────────────────────────
function buildWork(cfg) {
  const DIR = path.join(cfg.repo(), cfg.sourcePath);
  const meta = readJSON(path.join(DIR, "metadata.json"));
  const taSrc = readText(path.join(DIR, cfg.files.ta));
  const enSrc = readText(path.join(DIR, cfg.files.en));
  const ta = parseLayer(taSrc, cfg, "ta");
  const en = parseLayer(enSrc, cfg, "en");

  // Governance: date must be null for every Batch-3 work.
  const metaDate = cfg.subtype === "assembly-speech" ? meta.date : meta.speech.date;
  if (metaDate !== null) die(`${cfg.slug}: source metadata date is not null (${metaDate}) — refusing to import`);

  // Namathu textual-authority contract, taken DIRECTLY from source metadata (never inferred from
  // prose). Fail closed if the source does not satisfy it: the booklet transcription must be the
  // only textual authority and no Assembly/Council Official-Report text/wording may be imported.
  if (cfg.slug === "namathu-nilai") {
    if (meta.source.only_textual_authority !== true) die("namathu: source.only_textual_authority is not true");
    if (meta.transcription.external_legislative_text_imported !== false) die("namathu: transcription.external_legislative_text_imported is not false");
    if (meta.translation.external_legislative_wording_imported !== false) die("namathu: translation.external_legislative_wording_imported is not false");
  }

  // COVERAGE: prove the whole canonical body was consumed and a trailing-apparatus stop (if any) did
  // not truncate it. The expected page range/count comes from the frozen source metadata; both layers
  // must reach the final expected body page, and any pdf-printed stop must fire only AT that page.
  const P = cfg.expect.pages;
  for (const [layer, parsed] of [["ta", ta], ["en", en]]) {
    if (parsed.firstPage !== P.from) die(`${cfg.slug}/${layer}: first source page ${parsed.firstPage} != expected ${P.from}`);
    if (parsed.lastPage !== P.to) die(`${cfg.slug}/${layer}: last source page ${parsed.lastPage} != expected ${P.to} (canonical body not fully consumed)`);
    if (parsed.pages.length !== P.count) die(`${cfg.slug}/${layer}: ${parsed.pages.length} source pages != expected ${P.count}`);
    if (parsed.stoppedAt !== null && parsed.stoppedAt !== P.to) die(`${cfg.slug}/${layer}: a trailing-apparatus stop fired at page ${parsed.stoppedAt} BEFORE the final body page ${P.to}`);
  }

  // DUAL-COORDINATE MARKER PROOF — derived from the FROZEN source metadata, not implementation
  // constants. For a pdf-printed source both PDF and printed coordinates are proved, paired and in
  // order; for the html-comment (scan) source the scan sequence is proved. This binds coverage to the
  // source contract so a stale constant can never silently diverge.
  let expectedMarkers;
  if (cfg.pageMarker === "pdf-printed") {
    const pdfSeq = rangeSeq(meta.structure.body_pdf_pages, `${cfg.slug} structure.body_pdf_pages`);
    const printedSeq = rangeSeq(meta.structure.printed_body_pages, `${cfg.slug} structure.printed_body_pages`);
    if (pdfSeq.length !== meta.structure.body_pdf_page_count) die(`${cfg.slug}: body_pdf_page_count ${meta.structure.body_pdf_page_count} != PDF range length ${pdfSeq.length}`);
    if (printedSeq.length !== pdfSeq.length) die(`${cfg.slug}: printed range length ${printedSeq.length} != PDF range length ${pdfSeq.length}`);
    expectedMarkers = pdfSeq.map((pdfPage, i) => ({ pdfPage, printedPage: printedSeq[i] }));
  } else {
    const scanSeq = rangeSeq(meta.source.speech_scan_pages, `${cfg.slug} source.speech_scan_pages`);
    expectedMarkers = scanSeq.map((scanPage) => ({ scanPage }));
  }
  if (expectedMarkers.length !== P.count) die(`${cfg.slug}: metadata-derived marker count ${expectedMarkers.length} != expected ${P.count}`);
  for (const [layer, parsed] of [["ta", ta], ["en", en]]) {
    if (JSON.stringify(parsed.markers) !== JSON.stringify(expectedMarkers)) {
      die(`${cfg.slug}/${layer}: raw page-marker sequence does not equal the metadata-derived expected sequence (dual-coordinate coverage)`);
    }
  }

  const headings = (b) => b.blocks.filter((x) => x.kind === "heading");
  const paragraphs = (b) => b.blocks.filter((x) => x.kind === "paragraph");

  // Per-work structural safeguards.
  if (cfg.expect.editorialUnits) {
    const eu = headings(ta).filter((h) => /^Editorial unit\s+\d/i.test(h.text));
    if (eu.length !== cfg.expect.editorialUnits) die(`${cfg.slug}: expected ${cfg.expect.editorialUnits} editorial units, found ${eu.length}`);
  }
  if (cfg.expect.printedSections) {
    const wanted = (meta.structure.sections || []).map((s) => s.title_ta);
    const got = headings(ta).map((h) => h.text);
    for (const w of wanted) if (!got.includes(w)) die(`${cfg.slug}: printed section heading missing from transcript: ${w}`);
    if (wanted.length !== cfg.expect.printedSections) die(`${cfg.slug}: metadata declares ${wanted.length} sections, expected ${cfg.expect.printedSections}`);
  }

  const speech = {
    workId: cfg.slug, slug: cfg.slug,
    sourceRepo: cfg.sourceRepo, sourcePath: cfg.sourcePath, sourceCommit: cfg.commit,
    shelf: "speeches", subtype: cfg.subtype, readerStructure: "speech",
    date: null,
    year: cfg.subtype === "assembly-speech" ? (meta.year ?? null) : null, // publication year is NOT a speech year for the public compilations
    title: { ta: cfg.titleTa, en: cfg.titleEn },
    speechType: cfg.subtype === "assembly-speech" ? meta.speech.type : meta.document_type,
    speaker: cfg.subtype === "assembly-speech"
      ? { nameTa: meta.speaker.name_ta, nameEn: meta.speaker.name_en, roleTa: meta.speaker.role_ta, roleEn: meta.speaker.role_en }
      : { nameTa: meta.creator.name_ta, nameEn: meta.creator.name_en },
    transcriptionStatus: cfg.subtype === "assembly-speech" ? meta.transcription.status : meta.workflow.tamil_transcription,
    translationStatus: cfg.subtype === "assembly-speech" ? meta.translation.status : meta.workflow.english_translation,
    tamil: { sectionTitleTa: cfg.sectionTitleTa, blocks: finalizeBlocks(ta.blocks) },
    english: { sectionTitleEn: cfg.sectionTitleEn, blocks: finalizeBlocks(en.blocks) },
    sourcePages: ta.pages,
  };
  if (cfg.subtype === "assembly-speech") {
    speech.legislature = { nameTa: meta.legislature.name_ta, nameEn: meta.legislature.name_en };
    speech.event = { ta: meta.speech.event_ta, en: meta.speech.event_en };
  } else {
    // Public speech: every single-event field stays null unless the source establishes it. It does not.
    speech.venue = null; speech.event = null; speech.occasion = null; speech.audience = null;
  }

  // ── PROVENANCE ─────────────────────────────────────────────────────────────────────────────
  const src = cfg.subtype === "assembly-speech" ? meta.source : meta.source;
  const provenance = {
    workId: cfg.slug, sourceRepo: cfg.sourceRepo, sourcePath: cfg.sourcePath, sourceCommit: cfg.commit,
    source: cfg.subtype === "assembly-speech"
      ? {
          publicationTitleTa: meta.source.publication_title_ta,
          coverAttributionTa: meta.source.cover_attribution_ta,
          publicationDate: meta.source.publication_date, // 1971-05-22 (booklet publication, NOT a speech date)
          publisherTa: meta.source.publisher_ta,
          publisherLocationTa: meta.source.publisher_location_ta,
          scanFilename: meta.source.scan_filename,
          scanTotalPages: meta.source.scan_total_pages,
          frontMatterScanPages: meta.source.front_matter_scan_pages,
          speechScanPages: meta.source.speech_scan_pages,
          scanSha256: meta.source.sha256,
          // Machine-readable textual-authority facts copied directly from the source metadata — the
          // authority evidence for "no Official-Report wording imported", NOT a prose scan.
          onlyTextualAuthority: meta.source.only_textual_authority,
          externalLegislativeTextImported: meta.transcription.external_legislative_text_imported,
          externalLegislativeWordingImported: meta.translation.external_legislative_wording_imported,
          // The booklet is an edited two-House compilation; the source establishes NO single speech date.
          speechFactsNotStated: ["date"],
          speechFactsNoteEn: "The source is an edited two-House booklet compilation of replies across two debates; it establishes no single Assembly/Council speech date. The 1971-05-22 booklet publication date is not a speech date.",
        }
      : {
          publicationTitleTa: meta.title.ta,
          documentType: meta.document_type,
          editionTa: meta.publication.edition_text,
          publicationDate: String(meta.publication.publication_year), // publication year — NOT a speech date/year
          publisherTa: meta.publication.publisher_ta,
          publisherLocationTa: meta.publication.publisher_place_ta,
          coverPriceTa: meta.publication.price_text,
          printerTa: cfg.slug === "idhaya-perikai" ? (meta.publication.printer_ta ?? null) : (meta.publication.printer_source_text ?? null),
          scanFilename: meta.source.filename,
          scanSha256: meta.source.sha256,
          scanFileSizeBytes: meta.source.file_size_bytes,
          scanTotalPages: meta.source.pdf_pages,
          speechScanPages: meta.structure.body_pdf_pages,
          printedSpeechPages: meta.structure.printed_body_pages,
          // SOURCE FACTS, not implementation blockers: the examined source states no speech date,
          // venue, event, occasion or audience — surfaced as such on the provenance page.
          speechFactsNotStated: ["date", "venue", "event", "occasion", "audience"],
          speechFactsNoteEn: meta.speech.source_note,
        },
    transcription: {
      status: cfg.subtype === "assembly-speech" ? meta.transcription.status : meta.workflow.tamil_transcription,
      verifiedAgainstScan: true,
      note: "The frozen Tamil transcript is the authoritative textual layer, verified-complete against the supplied scan; source spelling, punctuation, spacing and unusual/historical forms are preserved. It is copied verbatim here — never re-transcribed, modernised or normalised.",
    },
    translation: {
      status: cfg.subtype === "assembly-speech" ? meta.translation.status : meta.workflow.english_translation,
      type: "faithful reading translation",
      language: "en",
      from: "the frozen verified-complete Tamil transcript",
      englishKind: "project-created",
      note: "Project-created, source-linked English. It is NOT a source-published English edition and is never represented as one.",
    },
    archiveDerived: {
      readingUnits: cfg.subtype === "assembly-speech" ? "two editorial units (a two-House compilation)" : (cfg.expect.printedSections ? `${cfg.expect.printedSections} printed sections` : "a printed compilation of component speeches"),
      sectionHeadings: headings(ta).length,
      englishHeadings: headings(en).length,
      tamilResolvedParagraphs: paragraphs(ta).length,
      englishParagraphs: paragraphs(en).length,
      tamilSourceTextSegments: paragraphs(ta).reduce((n, p) => n + p.segments.length, 0),
      englishSourceTextSegments: paragraphs(en).reduce((n, p) => n + p.segments.length, 0),
      sourcePagesCovered: ta.pages.length,
      pageBasis: cfg.pageBasis,
      note: "Printed section/unit headings are preserved in source order as heading blocks; page markers are provenance only and never enter the reading text. Editorial navigation is never presented as source-numbered scenes/sections.",
    },
    semantics:
      cfg.subtype === "assembly-speech"
        ? {
            dateNull: true,
            twoHouseWitness: true,
            legislatureScopeNote: meta.legislature.scope_note,
            eventTa: meta.speech.event_ta, eventEn: meta.speech.event_en,
            note: "An edited two-House booklet witness: `date` is null (the source is not a single dated Assembly/Council transcript), the legislature name carries both Houses with the source scope note, no single speech date or venue is invented, and the two editorial units are kept distinct rather than collapsed into one homogeneous event. Official Report wording is NOT used as the textual authority — the source states the booklet transcription is the only textual authority.",
          }
        : {
            dateNull: true, venueNull: true, eventNull: true, occasionNull: true, audienceNull: true,
            sourceNote: meta.speech.source_note,
            documentTypeNote: meta.source_form_note,
            ...(cfg.slug === "palli-vazhkkai" ? { compiler: meta.compilation.compiler_ta, namedVenueTa: meta.compilation.named_venue_ta, otherVenuesSourceText: meta.compilation.other_venues_source_text } : {}),
            ...(cfg.slug === "idhaya-perikai" ? { printerUnresolvedNote: meta.publication.printer_source_note } : {}),
            note: "A printed public booklet with NO source-established single speech date, venue, event, occasion or audience — all five stay null. Internal historical dates/places/events in the prose are NOT promoted into these bibliographic fields, and the publication/edition year is never substituted for a speech date. Component boundaries are preserved; no per-component date or venue is manufactured.",
          },
    projectRights: {
      appliesTo: "underlying-work-authored-by-kalaignar",
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null, governmentOrderDate: null, governmentOrderHandoverDate: "2024-12-22",
      distinctionNote: "The booklet's own publisher/edition/printer data is a source/edition fact, distinct from the present rights of Kalaignar's underlying speech.",
      projectTranslationNote: "The English reading layer is a project-created, source-linked faithful translation with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
      evidencePending: "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only.",
    },
    notes: [
      "The controlling source is the supplied scanned booklet; it is NOT vendored. Its identity travels as filename + SHA-256 + size + page map.",
      "Tamil is the frozen verified-complete source transcription; English is the verified-complete faithful reading translation made only from that Tamil. Neither is edited, modernised or normalised during import.",
      "Only the canonical assembled transcript/translation layer is read; audit, progress, handover and batch logs are never parsed as literary text.",
    ],
  };

  const OUT = path.join(process.cwd(), "public/data/speeches", cfg.slug);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "speech.json"), JSON.stringify(speech, null, 1) + "\n");
  fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");
  const shaOf = (f) => sha256(readText(path.join(OUT, f)));
  console.log(`\n${cfg.slug} (${cfg.subtype}) — date:null year:${speech.year}`);
  console.log(`  TA: ${headings(ta).length} headings · ${paragraphs(ta).length} paragraphs · pages ${ta.pages[0]}–${ta.pages[ta.pages.length - 1]} (${ta.pages.length})`);
  console.log(`  EN: ${headings(en).length} headings · ${paragraphs(en).length} paragraphs · pages ${en.pages[0]}–${en.pages[en.pages.length - 1]} (${en.pages.length})`);
  console.log(`  speech.json     ${shaOf("speech.json")}`);
  console.log(`  provenance.json ${shaOf("provenance.json")}`);
  return { slug: cfg.slug };
}

console.log(`import-speeches-wave6 — assembly @ ${AS_COMMIT} · public @ ${PS_COMMIT}`);
for (const cfg of WORKS) buildWork(cfg);
console.log("\nimport-speeches-wave6 — OK (3 works)");
