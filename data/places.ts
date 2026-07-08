export type Place = {
  id: string;
  tamil: string;
  name: string;
  note: string; // one grounded line
  refs: string[];
  x: number; // real coordinates in the TN map viewBox (0 0 1640 2032)
  y: number;
};

/** The geography of the memoir. Positions are schematic, not cartographic. */
export const places: Place[] = [
  {
    id: "thirukkuvalai",
    tamil: "திருக்குவளை",
    name: "Thirukkuvalai",
    note: "The delta village where the story begins, 1924 — the 'ordinary family' of the Volume 4 preface.",
    refs: ["v1-ch01", "v4-ch02"],
    x: 1320, y: 1120,
  },
  {
    id: "tiruvarur",
    tamil: "திருவாரூர்",
    name: "Tiruvarur",
    note: "Schooling that ended early — the movement became the university instead.",
    refs: ["v1-ch04"],
    x: 1290, y: 1090,
  },
  {
    id: "kallakudi",
    tamil: "கல்லக்குடி",
    name: "Kallakudi",
    note: "The 1953 struggle that made a 29-year-old famous — and a prisoner of the cause.",
    refs: ["v1-ch43"],
    x: 980, y: 1060,
  },
  {
    id: "trichy",
    tamil: "திருச்சி",
    name: "Tiruchirappalli",
    note: "Central Jail, 1953 — where the prisoners 'built a new republic in there.'",
    refs: ["v1-ch46"],
    x: 980, y: 980,
  },
  {
    id: "palayamkottai",
    tamil: "பாளையங்கோட்டை",
    name: "Palayamkottai",
    note: "The 1965 imprisonment — hunger bearable, a day without friends' faces not.",
    refs: ["v1-ch110"],
    x: 590, y: 1720,
  },
  {
    id: "saidapet",
    tamil: "சைதாப்பேட்டை",
    name: "Saidapet",
    note: "The constituency of February 1967 — victory received without gloating, at his own insistence.",
    refs: ["v1-ch128"],
    x: 1430, y: 230,
  },
  {
    id: "chennai",
    tamil: "சென்னை",
    name: "Chennai (Madras)",
    note: "Fort St. George, the Marina, Anna Arivalayam, Valluvar Kottam — the capital of the whole arc.",
    refs: ["v2-ch66", "v5-ch01", "v6-ch19"],
    x: 1450, y: 210,
  },
  {
    id: "appakoodal",
    tamil: "ஆப்பக்கூடல்",
    name: "Appakoodal",
    note: "April 7, 1969 — pulled from a collapsed pandal in the dark, days into the chief ministership.",
    refs: ["v2-ch12"],
    x: 520, y: 800,
  },
  {
    id: "kanyakumari",
    tamil: "கன்னியாகுமரி",
    name: "Kanyakumari",
    note: "The 'sky-touching' Thiruvalluvar statue rising where the three seas meet.",
    refs: ["v5-ch33"],
    x: 520, y: 1950,
  },
  {
    id: "sriperumbudur",
    tamil: "ஸ்ரீபெரும்புதூர்",
    name: "Sriperumbudur",
    note: "The night of May 21, 1991 — 'the unexpected murder' that reshaped everything.",
    refs: ["v4-ch13"],
    x: 1370, y: 240,
  },
];

export const placeById = new Map(places.map((p) => [p.id, p]));
