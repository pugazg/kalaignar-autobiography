#!/usr/bin/env tsx
/**
 * Export the authoritative TypeScript feature datasets to stable JSON for the
 * mobile app.
 *
 *   data/timeline.ts   → public/data/app/features/timeline.json
 *   data/governance.ts → public/data/app/features/governance.json
 *   data/people.ts     → public/data/app/features/people.json
 *   data/themes.ts     → public/data/app/features/themes.json
 *   data/quotes.ts     → public/data/app/features/quotes.json
 *
 * The website's TypeScript modules are the single source of truth. This builder
 * IMPORTS them (never re-types their content) and serialises the data verbatim,
 * preserving source order and Unicode Tamil. Each JSON mirrors the module's own
 * named exports so no data is dropped (e.g. `eras` alongside `timeline`).
 *
 * Once the files exist, `pipeline/builders/build_app_manifest.py` links them
 * through `feature_url()`; run the manifest builder AFTER this one.
 *
 * The exporter is deterministic: identical source ⇒ byte-identical output, so it
 * is safe to rerun and produces no meaningless diffs. It VALIDATES the data and
 * fails loudly (writing nothing) on any integrity or cross-reference problem
 * rather than silently emitting broken records.
 *
 * Run:  npm run build:features        (or: npx tsx pipeline/builders/export-feature-data.ts)
 */
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { eras, timeline } from "../../data/timeline";
import { govTerms, govKindLabels, governance } from "../../data/governance";
import { people } from "../../data/people";
import { themes } from "../../data/themes";
import { quotes } from "../../data/quotes";
import { places } from "../../data/places";

// Declared schematic map viewBox for place coordinates — NOT geographic (see data/places.ts).
const MAP_W = 1640;
const MAP_H = 2032;

const ROOT = path.resolve(__dirname, "..", "..");
const DATA = path.join(ROOT, "public", "data");
const OUT_DIR = path.join(DATA, "app", "features");

// ── Valid memoir chapter ids (authoritative: the volume indexes) ─────────────
function loadChapterIds(): Set<string> {
  const ids = new Set<string>();
  const files = readdirSync(DATA).filter((f) => /^volume\d+\.index\.json$/.test(f));
  if (files.length === 0) throw new Error(`No volume*.index.json found under ${DATA}`);
  for (const f of files.sort()) {
    const idx = JSON.parse(readFileSync(path.join(DATA, f), "utf-8"));
    for (const c of idx.chapters ?? []) if (c?.id) ids.add(c.id);
  }
  return ids;
}

// ── Validation ───────────────────────────────────────────────────────────────
const errors: string[] = [];
const err = (msg: string) => errors.push(msg);

function requireStr(v: unknown, where: string) {
  if (typeof v !== "string" || v.trim() === "") err(`${where}: missing/empty required string`);
}
function checkUniqueIds(items: { id: string }[], where: string) {
  const seen = new Set<string>();
  for (const it of items) {
    if (!it.id) err(`${where}: entry with empty id`);
    else if (seen.has(it.id)) err(`${where}: duplicate id "${it.id}"`);
    else seen.add(it.id);
  }
}
function checkRefs(refs: unknown, where: string, chapterIds: Set<string>) {
  if (!Array.isArray(refs) || refs.length === 0) {
    err(`${where}: refs must be a non-empty array`);
    return;
  }
  for (const r of refs) {
    if (typeof r !== "string" || !chapterIds.has(r)) err(`${where}: ref "${r}" is not a real chapter id`);
  }
}

function validate(chapterIds: Set<string>) {
  const eraIds = new Set<string>(eras.map((e) => e.id)); // `eras` is `as const` → widen
  const termIds = new Set<string>(govTerms.map((t) => t.id));
  const personIds = new Set<string>(people.map((p) => p.id));
  const govKinds = new Set<string>(Object.keys(govKindLabels));

  // timeline
  checkUniqueIds(timeline, "timeline");
  for (const m of timeline) {
    const w = `timeline[${m.id}]`;
    requireStr(m.year, `${w}.year`);
    requireStr(m.title, `${w}.title`);
    requireStr(m.summary, `${w}.summary`);
    if (!eraIds.has(m.era)) err(`${w}.era "${m.era}" is not a declared era`);
    if (m.stat) {
      requireStr(m.stat.value, `${w}.stat.value`);
      requireStr(m.stat.label, `${w}.stat.label`);
    }
    checkRefs(m.refs, w, chapterIds);
  }

  // governance
  checkUniqueIds(governance, "governance");
  for (const g of governance) {
    const w = `governance[${g.id}]`;
    if (!govKinds.has(g.kind)) err(`${w}.kind "${g.kind}" has no label in govKindLabels`);
    if (!termIds.has(g.term)) err(`${w}.term "${g.term}" is not a declared govTerm`);
    requireStr(g.year, `${w}.year`);
    requireStr(g.name?.en, `${w}.name.en`);
    requireStr(g.name?.ta, `${w}.name.ta`);
    requireStr(g.note?.en, `${w}.note.en`);
    requireStr(g.note?.ta, `${w}.note.ta`);
    checkRefs(g.refs, w, chapterIds);
  }

  // people
  checkUniqueIds(people, "people");
  for (const p of people) {
    const w = `people[${p.id}]`;
    requireStr(p.tamil, `${w}.tamil`);
    requireStr(p.name, `${w}.name`);
    requireStr(p.role, `${w}.role`);
    requireStr(p.relationship, `${w}.relationship`);
    requireStr(p.firstAppears, `${w}.firstAppears`);
    checkRefs(p.refs, w, chapterIds);
  }

  // themes
  checkUniqueIds(themes, "themes");
  for (const t of themes) {
    const w = `themes[${t.id}]`;
    requireStr(t.icon, `${w}.icon`);
    requireStr(t.tamil, `${w}.tamil`);
    requireStr(t.title, `${w}.title`);
    requireStr(t.narrative, `${w}.narrative`);
    if (!Array.isArray(t.initiatives) || t.initiatives.length === 0) err(`${w}.initiatives empty`);
    if (!Array.isArray(t.achievements) || t.achievements.length === 0) err(`${w}.achievements empty`);
    for (const s of t.stats ?? []) {
      requireStr(s.value, `${w}.stats.value`);
      requireStr(s.label, `${w}.stats.label`);
    }
    checkRefs(t.refs, w, chapterIds);
    if (t.archive) {
      for (const pid of t.archive.people ?? [])
        if (!personIds.has(pid)) err(`${w}.archive.people "${pid}" is not a known person id`);
      for (const l of t.archive.laws ?? []) {
        requireStr(l.label, `${w}.archive.laws.label`);
        if (!chapterIds.has(l.ref)) err(`${w}.archive.laws.ref "${l.ref}" is not a real chapter id`);
      }
      for (const e of t.archive.events ?? []) {
        requireStr(e.label, `${w}.archive.events.label`);
        if (!chapterIds.has(e.ref)) err(`${w}.archive.events.ref "${e.ref}" is not a real chapter id`);
      }
    }
  }

  // quotes (no id; a chapter may carry more than one quote)
  quotes.forEach((q, i) => {
    const w = `quotes[${i}]`;
    requireStr(q.tamil, `${w}.tamil`);
    requireStr(q.english, `${w}.english`);
    requireStr(q.context, `${w}.context`);
    if (!chapterIds.has(q.ref)) err(`${w}.ref "${q.ref}" is not a real chapter id`);
  });

  // places — coordinates are schematic map positions, never geographic
  checkUniqueIds(places, "places");
  for (const p of places) {
    const w = `places[${p.id}]`;
    requireStr(p.tamil, `${w}.tamil`);
    requireStr(p.name, `${w}.name`);
    requireStr(p.note, `${w}.note`);
    checkRefs(p.refs, w, chapterIds);
    if (!Number.isFinite(p.x) || p.x < 0 || p.x > MAP_W) err(`${w}.x ${p.x} outside schematic viewBox 0–${MAP_W}`);
    if (!Number.isFinite(p.y) || p.y < 0 || p.y > MAP_H) err(`${w}.y ${p.y} outside schematic viewBox 0–${MAP_H}`);
  }
}

// ── Deterministic write ──────────────────────────────────────────────────────
function writeJSON(name: string, payload: unknown) {
  const out = path.join(OUT_DIR, `${name}.json`);
  // ensure_ascii=false equivalent: JSON.stringify preserves Unicode; 2-space
  // indent for readability; trailing newline for clean diffs. Source order is
  // preserved (no sorting) — records must never be reordered.
  writeFileSync(out, JSON.stringify(payload, null, 2) + "\n", "utf-8");
  return out;
}

function main() {
  const chapterIds = loadChapterIds();
  validate(chapterIds);
  if (errors.length) {
    console.error(`✖ Feature-data validation failed with ${errors.length} issue(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error("\nNothing was written. Fix the source datasets (do not patch the JSON).");
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  // Each file mirrors its module's serialisable named exports (faithful, no drop).
  const datasets: Array<[string, unknown, number]> = [
    ["timeline", { eras, timeline }, timeline.length],
    ["governance", { govTerms, govKindLabels, governance }, governance.length],
    ["people", { people }, people.length],
    ["themes", { themes }, themes.length],
    ["quotes", { quotes }, quotes.length],
    ["places", { places }, places.length],
  ];

  for (const [name, payload, count] of datasets) {
    const out = writeJSON(name, payload);
    console.log(`  wrote ${path.relative(ROOT, out)}  (${count} records)`);
  }
  console.log(`✓ Exported ${datasets.length} feature datasets to ${path.relative(ROOT, OUT_DIR)}`);
}

main();
