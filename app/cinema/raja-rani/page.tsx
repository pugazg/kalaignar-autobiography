import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import RajaRaniLanding from "@/components/RajaRaniLanding";
import type { RajaRaniReader } from "@/data/raja-rani";

const DIR = "public/data/cinema/raja-rani";
function loadReader(): RajaRaniReader | null {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, "reader.json"), "utf-8")); } catch { return null; }
}

export function generateMetadata(): Metadata {
  const r = loadReader();
  if (!r) return { title: "Raja Rani — ராஜா ராணி | Kalaignar Digital Library" };
  const title = `${r.work.titleTa} — ${r.work.titleEn} | Kalaignar Digital Library`;
  const description =
    `${r.work.titleEn} (${r.work.titleTa}) — the printed dialogue screenplay with ${r.counts.numberedSongs} ` +
    `numbered songs, in the original Tamil with a project-created English reading layer. ` +
    `The ${r.counts.scenes} screenplay segments are archival navigation; the booklet prints no scene numbers.`;
  return { title, description, openGraph: { title, description }, twitter: { title: r.work.titleEn, description } };
}

export default function RajaRaniPage() {
  const r = loadReader();
  if (!r) notFound();
  return <RajaRaniLanding reader={r} />;
}
