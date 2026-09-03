// Reading Room Wayfinding — Phase 1. The COLLECTION layer.
//
// ── WHAT A COLLECTION IS, AND WHAT IT IS NOT ────────────────────────────────────────────────────────
// A collection groups works that were PUBLISHED TOGETHER in one physical publication. It is an
// additional archival relationship laid over the catalogue; it is emphatically NOT a new kind of work
// and it does not absorb its members.
//
//   Collection / Publication
//         ├── Work        ← keeps its own id, route, provenance, citation identity, searchability
//         ├── Work
//         └── Work
//               └── reading units, if that work has any
//
// The 37 stories of கலைஞர் கருணாநிதியின் சிறுகதைகள் remain 37 independent `LibraryWork` records with
// their own `/stories/<slug>` and `/stories/<slug>/source` routes. Belonging to a collection does not
// demote a story to a chapter, an article unit or a reading unit of the anthology. The only thing that
// changes is DISCOVERY DENSITY on /read: 37 sibling cards become one collection card, while the
// catalogue still holds 39 Fiction works and the library still holds 71.
//
// This distinction is why `memberCount` exists separately from `LibraryWork.unitCount` — see below.
//
// ── WHY THIS IS NOT THE ESSAYS MODEL ────────────────────────────────────────────────────────────────
// An Essays publication (சக்கரவர்த்தியின் திருமகன், உணர்ச்சிமாலை, …) is ONE catalogue work whose
// articles are READING UNITS inside it: `/essays/<pub>` and `/essays/<pub>/articles/<slug>`. Those
// articles have no independent catalogue identity, and converting them into collection members would
// invent 35 works the archive never established. The two shapes are different because the sources are
// different, and neither is retrofitted onto the other.
//
// ── SCOPE: ONE FORM, ONE COLLECTION ─────────────────────────────────────────────────────────────────
// `kind` admits exactly `"anthology"` because exactly one form is implemented. Speculative kinds
// ("volume-series", "composite-publication") and a nested/parent hierarchy for the future Murasoli
// volumes are deliberately absent: an unimplemented variant in a union is an untested claim, and the
// Murasoli hierarchy has not had its design pass. Widening the union later is a one-line change; the
// fields that would have been wrong in the meantime are not.
//
// Naanmani Maalai is NOT modelled here. Its four plays share a scan SHA-256 and a prose note, and
// nothing structural — under the source-first rule that is not enough to declare membership.
import { LIBRARY_WORKS, SHELVES, publishedWorks, type LibraryWork, type Shelf, type ShelfId } from "@/data/library";

export type CollectionKind = "anthology";

/** One member work, in the collection's own printed order. */
export interface CollectionMember {
  /** `LibraryWork.id`. Resolved against the live catalogue; never a free-standing copy of a title. */
  workId: string;
  /**
   * The collection's own printed ordinal for this work.
   *
   * OPTIONAL because a collection whose source establishes no numbering must not be given one. The
   * 1977 anthology prints a `பொருளடக்கம்` numbering all 37 stories, so every member here carries it.
   * It is never derived from array position — position is a consequence of the ordinal, not its source.
   */
  ordinal?: number;
}

export interface LibraryCollection {
  /** Stable public id; also the route segment. */
  id: string;
  shelf: ShelfId;
  titleTa: string;
  titleEn: string;
  kind: CollectionKind;

  /**
   * The publication's own printed edition statement, verbatim.
   *
   * This is a COLLECTION-level fact. It must never be restated as a per-member claim: "the anthology's
   * first edition is 1977" is true; "this story was first published in 1977" is not established by it,
   * and the source records keep those apart deliberately.
   */
  editionStatementTa?: string;
  /** Printed publisher imprint, verbatim. */
  publisherTa?: string;

  /**
   * How many WORKS the collection contains.
   *
   * Deliberately NOT `LibraryWork.unitCount`, which counts a single work's internal reading units —
   * 14 articles, 1,330 குறள், 391 chapters. Thirty-seven independently published short stories are not
   * thirty-seven reading units of one book, and collapsing the two would erase exactly the distinction
   * this layer exists to preserve. Members also keep their own `unitCount` untouched: none is added to
   * a story merely because it joined a collection.
   */
  memberCount: { value: number; labelTa: string; labelEn: string };

  /**
   * THE CANONICAL MEMBERSHIP RECORD.
   *
   * Membership lives here and nowhere else. `LibraryWork` gains no `collectionId`: two stores of one
   * fact can disagree, and the failure would be silent. The reverse direction is DERIVED — see
   * `collectionForWork` — so there is one place to edit and one place to validate.
   *
   * The roster is written out explicitly rather than computed at runtime from "every Fiction story" or
   * "every work whose description mentions 1977". An explicit list is reviewable by a person and
   * provable against the frozen source; a runtime rule silently absorbs whatever arrives next.
   */
  members: CollectionMember[];

  /** Public route. */
  href: string;

  /**
   * Where the collection itself is established in the source archive — not a member's provenance.
   *
   * `collectionTree` is the git tree of the collection's own source directory at `pinnedCommit`. The
   * commit alone is a weak guard: this repository advances for unrelated stories, so the per-collection
   * tree is what makes the freeze mean anything, exactly as the Wave-3 essays' per-work trees do.
   */
  source: {
    repository: string;
    pinnedCommit: string;
    collectionPath: string;
    collectionTree: string;
    /** Controlling scan identity, as the source archive records it for the whole publication. */
    scanFilename?: string;
    scanSha256?: string;
  };

  descTa?: string;
  descEn?: string;
}

// ── The one Phase-1 collection ──────────────────────────────────────────────────────────────────────
// Every displayed fact below is carried by the source archive's own collection registration at the
// frozen tree — `collections/1977-kalaignar-karunanidhiyin-sirukathaigal/metadata/source.md` and
// `indexes/story-inventory.md` — and is proved against it by scripts/validate-collections.mjs.
export const LIBRARY_COLLECTIONS: LibraryCollection[] = [
  {
    id: "1977-kalaignar-karunanidhiyin-sirukathaigal",
    shelf: "fiction",
    titleTa: "கலைஞர் கருணாநிதியின் சிறுகதைகள்",
    titleEn: "Kalaignar Karunanidhi's Short Stories",
    kind: "anthology",
    editionStatementTa: "முதல் பதிப்பு: 1977",
    publisherTa: "தமிழ்க்கனி பதிப்பகம், சென்னை-28",
    memberCount: { value: 37, labelTa: "சிறுகதைகள்", labelEn: "short stories" },
    href: "/collections/1977-kalaignar-karunanidhiyin-sirukathaigal",
    descTa: "1977 தொகுப்பு — 37 சிறுகதைகள், அச்சிட்ட பொருளடக்க வரிசையில்.",
    descEn: "The 1977 anthology — 37 short stories, in the order its printed contents page numbers them.",
    source: {
      repository: "pugazg/kalaignar-short-stories",
      pinnedCommit: "76135e1b5d504128c15be6bf59937716e5517d78",
      collectionPath: "collections/1977-kalaignar-karunanidhiyin-sirukathaigal",
      collectionTree: "d45434d46b1e779a880fff3d774d0fcb5833e477",
      scanFilename: "TVA_BOK_0064142_கலைஞர்_கருணாநிதியின்_சிறுகதைகள்.pdf",
      scanSha256: "853032661482eaccb26c083a38d7aa75c081362d33c963c63e37d088bf20acb3",
    },
    // The anthology's printed பொருளடக்கம் order, 1–37. `கிழவன் கனவு` is deliberately absent: it is
    // also a Fiction short story, but a standalone booklet with its own source pin, and it carries no
    // anthology block in its source record.
    members: [
      { workId: "pugazhendhi", ordinal: 1 },
      { workId: "nalayini", ordinal: 2 },
      { workId: "sabalam", ordinal: 3 },
      { workId: "aattakkavadi", ordinal: 4 },
      { workId: "kuppai-thotti", ordinal: 5 },
      { workId: "santhana-kinnam", ordinal: 6 },
      { workId: "sangilichami", ordinal: 7 },
      { workId: "gangaiyin-kadhal", ordinal: 8 },
      { workId: "thaaymai", ordinal: 9 },
      { workId: "thappivittargal", ordinal: 10 },
      { workId: "thappavillai", ordinal: 11 },
      { workId: "aatharikkirar", ordinal: 12 },
      { workId: "iragasiyam", ordinal: 13 },
      { workId: "munnuru-rupai", ordinal: 14 },
      { workId: "ezhai", ordinal: 15 },
      { workId: "originalil-ullapadi", ordinal: 16 },
      { workId: "panangulai", ordinal: 17 },
      { workId: "seththaval-kathai", ordinal: 18 },
      { workId: "pretha-visaranai", ordinal: 19 },
      { workId: "kandathum-kadhal-ozhiga", ordinal: 20 },
      { workId: "aalamarathup-puraakkal", ordinal: 21 },
      { workId: "thothukkili", ordinal: 22 },
      { workId: "kadhal-kaditham", ordinal: 23 },
      { workId: "kannadakkam", ordinal: 24 },
      { workId: "vazha-mudiyathavargal", ordinal: 25 },
      { workId: "abagya-chinthamani", ordinal: 26 },
      { workId: "palaivana-roja", ordinal: 27 },
      { workId: "puratchip-padam", ordinal: 28 },
      { workId: "thidukkidum-kathai", ordinal: 29 },
      { workId: "kadaisi-kattam", ordinal: 30 },
      { workId: "ayyo-raja", ordinal: 31 },
      { workId: "visham-inidhu", ordinal: 32 },
      { workId: "veniyin-kadhalan", ordinal: 33 },
      { workId: "amirthamathi", ordinal: 34 },
      { workId: "sumanthaval", ordinal: 35 },
      { workId: "siddharthan-silai", ordinal: 36 },
      { workId: "nunikkarumbu", ordinal: 37 },
    ],
  },
];

/**
 * Route registry, in the spirit of `STORY_SLUGS` / `ESSAY_SLUGS`: the collection route family is driven
 * by declarations, never by scanning the filesystem, so an id with no declaration has no page and 404s.
 * Named for the field it lists — collections are addressed by `id`, and `/collections/[id]` uses it.
 */
export const COLLECTION_IDS = LIBRARY_COLLECTIONS.map((c) => c.id);

export function collectionById(id: string): LibraryCollection | undefined {
  return LIBRARY_COLLECTIONS.find((c) => c.id === id);
}

// ── Derived reverse lookup ──────────────────────────────────────────────────────────────────────────
// Built once from the canonical rosters. This is the ONLY work → collection direction: nothing is
// stored on `LibraryWork`, so the two directions cannot drift apart.
const WORK_TO_COLLECTION: ReadonlyMap<string, LibraryCollection> = new Map(
  LIBRARY_COLLECTIONS.flatMap((c) => c.members.map((m) => [m.workId, c] as const)),
);

/** The collection a work belongs to, or undefined for a standalone work. */
export function collectionForWork(workId: string): LibraryCollection | undefined {
  return WORK_TO_COLLECTION.get(workId);
}

/** Member works resolved against the live catalogue, in the collection's printed ordinal order. */
export function collectionMemberWorks(c: LibraryCollection): Array<{ member: CollectionMember; work: LibraryWork }> {
  return [...c.members]
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
    .map((member) => ({ member, work: LIBRARY_WORKS.find((w) => w.id === member.workId) }))
    .filter((x): x is { member: CollectionMember; work: LibraryWork } => Boolean(x.work));
}

// ── Discovery ───────────────────────────────────────────────────────────────────────────────────────
/**
 * What /read shows on a shelf: a collection stands in for all of its members, and every work that
 * belongs to no collection stands for itself.
 *
 * A DISCOVERY ENTRY IS NOT A WORK. One entry may represent 37 of them. `/read` counts entries; the
 * catalogue counts works; the two numbers are different measurements of different things and are never
 * substituted for one another.
 */
export type DiscoveryEntry =
  | { kind: "collection"; key: string; collection: LibraryCollection }
  | { kind: "work"; key: string; work: LibraryWork };

export interface ShelfDiscovery {
  shelf: Shelf;
  /** Every published work on the shelf — the archival count, unchanged by any grouping. */
  works: LibraryWork[];
  /** What the shelf actually renders. */
  entries: DiscoveryEntry[];
  /** Collections on this shelf, for shelf-level wording. */
  collections: LibraryCollection[];
}

/**
 * Shelves with their discovery entries, in taxonomy order; empty shelves omitted.
 *
 * ORDER. Collections first, in declaration order, then standalone works in `LIBRARY_WORKS` declaration
 * order — the same deterministic catalogue order Phase 0 preserves. Collections lead because a
 * collection stands for many works and reads as the shelf's larger object; the rule is stated once here
 * rather than special-cased per shelf, so no shelf id ever appears in presentation logic.
 */
export function discoveryShelves(): ShelfDiscovery[] {
  const pub = publishedWorks();
  return [...SHELVES]
    .sort((a, b) => a.order - b.order)
    .map((shelf) => {
      const works = pub.filter((w) => w.shelf === shelf.id);
      const collections = LIBRARY_COLLECTIONS.filter((c) => c.shelf === shelf.id);
      const entries: DiscoveryEntry[] = [
        ...collections.map((collection) => ({ kind: "collection" as const, key: collection.id, collection })),
        ...works
          .filter((w) => !collectionForWork(w.id))
          .map((work) => ({ kind: "work" as const, key: work.id, work })),
      ];
      return { shelf, works, entries, collections };
    })
    .filter((s) => s.works.length > 0);
}
