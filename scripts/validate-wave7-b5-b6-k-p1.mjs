// Wave 7 — B5a / B5b / B6 / Kuraloviyam — P1 INDEPENDENT source/import validator. Fails closed.
//
//   node scripts/validate-wave7-b5-b6-k-p1.mjs <public-speeches-clone> <assembly-speeches-clone> <literary-commentary-clone>
//   (or KDL_SOURCES_DIR holding kalaignar-public-speeches-wave7 / kalaignar-assembly-speeches-wave7 /
//    kalaignar-literary-commentary-wave7)
//
// Re-derives the population DIRECTLY from the pinned source checkouts with its OWN traversal — it never
// imports the importers and never treats generated payloads as source truth. Proves:
//   • the three source checkouts sit at the frozen Wave-7 P0 pins;
//   • B5a = 61 and B5b = 36 are EXACTLY the frozen census sets, derived here from each source speech's own
//     `parent_collection`; B5a ∩ B5b = 0; ordinals are exactly 1..61 / 1..36 in source order;
//   • the duplicate C37 workspace, Audio-06, the இருளும் ஒளியும் container and every already-onboarded
//     speech are NOT in the population; B6 is exactly the three assembly speeches;
//   • Kuraloviyam is ONE work: 666 page records per layer, visual 666, Tamil textual 662, English
//     release-ready 662, source-limited exactly {13, 14, 15, 19}, 300 contents entries;
//   • per-work source subtree identity equals the internal manifests; every vendored payload exists, is
//     non-empty, matches its manifest hash, and carries NO internal hidden/wave/batch/readiness key.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const BASE = process.env.KDL_SOURCES_DIR || "";
const PS = process.argv[2] || (BASE ? path.join(BASE, "kalaignar-public-speeches-wave7") : "");
const AS = process.argv[3] || (BASE ? path.join(BASE, "kalaignar-assembly-speeches-wave7") : "");
const LC = process.argv[4] || (BASE ? path.join(BASE, "kalaignar-literary-commentary-wave7") : "");
for (const [k, v] of [["public-speeches", PS], ["assembly-speeches", AS], ["literary-commentary", LC]]) {
  if (!v || !fs.existsSync(v)) { console.error(`validate-wave7-b5-b6-k-p1: source clone for ${k} not found (${v || "unset"})`); process.exit(2); }
}

let checks = 0; const fail = [];
const ok = (c, l) => { checks++; if (!c) fail.push(l); };
const eq = (a, b, l) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const git = (repo, ...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8" }).trim();
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p, "utf8")).digest("hex");

// ── Frozen pins (WAVE7_COMPLETED_WORKS_CENSUS.md §1.1) ────────────────────────────────────────────────
const PINS = {
  ps: { repo: PS, commit: "6ca57fe20706ebcb59f3432e8067fd11a1565b54", tree: "23306338a527a62cd8100b56f6bc99ca09772098" },
  as: { repo: AS, commit: "7a7fed1d0e3eb24a396effc10854b178f32bd0cf", tree: "b08fc42e5a7e17b08c8dfcfee7cefb987e45b09c" },
  lc: { repo: LC, commit: "d542b4cc3749bf1966e3537d1eb34d421344faf5", tree: "f5a663672e3184cf435cbf7603cca7e6248c0049" },
};
for (const [k, p] of Object.entries(PINS)) {
  eq(git(p.repo, "rev-parse", "HEAD"), p.commit, `${k}: source checkout at the frozen P0 commit`);
  eq(git(p.repo, "rev-parse", "HEAD^{tree}"), p.tree, `${k}: source root tree equals the census tree`);
}

// ── Frozen census population (independent copy; census §4.1 + §4) ────────────────────────────────────
const CENSUS_B5A = "aadithanar-piranthanaal-vizha aazhvargal-aaivu-maiya-vizha-1997 alagabath-maanadu annai-teresa-padathirappu annai-velangkanni-aalaya-velli-vizha bharathi-vizha bharathiyar-vizha-1997 bharathiyum-pudhumaip-pengalum doctor-radhakrishnan-virudhu-vazhangu-vizha dr-ambedkar-palkalaikkazhaga-thodakka-vizha ezhaiyin-sirippil haikku-kavithaigal ilaignargal-kattalaiyidum-kaalam ilakkiyathil-tamilagam ilakkuvanar ilangkovadigal-1 ilangkovadigal-2 ilangkovadigal-3 ilangkovadigal-4 irasarasan-silai irumozhi-pothum ithayangal-iyanthirangal-aagavendam kalai-valarppom kalaivanar kambar-vizha-1 kambar-vizha-2 kannimara-pothu-noolaga-nootrandu-vizha kappalottiya-tamizhan karuthuch-suthanthiram koozhaangkallai-vairamaakkuvom kural-vazhi-nadappir maanagaratchiyil-sudhandhira-ponvizha maanavargalum-arasiyalum madurai-theendamai-ozhippu-maanadu malark-kaatchi manappuratchi-thevai mozhimanam-peruvom naam-jananayagam-naan-sarvathikaram naam-ore-saathi-tamizhsaathi nadaga-dasar nila-mutram paththirikaip-penne payitru-mozhi pazhaiya-varalaarum-ilaiya-thalaimuraiyum pirappokkum punitha-thomaiyar rukmani-lakshmipathi-nutrandu-vizha salem-periyar-palkalaikkazhaga-thodakka-vizha sangakala-tamizh-naanayangkal-nool-veliyeettu-vizha sudhandhira-ponvizha-thamizhaga-thiyagigal-vazhiyanuppu-vizha sudhandhira-thina-ponvizha tamilin-solvalam tamilisai-iyakkam tamilkkudi-magan tamizhukku-niram-undu thathuvam umamaheswaranar vallalar-vazhi-ethu valluvarkkor-aalayam vasathiyullor-vazhi-viduga yathum-oore-yavarum-kelir".split(" ");
const CENSUS_B5B = "ambur-sampangi-illa-manavizha annai-teresa-nool-veliyittu-vizha ayyanan-ambalam-padathirappu-vizha chennai-aazhvargal-aaivu-maiya-vizha-urai chennai-chennai-puranagar-vanigargal-sanga-maanadu chennai-erodu-tamizhanban-noolgal-veliyittu-vizha chennai-exnora-rotary-niruvanangalin-paarattu-vizha chennai-nathigam-ramasami-illa-manavizha chennai-thiraiyulagam-nadathiya-paarattu-vizha chennai-thiripura-orumaippattu-thina-koottam chennai-thiyagigal-manimandapa-thirappuvizha desiya-ilainjar-kondatta-thodakka-vizha indiya-suvishesha-thiruchabai-vizha isaithamizhin-unmai-varalaru-nool-veliyittu-vizha kanchi-manimozhiyar-illa-manavizha kanchipuram-cvm-annamalai-illa-manavizha karl-marx-mozhipeyarppu-noolgal-jamadhagni-veliyittu-vizha kavikko-abdul-raguman-manivizha madurai-madha-nallinakka-maanadu madurai-vazhakkarinjar-sanga-125-aavathu-aanduvizha may-thina-vizha murasoli-arakkattalai-virudhu-vazhangu-vizha muthamizh-peravai-vizha nagarkovil-jeevanandham-manimandapa-thirappuvizha nellikuppam-pugazhendhi-manavizha perayar-ezra-sargunam-manivizha pidil-kumbakonam-rajamanickam-pillai-nootraandu-vizha purusai-gopalarathinam-illa-manavizha puthandu-isaivizha rajapalayam-kumarasami-raja-nootraandu-vizha thiraippada-virudhu-vazhangum-vizha thiru-vi-ka-kalki-noolgalukku-parivuthogai-vazhangum-vizha thiruvalluvar-vizha thiruvannamalai-arunai-poriyiyal-kalloori-pattamalippu-vizha tn-rajarathinam-pillai-nootraandu-vizha veeran-sundaralingam-ninaivu-grama-thirappuvizha".split(" ");
const CENSUS_B6 = ["1971-namathu-vilakkam", "1973-03-07-financial-statement-reply", "1973-03-08-financial-statement-reply"];
const C37_DUPLICATE = "pazhaiya-varalarum-ilaiya-thalaimuraiyum";
const AUDIO_06 = "kalaivanar-nsk-memorial-day-audio-06";
const ONBOARDED = ["udhaya-kathir", "poonthottam", "arappor", "kalaivanar-nsk-memorial-day", "idhaya-perikai", "namathu-nilai", "palli-vazhkkai"];

eq(CENSUS_B5A.length, 61, "census B5a = 61"); eq(CENSUS_B5B.length, 36, "census B5b = 36"); eq(CENSUS_B6.length, 3, "census B6 = 3");
eq(CENSUS_B5A.filter((s) => CENSUS_B5B.includes(s)), [], "B5a ∩ B5b = 0");

// ── Public speeches: derive each Part's membership FROM THE SOURCE ─────────────────────────────────────
const speechDirs = fs.readdirSync(path.join(PS, "speeches")).filter((d) => fs.existsSync(path.join(PS, "speeches", d, "metadata.json")));
const byPart = { "muthukkuliyal-part-1": [], "muthukkuliyal-part-2": [] };
for (const d of speechDirs) {
  const m = readJSON(path.join(PS, "speeches", d, "metadata.json"));
  const pc = m.parent_collection;
  if (pc && byPart[pc.id]) byPart[pc.id].push({ slug: d, ord: pc.constituent_number, total: pc.constituent_total, doc: m.document_type, w: m.workflow });
}
for (const [id, want, total] of [["muthukkuliyal-part-1", CENSUS_B5A, 61], ["muthukkuliyal-part-2", CENSUS_B5B, 36]]) {
  // The source holds the C37 duplicate workspace under Part I as a second directory with the same ordinal:
  // the census counts C37 once, by its canonical key; the duplicate is excluded here, explicitly.
  const members = byPart[id].filter((x) => x.slug !== C37_DUPLICATE);
  eq(members.map((x) => x.slug).sort(), [...want].sort(), `${id}: source constituents (excluding the C37 duplicate) == frozen census set`);
  eq(members.map((x) => x.ord).sort((a, b) => a - b), Array.from({ length: total }, (_, k) => k + 1), `${id}: source ordinals are exactly 1..${total}`);
  ok(members.every((x) => x.total === total && x.doc === "public-speech-constituent"), `${id}: every constituent declares total ${total} and document_type public-speech-constituent`);
  ok(members.every((x) => x.w.tamil_transcription === "verified-complete" && x.w.archive_status === "fully-archived" && x.w.pending_transcription_or_translation_work === false), `${id}: every constituent's Tamil is verified-complete and fully archived with no pending work`);
}
const dup = byPart["muthukkuliyal-part-1"].find((x) => x.slug === C37_DUPLICATE);
ok(!!dup && dup.ord === 37, "source still carries the C37 duplicate workspace as Part-I ordinal 37 (so its exclusion is a real, tested decision)");

// ── The internal speech manifest ────────────────────────────────────────────────────────────────────────
const sman = readJSON(path.join(root, "data/internal/wave7/b5-b6-speeches-manifest.json"));
const mslugs = sman.works.map((w) => w.slug);
eq(mslugs.length, 100, "speech manifest: 100 works");
eq(new Set(mslugs).size, 100, "speech manifest: no duplicate slug");
eq(sman.works.filter((w) => w.batch === "B5a").map((w) => w.slug).sort(), [...CENSUS_B5A].sort(), "manifest B5a == census");
eq(sman.works.filter((w) => w.batch === "B5b").map((w) => w.slug).sort(), [...CENSUS_B5B].sort(), "manifest B5b == census");
eq(sman.works.filter((w) => w.batch === "B6").map((w) => w.slug).sort(), [...CENSUS_B6].sort(), "manifest B6 == census");
for (const x of [C37_DUPLICATE, AUDIO_06, "irulum-oliyum", "1973-irulum-oliyum", ...ONBOARDED]) ok(!mslugs.includes(x), `population excludes ${x}`);
for (const [id, want] of [["muthukkuliyal-part-1", CENSUS_B5A], ["muthukkuliyal-part-2", CENSUS_B5B]]) {
  const order = byPart[id].filter((x) => x.slug !== C37_DUPLICATE).sort((a, b) => a.ord - b.ord).map((x) => x.slug);
  eq(sman.collections[id].members, order, `${id}: manifest member order == source printed order`);
  eq(sman.collections[id].tree, git(PS, "rev-parse", `HEAD:collections/${id}`), `${id}: collection subtree pin`);
  eq(sman.collections[id].members.length, want.length, `${id}: member count`);
}
// ── B6 assembly speeches: exist at the pin, three separate witnesses, இருளும் ஒளியும் only a container ──
const B6_PATHS = { "1971-namathu-vilakkam": "speeches/1971/1971-namathu-vilakkam", "1973-03-07-financial-statement-reply": "speeches/1973/1973-03-07-financial-statement-reply", "1973-03-08-financial-statement-reply": "speeches/1973/1973-03-08-financial-statement-reply" };
for (const [slug, rel] of Object.entries(B6_PATHS)) {
  const m = readJSON(path.join(AS, rel, "metadata.json"));
  eq(m.id, slug, `${slug}: source metadata id`);
  ok(m.transcription.verified_against_scan === true && m.translation.verified_against_tamil === true, `${slug}: Tamil verified against scan, English verified against Tamil`);
}
const m7 = readJSON(path.join(AS, B6_PATHS["1973-03-07-financial-statement-reply"], "metadata.json"));
const m8 = readJSON(path.join(AS, B6_PATHS["1973-03-08-financial-statement-reply"], "metadata.json"));
ok(m7.date === "1973-03-07" && m8.date === "1973-03-08" && m7.source.speech_scan_pages !== m8.source.speech_scan_pages, "the two March 1973 speeches are distinct dated witnesses on distinct pages");
ok(m7.source.publication_title_ta === "இருளும் ஒளியும்" && m8.source.publication_title_ta === "இருளும் ஒளியும்", "இருளும் ஒளியும் is the shared publication of the two 1973 speeches (a container, not a work)");
ok(fs.existsSync(path.join(AS, "sources/1973-irulum-oliyum")) && !fs.existsSync(path.join(AS, "speeches/1973/1973-irulum-oliyum")), "இருளும் ஒளியும் exists only as a source container, never as a speech directory");

// ── Per-work subtree + payload integrity ────────────────────────────────────────────────────────────────
const FORBIDDEN = /"(hidden|wave|batch|readiness|discoverable|sitemapExposed|publicRoute)"\s*:/;
for (const w of sman.works) {
  const repo = w.sourceRepo === "pugazg/kalaignar-public-speeches" ? PS : AS;
  eq(w.sourceCommit, w.sourceRepo === "pugazg/kalaignar-public-speeches" ? PINS.ps.commit : PINS.as.commit, `${w.slug}: manifest source commit == frozen pin`);
  eq(git(repo, "rev-parse", `HEAD:${w.sourcePath}`), w.sourceTree, `${w.slug}: source subtree pin`);
  for (const [f, h] of [["speech.json", w.speechJsonSha256], ["provenance.json", w.provenanceJsonSha256]]) {
    const p = path.join(root, "public/data/speeches", w.slug, f);
    const exists = fs.existsSync(p);
    ok(exists && fs.statSync(p).size > 200, `${w.slug}/${f}: present and non-empty`);
    if (!exists) continue;
    eq(sha(p), h, `${w.slug}/${f}: payload hash == manifest`);
    ok(!FORBIDDEN.test(fs.readFileSync(p, "utf8")), `${w.slug}/${f}: no internal hidden/wave/batch/readiness key in a public payload`);
  }
  ok(w.englishForm === (w.englishToTamilWordRatio >= 1 ? "full-translation" : "condensed"), `${w.slug}: English form follows the measured ratio`);
}
eq(sman.summary.condensedEnglish.length, 45, "45 condensed English renderings (owner-decided honest label)");
ok(sman.works.filter((w) => w.batch === "B5b" || w.batch === "B6").every((w) => w.englishForm === "full-translation"), "every Part-II and assembly English layer is a full translation");

// ── Kuraloviyam: one work, frozen qualification, derived FROM THE PAGE RECORDS here ─────────────────────
const KW = path.join(LC, "works/kuraloviyam");
const taFiles = fs.readdirSync(path.join(KW, "pages")).filter((f) => f.endsWith(".md")).sort();
const enFiles = fs.readdirSync(path.join(KW, "translations/en/pages")).filter((f) => f.endsWith(".md")).sort();
eq(taFiles.length, 666, "Kuraloviyam: 666 Tamil page records"); eq(enFiles.length, 666, "Kuraloviyam: 666 English page records");
const fm = (p, k) => (new RegExp(`^${k}:\\s*"?([^"\\n]*)"?\\s*$`, "m").exec(fs.readFileSync(p, "utf8").split("\n---\n")[0]) || [])[1];
let vis = 0, txt = 0, rel = 0; const limited = [];
for (const f of taFiles) {
  if (fm(path.join(KW, "pages", f), "visual_fidelity") === "verified") vis++;
  if (fm(path.join(KW, "pages", f), "status") === "verified") txt++; else limited.push(Number(f.slice(0, 4)));
  if (fm(path.join(KW, "translations/en/pages", f), "status") === "release-ready") rel++;
}
eq(vis, 666, "Kuraloviyam: visual verification 666/666");
eq(txt, 662, "Kuraloviyam: Tamil textual verification 662 (never 666)");
eq(rel, 662, "Kuraloviyam: maintained English release-ready 662");
eq(limited, [13, 14, 15, 19], "Kuraloviyam: permanently source-limited scans are exactly 13, 14, 15, 19");
const idx = readJSON(path.join(KW, "sections/entries/index.json"));
eq(idx.entries.length, 300, "Kuraloviyam: 300 source contents entries");
const kman = readJSON(path.join(root, "data/internal/wave7/kuraloviyam-manifest.json"));
eq(kman.source.commit, PINS.lc.commit, "Kuraloviyam manifest: frozen pin");
eq(kman.source.tree, git(LC, "rev-parse", "HEAD:works/kuraloviyam"), "Kuraloviyam: work subtree pin");
eq(kman.qualification, { visualVerified: 666, tamilTextualVerified: 662, englishReleaseReady: 662, sourceLimitedScans: [13, 14, 15, 19], blocked: 0 }, "Kuraloviyam: manifest qualification == source-derived qualification");
eq(kman.units, 308, "Kuraloviyam: 308 reading units (7 front + 300 entries + 1 back)");
for (const [f, h] of Object.entries(kman.files)) {
  const p = path.join(root, "public/data/kuraloviyam", f);
  ok(fs.existsSync(p) && sha(p) === h, `kuraloviyam/${f}: present and == manifest hash`);
  if (fs.existsSync(p)) ok(!FORBIDDEN.test(fs.readFileSync(p, "utf8")), `kuraloviyam/${f}: no internal key`);
}
ok(!fs.existsSync(path.join(root, "public/data/kuraloviyam/parts")), "Kuraloviyam: the six intake parts are never vendored as works/units");
// Internal manifests are never served.
ok(!fs.readdirSync(path.join(root, "public/data")).some((d) => /manifest|internal/i.test(d) && d !== "manifest.json"), "no internal manifest under public/data");

if (fail.length) {
  console.error(`\nvalidate-wave7-b5-b6-k-p1 — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 60)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nvalidate-wave7-b5-b6-k-p1 — ${checks} checks, 0 failed`);
console.log("  frozen pins · B5a 61 + B5b 36 == census (source-derived, C37 duplicate excluded) · B6 3 (இருளும் ஒளியும் container only) · Kuraloviyam 1 work / 666 scans / 662 verified / 4 source-limited · subtree pins · payload hashes · no internal keys in public payloads");
