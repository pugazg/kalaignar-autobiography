import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Bookmark, DownloadRecord, ProgressRecord, ReadingPrefs } from "./types";

// Small typed wrapper over AsyncStorage for device-local state (prefs, bookmarks,
// reading progress, recents, download registry). No historical content lives here.

const K = {
  prefs: "nn:prefs",
  bookmarks: "nn:bookmarks",
  progress: "nn:progress", // map chapterId -> ProgressRecord
  recents: "nn:recents", // array of chapterId, most-recent first
  downloads: "nn:downloads", // map chapterId -> DownloadRecord
  searchHistory: "nn:searchHistory",
  imageCache: "nn:imageCache", // map remote image src -> local file uri
};

async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
const setJSON = (key: string, v: unknown) => AsyncStorage.setItem(key, JSON.stringify(v));

export const defaultPrefs: ReadingPrefs = {
  theme: "light",
  followSystemTheme: true,
  fontStep: 1,
  lineHeightStep: 1,
  showEnglish: false,
};

export const storage = {
  // preferences
  getPrefs: () => getJSON<ReadingPrefs>(K.prefs, defaultPrefs),
  setPrefs: (p: ReadingPrefs) => setJSON(K.prefs, p),

  // bookmarks
  getBookmarks: () => getJSON<Bookmark[]>(K.bookmarks, []),
  async toggleBookmark(b: Bookmark) {
    const list = await this.getBookmarks();
    const exists = list.some((x) => x.chapterId === b.chapterId);
    const next = exists ? list.filter((x) => x.chapterId !== b.chapterId) : [b, ...list];
    await setJSON(K.bookmarks, next);
    return !exists;
  },
  async isBookmarked(id: string) {
    return (await this.getBookmarks()).some((x) => x.chapterId === id);
  },

  // reading progress
  getProgressMap: () => getJSON<Record<string, ProgressRecord>>(K.progress, {}),
  async setProgress(r: ProgressRecord) {
    const map = await this.getProgressMap();
    map[r.chapterId] = r;
    await setJSON(K.progress, map);
  },
  async getProgress(id: string) {
    return (await this.getProgressMap())[id] ?? null;
  },

  // recently read
  getRecents: () => getJSON<string[]>(K.recents, []),
  async pushRecent(id: string) {
    const list = (await this.getRecents()).filter((x) => x !== id);
    await setJSON(K.recents, [id, ...list].slice(0, 30));
  },

  // downloads registry (files themselves live in FileSystem; see client)
  getDownloads: () => getJSON<Record<string, DownloadRecord>>(K.downloads, {}),
  async setDownload(r: DownloadRecord) {
    const map = await this.getDownloads();
    map[r.chapterId] = r;
    await setJSON(K.downloads, map);
  },
  async removeDownload(id: string) {
    const map = await this.getDownloads();
    delete map[id];
    await setJSON(K.downloads, map);
  },
  async isDownloaded(id: string) {
    return !!(await this.getDownloads())[id];
  },

  // downloaded image binaries: remote src -> local file uri
  getImageCache: () => getJSON<Record<string, string>>(K.imageCache, {}),
  async setImageCacheEntry(src: string, uri: string) {
    const m = await this.getImageCache();
    m[src] = uri;
    await setJSON(K.imageCache, m);
  },
  async removeImageCacheEntry(src: string) {
    const m = await this.getImageCache();
    delete m[src];
    await setJSON(K.imageCache, m);
  },
  clearImageCache: () => AsyncStorage.removeItem(K.imageCache),

  // search history
  getSearchHistory: () => getJSON<string[]>(K.searchHistory, []),
  async pushSearch(q: string) {
    const t = q.trim();
    if (!t) return;
    const list = (await this.getSearchHistory()).filter((x) => x !== t);
    await setJSON(K.searchHistory, [t, ...list].slice(0, 20));
  },
  clearSearchHistory: () => AsyncStorage.removeItem(K.searchHistory),
};
