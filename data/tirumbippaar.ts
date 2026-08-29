// Cinema Writing — திரும்பிப்பார்! / Tirumbippaar (Digital Library Phase D2.1). Types for the
// generated reader data under public/data/cinema/tirumbippaar/, produced by
// scripts/import-tirumbippaar.mjs from a pinned commit of pugazg/kalaignar-cinema-works.
// Runtime never calls GitHub.
//
// ── A WORK-SPECIFIC MODEL, NOT A CINEMA FRAMEWORK ────────────────────────────
// This is the third work on the திரை எழுத்து shelf and it is deliberately NOT modelled on the
// other two. Manohara's booklet prints no scene numbers at all, so its 57 units are an
// archive-created navigation layer. Parasakthi's booklet prints its headings but skips two and
// transposes two more, so absence and misnumbering are facts its data must carry. Tirumbippaar
// prints 93 headings consecutively with no gaps, no repeats and no renumbering — so it has no
// absent-heading or correction machinery, and adding any would be inventing structure the source
// does not have.
//
// ── WHAT THE READER MUST NOT DO WITH THIS DATA ───────────────────────────────
//   * Never rebuild a Tamil line from `speakerLabel` + `text`. The Tamil `text` ALREADY carries the
//     printed label and its exact spacing (`பாண்டியன் : தொழிலாளர்கள்` — note the space before the
//     colon, which the booklet prints). Recomposing it would silently normalise punctuation that was
//     settled against the controlling scan. `speakerLabel` exists for styling and grouping only.
//   * Never treat `tamilDialogueBlocks` as the dialogue-record count. They are different
//     granularities: 923 speaker-labelled reading blocks against 1042 immutable dialogue records,
//     because ten scenes print one long speech across several paragraphs that the archive indexes as
//     several records. Neither layer derives from the other, and forcing them to agree would corrupt
//     one of them.
//   * Never render a `separator` block as text. It is the booklet's decorative scene divider, kept
//     structural so the reading layer stays faithful without turning ornament into prose.
//   * Never regularise a scene heading. Scene 5 prints `காட்சி 5[`, scene 36 prints no closing glyph
//     at all, and scene 43 prints `காட்சி 43].`. All three are source typography, adjudicated
//     upstream against the scan.
//   * Never present song attribution as settled. Five of the eight occurrences are unresolved and
//     stay unresolved, and none is Kalaignar's: the cover credits story and dialogue, which is not a
//     lyric credit.
//   * Never treat the 1953 `உரிமையுடையது.` notice as a present-day rights determination. It is
//     preserved as printed source evidence and nothing more.

/** A Tamil reading block's kind, from what the source itself marks. */
export type TirumbippaarBlockKind = "dialogue" | "stage-direction" | "verse" | "prose" | "separator";

/**
 * One Tamil reading block, in source order.
 *
 * `text` is verbatim from the archive's scan-adjudicated scene derivative, including the speaker
 * label on a dialogue block. It is rendered, never reassembled.
 */
export type TirumbippaarTamilBlock = {
  kind: TirumbippaarBlockKind;
  /** Present only on `dialogue`; the exact printed label, already inside `text`. */
  speakerLabel?: string;
  text: string;
};

/**
 * English unit kinds as the archive publishes them.
 *
 * `song` exists in the union but is always zero here: the booklet prints no complete lyric body for
 * either source-named song, so the seven `song-reference` units record performance references only.
 */
export type TirumbippaarUnitKind =
  | "dialogue"
  | "stage-direction"
  | "song"
  | "song-reference"
  | "chant"
  | "written-text";

/** A page in the controlling scan. `printedPage` is always `pdfPage − 8` for this booklet. */
export type TirumbippaarPage = {
  pdfPage: number;
  printedPage: number;
  /** Set only where the archive marks a page as carrying no speaker-labelled dialogue. */
  zeroDialogue?: boolean;
};

/** One English unit, source-linked to the immutable Tamil layer. */
export type TirumbippaarEnglishUnit = {
  id: string;
  kind: TirumbippaarUnitKind;
  /** The EXACT Tamil source label, never expanded to an English name. Null where the source prints none. */
  speakerLabel: string | null;
  /** The immutable dialogue record this renders, where one exists. Each is linked exactly once. */
  sourceRecordId: string | null;
  sourceOccurrenceId: string | null;
  /** More than one page on the twelve genuine cross-page units; never collapsed to a single page. */
  pageProvenance: TirumbippaarPage[];
  text: string;
  notes: string[];
};

/** A song/performance occurrence. Attribution is evidence, not a settled credit. */
export type TirumbippaarSongItem = {
  id: string;
  canonicalScene: number;
  kind: string | null;
  sourceTextTa: string | null;
  /** How much of the song the booklet actually prints — never a full lyric body in this work. */
  printedTextExtent: string | null;
  authorshipStatus: string | null;
  lyricistTa: string | null;
  evidenceBasis: string | null;
};

/** A scene as listed in the registry, without its reading payload. */
export type TirumbippaarSceneStub = {
  slug: string;
  canonicalScene: number;
  /** Always equal to `canonicalScene` in this work; carried because other cinema works differ. */
  sourceHeading: number;
  /** The heading exactly as the derivative prints it, anomalies included. */
  headingTa: string;
  startPdfPage: number;
  startPrintedPage: number;
  tamilBlockCount: number;
  dialogueBlockCount: number;
  englishUnitCount: number;
};

/** A scene's full reading payload. */
export type TirumbippaarScene = {
  workId: "tirumbippaar";
  slug: string;
  canonicalScene: number;
  sourceHeading: number;
  headingTa: string;
  canonicalPart: string;
  continuationNotes: string[];
  pageProvenance: TirumbippaarPage[];
  tamil: { blocks: TirumbippaarTamilBlock[] };
  english: { units: TirumbippaarEnglishUnit[] };
};

export type TirumbippaarIndex = {
  workId: "tirumbippaar";
  titleTa: string;
  sourceTitleTa: string;
  titleEn: string;
  shelf: "cinema-writing";
  readerStructure: "scene";
  /** The booklet prints its own headings, so the numbering is source structure, not navigation. */
  sceneNumbering: "source-printed";
  sceneCount: number;
  canonicalSceneRange: string;
  scenes: TirumbippaarSceneStub[];
  songs: TirumbippaarSongItem[];
};

export type TirumbippaarProvenance = {
  workId: "tirumbippaar";
  sourceRepo: string;
  sourcePath: string;
  /** The archive's CI publication commit — its authoritative checkpoint, not merely a last-touch commit. */
  sourceCommit: string;
  sourceCommitNote: string;
  source: {
    identifier: string;
    filename: string;
    scanSha256: string;
    pdfPages: number;
    canonicalPdfPages: string;
    canonicalPrintedPages: string;
    printedPageFormula: string;
    scanType: string;
    editionAsPrinted: string;
    publicationYearAsPrinted: number;
    controllingSourceNote: string;
  };
  creditsAsPrinted: { coverRoleTa: string; coverNameTa: string; note: string };
  /** 1953 statements recorded as printed evidence. Never a present-day determination. */
  historicalNotices: { rightsNoticeAsPrinted: string; priceAsPrinted: string; note: string };
  /** The front-matter printer line is cropped in the scan and is never reconstructed. */
  frontMatterCrop: { pdfPage: number; visiblePartialReading: string; status: string; note: string };
  structure: {
    sceneHeadingsObserved: number;
    canonicalRange: string;
    /** Always empty here; this work skips no headings. */
    headingsNotObserved: number[];
    numberingNote: string;
    headingAnomalies: { canonicalScene: number; printed: string; note: string }[];
    anomalyNote: string;
  };
  tamil: {
    authority: string;
    sceneDerivatives: number;
    dialogueRecords: number;
    /** The reading layer's own census — deliberately not equal to `dialogueRecords`. */
    tamilDialogueBlocks: number;
    separatorBlocks: number;
    granularityNote: string;
    canonicalPages: number;
    zeroDialogueScenes: number[];
    zeroDialogueNote: string;
    verificationNote: string;
    settledReadings: Record<string, string>;
  };
  english: {
    authority: string;
    kind: string;
    kindBasis: string;
    translationUnits: number;
    unitKindCounts: Record<TirumbippaarUnitKind, number>;
    crossPageUnits: number;
    scenesVerified: number;
    noFullSongUnitsNote: string;
    readerEditionQa: string;
    qaNote: string;
  };
  characters: { authority: string; entities: number; exactSourceLabels: number; note: string };
  songs: {
    authority: string;
    occurrences: number;
    authorshipStatusCounts: Record<string, number>;
    kalaignarAttributedOccurrences: number;
    note: string;
  };
  publication: {
    epubPath: string;
    epubSha256: string;
    readerSha256: string;
    packageStatus: string;
    note: string;
  };
  integrity: {
    sourceScanSha256: string;
    sourceInputAggregateSha256: string;
    sourceInputFiles: number;
    translationInputAggregateSha256: string;
    translationInputFiles: number;
    aggregateNote: string;
  };
  notes: string[];
  /** Deliberately absent: this booklet is composite and carries no blanket rights claim. */
  rights?: never;
};
