import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KuraloviyamSource from "@/components/KuraloviyamSource";
import { loadKuraloviyamProvenance } from "@/lib/kuraloviyam-server";
import { toPublicKuraloviyamProvenance } from "@/lib/kuraloviyam-public-provenance";

export const metadata: Metadata = {
  title: "Source & provenance — குறளோவியம் · Kuraloviyam | Kalaignar Digital Library",
  description:
    "Source and provenance for Kuraloviyam: the 666-scan printed book supplied as six split files, visual verification 666/666, Tamil text verified on 662 pages, English on 662, and the four permanently source-limited scans (13, 14, 15, 19).",
};

export default function KuraloviyamSourcePage() {
  const prov = loadKuraloviyamProvenance();
  if (!prov) notFound();
  // Server → client boundary: only the allowlisted public projection is serialized into the page.
  return <KuraloviyamSource prov={toPublicKuraloviyamProvenance(prov)} />;
}
