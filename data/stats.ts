export const counters = [
  { value: 756, suffix: "", label: "pages in Volume 1", icon: "BookOpen" },
  { value: 140, suffix: "", label: "chapters of memoir", icon: "ListOrdered" },
  { value: 45, suffix: " yrs", label: "of life covered (1924–1969)", icon: "CalendarRange" },
  { value: 3, suffix: "", label: "imprisonments recounted", icon: "Lock" },
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
];

// Milestones per era for the timeline chart (derived from data/timeline.ts).
export const milestonesPerEra = [
  { era: "Roots", count: 1 },
  { era: "Awakening", count: 5 },
  { era: "Movement", count: 3 },
  { era: "Assembly", count: 2 },
  { era: "Struggle", count: 3 },
  { era: "Power", count: 4 },
];
