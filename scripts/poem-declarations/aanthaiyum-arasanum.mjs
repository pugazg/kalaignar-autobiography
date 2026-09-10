// ஆந்தையும் அரசனும்! / "Andhai and the King!" — standalone poem declaration.
//
// A historical narrative poem printed across physical scans 18–25 of the முரசொலி-பொங்கல் மலர் (1965).
// The archive states the publication and year in its own Work-identity prose, so this work carries a
// publicationEstablished record. Gate 3 locks the direct scan-18 heading `ஆந்தையும் அரசனும்!` as the
// canonical Tamil title authority; the bibliographic witness `ஆந்தையும் அரசனும்` (no `!`) is metadata.
//
// The Tamil assembly places the `<!-- scan_page: 18 -->` marker first, so the decorated title
// `# ஆந்தையும் அரசனும்!` lands inside the first block; it is the work title, not verse (the released
// English assembly holds `# Andhai and the King!` as an H1 before its first marker), so it is dropped
// via `dropLeadingLines`. The printed author line `மு.கருணாநிதி` is NOT dropped: both released reading
// layers carry it as the source-position attribution line at the head of the scan-18 region
// (`M. Karunanidhi` in English). Printed `*` separators are literal source glyphs carried verbatim.

const SLUG = "aanthaiyum-arasanum";
const POEM_SCANS = [18, 19, 20, 21, 22, 23, 24, 25];

export default {
  slug: SLUG,
  // Wave-6 Batch-4: preserve source literary trailing whitespace exactly (fidelity mode).
  literalWhitespace: true,
  poemScans: POEM_SCANS,
  // This work aligns some wrapped words with deep indents (4, 24, 32, 34, 36, 40 source spaces); the
  // 34-space alignment is not a multiple of 4, so the indentation-width guard runs at unit 2 (all
  // observed indents are even). The exact source indentation is carried verbatim regardless; the
  // independent byte-fidelity gate is the real check on it.
  indentUnit: 2,
  title: { ta: "ஆந்தையும் அரசனும்!", en: "Andhai and the King!" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_PRL_0001631_முரசொலி_ பொங்கல் மலர்_ 1965.pdf",
    sha256: "523a038dcd391f5cbe48f564d2ecac566fd0065066e05d29fc5b738aa4964819",
    sizeBytes: 381558891,
    sizeText: "381,558,891",
    totalPages: 102,
  },

  // Physical scan numbers remain provenance identifiers; no printed page numbers were assigned.
  printedPageFor: () => null,

  tamil: {
    file: `sections/01.md`,
    convention: "plain-marker",
    // The decorated work title on scan 18 — carried as poem.title and excluded from the English verse
    // region too. Dropped, never rendered as verse. The `மு.கருணாநிதி` line below it is kept: it is
    // the source-position attribution both released layers carry.
    dropLeadingLines: ["# ஆந்தையும் அரசனும்!"],
  },

  english: {
    markerScan: /scan_page:\s*(\d+)/,
    verseStartAt: "<!-- scan_page: 18 -->",
    // Both the reviewed section and the released assembly close with a source-layout comment noting
    // the decorative closing ornament; the verse region ends before it.
    verseEndBefore: "<!-- source-visible decorative closing ornament -->",
    batches: [{ id: "sections-01", n: 1, file: "translations/en/sections/01.md", scans: POEM_SCANS }],
    assembly: { file: `translations/en/${SLUG}-en.md`, startAt: "<!-- scan_page: 18 -->", endBefore: "<!-- source-visible decorative closing ornament -->" },
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
    "README.md",
    "RELEASE_STATUS.md",
    "SECONDARY_WITNESS_RESEARCH.md",
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
    "translations/en/aanthaiyum-arasanum-en.md",
    "translations/en/batches/batch-01.md",
    "translations/en/sections/01.md",
  ],

  excludedPhrases: [
    "batch-reviewed", "voice_policy", "translation_basis", "assembled-from-verified-pages",
    "REVIEWED", "RELEASE-CLEARED", "scan_page", "secondary lexical witness",
  ],

  // The archive records no context note printed above this poem.
  sourceContext: undefined,
  publicationYear: 1965,
  editionStatement: "முரசொலி-பொங்கல் மலர், 1965",
  factsNotStated: ["printed-page-numbers", "cross-page-stanza-relationships"],
  transcriptionStatus:
    "verified source assembly — Phase 1 8/8, Phase 2 PASS 8/8, Phase 3 Gates 1–6 PASS / Tamil FINAL-CLEARED, source-completeness 8/8, 0 unresolved",
  translationStatus:
    "RELEASE-COMPLETE project-created translation — Phase 4 Batch 01 REVIEWED/PASS, editorial-consistency and release-integrity review PASS",

  provenance: {
    physicalVerification: "8 / 8 poem pages present in the 102-page controlling PDF",
    poemScanPages: "18–25",
    poemVerification: "8 / 8 verified",
    printedPageMapping: "none — no printed page number was assigned to any poem page; physical scan numbers remain provenance identifiers",
    unnumberedScanNote:
      "No poem page carries a visible printed page number. The numbers 18–25 are PDF scan positions inside the annual issue and are never presented as printed page numbers.",
    sourceTypeLabel: { ta: "அச்சிட்ட மலர் இதழ்", en: "printed annual" },
    publicationEstablished: {
      publicationTa: "முரசொலி-பொங்கல் மலர்",
      editionStatement: "முரசொலி-பொங்கல் மலர், 1965",
      year: 1965,
    },
    lockedExclusions: [
      "the decorated work title `ஆந்தையும் அரசனும்!` on scan 18 — carried as the work's title and never as verse; the bibliographic witness `ஆந்தையும் அரசனும்` (no exclamation) is metadata only",
      "scan 17 (unrelated prose) and scan 26 (unrelated cartoon): boundary evidence only, outside the poem body",
      "scans 1–16 and 26–102 of the annual issue: other items entirely",
      "batch-review, source-fidelity and release-integrity prose from the reviewed English section and its review report",
      "the Markdown explanatory prose surrounding the released English assembly",
    ],
    verification: {
      tamilAssembly: "PASS — 8/8 poem pages, 0 missing, 0 duplicate, order 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25",
      tamilDiscrepancies: 0,
      englishRelease: "RELEASE-COMPLETE",
      englishBatches: "Batch 01 reviewed PASS; scan markers 18–25 = 8/8 exactly once",
      englishOmissions: 0,
      englishDuplications: 0,
      fullPoemVoiceReview: "PASS — editorial-consistency and release-integrity review of the released English assembly",
    },
    boundaryNote:
      "TEXTUAL/RHETORICAL continuity and TYPOGRAPHIC stanza relation are separate dimensions and are recorded separately. Marker-adjacent blank-line formatting does not establish the stanza relation. Blank lines wholly inside one source page ARE source-established stanza structure and are preserved as such, and the printed `*` separators are carried verbatim as literal lines.",
    provenanceGranularity:
      "Line-level scan provenance in BOTH layers. Tamil lines carry the scan of their assembly region; English lines carry the scan marked in the reviewed section, whose verse is proved byte-identical to the released assembly. No printed page number is recorded for any line, because the source establishes none.",
    terminologyNote:
      "A maximal run of lines between two boundaries is a VERSE RUN, not a stanza: where a run is bounded by a page transition whose relation is unresolved, the printed stanza it belongs to is simply not established. Only runs delimited on both sides by source-established stanza structure are counted as source-established stanzas. No derived run count is reported as a printed stanza count.",
    derivedNote:
      "Derived structure only. The Tamil assembly is the authoritative source layer; the English is the RELEASE-COMPLETE project-created translation. Neither was retranslated, modernized, re-lineated or normalized during import: line text, line order, in-page stanza gaps, indentation, punctuation, the printed `*` separators, quotation marks and repetition are carried exactly as released.",
    blockerResolution:
      "Resolution requires an UPSTREAM source-archive visual/source review of the controlling scan TVA_PRL_0001631 (poem scans 18–25) that explicitly records the printed stanza relationship at each physical page transition. The source PDF is not vendored here, and this Digital Library integration does not establish those typographic facts independently.",
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
        "This is the PRESENT project-level rights status of Kalaignar's underlying poem. The 1965 முரசொலி-பொங்கல் மலர் issue that carries it is an edition fact, not a statement about those rights.",
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
    "The poem body is scans 18–25 (8 pages). Scan 17 (prose) and scan 26 (cartoon) are unrelated neighbours and boundary evidence only. The decorated title on scan 18 is the work title and is not carried as verse; the source-position line `மு.கருணாநிதி` is carried in both reading layers exactly as released.",
    "The archive states this work's publication and year in its own Work-identity prose — முரசொலி-பொங்கல் மலர், 1965 — so publicationYear and editionStatement are established rather than null.",
    "No admitted secondary lexical witness overrides the controlling 1965 source; the direct scan-18 `ஆந்தையும் அரசனும்!` is the canonical Tamil title authority.",
    `Cross-page structure is resolved only from explicit source evidence: of ${TRANSITIONS.length} physical page transitions, ${relCount("same-stanza")} are recorded same-stanza, ${relCount("stanza-boundary")} stanza-boundary, and ${relCount("unknown")} are unresolved and stay unresolved.`,
    "A source line remains one logical line. Indentation is carried as a source fact so it survives without <pre> styling, and a long line may wrap visually on a narrow viewport without ever becoming two poetic lines.",
  ],
};
