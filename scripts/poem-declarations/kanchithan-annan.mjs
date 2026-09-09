// காஞ்சிதான் அண்ணன் / "Kanchi Is Anna" — standalone poem declaration.
//
// A single-page memorial to Anna, printed on physical scan 16 of the காஞ்சி — பொங்கல் மலர் (1970),
// the annual issue of the journal `காஞ்சி` that Anna founded. The pinned archive states the
// publication and year in its own Work-identity prose, so this work carries a publicationEstablished
// record.
//
// The Tamil assembly places the `<!-- scan_page: 16 -->` marker first and then transcribes the page
// top-down, so the decorated title `காஞ்சிதான் அண்ணன்` AND the source author line
// `முதலமைச்சர், கலைஞர், மு. கருணாநிதி` both land inside the first block. Neither is verse — the
// released English assembly holds `# Kanchi Is Anna` and `Chief Minister, Kalaignar M. Karunanidhi`
// before its first scan marker, excluding both from its verse region — so both are dropped here via
// `dropLeadingLines`. The title travels as poem.title and the attribution as poem.author.

const SLUG = "kanchithan-annan";
const POEM_SCANS = [16];

export default {
  slug: SLUG,
  poemScans: POEM_SCANS,
  title: { ta: "காஞ்சிதான் அண்ணன்", en: "Kanchi Is Anna" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_PRL_0033128_காஞ்சி_பொங்கல்_மலர்_1970.pdf",
    sha256: "2c8468b88d1e0d2b39cc47e07f538196e1d10b45a3263cbe9cc0fb2dbbc9f700",
    sizeBytes: 104701910,
    sizeText: "104,701,910",
    totalPages: 108,
  },

  // The page record certifies no visible printed numeral on scan 16.
  printedPageFor: () => null,

  tamil: {
    file: `sections/01.md`,
    convention: "plain-marker",
    // The decorated title and the printed author line at the top of scan 16 — carried as poem.title
    // and poem.author, excluded from the English verse region too. Dropped, never rendered as verse.
    dropLeadingLines: ["காஞ்சிதான் அண்ணன்", "முதலமைச்சர், கலைஞர், மு. கருணாநிதி"],
  },

  english: {
    markerScan: /scan_page:\s*(\d+)/,
    verseStartAt: "<!-- scan_page: 16 -->",
    batches: [{ id: "sections-01", n: 1, file: "translations/en/sections/01.md", scans: POEM_SCANS }],
    assembly: { file: `translations/en/${SLUG}-en.md`, startAt: "<!-- scan_page: 16 -->" },
  },

  auditDocs: [
    "pages/0016.md",
    "HANDOVER.md",
    "NEXT_CHAT_PROMPT.md",
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
    "translations/en/kanchithan-annan-en.md",
    "translations/en/sections/01.md",
  ],

  excludedPhrases: [
    "batch-reviewed", "voice_policy", "translation_basis", "assembled-from-verified-page",
    "REVIEWED", "RELEASE-CLEARED", "scan_page", "முதலமைச்சர், கலைஞர்",
  ],

  // The archive records no context note printed above this poem.
  sourceContext: undefined,
  publicationYear: 1970,
  editionStatement: "காஞ்சி — பொங்கல் மலர், 1970",
  factsNotStated: ["printed-page-numbers", "cross-page-stanza-relationships"],
  transcriptionStatus:
    "verified source assembly — Phase 3 Gates 1–6 PASS / Tamil FINAL-CLEARED, 1/1 poem page, 0 missing, 0 duplicated, 0 discrepancies",
  translationStatus:
    "RELEASE-COMPLETE project-created translation — Phase 4 Batch 01 / assembly / editorial / release-integrity PASS",

  provenance: {
    physicalVerification: "1 / 1 poem page present in the 108-page controlling PDF",
    poemScanPages: "16",
    poemVerification: "1 / 1 visual-reviewed",
    printedPageMapping: "none — the page record records no visible printed page number on the single poem page",
    unnumberedScanNote:
      "The single poem page carries no visible printed page number. The number 16 is the PDF scan position inside the annual issue and is never presented as a printed page number.",
    sourceTypeLabel: { ta: "அச்சிட்ட மலர் இதழ்", en: "printed annual" },
    publicationEstablished: {
      publicationTa: "காஞ்சி — பொங்கல் மலர்",
      editionStatement: "காஞ்சி — பொங்கல் மலர், 1970",
      year: 1970,
    },
    lockedExclusions: [
      "the decorated title `காஞ்சிதான் அண்ணன்` and the printed author line `முதலமைச்சர், கலைஞர், மு. கருணாநிதி` at the top of scan 16 — the work title and its author attribution, carried as the work's title and author and never as verse",
      "scans 1–15 and 17–108 of the annual issue: other items entirely",
      "the decorative title banner, side ornaments, small printed artist/design signature and the uncaptioned portrait beneath the poem noted on the page record — non-text source-layout material, never verse",
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
      fullPoemVoiceReview: "PASS — assembly, editorial-consistency and release-integrity review of the released English assembly",
    },
    boundaryNote:
      "This work occupies a single physical scan, so there is no cross-page transition to classify. Blank lines wholly inside the page ARE source-established stanza structure and are preserved as such.",
    provenanceGranularity:
      "Line-level scan provenance in BOTH layers. Every line carries scan 16. No printed page number is recorded for any line, because the source establishes none.",
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
        "This is the PRESENT project-level rights status of Kalaignar's underlying poem. The 1970 காஞ்சி — பொங்கல் மலர் issue that carries it is an edition fact, not a statement about those rights.",
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
    "The poem body is a single page (scan 16) inside a 108-page annual issue. The decorated title and the printed author line at the top of the page are the work title and author attribution and are not carried as verse.",
    "The archive states this work's publication and year in its own Work-identity prose — காஞ்சி — பொங்கல் மலர், 1970 — so publicationYear and editionStatement are established rather than null.",
    "The archive records no context note printed above this poem, so no date, venue or occasion is carried. The user-supplied catalogue description is contextual metadata and not one word of it enters the verse.",
    "A single physical scan means there is no cross-page transition to classify; blank-line stanza structure inside the page is preserved exactly.",
    "A source line remains one logical line. Indentation is carried as a source fact so it survives without <pre> styling, and a long line may wrap visually on a narrow viewport without ever becoming two poetic lines.",
  ],
};
