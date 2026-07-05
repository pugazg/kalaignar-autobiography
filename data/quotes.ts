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
  {
    tamil: "எனக்கென்று ஒரு தனி வாழ்க்கை கிடையாது. ஒரு இலட்சியத்தை மையமாகக் கொண்டு சுழலும் இயக்கத்தின் வரலாற்றில் நான் ஒரு பகுதி.",
    english: "I have no separate life of my own; I am one part of the history of a movement that turns around an ideal.",
    context: "On why an autobiography of his could only be the movement's own story.",
    ref: "v2-ch02",
  },
  {
    tamil: "\u201cஓய்வெடுக்காமல் உழைத்தவன் இதோ ஓய்வு கொண்டிருக்கிறான்\u201d என்று என் கல்லறையின் மீதுதான் எழுதப்படும்.",
    english: "It will be written only on my tomb: here rests one who laboured without rest.",
    context: "His answer, in the Volume 2 preface, to rivals who teased him to retire.",
    ref: "v2-ch01",
  },
  {
    tamil: "நான் எடுத்துவைக்கும் ஒவ்வொரு அடியின் போதும் அண்ணா அவர்களின் நினைவே எனக்கு ஊன்று கோலாய்த் துணை புரிகிறது.",
    english: "At every step I take, Anna's memory is the staff that steadies me.",
    context: "The line from Volume 1's close that he repeats at the head of Volume 3.",
    ref: "v3-ch01",
  },
  {
    tamil: "பெரியார்க்கு மாணவனாவேன்; அண்ணாவுக்குத் தம்பியாவேன் … என்று நினைத்துப் பார்த்ததுகூட இல்லை!",
    english: "That I would become a student to Periyar, a younger brother to Anna — I never even dreamed it.",
    context: "Volume 4's preface, looking back from Thirukkuvalai to everything after.",
    ref: "v4-ch02",
  },
  {
    tamil: "அந்த “லகான்” என் கையில் இல்லாமல், என் பொதுவாழ்வின் கையில் இருப்பதால்தான் ஓய்வுக்கு ஓய்வு கொடுத்து விட்டு இந்த வண்டி ஓடிக் கொண்டிருக்கிறது.",
    english: "The reins are not in my hands but in my public life's — that is why this cart runs on, giving rest itself a rest.",
    context: "Opening the fifth volume, in answer to Vairamuthu's wonder at a fifth volume at his age.",
    ref: "v5-ch01",
  },
  {
    tamil: "உயிரினும் மேலான இனிய உடன்பிறப்புக்களே என்று எல்லோரையும் எனது உடன்பிறப்புக்களாகவே கருதி — உங்களை விளித்திருக்கிறேன்.",
    english: "Siblings dearer than life itself — that is how I address you, counting every one of you as my own.",
    context: "In the final pages, refusing to greet a mixed gathering by any dividing name.",
    ref: "v6-ch29",
  },
];
