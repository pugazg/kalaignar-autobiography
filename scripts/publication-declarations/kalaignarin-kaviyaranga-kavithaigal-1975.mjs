// கலைஞரின் கவியரங்கக் கவிதைகள் (1975) — poetry-publication declaration (Wave 6 Batch 4).
//
// ONE catalogue work whose contents are Kalaignar's presiding/reply kaviyarangam poems in the 1975
// first edition (compiler ஆசிரியர் அ. முத்து). This workspace is a NEW-ITEM-ONLY scope: only the
// three genuinely-new Kalaignar blocks were transcribed, and they carry the source's own intake
// ordinals 01, 02 and 04. Intake 03 (scan 66, `சாராய சுதந்திரம்`) is explicitly attributed in the
// source to சக்கரவர்த்தி—இராசகோபாலாச்சாரி (Rajaji) and is excluded from the Kalaignar canon; the
// Bharathidasan insert (scans 69–70) and the already-represented ranges are likewise out of scope.
// The gap at ordinal 03 is therefore a SOURCE-BACKED fact (item-map.md / page-record section
// `non-kalaignar-rajaji-saaraya-suthanthiram`), not a renumbering: ordinal 04 is preserved.
//
// It is read through the shared publication engine's `wave6-sections` source dialect — the same
// `buildPublication`, schema, reader and routes as the two Wave-4 publications, differing only in how
// this workspace is READ (sections/NN.md + translations/en/sections/NN.md, multi-line source-heading
// titles, `new-item-NN` page sections, non-contiguous source ordinals). No verse text lives here.

const SLUG = "kalaignarin-kaviyaranga-kavithaigal-1975";

export default {
  slug: SLUG,
  // Wave-6 Batch-4: preserve source literary trailing whitespace exactly (fidelity mode).
  literalWhitespace: true,
  sourceRepo: "pugazg/kalaignar-poems",
  sourcePath: `poems/${SLUG}`,
  reservedSegments: ["source", "items"],

  sourceDialect: "wave6-sections",
  sectionIdentity: "new-item-number",
  // Reconciled logical page == physical scan for this workspace (offset 0); the visible numerals
  // (47–57, 59–65, 68) sit inside each item's logical range and title pages carry a null numeral.
  logicalPageOffset: 0,

  title: { ta: "கலைஞரின் கவியரங்கக் கவிதைகள்", en: "Kalaignar's Poetry-Gathering Poems (1975)" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_BOK_0064169_கலைஞரின்_கவியரங்கக்_கவிதைகள்.pdf",
    sha256: "d9b70fd65f913c2c4377c25675e115555987bb9d9a4c22681b13ebae98afd168",
    sizeBytes: 93307011,
    sizeText: "93,307,011",
    totalScans: 84,
  },

  publicationYear: 1975,
  editionStatement: "முதற் பதிப்பு: 1975",

  itemCount: 3,

  english: { assemblyFile: `translations/en/${SLUG}-en.md` },

  sourceTypeLabel: { ta: "அச்சிட்ட நூல்", en: "printed book" },

  publicationEstablished: {
    publicationTa: "கலைஞரின் கவியரங்கக் கவிதைகள்",
    publicationEn: "Kalaignar's Poetry-Gathering Poems",
    editionStatement: "முதற் பதிப்பு: 1975",
    year: 1975,
  },

  paginationNote:
    "Gate-1 pagination reconciles the active/context interval scans 46–68 continuously as logical publication pages 46–68 (offset 0). The page-layer printed_page field is strictly source-visible and never backfilled, so each item's opening title/heading scan (46, 58, 67) carries a null visible numeral while the reconciled logical pagination still spans it; the remaining scans print their numeral (47–57, 59–65, 68). Reconciled logical pages and visible numerals are kept as separate dimensions.",

  boundaryNote:
    "NEW-ITEM-ONLY scope: 3 genuinely-new Kalaignar blocks across 22 active scans — Item 01 (46–57), Item 02 (58–65), Item 04 (67–68). Intake 03 is scan 66 `சாராய சுதந்திரம்`, explicitly attributed in the source to சக்கரவர்த்தி—இராசகோபாலாச்சாரி (Rajaji) and excluded from the Kalaignar canon; the item-map records it as source/context only and the page record marks scan 66 `non-kalaignar-rajaji-saaraya-suthanthiram`. The ordinal gap at 03 is that source-backed exclusion, not a renumbering. Scans 69–70 (Bharathidasan) and the already-represented ranges 9–20, 21–32, 33–45, 71–77, 78–84 are outside this new-item scope.",

  lockedExclusions: [
    "scan 66 `சாராய சுதந்திரம்` — a non-Kalaignar poem the source attributes to சக்கரவர்த்தி—இராசகோபாலாச்சாரி (Rajaji); source/context only, excluded from the Kalaignar canon and never carried as an item",
    "scans 69–70 the Bharathidasan insert",
    "publication preliminaries and the already-represented Kalaignar ranges 9–20, 21–32, 33–45, 71–77, 78–84 outside the new-item scope",
    "each item's multi-line source-heading title, carried as the item title and never as verse; the printed event date/venue lines at the poem head remain source reading content",
    "translator notes, batch-review prose and editorial apparatus from the reviewed batches and the reader-facing assembly's between-item notes",
  ],

  verification: {
    tamilFinalClearance: "FINAL-CLEARED — Phase 1 22/22, Phase 2 verified 22/22, Phase 3 Gates 1–6 PASS (new-item-only scope: Items 01, 02, 04)",
    canonicalItems: "3/3",
    englishRelease: "RELEASE-CLEARED — Phase 4 COMPLETE (ASSEMBLY / EDITORIAL_CONSISTENCY / RELEASE_INTEGRITY PASS)",
    englishItems: "3/3",
    englishBatches: "01–03 reviewed PASS",
    numberedItemScans: "22/22",
    unresolved: 0,
  },

  titleWitnessNote:
    "No item carries a distinct contents-page title witness (contents_title is null for all three). The canonical title authority for each item is its exact multi-line source heading reproduced under the item's opening scan.",

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
      "This is the PRESENT project-level rights status of Kalaignar's underlying poems. The 1975 first edition's own compiler/imprint matter is an edition fact, not a statement about those rights.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored poems. It does NOT extend to the compiler/imprint matter, the excluded Rajaji and Bharathidasan texts, the cover/design or the editorial apparatus, each of which retains its own distinct provenance.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created), release-cleared in the source archive, with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
  },

  notes: () => [
    "The controlling source is the supplied scanned 1975 first-edition book PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan count.",
    "This is ONE publication with 3 internal reading units, not 3 works and not a collection. The units carry the source's own intake ordinals 01, 02 and 04.",
    "The ordinal gap at 03 is a source-backed exclusion: intake 03 (scan 66, `சாராய சுதந்திரம்`) is attributed in the source to Rajaji and is not a Kalaignar poem, so it is not carried as an item. Ordinal 04 is preserved rather than renumbered to 03.",
    "Each item's English reading layer is the released per-item section file proved byte-equal to the reader-facing combined assembly. No item carries a distinct contents-title witness.",
    "The printed event date/venue lines at the head of each poem (e.g. `29-4-71 … கவியரங்கு` / `இடம்:— புதுவை`, `5—5—71`) are source reading content and are carried; each item's multi-line source-heading title is carried as the item title, not as verse.",
  ],

  items: [
    {
      ordinal: 1,
      slug: "at-the-revolutionary-poets-poetry-gathering",
      titleTa: "புரட்சிக் கவிஞர் பாட்டரங்கில் / முதல்வர் கலைஞர் தலைமைக் கவிதை",
      titleEn: "At the Revolutionary Poet's Poetry Gathering / Chief Minister Kalaignar's Presiding Poem",
    },
    {
      ordinal: 2,
      slug: "at-the-parambu-hill-festival-for-the-great-patron-pari",
      titleTa: "பறம்புமலைப் பாரி வள்ளல் விழாக் / கவியரங்கில் / முதல்வர் கலைஞரின் தலைமைக் கவிதை",
      titleEn: "At the Parambu Hill Festival for the Great Patron Pari / At the Poetry Gathering / Chief Minister Kalaignar's Presiding Poem",
    },
    {
      ordinal: 4,
      slug: "chief-minister-kalaignars-reply-poem",
      titleTa: "“முதல்வர் கலைஞரின் பதில் கவிதை”",
      titleEn: "“Chief Minister Kalaignar's Reply Poem”",
    },
  ],
};
