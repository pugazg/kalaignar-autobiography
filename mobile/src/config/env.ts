import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as {
  origin?: string;
  manifestPath?: string;
};

// The website is the source of truth. All content is fetched from this origin and
// cached locally for offline use. Overridable via app.json → expo.extra.
export const ORIGIN = extra.origin ?? "https://nenjukkuneethi.org";
export const MANIFEST_PATH = extra.manifestPath ?? "/data/app/manifest.v1.json";

/** Resolve a data-relative URL (e.g. "/data/text/v1-ch01.json") to an absolute URL. */
export const url = (path: string) => (path.startsWith("http") ? path : `${ORIGIN}${path}`);
