import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "@/data/storage";
import { useApp, useTheme } from "@/data/AppState";
import { Card, Eyebrow, Screen, T } from "@/components/ui";
import { radius, spacing } from "@/theme/theme";
import type { ProgressRecord } from "@/data/types";

export function HomeScreen() {
  const { manifest, chapterById } = useApp();
  const nav = useNavigation<any>();
  const c = useTheme();
  const [last, setLast] = useState<ProgressRecord | null>(null);
  const [recents, setRecents] = useState<{ id: string; title: string }[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const map = await storage.getProgressMap();
        const items = Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
        setLast(items[0] ?? null);
        const ids = await storage.getRecents();
        setRecents(
          ids
            .map((id) => ({ id, title: chapterById(id)?.chapter.title ?? id }))
            .slice(0, 6),
        );
      })();
    }, [chapterById]),
  );

  return (
    <Screen scroll>
      <Eyebrow>The Kalaignar Digital Library</Eyebrow>
      <T ta bold heading size={30}>நெஞ்சுக்கு நீதி</T>
      <T muted style={{ marginTop: spacing(2) }}>
        The complete six-volume memoir of Kalaignar M. Karunanidhi — read, search and explore offline.
      </T>

      {last ? (
        <Card style={{ marginTop: spacing(5) }} onPress={() => nav.navigate("Reader", { id: last.chapterId })}>
          <T faint size={11} style={{ letterSpacing: 1 }}>CONTINUE READING · {Math.round(last.ratio * 100)}%</T>
          <T ta bold size={19} style={{ marginTop: spacing(1) }}>{last.title}</T>
          <View style={{ height: 4, backgroundColor: c.border, borderRadius: 2, marginTop: spacing(3) }}>
            <View style={{ height: 4, width: `${Math.round(last.ratio * 100)}%`, backgroundColor: c.primary, borderRadius: 2 }} />
          </View>
        </Card>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing(3), marginTop: spacing(5) }}>
        <Tile icon="library-outline" label="Library" onPress={() => nav.navigate("Tabs", { screen: "Library" })} c={c} />
        <Tile icon="time-outline" label="Timeline" onPress={() => nav.navigate("Timeline")} c={c} />
        <Tile icon="search-outline" label="Search" onPress={() => nav.navigate("Tabs", { screen: "Search" })} c={c} />
        <Tile icon="bookmark-outline" label="Saved" onPress={() => nav.navigate("Saved")} c={c} />
      </View>

      {recents.length ? (
        <>
          <T faint size={12} style={{ letterSpacing: 1, marginTop: spacing(6), marginBottom: spacing(2) }}>RECENTLY READ</T>
          {recents.map((r) => (
            <Card key={r.id} style={{ marginBottom: spacing(2) }} onPress={() => nav.navigate("Reader", { id: r.id })}>
              <T ta size={16}>{r.title}</T>
            </Card>
          ))}
        </>
      ) : null}

      {manifest ? (
        <T faint size={12} style={{ marginTop: spacing(6) }}>
          {manifest.volumes.length} volumes · {manifest.volumes.reduce((n, v) => n + v.chapterCount, 0)} chapters
          {manifest.murasoli ? ` · ${manifest.murasoli.totalLetters} Murasoli letters` : ""}
        </T>
      ) : null}
    </Screen>
  );
}

function Tile({ icon, label, onPress, c }: { icon: any; label: string; onPress: () => void; c: any }) {
  return (
    <Card onPress={onPress} style={{ width: "47%", alignItems: "flex-start" }}>
      <Ionicons name={icon} size={24} color={c.primary} />
      <T bold style={{ marginTop: spacing(2) }}>{label}</T>
    </Card>
  );
}
