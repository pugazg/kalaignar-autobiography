// அண்ணா கவியரங்கம் / "Anna Kaviyarangam" — standalone poem declaration.
//
// The chair-poem Kalaignar sang while presiding over the "Anna Kaviyarangam" at the World Tamil
// Conference, Chennai, on 7-1-68, printed across physical scans 119–124 of the முரசொலி-பொங்கல் மலர்
// (1968). It is a single chair-poem with SOURCE-ESTABLISHED internal structure: a printed source-
// context note above the poem, and eight poet-handoff headings each followed by the chairman's `மு. க.`
// marker introducing Kalaignar's verse for that poet.
//
// Its Tamil assembly uses a third convention — `<!-- scan_page: N / printed_page: M -->` markers over
// ```text fences (`fenced-scan-page`). Scan 119 prints the visible page number 19; scans 120–124 show
// none. The eight handoff headings are carried as source headings in BOTH layers (the English renders
// them as `### …`; the Tamil prints them as plain lines, declared here as headingLines); the eight
// `மு. க.` / `**M. K.**` markers are carried verbatim as lines.

const SLUG = "anna-kaviyarangam";
const POEM_SCANS = [119, 120, 121, 122, 123, 124];

// The eight poet-handoff headings printed in the Tamil source, in reading order (Gate-2 order). They
// are source structure, not verse, and each layer carries its own witness of them.
const HANDOFF_HEADINGS = [
  "கவிஞர் ஆனந்தம் ‘தலைவர் அண்ணா’ எனப் பாடுதல்",
  "பேச்சாளர் அண்ணா பொன்னி வளவன் பாடுதல்",
  "எழுத்தாளர் அண்ணா கொத்தமங்கலம் சுப்பு பாடுதல்",
  "தத்துவ மேதை அண்ணா தமிழ்ப்பித்தன் பாடுதல்",
  "தாய் மொழிக் காவலர் அண்ணா—முடியரசன் பாடுதல்",
  "அன்னை அண்ணா வேழவேந்தன் பாடுதல்",
  "நடிகர் அண்ணா முத்துலிங்கம் பாடுதல்",
  "முதலமைச்சர் அண்ணா அப்துல் ரகுமான் பாடுதல்.",
];

// The source-context note printed above the poem (verbatim). It establishes the occasion and date.
const CONTEXT_NOTE_TA = `சென்னையில் உலகத் தமிழ் மாநாட்டில்
7-1-68 அன்று நடைபெற்ற ‘அண்ணா
கவியரங்கத்திற்கு’ பொதுப்பணித் துறை
அமைச்சர் கலைஞர் கருணாநிதி தலைமை
வகித்தார்.

அண்ணா அவர் குணம் பற்றியும்
கவியரங்கத்தில் கலந்து கொண்ட
கவிஞர்களை வரவேற்றும், அவர் தம் கவிதைச்
சிறப்பினைப் பாராட்டியும் கலைஞர்
கருணாநிதி அவர்கள் பாடிய கவிதை இது.`;

export default {
  slug: SLUG,
  poemScans: POEM_SCANS,
  title: { ta: "அண்ணா கவியரங்கம்", en: "Anna Kaviyarangam" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_PRL_0001502_முரசொலி_பொங்கல் மலர்_1968.pdf",
    sha256: "5f9cc505038ae1c3f91cbd0b50c0b6692b54baeee40fffef1fcdc8d213a146ce",
    sizeBytes: 58026496,
    sizeText: "58,026,496",
    totalPages: 136,
  },

  // Scan 119 prints the visible page number 19; scans 120–124 print none and are never inferred.
  printedPageFor: (scan) => (scan === 119 ? 19 : null),

  tamil: {
    file: `sections/${SLUG}.md`,
    convention: "fenced-scan-page",
    // The eight poet-handoff headings the source prints inside the poem — carried as source headings,
    // never as verse. Both reading layers must agree on the count.
    headingLines: HANDOFF_HEADINGS,
  },

  english: {
    markerScan: /scan_page:\s*(\d+)/,
    sourceHeadings: true,
    verseStartAt: "<!-- scan_page: 119 / printed_page: 19 -->",
    batches: [{ id: "sections-01", n: 1, file: "translations/en/sections/01.md", scans: POEM_SCANS }],
    assembly: { file: `translations/en/${SLUG}-en.md`, startAt: "<!-- scan_page: 119 / printed_page: 19 -->" },
  },

  auditDocs: [
    ...POEM_SCANS.map((s) => `pages/${String(s).padStart(4, "0")}.md`),
    "HANDOVER.md",
    "HISTORICAL_GLYPH_AUDIT.md",
    "LEXICAL_ADJUDICATION_2026-09-06.md",
    "NEXT_CHAT_PROMPT.md",
    "PHASE1_COMPLETION.md",
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
    "sections/anna-kaviyarangam.md",
    "translations/en/ASSEMBLY.md",
    "translations/en/EDITORIAL_CONSISTENCY_REVIEW.md",
    "translations/en/README.md",
    "translations/en/RELEASE_INTEGRITY_REVIEW.md",
    "translations/en/RELEASE_REPORT.md",
    "translations/en/SOURCE_MAP.md",
    "translations/en/TRANSLATION_PLAN.md",
    "translations/en/anna-kaviyarangam-en.md",
    "translations/en/batches/batch-01.md",
    "translations/en/sections/01.md",
  ],

  excludedPhrases: [
    "batch-reviewed", "voice_policy", "translation_basis", "assembled-awaiting-gate5-review",
    "Source-sensitive decisions", "Batch-stage closure", "Review by source scan", "REVIEWED",
  ],

  sourceContext: {
    noteTa: CONTEXT_NOTE_TA,
    noteEn:
      "The note printed above the poem records that Public Works Minister Kalaignar M. Karunanidhi presided over the ‘Anna Kaviyarangam’ held at the World Tamil Conference in Chennai on 7-1-68, and that this is the poem he sang about Anna's qualities, welcoming the participating poets and praising the excellence of their verse.",
    dateIso: "1968-01-07",
    datePrinted: "7-1-68",
    occasion: {
      ta: "உலகத் தமிழ் மாநாட்டில் நடைபெற்ற ‘அண்ணா கவியரங்கம்’",
      en: "The Anna Kaviyarangam at the World Tamil Conference in Chennai",
    },
  },

  publicationYear: 1968,
  editionStatement: "முரசொலி-பொங்கல் மலர், 1968",
  factsNotStated: ["printed-page-numbers-on-scans-120-124", "cross-page-stanza-relationships"],
  transcriptionStatus:
    "verified source assembly — Phase 1 6/6, Phase 2 PASS 6/6, historical-glyph second pass PASS, Phase 3 Gates 1–6 PASS / Tamil FINAL-CLEARED; source-context 1/1, handoff headings 8/8, மு. க. markers 8/8, 0 unresolved",
  translationStatus:
    "RELEASE-COMPLETE project-created translation — Phase 4 Batch 01 REVIEWED/PASS, assembly / editorial-consistency / release-integrity review PASS",

  provenance: {
    physicalVerification: "6 / 6 poem pages present in the 136-page controlling PDF",
    poemScanPages: "119–124",
    poemVerification: "6 / 6 verified",
    printedPageMapping: "scan 119 carries the VISIBLE printed page number 19; scans 120–124 print none and are recorded null, never inferred",
    unnumberedScanNote:
      "Scan 119 shows the printed page number 19; scans 120–124 show no printed numeral and remain null. No sequence position is treated as a printed page number.",
    sourceTypeLabel: { ta: "அச்சிட்ட மலர் இதழ்", en: "printed annual" },
    publicationEstablished: {
      publicationTa: "முரசொலி - பொங்கல் மலர்",
      editionStatement: "முரசொலி-பொங்கல் மலர், 1968",
      year: 1968,
    },
    sourceHeadingNote:
      "The poem prints eight poet-handoff headings inside it (`கவிஞர் ஆனந்தம் … எனப் பாடுதல்` and the like), each introducing the poet whose contribution Kalaignar answers, followed by his `மு. க.` marker. They are source structure, carried as source headings in both reading layers — the released English renders them as `### …` headings — and both layers agree there are exactly eight. The eight `மு. க.` / `**M. K.**` markers are carried verbatim as lines.",
    lockedExclusions: [
      "the source-context note printed above the poem (scan 119) — carried as sourceContext metadata, never as verse",
      "scans 118 and 125: boundary evidence only, outside the poem body",
      "scans 1–118 and 125–136 of the annual issue: other items entirely",
      "the `# அண்ணா கவியரங்கம்` document title, the `## கவிதை` label and the Markdown explanatory prose of the assemblies",
      "batch-review and gate-decision prose from the reviewed English section and its review report",
    ],
    verification: {
      tamilAssembly: "PASS — 6/6 poem pages, 0 missing, 0 duplicate, order 119 → 120 → 121 → 122 → 123 → 124; handoff headings 8/8, மு. க. markers 8/8",
      tamilDiscrepancies: 0,
      englishRelease: "RELEASE-COMPLETE",
      englishBatches: "Batch 01 reviewed PASS; scan markers 119–124 = 6/6 exactly once",
      englishOmissions: 0,
      englishDuplications: 0,
      fullPoemVoiceReview: "PASS — assembly, editorial-consistency and release-integrity review of the released English assembly",
    },
    boundaryNote:
      "TEXTUAL/RHETORICAL continuity and TYPOGRAPHIC stanza relation are separate dimensions and are recorded separately. Marker-adjacent blank-line formatting does not establish the stanza relation. Blank lines wholly inside one source page ARE source-established stanza structure and are preserved as such; the eight poet-handoff headings and the eight `மு. க.` markers are carried exactly as the source prints them.",
    provenanceGranularity:
      "Line-level scan provenance in BOTH layers, with the visible printed page (19) carried on scan-119 lines. Tamil lines carry the scan of their fenced block; English lines carry the scan marked in the reviewed section, whose verse is proved byte-identical to the released assembly.",
    terminologyNote:
      "A maximal run of lines between two boundaries is a VERSE RUN, not a stanza: where a run is bounded by a page transition whose relation is unresolved, the printed stanza it belongs to is simply not established. Only runs delimited on both sides by source-established stanza structure are counted as source-established stanzas. No derived run count is reported as a printed stanza count.",
    derivedNote:
      "Derived structure only. The Tamil assembly is the authoritative source layer; the English is the RELEASE-COMPLETE project-created translation. Neither was retranslated, modernized, re-lineated or normalized during import: line text, line order, in-page stanza gaps, indentation, punctuation, the eight poet-handoff headings, the eight `மு. க.` markers, quotation marks and repetition are carried exactly as released.",
    blockerResolution:
      "Resolution requires an UPSTREAM source-archive visual/source review of the controlling scan TVA_PRL_0001502 (poem scans 119–124) that explicitly records the printed stanza relationship at each physical page transition. The source PDF is not vendored here, and this Digital Library integration does not establish those typographic facts independently.",
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
        "This is the PRESENT project-level rights status of Kalaignar's underlying poem. The 1968 முரசொலி-பொங்கல் மலர் issue that carries it is an edition fact, not a statement about those rights.",
      thirdPartyNote:
        "Nationalisation applies to Kalaignar's underlying authored poem. It does NOT extend to the surrounding annual issue — its other items, the contributions of the eight named poets, its illustrations, its layout and its cover — each of which retains its own distinct provenance.",
      projectTranslationNote:
        "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created) with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
      evidencePending:
        "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
    },
  },

  notes: ({ TRANSITIONS, relCount }) => [
    "The controlling source is a scanned annual-issue PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan map.",
    "The poem body is scans 119–124 (6 pages). Scan 119 carries the visible printed page number 19; scans 120–124 show none. Scans 118/125 are boundary evidence only.",
    "The archive states this work's publication and year in its own Work-identity prose — முரசொலி-பொங்கல் மலர், 1968 — so publicationYear and editionStatement are established. The printed source-context note establishes the occasion (the Anna Kaviyarangam at the World Tamil Conference, Chennai) and the offering date 7-1-68; that context date is not promoted to a separate publication date.",
    "The poem prints eight poet-handoff headings and eight `மு. க.` markers; both are source structure, carried in both reading layers, with the two layers agreeing there are exactly eight handoff headings.",
    `Cross-page structure is resolved only from explicit source evidence: of ${TRANSITIONS.length} physical page transitions, ${relCount("same-stanza")} are recorded same-stanza, ${relCount("stanza-boundary")} stanza-boundary, and ${relCount("unknown")} are unresolved and stay unresolved.`,
    "A source line remains one logical line. Indentation is carried as a source fact so it survives without <pre> styling, and a long line may wrap visually on a narrow viewport without ever becoming two poetic lines.",
  ],
};
