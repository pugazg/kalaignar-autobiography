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

// Letter-level units. The public index mixes two cohorts: the original Volumes 48–54 (built by
// pipeline/builders/split_murasoli_letters.py --publish, OCR-derived) and the Wave-8 Volumes 42–47 (metadata derived
// from source-verified archival page records). A letter spans several pages.
//
// IDENTITY is `id` (the route id) — never the printed number. The printed letter number is NOT unique, within a
// volume or across volumes: Volume 46 prints 3637 for two distinct letters, and 3647, 3648 and 3649 recur
// independently in Volumes 46 and 47.
export type MurasoliLetterMeta = {
  id: string; // stable identity / route id, e.g. m54-l4016, m46-l3637-indre-selga-inithe-velga
  number: number | null; // the printed letter number where established — not guaranteed unique; null where an OCR-era record could not read it
  // The established ISO yyyy-mm-dd date where available. Its provenance varies by source record and cohort (a
  // letter's own sign-off, or the printed contents — e.g. Vol-47 Letter 3681, whose final source page is missing);
  // it is not universally taken from the sign-off block.
  date: string | null;
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
