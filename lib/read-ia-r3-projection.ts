// Reading Room IA v2 R3 — the PRE-R3 PROJECTION of the live catalogue, for earlier-wave validators whose assertions
// are about specific records or shelf membership rather than counts (counts use lib/read-ia-r3-contribution.ts).
//
// The projection removes exactly the R3 identities published in the current stage state and restores exactly the
// publications R3 has demoted, from their LibraryPublication record (the former LibraryWork verbatim, minus `state`),
// so a historical assertion keeps its full strength against the records it was written for. test-r3-identity pins
// the other direction: that the removed and restored sets are exactly the stage's authorized delta.
import { LIBRARY_PUBLICATIONS, type LibraryWork } from "@/data/library";
import { R3_IDENTITY, activeMergedWitness } from "./work-relations";

const PUBLISHED = new Set(R3_IDENTITY.works.filter((w) => w.state === "published").map((w) => w.id));

/** True for a LibraryWork that is an R3-published identity (not a pre-R3 record). */
export const isR3Published = (w: { id: string }) => PUBLISHED.has(w.id);

/** The former LibraryWork record of every publication demoted so far, restored verbatim (it was published). */
export const R3_RESTORED_PUBLICATIONS: LibraryWork[] = LIBRARY_PUBLICATIONS.map(
  ({ kind: _kind, demotedIn: _demotedIn, ...rest }) => ({ ...rest, state: "published" }) as LibraryWork,
);

/**
 * The five frozen R3-D merges (OD3–OD5): legacy Batch-7 story id → canonical target. A validator that pins these
 * stories as published LibraryWorks admits EXACTLY these ids, and only while their merged-witness relation is ACTIVE
 * (then the story is its verbatim legacy record there, at its preserved route) — never an arbitrary merged witness.
 */
export const R3_MERGED_LEGACY: ReadonlyMap<string, string> = new Map([
  ["neeyum-kaithi-naanum-kaithi", "piraiye"],
  ["sorgaththirku-vandhathu-eppadi", "sorgga-logaththil"],
  ["aadik-kaatre", "adikkaatru"],
  ["sirai-kodiyathu", "green-parrot"],
  ["pugazhe-nee-oru-pudhir", "pugazh"],
]);
/** The verbatim legacy record of one of the five, when its merged-witness relation is active and targets the frozen id. */
export function mergedLegacyRecord(id: string): LibraryWork | undefined {
  const r = activeMergedWitness(id);
  return r && R3_MERGED_LEGACY.get(id) === r.canonicalId ? (r.witness.record as LibraryWork) : undefined;
}
/** The legacy records of every active frozen merge (R3-D), verbatim. */
export const R3_MERGED_LEGACY_RECORDS: LibraryWork[] = Array.from(R3_MERGED_LEGACY.keys())
  .map((id) => mergedLegacyRecord(id))
  .filter((w): w is LibraryWork => !!w);

/**
 * A live list of LibraryWorks projected back to pre-R3: R3 identities removed, demoted publications restored, and
 * (R3-D) merged legacy works restored from their verbatim merged-witness records.
 */
export function preR3Works(works: readonly LibraryWork[], shelf?: string): LibraryWork[] {
  return [
    ...works.filter((w) => !isR3Published(w)),
    ...R3_RESTORED_PUBLICATIONS.filter((p) => shelf === undefined || p.shelf === shelf),
    ...R3_MERGED_LEGACY_RECORDS.filter((w) => (shelf === undefined || w.shelf === shelf) && !works.some((x) => x.id === w.id)),
  ];
}

/**
 * The two OD8 canonical Letters (R3-C; `sinthanaiyum-seyalum` units, frozen resolved manifest), once published. They
 * are NOT Murasoli-corpus letters: validators that pin "the Letters shelf is the one Murasoli corpus work" admit
 * exactly this pair, read at its existing essay-unit routes, and nothing else.
 */
export const R3_OD8_LETTERS: ReadonlySet<string> = new Set(["paasiyum-thoosiyum", "athiga-uyaram-thaanduvatharku"].filter((id) => PUBLISHED.has(id)));
/** True for an OD8 Letter at its own Sinthanaiyum unit route (never a Murasoli route or letter reader). */
export const isOd8Letter = (w: { id: string; href: string; readerStructure?: string }) =>
  R3_OD8_LETTERS.has(w.id) && w.readerStructure === "publication-unit" && w.href === `/essays/sinthanaiyum-seyalum/articles/${w.id}`;
