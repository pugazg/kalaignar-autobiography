/**
 * lib/archive.ts — the single data-access seam (Layer 3 → data).
 *
 * MIGRATION IN PROGRESS. During migration this module re-exports the existing
 * hand-authored `data/*.ts` so nothing breaks, while exposing an async
 * `loadArchive(name)` that reads generated JSON from `public/data/` when present.
 * As each section migrates, its component switches from the static import to
 * `loadArchive(...)`, and the corresponding `data/*.ts` is deleted.
 *
 * The rule: components import ONLY from here for archive data.
 */

export type ArchiveOrigin = "analyzer" | "curated" | "merged";

/** Fetch a generated website-JSON file, or null if not yet produced by the builder. */
export async function loadArchive<T = unknown>(name: string): Promise<T | null> {
  try {
    const res = await fetch(`/data/${name}.json`, { cache: "force-cache" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ——— Re-exports (removed one-by-one as sections migrate to loadArchive) ———
export {
  counters,
  numberCards,
  seatGrowth,
  assemblySplit1967,
  saidapetVotes,
  strikeRates,
} from "@/data/stats";
