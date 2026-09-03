// அணையா விளக்கு அண்ணா / "Anna, the Inextinguishable Lamp" — standalone poem declaration.
//
// A கலைஞர் கவிதை issued as a standalone booklet: 19 physical scans, of which 7–17 are the poem body,
// 1–6 front matter and 18–19 closing visual/back matter. Those boundaries are source-derived and
// verified under the archive's completed 19/19 page-level review.
//
// This is the only one of the four standalone works whose printed source carries a STRUCTURAL
// HEADING inside the poem: `முடிவுரை` on scan 16. The Tamil assembly gives it no markup at all — it
// sits in the fenced block as an ordinary line — so it is recognised here only because the pinned
// archive states it, in three independent places, and the English release renders it as a heading
// rather than absorbing it into the verse. See provenance.sourceHeadingNote for the citations.

const SLUG = "anaiya-vilakku-anna";
const POEM_SCANS = Array.from({ length: 11 }, (_, i) => 7 + i); // 7 … 17

export default {
  slug: SLUG,
  poemScans: POEM_SCANS,
  // The English title is NOT a naming decision available to this import. The frozen release states it
  // outright — `english_title: "Anna, the Inextinguishable Lamp"` in the assembly's frontmatter, and
  // the same words as its H1 — so anything else here would be a silent retitling of a release-cleared
  // translation layer. The validator reads both of those and fails closed on any divergence.
  title: { ta: "அணையா விளக்கு அண்ணா", en: "Anna, the Inextinguishable Lamp" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_BOK_0065770_அணையா_விளக்கு_அண்ணா(1).pdf",
    sha256: "f68ec53dc87f3b331397fe3c6d686613fb22fcb0af717b022513867cf6d030f4",
    sizeBytes: 109709692,
    sizeText: "109,709,692",
    totalPages: 19,
  },

  // The page map records `—` in its "Printed page" column for every one of the 19 scans, and states
  // that no printed page number is recorded unless physically visible and that sequence position is
  // not treated as printed pagination.
  printedPageFor: () => null,

  tamil: {
    file: `sections/${SLUG}.md`,
    convention: "fenced-labelled",
    unnumberedLabels: ["no visible printed page number"],
    headingLines: ["முடிவுரை"],
  },

  english: {
    verseStartAfter: "## English translation",
    verseEndBefore: "## Translator notes",
    // The released English renders the source's structural heading as a Markdown heading inside the
    // verse region. The engine refuses headings inside verse unless a work declares them, so this
    // flag is the explicit statement that this work has one.
    sourceHeadings: true,
    batches: [
      { id: "batch-01", n: 1, file: "translations/en/batches/batch-01.md", scans: [7, 8, 9] },
      { id: "batch-02", n: 2, file: "translations/en/batches/batch-02.md", scans: [10, 11, 12] },
      { id: "batch-03", n: 3, file: "translations/en/batches/batch-03.md", scans: [13, 14, 15] },
      { id: "batch-04", n: 4, file: "translations/en/batches/batch-04.md", scans: [16, 17] },
    ],
    assembly: { file: `translations/en/${SLUG}-en.md`, startAt: "<!-- batch 01" },
  },

  auditDocs: [
    ...POEM_SCANS.map((s) => `pages/${String(s).padStart(4, "0")}.md`),
    "ASSEMBLY_REVIEW.md",
    "LEXICAL_RECONCILIATION_2026-09-01.md",
    "audit.md",
    "README.md",
    "metadata/source.md",
    "indexes/page-map.md",
    "SOURCE_COMPLETENESS_REVIEW.md",
    `sections/${SLUG}.md`,
    ...[1, 2, 3, 4].map((n) => `translations/en/batches/batch-0${n}.md`),
    ...[
      "SOURCE_MAP.md",
      "EDITORIAL_CONSISTENCY_REVIEW.md",
      "LEXICAL_RECONCILIATION_2026-09-01.md",
      "RELEASE_REPORT.md",
      "README.md",
      "TRANSLATION_PLAN.md",
      `${SLUG}-en.md`,
    ].map((f) => `translations/en/${f}`),
  ],

  // `முடிவுரை` is deliberately absent: it is the source's own structural heading and is carried as a
  // source-heading element, not stripped and not treated as verse.
  excludedPhrases: [
    "15-9-2008", "15 - 9 - 1987", "ரூ. 5", "தி.மு.க. தலைமைக் கழக வெளியீடு",
    "பகுத்தறிவுத் தந்தையும் பாசமிகு தனயனும்", "வாஞ்சைமிகு அண்ணனுடன் வழிநடக்கும் தம்பி!",
    "எதையும் தாங்கும் இதயம்", "இங்கே உறங்குகிறது",
    "Translator notes", "Batch review", "targeted reconciliation review",
    "reviewed", "assembly",
  ],

  // The archive records no context note printed above this poem.
  sourceContext: undefined,
  publicationYear: null,
  editionStatement: null,
  factsNotStated: ["publication-year", "edition-statement", "printed-page-numbers", "cross-page-stanza-relationships"],
  transcriptionStatus: "verified source assembly — PASS, 0 discrepancies (19/19 physical scans, 11/11 poem scans), synchronized after the 2026-09-01 lexical reconciliation",
  translationStatus: "RELEASE-COMPLETE project-created translation — batches 01–04 reviewed/reconciled PASS, editorial consistency review PASS",

  provenance: {
    physicalVerification: "19 / 19 verified",
    poemScanPages: "7–17",
    poemVerification: "11 / 11 verified",
    printedPageMapping: "none — the page map records no visibly printed page number on any of the 19 scans",
    unnumberedScanNote:
      "No scan in this booklet carries a visible printed page number: the page map records `—` for all 19 and states that no printed page number is recorded unless physically visible in the scan, and that sequence position is not treated as printed pagination. Scan numbers here are PHYSICAL scan positions and are never presented as printed page numbers.",
    sourceHeadingNote:
      "The printed source carries one structural heading inside the poem, `முடிவுரை`, on scan 16. The Tamil assembly stores it as an ordinary line inside the fenced block, so it is NOT inferred from position or length: it is carried as a heading because the pinned archive states it — ASSEMBLY_REVIEW.md records that `scan 16 ★ ★ ★ and முடிவுரை are retained`, indexes/page-map.md records the scan-16 `★ ★ ★` / `முடிவுரை` structure as preserved, and the released translation renders it as a heading, its translator note stating that this preserves the visible structural heading rather than silently absorbing it into the poem. The `★ ★ ★` ornament on the same scan is carried exactly as both layers present it, as a line, because no source statement gives it any other structural role.",
    publicationNotEstablished:
      "The scan establishes NO publication year and no edition statement, so publicationYear and editionStatement are null. The cover's visible bottom imprint identifies a தி.மு.க. தலைமைக் கழக வெளியீடு — an issuing body, carrying no year — and it is recorded here as the cover fact it is rather than promoted into an edition statement. The `15-9-2008` closing date line visible on scan 17 beneath the text body is preserved by the archive only in the source role where it appears; per the source's own policy it is not silently promoted into a publication or edition year, and it is not surfaced as one here.",
    lockedExclusions: [
      "scans 1–6 front matter: cover with its title, attribution, price mark and publisher imprint; the frontispiece photo-quote; the commemorative graphic; the captioned photographs; and the title photo page",
      "scan 17 closing event caption and the `15-9-2008` date line printed beneath the text body",
      "scans 18–19 closing visual/back matter: the captioned photograph, the Anna quotation, the Kalaignar speech attribution with its printed date `15 - 9 - 1987`, and the building/statue photograph",
      "the repeated decorative `அணையா விளக்கு அண்ணா` scroll-style page heading printed on scans 7–17",
      "translator notes, batch reviews and the 2026-09-01 targeted reconciliation prose from the translation batches",
      "the Markdown explanatory prose surrounding both released assemblies",
    ],
    verification: {
      tamilAssembly: "PASS — 11/11 page blocks, 0 missing, 0 duplicate",
      tamilDiscrepancies: 0,
      englishRelease: "RELEASE-COMPLETE",
      englishBatches: "01–04 reviewed/reconciled PASS; 4/4 present exactly once; 11/11 poem scans represented",
      englishOmissions: 0,
      englishDuplications: 0,
      fullPoemVoiceReview: "PASS — editorial consistency review across the reconciled batches and the rebuilt assembly",
    },
    boundaryNote:
      "TEXTUAL/RHETORICAL continuity and TYPOGRAPHIC stanza relation are separate dimensions and are recorded separately. The source archive records cross-page textual continuations (a line or a sentence running on), but a sentence can run on across a printed stanza break, so those records do not establish the stanza relation. Marker-adjacent blank-line formatting does not by itself establish the cross-page stanza relationship either: in the Tamil assembly each page is a separate fenced block, which structurally cannot express a blank line across the page edge, and in the English release every hidden marker is written with blank-line padding on both sides. Blank lines wholly inside one source page ARE source-established stanza structure and are preserved as such.",
    provenanceGranularity:
      "Line-level scan provenance in BOTH layers. Tamil lines carry the scan of their assembly block; English lines carry the scan marked in the reviewed batch files, whose verse is proved byte-identical to the released assembly. No printed page number is recorded for any line, because the source establishes none anywhere in the booklet.",
    terminologyNote:
      "A maximal run of lines between two boundaries is a VERSE RUN, not a stanza: where a run is bounded by a page transition whose relation is unresolved, the printed stanza it belongs to is simply not established. Only runs delimited on both sides by source-established stanza structure are counted as source-established stanzas. No derived run count is reported as a printed stanza count.",
    derivedNote:
      "Derived structure only. The Tamil assembly is the authoritative source layer; the English is the RELEASE-COMPLETE project-created translation. Neither was retranslated, modernized, re-lineated or normalized during import: line text, line order, in-page stanza gaps, indentation, punctuation, quotation marks, ellipses and repetition are carried exactly as released.",
    blockerResolution:
      "Resolution requires an UPSTREAM source-archive visual/source review of the controlling scan TVA_BOK_0065770_அணையா_விளக்கு_அண்ணா(1).pdf (poem scans 7–17) that explicitly records the printed stanza relationship at each physical page transition. The source PDF is not vendored here, and this Digital Library integration does not establish those typographic facts independently.",
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
        "This is the PRESENT project-level rights status of Kalaignar's underlying poem. The booklet's own issuing imprint is an edition fact, not a statement about those rights.",
      thirdPartyNote:
        "Nationalisation applies to Kalaignar's underlying authored poem. It does NOT extend to the photographs and their printed captions, the commemorative graphic, the frontispiece quotation, the back matter with its 1987 speech attribution, or the cover/design — each of which retains its own distinct provenance.",
      projectTranslationNote:
        "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created) with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
      evidencePending:
        "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
    },
  },

  notes: ({ TRANSITIONS, relCount }) => [
    "The controlling source is the supplied scanned PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan map.",
    "The poem body is scans 7–17 (11 scans). Scans 1–6 (cover, frontispiece, commemorative graphic, photographs, title photo) and scans 18–19 (closing photograph and back matter) are outside the poem.",
    "The printed source carries one structural heading inside the poem, `முடிவுரை` on scan 16. It is represented as a heading rather than as a line of verse, on the archive's own explicit statements, and its `★ ★ ★` neighbour is carried exactly as both layers present it.",
    "The archive records no context note printed above this poem, so no date, venue or occasion is carried. The `15-9-2008` line on scan 17 and the `15 - 9 - 1987` date in the back matter are source-role facts about those pages and are never surfaced as this poem's publication or edition year.",
    `Cross-page structure is resolved only from explicit source evidence: of ${TRANSITIONS.length} physical page transitions, ${relCount("same-stanza")} are recorded same-stanza, ${relCount("stanza-boundary")} stanza-boundary, and ${relCount("unknown")} are unresolved and stay unresolved.`,
    "A source line remains one logical line. Indentation is carried as a source fact so it survives without <pre> styling, and a long line may wrap visually on a narrow viewport without ever becoming two poetic lines.",
  ],
};
