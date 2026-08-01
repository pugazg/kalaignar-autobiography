import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/data/AppState";
import { radius, spacing, tamilFont, tamilFontBold } from "@/theme/theme";

export function Screen({ children, scroll = false, style }: ViewProps & { scroll?: boolean }) {
  const c = useTheme();
  const inner = <View style={[{ flex: 1, padding: spacing(4) }, style]}>{children}</View>;
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: c.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(20) }}>
          {children}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

/** Tamil-optimized text. `ta` uses Noto Serif Tamil; latin/UI text stays system. */
export function T({ ta, bold, muted, faint, size, style, children, ...rest }: TextProps & {
  ta?: boolean;
  bold?: boolean;
  muted?: boolean;
  faint?: boolean;
  size?: number;
}) {
  const c = useTheme();
  const color = faint ? c.textFaint : muted ? c.textMuted : c.text;
  return (
    <Text
      allowFontScaling // respects OS dynamic type
      style={[
        { color, fontSize: size ?? 16 },
        ta && { fontFamily: bold ? tamilFontBold : tamilFont, lineHeight: (size ?? 16) * 1.6 },
        !ta && bold && { fontWeight: "700" },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function Card({ children, onPress, style }: ViewProps & { onPress?: () => void }) {
  const c = useTheme();
  // The card's own look. Layout styles passed via `style` (e.g. width) must land
  // on the OUTERMOST element so the card is sized correctly as a flex item —
  // when pressable that element is the Pressable, not an inner View.
  const cardStyle = {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing(4),
  };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [cardStyle, style, pressed && { opacity: 0.85 }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[cardStyle, style]}>{children}</View>;
}

export function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        paddingHorizontal: spacing(3.5),
        paddingVertical: spacing(1.5),
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: active ? c.primary : c.border,
        backgroundColor: active ? c.primary : "transparent",
        marginRight: spacing(2),
        marginBottom: spacing(2),
      }}
    >
      <Text style={{ color: active ? c.primaryText : c.textMuted, fontSize: 13, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return (
    <Text style={{ color: c.accent, fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", marginBottom: spacing(2) }}>
      {children}
    </Text>
  );
}

export function Loading({ label }: { label?: string }) {
  const c = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={c.primary} />
      {label ? <T muted style={{ marginTop: spacing(3) }}>{label}</T> : null}
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.center}>
      <T bold size={17} style={{ textAlign: "center" }}>{title}</T>
      {body ? <T muted style={{ textAlign: "center", marginTop: spacing(2) }}>{body}</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing(8) },
});
