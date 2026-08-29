import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import TirumbippaarLanding from "@/components/TirumbippaarLanding";
import type { TirumbippaarIndex, TirumbippaarProvenance } from "@/data/tirumbippaar";

const DIR = "public/data/cinema/tirumbippaar";

function load<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, file), "utf-8"));
  } catch {
    return null;
  }
}

export function generateMetadata(): Metadata {
  const idx = load<TirumbippaarIndex>("index.json");
  if (!idx) return { title: "Tirumbippaar — திரும்பிப்பார்! | Kalaignar Digital Library" };
  const title = `${idx.titleTa} — ${idx.titleEn} | Kalaignar Digital Library`;
  // Only what the source establishes. The cover credit is story and dialogue; no lyric authorship
  // is claimed, no production facts are invented, and no rights status is asserted.
  const description =
    `${idx.titleEn} (${idx.titleTa}) — the printed story-and-dialogue booklet, with story and dialogue by ` +
    `Kalaignar M. Karunanidhi. ${idx.sceneCount} scenes as printed, in the original Tamil with a ` +
    `project-created English reading layer.`;
  return { title, description, openGraph: { title, description }, twitter: { title: idx.titleEn, description } };
}

export default function TirumbippaarPage() {
  const idx = load<TirumbippaarIndex>("index.json");
  const prov = load<TirumbippaarProvenance>("provenance.json");
  if (!idx || !prov) notFound();
  return <TirumbippaarLanding index={idx} prov={prov} />;
}
