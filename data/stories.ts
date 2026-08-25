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
   * The form label the BOOKLET ITSELF prints under the title (`கற்பனையுரை`). It is the source's own word
   * for what this piece is, so it is carried as source text, not as a catalogue category. There is no
   * `en` here: the booklet prints no English form label, and one is not invented.
   */
  formLabel: { ta: string };
  author: {
    nameTa: string;
    /** The printed authorship line, verbatim: `தீட்டியவர்: மு. கருணாநிதி.` */
    printedAuthorshipLineTa: string;
  };
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
  printedAuthorshipLineTa: string;
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

export type StoryProvenance = {
  workId: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: StoryProvenanceSource;
  storyScope: StoryScope;
  physicalPublication: StoryPhysicalPublication;
  printedPageUncertainty: StoryPrintedPageUncertainty;
  errata: StoryErrata;
  tamilAssembly: StoryTamilAssembly;
  crossScanJoinPolicy: StoryCrossScanJoinPolicy;
  english: StoryEnglishProvenance;
  reviewQueue: StoryReviewQueue;
};

// Integrated story slugs (build/import authority; the public catalogue entry lives in data/library.ts and
// is not part of this benchmark). This registry drives `generateStaticParams` for both story routes, and
// is the single list a future sitemap integration reads — the Phase-A lesson: a route family whose slugs
// live in one exported registry is wired into the sitemap once and stays correct for every work added
// after.
export const STORY_SLUGS = ["kizhavan-kanavu"] as const;
export type StorySlug = (typeof STORY_SLUGS)[number];
