// The PUBLIC serialization boundary for Drama provenance (`/plays/[slug]/source`).
//
// `PlaySource` is a CLIENT component: every prop it receives is serialized into the page HTML (the RSC
// payload) whether or not it is rendered. The route used to hand it the whole archival `provenance.json`
// and the whole `play.json`, so the page published:
//   • the frozen Wave-7 Batch-2 P1 record on iratha-kanneer / nachuk-koppai — `hidden` {discoverable,
//     sitemapExposed, publicRoute, note: "… P1 hidden foundation."}, `wave`, `batch`, `readiness`, `shelf`;
//   • archival fields the page never renders (sourcePath, sourcePdfCommitted, rightsAction, a dozen
//     archive-derived counters and notes, nachuk's hold `scene`/`markerKind`/`locus`);
//   • the entire reading text (`readingUnits`) on every Drama source page.
// The archival records are deliberately kept intact (historical validators read them). This module is the
// only way to build `PlaySource`'s props: an explicit ALLOWLIST of what the page renders, applied at EVERY
// nesting level, with exact public-subset types. It fails closed — a field added later to the archival
// schema, at any depth, is not forwarded unless it is added here on purpose — and the results are branded,
// so passing a raw record to `PlaySource` is a type error. Mirrors lib/essay-public-provenance.ts.

import type { Play, PlayProvenance } from "@/data/plays";

type Src = PlayProvenance["source"];
type Derived = PlayProvenance["archiveDerived"];
type Rights = PlayProvenance["projectRights"];
type Hold = NonNullable<PlayProvenance["sourceConditionHolds"]>[number];
type Unresolved = NonNullable<PlayProvenance["unresolved"]>[number];
type Witness = NonNullable<PlayProvenance["performanceWitnesses"]>[number];
type UserContext = NonNullable<PlayProvenance["userSuppliedContext"]>[number];
type LayerQual = NonNullable<PlayProvenance["pageLayerQualification"]>;

// ── Allowlists — each `satisfies` its archival schema, so a misspelled or nonexistent key is a type error ──
export const PUBLIC_PLAY_TOP_KEYS = [
  "sourceRepo", "sourceCommit", "source", "archiveDerived", "unresolved", "performanceWitnesses", "userSuppliedContext",
  "pageLayerQualification", "sourceConditionHolds", "english", "lockedExclusions", "projectRights", "notes",
] as const satisfies readonly (keyof PlayProvenance)[];
export const PUBLIC_PLAY_SOURCE_KEYS = [
  "scanFilename", "scanSha256", "scanFileSizeBytes", "scanTotalPages", "scanIdentityBasis", "pageRecordsVerified", "sourceAudit",
  "assembledLayer", "bodyScans", "publicationYearNote", "collectionNote", "twoColumnNote", "closingTableauNote",
  "continuousStructureNote", "openingNoteNote", "sruStructureNote", "compressedSceneNote", "unnumberedSceneNote", "intertitleNote",
  "printedClosureNote", "sourceConditionNote",
] as const satisfies readonly (keyof Src)[];
export const PUBLIC_PLAY_DERIVED_KEYS = [
  "scenes", "continuousBodies", "openingNotes", "closingTableau", "tamilUnits", "tamilDialogue", "tamilStageDirections", "tamilVerse",
  "englishUnits", "distinctSpeakerLabels", "unlabelledDialogueUnits", "multiScanScenes", "printedPageNumbersPresent",
  "printedPageNumbersAbsent", "scenesWithoutPrintedSetting", "speakerNote",
] as const satisfies readonly (keyof Derived)[];
export const PUBLIC_PLAY_UNRESOLVED_KEYS = ["scan", "description", "policy", "marker"] as const satisfies readonly (keyof Unresolved)[];
export const PUBLIC_PLAY_WITNESS_KEYS = ["date", "place", "detail"] as const satisfies readonly (keyof Witness)[];
export const PUBLIC_PLAY_USER_CONTEXT_KEYS = ["claim", "status"] as const satisfies readonly (keyof UserContext)[];
export const PUBLIC_PLAY_LAYER_QUAL_KEYS = [
  "physicalScans", "processedPageRecords", "verifiedPageRecords", "needsReviewPageRecords", "needsReviewScans",
  "frontMatterHoldScans", "dramaticBodyHoldScans", "unresolvedVisualClusters",
] as const satisfies readonly (keyof LayerQual)[];
/** Rendered hold fields. The archival hold may carry more (nachuk-koppai: scene / markerKind / locus); they stay server-side. */
export const PUBLIC_PLAY_HOLD_KEYS = ["scan", "unit", "marker", "policy"] as const satisfies readonly (keyof Hold)[];
export const PUBLIC_PLAY_ENGLISH_KEYS = ["kind", "status", "independence", "secondaryWitnessNote", "notesSeparated"] as const satisfies readonly (keyof PlayProvenance["english"])[];
export const PUBLIC_PLAY_RIGHTS_KEYS = [
  "appliesTo", "rightsStatus", "rightsAuthority", "rightsAnnouncementDate", "governmentOrderHandoverDate", "governmentOrderNumber",
  "governmentOrderDate", "distinctionNote", "thirdPartyNote", "publishedWitnessNote", "projectTranslationNote", "archivalStatusNote",
  "evidencePending",
] as const satisfies readonly (keyof Rights)[];
/** The only `play` fields the source page renders. The reading text never crosses this boundary. */
export const PUBLIC_PLAY_HEAD_KEYS = ["slug", "title", "descriptor"] as const satisfies readonly (keyof Play)[];

// ── Exact public-subset types (branded: only the projection functions produce them) ───────────────────
declare const PUBLIC_PLAY: unique symbol;
type Brand = { readonly [PUBLIC_PLAY]: true };
export type PublicPlayProvenance = {
  sourceRepo: string;
  sourceCommit: string;
  source: Pick<Src, (typeof PUBLIC_PLAY_SOURCE_KEYS)[number]>;
  archiveDerived: Pick<Derived, (typeof PUBLIC_PLAY_DERIVED_KEYS)[number]>;
  unresolved?: Pick<Unresolved, (typeof PUBLIC_PLAY_UNRESOLVED_KEYS)[number]>[];
  performanceWitnesses?: Pick<Witness, (typeof PUBLIC_PLAY_WITNESS_KEYS)[number]>[];
  userSuppliedContext?: Pick<UserContext, (typeof PUBLIC_PLAY_USER_CONTEXT_KEYS)[number]>[];
  pageLayerQualification?: Pick<LayerQual, (typeof PUBLIC_PLAY_LAYER_QUAL_KEYS)[number]>;
  sourceConditionHolds?: (Pick<Hold, "scan" | "unit" | "policy"> & { marker?: string })[];
  english: Pick<PlayProvenance["english"], (typeof PUBLIC_PLAY_ENGLISH_KEYS)[number]>;
  lockedExclusions: string[];
  projectRights: Pick<Rights, (typeof PUBLIC_PLAY_RIGHTS_KEYS)[number]>;
  notes: string[];
} & Brand;
export type PublicPlayHead = { slug: string; title: { ta: string }; descriptor: { ta: string } } & Brand;

/** Copy ONLY the listed keys that are present (an absent optional field stays absent, not `undefined`). */
function pick<T extends object>(obj: T, keys: readonly string[]): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k) && (obj as Record<string, unknown>)[k] !== undefined) out[k] = (obj as Record<string, unknown>)[k];
  return out as Partial<T>;
}

/** Project an archival Drama provenance record to exactly what `PlaySource` renders. */
export function toPublicPlayProvenance(p: PlayProvenance): PublicPlayProvenance {
  return {
    sourceRepo: p.sourceRepo,
    sourceCommit: p.sourceCommit,
    source: pick(p.source, PUBLIC_PLAY_SOURCE_KEYS),
    archiveDerived: pick(p.archiveDerived, PUBLIC_PLAY_DERIVED_KEYS),
    ...(p.unresolved ? { unresolved: p.unresolved.map((x) => pick(x, PUBLIC_PLAY_UNRESOLVED_KEYS)) } : {}),
    ...(p.performanceWitnesses ? { performanceWitnesses: p.performanceWitnesses.map((x) => pick(x, PUBLIC_PLAY_WITNESS_KEYS)) } : {}),
    ...(p.userSuppliedContext ? { userSuppliedContext: p.userSuppliedContext.map((x) => pick(x, PUBLIC_PLAY_USER_CONTEXT_KEYS)) } : {}),
    ...(p.pageLayerQualification ? { pageLayerQualification: pick(p.pageLayerQualification, PUBLIC_PLAY_LAYER_QUAL_KEYS) } : {}),
    ...(p.sourceConditionHolds ? { sourceConditionHolds: p.sourceConditionHolds.map((x) => pick(x, PUBLIC_PLAY_HOLD_KEYS)) } : {}),
    english: pick(p.english, PUBLIC_PLAY_ENGLISH_KEYS),
    lockedExclusions: [...p.lockedExclusions],
    projectRights: pick(p.projectRights, PUBLIC_PLAY_RIGHTS_KEYS),
    notes: [...p.notes],
  } as unknown as PublicPlayProvenance;
}

/** Project the play to the three fields the source page renders (slug, Tamil title, Tamil descriptor). */
export function toPublicPlayHead(play: Play): PublicPlayHead {
  return { slug: play.slug, title: { ta: play.title.ta }, descriptor: { ta: play.descriptor.ta } } as PublicPlayHead;
}
