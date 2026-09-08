import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import AmmaiyappanSource from "@/components/AmmaiyappanSource";
import type { AmmaiyappanReader } from "@/data/ammaiyappan";

const DIR = "public/data/cinema/ammaiyappan";
function load<T>(file: string): T | null {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, file), "utf-8")); } catch { return null; }
}

export const metadata: Metadata = {
  title: "மூலமும் சான்றும் — Ammayappan source & provenance | Kalaignar Digital Library",
  description:
    "The controlling 1954 scan, page census, archival screenplay-segment structure (no source scene " +
    "numbering), the printed source witnesses kept as witnesses, the retained-song-occurrence safeguard, " +
    "and the integrity hashes behind the Digital Library's அம்மையப்பன் edition.",
};

export default function AmmaiyappanSourcePage() {
  const reader = load<AmmaiyappanReader>("reader.json");
  const prov = load<Parameters<typeof AmmaiyappanSource>[0]["prov"]>("provenance.json");
  if (!reader || !prov) notFound();
  return <AmmaiyappanSource reader={reader} prov={prov} />;
}
