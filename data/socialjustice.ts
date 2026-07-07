export type ReservationStep = {
  year: string;
  label: { en: string; ta: string };
  detail: { en: string; ta: string };
  refs: string[]; // empty = post-memoir, shown without VN·NN citation
  inMemoir: boolean;
};

/** The reservation arc as the memoir documents it. Pre-2005 steps are
 *  chapter-cited; post-2005 steps are shown as context, clearly uncited. */
export const reservationArc: ReservationStep[] = [
  {
    year: "1969–71",
    label: { en: "BC 25% → 31%, SC 16% → 18%", ta: "பிற்படுத்தப்பட்டோர் 25%→31%, ஆதிதிராவிடர் 16%→18%" },
    detail: {
      en: "His first government raised the backward-classes quota from 25% to 31% and the Adi Dravidar quota from 16% to 18% — orders he records by name.",
      ta: "அவரது முதல் அரசு பிற்படுத்தப்பட்டோர் ஒதுக்கீட்டை 25%-இலிருந்து 31% ஆகவும், ஆதிதிராவிடர் ஒதுக்கீட்டை 16%-இலிருந்து 18% ஆகவும் உயர்த்தியது — பெயர் சொல்லிப் பதிவு செய்யும் ஆணைகள்.",
    },
    refs: ["v2-ch26", "v2-ch55"],
    inMemoir: true,
  },
  {
    year: "1989",
    label: { en: "20% MBC quota", ta: "20% மிகவும் பிற்படுத்தப்பட்டோர்" },
    detail: {
      en: "The third-term government created a separate 20% reservation for the Most Backward Classes — a whole chapter records the demand and the decision.",
      ta: "மூன்றாம் ஆட்சி மிகவும் பிற்படுத்தப்பட்டோருக்குத் தனி 20% ஒதுக்கீடு உருவாக்கியது — கோரிக்கையையும் முடிவையும் ஒரு முழு அத்தியாயம் பதிவு செய்கிறது.",
    },
    refs: ["v4-ch02", "v4-ch03"],
    inMemoir: true,
  },
  {
    year: "1990s",
    label: { en: "Defending the 69% total", ta: "69% மொத்த ஒதுக்கீட்டைக் காத்தல்" },
    detail: {
      en: "The Thanjavur resolution to protect Tamil Nadu's 69% total reservation against the Supreme Court's 50% ceiling — the fight to keep the state's quota intact.",
      ta: "உச்சநீதிமன்றத்தின் 50% வரம்புக்கு எதிராகத் தமிழகத்தின் 69% மொத்த ஒதுக்கீட்டைக் காக்கத் தஞ்சைத் தீர்மானம் — மாநிலத்தின் ஒதுக்கீட்டை அப்படியே காக்கும் போராட்டம்.",
    },
    refs: ["v4-ch06", "v4-ch19"],
    inMemoir: true,
  },
  {
    year: "1999",
    label: { en: "Arunthathiyar advocacy", ta: "அருந்ததியர் நலன்" },
    detail: {
      en: "'Unbelievable, but it happened!' — the chapter (dated 23.2.1999) recording his advocacy for reservation for the Arunthathiyar community, among the most oppressed.",
      ta: "'நம்ப முடியாதது; ஆனால் நடந்தது!' — மிகவும் ஒடுக்கப்பட்ட அருந்ததியர் சமுதாயத்திற்கான ஒதுக்கீட்டுக்காக அவர் பாடுபட்டதைப் பதிவுசெய்யும் (23.2.1999) அத்தியாயம்.",
    },
    refs: ["v5-ch47"],
    inMemoir: true,
  },
  {
    year: "2007–09",
    label: { en: "Muslim, Christian & Arunthathiyar quotas", ta: "முஸ்லிம், கிறிஸ்தவ, அருந்ததியர் ஒதுக்கீடு" },
    detail: {
      en: "Later sub-quotas for Muslims and Christians (2007) and a dedicated Arunthathiyar quota within the SC share (2009) came after the memoir's timeline — context beyond the six volumes.",
      ta: "முஸ்லிம், கிறிஸ்தவர்களுக்கான உட்-ஒதுக்கீடுகள் (2007), ஆதிதிராவிடர் பங்கிற்குள் தனி அருந்ததியர் ஒதுக்கீடு (2009) — நினைவேட்டின் காலவரிசைக்குப் பின், ஆறு தொகுதிகளுக்கு அப்பாற்பட்ட பின்னணி.",
    },
    refs: [],
    inMemoir: false,
  },
];

/** Social justice as more than reservation — the interlocking pillars. */
export const justicePillars: { id: string; tamil: string; title: string; note: { en: string; ta: string }; refs: string[] }[] = [
  {
    id: "reservation", tamil: "இட ஒதுக்கீடு", title: "Reservation",
    note: { en: "Quotas raised, extended and defended term after term — from BC and SC in 1969 to MBC and Arunthathiyar later.", ta: "ஆட்சிக்கு ஆட்சி உயர்த்தி, நீட்டித்து, காக்கப்பட்ட ஒதுக்கீடு — 1969 பிற்படுத்தப்பட்டோர், ஆதிதிராவிடர் முதல் பிற்காலத்தில் எம்.பி.சி., அருந்ததியர் வரை." },
    refs: ["v2-ch26", "v4-ch02"],
  },
  {
    id: "welfare", tamil: "நலன் + ஒதுக்கீடு", title: "Reservation joined to welfare",
    note: { en: "Quotas paired with free education, colony electrification and first-graduate support — access made real, not merely legal.", ta: "இலவசக் கல்வி, காலனி மின்மயமாக்கல், முதல் பட்டதாரி ஊக்கத்துடன் இணைந்த ஒதுக்கீடு — உரிமை சட்டத்தில் மட்டுமல்ல, நடைமுறையிலும்." },
    refs: ["v3-ch73", "v4-ch04"],
  },
  {
    id: "identity", tamil: "தமிழ் அடையாளம்", title: "Tamil identity",
    note: { en: "Social justice inseparable from Tamil self-respect — the anti-caste cause and the language cause as one movement.", ta: "தமிழ்ச் சுயமரியாதையிலிருந்து பிரிக்க முடியாத சமூக நீதி — சாதி எதிர்ப்பும் மொழி நோக்கும் ஒரே இயக்கம்." },
    refs: ["v1-ch04"],
  },
  {
    id: "women", tamil: "பெண்கள் உரிமை", title: "Women's empowerment",
    note: { en: "Equal property rights, free degree education for women, the women's police force — justice extended across gender.", ta: "சம சொத்துரிமை, பெண்களுக்கு இலவசப் பட்டப்படிப்பு, பெண் போலீஸ் படை — பாலினம் கடந்து நீட்டிக்கப்பட்ட நீதி." },
    refs: ["v5-ch22", "v4-ch04"],
  },
  {
    id: "priesthood", tamil: "அர்ச்சகர் உரிமை", title: "Temple priesthood for all",
    note: { en: "The Archakas Act opening temple priesthood to every caste — dismantling ritual hierarchy itself.", ta: "எல்லாச் சாதிக்கும் அர்ச்சகர் உரிமையைத் திறந்த சட்டம் — சடங்குப் படிநிலையையே தகர்த்தது." },
    refs: ["v2-ch28"],
  },
  {
    id: "samathuvapuram", tamil: "சமத்துவபுரம்", title: "Samathuvapuram",
    note: { en: "Equality villages where caste has no address — social justice built into the very geography of settlement.", ta: "சாதிக்கு முகவரியில்லாத சமத்துவ ஊர்கள் — குடியிருப்பின் நிலவியலிலேயே கட்டமைக்கப்பட்ட சமூக நீதி." },
    refs: ["v5-ch27"],
  },
];
