import { useEffect, useState } from "react";
import { api } from "./client";

// Small reusable loader for a feature dataset (themes / people / places, …). It
// fetches the URL through the shared offline-first `api.feature` cache and runs a
// caller-supplied defensive parser. Each collection degrades independently: a
// missing URL, a fetch failure with no cache, or a malformed payload all resolve
// to "unavailable" rather than throwing — callers show a truthful empty/error state.
export type FeatureState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "unavailable" };

export function useFeature<T>(
  url: string | null | undefined,
  parse: (raw: unknown) => T | null,
): FeatureState<T> {
  const [state, setState] = useState<FeatureState<T>>(url ? { status: "loading" } : { status: "unavailable" });

  useEffect(() => {
    let alive = true;
    if (!url) {
      setState({ status: "unavailable" });
      return;
    }
    setState({ status: "loading" });
    api
      .feature<unknown>(url)
      .then((raw) => {
        if (!alive) return;
        const data = parse(raw);
        setState(data ? { status: "ready", data } : { status: "unavailable" });
      })
      .catch(() => {
        if (alive) setState({ status: "unavailable" });
      });
    return () => {
      alive = false;
    };
  }, [url]);

  return state;
}
