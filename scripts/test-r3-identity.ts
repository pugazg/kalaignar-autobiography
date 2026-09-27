/**
 * Reading Room IA v2 R3 — identity, relation and boundary validator (frozen R3 plan §8, §13 R3-A, §14).
 *
 *   npm run test:r3-identity      (runs `build-r3-identity.ts --verify` first)
 *
 * Stage-generic invariants (hold at every R3 stage) plus an R3-A block: R3-A is foundation only, so the public
 * catalogue, categories, collections, sitemap and build must equal the frozen pre-R3 boundary exactly, only the two
 * pre-R3 Poetry relations may be active, and no CREATE identity may be a LibraryWork. Exits non-zero on failure.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { LIBRARY_COLLECTIONS, collectionMemberWorks } from "../data/collections";
import { LIBRARY_PUBLICATIONS, LIBRARY_WORKS, publishedWorks, type LibraryWork } from "../data/library";
import { POEM_SLUGS, POETRY_PUBLICATION_SLUGS, POETRY_WITNESS_RELATIONS } from "../data/poems";
import sitemap from "../app/sitemap";
import { r3WitnessLinksForPage, resolveWitnessLinks } from "../lib/witness";
import { R3_IDENTITY, R3_RELATIONS, activeRelations, canonicalFor, publicationAppearances, witnessesOf, type WorkRelation } from "../lib/work-relations";
import { resolveCollectionMember, resolveCollectionMembers } from "../lib/collection-members";
import { READ_IA_R3_CONTRIBUTION as R3 } from "../lib/read-ia-r3-contribution";

let checks = 0;
const failures: string[] = [];
const ok = (cond: boolean, label: string) => {
  checks++;
  if (!cond) failures.push(label);
};
const eq = <T,>(a: T, b: T, label: string) => {
  checks++;
  if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${label}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`);
};
const sha256 = (s: string | Buffer) => crypto.createHash("sha256").update(s).digest("hex");
const gitBlob = (b: Buffer) => crypto.createHash("sha1").update(Buffer.concat([Buffer.from(`blob ${b.length}\0`), b])).digest("hex");
const tally = <T,>(xs: T[], k: (x: T) => string) => xs.reduce<Record<string, number>>((o, x) => ((o[k(x)] = (o[k(x)] ?? 0) + 1), o), {});
const sorted = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
const DIR = path.join(process.cwd(), "data/internal/r3");

// ── 1. The frozen resolved manifest (vendored byte-for-byte; never edited) ───────────────────────────────────────
const mbuf = fs.readFileSync(path.join(DIR, "READING_ROOM_IA_V2_RESOLVED_MANIFEST.frozen.json"));
eq(gitBlob(mbuf), "b7b3530d54ba9c354b43313eecd69e78e76a92b5", "resolved manifest is the frozen blob b7b3530d…");
type Row = { family: string; key: string; resolved: { decision: string; canonicalId: string; shelf: string } };
const E = (JSON.parse(mbuf.toString("utf8")) as { entries: Row[] }).entries;
const CREATE = E.filter((e) => e.resolved.decision === "CREATE");
const createIds = CREATE.map((e) => e.resolved.canonicalId);
// Expected values are the frozen adjudication's own arithmetic (§13 of that record); the counts are re-derived here.
eq(E.length, 315, "resolved manifest: 315 rows");
eq(sorted(tally(E, (e) => e.resolved.decision)), { ADD_WITNESS: 19, CREATE: 249, DO_NOT_PROMOTE: 20, KEEP_EXISTING: 27 }, "decisions 249 / 27 / 19 / 20, HOLD 0");
eq(sorted(tally(CREATE, (e) => e.resolved.shelf)), { "essays-articles": 84, letters: 2, poetry: 162, speeches: 1 }, "CREATE by shelf");
eq(sorted(tally(CREATE, (e) => e.family)), {
  "essays-kolaikkalam": 6, "essays-perumoochu": 13, "essays-sinthanaiyum-seyalum": 50, "essays-thiraavida-sampaththu": 2,
  "essays-thudikkum-ilamai": 2, "essays-unarchchimaalai": 9, "ina-poem": 3, "ina-prose": 5, meesai: 25,
  "poetry-1975": 3, "poetry-kaalap": 57, "poetry-kavithaigal": 74,
}, "CREATE by family");
eq(new Set(createIds).size, 249, "249 unique CREATE ids");

// ── 2. Identity manifest agrees with the manifest and the live catalogue ─────────────────────────────────────────
const W = R3_IDENTITY.works;
eq(W.map((w) => w.id), createIds, "identity manifest carries all 249 CREATE identities, in manifest order");
eq(sorted(tally(W, (w) => w.introducedIn)), { "R3-B": 162, "R3-C": 87 }, "introduction stages: Poetry cohort R3-B, the rest R3-C");
const liveIds = new Set(LIBRARY_WORKS.map((w) => w.id));
const liveSlugs = new Set(LIBRARY_WORKS.map((w) => w.slug));
const published = new Set(publishedWorks().map((w) => w.id));
const stages = R3_IDENTITY.stageState.published;
for (const w of W) {
  const live = liveIds.has(w.id) || liveSlugs.has(w.id);
  if (w.state === "published") ok(published.has(w.id), `${w.id}: a published R3 identity is a published LibraryWork`);
  else ok(!live, `${w.id}: a dormant R3 identity is not a LibraryWork (id or slug)`);
  ok(w.state === (stages.includes(w.introducedIn) ? "published" : "dormant"), `${w.id}: state matches the stage state`);
}
const sm = sitemap().map((e) => e.url.replace("https://nenjukkuneethi.org", "") || "/");
const smSet = new Set(sm);
eq(W.filter((w) => !smSet.has(w.locator.route)).map((w) => w.id), [], "every CREATE reading route is a live public route");
eq(W.filter((w) => w.locator.fragment).map((w) => `${w.id} ${w.locator.href}`), [
  "ina-muzhakkam-poem-04 /essays/ina-muzhakkam/articles/kavithaigal#poem-6-4",
  "ina-muzhakkam-poem-07 /essays/ina-muzhakkam/articles/kavithaigal#poem-6-7",
  "ina-muzhakkam-poem-08 /essays/ina-muzhakkam/articles/kavithaigal#poem-6-8",
], "exactly the 3 ina unit-6 poems take fragment identities (plan §5.3)");
eq(new Set(W.map((w) => w.locator.href)).size, 249, "249 distinct CREATE locators");

// Publications: role maps, still canonical until their demotion stage.
eq(R3_IDENTITY.publications.map((p) => [p.id, p.demotedIn, p.roleCounts]), [
  ["kaalap-pezhaiyum-kavithai-saaviyum", "R3-B", { canonical: 57, witness: 1 }],
  ["kalaignarin-kavithaigal", "R3-B", { canonical: 74, witness: 3 }],
  ["kalaignarin-kaviyaranga-kavithaigal-1975", "R3-B", { canonical: 3 }],
  ["meesai-mulaiththa-vayathil", "R3-B", { canonical: 25, witness: 1 }],
  ["ina-muzhakkam", "R3-C", { canonical: 8, "dependent-heading": 1, witness: 8 }],
  ["unarchchimaalai", "R3-C", { canonical: 9, witness: 1 }],
  ["thiraavida-sampaththu", "R3-C", { canonical: 2 }],
  ["kolaikkalam", "R3-C", { canonical: 6 }],
  ["sinthanaiyum-seyalum", "R3-C", { canonical: 50 }],
  ["perumoochu", "R3-C", { canonical: 13 }],
  ["thudikkum-ilamai", "R3-C", { canonical: 2, witness: 2 }],
], "the 11 publications' unit-role maps (plan §6.2)");
for (const p of R3_IDENTITY.publications) {
  const demoted = stages.includes(p.demotedIn);
  ok(p.state === (demoted ? "demoted" : "canonical-until-demotion"), `${p.id}: state matches the stage state`);
  if (!demoted) ok(published.has(p.id), `${p.id}: still a published LibraryWork until ${p.demotedIn}`);
  ok(demoted === LIBRARY_PUBLICATIONS.some((x) => x.id === p.id), `${p.id}: in LIBRARY_PUBLICATIONS exactly when demoted`);
}

// ── 3. The relation registry (49 records, exactly once) ──────────────────────────────────────────────────────────
const R = R3_RELATIONS;
eq(R.length, 49, "49 relation records");
eq(new Set(R.map((r) => r.id)).size, 49, "relation ids are unique");
eq(sorted(tally([...R], (r) => r.class)), { "commentary-section": 11, "external-publication": 11, "merged-witness": 5, "source-publication": 22 }, "relation classes 22 / 5 / 11 / 11");
eq(sorted(tally([...R], (r) => r.level)), { chapter: 10, publication: 1, section: 13, work: 25 }, "relation levels");
eq(sorted(tally([...R], (r) => r.introducedIn)), { "live-pre-R3": 2, "R3-B": 18, "R3-C": 2, "R3-D": 27 }, "relation stages (plan §8.3)");
const keyOf = (r: WorkRelation) => `${r.canonicalId}|${r.witness.kind}|${r.witness.locator ?? JSON.stringify(r.witness)}`;
eq(new Set(R.map(keyOf)).size, 49, "no relation fact is recorded twice");
const stageIdx = (s: string) => (s === "live-pre-R3" ? -1 : ["R3-A", "R3-B", "R3-C", "R3-D"].indexOf(s));
const createStage = new Map(W.map((w) => [w.id, w.introducedIn]));
for (const r of R) {
  const targetStage = createStage.get(r.canonicalId);
  ok(liveIds.has(r.canonicalId) || !!targetStage, `${r.id}: target ${r.canonicalId} is a live work or a CREATE identity`);
  if (targetStage) ok(stageIdx(r.introducedIn) >= stageIdx(targetStage), `${r.id}: introduced no earlier than its target (${targetStage})`);
  ok(r.state === (r.introducedIn === "live-pre-R3" || stages.includes(r.introducedIn as never) ? "active" : "dormant"), `${r.id}: state matches the stage state`);
  if (r.state === "active") ok(published.has(r.canonicalId), `${r.id}: an ACTIVE relation targets a published canonical work`);
  if (r.level === "chapter") ok(typeof r.witness.alai === "number", `${r.id}: a chapter-level relation carries its அலை`);
  if (r.level === "publication") ok(!("alai" in r.witness), `${r.id}: a publication-level relation carries no chapter`);
}
// 1958 தேனலைகள் (adjudication §11) and Sangatamil (§10).
const t58 = R.filter((r) => r.witness.externalId === "1958-thenalaigal");
eq(t58.filter((r) => r.level === "chapter").map((r) => [r.witness.alai, r.canonicalId]), [
  [2, "mayiliragu"], [4, "madal"], [5, "thozhi"], [6, "maruthaani"], [7, "aruvi"], [8, "muram"], [9, "yaazh"], [10, "sirpi"], [11, "seval-sandai"], [12, "aandu-vizha"],
], "1958: the frozen 10 chapter-level mappings");
eq(t58.filter((r) => r.level === "publication").map((r) => r.canonicalId), ["thenalaigal"], "1958: Meesai 16 is publication-level only");
ok(!t58.some((r) => r.witness.alai === 3 || (r.witness.indicates as { alai?: number } | undefined)?.alai === 3), "1958: அலை 3 முத்துமாலை has no relation");
ok(!liveIds.has("1958-thenalaigal") && !createIds.includes("1958-thenalaigal"), "the 1958 publication is not a LibraryWork");
const sg = R.filter((r) => r.class === "commentary-section");
eq(sg.map((r) => [r.witness.sectionRoute, r.canonicalSection?.ordinal]), Array.from({ length: 11 }, (_, i) => [`/sangatamil/${String(92 + i).padStart(3, "0")}-oruthalaik-kaadhal-${String(i + 1).padStart(2, "0")}`, i + 1]), "Sangatamil 092–102 ↔ oruthalaik-kathal §1–11, in order");
ok(sg.every((r) => r.canonicalId === "oruthalaik-kathal" && smSet.has(String(r.witness.sectionRoute))), "Sangatamil relations target oruthalaik-kathal and live section routes");
eq(publishedWorks().filter((w) => w.id.startsWith("sangatamil")).map((w) => w.id), ["sangatamil"], "Sangatamil is exactly one LibraryWork; no section is promoted");
// The five merges: verbatim legacy records.
const boundary = JSON.parse(fs.readFileSync(path.join(DIR, "pre-r3-boundary.json"), "utf8")) as {
  catalogue: { count: number; shelves: Record<string, number>; records: LibraryWork[] };
  collections: { count: number; records: unknown[] };
  discovery: Record<string, number>;
  sitemap: { count: number; sha256: string; paths: string[] };
  build: { prerender: number; html: number };
};
const mergedRel = R.filter((r) => r.class === "merged-witness");
eq(mergedRel.map((r) => [(r.witness.record as LibraryWork).id, r.canonicalId]).sort(), [
  ["aadik-kaatre", "adikkaatru"], ["neeyum-kaithi-naanum-kaithi", "piraiye"], ["pugazhe-nee-oru-pudhir", "pugazh"],
  ["sirai-kodiyathu", "green-parrot"], ["sorgaththirku-vandhathu-eppadi", "sorgga-logaththil"],
], "the five frozen merges");
for (const r of mergedRel) {
  const rec = r.witness.record as LibraryWork;
  eq(rec, boundary.catalogue.records.find((x) => x.id === rec.id), `${rec.id}: merged-witness record is the verbatim pre-R3 LibraryWork`);
  eq(r.witness.locator, rec.href, `${rec.id}: its locator is its preserved route`);
}

// ── 4. Stage-derived contribution ────────────────────────────────────────────────────────────────────────────────
ok(R3.works === publishedWorks().length - boundary.catalogue.count, "catalogue = pre-R3 boundary + R3.works");
eq(sorted(tally(publishedWorks(), (w) => w.shelf)), sorted(Object.fromEntries(Object.entries(boundary.catalogue.shelves).map(([k, v]) => [k, v + R3.shelves[k]]))), "shelf counts = boundary + R3.shelves");
eq(LIBRARY_COLLECTIONS.length, boundary.collections.count + R3.collections, "collections = boundary + R3.collections");

// ── 5. Poetry witness migration: the generated view equals the registry, and renders as before ────────────────────
eq(POETRY_WITNESS_RELATIONS.map((r) => [r.id, r.a.slug, r.b.slug, r.b.itemSlug, r.publicNote]), activeRelations()
  .filter((r) => r.legacyPoetryView)
  .map((r) => [r.id, r.canonicalId, r.witness.publicationId, r.witness.unitSlug, r.publicNote]), "POETRY_WITNESS_RELATIONS is exactly the registry's active legacy Poetry view");
const endpoints: [string, string?][] = [
  ...POEM_SLUGS.map((s) => [s] as [string]),
  ...POETRY_PUBLICATION_SLUGS.flatMap((p) => {
    const pub = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", p, "publication.json"), "utf8")) as { items?: { slug: string }[] };
    return (pub.items ?? []).map((i) => [p, i.slug] as [string, string]);
  }),
];
const rendered = endpoints.flatMap(([s, i]) => resolveWitnessLinks(s, i).map((l) => `${s}${i ? "/" + i : ""} → ${l.href} [${l.id}]`));
// The two Wave-4 relations render exactly as before, on both endpoints (their link lines are unchanged).
for (const line of [
  "idhayathai-thanthidu-anna → /poems/kalaignarin-kavithaigal/give-me-your-heart-anna [idhayathai-thanthidu-anna--kalaignarin-kavithaigal--item-01]",
  "thennan-kathai → /poems/kalaignarin-kavithaigal/the-tale-of-the-southerner [thennan-kathai--kalaignarin-kavithaigal--item-02]",
  "kalaignarin-kavithaigal/give-me-your-heart-anna → /poems/idhayathai-thanthidu-anna [idhayathai-thanthidu-anna--kalaignarin-kavithaigal--item-01]",
  "kalaignarin-kavithaigal/the-tale-of-the-southerner → /poems/thennan-kathai [thennan-kathai--kalaignarin-kavithaigal--item-02]",
]) ok(rendered.includes(line), `pre-R3 witness link unchanged: ${line}`);
{
  // Every ACTIVE R3 relation renders on its canonical work's page and, where it has one, on its witness's page; no
  // DORMANT relation renders on any page (canonical pages, witness pages, publication landings, essay units).
  const pageOf = (h: string) => h.split("#")[0];
  const pages = new Set<string>([
    ...publishedWorks().map((w) => pageOf(w.href)),
    ...R.map((r) => r.witness.locator).filter((l): l is string => !!l).map(pageOf),
    ...LIBRARY_PUBLICATIONS.map((p) => p.href),
  ]);
  const shown = new Map<string, Set<string>>();
  for (const p of Array.from(pages)) for (const l of r3WitnessLinksForPage(p)) shown.set(l.id, new Set([...Array.from(shown.get(l.id) ?? []), p]));
  for (const r of activeRelations().filter((x) => !x.legacyPoetryView)) {
    const home = publishedWorks().find((w) => w.id === r.canonicalId);
    ok(!!home && !!shown.get(r.id)?.has(pageOf(home.href)), `${r.id}: renders on its canonical work's page`);
    if (r.witness.locator) ok(!!shown.get(r.id)?.has(pageOf(r.witness.locator)), `${r.id}: renders on its witness's page`);
  }
  eq(Array.from(shown.keys()).filter((id) => R.find((r) => r.id === id)?.state !== "active"), [], "no dormant relation renders on any page");
  // The standalone / item poem pages expose exactly the same R3 set through resolveWitnessLinks.
  eq(rendered.filter((x) => !/\[(idhayathai-thanthidu-anna|thennan-kathai)--kalaignarin-kavithaigal--item-0[12]\]$/.test(x)).length,
    endpoints.reduce((n, [s, i]) => n + r3WitnessLinksForPage(i ? `/poems/${s}/${i}` : `/poems/${s}`).length, 0),
    "poem pages render exactly the R3 links their page resolves (plus the two Wave-4 links)");
}

// ── 6. Collections and the dormant merged-witness resolver ───────────────────────────────────────────────────────
for (const c of LIBRARY_COLLECTIONS) {
  const viaNew = resolveCollectionMembers(c).map(({ member, resolved }) => [member.workId, resolved.kind, resolved.kind === "work" ? resolved.work.id : ""]);
  const viaOld = collectionMemberWorks(c).map(({ member, work }) => [member.workId, "work", work.id]);
  eq(viaNew, viaOld, `${c.id}: every member resolves as a canonical LibraryWork, identically to collectionMemberWorks()`);
}
{
  // The capability, exercised on a hypothetical R3-D state (never the live one): the merged witness resolves only
  // when active and only when its canonical target is published; an unknown id still fails closed.
  const r = R.find((x) => x.class === "merged-witness" && (x.witness.record as LibraryWork).id === "sirai-kodiyathu");
  ok(!!r, "the sirai-kodiyathu → green-parrot merged-witness record exists");
  const target = { ...(LIBRARY_WORKS[0] as LibraryWork), id: "green-parrot", state: "published" as const };
  const worksAfter = [...LIBRARY_WORKS.filter((w) => w.id !== "sirai-kodiyathu"), target];
  let threw = false;
  try { resolveCollectionMember("sirai-kodiyathu", worksAfter, R); } catch { threw = true; }
  ok(threw, "a DORMANT merged witness does not resolve (fails closed)");
  const active = R.map((x) => (x.id === r?.id ? { ...x, state: "active" as const } : x));
  let res: ReturnType<typeof resolveCollectionMember> | undefined;
  try { res = resolveCollectionMember("sirai-kodiyathu", worksAfter, active); } catch { res = undefined; }
  ok(res?.kind === "merged-witness" && res.canonical.id === "green-parrot", "an ACTIVE merged witness resolves to its canonical target");
  threw = false;
  try { resolveCollectionMember("not-a-work", worksAfter, active); } catch { threw = true; }
  ok(threw, "an unknown member id still fails closed");
}

// ── 7. Derived lookups ───────────────────────────────────────────────────────────────────────────────────────────
eq(witnessesOf("gunanayagar-nehru").map((r) => r.id), R.filter((r) => r.canonicalId === "gunanayagar-nehru" && r.state === "active").map((r) => r.id), "witnessesOf() returns only active relations");
eq(canonicalFor("/poems/kalaignarin-kavithaigal/give-me-your-heart-anna"), "idhayathai-thanthidu-anna", "canonicalFor() resolves an active witness locator");
eq(canonicalFor("/poems/kaalap-pezhaiyum-kavithai-saaviyum/can-he-be-bought-with-love"), stages.includes("R3-B") ? "oruthalaik-kathal" : undefined, "canonicalFor() ignores a dormant witness");
eq(publicationAppearances("kaalap-pezhaiyum-kavithai-saaviyum").length, 58, "publicationAppearances() enumerates the 58 Kaalap units");

// ── 8. The canonical-href contract (plan §5.4) ──────────────────────────────────────────────────────────────────
function hrefViolations(works: { id: string; href: string }[], fragmentCohort: Set<string>, witnessLocators: Set<string>, routes: Set<string>): string[] {
  const out: string[] = [];
  const hrefs = works.map((w) => w.href);
  const dupH = hrefs.filter((h, i) => hrefs.indexOf(h) !== i);
  if (dupH.length) out.push(`duplicate hrefs: ${dupH.join(", ")}`);
  const byPath = new Map<string, string[]>();
  for (const w of works) byPath.set(w.href.split("#")[0], [...(byPath.get(w.href.split("#")[0]) ?? []), w.id]);
  for (const [p, ids] of Array.from(byPath)) if (ids.length > 1 && !ids.every((id) => fragmentCohort.has(id))) out.push(`pathname ${p} shared outside the declared fragment cohort: ${ids.join(", ")}`);
  for (const w of works) {
    if (witnessLocators.has(w.href)) out.push(`${w.id}: canonical href equals a witness locator`);
    if (!routes.has(w.href.split("#")[0])) out.push(`${w.id}: ${w.href} is not a live public route`);
  }
  return out;
}
const cohort = new Set(W.filter((w) => w.locator.fragment).map((w) => w.id));
const activeWitnessLocators = new Set(activeRelations().map((r) => r.witness.locator).filter((l): l is string => !!l));
eq(hrefViolations(publishedWorks(), cohort, activeWitnessLocators, smSet), [], "the canonical-href contract holds for every published work");
ok(hrefViolations([{ id: "a", href: "/x" }, { id: "b", href: "/x" }], cohort, new Set(), new Set(["/x"])).length > 0, "negative control: the href contract rejects a duplicate href");
ok(hrefViolations([{ id: "a", href: "/x#p1" }, { id: "b", href: "/x#p2" }], new Set(), new Set(), new Set(["/x"])).length > 0, "negative control: a shared pathname outside the cohort is rejected");
// Fragment anchors are required only once a fragment identity is published (R3-B adds the ids).
for (const w of W.filter((x) => x.locator.fragment && x.state === "published")) {
  const html = path.join(process.cwd(), ".next/server/app", `${w.locator.route}.html`);
  ok(fs.existsSync(html) && fs.readFileSync(html, "utf8").includes(`id="${w.locator.fragment}"`), `${w.id}: its fragment anchor is rendered`);
}

// ── 9. R3-A: no public change against the frozen pre-R3 boundary ────────────────────────────────────────────────
if (stages.length === 1 && stages[0] === "R3-A") {
  eq(sha256(JSON.stringify(LIBRARY_WORKS)), sha256(JSON.stringify(boundary.catalogue.records)), "R3-A: all 335 LibraryWork records are byte-identical to the pre-R3 boundary");
  eq(LIBRARY_PUBLICATIONS.length, 0, "R3-A: the publication registry is empty");
  eq(sha256(JSON.stringify(LIBRARY_COLLECTIONS)), sha256(JSON.stringify(boundary.collections.records)), "R3-A: the 9 collections are byte-identical");
  eq(activeRelations().map((r) => r.id), ["idhayathai-thanthidu-anna--kalaignarin-kavithaigal--item-01", "thennan-kathai--kalaignarin-kavithaigal--item-02"], "R3-A: only the two pre-R3 relations are active");
  eq(W.filter((w) => w.state === "published").length, 0, "R3-A: no CREATE identity is published");
  eq(createIds.filter((id) => liveIds.has(id) || liveSlugs.has(id)), [], "R3-A: no CREATE id is a LibraryWork id or slug");
  eq({ works: R3.works, collections: R3.collections, discovery: R3.discovery, visible: R3.visible, build: R3.build, sitemap: R3.sitemap, shelves: Object.values(R3.shelves).every((v) => v === 0) }, { works: 0, collections: 0, discovery: 0, visible: 0, build: 0, sitemap: 0, shelves: true }, "R3-A: every READ_IA_R3_CONTRIBUTION term is 0");
}

// ── 9b. R3-B: Poetry promotion ──────────────────────────────────────────────────────────────────────────────────
if (stages.join() === "R3-A,R3-B") {
  const pubW = W.filter((w) => w.state === "published");
  eq(pubW.length, 162, "R3-B: 162 identities published");
  eq(sorted(tally(pubW, (w) => w.family)), { "ina-poem": 3, meesai: 25, "poetry-1975": 3, "poetry-kaalap": 57, "poetry-kavithaigal": 74 }, "R3-B: exactly the five Poetry families (57 + 74 + 3 + 3 + 25)");
  eq(W.filter((w) => w.state === "dormant").length, 87, "R3-B: the 87 R3-C identities stay dormant");
  eq(publishedWorks().length, 493, "R3-B: canonical catalogue 493");
  eq(sorted(tally(publishedWorks(), (w) => w.shelf)), { "cinema-writing": 10, drama: 11, "essays-articles": 14, fiction: 162, letters: 1, "life-writing": 1, "literary-commentary": 4, poetry: 173, speeches: 117 }, "R3-B: shelves 1/1/162/173/11/10/117/14/4");
  eq({ works: R3.works, poetry: R3.shelves.poetry, essays: R3.shelves["essays-articles"], build: R3.build, sitemap: R3.sitemap, collections: R3.collections }, { works: 158, poetry: 159, essays: -1, build: 0, sitemap: 0, collections: 0 }, "R3-B: derived contribution +158 (Poetry +159, Essays −1), build/sitemap/collections 0");
  eq(LIBRARY_PUBLICATIONS.map((p) => [p.id, p.shelf, p.kind, p.demotedIn]), [
    ["kaalap-pezhaiyum-kavithai-saaviyum", "poetry", "source-publication", "R3-B"],
    ["kalaignarin-kavithaigal", "poetry", "source-publication", "R3-B"],
    ["kalaignarin-kaviyaranga-kavithaigal-1975", "poetry", "source-publication", "R3-B"],
    ["meesai-mulaiththa-vayathil", "essays-articles", "source-publication", "R3-B"],
  ], "R3-B: exactly four publication records (3 Poetry, 1 Essays)");
  for (const p of LIBRARY_PUBLICATIONS) {
    const former = boundary.catalogue.records.find((r) => r.id === p.id)!;
    const { state: _s, ...formerRest } = former;
    const { kind: _k, demotedIn: _d, ...rest } = p;
    eq(rest, formerRest, `${p.id}: publication record is its former LibraryWork record verbatim (minus state)`);
    ok(!LIBRARY_WORKS.some((w) => w.id === p.id) && !publishedWorks().some((w) => w.href === p.href), `${p.id}: no longer a canonical LibraryWork or canonical href`);
    ok(smSet.has(p.href) && (!p.provenanceHref || smSet.has(p.provenanceHref)), `${p.id}: its landing and /source routes remain`);
  }
  eq(activeRelations().length, 20, "R3-B: 20 active relations (2 pre-R3 + 18 R3-B)");
  eq(R.filter((r) => r.state === "dormant").map((r) => r.introducedIn).sort(), [...Array(2).fill("R3-C"), ...Array(27).fill("R3-D")].sort(), "R3-B: the 29 dormant relations are exactly R3-C (2) and R3-D (27)");
  ok(R.filter((r) => r.introducedIn === "R3-B").every((r) => r.state === "active"), "R3-B: all 18 R3-B relations are active");
  for (const id of ["sirai-kodiyathu", "neeyum-kaithi-naanum-kaithi", "aadik-kaatre", "pugazhe-nee-oru-pudhir", "sorgaththirku-vandhathu-eppadi"]) ok(published.has(id), `R3-B: future merge source ${id} is still a canonical Fiction work`);
  eq(LIBRARY_COLLECTIONS.length, 9, "R3-B: collections 9");
  eq(sha256(JSON.stringify(LIBRARY_COLLECTIONS)), sha256(JSON.stringify(boundary.collections.records)), "R3-B: collection records unchanged");
  // The Ina anchors: all eleven printed poem boundaries carry their id (Tamil-first static HTML).
  const inaHtml = path.join(process.cwd(), ".next/server/app/essays/ina-muzhakkam/articles/kavithaigal.html");
  if (fs.existsSync(inaHtml)) {
    const h = fs.readFileSync(inaHtml, "utf8");
    eq(Array.from({ length: 11 }, (_, i) => h.includes(`id="poem-6-${i + 1}"`)), Array(11).fill(true), "R3-B: anchors poem-6-1 … poem-6-11 are emitted on the ina unit");
  }
}
{
  // Stage-generic: no DO_NOT_PROMOTE row is ever a LibraryWork.
  // A DNP unit never becomes canonical: its route is never a canonical href, and its id never enters the catalogue
  // (unless it was already a pre-R3 work id — the publication-titled first units share their publication's id).
  const dnp = E.filter((e) => e.resolved.decision === "DO_NOT_PROMOTE") as (Row & { currentRoute: string })[];
  // Exact href strings: the ina `kavithaigal` heading (DNP) legitimately shares its PATHNAME with the three fragment
  // works, but its own locator (no fragment) must never be a canonical href.
  const hrefs = new Set(publishedWorks().map((w) => w.href));
  eq(dnp.length, 20, "20 DO_NOT_PROMOTE rows");
  eq(dnp.filter((e) => hrefs.has(e.currentRoute)).map((e) => e.key), [], "no DO_NOT_PROMOTE unit's route is a canonical href");
  eq(dnp.filter((e) => LIBRARY_WORKS.some((w) => w.id === e.resolved.canonicalId) && !boundary.catalogue.records.some((r) => r.id === e.resolved.canonicalId)).map((e) => e.key), [], "no DO_NOT_PROMOTE row has become a new LibraryWork");
}

// ── 10. Sitemap and build: the boundary plus the derived R3 terms ────────────────────────────────────────────────
eq(sm.length, boundary.sitemap.count + R3.sitemap, "sitemap() = pre-R3 5271-path boundary + R3.sitemap");
eq(sha256(boundary.sitemap.paths.join("\n")), boundary.sitemap.sha256, "the frozen pre-R3 sitemap set is internally consistent");
eq(boundary.sitemap.paths.filter((p) => !smSet.has(p)), [], "every pre-R3 sitemap URL is still in the sitemap");
if (R3.sitemap === 0) eq(sha256([...sm].sort().join("\n")), boundary.sitemap.sha256, "the sitemap set is byte-identical to the pre-R3 boundary (R3 adds no sitemap URL)");
const NEXT = path.join(process.cwd(), ".next");
if (!fs.existsSync(path.join(NEXT, "prerender-manifest.json"))) {
  ok(false, "no production build (.next/prerender-manifest.json) — run `npm run build`; the build checks cannot be skipped");
} else {
  const routes = Object.keys((JSON.parse(fs.readFileSync(path.join(NEXT, "prerender-manifest.json"), "utf8")) as { routes: Record<string, unknown> }).routes);
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const html = walk(path.join(NEXT, "server/app")).filter((f) => f.endsWith(".html")).length;
  eq({ prerender: routes.length, html }, { prerender: boundary.build.prerender + R3.build, html: boundary.build.html + R3.build }, "build = pre-R3 5280 / 5275 + R3.build");
}

if (failures.length) {
  console.error(`✗ test-r3-identity: ${failures.length} of ${checks} checks failed`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `✓ test-r3-identity: ${checks} checks — stage ${stages.join("+")} · manifest b7b3530d 315 = 249/27/19/20/0 · ` +
    `${W.length} identities (${W.filter((w) => w.state === "published").length} published) · ${R.length} relations (${activeRelations().length} active) · ` +
    `catalogue ${publishedWorks().length} · collections ${LIBRARY_COLLECTIONS.length} · sitemap ${sm.length}`,
);
