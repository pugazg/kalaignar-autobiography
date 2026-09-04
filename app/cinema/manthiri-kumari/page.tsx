import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ManthiriKumariLanding from "@/components/ManthiriKumariLanding";
import type { ManthiriReader } from "@/data/manthiri-kumari";

const DIR = "public/data/cinema/manthiri-kumari";
function loadReader(): ManthiriReader | null {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, "reader.json"), "utf-8")); } catch { return null; }
}

export function generateMetadata(): Metadata {
  const r = loadReader();
  if (!r) return { title: "Manthiri Kumari — மந்திரி குமாரி | Kalaignar Digital Library" };
  const title = `${r.work.titleTa} — ${r.work.titleEn} | Kalaignar Digital Library`;
  const description =
    `${r.work.titleEn} (${r.work.titleTa}) — the printed film story-and-song booklet, with story and ` +
    `dialogue by Kalaignar M. Karunanidhi. A continuous story summary and ${r.counts.performanceBlocks} ` +
    `song/performance blocks in the original Tamil with a project-created English reading layer.`;
  return { title, description, openGraph: { title, description }, twitter: { title: r.work.titleEn, description } };
}

export default function ManthiriKumariPage() {
  const r = loadReader();
  if (!r) notFound();
  return <ManthiriKumariLanding reader={r} />;
}
