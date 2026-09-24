/**
 * Wave 8 P4 — publication UI regression through the REAL components.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave8-p4-publication-ui.ts
 *
 * /read (LibraryHome): the ஒரே முத்தம் and சங்கத் தமிழ் cards exist; Murasoli stays one card; the Sangatamil card discloses
 * the permanent scan-8 limitation; the Ore Mutham card states 30 + a separately numbered comedy section (never 31–33).
 * /murasoli (MurasoliLibrary, seeded with the published public indexes): Volumes 42–54, 688 letters, search reaches a
 * Wave-8 letter by title and by printed number, Wave-8 page counts are real (never "0 pages"), and the copy carries no
 * stale year span, no blanket OCR claim and no blanket TDL / University-of-Madras source claim.
 * Published readers (through their route modules): m42-l3364, m42-l3154, both m46 printed-3637 letters, m47-l3681,
 * Ore main-30 / nagai-suvai-01, the Sangatamil section holding scan 8 and an ordinary Sangatamil section.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import LibraryHome from "../components/LibraryHome";
import MurasoliLibrary from "../components/MurasoliLibrary";
import * as MurasoliRoute from "../app/murasoli/[id]/page";
import * as PlaySceneRoute from "../app/plays/[slug]/[scene]/page";
import * as SangatamilSectionRoute from "../app/sangatamil/[section]/page";
import type { MurasoliIndex, MurasoliLettersIndex } from "../data/murasoli";

let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const r = (el: ReactElement, lang: "ta" | "en") => renderToStaticMarkup(createElement(LangProvider, { initialLang: lang, children: el }));
const visible = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ");
const count = (h: string, re: RegExp) => (h.match(new RegExp(re.source, "g")) ?? []).length;
const readJSON = <T,>(rel: string): T => JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
const page = (Page: unknown, params: Record<string, string>, lang: "ta" | "en" = "ta") => { try { return r((Page as (p: { params: Record<string, string> }) => ReactElement)({ params }), lang); } catch { return ""; } };

// ══ /read ═══════════════════════════════════════════════════════════════════════════════════════════════════════
for (const lang of ["en", "ta"] as const) {
  const h = r(createElement(LibraryHome, {}), lang);
  const v = visible(h);
  ok(h.includes('href="/plays/ore-mutham"'), `/read ${lang}: Ore Mutham card`);
  ok(h.includes('href="/sangatamil"'), `/read ${lang}: Sangatamil card`);
  ok(count(h, /href="\/murasoli"/) === 1, `/read ${lang}: Murasoli is ONE card (${count(h, /href="\/murasoli"/)})`);
  ok(lang === "en" ? /scan 8 is permanently source-limited and not transcribed/.test(v) : /ஸ்கேன் 8-இன் கையெழுத்து முன்னுரைக் கடிதம் மூலத்தின் நிலையான வரம்புடையது/.test(v), `/read ${lang}: Sangatamil card discloses the permanent scan-8 limitation`);
  ok(lang === "en" ? /30 scenes, followed by a separately titled comedy section .* Scenes 1–3 are numbered afresh — not Scenes 31–33/.test(v) : /30 காட்சிகள்; அதன்பின் தனித் தலைப்புடைய நகைச் சுவைப் பகுதி\. — அதன் காட்சிகள் 1–3 தனியாக எண்ணிடப்பட்டவை/.test(v), `/read ${lang}: Ore card states 30 + a separately numbered 3 (not 33 sequential scenes)`);
  ok(!/Scene 3[1-3]\b(?! —)|காட்சி 3[1-3]\b/.test(v.replace(/not Scenes 31–33/g, "")), `/read ${lang}: no card numbers a scene 31–33`);
}

// ══ /murasoli ═══════════════════════════════════════════════════════════════════════════════════════════════════
const idx = readJSON<MurasoliIndex>("public/data/murasoli/index.json");
const letters = readJSON<MurasoliLettersIndex>("public/data/murasoli/letters-index.json");
for (const lang of ["en", "ta"] as const) {
  const h = r(createElement(MurasoliLibrary, { initialIndex: idx, initialLetters: letters }), lang);
  const v = visible(h);
  const vols = Array.from(h.matchAll(/(?:Volume|தொகுதி) (\d+)<span/g)).map((m) => Number(m[1]));
  ok(JSON.stringify(vols) === JSON.stringify([42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54]), `/murasoli ${lang}: volume cards 42–54 (got ${vols})`);
  ok(lang === "en" ? /13 volumes · 688 letters · 5141 pages so far/.test(v) : /13 தொகுதி · 688 கடிதங்கள் · 5141 பக்கங்கள் இதுவரை/.test(v), `/murasoli ${lang}: 13 volumes / 688 letters / 5141 pages`);
  ok(!/2013–2016/.test(v), `/murasoli ${lang}: no stale 2013–2016 span`);
  ok(lang === "en" ? /Volumes 42 to 54 of the fifty-four are available now — Volumes 42–53 with a full English translation alongside the authoritative Tamil; Volume 54 in Tamil only/.test(v) : /தொகுதி 42 முதல் 54 வரை இப்போது வாசிக்கக் கிடைக்கின்றன — தொகுதி 42–53: தமிழ் மூலத்துடன் முழு ஆங்கில மொழிபெயர்ப்பும்; தொகுதி 54: தமிழ் மட்டும்/.test(v), `/murasoli ${lang}: availability derived from the data (42–53 with English, 54 Tamil-only)`);
  const note = visible(h.slice(h.indexOf('data-testid="murasoli-provenance-note"'), h.indexOf("</p>", h.indexOf('data-testid="murasoli-provenance-note"'))));
  ok(lang === "en" ? /Volumes 42–47 are carried from archival page records verified against the scanned printed volumes/.test(note) && /Volumes 48–54 were OCR-extracted/.test(note) : /தொகுதி 42–47: அச்சிட்ட நூலின் ஸ்கேனுடன் ஒப்பிட்டுச் சரிபார்க்கப்பட்ட/.test(note) && /தொகுதி 48–54: அச்சு நூல்களிலிருந்து OCR/.test(note), `/murasoli ${lang}: provenance stated per cohort (42–47 verified, 48–54 OCR)`);
  ok(!/These letters are OCR-extracted|இக்கடிதங்கள் அச்சு நூல்களிலிருந்து OCR/.test(v), `/murasoli ${lang}: no blanket claim that all letters are OCR-extracted`);
  ok(!/University of Madras|சென்னைப் பல்கலைக்கழக/.test(v) && !/^Source: Tamil Digital Library/m.test(v), `/murasoli ${lang}: no blanket TDL / University of Madras source claim`);
  // Volume 42 is open by default: its letters show real page counts, never "0 pages".
  const v42 = h.slice(h.indexOf('href="/murasoli/m42-'), h.indexOf('href="/murasoli/m43-') > 0 ? h.indexOf('href="/murasoli/m43-') : undefined);
  ok(v42.includes('href="/murasoli/m42-l3364"') && !/>0<!-- --> (pages|பக்கங்கள்)|\b0 (pages|பக்கங்கள்)/.test(visible(v42)), `/murasoli ${lang}: Wave-8 letters list real page counts (never 0)`);
  // Search by title and by printed number.
  const t3154 = letters.volumes[0].letters.find((l) => l.number === 3154)!;
  const byTitle = r(createElement(MurasoliLibrary, { initialIndex: idx, initialLetters: letters, initialQuery: t3154.title.ta.slice(0, 8) }), lang);
  ok(byTitle.includes(`href="/murasoli/${t3154.id}"`), `/murasoli ${lang}: search by Tamil title reaches Vol-42 letter ${t3154.id}`);
  const byNum = r(createElement(MurasoliLibrary, { initialIndex: idx, initialLetters: letters, initialQuery: "3637" }), lang);
  ok(byNum.includes('href="/murasoli/m46-l3637-indre-selga-inithe-velga"') && byNum.includes('href="/murasoli/m46-l3637-en-uyirinumelana-anbu-udanpirappukkale"'), `/murasoli ${lang}: search by printed number 3637 reaches both Vol-46 records`);
}

// ══ Published readers ═══════════════════════════════════════════════════════════════════════════════════════════
const m3364 = page(MurasoliRoute.default, { id: "m42-l3364" });
ok(m3364.includes('data-testid="wave8-letter-body"') && visible(m3364).includes("3364"), "m42-l3364 renders from the Wave-8 model");
ok(visible(page(MurasoliRoute.default, { id: "m42-l3154" })).includes("3154"), "m42-l3154 displays its printed 3154");
const a = page(MurasoliRoute.default, { id: "m46-l3637-indre-selga-inithe-velga" }), b = page(MurasoliRoute.default, { id: "m46-l3637-en-uyirinumelana-anbu-udanpirappukkale" });
ok(!!a && !!b && a !== b && visible(a).includes("3637") && visible(b).includes("3637"), "both Vol-46 printed-3637 letters render as distinct pages, each printing 3637");
const m3681 = page(MurasoliRoute.default, { id: "m47-l3681" });
ok(m3681.includes('data-testid="source-condition"') && m3681.includes('data-missing-printed-pages="252"') && !m3681.includes('data-printed-page="252"'), "m47-l3681: permanent source-incomplete notice; no page 252");
const main30 = page(PlaySceneRoute.default, { slug: "ore-mutham", scene: "main-30" });
ok(/காட்சி 30 \/ 30/.test(visible(main30)) && main30.includes('href="/plays/ore-mutham/nagai-suvai-01"'), "Ore main-30: scene 30 of 30, next is the comedy section's scene 1");
const ns1 = page(PlaySceneRoute.default, { slug: "ore-mutham", scene: "nagai-suvai-01" });
ok(/நகைச் சுவைப் பகுதி\. · காட்சி 1 \/ 3/.test(visible(ns1)) && !/காட்சி 31/.test(visible(ns1)), "Ore nagai-suvai-01: நகைச் சுவைப் பகுதி. · காட்சி 1 / 3 (never 31)");
const s8 = page(SangatamilSectionRoute.default, { section: "000-front-matter" });
ok(s8.includes('data-scan="8"') && s8.includes('data-role="source-limited"') && !/pending/i.test(visible(s8)), "Sangatamil front matter: scan 8 carries its permanent source-condition statement");
const s1 = page(SangatamilSectionRoute.default, { section: "001-malarmari-pozhiginren" }, "en");
ok(s1.includes('data-role="quotation"') && s1.includes('data-role="source-citation"') && s1.includes('data-citation-ids="P001"'), "Sangatamil ordinary section: verse and the printed citation render distinctly");

if (fail.length) {
  console.error(`\nwave8-p4-publication-ui — ${checks} checks, ${fail.length} FAILED`);
  for (const f of fail) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`wave8-p4-publication-ui — ${checks} checks, 0 failed`);
console.log("  /read: Ore + Sangatamil cards, one Murasoli card, scan-8 + 30+3 disclosures · /murasoli: 42–54 · 688 · real page counts · search · cohort-accurate provenance copy · 9 published readers");
