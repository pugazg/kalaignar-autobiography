import React from "react";
import { Pressable, View, type DimensionValue } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useApp, useTheme } from "@/data/AppState";
import { useFeature } from "@/data/useFeature";
import { ChapterRefs } from "@/components/ChapterRefs";
import { EmptyState, Eyebrow, Loading, Screen, T } from "@/components/ui";
import { PLACE_MAP_VIEWBOX, type PlaceItem, type PlacesFeature } from "@/data/types";
import { radius, spacing } from "@/theme/theme";

function parsePlaces(raw: unknown): PlacesFeature | null {
  const arr = (raw as any)?.places;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  for (const p of arr) {
    if (!p || typeof p.id !== "string" || typeof p.tamil !== "string" || typeof p.name !== "string") return null;
    if (typeof p.note !== "string" || !Array.isArray(p.refs)) return null;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  }
  return raw as PlacesFeature;
}

// ── Places list + schematic map ──────────────────────────────────────────────
export function PlacesScreen() {
  const { manifest } = useApp();
  const c = useTheme();
  const nav = useNavigation<any>();
  const state = useFeature<PlacesFeature>(manifest?.features.places, parsePlaces);

  if (state.status === "loading") return <View style={{ flex: 1, backgroundColor: c.bg }}><Loading label="Loading places…" /></View>;
  if (state.status === "unavailable")
    return <View style={{ flex: 1, backgroundColor: c.bg }}><EmptyState title="Places couldn't load" body="Check your connection and try again." /></View>;

  const places = state.data.places;

  return (
    <Screen scroll>
      <Eyebrow>Explore</Eyebrow>
      <T ta bold heading size={24} style={{ marginBottom: spacing(1) }}>இடங்கள்</T>
      <T muted size={13} style={{ marginBottom: spacing(4) }}>The memoir's geography · tap a place to explore</T>

      <SchematicMap c={c} places={places} onSelect={(id) => nav.navigate("PlaceDetail", { id })} />

      {places.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => nav.navigate("PlaceDetail", { id: p.id })}
          accessibilityRole="button"
          accessibilityLabel={`${p.name}. ${p.tamil}.`}
          style={({ pressed }) => ({
            backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border,
            padding: spacing(4), marginBottom: spacing(2), opacity: pressed ? 0.85 : 1,
          })}
        >
          <T ta bold size={18}>{p.tamil}</T>
          <T size={14} style={{ marginTop: 2 }}>{p.name}</T>
          <T muted size={13} numberOfLines={2} style={{ marginTop: spacing(1), lineHeight: 19 }}>{p.note}</T>
        </Pressable>
      ))}
    </Screen>
  );
}

// A schematic map: markers placed by the source x/y within the declared viewBox,
// using percentage offsets — no mapping library, no geographic claim. Labelled as
// schematic; each marker is an accessible button opening the place detail.
function SchematicMap({ c, places, onSelect }: { c: any; places: PlaceItem[]; onSelect: (id: string) => void }) {
  return (
    <View style={{ marginBottom: spacing(5) }}>
      <View
        accessibilityLabel="Schematic map of memoir places — relative positions, not to scale"
        style={{
          width: "100%",
          aspectRatio: PLACE_MAP_VIEWBOX.w / PLACE_MAP_VIEWBOX.h,
          backgroundColor: c.surfaceAlt,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: c.border,
          overflow: "hidden",
        }}
      >
        {places.map((p) => {
          const left = `${(p.x / PLACE_MAP_VIEWBOX.w) * 100}%` as DimensionValue;
          const top = `${(p.y / PLACE_MAP_VIEWBOX.h) * 100}%` as DimensionValue;
          return (
            <Pressable
              key={p.id}
              onPress={() => onSelect(p.id)}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}, ${p.tamil}`}
              hitSlop={16}
              style={{ position: "absolute", left, top, marginLeft: -6, marginTop: -6 }}
            >
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.primary, borderWidth: 2, borderColor: c.bg }} />
            </Pressable>
          );
        })}
      </View>
      <T faint size={11} style={{ marginTop: spacing(1), fontStyle: "italic" }}>
        Schematic positions — relative only, not geographic / not to scale.
      </T>
    </View>
  );
}

// ── Place detail ────────────────────────────────────────────────────────────────
export function PlaceDetailScreen() {
  const { id } = useRoute().params as { id: string };
  const { manifest } = useApp();
  const c = useTheme();
  const state = useFeature<PlacesFeature>(manifest?.features.places, parsePlaces);

  if (state.status === "loading") return <Screen><Loading label="Loading…" /></Screen>;
  const place = state.status === "ready" ? state.data.places.find((p) => p.id === id) : undefined;
  if (!place) return <Screen><EmptyState title="Place not found" /></Screen>;

  return (
    <Screen scroll>
      <T ta bold heading size={26}>{place.tamil}</T>
      <T size={16} style={{ marginTop: 2, marginBottom: spacing(3) }}>{place.name}</T>
      <T style={{ fontSize: 15, lineHeight: 23 }}>{place.note}</T>
      <ChapterRefs refs={place.refs} />
    </Screen>
  );
}
