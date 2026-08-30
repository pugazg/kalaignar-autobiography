import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ThiraiIsaiPaadalgalLanding from "@/components/ThiraiIsaiPaadalgalLanding";
import type { FilmSongIndex } from "@/data/thirai-isai-paadalgal";

const DIR = "public/data/cinema/thirai-isai-paadalgal";

function load<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, file), "utf-8"));
  } catch {
    return null;
  }
}

export function generateMetadata(): Metadata {
  const idx = load<FilmSongIndex>("index.json");
  if (!idx) return { title: "கலைஞர் திரை இசைப் பாடல்கள் | Kalaignar Digital Library" };
  const title = `${idx.titleTa} — ${idx.titleEn} | Kalaignar Digital Library`;
  // Reader-facing only. No compiler, publisher, ISBN, edition, page count, witness or evidence
  // language, and no per-song authorship claim: the collection title is the archive's own, and
  // nothing here extends it into a claim about any individual lyric.
  const description =
    `${idx.titleEn} (${idx.titleTa}) — film-song lyrics grouped by film, in the original Tamil ` +
    `with a project-created English reading layer.`;
  return { title, description, openGraph: { title, description }, twitter: { title: idx.titleEn, description } };
}

export default function ThiraiIsaiPaadalgalPage() {
  // Only the served runtime registry. The work's archival provenance lives outside the served tree
  // and is read by the importer, the validator and CI alone — no route or component loads it.
  const idx = load<FilmSongIndex>("index.json");
  if (!idx) notFound();
  return <ThiraiIsaiPaadalgalLanding index={idx} />;
}
