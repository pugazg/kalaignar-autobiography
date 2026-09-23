/**
 * Essay public-provenance regression — what the Source & provenance pages publish. Creates NO routes.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-essay-public-provenance.ts
 *
 * Requires a production build (`npm run build`) — part (5) reads the generated HTML/RSC artifacts and FAILS
 * CLOSED when they are absent. CI runs it after the Build step.
 *
 * Two defects, both "internal workflow state published as provenance":
 *  A. Public `notes` carried stale workflow checkpoints ("Wave 6 P1–P3 Batch 6 …", "… intentionally absent
 *     from the public catalogue … (Wave-6 P4 not authorized)") on already-published works.
 *  B. `/essays/[slug]/source` passed the WHOLE archival provenance record to the client component
 *     `ArticleSource`, so internal fields such as the frozen Wave-7 P1 `hidden` object were serialized into
 *     the page HTML (RSC payload) although never rendered.
 * The archival record is deliberately retained (the P1 hidden-boundary validator reads `hidden`); only the
 * PUBLIC payload is sanitized, via the allowlist projection in lib/essay-public-provenance.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import ArticleSource from "../components/ArticleSource";
import EssaySourcePage from "../app/essays/[slug]/source/page";
import {
  toPublicEssayProvenance, PUBLIC_TOP_KEYS, PUBLIC_SOURCE_KEYS, PUBLIC_ENGLISH_KEYS, PUBLIC_DERIVED_KEYS, PUBLIC_ARTICLE_MAP_KEYS,
} from "../lib/essay-public-provenance";
import type { EssayProvenance } from "../data/essays";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const load = (slug: string) => JSON.parse(fs.readFileSync(path.join(root, "public/data/essays", slug, "provenance.json"), "utf8")) as EssayProvenance & Record<string, unknown>;
const ta = (el: React.ReactElement) => renderToStaticMarkup(createElement(LangProvider, null, el));
const en = (el: React.ReactElement) => renderToStaticMarkup(createElement(LangProvider, { initialLang: "en", children: el }));
const visible = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

const WAVE6_B6 = ["ina-muzhakkam", "kolaikkalam", "kudumbaththin-nalvilakku", "sinthanaiyum-seyalum", "vedhanai-ch-siraiyinindrum-viduthalai-pera"];
const WAVE7_B4 = ["aaru-maatha-kadungkaaval", "thudikkum-ilamai", "perumoochu", "viduthalai-kilarcci", "meesai-mulaiththa-vayathil", "pesum-kalai-valarppom"];
const ALL = fs.readdirSync(path.join(root, "public/data/essays")).filter((s) => fs.existsSync(path.join(root, "public/data/essays", s, "provenance.json"))).sort();
ok(ALL.length === 15 && [...WAVE6_B6, ...WAVE7_B4].every((s) => ALL.includes(s)), `15 essay provenance records incl. the 5 Wave-6 B6 + 6 Wave-7 B4 (found ${ALL.length})`);

// Stale workflow-state wording — never durable public provenance.
const STALE_NOTE = /Wave[\s-]*\d|Batch\s*\d|\bP[0-9](?:[–-]P?[0-9])?\b|not authori[sz]ed|intentionally absent|absent from the public catalogue|Direct reader routes only|direct routes only|hidden foundation|\/read discovery|not (?:yet )?(?:published|discoverable|public)/i;
const STALE_PAGE = /Wave 6 P1|Batch 6|P4 not authori[sz]ed|not authori[sz]ed|intentionally absent|absent from the public catalogue|Direct reader routes only|hidden foundation/i;
const PDF_NOTE = "The controlling PDF is not vendored into this repository and is never fetched at runtime.";

// ── (A) PUBLIC NOTES — the five Wave-6 B6 essays (and the six Wave-7 B4 essays fixed in PR #92) ───────────
for (const slug of [...WAVE6_B6, ...WAVE7_B4]) {
  const prov = load(slug);
  ok(prov.notes.every((n) => !STALE_NOTE.test(n)), `${slug}: public notes carry no workflow-state wording (${prov.notes.filter((n) => STALE_NOTE.test(n)).join(" | ")})`);
  ok(prov.notes.includes(PDF_NOTE), `${slug}: durable PDF-not-vendored note retained`);
  const pub = toPublicEssayProvenance(prov);
  for (const [lbl, h] of [["Tamil UI", ta(createElement(ArticleSource, { slug, prov: pub }))], ["English UI", en(createElement(ArticleSource, { slug, prov: pub }))]] as const) {
    const v = visible(h);
    ok(!STALE_PAGE.test(v), `${slug} Source & provenance (${lbl}): no stale workflow-state phrase (${(v.match(STALE_PAGE) || [])[0]})`);
    ok(v.includes(PDF_NOTE), `${slug} Source & provenance (${lbl}): PDF-not-vendored note rendered`);
  }
}

// ── (B1) INTERNAL RECORD RETAINED — the frozen Wave-7 P1 `hidden` object stays in the archival JSON ───────
for (const slug of WAVE7_B4) {
  const h = load(slug).hidden as Record<string, unknown> | undefined;
  ok(!!h && h.discoverable === false && h.sitemapExposed === false && h.publicRoute === false && h.note === "Wave 7 Batch 4 P1 hidden foundation.",
    `${slug}: frozen P1 \`hidden\` record retained intact in provenance.json (internal archival record)`);
}

// ── (B2) PROJECTION — allowlist only, for every essay record ─────────────────────────────────────────────
const within = (o: object, allowed: readonly string[]) => Object.keys(o).every((k) => allowed.includes(k));
const INTERNAL_KEYS = ["hidden", "wave", "batch", "readiness", "shelf", "workId", "sourceTree"];
for (const slug of ALL) {
  const raw = load(slug);
  const pub = toPublicEssayProvenance(raw);
  const json = JSON.stringify(pub);
  ok(within(pub, PUBLIC_TOP_KEYS), `${slug}: public projection top-level keys ⊆ allowlist (${Object.keys(pub).join(",")})`);
  ok(within(pub.source, PUBLIC_SOURCE_KEYS) && within(pub.english, PUBLIC_ENGLISH_KEYS) && within(pub.archiveDerived, PUBLIC_DERIVED_KEYS)
    && pub.source.articleMap.every((r) => within(r, PUBLIC_ARTICLE_MAP_KEYS)), `${slug}: nested public keys ⊆ allowlists`);
  ok(INTERNAL_KEYS.every((k) => !(k in pub)), `${slug}: no internal top-level field in the public projection`);
  ok(!/"hidden"|hidden foundation|"discoverable"|"sitemapExposed"|"publicRoute"|"readiness"/.test(json), `${slug}: projection JSON carries no hidden/workflow state`);
  // Every rendered fact is still there — the projection drops only non-rendered fields.
  ok(pub.source.scanFilename === raw.source.scanFilename && pub.source.articleMap.length === raw.source.articleMap.length
    && pub.archiveDerived.tamilBlocks === raw.archiveDerived.tamilBlocks && JSON.stringify(pub.notes) === JSON.stringify(raw.notes)
    && pub.sourceCommit === raw.sourceCommit, `${slug}: rendered facts preserved by the projection`);
  // Rendering the projection == rendering the full record: nothing the page shows was lost.
  ok(ta(createElement(ArticleSource, { slug, prov: pub })) === ta(createElement(ArticleSource, { slug, prov: raw as never })), `${slug}: public projection renders identically to the full record (Tamil UI)`);
  ok(en(createElement(ArticleSource, { slug, prov: pub })) === en(createElement(ArticleSource, { slug, prov: raw as never })), `${slug}: public projection renders identically to the full record (English UI)`);
}

// ── (B3) ROUTE BOUNDARY — the real page component hands the client ONLY the projection ───────────────────
// Fails if the page ever passes the whole archival record (or any extra field) to ArticleSource again.
for (const slug of ALL) {
  const el = EssaySourcePage({ params: { slug } });
  ok(isValidElement(el) && el.type === ArticleSource, `${slug}: /source page renders ArticleSource`);
  const prov = (isValidElement(el) ? (el.props as { prov: Record<string, unknown> }).prov : {}) as Record<string, unknown>;
  ok(JSON.stringify(prov) === JSON.stringify(toPublicEssayProvenance(load(slug))), `${slug}: /source page passes exactly the public projection to the client`);
  ok(!("hidden" in prov) && within(prov, PUBLIC_TOP_KEYS), `${slug}: /source page client props carry no \`hidden\` / non-allowlisted field`);
}

// ── (B4) BUILT PUBLIC ARTIFACTS — HTML + RSC payload of every essay /source page ─────────────────────────
const APP = path.join(root, ".next/server/app/essays");
if (!fs.existsSync(APP)) {
  fail.push("no production build found (.next/server/app/essays) — run `npm run build` first; the serialized-HTML check cannot be skipped");
  checks++;
} else {
  const LEAK = /\\?"hidden\\?"\s*:|hidden foundation|\\?"discoverable\\?"\s*:|\\?"sitemapExposed\\?"\s*:|\\?"publicRoute\\?"\s*:|\\?"readiness\\?"\s*:|\\?"sourceTree\\?"\s*:/;
  for (const slug of ALL) {
    for (const ext of ["html", "rsc"]) {
      const f = path.join(APP, slug, `source.${ext}`);
      const exists = fs.existsSync(f);
      ok(exists, `${slug}: built /source.${ext} exists`);
      if (!exists) continue;
      const body = fs.readFileSync(f, "utf8");
      const raw = load(slug);
      // Positive control: the file really contains the serialized props (so the absence check is meaningful).
      ok(body.includes(raw.source.scanFilename) && body.includes(raw.sourceCommit), `${slug}: built /source.${ext} carries the serialized public provenance`);
      ok(!LEAK.test(body), `${slug}: built /source.${ext} has no internal hidden/workflow state (${(body.match(LEAK) || [])[0]})`);
      ok(!STALE_PAGE.test(body), `${slug}: built /source.${ext} has no stale workflow-state note (${(body.match(STALE_PAGE) || [])[0]})`);
    }
  }
}

if (fail.length) {
  console.error(`\nessay-public-provenance — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 60)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nessay-public-provenance — ${checks} checks, 0 failed`);
console.log(`  ${ALL.length} essay /source pages · notes durable (5 Wave-6 B6 + 6 Wave-7 B4) · frozen P1 hidden records retained internally · client props == allowlist projection · built HTML/RSC free of hidden/workflow state`);
