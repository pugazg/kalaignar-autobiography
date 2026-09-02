// Fiction — Short stories (சிறுகதை / கற்பனையுரை) — Digital Library Phase 8, Benchmark B. Source-faithful
// short-story readers built from the authoritative short-story source repository
// (pugazg/kalaignar-short-stories). Data-driven like every other Reading Room: the work is vendored to
// public/data/stories/<slug>/{story.json, provenance.json} by a deterministic, work-specific importer
// (scripts/import-<slug>.mjs) that pins the exact source commit. Runtime never calls GitHub and the
// source PDF is never vendored.
//
// A SHORT STORY IS NOT A NOVEL. Both live on the Fiction shelf, but they are different source objects
// and therefore get different models:
//
//   * `balipeedam-nokki` (novel) is ONE narrative that the source archive's own assembled reading layer
//     divides into three ordered SECTIONS, each with its own slug and route;
//   * `kizhavan-kanavu` (this form) is ONE CONTINUOUS story with no printed divisions at all — a title,
//     a form note, and an unbroken prose stream from scan 7 to scan 22.
//
// Forcing a continuous story into the novel's section model would invent a division the printed booklet
// does not have. So a story is modelled as what it is: an ordered BLOCK STREAM, the same shape the
// speech Reading Room already established for continuous prose.
//
// ── THE SCAN BOUNDARY IS NOT A PARAGRAPH BOUNDARY ───────────────────────────────────────────────────
// The governing source-fidelity rule, carried over from the speech model. One LOGICAL paragraph may run
// across several physical scans, so a paragraph holds ordered per-scan text SEGMENTS, each carrying its
// own scan and printed page, joined for reading by an explicit `joinToNext`:
//   - "space"   — an ordinary word boundary at the scan edge → a single space;
//   - "none"    — the scan splits a WORD → join with NO space;
//   - "unknown" — the exact printed joined-vs-spaced form is UNRESOLVED. The reader must NOT silently
//                 choose a space or a concatenation; it keeps the uncertainty visible as an unlabelled
//                 mark and exposes no scan metadata in the reading interface — the archival detail
//                 lives on the work's provenance page;
//   - "end"     — last segment of the paragraph.
// `kizhavan-kanavu` uses only "space" and "end". The other two are part of the model because a reader
// that does not handle them would have to guess, and guessing is the failure this vocabulary exists to
// prevent.
export type StoryJoin = "space" | "none" | "unknown" | "end";

// ── TWO SOURCE FORMS, ONE READER ────────────────────────────────────────────────────────────────────
// Wave 2 (the 1977 anthology `கலைஞர் கருணாநிதியின் சிறுகதைகள்`) added 37 stories that are NOT booklets.
// They are printed inside one 260-scan collection, and they simply do not have several facts the
// standalone booklet has: no printed form label under the title, no per-story authorship line, no
// story-specific physical publication, no publisher errata, and no scan whose printed page is unknown.
//
// The honest fix is a DISCRIMINATOR plus optional blocks — not fabricating booklet facts for anthology
// stories to satisfy a type. A field that exists only because one source prints it must never be
// invented for a source that does not.
export type StorySourceForm = "standalone-booklet" | "anthology-story";

/**
 * Where an anthology story sits in its collection. This is the story's own placement — its printed order
 * and its own scan/page extent — NOT a restatement of collection-wide facts, which live in provenance.
 */
export type StoryAnthologyPlacement = {
  collectionSlug: string;
  collectionTitleTa: string;
  /** Printed order within the anthology, 1-based. Read from the completion register, never re-derived. */
  order: number;
  printedPages: { first: number; last: number };
  sourceScans: { first: number; last: number };
};

// One per-scan fragment of a logical paragraph.
//
// `printedPage` is NULLABLE and that is load-bearing: scan 7 of `kizhavan-kanavu` carries no printed
// page number, and 3 is NOT inferred from scan 8's printed 4. A printed page number must be READ from
// the source, never derived from its neighbour — so the type has to be able to say "the source shows
// none", and every consumer has to handle that rather than rendering a hole or a guess.
export type StoryTextSegment = {
  text: string;
  sourceScan: number;
  printedPage: number | null;
  joinToNext: StoryJoin;
};

export type StoryParagraph = { kind: "paragraph"; segments: StoryTextSegment[] };

/** A heading PRINTED IN THE SOURCE — for this story, the booklet's own title card on scan 7. */
export type StoryHeading = { kind: "heading"; text: string; sourceScan: number; printedPage: number | null };

/** A printed parenthetical note — for this story, the form label `(கற்பனையுரை)` under the title. */
export type StoryNote = { kind: "note"; text: string; sourceScan: number; printedPage: number | null };

// A NEUTRAL boundary whose paragraph RELATIONSHIP the archive does not establish: the preceding fragment
// CLOSES a sentence at the scan edge and the next scan opens a new one, so whether the printed booklet
// continued the same paragraph or began a new one is unresolved. The archive records no per-boundary
// adjudication for this story, so this is left explicitly unresolved rather than guessed. The reader
// groups the runs on either side into a single non-`<p>` group, asserting NEITHER a paragraph break NOR
// a continuation.
export type StoryUnresolvedBreak = { kind: "unresolved-break"; toScan: number; relation: "unknown"; note?: string };

/** One ordered block of a story's Tamil or English stream. */
export type StoryBlock = StoryParagraph | StoryHeading | StoryNote | StoryUnresolvedBreak;

export type Story = {
  workId: string;
  slug: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  shelf: "fiction";
  subtype: "short-story";
  readerStructure: "story";
  title: { ta: string; en: string };
  /**
   * Which source form this story is.
   *
   * OPTIONAL because `kizhavan-kanavu` was generated before this discriminator existed and its data is
   * deliberately left byte-identical — adding a field to it would weaken the regression evidence for no
   * gain. ABSENT therefore means `"standalone-booklet"`, the original form. Consumers that need to
   * branch should test the shape they actually need (`anthology`, `formLabel`) rather than assume this
   * field is present.
   */
  sourceForm?: StorySourceForm;
  /**
   * The form label the BOOKLET ITSELF prints under the title (`கற்பனையுரை`). It is the source's own word
   * for what this piece is, so it is carried as source text, not as a catalogue category. There is no
   * `en` here: the booklet prints no English form label, and one is not invented.
   *
   * OPTIONAL, and that is load-bearing: the 1977 anthology prints no form label above any of its 37
   * stories, so they carry none. `கற்பனையுரை` belongs to `kizhavan-kanavu` alone and must never be
   * copied onto an anthology story to fill this field.
   */
  formLabel?: { ta: string };
  author: {
    nameTa: string;
    /**
     * The printed authorship line, verbatim: `தீட்டியவர்: மு. கருணாநிதி.`
     *
     * OPTIONAL: the anthology credits its author once, on the book's own title page, and prints no
     * per-story byline. Synthesising one from the collection credit would assert a line the story page
     * does not carry.
     */
    printedAuthorshipLineTa?: string;
  };
  /** Present exactly when `sourceForm` is `"anthology-story"`. */
  anthology?: StoryAnthologyPlacement;
  /** The authoritative source transcription. */
  tamil: { blocks: StoryBlock[] };
  /** The project-created English reading translation. The Tamil remains authoritative. */
  english: { blocks: StoryBlock[] };
  /** Exact scans of the controlling PDF that the story occupies. */
  sourceScans: number[];
};

// ── PROVENANCE ──────────────────────────────────────────────────────────────────────────────────────
// A story's provenance record is NOT a speech's. Only `workId`, `sourceRepo`, `sourcePath`,
// `sourceCommit` and `source` are shared; everything below is specific to this form, and the speech
// record's `transcription`/`translation`/`archiveDerived`/`blockers`/`projectRights`/`notes` do not exist
// here. That is why the Fiction short story gets its own provenance component rather than borrowing one.

export type StoryProvenanceSource = {
  printedTitleTa: string;
  /** Booklet-only: the anthology prints no per-story authorship line. */
  printedAuthorshipLineTa?: string;
  editionStatementTa: string;
  scanFilename: string;
  scanSha256: string;
  scanFileSizeBytes: number;
  scanTotalPages: number;
  controllingSourceNote: string;
};

/**
 * The STORY's own verification state — scans 7–22 only. Kept structurally apart from
 * `physicalPublication` so the booklet-wide figure can never be read as a statement about the story.
 */
export type StoryScope = {
  storyScans: string;
  storyScanCount: number;
  verified: number;
  blocked: number;
  unresolvedReadings: number;
  complete: boolean;
  /** The story's closing sentence, verbatim — the evidence that the ending is where it is said to be. */
  conclusionTa: string;
  boundaryNote: string;
};

/**
 * The WHOLE BOOKLET's verification state, including the front matter the story does not occupy. Two of
 * 26 scans are not verified; both are non-story front matter. This is a fact about the physical copy,
 * NOT about the story, and the reader has to be told which it is looking at.
 */
export type StoryPhysicalPublication = {
  totalScans: number;
  verified: number;
  blocked: number;
  blockedScans: number[];
  blockedClassification: string;
  note: string;
};

/** The one scan for which the archive establishes no printed page. Nothing is inferred for it. */
export type StoryPrintedPageUncertainty = {
  scan: number;
  printedPage: null;
  note: string;
};

/**
 * A publisher's erratum printed on scan 23. These are a SEPARATE WITNESS to the same lines, not
 * corrections to apply: `appliedToReadingText` is false, and the reading text keeps the archival page
 * reading in every case. The demonstrative case is the one where the two witnesses actually disagree in
 * substance — the page reads `வைத்திருந்தான்`, the erratum says `வைத்திருந்தாள்` — and both are recorded.
 */
export type StoryErratum = {
  printedPage: number;
  sourceScan: number;
  line: number;
  printedCorrection: string;
  pageRecord: string;
};

export type StoryErrata = {
  correctionCount: number;
  printedOnScan: number;
  policy: string;
  appliedToReadingText: false;
  demonstrativeCase: {
    printedPage: number;
    sourceScan: number;
    archivalReadingTa: string;
    publisherErratumTa: string;
    note: string;
  };
  corrections: StoryErratum[];
};

export type StoryTamilAssembly = {
  authority: string;
  derivedAssembly: string;
  reconciled: boolean;
  note: string;
};

/**
 * How cross-scan sentence continuations were joined. `individualAdjudication` is FALSE: the join is an
 * archive-wide normalisation RULE, not a per-boundary decision, and the archive records no evidence that
 * any of these 15 transitions was checked individually against the scan. The provenance page must say so
 * in those words — a policy applied uniformly is weaker evidence than a boundary someone looked at, and
 * presenting the two as the same would overstate what is known.
 */
export type StoryCrossScanJoinPolicy = {
  policy: string;
  basis: string;
  individualAdjudication: false;
  transitions: number;
  appliedBoundaries: number;
  unresolvedBoundaries: number;
  note: string;
};

/**
 * The English layer. `kind: "project-created"` — an archive-produced translation derived from the
 * project's own final Tamil reading, not a separately published translation.
 *
 * `archiveStatus.statusAsRecorded` is the source archive's own label (`editorial-reviewed`). It is
 * carried because it is what the record says, and it is carried WITH its note, because the label does
 * not establish that a human editorial review was completed. No human-review claim is made anywhere in
 * this Reading Room.
 */
export type StoryEnglishProvenance = {
  titleEn: string;
  sourceScans: string;
  scanAnchors: number;
  blockedSourceLocations: number;
  kind: "project-created";
  kindBasis: string;
  archiveStatus: { statusAsRecorded: string; note: string };
  paragraphingNote: string;
};

/**
 * The archive's forward-looking recheck queue. An entry there is a place worth looking at again — not a
 * known error, not a downgrade of the story's verified status, and not evidence that a human review has
 * been completed.
 */
export type StoryReviewQueue = { exists: boolean; file: string; note: string };

/**
 * The anthology this story is printed in. Collection-level facts stay HERE, at collection level: the
 * 260-scan total, the shared SHA-256, the 37-story count. None of them is a fact about one story, and
 * the provenance page has to keep the two apart the same way the booklet's `physicalPublication` is
 * kept apart from `storyScope`.
 */
export type StoryAnthologyProvenance = {
  collectionSlug: string;
  collectionTitleTa: string;
  editionStatementTa: string;
  publisherTa: string;
  storiesInCollection: number;
  storyOrder: number;
  collectionScanTotal: number;
  storyBearingScans: string;
  backCoverScan: number;
  scanToPrintedPageRelation: string;
  note: string;
};

/**
 * A story whose table-of-contents title and story-opening heading DIFFER in the source. Two stories in
 * the 1977 anthology do. Both witnesses are recorded and neither is normalised away; the canonical
 * display title follows the archive's own decision, which is the opening heading in both cases.
 */
export type StoryTitleWitness = {
  tocTitleTa: string;
  openingHeadingTa: string;
  canonicalFollows: "opening-heading" | "toc-title";
  note: string;
};

/** The archive's per-story visual-fidelity closure. */
export type StoryVisualFidelity = { result: string; note: string };

export type StoryProvenance = {
  workId: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  sourceTree: string;
  source: StoryProvenanceSource;
  storyScope: StoryScope;
  /** Booklet-only. A story printed inside a collection has no physical publication of its own. */
  physicalPublication?: StoryPhysicalPublication;
  /** Booklet-only. Every anthology story page carries its printed page number. */
  printedPageUncertainty?: StoryPrintedPageUncertainty;
  /** Booklet-only. No anthology story has a publisher's erratum list. */
  errata?: StoryErrata;
  tamilAssembly: StoryTamilAssembly;
  crossScanJoinPolicy: StoryCrossScanJoinPolicy;
  english: StoryEnglishProvenance;
  reviewQueue: StoryReviewQueue;
  /** Anthology-only. */
  anthology?: StoryAnthologyProvenance;
  /** Present only where the source's two title witnesses differ. */
  titleWitness?: StoryTitleWitness;
  visualFidelity?: StoryVisualFidelity;
};

// Integrated story slugs (build/import authority; the public catalogue entry lives in data/library.ts and
// is not part of this benchmark). This registry drives `generateStaticParams` for both story routes, and
// is the single list a future sitemap integration reads — the Phase-A lesson: a route family whose slugs
// live in one exported registry is wired into the sitemap once and stays correct for every work added
// after.
export const STORY_SLUGS = [
  // Phase 8 Benchmark B — the standalone booklet. It is NOT part of the 1977 anthology and keeps its
  // own source pin; Bulk Wave 2 deliberately left it untouched.
  "kizhavan-kanavu",
  // ── Bulk Onboarding Wave 2 — the 37 stories of the 1977 anthology கலைஞர் கருணாநிதியின் சிறுகதைகள்,
  // in the anthology's own printed order (scans 10–259, printed pages 1–250). They share one controlling
  // scan and one historical source pin, which is NOT the kizhavan-kanavu pin.
  "pugazhendhi",
  "nalayini",
  "sabalam",
  "aattakkavadi",
  "kuppai-thotti",
  "santhana-kinnam",
  "sangilichami",
  "gangaiyin-kadhal",
  "thaaymai",
  "thappivittargal",
  "thappavillai",
  "aatharikkirar",
  "iragasiyam",
  "munnuru-rupai",
  "ezhai",
  "originalil-ullapadi",
  "panangulai",
  "seththaval-kathai",
  "pretha-visaranai",
  "kandathum-kadhal-ozhiga",
  "aalamarathup-puraakkal",
  "thothukkili",
  "kadhal-kaditham",
  "kannadakkam",
  "vazha-mudiyathavargal",
  "abagya-chinthamani",
  "palaivana-roja",
  "puratchip-padam",
  "thidukkidum-kathai",
  "kadaisi-kattam",
  "ayyo-raja",
  "visham-inidhu",
  "veniyin-kadhalan",
  "amirthamathi",
  "sumanthaval",
  "siddharthan-silai",
  "nunikkarumbu",
] as const;
export type StorySlug = (typeof STORY_SLUGS)[number];
