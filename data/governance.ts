export type GovKind = "law" | "resolution" | "scheme" | "project" | "institution" | "policy" | "ledger";

export type GovEntry = {
  id: string;
  kind: GovKind;
  term: string; // term id from govTerms
  year: string;
  name: { en: string; ta: string };
  note: { en: string; ta: string };
  refs: string[]; // verified chapter ids
};

export const govTerms = [
  { id: "t67", en: "1967–69 · In Anna's cabinet", ta: "1967–69 · அண்ணா அமைச்சரவையில்" },
  { id: "t69", en: "1969–76 · First & second terms", ta: "1969–76 · முதல் & இரண்டாம் ஆட்சி" },
  { id: "t89", en: "1989–91 · Third term", ta: "1989–91 · மூன்றாம் ஆட்சி" },
  { id: "t96", en: "1996–2001 · Fourth term", ta: "1996–2001 · நான்காம் ஆட்சி" },
  { id: "t99", en: "1999–2005 · The advocacy years", ta: "1999–2005 · வாதாடிய ஆண்டுகள்" },
];

export const govKindLabels: Record<GovKind, { en: string; ta: string }> = {
  law: { en: "Law", ta: "சட்டம்" },
  resolution: { en: "Resolution", ta: "தீர்மானம்" },
  scheme: { en: "Scheme", ta: "திட்டம்" },
  project: { en: "Project", ta: "திட்டப்பணி" },
  institution: { en: "Institution", ta: "நிறுவனம்" },
  policy: { en: "Policy", ta: "கொள்கை" },
  ledger: { en: "His own ledger", ta: "அவரது ஏடு" },
};

/**
 * The governance register — every entry verified against the memoir and
 * anchored to the chapter(s) where the book itself records it.
 */
export const governance: GovEntry[] = [
  // ——— 1967–69 · In Anna's cabinet ———
  {
    id: "tn-rename", kind: "resolution", term: "t67", year: "1967",
    name: { en: "Tamil Nadu renaming resolution", ta: "தமிழ்நாடு பெயர்மாற்றத் தீர்மானம்" },
    note: {
      en: "Madras State renamed Tamil Nadu — moved July 18, 1967 and passed unanimously; the first landmark in Volume 2's ledger of the nine-year rule.",
      ta: "சென்னை மாநிலம் தமிழ்நாடு எனப் பெயர் மாற்றம் — 1967 ஜூலை 18-இல் முன்மொழியப்பட்டு ஒருமனதாக நிறைவேற்றம்; ஒன்பதாண்டு ஆட்சியின் ஏட்டில் இரண்டாம் தொகுதி பதியும் முதல் மைல்கல்.",
    },
    refs: ["v1-ch133", "v2-ch55"],
  },
  {
    id: "srm-act", kind: "law", term: "t67", year: "1967–68",
    name: { en: "Self-respect marriages legalized", ta: "சுயமரியாதைத் திருமணச் சட்டம்" },
    note: {
      en: "Reformist weddings given full legal validity — the second of Anna's three landmarks as the memoir's own ledger counts them.",
      ta: "சுயமரியாதைத் திருமணங்களுக்கு முழுச் சட்டச் செல்லுபடி — நினைவேட்டின் சொந்த ஏடு எண்ணும் அண்ணாவின் மூன்று மைல்கற்களில் இரண்டாவது.",
    },
    refs: ["v2-ch55"],
  },
  {
    id: "two-lang", kind: "policy", term: "t67", year: "1968",
    name: { en: "Two-language education policy", ta: "இருமொழிக் கல்விக் கொள்கை" },
    note: {
      en: "Tamil and English alone in Tamil Nadu's schools — 'no place for Hindi,' as the ledger chapter puts it.",
      ta: "தமிழ்நாட்டுப் பள்ளிகளில் தமிழும் ஆங்கிலமும் மட்டுமே — 'இந்திக்கு இடமில்லை' என்று ஏட்டு அத்தியாயம் பதிவு செய்கிறது.",
    },
    refs: ["v2-ch55"],
  },
  {
    id: "pwd-works", kind: "scheme", term: "t67", year: "1967–69",
    name: { en: "Slum clearance · Cooum · drinking water", ta: "குடிசை மாற்று · கூவம் திருத்தம் · குடிநீர்" },
    note: {
      en: "His own PWD portfolio: multi-storey tenements at ₹50 monthly rent, the Cooum improvement, and water schemes for a thirsty Madras — a chapter carries all three in its title.",
      ta: "அவரது பொதுப்பணித்துறை கணக்கு: மாதம் ₹50 வாடகையில் பல மாடி குடியிருப்புகள், கூவம் சீரமைப்பு, தாகம் கொண்ட சென்னைக்குக் குடிநீர்த் திட்டங்கள் — மூன்றையும் தலைப்பிலேயே சுமக்கும் அத்தியாயம்.",
    },
    refs: ["v1-ch132"],
  },

  // ——— 1969–76 · First & second terms ———
  {
    id: "bc-dept", kind: "institution", term: "t69", year: "1969",
    name: { en: "Backward Classes welfare department", ta: "பிற்படுத்தப்பட்டோர் நலத்துறை" },
    note: {
      en: "Created as a separate department on 1-4-1969, days into the chief ministership — and held under the Chief Minister himself.",
      ta: "முதலமைச்சரான சில நாள்களில், 1-4-1969-இல் தனித் துறையாக உருவாக்கம் — முதல்வர் பொறுப்பிலேயே வைக்கப்பட்டது.",
    },
    refs: ["v2-ch12"],
  },
  {
    id: "archakas", kind: "law", term: "t69", year: "1970–71",
    name: { en: "The Archakas Act", ta: "அர்ச்சகர் சட்டம்" },
    note: {
      en: "Temple priesthood opened to all castes — a self-respect milestone the memoir gives an entire chapter of its own.",
      ta: "எல்லாச் சாதியினருக்கும் அர்ச்சகர் உரிமை — நினைவேடு தனி அத்தியாயமே ஒதுக்கும் சுயமரியாதை மைல்கல்.",
    },
    refs: ["v2-ch28"],
  },
  {
    id: "laws-71", kind: "law", term: "t69", year: "1971+",
    name: { en: "'A few laws!' — the landslide term's statute book", ta: "'சில சட்டங்கள்!' — பேரலை ஆட்சியின் சட்டத் தொகுப்பு" },
    note: {
      en: "The chapter that inventories the legislation of the 184-seat term, statute by statute.",
      ta: "184 இடங்களின் ஆட்சிக் காலச் சட்டங்களை ஒவ்வொன்றாகப் பட்டியலிடும் அத்தியாயம்.",
    },
    refs: ["v2-ch40"],
  },
  {
    id: "autonomy", kind: "resolution", term: "t69", year: "1974",
    name: { en: "State Autonomy Resolution", ta: "மாநில சுயாட்சித் தீர்மானம்" },
    note: {
      en: "Moved and passed in the Assembly in 1974, his fiftieth year — 'a guide to all the states of India,' he records leaders saying a decade later.",
      ta: "1974-இல், அவரது ஐம்பதாம் அகவை ஆண்டில் பேரவையில் முன்மொழிந்து நிறைவேற்றம் — 'இந்திய மாநிலங்கள் அனைத்துக்கும் வழிகாட்டி' என்று பத்தாண்டு கழித்துத் தலைவர்கள் சுட்டியதை அவர் பதிவு செய்கிறார்.",
    },
    refs: ["v2-ch56"],
  },
  {
    id: "valluvar-kottam", kind: "project", term: "t69", year: "1974–76",
    name: { en: "Valluvar Kottam", ta: "வள்ளுவர் கோட்டம்" },
    note: {
      en: "The memorial raised to Thiruvalluvar in the capital — opened that April of 1976 under President's rule, days after the dismissal; thirteen years later he would take his next oath of office inside it.",
      ta: "தலைநகரில் திருவள்ளுவருக்கு எழுப்பிய நினைவிடம் — ஆட்சிக் கலைப்புக்குப் பின், 1976 ஏப்ரலில் குடியரசுத் தலைவர் ஆட்சியில் திறப்பு; பதின்மூன்று ஆண்டுகள் கழித்து அதற்குள்ளேயே அடுத்த பதவியேற்பு.",
    },
    refs: ["v2-ch66", "v2-ch67"],
  },
  {
    id: "ledger-69", kind: "ledger", term: "t69", year: "1967–76",
    name: { en: "'A golden day in public life' — the nine-year ledger", ta: "'பொதுவாழ்வில் ஒரு பொன்னாள்!' — ஒன்பதாண்டு ஏடு" },
    note: {
      en: "His own summary chapter of the 1967–76 record — Anna's three landmarks first, then his government's works under the slogan 'we shall see God in the smile of the poor.'",
      ta: "1967–76 ஆட்சிப் பதிவின் அவரது சொந்தச் சுருக்க அத்தியாயம் — முதலில் அண்ணாவின் மூன்று மைல்கற்கள்; பின் 'ஏழையின் சிரிப்பில் இறைவனைக் காண்போம்' என்ற முழக்கத்தின் கீழ் தன் அரசின் பணிகள்.",
    },
    refs: ["v2-ch55"],
  },

  // ——— 1989–91 · Third term ———
  {
    id: "property-rights", kind: "law", term: "t89", year: "1989",
    name: { en: "Equal property rights for women", ta: "பெண்களுக்குச் சம சொத்துரிமை" },
    note: {
      en: "Enacted in 1989 — sixty years after the movement first resolved it, as the volume counts with pride.",
      ta: "1989-இல் சட்டமாக்கம் — இயக்கம் தீர்மானித்த அறுபது ஆண்டுகளுக்குப் பின், என்று தொகுதி பெருமிதத்துடன் எண்ணுகிறது.",
    },
    refs: ["v4-ch04"],
  },
  {
    id: "austerity-89", kind: "policy", term: "t89", year: "1989",
    name: { en: "Austerity: 41 of 77 board posts abolished", ta: "சிக்கனம்: 77-இல் 41 அரசியல் பதவிகள் ரத்து" },
    note: {
      en: "The new government's first economies — political board positions cut nearly in half, recorded in the term's opening chapters.",
      ta: "புதிய அரசின் முதல் சிக்கன நடவடிக்கைகள் — அரசியல் வாரியப் பதவிகள் கிட்டத்தட்டப் பாதியாகக் குறைப்பு; ஆட்சியின் தொடக்க அத்தியாயங்களில் பதிவு.",
    },
    refs: ["v4-ch03"],
  },
  {
    id: "reservation-89", kind: "policy", term: "t89", year: "1989–91",
    name: { en: "The reservation battles", ta: "இட ஒதுக்கீட்டுப் போராட்டங்கள்" },
    note: {
      en: "The term's dominant policy thread — the phrase recurs twenty-six times in the dismissal narrative alone as the fight over social-justice quotas entwines with the government's fate.",
      ta: "ஆட்சியின் மையக் கொள்கை இழை — சமூக நீதி ஒதுக்கீட்டுக்கான போர் அரசின் தலைவிதியோடு பின்னிப் பிணைய, ஆட்சிக் கலைப்புக் கதையிலேயே அச்சொல் இருபத்தாறு முறை வருகிறது.",
    },
    refs: ["v4-ch19"],
  },

  // ——— 1996–2001 · Fourth term ———
  {
    id: "samathuvapuram", kind: "scheme", term: "t96", year: "1997+",
    name: { en: "Periyar Memorial Samathuvapuram", ta: "பெரியார் நினைவு சமத்துவபுரம்" },
    note: {
      en: "Equality villages where caste has no address — 'peak of achievement: Samathuvapuram!' the chapter title declares.",
      ta: "சாதிக்கு முகவரி இல்லாத சமத்துவ ஊர்கள் — 'சாதனைச் சிகரம்; சமத்துவபுரம்!' என்று அத்தியாயத் தலைப்பே அறிவிக்கிறது.",
    },
    refs: ["v5-ch27"],
  },
  {
    id: "prohibition", kind: "policy", term: "t96", year: "1996+",
    name: { en: "Prohibition, confronted honestly", ta: "மதுவிலக்கு — நேர்மையான எதிர்கொள்ளல்" },
    note: {
      en: "'The prohibition illusion' — the chapter that argues the policy's realities rather than its slogans.",
      ta: "'மதுவிலக்கு மாயை' — முழக்கங்களை அல்ல, கொள்கையின் யதார்த்தங்களை வாதிடும் அத்தியாயம்.",
    },
    refs: ["v5-ch04"],
  },
  {
    id: "dravidian-univ", kind: "institution", term: "t96", year: "1997",
    name: { en: "Dravidian University", ta: "திராவிடப் பல்கலைக்கழகம்" },
    note: {
      en: "A university for Dravidian studies — the chapter opens by clearing away the previous regime's self-naming excesses before building.",
      ta: "திராவிடவியலுக்கு ஒரு பல்கலைக்கழகம் — கட்டுவதற்கு முன், முந்தைய ஆட்சியின் சுயபெயர்ச் சூட்டல்களைத் துடைப்பதில் அத்தியாயம் தொடங்குகிறது.",
    },
    refs: ["v5-ch09"],
  },
  {
    id: "krishna-water", kind: "project", term: "t96", year: "1996+",
    name: { en: "Krishna water for Chennai", ta: "சென்னைக்குக் கிருஷ்ணா நீர்" },
    note: {
      en: "The decades-old promise moves — launched jointly with Andhra's Chandrababu Naidu; the volume's photographs show the water at Tamil Nadu's border.",
      ta: "பல பத்தாண்டு வாக்குறுதி நகர்கிறது — ஆந்திரத்தின் சந்திரபாபு நாயுடுவுடன் இணைந்து தொடக்கம்; தமிழக எல்லையில் பாயும் நீரைத் தொகுதியின் புகைப்படங்கள் காட்டுகின்றன.",
    },
    refs: ["v5-ch11"],
  },
  {
    id: "valluvar-statue", kind: "project", term: "t96", year: "1999–2000",
    name: { en: "Thiruvalluvar statue, Kanyakumari", ta: "கன்னியாகுமரி திருவள்ளுவர் சிலை" },
    note: {
      en: "The 'sky-touching' figure rising where the three seas meet — the Chief Minister inspecting the works at land's end.",
      ta: "முக்கடல் சங்கமத்தில் எழும் 'வான்முட்டும்' உருவம் — கடல்முனையில் சிலைப் பணிகளை முதல்வர் பார்வையிட்டது.",
    },
    refs: ["v5-ch33"],
  },

  // ——— 1999–2005 · The advocacy years ———
  {
    id: "tamil-official", kind: "policy", term: "t99", year: "2000s",
    name: { en: "Tamil as an official language of India", ta: "தமிழே இந்தியாவின் ஆட்சிமொழி" },
    note: {
      en: "The old cause argued at Delhi — that Tamil too deserves the Union's official-language status.",
      ta: "டெல்லியில் வாதாடப்பட்ட பழைய கொள்கை — தமிழுக்கும் ஒன்றிய ஆட்சிமொழித் தகுதி உண்டு என்பது.",
    },
    refs: ["v6-ch12"],
  },
  {
    id: "sethu", kind: "project", term: "t99", year: "2004–05",
    name: { en: "Sethusamudram canal", ta: "சேது சமுத்திரத் திட்டம்" },
    note: {
      en: "'Why the Sethusamudram project?' — the case for the shipping canal, argued chapter-length.",
      ta: "'சேது சமுத்திரத் திட்டம் ஏன்?' — கப்பல் கால்வாய்க்கான வாதம், அத்தியாய நீளத்தில்.",
    },
    refs: ["v6-ch23"],
  },
  {
    id: "ledger-01", kind: "ledger", term: "t99", year: "2001",
    name: { en: "'The works I accomplished'", ta: "'நான் ஆற்றிய பணிகள்'" },
    note: {
      en: "A late chapter that lays out his record as the press of the day reported it — the memoirist auditing his own governance.",
      ta: "அன்றைய பத்திரிகைகள் பதிவு செய்தபடி தன் ஆட்சிப் பதிவை விரிக்கும் பிற்கால அத்தியாயம் — தன் ஆட்சியைத் தானே தணிக்கை செய்யும் நினைவெழுத்தாளர்.",
    },
    refs: ["v6-ch10"],
  },
];
