// Wave 6 (Batch 7: Short Stories) route helper registry.
//
// The 116 canonical Batch-7 short-story slugs, DERIVED from the frozen P1 manifest
// (data/internal/wave6/b7-short-stories.json) so there is one source of truth and no hand-copied drift;
// the P3 validator proves this registry equals the manifest exactly.
//
// P3 usage: the generic `/stories/[slug]` and `/stories/[slug]/source` routes prerender these slugs
// (URL-addressable) while they stay OUT of the discovered `STORY_SLUGS` (data/stories.ts), out of
// `LIBRARY_WORKS`, out of `LIBRARY_COLLECTIONS`, and out of the sitemap until Wave 6 Batch 7 P4. The
// route pages union this list with `STORY_SLUGS` under a de-duplicating `Set`, so each slug prerenders
// exactly once and unknown slugs still fail closed with `notFound()`.
import b7Manifest from "@/data/internal/wave6/b7-short-stories.json";

export const WAVE6_B7_STORY_SLUGS: readonly string[] = (b7Manifest as { groups: { slugs: { slug: string }[] }[] }).groups
  .flatMap((g) => g.slugs.map((s) => s.slug));
