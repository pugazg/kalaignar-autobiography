// ─── Data contracts ────────────────────────────────────────────────────────
// These mirror the JSON emitted by the archive pipeline. Historical content is
// NEVER hardcoded in components — it always arrives through these shapes.

/** App-content manifest: /data/app/manifest.v1.json (built by build_app_manifest.py). */
export interface AppManifest {
  schemaVersion: number;
  contentVersion: string; // changes when any chapter index changes → triggers update
  generatedAt: string;
  dataBase: string;
  work: { titleTa: string; titleEn: string; author: string; siteUrl: string };
  volumes: VolumeEntry[];
  murasoli: MurasoliEntry | null;
  features: {
    timeline: string | null;
    governance: string | null;
    people: string | null;
    places: string | null;
    themes: string | null;
    quotes: string | null;
    stats: string | null;
  };
}

export interface VolumeEntry {
  n: number;
  titleTa: string | null;
  titleEn: string | null;
  period: string | null;
  serialisedIn: string | null;
  chapterCount: number;
  pages: number | null;
  searchIndexUrl: string | null;
  chapters: ChapterEntry[];
}

export interface ChapterEntry {
  id: string; // e.g. "v1-ch01"
  title: string;
  startPage: number | null;
  endPage: number | null;
  textUrl: string;
  textEnUrl: string | null;
  visualsUrl: string | null;
}

export interface MurasoliEntry {
  title: { en: string; ta: string } | string;
  indexUrl: string;
  lettersIndexUrl: string;
  letterUrlTemplate: string; // "/data/murasoli/letters/{id}.json"
  letterEnUrlTemplate: string;
  volumeCount: number | null;
  totalLetters: number;
}

/** Chapter body: /data/text/<id>.json */
export interface ChapterText {
  id: string;
  volume: number;
  title: string;
  pages: { start: number; end: number };
  strategy?: string;
  paragraphs: string[];
}

/** English translation: /data/text-en/<id>.json (optional per chapter) */
export interface ChapterTextEn {
  id: string;
  title?: string;
  paragraphs: string[];
  provenance?: { status?: string };
}

/** Per-volume search index: /data/fulltext/v<N>.json — array of these. */
export interface FullTextEntry {
  i: string; // chapter id
  t: string; // title
  x: string; // full text
}

/** Chapter visuals: /data/visuals/<id>.json */
export interface Visual {
  src: string; // "/images/volume1/<file>"
  type: "sketch" | "photo" | string;
  afterParagraph: number; // -1 = before first paragraph
  confidence?: number;
}

// ─── Feature datasets — /data/app/features/<name>.json ───────────────────────
// Exported from the website's data/*.ts by pipeline/builders/export-feature-data.ts
// and linked from manifest.features. See mobile/docs/DATA_CONTRACTS.md.

/** One era band in the timeline (grouping metadata for milestones). */
export interface TimelineEra {
  id: string; // matches TimelineMilestone.era
  label: string;
  years: string;
}

/** A dated milestone from data/timeline.ts. `refs` are memoir chapter ids. */
export interface TimelineMilestone {
  id: string;
  year: string; // free-form (e.g. "1924", "c. 1938–40") — display verbatim, do not parse
  era: string; // ∈ TimelineEra.id
  location?: string;
  tags?: string[];
  title: string;
  summary: string;
  stat?: { value: string; label: string };
  image?: string;
  refs: string[]; // memoir chapter ids; refs[0] is the primary chapter
}

/** timeline.json: mirrors data/timeline.ts named exports. */
export interface TimelineFeature {
  eras: TimelineEra[];
  timeline: TimelineMilestone[];
}

// ─── Local (device) state — persisted, never shipped as content ──────────────
export type ThemeName = "light" | "dark" | "sepia";

export interface ReadingPrefs {
  theme: ThemeName;
  followSystemTheme: boolean;
  fontStep: number; // index into fontSteps
  lineHeightStep: number; // index into lineHeightSteps
  showEnglish: boolean;
}

export interface Bookmark {
  chapterId: string;
  volume: number;
  title: string;
  createdAt: number;
}

export interface ProgressRecord {
  chapterId: string;
  volume: number;
  title: string;
  ratio: number; // 0..1 scroll-through
  paragraph: number; // last visible paragraph index
  updatedAt: number;
}

export interface DownloadRecord {
  chapterId: string;
  volume: number;
  bytes: number;
  downloadedAt: number;
  hasEnglish: boolean;
}
