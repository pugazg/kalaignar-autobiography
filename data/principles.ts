export type Principle = {
  id: string;
  tamil: string;
  title: string;
  motto?: { en: string; ta: string };
  body: { en: string; ta: string };
  refs: string[];
};

/**
 * The DMK's Five Great Declarations (ஐம்பெரும் முழக்கங்கள்), proclaimed by
 * Karunanidhi and recorded verbatim in the memoir at V2·ch29 — his final
 * address at a February 22, 1970 Trichy conference. The canonical five, in his
 * exact numbered words.
 */
export const declarations: Principle[] = [
  {
    id: "d1",
    tamil: "அண்ணா வழியில் அயராது உழைப்போம்",
    title: "We will toil tirelessly along Anna's path",
    body: {
      en: "The first declaration: to labour without rest along the path Anna set — loyalty to the founder's road as the movement's first commitment.",
      ta: "முதல் முழக்கம்: அண்ணா அமைத்த வழியில் ஓய்வின்றி உழைப்பது — நிறுவனத் தலைவரின் பாதைக்கு விசுவாசமே இயக்கத்தின் முதல் உறுதிமொழி.",
    },
    refs: ["v2-ch29"],
  },
  {
    id: "d2",
    tamil: "ஆதிக்கமற்ற சமுதாயம் அமைத்தே தீருவோம்",
    title: "We will surely build a society without domination",
    body: {
      en: "The second: to build, without fail, a society free of domination — no caste or class holding power over another. The casteless, equitable order as a vow.",
      ta: "இரண்டாவது: எந்தச் சாதியோ வர்க்கமோ மற்றொன்றின் மேல் ஆதிக்கம் செலுத்தாத, ஆதிக்கமற்ற சமுதாயத்தைத் தவறாமல் அமைப்பது. சாதியற்ற, சமத்துவ அமைப்பே சபதம்.",
    },
    refs: ["v2-ch29"],
  },
  {
    id: "d3",
    tamil: "இந்தித் திணிப்பை என்றும் எதிர்ப்போம்",
    title: "We will forever oppose the imposition of Hindi",
    body: {
      en: "The third: to oppose, for all time, the imposition of Hindi — the language cause that first brought a schoolboy to the movement, made a permanent principle.",
      ta: "மூன்றாவது: இந்தித் திணிப்பை என்றென்றும் எதிர்ப்பது — ஒரு பள்ளிச் சிறுவனை முதலில் இயக்கத்திற்கு அழைத்த மொழிப் போராட்டம், நிரந்தரக் கொள்கையாக்கப்பட்டது.",
    },
    refs: ["v2-ch29"],
  },
  {
    id: "d4",
    tamil: "வன்முறை தவிர்த்து வறுமையை வெல்வோம்",
    title: "Shunning violence, we will conquer poverty",
    body: {
      en: "The fourth: to defeat poverty while shunning violence — economic upliftment of the common people by peaceful, democratic means. Equality without bloodshed.",
      ta: "நான்காவது: வன்முறையைத் தவிர்த்து வறுமையை வெல்வது — அமைதி வழியில், ஜனநாயக முறையில் சாதாரண மக்களின் பொருளாதார முன்னேற்றம். இரத்தம் சிந்தாத சமத்துவம்.",
    },
    refs: ["v2-ch29"],
  },
  {
    id: "d5",
    tamil: "மாநிலத்தில் சுயாட்சி, மத்தியில் கூட்டாட்சி",
    title: "Autonomy in the states, federalism at the centre",
    body: {
      en: "The fifth: to establish self-rule in the states and true federalism at the centre — the constitutional heart of the movement, later carried into the 1974 Rajamannar resolution.",
      ta: "ஐந்தாவது: மாநிலத்தில் சுயாட்சியையும் மத்தியில் உண்மையான கூட்டாட்சியையும் நிலைநாட்டுவது — இயக்கத்தின் அரசியலமைப்பு மையம், பின்னர் 1974 இராஜமன்னார் தீர்மானத்தில் கொண்டுசெல்லப்பட்டது.",
    },
    refs: ["v2-ch29", "v2-ch26"],
  },
];

/**
 * The deeper founding principles the declarations rest on — roots in Periyar's
 * movement, verified elsewhere in the memoir.
 */
export const principles: Principle[] = [
  {
    id: "three-cs",
    tamil: "கடமை · கண்ணியம் · கட்டுப்பாடு",
    title: "Duty, Dignity, Discipline",
    motto: { en: "Duty · Dignity · Discipline", ta: "கடமை · கண்ணியம் · கட்டுப்பாடு" },
    body: {
      en: "Anna's guiding code for the cadre — carried, the memoir says, like the three stripes on the squirrel's back: wherever he is, the three words duty, dignity and discipline sound within him. Ethical conduct as the movement's discipline.",
      ta: "கழகத் தொண்டர்களுக்கு அண்ணா அளித்த வழிக்கோடு — அணிலின் முதுகில் உள்ள மூன்று கோடுகள் போல், 'நான் எங்கிருந்தாலும் கடமை–கண்ணியம்–கட்டுப்பாடு என்னும் மூன்று சொற்கள் என் உள்ளத்தில் முழங்கும்' என்கிறார் நினைவேடு. ஒழுக்கமே இயக்கத்தின் கட்டுப்பாடு.",
    },
    refs: ["v1-ch110", "v1-ch137"],
  },
  {
    id: "one-clan",
    tamil: "ஒன்றே குலம், ஒருவனே தேவன்",
    title: "One clan, one God",
    motto: { en: "One clan, one God", ta: "ஒன்றே குலம், ஒருவனே தேவன்" },
    body: {
      en: "Thirumular's line, which Anna raised again and again — named in the memoir explicitly as 'the policy of the DMK.' A creed of human oneness beneath the differences of caste and creed.",
      ta: "திருமூலரின் வாக்கு, அண்ணா திரும்பத் திரும்ப எடுத்துக்காட்டியது — 'தி.மு.கழகத்தின் கொள்கை' என்று நினைவேட்டில் வெளிப்படையாகப் பெயரிடப்பட்டது. சாதி–சமய வேறுபாடுகளுக்கு அடியில் மனித ஒருமையின் நம்பிக்கை.",
    },
    refs: ["v2-ch13", "v2-ch36"],
  },
  {
    id: "self-respect",
    tamil: "சுயமரியாதை · பகுத்தறிவு",
    title: "Self-respect & rationalism",
    body: {
      en: "The root: Periyar's Self-Respect Movement, begun 1926, spreading rationalism through Kudi Arasu. Anti-superstition, anti-caste, the reasoning habit — the ideological soil from which the whole movement grew.",
      ta: "வேர்: 1926-இல் தொடங்கிய பெரியாரின் சுயமரியாதை இயக்கம், 'குடியரசு' வழி பகுத்தறிவைப் பரப்பியது. மூடநம்பிக்கை எதிர்ப்பு, சாதி எதிர்ப்பு, சிந்தனைப் பழக்கம் — இயக்கம் முழுவதும் வளர்ந்த கருத்தியல் மண்.",
    },
    refs: ["v1-ch04"],
  },
  {
    id: "equal-society",
    tamil: "சமத்துவ சமுதாயம்",
    title: "A casteless, classless society",
    body: {
      en: "The stated goal, in his own words: to build 'a society without distinction of caste or creed.' He carries the aim, he writes, 'in the cells of my being' — from the screen dialogues attacking caste cruelty to the oath of office itself.",
      ta: "அவரது சொற்களிலேயே சொல்லப்பட்ட இலக்கு: 'சாதி, சமய வேறுபாடற்ற சமத்துவ சமுதாயத்தை' உருவாக்குவது. 'உயிரணுக்களில் சுமந்து' அந்த ஆவலைக் கொண்டு செல்கிறார் — சாதிக் கொடுமையைக் கண்டித்த திரை உரையாடல்கள் முதல் பதவியேற்பு உறுதிமொழி வரை.",
    },
    refs: ["v4-ch10", "v5-ch24"],
  },
  {
    id: "tamil-identity",
    tamil: "தமிழ் · திராவிட அடையாளம்",
    title: "Tamil identity & language",
    body: {
      en: "Opposition to Hindi imposition runs from the 1938 agitation onward; the defence and promotion of Tamil language, culture and literature became the movement's most visible cause — broadening from 'Dravidian' toward Tamil pride.",
      ta: "இந்தித் திணிப்புக்கு எதிர்ப்பு 1938 போராட்டம் முதல் தொடர்கிறது; தமிழ் மொழி, பண்பாடு, இலக்கியத்தின் காப்பும் வளர்ப்பும் இயக்கத்தின் மிகத் தெரிந்த நோக்கமாயிற்று — 'திராவிட'த்திலிருந்து தமிழ்ப் பெருமிதம் நோக்கி விரிந்தது.",
    },
    refs: ["v1-ch05"],
  },
  {
    id: "autonomy-federal",
    tamil: "மாநில சுயாட்சி · கூட்டாட்சி",
    title: "Federalism & state autonomy",
    body: {
      en: "Greater powers to the states, decentralisation from the Union — an argument the memoir traces from the earliest constitutional debates to the 1974 Rajamannar resolution. The separate Dravida Nadu demand was pragmatically dropped: 'it is true we asked for it; it has now been given up.'",
      ta: "மாநிலங்களுக்கு அதிக அதிகாரம், ஒன்றியத்திலிருந்து பரவலாக்கம் — ஆரம்ப அரசியலமைப்பு விவாதங்கள் முதல் 1974 இராஜமன்னார் தீர்மானம் வரை நினைவேடு தொடரும் வாதம். தனி திராவிட நாடு கோரிக்கை நடைமுறை நோக்கில் கைவிடப்பட்டது: 'கேட்டது உண்மை; அது இப்போது கைவிடப்பட்டுவிட்டது.'",
    },
    refs: ["v1-ch116", "v1-ch118"],
  },
];
