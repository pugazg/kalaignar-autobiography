import React from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useApp, useTheme } from "@/data/AppState";
import { radius, spacing } from "@/theme/theme";
import { T } from "./ui";

// Renders a set of memoir chapter refs as native links into the existing Reader,
// resolving each id to its real Tamil chapter title + volume via the manifest.
// Unresolved ids are dropped (never linked), so a bad ref can't open a dead screen.
// No `find` term is invented — feature refs carry none.
export function ChapterRefs({ refs, label = "IN THE MEMOIR" }: { refs: string[]; label?: string }) {
  const { chapterById } = useApp();
  const c = useTheme();
  const nav = useNavigation<any>();

  const resolved = (refs ?? [])
    .map((id) => ({ id, hit: chapterById(id) }))
    .filter((r): r is { id: string; hit: NonNullable<ReturnType<typeof chapterById>> } => !!r.hit);

  if (!resolved.length) return null;

  return (
    <View style={{ marginTop: spacing(4) }}>
      <T faint size={12} bold style={{ letterSpacing: 1, marginBottom: spacing(2) }}>{label}</T>
      {resolved.map(({ id, hit }) => (
        <Pressable
          key={id}
          onPress={() => nav.navigate("Reader", { id })}
          accessibilityRole="button"
          accessibilityLabel={`Open ${hit.chapter.title}, volume ${hit.volume.n}`}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: c.border,
            paddingVertical: spacing(3),
            paddingHorizontal: spacing(3),
            marginBottom: spacing(2),
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{ flex: 1 }}>
            <T ta size={15}>{hit.chapter.title}</T>
            <T faint size={12} style={{ marginTop: 1 }}>தொகுதி {hit.volume.n}</T>
          </View>
          <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
        </Pressable>
      ))}
    </View>
  );
}
