// Cinema Writing — ராஜா ராணி / Raja Rani (Wave 5 P1). Types for the generated reader
// data under public/data/cinema/raja-rani/, produced by scripts/import-raja-rani.mjs from a
// pinned commit of pugazg/kalaignar-cinema-works. Runtime never calls GitHub. P1 is data
// foundation only: this work is NOT yet in data/library.ts and has no routes.
//
// ── A DIALOGUE SCREENPLAY WITH 11 NUMBERED SONGS ─────────────────────────────
// Facts the reader must never flatten:
//   * the booklet prints NO numbered screenplay scenes. The 58 scene segments are
//     archival/editorial navigation only — `screenplaySceneNumbersAreSourceNumbers`
//     is false. Never render "scene as printed" or a source scene number. (The
//     numbered songs 1–11 ARE real source numbering.)
//   * 1,071 immutable dialogue records carry `sourceRecordId`; 19 source-unlabelled
//     spoken units do not. The deleted duplicate ids s055-d026..s055-d030 must never
//     reappear.
//   * the PDF-74 `K. N. சங்கரன்` ownership/library stamp is not canonical text.
//   * song authorship tiers are frozen: 5 later-anthology Kalaignar-attributed, 6
//     unresolved. Never upgrade either tier. The scene-58 ↔ song-11 performance link
//     stays review-level.

export type RajaRaniUnitKind = "dialogue" | "stage-direction" | "performance-cue" | "written-text";

export type RajaRaniPageProvenance = { pdf_page: number; printed_page: number | null };

export type RajaRaniEnglishUnit = {
  id: string;
  kind: RajaRaniUnitKind;
  speakerLabel: string | null;
  /** Immutable dialogue link (e.g. "raja-rani-s001-d001"); null for the 19 unlabelled spoken units. */
  sourceRecordId: string | null;
  sourceOccurrenceId: string | null;
  pageProvenance: RajaRaniPageProvenance[];
  englishText: string;
  englishLines: string[] | null;
};

export type RajaRaniScene = {
  sceneId: string;
  /** 1..58 — archival navigation only. */
  archivalSceneOrdinal: number;
  /** Always null — the booklet prints no screenplay scene numbers. */
  sourceSceneNumber: null;
  /** Verbatim canonical Tamil, rendered — never reassembled. */
  tamilText: string;
  englishUnits: RajaRaniEnglishUnit[];
};

export type RajaRaniSongSection = {
  ordinal: number;
  sourceLabel: string | null;
  englishLabel: string | null;
  pdfPages: number[];
  linePairs: { id: string; tamil: string; english: string }[];
};

export type RajaRaniSong = {
  songId: string;
  translationId: string;
  /** 1..11 — real source numbering. */
  numberedSongNumber: number;
  tamilTitle: string;
  englishTitle: string;
  /** Frozen tier; never upgraded. */
  authorshipStatus: "anthology-attributed" | "unresolved";
  lyricistTa: string | null;
  performanceLinks: { status: string; [k: string]: unknown }[];
  pdfPages: number[];
  sections: RajaRaniSongSection[];
};

export type RajaRaniReader = {
  work: {
    slug: "raja-rani";
    kind: string;
    titleTa: string;
    titleEn: string;
    titleEnIsEditorial: boolean;
    languages: string[];
  };
  navigation: {
    primarySections: string[];
    numberedSongOrderIsSourceNumbering: boolean;
    /** Always false — scenes are archival navigation, not printed numbers. */
    screenplaySceneNumbersAreSourceNumbers: boolean;
    screenplaySceneNavigationIsEditorial: boolean;
  };
  numberedSongs: RajaRaniSong[];
  screenplayScenes: RajaRaniScene[];
  counts: {
    scenes: number;
    sourceNumberedScenes: number;
    screenplayUnits: number;
    immutableDialogueLinks: number;
    sourceUnlabelledSpokenUnits: number;
    crossPageScreenplayUnits: number;
    numberedSongs: number;
    songSections: number;
    songLineCues: number;
    crossPageNumberedSongs: number;
    songAnthologyAttributed: number;
    songUnresolved: number;
    songPerformanceLinksVerified: number;
    songPerformanceLinksReview: number;
    unitKinds: Record<RajaRaniUnitKind, number>;
  };
};

export const RAJA_RANI_SLUG = "raja-rani";
