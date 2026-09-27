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
import { CANONICAL_SIDE_ONLY, publicationRelationNote, r3WitnessLinksForPage, resolveWitnessLinks } from "../lib/witness";
import { R3_IDENTITY, R3_RELATIONS, activeMergedWitness, activeRelations, canonicalFor, publicationAppearances, witnessesOf, type WorkRelation } from "../lib/work-relations";
import { resolveCollectionMember, resolveCollectionMembers } from "../lib/collection-members";
import { READ_IA_R3_CONTRIBUTION as R3 } from "../lib/read-ia-r3-contribution";
import { R3_MERGED_LEGACY, mergedLegacyRecord } from "../lib/read-ia-r3-projection";

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
    // Canonical-side-only classes (R3-D Sangatamil) must NOT render on the witness page; every other class must.
    if (r.witness.locator) ok(!!shown.get(r.id)?.has(pageOf(r.witness.locator)) === !CANONICAL_SIDE_ONLY.has(r.class), `${r.id}: ${CANONICAL_SIDE_ONLY.has(r.class) ? "does NOT render" : "renders"} on its witness's page`);
  }
  eq(Array.from(shown.keys()).filter((id) => R.find((r) => r.id === id)?.state !== "active"), [], "no dormant relation renders on any page");
  // The standalone / item poem pages expose exactly the same R3 set through resolveWitnessLinks.
  eq(rendered.filter((x) => !/\[(idhayathai-thanthidu-anna|thennan-kathai)--kalaignarin-kavithaigal--item-0[12]\]$/.test(x)).length,
    endpoints.reduce((n, [s, i]) => n + r3WitnessLinksForPage(i ? `/poems/${s}/${i}` : `/poems/${s}`).length, 0),
    "poem pages render exactly the R3 links their page resolves (plus the two Wave-4 links)");
}

// ── 6. Collections and the dormant merged-witness resolver ───────────────────────────────────────────────────────
for (const c of LIBRARY_COLLECTIONS) {
  // collectionMemberWorks() resolves through the merged-witness resolver: a member is a canonical work, or (R3-D) an
  // active merged witness — its verbatim legacy record plus its canonical target. Both paths must agree exactly.
  const viaNew = resolveCollectionMembers(c).map(({ member, resolved }) => [member.workId, resolved.kind, resolved.kind === "work" ? resolved.work.id : (resolved.relation.witness.record as LibraryWork).id, resolved.kind === "work" ? "" : resolved.canonical.id]);
  const viaOld = collectionMemberWorks(c).map(({ member, work, merged }) => [member.workId, merged ? "merged-witness" : "work", work.id, merged?.canonical.id ?? ""]);
  eq(viaNew, viaOld, `${c.id}: every member resolves identically through collectionMemberWorks() and the resolver`);
  eq(viaNew.filter(([id, kind]) => kind === "merged-witness" && !activeMergedWitness(id)), [], `${c.id}: only ACTIVE merged witnesses resolve as merged-witness`);
}
{
  // The capability, exercised on a hypothetical R3-D state (never the live one): the merged witness resolves only
  // when active and only when its canonical target is published; an unknown id still fails closed.
  const r = R.find((x) => x.class === "merged-witness" && (x.witness.record as LibraryWork).id === "sirai-kodiyathu");
  ok(!!r, "the sirai-kodiyathu → green-parrot merged-witness record exists");
  const target = { ...(LIBRARY_WORKS[0] as LibraryWork), id: "green-parrot", state: "published" as const };
  const worksAfter = [...LIBRARY_WORKS.filter((w) => w.id !== "sirai-kodiyathu" && w.id !== "green-parrot"), target];
  const dormant = R.map((x) => (x.id === r?.id ? { ...x, state: "dormant" as const } : x));
  let threw = false;
  try { resolveCollectionMember("sirai-kodiyathu", worksAfter, dormant); } catch { threw = true; }
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
// ── 9c. R3-C: Essays / Letters / Speech promotion (frozen plan §13 R3-C) ─────────────────────────────────────────
if (stages.join() === "R3-A,R3-B,R3-C") {
  const pubW = W.filter((w) => w.state === "published");
  const rc = W.filter((w) => w.introducedIn === "R3-C");
  eq(pubW.length, 249, "R3-C: all 249 CREATE identities are published");
  eq(W.filter((w) => w.state !== "published").length, 0, "R3-C: no CREATE identity remains dormant");
  // Each CREATE identity is exactly one canonical LibraryWork, on its frozen resolved shelf and subtype.
  const createRow = new Map(CREATE.map((e) => [e.resolved.canonicalId, e]));
  eq(W.filter((w) => LIBRARY_WORKS.filter((x) => x.id === w.id).length !== 1).map((w) => w.id), [], "R3-C: every CREATE identity is a LibraryWork exactly once");
  eq(W.filter((w) => { const x = LIBRARY_WORKS.find((y) => y.id === w.id); return !x || x.shelf !== w.shelf || x.subtype !== w.subtype || x.shelf !== createRow.get(w.id)?.resolved.shelf; }).map((w) => w.id), [], "R3-C: all 249 on their frozen shelf and subtype");
  eq(rc.length, 87, "R3-C: 87 R3-C identities");
  eq(sorted(tally(rc, (w) => w.family)), {
    "essays-kolaikkalam": 6, "essays-perumoochu": 13, "essays-sinthanaiyum-seyalum": 50, "essays-thiraavida-sampaththu": 2,
    "essays-thudikkum-ilamai": 2, "essays-unarchchimaalai": 9, "ina-prose": 5,
  }, "R3-C: exactly the seven R3-C families");
  eq(sorted(tally(rc, (w) => `${w.shelf}/${w.subtype}`)), { "essays-articles/essay": 84, "letters/letter": 2, "speeches/public-speech": 1 }, "R3-C: 84 Essays, 2 Letters, 1 Speech");
  eq(rc.filter((w) => w.shelf === "letters").map((w) => w.id).sort(), ["athiga-uyaram-thaanduvatharku", "paasiyum-thoosiyum"], "R3-C: the two OD8 Letters are exactly the approved pair");
  eq(rc.filter((w) => w.shelf === "speeches").map((w) => w.id), ["thudikkum-ilamai-urai"], "R3-C: thudikkum-ilamai-urai is the only R3-C Speech");
  // Reader routes are reused, never invented: every R3-C work reads at its existing publication-unit route.
  for (const w of rc) {
    const x = LIBRARY_WORKS.find((y) => y.id === w.id);
    ok(!!x, `R3-C ${w.id}: is a canonical LibraryWork`);
    if (!x) continue;
    ok(x.readerStructure === "publication-unit" && x.href === w.locator.href && x.href.startsWith(`/essays/${w.parentPublicationId}/articles/`) && smSet.has(x.href), `R3-C ${w.id}: reads at its existing unit route ${w.locator.href}`);
    // Source pins and metadata are inherited from the parent publication exactly (no unit-level pin exists).
    const parent = boundary.catalogue.records.find((r) => r.id === w.parentPublicationId) as unknown as Record<string, unknown>;
    const rec = x as unknown as Record<string, unknown>;
    ok(["sourceRepo", "sourcePath", "sourceCommit", "edition", "tamil", "english", "englishKind", "rights", "provenanceHref"].every((k) => JSON.stringify(rec[k]) === JSON.stringify(parent[k])), `R3-C ${w.id}: source pins and metadata inherited from ${w.parentPublicationId} exactly`);
  }
  eq(publishedWorks().length, 573, "R3-C: canonical catalogue 573");
  eq(sorted(tally(publishedWorks(), (w) => w.shelf)), { "cinema-writing": 10, drama: 11, "essays-articles": 91, fiction: 162, letters: 3, "life-writing": 1, "literary-commentary": 4, poetry: 173, speeches: 118 }, "R3-C: shelves 1/3/162/173/11/10/118/91/4");
  eq({ works: R3.works, poetry: R3.shelves.poetry, essays: R3.shelves["essays-articles"], letters: R3.shelves.letters, speeches: R3.shelves.speeches, others: Object.entries(R3.shelves).filter(([k]) => !["poetry", "essays-articles", "letters", "speeches"].includes(k)).every(([, v]) => v === 0), build: R3.build, sitemap: R3.sitemap, collections: R3.collections },
    { works: 238, poetry: 159, essays: 76, letters: 2, speeches: 1, others: true, build: 0, sitemap: 0, collections: 0 }, "R3-C: derived contribution +238 (Poetry +159, Essays +76, Letters +2, Speeches +1), all else 0");
  eq(LIBRARY_PUBLICATIONS.map((p) => [p.id, p.shelf, p.kind, p.demotedIn]).sort(), [
    ["kaalap-pezhaiyum-kavithai-saaviyum", "poetry", "source-publication", "R3-B"],
    ["kalaignarin-kavithaigal", "poetry", "source-publication", "R3-B"],
    ["kalaignarin-kaviyaranga-kavithaigal-1975", "poetry", "source-publication", "R3-B"],
    ["meesai-mulaiththa-vayathil", "essays-articles", "source-publication", "R3-B"],
    ["ina-muzhakkam", "essays-articles", "source-publication", "R3-C"],
    ["unarchchimaalai", "essays-articles", "source-publication", "R3-C"],
    ["thiraavida-sampaththu", "essays-articles", "source-publication", "R3-C"],
    ["kolaikkalam", "essays-articles", "source-publication", "R3-C"],
    ["sinthanaiyum-seyalum", "essays-articles", "source-publication", "R3-C"],
    ["perumoochu", "essays-articles", "source-publication", "R3-C"],
    ["thudikkum-ilamai", "essays-articles", "source-publication", "R3-C"],
  ].sort(), "R3-C: exactly 11 publication records (Poetry 3, Essays 8), the 7 new ones demoted in R3-C");
  for (const p of LIBRARY_PUBLICATIONS) {
    const former = boundary.catalogue.records.find((r) => r.id === p.id)!;
    const { state: _s, ...formerRest } = former;
    const { kind: _k, demotedIn: _d, ...rest } = p;
    eq(rest, formerRest, `${p.id}: publication record is its former LibraryWork record verbatim (minus state)`);
    ok(!LIBRARY_WORKS.some((w) => w.id === p.id) && !publishedWorks().some((w) => w.href === p.href), `${p.id}: no longer a canonical LibraryWork or canonical href`);
    ok(smSet.has(p.href) && (!p.provenanceHref || smSet.has(p.provenanceHref)), `${p.id}: its landing and /source routes remain`);
  }
  // Relations: exactly the two R3-C section witnesses of idhaya-perikai join the active set.
  const RC_REL = ["r3:thudikkum-ilamai/poompuhar->idhaya-perikai", "r3:thudikkum-ilamai/vetri-vilakku->idhaya-perikai"];
  eq(activeRelations().length, 22, "R3-C: 22 active relations (2 pre-R3 + 18 R3-B + 2 R3-C)");
  eq(R.filter((r) => r.introducedIn === "R3-C").map((r) => [r.id, r.state]), RC_REL.map((id) => [id, "active"]), "R3-C: exactly the two R3-C relations are active");
  eq(sorted(tally(R.filter((r) => r.state === "dormant"), (r) => `${r.introducedIn}/${r.class}`)), { "R3-D/commentary-section": 11, "R3-D/external-publication": 11, "R3-D/merged-witness": 5 }, "R3-C: the 27 dormant relations are exactly R3-D (5 merges, 11 Sangatamil, 11 1958)");
  for (const id of RC_REL) {
    const r = R.find((x) => x.id === id)!;
    ok(r.class === "source-publication" && r.relation === "SAME_CANONICAL_ESSAY_ALTERNATE_WITNESS" && r.level === "section" && r.canonicalId === "idhaya-perikai" && published.has("idhaya-perikai"), `${id}: a section witness of the published idhaya-perikai`);
    ok(!LIBRARY_WORKS.some((w) => w.href === r.witness.locator || w.id === r.witness.unitSlug), `${id}: the witness unit ${r.witness.unitSlug} is not a canonical LibraryWork`);
  }
  eq(r3WitnessLinksForPage("/speeches/idhaya-perikai").map((l) => [l.id, l.href]), RC_REL.map((id) => [id, R.find((x) => x.id === id)!.witness.locator ?? undefined]), "R3-C: idhaya-perikai shows exactly its two section witnesses, linked");
  for (const id of RC_REL) eq(r3WitnessLinksForPage(String(R.find((x) => x.id === id)!.witness.locator)).map((l) => [l.id, l.href]), [[id, "/speeches/idhaya-perikai"]], `${id}: the witness unit links back to idhaya-perikai`);
  // The five merges stay R3-D: every source is still a canonical Fiction work; every target now exists.
  for (const r of R.filter((x) => x.class === "merged-witness")) {
    const src = (r.witness.record as LibraryWork).id;
    ok(r.state === "dormant" && r.introducedIn === "R3-D", `${r.id}: merged-witness stays dormant R3-D`);
    ok(LIBRARY_WORKS.some((w) => w.id === src && w.shelf === "fiction"), `R3-C: merge source ${src} is still a canonical Fiction work`);
    ok(published.has(r.canonicalId), `R3-C: merge target ${r.canonicalId} is canonical`);
  }
  eq(LIBRARY_COLLECTIONS.length, 9, "R3-C: collections 9");
  eq(sha256(JSON.stringify(LIBRARY_COLLECTIONS)), sha256(JSON.stringify(boundary.collections.records)), "R3-C: collection records unchanged");
  // Built pages: the Ina anchors stay; idhaya-perikai and both witness units carry their notes.
  const built = (r: string) => { const f = path.join(process.cwd(), ".next/server/app", `${r}.html`); return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null; };
  const ina = built("essays/ina-muzhakkam/articles/kavithaigal");
  if (ina) eq(Array.from({ length: 11 }, (_, i) => ina.includes(`id="poem-6-${i + 1}"`)), Array(11).fill(true), "R3-C: anchors poem-6-1 … poem-6-11 are still emitted on the ina unit");
  const perikai = built("speeches/idhaya-perikai");
  if (perikai) ok(perikai.includes("Section 3 of this work") && perikai.includes("Section 4 of this work"), "R3-C: the idhaya-perikai page carries its two section-witness links");
  for (const u of ["poompuhar", "vetri-vilakku"]) {
    const h = built(`essays/thudikkum-ilamai/articles/${u}`);
    if (h) ok(h.includes("/speeches/idhaya-perikai") && /இன் ஒரு மூல ஆதாரப் பதிப்பு|is a source witness of section/.test(h), `R3-C: the ${u} witness unit links back to idhaya-perikai`);
  }
}
// ── 9d. R3-D: merges, Sangatamil, 1958 — the final R3 state (frozen plan §7, §9, §10, §13 R3-D) ─────────────────
/** The five frozen merges (OD3–OD5): legacy Fiction work → canonical target, and the 2004 ordinal it is printed at. */
const R3D_MERGES: ReadonlyArray<[legacy: string, target: string, ordinal: number]> = [
  ["neeyum-kaithi-naanum-kaithi", "piraiye", 2], ["sorgaththirku-vandhathu-eppadi", "sorgga-logaththil", 14],
  ["aadik-kaatre", "adikkaatru", 17], ["sirai-kodiyathu", "green-parrot", 20], ["pugazhe-nee-oru-pudhir", "pugazh", 23],
];
/** The five merged stories' payloads, pinned from the pre-R3D tree (Batch-7 import 171d7b37): a merge never edits a story. */
const MERGED_STORY_PAYLOADS: Record<string, string> = {
  "neeyum-kaithi-naanum-kaithi/provenance.json": "10f7a2dc3d23ff12c914e9e4aa2f3f270cf5781a48c2baa24cb82c853810b717",
  "neeyum-kaithi-naanum-kaithi/story.json": "7be43bcbfaa65a673e9f167ed63ffbe15477c9a7c8a769a72153a0e1361b7cf4",
  "sorgaththirku-vandhathu-eppadi/provenance.json": "3ac6a3e29a9d0e0a250a05caa68a8048643a28fbb80d55c09352b72d5a49729c",
  "sorgaththirku-vandhathu-eppadi/story.json": "bd96c480801439102c2762ce0dc508fac6aa0f1f2cc3b3f4b756934f8cbc534e",
  "aadik-kaatre/provenance.json": "436a4a36835b87d9cd69c538ec0a52e5f1c05f59e5c269e4bbecc4b723824e09",
  "aadik-kaatre/story.json": "7ebc17e63e65b82a9540bd5679a25a2523643c5c17190bbe280ad85b0dbb2fa7",
  "sirai-kodiyathu/provenance.json": "a09712ceae89cffb8f84f742f08c2393b8517aaa48cfcfcbc9874aed2b6708b8",
  "sirai-kodiyathu/story.json": "3bfdba31e08ce589b5b08dde8c7f077def4e7f4f4af26b4dcaefe06c55f03a75",
  "pugazhe-nee-oru-pudhir/provenance.json": "08465d2338f2badbab6d00f0b1c57122564b9af05a39057db34efe688c78c8b1",
  "pugazhe-nee-oru-pudhir/story.json": "549030defb97976bc369464acb9dcb305bfe4ba937c58f7bd5a3322103dd3561",
};
/**
 * The Sangatamil landing and its 104 section pages, normalized (script / link / asset references removed), pinned from
 * the R3-C build of tree 6c4ad32a (Production-identical): R3 changes nothing Sangatamil renders (frozen plan §9).
 */
const SANGATAMIL_R3C_AGGREGATE = "0b813c64db2f01df6356b59df4b0528b8f51e1a95541c22e28b362ed8014bdd0";
const normHtml = (h: string) => h.replace(/<script\b[\s\S]*?<\/script>/g, "").replace(/<link\b[^>]*>/g, "").replace(/\/_next\/static\/[^"')\s]+/g, "");
if (stages.join() === "R3-A,R3-B,R3-C,R3-D") {
  const pubW = W.filter((w) => w.state === "published");
  eq(pubW.length, 249, "R3-D: all 249 CREATE identities are published");
  eq(W.filter((w) => w.state !== "published").length, 0, "R3-D: no CREATE identity is dormant");
  const createRow = new Map(CREATE.map((e) => [e.resolved.canonicalId, e]));
  eq(W.filter((w) => { const x = LIBRARY_WORKS.filter((y) => y.id === w.id); return x.length !== 1 || x[0].shelf !== w.shelf || x[0].subtype !== w.subtype || x[0].shelf !== createRow.get(w.id)?.resolved.shelf; }).map((w) => w.id), [], "R3-D: every CREATE identity is canonical exactly once, on its frozen shelf and subtype");
  eq(publishedWorks().length, 568, "R3-D: canonical catalogue 568");
  eq(sorted(tally(publishedWorks(), (w) => w.shelf)), { "cinema-writing": 10, drama: 11, "essays-articles": 91, fiction: 157, letters: 3, "life-writing": 1, "literary-commentary": 4, poetry: 173, speeches: 118 }, "R3-D: shelves 1/3/157/173/11/10/118/91/4");
  eq({ works: R3.works, fiction: R3.shelves.fiction, poetry: R3.shelves.poetry, essays: R3.shelves["essays-articles"], letters: R3.shelves.letters, speeches: R3.shelves.speeches, others: Object.entries(R3.shelves).filter(([k]) => !["fiction", "poetry", "essays-articles", "letters", "speeches"].includes(k)).every(([, v]) => v === 0), build: R3.build, sitemap: R3.sitemap, collections: R3.collections },
    { works: 233, fiction: -5, poetry: 159, essays: 76, letters: 2, speeches: 1, others: true, build: 0, sitemap: 0, collections: 0 }, "R3-D: derived contribution +233 (Fiction −5, Poetry +159, Essays +76, Letters +2, Speeches +1), all else 0");
  eq(LIBRARY_PUBLICATIONS.length, 11, "R3-D: 11 publication records (no further demotion or restoration)");
  eq(sorted(tally(LIBRARY_PUBLICATIONS, (p) => `${p.shelf}/${p.demotedIn}`)), { "essays-articles/R3-B": 1, "essays-articles/R3-C": 7, "poetry/R3-B": 3 }, "R3-D: publication records unchanged (Poetry 3, Essays 8)");
  for (const p of LIBRARY_PUBLICATIONS) {
    const { state: _s, ...formerRest } = boundary.catalogue.records.find((r) => r.id === p.id)!;
    const { kind: _k, demotedIn: _d, ...rest } = p;
    eq(rest, formerRest, `${p.id}: publication record is its former LibraryWork record verbatim (minus state)`);
  }
  // Relations: every record active; classes and levels unchanged and distinct.
  eq({ total: R.length, active: activeRelations().length, dormant: R.filter((r) => r.state !== "active").length }, { total: 49, active: 49, dormant: 0 }, "R3-D: 49 relations, all active, 0 dormant");
  eq(sorted(tally([...R], (r) => r.class)), { "commentary-section": 11, "external-publication": 11, "merged-witness": 5, "source-publication": 22 }, "R3-D: classes 22 / 5 / 11 / 11");
  eq(sorted(tally([...R], (r) => `${r.class}/${r.level}`)), { "commentary-section/section": 11, "external-publication/chapter": 10, "external-publication/publication": 1, "merged-witness/work": 5, "source-publication/section": 2, "source-publication/work": 20 }, "R3-D: levels work / section / chapter / publication, by class");

  // ── the five merges ──
  const coll2004 = LIBRARY_COLLECTIONS.find((c) => c.id === "2004-kalaignarin-kuttik-kathaigal")!;
  const frozen2004 = (boundary.collections.records as { id: string; members: { workId: string; ordinal?: number }[] }[]).find((c) => c.id === coll2004.id)!;
  eq(R.filter((r) => r.class === "merged-witness").map((r) => [(r.witness.record as LibraryWork).id, r.canonicalId]).sort(), R3D_MERGES.map(([l, t]) => [l, t]).sort(), "R3-D: exactly the five frozen merges are the merged-witness records");
  for (const [legacy, target, ordinal] of R3D_MERGES) {
    const rels = R.filter((r) => r.class === "merged-witness" && (r.witness.record as LibraryWork).id === legacy);
    ok(!LIBRARY_WORKS.some((w) => w.id === legacy) && !publishedWorks().some((w) => w.href === `/stories/${legacy}`), `${legacy}: no longer a canonical LibraryWork or canonical href`);
    ok(rels.length === 1 && rels[0].state === "active" && rels[0].canonicalId === target, `${legacy}: exactly one ACTIVE merged-witness record → ${target}`);
    eq(publishedWorks().filter((w) => w.id === target).length, 1, `${legacy}: target ${target} is canonical exactly once`);
    ok(smSet.has(`/stories/${legacy}`) && smSet.has(`/stories/${legacy}/source`), `${legacy}: its story route and /source are preserved`);
    for (const f of ["story.json", "provenance.json"]) eq(sha256(fs.readFileSync(path.join(process.cwd(), "public/data/stories", legacy, f))), MERGED_STORY_PAYLOADS[`${legacy}/${f}`], `${legacy}/${f}: story payload unchanged`);
    const onStory = r3WitnessLinksForPage(`/stories/${legacy}`);
    const tw = publishedWorks().find((w) => w.id === target)!;
    eq(onStory.map((l) => [l.id, l.href]), [[rels[0]?.id, tw.href]], `${legacy}: its story page carries exactly the notice linking ${target}`);
    ok(onStory.every((l) => (tw.shelf === "essays-articles" ? /\bessay\b/.test(l.noteEn) && !/\bpoem\b/.test(l.noteEn) : /\bpoem\b/.test(l.noteEn))), `${legacy}: the notice is work-type aware (${tw.shelf})`);
    ok(r3WitnessLinksForPage(tw.href.split("#")[0]).some((l) => l.id === rels[0]?.id && l.href === `/stories/${legacy}`), `${target}: its page lists the legacy story witness`);
    eq(coll2004.members.filter((m) => m.workId === legacy).map((m) => m.ordinal), [ordinal], `${legacy}: still a 2004 member at printed ordinal ${ordinal}`);
  }
  eq(Array.from(R3_MERGED_LEGACY).sort(), R3D_MERGES.map(([l, t]) => [l, t]).sort(), "validators' narrow merge exception (R3_MERGED_LEGACY) is exactly the five frozen merges");
  eq(R3D_MERGES.filter(([l]) => !mergedLegacyRecord(l)).map(([l]) => l), [], "every frozen merge resolves to its active legacy record");
  // green-parrot keeps its Meesai witness and gains the merged story, without duplication.
  eq(r3WitnessLinksForPage("/poems/kalaignarin-kavithaigal/green-parrot").map((l) => l.href), ["/essays/meesai-mulaiththa-vayathil/articles/pachchaikkili", "/stories/sirai-kodiyathu"], "green-parrot: Meesai witness kept + merged story added, once each");
  // ── collections: data untouched, resolution learns merged witnesses ──
  eq(sha256(JSON.stringify(LIBRARY_COLLECTIONS)), sha256(JSON.stringify(boundary.collections.records)), "R3-D: LIBRARY_COLLECTIONS is byte-identical to the frozen pre-R3 boundary");
  eq(coll2004.members.length, 34, "2004 anthology: 34 members");
  eq(coll2004.members.map((m) => [m.workId, m.ordinal]), frozen2004.members.map((m) => [m.workId, m.ordinal]), "2004 anthology: member ids, order and ordinals unchanged");
  const res2004 = resolveCollectionMembers(coll2004);
  eq(res2004.filter((x) => x.resolved.kind === "merged-witness").map((x) => [x.member.workId, x.resolved.kind === "merged-witness" ? x.resolved.canonical.id : ""]).sort(), R3D_MERGES.map(([l, t]) => [l, t]).sort(), "2004 anthology: exactly the five legacy ids resolve as merged-witness, to their canonical targets");
  eq(res2004.filter((x) => x.resolved.kind === "work").length, 29, "2004 anthology: the other 29 members resolve as canonical works");
  { let threw = false; try { resolveCollectionMember("undeclared-missing-member"); } catch { threw = true; } ok(threw, "an undeclared missing member still fails closed"); }
  {
    // Negative control: repointing one member to its canonical id is caught by the frozen-membership assertion.
    const repointed = coll2004.members.map((m) => (m.workId === "sirai-kodiyathu" ? { ...m, workId: "green-parrot" } : m));
    ok(JSON.stringify(repointed.map((m) => [m.workId, m.ordinal])) !== JSON.stringify(frozen2004.members.map((m) => [m.workId, m.ordinal])), "negative control: a repointed collection member fails the frozen-membership assertion");
  }
  const built = (r: string) => { const f = path.join(process.cwd(), ".next/server/app", `${r}.html`); return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null; };
  const collHtml = built("collections/2004-kalaignarin-kuttik-kathaigal");
  if (collHtml) {
    for (const [legacy, target] of R3D_MERGES) {
      const tw = publishedWorks().find((w) => w.id === target)!;
      ok(collHtml.includes(`href="/stories/${legacy}"`) && collHtml.includes(`href="${tw.href.replace(/&/g, "&amp;")}"`), `2004 collection page: ${legacy} links its story and its canonical ${target}`);
    }
    eq((collHtml.match(/href="\/stories\/[^"/]+"/g) ?? []).length, 34, "2004 collection page: 34 member story links");
  }
  // ── Sangatamil: canonical side only; its own pages unchanged ──
  eq(publishedWorks().filter((w) => w.id === "sangatamil").map((w) => w.shelf), ["literary-commentary"], "Sangatamil: one Literary Commentary LibraryWork");
  eq(publishedWorks().filter((w) => w.href.startsWith("/sangatamil/")).length, 0, "Sangatamil: no section is a LibraryWork");
  const sgRel = R.filter((r) => r.class === "commentary-section");
  eq(sgRel.length, 11, "Sangatamil: 11 commentary-section relations");
  for (let n = 1; n <= 11; n++) {
    const route = `/sangatamil/${String(91 + n).padStart(3, "0")}-oruthalaik-kaadhal-${String(n).padStart(2, "0")}`;
    eq(r3WitnessLinksForPage(`/poems/oruthalaik-kathal/section-${n}`).map((l) => l.href), [route], `oruthalaik-kathal section ${n}: exactly its one Sangatamil link ${route}`);
  }
  const landing = r3WitnessLinksForPage("/poems/oruthalaik-kathal").map((l) => l.href);
  eq(landing.filter((h) => h?.startsWith("/sangatamil/")).length, 11, "oruthalaik-kathal landing: all 11 Sangatamil sections");
  ok(landing.includes("/poems/kaalap-pezhaiyum-kavithai-saaviyum/can-he-be-bought-with-love"), "oruthalaik-kathal landing: the Kaalap witness is kept");
  const sgRoutes = sm.filter((p) => p === "/sangatamil" || /^\/sangatamil\/\d{3}-/.test(p));
  eq(sgRoutes.length, 105, "Sangatamil: landing + 104 section routes in the sitemap");
  eq(sgRoutes.flatMap((p) => r3WitnessLinksForPage(p)).length, 0, "Sangatamil: no reverse relation note resolves on any Sangatamil page");
  if (built("sangatamil")) {
    const dir = path.join(process.cwd(), ".next/server/app/sangatamil");
    const files = ["sangatamil.html", ...fs.readdirSync(dir).filter((f) => f.endsWith(".html") && f !== "source.html").sort().map((f) => `sangatamil/${f}`)];
    const lines = files.map((f) => `${f} ${sha256(normHtml(fs.readFileSync(path.join(process.cwd(), ".next/server/app", f), "utf8")))}`);
    eq({ pages: files.length, aggregate: sha256(lines.join("\n")) }, { pages: 105, aggregate: SANGATAMIL_R3C_AGGREGATE }, "Sangatamil: landing + 104 section pages render byte-identically to R3-C (normalized)");
  }
  // ── 1958 தேனலைகள் ──
  const ext = R.filter((r) => r.class === "external-publication" && r.witness.externalId === "1958-thenalaigal");
  eq({ total: ext.length, chapter: ext.filter((r) => r.level === "chapter").length, publication: ext.filter((r) => r.level === "publication").length }, { total: 11, chapter: 10, publication: 1 }, "1958: 10 chapter-level + 1 publication-level relations");
  ok(ext.filter((r) => r.level === "chapter").every((r) => typeof r.witness.alai === "number") && ext.filter((r) => r.level === "publication").every((r) => !("alai" in r.witness)), "1958: chapter records carry an அலை; the publication record carries none");
  ok(!R.some((r) => r.witness.alai === 3 || /முத்துமாலை/.test(String(r.witness.headingTa ?? ""))), "1958: no relation maps அலை 3 முத்துமாலை");
  ok(!LIBRARY_WORKS.some((w) => /1958|thenalaigal-1958/.test(w.id)) && !sm.some((p) => /1958/.test(p)), "1958: the publication is not a LibraryWork and has no route");
  for (const r of ext) {
    const home = publishedWorks().find((w) => w.id === r.canonicalId)!;
    const note = r3WitnessLinksForPage(home.href).find((l) => l.id === r.id);
    ok(!!note && !note.href && (r.level === "chapter" ? note.noteEn.includes(`அலை ${r.witness.alai} «${r.witness.headingTa}»`) && !note.detailEn : note.noteEn === "Related to the 1958 publication" && /no chapter equivalence/.test(note.detailEn ?? "")), `${r.canonicalId}: shows its ${r.level}-level 1958 note (no link)`);
  }
  const od6 = publicationRelationNote("meesai-mulaiththa-vayathil");
  ok(!!od6 && /Units 16–26/.test(od6.en) && /அலை 3 is not mapped/.test(od6.en) && /அலை 1 relates at publication level only/.test(od6.en), "Meesai landing: the OD6 publication-level note (units 16–26; அலை 1 publication-level; அலை 3 unmapped)");
  const meesaiHtml = built("essays/meesai-mulaiththa-vayathil");
  if (meesaiHtml) ok(meesaiHtml.includes('data-testid="publication-relation-note"'), "Meesai landing page renders the OD6 note");
  // ── the built story pages carry their notice ──
  for (const [legacy] of R3D_MERGES) { const h = built(`stories/${legacy}`); if (h) ok(/மூல ஆதாரப் பதிப்பு/.test(h), `stories/${legacy}: the built page carries the merged-witness notice`); }
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
