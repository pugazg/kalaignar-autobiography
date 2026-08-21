import type { Metadata } from "next";
import DailyKural from "@/components/DailyKural";
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

/**
 * WHY THIS PAGE REVALIDATES.
 *
 * /read is otherwise fully static, and a statically prerendered page would freeze இன்றைய குறள் at
 * whatever the build date was — the "daily" Kural would then never change until the next deploy,
 * which is the one thing this feature must not do. Revalidating regenerates the page on the server
 * on a timer, so the selection follows the Indian calendar day without any client-side date logic
 * and without giving up static delivery.
 *
 * Fifteen minutes is the granularity of the handover, not of the feature: the Kural itself changes
 * once, at midnight IST, and this only bounds how long after midnight a cached page can still show
 * yesterday's. The page is cheap to regenerate, so the bound is kept tight.
 */
export const revalidate = 900;

export default function ReadIndex() {
  // DailyKural is a server component, so it is passed as an element into the client-side
  // LibraryHome rather than imported by it. This keeps the date resolution on the server.
  return <LibraryHome dailyKural={<DailyKural />} />;
}
