import type { Metadata } from "next";
import LibraryHome from "@/components/LibraryHome";

const description =
  "A digital library of the works of Kalaignar M. Karunanidhi in the original Tamil: the Nenjukku Neethi memoir, the Murasoli letters, and the Tholkappiya Poonga commentary — each in its own source-faithful reader.";

export const metadata: Metadata = {
  title: "Kalaignar Digital Library — கலைஞர் மின்னூலகம்",
  description,
  // Page-scoped overrides so the library home's share cards describe the whole
  // multi-work library, not only the memoir (the site-wide defaults live in the layout).
  openGraph: { title: "Kalaignar Digital Library — கலைஞர் மின்னூலகம்", description },
  twitter: { title: "Kalaignar Digital Library", description },
};

export default function ReadIndex() {
  return <LibraryHome />;
}
