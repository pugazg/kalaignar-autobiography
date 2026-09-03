// மறத்தி / "The Valiant Woman" — standalone poem declaration.
//
// Kalaignar M. Karunanidhi's poem as it stands inside a scanned periodical holding: the controlling
// PDF is a 248-page magazine scan, and the work occupies PDF pages 58–61 — page 58 the title/image
// page, pages 59–61 the poem body. The archive establishes that boundary positively (page 62 begins
// a different item), so the range is source-established rather than inferred from file presence.
//
// This work uses the OTHER Tamil assembly convention: unfenced `<!-- scan_page: N -->` markers with
// the verse running to the next marker. Its single reviewed English batch carries the same markers
// and no "## English translation" heading, and its released assembly carries no hidden markers at
// all — the assembly region is bounded by the release artifact's own headings instead.

const SLUG = "marathi";
const POEM_SCANS = [59, 60, 61];

export default {
  slug: SLUG,
  poemScans: POEM_SCANS,
  title: { ta: "மறத்தி", en: "The Valiant Woman" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_PRL_0033129_முரசொலி_பொங்கல்_மலர்_1955.pdf",
    sha256: "9fc83ec0da9925d4af87074014dca7d5e0bb73e10d4310e8bfcdb21572d9e60c",
    sizeBytes: 220351424,
    sizeText: "220,351,424",
    totalPages: 248,
  },

  // The page map records no visibly printed page number for any poem page, and states that printed
  // numbers are not inferred and that sequence position is not treated as pagination.
  printedPageFor: () => null,

  tamil: { file: `sections/${SLUG}.md`, convention: "plain-marker" },

  english: {
    markerScan: /scan_page:\s*(\d+)/,
    // The reviewed batch opens its verse at the first scan marker: unlike the other standalones it
    // carries no "## English translation" heading, so the region is anchored on the marker itself.
    verseStartAt: "<!-- scan_page: 59 -->",
    verseEndBefore: "## Translator's notes",
    batches: [{ id: "batch-01", n: 1, file: "translations/en/batches/batch-01.md", scans: POEM_SCANS }],
    // The released assembly carries NO hidden markers, so per-line scan provenance cannot come from
    // it. It comes from the reviewed batch, and the engine then proves the batch-derived stream IS
    // this assembly, line for line, between its own two headings.
    assembly: { file: `translations/en/${SLUG}-en.md`, startAfter: "# The Valiant Woman", endBefore: "## Translation notes" },
  },

  auditDocs: [
    ...POEM_SCANS.map((s) => `pages/${String(s).padStart(4, "0")}.md`),
    "ASSEMBLY_REVIEW.md",
    "audit.md",
    "README.md",
    "metadata/source.md",
    "indexes/page-map.md",
    `sections/${SLUG}.md`,
    "translations/en/batches/batch-01.md",
    ...["SOURCE_MAP.md", "EDITORIAL_REVIEW.md", "RELEASE_REPORT.md", "README.md", "TRANSLATION_PLAN.md", `${SLUG}-en.md`].map(
      (f) => `translations/en/${f}`,
    ),
  ],

  excludedPhrases: [
    "Translator's notes", "Source-fidelity review", "Kalaignar-language / voice review", "Batch judgement",
    "Translation notes", "Assembly provenance", "Translation principle", "Source scans",
    "REVIEWED — PASS", "clepsydra", "TVA_PRL_0033129",
  ],

  // The archive records no context note printed above this poem.
  sourceContext: undefined,
  publicationYear: null,
  editionStatement: null,
  factsNotStated: ["publication-year", "edition-statement", "printed-page-numbers", "cross-page-stanza-relationships"],
  transcriptionStatus: "verified source assembly — REVIEWED PASS (4/4 source pages in the work range accounted, 3/3 poem pages visual-reviewed)",
  translationStatus: "RELEASE-COMPLETE project-created translation — batch 01 reviewed PASS, editorial review PASS",

  provenance: {
    physicalVerification: "4 / 4 source pages in the work range accounted (248-page periodical scan)",
    poemScanPages: "59–61",
    poemVerification: "3 / 3 visual-reviewed",
    printedPageMapping: "none — the page map records no visibly printed page number on any poem page",
    unnumberedScanNote:
      "No poem page carries a visible printed page number in the page map, and the archive states that printed page numbers are not inferred and that sequence position is not treated as printed pagination. The PDF page numbers 59–61 are SCAN positions inside the periodical, never printed page numbers.",
    // A NOUN PHRASE naming the KIND of printed source, because the source page composes it as
    // `the ${sourceTypeEn}` and `Source facts (the ${sourceTypeEn})`. A prepositional phrase here
    // ("from a printed periodical") produced "Source facts (the from a printed periodical)".
    sourceTypeLabel: { ta: "அச்சிட்ட இதழ்", en: "printed periodical" },
    publicationNotEstablished:
      "The pinned source repository states no publication title, edition statement or publication year for this work in its own prose, so publicationYear and editionStatement are null. The controlling scan's FILENAME names a 1955 periodical holding; a filename is the scan's identity, and it is recorded as such under scanFilename rather than promoted to a publication statement about the poem.",
    lockedExclusions: [
      "scan 58 title/image page — the work's title page, verified and outside the poem body assembly",
      "scans 1–57 and 62–248 of the periodical: other items entirely; scan 62 positively closes this work's range",
      "translator notes, source-fidelity checklists, voice reviews and batch-judgement prose from the reviewed batch",
      "the translation notes and assembly-provenance sections of the released English assembly",
      "the Markdown explanatory prose surrounding both released assemblies",
    ],
    verification: {
      tamilAssembly: "PASS — 3/3 poem-body pages, 0 missing, 0 duplicate, order 59 → 60 → 61",
      tamilDiscrepancies: 0,
      englishRelease: "RELEASE-COMPLETE",
      englishBatches: "01 reviewed PASS; 1/1 present exactly once; 3/3 poem scans represented",
      englishOmissions: 0,
      englishDuplications: 0,
      fullPoemVoiceReview: "PASS — editorial review of the released English assembly",
    },
    boundaryNote:
      "TEXTUAL/RHETORICAL continuity and TYPOGRAPHIC stanza relation are separate dimensions and are recorded separately. Where the archive records a cross-page textual continuation, that is a statement about wording running on, not about the printed stanza: a sentence can run on across a printed stanza break. Marker-adjacent blank-line formatting does not establish the cross-page stanza relationship either — in this work's unfenced Tamil assembly the scan markers are written with blank-line padding, so a marker-adjacent blank run cannot distinguish padding from a real stanza break. Blank lines wholly inside one source page ARE source-established stanza structure and are preserved as such.",
    provenanceGranularity:
      "Line-level scan provenance in BOTH layers. Tamil lines carry the scan of their assembly region; English lines carry the scan marked in the reviewed batch, whose verse is proved byte-identical to the released assembly. No printed page number is recorded for any line, because the source establishes none.",
    terminologyNote:
      "A maximal run of lines between two boundaries is a VERSE RUN, not a stanza: where a run is bounded by a page transition whose relation is unresolved, the printed stanza it belongs to is simply not established. Only runs delimited on both sides by source-established stanza structure are counted as source-established stanzas. No derived run count is reported as a printed stanza count.",
    derivedNote:
      "Derived structure only. The Tamil assembly is the authoritative source layer; the English is the RELEASE-COMPLETE project-created translation. Neither was retranslated, modernized, re-lineated or normalized during import: line text, line order, in-page stanza gaps, indentation, punctuation, quotation marks, ellipses and repetition are carried exactly as released.",
    blockerResolution:
      "Resolution requires an UPSTREAM source-archive visual/source review of the controlling scan TVA_PRL_0033129_முரசொலி_பொங்கல்_மலர்_1955.pdf (poem scans 59–61) that explicitly records the printed stanza relationship at each physical page transition. The source PDF is not vendored here, and this Digital Library integration does not establish those typographic facts independently.",
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
        "This is the PRESENT project-level rights status of Kalaignar's underlying poem. The periodical issue that carries it is an edition fact, not a statement about those rights.",
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
    "The poem body is scans 59–61 (3 scans) inside a 248-page periodical. Scan 58 is the work's title/image page and is outside the poem body; scan 62 begins a different item and positively closes the work's range.",
    "The archive records no context note printed above this poem, so no date, venue or occasion is carried — and none is inferred from the periodical the scan comes from.",
    "The source establishes no publication title, edition statement or publication year for this work in its own prose, so both publicationYear and editionStatement are null. The year in the controlling scan's filename is part of that FILE's identity and is never surfaced as this poem's publication year.",
    `Cross-page structure is resolved only from explicit source evidence: of ${TRANSITIONS.length} physical page transitions, ${relCount("same-stanza")} are recorded same-stanza, ${relCount("stanza-boundary")} stanza-boundary, and ${relCount("unknown")} are unresolved and stay unresolved.`,
    "A source line remains one logical line. Indentation is carried as a source fact so it survives without <pre> styling, and a long line may wrap visually on a narrow viewport without ever becoming two poetic lines.",
  ],
};
