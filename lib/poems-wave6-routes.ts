// Wave 6 (Batch 4: Poetry) Poetry slugs — Wave-6 helper registry.
//
// These eight works were onboarded as DIRECT reader routes in Wave 6 P3 and PUBLISHED in Wave 6 P4:
// they are now promoted into `POEM_SLUGS` / `POETRY_PUBLICATION_SLUGS` (data/poems.ts) — the discovered
// Poetry registries that drive the catalogue, `/read` discovery and the sitemap. This Wave-6 registry
// is retained for classification and route-union composition; the generic `/poems/[slug]` route family
// unions it with the public registries under a de-duplicating `Set`, so each slug prerenders once.
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
