import React from "react";
import { Pressable, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp, useTheme } from "@/data/AppState";
import { EmptyState, Eyebrow, Loading, Screen, T } from "@/components/ui";
import { radius, spacing } from "@/theme/theme";
import type { VolumeEntry } from "@/data/types";

// Increment 1: the timeline is the six volumes laid out as eras from their
// `period` metadata (1924–1969 … 1999–2005). When a `features.timeline` JSON
// export exists (Increment 2) this screen gains milestone-level entries with
// deep-links straight to the Reader; until then each era opens its Volume.
export function TimelineScreen() {
  const { status, manifest } = useApp();
  const nav = useNavigation<any>();
  const c = useTheme();

  if (status === "loading") return <Screen><Loading label="Building the timeline…" /></Screen>;
  if (!manifest) return <Screen><EmptyState title="The timeline couldn't load" body="Check your connection." /></Screen>;

  const eras = [...manifest.volumes].sort((a, b) => startYear(a) - startYear(b));

  return (
    <Screen scroll>
      <Eyebrow>1924 – 2005 · Eighty-one years</Eyebrow>
      <T ta bold size={26} style={{ marginBottom: spacing(2) }}>காலக்கோடு</T>
      <T muted style={{ marginBottom: spacing(6) }}>
        Kalaignar's life across the six volumes of the memoir. Tap an era to open its volume.
      </T>

      {eras.map((v, i) => (
        <EraRow
          key={v.n}
          c={c}
          volume={v}
          first={i === 0}
          last={i === eras.length - 1}
          onPress={() => nav.navigate("Volume", { n: v.n })}
        />
      ))}

      {manifest.features.timeline ? null : (
        <T faint size={12} style={{ marginTop: spacing(6), fontStyle: "italic" }}>
          Milestone-level events with direct links to passages are coming as the feature data is
          published.
        </T>
      )}
    </Screen>
  );
}

function EraRow({
  c,
  volume,
  first,
  last,
  onPress,
}: {
  c: any;
  volume: VolumeEntry;
  first: boolean;
  last: boolean;
  onPress: () => void;
}) {
  return (
    <View style={{ flexDirection: "row" }}>
      {/* Rail + node */}
      <View style={{ width: 28, alignItems: "center" }}>
        <View style={{ width: 2, flex: first ? 0 : undefined, height: first ? spacing(3) : spacing(3), backgroundColor: first ? "transparent" : c.border }} />
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c.primary, borderWidth: 3, borderColor: c.bg }} />
        <View style={{ width: 2, flex: 1, backgroundColor: last ? "transparent" : c.border }} />
      </View>

      {/* Card */}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Volume ${volume.n}, ${volume.period}`}
        style={({ pressed }) => ({
          flex: 1,
          marginBottom: spacing(3),
          marginLeft: spacing(2),
          backgroundColor: c.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: c.border,
          padding: spacing(4),
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <T bold size={15} style={{ color: c.accent }}>{volume.period ?? "—"}</T>
        <T ta bold size={18} style={{ marginTop: spacing(1) }}>
          {volume.titleTa ?? `தொகுதி ${volume.n}`}
        </T>
        <T muted size={13} style={{ marginTop: spacing(2) }}>
          தொகுதி {volume.n} · {volume.chapterCount} chapters
          {volume.pages ? ` · ${volume.pages} pages` : ""}
        </T>
      </Pressable>
    </View>
  );
}

function startYear(v: VolumeEntry): number {
  const m = v.period?.match(/\d{4}/);
  return m ? parseInt(m[0], 10) : v.n;
}
