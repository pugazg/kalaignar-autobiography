import type { Metadata } from "next";
import LettersCorpusSummary from "@/components/LettersCorpusSummary";
import LibraryCategoryPage from "@/components/LibraryCategoryPage";
import { categoryMetadata } from "@/data/read-categories";
import { loadMurasoliCorpusSummary } from "@/lib/murasoli-corpus";

export const metadata: Metadata = categoryMetadata("letters");

export default function Page() {
  // The corpus summary is derived on the server from public/data/murasoli and handed to the client page as a slot.
  return <LibraryCategoryPage shelf="letters" corpus={<LettersCorpusSummary summary={loadMurasoliCorpusSummary()} />} />;
}
