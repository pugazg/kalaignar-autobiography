import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KuraloviyamLanding from "@/components/KuraloviyamLanding";
import { loadKuraloviyamIndex } from "@/lib/kuraloviyam-server";

export const metadata: Metadata = {
  title: "குறளோவியம் — Kuraloviyam | Kalaignar Digital Library",
  description:
    "Kalaignar M. Karunanidhi's Kuraloviyam — 300 entries in the order of the book's printed contents, verified Tamil with a project-created English translation. All 666 scans are visually verified; the Tamil text is verified on 662, and four source-limited scans are never reconstructed.",
};

export default function KuraloviyamPage() {
  const index = loadKuraloviyamIndex();
  if (!index) notFound();
  return <KuraloviyamLanding index={index} />;
}
