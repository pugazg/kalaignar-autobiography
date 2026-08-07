import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import TholkappiyamReader from "@/components/TholkappiyamReader";
import type { TpIndex } from "@/data/tholkappiyam";

function loadIndex(): TpIndex | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/tholkappiyam/index.json"), "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  const idx = loadIndex();
  return idx ? idx.malars.map((m) => ({ id: m.id })) : [];
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const idx = loadIndex();
  const m = idx?.malars.find((x) => x.id === params.id);
  if (!m) return { title: "Tholkappiya Poonga | Kalaignar Digital Library" };
  const num = m.kind === "malar" ? `மலர் ${m.number} · ` : "";
  return {
    title: `${num}${m.title.ta} — தொல்காப்பியப் பூங்கா | Kalaignar Digital Library`,
    description: m.summary || `Kalaignar's commentary on the Tolkāppiyam — ${m.title.ta}.`,
  };
}

export default function TholkappiyamMalarRoute({ params }: { params: { id: string } }) {
  const idx = loadIndex();
  if (!idx) notFound();
  const i = idx.malars.findIndex((m) => m.id === params.id);
  if (i === -1) notFound();
  const malar = idx.malars[i];

  // Three more blossoms from the same அதிகாரம் (following this one, wrapping).
  const adhKey = malar.adhikaram?.key;
  const siblings = adhKey ? idx.malars.filter((m) => m.kind === "malar" && m.adhikaram?.key === adhKey) : [];
  const si = siblings.findIndex((m) => m.id === malar.id);
  const alsoInAdhikaram =
    si === -1 ? [] : [1, 2, 3].map((k) => siblings[(si + k) % siblings.length]).filter((m) => m.id !== malar.id);

  return (
    <TholkappiyamReader
      malar={malar}
      prev={i > 0 ? idx.malars[i - 1] : null}
      next={i < idx.malars.length - 1 ? idx.malars[i + 1] : null}
      alsoInAdhikaram={alsoInAdhikaram}
      collection={{ publisher: idx.publisher, year: idx.year, sourceRepo: idx.sourceRepo, work: idx.work }}
    />
  );
}
