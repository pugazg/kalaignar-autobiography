// குறளோவியம் (Kuraloviyam) — Literary Commentary, Wave 7 (qualified). Reader data vendored by
// scripts/import-kuraloviyam.mjs from `pugazg/kalaignar-literary-commentary@d542b4cc` to
// public/data/kuraloviyam/{index.json, provenance.json, units/<id>.json}.
//
// ONE catalogue work. The book's six "Parts" are the six physical intake splits of its 666-scan PDF — source
// identity only. Its reading units are the book's own: front matter, the 300 entries of its printed contents,
// and the printed contents/back cover. Each unit renders its audited pages in order, Tamil first, with the
// project-created English one toggle away.
//
// QUALIFICATION (permanent, never pending): visual verification 666/666; Tamil textual verification 662;
// English 662; scans 13, 14, 15, 19 are source-limited — their unreadable wording is never supplied.

/** One rendered block of a page, in source order. */
export type KuraloviyamBlock =
  | { kind: "heading"; level: number; text: string }
  /** Source text. `quote` = a couplet/passage set as a quotation in the source (words unchanged). */
  | { kind: "paragraph"; text: string; quote?: true }
  /** A printed Kural citation line (e.g. `அதிகாரம் - 7 - மக்கட்பேறு; பாடல் - 69`). */
  | { kind: "citation"; text: string }
  /** The archive's own description of an illustration, stamp or mark — NOT source text. */
  | { kind: "archival"; text: string }
  /** A permanently source-limited page: durable wording + any verified visible element. */
  | { kind: "source-limited"; condition: "handwritten-facsimile" | "washed-out-words"; visibleDate?: string; ta: string; en: string };

export type KuraloviyamPage = {
  scan: number;
  printed: string;
  pageType: string;
  sourceLimited?: true;
  ta: KuraloviyamBlock[];
  en: KuraloviyamBlock[];
};

/** A source-evidenced Adhikaram/Kural placement for an entry (archive crosswalk; never inferred). */
export type KuraloviyamAssignment = { chapter: number; titleTa: string; kurals: number[]; bookTa: string; bookKey: string; iyalTa: string; iyalKey: string };

export type KuraloviyamUnitSummary = {
  id: string;
  kind: "front-matter" | "entry" | "back-matter";
  /** Entry number in the printed contents (entries only). */
  number?: number;
  /** The printed contents text for the entry (entries only). */
  contentsKey?: string;
  /** Archive-derived section label (front/back matter only). */
  titleTa?: string;
  titleEn?: string;
  printedSpan: [number | string, number | string];
  scanSpan: [number, number];
  /** Where the printed contents locates an entry on a page that the audited record shows closes the previous one. */
  contentsLocatorNote?: { printed: number; textBeginsScan: number; textBeginsPrinted: number };
  expectedKuralCount?: number;
  crosswalkStatus?: string;
  assignments?: KuraloviyamAssignment[];
  sourceLimitedScans?: number[];
};

export type KuraloviyamIndex = {
  work: "kuraloviyam";
  titleTa: string;
  titleEn: string;
  authorTa: string;
  authorEn: string;
  scanTotal: number;
  entryCount: number;
  units: KuraloviyamUnitSummary[];
};

export type KuraloviyamUnit = Omit<KuraloviyamUnitSummary, "scanSpan"> & { work: "kuraloviyam"; scans: number[]; pages: KuraloviyamPage[] };

export type KuraloviyamProvenance = {
  workId: "kuraloviyam";
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: {
    titleTa: string;
    authorTa: string;
    publisherTa: string;
    priceTa: string;
    editionsEn: string[];
    scanFamily: string;
    scanTotal: number;
    splits: { part: number; filename: string; scans: string; pages: number; sha256?: string; bytes?: number }[];
    binaryVendored: false;
  };
  verification: { visualVerified: number; tamilTextualVerified: number; englishReleaseReady: number; sourceLimitedScans: number[]; blocked: number };
  sourceLimitedPages: { scan: number; printed: string; pageType: string; unit: string }[];
  english: { kind: "project-created"; basis: string };
  structure: { entries: number; frontMatterSections: number; crosswalk: { resolved: number; partialSourceMetadata: number[] }; note: string };
  notes: string[];
};

/** The public label of a unit: an entry is its printed contents text; front/back matter its derived section label. */
export function kuraloviyamUnitLabel(u: Pick<KuraloviyamUnitSummary, "kind" | "number" | "contentsKey" | "titleTa" | "titleEn">, ta: boolean): string {
  if (u.kind === "entry") return u.contentsKey ?? `${u.number}`;
  return (ta ? u.titleTa : u.titleEn) ?? "";
}
