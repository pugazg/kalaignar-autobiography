import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import TirumbippaarSource from "@/components/TirumbippaarSource";
import type { TirumbippaarIndex, TirumbippaarProvenance } from "@/data/tirumbippaar";

const DIR = "public/data/cinema/tirumbippaar";

function load<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, file), "utf-8"));
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "மூலமும் சான்றும் — Tirumbippaar source & provenance | Kalaignar Digital Library",
  description:
    "The controlling scan, printed edition evidence, scene structure, Tamil and English layer census, " +
    "song attribution and integrity aggregates behind the Digital Library's திரும்பிப்பார்! edition.",
};

export default function TirumbippaarSourcePage() {
  const idx = load<TirumbippaarIndex>("index.json");
  const prov = load<TirumbippaarProvenance>("provenance.json");
  if (!idx || !prov) notFound();
  return <TirumbippaarSource index={idx} prov={prov} />;
}
