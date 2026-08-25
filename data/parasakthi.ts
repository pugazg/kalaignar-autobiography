// Cinema Writing — பராசக்தி / Parasakthi (Digital Library Phase C). Types and loaders for the
// generated reader data under public/data/cinema/parasakthi/, produced by
// scripts/import-parasakthi.mjs from a pinned commit of pugazg/kalaignar-cinema-works. Runtime never
// calls GitHub.
//
// ── A WORK-SPECIFIC MODEL, NOT A CINEMA FRAMEWORK ───────────────────────────────────────────────
// Parasakthi is the second work on the திரை எழுத்து shelf and shares almost nothing structurally
// with the first. Manohara's booklet prints NO scene numbers, so its 57 units are an ARCHIVE-CREATED
// navigation layer that its own data calls `derivative-navigation-only`. Parasakthi's booklet PRINTS
// its headings, so its 46 units are SOURCE structure — which is why their gaps and their transposed
// numbers are facts to carry rather than noise to tidy. Generalising the two into one "cinema
// reader" would have to erase that difference to work, so the two stay apart.
//
// ── WHAT THE READER MUST NOT DO WITH THIS DATA ──────────────────────────────────────────────────
//   * Never rebuild a Tamil line from `speakerLabel` + `text`. The Tamil `text` ALREADY carries the
//     printed label and its exact spacing (`ஞான : தம்பி!…`); recomposing it would silently change
//     punctuation the booklet chose. `speakerLabel` exists for styling and grouping, not assembly.
//   * The English is the mirror image: its `text` never carries the label (0 of 636 labelled units),
//     so the label is rendered separately — and it is the EXACT TAMIL source label, deliberately.
//     The archive keeps `ஞான` rather than expanding it to "Gnanasekaran", because the booklet's
//     abbreviations are what the source shows and the character-entity mapping that could expand
//     them is not fully resolved.
//   * Never flatten `lines`. Seventeen English units are lineated verse; joining them into a
//     paragraph would destroy the shape of every translated song.
//   * Never present the song evidence tiers as equal, and never let the reader show attribution at
//     all. Two of the fourteen occurrences are Kalaignar's, both on anthology evidence rather than
//     on the 1952 booklet — which credits six poets for the songs as a whole and pairs none with a
//     song. That distinction lives on the source page.
export type ParasakthiBlockKind = "dialogue" | "stage-direction" | "verse" | "prose";

/**
 * One Tamil reading block, in source order.
 *
 * `text` is verbatim from the archive's verified scene derivative, including the speaker label on a
 * dialogue block and the Markdown hard breaks (`"  \n"`) that carry verse lineation. It is rendered,
 * never reassembled.
 */
export type ParasakthiTamilBlock = {
  kind: ParasakthiBlockKind;
  /** Present only on `dialogue`; the exact printed label, already inside `text`. */
  speakerLabel?: string;
  text: string;
};

export type ParasakthiUnitKind = "dialogue" | "stage-direction" | "song" | "quoted-verse";

/**
 * One English reading unit, in source order.
 *
 * `lines` is non-null for the 17 verse units (13 songs, 1 quoted verse, 3 sung dialogue lines) and
 * carries their lineation; `text` is the same content joined, useful as a whole but never a
 * substitute for the lines. `speakerLabel` is the exact Tamil source label or null — null means the
 * source labelled nobody, and the reader must not supply a name.
 */
export type ParasakthiEnglishUnit = {
  id: string;
  kind: ParasakthiUnitKind;
  speakerLabel: string | null;
  text: string;
  lines: string[] | null;
  mode: string | null;
  sourceOccurrenceId: string | null;
};

/**
 * A witness that no longer controls an attribution but has NOT been discarded.
 *
 * The archive corrected `parasakthi-song-002` from the secondary soundtrack table to the Kalaignar
 * anthology. Recording only the winner would erase the evidence the correction rests on, so both
 * readings are carried and the earlier one is described as superseded — never as wrong, and never
 * as deleted, because the tracklist file is unchanged and still says what it always said.
 */
export type ParasakthiSupersededWitness = {
  occurrenceId: string;
  canonicalScene: number;
  nowAttributedTo: string;
  nowOn: string;
  previouslyAttributedTo: string;
  previouslyOn: string;
  previousReference: string;
  note: string;
};

/** A song or verse occurrence. Item-level attribution is EVIDENCE, and belongs on the source page. */
export type ParasakthiSongItem = {
  id: string;
  canonicalScene: number;
  kind: string;
  openingLineTa: string;
  lyricistTa: string;
  /**
   * Three tiers, of unequal weight, and the source page keeps them apart:
   *   `external-source`             — a secondary soundtrack tracklist, weaker than the printed
   *                                   booklet (11 items);
   *   `anthology-attributed`        — the verified Kalaignar film-song anthology names the song at
   *                                   item level (2 items). Stronger than the tracklist for this
   *                                   archive's attribution, but NOT original-film
   *                                   primary-source-verified authorship;
   *   `canonical-context-explicit`  — the booklet's own text names the poet (1 item).
   * None of this appears in the reading interface.
   */
  evidenceBasis: string;
  evidenceReference: string | null;
  performanceContext: string | null;
  reprisesId: string | null;
};

/** The per-scene summary carried in index.json — enough to navigate without loading every scene. */
export type ParasakthiSceneStub = {
  slug: string;
  canonicalScene: number;
  /**
   * The number the BOOKLET prints. Equal to `canonicalScene` everywhere except the two transposed
   * late scenes, where it is the misprint. It is provenance: the reader shows `canonicalScene`.
   */
  sourceHeading: number;
  editorialNumberCorrection: boolean;
  headingTa: string;
  tamilBlockCount: number;
  englishUnitCount: number;
  songItemIds: string[];
};

export type ParasakthiScene = ParasakthiSceneStub & {
  workId: string;
  canonicalPart: string;
  continuationNotes: string[];
  /** Source-interface only. Page numbers never appear in the reading interface. */
  pageProvenance: { pdfPage: number; printedPage: number; status?: string }[];
  tamil: { blocks: ParasakthiTamilBlock[] };
  english: { units: ParasakthiEnglishUnit[] };
  songItems: ParasakthiSongItem[];
};

export type ParasakthiIndex = {
  workId: string;
  titleTa: string;
  sourceTitleTa: string;
  titleEn: string;
  shelf: "cinema-writing";
  readerStructure: "scene";
  /** `source-printed`, against Manohara's `derivative-navigation-only`. */
  sceneNumbering: string;
  sceneCount: number;
  canonicalSceneRange: string;
  /** 23 and 34 — never printed, never fabricated, and deliberately given no route. */
  absentCanonicalScenes: number[];
  editorialNumberCorrections: { canonicalScene: number; sourceHeading: number }[];
  scenes: ParasakthiSceneStub[];
  songs: ParasakthiSongItem[];
};

export type ParasakthiProvenance = {
  workId: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  sourceCommitNote: string;
  source: {
    identifier: string;
    filename: string;
    scanSha256: string;
    pdfPages: number;
    canonicalPdfPages: string;
    canonicalPrintedPages: string;
    rearAdvertisementPdfPage: number;
    scanType: string;
    publicationYearAsPrinted: null;
    editionAsPrinted: null;
    publisherAsPrinted: null;
    controllingSourceNote: string;
  };
  creditsAsPrinted: {
    titlePageRoleTa: string;
    titlePageNameTa: string;
    creditsPageRoleTa: string;
    creditsPageNameTa: string;
  };
  structure: {
    sceneHeadingsObserved: number;
    canonicalRange: string;
    absentCanonicalScenes: number[];
    absenceNote: string;
    editorialNumberCorrections: { canonicalScene: number; sourceHeading: number; pdfPage: number; printedPage: number }[];
    misnumberingNote: string;
  };
  tamil: {
    authority: string;
    sceneDerivatives: number;
    dialogueRecords: number;
    canonicalPages: number;
    verifiedPages: number;
    reviewPages: number;
    verificationNote: string;
    contentNote: string;
  };
  english: {
    authority: string;
    kind: string;
    kindBasis: string;
    translationUnits: number;
    unitKindCounts: Record<string, number>;
    scenesVerified: number;
    absentCanonicalScenes: number[];
    readerEditionQa: string;
    qaNote: string;
  };
  songs: {
    bookletCredits: {
      pdfPage: number;
      headingTa: string;
      scope: string;
      contributorsAsPrinted: string[];
      itemLevelAssignmentPresent: boolean;
      note: string;
    };
    itemLevelAuthority: {
      occurrenceRecords: number;
      soundtrackTracks: number;
      soundtrackOccurrences: number;
      quotedVerseRecords: number;
      /** Tier key → what that tier means. */
      evidenceTiers: Record<string, string>;
      /** Tier key → how many of the 14 occurrences rest on it. Displayed from here, never hardcoded. */
      evidenceTierCounts: Record<string, number>;
      /** The archive work that supplies item-level attribution for the songs it names. */
      crossWitnessSource: string;
      /** Its cross-witness match reports, by filename within the source work's songs directory. */
      crossWitnessReports: string[];
      /** Attributions that changed, with the earlier witness kept intact beside the current one. */
      supersededWitnesses: ParasakthiSupersededWitness[];
      externalEvidence: {
        evidenceId: string;
        evidenceType: string;
        publicSource: Record<string, string>;
        qualityNote: string;
      };
      attributionNote: string;
      /** The four levels of authority, ordered strongest first and deliberately not collapsed. */
      authorityOrder: string[];
    };
    items: ParasakthiSongItem[];
  };
  integrity: {
    sourceScanSha256: string;
    sourceInputAggregateSha256: string;
    sourceInputFiles: number;
    translationInputAggregateSha256: string;
    translationInputFiles: number;
    readerEditionOutputs: Record<string, { sha256: string; bytes: number }>;
  };
  notes: string[];
  /** Deliberately absent: this booklet is composite and carries no blanket rights claim. */
  rights?: never;
};
