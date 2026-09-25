// Reading Room IA v2 — the Letters category's corpus summary, DERIVED from the authoritative Murasoli data.
//
// `murasoli-letters` is one canonical LibraryWork whose content is a corpus of volumes and letters. The Letters
// category page summarises that corpus and hands off to /murasoli, which stays the detailed volume/sequence
// browser. Nothing here is a catalogue fact of its own: the counts and the volume range are read from the same
// two files /murasoli reads, so they cannot drift from it. Volumes and letters are never LibraryWorks.
import fs from "node:fs";
import path from "node:path";
import type { MurasoliIndex, MurasoliLettersIndex } from "@/data/murasoli";

export interface MurasoliCorpusSummary {
  volumeCount: number;
  firstVolume: number;
  lastVolume: number;
  letterCount: number;
}

/** Pure derivation, shared by the page and its validator. Throws if the two indexes disagree on the volumes. */
export function summarizeMurasoliCorpus(index: MurasoliIndex, letters: MurasoliLettersIndex): MurasoliCorpusSummary {
  const volumes = index.volumes.map((v) => v.volume).sort((a, b) => a - b);
  if (volumes.length === 0 || volumes.length !== index.volumeCount) {
    throw new Error(`murasoli-corpus: index.json volumeCount ${index.volumeCount} ≠ ${volumes.length} volumes`);
  }
  const letterVolumes = letters.volumes.map((v) => v.volume).sort((a, b) => a - b);
  if (letterVolumes.join(",") !== volumes.join(",")) {
    throw new Error(`murasoli-corpus: letters-index volumes [${letterVolumes}] ≠ index volumes [${volumes}]`);
  }
  for (const v of letters.volumes) {
    if (v.letterCount !== v.letters.length) {
      throw new Error(`murasoli-corpus: volume ${v.volume} letterCount ${v.letterCount} ≠ ${v.letters.length} letters`);
    }
  }
  return {
    volumeCount: index.volumeCount,
    firstVolume: volumes[0],
    lastVolume: volumes[volumes.length - 1],
    letterCount: letters.volumes.reduce((n, v) => n + v.letters.length, 0),
  };
}

const read = <T,>(rel: string): T => JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf-8")) as T;

/** Server-side: the summary of the live public Murasoli data (read at build time). */
export function loadMurasoliCorpusSummary(): MurasoliCorpusSummary {
  return summarizeMurasoliCorpus(
    read<MurasoliIndex>("public/data/murasoli/index.json"),
    read<MurasoliLettersIndex>("public/data/murasoli/letters-index.json"),
  );
}
