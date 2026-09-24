import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import MurasoliReader from "@/components/MurasoliReader";
import MurasoliLetterReader from "@/components/MurasoliLetterReader";
import type { MurasoliIndex, MurasoliLettersIndex } from "@/data/murasoli";
import { loadWave8MurasoliLetters, toLetterMeta, type Wave8MurasoliLetter } from "@/lib/wave8-murasoli-reader";
import { toPublicWave8Letter } from "@/lib/wave8-public-provenance";

function loadJSON<T>(rel: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf-8"));
  } catch {
    return null;
  }
}

const loadIndex = () => loadJSON<MurasoliIndex>("public/data/murasoli/index.json");
const loadLetters = () => loadJSON<MurasoliLettersIndex>("public/data/murasoli/letters-index.json");

// Wave 8 (P3, hidden): Volumes 42–47 are served from the hidden P1 data through the P2 reader model — no public/data
// payload, never in the public indexes, the landing or the sitemap. Route ids are the source-derived `routeSlug`s
// (unique even where printed numbers repeat: two Vol-46 letters print 3637; 3647–3649 recur in Vols 46 and 47).
let wave8: Wave8MurasoliLetter[] | null = null;
const loadWave8 = () => (wave8 ??= loadWave8MurasoliLetters());

export function generateStaticParams() {
  const idx = loadIndex();
  const letters = loadLetters();
  // P4: the public letters index lists the published Wave-8 letters too; the Set keeps every id exactly once.
  const ids = [
    ...(idx ? idx.volumes.flatMap((v) => v.pages.map((pg) => pg.id)) : []),
    ...(letters ? letters.volumes.flatMap((v) => v.letters.map((l) => l.id)) : []),
    ...loadWave8().map((l) => l.id),
  ];
  return Array.from(new Set(ids)).map((id) => ({ id }));
}

export default function MurasoliRoute({ params }: { params: { id: string } }) {
  // Letters first: /murasoli/m54-l4016 renders the assembled letter.
  const letters = loadLetters();
  if (letters) {
    const flat = letters.volumes.flatMap((v) =>
      v.letters.map((l) => ({ ...l, volume: v.volume })),
    );
    const li = flat.findIndex((l) => l.id === params.id);
    // A published Wave-8 letter (P4): one continuous reading sequence with the existing volumes (…47 → 48…), its
    // body served from the server-side reader model through the public projection — never a public/data fetch.
    const w8Published = li !== -1 ? loadWave8().find((l) => l.id === params.id) : undefined;
    if (w8Published) {
      const inVol = flat.filter((l) => l.volume === flat[li].volume);
      const vi = inVol.findIndex((l) => l.id === flat[li].id);
      const alsoInVolume = [1, 2, 3].map((k) => inVol[(vi + k) % inVol.length]).filter((l) => l.id !== flat[li].id);
      return (
        <MurasoliLetterReader
          letter={flat[li]}
          prev={li > 0 ? flat[li - 1] : null}
          next={li < flat.length - 1 ? flat[li + 1] : null}
          alsoInVolume={alsoInVolume}
          content={toPublicWave8Letter(w8Published)}
        />
      );
    }
    if (li !== -1) {
      const pageIdx = loadIndex();
      const sourceUrl = pageIdx?.volumes.find((v) => v.volume === flat[li].volume)?.sourceUrl;
      // Three more letters from the same volume (following this one, wrapping).
      const inVol = flat.filter((l) => l.volume === flat[li].volume);
      const vi = inVol.findIndex((l) => l.id === flat[li].id);
      const alsoInVolume =
        vi === -1 ? [] : [1, 2, 3].map((k) => inVol[(vi + k) % inVol.length]).filter((l) => l.id !== flat[li].id);
      return (
        <MurasoliLetterReader
          letter={flat[li]}
          prev={li > 0 ? flat[li - 1] : null}
          next={li < flat.length - 1 ? flat[li + 1] : null}
          alsoInVolume={alsoInVolume}
          sourceUrl={sourceUrl}
        />
      );
    }
  }

  // Wave 8 letter NOT (yet) in the public index — the P3 direct-but-undiscovered state. Navigation stays inside
  // Volumes 42–47, so no public page links into an unpublished letter. Only the public projection crosses to the client.
  const w8 = loadWave8();
  const wi = w8.findIndex((l) => l.id === params.id);
  if (wi !== -1) {
    const l = w8[wi];
    const inVol = w8.filter((x) => x.volume === l.volume);
    const vi = inVol.findIndex((x) => x.id === l.id);
    const alsoInVolume = [1, 2, 3].map((k) => inVol[(vi + k) % inVol.length]).filter((x) => x.id !== l.id).map(toLetterMeta);
    return (
      <MurasoliLetterReader
        letter={toLetterMeta(l)}
        prev={wi > 0 ? toLetterMeta(w8[wi - 1]) : null}
        next={wi < w8.length - 1 ? toLetterMeta(w8[wi + 1]) : null}
        alsoInVolume={alsoInVolume}
        content={toPublicWave8Letter(l)}
      />
    );
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
