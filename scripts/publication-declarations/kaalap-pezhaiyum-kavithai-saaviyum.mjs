// காலப் பேழையும் கவிதைச் சாவியும் — poetry-publication declaration (Wave 4 P2).
//
// ONE catalogue work whose printed contents are 58 numbered poems (the numbered FIRST PART). The
// verse of each item is assembled from the pinned source workspace by the shared engine
// (scripts/lib/poetry-publication.mjs); NOTHING here carries verse text. What this declaration
// freezes is item IDENTITY — ordinal, stable slug and the two title witnesses — so a later source
// reordering can never silently move a published item URL. The engine verifies every frozen title
// against the source section and item files and fails closed on any divergence.
//
// Slugs are the stable slug body already committed in the released English item filenames
// (translations/en/items/NN-<slug>-en.md → <slug>). They are curated translation-layer identifiers,
// not printed in the book, and they are frozen here rather than regenerated from 1..58.

const SLUG = "kaalap-pezhaiyum-kavithai-saaviyum";

export default {
  slug: SLUG,
  sourceRepo: "pugazg/kalaignar-poems",
  sourcePath: `poems/${SLUG}`,
  reservedSegments: ["source", "items"],

  title: { ta: "காலப் பேழையும் கவிதைச் சாவியும்", en: "The Casket of Time and the Key of Poetry" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },

  scan: {
    filename: "TVA_BOK_0063593_காலப்_பேழையும்_கவிதைச்_சாவியும்.pdf",
    sha256: "ad5a6a4b4d2b111120f99baa4aff4ab639cf1a9f9c71a6899e0c3d2c4a08bcc3",
    sizeBytes: 336148702,
    sizeText: "336,148,702",
    totalScans: 306,
  },

  // The publication's own printed edition line. Source-established (metadata/source.md records the
  // preliminaries), so unlike three of the four standalone poems this publication DOES carry a year.
  publicationYear: 2006,
  editionStatement: "முதல் பதிப்பு: ஜூன் 2006 — தமிழ்க்கனி பதிப்பகம் / பூம்புகார் பதிப்பகம், சென்னை",

  itemCount: 58,

  english: {
    // The reader-facing combined assembly; each per-item English file is proved equal to its slice.
    assemblyFile: `translations/en/${SLUG}-en.md`,
  },

  sourceTypeLabel: { ta: "அச்சிட்ட நூல்", en: "printed book" },

  publicationEstablished: {
    publicationTa: "காலப் பேழையும் கவிதைச் சாவியும்",
    publicationEn: "The Casket of Time and the Key of Poetry",
    editionStatement: "முதல் பதிப்பு: ஜூன் 2006",
    year: 2006,
  },

  paginationNote:
    "Scans 1–4 are unnumbered preliminaries; scans 5–299 are one uninterrupted numbered-pagination block corresponding to printed pages 4–298 with printed page = physical scan − 1; scans 300–305 are six unnumbered blank குறிப்புகள் pages; scan 306 is the unnumbered image-only back cover. A reconciled logical printed page is not a claim that the numeral is visibly printed on every page.",

  boundaryNote:
    "This source establishes the numbered FIRST-PART boundary only. The numbered item sequence closes on scan 299 / printed page 298 with (முதல் பாகம் முற்றிற்று), carried verbatim inside item 58; scan 300 begins the separate குறிப்புகள் end matter. No broader second part is contained in or established by this source, and the closing marker is neither removed nor reinterpreted.",

  lockedExclusions: [
    "scans 1–4 preliminaries: colour front cover, title page (with later library stamp/handwriting that is not edition text), publication/copyright/imprint/price page, and the authorial நிலைபோட்டி introductory note",
    "scans 5–7 contents pages and scans 8–9 the unnumbered work/title display and its blank verso",
    "scans 300–305 the six unnumbered blank குறிப்புகள் end-matter pages",
    "scan 306 the unnumbered image-only back cover",
  ],

  verification: {
    tamilFinalClearance: "FINAL-CLEARED — 58/58 canonical items assembled from verified page records",
    canonicalItems: "58/58",
    englishRelease: "COMPLETE — RELEASE-CLEARED — PASS",
    englishItems: "58/58",
    englishBatches: "21/21 reviewed PASS",
    numberedItemScans: "290/290",
    unresolved: 0,
  },

  titleWitnessNote:
    "This publication has 14 documented title-witness discrepancies (items 18, 22, 25, 26, 29, 31, 32, 37, 40, 44, 46, 50, 54, 58). The source records two legitimate title contexts: the contents-page witness and the item-opening title-page witness. The completed Phase-3 reconciliation makes the TITLE-PAGE witness the displayed canonical title and the slug basis, and retains the CONTENTS witness exactly as separate source metadata. No hybrid or normalized third title is created, and no witness is corrected from the other.",

  itemNumberingNote:
    "Item 37's title page at scan 179 visibly prints item number 36, although the certified contents sequence makes it item 37. Its stable identity remains item 37 and items 38–58 are not shifted; the printed 36 is preserved only as a source anomaly.",

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
      "This is the PRESENT project-level rights status of Kalaignar's underlying poems. The 2006 edition's own publisher/imprint matter is an edition fact, not a statement about those rights.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored poems. It does NOT extend to the publisher/imprint matter, cover/design, later library stamps, or the third-party texts quoted inside the items (Sangam and other quotations, glossaries and source citations), each of which retains its own distinct provenance.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created), release-cleared in the source archive, with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
  },

  notes: ({ items }) => [
    "The controlling source is the supplied scanned book PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan count.",
    "This is ONE publication with 58 internal reading units, not 58 works and not a collection. The 58 poems exist only as sections/NN.md inside one publication workspace under one controlling scan.",
    `Every item's English reading layer is the released per-item file proved byte-equal to the reader-facing combined assembly; the 14 title-witness items (${items.filter((i) => i.contentsTitleTa).length}) keep both witnesses separately, and item 37's printed number 36 is preserved as a source anomaly.`,
    "Page transitions between an item's scans are rendered as neutral source-scan markers: the source establishes item boundaries, scan ranges and title witnesses, but no per-transition printed-stanza relation, so none is asserted.",
    "The numbered sequence closes with (முதல் பாகம் முற்றிற்று) inside item 58; the குறிப்புகள் end matter (scans 300–305) and back cover (scan 306) are outside the reading content and are not absorbed into any item.",
  ],

  // ── FROZEN ITEM ROSTER (identity only; verse is assembled from source) ─────────────────────────
  items: [
    { ordinal: 1, slug: "the-common-world", titleTa: "பொது உலகம்", titleEn: "The Common World" },
    { ordinal: 2, slug: "stagewise-development", titleTa: "படிமுறை வளர்ச்சி", titleEn: "Stagewise Development" },
    { ordinal: 3, slug: "a-story-of-the-magnet-stone", titleTa: "‘காந்தக்கல்’ கதையொன்று!", titleEn: "A Story of the ‘Magnet Stone’!" },
    { ordinal: 4, slug: "the-stone-age-that-was-a-better-age-if-it-does-not-return", titleTa: "அன்றிருந்த கற்காலம் - இனி அமையாவிடின் நற்காலம்!", titleEn: "The Stone Age That Was — A Better Age If It Does Not Return!" },
    { ordinal: 5, slug: "we-need-a-heart-of-gold-we-need-the-love-it-gives", titleTa: "தங்க மனம் வேண்டும்; அது தந்திடும் அன்பு வேண்டும்!", titleEn: "We Need a Heart of Gold; We Need the Love It Gives!" },
    { ordinal: 6, slug: "the-knife-belongs-to-the-enemy-the-blood-is-what-we-give", titleTa: "கத்தி பகைவுடையது; இரத்தம் நாம் தருவது!", titleEn: "The Knife Belongs to the Enemy; The Blood Is What We Give!" },
    { ordinal: 7, slug: "the-form-of-an-age-in-history", titleTa: "வரலாற்றுக் காலத்தின் கோலம்!", titleEn: "The Form of an Age in History!" },
    { ordinal: 8, slug: "sweat-falling-from-the-brow-the-ribcage-breaking", titleTa: "நெற்றி வியர்வை உதிர; நெஞ்செலும்பு ஒடிய!", titleEn: "Sweat Falling from the Brow; the Ribcage Breaking!" },
    { ordinal: 9, slug: "what-truth-does-the-conversation-reveal", titleTa: "உரையாடல் உணர்த்திடும் உண்மை என்ன?", titleEn: "What Truth Does the Conversation Reveal?" },
    { ordinal: 10, slug: "the-ancient-tamils-international-connections", titleTa: "பழந்தமிழர் பன்னாட்டுத் தொடர்பு!", titleEn: "The Ancient Tamils' International Connections!" },
    { ordinal: 11, slug: "marks-of-identity-here-and-there", titleTa: "ஆங்காங்கு அடையாள முத்திரைகள்!", titleEn: "Marks of Identity Here and There!" },
    { ordinal: 12, slug: "valli-s-marriage-in-the-garden-of-history", titleTa: "வரலாற்றுப் பூங்காவில் வள்ளித் திருமணம்!", titleEn: "Valli's Marriage in the Garden of History!" },
    { ordinal: 13, slug: "the-unbroken-alliance-that-made-kharavela-tremble", titleTa: "காரவேலன் கண்டு நடுங்கிய கட்டுக்குலையாக் கூட்டணி!", titleEn: "The Unbroken Alliance That Made Kharavela Tremble!" },
    { ordinal: 14, slug: "the-history-of-kanaka-and-vijaya-carrying-the-stone", titleTa: "கனக விஜயர் கல் சுமந்த வரலாறு!", titleEn: "The History of Kanaka and Vijaya Carrying the Stone!" },
    { ordinal: 15, slug: "let-us-drink-this-aryan-tea", titleTa: "பருகிடலாம் இந்த “ஆரிய” தேநீரை!", titleEn: "Let Us Drink This “Aryan” Tea!" },
    { ordinal: 16, slug: "as-a-flavour-united-within-the-segment", titleTa: "சுளையில் ஒன்றியிருக்கும் சுவையாக!", titleEn: "As a Flavour United Within the Segment!" },
    { ordinal: 17, slug: "from-where-is-world-history-to-come", titleTa: "உலக வரலாறு எங்கிருந்து வருவது?", titleEn: "From Where Is World History to Come?" },
    { ordinal: 18, slug: "we-seek-what-remains-after-the-rubbing-away", titleTa: "தேய்ந்தது போக மிச்சத்தைத் தேடுகின்றோம்!", contentsTitleTa: "தேய்ந்ததுபோக மிச்சத்தைத் தேடுகின்றோம்!", titleEn: "We Seek What Remains After the Rubbing Away!" },
    { ordinal: 19, slug: "a-historical-event-to-grieve-over", titleTa: "வருந்தத்தக்க வரலாற்று நிகழ்ச்சி!", titleEn: "A Historical Event to Grieve Over!" },
    { ordinal: 20, slug: "even-in-falling-he-is-victory-s-favoured-son", titleTa: "வீழினும் அவன் வெற்றித் திருமகனே!", titleEn: "Even in Falling, He Is Victory's Favoured Son!" },
    { ordinal: 21, slug: "where-culture-is-maimed-they-would-not-even-wish-to-look", titleTa: "பண்பாட்டுக்கு ஊனம் எனில் பார்க்கவும் விரும்பார்!", titleEn: "Where Culture Is Maimed, They Would Not Even Wish to Look!" },
    { ordinal: 22, slug: "why-then-the-question-that-is-my-question", titleTa: "“பிறகேன் வினா? என்பதே என் வினா!”", contentsTitleTa: "பிறகேன் வினா? என்பதே என் வினா!", titleEn: "“Why, Then, the Question? — That Is My Question!”" },
    { ordinal: 23, slug: "kundalakesi-who-speaks-the-strength-of-feminism", titleTa: "பெண்ணியத்தின் திண்மை கூறும் குண்டலகேசி!", titleEn: "Kundalakesi, Who Speaks the Strength of Feminism!" },
    { ordinal: 24, slug: "this-tamil-land-two-thousand-years-ago", titleTa: "ஈராயிரம் ஆண்டின் முன்னே இந்தத் தமிழ் நிலம்!", titleEn: "This Tamil Land, Two Thousand Years Ago!" },
    { ordinal: 25, slug: "kannagi-s-emphasis-on-culture", titleTa: "கலாச்சாரத்தின்மீது கண்ணகி காட்டிய அழுத்தம்", contentsTitleTa: "கலாச்சாரத்தின்மீது கண்ணகி காட்டிய அழுத்தம்!", titleEn: "Kannagi's Emphasis on Culture" },
    { ordinal: 26, slug: "awake-here-is-the-dawn-of-a-classical-language", titleTa: "விழித்தெழுக; இதோ செம்மொழி விடியல்!", contentsTitleTa: "விழித்தெழுக; இதோ, செம்மொழி விடியல்!", titleEn: "Awake; Here Is the Dawn of a Classical Language!" },
    { ordinal: 27, slug: "it-will-surely-be-opened-to-show-the-way", titleTa: "வழிகாட்டும் வண்ணம்; திறக்கப்படுவது திண்ணம்!", titleEn: "It Will Surely Be Opened, to Show the Way!" },
    { ordinal: 28, slug: "the-ancient-civilisation-that-spread-across-the-whole-world", titleTa: "பார் முழுதும் பரவிய பழம்பெரும் நாகரிகம்!", titleEn: "The Ancient Civilisation That Spread Across the Whole World!" },
    { ordinal: 29, slug: "mother-give-us-bear-us-treasures-of-self-respect", titleTa: "தாயே தந்திடு எமக்கு தன்மானச் செல்வங்களை ஈன்று!", contentsTitleTa: "தாயே, தந்திடு எமக்கு தன்மானச் செல்வங்களை ஈன்று!", titleEn: "Mother, Give Us — Bear Us Treasures of Self-Respect!" },
    { ordinal: 30, slug: "the-measure-of-his-power-his-just-sceptre", titleTa: "ஆற்றலின் அளவுகோல்; அவன் செங்கோல்!", titleEn: "The Measure of His Power: His Just Sceptre!" },
    { ordinal: 31, slug: "the-mother-full-of-dignity-and-the-stainless-son", titleTa: "மாண்பு நிறை தாயும் மாசற்ற மகனும்!", contentsTitleTa: "மாண்பு நிறை தாயும், மாசற்ற மகனும்!", titleEn: "The Mother Full of Dignity and the Stainless Son!" },
    { ordinal: 32, slug: "kovoorar-questions-heads-bow-down", titleTa: "கோவூரார் கேள்வியுறும் - குனிந்திடும் தலையுறும்", contentsTitleTa: "கோவூரார் கேள்வியும் குனிந்திடும் தலையும்!", titleEn: "Kovoorar Questions — Heads Bow Down" },
    { ordinal: 33, slug: "is-seruppaazhi-erindha-an-honorific-title", titleTa: "“செருப்பாழி எறிந்த” என்பது சிறப்புப் பட்டமா?", titleEn: "Is “Seruppaazhi-Erindha” an Honorific Title?" },
    { ordinal: 34, slug: "it-did-not-vanish-it-was-reborn", titleTa: "மறையவில்லை; மறுமலர்ச்சி பெற்றது!", titleEn: "It Did Not Vanish; It Was Reborn!" },
    { ordinal: 35, slug: "a-noble-friendship-higher-than-life-itself", titleTa: "உயிரினும் மேலான உயர்ந்த நட்பு!", titleEn: "A Noble Friendship Higher Than Life Itself!" },
    { ordinal: 36, slug: "he-is-young-he-is-a-son-of-tamil", titleTa: "இளையவன்; அவன் ஒரு தமிழ் மகன்!", titleEn: "He Is Young; He Is a Son of Tamil!" },
    { ordinal: 37, slug: "can-he-be-bought-with-love", titleTa: "அன்பால் அவனை விலைகொள்ள முடியுமோ?", contentsTitleTa: "அன்பால் அவனை விலை கொள்ள முடியுமா?", titleEn: "Can He Be Bought with Love?" },
    { ordinal: 38, slug: "he-who-lives-in-the-hearts-of-the-grateful", titleTa: "நன்றியுடையோர் நெஞ்சில் வாழ்வோன்!", titleEn: "He Who Lives in the Hearts of the Grateful!" },
    { ordinal: 39, slug: "not-one-who-came-on-his-own-one-brought-by-the-commander", titleTa: "தானாக வந்தவரல்ல; தளபதியால் கொண்டுவரப்பட்டவர்!", titleEn: "Not One Who Came on His Own; One Brought by the Commander!" },
    { ordinal: 40, slug: "the-tenderness-and-compassion-shown-by-the-soil-of-kanchi", titleTa: "காஞ்சி மண் காட்டிய கனிவும் கருணையும்", contentsTitleTa: "காஞ்சி மண் காட்டிய கனிவும் கருணையும்!", titleEn: "The Tenderness and Compassion Shown by the Soil of Kanchi" },
    { ordinal: 41, slug: "let-us-protect-it-the-pallava-capital", titleTa: "பாதுகாப்போம்; பல்லவர் தலைநகரம்!", titleEn: "Let Us Protect It: The Pallava Capital!" },
    { ordinal: 42, slug: "the-charters-proclaim-it", titleTa: "பட்டயங்கள், பறைசாற்றுகின்றன!", titleEn: "The Charters Proclaim It!" },
    { ordinal: 43, slug: "the-tamil-tradition-of-the-dravidian-race", titleTa: "திராவிட இனத்தின் தமிழர் மரபு!", titleEn: "The Tamil Tradition of the Dravidian Race!" },
    { ordinal: 44, slug: "the-iron-pillar-and-the-wings-of-flies", titleTa: "இரும்புத் தூணும் ஈக்களின் இறகும்!", contentsTitleTa: "இரும்புத் தூணும், ஈக்களின் இறகும்!", titleEn: "The Iron Pillar and the Wings of Flies!" },
    { ordinal: 45, slug: "father-rajaraja-and-the-son-who-captivated-hearts", titleTa: "தந்தை இராசராசனும், சிந்தை கவர்ந்த செல்வனும்!", titleEn: "Father Rajaraja and the Son Who Captivated Hearts!" },
    { ordinal: 46, slug: "the-three-crowned-chola-who-stood-as-a-model", titleTa: "முன்மாதிரியாகத் திகழ்ந்த மும்முடிச் சோழன்!", contentsTitleTa: "முன்மாதிரியாகத் திகழ்ந்த மும்முடிச் சோழன்", titleEn: "The Three-Crowned Chola Who Stood as a Model!" },
    { ordinal: 47, slug: "that-future-age-will-be-a-precious-age", titleTa: "அந்த வருங்காலமே; அருங்காலமாகும்!", titleEn: "That Future Age Will Be a Precious Age!" },
    { ordinal: 48, slug: "the-undying-art-of-sculpture-and-the-beautiful-art-of-painting", titleTa: "அழியாத சிற்பக் கலையும், அழகிய ஓவியக் கலையும்!", titleEn: "The Undying Art of Sculpture and the Beautiful Art of Painting!" },
    { ordinal: 49, slug: "they-saw-many-battlefields-they-won-in-naval-war-too", titleTa: "களம் பல கண்டனர்; கடற்போரிலும் வென்றனர்!", titleEn: "They Saw Many Battlefields; They Won in Naval War Too!" },
    { ordinal: 50, slug: "the-field-of-blood-itself-became-the-coronation-hall", titleTa: "குருதிக்களமே; கொலு மண்டபம் ஆனது!", contentsTitleTa: "குருதிக் களமே! கொலு மண்டபம் ஆனது!", titleEn: "The Field of Blood Itself Became the Coronation Hall!" },
    { ordinal: 51, slug: "marriages-too-can-bring-a-turn", titleTa: "திருமணங்களாலும் வருவதுண்டு திருப்பம்!", titleEn: "Marriages Too Can Bring a Turn!" },
    { ordinal: 52, slug: "a-culture-that-announces-an-invasion-in-advance", titleTa: "படையெடுப்பை முன்கூட்டியே அறிவிக்கும் பண்பாடு!", titleEn: "A Culture That Announces an Invasion in Advance!" },
    { ordinal: 53, slug: "tamil-escaped-the-sea-deluge-it-found-the-last-sangam", titleTa: "கடற்கோளில் தப்பிய தமிழ்; கடைச் சங்கம் கண்டது!", titleEn: "Tamil Escaped the Sea-Deluge; It Found the Last Sangam!" },
    { ordinal: 54, slug: "he-who-won-the-battle-of-talaiyalanganam", titleTa: "தலையாலங்கானத்துச் செருவென்றான்!", contentsTitleTa: "தலையாலங்கானத்துச் செரு வென்றான்!", titleEn: "He Who Won the Battle of Talaiyalanganam!" },
    { ordinal: 55, slug: "nedunchezhiyan-and-nedunalvadai", titleTa: "நெடுஞ்செழியனும் நெடுநல்வாடையும்!", titleEn: "Nedunchezhiyan and Nedunalvadai!" },
    { ordinal: 56, slug: "when-attachment-goes-beyond-its-bounds-it-burns-as-frenzy", titleTa: "பற்று கடந்தால், பற்றி எரியும் வெறியே!", titleEn: "When Attachment Goes Beyond Its Bounds, It Burns as Frenzy!" },
    { ordinal: 57, slug: "what-prize-is-fitting-for-the-beauty-of-a-simile", titleTa: "உவமை அழகுக்கு உரிய பரிசு என்னவாம்!", titleEn: "What Prize Is Fitting for the Beauty of a Simile!" },
    { ordinal: 58, slug: "beside-the-enemy-sword-s-edge-let-us-labour-all-our-days", titleTa: "பகைவாள் முனை மருங்க; நாள் எல்லாம் உழைப்போம்!", contentsTitleTa: "பகை வாள் முனை மருங்க; நாள் எல்லாம் உழைப்போம்", titleEn: "Beside the Enemy Sword's Edge; Let Us Labour All Our Days!" },
  ],
};
