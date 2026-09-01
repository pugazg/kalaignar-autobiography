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

/**
 * How precisely an archive locates a reading unit within the scans.
 *
 *   "per-unit"  — the assembled source marks scan boundaries INSIDE the text, so each unit's own
 *                 scan span is known (Silappathikaram).
 *   "per-unit-group" — the assembled source marks no inline boundaries, so the only honest
 *                 provenance is the span declared for the whole reading unit. Units then carry NO
 *                 `sourcePages` of their own: claiming a three-scan span for a one-line speech
 *                 would be a precision the archive does not publish.
 *
 * This is recorded rather than inferred from whether `sourcePages` happens to be present, so the
 * reason for the difference stays visible.
 */
export type PlayScanProvenanceKind = "per-unit" | "per-unit-group";

/** A stage direction, in whichever delimiter the edition prints. Never rewritten as prose. */
export type PlayStageDirection = {
  kind: "stage-direction";
  delimiter: "square" | "round";
  text: string;
  hasLineBreaks: boolean;
  /** Present only under `per-unit` scan provenance; see PlayScanProvenanceKind. */
  sourcePages?: PlaySourcePage[];
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
  /** Present only under `per-unit` scan provenance; see PlayScanProvenanceKind. */
  sourcePages?: PlaySourcePage[];
};

/** Quoted classical material set off by the edition's own quotation marks. */
export type PlayVerse = {
  kind: "verse";
  text: string;
  hasLineBreaks: boolean;
  /** Present only under `per-unit` scan provenance; see PlayScanProvenanceKind. */
  sourcePages?: PlaySourcePage[];
};

/** A printed ornament/separator belonging to the edition (e.g. the three centred stars). */
export type PlayOrnament = {
  kind: "ornament";
  text: string;
  hasLineBreaks: boolean;
  /** Present only under `per-unit` scan provenance; see PlayScanProvenanceKind. */
  sourcePages?: PlaySourcePage[];
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

/**
 * WHAT A READING UNIT ACTUALLY IS.
 *
 * A printed play is not always a sequence of numbered scenes, and the model must not pretend it is.
 * `kind` is the source's own answer:
 *
 *   "scene"            — a scene the edition itself numbers and heads (`காட்சி—2`).
 *   "closing-tableau"  — Silappathikaram's `கண்ணகி சிலை நாட்டு விழா`, printed after காட்சி-38
 *                        WITHOUT a scene number. Never Scene 39, never counted among the scenes.
 *   "continuous-body"  — a work the source prints as ONE continuous dramatic text with no scene
 *                        division at all (பரதாயணம், whose archive records `scene: null` and
 *                        assembles a single `continuous-play` file). Its route slug is editorial
 *                        NAVIGATION; it is not, and must never be presented as, "Scene 1".
 */
export type PlayReadingUnitKind = "scene" | "closing-tableau" | "continuous-body";

export type PlayReadingUnit = {
  /** Printed scene number. `null` wherever the source numbers nothing — tableau, continuous body. */
  order: number | null;
  /** Source filename stem — "01".."38", "closing-tableau", "continuous-play". Never re-derived. */
  slug: string;
  kind: PlayReadingUnitKind;
  /** `# காட்சி-N` exactly as printed; `null` where the source heads the unit differently or not at all. */
  headingTa: string | null;
  headingEn: string | null;
  titleTa: string;
  titleEn: string;
  /** Printed setting. `null` where the edition prints none — never inferred. */
  settingTa: string | null;
  settingEn: string | null;
  sourceScans: number[];
  tamil: { units: PlayUnit[] };
  english: { units: PlayUnit[]; notes: PlayNote[] };
};

/**
 * Printed material the source sets BEFORE the dramatic body — Bharathayanam's opening note,
 * Socrates' introductory note (scans 27–28), Cheran Senguttuvan's pre-scene framing voice.
 *
 * It is source text and is published as such, but it is NOT a scene: it is never numbered, never
 * counted in `sceneCount`, never given a route of its own, and never turned into an
 * "Introduction scene". It renders at the head of the reading unit the source prints it before,
 * named by `attachedTo`.
 */
export type PlayOpeningNote = {
  /** The reading-unit slug this printed material immediately precedes in the source. */
  attachedTo: string;
  labelTa: string;
  labelEn: string;
  sourceScans: number[];
  tamil: { units: PlayUnit[] };
  english: { units: PlayUnit[]; notes: PlayNote[] };
};

export type PlaySourceJoinNote = { scan: number; note: string };

/**
 * THE STRUCTURAL DISCRIMINATOR — the source's own answer to "how is this play divided?".
 *
 *   "scene-sequence"  — the edition prints numbered scenes (Silappathikaram, Anarkali, Socrates,
 *                       Cheran Senguttuvan).
 *   "continuous-play" — the edition prints ONE continuous dramatic text with no scene division
 *                       (பரதாயணம்). Its archive records `scene: null` and assembles
 *                       `scenes/continuous-play.md`.
 *
 * This is an EXPLICIT field, deliberately not left to be inferred from `readingUnits.length === 1`
 * or from a null order. A continuous work is a different printed thing from a one-scene play, and
 * the difference has to survive in the data rather than live in undocumented reader behaviour.
 */
export type PlayStructureKind = "scene-sequence" | "continuous-play";

export type Play = {
  workId: string;
  slug: string;
  title: { ta: string; en: string };
  /** The source's own descriptor for the work's form. */
  descriptor: { ta: string; en: string };
  author: { ta: string; en: string };
  /**
   * Edition facts, each present ONLY where the scan prints one. A composite volume prints its
   * publisher, place and price once in shared front matter and prints no year at all, so `year`
   * stays `null` and absent fields stay absent rather than being filled from the collection.
   */
  edition: {
    publisherTa?: string;
    placeTa?: string;
    priceTa?: string;
    copyrightLineTa?: string;
    /** The collection a composite-source work was printed inside, where there is one. */
    collectionTitleTa?: string;
    /** No publication year is printed in these scans; none is ever inferred. */
    year: null;
  };
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  structureKind: PlayStructureKind;
  /**
   * SOURCE-PRINTED scenes only. `0` for a continuous work — a continuous body is not one scene, and
   * reporting it as `1` would fabricate a division the edition does not print.
   */
  sceneCount: number;
  /** Held separate so the catalog never reports 39 scenes. */
  closingTableauCount: number;
  scanProvenance: PlayScanProvenanceKind;
  bodyScans: { from: number; to: number };
  /** Printed pre-dramatic material, where the source prints any. Never a scene. */
  openingNote?: PlayOpeningNote;
  /**
   * The public reading units in source order. For a scene sequence these are the printed scenes
   * (plus, for Silappathikaram, the unnumbered closing tableau); for a continuous work it is the
   * single continuous body. Named `readingUnits` rather than `scenes` because for
   * `continuous-play` the one entry is NOT a scene, and the old name asserted otherwise.
   */
  readingUnits: PlayReadingUnit[];
};

export type PlayProvenance = {
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: {
    scanFilename: string;
    scanSha256: string;
    scanFileSizeBytes: number;
    scanTotalPages: number;
    sourcePdfCommitted: boolean;
    /** How the scan identity above was established — see the importer; never overclaims. */
    scanIdentityBasis: string;
    pageRecordsVerified: string;
    sourceAudit: string;
    assembledLayer: string;
    bodyScans: string;
    publicationYearNote: string;
    /** The collection a composite-source work was printed inside, and this work's extent in it. */
    collectionNote?: string;
    /** Silappathikaram's two-column edition note. Absent where the edition is not set that way. */
    twoColumnNote?: string;
    /** Silappathikaram's closing tableau. Absent for every work that prints no tableau. */
    closingTableauNote?: string;
    /** A continuous work's structural note — why it has no scenes and no "Scene 1". */
    continuousStructureNote?: string;
    /** Printed pre-dramatic material and why it is not counted as a scene. */
    openingNoteNote?: string;
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
    /** 1 where the source prints a continuous dramatic body, otherwise 0. */
    continuousBodies?: number;
    /** 1 where the source prints pre-dramatic material, otherwise 0. Never counted as a scene. */
    openingNotes?: number;
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
    /** Present only under `per-unit` scan provenance. */
    printedPageNumbersPresent?: number;
    printedPageNumbersAbsent?: number;
    translationNotes: number;
    interpretiveNotes: number;
    /** Present only for a work that actually carries obstruction markers. */
    obstructionMarkers?: number;
    note: string;
    speakerNote: string;
    unlabelledNote: string;
  };
  /**
   * Source areas the archive could not resolve. ABSENT — not an empty array rendered as a warning —
   * where the work has none: an empty "unresolved source area" card would imply a problem the
   * archive does not report.
   */
  unresolved?: {
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
    /** Present only where a third-party published witness exists for this work. */
    publishedWitnessNote?: string;
    projectTranslationNote: string;
    archivalStatusNote: string;
    evidencePending: string;
  };
  notes: string[];
};

export const PLAY_SLUGS = [
  "silappathikaram-nataka-kappiyam",
  // ── Bulk Onboarding Wave 1 — the four plays of கலைஞரின் நான்மணி மாலை, appended in the
  // composite source's own printed order (scans 6–17, 18–26, 27–43, 44–53). They share one
  // controlling scan and one historical source pin, which is NOT the Silappathikaram pin.
  // மணிமகுடம் is deliberately absent: its source processing is still active upstream.
  "bharathayanam",
  "anarkali",
  "socrates",
  "cheran-senguttuvan",
] as const;
export type PlaySlug = (typeof PLAY_SLUGS)[number];
