import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import MurasoliReader from "@/components/MurasoliReader";
import MurasoliLetterReader from "@/components/MurasoliLetterReader";
import type { MurasoliIndex, MurasoliLettersIndex } from "@/data/murasoli";

function loadJSON<T>(rel: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf-8"));
  } catch {
    return null;
  }
}

const loadIndex = () => loadJSON<MurasoliIndex>("public/data/murasoli/index.json");
const loadLetters = () => loadJSON<MurasoliLettersIndex>("public/data/murasoli/letters-index.json");

export function generateStaticParams() {
  const idx = loadIndex();
  const letters = loadLetters();
  return [
    ...(idx ? idx.volumes.flatMap((v) => v.pages.map((pg) => ({ id: pg.id }))) : []),
    ...(letters ? letters.volumes.flatMap((v) => v.letters.map((l) => ({ id: l.id }))) : []),
  ];
}

export default function MurasoliRoute({ params }: { params: { id: string } }) {
  // Letters first: /murasoli/m54-l4016 renders the assembled letter.
  const letters = loadLetters();
  if (letters) {
    const flat = letters.volumes.flatMap((v) =>
      v.letters.map((l) => ({ ...l, volume: v.volume })),
    );
    const li = flat.findIndex((l) => l.id === params.id);
    if (li !== -1) {
      const pageIdx = loadIndex();
      const sourceUrl = pageIdx?.volumes.find((v) => v.volume === flat[li].volume)?.sourceUrl;
      return (
        <MurasoliLetterReader
          letter={flat[li]}
          prev={li > 0 ? flat[li - 1] : null}
          next={li < flat.length - 1 ? flat[li + 1] : null}
          sourceUrl={sourceUrl}
        />
      );
    }
  }

  // Otherwise a source page: /murasoli/m54-p0006.
  const idx = loadIndex();
  if (!idx) notFound();
  const flat = idx.volumes.flatMap((v) => v.pages.map((pg) => ({ ...pg, volume: v.volume })));
  const i = flat.findIndex((p) => p.id === params.id);
  if (i === -1) notFound();
  return (
    <MurasoliReader
      page={flat[i]}
      prev={i > 0 ? flat[i - 1] : null}
      next={i < flat.length - 1 ? flat[i + 1] : null}
    />
  );
}
