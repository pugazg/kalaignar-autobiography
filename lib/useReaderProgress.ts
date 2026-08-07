"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shared reading-progress behaviour for every Reading Room reader (memoir,
 * Murasoli letters + page scans, Tholkappiya Poonga). Keeps the four readers
 * consistent instead of each re-implementing scroll tracking slightly
 * differently. Handles, all keyed off localStorage so it is per-device:
 *
 *   - scroll-through progress (0–100), surfaced as `progress`
 *   - reading-position restore (fraction of document height) on load
 *   - "mark as read" — auto once scrolled ~95% through, plus a manual toggle
 *   - recording the id as the collection's "last read" (for Continue reading)
 *
 * `ready` gates the position restore until the text has actually rendered, so
 * the saved fraction maps onto the real document height.
 *
 * Omit `readKey` for surfaces that should track scroll + position but NOT
 * participate in mark-as-read / the collection shelf (e.g. per-page scans):
 * `isRead` stays false and `toggleRead` is a no-op.
 */
export function useReaderProgress(opts: {
  id: string;
  ready: boolean;
  posPrefix: string;
  readKey?: string;
  lastKey?: string;
}) {
  const { id, ready, readKey, posPrefix, lastKey } = opts;
  const [progress, setProgress] = useState(0);
  const [isRead, setIsRead] = useState(false);
  const restored = useRef(false);

  // Read-state on arrival + record as the collection's last-read.
  useEffect(() => {
    setProgress(0);
    restored.current = false;
    try {
      if (readKey) {
        const read: string[] = JSON.parse(localStorage.getItem(readKey) || "[]");
        setIsRead(read.includes(id));
      }
      if (lastKey) localStorage.setItem(lastKey, id);
    } catch {}
  }, [id, readKey, lastKey]);

  // Restore the saved scroll fraction once the content is on the page.
  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    try {
      const pos = localStorage.getItem(`${posPrefix}${id}`);
      if (pos) window.scrollTo({ top: Number(pos) * document.body.scrollHeight });
    } catch {}
  }, [ready, id, posPrefix]);

  // Throttled scroll: save position, surface progress, auto-mark read at ~95%.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (t) return;
      t = setTimeout(() => {
        t = null;
        try {
          localStorage.setItem(
            `${posPrefix}${id}`,
            String(window.scrollY / Math.max(1, document.body.scrollHeight)),
          );
          const denom = Math.max(1, document.body.scrollHeight - window.innerHeight);
          const pct = Math.min(100, Math.round((window.scrollY / denom) * 100));
          setProgress(pct);
          if (readKey && pct >= 95) {
            const read: string[] = JSON.parse(localStorage.getItem(readKey) || "[]");
            if (!read.includes(id)) {
              localStorage.setItem(readKey, JSON.stringify([...read, id]));
              setIsRead(true);
            }
          }
        } catch {}
      }, 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [id, readKey, posPrefix]);

  const toggleRead = () => {
    if (!readKey) return;
    try {
      const read: string[] = JSON.parse(localStorage.getItem(readKey) || "[]");
      const nextRead = isRead ? read.filter((r) => r !== id) : [...read, id];
      localStorage.setItem(readKey, JSON.stringify(nextRead));
      setIsRead(!isRead);
    } catch {}
  };

  return { progress, isRead, toggleRead };
}
