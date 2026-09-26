// Reading Room IA v2 R3 — collection-member resolution with merged witnesses (frozen R3 plan §7). DORMANT until R3-D.
//
// A collection member id resolves to (1) a canonical LibraryWork, or (2) an ACTIVE `merged-witness` record — the
// printed old-title witness of a work that R3-D merges into a canonical target. Anything else fails closed, exactly as
// collectionMemberWorks() does today. LIBRARY_COLLECTIONS membership is never edited: the printed 2004 book contains
// the old-title witness, so the member id stays the witness id.
//
// R3-A: no merged witness is active, so every member of every collection resolves as (1). Nothing renders from this
// module yet; the collection pages still use collectionMemberWorks().
import { LIBRARY_WORKS, type LibraryWork } from "@/data/library";
import type { LibraryCollection } from "@/data/collections";
import { R3_RELATIONS, activeMergedWitness, type WorkRelation } from "@/lib/work-relations";

export type ResolvedCollectionMember =
  | { kind: "work"; work: LibraryWork }
  | { kind: "merged-witness"; relation: WorkRelation; canonical: LibraryWork };

/** Resolve one member id. Pure over its inputs so validators can exercise states other than the live one. */
export function resolveCollectionMember(
  workId: string,
  works: readonly LibraryWork[] = LIBRARY_WORKS,
  relations: readonly WorkRelation[] = R3_RELATIONS,
): ResolvedCollectionMember {
  const work = works.find((w) => w.id === workId);
  if (work) return { kind: "work", work };
  const merged = activeMergedWitness(workId, relations);
  if (merged) {
    const canonical = works.find((w) => w.id === merged.canonicalId && w.state === "published");
    if (!canonical) throw new Error(`collection member "${workId}" is a merged witness of "${merged.canonicalId}", which is not a published canonical work`);
    return { kind: "merged-witness", relation: merged, canonical };
  }
  throw new Error(
    `collection member "${workId}" resolves to neither a LibraryWork nor an active merged witness. ` +
      `A declared member is never dropped silently.`,
  );
}

/** Every member of a collection, resolved, in printed ordinal order. */
export function resolveCollectionMembers(c: LibraryCollection, works?: readonly LibraryWork[], relations?: readonly WorkRelation[]) {
  return [...c.members]
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
    .map((member) => ({ member, resolved: resolveCollectionMember(member.workId, works, relations) }));
}
