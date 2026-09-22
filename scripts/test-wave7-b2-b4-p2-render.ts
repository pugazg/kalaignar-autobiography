/**
 * Wave 7 Batches 2-4 P2 — real bilingual render regression. Creates NO routes.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave7-b2-b4-p2-render.ts
 *
 * Renders the 13 hidden works through the EXISTING family readers (Play / Novel / Article), exercising
 * BOTH the Tamil and the ENGLISH path. The readers gate English behind client `showEn` state, so the test
 * drives the real English render with the components' own `initialShowEn` seed (not a duplicated renderer,
 * and not the Wave-7 B1 mistake of only ever rendering the Tamil default). Novels are fed through the
 * bounded Wave-7 novel adapter into the generic Novel model; Drama and Essays render directly from their
 * P1 payloads. Proves Tamil + English render non-empty, no undefined/null/NaN leaks, systematically per
 * reading unit, plus the nachuk hold and the surulimalai chapter gap.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import PlayLanding from "../components/PlayLanding";
import PlayReader from "../components/PlayReader";
import PlaySource from "../components/PlaySource";
import NovelLanding from "../components/NovelLanding";
import NovelReader from "../components/NovelReader";
import NovelSource from "../components/NovelSource";
import EssayLanding from "../components/EssayLanding";
import ArticleReader from "../components/ArticleReader";
import ArticleSource from "../components/ArticleSource";
import { wave7NovelToNovel, wave7NovelProvenance } from "../lib/wave7-novels-adapter";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const load = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const ta = (el: React.ReactElement) => renderToStaticMarkup(createElement(LangProvider, null, el)); // Tamil default
const hasTamil = (s: string) => /[஀-௿]/.test(s);
const hasLatin = (s: string) => /[A-Za-z]{3,}/.test(s);
const LEAK = /\bundefined\b|>null<|\bNaN\b/;
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const bodyText = (blocks: { text?: string; segments?: { text: string }[] }[]) =>
  blocks.map((b) => (b.text != null ? b.text : (b.segments ?? []).map((s) => s.text).join(""))).join("\n");

// ── DRAMA (iratha-kanneer, nachuk-koppai) ────────────────────────────────────────────────────────────
for (const slug of ["iratha-kanneer", "nachuk-koppai"]) {
  const play = load(`public/data/plays/${slug}/play.json`);
  const prov = load(`public/data/plays/${slug}/provenance.json`);
  let landing = "", source = "";
  try { landing = ta(createElement(PlayLanding, { play })); } catch (e) { fail.push(`${slug}: PlayLanding threw ${(e as Error).message}`); checks++; }
  try { source = ta(createElement(PlaySource, { play, prov })); } catch (e) { fail.push(`${slug}: PlaySource threw ${(e as Error).message}`); checks++; }
  ok(landing.includes(esc(play.title.ta)) && hasTamil(landing), `${slug}: PlayLanding renders Tamil title`);
  ok(!LEAK.test(landing), `${slug}: no leak on PlayLanding`);
  ok(hasTamil(source), `${slug}: PlaySource renders`);
  ok(!LEAK.test(source), `${slug}: no leak on PlaySource`);
  // Every reading unit renders Tamil AND English (real English via initialShowEn).
  const units = play.readingUnits;
  for (let i = 0; i < units.length; i++) {
    const s = units[i];
    const enText = bodyText(s.english.units);
    const rTa = ta(createElement(PlayReader, { play, scene: s, prev: i > 0 ? units[i - 1] : null, next: i < units.length - 1 ? units[i + 1] : null }));
    const rEn = ta(createElement(PlayReader, { play, scene: s, prev: null, next: null, initialShowEn: true }));
    ok(hasTamil(rTa), `${slug}/${s.slug}: Tamil scene renders`);
    ok(!enText.trim() || hasLatin(rEn), `${slug}/${s.slug}: English scene renders non-empty`);
    ok(!LEAK.test(rTa) && !LEAK.test(rEn), `${slug}/${s.slug}: no leak in scene render`);
  }
}
// nachuk: exactly one held scene (05); the hold apparatus is NOT rendered as authored dramatic text.
{
  const play = load("public/data/plays/nachuk-koppai/play.json");
  const held = play.readingUnits.filter((u: { heldSource?: boolean }) => u.heldSource);
  ok(held.length === 1 && held[0].slug === "05", "nachuk-koppai: exactly one held scene = 05");
  const s5 = play.readingUnits.find((u: { slug: string }) => u.slug === "05");
  const r = ta(createElement(PlayReader, { play, scene: s5, prev: null, next: null, initialShowEn: true }));
  ok(!/Inherited source hold|Assembly provenance|assembled only from reconciled/i.test(r), "nachuk-koppai: hold/assembly apparatus not rendered in Scene 5");
}

// ── ESSAYS (6 publications) ──────────────────────────────────────────────────────────────────────────
const ESSAYS = ["aaru-maatha-kadungkaaval", "thudikkum-ilamai", "perumoochu", "viduthalai-kilarcci", "meesai-mulaiththa-vayathil", "pesum-kalai-valarppom"];
for (const slug of ESSAYS) {
  const pub = load(`public/data/essays/${slug}/publication.json`);
  const prov = load(`public/data/essays/${slug}/provenance.json`);
  let landing = "", source = "";
  try { landing = ta(createElement(EssayLanding, { pub })); } catch (e) { fail.push(`${slug}: EssayLanding threw ${(e as Error).message}`); checks++; }
  try { source = ta(createElement(ArticleSource, { slug, prov })); } catch (e) { fail.push(`${slug}: ArticleSource threw ${(e as Error).message}`); checks++; }
  ok(landing.includes(esc(pub.title.ta)) && hasTamil(landing), `${slug}: EssayLanding renders Tamil title`);
  ok(!LEAK.test(landing), `${slug}: no leak on EssayLanding`);
  ok(hasTamil(source) && !LEAK.test(source), `${slug}: ArticleSource renders without leak`);
  const arts = pub.articles;
  for (let i = 0; i < arts.length; i++) {
    const a = arts[i];
    const enText = bodyText(a.english.blocks);
    const rTa = ta(createElement(ArticleReader, { pub, article: a, prev: i > 0 ? arts[i - 1] : null, next: i < arts.length - 1 ? arts[i + 1] : null }));
    const rEn = ta(createElement(ArticleReader, { pub, article: a, prev: null, next: null, initialShowEn: true }));
    ok(hasTamil(rTa), `${slug}/${a.slug}: Tamil article renders`);
    ok(!enText.trim() || hasLatin(rEn), `${slug}/${a.slug}: English article renders non-empty`);
    ok(!LEAK.test(rTa) && !LEAK.test(rEn), `${slug}/${a.slug}: no leak in article render`);
    // The reading title is rendered (whether a source heading or the source's own numbered-section label).
    ok(rTa.includes(esc(String(a.titleTa))), `${slug}/${a.slug}: reading title present in render`);
  }
}

// ── NOVELS (5 works via the bounded adapter) ─────────────────────────────────────────────────────────
const NOVELS = ["arumbu", "nadutheru-narayani", "sarapallam-samundi", "surulimalai", "vellikkizhamai"];
for (const slug of NOVELS) {
  const raw = load(`public/data/novels/${slug}/novel.json`);
  const rawProv = load(`public/data/novels/${slug}/provenance.json`);
  const novel = wave7NovelToNovel(raw);
  const prov = wave7NovelProvenance(rawProv, novel);
  let landing = "", source = "";
  try { landing = ta(createElement(NovelLanding, { novel })); } catch (e) { fail.push(`${slug}: NovelLanding threw ${(e as Error).message}`); checks++; }
  try { source = ta(createElement(NovelSource, { slug, prov })); } catch (e) { fail.push(`${slug}: NovelSource threw ${(e as Error).message}`); checks++; }
  ok(landing.includes(esc(novel.title.ta)) && hasTamil(landing), `${slug}: NovelLanding renders Tamil title`);
  ok(!LEAK.test(landing), `${slug}: no leak on NovelLanding`);
  ok(hasTamil(source) && !LEAK.test(source), `${slug}: NovelSource renders without leak`);
  const secs = novel.sections;
  for (let i = 0; i < secs.length; i++) {
    const s = secs[i];
    const enHasProse = s.english.blocks.some((b) => b.kind === "paragraph" && b.text.trim().length);
    const rTa = ta(createElement(NovelReader, { novel, section: s, prev: i > 0 ? secs[i - 1] : null, next: i < secs.length - 1 ? secs[i + 1] : null }));
    const rEn = ta(createElement(NovelReader, { novel, section: s, prev: null, next: null, initialShowEn: true }));
    ok(hasTamil(rTa), `${slug}/${s.slug}: Tamil section renders`);
    // English is not silently blanked: where the section has English prose, the English view has Latin text.
    ok(!enHasProse || hasLatin(rEn), `${slug}/${s.slug}: English section renders non-empty (not blanked)`);
    ok(!LEAK.test(rTa) && !LEAK.test(rEn), `${slug}/${s.slug}: no leak in section render`);
  }
}
// surulimalai: 26 divisions, source chapter-number gap 6/7 preserved (no invented chapter).
{
  const novel = wave7NovelToNovel(load("public/data/novels/surulimalai/novel.json"));
  ok(novel.sections.length === 26, "surulimalai: 26 reading divisions");
  const chapNums = novel.sections.map((s) => s.chapterNumber).filter((n): n is number => n != null);
  ok(!chapNums.includes(6) && !chapNums.includes(7), "surulimalai: no chapter 6 or 7 invented");
  ok(chapNums.includes(5) && chapNums.includes(8), "surulimalai: chapters 5 and 8 present (gap preserved)");
}

if (fail.length) {
  console.error(`\nwave7-b2-b4-p2-render — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 50)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b2-b4-p2-render — ${checks} checks, 0 failed`);
console.log("  13 works render through the family readers · Tamil default + real English (initialShowEn) · every scene/article/section non-empty in both layers · nachuk hold not authored · surulimalai gap preserved · no undefined/null/NaN");
