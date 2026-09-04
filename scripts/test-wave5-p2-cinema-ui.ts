/**
 * Wave 5 P2 — Manthiri Kumari + Raja Rani public reader/route regression (RENDER level).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave5-p2-cinema-ui.ts
 *
 * Renders the real P2 components against the frozen P1 reader.json and proves the route registries and
 * the source-semantic safeguards. It does NOT re-read the source archive — it consumes the approved
 * frozen data, the same contract the readers consume.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import ManthiriKumariLanding from "../components/ManthiriKumariLanding";
import ManthiriKumariReader from "../components/ManthiriKumariReader";
import ManthiriKumariSource from "../components/ManthiriKumariSource";
import RajaRaniLanding from "../components/RajaRaniLanding";
import RajaRaniReaderView from "../components/RajaRaniReader";
import RajaRaniSource from "../components/RajaRaniSource";
import type { ManthiriReader } from "../data/manthiri-kumari";
import type { RajaRaniReader } from "../data/raja-rani";

let checks = 0;
const failures: string[] = [];
const ok = (cond: boolean, label: string) => { checks++; if (!cond) failures.push(label); };
const eq = <T,>(a: T, b: T, label: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${label}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };

const load = (slug: string, file: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/cinema", slug, file), "utf-8"));
const ta = (el: React.ReactElement) => renderToStaticMarkup(createElement(LangProvider, null, el)); // Tamil default
const strip = (s: string) => s.replace(/<[^>]+>/g, "");

const M: ManthiriReader = load("manthiri-kumari", "reader.json");
const MP = load("manthiri-kumari", "provenance.json");
const R: RajaRaniReader = load("raja-rani", "reader.json");
const RP = load("raja-rani", "provenance.json");

// ── MANTHIRI ───────────────────────────────────────────────────────────────────
{
  const landing = ta(createElement(ManthiriKumariLanding, { reader: M }));
  ok(landing.includes(M.work.titleTa) && landing.includes(M.work.titleEn), "manthiri landing renders titles");
  ok(landing.includes("/cinema/manthiri-kumari/story-summary"), "manthiri landing links the story summary");
  for (const p of M.performances) ok(landing.includes(`/cinema/manthiri-kumari/performance-${String(p.sourceOrder).padStart(2, "0")}`), `manthiri landing links performance ${p.sourceOrder}`);
  ok(landing.includes("களஞ்சிய வழிசெலுத்தல்"), "manthiri landing marks performance order as archive navigation");
  ok(!/scene/i.test(strip(landing)), "manthiri landing uses no 'scene' wording");

  // Story summary: 13 units.
  const ss = ta(createElement(ManthiriKumariReader, { reader: M, slug: "story-summary" }));
  eq(M.storySummary.units.length, 13, "manthiri story summary has 13 units (data)");
  ok(M.storySummary.units.every((u) => ss.includes(strip(u.tamil).slice(0, 20)) || ss.includes(u.tamil)), "manthiri story summary renders its Tamil units");

  // All 15 performances resolve & render, each with the unresolved-authorship note; none claims a scene number.
  for (const p of M.performances) {
    const slug = `performance-${String(p.sourceOrder).padStart(2, "0")}`;
    const h = ta(createElement(ManthiriKumariReader, { reader: M, slug }));
    ok(h.includes(p.headingTa), `manthiri ${slug} renders its heading`);
    ok(h.includes("களஞ்சிய வரிசை"), `manthiri ${slug} labels its ordinal as archive navigation`);
    ok(h.includes("தனிப் பாடலாசிரியரை உறுதிப்படுத்தவில்லை"), `manthiri ${slug} shows the unresolved-lyricist note`);
    ok(!/பாடலாசிரியர்:\s*மு\.?\s*கருணாநிதி|Lyrics by/i.test(strip(h)), `manthiri ${slug} makes no Kalaignar lyric claim`);
  }
  eq(M.performances.filter((p) => p.authorshipStatus === "unresolved").length, 15, "manthiri: 15 unresolved lyricists (data)");
  eq(M.performances.filter((p) => p.crossWitnessStatus === "confirmed-existing-anthology-witness").length, 1, "manthiri: exactly one confirmed witness (data)");

  // Performance 13: printed compound heading distinct from the internal turn labels.
  const p13 = M.performances.find((p) => p.sourceOrder === 13)!;
  const h13 = ta(createElement(ManthiriKumariReader, { reader: M, slug: "performance-13" }));
  ok(p13.headingTa === "பார்த்திபன்—மந்திரிகுமாரி", "manthiri perf-13 heading is the compound form (data)");
  const labels = new Set(p13.sections.map((s) => s.sourceLabel));
  ok(labels.has("பார்த்திபன்") && labels.has("அமுதவல்லி"), "manthiri perf-13 keeps distinct internal labels (data)");
  ok(Array.from(labels).every((l) => l !== "பார்த்திபன்—மந்திரிகுமாரி"), "manthiri perf-13 labels are not collapsed into the heading");
  ok(h13.includes("பார்த்திபன்—மந்திரிகுமாரி") && h13.includes(">அமுதவல்லி<"), "manthiri perf-13 renders heading AND the distinct அமுதவல்லி label");

  // Source page: frozen identity.
  const src = ta(createElement(ManthiriKumariSource, { reader: M, prov: MP }));
  ok(src.includes(MP.pdf.sha256) && src.includes("TVA_BOK_0026144"), "manthiri source shows frozen scan identity");
  ok(src.includes(MP.sourceCommit) && src.includes(MP.workTree), "manthiri source shows the frozen pins");
  ok(src.includes(M.work.storyDialogueCreditAsPrinted), "manthiri source shows the printed credit");
  ok(!/\b(19|20)\d\d\b/.test(strip(src).replace(/SHA-256|256/g, "")), "manthiri source asserts no publication year");
}

// ── RAJA RANI ───────────────────────────────────────────────────────────────────
{
  const landing = ta(createElement(RajaRaniLanding, { reader: R }));
  ok(landing.includes(R.work.titleTa) && landing.includes(R.work.titleEn), "raja landing renders titles");
  for (const s of R.numberedSongs) ok(landing.includes(`/cinema/raja-rani/song-${String(s.numberedSongNumber).padStart(2, "0")}`), `raja landing links song ${s.numberedSongNumber}`);
  for (const sc of R.screenplayScenes) ok(landing.includes(`/cinema/raja-rani/scene-${String(sc.archivalSceneOrdinal).padStart(3, "0")}`), `raja landing links scene ${sc.archivalSceneOrdinal}`);
  ok(landing.includes("களஞ்சியப் பகுதி"), "raja landing labels segments as archive segments");
  ok(!/scene\s*\d+\s*as printed|source scene/i.test(strip(landing)), "raja landing makes no source-scene-number claim");

  // All 58 scenes resolve & render; none claims a source scene number; deleted ids and stamp absent.
  const deleted = ["s055-d026", "s055-d027", "s055-d028", "s055-d029", "s055-d030"];
  for (const sc of R.screenplayScenes) {
    const slug = `scene-${String(sc.archivalSceneOrdinal).padStart(3, "0")}`;
    const h = ta(createElement(RajaRaniReaderView, { reader: R, slug }));
    ok(h.includes(`களஞ்சியப் பகுதி ${sc.archivalSceneOrdinal}`), `raja ${slug} renders archive-segment heading`);
    ok(!/scene\s*\d+\s*as printed|source scene\s*\d+/i.test(strip(h)), `raja ${slug} makes no source-scene claim`);
    ok(!h.includes("K. N. சங்கரன்"), `raja ${slug} excludes the PDF-74 ownership stamp`);
    ok(deleted.every((d) => !h.includes(d)), `raja ${slug} contains no deleted T055 id`);
  }
  eq(R.screenplayScenes.length, 58, "raja: 58 archival scenes (data)");
  eq(R.counts.sourceNumberedScenes, 0, "raja: 0 source-numbered scenes (data)");

  // All 11 songs resolve & render with source numbering and correct authorship tier.
  for (const s of R.numberedSongs) {
    const slug = `song-${String(s.numberedSongNumber).padStart(2, "0")}`;
    const h = ta(createElement(RajaRaniReaderView, { reader: R, slug }));
    ok(h.includes(`பாட்டு ${s.numberedSongNumber}`), `raja ${slug} renders source song number ${s.numberedSongNumber}`);
    if (s.authorshipStatus === "anthology-attributed") ok(h.includes("பிற்கால தொகுப்புச் சான்றின்படி"), `raja ${slug} shows anthology-attributed wording`);
    else ok(h.includes("தனி நிலைப் பாடலாசிரியர் நிறுவப்படவில்லை"), `raja ${slug} shows unresolved-lyricist wording`);
  }
  eq(R.numberedSongs.filter((s) => s.authorshipStatus === "anthology-attributed").length, 5, "raja: 5 anthology-attributed songs (data)");
  eq(R.numberedSongs.filter((s) => s.authorshipStatus === "unresolved").length, 6, "raja: 6 unresolved songs (data)");

  // scene-58/song-11 review relation not upgraded (data-level contract retained by P1 provenance).
  eq(R.counts.songPerformanceLinksReview, 1, "raja: exactly one review-level song-performance link (data)");
  eq(R.counts.songPerformanceLinksVerified, 3, "raja: three verified song-performance links (data)");
  const s11 = R.numberedSongs.find((s) => s.numberedSongNumber === 11)!;
  ok(s11.performanceLinks.some((pl) => pl.status === "review" && (pl as { scene?: number }).scene === 58), "raja: song-11 keeps its review link to scene 58");
  ok(RP.structuralExceptions.some((e: { id: string }) => e.id === "scene-58-song-11-review-level"), "raja: provenance records the review relation");

  // Source page: frozen identity + exclusions.
  const src = ta(createElement(RajaRaniSource, { reader: R, prov: RP }));
  ok(src.includes(RP.pdf.sha256) && src.includes("TVA_BOK_0017188"), "raja source shows frozen scan identity");
  ok(src.includes(RP.sourceCommit) && src.includes(RP.workTree), "raja source shows the frozen pins");
  ok(!src.includes("K. N. சங்கரன்") === true, "raja source names the stamp only as excluded, never as text"); // page mentions exclusion generically
}

if (failures.length) {
  console.error(`\nwave5-p2-cinema-ui — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  x " + f);
  process.exit(1);
}
console.log(`\nwave5-p2-cinema-ui — ${checks} checks, 0 failed`);
console.log("  Manthiri 18 routes (summary+15 perf) · Raja 71 routes (58 scenes+11 songs) · archival-vs-source numbering · unresolved authorship · perf-13 labels distinct · scene58/song11 review · no deleted ids / stamp");
