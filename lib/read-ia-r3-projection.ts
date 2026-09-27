// Reading Room IA v2 R3 — the PRE-R3 PROJECTION of the live catalogue, for earlier-wave validators whose assertions
// are about specific records or shelf membership rather than counts (counts use lib/read-ia-r3-contribution.ts).
//
// The projection removes exactly the R3 identities published in the current stage state and restores exactly the
// publications R3 has demoted, from their LibraryPublication record (the former LibraryWork verbatim, minus `state`),
// so a historical assertion keeps its full strength against the records it was written for. test-r3-identity pins
// the other direction: that the removed and restored sets are exactly the stage's authorized delta.
import { LIBRARY_PUBLICATIONS, type LibraryWork } from "@/data/library";
import { R3_IDENTITY } from "./work-relations";

const PUBLISHED = new Set(R3_IDENTITY.works.filter((w) => w.state === "published").map((w) => w.id));

/** True for a LibraryWork that is an R3-published identity (not a pre-R3 record). */
export const isR3Published = (w: { id: string }) => PUBLISHED.has(w.id);

/** The former LibraryWork record of every publication demoted so far, restored verbatim (it was published). */
export const R3_RESTORED_PUBLICATIONS: LibraryWork[] = LIBRARY_PUBLICATIONS.map(
  ({ kind: _kind, demotedIn: _demotedIn, ...rest }) => ({ ...rest, state: "published" }) as LibraryWork,
);

/** A live list of LibraryWorks projected back to pre-R3: R3 identities removed, demoted publications restored. */
export function preR3Works(works: readonly LibraryWork[], shelf?: string): LibraryWork[] {
  return [
    ...works.filter((w) => !isR3Published(w)),
    ...R3_RESTORED_PUBLICATIONS.filter((p) => shelf === undefined || p.shelf === shelf),
  ];
}
