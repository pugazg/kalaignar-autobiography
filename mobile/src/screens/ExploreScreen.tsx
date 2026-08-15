import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useApp, useTheme } from "@/data/AppState";
import { Card, EmptyState, Eyebrow, Loading, Screen, T } from "@/components/ui";
import { radius, spacing } from "@/theme/theme";

// Thematic front door to the archive. Every card is a real destination — the
// native volumes / timeline / search / saved screens, plus the Murasoli letters
// collection, now read natively (Library → Volume → Letter/Scan → Reader).
export function ExploreScreen() {
  const { status, manifest, reload } = useApp();
  const nav = useNavigation<any>();
  const c = useTheme();

  if (status === "loading") return <Screen><Loading label="Loading…" /></Screen>;
  if (!manifest)
    return (
      <Screen>
        <EmptyState title="Couldn't load the archive" body="Check your connection." actionLabel="Try again" onAction={reload} />
      </Screen>
    );

  const chapters = manifest.volumes.reduce((n, v) => n + v.chapterCount, 0);
  const pages = manifest.volumes.reduce((n, v) => n + (v.pages ?? 0), 0);
  const letters = manifest.murasoli?.totalLetters ?? 0;
  const years = spanYears(manifest.volumes.map((v) => v.period));

  return (
    <Screen scroll>
      <Eyebrow>Explore</Eyebrow>
      <T ta bold size={26} style={{ marginBottom: spacing(2) }}>ஆய்வு</T>
      <T muted style={{ marginBottom: spacing(5) }}>
        Ways into {manifest.work.titleEn} — read by volume, follow the timeline, or search every page.
      </T>

      {/* Primary destinations */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing(3) }}>
        <BigTile c={c} icon="library-outline" title="Volumes" sub={`${manifest.volumes.length} volumes · ${chapters} chapters`} onPress={() => nav.navigate("Tabs", { screen: "Library" })} />
        <BigTile c={c} icon="time-outline" title="Timeline" sub="1924 – 2005" onPress={() => nav.navigate("Timeline")} />
        <BigTile c={c} icon="search-outline" title="Search" sub="Every page, in Tamil" onPress={() => nav.navigate("Tabs", { screen: "Search" })} />
        <BigTile c={c} icon="bookmark-outline" title="Saved" sub="Bookmarks & offline" onPress={() => nav.navigate("Saved")} />
      </View>

      {/* Collections */}
      <T faint size={12} style={{ letterSpacing: 1, marginTop: spacing(6), marginBottom: spacing(2) }}>COLLECTIONS</T>
      {letters ? (
        <Card onPress={() => nav.navigate("MurasoliLibrary")}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="mail-outline" size={24} color={c.primary} style={{ marginRight: spacing(3) }} />
            <View style={{ flex: 1 }}>
              <T ta bold size={17}>முரசொலி — உடன்பிறப்புகளுக்கு</T>
              <T muted size={13} style={{ marginTop: 2 }}>
                {letters} letters
                {manifest.murasoli?.volumeCount ? ` · ${manifest.murasoli.volumeCount} volumes` : ""}
              </T>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
          </View>
        </Card>
      ) : null}

      {/* By the numbers */}
      <T faint size={12} style={{ letterSpacing: 1, marginTop: spacing(6), marginBottom: spacing(2) }}>BY THE NUMBERS</T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing(3) }}>
        <Stat c={c} value={String(manifest.volumes.length)} label="volumes" />
        <Stat c={c} value={String(chapters)} label="chapters" />
        {pages ? <Stat c={c} value={pages.toLocaleString()} label="pages" /> : null}
        {years ? <Stat c={c} value={String(years)} label="years covered" /> : null}
        {letters ? <Stat c={c} value={String(letters)} label="Murasoli letters" /> : null}
      </View>
    </Screen>
  );
}

function BigTile({ c, icon, title, sub, onPress }: { c: any; icon: any; title: string; sub: string; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={{ width: "47%", alignItems: "flex-start" }}>
      <Ionicons name={icon} size={26} color={c.primary} />
      <T bold size={16} style={{ marginTop: spacing(2) }}>{title}</T>
      <T faint size={12} style={{ marginTop: 2 }}>{sub}</T>
    </Card>
  );
}

function Stat({ c, value, label }: { c: any; value: string; label: string }) {
  return (
    <View
      style={{
        width: "47%",
        backgroundColor: c.surfaceAlt,
        borderRadius: radius.lg,
        paddingVertical: spacing(4),
        paddingHorizontal: spacing(4),
      }}
    >
      <T bold size={24} style={{ color: c.primary }}>{value}</T>
      <T muted size={12} style={{ marginTop: 2 }}>{label}</T>
    </View>
  );
}

function spanYears(periods: (string | null)[]): number {
  const years = periods
    .flatMap((p) => (p ? p.match(/\d{4}/g) ?? [] : []))
    .map((y) => parseInt(y, 10));
  if (!years.length) return 0;
  return Math.max(...years) - Math.min(...years);
}
