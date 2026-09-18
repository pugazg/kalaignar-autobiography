import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Wave7CinemaSource from "@/components/Wave7CinemaSource";
import { loadWave7Cinema, loadWave7CinemaProvenance } from "@/data/wave7-cinema";

const SLUG = "maruthanattu-ilavarasi" as const;

export function generateMetadata(): Metadata {
  const w = loadWave7Cinema(SLUG);
  const title = w ? `மூலமும் சான்றும் — ${w.titleEn} source & provenance | Kalaignar Digital Library` : "Kalaignar Digital Library";
  return { title, description: "The controlling scan (recorded by SHA-256, not vendored), source repository pins, the vendored Reading-Room payload SHA, the source-verified structure counts, and the English reading-layer status behind this Digital Library edition." };
}

export default function MaruthanattuSourcePage() {
  const w = loadWave7Cinema(SLUG);
  const prov = loadWave7CinemaProvenance(SLUG);
  if (!w || !prov) notFound();
  return <Wave7CinemaSource work={w} prov={prov} />;
}
