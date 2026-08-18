import React, { useEffect, useLayoutEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useApp, useTheme } from "@/data/AppState";
import { api } from "@/data/client";
import { EmptyState, Eyebrow, Loading, T } from "@/components/ui";
import { contentMaxWidth, radius, spacing } from "@/theme/theme";
import type { MurasoliLetterRef } from "@/data/types";

// A Murasoli volume: its letter list (every volume, including the scan-sourced
// vol 54, is presented as letters — consistent with the website). Uses FlatList
// so long volumes stay efficient, and fetches only the index — never the letter
// bodies — to render.
export function MurasoliVolumeScreen() {
  const { volume } = useRoute().params as { volume: number };
  const { manifest } = useApp();
  const c = useTheme();
  const nav = useNavigation<any>();
  const mu = manifest?.murasoli ?? null;

  const [letters, setLetters] = useState<MurasoliLetterRef[] | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [nonce, setNonce] = useState(0); // bump to retry after a failure

  useLayoutEffect(() => {
    nav.setOptions({ title: `தொகுதி ${volume}` });
  }, [nav, volume]);

  useEffect(() => {
    if (!mu) {
      setState("error");
      return;
    }
    let alive = true;
    setState("loading");
    api
      .murasoliLetters(mu.lettersIndexUrl)
      .then((li) => {
        if (!alive) return;
        const vl = li?.volumes?.find((v) => v.volume === volume);
        if (!vl || !Array.isArray(vl.letters)) {
          setState("error");
          return;
        }
        setLetters(vl.letters);
        setState("ready");
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [mu, volume, nonce]);

  if (state === "loading") return <View style={{ flex: 1, backgroundColor: c.bg }}><Loading label="Loading volume…" /></View>;
  if (state === "error" || !letters)
    return <View style={{ flex: 1, backgroundColor: c.bg }}><EmptyState title="Couldn't load this volume" body="Check your connection and try again." actionLabel="Try again" onAction={() => setNonce((n) => n + 1)} /></View>;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ padding: spacing(5), paddingBottom: spacing(16), width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}
      data={letters}
      keyExtractor={(l) => l.id}
      ListHeaderComponent={
        <View style={{ paddingBottom: spacing(3) }}>
          <Eyebrow>Murasoli · தொகுதி {volume}</Eyebrow>
          <T muted size={13} style={{ marginTop: spacing(1) }}>{letters.length} letters · tap to read</T>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => nav.navigate("MurasoliReader", { id: item.id })}
          accessibilityRole="button"
          accessibilityLabel={`Letter ${item.number}${item.date ? `, ${formatDate(item.date)}` : ""}`}
          style={({ pressed }) => ({
            backgroundColor: c.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: c.border,
            padding: spacing(4),
            marginBottom: spacing(2),
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <T bold size={12} style={{ color: c.accent }}>
            #{item.number}{item.date ? ` · ${formatDate(item.date)}` : ""}
          </T>
          <T ta size={16} style={{ marginTop: spacing(1) }}>{item.title?.ta ?? `கடிதம் ${item.number}`}</T>
        </Pressable>
      )}
    />
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** ISO YYYY-MM-DD → "D MMM YYYY"; returns the raw string if it doesn't parse. */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const mi = parseInt(mo, 10) - 1;
  return `${parseInt(d, 10)} ${MONTHS[mi] ?? mo} ${y}`;
}
