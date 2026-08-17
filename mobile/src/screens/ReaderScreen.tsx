import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, Share, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api } from "@/data/client";
import { storage } from "@/data/storage";
import { useApp, useTheme } from "@/data/AppState";
import { EmptyState, Loading, T } from "@/components/ui";
import { contentMaxWidth, fontSteps, lineHeightSteps, radius, spacing, tamilFont } from "@/theme/theme";
import type { ChapterText, ChapterTextEn, Visual } from "@/data/types";

export function ReaderScreen() {
  const { id, find } = (useRoute().params ?? {}) as { id: string; find?: string };
  const nav = useNavigation<any>();
  const c = useTheme();
  const { chapterById, prefs, setPrefs } = useApp();
  const found = chapterById(id);
  // `found` is a fresh wrapper object on every render, but the chapter/volume it
  // points at are stable manifest references — depend on those, never on `found`
  // itself, or effects keyed on it re-run every render (infinite reload loop).
  const chapter = found?.chapter ?? null;
  const volumeN = found?.volume.n ?? null;

  const [text, setText] = useState<ChapterText | null>(null);
  const [en, setEn] = useState<ChapterTextEn | null>(null);
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [imgCache, setImgCache] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0); // bump to retry after a failed load
  const [bookmarked, setBookmarked] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const contentH = useRef(1);
  const viewH = useRef(1);
  const restored = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search deep-link: the paragraph (in the Tamil text) that contains the query,
  // so a tapped search result scrolls to and highlights the matching passage.
  const needle = (find ?? "").trim();
  const paraY = useRef<Record<number, number>>({});
  const didFindScroll = useRef(false);

  // Resolve the matched paragraph synchronously with the text render, so it is
  // already available when paragraph onLayout callbacks and position-restore run
  // (deriving it later in an effect races those and can miss the scroll).
  const findIndex = useMemo(() => {
    if (!text || needle.length < 2) return null;
    const i = text.paragraphs.findIndex((p) => p.includes(needle));
    return i >= 0 ? i : null;
  }, [text, needle]);

  const showEn = prefs.showEnglish && !!en?.paragraphs?.length;
  const fontSize = fontSteps[Math.min(prefs.fontStep, fontSteps.length - 1)];
  const lineHeight = fontSize * lineHeightSteps[Math.min(prefs.lineHeightStep, lineHeightSteps.length - 1)];
  // Search-match behaviour only applies to the Tamil text (the query is Tamil).
  const findTarget = showEn ? null : findIndex;

  useEffect(() => {
    if (!chapter) return;
    let alive = true;
    setText(null);
    setError(false);
    paraY.current = {}; // chapter text changes → measured positions are stale
    restored.current = false;
    (async () => {
      try {
        const [t, e, v] = await Promise.all([
          api.chapterText(chapter),
          api.chapterTextEn(chapter),
          api.chapterVisuals(chapter),
        ]);
        if (!alive) return;
        setText(t);
        setEn(e);
        setVisuals(v);
        storage.getImageCache().then((m) => alive && setImgCache(m));
        storage.pushRecent(id);
        storage.isBookmarked(id).then(setBookmarked);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, chapter, nonce]);

  // Re-arm the find scroll whenever the chapter or the query changes, so a new
  // search targeting another passage in the same chapter scrolls again.
  useEffect(() => {
    didFindScroll.current = false;
  }, [id, needle]);

  // If the matched paragraph has already been measured, scroll to it now;
  // otherwise its onLayout callback will perform the scroll when it lands.
  useEffect(() => {
    if (findTarget == null || didFindScroll.current) return;
    const y = paraY.current[findTarget];
    if (y != null) {
      didFindScroll.current = true;
      setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing(6)), animated: true }), 60);
    }
  }, [findTarget]);

  const toggleBookmark = useCallback(async () => {
    if (volumeN == null || !text) return;
    const on = await storage.toggleBookmark({
      chapterId: id,
      volume: volumeN,
      title: text.title,
      createdAt: Date.now(),
    });
    setBookmarked(on);
  }, [volumeN, text, id]);

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: spacing(4) }}>
          <Pressable onPress={toggleBookmark} hitSlop={12} accessibilityRole="button" accessibilityLabel={bookmarked ? "Remove bookmark" : "Bookmark"}>
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

  // Restore reading position once content is measured. When arriving from a
  // search result (findIndex set), the paragraph's own onLayout drives the
  // scroll instead — don't also restore the saved position.
  const onContentSize = async (_w: number, h: number) => {
    contentH.current = h;
    if (restored.current || !text) return;
    restored.current = true;
    if (findTarget != null) return;
    const rec = await storage.getProgress(id);
    if (rec && rec.ratio > 0.02) {
      const y = rec.ratio * Math.max(1, h - viewH.current);
      setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 50);
    }
  };

  // Scroll to the matched paragraph as soon as its position is known.
  const onParaLayout = (i: number, y: number) => {
    paraY.current[i] = y;
    if (findTarget === i && !didFindScroll.current) {
      didFindScroll.current = true;
      setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing(6)), animated: true }), 60);
    }
  };

  const shareParagraph = (p: string) => {
    Share.share({
      message: `${p}\n\n— ${text?.title} · நெஞ்சுக்கு நீதி\nhttps://nenjukkuneethi.org/read/${id}`,
    });
  };

  if (!found) return <T style={{ padding: spacing(6) }}>Chapter not found.</T>;
  if (error) return <EmptyState title="Could not open this chapter" body="It may not be downloaded and you appear to be offline." actionLabel="Try again" onAction={() => setNonce((n) => n + 1)} />;
  if (!text) return <Loading label="Opening the chapter…" />;

  const paras = showEn ? en!.paragraphs : text.paragraphs;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ height: 3, backgroundColor: c.border }}>
        <View style={{ height: 3, width: `${Math.round(progress * 100)}%`, backgroundColor: c.primary }} />
      </View>

      {/* Reading controls */}
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
        <T faint size={11} style={{ letterSpacing: 1 }}>நெஞ்சுக்கு நீதி · தொகுதி {found.volume.n}{found.chapter.startPage ? ` · பக். ${found.chapter.startPage}–${found.chapter.endPage}` : ""}</T>
        <T ta bold heading size={fontSize + 6} style={{ marginTop: spacing(2), marginBottom: spacing(4) }}>
          {showEn && en?.title ? en.title : text.title}
        </T>

        {!showEn && renderVisual(visuals, -1, c, imgCache)}
        {paras.map((p, i) => (
          <React.Fragment key={i}>
            <Pressable
              onLongPress={() => shareParagraph(p)}
              delayLongPress={280}
              accessibilityHint="Long-press to share this passage"
              onLayout={(e) => onParaLayout(i, e.nativeEvent.layout.y)}
            >
              <T
                ta={!showEn}
                selectable
                style={{ fontSize, lineHeight, fontFamily: showEn ? undefined : tamilFont, marginBottom: spacing(4) }}
              >
                {findTarget === i ? highlightMatch(p, needle, c) : p}
              </T>
            </Pressable>
            {!showEn && renderVisual(visuals, i, c, imgCache)}
          </React.Fragment>
        ))}

        <T faint size={12} style={{ marginTop: spacing(6), fontStyle: "italic" }}>
          மூல தமிழ் உரை · nenjukkuneethi.org — corrections welcome via the site.
        </T>
      </ScrollView>
    </View>
  );
}

/** Wrap every occurrence of `needle` in the paragraph with a highlight span. */
function highlightMatch(p: string, needle: string, c: any): React.ReactNode {
  if (needle.length < 2) return p;
  const parts: React.ReactNode[] = [];
  let from = 0;
  let at = p.indexOf(needle);
  let key = 0;
  while (at >= 0) {
    if (at > from) parts.push(p.slice(from, at));
    parts.push(
      <T key={`h${key++}`} style={{ backgroundColor: c.highlight }}>
        {p.slice(at, at + needle.length)}
      </T>,
    );
    from = at + needle.length;
    at = p.indexOf(needle, from);
  }
  if (from < p.length) parts.push(p.slice(from));
  return parts;
}

function Ctrl({ icon, onPress, label, c }: { icon: any; onPress: () => void; label: string; c: any }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label} style={{ padding: spacing(2) }}>
      <Ionicons name={icon} size={20} color={c.textMuted} />
    </Pressable>
  );
}

function renderVisual(visuals: Visual[], afterIndex: number, c: any, imgCache: Record<string, string>) {
  const here = visuals.filter((v) => v.afterParagraph === afterIndex);
  if (!here.length) return null;
  return (
    <>
      {here.map((v) => (
        <Image
          key={v.src}
          // Prefer the offline copy when this image has been downloaded.
          source={{ uri: imgCache[v.src] ?? api.imageUrl(v.src) }}
          resizeMode="contain"
          accessibilityLabel="Chapter illustration"
          style={{ width: "100%", height: 200, marginVertical: spacing(4), tintColor: undefined }}
        />
      ))}
    </>
  );
}
