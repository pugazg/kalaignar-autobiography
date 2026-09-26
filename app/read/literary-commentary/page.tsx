import type { Metadata } from "next";
import LibraryCategoryPage from "@/components/LibraryCategoryPage";
import { categoryMetadata } from "@/data/read-categories";

export const metadata: Metadata = categoryMetadata("literary-commentary");

export default function Page() {
  return <LibraryCategoryPage shelf="literary-commentary" />;
}
