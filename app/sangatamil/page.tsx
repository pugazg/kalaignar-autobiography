import type { Metadata } from "next";
import SangatamilLanding from "@/components/SangatamilLanding";
import { loadSangatamil } from "@/lib/sangatamil-server";
import { toPublicSangatamilContents } from "@/lib/wave8-public-provenance";

// Wave 8 P3 — direct, undiscovered: reachable by URL, absent from the catalogue, /read and the sitemap until P4.
export function generateMetadata(): Metadata {
  const w = loadSangatamil();
  const sections = w.sections.filter((s) => s.kind === "section").length;
  return {
    title: `${w.title.ta} — ${w.title.en} | Kalaignar Digital Library`,
    description: `${w.title.en} by ${w.author.en} — plain-verse retellings of Sangam poems in ${sections} sections, with the Sangam verse, its printed source citation and glosses kept distinct; verified Tamil with a project-created English translation.`,
  };
}

export default function SangatamilPage() {
  return <SangatamilLanding work={toPublicSangatamilContents(loadSangatamil())} />;
}
