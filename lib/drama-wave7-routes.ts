// Wave 7 (Batch 2: Drama) play slugs — Wave-7 HIDDEN helper registry (P3).
//
// The two Wave-7 Batch-2 plays are onboarded as DIRECT reader routes at P3 but stay ABSENT from the public
// PLAY_SLUGS / catalogue / discovery / sitemap until P4. The generic /plays/[slug] route family unions this
// registry with PLAY_SLUGS ∪ WAVE6_DRAMA_SLUGS under a de-duplicating Set, so each slug prerenders once.
// Each [scene] set is derived from the work's own frozen play.json.readingUnits — never a 1..N range.
export const WAVE7_DRAMA_SLUGS = ["iratha-kanneer", "nachuk-koppai"] as const;
export type Wave7DramaSlug = (typeof WAVE7_DRAMA_SLUGS)[number];
export const isWave7Drama = (slug: string): slug is Wave7DramaSlug =>
  (WAVE7_DRAMA_SLUGS as readonly string[]).includes(slug);
