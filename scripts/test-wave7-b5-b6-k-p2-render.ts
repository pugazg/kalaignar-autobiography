/**
 * Wave 7 — B5a / B5b / B6 / Kuraloviyam — P2 RENDER regression (real components, both UI languages, both text
 * layers). Creates NO routes.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave7-b5-b6-k-p2-render.ts
 *
 * Speeches (100): the real SpeechReader (seeded with its payload — the same component the route renders) in
 * Tamil and English UI, Tamil and English layers: text present, no leaks, the printed closing colophon shown as
 * a separate note, the collection line for முத்துக் குளியல் items, the CONDENSED label on exactly the 45
 * condensed English layers and never on a full translation. SpeechSource renders the PUBLIC projection; for all
 * 117 speeches the projection renders identically to the archival record (nothing the page shows is lost) and is
 * allowlisted at every nesting level.
 *
 * Kuraloviyam: landing, all 308 units (Tamil + English), source page. Qualification regression — fails if the
 * four limited scans are ever marked verified, their missing text is supplied, Tamil is claimed 666/666, the
 * qualification drops from provenance, the six Parts become catalogue works, or English is missing on a verified
 * text page.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LangProvider } from "../lib/i18n";
import SpeechReader from "../components/SpeechReader";
import SpeechSource from "../components/SpeechSource";
import KuraloviyamLanding from "../components/KuraloviyamLanding";
import KuraloviyamReader from "../components/KuraloviyamReader";
import KuraloviyamSource from "../components/KuraloviyamSource";
import { toPublicSpeechProvenance, PUBLIC_SPEECH_TOP_KEYS } from "../lib/speech-public-provenance";
import { toPublicKuraloviyamProvenance, PUBLIC_K_TOP_KEYS } from "../lib/kuraloviyam-public-provenance";
import { SPEECH_SLUGS } from "../data/speeches";
import type { Speech, SpeechProvenance } from "../data/speeches";
import type { KuraloviyamIndex, KuraloviyamUnit, KuraloviyamProvenance } from "../data/kuraloviyam";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const load = <T,>(p: string): T => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const ta = (el: React.ReactElement) => renderToStaticMarkup(createElement(LangProvider, null, el));
const en = (el: React.ReactElement) => renderToStaticMarkup(createElement(LangProvider, { initialLang: "en", children: el }));
const visible = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const LEAK = /\bundefined\b|>null<|\bNaN\b|\[object Object\]/;
const HAS_TA = /[஀-௿]{3}/;
// Source text with its inline Markdown markers removed — what a reader actually sees rendered.
const plain = (t: string) => t.replace(/\*\*|`/g, "").replace(/(^|[^*])\*([^*]+)\*/g, "$1$2").trim();
const shows = (html: string, t: string) => visible(html).replace(/\s+/g, " ").includes(plain(t).replace(/\s+/g, " ").slice(0, 30));
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

// ── SPEECHES ──────────────────────────────────────────────────────────────────────────────────────────
const sman = load<{ works: { slug: string; batch: string; englishForm: string; collectionId: string | null; ordinal: number | null }[]; summary: { condensedEnglish: string[] } }>("data/internal/wave7/b5-b6-speeches-manifest.json");
let condensedLabelled = 0;
for (const w of sman.works) {
  const sp = load<Speech>(`public/data/speeches/${w.slug}/speech.json`);
  const firstTa = (sp.tamil.blocks.find((b) => b.kind === "paragraph") as { segments: { text: string }[] }).segments[0].text.split("\n")[0];
  const firstEn = (sp.english.blocks.find((b) => b.kind === "paragraph") as { segments: { text: string }[] }).segments[0].text.split("\n")[0];
  const rTa = ta(createElement(SpeechReader, { slug: w.slug, initialSpeech: sp }));
  const rEnUI = en(createElement(SpeechReader, { slug: w.slug, initialSpeech: sp }));
  const rEnLayer = en(createElement(SpeechReader, { slug: w.slug, initialSpeech: sp, initialShowEn: true }));
  const rEnLayerTaUI = ta(createElement(SpeechReader, { slug: w.slug, initialSpeech: sp, initialShowEn: true }));
  ok(HAS_TA.test(visible(rTa)) && shows(rTa, firstTa), `${w.slug}: Tamil body renders (first paragraph present)`);
  ok(shows(rEnLayer, firstEn), `${w.slug}: English layer renders (first paragraph present)`);
  ok(![rTa, rEnUI, rEnLayer, rEnLayerTaUI].some((h) => LEAK.test(h)), `${w.slug}: no undefined/null/NaN leak in any language/layer`);
  ok(!/Opening the speech|உரை ஏற்றப்படுகிறது/.test(rTa), `${w.slug}: seeded reader renders the speech, not the loading state`);
  const closing = sp.tamil.blocks[sp.tamil.blocks.length - 1];
  if (w.batch !== "B6") {
    ok(closing.kind === "note" && shows(rTa, (closing as { text: string }).text.split("\n")[0]), `${w.slug}: printed closing colophon renders as a separate note`);
    ok(rTa.includes(`/collections/${w.collectionId}`) && rEnUI.includes(`item ${w.ordinal} of ${w.collectionId === "muthukkuliyal-part-1" ? 61 : 36}`), `${w.slug}: collection line with the printed ordinal`);
  }
  const labelled = /condensed English rendering, not a full translation/.test(rEnLayer) && /முழு மொழிபெயர்ப்பு அல்ல/.test(rEnLayerTaUI);
  if (w.englishForm === "condensed") { ok(labelled, `${w.slug}: condensed English is labelled honestly in both UI languages`); if (labelled) condensedLabelled++; }
  else ok(!/condensed English rendering|முழு மொழிபெயர்ப்பு அல்ல/.test(rEnLayer + rEnLayerTaUI), `${w.slug}: a full translation is never labelled condensed`);
  // Tamil-only venue/event facts render in Tamil under English UI — never an invented English gloss.
  if (sp.subtype === "public-speech" && sp.venue && !sp.venue.en) ok(rEnUI.includes(`lang="ta" class="font-tamil">${esc(sp.venue.ta)}`), `${w.slug}: Tamil-only venue shown as written under English UI`);
}
ok(condensedLabelled === 45 && sman.summary.condensedEnglish.length === 45, `exactly 45 condensed English layers are labelled (labelled ${condensedLabelled})`);

// Source pages: projection == archival record in rendering, for ALL speeches; allowlisted; new rows present.
const ALL_SPEECHES = Array.from(new Set<string>([...SPEECH_SLUGS, ...sman.works.map((w) => w.slug)]));
for (const slug of ALL_SPEECHES) {
  const raw = load<SpeechProvenance>(`public/data/speeches/${slug}/provenance.json`);
  const pub = toPublicSpeechProvenance(raw);
  const aTa = ta(createElement(SpeechSource, { slug, prov: pub })), bTa = ta(createElement(SpeechSource, { slug, prov: raw as never }));
  const aEn = en(createElement(SpeechSource, { slug, prov: pub })), bEn = en(createElement(SpeechSource, { slug, prov: raw as never }));
  ok(aTa === bTa && aEn === bEn, `${slug}: SpeechSource renders the public projection identically to the archival record`);
  ok(Object.keys(pub).every((k) => (PUBLIC_SPEECH_TOP_KEYS as readonly string[]).includes(k)), `${slug}: projection top-level keys ⊆ allowlist`);
  ok(!/"(hidden|wave|batch|readiness|archiveVerification|releaseReadiness|sourceAuthority)"\s*:/.test(JSON.stringify(pub)), `${slug}: projection carries no internal / non-rendered record`);
  ok(!LEAK.test(aTa) && !LEAK.test(aEn), `${slug}: no leak on the source page`);
}
for (const w of sman.works.filter((x) => x.englishForm === "condensed").slice(0, 45)) {
  const h = en(createElement(SpeechSource, { slug: w.slug, prov: toPublicSpeechProvenance(load<SpeechProvenance>(`public/data/speeches/${w.slug}/provenance.json`)) }));
  ok(/Condensed English rendering — not a full translation/.test(h), `${w.slug}: source page states the condensed English form`);
}
const vp = en(createElement(SpeechSource, { slug: "vallalar-vazhi-ethu", prov: toPublicSpeechProvenance(load<SpeechProvenance>("public/data/speeches/vallalar-vazhi-ethu/provenance.json")) }));
ok(/Rights line \(as printed\)/.test(vp) && vp.includes("உரிமை : ஆசிரியருக்கே") && /Scan split files/.test(vp) && /item 1 of 61/.test(vp), "vallalar-vazhi-ethu source: printed rights line (historical), split identity and collection place shown");
ok(!/Present rights \/ nationalisation status/.test(vp), "new speeches claim no present rights status (none inherited)");

// ── KURALOVIYAM ───────────────────────────────────────────────────────────────────────────────────────
const kidx = load<KuraloviyamIndex>("public/data/kuraloviyam/index.json");
ok(kidx.units.length === 308 && kidx.units.filter((u) => u.kind === "entry").length === 300, "Kuraloviyam: 308 units, 300 entries");
ok(!kidx.units.some((u) => /part/i.test(u.id)), "Kuraloviyam: the six intake Parts are not reading units");
for (const [lbl, h] of [["Tamil UI", ta(createElement(KuraloviyamLanding, { index: kidx }))], ["English UI", en(createElement(KuraloviyamLanding, { index: kidx }))]] as const) {
  const v = visible(h);
  ok(!LEAK.test(h) && (h.match(/href="\/kuraloviyam\/entry-\d{3}"/g) || []).length >= 300, `Kuraloviyam landing (${lbl}): lists all 300 entries`);
  ok(/662/.test(v) && !/666\s*\/\s*666[^·]*Tamil|Tamil[^.]*666\s*\/\s*666/.test(v), `Kuraloviyam landing (${lbl}): states Tamil text verified on 662 pages, never 666/666`);
  ok(/13, 14, 15/.test(v) && !/pending|in progress|to be completed|Pass 1|நிலுவை/.test(v.replace(/not outstanding work/, "")), `Kuraloviyam landing (${lbl}): limited scans named as a permanent condition, no pending-work wording`);
}
let textPages = 0, enPresent = 0, limitedSeen: number[] = [];
kidx.units.forEach((u, i) => {
  const unit = load<KuraloviyamUnit>(`public/data/kuraloviyam/units/${u.id}.json`);
  const prev = i > 0 ? kidx.units[i - 1] : null, next = i < kidx.units.length - 1 ? kidx.units[i + 1] : null;
  const rTa = ta(createElement(KuraloviyamReader, { unit, prev, next }));
  const rEn = en(createElement(KuraloviyamReader, { unit, prev, next, initialShowEn: true }));
  ok(!LEAK.test(rTa) && !LEAK.test(rEn), `kuraloviyam/${u.id}: no leak`);
  ok(!/Pass 1|must wait for better source evidence|release-ready|\bGR1\b/.test(visible(rTa) + visible(rEn)), `kuraloviyam/${u.id}: no archive workflow wording on the page`);
  for (const p of unit.pages) {
    const hasTaText = p.ta.some((b) => b.kind === "paragraph" || b.kind === "citation" || b.kind === "heading");
    if (!p.sourceLimited && hasTaText) {
      textPages++;
      if (p.en.some((b) => b.kind === "paragraph" || b.kind === "citation" || b.kind === "heading")) enPresent++;
    }
    if (p.sourceLimited) {
      limitedSeen.push(p.scan);
      ok(/Permanent source condition/.test(rEn) && /மூலத்தின் நிலையான வரம்பு/.test(rTa), `kuraloviyam scan ${p.scan}: permanent-condition block renders in both layers`);
      ok(!p.ta.some((b) => b.kind === "archival") && !p.en.some((b) => b.kind === "archival"), `kuraloviyam scan ${p.scan}: no archival/workflow description published`);
    }
  }
  const firstPara = unit.pages.flatMap((p) => p.ta).find((b) => b.kind === "paragraph") as { text: string } | undefined;
  if (firstPara) ok(shows(rTa, firstPara.text.split("\n")[0]), `kuraloviyam/${u.id}: Tamil text renders`);
  if (u.kind === "entry") ok(rTa.includes(esc(u.contentsKey!)), `kuraloviyam/${u.id}: heading is the printed contents text`);
});
ok(JSON.stringify(limitedSeen.sort((a, b) => a - b)) === "[13,14,15,19]", `Kuraloviyam: exactly scans 13,14,15,19 are source-limited (${limitedSeen})`);
ok(textPages > 600 && enPresent === textPages, `Kuraloviyam: maintained English present on every verified text page (${enPresent}/${textPages})`);
const u203 = load<KuraloviyamUnit>("public/data/kuraloviyam/units/entry-203.json");
ok(en(createElement(KuraloviyamReader, { unit: u203, prev: null, next: null })).includes("locates this entry at p. 435"), "entry 203 discloses the printed-contents locator");
const f06 = load<KuraloviyamUnit>("public/data/kuraloviyam/units/front-06.json");
ok(ta(createElement(KuraloviyamReader, { unit: f06, prev: null, next: null })).includes('data-block="source-gap"'), "scan 19's washed-out words render as a marked source gap, not text");

const kprov = load<KuraloviyamProvenance>("public/data/kuraloviyam/provenance.json");
ok(kprov.verification.tamilTextualVerified === 662 && kprov.verification.visualVerified === 666 && kprov.verification.englishReleaseReady === 662, "provenance: visual 666 / Tamil 662 / English 662 (three separate facts)");
ok(JSON.stringify(kprov.verification.sourceLimitedScans) === "[13,14,15,19]" && kprov.verification.blocked === 0, "provenance: qualification retained (limited 13/14/15/19, blocked 0)");
const kpub = toPublicKuraloviyamProvenance(kprov);
ok(Object.keys(kpub).every((k) => (PUBLIC_K_TOP_KEYS as readonly string[]).includes(k)), "Kuraloviyam projection: allowlisted top level");
for (const [lbl, h] of [["Tamil UI", ta(createElement(KuraloviyamSource, { prov: kpub }))], ["English UI", en(createElement(KuraloviyamSource, { prov: kpub }))]] as const) {
  ok(/data-testid="k-textual">662 \/ 666/.test(h) && /data-testid="k-visual">666 \/ 666/.test(h) && /data-testid="k-limited">13, 14, 15, 19/.test(h), `Kuraloviyam source (${lbl}): visual 666/666, Tamil 662/666, limited 13,14,15,19 as separate rows`);
  ok(!LEAK.test(h), `Kuraloviyam source (${lbl}): no leak`);
  ok((h.match(/_part_00\d_pages_/g) || []).length === 6, `Kuraloviyam source (${lbl}): six split files shown as source identity`);
}

if (fail.length) {
  console.error(`\nwave7-b5-b6-k-p2-render — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 50)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b5-b6-k-p2-render — ${checks} checks, 0 failed`);
console.log(`  100 speeches × Ta/En UI × Ta/En layer · 45 condensed labelled · ${ALL_SPEECHES.length} source pages: projection == record · Kuraloviyam 308 units × 2 layers · limited 13/14/15/19 permanent · Tamil 662 never 666`);
