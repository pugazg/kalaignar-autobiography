import type { Metadata } from "next";
import TholkappiyamLibrary from "@/components/TholkappiyamLibrary";

export const metadata: Metadata = {
  title: "Tholkappiya Poonga — தொல்காப்பியப் பூங்கா | Kalaignar Digital Library",
  description:
    "Kalaignar M. Karunanidhi's commentary on the Tolkāppiyam — 100 malars opening the ancient Tamil grammar as a garden in bloom, in original Tamil with sutra references and citations.",
};

export default function TholkappiyamPage() {
  return <TholkappiyamLibrary />;
}
