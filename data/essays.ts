// Essays & Articles (கட்டுரைகள்) — Digital Library Phase 5. Source-faithful article readers built
// from the authoritative essay source repository (pugazg/kalaignar-essays). Data-driven like the
// other Reading Rooms: the publication is vendored to
// public/data/essays/<slug>/{publication.json, provenance.json} by a deterministic, work-specific
// importer (scripts/import-<slug>.mjs) that pins the exact source commit. Runtime never calls
// GitHub and the source PDF is never vendored.
//
// AN ARTICLE IS NOT A SPEECH, A POEM OR A SCENE. The governing Digital Library rule — ONE coherent
// library, MULTIPLE source-faithful reader types — gives Essays its own reader and its own narrow
// model:
//
//   * a SPEECH is one long prose stream with printed section headings;
//   * a POEM's unit is the source LINE;
//   * an ARTICLE publication is a set of independently titled, source-numbered ARTICLES, each of
//     which is ordinary prose: paragraphs, quoted passages, source-supported subheadings.
//
// So the unit here is the ARTICLE, and the publication is ONE catalog work containing 14 of them —
// never 14 catalog works.

// ── PRINTED PAGINATION IS EVIDENCE, NOT A GUARANTEE (Wave-3 generalization) ─────────────────────────
// The reference publication numbers every article page, so an earlier revision made `printed` a plain
// number. Three Wave-3 publications disprove that as a general rule:
//
//   * கயிற்றில் தொங்கிய கணபதி — the article's OPENING scan carries no visible printed numeral;
//   * உணர்ச்சிமாலை — every article opening is unnumbered, and scan 20 shows a printed `1` while the
//     archive explicitly refuses to infer `19` for scan 19;
//   * திராவிட சம்பத்து — a damaged pamphlet with NO visible printed pagination at all.
//
// `printed` is therefore `number | null`. `null` means "the source shows none", and it must never be
// rendered as 0, -1, an inferred neighbour, or a fabricated sequence.
/** Where a block sits in the printed source. A block may span more than one printed page. */
export type ArticleSourcePage = { scan: number; printed: number | null };

// ── TWO INDEPENDENT DIMENSIONS (independent review correction) ────────────────────────────────────
// An earlier revision gave a whole source paragraph ONE semantic kind, decided largely by whether it
// opened with a quotation mark. That is wrong for this source: a single printed paragraph regularly
// carries QUOTED third-party text and then Kalaignar's own framing, and typing the whole paragraph
// as "quotation" rendered his commentary inside <blockquote> — attributing his voice to the person
// he is quoting. The model therefore keeps the two dimensions apart:
//
//   A. SOURCE BLOCK STRUCTURE  — paragraph | subheading | attribution
//   B. VOICE STRUCTURE INSIDE A BLOCK — ordered authored-text / quoted-text segments
//
// A paragraph is never split to make rendering easier, and source paragraphs are never merged
// because a quotation continues.
export type ArticleVoice = "authored-text" | "quoted-text";

/** One ordered run of a single voice inside a block. Source quotation punctuation is retained. */
export type ArticleSegment = { kind: ArticleVoice; text: string };

export type ArticleBlock = {
  /** SOURCE structure only — the voice mix lives in `segments`. */
  kind: "paragraph" | "subheading" | "attribution";
  /** Ordered voice segments. A pure-authored block has one authored segment; a pure-quotation block
   *  has only quoted segments; a MIXED block has both and must never render wholly as a quote. */
  segments: ArticleSegment[];
  /** Verbatim released text of the whole block (the segments concatenate back to exactly this). */
  text: string;
  /** True when the block carries both voices — the case the earlier model got wrong. */
  mixedVoice: boolean;
  /**
   * Every printed page this ONE block occupies, in order. A block that continues across a printed
   * page carries both pages — provenance never forces the block to be split.
   */
  sourcePages: ArticleSourcePage[];
};

// A translator/editorial note released alongside the English article. The source labels these
// explicitly as NOT part of Kalaignar's text, and they are carried OUTSIDE the body so they can
// never be mistaken for his prose.
export type ArticleNote = {
  kind: "translator-note";
  text: string;
  /** Verbatim source label establishing that this is not authored body text. */
  notPartOfAuthoredText: true;
};

// Relation across a printed-page transition inside one article. All three values require POSITIVE
// source evidence except `unknown`, which is the honest default.
//
//   "same-block"     — the archive POSITIVELY records that the paragraph/quotation continues across
//                      the page (a page record's audit note says so).
//   "block-boundary" — the archive POSITIVELY records that a new source block begins at the page.
//   "unknown"        — the archive establishes NEITHER. Absence of a continuation note is NOT
//                      boundary evidence: nothing in the source repository states that continuation
//                      notes are exhaustive. An unresolved edge is preserved as unresolved.
export type ArticlePageRelation = "same-block" | "block-boundary" | "unknown";

export type ArticlePageTransition = {
  fromScan: number;
  toScan: number;
  /** `null` where the source prints no numeral. The transition is still provenance evidence. */
  fromPrinted: number | null;
  toPrinted: number | null;
  relation: ArticlePageRelation;
  /** Verbatim citations from the pinned source repository supporting the relation, if any. */
  evidence: string[];
};

export type ArticleBilingualText = { ta: string; en: string };

// ── AN ARTICLE'S SCAN COVERAGE IS AN ORDERED LIST OF RUNS (Wave-3 generalization) ──────────────────
// An earlier revision used `scanPages: { from, to }`, which can only describe ONE ascending contiguous
// range. `திராவிட சம்பத்து` is a damaged pamphlet whose PDF is not in publication reading order, and
// its two articles are physically scattered:
//
//   Article 1 `திராவிட சம்பத்து`   — scans 5–6, then 13–16
//   Article 2 `ஐயர் அறிவிக்கிறார்!` — scan 12, then scan 3   ← descending, and deliberately so
//
// Collapsing those into `5–16` and `3–12` would assert page membership and ordering the source
// contradicts. So coverage is an ORDERED list of runs, and order is meaningful: a contiguous article
// simply has exactly one run. There is deliberately no second "simple" representation — one fact, one
// field, so the two can never disagree.
export type ArticleScanRun = { from: number; to: number };

// How the printed pagination of ONE article is established. A discriminated union rather than a
// nullable range, so "no printed pagination" is a stated source fact rather than a missing value the
// UI has to guess at.
export type ArticlePrintedPages =
  /** A genuine contiguous printed range. `note` carries any source qualification (e.g. an unnumbered opening). */
  | { kind: "range"; from: number; to: number; note?: string }
  /** Some printed numerals are visible but they do not form a usable range. Nothing is inferred. */
  | { kind: "partial"; note: string }
  /** The source shows no printed pagination for this article at all. */
  | { kind: "none"; note: string };

/**
 * Where an article's ordinal comes from.
 *
 *   "printed-contents" — the publication prints a contents page that numbers the articles;
 *   "archive-ordinal"  — the publication prints NO contents page, and the number is the archive's
 *                        reading ordinal. It must never be described as printed in the publication.
 *
 * All three Wave-3 publications are `archive-ordinal`: none has a printed contents page.
 */
export type ArticleNumberSource = "printed-contents" | "archive-ordinal";

export type Article = {
  /**
   * The article's ordinal. Whether it is a PRINTED number or an archive reading ordinal is stated by
   * `numberSource` — the two must never be conflated, because a publication with no contents page
   * cannot have printed one.
   */
  number: number;
  numberSource: ArticleNumberSource;
  slug: string;
  /** The verified heading-page Tamil title — what the reader shows. */
  titleTa: string;
  /**
   * The printed CONTENTS-page Tamil title, carried separately ONLY where it differs from the
   * heading-page witness (articles 5 and 14). Never merged into one normalized string.
   */
  contentsTitleTa?: string;
  /** Released project-created English title. */
  titleEn: string;
  /** Ordered scan runs, in SOURCE READING ORDER. A contiguous article has exactly one run. */
  scanRuns: ArticleScanRun[];
  printedPages: ArticlePrintedPages;
  tamil: { blocks: ArticleBlock[] };
  english: { blocks: ArticleBlock[]; notes: ArticleNote[] };
  /** Printed-page transitions inside this article, with their audited relations. */
  pageTransitions: ArticlePageTransition[];
};

export type EssayPublication = {
  workId: string;
  slug: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  shelf: "essays-articles";
  readerStructure: "article";
  /**
   * The source FORM of the publication. `essay-collection` was the only value while the reference
   * work was the only publication; Wave 3 adds a one-article pamphlet and a damaged pamphlet whose
   * reading order had to be reconstructed. The form is a source fact, not a catalogue category.
   */
  subtype: "essay-collection" | "single-article-pamphlet" | "reconstructed-pamphlet";
  title: ArticleBilingualText;
  author: ArticleBilingualText;
  /**
   * Edition facts, kept strictly apart and now HONESTLY OPTIONAL.
   *
   * The reference publication was first published in 1956 and the scan integrated here is the 2018
   * reprint, so the two must never be merged. But that distinction is a fact about THAT book. All
   * three Wave-3 publications are first editions with no later reprint, and their sources establish
   * different subsets of the edition facts. Rather than fabricate a reprint, a year or a month to
   * satisfy a required field, each part is optional and `controllingIsFirstEdition` states plainly
   * whether a reprint distinction exists at all.
   */
  firstEdition?: EssayEdition;
  /** Present ONLY when the controlling scan is a different edition from the first. */
  controllingEdition?: EssayEdition;
  /** True when the scan integrated here IS the first edition — no reprint distinction exists. */
  controllingIsFirstEdition: boolean;
  /**
   * Printed page count recorded in the source's own நூல் குறிப்பு. OPTIONAL: three Wave-3 sources
   * establish no publication-wide printed page count, and a physical scan count is a different fact
   * that must never be substituted for it.
   */
  printedPageCount?: number;
  /**
   * The publication's reconstructed reading order, as scan numbers in reading sequence. Present only
   * where the physical scan order is NOT the reading order — `திராவிட சம்பத்து` is bound out of
   * order, and its archive records a `reading_order` on every page. Where present this is the
   * authority; numeric scan order must never silently replace it.
   */
  readingOrder?: number[];
  articles: Article[];
  articleCount: number;
};

/** One edition statement. Every part beyond the source's own wording is optional. */
export type EssayEdition = {
  /** The source's own edition line, verbatim. */
  statementTa: string;
  year?: number;
  monthTa?: string;
  publisherTa?: string;
  publisherLineTa?: string;
  /** The printed price, where the source shows one. */
  priceTa?: string;
};

export type EssayProvenance = {
  workId: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: {
    titleTa: string;
    titleEn: string;
    authorTa: string;
    scanFilename: string;
    scanSha256: string;
    scanFileSizeBytes: number;
    scanTotalPages: number;
    physicalVerification: string;
    strictFidelityReview: string;
    articleAssemblies: string;
    unresolvedTamilFidelityItems: number;
    firstEditionTa?: string;
    controllingEditionTa?: string;
    titlePagePublisherTa?: string;
    printedPageCount?: number;
    /** The source's own edition/price witnesses, verbatim, where no reprint distinction applies. */
    editionWitnessesTa?: string[];
    /**
     * Physical damage the archive records and deliberately did NOT reconstruct. `திராவிட சம்பத்து`
     * is torn; the archive's rule is that lost text is never restored from context, and this carries
     * that rule onto the public provenance page rather than leaving the gap unexplained.
     */
    physicalCondition?: { conditionTa: string; reconstructionPolicy: string };
    /** Present where the publication's reading order had to be reconstructed from the physical scans. */
    readingOrderNote?: string;
    sourcePdfCommitted: false;
    /** Article number → scan/printed mapping, verbatim from the source records. */
    articleMap: {
      number: number;
      titleTa: string;
      contentsTitleTa?: string;
      titleEn: string;
      /** Verbatim source range string — may be non-contiguous, e.g. `5–6, 13–16`. */
      scanPages: string;
      /** Verbatim printed-page witness, e.g. `6–14; scan 6 has no visible printed numeral` or `none visible`. */
      printedPages: string;
      numberSource: ArticleNumberSource;
    }[];
    /** Source-witness distinctions the archive records and this integration preserves. */
    titleWitnessNotes: string[];
    /** Material excluded from every article body. */
    lockedExclusions: string[];
  };
  english: {
    releaseTitle: string;
    kind: "project-created";
    articlesVerified: string;
    consistencyReview: string;
    releaseCloseout: string;
    releaseGate: string;
    unresolvedTranslationQuestions: number;
    releaseBlockers: number;
    translatorNotesSeparated: string;
    labelPolicy: string[];
  };
  archiveDerived: {
    articles: number;
    /** SOURCE block structure. */
    tamilBlocks: number;
    englishBlocks: number;
    tamilSubheadings: number;
    englishSubheadings: number;
    tamilAttributions: number;
    englishAttributions: number;
    /** VOICE inventory — a separate dimension from block structure. */
    tamilAuthoredOnlyParagraphs: number;
    englishAuthoredOnlyParagraphs: number;
    tamilQuotationOnlyParagraphs: number;
    englishQuotationOnlyParagraphs: number;
    tamilMixedVoiceParagraphs: number;
    englishMixedVoiceParagraphs: number;
    tamilQuotedSegments: number;
    englishQuotedSegments: number;
    translatorNotes: number;
    /** CROSS-PAGE relation audit — positive evidence only. */
    pageTransitionsAudited: number;
    relationSameBlock: number;
    relationBlockBoundary: number;
    relationUnknown: number;
    crossPageBlocks: number;
    voiceNote: string;
    boundaryNote: string;
    provenanceGranularity: string;
    note: string;
  };
  blockers?: { item: string; count: number; detail: string; resolution: string }[];
  /**
   * OPTIONAL. The reference publication carries a project-rights record that its own source and
   * project evidence support. Wave-3 preflight found no publication-specific rights determination
   * for the three 1949–1951 pamphlets, so they carry NONE rather than inheriting a block that was
   * never established for them. An absent rights record is an honest absence, not an oversight, and
   * the provenance page renders correctly without one.
   */
  projectRights?: {
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
    quotedThirdPartyNote: string;
    evidencePending: string;
  };
  notes: string[];
};

// Integrated essay publication slugs (build/import authority; the public catalog entry lives in
// data/library.ts). Phase-5 Benchmark #1 integrated the first publication; Bulk Onboarding Wave 3
// added three more from `pugazg/kalaignar-essays` at a LATER source pin than the reference work's.
export const ESSAY_SLUGS = [
  "sakkaravarththiyin-thirumagan",
  // ── Bulk Onboarding Wave 3 — three 1949–1951 pamphlets, one frozen source release ─────────────
  "kayittril-thongiya-kanapathi",
  "unarchchimaalai",
  "thiraavida-sampaththu",
] as const;
export type EssaySlug = (typeof ESSAY_SLUGS)[number];
