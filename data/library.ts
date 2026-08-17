// Kalaignar Digital Library — normalized catalog (Digital Library Phase 1).
//
// Principle: ONE coherent library, MULTIPLE source-faithful reader types. A memoir,
// a letter, a poem, a play and a speech each keep their own reader structure — this
// catalog is a shared envelope, not a single forced content schema.
//
// Public rendering is driven ONLY by entries whose `state` is "published" (see
// `publishedWorks` / `visibleShelves`). It is NEVER driven by folder existence in
// `public/data`. There is deliberately no filesystem auto-discovery here, so an
// accidental data directory (e.g. the non-authoritative
// `public/data/cinema/manohara/parts/`) can never surface as a public work.
//
// Provenance note: source-repository / source-path / release-commit are DIFFERENT
// concepts from this implementation repository. They are optional and are left unset
// for works whose external source provenance is not established in the implementation
// data. Do not fabricate provenance merely to fill the type.

import { chapterIndex } from "./references";

// ── Shelves ──────────────────────────────────────────────────────────────────
// Fixed public shelf taxonomy from the cross-project master handover. All nine
// exist in the model now; empty shelves are simply not rendered.
export type ShelfId =
  | "life-writing"
  | "letters"
  | "fiction"
  | "poetry"
  | "drama"
  | "cinema-writing"
  | "speeches"
  | "essays-articles"
  | "literary-commentary";

export interface Shelf {
  id: ShelfId;
  order: number;
  ta: string;
  en: string;
}

export const SHELVES: Shelf[] = [
  { id: "life-writing", order: 1, ta: "வாழ்க்கை எழுத்து", en: "Life Writing" },
  { id: "letters", order: 2, ta: "கடிதங்கள்", en: "Letters" },
  { id: "fiction", order: 3, ta: "புனைகதை", en: "Fiction" },
  { id: "poetry", order: 4, ta: "கவிதைகள்", en: "Poetry" },
  { id: "drama", order: 5, ta: "நாடகங்கள்", en: "Drama" },
  { id: "cinema-writing", order: 6, ta: "திரை எழுத்து", en: "Cinema Writing" },
  { id: "speeches", order: 7, ta: "உரைகள்", en: "Speeches" },
  { id: "essays-articles", order: 8, ta: "கட்டுரைகள்", en: "Essays & Articles" },
  { id: "literary-commentary", order: 9, ta: "இலக்கிய உரை", en: "Literary Commentary" },
];

// ── Work model ───────────────────────────────────────────────────────────────
export type ReaderStructure =
  | "volume-chapter"
  | "letter"
  | "commentary-unit"
  // Future reader types (no published works yet; kept for the shared envelope):
  | "scene"
  | "poem"
  | "story"
  | "article"
  | "speech";

export type Availability = "complete" | "partial" | "none";
export type EnglishTranslationType = "full" | "selective" | "none";

// Internal control state. Only "published" is ever surfaced publicly.
export type PublicationState = "published" | "ready-to-integrate" | "archival-in-progress";

export interface LibraryWork {
  /** Stable catalog id (kebab-case). */
  id: string;
  /** Stable slug (may match a route segment). */
  slug: string;
  titleTa: string;
  titleEn: string;
  shelf: ShelfId;
  /** Literary/publishing form: memoir | letters | commentary | novel | poem | ... */
  subtype: string;
  readerStructure: ReaderStructure;
  /** Public reader/collection entry point. */
  href: string;
  /** Internal publication state — public UI shows "published" only. */
  state: PublicationState;

  /** Short bilingual descriptor for the catalog card. */
  descTa?: string;
  descEn?: string;

  // ── Source/archive provenance (OPTIONAL — different from this repo; never faked) ──
  /** Authoritative source/archive repository, e.g. "pugazg/kalaignar-cinema-works". */
  sourceRepo?: string;
  /** Path of the source work within its source repository. */
  sourcePath?: string;
  /** Exact source release/commit or integrity identifier used for the import. */
  sourceCommit?: string;
  /** Publication/edition metadata, where actually established. */
  edition?: string;

  // ── Language availability ──
  tamil?: Availability;
  english?: Availability;
  englishType?: EnglishTranslationType;

  /** Source-supported unit count, where stable. */
  unitCount?: { value: number; labelTa: string; labelEn: string };

  /** Provenance / source-note page, where one exists. */
  provenanceHref?: string;
}

// ── The catalog ──────────────────────────────────────────────────────────────
// Phase 1 exposes exactly the three already-public collections. No new corpus is
// integrated here. (Manohara is deliberately absent — see the header note.)
export const LIBRARY_WORKS: LibraryWork[] = [
  {
    id: "nenjukku-neethi",
    slug: "nenjukku-neethi",
    titleTa: "நெஞ்சுக்கு நீதி",
    titleEn: "Nenjukku Neethi",
    shelf: "life-writing",
    subtype: "memoir",
    readerStructure: "volume-chapter",
    href: "/read/nenjukku-neethi",
    state: "published",
    descTa: "கலைஞரின் ஆறு தொகுதி நினைவுக் குறிப்புகள்",
    descEn: "Kalaignar's six-volume memoir",
    tamil: "complete",
    unitCount: { value: chapterIndex.length, labelTa: "அத்தியாயங்கள்", labelEn: "chapters" },
    // Source repository / release commit for this OCR'd memoir is not recorded in the
    // implementation data → intentionally unset (provenance is not fabricated).
  },
  {
    id: "murasoli-letters",
    slug: "murasoli",
    titleTa: "முரசொலி கடிதங்கள்",
    titleEn: "Murasoli — The Letters",
    shelf: "letters",
    subtype: "letters",
    readerStructure: "letter",
    href: "/murasoli",
    state: "published",
    descTa: "உடன்பிறப்புகளுக்கு எழுதிய கடிதங்கள்",
    descEn: "Letters to udanpirappukkal",
    tamil: "complete",
    english: "partial",
    englishType: "full",
    // Letter count grows as volumes are added → shown live on the collection surface,
    // not pinned here.
  },
  {
    id: "tholkappiya-poonga",
    slug: "tholkappiyam",
    titleTa: "தொல்காப்பியப் பூங்கா",
    titleEn: "Tholkappiya Poonga",
    shelf: "literary-commentary",
    subtype: "commentary",
    readerStructure: "commentary-unit",
    href: "/tholkappiyam",
    state: "published",
    descTa: "கலைஞரின் தொல்காப்பிய உரை",
    descEn: "Kalaignar's Tolkāppiyam commentary",
    tamil: "complete",
    english: "complete",
    englishType: "full",
  },
];

// ── Selectors ────────────────────────────────────────────────────────────────
/** Only intentionally published works are ever exposed publicly. */
export function publishedWorks(): LibraryWork[] {
  return LIBRARY_WORKS.filter((w) => w.state === "published");
}

export interface ShelfWithWorks {
  shelf: Shelf;
  works: LibraryWork[];
}

/**
 * Shelves that contain at least one published work, in taxonomy order. Empty
 * shelves are omitted so the public UI never renders misleading empty categories
 * or "coming soon" placeholders.
 */
export function visibleShelves(): ShelfWithWorks[] {
  const pub = publishedWorks();
  return [...SHELVES]
    .sort((a, b) => a.order - b.order)
    .map((shelf) => ({ shelf, works: pub.filter((w) => w.shelf === shelf.id) }))
    .filter((s) => s.works.length > 0);
}
