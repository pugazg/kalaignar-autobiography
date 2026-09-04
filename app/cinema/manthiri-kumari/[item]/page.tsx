import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ManthiriKumariReader from "@/components/ManthiriKumariReader";
import type { ManthiriReader } from "@/data/manthiri-kumari";
import { manthiriItemSlugs } from "@/lib/cinema-wave5-routes";

// Fail closed: only the slugs generateStaticParams emits exist; any other param is a hard 404,
// never rendered on demand.
export const dynamicParams = false;

const DIR = "public/data/cinema/manthiri-kumari";
function loadReader(): ManthiriReader | null {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, "reader.json"), "utf-8")); } catch { return null; }
}

export function generateStaticParams() {
  const r = loadReader();
  return r ? manthiriItemSlugs(r).map((item) => ({ item })) : [];
}

export function generateMetadata({ params }: { params: { item: string } }): Metadata {
  const r = loadReader();
  if (!r || !manthiriItemSlugs(r).includes(params.item)) return { title: "Manthiri Kumari — மந்திரி குமாரி | Kalaignar Digital Library" };
  let heading = r.storySummary.titleTa, en = "Story summary";
  if (params.item !== "story-summary") {
    const ord = Number(params.item.replace("performance-", ""));
    const p = r.performances.find((x) => x.sourceOrder === ord);
    if (p) { heading = p.headingTa; en = p.headingEn; }
  }
  const title = `${heading} · ${r.work.titleTa} | Kalaignar Digital Library`;
  const description = `${en} — ${r.work.titleEn} (${r.work.titleTa}), the printed film story-and-song booklet. Original Tamil with a project-created English reading layer.`;
  return { title, description, openGraph: { title, description }, twitter: { title: `${r.work.titleEn} — ${en}`, description } };
}

export default function ManthiriKumariItemPage({ params }: { params: { item: string } }) {
  const r = loadReader();
  if (!r || !manthiriItemSlugs(r).includes(params.item)) notFound();
  return <ManthiriKumariReader reader={r} slug={params.item} />;
}
