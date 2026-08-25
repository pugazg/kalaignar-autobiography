import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ParasakthiLanding from "@/components/ParasakthiLanding";
import type { ParasakthiIndex } from "@/data/parasakthi";

function loadIndex(): ParasakthiIndex | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/cinema/parasakthi/index.json"), "utf-8"));
  } catch {
    return null;
  }
}

export function generateMetadata(): Metadata {
  const idx = loadIndex();
  if (!idx) return { title: "Parasakthi — பராசக்தி | Kalaignar Digital Library" };
  const title = `${idx.titleTa} — ${idx.titleEn} | Kalaignar Digital Library`;
  // Only what the source establishes. `project-created` is accurate for the English layer; no
  // review claim is made, and the songs are not attributed to Kalaignar here.
  const description =
    `${idx.titleEn} (${idx.titleTa}) — the printed dialogue-and-songs booklet of the 1952 film, with screenplay ` +
    `and dialogue by Kalaignar M. Karunanidhi. ${idx.sceneCount} scenes as printed, in the original Tamil with a ` +
    `project-created English reading layer.`;
  return { title, description, openGraph: { title, description }, twitter: { title: idx.titleEn, description } };
}

export default function ParasakthiPage() {
  const idx = loadIndex();
  if (!idx) notFound();
  return <ParasakthiLanding index={idx} />;
}
