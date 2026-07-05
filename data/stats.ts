export const counters = [
  { value: 4234, suffix: "", label: "pages across all six volumes", icon: "BookOpen" },
  { value: 391, suffix: "", label: "chapters of memoir", icon: "ListOrdered" },
  { value: 81, suffix: " yrs", label: "of life covered (1924–2005)", icon: "CalendarRange" },
  { value: 6, suffix: "", label: "volumes — the complete memoir", icon: "Library" },
];

// 1967 general election — figures as stated in ch. 128 of the book.
export const election1967 = {
  totalSeats: 234,
  polled: 233, // one constituency deferred after a candidate's death
  dmk: { contested: 173, won: 138 },
  congress: { won: 49 },
  others: { won: 233 - 138 - 49 },
  lokSabha: { contested: 25, won: 25 },
  saidapet: { karunanidhi: 53000, congress: 32000 },
};

export const seatGrowth = [
  { year: "1957", seats: 15, note: "DMK's electoral debut" },
  { year: "1967", seats: 138, note: "DMK forms government" },
  { year: "1971", seats: 184, note: "the landslide (V2·36)" },
  { year: "1977", seats: 48, note: "post-Emergency opposition (V3·18)" },
  { year: "1996", seats: 167, note: "the fourth-term sweep (V5·01)" },
];

export const assemblySplit1967 = [
  { name: "DMK", value: 138, color: "#0E5D63" },
  { name: "Congress", value: 49, color: "#B98A2F" },
  { name: "Others", value: 46, color: "#9AA5AD" },
];

export const saidapetVotes = [
  { name: "M. Karunanidhi (DMK)", votes: 53000, color: "#0E5D63" },
  { name: "Congress candidate", votes: 32000, color: "#9AA5AD" },
];

export const strikeRates = [
  { label: "Assembly 1967 — seats won of contested", won: 138, of: 173 },
  { label: "Lok Sabha 1967 — seats won of contested", won: 25, of: 25 },
];

export const numberCards = [
  { value: "₹50", label: "monthly rent of the new slum-clearance tenements", ref: "v1-ch132" },
  { value: "36.5%", label: "1966 rupee devaluation the book records", ref: "v1-ch121" },
  { value: "200+", label: "foreign scholars at the 1968 World Tamil Conference", ref: "v1-ch135" },
  { value: "₹10 lakh", label: "election-fund target set for 1967", ref: "v1-ch120" },
  { value: "402", label: "candidates for 100 Madras Corporation seats, 1959", ref: "v1-ch71" },
  { value: "Jul 18, 1967", label: "Tamil Nadu renaming resolution, passed unanimously", ref: "v1-ch133" },
  { value: "184/234", label: "DMK seats in the 1971 Assembly sweep", ref: "v2-ch36" },
  { value: "Apr 1, 1969", label: "separate Backward Classes welfare department created", ref: "v2-ch12" },
  { value: "Jun 25, 1975", label: "Emergency proclaimed; the House resolves against it", ref: "v2-ch60" },
  { value: "Jan 31, 1976", label: "the evening the ministry was dismissed", ref: "v2-ch67" },
  { value: "129 – 48", label: "ADMK–DMK split of the 1977 Assembly", ref: "v3-ch18" },
  { value: "Feb 17, 1980", label: "the night nine state governments were dismissed", ref: "v3-ch51" },
  { value: "Nov 15, 1987", label: "Sixth World Tamil Conference opens in Malaysia", ref: "v3-ch71" },
  { value: "Jan 27, 1989", label: "sworn in as CM at Valluvar Kottam — the monument he built", ref: "v4-ch02" },
  { value: "41 of 77", label: "political board posts abolished for austerity, 1989", ref: "v4-ch03" },
  { value: "20 days", label: "of rule the Hindustan Times called 'a Himalayan achievement'", ref: "v4-ch02" },
  { value: "May 21, 1991", label: "the night Rajiv Gandhi was assassinated at Sriperumbudur", ref: "v4-ch13" },
  { value: "May 13, 1996", label: "fourth oath of office; thanks meeting on the Marina that evening", ref: "v5-ch01" },
  { value: "39 / 39", label: "Lok Sabha seats swept by the DMK–TMC front, 1996", ref: "v5-ch01" },
  { value: "1 vote", label: "the margin by which the Vajpayee government fell, 1999", ref: "v5-ch48" },
  { value: "₹4 crore", label: "the flyover case cited on the night of the midnight arrest", ref: "v6-ch15" },
  { value: "2.7.2001", label: "general strike called after the arrest", ref: "v6-ch15" },
  { value: "10 statues", label: "raised by Anna on the Marina for the 1968 conference", ref: "v6-ch19" },
];

// Milestones per era for the timeline chart (derived from data/timeline.ts).
export const milestonesPerEra = [
  { era: "Roots", count: 1 },
  { era: "Awakening", count: 5 },
  { era: "Movement", count: 3 },
  { era: "Assembly", count: 2 },
  { era: "Struggle", count: 3 },
  { era: "Power", count: 4 },
  { era: "CM Years", count: 6 },
  { era: "Adversity", count: 5 },
  { era: "Return", count: 4 },
  { era: "Fourth Term", count: 4 },
  { era: "Final Innings", count: 5 },
];
