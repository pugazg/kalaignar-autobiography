// குணநாயகர் நேரு / "Nehru, the Noble Leader" — standalone poem declaration.
//
// An elegy for Nehru printed in a standalone booklet (`TVA_BOK_0065713`). The controlling PDF is 10
// physical scans; the canonical verse is scans 3–7 (scan 2 `பதிப்புரை`, scans 8–9 a source-English
// translation, scan 1/10 cover/back matter are all outside the poem). The booklet's own page numerals
// are VISIBLE — the page map records printed pages 2–6 on scans 3–7 — so those printed pages are
// carried (not inferred, not null).
//
// The booklet also prints a historical SOURCE-ENGLISH translation ("BEAUTY ROSE WEPT",
// Dr. Krishna Srinivas) on scans 8–9. That is a secondary witness only; it did NOT control the
// project's Phase-4 translation, which was drafted independently from the FINAL-CLEARED Tamil. It is
// excluded from both reading layers here.
//
// Head-of-poem non-verse lines: the Tamil block repeats the title `குணநாயகர் நேரு` and the printed
// attribution `முதல்வர் கலைஞர்` after the scan-3 marker (dropped via `dropLeadingLines`); the reviewed
// English repeats `## Nehru, the Noble Leader` and `**Chief Minister Kalaignar**` after its scan-3
// marker (dropped via `dropLeadingLinesFirstScan`). The reader-facing assembly holds the same two
// English lines, so its verse region begins after them.

const SLUG = "gunanayagar-nehru";
const POEM_SCANS = [3, 4, 5, 6, 7];
// The booklet's visible printed page numerals: scan 3 → 2, 4 → 3, 5 → 4, 6 → 5, 7 → 6 (page map).
const PRINTED = { 3: 2, 4: 3, 5: 4, 6: 5, 7: 6 };

export default {
  slug: SLUG,
  // Wave-6 Batch-4: preserve source literary trailing whitespace exactly (fidelity mode).
  literalWhitespace: true,
  poemScans: POEM_SCANS,
  title: { ta: "குணநாயகர் நேரு", en: "Nehru, the Noble Leader" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_BOK_0065713_குணநாயகர்_நேரு.pdf",
    sha256: "efc8efb14d45e8cb7cbf2dc232732b7a54e778c1fd1957ad64e198072829e07c",
    sizeBytes: 27006676,
    sizeText: "27,006,676",
    totalPages: 10,
  },

  // Visible printed page numbers established by the pinned page map for scans 3–7.
  printedPageFor: (scan) => PRINTED[scan] ?? null,

  tamil: {
    file: `sections/01.md`,
    convention: "plain-marker",
    // After the scan-3 marker the block repeats the title and prints the attribution; both are carried
    // as poem.title / poem.author and excluded from the English verse region too. Dropped.
    dropLeadingLines: ["குணநாயகர் நேரு", "முதல்வர் கலைஞர்"],
  },

  english: {
    markerScan: /scan_page:\s*(\d+)/,
    verseStartAt: "<!-- scan_page: 3 -->",
    // The title-repeat heading and bold attribution at the head of the scan-3 region are non-verse.
    dropLeadingLinesFirstScan: ["## Nehru, the Noble Leader", "**Chief Minister Kalaignar**"],
    batches: [{ id: "sections-01", n: 1, file: "translations/en/sections/01.md", scans: POEM_SCANS }],
    // The reader-facing assembly holds the H1 doc title, an English-translation H2, an editorial
    // `## Section 1` label, the scan-3 marker, a title-repeat heading and the bold attribution before
    // the verse; the verse region begins after the attribution and matches the reviewed section.
    assembly: { file: `translations/en/${SLUG}-en.md`, startAfter: "**Chief Minister Kalaignar**" },
  },

  auditDocs: [
    ...POEM_SCANS.map((s) => `pages/${String(s).padStart(4, "0")}.md`),
    "HANDOVER.md",
    "NEXT_CHAT_PROMPT.md",
    "PHASE3_ASSEMBLY_SOURCE_COMPLETENESS_REVIEW.md",
    "PHASE3_BOUNDARY_JOIN_AUDIT.md",
    "PHASE3_CANONICAL_ASSEMBLY.md",
    "PHASE3_PAGE_RECONCILIATION.md",
    "PHASE3_TAMIL_FINAL_CLEARANCE.md",
    "PHASE3_TITLE_WITNESS_RECONCILIATION.md",
    "README.md",
    "SOURCE_INTAKE.md",
    "audit.md",
    "indexes/page-map.md",
    "metadata/source.md",
    "sections/01.md",
    "translations/en/EDITORIAL_CONSISTENCY_REVIEW.md",
    "translations/en/README.md",
    "translations/en/RELEASE_REPORT.md",
    "translations/en/SOURCE_MAP.md",
    "translations/en/T0_SETUP.md",
    "translations/en/T1_DRAFT.md",
    "translations/en/T2_REVIEW.md",
    "translations/en/TRANSLATION_PLAN.md",
    "translations/en/batches/BATCH_01.md",
    "translations/en/gunanayagar-nehru-en.md",
    "translations/en/sections/01.md",
  ],

  excludedPhrases: [
    "BEAUTY ROSE WEPT", "Krishna Srinivas", "Chief Minister Kalaignar", "## Section",
    "reviewed-pass", "translation_status", "T1_DRAFT", "T2_REVIEW", "scan_page",
  ],

  // The archive records no context note printed above this poem.
  sourceContext: undefined,
  publicationYear: null,
  editionStatement: null,
  factsNotStated: ["publication-year", "edition-statement", "cross-page-stanza-relationships"],
  transcriptionStatus:
    "verified source assembly — Phase 2 10/10, Phase 3 Gates 1–6 PASS / Tamil FINAL-CLEARED, canonical verse scans 3–7 = 5/5, scan-7 performance note excluded, 0 unresolved",
  translationStatus:
    "RELEASE-COMPLETE project-created translation — Phase 4 T1 COMPLETE, T2/T3/T4 PASS, editorial-consistency review PASS; drafted independently from the FINAL-CLEARED Tamil (source-English scans 8–9 are secondary witness only)",

  provenance: {
    physicalVerification: "5 / 5 canonical verse pages (scans 3–7) present in the 10-page controlling PDF",
    poemScanPages: "3–7",
    poemVerification: "5 / 5 verified",
    printedPageMapping: "scans 3–7 carry VISIBLE printed page numbers 2–6 (page map); those printed pages are carried on the reading lines and are never inferred",
    sourceTypeLabel: { ta: "அச்சிட்ட நூல்", en: "printed booklet" },
    publicationNotEstablished:
      "The pinned source repository states no publication title, edition statement or publication year for this booklet in its own prose, so publicationYear and editionStatement are null. The controlling scan is a standalone booklet whose identity travels as filename + SHA-256 + size + scan map.",
    englishTitleNote:
      "The released English title `Nehru, the Noble Leader` is the project's own reviewed title, declared in the reviewed English section frontmatter and its assembly H1. The historical source-English rendering `BEAUTY ROSE WEPT` (Dr. Krishna Srinivas, scans 8–9) is a secondary witness only and is NOT adopted as the title or the translation.",
    lockedExclusions: [
      "scan 1 (cover) and scan 10 (photograph / back matter): outside the poem",
      "scan 2 `பதிப்புரை` (publisher's preface): outside the poem body",
      "scans 8–9, the printed source-English translation `BEAUTY ROSE WEPT` (Dr. Krishna Srinivas) with credit/imprint: a historical secondary witness only, excluded from both reading layers and never used to control the project translation",
      "the scan-7 performance note: verified but outside the poem verse, excluded during canonical assembly",
      "the repeated title `குணநாயகர் நேரு` / `## Nehru, the Noble Leader` and the attribution `முதல்வர் கலைஞர்` / `**Chief Minister Kalaignar**` at the poem head — carried as the work's title and author and never as verse",
      "the editorial `## Section 1` navigation label and the Markdown explanatory prose in the reader-facing English assembly",
    ],
    verification: {
      tamilAssembly: "PASS — canonical verse scans 3–7 = 5/5, 0 missing, 0 duplicate, order 3 → 4 → 5 → 6 → 7",
      tamilDiscrepancies: 0,
      englishRelease: "RELEASE-COMPLETE",
      englishBatches: "Batch 01 reviewed PASS (T1 COMPLETE, T2/T3/T4 PASS); scan markers 3–7 = 5/5 exactly once",
      englishOmissions: 0,
      englishDuplications: 0,
      fullPoemVoiceReview: "PASS — editorial-consistency and release-integrity review of the released English assembly",
    },
    boundaryNote:
      "TEXTUAL/RHETORICAL continuity and TYPOGRAPHIC stanza relation are separate dimensions and are recorded separately. Marker-adjacent blank-line formatting does not establish the stanza relation. Blank lines wholly inside one source page ARE source-established stanza structure and are preserved as such. Embedded quotations rendered with a leading `>` in the released English are carried verbatim as released.",
    provenanceGranularity:
      "Line-level scan provenance in BOTH layers, with the VISIBLE printed page (2–6) carried per line. Tamil lines carry the scan of their assembly region; English lines carry the scan marked in the reviewed section, whose verse is proved byte-identical to the released assembly.",
    terminologyNote:
      "A maximal run of lines between two boundaries is a VERSE RUN, not a stanza: where a run is bounded by a page transition whose relation is unresolved, the printed stanza it belongs to is simply not established. Only runs delimited on both sides by source-established stanza structure are counted as source-established stanzas. No derived run count is reported as a printed stanza count.",
    derivedNote:
      "Derived structure only. The Tamil assembly is the authoritative source layer; the English is the RELEASE-COMPLETE project-created translation, drafted independently from the Tamil. Neither was retranslated, modernized, re-lineated or normalized during import: line text, line order, in-page stanza gaps, indentation, punctuation, quotation marks, the leading `>` of embedded quotations and repetition are carried exactly as released.",
    blockerResolution:
      "Resolution requires an UPSTREAM source-archive visual/source review of the controlling scan TVA_BOK_0065713 (poem scans 3–7) that explicitly records the printed stanza relationship at each physical page transition. The source PDF is not vendored here, and this Digital Library integration does not establish those typographic facts independently.",
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
        "This is the PRESENT project-level rights status of Kalaignar's underlying poem. The printed booklet that carries it is an edition fact, not a statement about those rights.",
      thirdPartyNote:
        "Nationalisation applies to Kalaignar's underlying authored poem. It does NOT extend to the booklet's other matter — its preface, the source-English translation with its own translator credit, its illustrations and its layout — each of which retains its own distinct provenance.",
      projectTranslationNote:
        "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created) drafted independently from the Tamil, with its own distinct provenance; it is not covered by the nationalisation of the Tamil work, and it is not the booklet's historical source-English witness.",
      evidencePending:
        "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
    },
  },

  notes: ({ TRANSITIONS, relCount }) => [
    "The controlling source is a scanned booklet PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan map.",
    "The poem body is scans 3–7 (5 pages) inside a 10-page booklet. The cover, preface, source-English translation (scans 8–9) and back matter are outside the poem. The visible printed page numbers 2–6 are carried on the reading lines.",
    "The booklet prints a historical source-English translation (`BEAUTY ROSE WEPT`, Dr. Krishna Srinivas) on scans 8–9; it is a secondary witness only and did not control the project's translation, which was drafted independently from the FINAL-CLEARED Tamil.",
    "The source establishes no publication title, edition statement or publication year for this booklet in its own prose, so publicationYear and editionStatement are null.",
    `Cross-page structure is resolved only from explicit source evidence: of ${TRANSITIONS.length} physical page transitions, ${relCount("same-stanza")} are recorded same-stanza, ${relCount("stanza-boundary")} stanza-boundary, and ${relCount("unknown")} are unresolved and stay unresolved.`,
    "A source line remains one logical line. Indentation is carried as a source fact so it survives without <pre> styling, and a long line may wrap visually on a narrow viewport without ever becoming two poetic lines.",
  ],
};
