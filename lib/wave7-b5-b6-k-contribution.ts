// Wave 7 P4 (B5a / B5b / B6 / Kuraloviyam) — this batch's exact contribution to the public surface, DERIVED
// from the published records (not hand-typed literals). Earlier-wave validators that pin a live surface import
// this and ADD it to their live-total assertions (or SUBTRACT it for frozen historical snapshots) — the same
// reconciliation lib/wave7-b1-contribution.ts provides for Wave-7 B1. Single source of truth.
import { WAVE7_B5_B6_K_WORKS, WAVE7_MUTHUKKULIYAL_COLLECTIONS } from "@/data/wave7-b5-b6-k-catalogue";
import { WAVE7_SPEECH_SLUGS } from "@/lib/speeches-wave7-routes";
import kidx from "@/public/data/kuraloviyam/index.json";

const inCollection = new Set(WAVE7_MUTHUKKULIYAL_COLLECTIONS.flatMap((c) => c.members.map((m) => m.workId)));
const speeches = WAVE7_B5_B6_K_WORKS.filter((w) => w.shelf === "speeches").length; // 100
const standaloneSpeeches = WAVE7_B5_B6_K_WORKS.filter((w) => w.shelf === "speeches" && !inCollection.has(w.id)).length; // 3 (B6)
/** Mirrors INITIAL_WORKS_PER_SHELF in components/LibraryHome.tsx (module-local there). */
const DISCLOSURE_CAP = 6;
const kRoutes = 2 + (kidx as { units: unknown[] }).units.length; // landing + source + 308 units = 310

export const WAVE7_B5_B6_K_SLUGS: readonly string[] = WAVE7_B5_B6_K_WORKS.map((w) => w.id);

export const WAVE7_B5_B6_K_CONTRIBUTION = {
  /** New published works (100 speeches + Kuraloviyam). */
  works: WAVE7_B5_B6_K_WORKS.length, // 101
  speeches, // 100
  literaryCommentary: WAVE7_B5_B6_K_WORKS.filter((w) => w.shelf === "literary-commentary").length, // 1
  /** New collections (the two முத்துக் குளியல் volumes). */
  collections: WAVE7_MUTHUKKULIYAL_COLLECTIONS.length, // 2
  /** New /read discovery entries: 2 collection cards + 3 standalone assembly speeches (Speeches), + Kuraloviyam. */
  discovery: WAVE7_MUTHUKKULIYAL_COLLECTIONS.length + standaloneSpeeches + 1, // 6
  speechDiscovery: WAVE7_MUTHUKKULIYAL_COLLECTIONS.length + standaloneSpeeches, // 5
  /** Newly VISIBLE /read entries under the disclosure cap (6 per shelf): Speeches was already over the cap,
   *  so its +5 entries sit behind the disclosure; Literary Commentary grows 2→3, still under the cap: +1. */
  visible: Math.min(3, DISCLOSURE_CAP) - Math.min(2, DISCLOSURE_CAP), // 1
  /** New sitemap URLs == new prerendered routes: 2 per speech + Kuraloviyam's + 2 collection landings. */
  sitemap: WAVE7_SPEECH_SLUGS.length * 2 + kRoutes + WAVE7_MUTHUKKULIYAL_COLLECTIONS.length, // 512
  build: WAVE7_SPEECH_SLUGS.length * 2 + kRoutes + WAVE7_MUTHUKKULIYAL_COLLECTIONS.length, // 512
} as const;

/** The exact routes this batch adds (== its sitemap URLs): 2 per speech, Kuraloviyam's 310, 2 collection landings. */
export const WAVE7_B5_B6_K_ROUTES: readonly string[] = [
  ...WAVE7_SPEECH_SLUGS.flatMap((s) => [`/speeches/${s}`, `/speeches/${s}/source`]),
  "/kuraloviyam",
  "/kuraloviyam/source",
  ...(kidx as { units: { id: string }[] }).units.map((u) => `/kuraloviyam/${u.id}`),
  ...WAVE7_MUTHUKKULIYAL_COLLECTIONS.map((c) => c.href),
];
