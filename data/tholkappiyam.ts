// Tholkappiya Poonga (தொல்காப்பியப் பூங்கா) — Kalaignar's commentary on the Tolkāppiyam.
// Data-driven like the memoir + Murasoli Reading Rooms: the index is loaded at runtime
// from public/data/tholkappiyam/index.json (built by pipeline/builders/build_tholkappiyam.py);
// each malar's commentary is fetched per-unit from public/data/tholkappiyam/text/{id}.json.

export type TpAdhikaram = { key: "ezhuttu" | "sol" | "porul"; ta: string; en: string };

export type TpPages = {
  scanStart: number;
  scanEnd: number;
  printStart: number | null;
  printEnd: number | null;
};

export type TpMalarMeta = {
  id: string; // tp-m04, tp-pugumun, …
  kind: "malar" | "intro";
  number: number; // 1..100; 0 for intro pieces
  title: { ta: string; en?: string };
  adhikaram: TpAdhikaram | null; // null for interludes / intros
  iyal: string | null;
  sutras: number[]; // நூற்பா numbers this malar discusses (per-adhikāram numbering)
  pages: TpPages;
  summary: string;
};

export type TpAdhikaramSummary = {
  key: TpAdhikaram["key"];
  ta: string;
  en: string;
  malarCount: number;
  sutraCount: number;
};

export type TpIndex = {
  collection: "tholkappiya-poonga";
  title: { ta: string; en: string };
  author: { ta: string; en: string };
  work: { ta: string; en: string }; // the Tolkāppiyam itself
  publisher: string;
  edition: string;
  year: number;
  rights: string;
  scanPages: number;
  sourceRepo: string;
  adhikarams: TpAdhikaramSummary[];
  malarCount: number;
  sutraCount: number;
  malars: TpMalarMeta[];
};

export type TpMalarText = TpMalarMeta & { paragraphs: string[]; textUrl?: string };
