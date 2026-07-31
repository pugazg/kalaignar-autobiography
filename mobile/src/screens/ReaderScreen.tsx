import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, Share, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api } from "@/data/client";
import { storage } from "@/data/storage";
import { useApp, useTheme } from "@/data/AppState";
import { EmptyState, Loading, T } from "@/components/ui";
import { fontSteps, lineHeightSteps, radius, spacing, tamilFont } from "@/theme/theme";
import type { ChapterText, ChapterTextEn, Visual } from "@/data/types";

export function ReaderScreen() {
  const { id } = (useRoute().params ?? {}) as { id: string };
  const nav = useNavigation<any>();
  const c = useTheme();
  const { chapterById, prefs, setPrefs } = useApp();
  const found = chapterById(id);

  const [text, setText] = useState<ChapterText | null>(null);
  const [en, setEn] = useState<ChapterTextEn | null>(null);
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [error, setError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const contentH = useRef(1);
  const viewH = useRef(1);
  const restored = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showEn = prefs.showEnglish && !!en?.paragraphs?.length;
  const fontSize = fontSteps[Math.min(prefs.fontStep, fontSteps.length - 1)];
  const lineHeight = fontSize * lineHeightSteps[Math.min(prefs.lineHeightStep, lineHeightSteps.length - 1)];

  useEffect(() => {
    if (!found) return;
    let alive = true;
    setText(null);
    setError(false);
    (async () => {
      try {
        const [t, e, v] = await Promise.all([
          api.chapterText(found.chapter),
          api.chapterTextEn(found.chapter),
          api.chapterVisuals(found.chapter),
        ]);
        if (!alive) return;
        setText(t);
        setEn(e);
        setVisuals(v);
        storage.pushRecent(id);
        storage.isBookmarked(id).then(setBookmarked);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, found]);

  const toggleBookmark = useCallback(async () => {
    if (!found || !text) return;
    const on = await storage.toggleBookmark({
      chapterId: id,
      volume: found.volume.n,
      title: text.title,
      createdAt: Date.now(),
    });
    setBookmarked(on);
  }, [found, text, id]);

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: spacing(4) }}>
          <Pressable onPress={toggleBookmark} hitSlop={10} accessibilityLabel={bookmarked ? "Remove bookmark" : "Bookmark"}>
            <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={22} color={bookmarked ? c.accent : c.text} />
          </Pressable>
        </View>
      ),
    });
  }, [nav, toggleBookmark, bookmarked, c]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    contentH.current = contentSize.height;
    viewH.current = layoutMeasurement.height;
    const denom = Math.max(1, contentSize.height - layoutMeasurement.height);
    const ratio = Math.min(1, Math.max(0, contentOffset.y / denom));
    setProgress(ratio);
    if (saveTimer.current) return;
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      if (!found || !text) return;
      storage.setProgress({
        chapterId: id,
        volume: found.volume.n,
        title: text.title,
        ratio,
        paragraph: Math.round(ratio * (text.paragraphs.length - 1)),
        updatedAt: Date.now(),
      });
    }, 500);
  };

  // Restore reading position once content is measured.
  const onContentSize = async (_w: number, h: number) => {
    contentH.current = h;
    if (restored.current || !text) return;
    restored.current = true;
    const rec = await storage.getProgress(id);
    if (rec && rec.ratio > 0.02) {
      const y = rec.ratio * Math.max(1, h - viewH.current);
      setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 50);
    }
  };

  const shareParagraph = (p: string) => {
    Share.share({
      message: `${p}\n\n— ${text?.title} · நெஞ்சுக்கு நீதி\nhttps://nenjukkuneethi.org/read/${id}`,
    });
  };

  if (!found) return <T style={{ padding: spacing(6) }}>Chapter not found.</T>;
  if (error) return <EmptyState title="Could not open this chapter" body="It may not be downloaded and you appear to be offline." />;
  if (!text) return <Loading label="Opening the chapter…" />;

  const paras = showEn ? en!.paragraphs : text.paragraphs;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ height: 3, backgroundColor: c.border }}>
        <View style={{ height: 3, width: `${Math.round(progress * 100)}%`, backgroundColor: c.primary }} />
      </View>

      {/* Reading controls */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing(2), paddingHorizontal: spacing(4), paddingVertical: spacing(2), borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Ctrl icon="remove" onPress={() => setPrefs({ fontStep: Math.max(0, prefs.fontStep - 1) })} label="Smaller text" c={c} />
        <Ctrl icon="add" onPress={() => setPrefs({ fontStep: Math.min(fontSteps.length - 1, prefs.fontStep + 1) })} label="Larger text" c={c} />
        <Ctrl icon="reorder-three" onPress={() => setPrefs({ lineHeightStep: (prefs.lineHeightStep + 1) % lineHeightSteps.length })} label="Line spacing" c={c} />
        <Ctrl icon="contrast" onPress={() => setPrefs({ followSystemTheme: false, theme: prefs.theme === "light" ? "sepia" : prefs.theme === "sepia" ? "dark" : "light" })} label="Theme" c={c} />
        <View style={{ flex: 1 }} />
        {en?.paragraphs?.length ? (
          <Pressable onPress={() => setPrefs({ showEnglish: !prefs.showEnglish })} accessibilityRole="switch" accessibilityState={{ checked: showEn }}
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
        contentContainerStyle={{ padding: spacing(5), paddingBottom: spacing(24) }}
      >
        <T faint size={11} style={{ letterSpacing: 1 }}>நெஞ்சுக்கு நீதி · தொகுதி {found.volume.n}{found.chapter.startPage ? ` · பக். ${found.chapter.startPage}–${found.chapter.endPage}` : ""}</T>
        <T ta bold size={fontSize + 6} style={{ marginTop: spacing(2), marginBottom: spacing(4) }}>
          {showEn && en?.title ? en.title : text.title}
        </T>

        {!showEn && renderVisual(visuals, -1, c)}
        {paras.map((p, i) => (
          <React.Fragment key={i}>
            <Pressable onLongPress={() => shareParagraph(p)} delayLongPress={280} accessibilityHint="Long-press to share this passage">
              <T
                ta={!showEn}
                selectable
                style={{ fontSize, lineHeight, fontFamily: showEn ? undefined : tamilFont, marginBottom: spacing(4) }}
              >
                {p}
              </T>
            </Pressable>
            {!showEn && renderVisual(visuals, i, c)}
          </React.Fragment>
        ))}

        <T faint size={12} style={{ marginTop: spacing(6), fontStyle: "italic" }}>
          மூல தமிழ் உரை · nenjukkuneethi.org — corrections welcome via the site.
        </T>
      </ScrollView>
    </View>
  );
}

function Ctrl({ icon, onPress, label, c }: { icon: any; onPress: () => void; label: string; c: any }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel={label} style={{ padding: spacing(2) }}>
      <Ionicons name={icon} size={20} color={c.textMuted} />
    </Pressable>
  );
}

function renderVisual(visuals: Visual[], afterIndex: number, c: any) {
  const here = visuals.filter((v) => v.afterParagraph === afterIndex);
  if (!here.length) return null;
  return (
    <>
      {here.map((v) => (
        <Image
          key={v.src}
          source={{ uri: api.imageUrl(v.src) }}
          resizeMode="contain"
          accessibilityLabel="Chapter illustration"
          style={{ width: "100%", height: 200, marginVertical: spacing(4), tintColor: undefined }}
        />
      ))}
    </>
  );
}
