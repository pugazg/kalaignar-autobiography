export type Person = {
  id: string;
  tamil: string;
  name: string;
  role: string;
  relationship: string; // grounded in the memoir's own account
  firstAppears: string;
  refs: string[]; // chapter ids already verified elsewhere on this site
};

/**
 * The People layer of the archive. Entries are deliberately limited to figures
 * whose presence in the memoir is already verified by citations used on this
 * site; each profile links back to those chapters. Extend by adding entries
 * whose refs have been checked against the source text.
 */
export const people: Person[] = [
  {
    id: "parents",
    tamil: "முத்துவேலர் · அஞ்சுகத்தம்மை",
    name: "Muthuvelar & Anjugathammai",
    role: "His parents",
    relationship:
      "The farmer-poet father and the mother of the Thirukkuvalai household where the story begins. Volume 4's preface returns to them by name — the 'ordinary family' from which a student of Periyar and a brother to Anna came, 'never even dreamed of.'",
    firstAppears: "Volume 1, the opening chapters",
    refs: ["v1-ch01", "v1-ch02", "v4-ch02"],
  },
  {
    id: "padma",
    tamil: "பத்மா",
    name: "Padma (Padmavathi)",
    role: "His first wife",
    relationship:
      "Married young, lost young. The chapter that carries her death in 1948 is titled with her own parting words — '\u201cI'll be going,\u201d said my Padma' — one of the most personal pages in six volumes.",
    firstAppears: "Volume 1, chapter 20",
    refs: ["v1-ch20"],
  },
  {
    id: "periyar",
    tamil: "பெரியார்",
    name: "Periyar E. V. Ramasamy",
    role: "The mentor",
    relationship:
      "'Student to Periyar' is how the author names himself in Volume 4's preface — the rationalist patriarch whose self-respect movement gave a Thirukkuvalai schoolboy his cause, his platform, and his lifelong habit of questioning.",
    firstAppears: "Volume 1, the movement chapters",
    refs: ["v1-ch34", "v4-ch02"],
  },
  {
    id: "anna",
    tamil: "அறிஞர் அண்ணா",
    name: "C. N. Annadurai (Anna)",
    role: "The elder brother",
    relationship:
      "Leader, teacher, and the loss the whole arc bends around. Volume 1 closes crying 'Give me your heart, Anna!'; Volume 3 opens repeating that at every step 'Anna's memory is the staff that steadies me'; and decades later he is still defending the statues Anna raised on the Marina in 1968.",
    firstAppears: "Volume 1; mourned at its close, February 1969",
    refs: ["v1-ch140", "v3-ch01", "v6-ch19"],
  },
  {
    id: "rajaji",
    tamil: "ராஜாஜி",
    name: "C. Rajagopalachari (Rajaji)",
    role: "The first great adversary",
    relationship:
      "The Congress statesman whose governments the young movement defined itself against — it was under his 1950s ministry that the Kallakudi struggle of 1953 made a 29-year-old famous, and a prisoner.",
    firstAppears: "Volume 1, the agitation years",
    refs: ["v1-ch43"],
  },
  {
    id: "kamaraj",
    tamil: "காமராஜர்",
    name: "K. Kamaraj",
    role: "The rival he mourned",
    relationship:
      "The Congress titan the DMK defeated in 1967 — and honoured in grief in 1975. Volume 2 gives his death chapters titled 'the tears and the seashore vow' and 'the duty-hero and the karma-hero have passed'; the Kazhagam's homage to a rival it never stopped respecting.",
    firstAppears: "Volume 1; his passing fills Volume 2's late chapters",
    refs: ["v2-ch61", "v2-ch63", "v3-ch09"],
  },
  {
    id: "sivaji",
    tamil: "சிவாஜி கணேசன்",
    name: "Sivaji Ganesan",
    role: "The movement's first screen voice",
    relationship:
      "The actor whose delivery carried the movement's scripts to lakhs — Volume 2 even titles a chapter 'Sivaji in the movement.' The pen and the voice: the partnership behind 'art and politics as my two eyes.'",
    firstAppears: "Volume 1, the screen years",
    refs: ["v1-ch87", "v2-ch14"],
  },
  {
    id: "mgr",
    tamil: "எம்.ஜி.ஆர்.",
    name: "M. G. Ramachandran (MGR)",
    role: "Comrade, then rival of a lifetime",
    relationship:
      "The matinee idol whose 1972 expulsion — 'there was no other way; he was removed,' after the chapter the book calls 'the beginning of betrayal' — split Tamil politics for four decades. Volume 3 records the pre-dawn news of his death reaching a train returning from Malaysia.",
    firstAppears: "Volumes 1–2; the break in October 1972",
    refs: ["v2-ch45", "v2-ch49", "v3-ch71"],
  },
  {
    id: "maran",
    tamil: "முரசொலி மாறன்",
    name: "Murasoli Maran",
    role: "Nephew, editor, Union minister",
    relationship:
      "The comrade of the Murasoli years who carried the movement's case to Delhi as a Union minister — working through a failing heart. Volume 6's most personal chapter is his memorial: 'the never-forgettable Maran.'",
    firstAppears: "The Murasoli years; memorialised in Volume 6",
    refs: ["v6-ch26"],
  },
  {
    id: "stalin",
    tamil: "மு.க. ஸ்டாலின்",
    name: "M. K. Stalin",
    role: "Son and successor-in-training",
    relationship:
      "First met in these pages as the recipient of a letter from an Emergency prison; then Mayor of a Chennai being rebuilt in Volume 5; and by Volume 6's close, among the movement's new deputy general secretaries as its machinery is readied for what came next.",
    firstAppears: "Volume 3, the prison letter",
    refs: ["v3-ch30", "v5-ch11", "v6-ch29"],
  },
];

export const personById = new Map(people.map((p) => [p.id, p]));
