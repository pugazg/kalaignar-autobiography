export type Quote = {
  tamil: string; // brief excerpt, verified verbatim against the source text
  english: string; // original English rendering
  context: string;
  ref: string; // chapter id
};

/**
 * Curated quotations from Nenjukku Neethi, Volume 1.
 * Each entry was verified against the source text at the cited chapter.
 * Excerpts are deliberately brief; the chapter reference leads to the full passage.
 */
export const quotes: Quote[] = [
  {
    tamil: "பெரிய மனிதர்களுக்குத்தான் வாழ்க்கையும் வரலாறும் சொந்தமா? சின்னவர்களுக்குக் கிடையாதா?",
    english: "Do life and history belong only to the great? Do the small not own them too?",
    context: "The question that gave him the nerve to write the memoir at all.",
    ref: "v1-ch01",
  },
  {
    tamil: "போய் வருகிறேன் என்றாள் என் பத்மா",
    english: "“I’ll be going,” said my Padma.",
    context: "The chapter title carrying the loss of his young wife, 1948.",
    ref: "v1-ch20",
  },
  {
    tamil: "நாங்கள் அங்கே ஒரு புதிய ராஜ்யத்தை அமைத்து விட்டோம்.",
    english: "We had built a new republic in there.",
    context: "On the self-governing world the movement's prisoners made of Trichy Central Jail, 1953.",
    ref: "v1-ch46",
  },
  {
    tamil: "நண்பர்கள் முகங்காண முடியாவிட்டால் — நாளைக் கடத்திடவே முடியாமல் தவியாய்த் தவிப்பேன்.",
    english: "I can go hungry; what I cannot survive is a day without seeing my friends' faces.",
    context: "On the hardest deprivation of Palayamkottai jail, 1965.",
    ref: "v1-ch110",
  },
  {
    tamil: "கலை - அரசியல் - இரண்டையுமே என் இரு கண்களாகக் கருதுபவன்தான் நான்.",
    english: "Art and politics — I hold them both as my two eyes.",
    context: "His settled answer to a lifetime of being asked to choose.",
    ref: "v1-ch87",
  },
  {
    tamil: "என்னைக் கைது செய்து, என் மீது வழக்குப் போடும் நன்னாளை நான் ஆவலுடன் எதிர்பார்க்கிறேன்!",
    english: "I eagerly await the fine day they arrest me and put me on trial!",
    context: "To reporters, on the eve of the 1967 election — the arrest never came; the government fell instead.",
    ref: "v1-ch128",
  },
  {
    tamil: "இந்த வெற்றியை நான் இப்போது அதிக ஆர்ப்பாட்டத்துடன் கொண்டாடினால் வெற்றிவாய்ப்பை இழந்தவர்கட்கு மனம் புண்படும்.",
    english: "If I celebrate this victory with fanfare now, it will wound those who lost.",
    context: "Asking his supporters at Saidapet to disperse quietly, February 23, 1967.",
    ref: "v1-ch128",
  },
  {
    tamil: "இதயத்தைத் தந்திடு, அண்ணா!",
    english: "Give me your heart, Anna!",
    context: "The cry that titles the volume's final chapter, February 1969.",
    ref: "v1-ch140",
  },
];
