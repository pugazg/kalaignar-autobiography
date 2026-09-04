/**
 * Wave 4 P4 — cross-witness UI regression (RENDER level).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave4-p4-witness-ui.ts
 *
 * Narrowly scoped to what the RENDERED WitnessNote must guarantee for all four public directions, so
 * it does not overlap the P3 UI test's item-reader/landing coverage. It renders the real WitnessNote
 * with the real resolver output and proves: exactly one link per witness endpoint, the exact
 * counterpart href, the public note, a stable relation-id key, no self-link, no third link, no
 * forbidden identity/supersession wording, and that an unrelated endpoint renders nothing.
 *
 * The Thennan omitted source word is never reproduced here; the exception is referred to generically.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import WitnessNote from "../components/WitnessNote";
import { LangProvider } from "../lib/i18n";
import { resolveWitnessLinks } from "../lib/witness";

let checks = 0;
const failures: string[] = [];
const ok = (cond: boolean, label: string) => { checks++; if (!cond) failures.push(label); };
const eq = <T,>(a: T, b: T, label: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${label}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };

const bi = (slug: string, itemSlug?: string) => {
  const links = resolveWitnessLinks(slug, itemSlug);
  const el = createElement(WitnessNote, { links });
  return { links, ta: renderToStaticMarkup(createElement(LangProvider, null, el)), en: renderToStaticMarkup(el) };
};

const FORBIDDEN = /identical|same text|exact copy|corrected|definitive|\boriginal\b|replacement|supersed|preferred/i;
const KAALAP = "kaalap-pezhaiyum-kavithai-saaviyum";

// The four public directions and the counterpart each must link to.
const directions: [string, string | undefined, string][] = [
  ["idhayathai-thanthidu-anna", undefined, "/poems/kalaignarin-kavithaigal/give-me-your-heart-anna"],
  ["kalaignarin-kavithaigal", "give-me-your-heart-anna", "/poems/idhayathai-thanthidu-anna"],
  ["thennan-kathai", undefined, "/poems/kalaignarin-kavithaigal/the-tale-of-the-southerner"],
  ["kalaignarin-kavithaigal", "the-tale-of-the-southerner", "/poems/thennan-kathai"],
];

for (const [slug, itemSlug, expectedHref] of directions) {
  const { links, ta, en } = bi(slug, itemSlug);
  const at = `${slug}${itemSlug ? "/" + itemSlug : ""}`;
  eq(links.length, 1, `${at}: exactly one witness link resolves`);
  for (const lang of [ta, en]) {
    const anchors: string[] = [];
    const re = /href="([^"]+)"/g;
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(lang)) !== null) anchors.push(mm[1]);
    eq(anchors, [expectedHref], `${at}: renders exactly one link, to ${expectedHref}`);
    ok(!anchors.some((h) => h === `/poems/${slug}` || h === `/poems/${slug}/${itemSlug ?? ""}`), `${at}: does not render a self-link`);
    ok(!anchors.some((h) => h.includes(KAALAP)), `${at}: renders no Kaalap link`);
    ok(!FORBIDDEN.test(lang), `${at}: no forbidden identity/supersession wording`);
  }
  ok(en.includes("Another source witness"), `${at}: English note present`);
  ok(ta.includes("மற்றொரு மூல ஆதாரப் பதிப்பும்"), `${at}: Tamil note present`);
  // The rendered link carries the stable relation id as its React key (kept in the payload markup).
  ok(links[0].id.length > 0 && !/^\d+$/.test(links[0].id), `${at}: link carries a stable, non-index relation id`);
}

// An unrelated endpoint renders NOTHING — the note is not shown where no relation exists.
for (const [slug, itemSlug] of [[KAALAP, "the-common-world"], ["anaiya-vilakku-anna", undefined], ["marathi", undefined]] as [string, string | undefined][]) {
  const { links, ta, en } = bi(slug, itemSlug);
  eq(links.length, 0, `${slug}${itemSlug ? "/" + itemSlug : ""}: no witness link`);
  ok(ta === "" && en === "", `${slug}${itemSlug ? "/" + itemSlug : ""}: renders no witness note`);
}

// The Thennan pair renders in both directions WITHOUT any standalone editorial-exception language on
// the anthology side (the exception is witness-local to the standalone).
{
  const anthology = bi("kalaignarin-kavithaigal", "the-tale-of-the-southerner");
  ok(!/omitt|caste|editorial exception|slur|without replacement/i.test(anthology.en + anthology.ta), "Thennan anthology witness note carries no editorial-exception language");
  ok(anthology.links.length === 1 && anthology.links[0].href === "/poems/thennan-kathai", "Thennan anthology witness links back to the standalone");
}

if (failures.length) {
  console.error(`wave4-p4-witness-ui — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  x " + f);
  process.exitCode = 1;
} else {
  console.log(`wave4-p4-witness-ui — ${checks} checks, 0 failed`);
  console.log("  4 directions render one link each - no self/third/Kaalap link - no forbidden wording");
}
