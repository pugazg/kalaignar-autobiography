import React, { useCallback, useState } from "react";
import { Alert, Linking, Pressable, Switch, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/data/client";
import { ORIGIN } from "@/config/env";
import { useApp, useTheme } from "@/data/AppState";
import { Eyebrow, Screen, T } from "@/components/ui";
import { fontSteps, lineHeightSteps, radius, spacing } from "@/theme/theme";
import type { ThemeName } from "@/data/types";

const THEMES: { key: ThemeName; label: string }[] = [
  { key: "light", label: "Light" },
  { key: "sepia", label: "Sepia" },
  { key: "dark", label: "Dark" },
];

// Legal/support links resolve against the shared content origin (default
// nenjukkuneethi.org). These map to real public pages required for store submission.
const PRIVACY_URL = `${ORIGIN}/privacy`;
const SUPPORT_URL = `${ORIGIN}/support`;
const ABOUT_URL = `${ORIGIN}/about`;

export function SettingsScreen() {
  const { prefs, setPrefs, manifest } = useApp();
  const c = useTheme();
  const [offlineBytes, setOfflineBytes] = useState(0);
  const [clearing, setClearing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.offlineBytes().then(setOfflineBytes);
    }, []),
  );

  const appVersion = Constants.expoConfig?.version ?? "0.1.0";
  const fontSize = fontSteps[Math.min(prefs.fontStep, fontSteps.length - 1)];
  const lineMult = lineHeightSteps[Math.min(prefs.lineHeightStep, lineHeightSteps.length - 1)];

  const confirmClear = () => {
    if (!offlineBytes) return;
    Alert.alert(
      "Clear offline content?",
      "This removes all downloaded chapters and cached data. You can download them again when online.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setClearing(true);
            try {
              await api.clearOfflineContent();
              setOfflineBytes(0);
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  };

  const openLink = (url: string) =>
    Linking.openURL(url).catch(() =>
      Alert.alert("Couldn't open the link", "Please visit nenjukkuneethi.org."),
    );

  return (
    <Screen scroll>
      <Eyebrow>Settings</Eyebrow>
      <T ta bold heading size={26} style={{ marginBottom: spacing(5) }}>அமைப்புகள்</T>

      {/* ─── Appearance ─── */}
      <Section c={c} title="Appearance">
        <Row c={c} label="Follow system theme" hint="Match your device's light or dark mode.">
          <Switch
            value={prefs.followSystemTheme}
            onValueChange={(v) => setPrefs({ followSystemTheme: v })}
            trackColor={{ true: c.primary }}
            accessibilityLabel="Follow system theme"
          />
        </Row>
        {!prefs.followSystemTheme ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", paddingTop: spacing(1) }}>
            {THEMES.map((t) => {
              const active = prefs.theme === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setPrefs({ theme: t.key })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    paddingHorizontal: spacing(4),
                    paddingVertical: spacing(2.5),
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: active ? c.primary : c.border,
                    backgroundColor: active ? c.primary : "transparent",
                    marginRight: spacing(2),
                    marginBottom: spacing(2),
                  }}
                >
                  <T size={14} bold style={{ color: active ? c.primaryText : c.textMuted }}>
                    {t.label}
                  </T>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </Section>

      {/* ─── Reading ─── */}
      <Section c={c} title="Reading">
        <Row c={c} label="Text size" hint={`${fontSize}px`}>
          <Stepper
            c={c}
            onLess={() => setPrefs({ fontStep: Math.max(0, prefs.fontStep - 1) })}
            onMore={() => setPrefs({ fontStep: Math.min(fontSteps.length - 1, prefs.fontStep + 1) })}
            lessLabel="Smaller text"
            moreLabel="Larger text"
          />
        </Row>
        <Row c={c} label="Line spacing" hint={`${lineMult.toFixed(1)}×`}>
          <Stepper
            c={c}
            onLess={() => setPrefs({ lineHeightStep: Math.max(0, prefs.lineHeightStep - 1) })}
            onMore={() => setPrefs({ lineHeightStep: Math.min(lineHeightSteps.length - 1, prefs.lineHeightStep + 1) })}
            lessLabel="Tighter line spacing"
            moreLabel="Looser line spacing"
          />
        </Row>
        <Row c={c} label="English by default" hint="Open chapters in English where a translation exists." last>
          <Switch
            value={prefs.showEnglish}
            onValueChange={(v) => setPrefs({ showEnglish: v })}
            trackColor={{ true: c.primary }}
            accessibilityLabel="Show English translation by default"
          />
        </Row>
        <T ta size={fontSize} style={{ marginTop: spacing(3), lineHeight: fontSize * lineMult, color: c.textMuted }}>
          நெஞ்சுக்கு நீதி — உரை மாதிரி.
        </T>
      </Section>

      {/* ─── Storage ─── */}
      <Section c={c} title="Storage">
        <Row c={c} label="Offline content" hint={formatBytes(offlineBytes)} last>
          <Pressable
            onPress={confirmClear}
            disabled={!offlineBytes || clearing}
            accessibilityRole="button"
            accessibilityLabel="Clear offline content"
            style={{
              paddingHorizontal: spacing(3.5),
              paddingVertical: spacing(2),
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: offlineBytes ? c.border : "transparent",
              opacity: offlineBytes ? 1 : 0.4,
            }}
          >
            <T size={13} bold style={{ color: c.primary }}>{clearing ? "Clearing…" : "Clear"}</T>
          </Pressable>
        </Row>
      </Section>

      {/* ─── About & legal ─── */}
      <Section c={c} title="About">
        <LinkRow c={c} icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => openLink(PRIVACY_URL)} />
        <LinkRow c={c} icon="help-buoy-outline" label="Support" onPress={() => openLink(SUPPORT_URL)} />
        <LinkRow c={c} icon="information-circle-outline" label="About" onPress={() => openLink(ABOUT_URL)} />
        <LinkRow c={c} icon="globe-outline" label="nenjukkuneethi.org" onPress={() => openLink(ORIGIN)} last />
      </Section>

      <View style={{ marginTop: spacing(5), alignItems: "center" }}>
        <T faint size={12} style={{ textAlign: "center" }}>
          The Kalaignar Digital Library
        </T>
        <T faint size={12} style={{ textAlign: "center", marginTop: spacing(1) }}>
          App v{appVersion}
          {manifest?.contentVersion ? ` · content ${manifest.contentVersion.slice(0, 8)}` : ""}
        </T>
        <T faint size={11} style={{ textAlign: "center", marginTop: spacing(2) }}>
          Content © the estate of Kalaignar M. Karunanidhi. Source text: nenjukkuneethi.org.
        </T>
      </View>
    </Screen>
  );
}

function Section({ c, title, children }: { c: any; title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing(6) }}>
      <T faint size={12} style={{ letterSpacing: 1, marginBottom: spacing(2) }}>{title.toUpperCase()}</T>
      <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing(4) }}>
        {children}
      </View>
    </View>
  );
}

function Row({
  c,
  label,
  hint,
  last,
  children,
}: {
  c: any;
  label: string;
  hint?: string;
  last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing(3.5),
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.border,
      }}
    >
      <View style={{ flex: 1, paddingRight: spacing(3) }}>
        <T size={15}>{label}</T>
        {hint ? <T faint size={12} style={{ marginTop: 2 }}>{hint}</T> : null}
      </View>
      {children}
    </View>
  );
}

function LinkRow({
  c,
  icon,
  label,
  onPress,
  last,
}: {
  c: any;
  icon: any;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing(3.5),
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={c.primary} style={{ marginRight: spacing(3) }} />
      <T size={15} style={{ flex: 1 }}>{label}</T>
      <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
    </Pressable>
  );
}

function Stepper({
  c,
  onLess,
  onMore,
  lessLabel,
  moreLabel,
}: {
  c: any;
  onLess: () => void;
  onMore: () => void;
  lessLabel: string;
  moreLabel: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: c.border, borderRadius: radius.pill }}>
      <Pressable onPress={onLess} hitSlop={6} accessibilityLabel={lessLabel} style={{ paddingHorizontal: spacing(3.5), paddingVertical: spacing(2) }}>
        <Ionicons name="remove" size={18} color={c.textMuted} />
      </Pressable>
      <View style={{ width: 1, height: 20, backgroundColor: c.border }} />
      <Pressable onPress={onMore} hitSlop={6} accessibilityLabel={moreLabel} style={{ paddingHorizontal: spacing(3.5), paddingVertical: spacing(2) }}>
        <Ionicons name="add" size={18} color={c.textMuted} />
      </Pressable>
    </View>
  );
}

function formatBytes(n: number): string {
  if (!n) return "Nothing downloaded";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
