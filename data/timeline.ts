export type Milestone = {
  id: string;
  year: string;
  era: "Roots" | "Awakening" | "Movement" | "Struggle" | "Assembly" | "Power";
  title: string;
  summary: string;
  stat?: { value: string; label: string };
  image?: string; // path under /placeholders
  refs: string[];
};

export const eras = [
  { id: "Roots", label: "Roots", years: "1924–1936" },
  { id: "Awakening", label: "Awakening", years: "1937–1948" },
  { id: "Movement", label: "Movement", years: "1949–1956" },
  { id: "Struggle", label: "Struggle", years: "1957–1966" },
  { id: "Assembly", label: "Assembly", years: "1957–1966" },
  { id: "Power", label: "Power", years: "1967–1969" },
] as const;

export const timeline: Milestone[] = [
  {
    id: "t1924",
    year: "1924",
    era: "Roots",
    title: "Born in Thirukkuvalai",
    summary:
      "Born June 3, 1924 in the Cauvery delta village of Thirukkuvalai — a family 'not steeped in wealth, but never drowned in poverty.' His father Muthuvel, orphaned within two months of birth and raised by two village women, grew into a farmer, singer and fearless folk poet whose satirical songs villagers still sang.",
    stat: { value: "Jun 3", label: "birthday, celebrated in ch. 1" },
    image: "delta.svg",
    refs: ["v1-ch01", "v1-ch02", "v1-ch03"],
  },
  {
    id: "t1937",
    year: "1937–38",
    era: "Awakening",
    title: "A schoolboy joins a language war",
    summary:
      "At Tiruvarur high school, the first anti-Hindi agitation pulls him into public life in his early teens. He recalls Pattukkottai Azhagirisami's Tamil volunteer march from Trichy to Madras as the front line of a war to protect Tamil.",
    stat: { value: "~14", label: "age at political entry" },
    refs: ["v1-ch04", "v1-ch06"],
  },
  {
    id: "t1939",
    year: "c. 1938–40",
    era: "Awakening",
    title: "Manava Nesan and the student movement",
    summary:
      "He runs a handwritten student paper, Manava Nesan, and is elected secretary of the Tamil student organisation — organising young minds for the Dravidian cause years before he could vote.",
    image: "leaflet.svg",
    refs: ["v1-ch07", "v1-ch08"],
  },
  {
    id: "t1944",
    year: "early 1940s",
    era: "Awakening",
    title: "Murasoli sounds its first beat",
    summary:
      "Murasoli begins in Thiruvarur as a leaflet financed by branch donations — 'its permanent writer was me.' The book reproduces a 1944 issue thundering against the Varnashrama conference at Chidambaram. His first book, Kizhavan Kanavu, sells for three annas.",
    stat: { value: "1944", label: "Murasoli issue reproduced in the book" },
    refs: ["v1-ch11", "v1-ch12"],
  },
  {
    id: "t1947",
    year: "1947",
    era: "Awakening",
    title: "Enters cinema — on his own terms",
    summary:
      "He agrees to write dialogue for the film Rajakumari on one condition: that nothing interrupt his party work. Acting and playwriting (Palaniyappan, Thookumedai) had already made the stage a movement platform.",
    image: "reel.svg",
    refs: ["v1-ch14", "v1-ch15", "v1-ch18"],
  },
  {
    id: "t1948",
    year: "1948",
    era: "Awakening",
    title: "A year of grief",
    summary:
      "His young wife Padma dies — 'poi varugiren (I'll be going), said my Padma' — in the same year the nation loses Gandhi to an assassin. Grief and history intertwine in one of the book's most tender chapters.",
    refs: ["v1-ch20", "v1-ch21"],
  },
  {
    id: "t1949",
    year: "1949",
    era: "Movement",
    title: "The DMK is founded",
    summary:
      "On September 17, 1949, the Dravida Munnetra Kazhagam holds its inaugural meeting in Madras with Anna's great address; on October 17 its organisational units spread across Tamil Nadu. The split from Periyar's DK followed his marriage to Maniammai — a break the book narrates with respect on both sides.",
    stat: { value: "Sep 17", label: "1949 — inaugural meeting, Madras" },
    refs: ["v1-ch23", "v1-ch24", "v1-ch34"],
  },
  {
    id: "t1952",
    year: "1952",
    era: "Movement",
    title: "Parasakthi shakes Tamil Nadu",
    summary:
      "His screenplay for Parasakthi creates 'a great upheaval' and runs beyond a hundred days, its dialogues debated in the press. Cinema becomes the movement's loudest loudspeaker.",
    stat: { value: "100+", label: "days in theatres" },
    image: "reel.svg",
    refs: ["v1-ch42"],
  },
  {
    id: "t1953",
    year: "1953",
    era: "Movement",
    title: "Kallakudi: 'I entered the field'",
    summary:
      "Leading the first batch — himself in front, 24 volunteers behind, thousands around — he confronts the Dalmiapuram name at Kallakudi. Trial at Ariyalur follows, then Trichy Central Jail, where prisoners run a disciplined 'new republic' with its own debate society, and he begins thinking about prison reform.",
    stat: { value: "24", label: "volunteers in his first batch" },
    image: "gate.svg",
    refs: ["v1-ch39", "v1-ch40", "v1-ch43", "v1-ch44", "v1-ch45", "v1-ch46", "v1-ch48", "v1-ch50"],
  },
  {
    id: "t1957",
    year: "1957",
    era: "Assembly",
    title: "Fifteen enter the Assembly",
    summary:
      "Campaigning from a Fiat numbered 1335, he wins Kulithalai as the DMK makes its electoral debut. Fifteen DMK members face roughly 150 Congress MLAs — 'only fifteen,' the ruling bench jeers; 'don't mock the fifteen,' Anna answers. His maiden speech comes on May 4, 1957.",
    stat: { value: "15", label: "DMK MLAs in 1957" },
    image: "assembly.svg",
    refs: ["v1-ch59", "v1-ch60", "v1-ch61", "v1-ch62"],
  },
  {
    id: "t1959",
    year: "1959",
    era: "Assembly",
    title: "The city polls and Anna's ring",
    summary:
      "For Madras Corporation's 100 seats, 402 candidates contest as the DMK builds its urban machine. After the campaign, Anna honours him with a ring — a gesture that inflames party rivals and warms the memoirist decades later.",
    stat: { value: "100", label: "corporation seats contested" },
    refs: ["v1-ch71", "v1-ch72"],
  },
  {
    id: "t1962",
    year: "1961–62",
    era: "Struggle",
    title: "Split, war and detention",
    summary:
      "E.V.K. Sampath's exit tests the party; the Chinese invasion tests the nation. The DMK pledges full support to the war effort even as its leaders sit in prison — he walks free from Trichy jail on October 26, two days after Anna, welcomed at the gate by Anna himself.",
    refs: ["v1-ch72", "v1-ch73", "v1-ch75", "v1-ch76"],
  },
  {
    id: "t1963",
    year: "1963",
    era: "Struggle",
    title: "The Sixteenth Amendment",
    summary:
      "Delhi's anti-secession amendment forces the DMK's historic turn away from the separation demand. He opposes the amendment in the Assembly, arguing the Kazhagam cannot be dissolved by law — and the party redirects itself toward state autonomy within the Union.",
    refs: ["v1-ch81", "v1-ch83", "v1-ch88", "v1-ch89"],
  },
  {
    id: "t1965",
    year: "1965",
    era: "Struggle",
    title: "The anti-Hindi storm",
    summary:
      "January 1964 had already given the struggle a martyr in Chinnasamy of Madurai. As Republic Day 1965 approaches and Hindi becomes sole official language, Tamil Nadu erupts. He is arrested on February 16, 1965 and jailed at Palayamkottai — 'holy ground,' he calls it.",
    stat: { value: "Feb 16", label: "1965 — his arrest" },
    image: "gate.svg",
    refs: ["v1-ch96", "v1-ch106", "v1-ch109", "v1-ch110", "v1-ch113"],
  },
  {
    id: "t1967",
    year: "Feb 1967",
    era: "Power",
    title: "The election that changed everything",
    summary:
      "Of 233 seats that went to polls, the DMK contests 173 and wins 138; Congress, contesting everywhere, manages 49. The party sweeps all 25 Lok Sabha seats it fights; Kamaraj loses Virudhunagar. He wins Saidapet 53,000 to 32,000 — and asks his cheering supporters to go home quietly, so the defeated aren't wounded twice.",
    stat: { value: "138/173", label: "DMK seats won / contested" },
    image: "dawn.svg",
    refs: ["v1-ch126", "v1-ch127", "v1-ch128"],
  },
  {
    id: "t1967b",
    year: "Mar 1967",
    era: "Power",
    title: "A new shirt called office",
    summary:
      "Anna is unanimously elected legislature party leader on March 1; the ministry meets the Governor on March 2. As the public works minister he drives slum clearance — multi-storey tenements at ₹50 a month — the Cooum improvement, and drinking-water schemes for a parched Madras.",
    stat: { value: "₹50", label: "monthly rent, new tenements" },
    image: "assembly.svg",
    refs: ["v1-ch129", "v1-ch130", "v1-ch132"],
  },
  {
    id: "t1968",
    year: "1967–68",
    era: "Power",
    title: "Anna's landmark acts",
    summary:
      "Three measures crown the government the book celebrates: the resolution renaming Madras State as Tamil Nadu (moved July 18, 1967, passed unanimously), the Self-Respect Marriage Act, and the two-language resolution. In January 1968 the Second World Tamil Conference brings 200+ foreign scholars to a jubilant Madras.",
    stat: { value: "Jul 18", label: "1967 — Tamil Nadu renaming resolution" },
    image: "dawn.svg",
    refs: ["v1-ch133", "v1-ch134", "v1-ch135", "v1-ch136"],
  },
  {
    id: "t1969",
    year: "Feb 3, 1969",
    era: "Power",
    title: "Losing Anna",
    summary:
      "At 00:22 on February 3, 1969, with lakhs keeping vigil in the cold outside the Adyar hospital, Anna dies. Volume 1 closes on this grief — 'Give me your heart, Anna!' — the end of an era and, though the book does not yet say it, the beginning of another.",
    stat: { value: "00:22", label: "the hour the volume ends on" },
    refs: ["v1-ch138", "v1-ch139", "v1-ch140"],
  },
];
