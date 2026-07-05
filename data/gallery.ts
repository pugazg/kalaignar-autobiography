export type GalleryItem = {
  src: string; // under /placeholders
  title: string;
  caption: string;
};

// The source text contains no printable figures, so the gallery uses
// original illustrative placeholders keyed to the book's eras.
export const gallery: GalleryItem[] = [
  {
    src: "/placeholders/delta.svg",
    title: "Thirukkuvalai, 1924",
    caption: "A Cauvery-delta village childhood — paddy, palm and a poet-farmer's songs.",
  },
  {
    src: "/placeholders/leaflet.svg",
    title: "The leaflet years",
    caption: "Manava Nesan and Murasoli: from handwritten paper to the movement's voice.",
  },
  {
    src: "/placeholders/reel.svg",
    title: "The screen as pulpit",
    caption: "Rajakumari to Parasakthi — dialogue that filled theatres for a hundred days.",
  },
  {
    src: "/placeholders/gate.svg",
    title: "Prison gates",
    caption: "Trichy 1953 and 1962, Palayamkottai 1965 — a 'new republic' behind walls.",
  },
  {
    src: "/placeholders/assembly.svg",
    title: "Fifteen in the House",
    caption: "1957: fifteen DMK members face a hundred and fifty — and refuse to be small.",
  },
  {
    src: "/placeholders/dawn.svg",
    title: "1967: a quiet revolution",
    caption: "138 of 173 seats; a government formed; a state renamed Tamil Nadu.",
  },
];
