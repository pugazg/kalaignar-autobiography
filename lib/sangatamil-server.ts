// Wave 8 (P3, hidden) — server-side access to சங்கத் தமிழ் for the /sangatamil route family. SERVER-ONLY.
//
// The work is built once per process from the hidden P1 data by the P2 reader model; nothing is vended under
// public/data. Route modules pass only the P2 public projections (lib/wave8-public-provenance.ts) to client components.
// The route family is direct-but-undiscovered at P3: no catalogue entry, no /read shelf, no sitemap entry.
import { toSangatamilWork, type SangatamilWork } from "@/lib/wave8-sangatamil-reader";

let cached: SangatamilWork | null = null;
export const loadSangatamil = (): SangatamilWork => (cached ??= toSangatamilWork());

/** The 104 section slugs, in the book's own order (front matter, 102 sections, back cover). */
export const sangatamilSectionSlugs = (): string[] => loadSangatamil().sections.map((s) => s.slug);
