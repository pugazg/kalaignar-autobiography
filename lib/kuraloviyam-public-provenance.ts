// The PUBLIC serialization boundary for Kuraloviyam provenance. `KuraloviyamSource` is a client component, so
// its props are serialized into the page HTML: the route passes ONLY this allowlist projection, applied at every
// nesting level (fail closed; branded so the archival record cannot be passed by accident). Mirrors
// lib/essay-public-provenance.ts.
import type { KuraloviyamProvenance } from "@/data/kuraloviyam";

type Src = KuraloviyamProvenance["source"];
export const PUBLIC_K_TOP_KEYS = ["sourceRepo", "sourcePath", "sourceCommit", "source", "verification", "sourceLimitedPages", "english", "structure", "notes"] as const satisfies readonly (keyof KuraloviyamProvenance)[];
export const PUBLIC_K_SOURCE_KEYS = ["titleTa", "authorTa", "publisherTa", "priceTa", "editionsEn", "scanFamily", "scanTotal"] as const satisfies readonly Exclude<keyof Src, "splits" | "binaryVendored">[];
export const PUBLIC_K_SPLIT_KEYS = ["part", "filename", "scans", "pages", "sha256", "bytes"] as const satisfies readonly (keyof Src["splits"][number])[];
export const PUBLIC_K_VERIFICATION_KEYS = ["visualVerified", "tamilTextualVerified", "englishReleaseReady", "sourceLimitedScans", "blocked"] as const satisfies readonly (keyof KuraloviyamProvenance["verification"])[];
export const PUBLIC_K_LIMITED_KEYS = ["scan", "printed", "pageType", "unit"] as const satisfies readonly (keyof KuraloviyamProvenance["sourceLimitedPages"][number])[];
export const PUBLIC_K_ENGLISH_KEYS = ["kind", "basis"] as const satisfies readonly (keyof KuraloviyamProvenance["english"])[];
export const PUBLIC_K_STRUCTURE_KEYS = ["entries", "frontMatterSections", "note"] as const satisfies readonly Exclude<keyof KuraloviyamProvenance["structure"], "crosswalk">[];
export const PUBLIC_K_CROSSWALK_KEYS = ["resolved", "partialSourceMetadata"] as const satisfies readonly (keyof KuraloviyamProvenance["structure"]["crosswalk"])[];

declare const PUBLIC_K_PROVENANCE: unique symbol;
export type PublicKuraloviyamProvenance = KuraloviyamProvenance & { readonly [PUBLIC_K_PROVENANCE]: true };

function pick<T extends object>(obj: T, keys: readonly string[]): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k) && (obj as Record<string, unknown>)[k] !== undefined) out[k] = (obj as Record<string, unknown>)[k];
  return out as Partial<T>;
}

export function toPublicKuraloviyamProvenance(p: KuraloviyamProvenance): PublicKuraloviyamProvenance {
  return {
    sourceRepo: p.sourceRepo,
    sourcePath: p.sourcePath,
    sourceCommit: p.sourceCommit,
    source: { ...pick(p.source, PUBLIC_K_SOURCE_KEYS), splits: p.source.splits.map((s) => pick(s, PUBLIC_K_SPLIT_KEYS)) },
    verification: pick(p.verification, PUBLIC_K_VERIFICATION_KEYS),
    sourceLimitedPages: p.sourceLimitedPages.map((x) => pick(x, PUBLIC_K_LIMITED_KEYS)),
    english: pick(p.english, PUBLIC_K_ENGLISH_KEYS),
    structure: { ...pick(p.structure, PUBLIC_K_STRUCTURE_KEYS), crosswalk: pick(p.structure.crosswalk, PUBLIC_K_CROSSWALK_KEYS) },
    notes: [...p.notes],
  } as unknown as PublicKuraloviyamProvenance;
}
