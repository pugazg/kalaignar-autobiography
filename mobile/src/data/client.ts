// SDK 54 redesigned expo-file-system to a File/Directory class API; the classic
// functional API (documentDirectory, getInfoAsync, downloadAsync, …) is preserved
// under /legacy. Kept as-is here to hold Increment-1 offline behaviour identical;
// migrating to the new API is a separate future task.
import * as FileSystem from "expo-file-system/legacy";
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
const IMG_DIR = DIR + "img/";
const ensureDir = async () => {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
};
const ensureImgDir = async () => {
  const info = await FileSystem.getInfoAsync(IMG_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(IMG_DIR, { intermediates: true });
};
const fileFor = (path: string) => DIR + path.replace(/[^a-z0-9]+/gi, "_") + ".json";
/** Local path for a cached image binary, keeping the original file extension. */
const imageFileFor = (src: string) => {
  const ext = src.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
  const base = src.slice(0, src.length - ext.length).replace(/[^a-z0-9]+/gi, "_");
  return IMG_DIR + base + ext;
};

const fileSize = async (uri: string): Promise<number> => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && !info.isDirectory ? info.size ?? 0 : 0;
  } catch {
    return 0;
  }
};

/** Download one image binary for offline use; returns its size in bytes (0 on failure). */
async function downloadImage(src: string): Promise<number> {
  await ensureImgDir();
  const dest = imageFileFor(src);
  const existing = await FileSystem.getInfoAsync(dest);
  if (existing.exists) {
    await storage.setImageCacheEntry(src, dest);
    return existing.size ?? 0;
  }
  const res = await FileSystem.downloadAsync(url(src), dest);
  if (res.status !== 200) {
    try { await FileSystem.deleteAsync(dest, { idempotent: true }); } catch {}
    throw new Error(`image HTTP ${res.status}`);
  }
  await storage.setImageCacheEntry(src, dest);
  return fileSize(dest);
}

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

  /** Persist a chapter (text + English + visuals + image binaries) for offline reading. */
  async downloadChapter(c: ChapterEntry, volume: number): Promise<DownloadRecord> {
    await fetchJSON<ChapterText>(c.textUrl); // writes cache
    let hasEnglish = false;
    if (c.textEnUrl) {
      try {
        await fetchJSON<ChapterTextEn>(c.textEnUrl);
        hasEnglish = true;
      } catch {}
    }
    let visuals: Visual[] = [];
    if (c.visualsUrl) {
      try {
        visuals = await fetchJSON<Visual[]>(c.visualsUrl);
      } catch {}
    }
    // Download the actual illustration/photo binaries so the chapter renders
    // offline — not just its text and placement metadata.
    let bytes = 0;
    for (const v of visuals) {
      try {
        bytes += await downloadImage(v.src);
      } catch {}
    }
    // Accurate footprint: on-disk size of every JSON we cached + image bytes.
    for (const p of [c.textUrl, c.textEnUrl, c.visualsUrl]) {
      if (p) bytes += await fileSize(fileFor(p));
    }
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
    // Remove downloaded image binaries first (need the visuals list from cache).
    if (c.visualsUrl) {
      const visuals = await readCache<Visual[]>(c.visualsUrl);
      for (const v of visuals ?? []) {
        try { await FileSystem.deleteAsync(imageFileFor(v.src), { idempotent: true }); } catch {}
        await storage.removeImageCacheEntry(v.src);
      }
    }
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
      await FileSystem.deleteAsync(DIR, { idempotent: true }); // wipes JSON + img/ binaries
    } catch {}
    const map = await storage.getDownloads();
    await Promise.all(Object.keys(map).map((id) => storage.removeDownload(id)));
    await storage.clearImageCache();
  },

  imageUrl: (src: string) => url(src),
};
