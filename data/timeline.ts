export type Milestone = {
  id: string;
  year: string;
  era: string;
  location?: string;
  tags?: string[];
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
  { id: "Assembly", label: "Assembly", years: "1957–1960" },
  { id: "Struggle", label: "Struggle", years: "1961–1966" },
  { id: "Power", label: "Power", years: "1967–1969" },
  { id: "CM Years", label: "CM Years", years: "1969–1976" },
  { id: "Adversity", label: "Adversity", years: "1976–1988" },
  { id: "Return", label: "Return", years: "1989–1996" },
  { id: "Fourth Term", label: "Fourth Term", years: "1996–1999" },
  { id: "Final Innings", label: "Final Innings", years: "1999–2005" },
] as const;

export const timeline: Milestone[] = [
  {
    id: "t1924",
    year: "1924",
    era: "Roots",
    location: "Thirukkuvalai",
    tags: ["roots"],
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
    location: "Thirukkuvalai · Tiruvarur",
    tags: ["language", "movement"],
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
    location: "Tiruvarur",
    tags: ["literature", "movement"],
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
    location: "Coimbatore · Salem",
    tags: ["cinema", "literature"],
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
    location: "Coimbatore",
    tags: ["cinema"],
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
    location: "Home",
    tags: ["losses", "family"],
    title: "A year of grief",
    summary:
      "His young wife Padma dies — 'poi varugiren (I'll be going), said my Padma' — in the same year the nation loses Gandhi to an assassin. Grief and history intertwine in one of the book's most tender chapters.",
    refs: ["v1-ch20", "v1-ch21"],
  },
  {
    id: "t1949",
    year: "1949",
    era: "Movement",
    location: "Madras",
    tags: ["movement"],
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
    location: "Madras · the screen",
    tags: ["cinema", "movement"],
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
    location: "Kallakudi · Trichy",
    tags: ["movement", "imprisonment"],
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
    location: "Kulithalai",
    tags: ["elections"],
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
    location: "Madras",
    tags: ["governance", "movement"],
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
    location: "Tamil Nadu",
    tags: ["elections", "movement"],
    title: "Split, war and detention",
    summary:
      "E.V.K. Sampath's exit tests the party; the Chinese invasion tests the nation. The DMK pledges full support to the war effort even as its leaders sit in prison — he walks free from Trichy jail on October 26, two days after Anna, welcomed at the gate by Anna himself.",
    refs: ["v1-ch72", "v1-ch73", "v1-ch75", "v1-ch76"],
  },
  {
    id: "t1963",
    year: "1963",
    era: "Struggle",
    location: "Assembly",
    tags: ["governance", "language"],
    title: "The Sixteenth Amendment",
    summary:
      "Delhi's anti-secession amendment forces the DMK's historic turn away from the separation demand. He opposes the amendment in the Assembly, arguing the Kazhagam cannot be dissolved by law — and the party redirects itself toward state autonomy within the Union.",
    refs: ["v1-ch81", "v1-ch83", "v1-ch88", "v1-ch89"],
  },
  {
    id: "t1965",
    year: "1965",
    era: "Struggle",
    location: "Madras · statewide",
    tags: ["language", "imprisonment"],
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
    location: "Saidapet · Madras",
    tags: ["elections"],
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
    location: "Fort St. George",
    tags: ["governance"],
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
    location: "Marina · Madras",
    tags: ["language", "governance"],
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
    location: "Madras",
    tags: ["losses", "governance"],
    title: "Losing Anna",
    summary:
      "At 00:22 on February 3, 1969, with lakhs keeping vigil in the cold outside the Adyar hospital, Anna dies. Volume 1 closes on this grief — 'Give me your heart, Anna!' — the end of an era and, though the book does not yet say it, the beginning of another.",
    stat: { value: "00:22", label: "the hour the volume ends on" },
    refs: ["v1-ch138", "v1-ch139", "v1-ch140"],
  },

  // ——— Volume 2 · 1969–1976 ———
  {
    id: "t1969b",
    year: "1969",
    era: "CM Years",
    location: "Appakoodal · Coimbatore",
    tags: ["governance", "social justice"],
    title: "Chief Minister, and a near-fatal pandal",
    summary:
      "Volume 2 opens amid the world's condolences for Anna and the new ministry's first decisions — a separate Backward Classes welfare department created on April 1, 1969, held under the Chief Minister himself. Days later, on April 7 at Appakoodal in Coimbatore district, a storm brings a function pandal down on thousands; he is pulled from the wreckage in the dark and escapes with treatment at home.",
    stat: { value: "Apr 7", label: "1969 — the Appakoodal collapse" },
    refs: ["v2-ch04", "v2-ch12"],
  },
  {
    id: "t1971",
    year: "1971",
    era: "CM Years",
    location: "Tamil Nadu",
    tags: ["elections", "alliances"],
    title: "184 of 234",
    summary:
      "A progressive front assembled on January 8, 1971 — DMK with Congress, CPI, PSP, Forward Bloc, Muslim League and Tamilarasu Kazhagam — sweeps the state: the DMK alone takes 184 of 234 Assembly seats, its allies adding more. The mandate of 1967 becomes a landslide.",
    stat: { value: "184/234", label: "DMK seats, 1971 Assembly" },
    image: "dawn.svg",
    refs: ["v2-ch35", "v2-ch36", "v2-ch37"],
  },
  {
    id: "t1972",
    year: "Oct 1972",
    era: "CM Years",
    location: "Chennai",
    tags: ["movement", "cinema"],
    title: "The break with MGR",
    summary:
      "Mediators shuttle through October 13 — Nanjil Manoharan, R. M. Veerappan — but the confrontation the book calls 'the beginning of betrayal' ends with the matinee idol's expulsion: 'there was no other way; he was removed.' Tamil politics splits into the rivalry that will define the next four decades.",
    refs: ["v2-ch45", "v2-ch49"],
  },
  {
    id: "t1975",
    year: "Jun 1975",
    era: "CM Years",
    location: "Delhi · Chennai",
    tags: ["governance", "democracy"],
    title: "Emergency",
    summary:
      "On June 12, 1975, Justice Jagmohanlal Sinha of the Allahabad High Court voids Indira Gandhi's election; on June 25 the Emergency is proclaimed. The DMK government in Madras resolves against it within two days — one of the few state governments in India to stand up and say so.",
    stat: { value: "Jun 25", label: "1975 — Emergency proclaimed" },
    refs: ["v2-ch59", "v2-ch60"],
  },
  {
    id: "t1975b",
    year: "Oct 1975",
    era: "CM Years",
    location: "Chennai",
    tags: ["losses"],
    title: "Kamaraj passes",
    summary:
      "The death of Kamaraj — the adversary of 1967, honoured in grief — brings 'the tears and the seashore vow.' The book devotes chapters to the Kazhagam's homage to a rival it never stopped respecting.",
    refs: ["v2-ch61", "v2-ch63", "v2-ch64"],
  },
  {
    id: "t1976",
    year: "Jan 31, 1976",
    era: "CM Years",
    location: "Chennai",
    tags: ["dismissal", "governance"],
    title: "The government is dismissed",
    summary:
      "With the Valluvar Kottam inauguration being planned in the very same January, the Centre dismisses the DMK government on the evening of January 31, 1976 and dissolves the Assembly; the monument he raised to Thiruvalluvar opens that April under President's rule. MISA and the 'trial by commission' years begin.",
    stat: { value: "Jan 31", label: "1976 — ministry dismissed, House dissolved" },
    image: "gate.svg",
    refs: ["v2-ch66", "v2-ch67", "v2-ch70"],
  },

  // ——— Volume 3 · 1976–1988 ———
  {
    id: "t1976b",
    year: "1976–77",
    era: "Adversity",
    location: "Central Jail",
    tags: ["imprisonment", "family"],
    title: "Prison letters, again",
    summary:
      "The Emergency's dragnet reaches the movement itself — his own arrest (the volume records George Fernandes' public protest at it), a letter written from prison to Stalin, and testimony it titles 'the experiences of a life sentence.' The pen, as in 1953, does the enduring.",
    refs: ["v3-ch09", "v3-ch30"],
  },
  {
    id: "t1977",
    year: "1977",
    era: "Adversity",
    location: "Tamil Nadu · Delhi",
    tags: ["elections", "democracy"],
    title: "Democracy answers the Emergency",
    summary:
      "The campaign frames the March 1977 contest plainly — at Panagal Park the movement's platform declares only two candidates stand: democracy and dictatorship. Janata sweeps the Centre and the Shah Commission begins its reckoning; in Tamil Nadu the Kazhagam contests 230 seats and wins 48 against the ADMK's 129, settling into the opposition benches it will hold for a decade.",
    stat: { value: "48/230", label: "DMK seats won of contested, 1977" },
    refs: ["v3-ch10", "v3-ch18", "v3-ch29", "v3-ch32"],
  },
  {
    id: "t1980",
    year: "Feb 1980",
    era: "Adversity",
    location: "Delhi",
    tags: ["dismissal", "alliances"],
    title: "Nine governments fall",
    summary:
      "On the night of February 17, 1980, the returned Indira Gandhi cabinet resolves to dismiss nine state governments, Tamil Nadu's included — the same instrument used against the DMK in 1976, and by Janata against nine Congress states in 1977. The chapter title carries the book's verdict on that season's politics: 'poison spat while shaking hands.'",
    stat: { value: "9", label: "state governments dismissed at once" },
    image: "gate.svg",
    refs: ["v3-ch51"],
  },
  {
    id: "t1983",
    year: "1981–85",
    era: "Adversity",
    location: "Eelam · Tamil Nadu",
    tags: ["movement", "eelam"],
    title: "Eelam burns; Tamil Nadu answers",
    summary:
      "From 'the spark in Lanka' onward, the volume tracks the Eelam Tamils' cause becoming central to Tamil politics — chapters on the rights struggle, the pogroms, the agitations at home, and the Indian delegations to the island.",
    refs: ["v3-ch17", "v3-ch26", "v3-ch67", "v3-ch69"],
  },
  {
    id: "t1987",
    year: "1987–88",
    era: "Adversity",
    location: "Malaysia · Chennai",
    tags: ["losses", "language"],
    title: "MGR's death, and a volume closes",
    summary:
      "On November 15, 1987 he travels to the Sixth World Tamil Conference in Malaysia; returning by train, he is met at the station with the news — MGR dead of a sudden heart attack at 3:45 in the pre-dawn dark. The volume closes on 1988: the National Front forming at Delhi, and an 'unshakable Himalaya' of a movement preparing its return.",
    stat: { value: "3:45 am", label: "the hour the rivalry of a lifetime ended" },
    refs: ["v3-ch71", "v3-ch72", "v3-ch73"],
  },

  // ——— Volume 4 · 1988–1996 ———
  {
    id: "t1989",
    year: "Jan 27, 1989",
    era: "Return",
    location: "Valluvar Kottam · Chennai",
    tags: ["governance", "social justice"],
    title: "Sworn in at the monument he built",
    summary:
      "Chief Minister again after thirteen years — and the oath before Governor Alexander is taken at Valluvar Kottam, the memorial he raised in his last term. The government moves fast enough that the Hindustan Times (20.2.1989) calls it 'a Himalayan achievement in just twenty days of rule'; among the laws the volume counts with pride, equal property rights for women — enacted in 1989, sixty years after the movement first resolved it.",
    stat: { value: "1989", label: "equal property rights for women enacted" },
    image: "assembly.svg",
    refs: ["v4-ch02", "v4-ch04"],
  },
  {
    id: "t1990",
    year: "1990",
    era: "Return",
    location: "Cauvery delta",
    tags: ["governance", "water"],
    title: "'Live long, Cauvery'",
    summary:
      "The Cauvery chapter opens with a coincidence the author savours: the river-sharing accord between Mysore and the Madras Presidency was signed in 1924, the year he was born — with a fifty-year clause whose expiry now lands on his desk. The volume carries the fight for the river into the tribunal era.",
    refs: ["v4-ch08"],
  },
  {
    id: "t1991",
    year: "Jan 30, 1991",
    era: "Return",
    location: "Chennai · Sriperumbudur",
    tags: ["dismissal", "losses"],
    title: "Dismissed on Gandhi's death-day",
    summary:
      "The volume traces 'the conspiracy to dismiss the government' from February 1989 to its end: with the state budget due on February 2, the ministry is dismissed on the night of January 30, 1991 — the book notes the bitter coincidence that this was the very date Gandhi was shot. 'For the second time, I gave up office.' Months later, on the night of May 21, 1991, Rajiv Gandhi is assassinated at Sriperumbudur — 'the unexpected murder' that reshapes everything.",
    stat: { value: "May 21", label: "1991 — Rajiv Gandhi assassinated" },
    refs: ["v4-ch03", "v4-ch13", "v4-ch17", "v4-ch19"],
  },
  {
    id: "t1996",
    year: "Apr 1996",
    era: "Return",
    location: "Tamil Nadu",
    tags: ["elections"],
    title: "'We made history!'",
    summary:
      "After five years the book calls a 'blood frenzy' — its final pages recounting the rival regime's corruption cases mounting through the courts — the campaign of April 1996 (his own convoy stoned near Nellai on 19-4-96, as the closing chapter records) ends in a sweep. The chapter title declares it: 'we made a history of achievement!'",
    image: "dawn.svg",
    refs: ["v4-ch20", "v4-ch22"],
  },

  // ——— Volume 5 · 1996–1999 ———
  {
    id: "t1996b",
    year: "May 13, 1996",
    era: "Fourth Term",
    location: "Marina · Chennai",
    tags: ["elections", "governance"],
    title: "'Rest from rest'",
    summary:
      "The scale of the sweep is in the volume's own count: the DMK wins 167 of the 175 seats it contests, its front takes all 39 Lok Sabha seats, and the oath is taken on 13-5-1996 — with a thanksgiving meeting by the Gandhi statue on the Marina that same evening. Vairamuthu's greeting opens the fifth volume of a seventy-plus Chief Minister who has, as the first chapter's title says, given rest itself a rest.",
    stat: { value: "167/175", label: "DMK seats won of contested, 1996" },
    image: "dawn.svg",
    refs: ["v5-ch01"],
  },
  {
    id: "t1997",
    year: "1996–98",
    era: "Fourth Term",
    location: "Chennai",
    tags: ["governance", "water"],
    title: "Krishna water reaches the border",
    summary:
      "The decades-old promise of Krishna water for a thirsty Chennai moves — the project launched jointly with Andhra's Chandrababu Naidu, and the volume's photographs showing the water flowing at Tamil Nadu's edge and Stalin taking office as Mayor of the city being rebuilt to receive it.",
    stat: { value: "1996+", label: "Krishna water at Tamil Nadu's border" },
    refs: ["v5-ch11"],
  },
  {
    id: "t1998",
    year: "1997–99",
    era: "Fourth Term",
    location: "Kanyakumari",
    tags: ["language", "education"],
    title: "A university, and a statue at land's end",
    summary:
      "The term's cultural signatures: a Dravidian University raised (the chapter opening with the housecleaning of the previous regime's self-naming excesses), and at Kanyakumari the Chief Minister inspecting the works of the 'sky-touching' Thiruvalluvar statue rising where the three seas meet.",
    refs: ["v5-ch09", "v5-ch33"],
  },
  {
    id: "t1999",
    year: "1999",
    era: "Fourth Term",
    location: "Delhi",
    tags: ["alliances", "elections"],
    title: "One vote, and a sixth volume begins",
    summary:
      "The volume's late chapters carry Delhi's convulsions — the tea-party meeting of Jayalalithaa and Sonia Gandhi, the ordered resignations, and the Vajpayee government falling by a single vote in the chapter titled exactly that: 'By the difference of one vote.' It closes amid the September 1999 Lok Sabha polls with a promise in its final chapter title — 'the sixth volume begins!'",
    stat: { value: "1", label: "vote by which the government fell, 1999" },
    refs: ["v5-ch48", "v5-ch50"],
  },

  // ——— Volume 6 · 1999–2005 ———
  {
    id: "t2000",
    year: "1999–2000",
    era: "Final Innings",
    location: "Tamil Nadu",
    tags: ["elections", "alliances"],
    title: "A new century's alignments",
    summary:
      "The final volume opens in grief — 'the sorrow of losing dearest friends' — and in flux: the September 1999 Lok Sabha polls announced in mid-July, and Rajinikanth's public statement weighing where his support goes with the DMK and TMC contesting apart. The coalition age has fully arrived.",
    refs: ["v6-ch01"],
  },
  {
    id: "t2001",
    year: "Jun 30, 2001",
    era: "Final Innings",
    location: "Oliver Road · Chennai",
    tags: ["imprisonment"],
    title: "The midnight arrest",
    summary:
      "Police without a warrant break the bedroom door in the small hours and haul the former Chief Minister from bed — 'kicked and dragged like a ball' down the stairs, as the chapter records — over a ₹4-crore flyover case. By morning of 30.6.2001 the NDA partners meet at Anna Arivalayam; a general strike is called for July 2. The chapter title gives the night its name: 'In pitch dark, a jungle-rule durbar.'",
    stat: { value: "2.7.2001", label: "the general strike called in answer" },
    image: "gate.svg",
    refs: ["v6-ch15", "v6-ch16"],
  },
  {
    id: "t2002",
    year: "2001–02",
    era: "Final Innings",
    location: "Marina · Delhi",
    tags: ["language", "movement"],
    title: "Defending Anna's statues, and Tamil's claims",
    summary:
      "The Kannagi chapter opens with a history lesson aimed at the rival regime: the statue was one of ten Anna himself installed on the Marina for the 1968 World Tamil Conference — 'why this spite against Kannagi?' Alongside runs the old cause at Delhi: the case that Tamil too deserves the status of India's official language.",
    stat: { value: "10", label: "statues Anna raised on the Marina, 1968" },
    refs: ["v6-ch12", "v6-ch19"],
  },
  {
    id: "t2003",
    year: "2003",
    era: "Final Innings",
    location: "Delhi · Chennai",
    tags: ["losses", "family"],
    title: "The never-forgettable Maran",
    summary:
      "The volume's most personal chapter is the memorial for Murasoli Maran — the nephew and comrade of the Murasoli years, treated at Apollo for a failing heart valve yet carrying on his Union minister's work; the narrative binds his ordeal to the shock of the midnight break-in at the family's door.",
    refs: ["v6-ch26"],
  },
  {
    id: "t2004",
    year: "2004–05",
    era: "Final Innings",
    location: "Delhi · Tamil Nadu",
    tags: ["alliances", "governance"],
    title: "The turning point",
    summary:
      "On the eve of the 2004 Lok Sabha polls the book marks its own 'turning point in the movement's history': the DMK, at odds with the BJP, turns toward the Congress side — and at a gathering of Congress leaders he opens his speech refusing every dividing salutation, greeting all present as 'siblings dearer than life itself.' The volume closes with Sethusamudram argued, and the movement's machinery — Stalin among its new deputy general secretaries — readied for what history would bring next.",
    refs: ["v6-ch23", "v6-ch29"],
  },
];
