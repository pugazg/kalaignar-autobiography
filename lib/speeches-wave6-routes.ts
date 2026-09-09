// Wave 6 (Batch 3: Speeches) undiscovered speech slugs.
//
// These three speeches are authorized for DIRECT reader routes only (Wave 6 P3). They are
// deliberately NOT in `SPEECH_SLUGS` (data/speeches.ts), which is the DISCOVERED speech registry that
// drives the catalogue, `/read` discovery and the sitemap. Keeping them here — and only here — lets
// the generic `/speeches/[slug]` route prerender them (so they are URL-addressable) while they stay
// absent from discovery/catalogue/sitemap until Wave 6 P4 (NOT authorized).
//
// A speech reader is single-page: each work has exactly two routes — the reader (`/speeches/<slug>`)
// and its source/provenance page (`/speeches/<slug>/source`). There is no per-section child route;
// the printed sections/units render inline as heading blocks. The batch's route test proves the exact
// 6-route set against this registry.
export const WAVE6_SPEECH_SLUGS = ["namathu-nilai", "idhaya-perikai", "palli-vazhkkai"] as const;
export type Wave6SpeechSlug = (typeof WAVE6_SPEECH_SLUGS)[number];
