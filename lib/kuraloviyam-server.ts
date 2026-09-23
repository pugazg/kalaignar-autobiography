// Server-only loaders for குறளோவியம் reader data (build time, from public/data/kuraloviyam). Kept apart from
// data/kuraloviyam.ts so client components can import its types and label helper without bundling `fs`.
import fs from "node:fs";
import path from "node:path";
import type { KuraloviyamIndex, KuraloviyamProvenance, KuraloviyamUnit } from "@/data/kuraloviyam";

const DIR = path.join(process.cwd(), "public/data/kuraloviyam");

export function loadKuraloviyamIndex(): KuraloviyamIndex | null {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, "index.json"), "utf-8")); } catch { return null; }
}
export function loadKuraloviyamUnit(id: string): KuraloviyamUnit | null {
  if (!/^(front-0[1-7]|entry-\d{3}|back-matter)$/.test(id)) return null;
  try { return JSON.parse(fs.readFileSync(path.join(DIR, "units", `${id}.json`), "utf-8")); } catch { return null; }
}
export function loadKuraloviyamProvenance(): KuraloviyamProvenance | null {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, "provenance.json"), "utf-8")); } catch { return null; }
}

/** The route registry: every reading-unit id, in reading order. Driven by the vendored index, never the filesystem. */
export function kuraloviyamUnitIds(): string[] {
  return loadKuraloviyamIndex()?.units.map((u) => u.id) ?? [];
}

