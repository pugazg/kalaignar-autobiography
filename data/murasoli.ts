// Murasoli collection types. The page index is loaded at runtime from
// public/data/murasoli/index.json (built by pipeline/builders/build_murasoli_collection.py).
// Page text is fetched per-page from public/data/murasoli/text/{id}.json — the same
// pattern the memoir Reading Room uses, so the collection scales to all 54 volumes.
export type MurasoliTitle = { en: string; ta: string };
export type MurasoliPage = {
  id: string;
  page: number;
  title: MurasoliTitle;
  pageType: string;
};
export type MurasoliVolume = {
  volume: number;
  pageCount: number;
  pages: MurasoliPage[];
  sourceUrl?: string; // the scanned source (Tamil Digital Library entry)
  /**
   * How this volume's Tamil text was established, where it differs from the collection's original OCR pipeline.
   * Wave 8 (Vols 42–47): "source-verified-page-records" — carried from archival page records verified against the
   * scanned printed volume (the reader and its provenance note are authoritative). Absent = the existing volumes.
   */
  textProvenance?: "source-verified-page-records";
};
export type MurasoliIndex = {
  collection: "murasoli";
  title: MurasoliTitle;
  rights: string;
  volumes: MurasoliVolume[];
  totalPages: number;
  volumeCount: number;
};

// Letter-level units (built by pipeline/builders/split_murasoli_letters.py --publish).
// A letter spans several pages; its serial number is global across all 54 volumes,
// its date (when OCR-legible) comes from the "அன்புள்ள, மு.க." sign-off block.
export type MurasoliLetterMeta = {
  id: string; // e.g. m54-l4016
  number: number | null; // null when the serial was OCR-garbled
  date: string | null; // ISO yyyy-mm-dd, from the sign-off
  title: MurasoliTitle;
  pages: string[]; // source page ids
  /**
   * Physical source pages the letter spans, for display. Set only for letters that have NO legacy page-fetch
   * contract (Wave 8, Vols 42–47: served from the server-side reader model, so `pages` stays empty rather than
   * holding invented page ids). Display `pageCount ?? pages.length`.
   */
  pageCount?: number;
};
export type MurasoliLettersVolume = {
  volume: number;
  letterCount: number;
  letters: MurasoliLetterMeta[];
};
export type MurasoliLettersIndex = {
  collection: "murasoli-letters";
  volumes: MurasoliLettersVolume[];
};
