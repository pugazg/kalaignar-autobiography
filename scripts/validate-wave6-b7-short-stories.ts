/**
 * Wave 6 — Batch 7 (Short Stories) P1 validator (HIDDEN data foundation). Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave6-b7-short-stories.ts [<source checkout>]
 *
 * Proves the hidden P1 foundation for the 116 canonical short stories:
 *   IDENTITY      — 116 canonical / 116 unique / 0 dup; group arithmetic; manifest ↔ payload set-equality;
 *                   no 1977-anthology duplication; kizhavan-kanavu / தேனலைகள் / நடுத்தெரு நாராயணி excluded.
 *   PAYLOADS      — exactly 116 story.json + provenance.json sets; every payload maps to one manifest slug;
 *                   no unmanifested and no missing payload; each payload is well-formed hidden data.
 *   SOURCE FREEZE — repo/commit/tree; per-group + per-work subtree pins (checked when a source checkout is given).
 *   WITNESSES     — witness identities never increase the canonical count (1987 25/23/2, 2009 16/5/11, 1976 8/2/6).
 *   COLLECTIONS   — planned future membership counts (2008 40, 2004 34, 1987 25, 1982 6, 2009 16); 1987's 2
 *                   cross-members and 2009's 11 plural members resolve to EXISTING canonical ids; 1976 planned=false;
 *                   no duplicate LibraryWork implied by any plural membership.
 *   HIDDEN GATE   — P1 changed none of STORY_SLUGS / LIBRARY_WORKS / LIBRARY_COLLECTIONS / COLLECTION_IDS /
 *                   /read discovery / sitemap; public boundary unchanged (catalogue 100, collections 1,
 *                   discovery 64/39, Fiction 41, sitemap 3672/0-dup). Route/.html counts belong to the
 *                   phase validators (P3: validate-wave6-b7-p3-routes.ts); this one asserts only the data surface.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { publishedWorks, LIBRARY_WORKS } from "../data/library";
import { discoveryShelves, LIBRARY_COLLECTIONS, COLLECTION_IDS } from "../data/collections";
import { STORY_SLUGS } from "../data/stories";
import sitemap from "../app/sitemap";

const root = process.cwd();
let checks = 0;
const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const eq = <T,>(a: T, b: T, l: string) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
const uniqSorted = (a: string[]) => Array.from(new Set(a)).sort();

type Group = { group: string; newCanonicalCount: number; publicCollectionPlanned: boolean; plannedCollectionMemberCount: number; plannedCollectionMembers: string[]; collectionDir: string | null; collectionSubtreePin: string | null; slugs: { slug: string; subtreePin: string }[] };
type ControlAuthority = { repo: string; commit: string; manifestPath: string };
type Manifest = { batch: number; batchId: string; sourceRepo: string; sourceCommit: string; sourceTree: string; controlAuthority?: ControlAuthority; workCount: number; discoverable: boolean; sitemapExposed: boolean; publicCollectionExposed: boolean; directRouteCountP1: number; groups: Group[]; witnesses: Record<string, { newCanonicals: number; witnessOnly: number; witnessIds: string[] }>; };
const manifest: Manifest = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave6/b7-short-stories.json"), "utf8"));

// ── 1. IDENTITY ────────────────────────────────────────────────────────────────────────────────────
const groupExpect: Record<string, number> = { "2008": 40, "2004": 34, "1987": 23, "2009": 5, "1982": 6, periodical: 3, "1976": 2, "1969": 1, "1953-thappivittargal": 1, "1997": 1 };
for (const [g, n] of Object.entries(groupExpect)) {
  const grp = manifest.groups.find((x) => x.group === g);
  ok(!!grp, `manifest has group ${g}`);
  if (grp) eq(grp.slugs.length, n, `group ${g} has exactly ${n} canonical works`);
}
const allSlugs = manifest.groups.flatMap((g) => g.slugs.map((s) => s.slug));
eq(allSlugs.length, 116, "manifest lists exactly 116 canonical works");
eq(new Set(allSlugs).size, 116, "116 unique canonical slugs (0 duplicates)");
eq(Object.values(groupExpect).reduce((a, b) => a + b, 0), 116, "group arithmetic 40+34+23+5+6+3+2+1+1+1 = 116");
eq(manifest.workCount, 116, "manifest workCount 116");
ok(!allSlugs.includes("kizhavan-kanavu"), "kizhavan-kanavu is NOT a Batch-7 work");
for (const bad of ["thenalaigal", "muthaaram", "nadutheru-narayani", "nadutheru-naaraayani"]) ok(!allSlugs.includes(bad), `excluded work ${bad} is absent`);
// no Batch-7 slug is an already-implemented catalogue work (1977 anthology members + kizhavan) — proven via STORY_SLUGS below.

// ── 2. PAYLOADS ────────────────────────────────────────────────────────────────────────────────────
const STORIES = path.join(root, "public/data/stories");
const payloadDirs = fs.readdirSync(STORIES, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
// every manifest slug has a complete, well-formed payload set
for (const slug of allSlugs) {
  const sp = path.join(STORIES, slug, "story.json");
  const pp = path.join(STORIES, slug, "provenance.json");
  ok(fs.existsSync(sp), `payload story.json exists for ${slug}`);
  ok(fs.existsSync(pp), `payload provenance.json exists for ${slug}`);
  if (fs.existsSync(sp)) {
    const s = JSON.parse(fs.readFileSync(sp, "utf8"));
    ok(s.slug === slug && s.workId === slug, `${slug}: story.json slug/workId match`);
    ok(s.shelf === "fiction" && s.subtype === "short-story" && s.readerStructure === "story", `${slug}: story.json shelf/subtype/readerStructure`);
    ok(!!s.title?.ta && !!s.title?.en, `${slug}: story.json has bilingual title`);
    ok(Array.isArray(s.tamil?.blocks) && s.tamil.blocks.length > 0, `${slug}: story.json has Tamil blocks`);
    ok(Array.isArray(s.english?.blocks) && s.english.blocks.length > 0, `${slug}: story.json has English blocks`);
  }
  if (fs.existsSync(pp)) {
    const p = JSON.parse(fs.readFileSync(pp, "utf8"));
    ok(p.batch === 7, `${slug}: provenance batch 7`);
    ok(p.hidden?.discoverable === false && p.hidden?.sitemapExposed === false && p.hidden?.publicCollectionExposed === false, `${slug}: provenance marked hidden`);
    ok(p.sourceCommit === manifest.sourceCommit, `${slug}: provenance pins the frozen source commit`);
  }
}
// no unmanifested Batch-7 payload: any story dir NOT in the pre-existing implemented set must be a manifest slug.
const implementedStorySlugs = new Set<string>(STORY_SLUGS as readonly string[]); // the 38 already-implemented (1977 anthology + kizhavan)
const manifestSet = new Set(allSlugs);
for (const dir of payloadDirs) {
  if (implementedStorySlugs.has(dir)) continue; // pre-existing published story payload
  ok(manifestSet.has(dir), `payload dir ${dir} is a manifested Batch-7 work (no unmanifested payload)`);
}
eq(payloadDirs.filter((d) => manifestSet.has(d)).length, 116, "exactly 116 Batch-7 payload dirs present");

// ── 3. SOURCE FREEZE ──────────────────────────────────────────────────────────────────────────────
eq(manifest.sourceRepo, "pugazg/kalaignar-short-stories", "source repo");
eq(manifest.sourceCommit, "7205a10892d0b208df2617766844f480b6a2c798", "frozen source commit");
eq(manifest.sourceTree, "1be34cc368fbc96ff72933a004a074ef840168ee", "frozen source tree");
for (const g of manifest.groups) for (const s of g.slugs) ok(/^[0-9a-f]{40}$/.test(s.subtreePin), `${s.slug}: 40-hex work subtree pin recorded`);
const SRC = process.argv[2] || (process.env.KDL_SOURCES_DIR ? `${process.env.KDL_SOURCES_DIR}/kalaignar-short-stories` : "");
if (SRC && fs.existsSync(path.join(SRC, "stories"))) {
  const git = (...a: string[]) => execFileSync("git", ["-C", SRC, ...a], { encoding: "utf8" }).trim();
  const treeOf = (p: string) => { const m = git("ls-tree", "HEAD", p).match(/^\d+ tree ([0-9a-f]{40})\t/); return m ? m[1] : null; };
  // Commit AND root-tree identity, both compared to the frozen constants and the manifest (redundant by design).
  eq(git("rev-parse", "HEAD"), manifest.sourceCommit, "live source HEAD == frozen source commit (no drift)");
  const rootTree = git("rev-parse", "HEAD^{tree}");
  eq(rootTree, "1be34cc368fbc96ff72933a004a074ef840168ee", "live source root tree == frozen source tree constant");
  eq(rootTree, manifest.sourceTree, "live source root tree == manifest.sourceTree");
  // Per-group collection subtree pins: compare the recorded pin to the ACTUAL frozen checkout tree.
  for (const g of manifest.groups) {
    if (g.collectionDir && g.collectionSubtreePin) {
      eq(treeOf(g.collectionDir), g.collectionSubtreePin, `group ${g.group}: collection subtree ${g.collectionDir} tree == recorded pin`);
    } else {
      ok(g.collectionDir === null && g.collectionSubtreePin === null, `group ${g.group}: no collection dir ⇒ no collection pin (periodical)`);
    }
  }
  // Per-work subtree pins + workspace existence.
  for (const g of manifest.groups) for (const s of g.slugs) {
    eq(treeOf(`stories/${s.slug}`), s.subtreePin, `${s.slug}: source subtree pin unchanged`);
    ok(fs.existsSync(path.join(SRC, "stories", s.slug)), `${s.slug}: source workspace exists`);
  }
  // 1977 anthology members disjoint from Batch 7 (read from source).
  const members1977 = new Set(execFileSync("bash", ["-c", `grep -rhoE 'stories/[a-z0-9-]+' ${JSON.stringify(path.join(SRC, "collections/1977-kalaignar-karunanidhiyin-sirukathaigal"))} | sed 's|stories/||' | sort -u`], { encoding: "utf8" }).trim().split(/\s+/).filter(Boolean));
  for (const s of allSlugs) ok(!members1977.has(s), `${s}: not a 1977 anthology member`);
} else {
  console.error("  · SOURCE-FREEZE live pin recheck SKIPPED — no source checkout given (CI passes one).");
}

// ── 3b. CONTROL-MANIFEST SET EQUALITY — against the PINNED frozen control artifact (not moving main) ──
const ca = manifest.controlAuthority;
ok(!!ca && ca.repo === "pugazg/kalaignar-tribute" && /^[0-9a-f]{40}$/.test(ca.commit) && !!ca.manifestPath, "manifest pins the control authority (repo/commit/path)");
const CTRL = process.argv[3] || (process.env.KDL_CONTROL_DIR ?? "");
if (CTRL && ca && fs.existsSync(path.join(CTRL, ".git"))) {
  const cgit = (...a: string[]) => execFileSync("git", ["-C", CTRL, ...a], { encoding: "utf8" }).trim();
  eq(cgit("rev-parse", "HEAD"), ca.commit, "control checkout HEAD == pinned control commit");
  const md = fs.readFileSync(path.join(CTRL, ca.manifestPath), "utf8");
  const ctrlSlugs: string[] = [];
  let inGroup = false;
  for (const ln of md.split("\n")) {
    if (/^### Group \d+ /.test(ln)) { inGroup = true; continue; }
    if (inGroup && ln.trim().startsWith("`")) { ctrlSlugs.push(...Array.from(ln.matchAll(/`([a-z0-9-]+)`/g), (m) => m[1])); inGroup = false; }
  }
  eq(ctrlSlugs.length, 116, "control manifest lists exactly 116 canonical slugs");
  eq(new Set(ctrlSlugs).size, 116, "control manifest 116 unique");
  eq(allSlugs.length, 116, "implementation manifest 116");
  eq(new Set(allSlugs).size, 116, "implementation manifest 116 unique");
  eq(uniqSorted(ctrlSlugs), uniqSorted(allSlugs), "control ↔ implementation SET equality");
  eq(ctrlSlugs, allSlugs, "control ↔ implementation ORDERED equality");
  eq(ctrlSlugs.filter((s) => !manifestSet.has(s)), [], "0 control works missing from implementation");
  eq(allSlugs.filter((s) => !new Set(ctrlSlugs).has(s)), [], "0 implementation works extra vs control");
} else {
  console.error("  · CONTROL set-equality SKIPPED — no pinned control checkout given (CI passes one via KDL_CONTROL_DIR / argv[3]).");
}

// ── 4. WITNESSES ──────────────────────────────────────────────────────────────────────────────────
const wExpect: Record<string, [number, number]> = { "1987": [23, 2], "2009": [5, 11], "1976": [2, 6] };
for (const [g, [nc, wo]] of Object.entries(wExpect)) {
  const w = manifest.witnesses[g];
  ok(!!w, `witnesses recorded for ${g}`);
  if (w) {
    eq(w.newCanonicals, nc, `${g}: ${nc} new canonicals`);
    eq(w.witnessOnly, wo, `${g}: ${wo} witness-only`);
    eq(w.witnessIds.length, wo, `${g}: witness id list length ${wo}`);
    // The load-bearing invariant: a witness is never counted as a NEW canonical WITHIN ITS OWN
    // witnessing group (no double-count). A witness may itself be a canonical whose HOME is another
    // group (e.g. 1987 witnesses jaadi-kutti-poduma [2008] / kuruvi-rameswaram [2004]) or an
    // already-implemented work (e.g. 2009's 11 are 1977-anthology members) — either way it must not
    // inflate this group's count.
    const own = new Set(manifest.groups.find((x) => x.group === g)!.slugs.map((s) => s.slug));
    for (const wid of w.witnessIds) ok(!own.has(wid), `${g}: witness ${wid} is NOT double-counted in its own group`);
  }
}
eq(manifest.witnesses["1987"].newCanonicals + manifest.witnesses["1987"].witnessOnly, 25, "1987 source = 25 entries (23 + 2)");
eq(manifest.witnesses["2009"].newCanonicals + manifest.witnesses["2009"].witnessOnly, 16, "2009 source = 16 entries (5 + 11)");
eq(manifest.witnesses["1976"].newCanonicals + manifest.witnesses["1976"].witnessOnly, 8, "1976 source = 8 entries (2 + 6)");

// ── 5. FUTURE-COLLECTION PLAN (internal only) ───────────────────────────────────────────────────────
const planExpect: Record<string, number> = { "2008": 40, "2004": 34, "1987": 25, "1982": 6, "2009": 16 };
for (const [g, members] of Object.entries(planExpect)) {
  const grp = manifest.groups.find((x) => x.group === g)!;
  ok(grp.publicCollectionPlanned === true, `${g}: public collection planned`);
  eq(grp.plannedCollectionMemberCount, members, `${g}: planned collection has ${members} members`);
  eq(grp.plannedCollectionMembers.length, members, `${g}: planned member list length ${members}`);
  eq(new Set(grp.plannedCollectionMembers).size, members, `${g}: planned members unique`);
}
ok(manifest.groups.find((x) => x.group === "1976")!.publicCollectionPlanned === false, "1976 public collection planned = false");
for (const g of ["periodical", "1969", "1953-thappivittargal", "1997"]) ok(manifest.groups.find((x) => x.group === g)!.publicCollectionPlanned === false, `${g} public collection planned = false`);
// 1987's two cross-members resolve to existing canonical ids (already-implemented STORY_SLUGS), not new works.
for (const id of ["jaadi-kutti-poduma", "kuruvi-rameswaram"]) {
  const g1987 = manifest.groups.find((x) => x.group === "1987")!;
  ok(g1987.plannedCollectionMembers.includes(id), `1987 plan includes cross-member ${id}`);
  ok(manifestSet.has(id), `1987 cross-member ${id} is itself a Batch-7 canonical (its own home)`);
}
// 2009's eleven plural members resolve to EXISTING (already-implemented) 1977 canonicals, never new works.
const g2009 = manifest.groups.find((x) => x.group === "2009")!;
const plural2009 = g2009.plannedCollectionMembers.filter((m) => !g2009.slugs.some((s) => s.slug === m));
eq(plural2009.length, 11, "2009 plan adds exactly 11 plural members beyond its 5 new works");
for (const id of plural2009) {
  ok(implementedStorySlugs.has(id), `2009 plural member ${id} is an already-implemented canonical (no duplicate LibraryWork)`);
  ok(!manifestSet.has(id), `2009 plural member ${id} is not a new Batch-7 work`);
}

// ── 6. HIDDEN-BOUNDARY GATE ─────────────────────────────────────────────────────────────────────────
eq(manifest.discoverable, false, "manifest discoverable=false");
eq(manifest.sitemapExposed, false, "manifest sitemapExposed=false");
eq(manifest.publicCollectionExposed, false, "manifest publicCollectionExposed=false");
eq(manifest.directRouteCountP1, 0, "manifest directRouteCountP1=0");
// none of the 116 leaked into any public surface
for (const slug of allSlugs) {
  ok(!(STORY_SLUGS as readonly string[]).includes(slug), `${slug} not promoted into STORY_SLUGS`);
  ok(!LIBRARY_WORKS.some((w) => w.slug === slug || w.id === slug), `${slug} not added to LIBRARY_WORKS`);
  ok(!COLLECTION_IDS.includes(slug), `${slug} not a public collection id`);
}
// public boundary unchanged
eq(publishedWorks().length, 100, "catalogue still 100 works");
eq(LIBRARY_COLLECTIONS.length, 1, "public collections still 1");
const shelves = discoveryShelves();
eq(shelves.flatMap((s) => s.entries).length, 64, "/read discovery still 64 entries");
eq(shelves.reduce((n, s) => n + Math.min(s.entries.length, 6), 0), 39, "initially visible still 39");
eq(shelves.find((s) => s.shelf.id === "fiction")!.works.length, 41, "Fiction shelf still 41 works");
const urls = sitemap().map((e) => e.url);
eq(urls.length, 3672, "sitemap still 3672 URLs");
eq(urls.length - new Set(urls).size, 0, "sitemap still 0 duplicates");
for (const slug of allSlugs) ok(!urls.some((u) => u.endsWith(`/stories/${slug}`) || u.includes(`/stories/${slug}/`)), `${slug} not exposed in sitemap`);
// Build boundary: this validator owns only the DATA surface (manifest, payloads, and the public
// in-memory surfaces asserted above). It deliberately makes NO assertion about prerendered-route or
// .html counts: from P3 onward the 116 Batch-7 reader/source routes are prerendered on purpose (direct-
// addressable but still undiscovered), so a P1-era "0 new routes / 3681 / 3676" snapshot would be a
// false negative once P3 or P4 shares the build tree. The route-level boundary is proved by the phase
// validators that own it — scripts/validate-wave6-b7-p3-routes.ts (3913 / 3908, still off every public
// surface) and, at publication, scripts/validate-wave6-b7-p4-integration.ts.

if (fail.length) {
  console.error(`\nwave6-b7-short-stories — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave6-b7-short-stories — ${checks} checks, 0 failed`);
console.log(`  116 hidden short-story payloads · groups 40+34+23+5+6+3+2+1+1+1=116 · future collections 5 (2008 40 / 2004 34 / 1987 25 / 1982 6 / 2009 16) · 0 public routes · catalogue 100 · sitemap 3672/0`);
