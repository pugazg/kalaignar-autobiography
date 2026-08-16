import React from "react";
import { FlatList, Pressable, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useApp, useTheme } from "@/data/AppState";
import { useFeature } from "@/data/useFeature";
import { ChapterRefs } from "@/components/ChapterRefs";
import { EmptyState, Eyebrow, Loading, Screen, T } from "@/components/ui";
import { contentMaxWidth, radius, spacing } from "@/theme/theme";
import type { PeopleFeature, PersonItem } from "@/data/types";

function parsePeople(raw: unknown): PeopleFeature | null {
  const arr = (raw as any)?.people;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  for (const p of arr) {
    if (!p || typeof p.id !== "string" || typeof p.tamil !== "string" || typeof p.name !== "string") return null;
    if (typeof p.role !== "string" || typeof p.relationship !== "string" || !Array.isArray(p.refs)) return null;
  }
  return raw as PeopleFeature;
}

// ── People list ────────────────────────────────────────────────────────────────
export function PeopleScreen() {
  const { manifest } = useApp();
  const c = useTheme();
  const nav = useNavigation<any>();
  const state = useFeature<PeopleFeature>(manifest?.features.people, parsePeople);

  if (state.status === "loading") return <View style={{ flex: 1, backgroundColor: c.bg }}><Loading label="Loading people…" /></View>;
  if (state.status === "unavailable")
    return <View style={{ flex: 1, backgroundColor: c.bg }}><EmptyState title="People couldn't load" body="Check your connection and try again." /></View>;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ padding: spacing(5), paddingBottom: spacing(16), width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}
      data={state.data.people}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={
        <View style={{ paddingBottom: spacing(3) }}>
          <Eyebrow>Explore</Eyebrow>
          <T ta bold heading size={24} style={{ marginBottom: spacing(1) }}>மனிதர்கள்</T>
          <T muted size={13}>Figures in the memoir · tap to explore</T>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => nav.navigate("PersonDetail", { id: item.id })}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}. ${item.role}.`}
          style={({ pressed }) => ({
            backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border,
            padding: spacing(4), marginBottom: spacing(2), opacity: pressed ? 0.85 : 1,
          })}
        >
          <T ta bold size={18}>{item.tamil}</T>
          <T size={14} style={{ marginTop: 2 }}>{item.name}</T>
          <T muted size={13} style={{ marginTop: 2, color: c.accent }}>{item.role}</T>
        </Pressable>
      )}
    />
  );
}

// ── Person detail ────────────────────────────────────────────────────────────────
export function PersonDetailScreen() {
  const { id } = useRoute().params as { id: string };
  const { manifest } = useApp();
  const c = useTheme();
  const state = useFeature<PeopleFeature>(manifest?.features.people, parsePeople);

  if (state.status === "loading") return <Screen><Loading label="Loading…" /></Screen>;
  const person: PersonItem | undefined = state.status === "ready" ? state.data.people.find((p) => p.id === id) : undefined;
  if (!person) return <Screen><EmptyState title="Person not found" /></Screen>;

  return (
    <Screen scroll>
      <T ta bold heading size={26}>{person.tamil}</T>
      <T size={16} style={{ marginTop: 2 }}>{person.name}</T>
      <T bold size={14} style={{ color: c.accent, marginTop: spacing(1) }}>{person.role}</T>

      <T style={{ fontSize: 15, lineHeight: 23, marginTop: spacing(4) }}>{person.relationship}</T>

      {person.firstAppears ? (
        <T muted size={13} style={{ marginTop: spacing(3), fontStyle: "italic" }}>First appears: {person.firstAppears}</T>
      ) : null}

      <ChapterRefs refs={person.refs} />
    </Screen>
  );
}
