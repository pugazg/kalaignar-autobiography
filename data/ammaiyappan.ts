// Cinema Writing — அம்மையப்பன் / Ammayappan (Wave 6 P1–P3, Batch 1). Types for the generated
// reader data under public/data/cinema/ammaiyappan/, produced by scripts/import-ammaiyappan.mjs from
// a pinned commit of pugazg/kalaignar-cinema-works. Runtime never calls GitHub. This is a direct
// reader/route onboarding only: the work is NOT yet in data/library.ts, /read discovery or the sitemap
// (that is Wave 6 P4, not authorized).
//
// ── A PRINTED SCREENPLAY / DIALOGUE BOOKLET ──────────────────────────────────
// Facts the reader must never flatten:
//   * the 1954 booklet prints NO numbered screenplay scenes. The 63 scene segments are
//     archival/editorial navigation only — `screenplaySceneNumbersAreSourceNumbers` is false.
//     Never render "Scene N as printed" or a source scene number.
//   * this is the full screenplay/dialogue booklet (source TVA_BOK_0064230); it is NOT the Film Songs
//     anthology and must never be conflated with it.
//   * 1,025 dialogue units carry an immutable `sourceRecordId` (1,009 explicit records + 16
//     source-role supplements); the 181 stage-directions, 3 song-references and 1 japa unit do not.
//   * FIVE retained song/performance occurrences (ammaiyappan-song-001..005) appear as in-scene
//     occurrence references via `sourceOccurrenceId`. They are occurrences, NOT standalone
//     Kalaignar-authored lyrics, and must never be upgraded to a lyric-authorship claim.
//   * no publication year / edition / rights is promoted from the source; the printed 1954 credit and
//     copyright line are recorded as source witnesses on /cinema/ammaiyappan/source only.

export type AmmaiyappanUnitKind = "dialogue" | "stage-direction" | "song-reference" | "japa";

export type AmmaiyappanPageProvenance = { pdf_page: number; printed_page: number | null };

export type AmmaiyappanEnglishUnit = {
  id: string;
  kind: AmmaiyappanUnitKind;
  /** Exact printed Tamil speaker label, set beside dialogue — never expanded to an English name. */
  speakerLabel: string | null;
  /** Immutable dialogue link (e.g. "ammaiyappan-s001-d001"); null for non-dialogue units. */
  sourceRecordId: string | null;
  /** A retained song/performance occurrence id (ammaiyappan-song-00N); NOT a lyric-authorship claim. */
  sourceOccurrenceId: string | null;
  pageProvenance: AmmaiyappanPageProvenance[];
  englishText: string;
  englishLines: string[] | null;
};

export type AmmaiyappanScene = {
  sceneId: string;
  /** 1..63 — archival navigation only. */
  archivalSceneOrdinal: number;
  /** Always null — the booklet prints no screenplay scene numbers. */
  sourceSceneNumber: null;
  /** The source-visible structural heading for this segment. */
  sourceHeadingTa: string | null;
  pdfPages: number[];
  printedPages: (number | null)[];
  /** Verbatim canonical Tamil, rendered — never reassembled. */
  tamilText: string;
  englishUnits: AmmaiyappanEnglishUnit[];
};

export type AmmaiyappanReader = {
  work: {
    slug: "ammaiyappan";
    kind: string;
    titleTa: string;
    titleEn: string;
    titleEnIsEditorial: boolean;
    languages: string[];
  };
  navigation: {
    primarySections: string[];
    /** Always false — scenes are archival navigation, not printed numbers. */
    screenplaySceneNumbersAreSourceNumbers: boolean;
    screenplaySceneNavigationIsEditorial: boolean;
  };
  screenplayScenes: AmmaiyappanScene[];
  counts: {
    scenes: number;
    sourceNumberedScenes: number;
    englishUnits: number;
    dialogueSourceLinks: number;
    stageActionUnits: number;
    songReferenceUnits: number;
    japaUnits: number;
    crossPageUnits: number;
    occurrenceIdentities: number;
    occurrenceSourceSpanLinks: number;
    unitKinds: Record<AmmaiyappanUnitKind, number>;
  };
};

export const AMMAIYAPPAN_SLUG = "ammaiyappan";
