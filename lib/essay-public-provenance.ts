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
// fields the Source & provenance page actually renders. It fails closed — a field added to the archival
// record later is NOT forwarded unless it is added here on purpose — and the result is branded, so
// passing the raw record to `ArticleSource` is a type error.

import type { EssayProvenance } from "@/data/essays";

type Src = EssayProvenance["source"];
type Derived = EssayProvenance["archiveDerived"];

/** Source facts rendered on the public page. */
export const PUBLIC_SOURCE_KEYS = [
  "titleTa", "titleEn", "authorTa",
  "scanFilename", "scanSha256", "scanFileSizeBytes", "scanTotalPages", "transferParts",
  "publicationForm", "editionStatus", "physicalVerification", "strictFidelityReview",
  "articleAssemblies", "unresolvedTamilFidelityItems",
  "firstEditionTa", "controllingEditionTa", "titlePagePublisherTa", "printedPageCount", "editionWitnessesTa",
  "articleMap", "titleWitnessNotes", "lockedExclusions",
] as const satisfies readonly (keyof Src)[];

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

/** Article-map row fields rendered on the public page. */
export const PUBLIC_ARTICLE_MAP_KEYS = [
  "number", "titleTa", "contentsTitleTa", "titleEn", "scanPages", "printedPages", "numberSource",
] as const satisfies readonly (keyof Src["articleMap"][number])[];

/** Top-level fields that may reach the browser. Everything else in the archival record stays server-side. */
export const PUBLIC_TOP_KEYS = [
  "sourceRepo", "sourcePath", "sourceCommit", "source", "english", "archiveDerived", "blockers", "projectRights", "notes",
] as const;

declare const PUBLIC_PROVENANCE: unique symbol;

/** The public-safe projection `ArticleSource` renders. Only `toPublicEssayProvenance` produces one. */
export type PublicEssayProvenance = {
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: Pick<Src, (typeof PUBLIC_SOURCE_KEYS)[number]>;
  english: Pick<EssayProvenance["english"], (typeof PUBLIC_ENGLISH_KEYS)[number]>;
  archiveDerived: Pick<Derived, (typeof PUBLIC_DERIVED_KEYS)[number]>;
  blockers?: EssayProvenance["blockers"];
  projectRights?: EssayProvenance["projectRights"];
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
  const source = pick(prov.source, PUBLIC_SOURCE_KEYS);
  source.articleMap = prov.source.articleMap.map((row) => pick(row, PUBLIC_ARTICLE_MAP_KEYS));
  return {
    sourceRepo: prov.sourceRepo,
    sourcePath: prov.sourcePath,
    sourceCommit: prov.sourceCommit,
    source,
    english: pick(prov.english, PUBLIC_ENGLISH_KEYS),
    archiveDerived: pick(prov.archiveDerived, PUBLIC_DERIVED_KEYS),
    ...(prov.blockers ? { blockers: prov.blockers } : {}),
    ...(prov.projectRights ? { projectRights: prov.projectRights } : {}),
    notes: [...prov.notes],
  } as PublicEssayProvenance;
}
