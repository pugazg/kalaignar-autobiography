import React, { useCallback, useEffect } from "react";
import { View } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme, type Theme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  NotoSerifTamil_500Medium,
  NotoSerifTamil_600SemiBold,
} from "@expo-google-fonts/noto-serif-tamil";
import { AppStateProvider, useTheme } from "@/data/AppState";
import { NetworkProvider } from "@/data/network";
import { OfflineBanner } from "@/components/OfflineBanner";
import { RootNavigator, linking } from "@/navigation";
import type { Palette } from "@/theme/theme";

// Keep the native splash up until the Tamil serif fonts are ready — the memoir's
// body type must never flash a fallback.
SplashScreen.preventAutoHideAsync().catch(() => {});

/** Map our palette onto a React Navigation theme (container/header defaults). */
function navTheme(c: Palette): Theme {
  const base = c.statusBar === "light" ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: c.statusBar === "light",
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.bg,
      card: c.bg,
      text: c.text,
      border: c.border,
      notification: c.accent,
    },
  };
}

function Root() {
  const c = useTheme();
  return (
    <NavigationContainer theme={navTheme(c)} linking={linking}>
      <StatusBar style={c.statusBar} />
      <RootNavigator />
    </NavigationContainer>
  );
}

// App frame: the global offline strip sits above the navigator (see OfflineBanner).
function AppFrame() {
  const c = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <OfflineBanner />
      <View style={{ flex: 1 }}>
        <Root />
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    NotoSerifTamil_500Medium,
    NotoSerifTamil_600SemiBold,
  });

  const onLayoutRoot = useCallback(async () => {
    if (fontsLoaded || fontError) await SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // Safety net: never leave the splash up forever if font loading stalls.
  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!fontsLoaded && !fontError) return null; // splash remains visible

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRoot}>
        <AppStateProvider>
          <NetworkProvider>
            <AppFrame />
          </NetworkProvider>
        </AppStateProvider>
      </View>
    </SafeAreaProvider>
  );
}
