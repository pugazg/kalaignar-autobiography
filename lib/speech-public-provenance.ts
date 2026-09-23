// The PUBLIC serialization boundary for speech provenance.
//
// `SpeechSource` is a CLIENT component: every prop it receives is serialized into the page HTML (the RSC
// payload) whether or not it is rendered. The archival `provenance.json` carries more than the page shows
// (release-readiness records, archive registry status, source-authority labels, sub-audits), so the
// `/speeches/[slug]/source` route passes ONLY this projection: an explicit ALLOWLIST of the fields the page
// renders, applied at EVERY nesting level. A field added to the archival record later — at any depth — is
// not forwarded unless it is added here on purpose (fail closed), and the result is branded so the raw
// record cannot be handed to `SpeechSource` by accident. Mirrors lib/essay-public-provenance.ts.

import type { SpeechProvenance } from "@/data/speeches";

type Src = NonNullable<SpeechProvenance["source"]>;
type Audio = NonNullable<SpeechProvenance["audioSource"]>;
type Derived = SpeechProvenance["archiveDerived"];

export const PUBLIC_SPEECH_TOP_KEYS = [
  "sourceRepo", "sourcePath", "sourceCommit", "source", "audioSource", "transcription", "translation", "archiveDerived",
  "crossPageJoinPolicy", "blockers", "projectRights", "notes", "semantics", "englishForm", "englishCoverage",
] as const satisfies readonly (keyof SpeechProvenance)[];

export const PUBLIC_SPEECH_SOURCE_KEYS = [
  "publicationTitleTa", "authorTa", "editionTa", "publicationDate", "publicationDatePrintedTa", "firstEditionTa",
  "publisherTa", "publisherLocationTa", "publisherAddressTa", "printerTa", "printerLocationTa", "coverPriceTa", "rightsNoticeTa",
  "scanFilename", "scanSha256", "scanFileSizeBytes", "scanTotalPages", "speechScanPages", "printedSpeechPages", "speechPrintedPages",
  "frontMatterScanPages", "advertisementScanPages", "speechFactsNotStated", "speechFactsNoteEn", "editionMatterNoteEn",
] as const satisfies readonly Exclude<keyof Src, "scanSplits" | "collectionItem">[];
export const PUBLIC_SPEECH_SPLIT_KEYS = ["filename", "scans", "sha256", "bytes"] as const satisfies readonly (keyof NonNullable<Src["scanSplits"]>[number])[];
export const PUBLIC_SPEECH_COLLECTION_ITEM_KEYS = ["collectionId", "ordinal", "total"] as const satisfies readonly (keyof NonNullable<Src["collectionItem"]>)[];

export const PUBLIC_SPEECH_AUDIO_KEYS = [
  "titleTa", "filename", "originalUrl", "sha256", "fileSizeBytes", "durationSeconds", "durationDisplay", "codec", "sampleRateHz",
  "channels", "channelLayout", "averageBitRateBps", "timeMarkerNote", "speechFactsNotStated", "speechFactsNoteEn",
] as const satisfies readonly Exclude<keyof Audio, "recordingBoundary" | "directListeningAudit" | "timeMap">[];
export const PUBLIC_SPEECH_BOUNDARY_KEYS = ["start", "end", "verified"] as const satisfies readonly (keyof Audio["recordingBoundary"])[];
export const PUBLIC_SPEECH_LISTENING_KEYS = ["status", "segmentsChecked", "segmentsPassed", "openUncertainties", "controllingRecord"] as const satisfies readonly (keyof Audio["directListeningAudit"])[];
export const PUBLIC_SPEECH_TIMEMAP_KEYS = ["segment", "start", "end"] as const satisfies readonly (keyof Audio["timeMap"][number])[];

export const PUBLIC_SPEECH_TRANSCRIPTION_KEYS = ["status", "verified_against_scan"] as const;
export const PUBLIC_SPEECH_TRANSLATION_KEYS = ["status", "type"] as const;

export const PUBLIC_SPEECH_DERIVED_KEYS = [
  "sectionHeadings", "tamilResolvedParagraphs", "englishParagraphs", "tamilSourceTextSegments", "englishSourceTextSegments",
  "sourcePagesCovered", "timeMarkers", "tamilAudioParagraphs", "englishAudioParagraphs", "tamilSourcePages", "englishSourcePages",
  "tamilHeadings", "englishHeadings", "tamilParagraphs", "tamilUnresolvedBreaks",
] as const satisfies readonly Exclude<keyof Derived, "boundaryAudit" | "englishBoundaryAudit">[];
export const PUBLIC_SPEECH_AUDIT_KEYS = [
  "tamilTransitions", "sameParagraph", "paragraphBoundary", "unknownParagraphRelation", "lexicalJoinNone", "lexicalJoinSpace", "lexicalJoinUnknown",
] as const satisfies readonly (keyof NonNullable<Derived["boundaryAudit"]>)[];
export const PUBLIC_SPEECH_JOIN_POLICY_KEYS = ["appliedBoundaries", "unresolvedBoundaries"] as const satisfies readonly (keyof NonNullable<SpeechProvenance["crossPageJoinPolicy"]>)[];
export const PUBLIC_SPEECH_BLOCKER_KEYS = ["item", "count", "detail", "resolution"] as const satisfies readonly (keyof NonNullable<SpeechProvenance["blockers"]>[number])[];
export const PUBLIC_SPEECH_RIGHTS_KEYS = [
  "rightsAnnouncementDate", "governmentOrderHandoverDate", "governmentOrderNumber", "governmentOrderDate", "sourceRecordingNote",
] as const satisfies readonly (keyof NonNullable<SpeechProvenance["projectRights"]>)[];
export const PUBLIC_SPEECH_SEMANTICS_KEYS = [
  "note", "legislatureScopeNote", "sourceNote", "documentTypeNote", "printerUnresolvedNote", "compiler", "namedVenueTa", "otherVenuesSourceText",
] as const;
export const PUBLIC_SPEECH_COVERAGE_KEYS = ["englishToTamilWordRatio", "tamilBodyWords", "englishBodyWords"] as const satisfies readonly (keyof NonNullable<SpeechProvenance["englishCoverage"]>)[];

declare const PUBLIC_SPEECH_PROVENANCE: unique symbol;
/** The public-safe projection `SpeechSource` renders — a strict subset of the archival shape. */
export type PublicSpeechProvenance = SpeechProvenance & { readonly [PUBLIC_SPEECH_PROVENANCE]: true };

/** Copy ONLY the listed keys that are present (an absent optional field stays absent, not `undefined`). */
function pick<T extends object>(obj: T, keys: readonly string[]): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k) && (obj as Record<string, unknown>)[k] !== undefined) out[k] = (obj as Record<string, unknown>)[k];
  return out as Partial<T>;
}

/** Project an archival speech provenance record to the fields the public Source & provenance page renders. */
export function toPublicSpeechProvenance(prov: SpeechProvenance): PublicSpeechProvenance {
  const out: Record<string, unknown> = pick(prov, ["sourceRepo", "sourcePath", "sourceCommit", "notes", "englishForm"]);
  if (prov.source) {
    const s = prov.source;
    out.source = {
      ...pick(s, PUBLIC_SPEECH_SOURCE_KEYS),
      ...(s.scanSplits ? { scanSplits: s.scanSplits.map((x) => pick(x, PUBLIC_SPEECH_SPLIT_KEYS)) } : {}),
      ...(s.collectionItem ? { collectionItem: pick(s.collectionItem, PUBLIC_SPEECH_COLLECTION_ITEM_KEYS) } : {}),
    };
  }
  if (prov.audioSource) {
    const a = prov.audioSource;
    out.audioSource = {
      ...pick(a, PUBLIC_SPEECH_AUDIO_KEYS),
      recordingBoundary: pick(a.recordingBoundary, PUBLIC_SPEECH_BOUNDARY_KEYS),
      directListeningAudit: pick(a.directListeningAudit, PUBLIC_SPEECH_LISTENING_KEYS),
      timeMap: a.timeMap.map((t) => pick(t, PUBLIC_SPEECH_TIMEMAP_KEYS)),
    };
  }
  out.transcription = pick(prov.transcription, PUBLIC_SPEECH_TRANSCRIPTION_KEYS);
  out.translation = pick(prov.translation, PUBLIC_SPEECH_TRANSLATION_KEYS);
  out.archiveDerived = {
    ...pick(prov.archiveDerived, PUBLIC_SPEECH_DERIVED_KEYS),
    ...(prov.archiveDerived.boundaryAudit ? { boundaryAudit: pick(prov.archiveDerived.boundaryAudit, PUBLIC_SPEECH_AUDIT_KEYS) } : {}),
  };
  if (prov.crossPageJoinPolicy) out.crossPageJoinPolicy = pick(prov.crossPageJoinPolicy, PUBLIC_SPEECH_JOIN_POLICY_KEYS);
  if (prov.blockers) out.blockers = prov.blockers.map((b) => pick(b, PUBLIC_SPEECH_BLOCKER_KEYS));
  if (prov.projectRights) out.projectRights = pick(prov.projectRights, PUBLIC_SPEECH_RIGHTS_KEYS);
  if (prov.semantics) out.semantics = pick(prov.semantics, PUBLIC_SPEECH_SEMANTICS_KEYS);
  if (prov.englishCoverage) out.englishCoverage = pick(prov.englishCoverage, PUBLIC_SPEECH_COVERAGE_KEYS);
  return out as PublicSpeechProvenance;
}
