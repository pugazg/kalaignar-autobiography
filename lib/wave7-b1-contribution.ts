// Wave 7 Batch 1's exact contribution to the public surface, derived from real data (not hand-typed
// literals). Earlier-wave integration validators import this to stay green after this batch publishes:
// they ADD these deltas to their live-total assertions and SUBTRACT them from scope-specific claims
// ("only Fiction grew", the Wave-6 control-record snapshots) — the same reconciliation Batch-7 used
// against the Wave-6 P4 validator. Single source of truth: change the batch, change this once.
import { WAVE7_CINEMA_SLUGS } from "@/data/wave7-cinema";
import p3 from "@/data/internal/wave7/b1-p3-routes.json";

export const WAVE7_B1_SLUGS: readonly string[] = WAVE7_CINEMA_SLUGS;

export const WAVE7_B1_CONTRIBUTION = {
  /** New published works — all on the cinema-writing shelf. */
  works: WAVE7_CINEMA_SLUGS.length, // 3
  /** New cinema-writing shelf works. */
  cinema: WAVE7_CINEMA_SLUGS.length, // 3
  /** New /read discovery entries — all standalone (no collection membership). */
  discovery: WAVE7_CINEMA_SLUGS.length, // 3
  /** New collections. */
  collections: 0,
  /** New sitemap URLs == new prerendered routes (each route is one static page). */
  sitemap: p3.totalRouteCount as number, // 133
  /** New prerendered routes / .html files. */
  build: p3.totalRouteCount as number, // 133
} as const;
