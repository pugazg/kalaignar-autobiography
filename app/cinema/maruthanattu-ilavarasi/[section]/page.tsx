import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Wave7CinemaScene from "@/components/Wave7CinemaScene";
import { loadWave7Cinema } from "@/data/wave7-cinema";
import { wave7CinemaSectionSlugs } from "@/lib/cinema-wave7-routes";

// Fail closed: only the slugs generateStaticParams emits (derived from the frozen payload, never a
// reconstructed 1..N range) exist; any other param is a hard 404, never rendered on demand.
const SLUG = "maruthanattu-ilavarasi" as const;
export const dynamicParams = false;

export function generateStaticParams() {
  return wave7CinemaSectionSlugs(SLUG).map((section) => ({ section }));
}

export function generateMetadata({ params }: { params: { section: string } }): Metadata {
  const w = loadWave7Cinema(SLUG);
  if (!w) return { title: "Kalaignar Digital Library" };
  const scene = w.scenes.find((s) => s.sectionSlug === params.section);
  if (!scene) return { title: `${w.titleTa} | Kalaignar Digital Library` };
  const label = scene.numberingIsPrinted && scene.sourceSceneNumber != null ? `காட்சி ${scene.sourceSceneNumber}` : `பகுதி ${scene.navOrdinal}`;
  const title = `${label} · ${w.titleTa} | Kalaignar Digital Library`;
  const description = `${label} — ${w.titleEn} (${w.titleTa}). Original Tamil with a project-created English reading layer.`;
  return { title, description, openGraph: { title, description }, twitter: { title: `${w.titleEn} — ${label}`, description } };
}

export default function MaruthanattuSectionPage({ params }: { params: { section: string } }) {
  const w = loadWave7Cinema(SLUG);
  if (!w || !w.scenes.some((s) => s.sectionSlug === params.section)) notFound();
  return <Wave7CinemaScene work={w} slug={params.section} />;
}
