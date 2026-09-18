import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Wave7CinemaLanding from "@/components/Wave7CinemaLanding";
import { loadWave7Cinema } from "@/data/wave7-cinema";

// Wave 7 Batch 1 — direct cinema route (P3). Reachable by URL, but still absent from LIBRARY_WORKS,
// /read discovery and the sitemap until P4. Thin wrapper over the shared render layer.
const SLUG = "vandikkaran-magan" as const;

export function generateMetadata(): Metadata {
  const w = loadWave7Cinema(SLUG);
  if (!w) return { title: "Kalaignar Digital Library" };
  const title = `${w.titleTa} — ${w.titleEn} | Kalaignar Digital Library`;
  const description = `${w.titleEn} (${w.titleTa}) — the printed screenplay/dialogue booklet in the original Tamil with a project-created English reading layer. ${w.scenes.length} screenplay scenes.`;
  return { title, description, openGraph: { title, description }, twitter: { title: w.titleEn, description } };
}

export default function VandikkaranLandingPage() {
  const w = loadWave7Cinema(SLUG);
  if (!w) notFound();
  return <Wave7CinemaLanding work={w} />;
}
