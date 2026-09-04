import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import RajaRaniReaderView from "@/components/RajaRaniReader";
import type { RajaRaniReader } from "@/data/raja-rani";

const DIR = "public/data/cinema/raja-rani";
function loadReader(): RajaRaniReader | null {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, "reader.json"), "utf-8")); } catch { return null; }
}
// Registry-driven route set: one slug per archival scene segment plus one per source-numbered song.
// Never a naked numeric range — the exact set comes from the frozen registries.
function slugs(r: RajaRaniReader): string[] {
  return [
    ...r.screenplayScenes.map((s) => `scene-${String(s.archivalSceneOrdinal).padStart(3, "0")}`),
    ...r.numberedSongs.map((s) => `song-${String(s.numberedSongNumber).padStart(2, "0")}`),
  ];
}

export function generateStaticParams() {
  const r = loadReader();
  return r ? slugs(r).map((section) => ({ section })) : [];
}

export function generateMetadata({ params }: { params: { section: string } }): Metadata {
  const r = loadReader();
  if (!r || !slugs(r).includes(params.section)) return { title: "Raja Rani — ராஜா ராணி | Kalaignar Digital Library" };
  let heading: string, en: string;
  if (params.section.startsWith("song-")) {
    const n = Number(params.section.replace("song-", ""));
    const s = r.numberedSongs.find((x) => x.numberedSongNumber === n)!;
    heading = s.tamilTitle; en = `Song ${n}`;
  } else {
    const ord = Number(params.section.replace("scene-", ""));
    heading = `களஞ்சியப் பகுதி ${ord}`; en = `Archive segment ${ord}`;
  }
  const title = `${heading} · ${r.work.titleTa} | Kalaignar Digital Library`;
  const description = `${en} — ${r.work.titleEn} (${r.work.titleTa}). Original Tamil with a project-created English reading layer.`;
  return { title, description, openGraph: { title, description }, twitter: { title: `${r.work.titleEn} — ${en}`, description } };
}

export default function RajaRaniSectionPage({ params }: { params: { section: string } }) {
  const r = loadReader();
  if (!r || !slugs(r).includes(params.section)) notFound();
  return <RajaRaniReaderView reader={r} slug={params.section} />;
}
