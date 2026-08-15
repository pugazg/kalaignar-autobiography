import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useApp, useTheme } from "@/data/AppState";
import { api } from "@/data/client";
import { Card, EmptyState, Eyebrow, Loading, Screen, T } from "@/components/ui";
import { spacing } from "@/theme/theme";
import type { MurasoliIndex, MurasoliLettersIndex } from "@/data/types";

// Native Murasoli library. Driven entirely by index.json + letters-index.json,
// so new volumes appear without code changes. A volume with a non-empty `pages`
// array in the index is a page-scan volume (e.g. 54, Tamil-only); an empty
// `pages` array marks a letter volume (48–53) with full Tamil + English.
export function MurasoliLibraryScreen() {
  const { manifest } = useApp();
  const c = useTheme();
  const mu = manifest?.murasoli ?? null;

  const [idx, setIdx] = useState<MurasoliIndex | null>(null);
  const [letters, setLetters] = useState<MurasoliLettersIndex | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!mu) {
      setState("error");
      return;
    }
    let alive = true;
    setState("loading");
    Promise.all([api.murasoliIndex(mu.indexUrl), api.murasoliLetters(mu.lettersIndexUrl)])
      .then(([i, l]) => {
        if (!alive) return;
        if (!i || !Array.isArray(i.volumes)) {
          setState("error");
          return;
        }
        setIdx(i);
        setLetters(l && Array.isArray(l.volumes) ? l : { collection: "murasoli", volumes: [] });
        setState("ready");
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [mu]);

  const lettersByVol = useMemo(() => {
    const m = new Map<number, MurasoliLettersIndex["volumes"][number]>();
    for (const v of letters?.volumes ?? []) m.set(v.volume, v);
    return m;
  }, [letters]);

  const nav = useNavigation<any>();

  if (state === "loading") return <Screen><Loading label="Loading Murasoli…" /></Screen>;
  if (state === "error" || !idx)
    return (
      <Screen>
        <EmptyState title="Couldn't load Murasoli" body="Check your connection and try again." />
      </Screen>
    );

  const volumes = [...idx.volumes].sort((a, b) => a.volume - b.volume);

  return (
    <Screen scroll>
      <Eyebrow>Collection</Eyebrow>
      <T ta bold size={24} style={{ marginBottom: spacing(2) }}>{idx.title?.ta ?? "முரசொலி"}</T>
      <T muted style={{ marginBottom: spacing(2) }}>{idx.title?.en ?? "Murasoli"}</T>
      {idx.rights ? <T faint size={12} style={{ marginBottom: spacing(5) }}>{idx.rights}</T> : <View style={{ height: spacing(3) }} />}

      {volumes.map((v) => {
        // A volume with pages populated in the index (vol 54) is scan-sourced and
        // Tamil-only; letter volumes carry full English. Every volume is browsed
        // as letters (see MurasoliVolumeScreen).
        const tamilOnly = Array.isArray(v.pages) && v.pages.length > 0;
        const li = lettersByVol.get(v.volume);
        const letterCount = li?.letterCount ?? li?.letters?.length ?? 0;
        const range = li ? yearRange(li.letters.map((l) => l.date)) : null;
        return (
          <Card key={v.volume} onPress={() => nav.navigate("MurasoliVolume", { volume: v.volume })} style={{ marginBottom: spacing(3) }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="mail-outline" size={22} color={c.primary} style={{ marginRight: spacing(3) }} />
              <View style={{ flex: 1 }}>
                <T bold size={16} style={{ color: c.accent }}>
                  தொகுதி {v.volume}
                  {range ? ` · ${range}` : ""}
                </T>
                <T muted size={13} style={{ marginTop: 2 }}>
                  {letterCount} letters · {v.pageCount} pages · {tamilOnly ? "Tamil" : "Tamil + English"}
                </T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
            </View>
          </Card>
        );
      })}

      <T faint size={12} style={{ marginTop: spacing(4), fontStyle: "italic" }}>
        Original Tamil letters published in Murasoli. {idx.volumeCount ?? volumes.length} volumes available.
      </T>
    </Screen>
  );
}

/** Min–max year across letter dates (e.g. "2013–2014"); null if none parse. */
function yearRange(dates: (string | null)[]): string | null {
  const years = dates
    .map((d) => (d && /^\d{4}/.test(d) ? parseInt(d.slice(0, 4), 10) : null))
    .filter((y): y is number => y != null);
  if (!years.length) return null;
  const lo = Math.min(...years);
  const hi = Math.max(...years);
  return lo === hi ? String(lo) : `${lo}–${hi}`;
}
