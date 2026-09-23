// The PUBLIC serialization boundary for essay provenance.
//
// `public/data/essays/<slug>/provenance.json` is an archival record. Besides the public source facts it
// carries internal implementation state — e.g. the frozen Wave-7 P1 `hidden` object
// (`discoverable/sitemapExposed/publicRoute: false`, "… P1 hidden foundation."), `wave`, `batch`,
// `readiness`, `shelf`, `workId`, `sourceTree`. That record is deliberately kept intact: the P1
// hidden-boundary validator reads it.
//
// `ArticleSource` is a CLIENT component, so every prop it receives is serialized into the page HTML (the
// RSC payload) whether or not it is rendered. Passing the whole record therefore published the internal
// state. This module is the only way to build the component's `prov` prop: an explicit ALLOWLIST of the
// fields the Source & provenance page actually renders, at EVERY nesting level. It fails closed — a field
// added to the archival record later (at any depth) is NOT forwarded unless it is added here on purpose —
// and the result is branded, so passing the raw record to `ArticleSource` is a type error.

import type { EssayProvenance } from "@/data/essays";

type Src = EssayProvenance["source"];
type Derived = EssayProvenance["archiveDerived"];
type ArticleMapRow = Src["articleMap"][number];
type TransferPart = NonNullable<Src["transferParts"]>[number];
type Blocker = NonNullable<EssayProvenance["blockers"]>[number];
type Rights = NonNullable<EssayProvenance["projectRights"]>;

// EVERY level is allowlisted: no nested archival object crosses the boundary wholesale. Each key list
// `satisfies` its archival schema, so a misspelled or nonexistent key is a type error.

/** Source facts rendered on the public page — flat values (strings, numbers, string lists) only. The two
 *  nested source structures, `articleMap` and `transferParts`, are projected row by row below. */
export const PUBLIC_SOURCE_KEYS = [
  "titleTa", "titleEn", "authorTa",
  "scanFilename", "scanSha256", "scanFileSizeBytes", "scanTotalPages",
  "publicationForm", "editionStatus", "physicalVerification", "strictFidelityReview",
  "articleAssemblies", "unresolvedTamilFidelityItems",
  "firstEditionTa", "controllingEditionTa", "titlePagePublisherTa", "printedPageCount", "editionWitnessesTa",
  "titleWitnessNotes", "lockedExclusions",
] as const satisfies readonly Exclude<keyof Src, "articleMap" | "transferParts">[];

/** Article-map row fields rendered on the public page. */
export const PUBLIC_ARTICLE_MAP_KEYS = [
  "number", "titleTa", "contentsTitleTa", "titleEn", "scanPages", "printedPages", "numberSource",
] as const satisfies readonly (keyof ArticleMapRow)[];

/** Transfer-part fields rendered on the public page. The archival record also carries `filename`,
 *  `pdfPages` and `bytes`; they stay server-side. */
export const PUBLIC_TRANSFER_PART_KEYS = ["part", "globalScans", "sha256"] as const satisfies readonly (keyof TransferPart)[];

/** English-release facts rendered on the public page. */
export const PUBLIC_ENGLISH_KEYS = [
  "releaseTitle", "kind", "articlesVerified", "consistencyReview", "releaseCloseout", "releaseGate",
  "unresolvedTranslationQuestions", "releaseBlockers", "translatorNotesSeparated", "labelPolicy",
] as const satisfies readonly (keyof EssayProvenance["english"])[];

/** Archive-derived reading-structure facts rendered on the public page. */
export const PUBLIC_DERIVED_KEYS = [
  "articles", "tamilBlocks", "englishBlocks", "tamilSubheadings", "englishSubheadings",
  "tamilAttributions", "englishAttributions",
  "tamilAuthoredOnlyParagraphs", "englishAuthoredOnlyParagraphs",
  "tamilQuotationOnlyParagraphs", "englishQuotationOnlyParagraphs",
  "tamilMixedVoiceParagraphs", "englishMixedVoiceParagraphs",
  "tamilQuotedSegments", "englishQuotedSegments", "translatorNotes",
  "pageTransitionsAudited", "relationSameBlock", "relationBlockBoundary", "relationUnknown", "crossPageBlocks",
  "voiceNote", "boundaryNote", "provenanceGranularity",
] as const satisfies readonly (keyof Derived)[];

/** Blocker-row fields rendered on the public page. */
export const PUBLIC_BLOCKER_KEYS = ["item", "count", "detail", "resolution"] as const satisfies readonly (keyof Blocker)[];

/** Project-rights fields rendered on the public page. */
export const PUBLIC_PROJECT_RIGHTS_KEYS = [
  "appliesTo", "rightsStatus", "rightsAuthority", "rightsAction", "rightsAnnouncementDate",
  "governmentOrderNumber", "governmentOrderDate", "governmentOrderHandoverDate",
  "distinctionNote", "thirdPartyNote", "projectTranslationNote", "quotedThirdPartyNote", "evidencePending",
] as const satisfies readonly (keyof Rights)[];

/** Top-level fields that may reach the browser. Everything else in the archival record stays server-side. */
export const PUBLIC_TOP_KEYS = [
  "sourceRepo", "sourcePath", "sourceCommit", "source", "english", "archiveDerived", "blockers", "projectRights", "notes",
] as const satisfies readonly (keyof EssayProvenance)[];

declare const PUBLIC_PROVENANCE: unique symbol;

export type PublicTransferPart = Pick<TransferPart, (typeof PUBLIC_TRANSFER_PART_KEYS)[number]>;
export type PublicBlocker = Pick<Blocker, (typeof PUBLIC_BLOCKER_KEYS)[number]>;
export type PublicProjectRights = Pick<Rights, (typeof PUBLIC_PROJECT_RIGHTS_KEYS)[number]>;
export type PublicSource = Pick<Src, (typeof PUBLIC_SOURCE_KEYS)[number]> & {
  articleMap: Pick<ArticleMapRow, (typeof PUBLIC_ARTICLE_MAP_KEYS)[number]>[];
  transferParts?: PublicTransferPart[];
};

/** The public-safe projection `ArticleSource` renders. Only `toPublicEssayProvenance` produces one. */
export type PublicEssayProvenance = {
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: PublicSource;
  english: Pick<EssayProvenance["english"], (typeof PUBLIC_ENGLISH_KEYS)[number]>;
  archiveDerived: Pick<Derived, (typeof PUBLIC_DERIVED_KEYS)[number]>;
  blockers?: PublicBlocker[];
  projectRights?: PublicProjectRights;
  notes: string[];
} & { readonly [PUBLIC_PROVENANCE]: true };

/** Copy ONLY the listed keys that are present (an absent optional field stays absent, not `undefined`). */
function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) out[k] = obj[k];
  return out;
}

/** Project an archival provenance record to the fields the public Source & provenance page renders. */
export function toPublicEssayProvenance(prov: EssayProvenance): PublicEssayProvenance {
  const source: PublicSource = {
    ...pick(prov.source, PUBLIC_SOURCE_KEYS),
    articleMap: prov.source.articleMap.map((row) => pick(row, PUBLIC_ARTICLE_MAP_KEYS)),
    ...(prov.source.transferParts ? { transferParts: prov.source.transferParts.map((tp) => pick(tp, PUBLIC_TRANSFER_PART_KEYS)) } : {}),
  };
  return {
    sourceRepo: prov.sourceRepo,
    sourcePath: prov.sourcePath,
    sourceCommit: prov.sourceCommit,
    source,
    english: pick(prov.english, PUBLIC_ENGLISH_KEYS),
    archiveDerived: pick(prov.archiveDerived, PUBLIC_DERIVED_KEYS),
    ...(prov.blockers ? { blockers: prov.blockers.map((b) => pick(b, PUBLIC_BLOCKER_KEYS)) } : {}),
    ...(prov.projectRights ? { projectRights: pick(prov.projectRights, PUBLIC_PROJECT_RIGHTS_KEYS) } : {}),
    notes: [...prov.notes],
  } as PublicEssayProvenance;
}
