/**
 * Citation generators for the archive's chapters, in the formats researchers
 * actually use. Every citation points at the stable chapter URL, so a reference
 * always resolves back to the exact source unit.
 */

export type Citable = {
  id: string;
  volume: number;
  title: string;
  pages: string; // e.g. "pp. 232–240"
};

const BASE = "https://nenjukkuneethi.org";
const AUTHOR = "Karunanidhi, M.";
const WORK = "நெஞ்சுக்கு நீதி (Nenjukku Neethi)";
const PUBLISHER = "Kalaignar Digital Library";

const pageRange = (p: string) => p.replace(/^pp?\.\s*/, "");

export function citeChicago(c: Citable): string {
  return `${AUTHOR} ${WORK}. Vol. ${c.volume}, "${c.title}," ${c.pages}. ${PUBLISHER}. ${BASE}/read/${c.id}.`;
}

export function citeMLA(c: Citable): string {
  return `${AUTHOR} "${c.title}." ${WORK}, vol. ${c.volume}, ${c.pages}. ${PUBLISHER}, ${BASE}/read/${c.id}.`;
}

export function citeBibTeX(c: Citable): string {
  const year = new Date().getFullYear();
  return [
    `@incollection{nenjukku_${c.id.replace(/-/g, "_")},`,
    `  author    = {Karunanidhi, M.},`,
    `  title     = {${c.title}},`,
    `  booktitle = {Nenjukku Neethi},`,
    `  volume    = {${c.volume}},`,
    `  pages     = {${pageRange(c.pages)}},`,
    `  publisher = {Kalaignar Digital Library},`,
    `  url       = {${BASE}/read/${c.id}},`,
    `  urldate   = {${year}}`,
    `}`,
  ].join("\n");
}

export function citeRIS(c: Citable): string {
  return [
    "TY  - CHAP",
    "AU  - Karunanidhi, M.",
    `T1  - ${c.title}`,
    "T2  - Nenjukku Neethi",
    `VL  - ${c.volume}`,
    `SP  - ${pageRange(c.pages)}`,
    "PB  - Kalaignar Digital Library",
    `UR  - ${BASE}/read/${c.id}`,
    "ER  - ",
  ].join("\n");
}

export const CITATION_FORMATS = [
  { id: "chicago", label: "Chicago", fn: citeChicago },
  { id: "mla", label: "MLA", fn: citeMLA },
  { id: "bibtex", label: "BibTeX", fn: citeBibTeX },
  { id: "ris", label: "RIS", fn: citeRIS },
] as const;
