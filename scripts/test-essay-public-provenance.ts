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
  PUBLIC_TRANSFER_PART_KEYS, PUBLIC_BLOCKER_KEYS, PUBLIC_PROJECT_RIGHTS_KEYS,
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
// RECURSIVE allowlist: every object at every path of the public projection must have its OWN allowlist and
// stay within it. An object at a path with no allowlist means a nested archival structure was forwarded
// wholesale — a failure even if its keys look harmless today. Arrays of strings/numbers are leaf values.
const ALLOW: Record<string, readonly string[]> = {
  "": PUBLIC_TOP_KEYS,
  "source": [...PUBLIC_SOURCE_KEYS, "articleMap", "transferParts"],
  "source.articleMap[]": PUBLIC_ARTICLE_MAP_KEYS,
  "source.transferParts[]": PUBLIC_TRANSFER_PART_KEYS,
  "english": PUBLIC_ENGLISH_KEYS,
  "archiveDerived": PUBLIC_DERIVED_KEYS,
  "blockers[]": PUBLIC_BLOCKER_KEYS,
  "projectRights": PUBLIC_PROJECT_RIGHTS_KEYS,
};
function allowlistViolations(v: unknown, at = "", out: string[] = []): string[] {
  if (Array.isArray(v)) { v.forEach((x) => { if (x !== null && typeof x === "object") allowlistViolations(x, `${at}[]`, out); }); return out; }
  if (v === null || typeof v !== "object") return out;
  const allowed = ALLOW[at];
  if (!allowed) { out.push(`${at || "<root>"}: object has no public allowlist`); return out; }
  for (const [k, x] of Object.entries(v)) {
    if (!allowed.includes(k)) out.push(`${at ? at + "." : ""}${k}: not allowlisted`);
    else allowlistViolations(x, at ? `${at}.${k}` : k, out);
  }
  return out;
}
const INTERNAL_KEYS = ["hidden", "wave", "batch", "readiness", "shelf", "workId", "sourceTree"];
for (const slug of ALL) {
  const raw = load(slug);
  const pub = toPublicEssayProvenance(raw);
  const json = JSON.stringify(pub);
  ok(within(pub, PUBLIC_TOP_KEYS), `${slug}: public projection top-level keys ⊆ allowlist (${Object.keys(pub).join(",")})`);
  ok(within(pub.source, ALLOW["source"]) && within(pub.english, PUBLIC_ENGLISH_KEYS) && within(pub.archiveDerived, PUBLIC_DERIVED_KEYS)
    && pub.source.articleMap.every((r) => within(r, PUBLIC_ARTICLE_MAP_KEYS)), `${slug}: nested public keys ⊆ allowlists`);
  ok(INTERNAL_KEYS.every((k) => !(k in pub)), `${slug}: no internal top-level field in the public projection`);
  const viol = allowlistViolations(pub);
  ok(viol.length === 0, `${slug}: projection is allowlisted at every nesting level (${viol.slice(0, 3).join("; ")})`);
  ok((pub.source.transferParts ?? []).every((r) => within(r, PUBLIC_TRANSFER_PART_KEYS))
    && (pub.blockers ?? []).every((r) => within(r, PUBLIC_BLOCKER_KEYS))
    && (!pub.projectRights || within(pub.projectRights, PUBLIC_PROJECT_RIGHTS_KEYS)), `${slug}: transferParts / blockers / projectRights ⊆ their nested allowlists`);
  ok(!/"hidden"|hidden foundation|"discoverable"|"sitemapExposed"|"publicRoute"|"readiness"/.test(json), `${slug}: projection JSON carries no hidden/workflow state`);
  // Every rendered fact is still there — the projection drops only non-rendered fields.
  ok(pub.source.scanFilename === raw.source.scanFilename && pub.source.articleMap.length === raw.source.articleMap.length
    && pub.archiveDerived.tamilBlocks === raw.archiveDerived.tamilBlocks && JSON.stringify(pub.notes) === JSON.stringify(raw.notes)
    && pub.sourceCommit === raw.sourceCommit, `${slug}: rendered facts preserved by the projection`);
  // Rendering the projection == rendering the full record: nothing the page shows was lost.
  ok(ta(createElement(ArticleSource, { slug, prov: pub })) === ta(createElement(ArticleSource, { slug, prov: raw as never })), `${slug}: public projection renders identically to the full record (Tamil UI)`);
  ok(en(createElement(ArticleSource, { slug, prov: pub })) === en(createElement(ArticleSource, { slug, prov: raw as never })), `${slug}: public projection renders identically to the full record (English UI)`);
}

// ── (B2b) NESTED TRANSFER PARTS — சிந்தனையும் செயலும் (the one split-transfer source) ───────────────────────
// The archive records six facts per transfer part; the page renders three (part, global scan range, SHA-256).
// The other three stay in the archival JSON and must not cross the client boundary.
const TP_SLUG = "sinthanaiyum-seyalum";
const TP_ALL = ["part", "filename", "globalScans", "pdfPages", "bytes", "sha256"];
const TP_DROPPED = ["filename", "pdfPages", "bytes"];
const tpRaw = (load(TP_SLUG).source.transferParts ?? []) as unknown as Record<string, unknown>[];
{
  const tpPub = (toPublicEssayProvenance(load(TP_SLUG)).source.transferParts ?? []) as unknown as Record<string, unknown>[];
  ok(tpRaw.length === 5, `${TP_SLUG}: archival record has 5 transfer parts (found ${tpRaw.length})`);
  ok(tpRaw.every((r) => TP_ALL.every((k) => r[k] !== undefined && r[k] !== null)), `${TP_SLUG}: archival transfer parts retain all six source fields (${TP_ALL.join(", ")})`);
  ok(tpPub.length === tpRaw.length && tpPub.every((r) => Object.keys(r).sort().join() === [...PUBLIC_TRANSFER_PART_KEYS].sort().join()),
    `${TP_SLUG}: public transfer parts carry exactly ${PUBLIC_TRANSFER_PART_KEYS.join(", ")}`);
  ok(tpPub.every((r) => TP_DROPPED.every((k) => !(k in r))), `${TP_SLUG}: public transfer parts carry no ${TP_DROPPED.join(" / ")}`);
  ok(tpPub.every((r, i) => r.part === tpRaw[i].part && r.globalScans === tpRaw[i].globalScans && r.sha256 === tpRaw[i].sha256),
    `${TP_SLUG}: rendered transfer-part facts (part, global scans, SHA-256) preserved exactly`);
  const page = ta(createElement(ArticleSource, { slug: TP_SLUG, prov: toPublicEssayProvenance(load(TP_SLUG)) }));
  ok(tpRaw.every((r) => page.includes(String(r.sha256)) && page.includes(String(r.globalScans))), `${TP_SLUG}: every transfer part's SHA-256 and scan range still render`);
}

// ── (B2c) MUTATION — a new, non-allowlisted field at ANY depth is not forwarded ──────────────────────────────
{
  const SENTINEL = "__NON_ALLOWLISTED_ARCHIVAL_FIELD__";
  const base = load(TP_SLUG);
  const withRights = load("sakkaravarththiyin-thirumagan"); // the one record with blockers + projectRights
  const m = JSON.parse(JSON.stringify({ ...base, blockers: withRights.blockers, projectRights: withRights.projectRights })) as Record<string, any>;
  m.futureInternal = SENTINEL;
  m.source.futureInternal = SENTINEL;
  m.source.futureNested = { note: SENTINEL };
  m.source.articleMap[0].futureInternal = SENTINEL;
  m.source.transferParts[0].futureInternal = SENTINEL;
  m.english.futureInternal = SENTINEL;
  m.archiveDerived.futureInternal = SENTINEL;
  m.blockers[0].futureInternal = SENTINEL;
  m.projectRights.futureInternal = SENTINEL;
  const out = toPublicEssayProvenance(m as EssayProvenance);
  ok(!JSON.stringify(out).includes(SENTINEL), "mutation: fields injected at top/source/articleMap/transferParts/english/archiveDerived/blockers/projectRights are all dropped");
  ok(allowlistViolations(out).length === 0 && (out.blockers?.length ?? 0) > 0 && !!out.projectRights, "mutation: projection stays allowlisted at every level (blockers + projectRights exercised)");
  // The walker itself catches a nested structure forwarded wholesale.
  ok(allowlistViolations({ ...out, source: { ...out.source, transferParts: tpRaw } }).some((v) => /transferParts\[\]\.(filename|pdfPages|bytes)/.test(v)),
    "mutation: forwarding raw transfer-part rows is detected by the recursive allowlist check");
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
  const TP_LEAK = /\\?"(?:filename|pdfPages|bytes)\\?"\s*:/;
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

  // The split-transfer page: non-rendered transfer-part fields are absent from the serialized payload, while the
  // rendered ones (part number, global scan range, SHA-256) are present — a meaningful positive control.
  for (const ext of ["html", "rsc"]) {
    const f = path.join(APP, TP_SLUG, `source.${ext}`);
    if (!fs.existsSync(f)) continue;
    const body = fs.readFileSync(f, "utf8");
    ok(!TP_LEAK.test(body), `${TP_SLUG}: built /source.${ext} serializes no transfer-part filename / pdfPages / bytes (${(body.match(TP_LEAK) || [])[0]})`);
    ok(tpRaw.every((r) => !body.includes(String(r.filename))), `${TP_SLUG}: built /source.${ext} contains no transfer-part PDF filename`);
    ok(tpRaw.every((r) => body.includes(String(r.sha256)) && body.includes(String(r.globalScans))), `${TP_SLUG}: built /source.${ext} still carries every part's SHA-256 + global scan range`);
    ok(tpRaw.every((r) => new RegExp(`\\\\?"part\\\\?"\\s*:\\s*${r.part}\\b`).test(body)), `${TP_SLUG}: built /source.${ext} still carries every part number`);
  }
}

if (fail.length) {
  console.error(`\nessay-public-provenance — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 60)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nessay-public-provenance — ${checks} checks, 0 failed`);
console.log(`  ${ALL.length} essay /source pages · notes durable (5 Wave-6 B6 + 6 Wave-7 B4) · frozen P1 hidden records retained internally · client props == allowlist projection · built HTML/RSC free of hidden/workflow state`);
