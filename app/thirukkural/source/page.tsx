import type { Metadata } from "next";
import ThirukkuralSource from "@/components/ThirukkuralSource";
import { loadThirukkuralIndex, loadThirukkuralProvenance } from "@/data/thirukkural";

export const metadata: Metadata = {
  title: "மூலமும் சான்றும் — திருக்குறள் கலைஞர் உரை | Kalaignar Digital Library",
  description: "The controlling source, page correspondence and textual fidelity of this edition.",
};

export default function Page() {
  return <ThirukkuralSource index={loadThirukkuralIndex()} prov={loadThirukkuralProvenance()} />;
}
