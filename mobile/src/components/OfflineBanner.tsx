import React, { useEffect, useRef } from "react";
import { AccessibilityInfo, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/data/AppState";
import { useNetworkStatus } from "@/data/network";
import { spacing } from "@/theme/theme";
import { T } from "./ui";

// Truthful wording: downloaded/cached content still works offline, but not everything
// is available — never imply the whole archive is offline-readable.
const OFFLINE_MESSAGE = "Offline — downloaded & cached content is available";

/**
 * A subtle global status strip shown only when the device is *known* offline.
 * Rendered once at the app root, above the navigator: on iOS the native header's
 * safe-area inset is position-aware, so pushing the navigator down does not create a
 * gap. Hidden (renders nothing) while online or during the initial "unknown" state,
 * so it never shifts layout except when genuinely offline.
 */
export function OfflineBanner() {
  const status = useNetworkStatus();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const announced = useRef(false);

  const offline = status === "offline";

  useEffect(() => {
    // Announce the offline transition to VoiceOver once — not on every rerender.
    if (offline && !announced.current) {
      announced.current = true;
      AccessibilityInfo.announceForAccessibility(OFFLINE_MESSAGE);
    }
    if (!offline) announced.current = false;
  }, [offline]);

  if (!offline) return null;

  // Keep the safe-area / status-bar zone in the theme background so the OS clock and
  // icons stay readable; the strip itself sits just below. High-contrast in every
  // theme: strip background = the theme's text colour, strip text = the background
  // colour (the same ratio as body text, ≥ AA in light / sepia / dark).
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: c.bg }}>
      <View
        accessible
        accessibilityRole={Platform.OS === "android" ? "alert" : undefined}
        accessibilityLiveRegion="polite"
        accessibilityLabel={OFFLINE_MESSAGE}
        style={{ backgroundColor: c.text }}
      >
        <T
          style={{
            color: c.bg,
            textAlign: "center",
            fontWeight: "600",
            fontSize: 12.5,
            paddingHorizontal: spacing(4),
            paddingVertical: spacing(1.5),
          }}
        >
          {OFFLINE_MESSAGE}
        </T>
      </View>
    </View>
  );
}
