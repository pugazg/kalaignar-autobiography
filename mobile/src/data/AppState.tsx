import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import { api } from "./client";
import { defaultPrefs, storage } from "./storage";
import { palettes, type Palette } from "@/theme/theme";
import type { AppManifest, ChapterEntry, ReadingPrefs, ThemeName, VolumeEntry } from "./types";

type Status = "loading" | "ready" | "error";

interface AppStateValue {
  status: Status;
  error?: string;
  manifest: AppManifest | null;
  prefs: ReadingPrefs;
  palette: Palette;
  reload: () => Promise<void>;
  setPrefs: (patch: Partial<ReadingPrefs>) => void;
  volumeByN: (n: number) => VolumeEntry | undefined;
  chapterById: (id: string) => { chapter: ChapterEntry; volume: VolumeEntry } | undefined;
}

const Ctx = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string>();
  const [manifest, setManifest] = useState<AppManifest | null>(null);
  const [prefs, setPrefsState] = useState<ReadingPrefs>(defaultPrefs);
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme());

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [m, p] = await Promise.all([api.manifest(), storage.getPrefs()]);
      setManifest(m);
      setPrefsState(p);
      setStatus("ready");
    } catch (e: any) {
      setError(e?.message ?? "Could not load the library.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, [load]);

  const setPrefs = useCallback((patch: Partial<ReadingPrefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      storage.setPrefs(next);
      return next;
    });
  }, []);

  const activeTheme: ThemeName = prefs.followSystemTheme
    ? systemScheme === "dark"
      ? "dark"
      : "light"
    : prefs.theme;

  const value = useMemo<AppStateValue>(
    () => ({
      status,
      error,
      manifest,
      prefs,
      palette: palettes[activeTheme],
      reload: load,
      setPrefs,
      volumeByN: (n) => manifest?.volumes.find((v) => v.n === n),
      chapterById: (id) => {
        if (!manifest) return undefined;
        for (const volume of manifest.volumes) {
          const chapter = volume.chapters.find((c) => c.id === id);
          if (chapter) return { chapter, volume };
        }
        return undefined;
      },
    }),
    [status, error, manifest, prefs, activeTheme, load, setPrefs],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppStateProvider");
  return v;
}

export const useTheme = () => useApp().palette;
