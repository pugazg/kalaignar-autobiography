import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ManoharaSource from "@/components/ManoharaSource";
import type { ManoharaProvenance } from "@/data/manohara";

function loadProvenance(): ManoharaProvenance | null {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public/data/cinema/manohara/provenance.json"), "utf-8"),
    );
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "Manohara — Source & provenance | Kalaignar Digital Library",
  description:
    "Provenance for the Manohara (மனோகரா) reader: the 1954 printed booklet, its archive scan and identifier, source repository and commit, verification state, and integrity hashes — with source facts kept distinct from archive-derived navigation.",
};

export default function ManoharaSourcePage() {
  const prov = loadProvenance();
  if (!prov) notFound();
  return <ManoharaSource prov={prov} />;
}
