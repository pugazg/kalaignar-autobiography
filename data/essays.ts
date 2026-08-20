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

/** Where a block sits in the printed source. A block may span more than one printed page. */
export type ArticleSourcePage = { scan: number; printed: number };

// One block of an article's body. Only the structures this source actually uses are modelled —
// there is deliberately no general literary AST.
//
//   "paragraph"  — ordinary authored prose.
//   "quotation"  — a quoted passage the source sets apart (Kalaignar quoting Achariyar, Nehru,
//                  Kambar …). Kept distinct so the reader never blurs Kalaignar's framing into the
//                  voice he is quoting.
//   "subheading" — a heading PRINTED IN THE SOURCE inside the article body.
//   "attribution"— a source-bolded citation line closing a quotation, e.g. "(Achariyar in Kalki,
//                  May 23.)".
export type ArticleBlock = {
  kind: "paragraph" | "quotation" | "subheading" | "attribution";
  /** Verbatim released text (inline Markdown emphasis preserved as released). */
  text: string;
  /**
   * Every printed page this ONE block occupies, in order. A block that continues across a printed
   * page carries both pages — provenance never forces the block to be split (see PAGE BOUNDARY ≠
   * PARAGRAPH BOUNDARY in the importer).
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

// TYPOGRAPHIC relation across a printed-page transition inside one article.
//
//   "same-block"       — the source archive explicitly records that the paragraph/quotation
//                        continues across the page (the page records' audit notes state it).
//   "block-boundary"   — the transition falls between two complete blocks. The archive verifies
//                        every page record's paragraph structure and paragraph continuation against
//                        the scan (83/83 strict PASS) and records a continuation whenever one
//                        exists, so a verified page pair with no continuation record is a boundary.
//   "unknown"          — reserved: neither could be established. Rendered neutrally, never guessed.
export type ArticlePageRelation = "same-block" | "block-boundary" | "unknown";

export type ArticlePageTransition = {
  fromScan: number;
  toScan: number;
  fromPrinted: number;
  toPrinted: number;
  relation: ArticlePageRelation;
  /** Verbatim citations from the pinned source repository supporting the relation. */
  evidence: string[];
};

export type ArticleBilingualText = { ta: string; en: string };

export type Article = {
  /** Source-supported article number printed in the publication's contents page (1–14). */
  number: number;
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
  scanPages: { from: number; to: number };
  printedPages: { from: number; to: number };
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
  subtype: "essay-collection";
  title: ArticleBilingualText;
  author: ArticleBilingualText;
  /**
   * Edition facts, kept strictly apart. `firstEdition` is the publication's own history; the
   * CONTROLLING source actually scanned and integrated is `controllingEdition`. The controlling
   * scan is the 2018 reprint and must never be described as a 1956 scan — nor may the 1956 history
   * be erased.
   */
  firstEdition: { statementTa: string; year: number; monthTa: string; publisherTa: string };
  controllingEdition: { statementTa: string; year: number; publisherLineTa: string };
  /** Printed page count recorded in the source's own நூல் குறிப்பு. */
  printedPageCount: number;
  articles: Article[];
  articleCount: number;
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
    firstEditionTa: string;
    controllingEditionTa: string;
    titlePagePublisherTa: string;
    printedPageCount: number;
    sourcePdfCommitted: false;
    /** Article number → scan/printed mapping, verbatim from the source records. */
    articleMap: {
      number: number;
      titleTa: string;
      contentsTitleTa?: string;
      titleEn: string;
      scanPages: string;
      printedPages: string;
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
    tamilBlocks: number;
    englishBlocks: number;
    tamilSubheadings: number;
    englishSubheadings: number;
    tamilQuotations: number;
    englishQuotations: number;
    translatorNotes: number;
    pageTransitionsAudited: number;
    relationSameBlock: number;
    relationBlockBoundary: number;
    relationUnknown: number;
    crossPageBlocks: number;
    boundaryNote: string;
    provenanceGranularity: string;
    note: string;
  };
  blockers?: { item: string; count: number; detail: string; resolution: string }[];
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
    quotedThirdPartyNote: string;
    evidencePending: string;
  };
  notes: string[];
};

// Integrated essay publication slugs (build/import authority; the public catalog entry lives in
// data/library.ts). Phase-5 Benchmark #1 integrates exactly one publication.
export const ESSAY_SLUGS = ["sakkaravarththiyin-thirumagan"] as const;
export type EssaySlug = (typeof ESSAY_SLUGS)[number];
