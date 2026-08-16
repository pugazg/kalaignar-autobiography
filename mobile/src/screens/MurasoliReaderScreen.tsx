import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Share, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api } from "@/data/client";
import { storage } from "@/data/storage";
import { useApp, useTheme } from "@/data/AppState";
import { EmptyState, Loading, T } from "@/components/ui";
import { contentMaxWidth, fontSteps, lineHeightSteps, radius, spacing, tamilFont } from "@/theme/theme";
import type { MurasoliLetter, MurasoliLetterEn } from "@/data/types";
import { formatDate } from "./MurasoliVolumeScreen";

// Native Murasoli letter reader. Reuses the memoir reader's controls and shared
// reading prefs (font / line-height / theme / show-English). Reading position is
// stored under a SEPARATE Murasoli key so memoir progress is never touched.
// No bookmarks yet — the Saved model is memoir-specific (see DATA_CONTRACTS).
export function MurasoliReaderScreen() {
  const { id } = useRoute().params as { id: string };
  const nav = useNavigation<any>();
  const c = useTheme();
  const { manifest, prefs, setPrefs } = useApp();
  const mu = manifest?.murasoli ?? null;

  const [letter, setLetter] = useState<MurasoliLetter | null>(null);
  const [en, setEn] = useState<MurasoliLetterEn | null>(null);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const viewH = useRef(1);
  const restored = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showEn = prefs.showEnglish && !!en?.paragraphs?.length;
  const fontSize = fontSteps[Math.min(prefs.fontStep, fontSteps.length - 1)];
  const lineHeight = fontSize * lineHeightSteps[Math.min(prefs.lineHeightStep, lineHeightSteps.length - 1)];

  useEffect(() => {
    if (!mu) {
      setError(true);
      return;
    }
    let alive = true;
    setLetter(null);
    setEn(null);
    setError(false);
    restored.current = false;
    (async () => {
      try {
        const [l, e] = await Promise.all([
          api.murasoliLetter(mu.letterUrlTemplate, id),
          api.murasoliLetterEn(mu.letterEnUrlTemplate, id),
        ]);
        if (!alive) return;
        if (!l || !Array.isArray(l.paragraphs)) {
          setError(true);
          return;
        }
        setLetter(l);
        setEn(e && Array.isArray(e.paragraphs) ? e : null);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, mu]);

  useLayoutEffect(() => {
    nav.setOptions({ title: letter ? `#${letter.number}` : "" });
  }, [nav, letter]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    viewH.current = layoutMeasurement.height;
    const denom = Math.max(1, contentSize.height - layoutMeasurement.height);
    const ratio = Math.min(1, Math.max(0, contentOffset.y / denom));
    setProgress(ratio);
    if (saveTimer.current) return;
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      storage.setMurasoliProgress(id, ratio);
    }, 500);
  };

  const onContentSize = async (_w: number, h: number) => {
    if (restored.current || !letter) return;
    restored.current = true;
    const rec = await storage.getMurasoliProgress(id);
    if (rec && rec.ratio > 0.02) {
      const y = rec.ratio * Math.max(1, h - viewH.current);
      setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 50);
    }
  };

  const shareParagraph = (p: string) => {
    Share.share({
      message: `${p}\n\n— முரசொலி · ${letter?.title?.ta ?? ""}\nhttps://nenjukkuneethi.org/murasoli/${id}`,
    });
  };

  if (error) return <EmptyState title="Could not open this letter" body="It may not be downloaded and you appear to be offline." />;
  if (!letter) return <Loading label="Opening the letter…" />;

  const title = showEn ? en?.title || letter.title?.en || `Letter ${letter.number}` : letter.title?.ta || `கடிதம் ${letter.number}`;
  const salutation = showEn ? en?.salutation : letter.salutation;
  const paras = showEn ? en!.paragraphs : letter.paragraphs;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ height: 3, backgroundColor: c.border }}>
        <View style={{ height: 3, width: `${Math.round(progress * 100)}%`, backgroundColor: c.primary }} />
      </View>

      {/* Reading controls (shared prefs, memoir-consistent) */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing(2), paddingHorizontal: spacing(4), paddingVertical: spacing(2), borderBottomWidth: 1, borderBottomColor: c.border, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}>
        <Ctrl icon="remove" onPress={() => setPrefs({ fontStep: Math.max(0, prefs.fontStep - 1) })} label="Smaller text" c={c} />
        <Ctrl icon="add" onPress={() => setPrefs({ fontStep: Math.min(fontSteps.length - 1, prefs.fontStep + 1) })} label="Larger text" c={c} />
        <Ctrl icon="reorder-three" onPress={() => setPrefs({ lineHeightStep: (prefs.lineHeightStep + 1) % lineHeightSteps.length })} label="Line spacing" c={c} />
        <Ctrl icon="contrast" onPress={() => setPrefs({ followSystemTheme: false, theme: prefs.theme === "light" ? "sepia" : prefs.theme === "sepia" ? "dark" : "light" })} label="Theme" c={c} />
        <View style={{ flex: 1 }} />
        {en?.paragraphs?.length ? (
          <Pressable onPress={() => setPrefs({ showEnglish: !prefs.showEnglish })} accessibilityRole="switch" accessibilityLabel="Show English translation" accessibilityState={{ checked: showEn }}
            style={{ paddingHorizontal: spacing(3), paddingVertical: spacing(1.5), borderRadius: radius.pill, borderWidth: 1, borderColor: c.primary, backgroundColor: showEn ? c.primary : "transparent" }}>
            <T size={12} bold style={{ color: showEn ? c.primaryText : c.primary }}>{showEn ? "EN" : "தமிழ்"}</T>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={onContentSize}
        contentContainerStyle={{ padding: spacing(5), paddingBottom: spacing(24), width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}
      >
        <T faint size={11} style={{ letterSpacing: 1 }}>
          முரசொலி · தொகுதி {letter.volume} · #{letter.number}{letter.date ? ` · ${formatDate(letter.date)}` : ""}
        </T>
        <T ta={!showEn} bold heading size={fontSize + 5} style={{ marginTop: spacing(2), marginBottom: spacing(3), fontFamily: showEn ? undefined : tamilFont }}>
          {title}
        </T>

        {/* Translator's note — editorial, clearly separated from Kalaignar's words */}
        {showEn && en?.translatorNote ? (
          <View style={{ borderLeftWidth: 3, borderLeftColor: c.accent, paddingLeft: spacing(3), marginBottom: spacing(4) }}>
            <T faint size={11} bold style={{ letterSpacing: 1, marginBottom: 2 }}>TRANSLATOR'S NOTE</T>
            <T muted size={13} style={{ fontStyle: "italic" }}>{en.translatorNote}</T>
          </View>
        ) : null}

        {salutation ? (
          <T ta={!showEn} size={fontSize} style={{ marginBottom: spacing(3), fontFamily: showEn ? undefined : tamilFont, color: c.textMuted }}>
            {salutation}
          </T>
        ) : null}

        {paras.map((p, i) => (
          <Pressable key={i} onLongPress={() => shareParagraph(p)} delayLongPress={280} accessibilityHint="Long-press to share this passage">
            <T ta={!showEn} selectable style={{ fontSize, lineHeight, fontFamily: showEn ? undefined : tamilFont, marginBottom: spacing(4) }}>
              {p}
            </T>
          </Pressable>
        ))}

        {showEn && en?.provenance?.status ? (
          <T faint size={12} style={{ marginTop: spacing(4), fontStyle: "italic" }}>
            English translation · {en.provenance.status}
            {en.provenance.source ? ` · ${en.provenance.source}` : ""}
          </T>
        ) : (
          <T faint size={12} style={{ marginTop: spacing(6), fontStyle: "italic" }}>
            மூல தமிழ் உரை · nenjukkuneethi.org
          </T>
        )}
      </ScrollView>
    </View>
  );
}

function Ctrl({ icon, onPress, label, c }: { icon: any; onPress: () => void; label: string; c: any }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label} style={{ padding: spacing(2) }}>
      <Ionicons name={icon} size={20} color={c.textMuted} />
    </Pressable>
  );
}
