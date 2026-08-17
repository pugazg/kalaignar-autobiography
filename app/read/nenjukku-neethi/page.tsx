import type { Metadata } from "next";
import NenjukkuNeethiLibrary from "@/components/NenjukkuNeethiLibrary";

export const metadata: Metadata = {
  title: "Nenjukku Neethi — the Complete Memoir | Kalaignar Digital Library",
  description:
    "Read the complete six-volume Nenjukku Neethi in the original Tamil — 391 chapters with title and full-text search, volume filters, bookmarks, reading position and citations.",
};

export default function NenjukkuNeethiCollection() {
  return <NenjukkuNeethiLibrary />;
}
