import React, { useLayoutEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api } from "@/data/client";
import { storage } from "@/data/storage";
import { useApp, useTheme } from "@/data/AppState";
import { EmptyState, Loading, Screen, T } from "@/components/ui";
import { radius, spacing } from "@/theme/theme";
import type { ChapterEntry } from "@/data/types";

export function VolumeScreen() {
  const { volumeByN } = useApp();
  const nav = useNavigation<any>();
  const c = useTheme();
  const { n } = (useRoute().params ?? {}) as { n: number };
  const volume = volumeByN(n);
  const [downloads, setDownloads] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useLayoutEffect(() => {
    nav.setOptions({ title: volume?.titleTa ?? `Volume ${n}` });
  }, [nav, volume, n]);

  React.useEffect(() => {
    storage.getDownloads().then((m) =>
      setDownloads(Object.fromEntries(Object.keys(m).map((k) => [k, true]))),
    );
  }, []);

  if (!volume) return <Screen><EmptyState title="Volume not found" /></Screen>;

  const toggleDownload = async (ch: ChapterEntry) => {
    setBusy(ch.id);
    try {
      if (downloads[ch.id]) {
        await api.removeChapterDownload(ch);
        setDownloads((d) => ({ ...d, [ch.id]: false }));
      } else {
        await api.downloadChapter(ch, volume.n);
        setDownloads((d) => ({ ...d, [ch.id]: true }));
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <FlatList
        data={volume.chapters}
        keyExtractor={(ch) => ch.id}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: c.border }} />}
        contentContainerStyle={{ paddingBottom: spacing(24) }}
        renderItem={({ item, index }) => (
          <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: spacing(3) }}>
            <Pressable
              onPress={() => nav.navigate("Reader", { id: item.id })}
              style={{ flex: 1, paddingRight: spacing(3) }}
              accessibilityRole="button"
              accessibilityLabel={`Chapter ${index + 1}: ${item.title}`}
            >
              <T faint size={11}>அத்தியாயம் {index + 1}{item.startPage ? ` · பக். ${item.startPage}–${item.endPage}` : ""}</T>
              <T ta size={17} style={{ marginTop: 2 }}>{item.title}</T>
            </Pressable>
            <Pressable
              onPress={() => toggleDownload(item)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityState={{ busy: busy === item.id }}
              accessibilityLabel={downloads[item.id] ? "Remove offline copy" : "Download for offline"}
              style={{ padding: spacing(2), borderRadius: radius.pill }}
            >
              <Ionicons
                name={busy === item.id ? "sync" : downloads[item.id] ? "checkmark-circle" : "download-outline"}
                size={22}
                color={downloads[item.id] ? c.primary : c.textFaint}
              />
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}
