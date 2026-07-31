import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { storage } from "@/data/storage";
import { useTheme } from "@/data/AppState";
import { Card, EmptyState, Pill, Screen, T } from "@/components/ui";
import { spacing } from "@/theme/theme";
import type { Bookmark, DownloadRecord, ProgressRecord } from "@/data/types";

type Tab = "bookmarks" | "downloads" | "progress";

export function SavedScreen() {
  const nav = useNavigation<any>();
  const c = useTheme();
  const [tab, setTab] = useState<Tab>("bookmarks");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      storage.getBookmarks().then(setBookmarks);
      storage.getDownloads().then((m) => setDownloads(Object.values(m).sort((a, b) => b.downloadedAt - a.downloadedAt)));
      storage.getProgressMap().then((m) => setProgress(Object.values(m).sort((a, b) => b.updatedAt - a.updatedAt)));
    }, []),
  );

  const list =
    tab === "bookmarks"
      ? bookmarks.map((b) => ({ id: b.chapterId, title: b.title, sub: `தொகுதி ${b.volume}` }))
      : tab === "downloads"
      ? downloads.map((d) => ({ id: d.chapterId, title: d.chapterId, sub: `தொகுதி ${d.volume} · ${(d.bytes / 1024).toFixed(0)} KB offline` }))
      : progress.map((p) => ({ id: p.chapterId, title: p.title, sub: `${Math.round(p.ratio * 100)}% read` }));

  return (
    <Screen>
      <View style={{ flexDirection: "row", marginBottom: spacing(3) }}>
        <Pill label={`Bookmarks (${bookmarks.length})`} active={tab === "bookmarks"} onPress={() => setTab("bookmarks")} />
        <Pill label={`Offline (${downloads.length})`} active={tab === "downloads"} onPress={() => setTab("downloads")} />
        <Pill label="In progress" active={tab === "progress"} onPress={() => setTab("progress")} />
      </View>
      {list.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          body={tab === "bookmarks" ? "Bookmark a chapter while reading." : tab === "downloads" ? "Download chapters from a volume for offline reading." : "Your reading progress appears here."}
        />
      ) : (
        list.map((item) => (
          <Card key={item.id + tab} style={{ marginBottom: spacing(2) }} onPress={() => nav.navigate("Reader", { id: item.id })}>
            <T ta size={16}>{item.title}</T>
            <T faint size={12} style={{ marginTop: 2 }}>{item.sub}</T>
          </Card>
        ))
      )}
    </Screen>
  );
}
