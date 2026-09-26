import type { Metadata } from "next";
import LibraryHome from "@/components/LibraryHome";

const description =
  "Browse the works of Kalaignar M. Karunanidhi by category — life writing, letters, fiction, poetry, drama, cinema writing, speeches, essays and literary commentary — in the original Tamil, each in its own source-faithful reader.";

export const metadata: Metadata = {
  title: "Kalaignar Digital Library — கலைஞர் மின்னூலகம்",
  description,
  // Page-scoped overrides so the library home's share cards describe the whole
  // multi-work library, not only the memoir (the site-wide defaults live in the layout).
  openGraph: { title: "Kalaignar Digital Library — கலைஞர் மின்னூலகம்", description },
  twitter: { title: "Kalaignar Digital Library", description },
};

// Reading Room IA v2 R2-B: /read is the category-first landing — nine category cards, no Daily Kural. The
// `revalidate = 900` that kept the daily Kural current existed only for that panel and is gone with it, so the page
// is fully static again. The Daily Kural component, its selection logic and its test are unchanged; no other page
// renders it (R2-B authorizes no new placement).
export default function ReadIndex() {
  return <LibraryHome />;
}
