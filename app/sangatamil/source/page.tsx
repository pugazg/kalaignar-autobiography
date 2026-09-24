import type { Metadata } from "next";
import SangatamilSource from "@/components/SangatamilSource";
import { loadSangatamil } from "@/lib/sangatamil-server";
import { toPublicSangatamilProvenance } from "@/lib/wave8-public-provenance";

export function generateMetadata(): Metadata {
  const w = loadSangatamil();
  return {
    title: `Source & provenance — ${w.title.ta} | Kalaignar Digital Library`,
    description: `${w.title.en}: the controlling scan (${w.source.physicalScans} pages), the source repository commit, the printed source citations, and the one permanently source-limited page (the handwritten foreword letter, not transcribed).`,
  };
}

// Server → client boundary: only the allowlisted public projection crosses (lib/wave8-public-provenance).
export default function SangatamilSourcePage() {
  return <SangatamilSource prov={toPublicSangatamilProvenance(loadSangatamil())} />;
}
