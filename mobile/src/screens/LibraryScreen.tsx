import React from "react";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp, useTheme } from "@/data/AppState";
import { Card, Eyebrow, EmptyState, Loading, Screen, T } from "@/components/ui";
import { spacing } from "@/theme/theme";

export function LibraryScreen() {
  const { status, manifest, error, reload } = useApp();
  const nav = useNavigation<any>();
  const c = useTheme();

  if (status === "loading") return <Screen><Loading label="Opening the library…" /></Screen>;
  if (status === "error" || !manifest)
    return (
      <Screen>
        <EmptyState title="The library couldn't load" body={error ?? "Check your connection."} />
      </Screen>
    );

  return (
    <Screen>
      <Eyebrow>{manifest.work.titleEn} · six volumes</Eyebrow>
      <T ta bold size={26} style={{ marginBottom: spacing(4) }}>{manifest.work.titleTa}</T>
      <FlatList
        data={manifest.volumes}
        keyExtractor={(v) => String(v.n)}
        ItemSeparatorComponent={() => <T style={{ height: spacing(3) }} />}
        contentContainerStyle={{ paddingBottom: spacing(24) }}
        renderItem={({ item }) => (
          <Card onPress={() => nav.navigate("Volume", { n: item.n })}>
            <T faint size={12} style={{ letterSpacing: 1 }}>தொகுதி {item.n} · {item.period}</T>
            <T ta bold size={19} style={{ marginTop: spacing(1) }}>
              {item.titleTa ?? `Volume ${item.n}`}
            </T>
            <T muted size={13} style={{ marginTop: spacing(2) }}>
              {item.chapterCount} chapters · {item.pages} pages
              {item.serialisedIn ? ` · ${item.serialisedIn}` : ""}
            </T>
          </Card>
        )}
      />
    </Screen>
  );
}
