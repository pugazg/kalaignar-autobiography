/**
 * Wave 7 — B5a / B5b / B6 / Kuraloviyam — P3 ROUTE validator (stage-aware; fails closed).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave7-b5-b6-k-p3-routes.ts
 *
 * Route facts that hold at every phase from P3 on:
 *   • the speech routes (`/speeches/<slug>` + `/source`) prerender each of the 100 new speeches EXACTLY ONCE, and
 *     the new slugs set-equal the frozen manifest (no foreign slug, no duplicate static param);
 *   • Kuraloviyam has `/kuraloviyam`, `/kuraloviyam/source` and one `/kuraloviyam/<unit>` for each of the 308
 *     reading units (set-equal to the vendored index; no route for any of the six intake Parts);
 *   • every route resolves to a non-empty payload through the REAL page component, and a foreign id 404s;
 *   • new routes = 200 speech + 310 Kuraloviyam = 510. After a build, the prerender manifest carries all 510 and
 *     the totals are exactly the frozen baseline (4276 prerendered / 4271 HTML) + 510.
 * Hidden stage (before P4): no new route is in the sitemap. At P4 the sitemap is owned by the P4 validator.
 */
import fs from "node:fs";
import path from "node:path";
import { isValidElement } from "react";
import { generateStaticParams as speechParams, default as SpeechPage } from "../app/speeches/[slug]/page";
import { generateStaticParams as speechSourceParams, default as SpeechSourcePage } from "../app/speeches/[slug]/source/page";
import { generateStaticParams as kParams, default as KUnitPage } from "../app/kuraloviyam/[unit]/page";
import KLanding from "../app/kuraloviyam/page";
import KSource from "../app/kuraloviyam/source/page";
import { SPEECH_SLUGS } from "../data/speeches";
import { WAVE6_SPEECH_SLUGS } from "../lib/speeches-wave6-routes";
import { WAVE7_SPEECH_SLUGS } from "../lib/speeches-wave7-routes";
import { LIBRARY_WORKS } from "../data/library";
import sitemap from "../app/sitemap";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const readJSON = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const BASELINE_BUILD = { prerender: 4276, html: 4271 };

const manifest = readJSON("data/internal/wave7/b5-b6-speeches-manifest.json") as { works: { slug: string }[] };
const NEW = manifest.works.map((w) => w.slug);
eq([...WAVE7_SPEECH_SLUGS].sort(), [...NEW].sort(), "WAVE7_SPEECH_SLUGS == frozen manifest (100)");
const sp = speechParams().map((p) => p.slug), ss = speechSourceParams().map((p) => p.slug);
eq(sp.length, new Set(sp).size, "speech reader params: no duplicate static param");
eq(ss.length, new Set(ss).size, "speech source params: no duplicate static param");
eq([...sp].sort(), Array.from(new Set<string>([...SPEECH_SLUGS, ...WAVE6_SPEECH_SLUGS, ...WAVE7_SPEECH_SLUGS])).sort(), "speech params == SPEECH_SLUGS ∪ Wave-6 ∪ Wave-7 (no foreign slug)");
eq([...ss].sort(), [...sp].sort(), "every speech reader route has exactly one source route");
for (const s of NEW) ok(sp.filter((x) => x === s).length === 1 && ss.filter((x) => x === s).length === 1, `${s}: reader + source route exactly once`);
for (const s of NEW) {
  const r = SpeechPage({ params: { slug: s } }), q = SpeechSourcePage({ params: { slug: s } });
  ok(isValidElement(r) && isValidElement(q), `${s}: reader and source pages resolve`);
  ok(fs.statSync(path.join(root, "public/data/speeches", s, "speech.json")).size > 1000, `${s}: route payload non-empty`);
}
const throws404 = (f: () => unknown) => { try { f(); return false; } catch (e) { return /NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK|404/.test(String((e as Error).message ?? e) + String((e as { digest?: string }).digest ?? "")); } };
ok(throws404(() => SpeechPage({ params: { slug: "pazhaiya-varalarum-ilaiya-thalaimuraiyum" } })), "C37 duplicate workspace slug has no route (404)");
ok(throws404(() => SpeechPage({ params: { slug: "kalaivanar-nsk-memorial-day-audio-06" } })), "Audio-06 has no route (404)");
ok(throws404(() => SpeechPage({ params: { slug: "irulum-oliyum" } })), "இருளும் ஒளியும் has no route (404)");

const kidx = readJSON("public/data/kuraloviyam/index.json") as { units: { id: string }[] };
const kp = kParams().map((p) => p.unit);
eq(kp.length, 308, "Kuraloviyam: 308 unit routes");
eq(new Set(kp).size, 308, "Kuraloviyam: no duplicate unit param");
eq(kp, kidx.units.map((u) => u.id), "Kuraloviyam unit routes == vendored index, in reading order");
ok(!kp.some((u) => /part/i.test(u)), "Kuraloviyam: no route for any intake Part");
for (const u of kp) {
  const el = KUnitPage({ params: { unit: u } });
  ok(isValidElement(el) && ((el.props as { unit: { pages: unknown[] } }).unit.pages.length > 0), `kuraloviyam/${u}: resolves with pages`);
}
ok(isValidElement(KLanding()) && isValidElement(KSource()), "Kuraloviyam landing + source pages resolve");
ok(throws404(() => KUnitPage({ params: { unit: "part-001" } })) && throws404(() => KUnitPage({ params: { unit: "entry-301" } })), "foreign Kuraloviyam unit ids 404");

const NEW_ROUTES = [...NEW.flatMap((s) => [`/speeches/${s}`, `/speeches/${s}/source`]), "/kuraloviyam", "/kuraloviyam/source", ...kp.map((u) => `/kuraloviyam/${u}`)];
eq(NEW_ROUTES.length, 510, "new routes = 200 speech + 310 Kuraloviyam");
const published = LIBRARY_WORKS.some((w) => w.id === "kuraloviyam");
if (!published) {
  const urls = (sitemap() as { url: string }[]).map((e) => new URL(e.url).pathname);
  ok(NEW_ROUTES.every((r) => !urls.includes(r)), "hidden stage: no new route in the sitemap");
}
const PM = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(PM)) {
  const routes = Object.keys(JSON.parse(fs.readFileSync(PM, "utf8")).routes);
  for (const r of NEW_ROUTES) ok(routes.includes(r), `built: ${r} prerendered`);
  const html = (function count(d: string): number { return fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : e.name.endsWith(".html") ? 1 : 0), 0); })(path.join(root, ".next/server/app"));
  // Hidden (P3): +510 direct routes. Published (P4): + the two முத்துக் குளியல் collection landings = +512.
  const expected = 510 + (published ? 2 : 0);
  if (published) for (const c of ["/collections/muthukkuliyal-part-1", "/collections/muthukkuliyal-part-2"]) ok(routes.includes(c), `built: ${c} prerendered`);
  eq({ prerender: routes.length, html }, { prerender: BASELINE_BUILD.prerender + expected, html: BASELINE_BUILD.html + expected }, `build totals == frozen baseline + ${expected}`);
} else console.log("  (no .next build present — built-route checks skipped; CI runs this after Build)");

if (fail.length) {
  console.error(`\nwave7-b5-b6-k-p3-routes — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b5-b6-k-p3-routes — ${checks} checks, 0 failed (${published ? "P4 published" : "hidden"})`);
console.log("  510 new routes: 100 speeches × (reader + source) + Kuraloviyam landing, source and 308 units · set-equal · exactly once · non-empty · foreign ids 404");
