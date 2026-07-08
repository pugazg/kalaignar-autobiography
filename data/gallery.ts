export type GalleryItem = {
  src: string;
  title: { en: string; ta: string };
  caption: { en: string; ta: string };
  // Archival provenance — present only for real catalogued images.
  archival?: {
    accession: string;
    source: string;      // holding institution
    citation: string;    // as supplied by the archive
    rights: string;      // rights note
  };
  refs?: string[];       // chapter link, when the moment appears in the memoir
};

/**
 * The gallery holds two kinds of image:
 *  1. Real archival photographs, each with full provenance (accession number,
 *     holding institution, citation) — displayed the way a museum catalogues them.
 *  2. Original illustrative placeholders (SVG) for eras where no rights-cleared
 *     photograph is yet available.
 * Only images with clear provenance or original artwork are shown.
 */
export const gallery: GalleryItem[] = [
  {
    src: "/images/TVA_PHO_000025.jpg",
    title: {
      en: "Kalaignar with Arignar Anna",
      ta: "அறிஞர் அண்ணாவுடன் கலைஞர் மு. கருணாநிதி",
    },
    caption: {
      en: "Karunanidhi presenting a commemorative gift to Arignar Anna — the elder brother and leader the whole memoir bends around.",
      ta: "அறிஞர் அண்ணாவுக்கு நினைவுப்பரிசு வழங்கும் கலைஞர் மு. கருணாநிதி — நினைவேடு முழுவதும் சுற்றி வளையும் அண்ணனும் தலைவரும்.",
    },
    archival: {
      accession: "TVA_TVA_PHO_000025",
      source: "Tamil Nadu State Archives, Chennai (via Saraswathi Mahal Library, Thanjavur)",
      citation: "சரசுவதி மகால் நூலகம், தஞ்சாவூர், 2008.",
      rights: "Government archival photograph — displayed with attribution for educational, non-commercial use.",
    },
    refs: ["v1-ch140", "v3-ch01"],
  },
  {
    src: "/placeholders/delta.svg",
    title: { en: "Thirukkuvalai, 1924", ta: "திருக்குவளை, 1924" },
    caption: {
      en: "A Cauvery-delta village childhood — paddy, palm and a poet-farmer's songs.",
      ta: "காவிரி டெல்டா கிராமக் குழந்தைப் பருவம் — நெல், பனை, ஒரு கவிஞர்-உழவனின் பாடல்கள்.",
    },
  },
  {
    src: "/placeholders/leaflet.svg",
    title: { en: "The leaflet years", ta: "துண்டறிக்கை ஆண்டுகள்" },
    caption: {
      en: "Manava Nesan and Murasoli: from handwritten paper to the movement's voice.",
      ta: "மாணவ நேசனும் முரசொலியும்: கையெழுத்துத் தாளிலிருந்து இயக்கத்தின் குரலாக.",
    },
  },
  {
    src: "/placeholders/reel.svg",
    title: { en: "The screen as pulpit", ta: "மேடையான திரை" },
    caption: {
      en: "Rajakumari to Parasakthi — dialogue that filled theatres for a hundred days.",
      ta: "ராஜகுமாரி முதல் பராசக்தி வரை — நூறு நாள் அரங்குகளை நிரப்பிய வசனம்.",
    },
  },
  {
    src: "/placeholders/gate.svg",
    title: { en: "Prison gates", ta: "சிறை வாயில்கள்" },
    caption: {
      en: "Trichy 1953 and 1962, Palayamkottai 1965 — a 'new republic' behind walls.",
      ta: "திருச்சி 1953, 1962, பாளையங்கோட்டை 1965 — சுவர்களுக்குள் ஒரு 'புதிய ராஜ்யம்'.",
    },
  },
  {
    src: "/placeholders/assembly.svg",
    title: { en: "Fifteen in the House", ta: "அவையில் பதினைவர்" },
    caption: {
      en: "1957: fifteen DMK members face a hundred and fifty — and refuse to be small.",
      ta: "1957: நூற்றைம்பது பேருக்கு எதிரே பதினைந்து தி.மு.க. உறுப்பினர்கள் — சிறியவராக மறுத்தவர்கள்.",
    },
  },
  {
    src: "/placeholders/dawn.svg",
    title: { en: "1967: a quiet revolution", ta: "1967: ஓர் அமைதிப் புரட்சி" },
    caption: {
      en: "138 of 173 seats; a government formed; a state renamed Tamil Nadu.",
      ta: "173-இல் 138 இடங்கள்; ஆட்சி அமைப்பு; தமிழ்நாடு எனப் பெயர்மாற்றம்.",
    },
  },
];
