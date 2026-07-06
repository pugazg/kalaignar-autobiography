export type WorldScope = "world" | "india";

export type WorldEvent = {
  id: string;
  scope: WorldScope;
  year: string;
  event: { en: string; ta: string };
  connection: { en: string; ta: string }; // how the memoir invokes it — verified in text
  refs: string[];
};

/**
 * "Against the World" — the national and international events Karunanidhi
 * threads through the memoir. Every entry was verified against the chapter
 * text (see the corpus scan); the `connection` describes how the book itself
 * invokes the event, not outside knowledge.
 */
export const worldEvents: WorldEvent[] = [
  {
    id: "world-mein-kampf",
    scope: "world",
    year: "1924",
    event: { en: "Hitler writing Mein Kampf in prison", ta: "சிறையில் ஹிட்லர் 'மெயின் காம்ப்' எழுதியது" },
    connection: {
      en: "The very first chapter frames his birth year against the world's: as he was born, Adolf Hitler sat in a fortress prison writing the autobiography that would later turn the history of nations upside down.",
      ta: "முதல் அத்தியாயமே அவரது பிறந்த ஆண்டை உலக நிகழ்வுடன் இணைக்கிறது: அவர் பிறந்த வேளையில், சிறைக்கோட்டையில் அடால்ஃப் ஹிட்லர் — பிற்காலத்தில் பல நாடுகளின் வரலாற்றைத் தலைகீழாக்கிய — தன் சுயசரிதையை எழுதிக்கொண்டிருந்தான்.",
    },
    refs: ["v1-ch01"],
  },
  {
    id: "world-lenin-kemal",
    scope: "world",
    year: "1924",
    event: { en: "Lenin's death · Kemal Atatürk's reforms", ta: "லெனின் மறைவு · கமால் பாட்சாவின் சீர்திருத்தம்" },
    connection: {
      en: "The same birth-year chapter notes that 1924 saw the revolutionary Lenin die and Kemal Atatürk's reforms take shape — reforms he says he invoked with delight at every stage of his own political life.",
      ta: "அதே அத்தியாயம், 1924-இல் புரட்சி வீரன் லெனின் மறைந்ததையும், கமால் பாட்சாவின் சீர்திருத்தம் உருவானதையும் குறிக்கிறது — தன் அரசியல் வாழ்வின் ஒவ்வொரு கட்டத்திலும் மகிழ்ந்து சொல்லிய சீர்திருத்தம் என்கிறார்.",
    },
    refs: ["v1-ch01"],
  },
  {
    id: "world-wwii",
    scope: "world",
    year: "1938",
    event: { en: "Hitler takes Czechoslovakia; WWII nears", ta: "செக்கோஸ்லோவாக்கியாவை ஹிட்லர் விழுங்கியது; இரண்டாம் உலகப் போர் நெருங்குகிறது" },
    connection: {
      en: "He dates the year of his own entry into the language struggle by the world calendar: the year Atatürk died in Turkey, Hitler swallowed Czechoslovakia, and the Second World War took its first step.",
      ta: "மொழிப் போரில் தன் நுழைவின் ஆண்டை உலக நாட்காட்டியால் குறிக்கிறார்: துருக்கியில் கமால் பாட்சா மறைந்த, ஹிட்லர் செக்கோஸ்லோவாக்கியாவை விழுங்கிய, இரண்டாம் உலகப் போர் முதலடி வைத்த ஆண்டு.",
    },
    refs: ["v1-ch05"],
  },
  {
    id: "india-gandhi-killed",
    scope: "india",
    year: "1948",
    event: { en: "Gandhi assassinated", ta: "காந்தி படுகொலை" },
    connection: {
      en: "The year he lost his young wife Padma was also the year, he writes, that 'the whole world wept' as Godse shot the Mahatma — private grief and national grief bound into one chapter.",
      ta: "இளம் மனைவி பத்மாவை இழந்த அந்த ஆண்டே, 'உலகமே அழத்தக்க வண்ணம்' கோட்சே காந்தியைச் சுட்டுக் கொன்ற ஆண்டும் — தனிப்பட்ட துயரும் தேசியத் துயரும் ஒரே அத்தியாயத்தில்.",
    },
    refs: ["v1-ch21", "v1-ch105"],
  },
  {
    id: "world-ho-chi-minh",
    scope: "world",
    year: "1953",
    event: { en: "Ho Chi Minh's Vietnam", ta: "ஹோ சி மின்னின் வியட்நாம்" },
    connection: {
      en: "Explaining why the movement's power always rose first in the south, he reaches for a Vietnamese proverb the revolutionary Ho Chi Minh loved: 'the south is first to begin, last to fall in line.'",
      ta: "இயக்கத்தின் வலிமை எப்போதும் தெற்கில் முதலில் எழுந்ததை விளக்க, புரட்சி வீரன் ஹோ சி மின் விரும்பிச் சொன்ன வியட்நாமியப் பழமொழியை மேற்கோள் காட்டுகிறார்: 'தொடங்குவது தெற்கு; இறுதியில் இணைவதும் அதுவே.'",
    },
    refs: ["v1-ch51"],
  },
  {
    id: "world-kennedy",
    scope: "world",
    year: "1961",
    event: { en: "Kennedy's inauguration", ta: "கென்னடி பதவியேற்பு" },
    connection: {
      en: "He records the exact date — January 20, 1961 — that Kennedy became America's 35th President, quoting the inaugural 'ask not what your country can do for you' to make a point about public duty.",
      ta: "சரியான தேதியைப் பதிவு செய்கிறார் — 1961 ஜனவரி 20 — கென்னடி அமெரிக்காவின் 35-வது ஜனாதிபதியான நாள்; 'நாடு உனக்கு என்ன செய்யும் எனக் கேளாதே' என்ற பதவியேற்பு உரையை பொதுக் கடமை பற்றிச் சொல்ல மேற்கோளிடுகிறார்.",
    },
    refs: ["v1-ch72"],
  },
  {
    id: "india-china-war",
    scope: "india",
    year: "1962",
    event: { en: "China's invasion of India", ta: "சீனப் படையெடுப்பு" },
    connection: {
      en: "When Red China invaded in 1962, the Kazhagam pledged full support to the Indian Prime Minister against the aggression — and he ties the war to why the movement set aside the separation demand.",
      ta: "1962-இல் செஞ்சீனம் படையெடுத்தபோது, ஆக்கிரமிப்பை எதிர்த்து இந்தியப் பிரதமருக்குக் கழகம் முழு ஆதரவு அளித்தது — பிரிவினைக் கோரிக்கையைக் கழகம் ஒதுக்கியதற்கும் இப்போரை இணைக்கிறார்.",
    },
    refs: ["v1-ch75", "v1-ch111"],
  },
  {
    id: "india-bangladesh",
    scope: "india",
    year: "1971",
    event: { en: "Bangladesh Liberation War", ta: "வங்கதேச விடுதலைப் போர்" },
    connection: {
      en: "The USA trip and the 1971 India–Pakistan war run through these chapters — from a rally denouncing the war fever to explaining India's stand to senators abroad, as Bangladesh broke free of Pakistan.",
      ta: "அமெரிக்கப் பயணமும் 1971 இந்தியா–பாகிஸ்தான் போரும் இந்த அத்தியாயங்களில் ஓடுகின்றன — போர் வெறியைக் கண்டித்த கூட்டம் முதல், வெளிநாட்டில் செனட்டர்களிடம் இந்தியாவின் நிலையை விளக்கியது வரை; வங்கதேசம் பாகிஸ்தானிடமிருந்து விடுதலை பெற்றது.",
    },
    refs: ["v1-ch77", "v2-ch44"],
  },
  {
    id: "world-gorbachev",
    scope: "world",
    year: "1989",
    event: { en: "Soviet multi-candidate elections", ta: "சோவியத் பல-வேட்பாளர் தேர்தல்" },
    connection: {
      en: "As a sitting Chief Minister he notes world news in real time: on 26 March 1989, Gorbachev and millions of Soviets voted in that country's first multi-candidate election — a democratic milestone he pauses to mark.",
      ta: "பதவியிலிருந்த முதல்வராக உலகச் செய்தியை உடனுக்குடன் குறிக்கிறார்: 1989 மார்ச் 26-இல், கோர்பசேவும் லட்சக்கணக்கான சோவியத் மக்களும் அந்நாட்டின் முதல் பல-வேட்பாளர் தேர்தலில் வாக்களித்தனர் — அவர் நிறுத்திக் குறிக்கும் ஜனநாயக மைல்கல்.",
    },
    refs: ["v4-ch04"],
  },
  {
    id: "world-mandela",
    scope: "world",
    year: "1990s",
    event: { en: "Nelson Mandela", ta: "நெல்சன் மண்டேலா" },
    connection: {
      en: "Mandela appears among the volume's chapters — the South African liberation icon entering the frame of the memoir's fourth-volume world.",
      ta: "தொகுதியின் அத்தியாயங்களில் மண்டேலா இடம்பெறுகிறார் — தென்னாப்பிரிக்க விடுதலை உருவம் நான்காம் பாகத்தின் உலகக் காட்சிக்குள் நுழைகிறார்.",
    },
    refs: ["v4-ch02"],
  },
  {
    id: "india-babri",
    scope: "india",
    year: "1990–92",
    event: { en: "Ram Janmabhoomi–Babri Masjid crisis", ta: "ராம ஜென்மபூமி–பாபர் மசூதி நெருக்கடி" },
    connection: {
      en: "The rath yatra and the Ayodhya dispute enter in real time — he recalls how the Centre acted swiftly to build the Somnath temple and asks the same resolve of the Ram Janmabhoomi–Babri Masjid question.",
      ta: "ரத யாத்திரையும் அயோத்தி விவகாரமும் உடனுக்குடன் நுழைகின்றன — சோமநாதர் கோயிலைக் கட்ட மத்திய அரசு விரைந்து செயல்பட்டதை நினைவுகூர்ந்து, ராம ஜென்மபூமி–பாபர் மசூதி பிரச்சினையிலும் அதே உறுதியைக் கேட்கிறார்.",
    },
    refs: ["v4-ch15"],
  },
];

export const worldScopeLabels: Record<WorldScope, { en: string; ta: string }> = {
  world: { en: "World", ta: "உலகம்" },
  india: { en: "India", ta: "இந்தியா" },
};
