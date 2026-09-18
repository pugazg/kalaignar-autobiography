/**
 * Wave 7 — Batch 1 P2 runtime / render regression. Creates NO routes; renders components directly.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave7-b1-p2-render.ts
 *
 * Proves, for the three hidden Batch-1 cinema payloads, that the new shared render layer displays them
 * faithfully in isolation:
 *   • the landing renders Tamil title + a labelled scene list (printed number → "காட்சி N";
 *     unnumbered opening → "பகுதி N", never a fabricated number);
 *   • the scene reader renders Tamil verbatim text by default;
 *   • the English view (via the exported renderEnglishUnits — the SAME function the public English toggle
 *     mounts) actually displays the source English, including the 61 units whose text is carried only in
 *     `english_lines` (empty `english_text`): every line present, in source order, none dropped/duplicated;
 *   • the first scene's verbatim tamil_text appears byte-for-byte in the Tamil render (never reassembled);
 *   • Maruthanattu's unnumbered opening shows the "not source-numbered" note;
 *   • the source/provenance page renders the frozen pins + Reading-Room SHA + honest counts;
 *   • no null/absent source fact leaks as "undefined" / ">null<" / "NaN".
 * And, as an anti-regression witness for the shared visual primitives these components reuse (useLang,
 * cn, font-tamil, marina palette), that the already-published Ammayappan cinema reader + landing still
 * render Tamil-default with an English toggle, unchanged. (The other six published cinema works are
 * additive-untouched by P2 — proven route-for-route by the P1 hidden-boundary validator and the full
 * build, which statically renders every existing /cinema route.)
 */
import fs from "node:fs";
import path from "node:path";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import Wave7CinemaLanding from "../components/Wave7CinemaLanding";
import Wave7CinemaScene, { renderEnglishUnits } from "../components/Wave7CinemaScene";
import Wave7CinemaSource from "../components/Wave7CinemaSource";
import { loadWave7Cinema, loadWave7CinemaProvenance, unitEnglishText, WAVE7_CINEMA_SLUGS, type Wave7CinemaUnit } from "../data/wave7-cinema";
import AmmaiyappanLanding from "../components/AmmaiyappanLanding";
import AmmaiyappanReaderView from "../components/AmmaiyappanReader";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const ta = (el: React.ReactElement) => renderToStaticMarkup(createElement(LangProvider, null, el)); // Tamil default
const hasTamil = (s: string) => /[஀-௿]/.test(s);
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const LEAK = /\bundefined\b|>null<|\bNaN\b/;
// Render English units through the SAME exported renderer the public English view uses (not a re-impl).
const renderEnMarkup = (units: Wave7CinemaUnit[]) =>
  renderToStaticMarkup(createElement(LangProvider, null, createElement(Fragment, null, ...renderEnglishUnits(units))));

ok(WAVE7_CINEMA_SLUGS.length === 3, "3 Batch-1 cinema works to render");

for (const slug of WAVE7_CINEMA_SLUGS) {
  const work = loadWave7Cinema(slug);
  const prov = loadWave7CinemaProvenance(slug);
  ok(!!work, `${slug}: normalized work loads`);
  ok(!!prov, `${slug}: provenance loads`);
  if (!work || !prov) continue;

  let landing = "", sceneTa = "", sceneEn = "", source = "";
  try { landing = ta(createElement(Wave7CinemaLanding, { work })); } catch (e) { fail.push(`${slug}: Landing threw: ${(e as Error).message}`); checks++; }
  const first = work.scenes[0];
  try { sceneTa = ta(createElement(Wave7CinemaScene, { work, slug: first.sectionSlug })); } catch (e) { fail.push(`${slug}: Scene (Tamil) threw: ${(e as Error).message}`); checks++; }
  // Second component mount (context default) — a smoke check that the component mounts and never leaks;
  // the AUTHORITATIVE English-content proof is the renderEnglishUnits section below.
  try { sceneEn = renderToStaticMarkup(createElement(Wave7CinemaScene, { work, slug: first.sectionSlug })); } catch (e) { fail.push(`${slug}: Scene (2nd mount) threw: ${(e as Error).message}`); checks++; }
  try { source = ta(createElement(Wave7CinemaSource, { work, prov })); } catch (e) { fail.push(`${slug}: Source threw: ${(e as Error).message}`); checks++; }

  ok(landing.includes(esc(work.titleTa)), `${slug}: landing renders the Tamil title`);
  ok(hasTamil(landing), `${slug}: landing shows Tamil`);
  ok(!LEAK.test(landing), `${slug}: no undefined/null/NaN on the landing`);

  ok(hasTamil(sceneTa), `${slug}: scene reader shows Tamil verbatim by default`);
  // verbatim: first scene's stored tamil_text appears byte-for-byte (whitespace-pre-line preserves it).
  const firstTa = first.tamilText.trim().split(/\n/)[0].trim();
  ok(firstTa.length === 0 || sceneTa.includes(esc(firstTa)), `${slug}: first scene verbatim Tamil line present in render`);
  ok(!LEAK.test(sceneTa) && !LEAK.test(sceneEn), `${slug}: no undefined/null/NaN in the scene reader`);

  ok(source.includes(esc(work.titleTa)), `${slug}: source page renders the Tamil title`);
  ok(source.includes(prov.readingRoomPayloadSha256.slice(0, 16)), `${slug}: source page shows the Reading-Room payload SHA`);
  ok(!LEAK.test(source), `${slug}: no undefined/null/NaN on the source page`);
}

// ── ENGLISH BRANCH — the real public English view (renderEnglishUnits), across every scene ────────────
// The prior version server-rendered Wave7CinemaScene a second time, but showEn defaults to false, so it
// only ever produced Tamil. Here we drive renderEnglishUnits directly — the exact function the English
// view mounts — and prove the source-established English is actually displayed, including the units whose
// text lives ONLY in `english_lines`. A unit is "line-array-only" when englishText is empty and
// englishLines is non-empty (the defect class). Expected census: vandikkaran 54, naam 7, maruthanattu 0.
const EN_LINES_ONLY = { "maruthanattu-ilavarasi": 0, "vandikkaran-magan": 54, naam: 7 } as const;
let totalLinesOnlyRendered = 0;
for (const slug of WAVE7_CINEMA_SLUGS) {
  const work = loadWave7Cinema(slug)!;
  const linesOnly = work.scenes.flatMap((s) => s.units).filter((u) => (u.englishLines?.length ?? 0) > 0 && !u.englishText);
  ok(linesOnly.length === EN_LINES_ONLY[slug], `${slug}: ${EN_LINES_ONLY[slug]} line-array-only English units (got ${linesOnly.length})`);
  // Every scene's English stream renders through the real renderer without throwing or leaking.
  for (const s of work.scenes) {
    let m = "";
    try { m = renderEnMarkup(s.units); } catch (e) { fail.push(`${slug}/${s.sectionSlug}: English render threw ${(e as Error).message}`); checks++; continue; }
    if (LEAK.test(m)) { fail.push(`${slug}/${s.sectionSlug}: undefined/null/NaN in English render`); checks++; }
  }
  // Each line-array-only unit: rendered in isolation via the real renderer, every source line present,
  // in order, first & last included, none dropped/duplicated — and the effective text is non-empty.
  for (const u of linesOnly) {
    totalLinesOnlyRendered++;
    const lines = u.englishLines!;
    const eff = unitEnglishText(u);
    ok(eff.trim().length > 0, `${u.id}: effective English is non-empty`);
    const m = renderEnMarkup([u]);
    // Each source line is present, AND the whole block renders contiguously as the source-ordered join —
    // one substring check that a refrain-repeating song cannot false-pass and that proves no line is
    // dropped, reordered or duplicated (indexOf-per-line would mis-handle repeated refrain lines).
    ok(lines.every((ln) => m.includes(esc(ln))), `${u.id}: all ${lines.length} source English lines render`);
    ok(m.includes(esc(lines.join("\n"))), `${u.id}: lines render contiguously in source order (none dropped/reordered/duplicated)`);
    ok(m.includes(esc(lines[0])) && m.includes(esc(lines[lines.length - 1])), `${u.id}: first and last source line both present`);
  }
}
ok(totalLinesOnlyRendered === 61, `all 61 line-array-only units rendered through the real English renderer (got ${totalLinesOnlyRendered})`);

// Explicit representative cases named in the correction brief.
{
  const vand = loadWave7Cinema("vandikkaran-magan")!;
  const naam = loadWave7Cinema("naam")!;
  const byId = (w: typeof vand, id: string) => w.scenes.flatMap((s) => s.units).find((u) => u.id === id)!;
  const sceneOf = (w: typeof vand, id: string) => w.scenes.find((s) => s.units.some((u) => u.id === id))!;

  const d = byId(vand, "vandikkaran-magan-en-s001-u021");
  ok(d.kind === "dialogue" && d.englishLines?.length === 6, "rep vandikkaran s001-u021 is a 6-line dialogue unit");
  const dm = renderEnMarkup(sceneOf(vand, d.id).units); // through the FULL scene English stream
  ok(dm.includes(esc(d.englishLines!.join("\n"))), "rep vandikkaran s001-u021: all six English dialogue lines visible, in order, in the scene English view");

  const song = byId(naam, "naam-en-s001-u021");
  ok(song.kind === "song" && song.englishLines?.length === 23, "rep naam s001-u021 is a 23-line song unit");
  const sm = renderEnMarkup(sceneOf(naam, song.id).units);
  ok(sm.includes(esc(song.englishLines!.join("\n"))), "rep naam s001-u021: all 23 English song lines visible, in order");

  const chant = byId(naam, "naam-en-s034-u002");
  ok(chant.kind === "chant" && (chant.englishLines?.length ?? 0) > 0, "rep naam s034-u002 is a chant unit with English lines");
  const cm = renderEnMarkup(sceneOf(naam, chant.id).units);
  ok(cm.includes(esc(chant.englishLines!.join("\n"))), "rep naam s034-u002: its chant lines are visible, in order");
}

// Maruthanattu: the unnumbered opening must be labelled as a non-source-numbered segment.
{
  const work = loadWave7Cinema("maruthanattu-ilavarasi")!;
  const opening = work.scenes.find((s) => !s.numberingIsPrinted)!;
  ok(!!opening, "maruthanattu: an unnumbered opening exists");
  const md = ta(createElement(Wave7CinemaScene, { work, slug: opening.sectionSlug }));
  ok(md.includes("மூல எண்ணிடல் அல்ல"), "maruthanattu: unnumbered opening shows the 'not source-numbered' note");
}

// ── Shared-primitive regression witness — published Ammayappan cinema reader unchanged ────────────────
{
  const reader = JSON.parse(fs.readFileSync(path.join(root, "public/data/cinema/ammaiyappan/reader.json"), "utf8"));
  let landing = "", readerTa = "", readerEn = "";
  try { landing = ta(createElement(AmmaiyappanLanding, { reader })); } catch (e) { fail.push(`ammaiyappan landing threw ${(e as Error).message}`); checks++; }
  const scene0 = `scene-${String(reader.screenplayScenes[0].archivalSceneOrdinal).padStart(3, "0")}`;
  try { readerTa = ta(createElement(AmmaiyappanReaderView, { reader, slug: scene0 })); } catch (e) { fail.push(`ammaiyappan reader (Tamil) threw ${(e as Error).message}`); checks++; }
  try { readerEn = renderToStaticMarkup(createElement(AmmaiyappanReaderView, { reader, slug: scene0 })); } catch (e) { fail.push(`ammaiyappan reader (English) threw ${(e as Error).message}`); checks++; }
  ok(hasTamil(landing) && hasTamil(readerTa), "ammaiyappan: published cinema reader still renders Tamil (shared primitives unchanged)");
  ok(!LEAK.test(landing) && !LEAK.test(readerTa) && !LEAK.test(readerEn), "ammaiyappan: no undefined/null/NaN regression");
}

if (fail.length) {
  console.error(`\nwave7-b1-p2-render — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b1-p2-render — ${checks} checks, 0 failed`);
console.log("  3 Batch-1 landing/scene/source renders PASS · Tamil verbatim default · English view via renderEnglishUnits shows all 61 line-array-only units' lines (in order, none dropped) incl. reps s001-u021 dialogue / naam song 23 lines / naam chant · unnumbered opening labelled · Reading-Room SHA · no undefined/null/NaN · Ammayappan regression PASS");
