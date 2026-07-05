export const siteMeta = {
  title: "Kalaignar M. Karunanidhi's Legacy",
  subtitle: "Socio-Economic Transformation of Tamil Nadu",
  heroTamil: "நெஞ்சுக்கு நீதி",
  heroTamilTransliteration: "Nenjukku Neethi — Justice for the Heart",
  description:
    "An interactive digital retelling of Nenjukku Neethi, the autobiography of Kalaignar M. Karunanidhi. Volume 1 traces the years 1924–1969: from a delta village childhood to the Dravidian movement, the pen, the screen, the prison, and finally the seat of government.",
  source: {
    workTamil: "நெஞ்சுக்கு நீதி — முதல் பாகம்",
    workEnglish: "Nenjukku Neethi (Justice for the Heart), Volume 1",
    author: "M. Karunanidhi (Kalaignar)",
    firstSerialisedIn: "Dinamani Kadir (Volume 1)",
    publisher: "Thirumagal Nilayam, Chennai",
    pages: 756,
    chapters: 140,
    periodCovered: "1924 – 1969",
  },
  volumesLoaded: [1],
};

export type SummaryCard = {
  icon: string; // lucide icon name
  heading: string;
  text: string;
};

export const summaryCards: SummaryCard[] = [
  {
    icon: "Sprout",
    heading: "A Delta Childhood",
    text: "Born June 3, 1924 in Thirukkuvalai to a farming family — 'not steeped in wealth, but never drowned in poverty.' His father Muthuvel was a farmer and a fearless village poet.",
  },
  {
    icon: "Flame",
    heading: "Awakened at Fourteen",
    text: "The anti-Hindi agitations of the late 1930s pulled a Tiruvarur schoolboy into public life. He ran a handwritten student paper and helped organise a pioneering Tamil student movement.",
  },
  {
    icon: "PenLine",
    heading: "The Pen as a Weapon",
    text: "Murasoli began as a humble leaflet in Thiruvarur, funded by branch donations — 'its permanent writer was me.' It grew into the movement's enduring voice.",
  },
  {
    icon: "Clapperboard",
    heading: "Cinema as a Pulpit",
    text: "From Rajakumari (1947) to Parasakthi (1952), which ran beyond 100 days, he carried the movement's ideas into theatres — accepting film work only if party work continued.",
  },
  {
    icon: "Megaphone",
    heading: "Protest and Prison",
    text: "He led the first batch at Kallakudi in 1953 and went to prison repeatedly — Trichy in 1953 and 1962, Palayamkottai in 1965 — turning jail wards into schools of discipline.",
  },
  {
    icon: "Landmark",
    heading: "Fifteen Against a Hundred and Fifty",
    text: "Elected from Kulithalai in 1957, one of just 15 DMK members mocked by a 150-strong ruling bench. His maiden speech came on May 4, 1957.",
  },
  {
    icon: "Vote",
    heading: "The 1967 Watershed",
    text: "DMK contested 173 of 233 seats and won 138; Congress managed 49. The party swept all 25 Lok Sabha seats it fought — and Anna formed the government.",
  },
  {
    icon: "HeartHandshake",
    heading: "Mentors and Bonds",
    text: "Periyar gave him reason, Anna gave him direction. The book is dedicated to 'the parents who bore me, Periyar who gave me knowledge, Anna who made me who I am.'",
  },
];

export type Pillar = {
  id: string;
  icon: string;
  title: string;
  tamil: string;
  short: string;
  detail: string;
  refs: string[]; // chapter ids
};

export const pillars: Pillar[] = [
  {
    id: "language",
    icon: "Languages",
    title: "Tamil Language & Identity",
    tamil: "தமிழ்",
    short: "The defence of Tamil is the spine of Volume 1 — from 1938 to the 1965 upheaval.",
    detail:
      "The anti-Hindi agitation of the late 1930s is where his public life begins, and the theme never leaves the book: black-flag protests against imposition in 1950, the renaming struggle at Dalmiapuram in 1953, the 1965 agitation that sent him to Palayamkottai jail, and finally the two-language resolution and the renaming of Madras State as Tamil Nadu under Anna's government.",
    refs: ["v1-ch04", "v1-ch06", "v1-ch35", "v1-ch65", "v1-ch91", "v1-ch96", "v1-ch109", "v1-ch133"],
  },
  {
    id: "justice",
    icon: "Scale",
    title: "Social Justice & Rationalism",
    tamil: "சமூக நீதி",
    short: "Periyar's self-respect movement shaped his politics before party politics did.",
    detail:
      "From his father's satirical songs against village oppression to Murasoli's early broadsides against the Varnashrama conference at Chidambaram (a 1944 issue is reproduced in the book), social justice runs beneath every campaign. The self-respect marriage law passed under Anna's government closes the volume's long arc from ridicule to legislation.",
    refs: ["v1-ch02", "v1-ch12", "v1-ch23", "v1-ch117", "v1-ch133"],
  },
  {
    id: "press",
    icon: "Newspaper",
    title: "Journalism & Letters",
    tamil: "எழுத்து",
    short: "From a handwritten student paper to Murasoli, print was his first constituency.",
    detail:
      "Manava Nesan, the handwritten paper of his school days, grew into Murasoli — first a Thiruvarur leaflet financed by branch donations, later a weekly and a daily. His first book, Kizhavan Kanavu, sold for three annas. He defended the freedom to write and speak when Anna's 'Arya Mayai' was banned in 1950.",
    refs: ["v1-ch07", "v1-ch11", "v1-ch12", "v1-ch25", "v1-ch112"],
  },
  {
    id: "cinema",
    icon: "Film",
    title: "Cinema & Theatre",
    tamil: "திரை",
    short: "Stage plays and film dialogue carried the movement to audiences print couldn't reach.",
    detail:
      "He wrote and acted in propaganda plays (Palaniyappan, Thookumedai), took up film dialogue with Rajakumari on the condition that party work continue, and shook Tamil Nadu with Parasakthi's 100-day run. Later came Poompuhar, Kanchi Thalaivan, and a dramatised Silappathikaram published in Tamil and English. 'Art and politics are my two eyes,' he writes.",
    refs: ["v1-ch14", "v1-ch15", "v1-ch18", "v1-ch42", "v1-ch87", "v1-ch94", "v1-ch102", "v1-ch122", "v1-ch136"],
  },
  {
    id: "protest",
    icon: "Megaphone",
    title: "Protest & Sacrifice",
    tamil: "போராட்டம்",
    short: "Kallakudi 1953, the 1962 detentions, the 1965 anti-Hindi storm.",
    detail:
      "He led the first batch of volunteers at Kallakudi against the Dalmiapuram name, was tried at Ariyalur, and entered Trichy Central Jail — where prisoners built a disciplined 'new republic' with its own debate society. Detained again in 1962, he was arrested on February 16, 1965 at the height of the anti-Hindi agitation and held at Palayamkottai.",
    refs: ["v1-ch39", "v1-ch43", "v1-ch44", "v1-ch45", "v1-ch46", "v1-ch48", "v1-ch76", "v1-ch109", "v1-ch110"],
  },
  {
    id: "elections",
    icon: "Vote",
    title: "Electoral Politics",
    tamil: "தேர்தல்",
    short: "From 15 seats in 1957 to 138 in 1967 — the arithmetic of a quiet revolution.",
    detail:
      "The DMK's first electoral outing sent 15 members to a house of 150 Congress MLAs — and the jeers of 'only fifteen' became a badge. The 1959 Madras Corporation polls (402 candidates for 100 seats) built the machine. In 1967 the party won 138 of the 173 seats it contested, all 25 Lok Sabha seats, and Kamaraj himself lost Virudhunagar.",
    refs: ["v1-ch59", "v1-ch60", "v1-ch61", "v1-ch71", "v1-ch85", "v1-ch97", "v1-ch126", "v1-ch127", "v1-ch128"],
  },
  {
    id: "governance",
    icon: "Building2",
    title: "Governance & Public Works",
    tamil: "ஆட்சி",
    short: "The volume ends with power used: slum clearance, the Cooum, drinking water.",
    detail:
      "Sworn into Anna's cabinet in March 1967, he took charge of public works: a Slum Clearance Board building multi-storey tenements let at ₹50 a month, the improvement of the Cooum, and drinking-water schemes. Anna's government passed the Tamil Nadu renaming resolution (July 18, 1967, unanimous), the Self-Respect Marriage Act, and the two-language resolution.",
    refs: ["v1-ch129", "v1-ch130", "v1-ch132", "v1-ch133"],
  },
  {
    id: "mentors",
    icon: "HeartHandshake",
    title: "Mentors & Bonds",
    tamil: "உறவுகள்",
    short: "Periyar, Anna, Kalaivanar, Kannadasan — the friendships that carried a life.",
    detail:
      "Anna's ring after the 1959 corporation victory, Kalaivanar N. S. Krishnan's generosity, Kannadasan's companionship on a memorable journey to Salem, Periyar's blessing after the 1967 win ('we met the Father') — and the volume's devastating close at 00:22 on February 3, 1969, when Anna died with lakhs keeping vigil outside.",
    refs: ["v1-ch26", "v1-ch28", "v1-ch30", "v1-ch52", "v1-ch71", "v1-ch129", "v1-ch138", "v1-ch140"],
  },
];
