export type Belief = { id: string; tamil: string; en: string; refs: string[] };
export type Trait = {
  id: string;
  tamil: string;
  title: string;
  moment: { en: string; ta: string }; // a DOCUMENTED instance, not a generic claim
  refs: string[];
};

/** The core beliefs — the wheel. Each cites a chapter where the memoir states it. */
export const beliefs: Belief[] = [
  { id: "social-justice", tamil: "சமூக நீதி", en: "Social Justice", refs: ["v2-ch28", "v4-ch03"] },
  { id: "self-respect", tamil: "சுயமரியாதை", en: "Self-Respect", refs: ["v1-ch04"] },
  { id: "rationalism", tamil: "பகுத்தறிவு", en: "Rationalism", refs: ["v1-ch04"] },
  { id: "federalism", tamil: "மாநில சுயாட்சி", en: "Federalism", refs: ["v2-ch56"] },
  { id: "tamil", tamil: "தமிழ்", en: "Tamil Language", refs: ["v1-ch05"] },
  { id: "equality", tamil: "சமத்துவம்", en: "Equality", refs: ["v4-ch10"] },
  { id: "democracy", tamil: "ஜனநாயகம்", en: "Democracy", refs: ["v3-ch18"] },
  { id: "welfare", tamil: "நலவாழ்வு", en: "Welfare State", refs: ["v2-ch55"] },
];

/** How he lived those beliefs — each trait anchored to a documented moment. */
export const traits: Trait[] = [
  {
    id: "perseverance",
    tamil: "விடாமுயற்சி",
    title: "Perseverance",
    moment: {
      en: "In prison the movement did not stop writing — the poems the prisoners composed were gathered into a book, 'Honey-verse the prison gives' (Sirai Tharum Then Kavithai). Confinement became a publishing house.",
      ta: "சிறையிலும் இயக்கம் எழுதுவதை நிறுத்தவில்லை — கைதிகள் இயற்றிய கவிதைகள் 'சிறை தரும் தேன் கவிதை' என்ற நூலாகத் தொகுக்கப்பட்டன. சிறையே பதிப்பகமாயிற்று.",
    },
    refs: ["v1-ch50"],
  },
  {
    id: "humour",
    tamil: "நகைச்சுவை",
    title: "Humour",
    moment: {
      en: "The wit was inherited: his father composed satirical folk songs mocking the powerful — mutts, strongmen, the well-placed — publicly and fearlessly. Some in Thirukkuvalai still sing them.",
      ta: "நகைச்சுவை மரபுவழி வந்தது: அவரது தந்தை வல்லவர்களை—மடாதிபதிகள், அடியாட்கள், உயர்ந்தோர்—பகிரங்கமாக, அஞ்சாமல் கேலி செய்யும் கிராமியப் பாடல்கள் இயற்றினார். சிலவற்றைத் திருக்குவளையில் இன்றும் பாடுகின்றனர்.",
    },
    refs: ["v1-ch02"],
  },
  {
    id: "humility",
    tamil: "பணிவு",
    title: "Humility",
    moment: {
      en: "Of his father's fearlessness he writes plainly: 'I confess I do not have the courage my father had.' An orphan raised by the village, the memoir returns often to a felt humility about how far he came.",
      ta: "தந்தையின் அஞ்சாமை குறித்து வெளிப்படையாக எழுதுகிறார்: 'என் தந்தைக்கு இருந்த துணிவு எனக்கில்லை என்பதை ஒப்புக் கொள்கிறேன்.' ஊரால் வளர்க்கப்பட்ட அனாதை, தான் வந்த தூரம் குறித்த பணிவுணர்வுக்கு நினைவேடு அடிக்கடி திரும்புகிறது.",
    },
    refs: ["v1-ch02", "v1-ch60"],
  },
  {
    id: "gratitude",
    tamil: "நன்றியுணர்வு",
    title: "Gratitude",
    moment: {
      en: "'I offer my gratitude as tribute to my friends' love,' he writes of a statue unveiling — and dedicates the whole memoir to those who made him: parents, Periyar, Anna. Gratitude as a structuring principle.",
      ta: "'நண்பர்களுடைய அன்புக்கு என் நன்றியுணர்வைக் காணிக்கை ஆக்குகிறேன்' என்று சிலைத் திறப்பு குறித்து எழுதுகிறார் — முழு நினைவேட்டையும் தன்னை உருவாக்கியோருக்கே சமர்ப்பிக்கிறார்: பெற்றோர், பெரியார், அண்ணா. நன்றியுணர்வே ஒரு கட்டமைப்புக் கொள்கை.",
    },
    refs: ["v1-ch137"],
  },
  {
    id: "courage",
    tamil: "துணிவு",
    title: "Courage",
    moment: {
      en: "At Kallakudi in 1953 he led the front rank himself — before him alone, twenty-four volunteers behind, thousands around — into a struggle that ended in Trichy jail. Courage documented in action, not adjective.",
      ta: "1953 கல்லக்குடியில் முதல் அணியை முன்நின்று நடத்தினார் — முன்னே அவர் மட்டும், பின்னே இருபத்துநான்கு தொண்டர்கள், சுற்றிலும் ஆயிரங்கள் — திருச்சிச் சிறையில் முடிந்த போராட்டத்திற்குள். அடைமொழி அல்ல, செயலில் பதிவான துணிவு.",
    },
    refs: ["v1-ch43"],
  },
  {
    id: "compassion",
    tamil: "இரக்கம்",
    title: "Compassion",
    moment: {
      en: "The memoir's very first chapter meditates on every human life as a film worth watching to its end — 'the unknowing smile at death's door, the sigh, the tear.' A writer's compassion for the ordinary life, set as the book's opening key.",
      ta: "நினைவேட்டின் முதல் அத்தியாயமே ஒவ்வொரு மனித வாழ்வையும் இறுதிவரை பார்க்கத்தக்க திரைப்படமாகச் சிந்திக்கிறது — 'மரண முகப்பிலும் அறியாப் புன்னகை, பெருமூச்சு, கண்ணீர்.' சாதாரண வாழ்வின்மீது எழுத்தாளனின் இரக்கம், நூலின் தொடக்கச் சுரமாக.",
    },
    refs: ["v1-ch01"],
  },
];
