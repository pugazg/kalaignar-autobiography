// Cinema Writing — Wave 7 Batch 1 (maruthanattu-ilavarasi, vandikkaran-magan, naam). A BOUNDED shared
// reader over the three works' vendored source Reading-Room payloads (public/data/cinema/<slug>/reader.json,
// frozen byte-for-byte by scripts/import-wave7-b1-cinema.mjs from a pinned commit of
// pugazg/kalaignar-cinema-works). Runtime never calls GitHub.
//
// WHY A NORMALIZER, NOT A REWRITE. The three payloads share one source "reading-room" envelope but keep
// work-specific scene-array keys and optional blocks:
//   * maruthanattu-ilavarasi → `segments` (an unnumbered opening + source-numbered scenes 2–10);
//   * vandikkaran-magan       → `screenplay_scenes` (72; + `performance_occurrences`, film credit context);
//   * naam                    → `scenes` (45; + `authorship`, `performance_inventory`, `source_local_chant`).
// This module maps each into ONE uniform shape WITHOUT mutating the vendored JSON and WITHOUT flattening
// away those differences (the optional blocks are carried through as `extras`). Faithful invariants the
// reader must preserve: verbatim `tamil_text` is never reassembled; a source scene number is shown "as
// printed" ONLY when the payload says its numbering is printed; an unnumbered opening stays unnumbered;
// no publisher/edition/page/scene number/lyric author/speaker/performance attribution is invented; a
// null source fact stays absent.
import fs from "node:fs";
import path from "node:path";

export type Wave7CinemaSlug = "maruthanattu-ilavarasi" | "vandikkaran-magan" | "naam";
export const WAVE7_CINEMA_SLUGS: readonly Wave7CinemaSlug[] = ["maruthanattu-ilavarasi", "vandikkaran-magan", "naam"];

export type PageProvenance = { pdfPage: number | null; printedPage: number | null };

export type Wave7CinemaUnit = {
  id: string;
  /** Source-established unit role: dialogue | stage-direction | song | performance-cue | chant | narrative | written-text | structural-separator | … */
  kind: string;
  /** Exact printed Tamil speaker label beside dialogue; never expanded to an English name. */
  speakerLabelTa: string | null;
  /** Immutable Tamil↔English dialogue link where the source supplies one; else null. */
  sourceRecordId: string | null;
  /** A retained song/performance occurrence id; NOT a lyric-authorship claim. */
  sourceOccurrenceId: string | null;
  pageProvenance: PageProvenance[];
  englishText: string;
  englishLines: string[] | null;
  sourceDelimiter: string | null;
};

// The source-faithful English-text rule lives in a client-safe module (no node:fs), re-exported here so
// server importers can keep importing it from this module. See data/wave7-cinema-text.ts.
export { unitEnglishText } from "./wave7-cinema-text";

export type Wave7CinemaScene = {
  sceneId: string;
  /** Navigation ordinal used for the section slug + display order (1-based, contiguous). */
  navOrdinal: number;
  /** Route section slug, derived from THIS entry (never a reconstructed 1..N range). */
  sectionSlug: string;
  /** The printed source scene number/id, verbatim; null when the source prints none (unnumbered). */
  sourceSceneNumber: string | number | null;
  /** True only when the payload states the source itself prints this number. */
  numberingIsPrinted: boolean;
  headingTa: string | null;
  locationTa: string | null;
  pdfPages: number[];
  printedPages: (number | null)[];
  /** Verbatim canonical Tamil, rendered — never reassembled. */
  tamilText: string;
  units: Wave7CinemaUnit[];
};

export type Wave7CinemaWork = {
  slug: Wave7CinemaSlug;
  titleTa: string;
  titleEn: string;
  kind: string;
  sectionLabelTa: string;
  scenes: Wave7CinemaScene[];
  /** Work-specific source blocks carried through untouched, rendered on the source/notes surface. */
  extras: {
    performanceOccurrences?: unknown;
    performanceInventory?: unknown;
    authorship?: unknown;
    sourceLocalChant?: unknown;
    filmLevelCreditContext?: unknown;
  };
};

type RawUnit = Record<string, unknown>;
type RawScene = Record<string, unknown>;
type RawReader = Record<string, unknown>;

const asStr = (v: unknown): string | null => (typeof v === "string" && v.length ? v : null);
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function normUnit(u: RawUnit): Wave7CinemaUnit {
  const pp = asArr(u.page_provenance).map((p) => {
    const o = p as Record<string, unknown>;
    return { pdfPage: typeof o.pdf_page === "number" ? o.pdf_page : null, printedPage: typeof o.printed_page === "number" ? o.printed_page : null };
  });
  return {
    id: String(u.id ?? ""),
    kind: String(u.kind ?? "unit"),
    speakerLabelTa: asStr(u.speaker_label_ta) ?? asStr(u.speaker_label),
    sourceRecordId: asStr(u.source_record_id),
    sourceOccurrenceId: asStr(u.source_occurrence_id),
    pageProvenance: pp,
    englishText: typeof u.english_text === "string" ? u.english_text : "",
    englishLines: Array.isArray(u.english_lines) ? (u.english_lines as string[]) : null,
    sourceDelimiter: asStr(u.source_delimiter),
  };
}

/** Per-work scene-array key + field adapter. Keeps each source structure intact. */
const ADAPTERS: Record<Wave7CinemaSlug, { key: string; prefix: string; sectionLabelTa: string; scene: (s: RawScene, i: number) => Omit<Wave7CinemaScene, "sectionSlug" | "units"> & { units: Wave7CinemaUnit[] } }> = {
  "maruthanattu-ilavarasi": {
    key: "segments", prefix: "segment", sectionLabelTa: "பகுதிகள்",
    scene: (s, i) => ({
      sceneId: String(s.segment_id), navOrdinal: typeof s.derivative_ordinal === "number" ? s.derivative_ordinal : i + 1,
      sourceSceneNumber: typeof s.source_scene_number === "number" ? s.source_scene_number : null,
      numberingIsPrinted: s.segment_kind !== "unnumbered-opening" && typeof s.source_scene_number === "number",
      headingTa: asStr(s.source_heading_ta) ?? asStr(s.navigation_label), locationTa: asStr(s.source_location_ta),
      pdfPages: [], printedPages: [], tamilText: typeof s.tamil_text === "string" ? s.tamil_text : "",
      units: asArr(s.english_units).map((u) => normUnit(u as RawUnit)),
    }),
  },
  "vandikkaran-magan": {
    key: "screenplay_scenes", prefix: "scene", sectionLabelTa: "திரைக்காட்சிகள்",
    scene: (s, i) => ({
      sceneId: String(s.scene_id), navOrdinal: typeof s.archival_scene_ordinal === "number" ? s.archival_scene_ordinal : i + 1,
      sourceSceneNumber: (s.source_scene_id as string | number | null) ?? null,
      numberingIsPrinted: s.source_scene_numbering_is_printed === true,
      headingTa: asStr(s.source_heading_ta), locationTa: asStr(s.source_location_ta),
      pdfPages: asArr(s.source_pdf_pages) as number[], printedPages: asArr(s.source_printed_pages) as (number | null)[],
      tamilText: typeof s.tamil_text === "string" ? s.tamil_text : "",
      units: asArr(s.english_units).map((u) => normUnit(u as RawUnit)),
    }),
  },
  naam: {
    key: "scenes", prefix: "scene", sectionLabelTa: "திரைக்காட்சிகள்",
    scene: (s, i) => ({
      sceneId: String(s.scene_id), navOrdinal: typeof s.source_scene_number === "number" ? s.source_scene_number : i + 1,
      sourceSceneNumber: (s.source_scene_number as number | null) ?? null,
      numberingIsPrinted: typeof s.source_scene_number === "number",
      headingTa: asStr(s.source_heading_ta), locationTa: null,
      pdfPages: asArr(s.pdf_pages) as number[], printedPages: [typeof s.start_printed === "number" ? s.start_printed : null, typeof s.end_printed === "number" ? s.end_printed : null],
      tamilText: typeof s.tamil_text === "string" ? s.tamil_text : "",
      units: asArr(s.english_units).map((u) => normUnit(u as RawUnit)),
    }),
  },
};

export const sectionSlug = (prefix: string, ordinal: number) => `${prefix}-${String(ordinal).padStart(3, "0")}`;

export function normalizeWave7Cinema(slug: Wave7CinemaSlug, raw: RawReader): Wave7CinemaWork {
  const a = ADAPTERS[slug];
  const work = (raw.work ?? {}) as Record<string, unknown>;
  const scenes = asArr(raw[a.key]).map((s, i) => {
    const base = a.scene(s as RawScene, i);
    return { ...base, sectionSlug: sectionSlug(a.prefix, base.navOrdinal) };
  });
  return {
    slug,
    titleTa: String(work.title_ta ?? work.titleTa ?? ""),
    titleEn: String(work.presentation_title_en ?? work.title_en ?? work.titleEn ?? ""),
    kind: String(work.kind ?? "film-screenplay"),
    sectionLabelTa: a.sectionLabelTa,
    scenes,
    extras: {
      performanceOccurrences: raw.performance_occurrences,
      performanceInventory: raw.performance_inventory,
      authorship: raw.authorship,
      sourceLocalChant: raw.source_local_chant,
      filmLevelCreditContext: raw.film_level_credit_context,
    },
  };
}

export function loadWave7Cinema(slug: Wave7CinemaSlug): Wave7CinemaWork | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/cinema", slug, "reader.json"), "utf-8")) as RawReader;
    return normalizeWave7Cinema(slug, raw);
  } catch {
    return null;
  }
}

export type Wave7CinemaProvenance = {
  slug: string; title: { ta: string; en: string; enIsEditorial: boolean }; kind: string;
  sourceRepo: string; sourceCommit: string; repoTree: string; workTree: string; sourcePath: string;
  source: { scanSha256: string; sourceIdentifier: string | null; publicationYearAsPrinted: number | null; note: string };
  readingRoomPayloadSha256: string; counts: Record<string, number>;
  englishProvenance: { kind: string; status: string; note: string };
  hidden: { discoverable: boolean; sitemapExposed: boolean; publicRoute: boolean; note: string };
};

export function loadWave7CinemaProvenance(slug: Wave7CinemaSlug): Wave7CinemaProvenance | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/cinema", slug, "provenance.json"), "utf-8"));
  } catch {
    return null;
  }
}
