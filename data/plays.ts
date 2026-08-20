// ── Kalaignar Digital Library — Drama / Stage Plays ──────────────────────────────────────────────
//
// The model for a PRINTED STAGE PLAY. It is deliberately NOT the cinema `scene` model used by
// Manohara: that work is a screenplay-dialogue booklet indexed as scene/dialogue records, whereas
// this is the printed dramatic text of a published stage edition, whose structure is carried by the
// source archive's own verified page records and assembled scene files.
//
// Everything here is derived by `scripts/import-silappathikaram.mjs` from a pinned commit of
// `pugazg/kalaignar-stage-plays`. Nothing in the generated data is hand-edited.
//
// ── What the printed source actually contains ────────────────────────────────────────────────────
//
// The 1st-edition text is set in TWO COLUMNS. A speech begun at the foot of the left column
// continues at the head of the right column, and the source does NOT reprint the speaker label
// there. The archive preserves that exactly — it never invents the missing label. So a dialogue unit
// carries `speakerAsPrinted: string | null`, where `null` means *the source prints no label at this
// point*, not "unknown speaker" and never "same speaker as above". Attributing such a unit to the
// preceding speaker would be inventing provenance the edition does not supply.
//
// Stage directions appear in two printed delimiters — square brackets and parentheses. The
// STAGE_PLAY_PROCESSING_GUIDE treats both as source-supported direction forms, so the delimiter the
// edition used is recorded rather than normalised to one house style.

export type PlaySourcePage = {
  scan: number;
  /**
   * The folio EXACTLY AS PRINTED, or `null` where the scan shows none (47 of the 88 do not print
   * one). It is a string, not a number, because this edition numbers its front matter in Roman
   * (`iii`, `xvi`) and its body in Arabic (`6`, `48`). A Roman folio is not the integer 3, and
   * flattening it would destroy a printed distinction the source deliberately makes.
   */
  printedPage: string | null;
};

/** A stage direction, in whichever delimiter the edition prints. Never rewritten as prose. */
export type PlayStageDirection = {
  kind: "stage-direction";
  delimiter: "square" | "round";
  text: string;
  hasLineBreaks: boolean;
  sourcePages: PlaySourcePage[];
};

/**
 * One printed speech. `speakerAsPrinted` is the RENDERED AUTHORITY — the label exactly as the
 * edition sets it, abbreviations and spacing included. The source abbreviates the same character
 * inconsistently (`செங்குட்டுவன்` / `செங்குட்டு` / `செங்கு`); those are source data and are never
 * expanded, normalised or unified. `null` means the edition prints no label here.
 */
export type PlayDialogue = {
  kind: "dialogue";
  speakerAsPrinted: string | null;
  /**
   * The label/​speech separator EXACTLY as printed. The edition sets both `கோவ : ` and
   * `கி.கிழவர்: `; normalising that spacing would be a silent punctuation change, so it is carried
   * rather than regularised. `null` where no label is printed.
   */
  speakerSeparator: string | null;
  text: string;
  hasLineBreaks: boolean;
  sourcePages: PlaySourcePage[];
};

/** Quoted classical material set off by the edition's own quotation marks. */
export type PlayVerse = {
  kind: "verse";
  text: string;
  hasLineBreaks: boolean;
  sourcePages: PlaySourcePage[];
};

/** A printed ornament/separator belonging to the edition (e.g. the three centred stars). */
export type PlayOrnament = {
  kind: "ornament";
  text: string;
  hasLineBreaks: boolean;
  sourcePages: PlaySourcePage[];
};

export type PlayUnit = PlayStageDirection | PlayDialogue | PlayVerse | PlayOrnament;

/**
 * Apparatus released WITH the English layer and held strictly outside the reading body.
 * `interpretive-note` is the archive's own "Dravidian movement resonance" commentary, which the
 * source itself labels "interpretive context, not translated source text" — so it is neither
 * Kalaignar's words nor part of the translation, and must never render as either.
 */
export type PlayNote = {
  kind: "translation-note" | "interpretive-note";
  text: string;
};

export type PlayScene = {
  /** Printed scene number. `null` for the closing tableau, which the source does NOT number. */
  order: number | null;
  /** Source filename stem — "01".."38", "closing-tableau". Never re-derived from the title. */
  slug: string;
  /** `# காட்சி-N` exactly as printed; the tableau prints its own heading instead. */
  headingTa: string | null;
  headingEn: string | null;
  titleTa: string;
  titleEn: string;
  /** Printed setting. `null` on the scenes where the edition prints none — never inferred. */
  settingTa: string | null;
  settingEn: string | null;
  sourceScans: number[];
  /**
   * TRUE only for `கண்ணகி சிலை நாட்டு விழா`. The source prints it after காட்சி-38 and after three
   * centred stars, without a scene number. It is NOT Scene 39 and must never be numbered, counted
   * as a scene, or merged into Scene 38. The importer refuses to run if this stops holding.
   */
  isClosingTableau: boolean;
  tamil: { units: PlayUnit[] };
  english: { units: PlayUnit[]; notes: PlayNote[] };
};

export type PlaySourceJoinNote = { scan: number; note: string };

export type Play = {
  workId: string;
  slug: string;
  title: { ta: string; en: string };
  descriptor: { ta: string; en: string };
  author: { ta: string; en: string };
  edition: {
    publisherTa: string;
    placeTa: string;
    priceTa: string;
    copyrightLineTa: string;
    /** No publication year is printed anywhere in the scan; none is inferred. */
    year: null;
  };
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  sceneCount: number;
  /** Held separate so the catalog never reports 39 scenes. */
  closingTableauCount: number;
  bodyScans: { from: number; to: number };
  scenes: PlayScene[];
};

export type PlayProvenance = {
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: {
    scanFilename: string;
    scanSha256: string;
    scanFileSizeBytes: number | null;
    scanTotalPages: number;
    sourcePdfCommitted: boolean;
    pageRecordsVerified: string;
    sourceAudit: string;
    assembledLayer: string;
    bodyScans: string;
    publicationYearNote: string;
    twoColumnNote: string;
    closingTableauNote: string;
  };
  english: {
    kind: "project-created";
    status: string;
    independence: string;
    secondaryWitnessNote: string;
    notesSeparated: string;
  };
  archiveDerived: {
    scenes: number;
    closingTableau: number;
    tamilUnits: number;
    englishUnits: number;
    tamilDialogue: number;
    tamilStageDirections: number;
    tamilVerse: number;
    ornaments: number;
    distinctSpeakerLabels: number;
    unlabelledDialogueUnits: number;
    scenesWithoutPrintedSetting: number;
    multiScanScenes: number;
    printedPageNumbersPresent: number;
    printedPageNumbersAbsent: number;
    translationNotes: number;
    interpretiveNotes: number;
    obstructionMarkers: number;
    note: string;
    speakerNote: string;
    unlabelledNote: string;
  };
  unresolved: {
    marker: string;
    scan: number;
    description: string;
    policy: string;
  }[];
  lockedExclusions: string[];
  projectRights: {
    appliesTo: string;
    rightsStatus: string;
    rightsAuthority: string;
    rightsAction: string;
    rightsAnnouncementDate: string;
    governmentOrderNumber: string | null;
    governmentOrderDate: string | null;
    governmentOrderHandoverDate: string;
    distinctionNote: string;
    thirdPartyNote: string;
    publishedWitnessNote: string;
    projectTranslationNote: string;
    archivalStatusNote: string;
    evidencePending: string;
  };
  notes: string[];
};

export const PLAY_SLUGS = ["silappathikaram-nataka-kappiyam"] as const;
export type PlaySlug = (typeof PLAY_SLUGS)[number];
