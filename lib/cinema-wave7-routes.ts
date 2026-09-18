// Wave 7 Batch 1 cinema child-route slugs, derived from the frozen vendored payloads. This is the single
// authority for each work's `[section]` route set: the scene page builds its `generateStaticParams` from
// it. Following the Wave-5/Wave-6 lesson — the released payload is the route authority, NEVER a
// reconstructed 1..N numeric range. Each slug is the `sectionSlug` the normalizer computed from that
// scene's own navigation ordinal, so an unnumbered opening keeps its archival slot and no slug is invented.
import { loadWave7Cinema, type Wave7CinemaSlug } from "@/data/wave7-cinema";

/** `[section]` slugs for one Wave-7 B1 cinema work, in source order. Empty when the payload is unreadable. */
export function wave7CinemaSectionSlugs(slug: Wave7CinemaSlug): string[] {
  const work = loadWave7Cinema(slug);
  return work ? work.scenes.map((s) => s.sectionSlug) : [];
}
