import type { Metadata } from "next";
import MurasoliLibrary from "@/components/MurasoliLibrary";

export const metadata: Metadata = {
  title: "Murasoli — Letters to Udanpirappukkal | Kalaignar Digital Library",
  description:
    "Karunanidhi's letters to udanpirappukkal, published in Murasoli — a growing archive of the collected volumes in original Tamil, with citations.",
};

export default function MurasoliPage() {
  return <MurasoliLibrary />;
}
