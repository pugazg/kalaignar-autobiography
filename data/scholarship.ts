// Scholarship shelf — secondary academic writing ABOUT Nenjukku Neethi.
//
// IMPORTANT: this shelf is deliberately walled off from the site's VN·chNN
// citation system. Entries here are external readings of the memoir; their
// claims belong to their authors and are NOT verified against the corpus the
// way every other section is. Page references below (e.g. "II.416") are the
// papers' own citations into the printed editions, kept verbatim — they are
// not RefChips and do not link into the Reading Room.
//
// Curation policy: a paper is listed only after review. Papers whose factual
// claims substantially conflict with the memoir (e.g. items dated after 2005)
// are rejected, not listed.

export type ScholarshipItem = {
  id: string;
  author: string;
  affiliation?: string;
  title: string;
  venue: string;
  year: string;
  pages?: string;
  doi?: string;
  url: string;
  keywords?: string[];
  /** What the paper argues, in our words. */
  summary: { en: string; ta: string };
  /** The paper's own page citations into the printed volumes (verbatim, not VN·chNN). */
  memoirCites?: { en: string; ta: string };
  /** Errors we noticed while reviewing — flagged openly rather than repeated. */
  caveat?: { en: string; ta: string };
};

export const scholarship: ScholarshipItem[] = [
  {
    id: "chandran-2015",
    author: "Subramaniam Chandran",
    affiliation: "Vinayaka Missions University, Salem",
    title:
      "How Political History Is Reflected in Autobiography: Reading of Kalaignar Mu Karunanidhi's Nenjukku Needhi",
    venue: "SSRN working paper 2799068",
    year: "2015",
    pages: "6 pp.",
    doi: "10.2139/ssrn.2799068",
    url: "https://ssrn.com/abstract=2799068",
    keywords: ["Autobiography", "Dravidian Movement", "Hagiography", "Political History"],
    summary: {
      en: "A short scholarly reading of all six volumes. Chandran argues that, unlike leaders who relied on ghostwriters or hagiographers, Karunanidhi wrote his own life — and wove the political history of Tamil Nadu through it, from the Justice Party onward: the Dravidian Movement, the growth of the DMK, Tamil language and culture, social justice, constitutionalism, and state autonomy. He notes that autobiography carries both self-defence and self-denial, yet concludes that deviations from fact are “very meager” and that the work “would remain an authentic source of political history of Tamil Nadu.”",
      ta: "ஆறு தொகுதிகளையும் ஆய்வுநோக்கில் வாசிக்கும் சுருக்கமான கட்டுரை. மறைந்திருந்து எழுதுவோரையும் புகழ்மாலை எழுத்தாளர்களையும் நம்பிய தலைவர்களைப் போலல்லாமல், கருணாநிதி தம் வாழ்க்கையைத் தாமே எழுதினார் என்றும், நீதிக் கட்சி முதல் திராவிட இயக்கம், தி.மு.க.வின் வளர்ச்சி, தமிழ்மொழி–பண்பாடு, சமூக நீதி, அரசியலமைப்புவாதம், மாநில சுயாட்சி வரை தமிழ்நாட்டின் அரசியல் வரலாற்றை அதனூடே பின்னியுள்ளார் என்றும் சந்திரன் வாதிடுகிறார். சுயவரலாற்றில் தற்காப்பும் தன்மறுப்பும் இயல்பாக இருந்தாலும், உண்மையிலிருந்து விலகல்கள் “மிகக் குறைவு” என்றும், இந்நூல் “தமிழ்நாட்டு அரசியல் வரலாற்றின் நம்பகமான மூலமாக நிலைத்திருக்கும்” என்றும் முடிவு செய்கிறார்.",
    },
    memoirCites: {
      en: "The paper cites the printed editions directly, e.g. II.6; II.416 (Rajaji's “sambar and salt” remark); III.151–153; and III.602–604 (the 26-point record of the first ministry).",
      ta: "கட்டுரை அச்சுப் பதிப்புகளை நேரடியாக மேற்கோள் காட்டுகிறது — எ.கா. II.6; II.416 (ராஜாஜியின் “சாம்பாரும் உப்பும்” குறிப்பு); III.151–153; III.602–604 (முதல் அமைச்சரவையின் 26 அம்சப் பட்டியல்).",
    },
    caveat: {
      en: "One slip we noticed in review: the paper says Volume 5 was serialised in Murasoli. We flag it here rather than repeat it.",
      ta: "மதிப்பாய்வில் கண்ட ஒரு சிறு தவறு: ஐந்தாம் தொகுதி முரசொலியில் தொடராக வெளிவந்ததாகக் கட்டுரை கூறுகிறது. அதைத் திரும்பச் சொல்லாமல், இங்கே சுட்டிக்காட்டுகிறோம்.",
    },
  },
];

export const scholarshipNote = {
  en: "Entries on this shelf are external academic readings of Nenjukku Neethi. Unlike every other section of this site, their claims are their authors' own and are not verified against the corpus — so they carry no VN·chNN citation chips. Papers are listed only after review; work that substantially conflicts with the memoir is not listed.",
  ta: "இந்த அடுக்கில் உள்ளவை நெஞ்சுக்கு நீதி குறித்த வெளி ஆய்வு வாசிப்புகள். இத்தளத்தின் பிற பகுதிகள் போலன்றி, இவற்றின் கூற்றுகள் அந்தந்த ஆசிரியர்களுடையவை — மூலநூலுடன் சரிபார்க்கப்படவில்லை; எனவே VN·chNN மேற்கோள் சீட்டுகள் இங்கு இல்லை. மதிப்பாய்வுக்குப் பிறகே கட்டுரைகள் பட்டியலிடப்படுகின்றன; நினைவேட்டுடன் பெரிதும் முரண்படும் ஆக்கங்கள் சேர்க்கப்படுவதில்லை.",
};
