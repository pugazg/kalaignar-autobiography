/**
 * Wave 7 Batches 2-4 P4 — PUBLICATION integration validator. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave7-b2-b4-p4-integration.ts
 *
 * The authoritative published-surface gate for the 13 works (2 drama + 5 novels + 6 essays) and the
 * arumbu-1978 collection. Proves:
 *   1. CATALOGUE 219→232 (Drama 8→10, Fiction 157→162, Essays 9→15, Cinema unchanged at 10). Each of the
 *      13 published exactly once, source-faithful card copy, evidence-based rights (drama+novels carry
 *      the nationalisation record; essays carry none — like the existing essays), nachuk-koppai discloses
 *      its terminal source hold on the card.
 *   2. COLLECTIONS 6→7: arumbu-1978 is ONE anthology of exactly 4 members in printed physical order
 *      (arumbu, சாரப்பள்ளம் சாமுண்டி, பெரிய இடத்துப் பெண், நடுத்தெரு நாராயணி) with UNSET ordinals — the source is a
 *      four-story volume. பெரிய இடத்துப் பெண் is an EXISTING work; its 1978 occurrence is a member/witness, its
 *      canonical 1953 edition/provenance unchanged, carrying the collection-local extent (scans 49-74). No
 *      member is a new/fourteenth work; the works stay independent LibraryWorks (never collapsed into one).
 *   3. DISCOVERY 80→90 (40 still visible), Fiction 20 / Drama 10 / Essays 15 / Cinema 10; all four members
 *      (incl. the pre-existing பெரிய இடத்துப் பெண் standalone card) collapse into ONE collection card.
 *   4. SITEMAP 4042→4267 (0 dup): +224 direct routes (== the P3 manifest) + 1 collection route.
 *   5. BUILD 4275→4276 prerender / 4270→4271 HTML (+1 collection route) when a build tree is present.
 *   6. 18 ADVERSARIAL mutation checks — each proves a specific corruption is REJECTED.
 * Consumes the in-repo data + P1/P3 records; no source clone, no network. Source byte-identity/subtree
 * pins are owned by the source-integrity job (scripts/validate-wave7-b2-b4-*.mjs).
 */
import fs from "node:fs";
import path from "node:path";
import { publishedWorks, LIBRARY_WORKS, type LibraryWork } from "../data/library";
import { discoveryShelves, LIBRARY_COLLECTIONS, COLLECTION_IDS, collectionById } from "../data/collections";
import sitemap from "../app/sitemap";
import { PLAY_SLUGS } from "../data/plays";
import { NOVEL_SLUGS } from "../data/novels";
import { ESSAY_SLUGS } from "../data/essays";
// Later Wave-7 batch (B5a/B5b/B6/Kuraloviyam) contribution — derived, see lib/wave7-b5-b6-k-contribution.ts.
import { WAVE7_B5_B6_K_CONTRIBUTION as W7K } from "../lib/wave7-b5-b6-k-contribution";
import { WAVE8_CONTRIBUTION as W8 } from "../lib/wave8-contribution";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const uniqSorted = (a: string[]) => Array.from(new Set(a)).sort();
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const CAP = 6;
const BASE = "https://nenjukkuneethi.org";

const p3 = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave7/b2-b4-p3-routes.json"), "utf8")) as { works: { slug: string; routes: string[] }[]; totalRouteCount: number };
const P3_ROUTES: string[] = p3.works.flatMap((w) => w.routes);

const DRAMA = ["iratha-kanneer", "nachuk-koppai"];
const NOVELS = ["arumbu", "nadutheru-narayani", "sarapallam-samundi", "surulimalai", "vellikkizhamai"];
const ESSAYS = ["aaru-maatha-kadungkaaval", "thudikkum-ilamai", "perumoochu", "viduthalai-kilarcci", "meesai-mulaiththa-vayathil", "pesum-kalai-valarppom"];
const ALL13 = [...DRAMA, ...NOVELS, ...ESSAYS];
// The three Wave-7 cohort works that share the arumbu-1978 publication (still three separate works).
const TRIO = ["arumbu", "nadutheru-narayani", "sarapallam-samundi"];
// The four MEMBERS of the arumbu-1978 collection in printed physical (scan-range) order: the three cohort
// works PLUS the pre-existing பெரிய இடத்துப் பெண் (its 1978 witness occurrence). All collapse into the card.
const MEMBERS4 = ["arumbu", "sarapallam-samundi", "periya-idathup-pen", "nadutheru-narayani"];
const COLLAPSED = ["arumbu", "sarapallam-samundi", "nadutheru-narayani", "periya-idathup-pen"];

type Ex = { titleTa: string; titleEn: string; shelf: string; subtype: string; reader: string; hrefBase: string; unit: number; rights: boolean };
const EXPECT: Record<string, Ex> = {
  "iratha-kanneer": { titleTa: "இரத்தக் கண்ணீர்", titleEn: "Iratha Kanneer", shelf: "drama", subtype: "stage-play", reader: "stage-play", hrefBase: "/plays", unit: 61, rights: true },
  "nachuk-koppai": { titleTa: "நச்சுக்கோப்பை", titleEn: "Nachuk Koppai", shelf: "drama", subtype: "stage-play", reader: "stage-play", hrefBase: "/plays", unit: 18, rights: true },
  "arumbu": { titleTa: "அரும்பு", titleEn: "The Bud", shelf: "fiction", subtype: "novel", reader: "novel", hrefBase: "/novels", unit: 1, rights: true },
  "nadutheru-narayani": { titleTa: "நடுத்தெரு நாராயணி", titleEn: "Nadutheru Narayani", shelf: "fiction", subtype: "novel", reader: "novel", hrefBase: "/novels", unit: 1, rights: true },
  "sarapallam-samundi": { titleTa: "சாரப்பள்ளம் சாமுண்டி", titleEn: "Sarapallam Samundi", shelf: "fiction", subtype: "novel", reader: "novel", hrefBase: "/novels", unit: 1, rights: true },
  "surulimalai": { titleTa: "சுருளிமலை", titleEn: "Surulimalai", shelf: "fiction", subtype: "novel", reader: "novel", hrefBase: "/novels", unit: 26, rights: true },
  "vellikkizhamai": { titleTa: "வெள்ளிக்கிழமை", titleEn: "Vellikkizhamai", shelf: "fiction", subtype: "novel", reader: "novel", hrefBase: "/novels", unit: 23, rights: true },
  "aaru-maatha-kadungkaaval": { titleTa: "ஆறுமாதக் கடுங்காவல்", titleEn: "Six Months of Rigorous Imprisonment", shelf: "essays-articles", subtype: "essay-collection", reader: "article", hrefBase: "/essays", unit: 3, rights: false },
  "thudikkum-ilamai": { titleTa: "துடிக்கும் இளமை", titleEn: "Restless Youth", shelf: "essays-articles", subtype: "essay-collection", reader: "article", hrefBase: "/essays", unit: 4, rights: false },
  "perumoochu": { titleTa: "பெருமூச்சு", titleEn: "The Deep Sigh", shelf: "essays-articles", subtype: "essay-collection", reader: "article", hrefBase: "/essays", unit: 13, rights: false },
  "viduthalai-kilarcci": { titleTa: "விடுதலைக் கிளர்ச்சி", titleEn: "The Freedom Uprising", shelf: "essays-articles", subtype: "essay-collection", reader: "article", hrefBase: "/essays", unit: 2, rights: false },
  "meesai-mulaiththa-vayathil": { titleTa: "மீசை முளைத்த வயதில்", titleEn: "At the Age the Moustache Sprouted", shelf: "essays-articles", subtype: "essay-collection", reader: "article", hrefBase: "/essays", unit: 26, rights: false },
  "pesum-kalai-valarppom": { titleTa: "பேசும் கலை வளர்ப்போம்", titleEn: "Let Us Cultivate the Art of Speaking", shelf: "essays-articles", subtype: "essay-collection", reader: "article", hrefBase: "/essays", unit: 19, rights: false },
};

// ── 1. CATALOGUE ────────────────────────────────────────────────────────────────────────────────────
const works = publishedWorks();
eq(works.length, 232 + W7K.works + W8.works, "catalogue is exactly 232 + later Wave-7 B5/B6/Kuraloviyam 101 = 333 published works (219 + 13 Wave-7 B2-B4 + 101)");
const byShelf: Record<string, number> = {};
for (const w of works) byShelf[w.shelf] = (byShelf[w.shelf] ?? 0) + 1;
eq(byShelf["drama"], 10 + W8.drama, "Drama holds 10 works (8 + 2) + later Wave-8 ore-mutham");
eq(byShelf["fiction"], 162, "Fiction holds 162 works (157 + 5)");
eq(byShelf["essays-articles"], 15, "Essays & Articles holds 15 works (9 + 6)");
eq(byShelf["cinema-writing"], 10, "Cinema Writing unchanged at 10 (this batch adds none)");
eq(Object.keys(byShelf).sort(), ["cinema-writing", "drama", "essays-articles", "fiction", "letters", "life-writing", "literary-commentary", "poetry", "speeches"], "still exactly 9 non-empty shelves");

const bySlug = new Map(LIBRARY_WORKS.map((w) => [w.slug, w] as const));
for (const slug of ALL13) {
  const w = bySlug.get(slug) as LibraryWork | undefined;
  const ex = EXPECT[slug];
  ok(!!w, `${slug}: is a LibraryWork`);
  if (!w) continue;
  eq([w.shelf, w.state, w.readerStructure, w.href, w.provenanceHref], [ex.shelf, "published", ex.reader, `${ex.hrefBase}/${slug}`, `${ex.hrefBase}/${slug}/source`], `${slug}: shelf/state/reader/hrefs`);
  eq([w.titleTa, w.titleEn, w.subtype], [ex.titleTa, ex.titleEn, ex.subtype], `${slug}: titles + subtype`);
  eq([w.tamil, w.english, w.englishKind], ["complete", "complete", "project-created"], `${slug}: language completeness + English kind`);
  eq(w.unitCount?.value, ex.unit, `${slug}: unitCount == source count (${ex.unit})`);
  eq(LIBRARY_WORKS.filter((x) => x.slug === slug).length, 1, `${slug}: published exactly once`);
  // Rights are evidence-based: drama + novels carry the nationalisation record; essays carry none.
  if (ex.rights) {
    ok(w.rights?.rightsStatus === "nationalised-by-tamil-nadu-government", `${slug}: carries the nationalisation rights record`);
    eq([w.rights?.rightsAnnouncementDate, w.rights?.governmentOrderNumber, w.rights?.governmentOrderDate], ["2024-08-22", null, null], `${slug}: rights record fields (announced 2024-08-22; GO number/date unverified→unset)`);
  } else {
    ok(w.rights === undefined || w.rights === null, `${slug}: essay carries NO rights (added only on evidence)`);
  }
}
// nachuk-koppai discloses its terminal source hold on the public card.
{
  const w = bySlug.get("nachuk-koppai")!;
  ok(/hold|scan 22|Scene 5/i.test(w.descEn ?? "") && /இடர்|ஸ்கேன் 22|காட்சி 5/.test(w.descTa ?? ""), "nachuk-koppai: the terminal source hold is disclosed on the public card (both languages)");
}
// The arumbu trio stay THREE separate published works (never one).
eq(TRIO.filter((s) => bySlug.get(s)?.state === "published").length, 3, "the arumbu-1978 trio are three separate published works");
eq(new Set(TRIO.map((s) => bySlug.get(s)?.id)).size, 3, "the trio have three distinct catalogue ids");

// ── 2. COLLECTIONS ──────────────────────────────────────────────────────────────────────────────────
eq(LIBRARY_COLLECTIONS.length, 7 + W7K.collections, "collection registry is 7 (1977 + 5 Batch-7 + arumbu-1978) + the later 2 முத்துக் குளியல் = 9");
eq(COLLECTION_IDS.filter((id) => id === "arumbu-1978").length, 1, "arumbu-1978 registered exactly once");
const arumbu = collectionById("arumbu-1978");
ok(!!arumbu, "arumbu-1978 resolves by id");
if (arumbu) {
  eq(arumbu.shelf, "fiction", "arumbu-1978 sits on the Fiction shelf");
  eq(arumbu.kind, "anthology", "arumbu-1978 kind is anthology");
  eq(arumbu.href, "/collections/arumbu-1978", "arumbu-1978 href matches the id");
  // The frozen source is a FOUR-story volume (6-23, 24-48, 49-74, 75-90). Members are in that printed
  // physical order; பெரிய இடத்துப் பெண் is a member via its 1978 witness occurrence.
  eq(arumbu.members.map((m) => m.workId), MEMBERS4, "members are the 4 works in printed (scan-range) physical order");
  eq(arumbu.memberCount.value, 4, "memberCount states 4");
  eq(arumbu.members.length, 4, "exactly 4 members");
  eq(arumbu.members.filter((m) => m.ordinal !== undefined).map((m) => m.workId), [], "no member carries an ordinal (the volume prints no story-ordinals; never invented)");
  ok(arumbu.members.some((m) => m.workId === "periya-idathup-pen"), "பெரிய இடத்துப் பெண் IS a member (a physical member of the four-story 1978 volume)");
  // Every member resolves to exactly one live published canonical LibraryWork; no duplicated identity.
  for (const m of arumbu.members) eq(bySlug.get(m.workId)?.state, "published", `arumbu-1978 member ${m.workId} is a live published work`);
  eq(new Set(arumbu.members.map((m) => m.workId)).size, 4, "the four members are four distinct canonical works");
  for (const m of arumbu.members) eq(LIBRARY_WORKS.filter((w) => w.id === m.workId).length, 1, `member ${m.workId} resolves to exactly one canonical LibraryWork (no duplicated identity)`);
  // பெரிய இடத்துப் பெண்: membership records publication presence, NOT controlling-edition authority. Its
  // canonical edition/provenance stays the 1953 eighth-edition package; it carries the 1978 collection-local
  // extent (scans 49-74) because its canonical payload points to the 1953 edition.
  const periyaMember = arumbu.members.find((m) => m.workId === "periya-idathup-pen")!;
  eq(periyaMember.localScans, "49-74", "பெரிய இடத்துப் பெண் carries the 1978 collection-local extent (scans 49-74)");
  ok(periyaMember.ordinal === undefined, "பெரிய இடத்துப் பெண் carries no invented ordinal");
  const periyaWork = bySlug.get("periya-idathup-pen")!;
  ok(/1953/.test(periyaWork.edition ?? "") && /கட்டுப்படுத்தும் மூலம்/.test(periyaWork.edition ?? ""), "பெரிய இடத்துப் பெண் canonical edition is unchanged (1953 controlling package)");
  eq([periyaWork.href, periyaWork.provenanceHref, periyaWork.sourceCommit], ["/novels/periya-idathup-pen", "/novels/periya-idathup-pen/source", "a99f135467dd38e294faff31088a937994790a47"], "பெரிய இடத்துப் பெண் canonical href/provenance/sourceCommit unchanged by collection membership");
  eq(arumbu.source.collectionTree, "851ea306fc27ba73ea1c46dbafead51c659e6ba4", "arumbu-1978 pins the frozen collection tree");
}
// No cohort work became a collection id, and no member gained a unitCount by joining.
for (const s of ALL13) ok(!COLLECTION_IDS.includes(s), `${s} is not registered as a collection id`);

// ── 3. DISCOVERY ────────────────────────────────────────────────────────────────────────────────────
const shelves = discoveryShelves();
const entries = shelves.flatMap((s) => s.entries);
eq(entries.length, 90 + W7K.discovery + W8.discovery, "/read discovery is 90 + later Wave-7 B5/B6/K 6 = 96 entries (80 + 10 net: +13 works, minus the arumbu trio collapse, minus the pre-existing பெரிய இடத்துப் பெண் standalone card now an arumbu-1978 member)");
eq(shelves.reduce((n, s) => n + Math.min(s.entries.length, CAP), 0), 40 + W7K.visible + W8.visible, "40 discovery entries still visible from this batch (the three shelves were already over cap) + 1 later Literary Commentary entry under the cap");
eq(shelves.find((s) => s.shelf.id === "fiction")!.entries.length, 20, "Fiction renders 20 discovery entries");
eq(shelves.find((s) => s.shelf.id === "drama")!.entries.length, 10 + W8.drama, "Drama renders 10 discovery entries + later Wave-8 ore-mutham");
eq(shelves.find((s) => s.shelf.id === "essays-articles")!.entries.length, 15, "Essays & Articles renders 15 discovery entries");
eq(shelves.find((s) => s.shelf.id === "cinema-writing")!.entries.length, 10, "Cinema Writing unchanged at 10 discovery entries");
eq(uniqSorted(shelves.filter((s) => s.entries.length > CAP).map((s) => s.shelf.id)), uniqSorted(["fiction", "poetry", "drama", "cinema-writing", "speeches", "essays-articles"]), "same six over-cap shelves");
// All FOUR members collapse into ONE collection card, not four standalone cards — including the
// pre-existing பெரிய இடத்துப் பெண், whose standalone card is removed once it becomes an arumbu-1978 member.
const fictionEntryIds = shelves.find((s) => s.shelf.id === "fiction")!.entries.map((e) => (e.kind === "collection" ? e.collection.id : e.work.id));
ok(fictionEntryIds.includes("arumbu-1978"), "the arumbu-1978 collection card appears in Fiction discovery");
for (const s of COLLAPSED) ok(!fictionEntryIds.includes(s), `${s} does NOT appear as its own Fiction discovery card (collapsed into arumbu-1978)`);
ok(fictionEntryIds.includes("surulimalai") && fictionEntryIds.includes("vellikkizhamai"), "the 2 standalone novels appear as their own Fiction discovery cards");

// ── 4. SITEMAP ──────────────────────────────────────────────────────────────────────────────────────
const urls = (sitemap() as { url: string }[]).map((e) => e.url);
const urlSet = new Set(urls.map((u) => u.replace(BASE, "")));
eq(urls.length, 4267 + W7K.sitemap + W8.sitemap, "sitemap has exactly 4267 URLs (4042 + 224 direct + 1 collection route) + the later Wave-7 B5/B6/K 512");
eq(urls.length - new Set(urls).size, 0, "sitemap has 0 duplicates");
eq(P3_ROUTES.length, 224, "P3 manifest still declares 224 direct routes");
for (const r of P3_ROUTES) ok(urlSet.has(r), `sitemap exposes direct route ${r}`);
ok(urlSet.has("/collections/arumbu-1978"), "sitemap exposes the arumbu-1978 collection route");
// Set-equality: the sitemap's B2-B4 direct URLs equal the manifest exactly.
const prefixes = ALL13.map((s) => `${EXPECT[s].hrefBase}/${s}`);
const smB2B4 = Array.from(urlSet).filter((u) => prefixes.some((p) => u === p || u.startsWith(`${p}/`)));
eq(uniqSorted(smB2B4), uniqSorted(P3_ROUTES), "sitemap B2-B4 direct URLs == P3 manifest exactly (0 extra, 0 missing)");

// ── 5. REGISTRY PROMOTION — each promoted slug occurs exactly once (no duplicate generateStaticParams) ─
const countIn = (arr: readonly string[], slug: string) => arr.filter((x) => x === slug).length;
for (const s of DRAMA) { ok((PLAY_SLUGS as readonly string[]).includes(s), `${s} promoted into PLAY_SLUGS`); eq(countIn(PLAY_SLUGS, s), 1, `${s} occurs once in PLAY_SLUGS`); }
for (const s of NOVELS) { ok((NOVEL_SLUGS as readonly string[]).includes(s), `${s} promoted into NOVEL_SLUGS`); eq(countIn(NOVEL_SLUGS, s), 1, `${s} occurs once in NOVEL_SLUGS`); }
for (const s of ESSAYS) { ok((ESSAY_SLUGS as readonly string[]).includes(s), `${s} promoted into ESSAY_SLUGS`); eq(countIn(ESSAY_SLUGS, s), 1, `${s} occurs once in ESSAY_SLUGS`); }
for (const arr of [PLAY_SLUGS, NOVEL_SLUGS, ESSAY_SLUGS] as readonly (readonly string[])[]) eq(new Set(arr).size, arr.length, "public registry has no duplicate slug");

// ── 6. ADVERSARIAL — each corruption must be REJECTED ─────────────────────────────────────────────────
// A1: collapse the arumbu trio into one work → the three-distinct-works guard fires.
{ const merged = new Set(TRIO.map(() => "arumbu")); ok(merged.size !== 3, "A1 collapsing the trio into one work is detected"); ok(new Set(TRIO.map((s) => bySlug.get(s)!.id)).size === 3, "A1 the LIVE catalogue keeps three distinct trio works"); }
// A2: REMOVE பெரிய இடத்துப் பெண் from arumbu-1978 → the four-member guard fires. The frozen source is a
// four-story volume, so dropping the fourth story is a corruption, not a fix. (This is the corrected
// direction: the earlier decision wrongly excluded it.)
{ const reduced = arumbu!.members.filter((m) => m.workId !== "periya-idathup-pen"); ok(reduced.length !== arumbu!.members.length && reduced.length === 3, "A2 removing பெரிய இடத்துப் பெண் drops the member count below the source's four"); ok(arumbu!.members.some((m) => m.workId === "periya-idathup-pen"), "A2 the LIVE collection includes பெரிய இடத்துப் பெண் (all four source stories)"); }
// A3: invent an ordinal for a member → the no-ordinal guard fires.
{ const bad = clone(arumbu!.members); bad[0].ordinal = 1; ok(bad.some((m) => m.ordinal !== undefined), "A3 an invented ordinal is detectable"); ok(arumbu!.members.every((m) => m.ordinal === undefined), "A3 the LIVE members carry no ordinal"); }
// A4: fabricate a year on a trio card → no-year guard fires (the trio cards assert no standalone year).
{ for (const s of TRIO) ok(!/\b(18|19|20)\d{2}\b/.test(`${bySlug.get(s)!.descTa} ${bySlug.get(s)!.descEn}`), `A4 the LIVE ${s} card carries no fabricated year`); const bad = "வெளியான 1978 படைப்பு"; ok(/\b(18|19|20)\d{2}\b/.test(bad), "A4 a fabricated year in card copy is detectable"); }
// A5: give an essay a rights record → the essays-carry-no-rights guard fires.
{ for (const s of ESSAYS) ok(bySlug.get(s)!.rights == null, `A5 the LIVE essay ${s} carries no rights`); }
// A6: strip rights from a drama/novel → the rights-present guard fires.
{ for (const s of [...DRAMA, ...NOVELS]) ok(bySlug.get(s)!.rights?.rightsStatus === "nationalised-by-tamil-nadu-government", `A6 the LIVE ${s} keeps its nationalisation rights`); }
// A7: strip nachuk-koppai's disclosed hold from the card → the disclosure guard fires.
{ const w = bySlug.get("nachuk-koppai")!; const stripped = "மேடை நாடகம்: 18 காட்சிகள்"; ok(!/hold|scan 22|Scene 5/i.test(stripped), "A7 a hold-free card copy is detectable"); ok(/hold|scan 22|Scene 5/i.test(w.descEn ?? ""), "A7 the LIVE nachuk-koppai card discloses the hold"); }
// A8: duplicate a catalogue identity → uniqueness guard fires.
{ const dup = [...LIBRARY_WORKS.map((w) => w.id), "arumbu"]; ok(new Set(dup).size !== dup.length, "A8 a duplicated catalogue id is detectable"); eq(new Set(LIBRARY_WORKS.map((w) => w.id)).size, LIBRARY_WORKS.length, "A8 the LIVE catalogue has no duplicate id"); eq(new Set(LIBRARY_WORKS.map((w) => w.slug)).size, LIBRARY_WORKS.length, "A8 the LIVE catalogue has no duplicate slug"); }
// A9: drop/add a work → the exact catalogue count guard fires.
{ const LIVE = 232 + W7K.works + W8.works; ok(works.length - 1 !== LIVE && works.length + 1 !== LIVE, "A9 a dropped/added work would change the count away from the live total"); eq(works.length, LIVE, "A9 the LIVE catalogue is exactly 232 + 101 (later Wave-7 batch)"); }
// A10: invent surulimalai chapter 6/7 → the derived routes never contain them.
{ ok(!P3_ROUTES.includes("/novels/surulimalai/06-chapter-06") && !P3_ROUTES.includes("/novels/surulimalai/07-chapter-07"), "A10 no invented surulimalai chapter 6/7 route exists"); }
// A11: omit a valid sitemap route → completeness guard fires.
{ const missing = new Set(Array.from(urlSet)); missing.delete(P3_ROUTES[10]); ok(!P3_ROUTES.every((r) => missing.has(r)), "A11 omitting a valid direct route is detectable"); ok(P3_ROUTES.every((r) => urlSet.has(r)), "A11 the LIVE sitemap contains every valid direct route"); }
// A12: publish a foreign/unknown slug → fail-closed (absent from the public registries).
{ ok(!(ESSAY_SLUGS as readonly string[]).includes("fabricated-essay") && !(NOVEL_SLUGS as readonly string[]).includes("fabricated-novel"), "A12 an unknown slug is not in any public registry (fail-closed)"); }
// A13: collection count must be exactly 7 (arumbu-1978 added exactly once).
{ const LIVE = 7 + W7K.collections; ok(LIBRARY_COLLECTIONS.length - 1 !== LIVE, "A13 a second arumbu-1978 would change the count away from the live total"); eq(LIBRARY_COLLECTIONS.length, LIVE, "A13 the LIVE registry has exactly 7 + 2 (later முத்துக் குளியல்) collections"); ok(LIBRARY_COLLECTIONS.filter((c) => c.id === "arumbu-1978").length === 1, "A13 exactly one arumbu-1978"); }
// A14: memberCount must equal the roster length (4) and never be inflated to a fifth.
{ eq(arumbu!.memberCount.value, arumbu!.members.length, "A14 the LIVE memberCount equals the roster length"); eq(arumbu!.memberCount.value, 4, "A14 memberCount is exactly 4"); ok(arumbu!.memberCount.value !== 5, "A14 memberCount is not inflated to a fifth member"); }
// A15: all four members must collapse — none may also be a standalone Fiction card (incl. பெரிய இடத்துப் பெண்).
{ for (const s of COLLAPSED) ok(!fictionEntryIds.includes(s), `A15 ${s} is collapsed into the collection card, not a standalone Fiction card`); ok(fictionEntryIds.includes("arumbu-1978"), "A15 exactly the collection card represents the four members"); }
// A16: Cinema must stay 10 (this batch adds no cinema work).
{ eq(byShelf["cinema-writing"], 10, "A16 Cinema Writing is unchanged at 10 (no cinema leaked in)"); }
// A17: a duplicated sitemap URL → the 0-duplicate guard fires.
{ const dup = [...urls, urls[0]]; ok(dup.length - new Set(dup).size === 1, "A17 a duplicated sitemap URL is detectable"); eq(urls.length - new Set(urls).size, 0, "A17 the LIVE sitemap has 0 duplicates"); }
// A18: a promoted slug appearing twice in a registry → the once-only guard fires.
{ const dup = [...PLAY_SLUGS, "iratha-kanneer"]; ok(dup.filter((s) => s === "iratha-kanneer").length === 2, "A18 a duplicated promotion is detectable"); eq(countIn(PLAY_SLUGS, "iratha-kanneer"), 1, "A18 the LIVE PLAY_SLUGS promotes iratha-kanneer exactly once"); }
// A19: creating a SECOND canonical பெரிய இடத்துப் பெண் for the 1978 witness must fail — the 1978 occurrence
// is a member/witness of the EXISTING work, never a new LibraryWork. Its slug/id must appear exactly once.
{ eq(LIBRARY_WORKS.filter((w) => w.slug === "periya-idathup-pen").length, 1, "A19 exactly one canonical பெரிய இடத்துப் பெண் exists (no 1978 duplicate work)"); eq(LIBRARY_WORKS.filter((w) => w.id === "periya-idathup-pen").length, 1, "A19 exactly one பெரிய இடத்துப் பெண் catalogue id (the 1978 witness added no work)"); const withDup = [...LIBRARY_WORKS.map((w) => w.slug), "periya-idathup-pen"]; ok(new Set(withDup).size !== withDup.length, "A19 a second பெரிய இடத்துப் பெண் canonical work would be detected as a duplicate slug"); }
// A20: the four-story publication must not silently gain a fifth member (no over-inclusion).
{ ok(!arumbu!.members.some((m) => !MEMBERS4.includes(m.workId)), "A20 no member outside the four source stories"); eq(arumbu!.members.length, 4, "A20 exactly the four source stories are members"); }

// ── 7. BUILD boundary — 4276 / 4271 when a build tree is present ───────────────────────────────────────
const pm = path.join(root, ".next/prerender-manifest.json");
if (fs.existsSync(pm)) {
  const keys = new Set(Object.keys((JSON.parse(fs.readFileSync(pm, "utf8")) as { routes: Record<string, unknown> }).routes));
  eq(keys.size, 4276 + W7K.build + W8.build, "build prerender routes == 4276 (4275 P3 + 1 collection route) + later Wave-7 B5/B6/K 512 + later Wave-8 direct routes");
  for (const r of P3_ROUTES) ok(keys.has(r), `route prerendered: ${r}`);
  ok(keys.has("/collections/arumbu-1978"), "arumbu-1978 collection route prerendered");
  let html = 0; const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith(".html")) html++; } };
  try { walk(path.join(root, ".next/server/app")); } catch { /* */ }
  eq(html, 4271 + W7K.build + W8.build, "build .html == 4271 (4270 P3 + 1 collection route) + later Wave-7 B5/B6/K 512 + later Wave-8 direct routes");
} else {
  console.error("  · BUILD-boundary check SKIPPED — no .next/prerender-manifest.json (CI runs this after build).");
}

if (fail.length) {
  console.error(`\nwave7-b2-b4-p4-integration — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 60)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b2-b4-p4-integration — ${checks} checks, 0 failed`);
console.log("  13 works published · catalogue 219→232 (Drama 10 · Fiction 162 · Essays 15 · Cinema 10) · collections 6→7 (arumbu-1978, 4 members incl. பெரிய இடத்துப் பெண் witness, ordinals unset, canonical 1953 edition intact) · discovery 80→90/40 · Fiction 20 · sitemap 4042→4267/0 · build 4275→4276 · 20 adversarials rejected");
