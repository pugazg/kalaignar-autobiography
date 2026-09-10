// Wave 6 (Batch 4: Poetry) undiscovered Poetry slugs.
//
// These eight works are authorized for DIRECT reader routes only (Wave 6 P3). They are deliberately
// NOT in `POEM_SLUGS` / `POETRY_PUBLICATION_SLUGS` (data/poems.ts), which are the DISCOVERED Poetry
// registries that drive the catalogue, `/read` discovery and the sitemap. Keeping the Wave-6 slugs
// here — and only here — lets the generic `/poems/[slug]` route family prerender them (so they are
// URL-addressable) while they stay absent from discovery/catalogue/sitemap until Wave 6 P4 (NOT
// authorized).
//
// Route shapes (proved exactly by the Batch-4 route test against these registries):
//   * six standalone poems — landing (`/poems/<slug>`) + `/source`;
//   * one multi-item publication (`kalaignarin-kaviyaranga-kavithaigal-1975`) — landing + `/source`
//     + one child route per source item (ordinals 01/02/04; there is no ordinal 03 — intake 03 is the
//     excluded non-Kalaignar Rajaji poem);
//   * one verse-novel publication (`oruthalaik-kathal`) — landing + `/source` + one child route per
//     source SECTION (11 sections; the child routes are the publication item routes, rendered as
//     sections, not independent poems).
// Child item/section routes are derived from each work's own frozen item registry in its
// public/data/poems/<slug>/publication.json, never from `1..N`.

/** Wave-6 STANDALONE poem slugs (each: landing + /source). NOT in POEM_SLUGS. */
export const WAVE6_POEM_SLUGS = [
  "thalaikettan-thambi",
  "aanthaiyum-arasanum",
  "poomudi",
  "anna-kaviyarangam",
  "gunanayagar-nehru",
  "kanchithan-annan",
] as const;
export type Wave6PoemSlug = (typeof WAVE6_POEM_SLUGS)[number];

/** Wave-6 PUBLICATION slugs (each: landing + /source + child item/section routes). NOT in
 *  POETRY_PUBLICATION_SLUGS. */
export const WAVE6_POETRY_PUBLICATION_SLUGS = [
  "kalaignarin-kaviyaranga-kavithaigal-1975",
  "oruthalaik-kathal",
] as const;
export type Wave6PoetryPublicationSlug = (typeof WAVE6_POETRY_PUBLICATION_SLUGS)[number];
