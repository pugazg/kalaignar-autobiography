import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { LinkingOptions, NavigatorScreenParams } from "@react-navigation/native";
import { Pressable } from "react-native";
import { useTheme } from "@/data/AppState";
import { HomeScreen } from "@/screens/HomeScreen";
import { LibraryScreen } from "@/screens/LibraryScreen";
import { VolumeScreen } from "@/screens/VolumeScreen";
import { ReaderScreen } from "@/screens/ReaderScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { ExploreScreen } from "@/screens/ExploreScreen";
import { TimelineScreen } from "@/screens/TimelineScreen";
import { SavedScreen } from "@/screens/SavedScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";

// Native destinations (spec: Home, Library, Timeline, Explore, Search, Saved, Settings).
// Mobile redesign: five bottom tabs; Timeline, Saved and Settings are first-class
// stack screens reached from Home / Explore / headers rather than crammed into the bar.
export type TabParamList = {
  Home: undefined;
  Library: undefined;
  Search: undefined;
  Explore: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Volume: { n: number };
  Reader: { id: string; find?: string };
  Timeline: undefined;
  Saved: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function HeaderGear({ onPress }: { onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityLabel="Settings" hitSlop={12} style={{ paddingHorizontal: 4 }}>
      <Ionicons name="settings-outline" size={22} color={c.text} />
    </Pressable>
  );
}

function Tabs() {
  const c = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { color: c.text },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textFaint,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="cog-outline" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const c = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { color: c.text },
        headerTintColor: c.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.bg },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Volume" component={VolumeScreen} options={{ title: "Volume" }} />
      <Stack.Screen name="Reader" component={ReaderScreen} options={{ title: "", headerBackTitle: "Back" }} />
      <Stack.Screen name="Timeline" component={TimelineScreen} options={{ title: "Timeline" }} />
      <Stack.Screen name="Saved" component={SavedScreen} options={{ title: "Saved" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </Stack.Navigator>
  );
}

// Universal / app links: nenjukkuneethi.org/read/<id> → Reader.
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["nenjukkuneethi://", "https://nenjukkuneethi.org"],
  config: {
    screens: {
      Tabs: {
        screens: { Home: "", Library: "read", Search: "search", Explore: "explore", Settings: "settings" },
      },
      Reader: "read/:id",
      Volume: "volume/:n",
    },
  },
};
