// ஒருதலைக் காதல் — poetry "publication" declaration (Wave 6 Batch 4).
//
// ONE Poetry Library work that is a VERSE-NOVEL (`ஓவியக் கவிதை நாவல்`, first edition டிசம்பர் 1998,
// திருமகள் நிலையம்). It is NOT eleven independent poems: it is one continuous narrative in eleven
// source-established SECTIONS. It is carried through the SAME shared PoetryPublication engine / schema
// / reader / routes as the two Wave-4 publications, with two additive shared-model FACTS set here:
//   - readingUnitKind: "section" — its reading units are sections, not poems; the public UI must say
//     "11 sections", never "11 poems", and must not call the sections independently-authored poems.
//   - workForm — the source-visible `ஓவியக் கவிதை நாவல்` label for truthful landing copy.
// Absent on every existing publication, so their frozen payloads are byte-identical.
//
// Read through the `wave6-versenovel` source dialect (parsing rules ONLY): `section:` front-matter
// identity, section title from the `#` H1 (`# ஒருதலைக் காதல் — N`), `section-NN` page records,
// `## Section N` assembly boundaries, `<!-- scan_page: N -->` markers, and the source-declared
// heading-level equivalence for the work-title reprint (`## One-Sided Love` in the reviewed section,
// `### One-Sided Love` in the released assembly), scoped to exactly that text.
//
// Main-work coverage is scans 6–100 = 95/95 (84 text-bearing + 11 full-page illustration scans, which
// carry a marker but no verse). Scans 1–5 are front matter and scan 101 the back cover — outside the
// work. Scan 100 closes with the source `(முற்றும்)`.

const SLUG = "oruthalaik-kathal";

// The 11 source sections and their exact physical-scan runs (contiguous, 6–100).
const SECTIONS = [
  { ordinal: 1, scans: "6–13" },
  { ordinal: 2, scans: "14–20" },
  { ordinal: 3, scans: "21–30" },
  { ordinal: 4, scans: "31–38" },
  { ordinal: 5, scans: "39–45" },
  { ordinal: 6, scans: "46–55" },
  { ordinal: 7, scans: "56–63" },
  { ordinal: 8, scans: "64–73" },
  { ordinal: 9, scans: "74–82" },
  { ordinal: 10, scans: "83–92" },
  { ordinal: 11, scans: "93–100" },
];

export default {
  slug: SLUG,
  // Wave-6 Batch-4: preserve source literary trailing whitespace exactly (fidelity mode).
  literalWhitespace: true,
  sourceRepo: "pugazg/kalaignar-poems",
  sourcePath: `poems/${SLUG}`,
  reservedSegments: ["source", "items"],

  sourceDialect: "wave6-versenovel",
  sectionIdentity: "section-number",
  // Main-work logical page = physical scan − 5 (scans 2–5 Roman front matter, 6–100 Arabic 1–95).
  logicalPageOffset: 5,

  // SHARED-MODEL SEMANTICS (facts, not adapter parsing): this work is a verse-novel and its units are
  // sections, not independent poems.
  readingUnitKind: "section",
  workForm: { ta: "ஓவியக் கவிதை நாவல்", en: "verse-novel" },

  title: { ta: "ஒருதலைக் காதல்", en: "One-Sided Love" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_BOK_0065554_ஒருதலைக்_காதல்.pdf",
    sha256: "a9b0ff45820155a4775074f630e791a8304073a90e5e36ab793bdf702ec33184",
    sizeBytes: 200800237,
    sizeText: "200,800,237",
    totalScans: 101,
  },

  publicationYear: 1998,
  editionStatement: "முதற் பதிப்பு: டிசம்பர் 1998 — திருமகள் நிலையம்",

  itemCount: 11,

  english: { assemblyFile: `translations/en/${SLUG}-en.md` },

  sourceTypeLabel: { ta: "அச்சிட்ட நூல்", en: "printed book" },

  publicationEstablished: {
    publicationTa: "ஒருதலைக் காதல்",
    publicationEn: "One-Sided Love",
    editionStatement: "முதற் பதிப்பு: டிசம்பர் 1998 — திருமகள் நிலையம்",
    year: 1998,
  },

  paginationNote:
    "Gate-1 pagination: scan 1 is the front cover; scans 2–5 the Roman front matter; scans 6–100 the main work (logical Arabic pages 1–95, logical = scan − 5); scan 101 the back cover. The main work suppresses the visible numeral on 22 scans (11 section-opening pages and 11 full-page illustration pages) and prints it on the remaining 73/95; the page-layer printed_page field is strictly source-visible and never backfilled. Reconciled logical pages and visible numerals are kept as separate dimensions.",

  boundaryNote:
    "The work is the main-work sequence scans 6–100 = 95/95 in 11 source sections: 84 text-bearing scans and 11 full-page illustration scans (8, 16, 22, 32, 40, 48, 58, 66, 76, 84, 94), each accounted exactly once. Illustration scans carry a source marker and NO verse; no verse line is fabricated for them. Section order and boundaries are exact and contiguous. Scan 100 closes the work with the source `(முற்றும்)` and the three-diamond ornament; scan 101 is the back cover, outside the work. Scans 1–5 (cover + Roman front matter, incl. `பதிப்புரை`) are outside the work.",

  lockedExclusions: [
    "scan 1 (front cover) and scans 2–5 (Roman front matter: title page, publication/edition details, `பதிப்புரை`, publisher tribute) — outside the main work",
    "scan 101 (back cover) — outside the main work",
    "each section's `# ஒருதலைக் காதல் — N` / `# One-Sided Love — N` H1 title, carried as the section title and never as verse",
    "the full-page illustration scans' image content — non-verse source-layout material; the scan is accounted but contributes no verse line",
    "translator notes and batch-review prose from the reviewed batches and the reader-facing assembly's between-section notes",
  ],

  verification: {
    tamilFinalClearance: "FINAL-CLEARED — Phase 1 101/101, Phase 2 101/101 verified, Phase 3 Gates 1–6 PASS; 11/11 canonical sections; main-work scans 6–100 = 95/95",
    canonicalItems: "11/11 sections",
    englishRelease: "RELEASE-CLEARED — Phase 4 COMPLETE (6/6 batches reviewed PASS; EDITORIAL_CONSISTENCY / RELEASE_REPORT PASS)",
    englishItems: "11/11 sections",
    englishBatches: "6/6 reviewed PASS",
    numberedItemScans: "95/95 main-work scans (84 text + 11 illustration)",
    unresolved: 0,
  },

  titleWitnessNote:
    "The sections carry no distinct contents-page title witness; each section's title is its exact `#` H1 (`ஒருதலைக் காதல் — N` / `One-Sided Love — N`), and the work-title reprint appears at `## One-Sided Love` in the reviewed section and `### One-Sided Love` in the released assembly — a source-declared heading-level equivalence scoped to that exact text.",

  itemNumberingNote: "",

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
      "This is the PRESENT project-level rights status of Kalaignar's underlying verse-novel. The 1998 first edition's own publisher/imprint matter is an edition fact, not a statement about those rights.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored verse-novel. It does NOT extend to the publisher/imprint matter, the cover/design or the full-page illustrations, each of which retains its own distinct provenance.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created), release-cleared in the source archive, with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
  },

  notes: ({ items }) => [
    "The controlling source is the supplied scanned 1998 first-edition book PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan count.",
    `This is ONE verse-novel (ஓவியக் கவிதை நாவல்) with ${items.length} internal SECTIONS — not ${items.length} independent poems and not a collection. The sections are the source's own numbered divisions of one continuous narrative.`,
    "Main-work coverage is scans 6–100 = 95/95: 84 text-bearing scans and 11 full-page illustration scans that carry a marker but no verse. No verse line is fabricated for an illustration scan; section order and boundaries are exact.",
    "Each section's English reading layer is the released per-section file proved byte-equal to the reader-facing assembly. The work-title reprint's `##`/`###` heading-level difference between the two released artifacts is a source-declared equivalence scoped to exactly that title text; no literary line text is normalized.",
    "Scan 100 closes the work with the source `(முற்றும்)`; scans 1–5 (front matter) and scan 101 (back cover) are outside the work.",
  ],

  items: SECTIONS.map((s) => ({
    ordinal: s.ordinal,
    slug: `section-${s.ordinal}`,
    titleTa: `ஒருதலைக் காதல் — ${s.ordinal}`,
    titleEn: `One-Sided Love — ${s.ordinal}`,
  })),
};
