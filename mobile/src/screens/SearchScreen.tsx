import React, { useMemo, useRef, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { api } from "@/data/client";
import { storage } from "@/data/storage";
import { useApp, useTheme } from "@/data/AppState";
import { Pill, Screen, T } from "@/components/ui";
import { radius, spacing, tamilFont } from "@/theme/theme";
import type { FullTextEntry } from "@/data/types";

type Result = { id: string; volume: number; title: string; snippet: string; at: number };

export function SearchScreen() {
  const { manifest } = useApp();
  const nav = useNavigation<any>();
  const c = useTheme();
  const [q, setQ] = useState("");
  // The term that actually produced the current results. Editing `q` without
  // re-submitting must not change what the displayed results mean.
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [vol, setVol] = useState<number | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [failedVolumes, setFailedVolumes] = useState(0);
  const index = useRef<Map<number, FullTextEntry[]>>(new Map());

  React.useEffect(() => {
    storage.getSearchHistory().then(setHistory);
  }, []);

  const loadVolume = async (n: number) => {
    if (index.current.has(n)) return index.current.get(n)!;
    const v = manifest?.volumes.find((x) => x.n === n);
    if (!v?.searchIndexUrl) return [];
    const data = await api.searchIndex(v.searchIndexUrl); // cached → offline-capable
    index.current.set(n, data);
    return data;
  };

  const run = async (term: string) => {
    const needle = term.trim();
    if (needle.length < 2) {
      setResults(null);
      return;
    }
    setSubmittedQuery(needle); // this is now the term the results belong to
    setLoading(true);
    setFailedVolumes(0);
    setResults([]); // enter the results view so the "Searching…" state shows
    const vols = vol ? [vol] : manifest?.volumes.map((v) => v.n) ?? [];
    const out: Result[] = [];
    let failed = 0;
    try {
      for (const n of vols) {
        try {
          const entries = await loadVolume(n); // may throw when offline & uncached
          for (const e of entries) {
            const at = e.x.indexOf(needle);
            if (at >= 0) {
              const start = Math.max(0, at - 40);
              out.push({
                id: e.i,
                volume: n,
                title: e.t,
                snippet: (start > 0 ? "…" : "") + e.x.slice(start, at + needle.length + 60) + "…",
                at,
              });
            }
          }
        } catch {
          failed += 1; // this volume's index couldn't be fetched — keep going
        }
        if (out.length > 200) break;
      }
      storage.pushSearch(needle).then(() => storage.getSearchHistory().then(setHistory));
    } finally {
      setResults(out);
      setFailedVolumes(failed);
      setLoading(false);
    }
  };

  const highlighted = (snippet: string) => {
    const needle = submittedQuery;
    const idx = needle ? snippet.indexOf(needle) : -1;
    if (idx < 0) return <T ta size={13} muted numberOfLines={2}>{snippet}</T>;
    return (
      <T ta size={13} numberOfLines={2}>
        <T ta size={13} muted>{snippet.slice(0, idx)}</T>
        <T ta size={13} style={{ backgroundColor: c.highlight }}>{snippet.slice(idx, idx + needle.length)}</T>
        <T ta size={13} muted>{snippet.slice(idx + needle.length)}</T>
      </T>
    );
  };

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing(4), marginBottom: spacing(3) }}>
        <Ionicons name="search" size={18} color={c.textFaint} />
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => run(q)}
          returnKeyType="search"
          placeholder="தமிழில் தேடு… / Search Tamil"
          placeholderTextColor={c.textFaint}
          style={{ flex: 1, paddingVertical: spacing(3), paddingHorizontal: spacing(2), color: c.text, fontFamily: tamilFont, fontSize: 15 }}
          accessibilityLabel="Search the archive"
        />
        {q ? <Pressable onPress={() => { setQ(""); setResults(null); }} hitSlop={8}><Ionicons name="close-circle" size={18} color={c.textFaint} /></Pressable> : null}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <Pill label="All volumes" active={vol === null} onPress={() => setVol(null)} />
        {manifest?.volumes.map((v) => (
          <Pill key={v.n} label={`Vol ${v.n}`} active={vol === v.n} onPress={() => setVol(v.n)} />
        ))}
      </View>

      {results === null ? (
        <View style={{ marginTop: spacing(4) }}>
          <T faint size={12} style={{ letterSpacing: 1, marginBottom: spacing(2) }}>RECENT SEARCHES</T>
          {history.length === 0 ? (
            <T muted>Search all six volumes in Tamil. Previously searched volumes remain searchable offline.</T>
          ) : (
            history.map((h) => (
              <Pressable key={h} onPress={() => { setQ(h); run(h); }} style={{ paddingVertical: spacing(2.5) }}>
                <T ta>{h}</T>
              </Pressable>
            ))
          )}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          ListHeaderComponent={
            <View style={{ marginVertical: spacing(3) }}>
              <T faint size={12}>{loading ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"}`}</T>
              {!loading && failedVolumes > 0 ? (
                <View style={{ marginTop: spacing(2), flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                  <T size={12} style={{ color: c.accent }}>
                    {failedVolumes} volume{failedVolumes === 1 ? "" : "s"} couldn't be searched — you may be offline.{" "}
                  </T>
                  <Pressable onPress={() => run(submittedQuery)} hitSlop={8} accessibilityRole="button">
                    <T size={12} bold style={{ color: c.primary }}>Retry</T>
                  </Pressable>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            !loading && failedVolumes > 0 ? (
              <View style={{ paddingVertical: spacing(8), alignItems: "center" }}>
                <T bold size={16} style={{ textAlign: "center" }}>Couldn't search</T>
                <T muted size={13} style={{ textAlign: "center", marginTop: spacing(2) }}>
                  No search index is available offline. Reconnect and try again.
                </T>
                <Pressable onPress={() => run(submittedQuery)} accessibilityRole="button" style={{ marginTop: spacing(4), paddingHorizontal: spacing(5), paddingVertical: spacing(2.5), borderRadius: radius.pill, borderWidth: 1, borderColor: c.primary }}>
                  <T bold style={{ color: c.primary }}>Try again</T>
                </Pressable>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: c.border }} />}
          contentContainerStyle={{ paddingBottom: spacing(24) }}
          renderItem={({ item }) => (
            <Pressable onPress={() => nav.navigate("Reader", { id: item.id, find: submittedQuery })} style={{ paddingVertical: spacing(3) }}>
              <T faint size={11}>தொகுதி {item.volume}</T>
              <T ta bold size={15} style={{ marginVertical: 2 }}>{item.title}</T>
              {highlighted(item.snippet)}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
