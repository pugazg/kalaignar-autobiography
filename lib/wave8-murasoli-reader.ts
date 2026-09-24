// Wave 8 P2 — Murasoli Volumes 42–47 reader model (SERVER-ONLY; reads the hidden P1 data).
//
// Source: data/internal/wave8/murasoli/volume-NN.json (generated at P1 from the frozen archive). Nothing here reads or
// writes public/data: the live Volumes 48–54 keep their own payload and fetch path, and no /murasoli route can serve
// these letters until P3 makes them addressable. The model keeps what the older OCR-era payload could not:
//   • the printed letter number EXACTLY (Vol 42 prints 3154; Vol 46 prints 3637 twice; 3647–3649 recur in Vols 46/47) —
//     identity is the source-derived id, the display is the printed number, never normalised;
//   • the Tamil as PAGE SEGMENTS with scan (PDF) and printed-page attribution — page identity is never lost;
//   • the released English with its translation provenance, the translator's note kept apart from the text;
//   • the permanent source condition of Letter 3681 (printed page 252 absent) — carried, never filled.
import fs from "node:fs";
import path from "node:path";
import type { MurasoliLetterMeta } from "@/data/murasoli";

export const WAVE8_MURASOLI_VOLUMES = [42, 43, 44, 45, 46, 47] as const;

type P1Letter = {
  id: string; routeSlug: string; volume: number; printedNumber: number; sourceStem: string;
  titleTa: string; titleTaContents?: string; titleEn: string;
  datePrinted: string | null; dateIso: string | null; dateSource?: string;
  pdfPages: [number, number]; printedPages: [number | null, number | null];
  sourceStatus: string;
  qualification?: { kind: "source-incomplete"; missingPrintedPages: number[]; lastAvailablePrintedPage: number | null; note: string };
  tamil: { pages: { pdfPage: number; printedPage: number | null; tamil: string }[] };
  english: { releaseState: string; translationMethod: string | null; heading: string; subtitle?: string; translatorNote: string | null; text: string };
};
type P1Volume = { volume: number; sourcePath: string; sourceTree: string; controllingSource: { filename: string; sha256: string | null; pdfPages: number }; letters: P1Letter[] };

/** One letter's complete reader payload. Everything a reader or /source surface needs; nothing internal. */
export type Wave8MurasoliLetter = {
  /** Route-safe slug (for P3); the display never uses it. */
  id: string;
  /** Source-derived canonical id (m{volume}-{chapter file stem}). */
  sourceId: string;
  volume: number;
  /** The number EXACTLY as the source prints it. Not unique across or even within volumes. */
  printedNumber: number;
  title: { ta: string; en: string; taAsInContents?: string };
  date: { iso: string | null; printed: string | null; fromPrintedContents: boolean };
  pdfPages: [number, number];
  printedPages: [number | null, number | null];
  tamilPages: { pdfPage: number; printedPage: number | null; text: string }[];
  /** The released English (every Wave-8 letter's English is released; the loader refuses one that is not). */
  english: { text: string; subtitle: string | null; translatorNote: string | null; method: string | null };
  /** Permanent source condition — present only for Letter 3681 in this scope. */
  qualification: { kind: "source-incomplete"; missingPrintedPages: number[]; lastAvailablePrintedPage: number | null } | null;
  source: { filename: string; sha256: string | null; pdfPageCount: number };
};

const dir = () => path.join(process.cwd(), "data/internal/wave8/murasoli");

export function loadWave8MurasoliVolume(volume: number): P1Volume {
  return JSON.parse(fs.readFileSync(path.join(dir(), `volume-${volume}.json`), "utf8")) as P1Volume;
}

export function toWave8Letter(v: P1Volume, l: P1Letter): Wave8MurasoliLetter {
  // Fail closed: only released English reaches a reader. (Release state itself is workflow and is not carried.)
  if (!/^(verified|release-ready)/.test(l.english.releaseState)) throw new Error(`${l.id}: English not released (${l.english.releaseState})`);
  return {
    id: l.routeSlug,
    sourceId: l.id,
    volume: l.volume,
    printedNumber: l.printedNumber,
    title: { ta: l.titleTa, en: l.titleEn, ...(l.titleTaContents ? { taAsInContents: l.titleTaContents } : {}) },
    date: { iso: l.dateIso, printed: l.datePrinted, fromPrintedContents: l.dateSource === "printed-contents" },
    pdfPages: l.pdfPages,
    printedPages: l.printedPages,
    tamilPages: l.tamil.pages.map((p) => ({ pdfPage: p.pdfPage, printedPage: p.printedPage, text: p.tamil })),
    english: {
      text: l.english.text,
      subtitle: l.english.subtitle ?? null,
      translatorNote: l.english.translatorNote,
      method: l.english.translationMethod,
    },
    qualification: l.qualification ? { kind: l.qualification.kind, missingPrintedPages: l.qualification.missingPrintedPages, lastAvailablePrintedPage: l.qualification.lastAvailablePrintedPage } : null,
    source: { filename: v.controllingSource.filename, sha256: v.controllingSource.sha256, pdfPageCount: v.controllingSource.pdfPages },
  };
}

/**
 * All 342 Wave-8 letters in READING order: volume, then the source's own page order. (The P1 files list letters by
 * chapter-file name, which would put Vol 42's printed-3154 letter first; in the book it is printed at PDF 92, between
 * 3376 and 3378. Page order is the source order, and no page is shared between letters.)
 */
export function loadWave8MurasoliLetters(): Wave8MurasoliLetter[] {
  return WAVE8_MURASOLI_VOLUMES.flatMap((n) => {
    const v = loadWave8MurasoliVolume(n);
    return v.letters.map((l) => toWave8Letter(v, l)).sort((a, b) => a.pdfPages[0] - b.pdfPages[0]);
  });
}

/** The legacy reader's letter meta for a Wave-8 letter (printed number, never a corrected one). */
export function toLetterMeta(l: Wave8MurasoliLetter): MurasoliLetterMeta & { volume: number } {
  return { id: l.id, number: l.printedNumber, date: l.date.iso, title: { ta: l.title.ta, en: l.title.en }, pages: [], volume: l.volume };
}
