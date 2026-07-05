export type Theme = {
  id: string;
  icon: string;
  tamil: string;
  title: string;
  narrative: string;
  initiatives: string[];
  achievements: string[];
  stats: { value: string; label: string }[];
  refs: string[];
};

export const themes: Theme[] = [
  {
    id: "awakening",
    icon: "Sunrise",
    tamil: "விழிப்பு",
    title: "Education & Awakening",
    narrative:
      "Volume 1 opens with a question the author puts to his own heart: do only great men own a life story? The answer — that every life carries history — frames a childhood in Thirukkuvalai where a farmer-poet father taught by example that words could shame the powerful. Formal schooling at Tiruvarur ended early; the movement became his university. He failed an exam by a mark or two, and never stopped calling himself a student of public life.",
    initiatives: [
      "Manava Nesan, a handwritten paper produced as a schoolboy",
      "Secretary of the pioneering Tamil student organisation",
      "Self-education through the movement's press, platforms and prisons",
    ],
    achievements: [
      "A schoolboy's political primer became a lifetime of letters",
      "Later chaired an Independence Day poets' gathering (1967) and published a dramatised Silappathikaram in Tamil and English",
    ],
    stats: [
      { value: "~12–14", label: "age when politics found him" },
      { value: "3 annas", label: "price of his first book, Kizhavan Kanavu" },
    ],
    refs: ["v1-ch01", "v1-ch04", "v1-ch07", "v1-ch08", "v1-ch10", "v1-ch134", "v1-ch136"],
  },
  {
    id: "movement",
    icon: "Users",
    tamil: "இயக்கம்",
    title: "The Dravidian Movement",
    narrative:
      "From the Justice Party's transformations through Periyar's Dravidar Kazhagam to the founding of the DMK on September 17, 1949, the book is an insider's chronicle of a movement becoming a party. The Periyar–Maniammai marriage splits the old guard; Anna refuses to bend; and a generation of young propagandists — the author foremost — builds a new organisation village by village, conference by conference, leaflet by leaflet.",
    initiatives: [
      "District and state conferences from Kovilpatti to Virugambakkam",
      "Black-flag campaigns against imposed authority (1950)",
      "Murasoli as the movement's connective tissue",
    ],
    achievements: [
      "DMK founded 1949; organisational network across Tamil Nadu by the early 1950s",
      "Survived the Sampath split of 1961 and the 1963 anti-secession turn",
      "From street movement to governing party in eighteen years",
    ],
    stats: [
      { value: "1949", label: "DMK founded, Sep 17" },
      { value: "18 yrs", label: "from founding to forming government" },
    ],
    refs: ["v1-ch05", "v1-ch23", "v1-ch24", "v1-ch34", "v1-ch36", "v1-ch53", "v1-ch72", "v1-ch73", "v1-ch125"],
  },
  {
    id: "pen",
    icon: "PenTool",
    tamil: "எழுத்து",
    title: "The Pen as Weapon",
    narrative:
      "Murasoli's origin story is told with pride: a leaflet from Thiruvarur, printed with branch donations, distributed free — and 'its permanent writer was me.' The book reproduces a 1944 broadside against a Varnashrama conference. Writing was livelihood, weapon and identity at once: when Anna's 'Arya Mayai' was banned in 1950, the young writer learned that the right to write would have to be fought for like any other.",
    initiatives: [
      "Murasoli: leaflet → weekly → daily",
      "Defence of press freedom against the 1950 book ban",
      "Interviews carrying the movement's case to Pravda and Himmat",
    ],
    achievements: [
      "A one-man leaflet became an institution of Tamil journalism",
      "A lifelong literary output alongside politics — 'art and politics are my two eyes'",
    ],
    stats: [
      { value: "1944", label: "earliest Murasoli issue reproduced" },
      { value: "2", label: "international press interviews recounted (Pravda, Himmat)" },
    ],
    refs: ["v1-ch11", "v1-ch12", "v1-ch25", "v1-ch87", "v1-ch118", "v1-ch124", "v1-ch137"],
  },
  {
    id: "screen",
    icon: "Clapperboard",
    tamil: "திரை",
    title: "Screen & Stage",
    narrative:
      "Acting came first — a way to live and to spread the message — then playwriting, then film dialogue. Rajakumari (1947) was accepted on the condition party work continue. Parasakthi (1952) ran past a hundred days and its dialogues became public property. Kalaivanar N. S. Krishnan's generosity, an eye injury from a car accident that nearly ended the writing, Poompuhar released on Periyar's birthday in 1964, Kanchi Thalaivan in 1963 — the reel and the rally advance together.",
    initiatives: [
      "Propaganda theatre: Palaniyappan, Thookumedai, Udhaya Suriyan",
      "Film dialogue as ideological broadcast",
      "Silappathikaram dramatised and published in two languages",
    ],
    achievements: [
      "Parasakthi's 100+ day run made cinema the movement's mass medium",
      "Honoured as 'Kalai Mamani' after entering office (1967)",
    ],
    stats: [
      { value: "100+", label: "days Parasakthi ran" },
      { value: "1947", label: "first film, Rajakumari" },
    ],
    refs: ["v1-ch14", "v1-ch15", "v1-ch18", "v1-ch30", "v1-ch31", "v1-ch42", "v1-ch70", "v1-ch94", "v1-ch102", "v1-ch117", "v1-ch122", "v1-ch131", "v1-ch136"],
  },
  {
    id: "prison",
    icon: "Lock",
    tamil: "சிறை",
    title: "Prison Diaries",
    narrative:
      "Few stretches of the book are as vivid as the jail chapters. In Trichy Central Jail after Kallakudi (1953), hundreds of movement prisoners organise a 'new republic': block leaders report bad gruel up a chain of command, a debate society meets, discipline is a point of pride. Detained again in 1962, he walks out on October 26 into Anna's embrace at the gate. The 1965 arrest lands him in Palayamkottai, where the hardest sentence is being unable to see friends' faces.",
    initiatives: [
      "Prisoner self-government and grievance chains in Trichy jail",
      "Debate societies and competitions behind bars",
      "Early thinking on prison reform, decades before office",
    ],
    achievements: [
      "Turned imprisonment into organisation-building",
      "Release days became rallying points: paraded from 'jail gate to praise fort'",
    ],
    stats: [
      { value: "3", label: "imprisonments recounted in Volume 1" },
      { value: "Oct 26", label: "1962 — released two days after Anna" },
    ],
    refs: ["v1-ch45", "v1-ch46", "v1-ch47", "v1-ch48", "v1-ch49", "v1-ch50", "v1-ch76", "v1-ch110", "v1-ch111", "v1-ch113", "v1-ch114"],
  },
  {
    id: "power",
    icon: "Landmark",
    tamil: "ஆட்சி",
    title: "From Protest to Power",
    narrative:
      "The last third of the volume is the ascent: the 1963 turn from separatism to autonomy, the anti-Hindi storm of 1965, a ten-lakh-rupee election fund raised for 1967, an alliance built without any party surrendering 'flag, creed or goal.' Then the result — 138 of 173 — and the discipline of victory: no gloating at Saidapet. As minister he builds: tenements at ₹50 a month, a cleaner Cooum, water for the city; Anna's government renames the state and legalises self-respect marriages.",
    initiatives: [
      "Election fund of ₹10 lakh set as the 1967 target",
      "Slum Clearance Board; Cooum improvement; drinking-water schemes",
      "Two-language policy; Tamil Nadu renaming resolution",
    ],
    achievements: [
      "First non-Congress government of Tamil Nadu (1967)",
      "All 25 Lok Sabha seats contested were won — 'a record no other party in India had'",
      "Self-Respect Marriage Act; state renamed Tamil Nadu",
    ],
    stats: [
      { value: "49", label: "seats Congress fell to in 1967" },
      { value: "₹10 lakh", label: "election fund target, 1967" },
    ],
    refs: ["v1-ch81", "v1-ch109", "v1-ch120", "v1-ch127", "v1-ch128", "v1-ch130", "v1-ch132", "v1-ch133"],
  },
];
