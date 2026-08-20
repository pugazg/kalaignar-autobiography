// Fiction — Novels (புனைகதை) — Digital Library Phase 6. Source-faithful novel readers built from the
// authoritative fiction source repository (pugazg/kalaignar-novels). Data-driven like the other
// Reading Rooms: the work is vendored to public/data/novels/<slug>/{novel.json, provenance.json} by
// a deterministic, work-specific importer (scripts/import-<slug>.mjs) that pins the exact source
// commit. Runtime never calls GitHub and the source PDF is never vendored.
//
// A NOVEL IS NOT A SPEECH, A POEM, AN ARTICLE OR A SCENE. The governing Digital Library rule — ONE
// coherent library, MULTIPLE source-faithful reader types — gives Fiction its own reader and its own
// narrow model:
//
//   * a SPEECH is one prose stream with printed section headings;
//   * a POEM's unit is the source LINE;
//   * an ARTICLE publication is a set of independently titled, source-numbered articles;
//   * this NOVEL is ONE continuous narrative divided by the SOURCE ARCHIVE's own assembled reading
//     layer into three ordered SECTIONS — and one of those sections is an embedded sequence, not a
//     separate work.
//
// ── THE EMBEDDED-SEQUENCE RULE (a source fact, not a presentation choice) ────────────────────────
// `ராயசம் வெங்கண்ணு — தஞ்சை சரித்திரக் கதை` is NOT a separate work. The source archive states this
// explicitly after a full read of scans 4–33: it is a cinematic/historical sequence staged INSIDE
// `பலிபீடம் நோக்கி`, introduced on scan 7 (`படக்காட்சி ஆரம்பமாகிறது…`) and exited on scan 30
// (`படம் முடிந்துவிட்டது…`). It therefore gets NO separate catalog work, no separate provenance
// identity and no separate route — only a section inside this one novel, carrying its own
// source-printed heading. `isEmbeddedSequence` marks it so no downstream change can quietly promote
// it into a second work.

/** A printed-source page this block came from. `printedPage` is null where the scan shows none. */
export type NovelSourcePage = { scan: number; printedPage: number | null };

// One block of the assembled reading layer.
//
//   "paragraph" — narrative prose, dialogue or screenplay-style direction, exactly as assembled.
//   "heading"   — a heading PRINTED IN THE SOURCE (the work title, the internal sequence's title
//                 card and its subtitle).
//   "ornament"  — a printed ornament that belongs to the work (the scan-7 ★, the scan-33 ✾).
export type NovelBlock = {
  kind: "paragraph" | "heading" | "ornament";
  /** Heading depth where `kind` is "heading" (1 = title, 2 = subtitle …). */
  level?: number;
  /**
   * Verbatim assembled text. Intentional source line breaks (the film-credit lines, the closing
   * lineated address) are preserved as newlines and rendered with `whitespace-pre-line` — the
   * Phase-4 Poetry lesson: a hard break inside one block is source structure, not decoration.
   */
  text: string;
  /** True when the block carries intentional internal line breaks. */
  hasLineBreaks: boolean;
  /** Scans this block is attributed to, from the assembled layer's own provenance comments. */
  sourcePages: NovelSourcePage[];
};

// A cross-page continuity the source audit established and the assembled layer applied. These are
// SOURCE-ESTABLISHED joins, recorded verbatim — this integration never invents one, and never
// re-splits a join the archive already made.
export type NovelSourceJoin = {
  fromScan: number;
  toScan: number;
  /** Verbatim comment text from the assembled layer. */
  evidence: string;
};

export type NovelBilingualText = { ta: string; en: string };

// A translator/editorial note released with the English layer. The source keeps these in labelled
// apparatus sections; they are carried OUTSIDE the body so they can never read as Kalaignar's prose.
export type NovelNote = { kind: "translator-note"; heading: string; text: string };

export type NovelSection = {
  /** Source-assembled order (1–3). Not archive-invented numbering: the assembled layer defines it. */
  order: number;
  slug: string;
  titleTa: string;
  titleEn: string;
  /** The assembled layer's own scan-coverage statement, verbatim. */
  sourceScansTa: string;
  sourceScansEn: string;
  /**
   * TRUE only for the `ராயசம் வெங்கண்ணு` sequence. It is an internal sequence of this novel, never a
   * separate work.
   */
  isEmbeddedSequence: boolean;
  /**
   * Section titles come from the archive's assembled reading layer, which writes its own label at
   * the top of each file. `titleIsPrintedHeading` is true only when the 1947 edition prints that
   * exact heading; `carriesArchiveSectionLabel` is true when the label was archive-only and was
   * therefore kept OUT of the reading body (no page provenance is asserted for it). The reader
   * states which, so an archive division is never read as a printed chapter.
   */
  titleIsPrintedHeading: boolean;
  carriesArchiveSectionLabel: boolean;
  tamil: { blocks: NovelBlock[] };
  english: { blocks: NovelBlock[]; notes: NovelNote[] };
};

export type Novel = {
  workId: string;
  slug: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  shelf: "fiction";
  readerStructure: "novel";
  subtype: "novel";
  title: NovelBilingualText;
  author: NovelBilingualText;
  /** Edition facts exactly as the scan shows them; nothing inferred. */
  edition: {
    statementTa: string;
    year: number;
    monthTa: string;
    publisherTa: string;
    placeTa: string;
    districtTa: string;
    seriesTa: string;
    priceTa: string;
    printerTa: string;
    printedCode: string;
  };
  sections: NovelSection[];
  sectionCount: number;
  /** Scans the body covers. */
  bodyScans: { from: number; to: number };
};

export type NovelProvenance = {
  workId: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: {
    titleTa: string;
    titleEn: string;
    authorTa: string;
    scanFilename: string;
    scanSha256: string;
    scanFileSizeBytes: number;
    scanTotalPages: number;
    pageRecordsVerified: string;
    sourceAudit: string;
    assembledLayer: string;
    sourcePdfCommitted: false;
    editionTa: string;
    publisherTa: string;
    placeTa: string;
    seriesTa: string;
    priceTa: string;
    printerTa: string;
    printedCode: string;
    printedPageNumbering: string;
    bodyScans: string;
    /** The embedded-sequence rule, stated as the source states it. */
    embeddedSequenceNote: string;
    sourceContinuity: string[];
    lockedExclusions: string[];
  };
  english: {
    kind: "project-created";
    status: string;
    batches: string;
    bodyCoverage: string;
    bilingualAlignment: string;
    releaseReadiness: string;
    translatorNotesSeparated: string;
  };
  archiveDerived: {
    sections: number;
    tamilBlocks: number;
    englishBlocks: number;
    tamilParagraphs: number;
    englishParagraphs: number;
    tamilHeadings: number;
    englishHeadings: number;
    /** Every heading the 1947 edition actually prints, with the scan(s) that print it. */
    printedHeadingsInSource: { text: string; scans: number[] }[];
    /** Sections whose assembled-layer label is printed nowhere, so it was kept out of the body. */
    sectionsWithArchiveOnlyTitle: number;
    ornaments: number;
    tamilBlocksWithLineBreaks: number;
    englishBlocksWithLineBreaks: number;
    translatorNotes: number;
    sourceEstablishedJoins: number;
    joins: NovelSourceJoin[];
    embeddedSequenceSections: number;
    note: string;
    joinNote: string;
    provenanceGranularity: string;
  };
  projectRights: {
    appliesTo: string;
    rightsStatus: string;
    rightsAuthority: string;
    rightsAction: string;
    rightsAnnouncementDate: string;
    governmentOrderNumber: string | null;
    governmentOrderDate: string | null;
    governmentOrderHandoverDate: string | null;
    distinctionNote: string;
    thirdPartyNote: string;
    projectTranslationNote: string;
    archivalStatusNote: string;
    evidencePending: string;
  };
  notes: string[];
};

// Integrated novel slugs (build/import authority; the public catalog entry lives in
// data/library.ts). This benchmark integrates exactly one novel.
export const NOVEL_SLUGS = ["balipeedam-nokki"] as const;
export type NovelSlug = (typeof NOVEL_SLUGS)[number];
