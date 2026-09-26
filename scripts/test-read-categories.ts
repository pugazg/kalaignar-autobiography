/**
 * Reading Room IA v2 — the whole-R2 validator: category registry, the nine /read category routes, catalogue coverage,
 * the Letters corpus treatment, catalogue invariance (R2-A); the category-first /read landing (R2-B); and the secondary
 * collection sections, the sitemap +9 and the canonical R2 contribution module (R2-C).
 *
 *   npm run test:read-categories
 *
 * /read is exactly nine category cards (no work card, collection card, disclosure or Daily Kural), and the shared
 * `life-writing` label is சுயசரிதை. Category pages list every work, then — for Fiction (7) and Speeches (2) only — a
 * secondary Collections section. The sitemap is the frozen pre-R2 set plus exactly the nine category URLs.
 *
 * Coverage is checked on RENDERED MARKUP from each route file's own default export, not on a re-derivation of
 * the shelf filter: the risk is a work that stops being delivered by a page, and only counting the anchors the
 * page actually emits proves every work still ships. Plain assertions, exits non-zero on failure.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SHELVES, publishedWorks, type ShelfId } from "../data/library";
import { LangProvider } from "../lib/i18n";
import ReadIndex from "../app/read/page";
import { LIBRARY_COLLECTIONS, collectionMemberWorks } from "../data/collections";
import { chapterIndex } from "../data/references";
import { READ_CATEGORIES, READ_CATEGORY_ROUTES, categoryForShelf, collectionsInCategory, worksInCategory } from "../data/read-categories";
import { READ_IA_R2_CONTRIBUTION, READ_IA_R2_ROUTES } from "../lib/read-ia-r2-contribution";
import sitemapRoutes from "../app/sitemap";
import { loadMurasoliCorpusSummary, summarizeMurasoliCorpus } from "../lib/murasoli-corpus";
import ChapterPage, { generateStaticParams as chapterParams } from "../app/read/[id]/page";
import AutobiographyPage from "../app/read/autobiography/page";
import LettersPage from "../app/read/letters/page";
import FictionPage from "../app/read/fiction/page";
import PoetryPage from "../app/read/poetry/page";
import DramaPage from "../app/read/drama/page";
import CinemaPage from "../app/read/cinema/page";
import SpeechesPage from "../app/read/speeches/page";
import EssaysPage from "../app/read/essays/page";
import LiteraryCommentaryPage from "../app/read/literary-commentary/page";

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

/** exec loop rather than [...matchAll]: the app's tsconfig target predates downlevelIteration. */
function hrefsIn(s: string): string[] {
  const re = /<a[^>]+href="([^"]+)"/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out.push(m[1]);
  return out;
}
/** The markup of the element carrying `data-testid="<id>"`, up to its matching close (outermost only). */
function testIdBlock(html: string, id: string, tag: string): string {
  const start = html.indexOf(`data-testid="${id}"`);
  if (start === -1) return "";
  const open = html.lastIndexOf(`<${tag}`, start);
  let depth = 0;
  const re = new RegExp(`<${tag}[\\s>]|</${tag}>`, "g");
  re.lastIndex = open;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    depth += m[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(open, re.lastIndex);
  }
  return html.slice(open);
}

// ── Frozen R2 arithmetic (R2 plan §14; control repo pugazg/kalaignar-tribute) ─────────────────────────────
const EXPECTED_ROUTES: Record<ShelfId, string> = {
  "life-writing": "/read/autobiography",
  letters: "/read/letters",
  fiction: "/read/fiction",
  poetry: "/read/poetry",
  drama: "/read/drama",
  "cinema-writing": "/read/cinema",
  speeches: "/read/speeches",
  "essays-articles": "/read/essays",
  "literary-commentary": "/read/literary-commentary",
};
const EXPECTED_COUNTS: Record<ShelfId, number> = {
  "life-writing": 1,
  letters: 1,
  fiction: 162,
  poetry: 14,
  drama: 11,
  "cinema-writing": 10,
  speeches: 117,
  "essays-articles": 15,
  "literary-commentary": 4,
};
/**
 * sha256 of the 335 published ids, sorted and newline-joined, at the R2 base (implementation f991043c). R2 is
 * information architecture only: any added work (a resolved-manifest CREATE item), removed work or merge changes
 * this digest. R3 — the stage that is allowed to change the catalogue — updates it deliberately.
 */
const R2_BASE_PUBLISHED_ID_DIGEST = "93624beae2ea8d4275b0c7c60a53d8a00d97f3a7a304c71ffef135c8a0019a09";
/** The five existing works that R3 (not R2) merges into canonical works that do not exist yet. */
const R3_MERGES: ReadonlyArray<[source: string, target: string]> = [
  ["sirai-kodiyathu", "green-parrot"],
  ["neeyum-kaithi-naanum-kaithi", "piraiye"],
  ["aadik-kaatre", "adikkaatru"],
  ["pugazhe-nee-oru-pudhir", "pugazh"],
  ["sorgaththirku-vandhathu-eppadi", "sorgga-logaththil"],
];

const works = publishedWorks();
const shelfIds = SHELVES.map((s) => s.id);

// ── 1. Registry ─────────────────────────────────────────────────────────────────────────────────────────────
eq(READ_CATEGORIES.length, 9, "registry holds exactly 9 categories");
eq([...READ_CATEGORIES.map((c) => c.shelf)].sort(), [...shelfIds].sort(), "every ShelfId appears exactly once in the registry");
eq(READ_CATEGORIES.map((c) => c.shelf), shelfIds, "registry order follows SHELVES order");
eq(new Set(READ_CATEGORIES.map((c) => c.route)).size, 9, "category routes are unique");
eq(new Set(READ_CATEGORIES.map((c) => c.slug)).size, 9, "category slugs are unique");
for (const c of READ_CATEGORIES) {
  eq(c.route, EXPECTED_ROUTES[c.shelf], `route for ${c.shelf}`);
  eq(c.route, `/read/${c.slug}`, `route for ${c.shelf} is /read/<slug>`);
  eq(categoryForShelf(c.shelf), c, `categoryForShelf(${c.shelf}) resolves its registry entry`);
}
// The registry carries route metadata only — never membership.
for (const c of READ_CATEGORIES) {
  eq(Object.keys(c).sort(), ["descEn", "route", "shelf", "slug"], `registry entry ${c.shelf} carries no membership fields`);
}

// ── 2. Route collisions ─────────────────────────────────────────────────────────────────────────────────────
const chapterIds = chapterIndex.map((c) => c.id);
eq(chapterIds.length, 391, "memoir chapter ids = 391");
const slugs = READ_CATEGORIES.map((c) => c.slug);
eq(slugs.filter((s) => chapterIds.includes(s)), [], "0 category slugs collide with a memoir chapter id");
ok(!slugs.includes("nenjukku-neethi"), "no category slug collides with nenjukku-neethi");
const params = chapterParams().map((p) => p.id);
eq(params.length, 391, "/read/[id] still prerenders 391 chapters");
eq(params, chapterIds, "/read/[id] static params are exactly the memoir chapter ids");
ok(params.every((id) => !slugs.includes(id)), "no /read/[id] param is shadowed by a category route");

/** Unknown ids still fail closed through notFound(). */
function failsClosed(id: string): boolean {
  try {
    ChapterPage({ params: { id } });
    return false;
  } catch (e) {
    const digest = (e as { digest?: string }).digest ?? (e as Error).message;
    return String(digest).includes("NEXT_NOT_FOUND") || String(digest).includes("NEXT_HTTP_ERROR_FALLBACK;404");
  }
}
for (const id of ["v9-ch99", "not-a-category", ...slugs]) ok(failsClosed(id), `/read/[id] fails closed for "${id}"`);
ok(!failsClosed(chapterIds[0]) && !failsClosed(chapterIds[390]), "/read/[id] still resolves real chapter ids (control)");

// ── 3. Route files ──────────────────────────────────────────────────────────────────────────────────────────
const ROUTE_PAGES: Record<ShelfId, () => ReactElement> = {
  "life-writing": AutobiographyPage,
  letters: LettersPage,
  fiction: FictionPage,
  poetry: PoetryPage,
  drama: DramaPage,
  "cinema-writing": CinemaPage,
  speeches: SpeechesPage,
  "essays-articles": EssaysPage,
  "literary-commentary": LiteraryCommentaryPage,
};
for (const c of READ_CATEGORIES) {
  const file = path.join(process.cwd(), "app/read", c.slug, "page.tsx");
  ok(fs.existsSync(file), `route file app/read/${c.slug}/page.tsx exists`);
  const src = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  eq(src.match(/shelf="([^"]+)"/g), [`shelf="${c.shelf}"`], `app/read/${c.slug} renders shelf ${c.shelf}`);
  eq(src.match(/categoryMetadata\("([^"]+)"\)/g), [`categoryMetadata("${c.shelf}")`], `app/read/${c.slug} metadata is ${c.shelf}'s`);
}

// ── 4. Catalogue coverage, on the rendered pages ────────────────────────────────────────────────────────────
const rendered: Partial<Record<ShelfId, string>> = {};
const seen = new Map<string, number>();
let total = 0;
for (const c of READ_CATEGORIES) {
  const html = renderToStaticMarkup(createElement(ROUTE_PAGES[c.shelf]));
  rendered[c.shelf] = html;
  ok(html.includes(`data-category="${c.slug}"`), `${c.route} renders its own category`);
  ok(html.includes('<main id="main"'), `${c.route} has a main landmark`);
  eq((html.match(/<h1[\s>]/g) ?? []).length, 1, `${c.route} has exactly one h1`);
  ok(hrefsIn(html).includes("/read"), `${c.route} links back to /read`);

  const cardHrefs = hrefsIn(testIdBlock(html, "category-works", "div"));
  const expected = works.filter((w) => w.shelf === c.shelf);
  eq(cardHrefs.length, EXPECTED_COUNTS[c.shelf], `${c.route} renders ${EXPECTED_COUNTS[c.shelf]} work cards`);
  eq(worksInCategory(c.shelf).length, EXPECTED_COUNTS[c.shelf], `worksInCategory(${c.shelf}) = ${EXPECTED_COUNTS[c.shelf]}`);
  eq(cardHrefs, expected.map((w) => w.href), `${c.route} lists its works in catalogue order, each linking to its href`);
  for (const w of expected) seen.set(w.id, (seen.get(w.id) ?? 0) + 1);
  total += cardHrefs.length;
}
eq(total, 335, "category pages list 335 works in total");
eq(works.length, 335, "published works = 335");
eq(new Set(works.map((w) => w.href)).size, 335, "published work hrefs are unique (a rendered href identifies one work)");
eq(Array.from(seen.keys()).sort(), works.map((w) => w.id).sort(), "the union of category works is exactly the published set");
eq(Array.from(seen.values()).filter((n) => n !== 1).length, 0, "every published work appears on exactly one category page");
const allCardHrefs = READ_CATEGORIES.flatMap((c) => hrefsIn(testIdBlock(rendered[c.shelf] ?? "", "category-works", "div")));
eq(new Set(allCardHrefs).size, 335, "335 distinct work links across the nine pages");

// Collection membership never suppresses a member.
eq(LIBRARY_COLLECTIONS.length, 9, "collections = 9");
eq(LIBRARY_COLLECTIONS.filter((c) => c.shelf === "fiction").length, 7, "Fiction collections = 7");
eq(LIBRARY_COLLECTIONS.filter((c) => c.shelf === "speeches").length, 2, "Speeches collections = 2");
for (const [shelf, n] of [["fiction", 149], ["speeches", 97]] as const) {
  const members = new Set(
    LIBRARY_COLLECTIONS.filter((c) => c.shelf === shelf).flatMap((c) => collectionMemberWorks(c).map((m) => m.work.href)),
  );
  eq(members.size, n, `${shelf}: ${n} distinct collection member works`);
  const cards = new Set(hrefsIn(testIdBlock(rendered[shelf] ?? "", "category-works", "div")));
  eq(Array.from(members).filter((h) => !cards.has(h)), [], `${shelf}: every collection member is listed individually`);
}
for (const c of READ_CATEGORIES) {
  const cards = hrefsIn(testIdBlock(rendered[c.shelf] ?? "", "category-works", "div"));
  eq(cards.filter((h) => h.startsWith("/collections/")), [], `${c.route}: no collection card stands in for works`);
}

// ── 5. Letters ──────────────────────────────────────────────────────────────────────────────────────────────
const letters = rendered.letters ?? "";
eq(works.filter((w) => w.shelf === "letters").map((w) => w.id), ["murasoli-letters"], "Letters holds one canonical work: murasoli-letters");
eq(works.filter((w) => w.id === "murasoli-letters").length, 1, "murasoli-letters occurs exactly once");
const mur = works.find((w) => w.id === "murasoli-letters");
eq(hrefsIn(testIdBlock(letters, "category-works", "div")), [mur?.href], "/read/letters lists murasoli-letters as its only work card");

const idx = JSON.parse(fs.readFileSync("public/data/murasoli/index.json", "utf8"));
const lidx = JSON.parse(fs.readFileSync("public/data/murasoli/letters-index.json", "utf8"));
const corpus = summarizeMurasoliCorpus(idx, lidx);
eq(corpus, { volumeCount: 13, firstVolume: 42, lastVolume: 54, letterCount: 688 }, "Murasoli data derives 13 volumes, 42–54, 688 letters");
eq(loadMurasoliCorpusSummary(), corpus, "the page's loader derives the same summary");
eq(corpus.volumeCount, idx.volumeCount, "volume count comes from index.json volumeCount");
eq(
  corpus.letterCount,
  lidx.volumes.reduce((n: number, v: { letters: unknown[] }) => n + v.letters.length, 0),
  "letter count comes from letters-index.json",
);

const panel = testIdBlock(letters, "letters-corpus", "section");
ok(panel.length > 0, "/read/letters renders the corpus treatment");
ok(testIdBlock(letters, "letters-corpus-figures", "p").includes("Volumes 42–54 · 13 volumes · 688 letters"), "the corpus figures render as derived");
eq(hrefsIn(panel), ["/murasoli"], "the corpus treatment's only link is /murasoli");
ok(panel.includes("Browse by volume &amp; sequence"), 'the link reads "Browse by volume & sequence"');
ok(letters.indexOf('data-testid="category-works"') < letters.indexOf('data-testid="letters-corpus"'), "the corpus summary follows the canonical work");
eq(hrefsIn(letters).filter((h) => /^\/murasoli\/./.test(h)), [], "/read/letters links no individual letter or page");
for (const c of READ_CATEGORIES) {
  if (c.shelf !== "letters") ok(!(rendered[c.shelf] ?? "").includes('data-testid="letters-corpus"'), `${c.route} has no corpus treatment`);
}
// No volume or letter is a LibraryWork.
const letterIds = new Set<string>(lidx.volumes.flatMap((v: { letters: { id: string }[] }) => v.letters.map((l) => l.id)));
eq(works.filter((w) => letterIds.has(w.id) || /^\/murasoli\/./.test(w.href) || /^m\d+-/.test(w.id)), [], "no Murasoli letter or volume is a LibraryWork");

// ── 6. Catalogue invariance ─────────────────────────────────────────────────────────────────────────────────
for (const s of shelfIds) eq(works.filter((w) => w.shelf === s).length, EXPECTED_COUNTS[s], `shelf ${s} = ${EXPECTED_COUNTS[s]}`);
const digest = createHash("sha256").update(works.map((w) => w.id).sort().join("\n")).digest("hex");
eq(digest, R2_BASE_PUBLISHED_ID_DIGEST, "published id set is unchanged from the R2 base (no CREATE work, no merge)");
for (const [source, target] of R3_MERGES) {
  eq(works.filter((w) => w.id === source).map((w) => w.shelf), ["fiction"], `R3 merge source ${source} is still a separate Fiction work`);
  eq(works.filter((w) => w.id === target).length, 0, `R3 merge target ${target} is not created in R2`);
}

// ── 7. The /read landing (R2-B) ─────────────────────────────────────────────────────────────────────────────
// Rendered from the actual route module (app/read/page.tsx), in both languages.
const EXPECTED_COLLECTIONS: Partial<Record<ShelfId, number>> = { fiction: 7, speeches: 2 };
for (const lang of ["en", "ta"] as const) {
  const home = renderToStaticMarkup(createElement(LangProvider, { initialLang: lang, children: createElement(ReadIndex) }));
  const cardRe = /<a[^>]*data-testid="read-category-card"[^>]*>[\s\S]*?<\/a>/g;
  const cards = home.match(cardRe) ?? [];
  eq(cards.length, 9, `/read ${lang}: exactly 9 category cards`);
  const cardHrefs = cards.map((c) => /href="([^"]+)"/.exec(c)?.[1]);
  eq(cardHrefs, [...READ_CATEGORY_ROUTES], `/read ${lang}: card links are exactly the 9 registry routes, in order`);
  eq(new Set(cardHrefs).size, 9, `/read ${lang}: 9 unique category links`);
  eq(cards.map((c) => /data-shelf="([^"]+)"/.exec(c)?.[1]), SHELVES.map((sh) => sh.id), `/read ${lang}: cards follow SHELVES order`);
  eq(hrefsIn(home).filter((h) => h !== "/" && !READ_CATEGORY_ROUTES.includes(h)), [], `/read ${lang}: no link besides Home and the 9 categories`);
  eq(hrefsIn(home).filter((h) => works.some((w) => w.href === h)).length, 0, `/read ${lang}: 0 canonical work cards`);
  eq(hrefsIn(home).filter((h) => h.startsWith("/collections/")).length, 0, `/read ${lang}: 0 collection cards`);
  ok(!home.includes("daily-kural") && !home.includes("இன்றைய குறள்"), `/read ${lang}: no Daily Kural panel`);
  eq((home.match(/<details/g) ?? []).length, 0, `/read ${lang}: no shelf-disclosure <details>`);
  eq((home.match(/<h1[\s>]/g) ?? []).length, 1, `/read ${lang}: exactly one h1`);
  ok(home.includes('<main id="main"'), `/read ${lang}: main landmark`);
  for (const c of READ_CATEGORIES) {
    const card = cards.find((x) => x.includes(`data-shelf="${c.shelf}"`)) ?? "";
    const sh = SHELVES.find((x) => x.id === c.shelf)!;
    ok(card.includes(`lang="ta">${sh.ta}<`), `/read ${lang}: ${c.shelf} card carries its Tamil label, marked lang="ta"`);
    ok(card.includes(`>${sh.en.replace("&", "&amp;")}<`), `/read ${lang}: ${c.shelf} card carries its English label`);
    ok(/<svg[^>]*aria-hidden="true"/.test(card), `/read ${lang}: ${c.shelf} card carries its (decorative) icon`);
    const count = /data-testid="read-category-count"[^>]*>([^<]*)</.exec(card)?.[1] ?? "";
    const n = EXPECTED_COUNTS[c.shelf];
    const k = EXPECTED_COLLECTIONS[c.shelf] ?? 0;
    eq(worksInCategory(c.shelf).length, n, `${c.shelf}: derived work count = ${n}`);
    eq(collectionsInCategory(c.shelf).length, k, `${c.shelf}: derived collection count = ${k}`);
    const primary = lang === "en" ? `${n} ${n === 1 ? "work" : "works"}` : `${n} ${n === 1 ? "படைப்பு" : "படைப்புகள்"}`;
    const secondary = k === 0 ? "" : lang === "en" ? ` · ${k} ${k === 1 ? "collection" : "collections"}` : ` · ${k} ${k === 1 ? "தொகுப்பு" : "தொகுப்புகள்"}`;
    eq(count, primary + secondary, `/read ${lang}: ${c.shelf} card count reads "${primary + secondary}" (work count primary)`);
  }
  ok((cards.find((x) => x.includes('data-shelf="life-writing"')) ?? "").includes("சுயசரிதை"), `/read ${lang}: the life-writing card shows சுயசரிதை`);
}
// The label is the shared shelf label, so the category page carries it too — one source of truth.
eq(SHELVES.find((sh) => sh.id === "life-writing")?.ta, "சுயசரிதை", "SHELVES: life-writing Tamil label is சுயசரிதை (R2-B)");
ok((rendered["life-writing"] ?? "").includes("சுயசரிதை") && !(rendered["life-writing"] ?? "").includes("வாழ்க்கை எழுத்து"), "/read/autobiography shows the shared சுயசரிதை label");
ok(SHELVES.every((sh) => sh.ta !== "வாழ்க்கை எழுத்து"), "the retired label வாழ்க்கை எழுத்து is not a shelf label");

// Source contract: Daily Kural is no longer rendered on /read, and is otherwise untouched.
{
  const readSrc = fs.readFileSync("app/read/page.tsx", "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  ok(!/DailyKural|daily-kural/.test(readSrc), "app/read/page.tsx no longer imports or renders DailyKural");
  // Removed deliberately: `revalidate = 900` existed only to keep the daily Kural current. A clean build proved the
  // removal adds and removes no route (5280 prerendered either way); /read simply becomes fully static (section 8).
  ok(!/export\s+const\s+revalidate\b/.test(readSrc), "app/read/page.tsx no longer revalidates (it carried only the Daily Kural)");
  ok(fs.existsSync("components/DailyKural.tsx") && fs.existsSync("lib/daily-kural.ts") && fs.existsSync("scripts/test-daily-kural.ts"), "Daily Kural component, logic and test are retained");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
  ok(/test-daily-kural\.ts/.test(pkg.scripts["test:daily-kural"] ?? ""), "test:daily-kural is still registered");
  ok(/npm run test:daily-kural/.test(fs.readFileSync(".github/workflows/library-ci.yml", "utf8")), "test:daily-kural still runs in CI");
  const homeSrc = fs.readFileSync("components/LibraryHome.tsx", "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  ok(!/discoveryShelves|INITIAL_WORKS_PER_SHELF|DailyKural/.test(homeSrc), "LibraryHome renders neither the discovery model nor the Daily Kural");
  ok(/READ_CATEGORIES/.test(homeSrc) && !/\/read\/(autobiography|letters|fiction|poetry|drama|cinema|speeches|essays|literary-commentary)/.test(homeSrc), "LibraryHome takes its routes from the registry (none typed)");
}

// ── 8. Secondary collection sections (R2-C) ─────────────────────────────────────────────────────────────────
// After the full work list, and only where the shelf has collections: the existing CollectionCard, linking the
// existing /collections/<id> routes. A collection never replaces a member — every member stays in the work grid.
const allCollectionHrefs = LIBRARY_COLLECTIONS.map((c) => c.href);
eq(allCollectionHrefs.filter((h) => /^\/collections\/[^/]+$/.test(h)).length, 9, "all 9 collections keep their /collections/<id> route");
for (const c of READ_CATEGORIES) {
  const html = rendered[c.shelf] ?? "";
  const expected = collectionsInCategory(c.shelf).map((x) => x.href);
  const section = testIdBlock(html, "category-collections", "section");
  if (expected.length === 0) {
    ok(section === "", `${c.route}: no Collections section (0 collections)`);
    ok(!/id="category-collections"/.test(html), `${c.route}: no empty Collections heading`);
    continue;
  }
  eq(hrefsIn(section), expected, `${c.route}: ${expected.length} secondary collection cards, in registry order`);
  ok(expected.every((h) => allCollectionHrefs.includes(h)), `${c.route}: collection cards link the existing /collections/<id> routes`);
  ok(html.indexOf('data-testid="category-works"') < html.indexOf('data-testid="category-collections"'), `${c.route}: Collections follows the canonical works`);
  ok(/<h2[^>]*id="category-collections"[^>]*>[\s\S]*?lang="ta">தொகுப்புகள்<[\s\S]*?Collections<\/span><\/h2>/.test(section), `${c.route}: bilingual Collections / தொகுப்புகள் h2`);
  const grid = hrefsIn(testIdBlock(html, "category-works", "div"));
  const members = collectionsInCategory(c.shelf).flatMap((x) => collectionMemberWorks(x).map((m) => m.work.href));
  eq(members.filter((h) => !grid.includes(h)), [], `${c.route}: every collection member is still an individual work card`);
  eq(grid.length, EXPECTED_COUNTS[c.shelf], `${c.route}: the work grid still holds all ${EXPECTED_COUNTS[c.shelf]} works`);
}
eq(READ_CATEGORIES.map((c) => hrefsIn(testIdBlock(rendered[c.shelf] ?? "", "category-collections", "section")).length), [0, 0, 7, 0, 0, 0, 2, 0, 0], "collection cards per category: Fiction 7, Speeches 2, others 0");

// ── 9. The canonical R2 contribution module (R2-C) ──────────────────────────────────────────────────────────
// One declaration, derived from the registry: build and sitemap are both the number of category routes. Earlier-wave
// validators add these terms; no second contribution object may exist.
eq(READ_IA_R2_ROUTES, READ_CATEGORY_ROUTES, "READ_IA_R2_ROUTES is the registry's route list");
eq(READ_IA_R2_CONTRIBUTION.build, READ_CATEGORY_ROUTES.length, "R2 build contribution = number of category routes");
eq(READ_IA_R2_CONTRIBUTION.sitemap, READ_CATEGORY_ROUTES.length, "R2 sitemap contribution = number of category routes");
{
  const strip = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  const lib = strip(fs.readFileSync("lib/read-ia-r2-contribution.ts", "utf8"));
  ok(!/\b9\b/.test(lib), "the contribution module types no literal 9 (both terms are derived)");
  ok(/build:\s*READ_IA_R2_ROUTES\.length/.test(lib) && /sitemap:\s*READ_IA_R2_ROUTES\.length/.test(lib), "build and sitemap are READ_IA_R2_ROUTES.length");
  ok(!/READ_IA_R2_CONTRIBUTION/.test(strip(fs.readFileSync("data/read-categories.ts", "utf8"))), "data/read-categories.ts declares no second contribution object");
  const sm = strip(fs.readFileSync("app/sitemap.ts", "utf8"));
  ok(/READ_CATEGORY_ROUTES\.map/.test(sm), "app/sitemap.ts derives the category URLs from the registry");
  ok(!/\/read\/(autobiography|letters|fiction|poetry|drama|cinema|speeches|essays|literary-commentary)\b/.test(sm), "app/sitemap.ts types no category slug");
}

// ── 10. Sitemap: the frozen pre-R2 set plus exactly the category URLs (R2-C) ────────────────────────────────
/**
 * The pre-R2 sitemap, frozen: 5262 unique paths, sha256 of the sorted, newline-joined paths — measured on the R2-B
 * implementation tree cb70d857 (identical to the pre-R2 sitemap at f991043c; R2-A and R2-B changed no sitemap URL).
 * The final sitemap minus READ_IA_R2_ROUTES must reproduce it exactly: no URL disappeared, none changed, none added
 * beyond the category routes.
 */
const PRE_R2_SITEMAP = { count: 5262, sha256: "5e017f0238ac1849ee4209e50306fe600125f84ee3c704bf527f29f747ffe2b5" };
{
  const paths = sitemapRoutes().map((e) => e.url.replace("https://nenjukkuneethi.org", "") || "/");
  eq(paths.length, PRE_R2_SITEMAP.count + READ_IA_R2_CONTRIBUTION.sitemap, "sitemap() = frozen pre-R2 5262 + R2 sitemap contribution");
  eq(paths.length - new Set(paths).size, 0, "sitemap() has 0 duplicate URLs");
  for (const r of READ_IA_R2_ROUTES) eq(paths.filter((p) => p === r).length, 1, `sitemap() lists ${r} exactly once`);
  const remainder = paths.filter((p) => !READ_IA_R2_ROUTES.includes(p)).sort();
  eq(remainder.length, PRE_R2_SITEMAP.count, "sitemap() minus the category routes = 5262 pre-R2 URLs");
  eq(createHash("sha256").update(remainder.join("\n")).digest("hex"), PRE_R2_SITEMAP.sha256, "the pre-R2 sitemap set is preserved exactly (no URL disappeared or changed)");
}

// ── 11. Built output (fails closed without a build; CI runs this after `npm run build`) ─────────────────────
// Earlier-wave validators add READ_IA_R2_CONTRIBUTION.build (and, since R2-C, .sitemap) to their whole-surface pins.
// This is what makes those terms honest: the category routes are exactly what R2 adds to the build and the sitemap.
const NEXT = path.join(process.cwd(), ".next");
if (!fs.existsSync(path.join(NEXT, "prerender-manifest.json"))) {
  ok(false, "no production build (.next/prerender-manifest.json) — run `npm run build`; the build checks cannot be skipped");
} else {
  const built = Object.keys((JSON.parse(fs.readFileSync(path.join(NEXT, "prerender-manifest.json"), "utf8")) as { routes: Record<string, unknown> }).routes);
  eq(READ_IA_R2_CONTRIBUTION.build, 9, "R2 build contribution derives to 9 (one page per registry route; R2-B and R2-C add no page)");
  const readEntry = (JSON.parse(fs.readFileSync(path.join(NEXT, "prerender-manifest.json"), "utf8")) as { routes: Record<string, { initialRevalidateSeconds: number | false }> }).routes["/read"];
  ok(!!readEntry && readEntry.initialRevalidateSeconds === false, "/read is prerendered fully static (no revalidation once the Daily Kural is gone)");
  eq(built.filter((r) => READ_CATEGORY_ROUTES.includes(r)).sort(), [...READ_CATEGORY_ROUTES].sort(), "all 9 category routes are prerendered");
  for (const r of READ_CATEGORY_ROUTES) ok(fs.existsSync(path.join(NEXT, "server/app", `${r}.html`)), `${r}.html is built`);
  eq(built.filter((r) => /^\/read\/[^/]+$/.test(r) && !chapterIds.includes(r.slice(6)) && !READ_CATEGORY_ROUTES.includes(r) && r !== "/read/nenjukku-neethi"), [], "no other /read/<x> page is built");
  const sitemap = path.join(NEXT, "server/app/sitemap.xml.body");
  ok(fs.existsSync(sitemap), "sitemap.xml is built");
  const locs = fs.existsSync(sitemap) ? (fs.readFileSync(sitemap, "utf8").match(/<loc>[^<]*<\/loc>/g) ?? []) : [];
  eq(READ_IA_R2_CONTRIBUTION.sitemap, 9, "R2 sitemap contribution derives to 9");
  for (const r of READ_IA_R2_ROUTES) eq(locs.filter((l) => l.endsWith(`${r}</loc>`)).length, 1, `built sitemap lists ${r} exactly once`);
  eq(locs.length, PRE_R2_SITEMAP.count + READ_IA_R2_CONTRIBUTION.sitemap, "built sitemap = frozen pre-R2 5262 + R2 sitemap contribution");
  eq(locs.length - new Set(locs).size, 0, "built sitemap has 0 duplicate URLs");
  const builtRemainder = locs
    .map((l) => l.slice(5, -6).replace("https://nenjukkuneethi.org", "") || "/")
    .filter((p) => !READ_IA_R2_ROUTES.includes(p))
    .sort();
  eq(createHash("sha256").update(builtRemainder.join("\n")).digest("hex"), PRE_R2_SITEMAP.sha256, "built sitemap minus the category routes is exactly the pre-R2 set");
  for (const h of LIBRARY_COLLECTIONS.map((c) => c.href)) ok(built.includes(h), `collection route ${h} is still prerendered`);
}

// ── Report ──────────────────────────────────────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`✗ test-read-categories: ${failures.length} of ${checks} checks failed`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `✓ test-read-categories: ${checks} checks — 9 categories, 9 routes, 0 collisions with 391 chapters, ` +
    `${READ_CATEGORIES.map((c) => EXPECTED_COUNTS[c.shelf]).join("/")} = ${total} works each listed once, ` +
    `Letters 1 work + corpus ${corpus.firstVolume}–${corpus.lastVolume} · ${corpus.volumeCount} volumes · ${corpus.letterCount} letters → /murasoli`,
);
