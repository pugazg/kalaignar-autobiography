/**
 * UI/contract tests for the P3 anthology (கலைஞரின் கவிதைகள்) and the two cross-witness relationships.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-p3-publication-ui.ts
 *
 * Renders the real landing, item reader and witness note against the vendored payload and the
 * relation registry, and proves the P3-specific facts: 77 items in 5 source-established groups, the
 * non-contiguous items, the two witness links resolving in both directions, and that the standalone
 * Thennan editorial exception stays witness-local.
 */

import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PublicationLanding from "../components/PublicationLanding";
import type { PublicationBrief } from "../components/PublicationLanding";
import PublicationItemReader from "../components/PublicationItemReader";
import PublicationSource from "../components/PublicationSource";
import WitnessNote from "../components/WitnessNote";
import { LangProvider } from "../lib/i18n";
import { resolveWitnessLinks } from "../lib/witness";
import { POETRY_WITNESS_RELATIONS } from "../data/poems";
import type { PoetryPublication } from "../data/poems";

let checks = 0;
const failures: string[] = [];
const ok = (cond: boolean, label: string) => { checks++; if (!cond) failures.push(label); };
const eq = <T,>(a: T, b: T, label: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${label}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

const SLUG = "kalaignarin-kavithaigal";
const pub: PoetryPublication = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", SLUG, "publication.json"), "utf-8"));
import type { PoetryPublicationProvenance } from "../data/poems";
const prov: PoetryPublicationProvenance = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", SLUG, "provenance.json"), "utf-8"));
const bi = (el: React.ReactElement) => ({ ta: renderToStaticMarkup(createElement(LangProvider, null, el)), en: renderToStaticMarkup(el) });

// ── 1. Landing: 77 items in 5 groups, canonical order, group headings ────────────────────────────
{
  const brief: PublicationBrief = {
    slug: pub.slug, titleTa: pub.title.ta, titleEn: pub.title.en, authorTa: pub.author.nameTa, authorEn: pub.author.nameEn,
    editionStatement: pub.editionStatement, publicationYear: pub.publicationYear, itemCount: pub.itemCount,
    items: pub.items.map((i) => ({ ordinal: i.ordinal, slug: i.slug, titleTa: i.titleTa, contentsTitleTa: i.contentsTitleTa, titleEn: i.titleEn, printedOrdinal: i.printedOrdinal, scanFirst: i.physicalScans[0].first, scanLast: i.physicalScans.at(-1)!.last })),
    groups: pub.groups!.map((g) => ({ ordinal: g.ordinal, titleTa: g.titleTa, titleEn: g.titleEn, itemOrdinals: g.itemOrdinals })),
  };
  const html = bi(createElement(PublicationLanding, { pub: brief }));
  for (const lang of ["ta", "en"] as const) {
    const h = html[lang];
    const links: string[] = [];
    const re = /href="\/poems\/kalaignarin-kavithaigal\/([a-z0-9-]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(h)) !== null) if (m[1] !== "source") links.push(m[1]);
    eq(links.length, 77, `landing (${lang}): 77 item links`);
    eq(links, pub.items.map((i) => i.slug), `landing (${lang}): items in canonical order`);
    // 5 groups, 4 of them with a bilingual divider heading (group 1 shares its single item).
    eq((h.match(/id="group-\d+"/g) ?? []).length, 4, `landing (${lang}): four group headings render (group 1 needs none)`);
    for (const g of pub.groups!) if (g.itemOrdinals.length > 1) ok(h.includes(esc(g.titleTa)), `landing (${lang}): group ${g.ordinal} Tamil heading`);
    ok(h.includes("Bearers of Dignity") && h.includes("Flower Garden"), `landing (${lang}): group English titles render`);
  }
}

// ── 2. Non-contiguous items 23 & 24 keep separate runs in the data ───────────────────────────────
{
  const it23 = pub.items.find((i) => i.ordinal === 23)!;
  const it24 = pub.items.find((i) => i.ordinal === 24)!;
  eq(it23.physicalScans.length, 2, "item 23 keeps two scan runs");
  eq(it24.logicalPrintedPages!.length, 2, "item 24 keeps two logical page runs");
}

// ── 3. Item reader renders verse; witness link on items 01 and 02 ────────────────────────────────
function readerHtml(ord: number, witnessLinks = resolveWitnessLinks(SLUG, pub.items.find((i) => i.ordinal === ord)!.slug)) {
  const idx = pub.items.findIndex((i) => i.ordinal === ord);
  const it = pub.items[idx];
  const b = (i: (typeof pub.items)[number] | undefined) => (i ? { slug: i.slug, titleTa: i.titleTa } : null);
  return bi(createElement(PublicationItemReader, { pubSlug: SLUG, pubTitleTa: pub.title.ta, item: it, index: idx, total: pub.items.length, prev: b(pub.items[idx - 1]), next: b(pub.items[idx + 1]), witnessLinks }));
}
{
  const h1 = readerHtml(1);
  ok(h1.en.includes("Give Me Your Heart, Anna"), "item 1: English title renders");
  ok(h1.ta.includes("/poems/idhayathai-thanthidu-anna"), "item 1: witness link to the standalone Idhayathai");
  ok(h1.en.includes("Another source witness"), "item 1: witness note (English)");

  const h2 = readerHtml(2);
  ok(h2.ta.includes("/poems/thennan-kathai"), "item 2: witness link to the standalone Thennan");
  ok(!/omitt|slur|caste|editorial exception/i.test(h2.en), "item 2: no editorial-exception language (that is the standalone's, witness-local)");
  ok(!/identical|supersed|corrected version|original version/i.test(h2.en + h2.ta), "item 2: no claim of textual identity or supersession");

  // A non-counterpart item shows NO witness note.
  const h3 = readerHtml(3, resolveWitnessLinks(SLUG, pub.items[2].slug));
  ok(!h3.en.includes("Another source witness"), "item 3: no witness note where no relation exists");
}

// ── 4. Both relationships resolve in BOTH directions ─────────────────────────────────────────────
{
  eq(POETRY_WITNESS_RELATIONS.length, 2, "exactly two witness relations");
  const ids = POETRY_WITNESS_RELATIONS.map((r) => r.id);
  eq(ids.length, 2, "two relation ids");
  eq(new Set(ids).size, 2, "relation ids are unique");
  ok(ids.includes("idhayathai-thanthidu-anna--kalaignarin-kavithaigal--item-01"), "stable id A");
  ok(ids.includes("thennan-kathai--kalaignarin-kavithaigal--item-02"), "stable id B");
  // The resolved link carries its stable relation id (used as the render key).
  const la = resolveWitnessLinks("idhayathai-thanthidu-anna");
  eq(la[0]?.id, "idhayathai-thanthidu-anna--kalaignarin-kavithaigal--item-01", "resolved link carries the stable relation id");
  const dirs: [string, string | undefined, string][] = [
    ["idhayathai-thanthidu-anna", undefined, "/poems/kalaignarin-kavithaigal/give-me-your-heart-anna"],
    ["kalaignarin-kavithaigal", "give-me-your-heart-anna", "/poems/idhayathai-thanthidu-anna"],
    ["thennan-kathai", undefined, "/poems/kalaignarin-kavithaigal/the-tale-of-the-southerner"],
    ["kalaignarin-kavithaigal", "the-tale-of-the-southerner", "/poems/thennan-kathai"],
  ];
  for (const [slug, itemSlug, expectedHref] of dirs) {
    const links = resolveWitnessLinks(slug, itemSlug);
    eq(links.length, 1, `witness link exists for ${slug}${itemSlug ? "/" + itemSlug : ""}`);
    eq(links[0]?.href, expectedHref, `witness link resolves to ${expectedHref}`);
    const html = renderToStaticMarkup(createElement(WitnessNote, { links }));
    ok(html.includes(`href="${expectedHref}"`), `witness note renders the link to ${expectedHref}`);
    ok(!/identical|supersed|corrected|\boriginal\b/i.test(html), `witness note for ${slug} claims no identity/supersession`);
  }
}

// ── 5. Thennan witness isolation, in the data ────────────────────────────────────────────────────
{
  const it02 = pub.items.find((i) => i.ordinal === 2)!;
  ok(!("editorialExceptions" in it02), "P3 item 02 carries no editorial exception");
  const standalone = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems/thennan-kathai/poem.json"), "utf-8"));
  ok(Array.isArray(standalone.editorialExceptions) && standalone.editorialExceptions.length === 1, "standalone Thennan keeps its exception");
  const lineText = (els: { kind: string; text?: string }[]) => els.filter((e) => e.kind === "line").map((e) => e.text ?? "").join("\n");
  const a = lineText(it02.tamil.elements as unknown as { kind: string; text?: string }[]);
  const b = lineText(standalone.tamil.elements as { kind: string; text?: string }[]);
  ok(a !== b, "the two witnesses are not byte-identical");
}

// ── 6. Title-witness provenance surface does not misrepresent 29 as the whole ────────────────────
{
  const html = bi(createElement(PublicationSource, { slug: SLUG, prov }));
  for (const lang of ["ta", "en"] as const) {
    const h = html[lang];
    ok(h.includes("81"), `source (${lang}): the overall total 81 is shown`);
    ok(h.includes("51"), `source (${lang}): 51 exact is shown`);
    ok(h.includes("30"), `source (${lang}): 30 source-valid variants is shown`);
    // The card title must NOT present 29 as the overall count.
    ok(!/Title witnesses \(29\)/.test(h), `source (${lang}): does not title the card "Title witnesses (29)"`);
    // The group-only variant renders as its own section, showing both witnesses.
    ok(h.includes(esc("கண்ணீர்க் கவிதை")) && h.includes(esc("கண்ணீர்த் துளிகள்")), `source (${lang}): the group-4 variant shows both witnesses`);
  }
  eq(prov.titleWitnesses.overall, { total: 81, exact: 51, variants: 30, unresolved: 0 }, "provenance overall totals");
  eq(prov.titleWitnesses.count, 29, "29 item variants");
  eq(prov.titleWitnesses.groupVariants?.count, 1, "1 group-only variant");
}

if (failures.length) {
  console.error(`p3-publication-ui — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exitCode = 1;
} else {
  console.log(`p3-publication-ui — ${checks} checks, 0 failed`);
  console.log(`  77 items · 5 groups · 2 non-contiguous items · 2 witness relations (both directions)`);
}
