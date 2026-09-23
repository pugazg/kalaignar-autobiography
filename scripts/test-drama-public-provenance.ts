/**
 * Drama public-provenance regression — what every `/plays/<slug>/source` page publishes. Creates NO routes.
 * FAILS CLOSED without a production build (`npm run build`); CI runs it after the Build step.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-drama-public-provenance.ts
 *
 * Defect: the route handed the client component `PlaySource` the WHOLE archival provenance and the WHOLE
 * play payload, so the page serialized — though never rendered — the frozen Wave-7 Batch-2 P1 record on
 * iratha-kanneer / nachuk-koppai (`hidden` {discoverable, sitemapExposed, publicRoute, "… P1 hidden
 * foundation."}, `wave`, `batch`, `readiness`, `shelf`), unrendered archival fields on every play, and the
 * full reading text. The fix is the allowlist projection in lib/play-public-provenance.ts at the route.
 * This test proves, for all 10 Drama works on the shared route:
 *   1. the archival records are UNCHANGED — the frozen P1 fields are still there for the historical validators;
 *   2. the projection is allowlisted at every nesting level; sentinel fields injected at every level are
 *      dropped; a raw nested object substituted into the projection is caught by the recursive walker;
 *   3. the projection renders IDENTICALLY to the archival record (nothing the page shows is lost);
 *   4. the real route component hands `PlaySource` exactly the projections (reverting to raw records fails);
 *   5. nachuk-koppai's qualification (scan 22 / unit 05 permanent source condition) is still published;
 *   6. the BUILT HTML + RSC carry the public provenance (positive control) and none of the internal state.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import PlaySource from "../components/PlaySource";
import PlaySourcePage from "../app/plays/[slug]/source/page";
import {
  toPublicPlayProvenance, toPublicPlayHead, PUBLIC_PLAY_TOP_KEYS, PUBLIC_PLAY_SOURCE_KEYS, PUBLIC_PLAY_DERIVED_KEYS,
  PUBLIC_PLAY_UNRESOLVED_KEYS, PUBLIC_PLAY_WITNESS_KEYS, PUBLIC_PLAY_USER_CONTEXT_KEYS, PUBLIC_PLAY_LAYER_QUAL_KEYS,
  PUBLIC_PLAY_HOLD_KEYS, PUBLIC_PLAY_ENGLISH_KEYS, PUBLIC_PLAY_RIGHTS_KEYS,
} from "../lib/play-public-provenance";
import { PLAY_SLUGS, type Play, type PlayProvenance } from "../data/plays";
import { LIBRARY_WORKS } from "../data/library";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const readJSON = <T,>(p: string): T => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const ta = (el: React.ReactElement) => renderToStaticMarkup(createElement(LangProvider, null, el));
const en = (el: React.ReactElement) => renderToStaticMarkup(createElement(LangProvider, { initialLang: "en", children: el }));
const PLAYS = [...PLAY_SLUGS] as string[];
const W7B2 = ["iratha-kanneer", "nachuk-koppai"];
ok(PLAYS.length === 10 && W7B2.every((s) => PLAYS.includes(s)), `10 Drama works on the shared /source route (found ${PLAYS.length})`);

// Internal-only state (the audit's finding list) — never public.
const INTERNAL = ["hidden", "wave", "batch", "readiness", "discoverable", "sitemapExposed", "publicRoute", "sourceTree", "shelf"];
// Archival fields the page never renders — may stay in the archive, must not cross the boundary.
const NOT_RENDERED = ["sourcePath", "sourcePdfCommitted", "rightsAction", "unlabelledNote", "interpretiveNotes", "translationNotes", "ornaments", "locus", "markerKind", "readingUnits"];
const KEY_RE = (keys: string[]) => new RegExp(`\\\\?"(?:${keys.join("|")})\\\\?"\\s*:`);

// ── Recursive allowlist walker ─────────────────────────────────────────────────────────────────────────
const ALLOW: Record<string, readonly string[]> = {
  "": PUBLIC_PLAY_TOP_KEYS,
  source: PUBLIC_PLAY_SOURCE_KEYS,
  archiveDerived: PUBLIC_PLAY_DERIVED_KEYS,
  "unresolved[]": PUBLIC_PLAY_UNRESOLVED_KEYS,
  "performanceWitnesses[]": PUBLIC_PLAY_WITNESS_KEYS,
  "userSuppliedContext[]": PUBLIC_PLAY_USER_CONTEXT_KEYS,
  pageLayerQualification: PUBLIC_PLAY_LAYER_QUAL_KEYS,
  "sourceConditionHolds[]": PUBLIC_PLAY_HOLD_KEYS,
  english: PUBLIC_PLAY_ENGLISH_KEYS,
  projectRights: PUBLIC_PLAY_RIGHTS_KEYS,
};
function violations(v: unknown, at = "", out: string[] = []): string[] {
  if (Array.isArray(v)) { v.forEach((x) => { if (x !== null && typeof x === "object") violations(x, `${at}[]`, out); }); return out; }
  if (v === null || typeof v !== "object") return out;
  const allowed = ALLOW[at];
  if (!allowed) { out.push(`${at || "<root>"}: object has no public allowlist`); return out; }
  for (const [k, x] of Object.entries(v)) {
    if (!allowed.includes(k)) out.push(`${at ? at + "." : ""}${k}: not allowlisted`);
    else violations(x, at ? `${at}.${k}` : k, out);
  }
  return out;
}

// ── 1–3. Per play: archival retained, projection clean, render identical ─────────────────────────────────
for (const slug of PLAYS) {
  const raw = readJSON<PlayProvenance & Record<string, unknown>>(`public/data/plays/${slug}/provenance.json`);
  const play = readJSON<Play>(`public/data/plays/${slug}/play.json`);
  const pub = toPublicPlayProvenance(raw);
  const head = toPublicPlayHead(play);
  const json = JSON.stringify(pub) + JSON.stringify(head);
  const viol = violations(pub);
  ok(viol.length === 0, `${slug}: projection is allowlisted at every nesting level (${viol.slice(0, 3).join("; ")})`);
  ok(!KEY_RE([...INTERNAL, ...NOT_RENDERED]).test(json) && !/hidden foundation/.test(json), `${slug}: projection carries no internal or unrendered field`);
  ok(JSON.stringify(Object.keys(head).sort()) === JSON.stringify(["descriptor", "slug", "title"]) && !("en" in head.title) && !("readingUnits" in head), `${slug}: play head carries only slug / Tamil title / Tamil descriptor — no reading text`);
  for (const r of [ta, en]) ok(r(createElement(PlaySource, { play: head, prov: pub })) === r(createElement(PlaySource, { play: play as never, prov: raw as never })), `${slug}: PlaySource renders the projections identically to the archival records (${r === ta ? "Tamil" : "English"} UI)`);
}
for (const slug of W7B2) {
  const raw = readJSON<Record<string, unknown>>(`public/data/plays/${slug}/provenance.json`);
  ok(JSON.stringify(raw.hidden) === JSON.stringify({ discoverable: false, sitemapExposed: false, publicRoute: false, note: "Wave 7 Batch 2 P1 hidden foundation." }), `${slug}: frozen P1 \`hidden\` record RETAINED intact in the archival JSON`);
  ok(raw.wave === 7 && raw.batch === 2 && raw.shelf === "drama" && typeof raw.readiness === "string", `${slug}: frozen wave / batch / shelf / readiness RETAINED in the archival JSON`);
}

// ── 2b. Mutation: sentinels at every nesting level are dropped; a raw nested object is caught ────────────
{
  const S = "__NON_ALLOWLISTED_ARCHIVAL_FIELD__";
  const base = readJSON<Record<string, any>>("public/data/plays/nachuk-koppai/provenance.json");
  const silap = readJSON<Record<string, any>>("public/data/plays/silappathikaram-nataka-kappiyam/provenance.json");
  const mani = readJSON<Record<string, any>>("public/data/plays/manimagudam/provenance.json");
  const thiru = readJSON<Record<string, any>>("public/data/plays/thiruvalar-desiyampillai/provenance.json");
  const m = JSON.parse(JSON.stringify({ ...base, unresolved: silap.unresolved, performanceWitnesses: mani.performanceWitnesses, userSuppliedContext: mani.userSuppliedContext, pageLayerQualification: thiru.pageLayerQualification })) as Record<string, any>;
  m.futureInternal = S; m.source.futureInternal = S; m.source.futureNested = { note: S }; m.archiveDerived.futureInternal = S;
  m.unresolved[0].futureInternal = S; m.performanceWitnesses[0].futureInternal = S; m.userSuppliedContext[0].futureInternal = S;
  m.pageLayerQualification.futureInternal = S; m.sourceConditionHolds[0].futureInternal = S; m.english.futureInternal = S; m.projectRights.futureInternal = S;
  const out = toPublicPlayProvenance(m as PlayProvenance);
  ok(!JSON.stringify(out).includes(S), "mutation: sentinels injected at top/source/archiveDerived/unresolved/performanceWitnesses/userSuppliedContext/pageLayerQualification/sourceConditionHolds/english/projectRights are all dropped");
  ok(violations(out).length === 0 && !!out.unresolved && !!out.performanceWitnesses && !!out.userSuppliedContext && !!out.pageLayerQualification && !!out.sourceConditionHolds, "mutation: every optional nested structure exercised and still allowlisted");
  const head = toPublicPlayHead({ ...readJSON<Play>("public/data/plays/nachuk-koppai/play.json"), futureInternal: S } as never);
  ok(!JSON.stringify(head).includes(S) && !JSON.stringify(head).includes("readingUnits"), "mutation: the play head drops everything but slug / title.ta / descriptor.ta");
  ok(violations({ ...out, sourceConditionHolds: base.sourceConditionHolds }).some((v) => /sourceConditionHolds\[\]\.(scene|markerKind|locus)/.test(v)), "mutation: forwarding the raw nested hold rows is caught by the recursive allowlist walker");
  ok(violations({ ...out, source: base.source }).some((v) => /source\.sourcePdfCommitted/.test(v)), "mutation: forwarding the raw source object is caught");
}

// ── 4. Route boundary ────────────────────────────────────────────────────────────────────────────────────
for (const slug of PLAYS) {
  const el = PlaySourcePage({ params: { slug } });
  const props = isValidElement(el) ? (el.props as { play: unknown; prov: unknown }) : { play: null, prov: null };
  ok(isValidElement(el) && el.type === PlaySource, `${slug}: /source route renders PlaySource`);
  ok(JSON.stringify(props.prov) === JSON.stringify(toPublicPlayProvenance(readJSON(`public/data/plays/${slug}/provenance.json`))), `${slug}: the route passes exactly toPublicPlayProvenance(raw)`);
  ok(JSON.stringify(props.play) === JSON.stringify(toPublicPlayHead(readJSON(`public/data/plays/${slug}/play.json`))), `${slug}: the route passes exactly toPublicPlayHead(play) — never the reading payload`);
}

// ── 5. nachuk-koppai qualification — still published, still a permanent source condition ────────────────
{
  const pub = toPublicPlayProvenance(readJSON("public/data/plays/nachuk-koppai/provenance.json"));
  const h = pub.sourceConditionHolds ?? [];
  ok(h.length === 1 && h[0].scan === 22 && h[0].unit === "05", "nachuk-koppai: exactly one hold — scan 22, unit 05 (Scene 5)");
  ok(/single terminal textual source-condition hold/.test(h[0]?.policy ?? "") && /never reconstructed/.test(h[0]?.policy ?? ""), "nachuk-koppai: the hold is published as a permanent source condition, never reconstructed");
  ok(/READY WITH QUALIFICATION/.test(pub.source.sourceConditionNote ?? ""), "nachuk-koppai: the qualification note is published");
  const page = en(createElement(PlaySource, { play: toPublicPlayHead(readJSON("public/data/plays/nachuk-koppai/play.json")), prov: pub }));
  ok(/Documented source-condition holds/.test(page) && /scan<!-- --> <!-- -->22|scan 22/.test(page), "nachuk-koppai: the source page renders the Documented source-condition holds card for scan 22");
  const w = LIBRARY_WORKS.find((x) => x.id === "nachuk-koppai");
  ok(!!w && /scan 22 \/ Scene 5/.test(w.descEn ?? ""), "nachuk-koppai: the catalogue card still discloses the scan 22 / Scene 5 hold");
  for (const s of W7B2) {
    const notes = readJSON<PlayProvenance>(`public/data/plays/${s}/provenance.json`).notes;
    ok(notes.every((n) => !/Wave[\s-]*\d|Batch\s*\d|\bP[0-9]\b|hidden foundation|not authori[sz]ed|intentionally absent|direct routes only|not (?:yet )?(?:published|discoverable)/i.test(n)), `${s}: public notes are durable source facts only`);
  }
}

// ── 6. Built HTML + RSC ──────────────────────────────────────────────────────────────────────────────────
const APP = path.join(root, ".next/server/app/plays");
if (!fs.existsSync(APP)) {
  fail.push("no production build (.next/server/app/plays) — run `npm run build` first; the serialized-HTML check cannot be skipped"); checks++;
} else {
  const LEAK = KEY_RE([...INTERNAL, ...NOT_RENDERED]);
  for (const slug of PLAYS) {
    const raw = readJSON<PlayProvenance>(`public/data/plays/${slug}/provenance.json`);
    for (const ext of ["html", "rsc"]) {
      const f = path.join(APP, slug, `source.${ext}`);
      ok(fs.existsSync(f), `${slug}: built /source.${ext} exists`);
      if (!fs.existsSync(f)) continue;
      const body = fs.readFileSync(f, "utf8");
      ok(body.includes(raw.sourceCommit) && body.includes(raw.source.scanFilename) && body.includes(raw.source.scanSha256), `${slug}: built /source.${ext} carries the serialized public provenance (positive control: commit, scan file, SHA-256)`);
      ok(!LEAK.test(body) && !/hidden foundation/.test(body), `${slug}: built /source.${ext} serializes no internal / unrendered state (${(body.match(LEAK) || [])[0] ?? (/hidden foundation/.test(body) ? "hidden foundation" : "")})`);
    }
  }
  const nb = fs.readFileSync(path.join(APP, "nachuk-koppai", "source.html"), "utf8");
  ok(/single terminal textual source-condition hold/.test(nb), "nachuk-koppai: built page still publishes the scan-22 permanent source condition");
}

if (fail.length) {
  console.error(`\ndrama-public-provenance — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\ndrama-public-provenance — ${checks} checks, 0 failed`);
console.log("  10 Drama /source pages: archival P1 records retained · projection allowlisted at every level (sentinels dropped) · renders identically · route passes exactly the projections · nachuk scan-22 qualification published · built HTML/RSC free of internal state and reading text");
