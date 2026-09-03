// இதயத்தைத் தந்திடு அண்ணா / "Lend Me Your Heart, Anna" — standalone poem declaration.
//
// A கண்ணீர்க் கவிதாஞ்சலி offered by Kalaignar M. Karunanidhi to Perarignar Anna on Chennai Radio on
// 9.2.1969. Every value below is a statement about the pinned source tree poems/<slug> in
// pugazg/kalaignar-poems; the engine (scripts/lib/standalone-poem.mjs) supplies no defaults for any
// of it. Facts the scan does not establish stay null and are named in factsNotStated.
//
// ── CORRECTED AFTER INDEPENDENT REVIEW ───────────────────────────────────────────────────────────
// An earlier revision asserted that all 13 physical page transitions fall inside a stanza, on two
// grounds that do not survive scrutiny:
//
//   1. "no fenced Tamil block begins or ends with a blank line". The assembly stores each source
//      page as its own FENCED block, so a blank line CANNOT be expressed across a page edge there.
//      Absence of a blank at a fence edge is a property of the container, not a source statement.
//   2. "the source archive certifies continuations at 13→14, 22→23, 23→24 …". Those records are
//      TEXTUAL / RHETORICAL ("the final poetic line continues directly onto scan 14", "the final
//      open quotation continues onto scan 23"). A sentence, quotation or rhetorical movement can
//      run on across a printed stanza break. Textual continuity is not typographic evidence.
//
// The engine therefore classifies the two dimensions SEPARATELY and takes each classification only
// from explicit statements in the pinned source repository.

const SLUG = "idhayathai-thanthidu-anna";
const POEM_SCANS = Array.from({ length: 14 }, (_, i) => 13 + i); // 13 … 26

const CONTEXT_NOTE_TA =
  "(9.2.1969 அன்று சென்னை வானொலியில் பேரறிஞர் அண்ணா\nஅவர்களுக்குக் கலைஞர் மு. கருணாநிதி அவர்கள் அளித்த\nகண்ணீர்க் கவிதாஞ்சலி)";

export default {
  slug: SLUG,
  poemScans: POEM_SCANS,
  title: { ta: "இதயத்தைத் தந்திடு அண்ணா", en: "Lend Me Your Heart, Anna" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_BOK_0064132_இதயத்தைத்_தந்திடு_அண்ணா.pdf",
    sha256: "152cfb251a2049662102a2296487220f6f227f243657c9456df34105520676fe",
    sizeBytes: 26816066,
    sizeText: "26,816,066",
    totalPages: 28,
  },

  // Scan → VISIBLE printed page. Scan 26 shows no printed number and is NOT silently labelled 24.
  printedPageFor: (scan) => (scan <= 25 ? scan - 2 : null),

  tamil: {
    file: `sections/${SLUG}.md`,
    convention: "fenced-labelled",
    unnumberedLabels: ["no visible printed page number"],
  },

  english: {
    verseStartAfter: "## English translation",
    verseEndBefore: "## Translator's notes",
    batches: [
      { id: "batch-01", n: 1, file: "translations/en/batches/batch-01.md", scans: [13, 14, 15] },
      { id: "batch-02", n: 2, file: "translations/en/batches/batch-02.md", scans: [16, 17, 18, 19] },
      { id: "batch-03", n: 3, file: "translations/en/batches/batch-03.md", scans: [20, 21] },
      { id: "batch-04", n: 4, file: "translations/en/batches/batch-04.md", scans: [22, 23] },
      { id: "batch-05", n: 5, file: "translations/en/batches/batch-05.md", scans: [24, 25, 26] },
    ],
    assembly: { file: `translations/en/${SLUG}-en.md`, startAt: "<!-- batch 01" },
  },

  // Read IN THIS ORDER: citation order is part of the emitted payload. The engine proves the list is
  // complete against every Markdown file in the work tree except the page records of non-poem scans.
  auditDocs: [
    ...POEM_SCANS.map((s) => `pages/${String(s).padStart(4, "0")}.md`),
    "ASSEMBLY_REVIEW.md",
    "audit.md",
    "README.md",
    "metadata/source.md",
    "indexes/page-map.md",
    "SOURCE_COMPLETENESS_REVIEW.md",
    `sections/${SLUG}.md`,
    ...[1, 2, 3, 4, 5].map((n) => `translations/en/batches/batch-0${n}.md`),
    ...["SOURCE_MAP.md", "EDITORIAL_CONSISTENCY_REVIEW.md", "RELEASE_REPORT.md", "README.md", "TRANSLATION_PLAN.md", `${SLUG}-en.md`].map(
      (f) => `translations/en/${f}`,
    ),
  ],

  excludedPhrases: [
    "9.2.1969", "சென்னை வானொலியில்", "கண்ணீர்க் கவிதாஞ்சலி",
    "அச்சிட்டோர்", "வைகை பிரிண்டர்ஸ்", "சைதாப்பேட்டை",
    "உலகத்தமிழ் செம்மொழி", "பிறப்பொக்கும் எல்லா உயிர்க்கும்", "வாழிய வாழியவே",
    "குறிஞ்சி சுப்பிரமணியன்", "என்னுரை", "15.9.2008",
    "Translator's notes", "Source-fidelity review", "Kalaignar-voice review", "Batch judgement",
    "reviewed", "assembly",
  ],

  sourceContext: {
    noteTa: CONTEXT_NOTE_TA,
    noteEn:
      "The note printed above the poem records that on 9.2.1969, on Chennai Radio, Kalaignar M. Karunanidhi offered this கண்ணீர்க் கவிதாஞ்சலி — a tearful poetic tribute — to Perarignar Anna.",
    dateIso: "1969-02-09",
    datePrinted: "9.2.1969",
    venue: { ta: "சென்னை வானொலி", en: "Chennai Radio" },
    occasion: { ta: "பேரறிஞர் அண்ணாவுக்கான கண்ணீர்க் கவிதாஞ்சலி", en: "A poetic tribute to Perarignar Anna" },
  },

  publicationYear: null,
  editionStatement: null,
  factsNotStated: ["publication-year", "edition-statement", "printed-page-number-on-scan-26", "cross-page-stanza-relationships"],
  transcriptionStatus: "verified source assembly — PASS, 0 discrepancies (28/28 physical scans, 14/14 poem scans)",
  translationStatus: "RELEASE-COMPLETE project-created translation — batches 01–05 reviewed PASS, full-poem voice/fidelity review PASS",

  provenance: {
    physicalVerification: "28 / 28 verified",
    poemScanPages: "13–26",
    poemVerification: "14 / 14 verified",
    printedPageMapping: "printed pages 11–23 on scans 13–25",
    unnumberedScanNote: "Scan 26 carries no visible printed page number; it is NOT silently labelled 24 and no number is inferred.",
    publicationNotEstablished:
      "The supplied scan establishes NO standalone publication-year or edition statement, so publicationYear and editionStatement are null. The 9.2.1969 context is the poem's source-established offering date, NOT a publication date.",
    forewordDateNote:
      "The foreword (என்னுரை, scans 5–10) ends with சென்னை -20 and the date 15.9.2008. That is a foreword-internal date belonging to third-party front matter. It is NEVER presented as the publication year, the edition year, or a '2008 poem'.",
    lockedExclusions: [
      "scan 13 source/context note printed above the poem — metadata, never verse",
      "scan 26 printer imprint (அச்சிட்டோர் / வைகை பிரிண்டர்ஸ் & பப்ளிஷர்ஸ் / சைதாப்பேட்டை, சென்னை-15.)",
      "scans 27–28 back matter (World Classical Tamil Conference poster with its separate Kalaignar composition; back cover)",
      "scans 1–12 front matter: cover, publisher/donor advertisement, photographs, portrait, and the என்னுரை foreword",
      "translator notes, source-fidelity checklists, voice reviews and batch-judgement prose from the translation batches",
      "the Markdown explanatory prose surrounding both released assemblies",
    ],
    verification: {
      tamilAssembly: "PASS — 14/14 page blocks, 0 missing, 0 duplicate",
      tamilDiscrepancies: 0,
      englishRelease: "RELEASE-COMPLETE",
      englishBatches: "01–05 reviewed PASS; 5/5 present exactly once; 14/14 poem scans represented",
      englishOmissions: 0,
      englishDuplications: 0,
      fullPoemVoiceReview: "PASS — full-poem Kalaignar-language/voice review",
    },
    boundaryNote:
      "TEXTUAL/RHETORICAL continuity and TYPOGRAPHIC stanza relation are separate dimensions and are recorded separately. The source archive records cross-page textual continuations (a line, a quotation or a rhetorical movement running on), but a sentence can run on across a printed stanza break, so those records do not establish the stanza relation. Marker-adjacent blank-line formatting does not by itself establish the cross-page stanza relationship either: in the Tamil assembly each page is a separate fenced block, which structurally cannot express a blank line across the page edge, and in the English release every hidden marker is written with blank-line padding on both sides. Blank lines wholly inside one source page ARE source-established stanza structure and are preserved as such.",
    provenanceGranularity:
      "Line-level scan provenance in BOTH layers. Tamil lines carry the scan of their assembly block; English lines carry the scan marked in the reviewed batch files, whose verse is proved byte-identical to the released assembly. Printed page numbers are recorded only where the scan shows one (scans 13–25 → printed 11–23); scan 26 stays null.",
    terminologyNote:
      "A maximal run of lines between two boundaries is a VERSE RUN, not a stanza: where a run is bounded by a page transition whose relation is unresolved, the printed stanza it belongs to is simply not established. Only runs delimited on both sides by source-established stanza structure are counted as source-established stanzas. No derived run count is reported as a printed stanza count.",
    derivedNote:
      "Derived structure only. The Tamil assembly is the authoritative source layer; the English is the RELEASE-COMPLETE project-created translation. Neither was retranslated, modernized, re-lineated or normalized during import: line text, line order, in-page stanza gaps, indentation, punctuation, quotation marks, ellipses and repetition are carried exactly as released.",
    blockerResolution:
      "Resolution requires an UPSTREAM source-archive visual/source review of the controlling scan TVA_BOK_0064132_இதயத்தைத்_தந்திடு_அண்ணா.pdf (poem scans 13–26) that explicitly records the printed stanza relationship at each physical page transition. The source PDF is not vendored here, and this Digital Library integration does not establish those typographic facts independently.",
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
        "This is the PRESENT project-level rights status of Kalaignar's underlying poem. The booklet's own publisher/donor matter is an edition fact, not a statement about those rights.",
      thirdPartyNote:
        "Nationalisation applies to Kalaignar's underlying authored poem. It does NOT extend to the third-party என்னுரை foreword, the photographs and their captions, the publisher/donor advertisement and back matter, the printer imprint, or the cover/design — each of which retains its own distinct provenance.",
      projectTranslationNote:
        "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created) with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
      evidencePending:
        "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
    },
  },

  notes: ({ TRANSITIONS, relCount }) => [
    "The controlling source is the supplied scanned PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan map.",
    "The poem body is scans 13–26 (14 scans). Scans 1–12 (front matter, foreword, photographs) and scans 27–28 (poster, back cover) are outside the poem.",
    "The source context printed above the poem — 9.2.1969 / சென்னை வானொலி / a கண்ணீர்க் கவிதாஞ்சலி to பேரறிஞர் அண்ணா — is carried as METADATA. Not one word of it is inserted into the verse.",
    "The scan establishes no publication year and no edition statement, so both are null. The 15.9.2008 foreword date is foreword-internal third-party matter and is never surfaced as publication or edition metadata.",
    `Independent-review correction: an earlier revision asserted that all ${TRANSITIONS.length} physical page transitions fall inside a stanza. That conflated textual continuity with typographic stanza continuity. The two dimensions are now recorded separately, and the stanza relation is resolved only from explicit source evidence — currently ${relCount("same-stanza")} same-stanza, ${relCount("stanza-boundary")} stanza-boundary, ${relCount("unknown")} unresolved.`,
    "A source line remains one logical line. Indentation is carried as a source fact so it survives without <pre> styling, and a long line may wrap visually on a narrow viewport without ever becoming two poetic lines.",
  ],
};
