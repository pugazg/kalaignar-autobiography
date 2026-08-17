// Kalaignar Digital Library — normalized catalog (Digital Library Phase 1).
//
// Principle: ONE coherent library, MULTIPLE source-faithful reader types. A memoir,
// a letter, a poem, a play and a speech each keep their own reader structure — this
// catalog is a shared envelope, not a single forced content schema.
//
// Public rendering is driven ONLY by entries whose `state` is "published" (see
// `publishedWorks` / `visibleShelves`). It is NEVER driven by folder existence in
// `public/data`. There is deliberately no filesystem auto-discovery here, so an
// accidental data directory (such as the non-authoritative
// `public/data/cinema/manohara/parts/` scratch files that Phase 2 removed) can
// never surface as a public work.
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

// Language COVERAGE for the *intended catalog work / collection boundary* — NOT
// merely "every unit currently vendored happens to have this language". A work whose
// full collection is only partly integrated is "partial" even if every integrated
// unit carries the language.
export type Availability = "complete" | "partial" | "none";

// KIND / provenance of the English text, where established. This is a SEPARATE
// concept from coverage (see `english`). Optional: leave unset when the
// implementation repository does not establish it — do not guess an origin.
export type EnglishKind =
  | "project-created" // English translation created for/by this project
  | "separately-published" // a separately published English translation
  | "published-source-witness"; // a published English source / secondary witness

// Internal control state. Only "published" is ever surfaced publicly.
export type PublicationState = "published" | "ready-to-integrate" | "archival-in-progress";

// ── Present rights status of the UNDERLYING authored work ─────────────────────
// A reusable, evidence-based rights model for the catalog. This describes the
// PRESENT project-level rights status of the work authored by Kalaignar — a
// DIFFERENT fact from any historical rights notice printed in an old edition (that
// notice is preserved separately as a source witness on the work's provenance page).
//
// Background: the Government of Tamil Nadu announced on 2024-08-22 that Kalaignar
// M. Karunanidhi's works would be nationalised without royalty, and issued the
// Government Order nationalising his works in December 2024. This is a project-wide
// fact applicable to works authored by Kalaignar (subject to confirming each item is
// in fact his work and falls within the order). It does NOT extend to third-party
// contributions (other authors' prefaces/essays, separately published translations,
// secondary witness editions, photographs/illustrations/cover/publisher material),
// nor to project-created translations, which retain their own distinct provenance.
export type RightsStatus =
  // Kalaignar-authored underlying work, nationalised by the Government of Tamil Nadu.
  | "nationalised-by-tamil-nadu-government"
  // Not yet brought onto this model (existing entries pending the rights audit — see
  // PHASE2_MANOHARA_HANDOVER.md). Absence of `rights` means the same thing.
  | "unclassified";

export interface WorkRights {
  /** Present rights status of the underlying authored work. */
  rightsStatus: RightsStatus;
  /** Authority that established the status, e.g. "Government of Tamil Nadu". */
  rightsAuthority?: string;
  /** The action taken, e.g. "nationalisation". */
  rightsAction?: string;
  /** ISO date the action was announced, where verified (e.g. "2024-08-22"). */
  rightsAnnouncementDate?: string;
  /** Government Order number — ONLY once verified from the GO itself. Never invented. */
  governmentOrderNumber?: string | null;
  /** Government Order date as stated where only partly verified (e.g. "December 2024"). */
  governmentOrderDateStated?: string;
  /** Short note distinguishing this present status from historical printed edition notices. */
  note?: string;
}

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

  // ── Language coverage vs English provenance (kept semantically separate) ──
  /** Tamil coverage for the intended work/collection boundary. */
  tamil?: Availability;
  /** English coverage for the intended work/collection boundary. */
  english?: Availability;
  /** KIND/provenance of the English text, where established (unset = not established). */
  englishKind?: EnglishKind;

  /** Source-supported unit count, where stable. */
  unitCount?: { value: number; labelTa: string; labelEn: string };

  /**
   * Present rights status of the underlying authored work (reusable model). Unset for
   * works not yet brought onto the nationalisation-rights model — see the rights-audit
   * follow-up in PHASE2_MANOHARA_HANDOVER.md. This is DISTINCT from any historical printed
   * rights notice, which lives with the work's source provenance, not here.
   */
  rights?: WorkRights;

  /** Provenance / source-note page, where one exists. */
  provenanceHref?: string;
}

// ── The catalog ──────────────────────────────────────────────────────────────
// Phase 1 exposed exactly the three already-public collections. Digital Library
// Phase 2 onboards ONE additional work — the Manohara screenplay/dialogue booklet
// — onto the same shared envelope (its own `scene` reader; source-faithful Tamil +
// a project-created English derivative). No generalized ingestion framework is
// introduced: this is a single, work-specific catalog entry, exactly like the
// others. The public UI is still driven ONLY by `state: "published"` (never by
// folder existence), so the accidental (now-removed) `public/data/cinema/
// manohara/parts/` directory — non-authoritative implementation scratch data,
// never a source — could never have surfaced as a work regardless.
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
    // Only volumes 48–54 of the intended full "Murasoli — The Letters" collection
    // are integrated → "partial" at the work/collection boundary (even though every
    // integrated volume carries Tamil). This is a collection-boundary status, not a
    // per-unit one.
    tamil: "partial",
    // English exists for most integrated volumes but not all (e.g. vol 54 is
    // Tamil-only), and the collection itself is partial → "partial".
    english: "partial",
    // englishKind intentionally UNSET — the provenance/kind of the Murasoli English
    // layer is not established in the implementation data (not guessed).
    // Letter count grows as volumes are added → shown live on the collection surface.
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
    // English (En/Ta toggle) covers the onboarded work.
    english: "complete",
    // englishKind intentionally UNSET — whether this English is a separately
    // published translation or project-created is not established in the
    // implementation data (not guessed).
  },
  {
    id: "manohara",
    slug: "manohara",
    titleTa: "மனோகரா",
    titleEn: "Manohara",
    shelf: "cinema-writing",
    subtype: "screenplay-dialogue",
    readerStructure: "scene",
    href: "/cinema/manohara",
    state: "published",
    descTa: "கலைஞரின் திரைக்கதை–வசன நூல் (1954)",
    descEn: "Kalaignar's screenplay-dialogue booklet (1954)",
    // External source provenance IS established for this work (unlike the memoir),
    // so it is recorded here and surfaced on /cinema/manohara/source.
    sourceRepo: "pugazg/kalaignar-cinema-works",
    sourcePath: "works/manohara",
    sourceCommit: "4b5f3238bd1e5983e995ddd85cd8a81ae27de21d",
    tamil: "complete",
    english: "complete",
    // The English layer is a source-linked derivative created for this project
    // (works/manohara/translations), NOT a separately-published translation.
    englishKind: "project-created",
    // The 1954 booklet prints NO scene numbers. The 57 divisions are archive-created
    // navigation segments only — never presented as "printed scenes". The label makes
    // that explicit on the catalog card.
    unitCount: { value: 57, labelTa: "காப்பக வழிசெலுத்தல் பகுதிகள்", labelEn: "archival segments" },
    // Present rights status of Kalaignar's underlying work: nationalised by the Government
    // of Tamil Nadu (announced 2024-08-22; GO issued December 2024). This is DISTINCT from
    // the 1954 edition's printed "உரிமை : ஆசிரியருக்கே." notice, which is preserved as a
    // source witness on /cinema/manohara/source. The GO number is not yet verified → not set.
    rights: {
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null,
      governmentOrderDateStated: "December 2024",
      note: "Nationalisation applies to Kalaignar's underlying Tamil work; it does not extend to the project-created English translation or to third-party material. Distinct from the historical 1954 printed rights notice.",
    },
    provenanceHref: "/cinema/manohara/source",
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
