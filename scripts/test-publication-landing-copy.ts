/**
 * Post-Wave-4 regression: publication-landing descriptive copy must state each publication's OWN
 * count and structure — never the other publication's.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-publication-landing-copy.ts
 *
 * The regression it guards: the shared PublicationLanding once hard-coded "58 poems … numbered first
 * part" in its description paragraph. That is source-true for காலப் பேழையும் கவிதைச் சாவியும் (58 poems,
 * the numbered first part, no groups) but false for கலைஞரின் கவிதைகள் (77 poems across 5
 * source-established groups), so the 77-item publication rendered a contradictory "58" and a false
 * "numbered first part" structure. The description is now derived from each publication's own
 * itemCount + groups.
 *
 * These are POSITIVE assertions — they prove the required wording/count is present for each publication
 * and each language, and prove neither publication inherits the other's count or structural wording.
 * They render the real PublicationLanding with a brief built exactly as app/poems/[slug]/page.tsx builds
 * it, from the released publication.json.
 */

import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PublicationLanding from "../components/PublicationLanding";
import type { PublicationBrief } from "../components/PublicationLanding";
import { LangProvider } from "../lib/i18n";
import type { PoetryPublication } from "../data/poems";

let checks = 0;
const failures: string[] = [];
const ok = (cond: boolean, label: string) => { checks++; if (!cond) failures.push(label); };

// Build the brief exactly as the page does (same fields, including groups).
function brief(slug: string): { pub: PublicationBrief; itemCount: number; groups: number } {
  const p: PoetryPublication = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", slug, "publication.json"), "utf-8"));
  return {
    itemCount: p.itemCount,
    groups: Array.isArray(p.groups) ? p.groups.length : 0,
    pub: {
      slug: p.slug, titleTa: p.title.ta, titleEn: p.title.en, authorTa: p.author.nameTa, authorEn: p.author.nameEn,
      editionStatement: p.editionStatement, publicationYear: p.publicationYear, itemCount: p.itemCount,
      items: p.items.map((i) => ({ ordinal: i.ordinal, slug: i.slug, titleTa: i.titleTa, titleEn: i.titleEn, scanFirst: i.physicalScans[0].first, scanLast: i.physicalScans.at(-1)!.last })),
      groups: p.groups?.map((g) => ({ ordinal: g.ordinal, titleTa: g.titleTa, titleEn: g.titleEn, itemOrdinals: g.itemOrdinals })),
    },
  };
}

// Only the description paragraph, isolated so item titles / group headings elsewhere on the page can
// never satisfy or defeat a count assertion by accident.
const DESC = /<p class="mt-4 max-w-xl[^>]*>([\s\S]*?)<\/p>/;
function description(slug: string, ta: boolean): string {
  const { pub } = brief(slug);
  const el = createElement(PublicationLanding, { pub });
  const html = ta ? renderToStaticMarkup(createElement(LangProvider, null, el)) : renderToStaticMarkup(el);
  return DESC.exec(html)?.[1] ?? "";
}

const KAALAP = "kaalap-pezhaiyum-kavithai-saaviyum";
const KAVITHAIGAL = "kalaignarin-kavithaigal";

// Confirm the fixture reality the assertions below depend on: 58 flat vs 77 in 5 groups.
{
  const k = brief(KAALAP), g = brief(KAVITHAIGAL);
  ok(k.itemCount === 58 && k.groups === 0, `fixture: ${KAALAP} is 58 items, no groups (got ${k.itemCount}/${k.groups})`);
  ok(g.itemCount === 77 && g.groups === 5, `fixture: ${KAVITHAIGAL} is 77 items, 5 groups (got ${g.itemCount}/${g.groups})`);
}

// 1 + 2 — காலப் பேழை: 58 in both languages; flat wording; never the other publication's 77 or "sections".
{
  const ta = description(KAALAP, true);
  const en = description(KAALAP, false);
  ok(ta.includes("58 கவிதைகள்"), "Kaalap Tamil description states 58 கவிதைகள்");
  ok(!ta.includes("77"), "Kaalap Tamil description does not mention 77");
  ok(!ta.includes("பிரிவு"), "Kaalap Tamil description uses no grouped-sections wording (it is flat)");
  ok(en.includes("The 58 poems of this book"), "Kaalap English description states 58 poems");
  ok(!en.includes("77"), "Kaalap English description does not mention 77");
  ok(!/sections?/i.test(en), "Kaalap English description uses no grouped-sections wording (it is flat)");
}

// 3 + 4 — கலைஞரின் கவிதைகள்: 77 in both languages; grouped 5-section wording; never the other's 58.
{
  const ta = description(KAVITHAIGAL, true);
  const en = description(KAVITHAIGAL, false);
  ok(ta.includes("77 கவிதைகள்"), "Kalaignarin Kavithaigal Tamil description states 77 கவிதைகள்");
  ok(ta.includes("5 பிரிவுகளாக"), "Kalaignarin Kavithaigal Tamil description states its 5 source-established sections");
  ok(!ta.includes("58"), "Kalaignarin Kavithaigal Tamil description does not mention 58");
  ok(!ta.includes("முதல் பாக"), "Kalaignarin Kavithaigal Tamil description makes no 'numbered first part' claim");
  ok(en.includes("The 77 poems of this book"), "Kalaignarin Kavithaigal English description states 77 poems");
  ok(en.includes("5 source-established sections"), "Kalaignarin Kavithaigal English description states its 5 sections");
  ok(!en.includes("58"), "Kalaignarin Kavithaigal English description does not mention 58");
  ok(!/numbered first part/i.test(en), "Kalaignarin Kavithaigal English description makes no 'numbered first part' claim");
}

// Cross-publication leakage guard, positively: each publication's description differs from the other's
// in each language, and the grouped "sections" wording appears for the grouped publication ONLY.
{
  ok(description(KAALAP, true) !== description(KAVITHAIGAL, true), "the two Tamil descriptions are distinct (no shared hard-coded copy)");
  ok(description(KAALAP, false) !== description(KAVITHAIGAL, false), "the two English descriptions are distinct (no shared hard-coded copy)");
  ok(/sections?/i.test(description(KAVITHAIGAL, false)) && !/sections?/i.test(description(KAALAP, false)),
    "grouped 'sections' wording renders for the grouped publication only");
}

if (failures.length) {
  console.error(`\npublication-landing-copy — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  x " + f);
  process.exit(1);
}
console.log(`\npublication-landing-copy — ${checks} checks, 0 failed`);
console.log("  Kaalap 58 (flat) · Kalaignarin Kavithaigal 77 (5 sections) · TA+EN · no cross-publication leakage");
