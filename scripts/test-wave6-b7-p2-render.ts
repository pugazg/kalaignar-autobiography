/**
 * Wave 6 — Batch 7 P2 runtime/render regression. Creates NO routes; renders the components directly.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave6-b7-p2-render.ts
 *
 * Proves, for all 116 hidden Batch-7 payloads, that:
 *   • the story reader renders in isolation with Tamil as default and an English toggle available;
 *   • the Batch-7 provenance page (StorySourceB7) renders in isolation;
 *   • no null/absent source fact leaks as "undefined" / "null" / "NaN" / fabricated prose;
 *   • no archival evidence apparatus appears in the READER (literary) surface.
 * And, as an anti-regression, that the 38 already-published stories (kizhavan-kanavu + the 37 1977
 * anthology stories) still render through the LEGACY StoryReader + StorySource unchanged.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import StoryReader from "../components/StoryReader";
import StorySource from "../components/StorySource";
import StorySourceB7 from "../components/StorySourceB7";
import { STORY_SLUGS } from "../data/stories";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const load = (slug: string, file: string) => JSON.parse(fs.readFileSync(path.join(root, "public/data/stories", slug, file), "utf8"));
const ta = (el: React.ReactElement) => renderToStaticMarkup(createElement(LangProvider, null, el)); // Tamil default
const en = (el: React.ReactElement) => renderToStaticMarkup(el); // context default (English)
const hasTamil = (s: string) => /[஀-௿]/.test(s);
// React escapes text nodes; match its escaping so a title with & ' " < > is found in the markup.
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const LEAK = /&gt;\s*(Source-layout note|Historical-glyph gate)|VERIFIED \/ FINAL SOURCE-VISUAL|Stage \d+ (visual|historical|final)|\bundefined\b|>null<|\bNaN\b/;

const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave6/b7-short-stories.json"), "utf8"));
const b7: string[] = manifest.groups.flatMap((g: { slugs: { slug: string }[] }) => g.slugs.map((s) => s.slug));
ok(b7.length === 116, "116 Batch-7 works to render");

for (const slug of b7) {
  const story = load(slug, "story.json");
  const prov = load(slug, "provenance.json");
  ok(prov.batch === 7, `${slug}: provenance is the batch-7 variant`);
  let readerTa = "", readerEn = "", source = "";
  try { readerTa = ta(createElement(StoryReader, { story })); } catch (e) { fail.push(`${slug}: StoryReader (Tamil) threw: ${(e as Error).message}`); checks++; }
  try { readerEn = en(createElement(StoryReader, { story })); } catch (e) { fail.push(`${slug}: StoryReader (English) threw: ${(e as Error).message}`); checks++; }
  try { source = ta(createElement(StorySourceB7, { slug, prov })); } catch (e) { fail.push(`${slug}: StorySourceB7 threw: ${(e as Error).message}`); checks++; }
  ok(hasTamil(readerTa), `${slug}: reader shows Tamil literary text by default`);
  ok(readerEn.includes(esc(story.title.en)), `${slug}: reader English toggle renders the English title`);
  ok(!LEAK.test(readerTa) && !LEAK.test(readerEn), `${slug}: no apparatus / undefined / null / NaN in the reader`);
  ok(source.includes(esc(story.title.ta)), `${slug}: provenance page renders the printed Tamil title`);
  ok(!LEAK.test(source), `${slug}: no undefined / null / NaN leaked into the provenance page`);
}

// ── Old 38 regression — legacy components unchanged ─────────────────────────────────────────────────
// At P4 the 116 Batch-7 slugs were promoted INTO STORY_SLUGS, so the legacy set is STORY_SLUGS minus the
// Batch-7 slugs (a Batch-7 provenance is `batch: 7` and renders through StorySourceB7, never the legacy
// StorySource — the route dispatches on that discriminator). Filtering keeps this the original 38.
const b7set = new Set<string>(b7);
const legacySlugs = (STORY_SLUGS as readonly string[]).filter((s) => !b7set.has(s));
let regressed = 0;
for (const slug of legacySlugs) {
  try {
    const story = load(slug, "story.json");
    const prov = load(slug, "provenance.json");
    const r = ta(createElement(StoryReader, { story }));
    const s = ta(createElement(StorySource, { slug, prov }));
    if (!hasTamil(r)) { fail.push(`legacy ${slug}: reader lost Tamil`); regressed++; }
    if (/\bundefined\b|>null</.test(r) || /\bundefined\b|>null</.test(s)) { fail.push(`legacy ${slug}: undefined/null leaked`); regressed++; }
  } catch (e) { fail.push(`legacy ${slug}: render threw ${(e as Error).message}`); regressed++; }
  checks++;
}
ok(legacySlugs.length === 38, `exactly 38 legacy stories remain after removing the 116 Batch-7 slugs (got ${legacySlugs.length})`);
ok(regressed === 0, `all ${legacySlugs.length} legacy stories still render (0 regressions)`);

if (fail.length) {
  console.error(`\nwave6-b7-p2-render — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave6-b7-p2-render — ${checks} checks, 0 failed`);
console.log(`  116 Batch-7 reader + provenance render checks PASS · ${legacySlugs.length} legacy stories regression PASS · Tamil default · English toggle · no apparatus/undefined/null in UI`);
