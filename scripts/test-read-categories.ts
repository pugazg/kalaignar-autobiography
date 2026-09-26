/**
 * Reading Room IA v2 — R2-A validator: category registry, the nine /read category routes, catalogue coverage,
 * the Letters corpus treatment and catalogue invariance.
 *
 *   npm run test:read-categories
 *
 * Scope is R2-A only. It asserts nothing about the /read landing (still the discovery view in this stage;
 * test:shelf-disclosure owns it), the sitemap or build totals — those change in later stages.
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
import { LIBRARY_COLLECTIONS, collectionMemberWorks } from "../data/collections";
import { chapterIndex } from "../data/references";
import { READ_CATEGORIES, READ_CATEGORY_ROUTES, READ_IA_R2_CONTRIBUTION, categoryForShelf, worksInCategory } from "../data/read-categories";
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

// ── 7. Built output (fails closed without a build; CI runs this after `npm run build`) ──────────────────────
// Earlier-wave validators add READ_IA_R2_CONTRIBUTION.build to their whole-build pins. This is what makes that term
// honest: the category routes are exactly what R2-A adds to the build, each prerendered, and none reaches the sitemap.
const NEXT = path.join(process.cwd(), ".next");
if (!fs.existsSync(path.join(NEXT, "prerender-manifest.json"))) {
  ok(false, "no production build (.next/prerender-manifest.json) — run `npm run build`; the build checks cannot be skipped");
} else {
  const built = Object.keys((JSON.parse(fs.readFileSync(path.join(NEXT, "prerender-manifest.json"), "utf8")) as { routes: Record<string, unknown> }).routes);
  eq(READ_IA_R2_CONTRIBUTION.build, 9, "R2 build contribution = 9 (one page per registry route)");
  eq(built.filter((r) => READ_CATEGORY_ROUTES.includes(r)).sort(), [...READ_CATEGORY_ROUTES].sort(), "all 9 category routes are prerendered");
  for (const r of READ_CATEGORY_ROUTES) ok(fs.existsSync(path.join(NEXT, "server/app", `${r}.html`)), `${r}.html is built`);
  eq(built.filter((r) => /^\/read\/[^/]+$/.test(r) && !chapterIds.includes(r.slice(6)) && !READ_CATEGORY_ROUTES.includes(r) && r !== "/read/nenjukku-neethi"), [], "no other /read/<x> page is built");
  const sitemap = path.join(NEXT, "server/app/sitemap.xml.body");
  ok(fs.existsSync(sitemap), "sitemap.xml is built");
  const locs = fs.existsSync(sitemap) ? (fs.readFileSync(sitemap, "utf8").match(/<loc>[^<]*<\/loc>/g) ?? []) : [];
  eq(locs.filter((l) => READ_CATEGORY_ROUTES.some((r) => l.endsWith(`${r}</loc>`))), [], "R2-A adds no category URL to the sitemap");
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
