/**
 * Wave 4 P4 — poetry cross-witness REGRESSION validator.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave4-p4-poetry-witnesses.ts
 *
 * P3 created the two witness relations and the bidirectional public links; P4 locks the SEMANTICS so
 * a future change cannot silently deduplicate, merge, overwrite, mis-target or mis-describe the two
 * INDEPENDENT source witnesses. It exercises the REAL resolver (`witnessCounterparts` /
 * `resolveWitnessLinks`), not a re-implementation, and pins the generated payload hashes so P4 is
 * proven to change no content.
 *
 * The Thennan standalone carries an owner-directed, witness-local editorial exception on scan 151.
 * That omitted source word is NEVER reproduced here — this file refers to it only generically.
 *
 * Needs no source clone: witness integrity is a property of the registry, the resolver and the
 * already-vendored payloads.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { POETRY_WITNESS_RELATIONS, witnessCounterparts, POEM_SLUGS, POETRY_PUBLICATION_SLUGS } from "../data/poems";
import type { PoetryPublication, PoetryPublicationProvenance, Poem, PoemProvenance } from "../data/poems";
import { resolveWitnessLinks } from "../lib/witness";
import { publishedWorks } from "../data/library";

let pass = 0;
const failures: string[] = [];
const check = (label: string, cond: boolean) => (cond ? pass++ : failures.push(label));
const eq = <T,>(label: string, a: T, b: T) =>
  JSON.stringify(a) === JSON.stringify(b) ? pass++ : failures.push(`${label}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`);

const ROOT = process.cwd();
const sha = (p: string) => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, p))).digest("hex");
const readJson = <T,>(p: string): T => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf-8"));
const poemsSrc = fs.readFileSync(path.join(ROOT, "data/poems.ts"), "utf-8");
const witnessSrc = fs.readFileSync(path.join(ROOT, "lib/witness.ts"), "utf-8");
const noteSrc = fs.readFileSync(path.join(ROOT, "components/WitnessNote.tsx"), "utf-8");

const KAALAP = "kaalap-pezhaiyum-kavithai-saaviyum";

// The two relations this phase locks. Written out so the test asserts against a fixed expectation,
// never against whatever the registry happens to hold.
const EXPECTED = [
  {
    id: "idhayathai-thanthidu-anna--kalaignarin-kavithaigal--item-01",
    a: { slug: "idhayathai-thanthidu-anna" },
    b: { slug: "kalaignarin-kavithaigal", itemSlug: "give-me-your-heart-anna" },
  },
  {
    id: "thennan-kathai--kalaignarin-kavithaigal--item-02",
    a: { slug: "thennan-kathai" },
    b: { slug: "kalaignarin-kavithaigal", itemSlug: "the-tale-of-the-southerner" },
  },
] as const;

// ---- REGISTRY: exactly two, exact ids, exact endpoints -------------------------------------------
eq("exactly two witness relations", POETRY_WITNESS_RELATIONS.length, 2);
{
  const ids = POETRY_WITNESS_RELATIONS.map((r) => r.id);
  eq("exactly two relation ids", ids.length, 2);
  eq("relation ids are unique", new Set(ids).size, 2);
  eq("the two stable ids are exactly the authorized ones", [...ids].sort(), EXPECTED.map((e) => e.id).sort());
  for (const id of ids) check(`id ${JSON.stringify(id)} is non-empty and not index-based`, id.length > 0 && !/^\d+$/.test(id));
  for (const e of EXPECTED) {
    const r = POETRY_WITNESS_RELATIONS.find((x) => x.id === e.id);
    check(`relation ${e.id} exists`, !!r);
    if (!r) continue;
    eq(`relation ${e.id} kind`, r.relation, "same-canonical-poem-alternate-witness");
    eq(`relation ${e.id} endpoint A`, { slug: r.a.slug, itemSlug: r.a.itemSlug }, { slug: e.a.slug, itemSlug: undefined });
    eq(`relation ${e.id} endpoint B`, { slug: r.b.slug, itemSlug: r.b.itemSlug }, { slug: e.b.slug, itemSlug: e.b.itemSlug });
    check(`relation ${e.id} carries a bilingual note`, !!r.publicNote?.ta && !!r.publicNote?.en);
  }
  const key = (ep: { slug: string; itemSlug?: string }) => `${ep.slug} ${ep.itemSlug ?? ""}`;
  const pairKey = (r: (typeof POETRY_WITNESS_RELATIONS)[number]) => [key(r.a), key(r.b)].sort().join("|");
  eq("no duplicate endpoint pair", new Set(POETRY_WITNESS_RELATIONS.map(pairKey)).size, POETRY_WITNESS_RELATIONS.length);
  const endpointCounts = new Map<string, number>();
  for (const r of POETRY_WITNESS_RELATIONS) for (const ep of [r.a, r.b]) endpointCounts.set(key(ep), (endpointCounts.get(key(ep)) ?? 0) + 1);
  check("no endpoint participates in a second relation", Array.from(endpointCounts.values()).every((n) => n === 1));
  check("no relation targets Kaalap Pezhai", !POETRY_WITNESS_RELATIONS.some((r) => [r.a.slug, r.b.slug].includes(KAALAP)));
}

// ---- STRUCTURAL FAIL-CLOSED: no malformed relation may exist in the committed registry -----------
for (const r of POETRY_WITNESS_RELATIONS) {
  check(`relation ${r.id}: endpoints are not identical (no self-relation)`, !(r.a.slug === r.b.slug && (r.a.itemSlug ?? "") === (r.b.itemSlug ?? "")));
  check(`relation ${r.id}: both endpoints carry a slug`, !!r.a.slug && !!r.b.slug);
  const isPub = (ep: { slug: string; itemSlug?: string }) => (POETRY_PUBLICATION_SLUGS as readonly string[]).includes(ep.slug);
  const isStandalone = (ep: { slug: string; itemSlug?: string }) => (POEM_SLUGS as readonly string[]).includes(ep.slug) && !ep.itemSlug;
  check(`relation ${r.id}: one standalone endpoint and one publication item`, (isStandalone(r.a) && isPub(r.b) && !!r.b.itemSlug) || (isStandalone(r.b) && isPub(r.a) && !!r.a.itemSlug));
}

// ---- ENDPOINT EXISTENCE: every endpoint corresponds to real registered data ---------------------
{
  const works = publishedWorks();
  for (const r of POETRY_WITNESS_RELATIONS) {
    for (const ep of [r.a, r.b]) {
      check(`endpoint ${ep.slug}${ep.itemSlug ? "/" + ep.itemSlug : ""}: work is published`, works.some((w) => w.slug === ep.slug));
      if (ep.itemSlug) {
        const pub = readJson<PoetryPublication>(`public/data/poems/${ep.slug}/publication.json`);
        check(`endpoint item ${ep.slug}/${ep.itemSlug}: exists in the publication roster`, pub.items.some((i) => i.slug === ep.itemSlug));
      } else {
        check(`standalone endpoint ${ep.slug}: is in POEM_SLUGS`, (POEM_SLUGS as readonly string[]).includes(ep.slug));
      }
    }
  }
}

// ---- BIDIRECTIONAL RESOLUTION: all four directions, exactly one counterpart each, none self ------
{
  const directions: [string, string | undefined, string][] = [
    ["idhayathai-thanthidu-anna", undefined, "/poems/kalaignarin-kavithaigal/give-me-your-heart-anna"],
    ["kalaignarin-kavithaigal", "give-me-your-heart-anna", "/poems/idhayathai-thanthidu-anna"],
    ["thennan-kathai", undefined, "/poems/kalaignarin-kavithaigal/the-tale-of-the-southerner"],
    ["kalaignarin-kavithaigal", "the-tale-of-the-southerner", "/poems/thennan-kathai"],
  ];
  for (const [slug, itemSlug, expectedHref] of directions) {
    const counterparts = witnessCounterparts(slug, itemSlug);
    eq(`witnessCounterparts(${slug}${itemSlug ? "/" + itemSlug : ""}) returns exactly one`, counterparts.length, 1);
    const links = resolveWitnessLinks(slug, itemSlug);
    eq(`resolveWitnessLinks(${slug}${itemSlug ? "/" + itemSlug : ""}) returns exactly one`, links.length, 1);
    eq(`link resolves to ${expectedHref}`, links[0]?.href, expectedHref);
    const c = counterparts[0]?.counterpart;
    check(`counterpart of ${slug}${itemSlug ? "/" + itemSlug : ""} is not itself`, !!c && !(c.slug === slug && (c.itemSlug ?? undefined) === (itemSlug ?? undefined)));
    check(`counterpart of ${slug} is not Kaalap`, !!c && c.slug !== KAALAP);
    check(`link carries a stable relation id`, EXPECTED.some((e) => e.id === links[0]?.id));
  }
  for (const [slug, itemSlug] of [[KAALAP, "the-common-world"], ["anaiya-vilakku-anna", undefined], ["marathi", undefined]] as [string, string | undefined][]) {
    eq(`no witness link for the unrelated endpoint ${slug}${itemSlug ? "/" + itemSlug : ""}`, resolveWitnessLinks(slug, itemSlug).length, 0);
  }
}

// ---- PUBLIC NOTE SEMANTICS: no forbidden implication, in either language -------------------------
{
  const FORBIDDEN = /identical|same text|exact copy|corrected|definitive|\boriginal\b|replacement|supersed|preferred/i;
  const TA_FORBIDDEN = /ஒரே\s*உரை|அச்சொப்பு|திருத்த|மேலான|முந்து|மாற்றிடு/;
  for (const r of POETRY_WITNESS_RELATIONS) {
    check(`relation ${r.id}: English note claims no identity/supersession`, !FORBIDDEN.test(r.publicNote.en));
    check(`relation ${r.id}: Tamil note claims no identity/supersession`, !TA_FORBIDDEN.test(r.publicNote.ta));
    check(`relation ${r.id}: English note states another witness is available`, /another source witness/i.test(r.publicNote.en));
    check(`relation ${r.id}: Tamil note states another witness is available`, r.publicNote.ta.includes("மற்றொரு மூல ஆதாரப் பதிப்பும்"));
  }
}

// ---- ARCHITECTURE: registry-driven, generic, no title-matching, no merge fields -----------------
{
  const relTypeBlock = /export interface PoetryWitnessRelation \{([\s\S]*?)\n\}/.exec(poemsSrc)?.[1] ?? "";
  for (const forbidden of ["preferredWitness", "canonical", "authority", "precedence", "supersedes", "merge", "sync", "body", "text:", "equivalent", "sameText"]) {
    check(`the relation model has no ${forbidden} field`, !new RegExp(`\\n\\s*${forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(relTypeBlock));
  }
  for (const slug of ["idhayathai-thanthidu-anna", "thennan-kathai", "give-me-your-heart-anna", "the-tale-of-the-southerner"]) {
    check(`witness.ts hard-codes no relation slug (${slug})`, !witnessSrc.includes(slug));
    check(`WitnessNote hard-codes no relation slug (${slug})`, !noteSrc.includes(slug));
  }
  const counterpartFn = /export function witnessCounterparts[\s\S]*?\n\}/.exec(poemsSrc)?.[0] ?? "";
  check("witnessCounterparts matches on endpoint identity, not titles", /e\.slug === slug/.test(counterpartFn) && !/title/i.test(counterpartFn));
  check("the resolver does not compare bodies to dedup", !/elements|byteEqual/.test(witnessSrc));
  check("WitnessNote keys on the relation id", /key=\{l\.id\}/.test(noteSrc));
  check("WitnessNote renders whatever links it is given (no relation-count assumption)", /links\.map\(/.test(noteSrc));
}

// ---- INDEPENDENCE: Idhayathai --------------------------------------------------------------------
{
  eq("standalone idhayathai poem.json is byte-identical", sha("public/data/poems/idhayathai-thanthidu-anna/poem.json"), "6833738340243833b712479e017f25294bb0e45b701d66d060a77f634c3e64f7");
  eq("standalone idhayathai provenance.json is byte-identical", sha("public/data/poems/idhayathai-thanthidu-anna/provenance.json"), "d06a664052178762372d42727c95620a3c3a88159f85b56e43a095e8a401e930");
  const standalone = readJson<Poem>("public/data/poems/idhayathai-thanthidu-anna/poem.json");
  const anth = readJson<PoetryPublication>("public/data/poems/kalaignarin-kavithaigal/publication.json");
  const item01 = anth.items.find((i) => i.slug === "give-me-your-heart-anna")!;
  check("the anthology witness item 01 exists and is separately generated", !!item01 && item01.ordinal === 1);
  eq("standalone English title stays 'Lend Me Your Heart, Anna'", standalone.title.en, "Lend Me Your Heart, Anna");
  eq("anthology witness English title stays 'Give Me Your Heart, Anna'", item01.titleEn, "Give Me Your Heart, Anna");
  check("the two released English titles differ (no normalization)", standalone.title.en !== item01.titleEn);
  const stLines = standalone.tamil.elements.filter((e) => e.kind === "line").length;
  const anLines = item01.tamil.elements.filter((e) => e.kind === "line").length;
  check("both witnesses carry substantial, independent Tamil bodies", stLines > 5 && anLines > 5);
}

// ---- INDEPENDENCE: Thennan (witness-local editorial exception isolation) -------------------------
{
  const standalone = readJson<Poem>("public/data/poems/thennan-kathai/poem.json");
  const standaloneProv = readJson<PoemProvenance>("public/data/poems/thennan-kathai/provenance.json");
  const anth = readJson<PoetryPublication>("public/data/poems/kalaignarin-kavithaigal/publication.json");
  const anthProv = readJson<PoetryPublicationProvenance>("public/data/poems/kalaignarin-kavithaigal/provenance.json");
  const item02 = anth.items.find((i) => i.slug === "the-tale-of-the-southerner")!;
  check("standalone Thennan carries its witness-local editorial exception", Array.isArray(standalone.editorialExceptions) && standalone.editorialExceptions.length === 1);
  eq("the omitted source word is declared NOT reproduced in the standalone", standalone.editorialExceptions?.[0]?.omittedTermReproduced, false);
  check("the anthology item 02 carries NO editorial-exception metadata", !("editorialExceptions" in item02));
  check("the standalone and anthology witnesses have different controlling scans", standaloneProv.source.scanFilename !== anthProv.source.scanFilename);
  eq("Thennan standalone still resolves its counterpart", resolveWitnessLinks("thennan-kathai").length, 1);
  eq("anthology item 02 still resolves its counterpart", resolveWitnessLinks("kalaignarin-kavithaigal", "the-tale-of-the-southerner").length, 1);
  check("anthology item 02 payload carries no editorial-exception language", !/editorialException|owner-directed|omitted without replacement/i.test(JSON.stringify(item02)));
}

// ---- PAYLOAD REGRESSION PINS: P4 changes no generated content ------------------------------------
{
  const pins: [string, string][] = [
    ["public/data/poems/idhayathai-thanthidu-anna/poem.json", "6833738340243833b712479e017f25294bb0e45b701d66d060a77f634c3e64f7"],
    ["public/data/poems/idhayathai-thanthidu-anna/provenance.json", "d06a664052178762372d42727c95620a3c3a88159f85b56e43a095e8a401e930"],
  ];
  for (const [p, h] of pins) eq(`${p} byte-identical`, sha(p), h);
  for (const p of [
    "public/data/poems/anaiya-vilakku-anna/poem.json",
    "public/data/poems/marathi/poem.json",
    "public/data/poems/thennan-kathai/poem.json",
    "public/data/poems/kaalap-pezhaiyum-kavithai-saaviyum/publication.json",
    "public/data/poems/kaalap-pezhaiyum-kavithai-saaviyum/provenance.json",
    "public/data/poems/kalaignarin-kavithaigal/publication.json",
    "public/data/poems/kalaignarin-kavithaigal/provenance.json",
  ]) check(`${p} exists and is readable`, fs.existsSync(path.join(ROOT, p)) && sha(p).length === 64);
}

if (failures.length) {
  console.error(`\nwave4-p4-poetry-witnesses — ${pass} assertions passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  x " + f);
  process.exit(1);
}
console.log(`\nwave4-p4-poetry-witnesses — ${pass} assertions passed, 0 failed`);
console.log("  2 relations - 4 directions - Idhayathai + Thennan independence - payloads byte-pinned");
