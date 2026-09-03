// தென்னவன் காதை / "The Lay of the Southern King" — standalone poem declaration.
//
// Published in முரசொலி-பொங்கல் மலர், 1956 — the only one of the four standalone works whose pinned
// archive states a publication and a year in its own prose, so it is the only one that carries a
// publicationEstablished record. The work occupies pages 145–152 of a 218-page periodical scan;
// page 153 begins a different work and positively closes the boundary.
//
// Two things make this the most demanding of the four to import truthfully:
//
//   1. Its four reviewed English batches each end at a DIFFERENT review heading (Gate A, Gate B,
//      Gate C, translator review), and its released assembly carries no hidden markers at all — so
//      per-line scan provenance comes from the batches and is then proved equal to the assembly.
//   2. Scan 151 carries a documented OWNER-DIRECTED EDITORIAL OMISSION: one caste-based slur is
//      omitted without replacement at the owner's explicit direction, and the omitted term is not
//      reproduced anywhere in the archive. It is recorded below as an editorial exception —
//      NOT as a locked exclusion, because a locked exclusion is non-verse matter that was never
//      part of the poem, and this is verse matter that the owner directed be left out. Conflating
//      the two would misrepresent both. Nothing here reconstructs, transliterates, paraphrases or
//      substitutes the omitted word.

const SLUG = "thennan-kathai";
const POEM_SCANS = Array.from({ length: 8 }, (_, i) => 145 + i); // 145 … 152

export default {
  slug: SLUG,
  poemScans: POEM_SCANS,
  // UNRESOLVED UPSTREAM. Unlike the other three standalone poems, this work's released assembly
  // declares NO final English title: its only heading is the document title
  // `# தென்னவன் காதை — English Translation`, and translations/en/SOURCE_MAP.md states that the batch
  // "translates poem body only unless a final English title is separately approved". No such
  // approval exists in the frozen tree. The English below is therefore a PROJECT-SUPPLIED READING
  // LABEL, not a source-established title, and it is recorded as such in factsNotStated and in
  // provenance.englishTitleNote rather than presented as something the archive says.
  title: { ta: "தென்னவன் காதை", en: "The Lay of the Southern King" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_PRL_0007090_முரசொலி.pdf",
    sha256: "a9252bcb0931366c61497d55a354964b1450a8254d2ca3f119c5f6b1c680a643",
    sizeBytes: 246184679,
    sizeText: "246,184,679",
    totalPages: 218,
  },

  // The page map's "Visible printed page" column records `—` for all eight poem pages.
  printedPageFor: () => null,

  tamil: {
    file: `sections/${SLUG}.md`,
    convention: "fenced-labelled",
    unnumberedLabels: ["no visible printed page number"],
  },

  english: {
    verseStartAfter: "## English translation",
    batches: [
      { id: "EN-01", file: "translations/en/batches/EN-01-scans-145-146.md", scans: [145, 146], verseEndBefore: "## Translator review — Gate A decisions" },
      { id: "EN-02", file: "translations/en/batches/EN-02-scans-147-148.md", scans: [147, 148], verseEndBefore: "## Translator review — Gate B decisions" },
      { id: "EN-03", file: "translations/en/batches/EN-03-scans-149-151.md", scans: [149, 150, 151], verseEndBefore: "## Gate C review notes" },
      { id: "EN-04", file: "translations/en/batches/EN-04-scan-152.md", scans: [152], verseEndBefore: "## Translator review notes" },
    ],
    // The released assembly carries NO hidden markers, so per-line scan provenance cannot come from
    // it; it comes from the four reviewed batches and the engine then proves the batch-derived
    // stream IS this assembly, line for line, after its single title heading.
    assembly: { file: `translations/en/${SLUG}-en.md`, startAfter: "# தென்னவன் காதை — English Translation" },
  },

  auditDocs: [
    ...POEM_SCANS.map((s) => `pages/${String(s).padStart(4, "0")}.md`),
    "ASSEMBLY_REVIEW.md",
    "audit.md",
    "README.md",
    "metadata/source.md",
    "indexes/page-map.md",
    "SOURCE_COMPLETENESS_REVIEW.md",
    `sections/${SLUG}.md`,
    "notes/FINAL_CONTINUITY_AUDIT_2026-08-26.md",
    "notes/SCAN_146_THIRD_REAUDIT_2026-08-25.md",
    "notes/SCAN_147_THIRD_REAUDIT_2026-08-25.md",
    "notes/SCAN_148_USER_CONFIRMED_RECONCILIATION_2026-08-26.md",
    "notes/SCAN_149_USER_LEXICAL_RECONCILIATION_2026-08-26.md",
    "notes/SCAN_150_USER_LEXICAL_RECONCILIATION_2026-08-26.md",
    "notes/TRANSCRIPTION_FAILURE_REVIEW_2026-08-23.md",
    "translations/en/batches/EN-01-scans-145-146.md",
    "translations/en/batches/EN-02-scans-147-148.md",
    "translations/en/batches/EN-03-scans-149-151.md",
    "translations/en/batches/EN-04-scan-152.md",
    ...[
      "SOURCE_MAP.md",
      "PLAN_REVIEW.md",
      "GATE_A_REVIEW.md",
      "GATE_B_REVIEW.md",
      "GATE_C_REVIEW.md",
      "GATE_D_REVIEW.md",
      "EDITORIAL_CONSISTENCY_REVIEW.md",
      "RELEASE_REPORT.md",
      "README.md",
      "TRANSLATION_PLAN.md",
      `${SLUG}-en.md`,
    ].map((f) => `translations/en/${f}`),
  ],

  excludedPhrases: [
    "தென்னிலங்கை வேந்தன் இராவணனைத்",
    "Translator review", "Gate A decisions", "Gate B decisions", "Gate C review", "Gate status",
    "Source scope", "English translation", "REVIEWED", "lexical control", "caste-based slur",
  ],

  // The archive records no context note printed above this poem.
  sourceContext: undefined,
  publicationYear: 1956,
  editionStatement: "முரசொலி-பொங்கல் மலர், 1956",
  factsNotStated: ["english-title", "printed-page-numbers", "cross-page-stanza-relationships"],

  // Recorded on the WORK, so it travels with the reading layers rather than only with the archival
  // record. The omitted term is not reproduced, reconstructed or substituted anywhere.
  editorialExceptions: [
    {
      scan: 151,
      kind: "owner-directed-omission",
      appliesTo: "both-reading-layers",
      summary:
        "At the source repository owner's explicit direction, one caste-based slur present in the source passage on scan 151 is omitted from the archival transcription without replacement, because the term is not considered appropriate in contemporary usage. The omitted source word is not reproduced in the archive, and it is not reproduced, transliterated, paraphrased, reconstructed or substituted here.",
      replacement: "none",
      omittedTermReproduced: false,
      consequence:
        "Scan 151 is a verified owner-controlled archival transcription with one documented editorial omission, rather than a character-for-character diplomatic reproduction at that single location. Every other scan of this poem is a full transcription.",
      restoration:
        "The omission must not be restored unless the source repository owner explicitly changes that instruction upstream. It is not a defect to be repaired downstream.",
      citations: [
        "pages/0151.md: User-directed editorial omission",
        "ASSEMBLY_REVIEW.md: the scan-151 user-directed omission remains omitted without replacement",
        "audit.md: Because of the explicit scan-151 omission, the assembled text is canonical for this repository but not a fully diplomatic character-for-character reproduction at that single location.",
        "SOURCE_COMPLETENESS_REVIEW.md: one caste-based slur is intentionally omitted without replacement at the user's explicit direction",
        "metadata/source.md: intentionally omitted without replacement in the canonical Tamil assembly and English translation",
      ],
    },
  ],

  transcriptionStatus:
    "verified source assembly — PASS, 8/8 page blocks, 0 missing, 0 duplicated, 0 discrepancies, 7/7 page joins, final continuity audit PASS, with one documented owner-directed editorial omission on scan 151",
  translationStatus:
    "RELEASE-COMPLETE project-created translation — batches EN-01–EN-04 REVIEWED/PASS through Gates A–D, editorial consistency review PASS",

  provenance: {
    physicalVerification: "8 / 8 poem pages present in the 218-page controlling PDF",
    poemScanPages: "145–152",
    poemVerification: "8 / 8 verified and reconciled",
    printedPageMapping: "none — the page map records no visible printed page number on any of the eight poem pages",
    unnumberedScanNote:
      "No poem page carries a visible printed page number: the page map's 'Visible printed page' column records `—` for all eight. The numbers 145–152 are PDF page positions inside the periodical and are never presented as printed page numbers.",
    // A NOUN PHRASE naming the KIND of printed source, because the source page composes it as
    // `the ${sourceTypeEn}` and `Source facts (the ${sourceTypeEn})`. A prepositional phrase here
    // ("from a printed periodical") produced "Source facts (the from a printed periodical)".
    sourceTypeLabel: { ta: "அச்சிட்ட இதழ்", en: "printed periodical" },
    englishTitleNote:
      "The frozen release declares NO final English title for this work. Its released assembly carries only the document heading `தென்னவன் காதை — English Translation`, and translations/en/SOURCE_MAP.md records that the translation batch translates the poem body only unless a final English title is separately approved; no such approval exists in the pinned tree. The English title shown in this library is therefore a project-supplied reading label, not a source-established title, and it is named in factsNotStated. It must be replaced by the approved title if one is established upstream.",
    publicationEstablished: {
      publicationTa: "முரசொலி-பொங்கல் மலர்",
      editionStatement: "முரசொலி-பொங்கல் மலர், 1956",
      year: 1956,
    },
    editorialExceptionNote:
      "One owner-directed editorial omission is in force on scan 151: a single caste-based slur is omitted without replacement, on the source repository owner's explicit instruction, and the omitted term is not reproduced anywhere in the archive or here. It is recorded under the work's editorialExceptions — deliberately NOT under lockedExclusions, which names non-verse matter that was never part of the poem. This exception is the opposite case: verse matter the owner directed be left out. No substitute epithet, transliteration, paraphrase or indirect reconstruction appears in either reading layer, and the omission is not restored downstream.",
    lockedExclusions: [
      "pages 1–144 and 153–218 of the periodical: other items entirely; page 153 positively closes this work's range",
      "the owner-supplied contextual description of the poem recorded in metadata/source.md — contextual metadata, never verse, and not printed on the controlling pages",
      "translator review notes and the Gate A–D decision, review and status prose from the four reviewed batches",
      "the Markdown explanatory prose surrounding both released assemblies",
    ],
    verification: {
      tamilAssembly: "PASS — 8/8 page blocks, 0 missing, 0 duplicated, 0 discrepancies",
      tamilDiscrepancies: 0,
      englishRelease: "RELEASE-COMPLETE",
      englishBatches: "EN-01–EN-04 REVIEWED/PASS through Gates A–D; 4/4 present exactly once; 8/8 poem scans represented",
      englishOmissions: 0,
      englishDuplications: 0,
      fullPoemVoiceReview: "PASS — final continuity audit (7/7 page joins, 8/8 ★ separators) and editorial consistency review",
    },
    boundaryNote:
      "TEXTUAL/RHETORICAL continuity and TYPOGRAPHIC stanza relation are separate dimensions and are recorded separately. This archive documents the textual dimension richly — a sentence, a speech or a narrative movement continuing across a page edge — but a sentence can run on across a printed stanza break, so those records do not establish the stanza relation. Marker-adjacent blank-line formatting does not establish it either: in the Tamil assembly each page is a separate fenced block, which structurally cannot express a blank line across the page edge, and in the reviewed English batches every hidden marker is written with blank-line padding on both sides. Blank lines wholly inside one source page ARE source-established stanza structure and are preserved as such.",
    provenanceGranularity:
      "Line-level scan provenance in BOTH layers. Tamil lines carry the scan of their assembly block; English lines carry the scan marked in the reviewed batch files, whose verse is proved byte-identical to the released assembly. No printed page number is recorded for any line, because the source establishes none.",
    terminologyNote:
      "A maximal run of lines between two boundaries is a VERSE RUN, not a stanza: where a run is bounded by a page transition whose relation is unresolved, the printed stanza it belongs to is simply not established. Only runs delimited on both sides by source-established stanza structure are counted as source-established stanzas. No derived run count is reported as a printed stanza count.",
    derivedNote:
      "Derived structure only. The Tamil assembly is the authoritative source layer; the English is the RELEASE-COMPLETE project-created translation. Neither was retranslated, modernized, re-lineated or normalized during import: line text, line order, in-page stanza gaps, indentation, punctuation, quotation marks, ellipses and repetition are carried exactly as released, including the documented scan-151 omission.",
    blockerResolution:
      "Resolution requires an UPSTREAM source-archive visual/source review of the controlling scan TVA_PRL_0007090_முரசொலி.pdf (poem pages 145–152) that explicitly records the printed stanza relationship at each physical page transition. The source PDF is not vendored here, and this Digital Library integration does not establish those typographic facts independently.",
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
        "This is the PRESENT project-level rights status of Kalaignar's underlying poem. The 1956 முரசொலி-பொங்கல் மலர் issue that carries it is an edition fact, not a statement about those rights.",
      thirdPartyNote:
        "Nationalisation applies to Kalaignar's underlying authored poem. It does NOT extend to the surrounding periodical — its other items, its illustrations, its layout and its cover — each of which retains its own distinct provenance.",
      projectTranslationNote:
        "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created) with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
      evidencePending:
        "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
    },
  },

  notes: ({ TRANSITIONS, relCount }) => [
    "The controlling source is a scanned periodical PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan map.",
    "The poem body is pages 145–152 (8 pages) of a 218-page periodical. Page 153 begins a different work and positively closes the range. The archive's earlier 150-page count was a renderer/preview limit rather than the physical PDF length, and is superseded.",
    "The archive states this work's publication and year in its own prose — முரசொலி-பொங்கல் மலர், 1956 — so publicationYear and editionStatement are established here rather than null. They are taken from that prose statement, not from the controlling scan's filename.",
    "One owner-directed editorial omission is in force on scan 151 and is recorded as an editorial exception, not as a locked exclusion. The omitted term is not reproduced, transliterated, paraphrased or substituted anywhere, and the omission is not restored downstream.",
    "The archive records no context note printed above this poem, so no date, venue or occasion is carried. The owner-supplied contextual description of the poem is metadata and not one word of it enters the verse.",
    `Cross-page structure is resolved only from explicit source evidence: of ${TRANSITIONS.length} physical page transitions, ${relCount("same-stanza")} are recorded same-stanza, ${relCount("stanza-boundary")} stanza-boundary, and ${relCount("unknown")} are unresolved and stay unresolved.`,
    "A source line remains one logical line. Indentation is carried as a source fact so it survives without <pre> styling, and a long line may wrap visually on a narrow viewport without ever becoming two poetic lines.",
  ],
};
