import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ParasakthiSource from "@/components/ParasakthiSource";
import type { ParasakthiIndex, ParasakthiProvenance } from "@/data/parasakthi";

const DIR = "public/data/cinema/parasakthi";
function load<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, file), "utf-8"));
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "மூலமும் சான்றும் — பராசக்தி | Kalaignar Digital Library",
  description:
    "Provenance for Parasakthi: the controlling scan, the credits as printed, the 46 observed scene headings and the two that are not printed, the transposed late scene numbers, the Tamil and project-created English layers, the booklet-wide versus item-level song attribution and its evidence tiers, and the integrity hashes.",
};

export default function ParasakthiSourcePage() {
  const index = load<ParasakthiIndex>("index.json");
  const prov = load<ParasakthiProvenance>("provenance.json");
  if (!index || !prov) notFound();
  return <ParasakthiSource index={index} prov={prov} />;
}
