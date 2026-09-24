// Wave 8 (ஒரே முத்தம்) play slugs — Wave-8 HIDDEN helper registry (P3). SERVER-ONLY.
//
// `ore-mutham` becomes a DIRECT reader route family at P3 (landing, /source, and one route per printed scene) but stays
// ABSENT from the public PLAY_SLUGS / catalogue / discovery / sitemap until P4. The generic /plays/[slug] route family
// unions this registry with PLAY_SLUGS ∪ WAVE6_DRAMA_SLUGS ∪ WAVE7_DRAMA_SLUGS under a de-duplicating Set.
//
// Unlike earlier waves there is NO public/data/plays/ore-mutham payload: the play is built on the server from the hidden
// P1 data by the P2 adapter (lib/wave8-ore-mutham-adapter.ts), and the /source page receives only the allowlisted
// public projection. The [scene] set is the adapter's own readingUnits (the source's file stems: main-01 … main-30,
// nagai-suvai-01 … 03) — never a 1..N range, never 31–33.
import type { Play } from "@/data/plays";
import { toOreMuthamPlay } from "@/lib/wave8-ore-mutham-adapter";
import { toPublicOreMuthamSource } from "@/lib/wave8-public-provenance";
import type { PublicPlayHead, PublicPlayProvenance } from "@/lib/play-public-provenance";

export const WAVE8_DRAMA_SLUGS = ["ore-mutham"] as const;
export type Wave8DramaSlug = (typeof WAVE8_DRAMA_SLUGS)[number];
export const isWave8Drama = (slug: string): slug is Wave8DramaSlug => (WAVE8_DRAMA_SLUGS as readonly string[]).includes(slug);

let cached: Play | null = null;
/** The reader model for a Wave-8 play (built once per process from the hidden P1 data), or null for any other slug. */
export function loadWave8Play(slug: string): Play | null {
  if (!isWave8Drama(slug)) return null;
  cached ??= toOreMuthamPlay();
  return cached;
}

/** The public-safe /source projection for a Wave-8 play, or null for any other slug. */
export function loadWave8PlaySource(slug: string): { play: PublicPlayHead; prov: PublicPlayProvenance } | null {
  return isWave8Drama(slug) ? toPublicOreMuthamSource() : null;
}
