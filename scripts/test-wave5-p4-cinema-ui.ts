/**
 * Wave 5 P4 — Cinema cross-work public-semantics regression (RENDER level).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-wave5-p4-cinema-ui.ts
 *
 * Renders the REAL catalogue surface in both languages and proves the six frozen
 * Wave-5 Cinema cards keep their distinct public semantics side by side (Wave 6 P4 added ammaiyappan as
 * the 7th cinema card, which pushes the shelf over the disclosure cap). It is deliberately NOT the 443-check P2
 * reader test (which renders each work's reader/source) nor the P3 data-layer catalogue test: it
 * asserts what the SHELF actually renders across all six works — order, per-card copy, and disclosure —
 * so a shared shelf/reader-structure or a shared card component cannot flatten one work into another.
 *
 * Reading Room IA v2 R2-B: the Cinema work cards are rendered by the Cinema category page (/read/cinema,
 * components/LibraryCategoryPage.tsx) — the same WorkCard, in full with no disclosure — and /read is nine category
 * cards. So the card assertions below run on /read/cinema; section 4 records the retired /read disclosure as data only.
 *
 * What renders on a work card is the title + description only (see components/LibraryHome.tsx
 * WorkCard). Unit-count LABELS and reader-only fields (source scene numbers, authorship tiers, the
 * song-11/scene-58 relation) are NOT on the card — those distinctions are proven where they live, in
 * scripts/validate-wave5-p4-cinema-integrity.ts. This file proves the rendered card surface.
 *
 * Positive AND negative assertions (the Wayfinding lesson: proving a bad state absent is not enough
 * where a specific good state must be present).
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LibraryHome from "../components/LibraryHome";
import LibraryCategoryPage from "../components/LibraryCategoryPage";
import { LangProvider } from "../lib/i18n";
import { discoveryShelves } from "../data/collections";

const CAP = 6; // the HISTORICAL /read disclosure cap (retired from the page in R2-B; recorded as data in section 4)
let checks = 0;
const failures: string[] = [];
const ok = (cond: boolean, label: string) => { checks++; if (!cond) failures.push(label); };
const eq = <T,>(a: T, b: T, label: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${label}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };

// Bare render → context default lang "en"; LangProvider wrapper → its useState initial "ta".
const htmlEn = renderToStaticMarkup(createElement(LibraryCategoryPage, { shelf: "cinema-writing" }));
const htmlTa = renderToStaticMarkup(createElement(LangProvider, null, createElement(LibraryCategoryPage, { shelf: "cinema-writing" })));
const homeEn = renderToStaticMarkup(createElement(LibraryHome));

/** The category page's work grid (its "category-works" section). */
function worksGrid(html: string): string {
  const start = html.indexOf('data-testid="category-works"');
  if (start === -1) return "";
  const end = html.indexOf("</section>", start);
  return end === -1 ? html.slice(start) : html.slice(start, end);
}
function hrefsIn(s: string): string[] {
  const re = /<a[^>]+href="([^"]+)"/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out.push(m[1]);
  return out;
}
/** The rendered card block for one work href, from `<a href="…"` to its closing `</a>`. */
function cardHtml(section: string, href: string): string {
  const at = section.indexOf(`href="${href}"`);
  if (at === -1) return "";
  const rest = section.slice(at);
  const end = rest.indexOf("</a>");
  return end === -1 ? rest : rest.slice(0, end);
}
const textOf = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const cinemaEn = worksGrid(htmlEn);
const cinemaTa = worksGrid(htmlTa);
ok(cinemaEn.length > 0 && cinemaTa.length > 0, "the /read/cinema work grid renders in both languages");

// ── 1. Cinema cards in EXACT onboarding order (rendered hrefs) ────────────────────────────────────
// Wave 6 P4 published ammaiyappan (Wave-6 Batch 1) as the 7th cinema card; Wave 7 B1 adds the 8th–10th
// (maruthanattu · vandikkaran · naam) in manifest order. Since R2-B all ten render on /read/cinema, in full.
const ORDER = [
  "/cinema/manohara", "/cinema/parasakthi", "/cinema/tirumbippaar",
  "/cinema/thirai-isai-paadalgal", "/cinema/manthiri-kumari", "/cinema/raja-rani",
  "/cinema/ammaiyappan",
  "/cinema/maruthanattu-ilavarasi", "/cinema/vandikkaran-magan", "/cinema/naam",
];
eq(hrefsIn(cinemaEn), ORDER, "ten Cinema cards render in onboarding order (EN)");
eq(hrefsIn(cinemaTa), ORDER, "ten Cinema cards render in onboarding order (TA)");
ok(!hrefsIn(cinemaEn).some((h) => !ORDER.includes(h)), "no Cinema card outside the ten (EN)");

// ── 2. Per-card distinct public semantics, as actually rendered ───────────────────────────────────
const en = (href: string) => textOf(cardHtml(cinemaEn, href));
const ta = (href: string) => textOf(cardHtml(cinemaTa, href));

// Manohara — reads as a screenplay-dialogue booklet (its own desc), not flattened to the others.
ok(/screenplay-dialogue booklet/i.test(en("/cinema/manohara")), "Manohara card reads as a screenplay-dialogue booklet (EN)");
ok(/திரைக்கதை–வசன நூல்/.test(ta("/cinema/manohara")), "Manohara card keeps its திரைக்கதை–வசன wording (TA)");

// Parasakthi — describes its printed scene structure.
ok(/46 scenes/i.test(en("/cinema/parasakthi")), "Parasakthi card describes its 46 printed scenes (EN)");
ok(/46 காட்சிகள்/.test(ta("/cinema/parasakthi")), "Parasakthi card keeps its 46 காட்சிகள் wording (TA)");

// Tirumbippaar — story/dialogue scoped; must not acquire blanket song authorship.
ok(/story and dialogue/i.test(en("/cinema/tirumbippaar")), "Tirumbippaar card stays story-and-dialogue scoped (EN)");
ok(/கதை–வசனம்/.test(ta("/cinema/tirumbippaar")), "Tirumbippaar card keeps கதை–வசனம் scoping (TA)");
ok(!/songs by kalaignar|lyrics by kalaignar/i.test(en("/cinema/tirumbippaar") + ta("/cinema/tirumbippaar")), "Tirumbippaar card claims no blanket song authorship");

// Film Songs — the 54 stays a corpus, never "54 songs by Kalaignar".
ok(/film-grouped lyrics/i.test(en("/cinema/thirai-isai-paadalgal")), "Film Songs card describes film-grouped lyrics (EN)");
ok(!/54 (songs|lyrics) (by|of) kalaignar|songs by kalaignar/i.test(en("/cinema/thirai-isai-paadalgal") + ta("/cinema/thirai-isai-paadalgal")), "Film Songs card makes 54 a corpus, not an authorship claim");

// Manthiri — keeps its SOURCE-BACKED story/dialogue credit and film-booklet semantics; not a screenplay.
ok(/story and dialogue/i.test(en("/cinema/manthiri-kumari")), "Manthiri card keeps its source-backed story/dialogue credit (EN)");
ok(/கதை–வசனம்/.test(ta("/cinema/manthiri-kumari")), "Manthiri card keeps its source-backed story/dialogue credit (TA)");
ok(/film booklet/i.test(en("/cinema/manthiri-kumari")), "Manthiri card reads as a film booklet (EN)");
ok(!/screenplay/i.test(en("/cinema/manthiri-kumari") + ta("/cinema/manthiri-kumari")), "Manthiri card is not called a screenplay");

// Raja — deliberately NEUTRAL: it must NOT acquire Manthiri's story/dialogue role credit, and must not
// frame its archive segments as source-numbered scenes.
ok(/dialogue screenplay publication/i.test(en("/cinema/raja-rani")), "Raja card uses neutral screenplay-publication wording (EN)");
ok(/வசன நூல்/.test(ta("/cinema/raja-rani")), "Raja card uses neutral வசன நூல் wording (TA)");
ok(/archive segments/i.test(en("/cinema/raja-rani")), "Raja card frames the 58 as archive segments (EN)");
ok(/களஞ்சியப் பகுதி/.test(ta("/cinema/raja-rani")), "Raja card frames the 58 as archive segments (TA)");
// Apostrophe-robust: JSX renders the possessive apostrophe as an HTML entity, so match the
// entity-free phrase "story and dialogue" (absent from Raja's neutral card, present on Manthiri's)
// rather than the literal "Kalaignar's …". The TA side has no such escaping.
ok(!/story and dialogue/i.test(en("/cinema/raja-rani")) && !/கலைஞரின் கதை–வசனம்/.test(ta("/cinema/raja-rani")), "Raja card does NOT acquire Manthiri's role credit");
ok(!/\bnumbered scenes\b|\b58 scenes\b/i.test(en("/cinema/raja-rani") + ta("/cinema/raja-rani")), "Raja card does not call its archive segments numbered scenes");

// ── 3. Manthiri/Raja carry no year/edition/rights claim on the rendered card ──────────────────────
for (const href of ["/cinema/manthiri-kumari", "/cinema/raja-rani"]) {
  const both = en(href) + " " + ta(href);
  ok(!/\b(19|20)\d{2}\b/.test(both), `${href} card renders no year`);
  ok(!/edition|பதிப்பு/i.test(both), `${href} card renders no edition`);
  ok(!/rights|nationalis|உரிமை/i.test(both), `${href} card renders no rights claim`);
}

// ── 4. The retired /read disclosure — now data only ──────────────────────────────────────────────
// Until R2-A, the six over-cap shelves each rendered one <details> on /read, Cinema (10 entries) among them. R2-B
// retired that UI: /read renders nine category cards and no disclosure, and /read/cinema shows all ten cards with no
// disclosure. The over-cap shelf set is still derivable from the unchanged discovery model and is recorded as data.
eq((homeEn.match(/<details/g) ?? []).length, 0, "/read renders no disclosure (R2-B)");
eq((htmlEn.match(/<details/g) ?? []).length, 0, "/read/cinema renders all ten cards with no disclosure");
ok(/href="\/read\/cinema"/.test(homeEn), "/read links the Cinema category page");
ok(/data-shelf="cinema-writing"[\s\S]*?>10 works</.test(homeEn), "the /read Cinema card states its 10 works");
const overCap = discoveryShelves().filter((s) => s.entries.length > CAP).map((s) => s.shelf.id);
eq(overCap, ["fiction", "poetry", "drama", "cinema-writing", "speeches", "essays-articles"], "the discovery model's six over-cap shelves (data; post Batch-7: Fiction joined)");

// ── Report ──────────────────────────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`\nwave5-p4-cinema-ui — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exitCode = 1;
} else {
  console.log(`\nwave5-p4-cinema-ui — ${checks} checks, 0 failed`);
  console.log("  10 Cinema cards on /read/cinema in onboarding order (+ammaiyappan Wave-6, +3 Wave-7 B1) · per-work semantics distinct · Manthiri credit kept · Raja neutral · no year/edition/rights · /read 0 disclosures · discovery model 6 over-cap shelves (data)");
}
