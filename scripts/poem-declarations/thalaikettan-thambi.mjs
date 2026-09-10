// தலைகேட்டான் தம்பி / "The Younger Brother Who Asked for a Head" — standalone poem declaration.
//
// A narrative praise-poem on the Kumanan/Ilankumanan legend, printed across physical scans 18–23 of
// the முரசொலி-பொங்கல் மலர் (1966). The archive states the publication and year in its own Work-identity
// prose, so this work carries a publicationEstablished record.
//
// The Tamil assembly places the `<!-- scan_page: 18 -->` marker first and then transcribes the page
// top-down, so the decorated title `# தலைகேட்டான் தம்பி` lands INSIDE the first block; it is the work
// title, not verse (the released English assembly holds `# The Younger Brother Who Asked for a Head`
// as an H1 before its first marker), so it is dropped via `dropLeadingLines`. Printed `*` separators
// are literal source glyphs and are carried verbatim as lines in both reading layers.

const SLUG = "thalaikettan-thambi";
const POEM_SCANS = [18, 19, 20, 21, 22, 23];

export default {
  slug: SLUG,
  // Wave-6 Batch-4: preserve source literary trailing whitespace exactly (fidelity mode).
  literalWhitespace: true,
  poemScans: POEM_SCANS,
  title: { ta: "தலைகேட்டான் தம்பி", en: "The Younger Brother Who Asked for a Head" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_PRL_0001662_முரசொலி_பொங்கல் மலர்_1966.pdf",
    sha256: "92576adf33cf4908e2079632c62e12f4a4ada33fd591765d242645bb0bd8795a",
    sizeBytes: 30952719,
    sizeText: "30,952,719",
    totalPages: 75,
  },

  // The page map records `printed_page: null` for all six active scans.
  printedPageFor: () => null,

  tamil: {
    file: `sections/01.md`,
    convention: "plain-marker",
    // The decorated work title printed on scan 18 — carried as poem.title and excluded from the
    // English verse region too. Dropped, never rendered as verse.
    dropLeadingLines: ["# தலைகேட்டான் தம்பி"],
  },

  english: {
    markerScan: /scan_page:\s*(\d+)/,
    verseStartAt: "<!-- scan_page: 18 -->",
    batches: [{ id: "sections-01", n: 1, file: "translations/en/sections/01.md", scans: POEM_SCANS }],
    assembly: { file: `translations/en/${SLUG}-en.md`, startAt: "<!-- scan_page: 18 -->" },
  },

  auditDocs: [
    ...POEM_SCANS.map((s) => `pages/${String(s).padStart(4, "0")}.md`),
    "HANDOVER.md",
    "NEXT_CHAT_PROMPT.md",
    "PHASE2_SOURCE_CRITICAL_VERIFICATION.md",
    "PHASE3_BOUNDARY_JOIN_AUDIT.md",
    "PHASE3_CANONICAL_ASSEMBLY.md",
    "PHASE3_CANONICAL_SOURCE_REVIEW.md",
    "PHASE3_PAGINATION_RECONCILIATION.md",
    "PHASE3_TAMIL_FINAL_CLEARANCE.md",
    "PHASE3_TITLE_WITNESS_RECONCILIATION.md",
    "POST_PHASE2_STRUCTURAL_CORRECTION.md",
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
    "translations/en/sections/01.md",
    "translations/en/thalaikettan-thambi-en.md",
  ],

  excludedPhrases: [
    "batch-reviewed", "voice_policy", "translation_basis", "assembled-from-verified-pages",
    "REVIEWED", "RELEASE-CLEARED", "scan_page", "structural-role correction",
  ],

  // The archive records no context note printed above this poem.
  sourceContext: undefined,
  publicationYear: 1966,
  editionStatement: "முரசொலி-பொங்கல் மலர், 1966",
  factsNotStated: ["printed-page-numbers", "cross-page-stanza-relationships"],
  transcriptionStatus:
    "verified source assembly — Phase 2 PASS 6/6, scan-18 structural-role correction COMPLETE, Phase 3 Gates 1–6 PASS / Tamil FINAL-CLEARED, 0 discrepancies",
  translationStatus:
    "RELEASE-COMPLETE project-created translation — Phase 4 Batch 01 REVIEWED/PASS, editorial-consistency and release-integrity review PASS",

  provenance: {
    physicalVerification: "6 / 6 poem pages present in the 75-page controlling PDF",
    poemScanPages: "18–23",
    poemVerification: "6 / 6 verified",
    printedPageMapping: "none — the page map records printed_page null on all six poem pages",
    unnumberedScanNote:
      "No poem page carries a visible printed page number; the page map records `printed_page: null` on all six. The numbers 18–23 are PDF scan positions inside the annual issue and are never presented as printed page numbers.",
    sourceTypeLabel: { ta: "அச்சிட்ட மலர் இதழ்", en: "printed annual" },
    publicationEstablished: {
      publicationTa: "முரசொலி-பொங்கல் மலர்",
      editionStatement: "முரசொலி-பொங்கல் மலர், 1966",
      year: 1966,
    },
    lockedExclusions: [
      "the decorated work title `தலைகேட்டான் தம்பி` on scan 18 — carried as the work's title and never as verse; the scan-18 `தம்பி` title element and `கருணாநிதி` author attribution are not repeated as poem-body text",
      "scan 17 (unrelated photograph) and scan 24 (unrelated cartoon): boundary evidence only, outside the poem body",
      "scans 1–16 and 25–75 of the annual issue: other items entirely",
      "batch-review, source-fidelity and release-integrity prose from the reviewed English section and its review report",
      "the Markdown explanatory prose surrounding the released English assembly",
    ],
    verification: {
      tamilAssembly: "PASS — 6/6 poem pages, 0 missing, 0 duplicate, order 18 → 19 → 20 → 21 → 22 → 23",
      tamilDiscrepancies: 0,
      englishRelease: "RELEASE-COMPLETE",
      englishBatches: "Batch 01 reviewed PASS; scan markers 18–23 = 6/6 exactly once",
      englishOmissions: 0,
      englishDuplications: 0,
      fullPoemVoiceReview: "PASS — editorial-consistency and release-integrity review of the released English assembly",
    },
    boundaryNote:
      "TEXTUAL/RHETORICAL continuity and TYPOGRAPHIC stanza relation are separate dimensions and are recorded separately. The archive notes the direct 22→23 continuation without an inserted separator; that is a statement about wording running on, not about the printed stanza. Marker-adjacent blank-line formatting does not establish the stanza relation either. Blank lines wholly inside one source page ARE source-established stanza structure and are preserved as such, and the printed `*` separators are carried verbatim as literal lines.",
    provenanceGranularity:
      "Line-level scan provenance in BOTH layers. Tamil lines carry the scan of their assembly region; English lines carry the scan marked in the reviewed section, whose verse is proved byte-identical to the released assembly. No printed page number is recorded for any line, because the source establishes none.",
    terminologyNote:
      "A maximal run of lines between two boundaries is a VERSE RUN, not a stanza: where a run is bounded by a page transition whose relation is unresolved, the printed stanza it belongs to is simply not established. Only runs delimited on both sides by source-established stanza structure are counted as source-established stanzas. No derived run count is reported as a printed stanza count.",
    derivedNote:
      "Derived structure only. The Tamil assembly is the authoritative source layer; the English is the RELEASE-COMPLETE project-created translation. Neither was retranslated, modernized, re-lineated or normalized during import: line text, line order, in-page stanza gaps, indentation, punctuation, the printed `*` separators, quotation marks and repetition are carried exactly as released.",
    blockerResolution:
      "Resolution requires an UPSTREAM source-archive visual/source review of the controlling scan TVA_PRL_0001662 (poem scans 18–23) that explicitly records the printed stanza relationship at each physical page transition. The source PDF is not vendored here, and this Digital Library integration does not establish those typographic facts independently.",
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
        "This is the PRESENT project-level rights status of Kalaignar's underlying poem. The 1966 முரசொலி-பொங்கல் மலர் issue that carries it is an edition fact, not a statement about those rights.",
      thirdPartyNote:
        "Nationalisation applies to Kalaignar's underlying authored poem. It does NOT extend to the surrounding annual issue — its other items, its illustrations, its layout and its cover — each of which retains its own distinct provenance.",
      projectTranslationNote:
        "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created) with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
      evidencePending:
        "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
    },
  },

  notes: ({ TRANSITIONS, relCount }) => [
    "The controlling source is a scanned annual-issue PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan map.",
    "The poem body is scans 18–23 (6 pages). Scan 17 (photograph) and scan 24 (cartoon) are unrelated neighbours and boundary evidence only. The decorated title on scan 18 is the work title and is not carried as verse.",
    "The archive states this work's publication and year in its own Work-identity prose — முரசொலி-பொங்கல் மலர், 1966 — so publicationYear and editionStatement are established rather than null.",
    "Printed `*` separators between verse groups are literal source glyphs and are carried verbatim as lines in both reading layers.",
    `Cross-page structure is resolved only from explicit source evidence: of ${TRANSITIONS.length} physical page transitions, ${relCount("same-stanza")} are recorded same-stanza, ${relCount("stanza-boundary")} stanza-boundary, and ${relCount("unknown")} are unresolved and stay unresolved.`,
    "A source line remains one logical line. Indentation is carried as a source fact so it survives without <pre> styling, and a long line may wrap visually on a narrow viewport without ever becoming two poetic lines.",
  ],
};
