/**
 * Wave 8 P3 — INDEPENDENT direct-route validator (direct but undiscovered). Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave8-p3-routes.ts
 *
 * The intended route set is re-derived here straight from the frozen internal data (data/internal/wave8/*.json) — not
 * from the P2 reader models and not from the manifest generator — and compared with:
 *   1. the committed route manifest (data/internal/wave8/wave8-p3-routes.json);
 *   2. the REAL generateStaticParams() of every route module that serves the cohort;
 *   3. actual page resolution — every one of the 483 routes is resolved and rendered through its page module, and
 *      fabricated ids must hit notFound();
 *   4. after `npm run build`: the prerender manifest (exactly +483 over the measured clean-P2 baseline), the built HTML /
 *      RSC payload of all 483 pages (no hidden-record field crosses to the client), and the sitemap (no Wave-8 URL).
 * Plus the P3 publication boundary: nothing under public/, Murasoli landing/indexes still Vols 48–54, no catalogue /
 * PLAY_SLUGS membership, and public Vol-48 navigation never reaching into hidden Vol 47.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import * as MurasoliRoute from "../app/murasoli/[id]/page";
import * as PlayLandingRoute from "../app/plays/[slug]/page";
import * as PlaySceneRoute from "../app/plays/[slug]/[scene]/page";
import * as PlaySourceRoute from "../app/plays/[slug]/source/page";
import * as SangatamilLandingRoute from "../app/sangatamil/page";
import * as SangatamilSectionRoute from "../app/sangatamil/[section]/page";
import * as SangatamilSourceRoute from "../app/sangatamil/source/page";
import sitemap from "../app/sitemap";
import { PLAY_SLUGS } from "../data/plays";
import { LIBRARY_WORKS } from "../data/library";

let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const root = process.cwd();
const readJSON = <T,>(rel: string): T => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const same = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);
const sorted = (a: string[]) => [...a].sort();
const visible = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ");
const render = (el: ReactElement) => renderToStaticMarkup(createElement(LangProvider, { initialLang: "ta", children: el }));
/** Resolve a page module: the rendered HTML, or "404" when the module calls notFound(). */
function resolve(Page: (p: { params: Record<string, string> }) => unknown, params: Record<string, string>): { html: string | null; element: ReactElement | null; notFound: boolean } {
  try {
    const element = Page({ params }) as ReactElement;
    return { html: render(element), element, notFound: false };
  } catch (e) {
    const err = e as { digest?: string; message?: string };
    if (err?.digest === "NEXT_NOT_FOUND" || err?.message === "NEXT_NOT_FOUND") return { html: null, element: null, notFound: true };
    throw e;
  }
}
// Hidden-record fields that must never reach a client component (props / RSC payload). (`sourceLimitation` is matched
// only in its hidden P1 shape `{kind, note, visualNotes}`; the public provenance projection's own
// `sourceLimitation: {scan, statementTa, statementEn}` is durable public text.)
const RAW_FIELDS = /"(releaseState|apparatus|annotations|currentCheckpoint|verification|provenanceIds|tamilStatus|englishStatus|visualFidelity|sourceLimitation":\{"kind|locatedBy|chapterDialect|printedNumberUniqueInVolume|assembledFromVerifiedPages|sourceConditionScans|englishReview|secondaryEnglishWitnessUsed|translationType|dialect|workTree|repoTree)"/;

// ══ 1. Independent derivation from the frozen internal data ═════════════════════════════════════════════════════
type P1Letter = { routeSlug: string; volume: number; printedNumber: number; pdfPages: [number, number]; qualification?: { missingPrintedPages: number[] } };
const letters: P1Letter[] = [42, 43, 44, 45, 46, 47].flatMap((v) => readJSON<{ letters: P1Letter[] }>(`data/internal/wave8/murasoli/volume-${v}.json`).letters);
const ore = readJSON<{ slug: string; units: { id: string; partId: string; printedSceneNumber: number }[]; parts: { id: string; headingTa: string | null }[] }>("data/internal/wave8/ore-mutham/ore-mutham.json");
const sg = readJSON<{ slug: string; sections: { seq: number; id: string }[] }>("data/internal/wave8/sangatamil/sangatamil.json");
// The book's reading order within each volume is its page order; the part order is main play, then the comedy section.
const oreUnits = [...ore.units].sort((a, b) => ore.parts.findIndex((p) => p.id === a.partId) - ore.parts.findIndex((p) => p.id === b.partId) || a.printedSceneNumber - b.printedSceneNumber);
const EXPECT = {
  murasoli: [...letters].sort((a, b) => a.volume - b.volume || a.pdfPages[0] - b.pdfPages[0]).map((l) => `/murasoli/${l.routeSlug}`),
  oreMutham: [`/plays/${ore.slug}`, `/plays/${ore.slug}/source`, ...oreUnits.map((u) => `/plays/${ore.slug}/${u.id}`)],
  sangatamil: [`/${sg.slug}`, `/${sg.slug}/source`, ...[...sg.sections].sort((a, b) => a.seq - b.seq).map((s) => `/${sg.slug}/${s.id}`)],
};
const EXPECT_ALL = [...EXPECT.murasoli, ...EXPECT.oreMutham, ...EXPECT.sangatamil];
ok(EXPECT.murasoli.length === 342 && EXPECT.oreMutham.length === 35 && EXPECT.sangatamil.length === 106 && EXPECT_ALL.length === 483, `derived cohorts 342/35/106 = 483 (got ${EXPECT.murasoli.length}/${EXPECT.oreMutham.length}/${EXPECT.sangatamil.length})`);
ok(new Set(EXPECT_ALL).size === 483, "all 483 derived routes unique");
ok(oreUnits.filter((u) => u.partId === ore.parts[0].id).map((u) => u.printedSceneNumber).join() === Array.from({ length: 30 }, (_, i) => i + 1).join() && oreUnits.filter((u) => u.partId === ore.parts[1].id).map((u) => u.printedSceneNumber).join() === "1,2,3", "ore-mutham source structure: main 1–30, then the separately numbered comedy section 1–3");

// ══ 2. Committed manifest ═══════════════════════════════════════════════════════════════════════════════════════
const M = readJSON<{ stage: string; discoverable: boolean; sitemapExposed: boolean; counts: Record<string, number>; cohorts: Record<"murasoli" | "oreMutham" | "sangatamil", { routes: string[] }> }>("data/internal/wave8/wave8-p3-routes.json");
ok(M.stage === "P3" && M.discoverable === false && M.sitemapExposed === false, "manifest: stage P3, not discoverable, not in the sitemap");
for (const k of ["murasoli", "oreMutham", "sangatamil"] as const) ok(same(M.cohorts[k].routes, EXPECT[k]), `manifest ${k} routes ≠ the independently derived set (order included)`);
ok(JSON.stringify(M.counts) === JSON.stringify({ murasoli: 342, oreMutham: 35, sangatamil: 106, total: 483, unique: 483 }), `manifest counts ${JSON.stringify(M.counts)}`);

// ══ 3. Real generateStaticParams() ══════════════════════════════════════════════════════════════════════════════
const W8_MURASOLI = /^m4[2-7]-/;
const mParams = (MurasoliRoute.generateStaticParams() as { id: string }[]).map((p) => p.id);
const legacyIdx = readJSON<{ volumes: { volume: number; pages: { id: string }[] }[] }>("public/data/murasoli/index.json");
const legacyLetters = readJSON<{ volumes: { volume: number; letters: { id: string }[] }[] }>("public/data/murasoli/letters-index.json");
const legacyParams = [...legacyIdx.volumes.flatMap((v) => v.pages.map((p) => p.id)), ...legacyLetters.volumes.flatMap((v) => v.letters.map((l) => l.id))];
ok(same(mParams.filter((x) => W8_MURASOLI.test(x)).map((x) => `/murasoli/${x}`), EXPECT.murasoli), "Murasoli generateStaticParams: exactly the 342 Wave-8 route ids, in reading order");
ok(same(mParams.filter((x) => !W8_MURASOLI.test(x)), legacyParams), `Murasoli generateStaticParams: existing Vols 48–54 params unchanged (${legacyParams.length})`);
ok(new Set(mParams).size === mParams.length, "Murasoli params unique");
const slugs = (PlayLandingRoute.generateStaticParams() as { slug: string }[]).map((p) => p.slug);
ok(slugs.filter((s) => s === "ore-mutham").length === 1 && slugs.length === new Set(slugs).size && slugs.length === 11, `play landing params: the 10 public plays + ore-mutham once (${slugs.length})`);
ok((PlaySourceRoute.generateStaticParams() as { slug: string }[]).filter((p) => p.slug === "ore-mutham").length === 1, "play /source params include ore-mutham once");
const scenes = (PlaySceneRoute.generateStaticParams() as { slug: string; scene: string }[]).filter((p) => p.slug === "ore-mutham").map((p) => `/plays/ore-mutham/${p.scene}`);
ok(same(scenes, EXPECT.oreMutham.slice(2)), "play [scene] params for ore-mutham: exactly the 33 source units, in printed order");
ok(!scenes.some((s) => /\/(main-3[1-3]|31|32|33|nagai-suvai-0[4-9])$/.test(s)), "no fabricated scene 31–33 / nagai-suvai-04 param");
const sections = (SangatamilSectionRoute.generateStaticParams() as { section: string }[]).map((p) => `/sangatamil/${p.section}`);
ok(same(sections, EXPECT.sangatamil.slice(2)), "sangatamil [section] params: exactly the 104 source-order sections");
ok((SangatamilSectionRoute as { dynamicParams?: boolean }).dynamicParams === false, "sangatamil [section]: dynamicParams = false");

// ══ 4. Page resolution — every route, and fabricated ids ════════════════════════════════════════════════════════
const propsOf = (el: ReactElement | null) => JSON.stringify(el?.props ?? {});
let resolved = 0;
for (const r of EXPECT.murasoli) {
  const id = r.split("/")[2];
  const out = resolve(MurasoliRoute.default as never, { id });
  if (!out.html) { ok(false, `${r}: does not resolve`); continue; }
  resolved++;
  ok(out.html.includes('data-testid="wave8-letter-body"') && !RAW_FIELDS.test(propsOf(out.element)), `${r}: must render the injected Wave-8 letter from its public projection only`);
  const navLinks = Array.from(out.html.matchAll(/href="\/murasoli\/(m\d\d-[^"]+)"/g)).map((m) => m[1]);
  ok(navLinks.every((x) => W8_MURASOLI.test(x)), `${r}: navigation leaves Volumes 42–47 (${navLinks.filter((x) => !W8_MURASOLI.test(x))})`);
}
const twin = EXPECT.murasoli.filter((r) => /^\/murasoli\/m46-l3637/.test(r));
ok(twin.length === 2 && twin[0] !== twin[1] && twin.every((r) => visible(resolve(MurasoliRoute.default as never, { id: r.split("/")[2] }).html ?? "").includes("3637")), "both Vol-46 printed-3637 letters are distinct routes and both display 3637");
const r3154 = resolve(MurasoliRoute.default as never, { id: "m42-l3154" });
ok(!!r3154.html && visible(r3154.html).includes("3154"), "Vol-42 printed 3154 resolves and displays 3154");
for (const n of [3647, 3648, 3649]) ok(EXPECT.murasoli.includes(`/murasoli/m46-l${n}`) && EXPECT.murasoli.includes(`/murasoli/m47-l${n}`), `${n}: distinct routes in Vol 46 and Vol 47`);
const r3681 = resolve(MurasoliRoute.default as never, { id: "m47-l3681" });
ok(!!r3681.html && r3681.html.includes('data-testid="source-condition"') && r3681.html.includes('data-missing-printed-pages="252"') && !r3681.html.includes('data-printed-page="252"') && r3681.html.includes('data-testid="source-ends"'), "m47-l3681: permanent source-incomplete notice; printed page 252 absent; nothing continued");
for (const fake of ["m42-l3377", "m46-l3636", "m47-l3706", "m41-l3300", "m42-l3364-x"]) ok(resolve(MurasoliRoute.default as never, { id: fake }).notFound, `fabricated /murasoli/${fake} must 404`);
// Public Vol 48: its first letter never links back into hidden Vol 47; all 346 legacy letters render without Wave-8 links.
const firstPublic = legacyLetters.volumes[0].letters[0].id;
const legacyFirst = resolve(MurasoliRoute.default as never, { id: firstPublic });
ok(!!legacyFirst.html && !/href="\/murasoli\/m4[2-7]-/.test(legacyFirst.html), `public first letter ${firstPublic}: no link into hidden Volumes 42–47`);
let legacyLeak = 0;
for (const v of legacyLetters.volumes) for (const l of v.letters) { const h = resolve(MurasoliRoute.default as never, { id: l.id }).html ?? ""; if (/m4[2-7]-l\d/.test(h) || h.includes('data-testid="wave8-letter-body"')) legacyLeak++; }
ok(legacyLeak === 0, `public Vols 48–54 letters reference hidden Wave-8 letters (${legacyLeak})`);

// ஒரே முத்தம்
const oreLanding = resolve(PlayLandingRoute.default as never, { slug: "ore-mutham" });
ok(!!oreLanding.html && oreLanding.html.includes('data-part-id="nagai-suvai-pagudhi"'), "/plays/ore-mutham resolves with its two printed parts");
const oreSource = resolve(PlaySourceRoute.default as never, { slug: "ore-mutham" });
ok(!!oreSource.html && !RAW_FIELDS.test(propsOf(oreSource.element)) && /never renumbered 31–33/.test(visible(oreSource.html)), "/plays/ore-mutham/source resolves from the public projection only");
for (const r of EXPECT.oreMutham.slice(2)) {
  const out = resolve(PlaySceneRoute.default as never, { slug: "ore-mutham", scene: r.split("/")[3] });
  if (!out.html) { ok(false, `${r}: does not resolve`); continue; }
  resolved++;
  const sup = r.includes("nagai-suvai");
  ok(sup ? /நகைச் சுவைப் பகுதி\. · காட்சி [123] \/ 3/.test(visible(out.html)) : /காட்சி \d+ \/ 30/.test(visible(out.html)), `${r}: part-scoped scene label`);
  ok(!RAW_FIELDS.test(propsOf(out.element)), `${r}: hidden-record field in reader props`);
}
resolved += 2;
for (const fake of ["31", "32", "33", "main-31", "main-00", "nagai-suvai-04", "nagai-suvai-31", "scene-1"]) ok(resolve(PlaySceneRoute.default as never, { slug: "ore-mutham", scene: fake }).notFound, `fabricated /plays/ore-mutham/${fake} must 404`);

// சங்கத் தமிழ்
const sgLanding = resolve(SangatamilLandingRoute.default as never, {});
ok(!!sgLanding.html && (sgLanding.html.match(/<li data-section="/g) ?? []).length === 104, "/sangatamil resolves with its 104 contents entries");
const sgSource = resolve(SangatamilSourceRoute.default as never, {});
ok(!!sgSource.html && sgSource.html.includes('data-role="source-limited"') && !/pending/i.test(visible(sgSource.html)) && !RAW_FIELDS.test(propsOf(sgSource.element)), "/sangatamil/source resolves (scan 8 condition, public projection only)");
resolved += 2;
for (const r of EXPECT.sangatamil.slice(2)) {
  const out = resolve(SangatamilSectionRoute.default as never, { section: r.split("/")[2] });
  if (!out.html) { ok(false, `${r}: does not resolve`); continue; }
  resolved++;
  ok(!RAW_FIELDS.test(propsOf(out.element)), `${r}: hidden-record field in reader props`);
  if (out.html.includes('data-scan="8"')) ok(out.html.includes('data-role="source-limited"'), `${r}: scan 8 condition missing`);
}
ok(resolved === 483, `routes resolved: ${resolved} / 483`);
for (const fake of ["105-extra", "001", "section-1", "000-front-matter-2", "104-back-matter"]) ok(resolve(SangatamilSectionRoute.default as never, { section: fake }).notFound, `foreign /sangatamil/${fake} must 404`);

// ══ 5. Publication boundary (P3: direct, undiscovered) ═════════════════════════════════════════════════════════
const sm = (sitemap() as { url: string }[]).map((e) => e.url);
ok(!sm.some((u) => /\/plays\/ore-mutham|\/sangatamil|\/murasoli\/m4[2-7]-/.test(u)), `sitemap carries Wave-8 URLs (${sm.filter((u) => /ore-mutham|sangatamil|m4[2-7]-/.test(u)).length})`);
ok(sm.length === 4779 && new Set(sm).size === 4779, `sitemap 4779 / 0 duplicates (got ${sm.length})`);
ok(!(PLAY_SLUGS as readonly string[]).includes("ore-mutham") && !(LIBRARY_WORKS as { id: string; slug: string }[]).some((w) => w.id === "ore-mutham" || w.id === "sangatamil" || w.slug === "sangatamil"), "no catalogue / PLAY_SLUGS membership at P3");
ok(same(legacyIdx.volumes.map((v) => String(v.volume)), ["48", "49", "50", "51", "52", "53", "54"]) && same(legacyLetters.volumes.map((v) => String(v.volume)), ["48", "49", "50", "51", "52", "53", "54"]) && legacyLetters.volumes.reduce((n, v) => n + v.letters.length, 0) === 346, "Murasoli public indexes (landing, search, progress, cards) still Volumes 48–54 / 346 letters");
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
ok(!walk("public").some((f) => /sangatamil|ore-mutham|m4[2-7]-l\d|wave8/i.test(f)), "no Wave-8 file anywhere under public/");
const libSrc = fs.readFileSync("components/MurasoliLibrary.tsx", "utf8");
ok(!/wave8|m4[2-7]-|volume-4[2-7]/i.test(libSrc) && /\/data\/murasoli\/index\.json/.test(libSrc), "Murasoli landing fetches only the public indexes");

// ══ 6. Built output (requires `npm run build`) ═════════════════════════════════════════════════════════════════
const NEXT = path.join(root, ".next");
const P2_BASELINE = { prerender: 4788, html: 4783 }; // measured on the clean P2 merge e1086f3d (P1 validator's definition)
if (!fs.existsSync(path.join(NEXT, "prerender-manifest.json"))) {
  ok(false, "no production build (.next/prerender-manifest.json) — run `npm run build`; the build checks cannot be skipped");
} else {
  const routes = Object.keys((JSON.parse(fs.readFileSync(path.join(NEXT, "prerender-manifest.json"), "utf8")) as { routes: Record<string, unknown> }).routes);
  const set = new Set(routes);
  const missing = EXPECT_ALL.filter((r) => !set.has(r));
  ok(missing.length === 0, `all 483 Wave-8 routes prerendered (${missing.length} missing: ${missing.slice(0, 5)})`);
  ok(same(sorted(routes.filter((r) => /\/plays\/ore-mutham|^\/sangatamil|\/murasoli\/m4[2-7]-/.test(r))), sorted(EXPECT_ALL)), "no extra Wave-8 route prerendered");
  ok(routes.length === P2_BASELINE.prerender + 483, `prerender routes ${routes.length} = clean-P2 baseline ${P2_BASELINE.prerender} + 483`);
  const html = walk(path.join(NEXT, "server/app")).filter((f) => f.endsWith(".html"));
  ok(html.length === P2_BASELINE.html + 483, `.html files ${html.length} = clean-P2 baseline ${P2_BASELINE.html} + 483`);
  // The built HTML (with its inline RSC payload) of every Wave-8 page: no hidden-record field reaches the client.
  let scanned = 0, leaked: string[] = [];
  for (const r of EXPECT_ALL) {
    const f = path.join(NEXT, "server/app", `${r}.html`);
    if (!fs.existsSync(f)) { leaked.push(`${r} (no html)`); continue; }
    const h = fs.readFileSync(f, "utf8").replace(/\\"/g, '"');
    scanned++;
    if (RAW_FIELDS.test(h)) leaked.push(`${r}: ${h.match(RAW_FIELDS)?.[1]}`);
  }
  ok(scanned === 483 && leaked.length === 0, `built payloads: ${scanned}/483 scanned; hidden fields: ${leaked.slice(0, 4)}`);
}

if (fail.length) {
  console.error(`\nwave8-p3-routes — ${checks} checks, ${fail.length} FAILED`);
  for (const f of fail.slice(0, 50)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`wave8-p3-routes — ${checks} checks, 0 failed`);
console.log("  483 direct routes (Murasoli 342 · ஒரே முத்தம் 35 · சங்கத் தமிழ் 106) derived independently = manifest = generateStaticParams = resolved = prerendered · fabricated ids 404 · sitemap/catalogue/Murasoli landing unchanged · no hidden field in 483 built payloads");
