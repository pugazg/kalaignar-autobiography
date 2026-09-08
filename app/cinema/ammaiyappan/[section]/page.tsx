import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import AmmaiyappanReaderView from "@/components/AmmaiyappanReader";
import type { AmmaiyappanReader } from "@/data/ammaiyappan";
import { ammaiyappanSectionSlugs } from "@/lib/cinema-wave6-routes";

// Fail closed: only the slugs generateStaticParams emits exist; any other param is a hard 404,
// never rendered on demand.
export const dynamicParams = false;

const DIR = "public/data/cinema/ammaiyappan";
function loadReader(): AmmaiyappanReader | null {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, "reader.json"), "utf-8")); } catch { return null; }
}

export function generateStaticParams() {
  const r = loadReader();
  return r ? ammaiyappanSectionSlugs(r).map((section) => ({ section })) : [];
}

export function generateMetadata({ params }: { params: { section: string } }): Metadata {
  const r = loadReader();
  if (!r || !ammaiyappanSectionSlugs(r).includes(params.section)) return { title: "Ammayappan — அம்மையப்பன் | Kalaignar Digital Library" };
  const ord = Number(params.section.replace("scene-", ""));
  const heading = `களஞ்சியப் பகுதி ${ord}`;
  const en = `Archive segment ${ord}`;
  const title = `${heading} · ${r.work.titleTa} | Kalaignar Digital Library`;
  const description = `${en} — ${r.work.titleEn} (${r.work.titleTa}). Original Tamil with a project-created English reading layer.`;
  return { title, description, openGraph: { title, description }, twitter: { title: `${r.work.titleEn} — ${en}`, description } };
}

export default function AmmaiyappanSectionPage({ params }: { params: { section: string } }) {
  const r = loadReader();
  if (!r || !ammaiyappanSectionSlugs(r).includes(params.section)) notFound();
  return <AmmaiyappanReaderView reader={r} slug={params.section} />;
}
