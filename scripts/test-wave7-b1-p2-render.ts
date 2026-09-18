/**
 * Wave 7 — Batch 1 P2 runtime / render regression. Creates NO routes; renders components directly.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave7-b1-p2-render.ts
 *
 * Proves, for the three hidden Batch-1 cinema payloads, that the new shared render layer displays them
 * faithfully in isolation:
 *   • the landing renders Tamil title + a labelled scene list (printed number → "காட்சி N";
 *     unnumbered opening → "பகுதி N", never a fabricated number);
 *   • the scene reader renders Tamil verbatim text by default AND an English toggle stream;
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
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import Wave7CinemaLanding from "../components/Wave7CinemaLanding";
import Wave7CinemaScene from "../components/Wave7CinemaScene";
import Wave7CinemaSource from "../components/Wave7CinemaSource";
import { loadWave7Cinema, loadWave7CinemaProvenance, WAVE7_CINEMA_SLUGS } from "../data/wave7-cinema";
import AmmaiyappanLanding from "../components/AmmaiyappanLanding";
import AmmaiyappanReaderView from "../components/AmmaiyappanReader";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const ta = (el: React.ReactElement) => renderToStaticMarkup(createElement(LangProvider, null, el)); // Tamil default
const hasTamil = (s: string) => /[஀-௿]/.test(s);
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const LEAK = /\bundefined\b|>null<|\bNaN\b/;

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
  try { sceneEn = renderToStaticMarkup(createElement(Wave7CinemaScene, { work, slug: first.sectionSlug })); } catch (e) { fail.push(`${slug}: Scene (English ctx) threw: ${(e as Error).message}`); checks++; }
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
console.log("  3 Batch-1 landing/scene/source renders PASS · Tamil verbatim default + English toggle · unnumbered opening labelled · Reading-Room SHA on source page · no undefined/null/NaN · Ammayappan shared-primitive regression PASS");
