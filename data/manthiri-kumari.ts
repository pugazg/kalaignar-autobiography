// Cinema Writing — மந்திரி குமாரி / Manthiri Kumari (Wave 5 P1). Types for the generated
// reader data under public/data/cinema/manthiri-kumari/, produced by
// scripts/import-manthiri-kumari.mjs from a pinned commit of pugazg/kalaignar-cinema-works.
// Runtime never calls GitHub. P1 is data foundation only: this work is NOT yet in
// data/library.ts and has no routes.
//
// ── A BOOKLET, NOT A SCREENPLAY ──────────────────────────────────────────────
// Manthiri Kumari is a compact film booklet — one continuous story summary plus 15
// song/performance blocks. It prints NO screenplay scenes and no film-wide dialogue
// index. Facts the reader must never flatten:
//   * performance ordinals 1–15 are archival source-order navigation, never printed
//     source numbering; `sourceNumberedScenes` is false;
//   * item-level lyric authorship is 0 verified / 15 unresolved — the cover's
//     story/dialogue credit is not a lyric credit, and later anthology text must not
//     repair this booklet;
//   * exactly ONE block (11) is a confirmed current-anthology witness of
//     kalaignar-song-001; the other 14 are source-only;
//   * performance 13 keeps its printed heading `பார்த்திபன்—மந்திரிகுமாரி` while its
//     internal turn labels stay `பார்த்திபன்` / `அமுதவல்லி` — never one identity field.

export type ManthiriPerformanceSection = {
  ordinal: number;
  sourceLabel: string | null;
  englishLabel: string | null;
  sourcePdfPages: number[];
  /** Verbatim canonical Tamil lines, rendered — never reassembled from labels. */
  tamilLines: string[];
  /** Aligned English lines; `englishLines.length === tamilLines.length` per section. */
  englishLines: string[];
};

export type ManthiriPerformance = {
  sourceOrder: number;
  /** Always false — the booklet prints no performance/scene numbers. */
  sourceOrderIsPrintedNumbering: boolean;
  performanceId: string;
  translationId: string;
  headingTa: string;
  headingEn: string;
  pdfPages: number[];
  lineCues: number;
  /** Always "unresolved" for all 15 blocks; never upgrade. */
  authorshipStatus: "unresolved";
  crossWitnessStatus: "confirmed-existing-anthology-witness" | "source-only-in-current-anthology";
  /** Only block 11 -> "kalaignar-song-001"; null for the other 14. */
  anthologyRecordId: string | null;
  sections: ManthiriPerformanceSection[];
};

export type ManthiriStorySummaryUnit = {
  ordinal: number;
  sourcePdfPages: number[];
  tamil: string;
  english: string;
};

export type ManthiriStorySummary = {
  recordId: string;
  titleTa: string;
  titleEn: string;
  pdfPages: number[];
  logicalUnits: number;
  crossPageUnits: number;
  units: ManthiriStorySummaryUnit[];
};

export type ManthiriReader = {
  work: {
    slug: "manthiri-kumari";
    kind: string;
    titleTa: string;
    titleEn: string;
    titleEnIsEditorial: boolean;
    storyDialogueCreditAsPrinted: string;
    languages: string[];
  };
  navigation: {
    primarySections: string[];
    performanceOrderIsArchivalNavigation: boolean;
    performanceOrderIsSourceNumbering: boolean;
    sourceNumberedScenes: boolean;
  };
  storySummary: ManthiriStorySummary;
  performances: ManthiriPerformance[];
  counts: {
    storySummaryRecords: number;
    storySummaryUnits: number;
    storySummaryCrossPageUnits: number;
    performanceBlocks: number;
    performanceSections: number;
    performanceLineCues: number;
    crossPagePerformanceBlocks: number;
    confirmedAnthologyWitnesses: number;
    sourceOnlyInAnthology: number;
    lyricistsVerified: number;
    lyricistsUnresolved: number;
  };
};

export const MANTHIRI_KUMARI_SLUG = "manthiri-kumari";
