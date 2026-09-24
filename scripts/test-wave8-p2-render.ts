/**
 * Wave 8 P2 — real React render regression for the three hidden Wave-8 reader layers. Creates NO routes.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave8-p2-render.ts
 *
 * Every Wave-8 reading unit is rendered through the ACTUAL components, in both reading layers, fed only through the
 * public-safe projections (lib/wave8-public-provenance.ts):
 *   • Murasoli 42–47 — MurasoliLetterReader with the injected model: 342 letters × Tamil / English;
 *   • ஒரே முத்தம் — PlayLanding, PlaySource, PlayReader: 33 units × Tamil / English, parts and prev/next;
 *   • சங்கத் தமிழ் — SangatamilLanding, SangatamilSource, SangatamilReader: 104 sections × Tamil / English, 497 scans.
 * Adversarial guards: no undefined/null/NaN leak; no workflow prose; no archival comment in a body; printed numbers
 * exact (two 3637s, 3154 kept, no 3377, 3647–3649 in two volumes); 3681 source-incomplete and never continued;
 * part-scoped scene identity (never 31–33); citation / body separation; ornaments stay ornaments; scan 8 stays
 * source-limited; illustration descriptions labelled while printed text on a mixed page stays text.
 * Unchanged-behaviour locks: the 346 public Murasoli letters and the 10 public Drama works render byte-identically to
 * the pre-P2 components (SSR digests computed from main b53a1c3b's components).
 */
import fs from "node:fs";
import crypto from "node:crypto";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import MurasoliLetterReader from "../components/MurasoliLetterReader";
import PlayLanding from "../components/PlayLanding";
import PlayReader from "../components/PlayReader";
import PlaySource from "../components/PlaySource";
import SangatamilLanding from "../components/SangatamilLanding";
import SangatamilReader from "../components/SangatamilReader";
import SangatamilSource from "../components/SangatamilSource";
import { loadWave8MurasoliLetters, toLetterMeta } from "../lib/wave8-murasoli-reader";
import { toOreMuthamPlay } from "../lib/wave8-ore-mutham-adapter";
import { toSangatamilWork, loadSangatamilP1 } from "../lib/wave8-sangatamil-reader";
import { playLandingDescription, playSceneDescription } from "../lib/play-metadata";
import { publicApparatus } from "../lib/wave8-public-text";
import { toPublicPlayHead, toPublicPlayProvenance } from "../lib/play-public-provenance";
import {
  toPublicWave8Letter, toPublicOreMuthamSource, toPublicSangatamilSection, toPublicSangatamilSummary,
  toPublicSangatamilContents, toPublicSangatamilProvenance,
} from "../lib/wave8-public-provenance";
import type { Play } from "../data/plays";

// SSR digests of the PRE-P2 components (main b53a1c3b), computed once with those exact component files. A change in
// the existing public Murasoli letters' or Drama works' rendered markup fails here.
const LEGACY_MURASOLI_DIGEST = "ee5e5398e8126a8fd21a6e86741e787798f0cefcbeb5cc915826ca6137752efd";
const LEGACY_DRAMA_DIGEST = "2b82d6cf2106ff41a875581a4d063cfd0db9d9d204ce2c103fa2e77d2df2c405";

let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const r = (el: ReactElement, lang: "ta" | "en" = "ta") => renderToStaticMarkup(createElement(LangProvider, { initialLang: lang, children: el }));
const visible = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const count = (h: string, re: RegExp) => (h.match(new RegExp(re.source, "g")) || []).length;
const hasTamil = (s: string) => /[஀-௿]/.test(s);
const hasLatin = (s: string) => /[A-Za-z]{3,}/.test(s);
/** Does the rendered text contain this source line (Markdown markers and spacing ignored)? */
const shows = (h: string, line: string) => { const probe = line.replace(/^[#>\s*-]+/, "").replace(/[*_`\\]/g, "").replace(/\s+/g, "").slice(0, 16); return visible(h).replace(/\s+/g, "").includes(probe); };
const LEAK = /\bundefined\b|>null<|\bNaN\b|\[object Object\]/;
/** Workflow / audit / closure prose that must never be public reader text (an independent list, rendered-text level). */
const WORKFLOW = /Immediate authority|audited (canonical )?Tamil|complete audited|canonical Tamil|closed Tamil|source-closed|\blocked (Volume|conventions|scene|Tamil)|user[- ](source )?adjudicat|Pass-\d|\bWFV\b|\bno OCR\b|secondary English witness|alignment review|globally blocked|formerly held|terminal (Tamil )?(source )?hold|reproduced below|\.md`|scenes\/[a-z-]+\d+\.md|TRANSLATION_MANIFEST|Gate [A-Z]\d/;
const COMMENT = /<!--|&lt;!--|-->|--&gt;/;
/**
 * Review / lifecycle-stage wording (English and Tamil) that constructed public surfaces — layer notes, translator-note
 * and provenance panels, source pages, public projections — must never carry. Independent of lib/wave8-public-text.ts.
 * Durable provenance ("verified directly against the scanned printed volume", "the Tamil original remains
 * authoritative", "no published English witness was used") is NOT lifecycle wording and is not matched.
 */
const LIFECYCLE = /source-checking|bilingual alignment|alignment (review|is complete|complete)|editorial review|translated and reviewed|drafted and reviewed|(draft|drafted) or review|completion\/release status|release status|released after|release-ready|review (is )?complete|audit (is )?complete|\bapproved\b|closure|hold remains|இருமொழி இணைவு|பதிப்பாய்வு|முடிந்து வெளியிடப்பட்டது|ஒப்பிட்டுச் சரிபார்த்து, இருமொழி/i;
// Detector self-test: each reviewed lifecycle phrase is caught on its own; durable provenance is not.
for (const x of ["released after source-checking, bilingual alignment and editorial review", "source-checking", "bilingual alignment", "editorial review", "33 / 33 scenes translated and reviewed against the verified Tamil", "The source repository's completion/release status is an editorial and archival judgement", "no source-condition hold remains in the reading text", "drafted and reviewed WITHOUT any published English edition", "இருமொழி இணைவு மற்றும் பதிப்பாய்வு முடிந்து வெளியிடப்பட்டது"]) ok(LIFECYCLE.test(x), `detector: lifecycle phrase not caught — ${x}`);
for (const x of ["The Tamil text is verified directly against the scanned printed volume", "131 / 131 page records verified against the scan", "The Tamil original remains authoritative.", "No missing wording is reconstructed.", "No secondary/published English witness was used for this translation."]) ok(!LIFECYCLE.test(x), `detector: durable provenance wrongly flagged — ${x}`);
/** Visible text of every element carrying one of these data-testid values. */
const surfaces = (h: string, ids: string[]) => ids.flatMap((id) => {
  const out: string[] = [];
  const re = new RegExp(`<(\\w+)[^>]*data-testid="${id}"[^>]*>`, "g");
  for (const m of Array.from(h.matchAll(re))) { const end = h.indexOf(`</${m[1]}>`, m.index! + m[0].length); out.push(visible(h.slice(m.index!, end < 0 ? undefined : end))); }
  return out;
}).join(" | ");
/**
 * Hard workflow markers never allowed anywhere — including inside a released translation body, which is carried
 * exactly as released and therefore not sentence-filtered (a translator's in-text aside may still call the source
 * "the audited Tamil"; that wording is listed for review, never rewritten here).
 */
const HARD_WORKFLOW = /Immediate authority|closed Tamil|source-closed|user[- ](source )?adjudicat|Pass-\d|\bWFV\b|scenes\/[a-z-]+\d+\.md|TRANSLATION_MANIFEST|Gate [A-Z]\d|alignment review|globally blocked/;
const BODY = /<div[^>]*data-testid="wave8-letter-body"[\s\S]*?(?=<p[^>]*data-testid="wave8-provenance")/;
const guard = (h: string, label: string) => {
  ok(!LEAK.test(visible(h)), `${label}: undefined/null/NaN leak`);
  const apparatus = h.replace(BODY, "");
  ok(!WORKFLOW.test(visible(apparatus)), `${label}: workflow/audit prose rendered — ${visible(apparatus).match(WORKFLOW)?.[0]}`);
  ok(!HARD_WORKFLOW.test(visible(h)), `${label}: workflow marker rendered — ${visible(h).match(HARD_WORKFLOW)?.[0]}`);
  ok(!COMMENT.test(h), `${label}: archival comment in the rendered page`);
};
const all = (h: string, re: RegExp) => Array.from(h.matchAll(re));

// ══ B1 — Murasoli Volumes 42–47 ══════════════════════════════════════════════════════════════════════════════════
{
  const letters = loadWave8MurasoliLetters();
  ok(letters.length === 342, `B1: 342 letters (got ${letters.length})`);
  let ta = 0, en = 0;
  for (let i = 0; i < letters.length; i++) {
    const l = letters[i];
    const content = toPublicWave8Letter(l);
    const meta = toLetterMeta(l);
    const props = { letter: meta, prev: i > 0 ? toLetterMeta(letters[i - 1]) : null, next: i < letters.length - 1 ? toLetterMeta(letters[i + 1]) : null, alsoInVolume: [], content };
    const hTa = r(createElement(MurasoliLetterReader, props));
    const hEn = r(createElement(MurasoliLetterReader, { ...props, initialShowEn: true }), "en");
    const label = `B1 ${l.sourceId}`;
    guard(hTa, `${label} ta`); guard(hEn, `${label} en`);
    // Tamil: every source page segment, in order, with its scan and printed-page attribution.
    const segs = [...all(hTa, /data-pdf-page="(\d+)"/g)].map((m) => Number(m[1]));
    ok(JSON.stringify(segs) === JSON.stringify(l.tamilPages.map((p) => p.pdfPage)), `${label}: Tamil page segments ${segs} ≠ model`);
    ok(hasTamil(visible(hTa)) && l.tamilPages.every((p) => p.text.split("\n").filter((x) => x.replace(/[#>*\s-]/g, "").length > 8).slice(0, 3).every((x) => shows(hTa, x))), `${label}: Tamil text not rendered`);
    if (hasTamil(visible(hTa))) ta++;
    // English: the released translation, apart from its translator's note.
    const enLines = l.english.text.split("\n").filter((x) => /[A-Za-z]{4}/.test(x) && x.replace(/[#>*\s-]/g, "").length > 12);
    ok(hasLatin(visible(hEn)) && enLines.length > 0 && [enLines[0], enLines[Math.floor(enLines.length / 2)], enLines[enLines.length - 1]].every((x) => shows(hEn, x)), `${label}: English body not rendered`);
    if (hasLatin(visible(hEn))) en++;
    ok(!hTa.includes('data-block="english"'), `${label}: English leaked into the Tamil layer`);
    // Constructed UI surfaces (never the released translation body): no review / lifecycle wording, Tamil or English UI.
    for (const [lang, h] of [["ta", hTa], ["en", hEn], ["ta-ui/en-layer", r(createElement(MurasoliLetterReader, { ...props, initialShowEn: true }))]] as const) {
      const sf = surfaces(h, ["layer-note", "translator-note", "wave8-provenance", "source-condition", "date-from-contents"]);
      ok(sf.length > 0 && !LIFECYCLE.test(sf), `${label} ${lang}: lifecycle wording on a constructed surface — ${sf.match(LIFECYCLE)?.[0]}`);
    }
    // Printed number exactly as printed.
    ok(visible(hTa).includes(String(l.printedNumber)), `${label}: printed number ${l.printedNumber} not displayed`);
    // Source condition.
    if (l.qualification) {
      ok(hTa.includes('data-testid="source-condition"') && hTa.includes(`data-missing-printed-pages="${l.qualification.missingPrintedPages.join(",")}"`) && hEn.includes('data-testid="source-condition"'), `${label}: source-incomplete banner missing`);
      ok(hTa.includes('data-testid="source-ends"') && hEn.includes('data-testid="source-ends"'), `${label}: source-ends marker missing`);
    } else ok(!hTa.includes('data-testid="source-condition"'), `${label}: source-condition banner on a complete letter`);
  }
  ok(ta === 342 && en === 342, `B1: Tamil ${ta}/342, English ${en}/342`);
  // Named source facts, at the rendered level.
  const v46 = letters.filter((l) => l.volume === 46 && l.printedNumber === 3637);
  ok(v46.length === 2 && v46[0].id !== v46[1].id && v46[0].title.ta !== v46[1].title.ta, "B1: Vol 46 prints 3637 twice — two distinct identities and titles");
  ok(!letters.some((l) => l.volume === 42 && l.printedNumber === 3377), "B1: no 3377 is fabricated");
  const v42 = letters.filter((l) => l.volume === 42), k = v42.findIndex((l) => l.printedNumber === 3154);
  ok(k > 0 && v42[k - 1].printedNumber === 3376 && v42[k + 1].printedNumber === 3378, "B1: 3154 kept where the book prints it (between 3376 and 3378)");
  for (const n of [3647, 3648, 3649]) ok(letters.filter((l) => l.printedNumber === n).map((l) => l.volume).sort().join() === "46,47", `B1: ${n} is printed in Vol 46 and Vol 47`);
  const l3681 = letters.find((l) => l.volume === 47 && l.printedNumber === 3681)!;
  const h3681 = r(createElement(MurasoliLetterReader, { letter: toLetterMeta(l3681), prev: null, next: null, alsoInVolume: [], content: toPublicWave8Letter(l3681) }));
  const last = l3681.tamilPages[l3681.tamilPages.length - 1];
  ok(last.printedPage === 251 && !l3681.tamilPages.some((p) => p.printedPage === 252), "B1 3681: surviving pages end at printed 251; page 252 absent");
  ok(!h3681.includes('data-printed-page="252"') && [...all(h3681, /data-printed-page="(\d+)"/g)].map((m) => m[1]).pop() === "251", "B1 3681: no page-252 segment rendered; the last segment is printed page 251");
  ok(visible(h3681).trimEnd().length > 0 && !/அன்புள்ள,\s*மு\.க\./.test(last.text), "B1 3681: no closing/signature supplied after the missing page");
  // Public Vols 48–54: the pre-P2 reader output is unchanged (legacy fetch path, no injected content).
  const idx = JSON.parse(fs.readFileSync("public/data/murasoli/letters-index.json", "utf8"));
  const flat = idx.volumes.flatMap((v: { volume: number; letters: object[] }) => v.letters.map((l) => ({ ...l, volume: v.volume }))) as { id: string; volume: number }[];
  ok(flat.length === 346 && flat.every((l) => l.volume >= 48 && l.volume <= 54), `B1: public Murasoli remains Vols 48–54, 346 letters (got ${flat.length})`);
  const h = crypto.createHash("sha256");
  flat.forEach((l, i) => {
    const inVol = flat.filter((x) => x.volume === l.volume), vi = inVol.findIndex((x) => x.id === l.id);
    const also = [1, 2, 3].map((q) => inVol[(vi + q) % inVol.length]).filter((x) => x.id !== l.id);
    for (const lang of ["ta", "en"] as const) h.update(r(createElement(MurasoliLetterReader, { letter: l as never, prev: (i > 0 ? flat[i - 1] : null) as never, next: (i < flat.length - 1 ? flat[i + 1] : null) as never, alsoInVolume: also as never }), lang));
  });
  const legacy = h.digest("hex");
  if (process.env.PRINT_DIGESTS) console.log("LEGACY_MURASOLI", legacy);
  ok(legacy === LEGACY_MURASOLI_DIGEST, `B1: the 346 public letters (Vols 48–54) no longer render as before P2 (${legacy})`);
}

// ══ B2 — ஒரே முத்தம் ════════════════════════════════════════════════════════════════════════════════════════════
{
  const play = toOreMuthamPlay();
  const u = play.readingUnits;
  ok(u.length === 33 && play.parts?.length === 2, "B2: 33 units in two printed parts");
  ok(u.map((x) => x.slug).join() === [...Array.from({ length: 30 }, (_, i) => `main-${String(i + 1).padStart(2, "0")}`), "nagai-suvai-01", "nagai-suvai-02", "nagai-suvai-03"].join(), "B2: order main-01…main-30 → nagai-suvai-01…03");
  const sup = play.parts!.find((p) => p.headingTa !== null)!;
  ok(u.filter((x) => x.partId === sup.id).map((x) => x.order).join() === "1,2,3", "B2: the comedy section is numbered 1–3 (never 31–33)");
  ok(u.every((x) => !!x.partId), "B2: every unit carries its part");
  // Landing
  for (const lang of ["ta", "en"] as const) {
    const h = r(createElement(PlayLanding, { play }), lang);
    guard(h, `B2 landing ${lang}`);
    ok(count(h, /data-testid="play-part-group"/) === 2 && h.includes(`data-part-id="${sup.id}"`) && h.includes(esc(sup.headingTa!)), `B2 landing ${lang}: two part groups, the comedy section under its printed heading`);
    ok(!/\b(31|32|33)\b/.test(visible(h).replace(/scans?[^A-Za-z஀-௿]*/g, "")) || !/காட்சி 3[123]|Scene 3[123]/.test(visible(h)), `B2 landing ${lang}: no scene 31–33`);
  }
  ok(/30 source-numbered scenes, followed by a separately titled comedy section \(நகைச் சுவைப் பகுதி\.\) with 3 independently numbered scenes/.test(playLandingDescription(play)), "B2: landing description states 30 + a titled comedy section with 3 scenes");
  // Source / provenance (public projection only)
  const { play: head, prov } = toPublicOreMuthamSource();
  const provText = JSON.stringify(prov);
  ok(!LIFECYCLE.test(provText), `B2 source projection: lifecycle wording — ${provText.match(LIFECYCLE)?.[0]}`);
  ok(/^English translation available for all 33 source scenes/.test(prov.english.status), `B2 source projection: english.status is a durable availability fact (${prov.english.status})`);
  for (const lang of ["ta", "en"] as const) {
    const h = r(createElement(PlaySource, { play: head, prov }), lang);
    guard(h, `B2 source ${lang}`);
    ok(h.includes(esc(prov.source.scanSha256)) && /never renumbered 31–33/.test(visible(h)), `B2 source ${lang}: scan identity + part-numbering note`);
    ok(!LIFECYCLE.test(visible(h)), `B2 source ${lang}: lifecycle wording rendered — ${visible(h).match(LIFECYCLE)?.[0]}`);
  }
  // 33 units × Tamil / English
  for (let i = 0; i < u.length; i++) {
    const s = u[i], prev = i > 0 ? u[i - 1] : null, next = i < u.length - 1 ? u[i + 1] : null;
    const hTa = r(createElement(PlayReader, { play, scene: s, prev, next }));
    const hEn = r(createElement(PlayReader, { play, scene: s, prev, next, initialShowEn: true }), "en");
    const label = `B2 ${s.slug}`;
    guard(hTa, `${label} ta`); guard(hEn, `${label} en`);
    ok(hasTamil(visible(hTa)) && hasLatin(visible(hEn)), `${label}: Tamil and English render`);
    ok(hTa.includes(`data-part-id="${s.partId}"`) && hEn.includes(`data-part-id="${s.partId}"`), `${label}: part identity shown`);
    const sc = s.partId === sup.id;
    ok(sc ? visible(hTa).includes(`${sup.headingTa} · காட்சி ${s.order} / 3`) && visible(hEn).includes(`Comedy Section · Scene ${s.order} of 3`) : visible(hTa).includes(`காட்சி ${s.order} / 30`), `${label}: part-scoped scene label`);
    // (The translation notes may SAY "not main Scene 32"; the scene's own labels never number it so.)
    const labelsOnly = (h: string) => visible(h.replace(/<aside[\s\S]*?<\/aside>/g, ""));
    ok(!/காட்சி (31|32|33)\b|Scene (31|32|33)\b|காட்சி \d+ \/ 33|of 33\b/.test(labelsOnly(hTa) + labelsOnly(hEn)), `${label}: never 31–33 / never "of 33"`);
    ok((!prev || hTa.includes(`/plays/ore-mutham/${prev.slug}"`)) && (!next || hTa.includes(`/plays/ore-mutham/${next.slug}"`)), `${label}: prev/next in printed order`);
    ok(sc || !playSceneDescription(play, s).includes("of 33"), `${label}: metadata scoped to its part`);
    // Speakers exactly as printed; nothing labelled that the edition leaves unlabelled.
    for (const x of s.tamil.units) if (x.kind === "dialogue" && x.speakerAsPrinted) ok(hTa.includes(esc(`${x.speakerAsPrinted}${x.speakerSeparator}`)), `${label}: printed label ${x.speakerAsPrinted} not rendered`);
    // Translation notes: apart from the play, public-safe.
    if (s.english.notes.length) ok(hEn.includes("not part of Kalaignar") && !hTa.includes(esc(s.english.notes[0].text.slice(2, 40))), `${label}: notes shown apart (English only)`);
  }
  ok(u[29].slug === "main-30" && u[30].slug === "nagai-suvai-01", "B2: main-30 → nagai-suvai-01");
  const first = r(createElement(PlayReader, { play, scene: u[30], prev: u[29], next: u[31] }));
  ok(visible(first).includes("நகைச் சுவைப் பகுதி. · காட்சி 1 / 3"), "B2: first comedy scene reads `நகைச் சுவைப் பகுதி. · காட்சி 1 / 3`");
  // Workflow translation-note regression: the source apparatus carries process prose; the public reader never does.
  const p1 = JSON.parse(fs.readFileSync("data/internal/wave8/ore-mutham/ore-mutham.json", "utf8"));
  ok(p1.units.filter((x: { english: { apparatus: string } }) => /Immediate authority/.test(x.english.apparatus)).length === 33, "B2: (fixture) the hidden apparatus does carry workflow prose");
  ok(u.every((x) => x.english.notes.every((n) => !WORKFLOW.test(n.text))), "B2: no workflow prose in any public translation note");
  const probe = publicApparatus("- Immediate authority: closed Tamil `../../scenes/main-99.md`; no OCR was used.\n- `சீமான்` is rendered as `aristocrat`.\n- Scan 9 is now verified after user source adjudication. The line is kept.");
  ok(probe === "- `சீமான்` is rendered as `aristocrat`.\n- The line is kept.", `B2: public-note filter keeps clarifications verbatim, drops workflow (${JSON.stringify(probe)})`);
  // The 10 existing Drama works: the pre-P2 components' output is unchanged (no parts → no part UI).
  const h = crypto.createHash("sha256");
  const slugs = fs.readdirSync("public/data/plays").sort();
  ok(slugs.length === 10, `B2: 10 public Drama works (got ${slugs.length})`);
  for (const slug of slugs) {
    const pl = JSON.parse(fs.readFileSync(`public/data/plays/${slug}/play.json`, "utf8")) as Play;
    const pv = JSON.parse(fs.readFileSync(`public/data/plays/${slug}/provenance.json`, "utf8"));
    ok(!pl.parts, `B2 ${slug}: existing work declares no parts`);
    for (const lang of ["ta", "en"] as const) {
      h.update(r(createElement(PlayLanding, { play: pl }), lang));
      h.update(r(createElement(PlaySource, { play: toPublicPlayHead(pl), prov: toPublicPlayProvenance(pv) }), lang));
    }
    h.update(playLandingDescription(pl));
    pl.readingUnits.forEach((s, i) => {
      h.update(playSceneDescription(pl, s));
      for (const lang of ["ta", "en"] as const) for (const e of [false, true]) {
        const out = r(createElement(PlayReader, { play: pl, scene: s, prev: i > 0 ? pl.readingUnits[i - 1] : null, next: i < pl.readingUnits.length - 1 ? pl.readingUnits[i + 1] : null, initialShowEn: e }), lang);
        if (out.includes('data-testid="play-part"')) fail.push(`B2 ${slug}/${s.slug}: part UI on a single-part play`);
        h.update(out);
      }
    });
  }
  const drama = h.digest("hex");
  if (process.env.PRINT_DIGESTS) console.log("LEGACY_DRAMA", drama);
  ok(drama === LEGACY_DRAMA_DIGEST, `B2: the 10 public Drama works no longer render as before P2 (${drama})`);
}

// ══ B3 — சங்கத் தமிழ் ═══════════════════════════════════════════════════════════════════════════════════════════
{
  const w = toSangatamilWork();
  const S = w.sections;
  ok(S.length === 104 && S.filter((s) => s.kind === "section").length === 102, "B3: 104 reading units (front matter + 102 sections + back cover)");
  const contents = toPublicSangatamilContents(w);
  for (const lang of ["ta", "en"] as const) {
    const h = r(createElement(SangatamilLanding, { work: contents }), lang);
    guard(h, `B3 landing ${lang}`);
    ok(count(h, /<li data-section="/) === 104, `B3 landing ${lang}: 104 contents entries`);
    ok(count(h, /data-testid="illustration-scans"/) === S.filter((s) => s.illustrationScans.length).length, `B3 landing ${lang}: illustration scans listed per section`);
    const src = r(createElement(SangatamilSource, { prov: toPublicSangatamilProvenance(w) }), lang);
    guard(src, `B3 source ${lang}`);
    ok(/497/.test(visible(src)) && /115/.test(visible(src)) && /\b4\b/.test(visible(src)) && src.includes('data-role="source-limited"'), `B3 source ${lang}: 497 pages · 115 + 4 provenance · scan 8 condition`);
    ok(!/pending/i.test(visible(src)), `B3 source ${lang}: scan 8 never described as pending`);
    ok(!LIFECYCLE.test(visible(src)) && !LIFECYCLE.test(visible(h)), `B3 landing/source ${lang}: lifecycle wording`);
  }
  const scansSeen = new Set<number>(); const citationsSeen = new Set<string>();
  for (let i = 0; i < S.length; i++) {
    const s = toPublicSangatamilSection(S[i]);
    const nav = { prev: i > 0 ? toPublicSangatamilSummary(S[i - 1]) : null, next: i < S.length - 1 ? toPublicSangatamilSummary(S[i + 1]) : null };
    for (const [lang, showEn] of [["ta", false], ["en", true]] as const) {
      const h = r(createElement(SangatamilReader, { titleTa: w.title.ta, section: s, ...nav, initialShowEn: showEn }), lang);
      const label = `B3 ${s.slug} ${lang}`;
      guard(h, label);
      ok(!LIFECYCLE.test(surfaces(h, ["layer-note"])), `${label}: lifecycle wording in the layer note`);
      const scans = [...all(h, /<section[^>]*data-scan="(\d+)"/g)].map((m) => Number(m[1]));
      ok(JSON.stringify(scans) === JSON.stringify(s.pages.map((p) => p.scan)), `${label}: scans ${scans} ≠ ${s.pages.map((p) => p.scan)}`);
      scans.forEach((x) => scansSeen.add(x));
      const blocks = s.pages.flatMap((p) => (showEn ? p.english : p.tamil));
      ok(count(h, /data-role="/) - count(h, /data-role="source-limited"/) === blocks.length, `${label}: every block rendered once (${count(h, /data-role="/)} vs ${blocks.length})`);
      // Hard lineation: one rendered line per source line.
      ok(count(h, /data-line=""/) === blocks.reduce((n, b) => n + (b.kind === "table" ? 0 : b.lines.length), 0) + blocks.filter((b) => b.kind === "table").reduce((n, b) => n + b.lines.filter((l) => !/^\|\s*-/.test(l) && l.replace(/[|\s]/g, "")).map((l) => l.split("|").slice(1, -1).reduce((q, c) => q + c.split(/\s*<br>\s*/).length, 0)).reduce((a, x) => a + x, 0), 0), `${label}: hard line breaks not preserved one-to-one`);
      // Citation / body separation.
      for (const m of all(h, /<[a-z0-9]+ [^>]*data-role="(source-citation|source-note)"[^>]*>/g)) ok(/data-citation-ids="[A-Z]\d{3}/.test(m[0]), `${label}: provenance block without its record id`);
      for (const m of all(h, /<[a-z0-9]+ [^>]*data-citation-ids="([^"]+)"[^>]*>/g)) { ok(/data-role="(source-citation|source-note)"/.test(m[0]), `${label}: record-linked block rendered as ${m[0].match(/data-role="([^"]+)"/)?.[1]}`); m[1].split(" ").forEach((id: string) => citationsSeen.add(id)); }
      // Ornaments stay ornaments.
      for (const m of all(h, /<[a-z0-9]+ [^>]*data-kind="ornament"[^>]*>/g)) ok(/data-role="ornament"/.test(m[0]) && !/data-citation-ids/.test(m[0]), `${label}: ornament rendered as ${m[0].match(/data-role="([^"]+)"/)?.[1]}`);
      // Printed matter never presented as archive description on a scan that is not an illustration.
      for (const pg of s.pages.filter((q) => !q.illustration)) {
        const a = h.indexOf(`data-scan="${pg.scan}"`), nxt = s.pages.find((q) => q.scan === pg.scan + 1);
        const seg = h.slice(a, nxt ? h.indexOf(`data-scan="${nxt.scan}"`) : undefined);
        ok(!/data-role="(text|quotation|gloss|gloss-heading|section-title|printed-heading|right-aligned-fragment|source-citation|source-note)"[^>]*data-presentation="archival"/.test(seg), `${label}: printed matter on scan ${pg.scan} presented as archive description`);
      }
      // Archive descriptions never read as the book's text.
      for (const m of all(h, /<[a-z0-9]+ [^>]*data-role="(archival-label|archival-description|copy-specific-marking)"[^>]*>/g)) ok(/data-presentation="archival"/.test(m[0]), `${label}: archival ${m[1]} presented as text`);
      // Scan 8.
      if (s.pages.some((p) => p.scan === 8)) {
        const p8 = h.slice(h.indexOf('data-scan="8"'), h.indexOf('data-scan="9"'));
        ok(p8.includes('data-role="source-limited"') && !/data-role="(text|quotation|front-matter-text|gloss)"/.test(p8), `${label}: scan 8 must be heading + archive description + source-condition statement only`);
        ok(!/pending/i.test(visible(p8)), `${label}: scan 8 described as pending`);
      } else ok(!h.includes('data-role="source-limited"'), `${label}: source-limited statement outside scan 8`);
    }
  }
  ok(scansSeen.size === 497, `B3: all 497 scans rendered (got ${scansSeen.size})`);
  ok(citationsSeen.size === 119, `B3: all 119 provenance records rendered (got ${citationsSeen.size})`);
  // Illustration handling: a pure illustration scan is framed as one; a mixed scan keeps printed text as text.
  const pure = S.flatMap((s) => s.pages).find((p) => p.illustration && p.pureIllustration)!;
  const pureSec = S.find((s) => s.pages.includes(pure))!;
  const hp = r(createElement(SangatamilReader, { titleTa: w.title.ta, section: toPublicSangatamilSection(pureSec), prev: null, next: null }));
  const hpPage = hp.slice(hp.indexOf(`data-scan="${pure.scan}"`), hp.indexOf(`data-scan="${pure.scan + 1}"`) > 0 ? hp.indexOf(`data-scan="${pure.scan + 1}"`) : undefined);
  ok(hpPage.includes('data-testid="illustration-page"') && !/data-presentation="text"/.test(hpPage), `B3: pure illustration scan ${pure.scan} framed as the archive's description only`);
  // Synthetic mixed page (the frozen records hold none): a printed Tamil line added to an illustration scan must
  // render as text, while the archive's description of the image stays labelled.
  const p1 = loadSangatamilP1();
  const mix = JSON.parse(JSON.stringify(p1));
  const mp = mix.pages[pure.scan - 1];
  mp.tamil.blocks.push({ type: "paragraph", role: "text", lines: ["மானம் காத்த மறவன் வீரம் பாடுவோம்"] });
  const w2 = toSangatamilWork(mix);
  const mixPage = w2.sections.flatMap((s) => s.pages)[pure.scan - 1];
  ok(!mixPage.pureIllustration && mixPage.tamil[mixPage.tamil.length - 1].presentation === "text" && mixPage.tamil.slice(0, -1).every((b) => b.presentation === "archival"), "B3: mixed illustration scan — printed line stays text, the archive's description stays archival");
  const hm = r(createElement(SangatamilReader, { titleTa: w.title.ta, section: toPublicSangatamilSection(w2.sections.find((s) => s.pages.some((p) => p.scan === pure.scan))!), prev: null, next: null }));
  const hmPage = hm.slice(hm.indexOf(`data-scan="${pure.scan}"`));
  ok(!hmPage.slice(0, 4000).includes('data-testid="illustration-page"') && /data-presentation="text"[^>]*>(<[^>]+>)*மானம் காத்த/.test(hmPage) && /data-role="archival-label"[^>]*data-presentation="archival"/.test(hmPage.slice(0, 4000)) && /data-role="archival-description"[^>]*data-presentation="archival"/.test(hmPage.slice(0, 4000)), "B3: mixed scan renders the printed line as text and labels the description");
}

// ══ Public-safe projections: serialization boundary ════════════════════════════════════════════════════════════
{
  const FORBIDDEN_KEYS = /"(hidden|wave|batch|readiness|releaseState|release|tamilStatus|englishStatus|visualFidelity|verification|currentCheckpoint|annotations|apparatus|provenanceIds|locatedBy|englishReview|assembledFromVerifiedPages|sourceConditionScans|file|dialect|chapterDialect|note|workflow|validation|audit)":/;
  const w = toSangatamilWork();
  const samples: [string, unknown][] = [
    ["Murasoli letter", toPublicWave8Letter(loadWave8MurasoliLetters()[0])],
    ["Murasoli 3681", toPublicWave8Letter(loadWave8MurasoliLetters().find((l) => l.printedNumber === 3681)!)],
    ["ore-mutham source", toPublicOreMuthamSource()],
    ["sangatamil contents", toPublicSangatamilContents(w)],
    ["sangatamil provenance", toPublicSangatamilProvenance(w)],
    ...w.sections.map((s) => [`sangatamil ${s.slug}`, toPublicSangatamilSection(s)] as [string, unknown]),
  ];
  for (const [label, obj] of samples) {
    const j = JSON.stringify(obj);
    // The generic Drama schema's public `english.status` field is legitimate by name; its VALUE must be durable
    // provenance. Any other `status` key is internal state.
    const statusKeys = (j.match(/"status":/g) ?? []).length;
    const allowedStatus = label === "ore-mutham source" ? 1 : 0;
    ok(statusKeys === allowedStatus, `projection ${label}: ${statusKeys} status field(s), expected ${allowedStatus}`);
    ok(!LIFECYCLE.test(j), `projection ${label}: lifecycle wording ${j.match(LIFECYCLE)?.[0]}`);
    ok(!FORBIDDEN_KEYS.test(j), `projection ${label}: internal key ${j.match(FORBIDDEN_KEYS)?.[1]}`);
    ok(!WORKFLOW.test(j), `projection ${label}: workflow prose ${j.match(WORKFLOW)?.[0]}`);
    ok(!/<!--/.test(j), `projection ${label}: archival comment`);
  }
  // The ore-mutham reading payload (the Play the reader receives) carries notes only in public-safe form.
  ok(!WORKFLOW.test(JSON.stringify(toOreMuthamPlay())), "ore-mutham Play payload: no workflow prose");
}

if (fail.length) {
  console.error(`\nwave8-p2-render — ${checks} checks, ${fail.length} FAILED`);
  for (const f of (process.env.ALL_FAILS ? fail : fail.slice(0, 60))) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`wave8-p2-render — ${checks} checks, 0 failed`);
console.log("  Murasoli 342 × ta/en · ஒரே முத்தம் landing + source + 33 × ta/en · சங்கத் தமிழ் landing + source + 104 × ta/en (497 scans, 119 records) · legacy Murasoli 346 + 10 Drama unchanged");
