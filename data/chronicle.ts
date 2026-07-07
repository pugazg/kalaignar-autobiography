export type ChronicleStrand = {
  id: string;
  tamil: string;
  title: string;
  body: { en: string; ta: string };
  refs: string[];
};

/**
 * "More than a memoir" — the archive's own thesis: that Nenjukku Neethi is a
 * primary chronicle of the Dravidian movement. Each strand is anchored to
 * chapters already verified elsewhere on the site, so the argument is
 * documented, not merely asserted.
 */
export const chronicleStrands: ChronicleStrand[] = [
  {
    id: "ideology",
    tamil: "கருத்தியல் · பகுத்தறிவு",
    title: "Ideology & rationalism",
    body: {
      en: "The self-respect rationalism of Periyar runs beneath every volume — anti-superstition, anti-caste, the reasoning habit that turned a schoolboy into a movement. He names himself 'a student to Periyar' and carries that lens from the 1938 language struggle to the last volume.",
      ta: "பெரியாரின் சுயமரியாதைப் பகுத்தறிவு ஒவ்வொரு தொகுதிக்கும் அடியில் ஓடுகிறது — மூடநம்பிக்கை எதிர்ப்பு, சாதி எதிர்ப்பு, ஒரு பள்ளிச் சிறுவனை இயக்கமாக்கிய சிந்தனைப் பழக்கம். 'பெரியார்க்கு மாணவன்' என்று தன்னை அழைத்து, 1938 மொழிப் போர் முதல் இறுதித் தொகுதி வரை அந்தப் பார்வையைச் சுமக்கிறார்.",
    },
    refs: ["v1-ch34", "v4-ch02"],
  },
  {
    id: "creativity",
    tamil: "படைப்பாற்றல் · கலை",
    title: "Creativity as politics",
    body: {
      en: "Pen, stage and screen were never separate from the cause. From the handwritten Manavar Nesan to Parasakthi's hundred-day run, art carried rationalist argument to audiences print could not reach — 'art and politics, my two eyes.'",
      ta: "பேனா, மேடை, திரை — எதுவும் இயக்கத்திலிருந்து தனியல்ல. கையெழுத்து 'மாணவ நேசன்' முதல் 'பராசக்தி'யின் நூறு நாள் ஓட்டம் வரை, அச்சு எட்டாத பார்வையாளர்களுக்குப் பகுத்தறிவு வாதத்தைக் கலை சுமந்து சென்றது — 'கலை–அரசியல் என் இரு கண்கள்.'",
    },
    refs: ["v1-ch87", "v1-ch52"],
  },
  {
    id: "sacrifice",
    tamil: "தியாகம் · போராட்டம்",
    title: "Sacrifice & struggle",
    body: {
      en: "The movement was built in agitations and prisons — Kallakudi in 1953, the jails of 1953, 1965 and the Emergency, the midnight arrest of 2001. He treats each imprisonment not as loss but as proof of the cause, answered always with the pen.",
      ta: "போராட்டங்களிலும் சிறைகளிலும் இயக்கம் கட்டப்பட்டது — 1953 கல்லக்குடி, 1953, 1965, நெருக்கடி நிலைச் சிறைகள், 2001 நள்ளிரவுக் கைது. ஒவ்வொரு சிறைவாசத்தையும் இழப்பாக அல்ல, கொள்கையின் சான்றாகக் கருதி, எப்போதும் பேனாவால் பதிலளிக்கிறார்.",
    },
    refs: ["v1-ch43", "v1-ch46"],
  },
  {
    id: "party",
    tamil: "கழக வளர்ச்சி",
    title: "The growth of a movement",
    body: {
      en: "The autobiography is also the DMK's own biography — from Anna's 1949 founding at Robinson Park, through the 1957 debut of fifteen members, the 1967 sweep, the 1971 landslide, to five terms of government. A party's rise, told from inside.",
      ta: "இந்தச் சுயசரிதை தி.மு.க.வின் சுயசரிதையும்கூட — 1949 ராபின்சன் பூங்காவில் அண்ணாவின் தொடக்கம், 1957-இல் பதினைவர் அறிமுகம், 1967 வெற்றி, 1971 பேரலை, ஐந்து ஆட்சிக் காலங்கள் வரை. ஓர் இயக்கத்தின் எழுச்சி, உள்ளிருந்து சொல்லப்பட்டது.",
    },
    refs: ["v1-ch34", "v2-ch35"],
  },
  {
    id: "autonomy",
    tamil: "மாநில சுயாட்சி",
    title: "State autonomy & federalism",
    body: {
      en: "The constitutional argument threads through: the 1974 Rajamannar Committee resolution urging true federalism, the fight against nine-government dismissals, the long journey 'from periphery to centre' — separatist demand to indispensable coalition partner.",
      ta: "அரசியலமைப்பு வாதம் ஊடாக ஓடுகிறது: உண்மையான கூட்டாட்சியைக் கோரிய 1974 இராஜமன்னார் குழுத் தீர்மானம், ஒன்பது அரசுக் கலைப்புகளுக்கு எதிரான போராட்டம், 'விளிம்பிலிருந்து மையத்திற்கு' நீண்ட பயணம் — பிரிவினைக் கோரிக்கையிலிருந்து இன்றியமையாத கூட்டணித் தூணாக.",
    },
    refs: ["v2-ch56", "v3-ch51"],
  },
  {
    id: "justice",
    tamil: "சமூக நீதி",
    title: "Social justice",
    body: {
      en: "Reservation defended term after term; temple priesthood opened to all castes; the first Adi Dravidar High Court judge; equal property rights for women; Samathuvapuram, where caste has no address. The movement's founding purpose, enacted in law.",
      ta: "ஆட்சிக்கு ஆட்சி காக்கப்பட்ட இட ஒதுக்கீடு; எல்லாச் சாதிக்கும் திறந்த அர்ச்சகர் உரிமை; முதல் ஆதிதிராவிட உயர்நீதிமன்ற நீதிபதி; பெண்களுக்குச் சம சொத்துரிமை; சாதிக்கு முகவரியில்லாத சமத்துவபுரம். இயக்கத்தின் அடிப்படை நோக்கம், சட்டமாக்கப்பட்டது.",
    },
    refs: ["v2-ch28", "v5-ch27"],
  },
];
