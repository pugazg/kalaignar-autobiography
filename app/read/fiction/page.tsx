import type { Metadata } from "next";
import LibraryCategoryPage from "@/components/LibraryCategoryPage";
import { categoryMetadata } from "@/data/read-categories";

export const metadata: Metadata = categoryMetadata("fiction");

export default function Page() {
  return <LibraryCategoryPage shelf="fiction" />;
}
