// Speeches (உரைகள்) — Digital Library Phase 3. Source-faithful speech readers built from the
// authoritative speech source repositories (pugazg/kalaignar-assembly-speeches,
// pugazg/kalaignar-public-speeches). Data-driven like the other Reading Rooms: each speech is
// vendored to public/data/speeches/<slug>/{speech.json, provenance.json} by a deterministic,
// work-specific importer (scripts/import-<slug>.mjs) that pins the exact source commit.
//
// A speech is NOT a scene reader: it is long-form prose with printed section headings, rendered
// in source order. Printed section headings and source-page boundaries are preserved; no
// archive-created navigation numbering is presented as printed source numbering.

// A source-fidelity note (reviewer correction): a source-page boundary is NOT a paragraph
// boundary. One LOGICAL paragraph may span several source pages. So a paragraph holds ordered
// per-source-page text SEGMENTS, each carrying its own source page, joined for reading by an
// explicit `joinToNext`:
//   - "none"    = the source splits a WORD across the page → join with NO space;
//   - "space"   = an ordinary cross-page word boundary → single space;
//   - "unknown" = the exact printed joined-vs-spaced form is UNRESOLVED (scan-pending). The
//                 reader must NOT silently choose a space or a concatenation — it renders a
//                 neutral inline source-page marker between the two fragments.
//   - "end"     = last segment of the paragraph.
// Each `segment.text` is the exact source text line, verbatim (source Markdown emphasis kept).
export type SpeechJoin = "space" | "none" | "unknown" | "end";

export type SpeechTextSegment = {
  text: string;
  sourcePage: number | null;
  joinToNext: SpeechJoin;
};

export type SpeechParagraph = {
  kind: "paragraph";
  segments: SpeechTextSegment[];
  sourcePages: number[]; // the source pages this one logical paragraph spans
};

export type SpeechHeading = { kind: "heading"; text: string; sourcePage?: number | null };
export type SpeechNote = { kind: "note"; text: string; sourcePage?: number | null };

// A NEUTRAL boundary whose paragraph RELATIONSHIP could not be established from the archive text
// (a sentence completes at the page edge and the next page opens a new sentence — same printed
// paragraph or a new one is scan-pending). The reader groups the runs on either side into a
// single non-`<p>` group so this asserts NEITHER a paragraph break NOR a continuation.
export type SpeechUnresolvedBreak = { kind: "unresolved-break"; toPage: number; relation: "unknown"; note?: string };

// One ordered block of a speech's Tamil or English stream.
export type SpeechBlock = SpeechParagraph | SpeechHeading | SpeechNote | SpeechUnresolvedBreak;

export type SpeechBilingualName = { nameTa: string; nameEn: string; roleTa?: string; roleEn?: string };
export type SpeechBilingualText = { ta: string; en: string };

// Common fields shared by every speech subtype. The Tamil stream is authoritative; the English
// stream is the verified faithful reading translation.
type SpeechBase = {
  workId: string;
  slug: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  shelf: "speeches";
  readerStructure: "speech";
  // ISO date where the SOURCE establishes it. `null` when the examined source states no speech
  // date — a publication/edition date is never substituted for a speech date.
  date: string | null;
  year: number | null;
  title: SpeechBilingualText;
  speechType: string;
  speaker: SpeechBilingualName;
  transcriptionStatus: string; // verbatim released status
  translationStatus: string;
  tamil: { sectionTitleTa: string; blocks: SpeechBlock[] }; // authoritative source transcription
  english: { sectionTitleEn: string; blocks: SpeechBlock[] }; // verified faithful translation
  sourcePages: number[]; // exact source pages the Tamil transcription covers
};

// A legislative-assembly speech: it has a legislature and a parliamentary event/context. These
// fields are ASSEMBLY-SPECIFIC — they are not forced onto a public speech as empty placeholders.
export type AssemblySpeech = SpeechBase & {
  subtype: "assembly-speech";
  legislature: { nameTa: string; nameEn: string };
  event: SpeechBilingualText;
};

// A public speech: it has a source-established VENUE. `event` / `occasion` / `audience` are
// OPTIONAL and stay unset unless the source establishes them (no fake college-function/meeting is
// inferred from a venue). A public speech has NO legislature.
export type PublicSpeech = SpeechBase & {
  subtype: "public-speech";
  // Every one of these is OPTIONAL because a booklet may establish none of them. `venue` is null
  // when the examined source does not state one (Arappor); it carries the source-stated venue when
  // it does (Poonthottam). Nothing here is ever inferred from an edition/publication fact.
  venue?: SpeechBilingualText | null;
  event?: SpeechBilingualText | null;
  occasion?: SpeechBilingualText | null;
  audience?: SpeechBilingualText | null;
};

// Vendored per-speech content (speech.json). Discriminated on `subtype` so assembly-specific and
// public-specific metadata each stay honestly typed rather than a bag of nullable assembly fields.
export type Speech = AssemblySpeech | PublicSpeech;

// Provenance manifest (provenance.json).
export type SpeechProvenance = {
  workId: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: {
    publicationTitleTa: string;
    authorTa?: string;
    editionTa?: string;
    publicationDate?: string;
    publisherTa?: string;
    publisherLocationTa?: string;
    printerTa?: string;
    printerLocationTa?: string;
    coverPriceTa?: string;
    scanFilename: string;
    scanTotalPages: number;
    speechScanPages: string;
    frontMatterScanPages?: string;
    advertisementScanPages?: string;
    // Optional source facts some editions establish and others do not (never fabricated):
    scanSha256?: string; // published only where the source archive records a scan checksum
    scanFileSizeBytes?: number;
    printedSpeechPages?: string; // printed page range when it differs from the PDF/scan range
    // The 2007 assembly anthology records the SAME fact under a different key. Verified as the
    // same concept, not assumed from the similar name: in both eras it is the speech's printed
    // range where it differs from the scan range (poonthottam scan 6–17 / printed 5–16; the
    // anthology 199–240 / 198–239). Both spellings are kept rather than one being renamed, because
    // each is the key its own archive era actually writes.
    speechPrintedPages?: string;
    salesRightsTa?: string; // the anthology names a separate sales-rights imprint
    publicationDatePrintedTa?: string; // the printed form of the publication date, where given
    scanToPrintedRelationship?: string; // e.g. "scan page = printed page + 1"
    sourceAuthority?: string;
    speechSourceLabelTa?: string; // the anthology's own label for the speech, e.g. "உரை : 7"
    speechPrintedDate?: string;
    firstEditionTa?: string; // a distinct first-edition statement, where the edition prints one
    publisherAddressTa?: string; // fuller publisher address, where recorded
    // Third-party front-matter note (e.g. a publisher preface author/date). This field is written
    // in ENGLISH, so the reader must mark it lang="en" even when the surrounding UI is Tamil.
    editionMatterNoteEn?: string;
    // Explicit record that the examined source states no speech date / venue / event. These are
    // SOURCE FACTS, not implementation blockers, and are surfaced as such on the provenance page.
    speechFactsNotStated?: string[];
    speechFactsNoteEn?: string;
  };
  transcription: Record<string, unknown>; // verbatim from source metadata.json
  translation: Record<string, unknown>; // verbatim from source metadata.json
  archiveDerived: {
    sectionHeadings?: number;
    tamilResolvedParagraphs?: number; // clean logical paragraphs (may span source pages)
    tamilUnresolvedGroupRuns?: number; // runs inside an unresolved-relationship group
    englishParagraphs?: number;
    tamilSourceTextSegments?: number; // physical per-source-page fragments
    englishSourceTextSegments?: number;
    tamilCrossPageParagraphs?: number;
    englishCrossPageParagraphs?: number;
    sourcePagesCovered?: number;
    // Source-audited results over all Tamil page transitions (explicit table, not punctuation).
    // Present ONLY where the archive actually adjudicated each transition. The 2007 anthology
    // has no such table and records crossPageJoinPolicy instead.
    boundaryAudit?: {
      tamilTransitions: number;
      sameParagraph: number;
      paragraphBoundary: number;
      headingBoundary: number;
      unknownParagraphRelation: number;
      lexicalJoinNone: number; // join with NO space
      lexicalJoinSpace: number;
      lexicalJoinUnknown: number; // unresolved spacing (scan-pending), never silently spaced
    };
    englishBoundaryAudit?: {
      englishAnchors: number;
      paragraphBoundary: number;
      headingNoteBoundary: number;
      sameParagraphContinuations: number;
      note: string;
    };
    note?: string;
    // ── Anthology form. The 2007 assembly anthology reports its own counts; they are NOT
    // interchangeable with the legacy metrics above and are never rendered under a legacy label.
    tamilSourcePages?: number;
    englishSourcePages?: number;
    tamilBlocks?: number;
    englishBlocks?: number;
    tamilHeadings?: number;
    englishHeadings?: number;
    tamilParagraphs?: number;
    tamilUnresolvedBreaks?: number;
    englishUnresolvedBreaks?: number;
  };
  // Known blockers — source facts only the controlling scan can resolve, each represented as
  // unresolved in the data and rendered neutrally (never guessed).
  blockers?: {
    item: string;
    count: number;
    detail: string;
    resolution: string;
  }[];
  // Present project-level rights of the underlying Kalaignar-authored work (see Manohara model).
  /** Absent where the archive establishes no rights position for the work. */
  projectRights?: {
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
    evidencePending: string;
  };
  /** Absent where the archive records no curatorial notes for this speech. */
  notes?: string[];

  // ── TWO BOUNDARY-EVIDENCE MODELS, DELIBERATELY NOT MERGED ──────────────────────────────────────
  //
  // `archiveDerived.boundaryAudit` (benchmark speeches) records a per-transition classification:
  // each physical page boundary was examined and filed as same-paragraph, paragraph boundary, or an
  // unresolved relation. That is a strong claim and only those speeches can make it.
  //
  // `crossPageJoinPolicy` (2007 assembly anthology) records something weaker and different: the
  // archive's normalisation POLICY was applied, and no per-boundary adjudication exists. Rendering
  // the second under the first's wording would upgrade policy-derived evidence into scan-by-scan
  // adjudication, so the reader must keep them apart.
  crossPageJoinPolicy?: {
    policy: "space";
    basis: "archive-normalisation-rule";
    individualAdjudication: false;
    appliedBoundaries: number;
    unresolvedBoundaries: number;
    note: string;
  };

  /** The archive's machine-readable registry status for this speech. */
  archiveVerification?: {
    registry: string;
    transcriptionStatus: string;
    verifiedAgainstScan: boolean;
    translationStatus: string;
  };

  /**
   * Release evidence. Some speeches carry an explicit per-speech release block; others are covered
   * only by the archive registry. `releaseReady` is present ONLY where the source states it.
   */
  releaseReadiness?: {
    basis: "per-speech-release-block" | "archive-index";
    explicitPerSpeechReleaseBlockPresent: boolean;
    releaseReady?: boolean;
    note: string;
  };
};

// Lightweight catalog of integrated speech slugs (build/import authority; the public catalog
// entry lives in data/library.ts). One benchmark per subtype so far: an assembly speech
// (udhaya-kathir) and a public speech (poonthottam).
export const SPEECH_SLUGS = [
  "udhaya-kathir",
  "poonthottam",
  "arappor",
  // The 2007 assembly anthology — one speech per dated sitting, slugs taken verbatim from the
  // source archive's own ids so a route is traceable straight back to its source directory.
  "1963-03-21-industries-debate",
  "1981-04-16-industries-debate",
  "1989-05-03-industries-debate",
  "1990-04-18-industries-debate",
  "1996-08-14-industries-debate",
  "1997-04-23-industries-debate",
  "1998-05-14-industries-debate",
  "1999-04-29-industries-debate",
  "2000-05-08-industries-debate",
  "2006-08-23-industries-debate",
] as const;
export type SpeechSlug = (typeof SPEECH_SLUGS)[number];
