import * as FileSystem from "expo-file-system";
import { MANIFEST_PATH, url } from "@/config/env";
import { storage } from "./storage";
import type {
  AppManifest,
  ChapterEntry,
  ChapterText,
  ChapterTextEn,
  DownloadRecord,
  FullTextEntry,
  Visual,
} from "./types";

// Content client. Network is the source of truth; every fetched document is
// cached to the app's document directory so downloaded/read content works offline.
// Reads prefer a permanently "downloaded" copy, then the runtime cache, then network.

const DIR = FileSystem.documentDirectory + "content/";
const ensureDir = async () => {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
};
const fileFor = (path: string) => DIR + path.replace(/[^a-z0-9]+/gi, "_") + ".json";

async function readCache<T>(path: string): Promise<T | null> {
  try {
    const f = fileFor(path);
    const info = await FileSystem.getInfoAsync(f);
    if (!info.exists) return null;
    return JSON.parse(await FileSystem.readAsStringAsync(f)) as T;
  } catch {
    return null;
  }
}
async function writeCache(path: string, raw: string) {
  await ensureDir();
  await FileSystem.writeAsStringAsync(fileFor(path), raw);
}

/** Fetch JSON. offlineFirst: return cached copy immediately if present, else network. */
export async function fetchJSON<T>(path: string, opts: { offlineFirst?: boolean } = {}): Promise<T> {
  if (opts.offlineFirst) {
    const cached = await readCache<T>(path);
    if (cached) return cached;
  }
  try {
    const res = await fetch(url(path), { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.text();
    await writeCache(path, raw);
    return JSON.parse(raw) as T;
  } catch (e) {
    const cached = await readCache<T>(path);
    if (cached) return cached; // offline fallback
    throw e;
  }
}

export const api = {
  manifest: () => fetchJSON<AppManifest>(MANIFEST_PATH),

  chapterText: (c: ChapterEntry) => fetchJSON<ChapterText>(c.textUrl, { offlineFirst: true }),
  chapterTextEn: (c: ChapterEntry) =>
    c.textEnUrl ? fetchJSON<ChapterTextEn>(c.textEnUrl, { offlineFirst: true }) : Promise.resolve(null),
  chapterVisuals: (c: ChapterEntry) =>
    c.visualsUrl ? fetchJSON<Visual[]>(c.visualsUrl, { offlineFirst: true }).catch(() => []) : Promise.resolve([]),

  searchIndex: (volumeSearchUrl: string) => fetchJSON<FullTextEntry[]>(volumeSearchUrl, { offlineFirst: true }),

  /** Persist a chapter (text + English + visuals) for offline reading. */
  async downloadChapter(c: ChapterEntry, volume: number): Promise<DownloadRecord> {
    const text = await fetchJSON<ChapterText>(c.textUrl); // writes cache
    let hasEnglish = false;
    if (c.textEnUrl) {
      try {
        await fetchJSON<ChapterTextEn>(c.textEnUrl);
        hasEnglish = true;
      } catch {}
    }
    if (c.visualsUrl) {
      try {
        await fetchJSON<Visual[]>(c.visualsUrl);
      } catch {}
    }
    const bytes = JSON.stringify(text).length;
    const rec: DownloadRecord = {
      chapterId: c.id,
      volume,
      bytes,
      downloadedAt: Date.now(),
      hasEnglish,
    };
    await storage.setDownload(rec);
    return rec;
  },

  async removeChapterDownload(c: ChapterEntry) {
    for (const p of [c.textUrl, c.textEnUrl, c.visualsUrl]) {
      if (!p) continue;
      try {
        await FileSystem.deleteAsync(fileFor(p), { idempotent: true });
      } catch {}
    }
    await storage.removeDownload(c.id);
  },

  /**
   * Bytes currently held on disk for downloaded chapters. Sums the download
   * registry (an exact figure the Settings screen can show without walking the
   * whole cache directory).
   */
  async offlineBytes(): Promise<number> {
    const map = await storage.getDownloads();
    return Object.values(map).reduce((n, d) => n + (d.bytes || 0), 0);
  },

  /**
   * Wipe every cached document (downloaded chapters + the runtime fetch cache)
   * and clear the download registry. The manifest re-fetches on next launch.
   */
  async clearOfflineContent(): Promise<void> {
    try {
      await FileSystem.deleteAsync(DIR, { idempotent: true });
    } catch {}
    const map = await storage.getDownloads();
    await Promise.all(Object.keys(map).map((id) => storage.removeDownload(id)));
  },

  imageUrl: (src: string) => url(src),
};
