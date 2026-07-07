export type EelamEntry = {
  id: string;
  year: string;
  title: { en: string; ta: string };
  note: { en: string; ta: string };
  refs: string[];
};

/** The Eelam / Sri Lankan Tamil question — one of the memoir's deepest threads,
 *  spanning all six volumes. Every entry verified against the chapter text. */
export const eelamThread: EelamEntry[] = [
  {
    id: "chelva",
    year: "1977",
    title: { en: "Mourning Chelvanayakam", ta: "செல்வநாயகம் இழப்பு" },
    note: {
      en: "The Eelam chapters open with his Murasoli letter of 28 April 1977 on the death of S.J.V. Chelvanayakam — 'the peerless treasure of the Lankan Tamils,' the father of their rights struggle.",
      ta: "ஈழ அத்தியாயங்கள், 1977 ஏப்ரல் 28 அன்று எழுதிய முரசொலிக் கடிதத்துடன் தொடங்குகின்றன — ஈழத் தமிழர் தந்தை செல்வநாயகத்தின் மறைவு குறித்து, 'இலங்கைத் தமிழரின் இணையற்ற செல்வம்' என்று.",
    },
    refs: ["v3-ch17"],
  },
  {
    id: "spark",
    year: "1980s",
    title: { en: "The spark in Sri Lanka", ta: "இலங்கையில் தீப்பொறி" },
    note: {
      en: "The chapter 'The spark in Sri Lanka' tracks the crisis igniting — the ethnic conflict deepening and Tamil Nadu's politics binding ever tighter to the island's Tamils.",
      ta: "'இலங்கையில் தீப்பொறி' அத்தியாயம், நெருக்கடி பற்றி எரிவதைத் தொடர்கிறது — இனமோதல் ஆழமடைய, தமிழக அரசியல் தீவின் தமிழருடன் இன்னும் இறுக்கமாகப் பிணைகிறது.",
    },
    refs: ["v3-ch26"],
  },
  {
    id: "kazhagam",
    year: "1980s",
    title: { en: "The Kazhagam's involvement", ta: "கழகத்தின் ஈடுபாடு" },
    note: {
      en: "'The Kazhagam's involvement in the Eelam question' sets out the DMK's position — solidarity with the Eelam Tamils' cause as a defining stance of the party.",
      ta: "'ஈழப் பிரச்சினையில் கழகத்தின் ஈடுபாடு' தி.மு.க.வின் நிலைப்பாட்டை விளக்குகிறது — ஈழத் தமிழரின் நோக்குடன் ஒற்றுமை, கட்சியின் அடையாள நிலைப்பாடாக.",
    },
    refs: ["v3-ch56"],
  },
  {
    id: "rights-war",
    year: "1980s",
    title: { en: "The Eelam Tamils' rights struggle", ta: "ஈழத்தமிழர் உரிமைப்போர்" },
    note: {
      en: "The agitations for the Eelam Tamils — how he framed the issue consistently as a rights struggle (உரிமைப்போர்), mobilising Tamil Nadu behind the cause.",
      ta: "ஈழத் தமிழருக்கான போராட்டங்கள் — அதைத் தொடர்ந்து உரிமைப்போராகவே முன்வைத்து, தமிழகத்தை அந்த நோக்கின் பின் திரட்டியது.",
    },
    refs: ["v3-ch67"],
  },
  {
    id: "ipkf",
    year: "1987",
    title: { en: "The Indian Peace Keeping Force", ta: "இந்திய அமைதிப் படை" },
    note: {
      en: "'The Indian Peace Force that went to Sri Lanka' opens with a stark account of the Sri Lankan army's atrocities in Amparai district — the human cost that framed his view of the accord and the IPKF.",
      ta: "'இலங்கை சென்ற இந்திய அமைதிப்படை' அம்பாறை மாவட்டத்தில் சிங்கள இராணுவத்தின் கொடுமைகளின் கடும் விவரிப்புடன் தொடங்குகிறது — ஒப்பந்தத்தையும் அமைதிப் படையையும் அவர் பார்த்த விதத்தை வடிவமைத்த மனிதத் துயரம்.",
    },
    refs: ["v3-ch69"],
  },
  {
    id: "settlement",
    year: "1990s",
    title: { en: "A negotiated settlement", ta: "பேச்சுவார்த்தைத் தீர்வு" },
    note: {
      en: "In the later volumes he returns to the India–Sri Lanka Accord as the framework for a peaceful settlement — the constitutional politician urging negotiation even as the LTTE era complicates the ground.",
      ta: "பிந்தைய தொகுதிகளில், அமைதியான தீர்வுக்கான கட்டமைப்பாக இந்திய–இலங்கை ஒப்பந்தத்திற்குத் திரும்புகிறார் — புலிகளின் காலம் நிலத்தைச் சிக்கலாக்கும்போதும், பேச்சுவார்த்தையை வலியுறுத்தும் அரசியல்வாதி.",
    },
    refs: ["v4-ch13", "v5-ch15"],
  },
];
