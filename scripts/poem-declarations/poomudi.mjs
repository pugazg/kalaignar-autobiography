// பூமுடி / "Flower Crown" — standalone poem declaration.
//
// A single-page tribute to Anna, printed on physical scan 4 of the முரசொலி-அண்ணா மலர் (1965). The
// pinned archive states the publication and year in its own Work-identity prose, so this work carries
// a publicationEstablished record (like தென்னவன் காதை, unlike மறத்தி whose year lives only in a
// filename).
//
// The newer Tamil assembly places the `<!-- scan_page: 4 -->` marker first and then transcribes the
// page top-down, so the decorated title `பூமுடி` lands INSIDE the first block. It is the work title,
// not verse — the released English assembly excludes it by holding `# Flower Crown` as an H1 before
// the marker — so it is dropped here via `dropLeadingLines`. The lower-page signature `மு.கருணாநிதி`
// is NOT dropped: both released reading layers carry it as a trailing source-position line (the batch
// review counts it explicitly as "English source-position signature: 1/1 — M. Karunanidhi").

const SLUG = "poomudi";
const POEM_SCANS = [4];

export default {
  slug: SLUG,
  poemScans: POEM_SCANS,
  title: { ta: "பூமுடி", en: "Flower Crown" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_PRL_0001656_முரசொலி_அண்ணா மலர்_1965.pdf",
    sha256: "7312d5f8686f7968d62bbac9318c2452ca32873a0ae889f10a7151e5de81ab5a",
    sizeBytes: 247645717,
    sizeText: "247,645,717",
    totalPages: 65,
  },

  // The page record certifies `printed_page: null`; scan 4 carries no visible printed numeral.
  printedPageFor: () => null,

  tamil: {
    file: `sections/01.md`,
    convention: "plain-marker",
    // The decorated title printed at the top of scan 4 — the work title, carried as poem.title and
    // excluded from the English verse region too. Dropped, never rendered as verse.
    dropLeadingLines: ["பூமுடி"],
  },

  english: {
    markerScan: /scan_page:\s*(\d+)/,
    // The reviewed English with hidden scan markers is the section file; batches/batch-01.md is a
    // review report and carries no verse. The region begins at the scan marker, so the `# Flower
    // Crown` H1 title before it is excluded.
    verseStartAt: "<!-- scan_page: 4 -->",
    batches: [{ id: "sections-01", n: 1, file: "translations/en/sections/01.md", scans: POEM_SCANS }],
    // The released assembly carries the same marker; per-line scan provenance comes from the reviewed
    // section and is then proved byte-identical to this assembly.
    assembly: { file: `translations/en/${SLUG}-en.md`, startAt: "<!-- scan_page: 4 -->" },
  },

  auditDocs: [
    "pages/0004.md",
    "HANDOVER.md",
    "NEXT_CHAT_PROMPT.md",
    "PHASE2_REVERIFICATION_2026-09-07.md",
    "PHASE2_SOURCE_VERIFICATION.md",
    "PHASE3_BOUNDARY_JOIN_AUDIT.md",
    "PHASE3_CANONICAL_ASSEMBLY.md",
    "PHASE3_CANONICAL_SOURCE_REVIEW.md",
    "PHASE3_STRUCTURE_AUDIT.md",
    "PHASE3_TAMIL_FINAL_CLEARANCE.md",
    "PHASE3_TITLE_WITNESS_RECONCILIATION.md",
    "README.md",
    "RELEASE_STATUS.md",
    "SOURCE_INTAKE.md",
    "audit.md",
    "indexes/canonical-source-map.md",
    "indexes/page-map.md",
    "metadata/source.md",
    "sections/01.md",
    "translations/en/ASSEMBLY.md",
    "translations/en/EDITORIAL_CONSISTENCY_REVIEW.md",
    "translations/en/README.md",
    "translations/en/RELEASE_INTEGRITY_REVIEW.md",
    "translations/en/RELEASE_REPORT.md",
    "translations/en/SOURCE_MAP.md",
    "translations/en/TRANSLATION_PLAN.md",
    "translations/en/batches/batch-01.md",
    "translations/en/poomudi-en.md",
    "translations/en/sections/01.md",
  ],

  excludedPhrases: [
    "batch-reviewed", "voice_policy", "translation_basis", "assembled-from-verified-page",
    "REVIEWED", "RELEASE-CLEARED", "scan_page", "source-visible attribution",
  ],

  // The archive records no context note printed above this poem.
  sourceContext: undefined,
  publicationYear: 1965,
  editionStatement: "முரசொலி-அண்ணா மலர், 1965",
  factsNotStated: ["printed-page-numbers", "cross-page-stanza-relationships"],
  transcriptionStatus:
    "verified source assembly — Phase 3 FINAL-CLEARED, 1/1 poem page, 0 missing, 0 duplicated, 0 discrepancies, opening/closing boundaries PASS/PASS, internal joins 0",
  translationStatus:
    "RELEASE-COMPLETE project-created translation — Phase 4 Batch 01 REVIEWED/PASS, editorial consistency and release-integrity review PASS",

  provenance: {
    physicalVerification: "1 / 1 poem page present in the 65-page controlling PDF",
    poemScanPages: "4",
    poemVerification: "1 / 1 visual-reviewed",
    printedPageMapping: "none — the page record certifies printed_page null on the single poem page",
    unnumberedScanNote:
      "The single poem page carries no visible printed page number; the page record certifies `printed_page: null`. The number 4 is the PDF scan position inside the annual issue and is never presented as a printed page number.",
    sourceTypeLabel: { ta: "அச்சிட்ட மலர் இதழ்", en: "printed annual" },
    publicationEstablished: {
      publicationTa: "முரசொலி-அண்ணா மலர்",
      editionStatement: "முரசொலி-அண்ணா மலர், 1965",
      year: 1965,
    },
    lockedExclusions: [
      "the decorated title `பூமுடி` printed at the top of scan 4 — the work title, carried as the work's title and never as verse",
      "scans 1–3 and 5–65 of the annual issue: other items entirely",
      "the decorative title/artwork, floral border design, lower-page portrait/graphic and top-margin library mark noted on the page record — non-text source-layout material, never verse",
      "batch-review, source-fidelity and release-integrity prose from the reviewed English section and its review report",
      "the Markdown explanatory prose surrounding the released English assembly",
    ],
    verification: {
      tamilAssembly: "PASS — 1/1 poem page, 0 missing, 0 duplicate",
      tamilDiscrepancies: 0,
      englishRelease: "RELEASE-COMPLETE",
      englishBatches: "Batch 01 reviewed PASS; 1/1 present exactly once; 1/1 poem scan represented",
      englishOmissions: 0,
      englishDuplications: 0,
      fullPoemVoiceReview: "PASS — editorial consistency and release-integrity review of the released English assembly",
    },
    boundaryNote:
      "This work occupies a single physical scan, so there is no cross-page transition to classify. Blank lines wholly inside the page ARE source-established stanza structure and are preserved as such; the lower-page author signature is carried as a trailing source-position line in both reading layers exactly as released.",
    provenanceGranularity:
      "Line-level scan provenance in BOTH layers. Every line carries scan 4. No printed page number is recorded for any line, because the source establishes none.",
    terminologyNote:
      "A maximal run of lines between two boundaries is a VERSE RUN, not a stanza. With a single page and no unresolved page edge, every run's stanza membership is source-established. No derived run count is reported as a printed stanza count.",
    derivedNote:
      "Derived structure only. The Tamil assembly is the authoritative source layer; the English is the RELEASE-COMPLETE project-created translation. Neither was retranslated, modernized, re-lineated or normalized during import: line text, line order, in-page stanza gaps, indentation, punctuation, ellipses and repetition are carried exactly as released.",
    blockerResolution:
      "Not applicable: a single-scan work has no cross-page stanza relationship to resolve.",
    projectRights: {
      appliesTo: "underlying-work-authored-by-kalaignar",
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null,
      governmentOrderDate: null,
      governmentOrderHandoverDate: "2024-12-22",
      distinctionNote:
        "This is the PRESENT project-level rights status of Kalaignar's underlying poem. The 1965 முரசொலி-அண்ணா மலர் issue that carries it is an edition fact, not a statement about those rights.",
      thirdPartyNote:
        "Nationalisation applies to Kalaignar's underlying authored poem. It does NOT extend to the surrounding annual issue — its other items, its illustrations, its layout and its cover — each of which retains its own distinct provenance.",
      projectTranslationNote:
        "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created) with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
      evidencePending:
        "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
    },
  },

  notes: () => [
    "The controlling source is a scanned annual-issue PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan map.",
    "The poem body is a single page (scan 4) inside a 65-page annual issue. The decorated title `பூமுடி` printed at the top of the page is the work title and is not carried as verse; the lower-page signature `மு.கருணாநிதி` is a source-position line carried in both reading layers exactly as released.",
    "The archive states this work's publication and year in its own Work-identity prose — முரசொலி-அண்ணா மலர், 1965 — so publicationYear and editionStatement are established rather than null.",
    "The archive records no context note printed above this poem, so no date, venue or occasion is carried.",
    "A single physical scan means there is no cross-page transition to classify; blank-line stanza structure inside the page is preserved exactly.",
    "A source line remains one logical line. Indentation is carried as a source fact so it survives without <pre> styling, and a long line may wrap visually on a narrow viewport without ever becoming two poetic lines.",
  ],
};
