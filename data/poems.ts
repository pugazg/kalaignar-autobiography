// Poems (கவிதைகள்) — Digital Library Phase 4. Source-faithful poetry readers built from the
// authoritative poem source repository (pugazg/kalaignar-poems). Data-driven like the other
// Reading Rooms: each poem is vendored to public/data/poems/<slug>/{poem.json, provenance.json}
// by a deterministic, work-specific importer (scripts/import-<slug>.mjs) that pins the exact
// source commit. Runtime never calls GitHub and the source PDF is never vendored.
//
// A POEM IS NOT SPEECH PROSE. The governing Digital Library rule — ONE coherent library, MULTIPLE
// source-faithful reader types — means poetry gets its own reader and its own narrow model rather
// than reusing the speech reader: in prose a line break is typography, but in verse THE LINE IS
// THE TEXT. So the unit here is the source LINE. Lines are never merged into prose, never
// re-wrapped, and never split; a long line may WRAP visually on a narrow viewport, but that is
// presentation and never becomes two lines in the data.
//
// ── THE TWO DIMENSIONS (independent review correction) ───────────────────────────────────────────
// An earlier revision of this model folded every physical page transition into a "stanza", on the
// reasoning that the released Tamil assembly shows no blank line at a page edge. That was wrong,
// and the error is worth stating plainly because it is easy to repeat:
//
//   * the assembly stores each source page as its own FENCED block, so the fence structurally
//     CANNOT carry a blank line across the page edge. Absence of a blank there is an artefact of
//     the container, not a source statement about the printed page;
//   * the source archive does record cross-page continuity — but what it records is TEXTUAL /
//     RHETORICAL: "the final poetic line continues directly onto scan 14", "the final open
//     quotation continues onto scan 23". A sentence, a quotation or a rhetorical movement can run
//     on across a printed stanza break. Textual continuity does NOT establish stanza relation.
//
// The corrected model therefore keeps the two dimensions strictly separate, and resolves the
// typographic one only from explicit source evidence.
export type PoemLine = {
  /** The exact released source line, verbatim (leading indentation is carried in `indent`). */
  text: string;
  /** Leading indentation in SOURCE SPACES (0, 4, 8 …) where the release establishes it. */
  indent: number;
  /** The physical scan page this line is printed on. */
  sourceScan: number;
  /** The VISIBLE printed page number, or null where the source shows none (scan 26). Never inferred. */
  printedPage: number | null;
};

// TYPOGRAPHIC relation across a physical page transition. `unknown` is a first-class, honest
// value: it asserts NEITHER "same stanza" NOR "new stanza", and the reader renders it neutrally.
export type PoemStanzaRelation = "same-stanza" | "stanza-boundary" | "unknown";

// TEXTUAL / RHETORICAL relation across the same transition — a SEPARATE dimension. A transition
// can truthfully be a source-established textual continuation while its stanza relation is
// unknown. This field must never be read as typographic evidence.
export type PoemTextualRelation =
  | "source-established-continuation"
  | "source-established-non-continuation"
  | "not-specifically-recorded";

// Ordered boundary events between source lines.
//
//   "stanza-break"     — a blank line WHOLLY INSIDE one physical source page. The verified page
//                        record preserves that blank-line relation, so this IS source-established
//                        stanza structure.
//   "page-transition"  — a physical page edge. Its stanza relation is carried explicitly and is
//                        `unknown` unless a pinned source document establishes it.
export type PoemBoundary =
  | { kind: "stanza-break"; evidence: "source-blank-line"; sourceScan: number }
  | {
      kind: "page-transition";
      fromScan: number;
      toScan: number;
      stanzaRelation: PoemStanzaRelation;
      textualRelation: PoemTextualRelation;
      /** Verbatim citations from the pinned source repository supporting the two relations above. */
      evidence: { stanza: string[]; textual: string[] };
    };

// One ordered element of a language layer: a source line, or a boundary between lines.
export type PoemElement = ({ kind: "line" } & PoemLine) | PoemBoundary;

// TERMINOLOGY. A maximal run of consecutive lines with no boundary between them is a VERSE RUN,
// not a "stanza": where a run is bounded by a page transition whose relation is unknown, the
// printed stanza it belongs to is simply not established. Only a run delimited on both sides by
// source-established stanza structure (a blank line, or the start/end of the poem) is a
// source-established stanza — counted separately below. Nothing in this model reports a derived
// run count as a printed stanza count.
export type PoemLayer = {
  elements: PoemElement[];
  /** Total released source lines in this layer. */
  lineCount: number;
  /** Blank-line stanza breaks the source establishes WITHIN a page. */
  inPageStanzaBreaks: number;
  /** Maximal runs of lines between any two boundaries — a derived reading unit, NOT a stanza count. */
  verseRuns: number;
  /** Runs whose stanza membership IS fully source-established (no unresolved page edge touching them). */
  sourceEstablishedStanzas: number;
  /** Physical page transitions in this layer. */
  pageTransitions: number;
  /** Page transitions whose typographic stanza relation the source does not establish. */
  unresolvedStanzaRelations: number;
};

export type PoemBilingualText = { ta: string; en: string };
export type PoemBilingualName = { nameTa: string; nameEn: string };

// The source/context note printed ABOVE the poem (scan 13). It is METADATA, never verse: it is
// carried here so the reader can present the source-established occasion without inserting a single
// word of it into the poem body.
//
// `noteTa` is the VERBATIM printed Tamil note. `dateIso` / `venue` / `occasion` are the facts that
// note establishes. There is no released English translation of the note, so `noteEn` is a
// project-written description of those source facts and is labelled as such in the reader — it is
// never presented as part of the released English poem.
export type PoemSourceContext = {
  noteTa: string;
  noteEn: string;
  /**
   * ISO date the source context establishes for the poem's offering (1969-02-09).
   *
   * OPTIONAL, and that is the whole point of Wave 4. A printed context note does not automatically
   * establish a date, a venue or an occasion — this poem's note happens to establish all three, and
   * another work's note may establish none of them. An absent field means the source does not state
   * the fact; it is never filled with a guess, and never with `null` filler to satisfy the type.
   */
  dateIso?: string;
  /** The source-printed date exactly as printed ("9.2.1969"). */
  datePrinted?: string;
  venue?: PoemBilingualText;
  occasion?: PoemBilingualText;
};

export type Poem = {
  workId: string;
  slug: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  shelf: "poetry";
  readerStructure: "poem";
  subtype: "poem";
  title: PoemBilingualText;
  author: PoemBilingualName;

  /**
   * The source/context note printed above the poem — metadata, never verse.
   *
   * OPTIONAL. This work prints one; a poem whose scan prints no such note carries no `sourceContext`
   * at all rather than an empty or invented one. Omission is the truthful representation of "the
   * source does not print this", and it is not the same statement as an empty string.
   */
  sourceContext?: PoemSourceContext;

  // PUBLICATION metadata is deliberately NULLABLE and, for this work, NULL. The controlling scan
  // carries no standalone publication-year or edition statement. The 15.9.2008 foreword date is an
  // internal foreword date and is NEVER promoted to a publication/edition year. A field is left
  // unset rather than filled merely because the type allows it.
  publicationYear: number | null;
  editionStatement: string | null;

  /** Which source facts the examined scan does NOT establish (source facts, not defects). */
  factsNotStated: string[];

  transcriptionStatus: string;
  translationStatus: string;

  /** Authoritative verified Tamil source layer. */
  tamil: PoemLayer;
  /** RELEASE-COMPLETE project-created English translation layer. */
  english: PoemLayer;

  /** Scans the poem body covers (13–26). */
  poemScans: number[];
};

// Provenance manifest (provenance.json).
export type PoemProvenance = {
  workId: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: {
    titleTa: string;
    titleEn: string;
    authorTa: string;
    authorEn: string;
    scanFilename: string;
    scanSha256: string;
    scanFileSizeBytes: number;
    scanTotalPages: number;
    physicalVerification: string;
    poemScanPages: string;
    poemVerification: string;
    printedPageMapping: string;
    /**
     * OPTIONAL from here down: these record facts a PARTICULAR scan happens to carry.
     *
     * They were required when Poetry held exactly one work, which made every one of them look like
     * part of the form. They are not. A scan with no unnumbered pages has no unnumbered-scan note; a
     * poem printing no context note establishes no context date, venue or occasion; a work whose
     * source contains no foreword has no foreword-date note. Requiring them would force the next
     * import to invent a value or write an empty string, and an empty string asserts "the source
     * says nothing here", which is a different and stronger claim than saying nothing at all.
     */
    unnumberedScanNote?: string;
    sourcePdfCommitted: false;
    /** The verbatim printed context note above the poem, plus what it establishes. */
    contextNoteTa?: string;
    contextDatePrinted?: string;
    contextDateIso?: string;
    contextVenueTa?: string;
    contextVenueEn?: string;
    contextOccasionTa?: string;
    contextOccasionEn?: string;
    /** Publication metadata NOT established by the scan — recorded explicitly. */
    publicationNotEstablished: string;
    forewordDateNote?: string;
    /** Non-verse material locked out of the poem body. */
    lockedExclusions: string[];
  };
  verification: {
    tamilAssembly: string;
    tamilDiscrepancies: number;
    englishRelease: string;
    englishBatches: string;
    englishOmissions: number;
    englishDuplications: number;
    fullPoemVoiceReview: string;
  };
  archiveDerived: {
    tamilLines: number;
    tamilInPageStanzaBreaks: number;
    tamilVerseRuns: number;
    tamilSourceEstablishedStanzas: number;
    tamilIndentedLines: number;
    englishLines: number;
    englishInPageStanzaBreaks: number;
    englishVerseRuns: number;
    englishSourceEstablishedStanzas: number;
    englishIndentedLines: number;
    /** Physical page transitions inside the poem body (13→14 … 25→26). */
    pageTransitionsAudited: number;
    /** TYPOGRAPHIC dimension — resolved only from explicit source evidence. */
    stanzaRelationSameStanza: number;
    stanzaRelationStanzaBoundary: number;
    stanzaRelationUnresolved: number;
    /** TEXTUAL / RHETORICAL dimension — recorded separately, never read as stanza evidence. */
    textualContinuations: number;
    textualNonContinuations: number;
    textualNotRecorded: number;
    /** Per-transition audit table, so a reviewer can check every classification against its citations. */
    transitions: {
      fromScan: number;
      toScan: number;
      stanzaRelation: PoemStanzaRelation;
      textualRelation: PoemTextualRelation;
      stanzaEvidence: string[];
      textualEvidence: string[];
    }[];
    boundaryNote: string;
    provenanceGranularity: string;
    terminologyNote: string;
    note: string;
  };
  /** Source facts only an upstream source-archive review can settle. */
  blockers?: {
    item: string;
    count: number;
    detail: string;
    resolution: string;
  }[];
  projectRights: {
    appliesTo: string;
    rightsStatus: string;
    rightsAuthority: string;
    rightsAction: string;
    rightsAnnouncementDate: string;
    governmentOrderNumber: string | null;
    governmentOrderDate: string | null;
    governmentOrderHandoverDate: string | null;
    distinctionNote: string;
    thirdPartyNote: string;
    projectTranslationNote: string;
    evidencePending: string;
  };
  notes: string[];
};

// Integrated STANDALONE poem slugs (build/import authority; the public catalog entry lives in
// data/library.ts). One poem today; Wave 4 P1 adds three more standalone works to this list.
export const POEM_SLUGS = ["idhayathai-thanthidu-anna"] as const;
export type PoemSlug = (typeof POEM_SLUGS)[number];

// ── Poetry publications — Wave 4 foundation ─────────────────────────────────────────────────────────
// A POETRY PUBLICATION is one catalogue work whose printed contents are several numbered poems. It is
// the Essays shape (one work, many reading units), NOT the Fiction shape (many works, one collection),
// and the difference is source-driven rather than stylistic: the 1977 anthology's 37 stories each hold
// an independent source directory and independent archival identity, whereas these items exist only as
// `sections/NN.md` inside one publication workspace under one controlling scan. Modelling them as a
// LibraryCollection would assert independent works the archive never established.
//
// NOTHING IS PUBLISHED BY THESE TYPES. The registry below is deliberately empty: P0 adds the shape so
// that P2 and P3 are declaration-and-importer work rather than model work, and so the slug rules below
// exist before the first item slug is ever minted.

/**
 * One numbered poem/item inside a publication.
 *
 * `ordinal` is the source's own `item:` number and is a POSITION, never an identity: it orders the
 * contents and it may change if a source correction reorders them. `slug` is the identity, and the two
 * are kept apart on purpose — see POETRY_ITEM_SLUG_RULES.
 */
export interface PoetryItem {
  ordinal: number;
  slug: string;
  titleTa: string;
  /**
   * The contents-page title where it differs from the canonical title witness.
   *
   * A SEPARATE SOURCE WITNESS, not a correction. `கலைஞரின் கவிதைகள்` item 01 prints
   * `இதயத்தைத் தந்திடு அண்ணா!` in its contents and `இதயத்தைத் தந்திடு அண்ணா` at the poem itself; both
   * are what the book says, and neither is normalized into the other. Absent when they agree.
   */
  contentsTitleTa?: string;
  titleEn: string;
  /** Physical scan runs, in source order. Non-contiguous runs are preserved, never flattened. */
  physicalScans: { first: number; last: number }[];
  /** Printed page range where the source prints page numbers; absent where it does not. */
  printedPages?: { first: number; last: number };
  tamil: PoemLayer;
  english: PoemLayer;
}

/**
 * A source-established group/divider in an anthology's printed structure.
 *
 * Publication STRUCTURE, carried as provenance. A divider is not a poem and never becomes one, and no
 * group is invented for a publication whose source establishes none.
 */
export interface PoetryPublicationGroup {
  ordinal: number;
  titleTa: string;
  contentsTitleTa?: string;
  itemOrdinals: number[];
}

export interface PoetryPublication {
  workId: string;
  slug: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  /** The frozen work-tree pin. The commit alone is a weak guard when a repository holds many works. */
  sourceTree: string;
  shelf: "poetry";
  readerStructure: "poetry-publication";
  subtype: "poetry-publication";
  title: PoemBilingualText;
  author: PoemBilingualName;
  /** Nullable and left null unless the publication's own source states it. Never inferred. */
  publicationYear: number | null;
  editionStatement: string | null;
  items: PoetryItem[];
  /** Source-backed item total; validated against `items.length` rather than trusted. */
  itemCount: number;
  groups?: PoetryPublicationGroup[];
}

/** Registry, empty until P2/P3 declare the two publications. Routes are driven from it. */
export const POETRY_PUBLICATION_SLUGS = [] as const;

/**
 * Rules every publication item slug must satisfy, enforced by the Wave-4 validator.
 *
 * SLUGS ARE PROJECT-CREATED, NOT SOURCE-PRINTED. They come from the slug body already committed in the
 * released English item filenames (`01-give-me-your-heart-anna-en.md` → `give-me-your-heart-anna`), so
 * they are curated identifiers the translation layer already fixed — not something the printed book
 * states. The importer reads one during onboarding and the result is FROZEN in the declaration: a later
 * source filename or title change must never silently move a published URL, and item routes are
 * generated from the frozen roster rather than from `1..N`.
 */
export const POETRY_ITEM_SLUG_RULES = {
  /** Segments that already mean something under a publication route and can never be an item slug. */
  reservedSegments: ["source", "items"] as const,
  pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// ── Alternate source witnesses ──────────────────────────────────────────────────────────────────────
/**
 * A DECLARED relationship between two witnesses of the same canonical poem.
 *
 * Only two are established, both by the source-side cross-witness audit, and both are written out.
 * Nothing here is inferred: title equality never creates a relationship and title difference never
 * refutes one, which is why this is a small explicit registry rather than a `canonicalPoemId` on all
 * 135 items — 133 of which have no established relationship to assert.
 *
 * An endpoint is either a standalone work (`slug` alone) or one item inside a publication
 * (`slug` + `itemSlug`).
 */
export interface PoetryWitnessEndpoint {
  slug: string;
  itemSlug?: string;
}

export interface PoetryWitnessRelation {
  relation: "same-canonical-poem-alternate-witness";
  a: PoetryWitnessEndpoint;
  b: PoetryWitnessEndpoint;
  /**
   * Public, bilingual, and deliberately weak: it says another witness exists. It must not say the two
   * texts agree, must not present either as superseding the other, and must not carry any part of a
   * witness-local editorial decision across to the other witness.
   */
  publicNote: PoemBilingualText;
}

/** Empty until P3 lands the two relationships in the same PR as the publication that needs them. */
export const POETRY_WITNESS_RELATIONS: PoetryWitnessRelation[] = [];
