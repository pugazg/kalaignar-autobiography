import React, { useMemo } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useApp, useTheme } from "@/data/AppState";
import { useFeature } from "@/data/useFeature";
import { ChapterRefs } from "@/components/ChapterRefs";
import { EmptyState, Eyebrow, Loading, Screen, T } from "@/components/ui";
import { contentMaxWidth, radius, spacing } from "@/theme/theme";
import type { PeopleFeature, PersonItem, ThemeItem, ThemesFeature } from "@/data/types";

// ── Defensive parsers (fail the whole collection rather than drop records) ─────
function parseThemes(raw: unknown): ThemesFeature | null {
  const arr = (raw as any)?.themes;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  for (const t of arr) {
    if (!t || typeof t.id !== "string" || typeof t.tamil !== "string" || typeof t.title !== "string") return null;
    if (typeof t.narrative !== "string") return null;
    if (!Array.isArray(t.initiatives) || !Array.isArray(t.achievements) || !Array.isArray(t.stats) || !Array.isArray(t.refs)) return null;
  }
  return raw as ThemesFeature;
}
function parsePeople(raw: unknown): PeopleFeature | null {
  const arr = (raw as any)?.people;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  for (const p of arr) if (!p || typeof p.id !== "string" || typeof p.name !== "string") return null;
  return raw as PeopleFeature;
}

// ── Themes list ────────────────────────────────────────────────────────────────
export function ThemesScreen() {
  const { manifest } = useApp();
  const c = useTheme();
  const nav = useNavigation<any>();
  const state = useFeature<ThemesFeature>(manifest?.features.themes, parseThemes);

  if (state.status === "loading") return <View style={{ flex: 1, backgroundColor: c.bg }}><Loading label="Loading themes…" /></View>;
  if (state.status === "unavailable")
    return <View style={{ flex: 1, backgroundColor: c.bg }}><EmptyState title="Themes couldn't load" body="Check your connection and try again." /></View>;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ padding: spacing(5), paddingBottom: spacing(16), width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}
      data={state.data.themes}
      keyExtractor={(t) => t.id}
      ListHeaderComponent={
        <View style={{ paddingBottom: spacing(3) }}>
          <Eyebrow>Explore</Eyebrow>
          <T ta bold heading size={24} style={{ marginBottom: spacing(1) }}>கருப்பொருள்கள்</T>
          <T muted size={13}>Themes across the memoir · tap to explore</T>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => nav.navigate("ThemeDetail", { id: item.id })}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}. ${item.tamil}.`}
          style={({ pressed }) => ({
            backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border,
            padding: spacing(4), marginBottom: spacing(3), opacity: pressed ? 0.85 : 1,
          })}
        >
          <T ta bold size={18}>{item.tamil}</T>
          <T bold size={14} style={{ color: c.accent, marginTop: 2 }}>{item.title}</T>
          <T muted size={13} numberOfLines={2} style={{ marginTop: spacing(2), lineHeight: 20 }}>{item.narrative}</T>
        </Pressable>
      )}
    />
  );
}

// ── Theme detail ────────────────────────────────────────────────────────────────
export function ThemeDetailScreen() {
  const { id } = useRoute().params as { id: string };
  const { manifest, chapterById } = useApp();
  const c = useTheme();
  const nav = useNavigation<any>();

  const themes = useFeature<ThemesFeature>(manifest?.features.themes, parseThemes);
  const people = useFeature<PeopleFeature>(manifest?.features.people, parsePeople);

  const theme: ThemeItem | undefined = themes.status === "ready" ? themes.data.themes.find((t) => t.id === id) : undefined;
  const peopleById = useMemo(() => {
    const m = new Map<string, PersonItem>();
    if (people.status === "ready") for (const p of people.data.people) m.set(p.id, p);
    return m;
  }, [people]);

  if (themes.status === "loading") return <Screen><Loading label="Loading…" /></Screen>;
  if (!theme) return <Screen><EmptyState title="Theme not found" /></Screen>;

  return (
    <Screen scroll>
      <T ta bold heading size={26}>{theme.tamil}</T>
      <T bold size={16} style={{ color: c.accent, marginTop: 2, marginBottom: spacing(3) }}>{theme.title}</T>
      <T style={{ fontSize: 15, lineHeight: 23 }}>{theme.narrative}</T>

      <BulletSection c={c} title="Initiatives" items={theme.initiatives} />
      <BulletSection c={c} title="Achievements" items={theme.achievements} />

      {theme.stats?.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing(2), marginTop: spacing(4) }}>
          {theme.stats.map((s, i) => (
            <View key={i} style={{ backgroundColor: c.surfaceAlt, borderRadius: radius.md, paddingVertical: spacing(2), paddingHorizontal: spacing(3) }}>
              <T bold size={16} style={{ color: c.primary }}>{s.value}</T>
              <T muted size={12}>{s.label}</T>
            </View>
          ))}
        </View>
      ) : null}

      {theme.archive?.context ? (
        <View style={{ marginTop: spacing(4), borderLeftWidth: 3, borderLeftColor: c.accent, paddingLeft: spacing(3) }}>
          <T muted size={14} style={{ fontStyle: "italic", lineHeight: 21 }}>{theme.archive.context}</T>
        </View>
      ) : null}

      {/* archive.people — link to Person detail (ids are validated at build) */}
      {theme.archive?.people?.length ? (
        <View style={{ marginTop: spacing(4) }}>
          <T faint size={12} bold style={{ letterSpacing: 1, marginBottom: spacing(2) }}>PEOPLE</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing(2) }}>
            {theme.archive.people.map((pid) => {
              const person = peopleById.get(pid);
              return (
                <Pressable key={pid} onPress={() => nav.navigate("PersonDetail", { id: pid })} accessibilityRole="button"
                  style={({ pressed }) => ({ borderWidth: 1, borderColor: c.primary, borderRadius: radius.pill, paddingVertical: spacing(1.5), paddingHorizontal: spacing(3), opacity: pressed ? 0.7 : 1 })}>
                  <T ta size={13} style={{ color: c.primary }}>{person?.tamil ?? person?.name ?? pid}</T>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* archive.events — event label opens its chapter */}
      {theme.archive?.events?.length ? (
        <View style={{ marginTop: spacing(4) }}>
          <T faint size={12} bold style={{ letterSpacing: 1, marginBottom: spacing(2) }}>MOMENTS</T>
          {theme.archive.events.map((e, i) =>
            chapterById(e.ref) ? (
              <Pressable key={i} onPress={() => nav.navigate("Reader", { id: e.ref })} accessibilityRole="button" accessibilityLabel={e.label}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing(3), marginBottom: spacing(2), opacity: pressed ? 0.85 : 1 })}>
                <T size={14} style={{ flex: 1 }}>{e.label}</T>
                <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
              </Pressable>
            ) : null,
          )}
        </View>
      ) : null}

      <ChapterRefs refs={theme.refs} />
    </Screen>
  );
}

function BulletSection({ c, title, items }: { c: any; title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <View style={{ marginTop: spacing(4) }}>
      <T faint size={12} bold style={{ letterSpacing: 1, marginBottom: spacing(2) }}>{title.toUpperCase()}</T>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: spacing(2) }}>
          <T style={{ color: c.accent, marginRight: spacing(2) }}>•</T>
          <T muted size={14} style={{ flex: 1, lineHeight: 21 }}>{it}</T>
        </View>
      ))}
    </View>
  );
}
