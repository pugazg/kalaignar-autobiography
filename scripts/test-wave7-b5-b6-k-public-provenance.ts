/**
 * Wave 7 — B5a / B5b / B6 / Kuraloviyam — PUBLIC SERIALIZATION regression (built HTML + RSC). Fails closed:
 * requires a production build (`npm run build`); CI runs it after the Build step.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave7-b5-b6-k-public-provenance.ts
 *
 * Rule (PR #92/#93): archival provenance ≠ public client payload. For every speech `/source` page (all 117 — the
 * projection sits at the shared route) and for Kuraloviyam's source + every unit page, the served HTML and RSC
 * payload must not serialize internal workflow state (hidden / wave / batch / readiness / discoverable /
 * sitemapExposed / publicRoute / sourceTree) nor the archival records the page never renders
 * (archiveVerification, releaseReadiness, sourceAuthority). Positive controls prove the serialized public
 * provenance IS there. The route boundary is tested too: the real /source page components hand the client
 * exactly the allowlisted projection — a future "pass the whole record" regression fails here.
 * Public notes on the new works must be durable facts only (no phase / gate / hidden-state wording).
 */
import fs from "node:fs";
import path from "node:path";
import { isValidElement } from "react";
import SpeechSourcePage from "../app/speeches/[slug]/source/page";
import KSourcePage from "../app/kuraloviyam/source/page";
import { toPublicSpeechProvenance } from "../lib/speech-public-provenance";
import { toPublicKuraloviyamProvenance } from "../lib/kuraloviyam-public-provenance";
import { SPEECH_SLUGS } from "../data/speeches";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const readJSON = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const LEAK = /\\?"(?:hidden|wave|batch|readiness|discoverable|sitemapExposed|publicRoute|sourceTree|archiveVerification|releaseReadiness|sourceAuthority)\\?"\s*:|hidden foundation/;
const STALE_NOTE = /Wave[\s-]*\d|Batch\s*\d|\bP[0-9]\b|not authori[sz]ed|intentionally absent|Direct reader routes only|direct routes only|hidden foundation|not (?:yet )?(?:published|discoverable|public)/i;

const APP = path.join(root, ".next/server/app");
if (!fs.existsSync(APP)) { console.error("test-wave7-b5-b6-k-public-provenance: no production build (.next/server/app) — run `npm run build` first; this check cannot be skipped"); process.exit(1); }

const sman = readJSON("data/internal/wave7/b5-b6-speeches-manifest.json") as { works: { slug: string }[] };
const NEW_SPEECHES = sman.works.map((w) => w.slug);

// ── Route boundary: the real page components pass exactly the projection ────────────────────────────────
for (const slug of SPEECH_SLUGS) {
  const el = SpeechSourcePage({ params: { slug } });
  const prov = isValidElement(el) ? (el.props as { prov: unknown }).prov : null;
  ok(JSON.stringify(prov) === JSON.stringify(toPublicSpeechProvenance(readJSON(`public/data/speeches/${slug}/provenance.json`))), `${slug}: /source page passes exactly the public projection to the client`);
}
{
  const el = KSourcePage();
  const prov = isValidElement(el) ? (el.props as { prov: unknown }).prov : null;
  ok(JSON.stringify(prov) === JSON.stringify(toPublicKuraloviyamProvenance(readJSON("public/data/kuraloviyam/provenance.json"))), "kuraloviyam: /source page passes exactly the public projection");
}

// ── Built HTML + RSC ─────────────────────────────────────────────────────────────────────────────────────
const built = (rel: string) => ["html", "rsc"].map((ext) => ({ ext, file: path.join(APP, `${rel}.${ext}`) }));
for (const slug of SPEECH_SLUGS) {
  const prov = readJSON(`public/data/speeches/${slug}/provenance.json`);
  for (const { ext, file } of built(`speeches/${slug}/source`)) {
    ok(fs.existsSync(file), `${slug}: built /source.${ext} exists`);
    if (!fs.existsSync(file)) continue;
    const body = fs.readFileSync(file, "utf8");
    const scan = prov.source?.scanFilename ?? prov.audioSource?.filename;
    ok(body.includes(prov.sourceCommit) && (!scan || body.includes(scan)), `${slug}: built /source.${ext} carries the serialized public provenance (positive control)`);
    ok(!LEAK.test(body), `${slug}: built /source.${ext} serializes no internal / non-rendered state (${(body.match(LEAK) || [])[0]})`);
  }
}
for (const rel of ["kuraloviyam/source", "kuraloviyam", ...((readJSON("public/data/kuraloviyam/index.json") as { units: { id: string }[] }).units.map((u) => `kuraloviyam/${u.id}`))]) {
  for (const { ext, file } of built(rel)) {
    ok(fs.existsSync(file), `${rel}: built .${ext} exists`);
    if (!fs.existsSync(file)) continue;
    const body = fs.readFileSync(file, "utf8");
    ok(!LEAK.test(body), `${rel}.${ext}: no internal state serialized (${(body.match(LEAK) || [])[0]})`);
    ok(!/Pass 1|must wait for better source evidence/.test(body), `${rel}.${ext}: no archive workflow wording serialized`);
    if (rel === "kuraloviyam/source") ok(body.includes("d542b4cc3749bf1966e3537d1eb34d421344faf5") && body.includes("TVA_BOK_0065733"), `${rel}.${ext}: positive control — public provenance present`);
  }
}

// ── Durable public notes ─────────────────────────────────────────────────────────────────────────────────
for (const slug of NEW_SPEECHES) {
  const notes: string[] = readJSON(`public/data/speeches/${slug}/provenance.json`).notes ?? [];
  ok(notes.length > 0 && notes.every((n) => !STALE_NOTE.test(n)), `${slug}: public notes are durable source facts only`);
}
{
  const notes: string[] = readJSON("public/data/kuraloviyam/provenance.json").notes;
  ok(notes.length > 0 && notes.every((n) => !STALE_NOTE.test(n)), "kuraloviyam: public notes are durable source facts only");
}

if (fail.length) {
  console.error(`\nwave7-b5-b6-k-public-provenance — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b5-b6-k-public-provenance — ${checks} checks, 0 failed`);
console.log(`  ${SPEECH_SLUGS.length} speech /source pages + Kuraloviyam source/landing/308 units: HTML + RSC free of internal state · route boundary passes exactly the projection · durable notes only`);
