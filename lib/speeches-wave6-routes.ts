// Wave 6 (Batch 3: Speeches) speech slugs — Wave-6 helper registry.
//
// These three speeches were onboarded as DIRECT reader routes in Wave 6 P3 and PUBLISHED in Wave 6 P4:
// they are now promoted into `SPEECH_SLUGS` (data/speeches.ts) — the discovered speech registry that
// drives the catalogue, `/read` discovery and the sitemap. This Wave-6 registry is retained for
// classification and route-union composition; the generic `/speeches/[slug]` route unions it with
// `SPEECH_SLUGS` under a de-duplicating `Set`, so each slug prerenders exactly once.
//
// A speech reader is single-page: each work has exactly two routes — the reader (`/speeches/<slug>`)
// and its source/provenance page (`/speeches/<slug>/source`). There is no per-section child route;
// the printed sections/units render inline as heading blocks. The batch's route test proves the exact
// 6-route set against this registry.
export const WAVE6_SPEECH_SLUGS = ["namathu-nilai", "idhaya-perikai", "palli-vazhkkai"] as const;
export type Wave6SpeechSlug = (typeof WAVE6_SPEECH_SLUGS)[number];
