import type { Metadata } from "next";
import ThirukkuralLanding from "@/components/ThirukkuralLanding";
import { loadThirukkuralIndex, loadThirukkuralProvenance } from "@/data/thirukkural";

export const metadata: Metadata = {
  title: "திருக்குறள் — கலைஞர் உரை | Kalaignar Digital Library",
  description:
    "Thiruvalluvar's 1330 couplets with Kalaignar M. Karunanidhi's commentary, published from the archival edition.",
};

export default function Page() {
  return <ThirukkuralLanding index={loadThirukkuralIndex()} prov={loadThirukkuralProvenance()} />;
}
