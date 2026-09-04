// கலைஞரின் கவிதைகள் — poetry-publication declaration (Wave 4 P3).
//
// ONE catalogue work whose printed contents are 77 numbered poems arranged in 5 source-established
// anthology groups. The verse of each item is assembled from the pinned source workspace by the
// shared engine (scripts/lib/poetry-publication.mjs) — NOTHING here carries verse text. This
// declaration freezes item and group IDENTITY so a later source reordering can never silently move a
// published item URL; the engine verifies every frozen title and group against the source.
//
// This is the SECOND caller of the shared publication engine. Two source-shape differences from
// காலப் பேழை are declared here rather than forked into a second engine:
//   - sectionIdentity: "canonical-title" — page records identify an item by its canonical Tamil
//     title, not an `item-NN-slug`.
//   - logicalPageOffset: null — the anthology's Roman/Arabic pagination split and its divider scans
//     mean no constant "scan − N" offset holds; the reconciled logical pages are proved against the
//     source printed_pages and the visible page numerals instead.

const SLUG = "kalaignarin-kavithaigal";

export default {
  slug: SLUG,
  sourceRepo: "pugazg/kalaignar-poems",
  sourcePath: `poems/${SLUG}`,
  reservedSegments: ["source", "items"],

  title: { ta: "கலைஞரின் கவிதைகள்", en: "Kalaignar's Poems" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_BOK_0064091_கலைஞரின்_கவிதைகள்.pdf",
    sha256: "19ee85eea737d3ddac5736db8acd8d4453c9328926fb04256dba4ec9c7b2468e",
    sizeBytes: 486369088,
    sizeText: "486,369,088",
    totalScans: 465,
  },

  publicationYear: 1995,
  editionStatement: "நான்காம் பதிப்பு: மார்ச் 1995 — பாரதி பதிப்பகம்",

  itemCount: 77,

  // The authoritative Tamil/structural group table is proved against this source document; the group
  // English titles are separately proved against the released assembly's divider headers.
  groupMapFile: "indexes/canonical-source-map.md",
  // The 4 pure divider/verso pairs (groups 2–5) total 8 scans; group 1 shares item 01 and adds none.
  expectedStructuralScans: 8,

    // Page records identify an item by its canonical Tamil title; the anthology has no constant
  // scan→page offset (Roman I–XVI on scans 2–17, Arabic 1–447 on scans 18–464, plus divider scans).
  sectionIdentity: "canonical-title",
  logicalPageOffset: null,

  english: { assemblyFile: `translations/en/${SLUG}-en.md` },

  sourceTypeLabel: { ta: "அச்சிட்ட நூல்", en: "printed book" },

  publicationEstablished: {
    publicationTa: "கலைஞரின் கவிதைகள்",
    publicationEn: "Kalaignar's Poems",
    editionStatement: "நான்காம் பதிப்பு: மார்ச் 1995",
    year: 1995,
  },

  paginationNote:
    "Gate-1 pagination: scan 1 is the cover; scans 2–17 carry logical Roman numerals I–XVI; scans 18–464 carry logical Arabic pages 1–447; scan 465 is the back cover. The page-layer printed_page field is strictly source-visible and is never backfilled, so an item's title/divider pages carry a null visible numeral while the reconciled logical pagination still spans them. Reconciled logical pages and visible numerals are kept as separate dimensions.",

  boundaryNote:
    "The verified body is scans 18–464 (447 scans). 439 scans belong to the 77 items; 8 scans are pure anthology group-divider/verso structure that is NOT part of any poem (group 1 shares item 01's scans 18–19; groups 2–5 have standalone divider scans 32–33, 70–71, 372–373, 392–393). Scan 1 is the cover and scan 465 the back cover. Dividers are publication structure, never items, and are not counted toward the 77.",

  lockedExclusions: [
    "scan 1 the colour front cover and scans 2–17 the Roman-numbered preliminaries (title page, imprint, contents pages 15–17)",
    "the 8 pure anthology group-divider/verso structural scans (groups 2–5 dividers 32–33, 70–71, 372–373, 392–393), which are provenance, not verse",
    "scan 465 the image-only back cover",
    "translator notes, batch-review prose and editorial apparatus from the reviewed batches and the reader-facing assembly's between-item notes",
  ],

  verification: {
    tamilFinalClearance: "FINAL-CLEARED — 77/77 canonical items assembled from verified page records (Gates 1–6 PASS)",
    canonicalItems: "77/77",
    englishRelease: "RELEASE-CLEARED — PASS",
    englishItems: "77/77",
    englishBatches: "18/18 reviewed PASS",
    numberedItemScans: "439/439",
    unresolved: 0,
  },

  // Gate-3 source totals, independently verified against PHASE3_TITLE_WITNESS_RECONCILIATION.md. The
  // 30 source-valid variants split into 29 item variants (item 01 included) and 1 group-only variant
  // (group 4). Group 1's variant is item 01's own and is never double-counted.
  titleWitnessTotals: { total: 81, exact: 51, variants: 30, unresolved: 0 },

  titleWitnessNote:
    "Gate 3 reconciled 81 contents/group/item title witnesses: 51 exact, 30 source-valid variants (29 at item level, 1 at group level — group 4), 0 unresolved. Canonical-title authority belongs to the dedicated divider/title/opening witness; the contents-page wording remains a separate source witness. No hybrid or normalized third title is created, and no witness is corrected from the other.",

  itemNumberingNote: "",

  // ── Anthology groups: source-established structure, NOT items ───────────────────────────────────
  // From indexes/canonical-source-map.md. itemOrdinals partition 1..77 in order; the engine verifies
  // each declared English group title against the assembly's  divider header. Group 1
  // shares item 01 and has no separate English divider title.
  groups: [
    { ordinal: 1, titleTa: "இதயத்தைத் தந்திடு அண்ணா", contentsTitleTa: "இதயத்தைத் தந்திடு அண்ணா!", itemOrdinals: [1], sharesItemOrdinal: 1, sharedScans: [18, 19] },
    { ordinal: 2, titleTa: "இனமான ஏந்தல்கள்", titleEn: "Bearers of Dignity", itemOrdinals: [2, 3, 4, 5] },
    { ordinal: 3, titleTa: "கவியரங்கக் கவிதைகள்", titleEn: "Poetry-Assembly Poems", itemOrdinals: Array.from({ length: 33 }, (_, i) => 6 + i) },
    { ordinal: 4, titleTa: "கண்ணீர்த் துளிகள்", contentsTitleTa: "கண்ணீர்க் கவிதை", titleEn: "Tear-Drops", itemOrdinals: [39, 40, 41, 42, 43, 44] },
    { ordinal: 5, titleTa: "மலர்த் தோட்டம்", titleEn: "Flower Garden", itemOrdinals: Array.from({ length: 33 }, (_, i) => 45 + i) },
  ],

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
      "This is the PRESENT project-level rights status of Kalaignar's underlying poems. The 1995 fourth edition's own publisher/imprint matter is an edition fact, not a statement about those rights.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored poems. It does NOT extend to the publisher/imprint matter, cover/design, the anthology's editorial apparatus, or the third-party texts quoted inside the poems, each of which retains its own distinct provenance.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created), release-cleared in the source archive, with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
  },

  notes: ({ items }) => [
    "The controlling source is the supplied scanned book PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan count.",
    "This is ONE publication with 77 internal reading units arranged in 5 source-established groups, not 77 works and not a collection. The group dividers are publication structure and are never counted toward the 77.",
    `Every item's English reading layer is the released per-item file proved byte-equal to the reader-facing combined assembly; the title-witness variants keep both witnesses separately (${items.filter((i) => i.contentsTitleTa).length} items differ).`,
    "Reconciled logical pagination and visible page numerals are separate dimensions: divider and title pages carry a null visible numeral while the logical Arabic pagination still spans the body. Items 23 and 24 interleave in the source, so their physical scans and logical pages are genuinely non-contiguous and are preserved as separate runs.",
    "Two of these poems are also published as standalone works from different source witnesses (item 01 ↔ இதயத்தைத் தந்திடு அண்ணா, item 02 ↔ தென்னவன் காதை). The witnesses are independent: they are linked, never merged, deduplicated or corrected from one another.",
  ],

  items: [
    { ordinal: 1, slug: "give-me-your-heart-anna", titleTa: "இதயத்தைத் தந்திடு அண்ணா", contentsTitleTa: "இதயத்தைத் தந்திடு அண்ணா!", titleEn: "Give Me Your Heart, Anna" },
    { ordinal: 2, slug: "the-tale-of-the-southerner", titleTa: "தென்னவன் காதை", titleEn: "The Tale of the Southerner" },
    { ordinal: 3, slug: "indrajit", titleTa: "இந்திரஜித்", titleEn: "Indrajit" },
    { ordinal: 4, slug: "hiranyan", titleTa: "இரணியன்", titleEn: "Hiranyan" },
    { ordinal: 5, slug: "king-vali", titleTa: "வாளி மன்னன்", titleEn: "King Vali" },
    { ordinal: 6, slug: "freedom-fighters", titleTa: "விடுதலை வீரர்கள்", titleEn: "Freedom Fighters" },
    { ordinal: 7, slug: "the-five-senses", titleTa: "ஐம்புலன்", titleEn: "The Five Senses" },
    { ordinal: 8, slug: "the-pilavanga-year", titleTa: "பிலவங்க ஆண்டு", titleEn: "The Pilavanga Year" },
    { ordinal: 9, slug: "love-or-valour", titleTa: "காதலா - வீரமா?", contentsTitleTa: "காதலா! - வீரமா?", titleEn: "Love or Valour?" },
    { ordinal: 10, slug: "six-in-the-noble-scripture", titleTa: "அருமறையில் அறுவர்", titleEn: "Six in the Noble Scripture" },
    { ordinal: 11, slug: "new-path", titleTa: "புதிய பாதை", titleEn: "New Path" },
    { ordinal: 12, slug: "ten-possessions", titleTa: "உடைமைகள் பத்து", contentsTitleTa: "உடன்பிறப்பின் பற்று", titleEn: "Ten Possessions" },
    { ordinal: 13, slug: "water-family", titleTa: "நீர்க் குடும்பம்", titleEn: "The Water Family" },
    { ordinal: 14, slug: "bharathidasan", titleTa: "பாரதிதாசன்", titleEn: "Bharathidasan" },
    { ordinal: 15, slug: "bharathiyar", titleTa: "பாரதியார்", titleEn: "Bharathiyar" },
    { ordinal: 16, slug: "pongal-festival-day", titleTa: "பொங்கல் திருநாள்", titleEn: "Pongal Festival Day" },
    { ordinal: 17, slug: "on-the-path-called-life", titleTa: "வாழ்வெனும் பாதையில்", titleEn: "On the Path Called Life" },
    { ordinal: 18, slug: "arithmetic", titleTa: "கணக்கு", titleEn: "Arithmetic" },
    { ordinal: 19, slug: "democracy-as-nehru-saw-it", titleTa: "நேரு கண்ட ஜனநாயகம்", titleEn: "Democracy as Nehru Saw It" },
    { ordinal: 20, slug: "thank-you-thank-you", titleTa: "நன்றி, நன்றி!", titleEn: "Thank You, Thank You!" },
    { ordinal: 21, slug: "silver-jubilee", titleTa: "வெள்ளி விழா", titleEn: "Silver Jubilee" },
    { ordinal: 22, slug: "anna-is-here", titleTa: "அண்ணன் இருக்கின்றார்", titleEn: "Anna Is Here" },
    { ordinal: 23, slug: "anna-a-poetry-assembly", titleTa: "அண்ணன் ஒரு கவியரங்கம்", titleEn: "Anna, a Poetry Assembly" },
    { ordinal: 24, slug: "a-walking-journey-for-tamil-to-flourish", titleTa: "தமிழ் வளர வழிநடைப் பயணம்", titleEn: "A Walking Journey for Tamil to Flourish" },
    { ordinal: 25, slug: "for-the-world-to-flourish", titleTa: "வையம் தழைக்க", titleEn: "For the World to Flourish" },
    { ordinal: 26, slug: "father-periyar", titleTa: "தந்தை பெரியார்", titleEn: "Father Periyar" },
    { ordinal: 27, slug: "akam-creations", titleTa: "அகத்துறைப் படைப்புகள்", titleEn: "Akam Creations" },
    { ordinal: 28, slug: "pongal-festival", titleTa: "பொங்கல் விழா", titleEn: "Pongal Festival" },
    { ordinal: 29, slug: "a-silappathikaram-feast", titleTa: "சிலப்பதிகார விருந்து", titleEn: "A Silappathikaram Feast" },
    { ordinal: 30, slug: "on-annas-path", titleTa: "அண்ணா வழியில்", titleEn: "On Anna's Path" },
    { ordinal: 31, slug: "i-shall-walk-on-our-ayya-and-annas-path", titleTa: "நடந்திடுவேன் நமது அய்யா, அண்ணா வழியில்!", contentsTitleTa: "நடந்திடுவேன் நமது அய்யா, அண்ணா வழியில்", titleEn: "I Shall Walk on Our Ayya and Anna's Path!" },
    { ordinal: 32, slug: "presiding-poem-three-great-celebrations", titleTa: "முப்பெரும் விழாக் கவியரங்கம் தலைமைக் கவிதை", contentsTitleTa: "முப்பெரும் விழாக் கவியரங்கத் தலைமைக் கவிதை", titleEn: "Presiding Poem at the Three Great Celebrations Poetry Assembly" },
    { ordinal: 33, slug: "in-a-changing-town", titleTa: "மாறி வரும் ஊரினிலே", contentsTitleTa: "மாறிவரும் ஊரினிலே", titleEn: "In a Changing Town" },
    { ordinal: 34, slug: "views-of-society", titleTa: "சமுதாயப் பார்வைகள்...!", titleEn: "Views of Society...!" },
    { ordinal: 35, slug: "kalaivanar-arangam-poetry-assembly", titleTa: "கலைவாணர் அரங்கக் கவியரங்கம்", titleEn: "Kalaivanar Arangam Poetry Assembly" },
    { ordinal: 36, slug: "chithirai-festival-presiding-poem", titleTa: "\"சித்திரைத் திருநாள்\" தலைமைக் கவிதை!", contentsTitleTa: "“சித்திரைத் திருநாள்” தலைமைக் கவிதை", titleEn: "\"Chithirai Festival\" — Presiding Poem!" },
    { ordinal: 37, slug: "three-letters-thoughts-three-times-three", titleTa: "எழுத்துக்கள் மூன்று - எண்ணங்கள் மும்மூன்று", contentsTitleTa: "“எழுத்துக்கள் மூன்று - எண்ணங்கள் மும்மூன்று”", titleEn: "Three Letters — Thoughts Three Times Three" },
    { ordinal: 38, slug: "on-arignar-annas-path", titleTa: "“அறிஞர் அண்ணா வழியில்”", titleEn: "“On Arignar Anna’s Path”" },
    { ordinal: 39, slug: "panneerselvam", titleTa: "பன்னீர்ச்செல்வமே!", contentsTitleTa: "பன்னீர்ச் செல்வமே", titleEn: "Panneerselvam!" },
    { ordinal: 40, slug: "mother-arts-foremost-son", titleTa: "கலைத்தாயின் தலைச் செல்வன்!", contentsTitleTa: "கலைத்தாயின் தலைச்செல்வன்", titleEn: "Mother Art’s Foremost Son!" },
    { ordinal: 41, slug: "we-move-as-your-shadow", titleTa: "உன் நிழலாக அசைகின்றோம்!", contentsTitleTa: "உன் நிழலாக அசைகின்றோம்", titleEn: "We Move as Your Shadow!" },
    { ordinal: 42, slug: "long-live-jeeva", titleTa: "வாழ்க ஜீவா", contentsTitleTa: "வாழ்க ஜீவா!", titleEn: "Long Live Jeeva" },
    { ordinal: 43, slug: "the-fallen-hero", titleTa: "மறைந்த மாவீரன்", titleEn: "The Fallen Hero" },
    { ordinal: 44, slug: "my-dear-friend-why-did-you-leave", titleTa: "என் இனிய நண்பா! ஏன் பிரிந்தாய்?", titleEn: "My Dear Friend! Why Did You Leave?" },
    { ordinal: 45, slug: "today-is-your-birthday", titleTa: "இன்றைக்கு உன்றன் பிறந்த நாள்", contentsTitleTa: "இன்றைக்கு உன் பிறந்த நாள்", titleEn: "Today Is Your Birthday" },
    { ordinal: 46, slug: "no-one-day-called-his-birthday", titleTa: "அவன் பிறந்தநாள் என ஒன்றில்லை!", contentsTitleTa: "அவன் பிறந்தநாள் ஏன் ஒன்றில்லை!", titleEn: "There Is No One Day Called His Birthday!" },
    { ordinal: 47, slug: "precious-remedy-anbazhaga-beloved-sibling", titleTa: "அருமருந்தே! அன்பழக உடன்பிறப்பே!", contentsTitleTa: "அருமருந்தே! அன்புறவு உடன்பிறப்பே!", titleEn: "Precious Remedy! Anbazhaga, Beloved Sibling!" },
    { ordinal: 48, slug: "rationalist-pandianar", titleTa: "பகுத்தறிவுப் பாண்டியனார்!", contentsTitleTa: "பகுத்தறிவுப் பாண்டியனார்", titleEn: "Rationalist Pandianar!" },
    { ordinal: 49, slug: "scales-of-justice", titleTa: "நியாயத் தராசு", titleEn: "The Scales of Justice" },
    { ordinal: 50, slug: "would-they-accept", titleTa: "ஏற்பாரோ?", titleEn: "Would They Accept?" },
    { ordinal: 51, slug: "know-it-as-a-storm", titleTa: "புயல் என அறிக!", contentsTitleTa: "புயல் என அறிக", titleEn: "Know It as a Storm!" },
    { ordinal: 52, slug: "have-you-heard", titleTa: "கேட்டுண்டோ?", titleEn: "Have You Heard?" },
    { ordinal: 53, slug: "varna-or-death", titleTa: "வருணமா? மரணமா?", titleEn: "Varna or Death?" },
    { ordinal: 54, slug: "when-does-defeat-come", titleTa: "தோல்வி எப்பொழுது?", titleEn: "When Does Defeat Come?" },
    { ordinal: 55, slug: "still-this-clamour", titleTa: "இன்றுமா கூச்சல்?", titleEn: "Still This Clamour?" },
    { ordinal: 56, slug: "green-parrot", titleTa: "பச்சைக் கிளி", contentsTitleTa: "பச்சைக்கிளி", titleEn: "Green Parrot" },
    { ordinal: 57, slug: "fountain-of-imagination", titleTa: "கற்பனை ஊற்று", titleEn: "Fountain of Imagination" },
    { ordinal: 58, slug: "o-sky-pour-down", titleTa: "வானமே பொழிக நீ!", titleEn: "O Sky, Pour Down!" },
    { ordinal: 59, slug: "a-letter-in-verse", titleTa: "கவிதையில் ஒரு மடல்!", contentsTitleTa: "கவிதையில் ஒரு மடல்", titleEn: "A Letter in Verse!" },
    { ordinal: 60, slug: "will-he-realise-who-knows", titleTa: "அவர் உணர்வாரோ! யார் அறிவார்?", titleEn: "Will He Realise? Who Knows?" },
    { ordinal: 61, slug: "let-it-whirl-as-a-battle-sword", titleTa: "போர்வாளாய்ச் சுழலட்டும்!", contentsTitleTa: "போர்வாளாய்ச் சுழலட்டுமே!", titleEn: "Let It Whirl as a Battle-Sword!" },
    { ordinal: 62, slug: "whose-names-have-still-not-appeared", titleTa: "இன்னும் யார் யார் பெயர்கள் வரவில்லை?", contentsTitleTa: "இன்னும் யார் - யார் பெயர்கள் வரவில்லை", titleEn: "Whose Names Have Still Not Appeared?" },
    { ordinal: 63, slug: "a-drop-of-honey", titleTa: "ஒரு சொட்டுத் தேன்!", contentsTitleTa: "ஒரு சொட்டுத் தேன்", titleEn: "A Drop of Honey!" },
    { ordinal: 64, slug: "let-it-sprout-as-seed-and-put-forth-roots", titleTa: "விதையாய் முளைத்து விழுதுகள் விடட்டும்!", contentsTitleTa: "விதையாய் முளைத்து விழுதுகள் விட்டோம்", titleEn: "Let It Sprout as Seed and Put Forth Roots!" },
    { ordinal: 65, slug: "he-calls-the-sun-an-ice-cube", titleTa: "சூரியனைப் பனிக்கட்டி என்கின்றார்!", contentsTitleTa: "சூரியனைப் பனிக்கட்டி என்கிறாய்!", titleEn: "He Calls the Sun an Ice Cube!" },
    { ordinal: 66, slug: "dont-stop-your-stride", titleTa: "நடையை நிறுத்தாதே!", titleEn: "Don't Stop Your Stride!" },
    { ordinal: 67, slug: "a-backwater-full-of-ignorant-folk", titleTa: "பாமரர் நிறைந்த பட்டிக்காடு!", contentsTitleTa: "பாமர் நிறைந்த பட்டிக்காடு", titleEn: "A Backwater Full of Ignorant Folk!" },
    { ordinal: 68, slug: "tamil-nadu-is-being-looted", titleTa: "கொள்ளை போகுதம்மா தமிழ்நாடு", contentsTitleTa: "கொள்ளை போதும்மா தமிழ்நாடு", titleEn: "Tamil Nadu Is Being Looted" },
    { ordinal: 69, slug: "what-kind-of-country-is-this", titleTa: "என்ன தேசமடா இது?", titleEn: "What Kind of Country Is This?" },
    { ordinal: 70, slug: "come-let-us-tear-off-the-mask", titleTa: "முகமூடி கிழித்தெறிவோம் வாரீர்!", contentsTitleTa: "முடியுமா? கிழித்தெறிவோம் வாரீர்!", titleEn: "Come, Let Us Tear Off the Mask!" },
    { ordinal: 71, slug: "what-is-the-answer-tell-us", titleTa: "பதில் என்ன? பகர்ந்திடுக!", titleEn: "What Is the Answer? Tell Us!" },
    { ordinal: 72, slug: "ka-ka-ka", titleTa: "கா, கா, கா!", titleEn: "Kā, Kā, Kā!" },
    { ordinal: 73, slug: "let-us-rise-in-the-east-like-the-sun", titleTa: "பகலவனாய்க் கிழக்கில் உதித்திடுவோம்!", contentsTitleTa: "பகலவனாய்க் கிழக்கில் உதித்திடுவோம்", titleEn: "Let Us Rise in the East Like the Sun!" },
    { ordinal: 74, slug: "is-this-diversion-justified", titleTa: "திசை திருப்பல் நியாயம்தானா?", titleEn: "Is This Diversion Justified?" },
    { ordinal: 75, slug: "it-is-over-a-comedy-drama", titleTa: "நடந்து முடிந்ததம்மா; ஒரு நகைச்சுவை நாடகம்!", titleEn: "It Is Over—a Comedy Drama!" },
    { ordinal: 76, slug: "there-are-some-countries", titleTa: "சில நாடுகள் இருக்கின்றன!", contentsTitleTa: "சில நாடுகள் இருக்கின்றன", titleEn: "There Are Some Countries!" },
    { ordinal: 77, slug: "you-bless-your-footwear", titleTa: "உன் காலணியை வாழ்த்துகிறாய்", titleEn: "You Bless Your Footwear" },
  ],
};
