// Wave 6 — Batch 7 P4 offline generator. Produces the STATIC catalogue module and the P4 integration
// record for the 116 short stories and their 5 source-ordered collections. Run ONCE, offline, with the
// pinned source checkout; its output is committed and read at build time — nothing here runs at runtime.
//
//   node scripts/build-wave6-b7-p4.mjs <source-checkout>
//
// WORKS come purely from the already-vendored payloads (public/data/stories/<slug>/{story,provenance}.json)
// — reproducible with no source at all. COLLECTIONS need the publication's own printed order and, for the
// 2009 reprint, its own pagination, so their ordinals + local extents are read from each collection's
// indexes/story-inventory.md at the frozen tree. The independent P4 validator re-derives all of this and
// proves the committed module against the source; this generator and that validator share no code.
import fs from "node:fs";
import path from "node:path";

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(path.join(SRC, "collections"))) {
  console.error("usage: node scripts/build-wave6-b7-p4.mjs <source-checkout with collections/>");
  process.exit(2);
}
const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave6/b7-short-stories.json"), "utf8"));
const REPO = "pugazg/kalaignar-short-stories";
const rd = (slug, f) => JSON.parse(fs.readFileSync(path.join(root, "public/data/stories", slug, f), "utf8"));
const die = (m) => { console.error("build-wave6-b7-p4: " + m); process.exit(1); };

// ── Collections we PUBLISH (owner-decided), with the human-authored English names + display labels.
const COLL = {
  "2008": { id: "2008-kalaignar-sonna-kathaigal", titleTa: "கலைஞர் சொன்ன கதைகள்", titleEn: "Stories Kalaignar Told" },
  "2004": { id: "2004-kalaignarin-kuttik-kathaigal", titleTa: "கலைஞரின் குட்டிக் கதைகள்", titleEn: "Kalaignar's Little Stories" },
  "1987": { id: "1987-kalaignar-sonna-kuttik-kathaigal", titleTa: "கலைஞர் சொன்ன குட்டிக் கதைகள்", titleEn: "Little Stories Kalaignar Told" },
  "2009": { id: "2009-16-kathaiyinile", titleTa: "16 கதையினிலே", titleEn: "In Sixteen Stories" },
  "1982": { id: "1982-mudiyatha-thodarkathai", titleTa: "முடியாத தொடர்கதை", titleEn: "The Unending Serial" },
};
const PUBLISHED_GROUPS = Object.keys(COLL);

// ── Normalised Tamil title → slug map, for inventory rows that identify a work by heading, not path.
const norm = (s) => (s || "").normalize("NFC").replace(/[\s​‌‍]/g, "")
  .replace(/[!?.,…\-‘’'"“”:;()]/g, "");
const titleToSlug = new Map();
const addTitle = (t, slug) => { const k = norm(t); if (!k) return; if (titleToSlug.has(k) && titleToSlug.get(k) !== slug) die(`title collision "${t}" → ${titleToSlug.get(k)} vs ${slug}`); titleToSlug.set(k, slug); };

// ── 1. The 116 new works, from payloads only. ────────────────────────────────────────────────────────
const groupOf = new Map(); // slug → group key
const works = [];
for (const g of manifest.groups) for (const { slug } of g.slugs) {
  const st = rd(slug, "story.json"), p = rd(slug, "provenance.json");
  groupOf.set(slug, g.group);
  addTitle(st.title.ta, slug); addTitle(p.source.printedTitleTa, slug);
  if (st.shelf !== "fiction" || st.subtype !== "short-story") die(`${slug}: not fiction/short-story`);
  if (!p.storyScope.complete) die(`${slug}: storyScope not complete`);
  const collTa = p.source.collectionTa;
  const inColl = PUBLISHED_GROUPS.includes(g.group);
  let descTa, descEn;
  if (inColl) { descTa = `‘${COLL[g.group].titleTa}’ தொகுப்பிலிருந்து ஒரு சிறுகதை.`; descEn = `A short story from the collection ‘${COLL[g.group].titleEn}’.`; }
  else if (collTa) { descTa = `‘${collTa}’ நூலிலிருந்து ஒரு சிறுகதை.`; descEn = `A short story from ‘${collTa}’.`; }
  else { descTa = "மு. கருணாநிதி எழுதிய சிறுகதை; இதழ்ச் சிறப்பிதழில் வெளிவந்தது."; descEn = "A short story by M. Karunanidhi, first carried in a periodical special issue."; }
  works.push({
    id: slug, slug, titleTa: st.title.ta, titleEn: st.title.en, shelf: "fiction",
    subtype: "short-story", readerStructure: "story", href: `/stories/${slug}`, state: "published",
    descTa, descEn, sourceRepo: st.sourceRepo, sourcePath: st.sourcePath, sourceCommit: st.sourceCommit,
    tamil: "complete", english: "complete", englishKind: "project-created", provenanceHref: `/stories/${slug}/source`,
  });
}
if (works.length !== 116) die(`expected 116 works, built ${works.length}`);

// The 11 existing 2009 canonicals resolve to already-published works — add their titles to the map.
const EXISTING_2009 = ["sumanthaval", "pugazhendhi", "nalayini", "kuppai-thotti", "sangilichami",
  "thappivittargal", "thappavillai", "ezhai", "kannadakkam", "vazha-mudiyathavargal", "ayyo-raja"];
for (const slug of EXISTING_2009) { const st = rd(slug, "story.json"); addTitle(st.title.ta, slug); }

// ── 2. Parse each collection's inventory for SOURCE ORDER + (2009) local extent. ───────────────────────
const invPath = (grp) => path.join(SRC, manifest.groups.find((g) => g.group === grp).collectionDir, "indexes/story-inventory.md");
const tableRows = (grp) => fs.readFileSync(invPath(grp), "utf8").split("\n")
  .filter((l) => /^\|\s*\d+\s*\|/.test(l)).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
const backtickTitles = (cell) => Array.from(cell.matchAll(/`([^`]+)`/g), (m) => m[1]);
const pathSlug = (cell) => { const m = /stories\/([a-z0-9-]+)\//.exec(cell); return m ? m[1] : null; };

function resolveSlug(grp, row, headingCell, dispositionCell) {
  const direct = pathSlug(dispositionCell) || pathSlug(headingCell);
  if (direct) return direct;
  // heading + any backticked canonical title named in the disposition (handles 1987 witness ≠ canonical)
  const cands = [...backtickTitles(headingCell), headingCell.replace(/`/g, ""), ...backtickTitles(dispositionCell)];
  for (const c of cands) { const s = titleToSlug.get(norm(c)); if (s) return s; }
  die(`${grp} row ${row}: cannot resolve slug from heading=${headingCell} disposition=${dispositionCell}`);
}

// column layout per collection (0-based, after trimming leading "|"): heading cell, disposition cell,
// and for 2009 the local printed-range + scan cells.
const LAYOUT = {
  "2008": { heading: 2, disp: 6 }, "2004": { heading: 1, disp: 5 },
  "1987": { heading: 1, disp: 4 }, "1982": { heading: 2, disp: 6 },
  "2009": { heading: 2, disp: 5, localPages: 3, localScans: 4 },
};

const collections = [];
for (const grp of PUBLISHED_GROUPS) {
  const meta = COLL[grp];
  const gm = manifest.groups.find((g) => g.group === grp);
  const rep = rd(gm.slugs[0].slug, "provenance.json"); // collection-wide source facts
  const lay = LAYOUT[grp];
  const rows = tableRows(grp);
  const members = [];
  const seenOrd = new Set();
  for (const cells of rows) {
    const ordinal = Number(cells[0]);
    if (seenOrd.has(ordinal)) die(`${grp}: duplicate ordinal ${ordinal}`);
    seenOrd.add(ordinal);
    const slug = resolveSlug(grp, ordinal, cells[lay.heading], cells[lay.disp]);
    const m = { workId: slug, ordinal };
    if (grp === "2009") { // reprint: record the 2009 edition's own pagination on the member
      m.localPages = cells[lay.localPages].replace(/\*\*/g, "").trim();
      m.localScans = cells[lay.localScans].replace(/\*\*/g, "").trim();
    }
    members.push(m);
  }
  // ordinals must be a contiguous 1..N run in printed order
  members.sort((a, b) => a.ordinal - b.ordinal);
  members.forEach((m, i) => { if (m.ordinal !== i + 1) die(`${grp}: ordinal gap at position ${i + 1} (got ${m.ordinal})`); });
  const expected = gm.plannedCollectionMemberCount;
  if (members.length !== expected) die(`${grp}: parsed ${members.length} members, manifest plans ${expected}`);
  collections.push({
    id: meta.id, shelf: "fiction", titleTa: meta.titleTa, titleEn: meta.titleEn, kind: "anthology",
    editionStatementTa: rep.source.editionStatementTa || undefined,
    memberCount: { value: members.length, labelTa: "சிறுகதைகள்", labelEn: "short stories" },
    href: `/collections/${meta.id}`,
    descTa: `‘${meta.titleTa}’ தொகுப்பு — ${members.length} சிறுகதைகள், நூலின் சொந்த வரிசையில்.`,
    descEn: `The ‘${meta.titleEn}’ collection — ${members.length} short stories, in the publication's own order.`,
    source: {
      repository: REPO, pinnedCommit: manifest.sourceCommit,
      collectionPath: gm.collectionDir, collectionTree: gm.collectionSubtreePin,
      scanFilename: rep.source.scanFilename || undefined, scanSha256: rep.source.scanSha256 || undefined,
    },
    members,
  });
}

// ── 3. Cross-membership & no-duplicate-work invariants. ────────────────────────────────────────────────
const memberCounts = new Map();
for (const c of collections) for (const m of c.members) memberCounts.set(m.workId, (memberCounts.get(m.workId) || 0) + 1);
const plural = [...memberCounts].filter(([, n]) => n > 1).map(([w]) => w).sort();
if (JSON.stringify(plural) !== JSON.stringify(["jaadi-kutti-poduma", "kuruvi-rameswaram"]))
  die(`expected exactly jaadi-kutti-poduma & kuruvi-rameswaram plural, got ${JSON.stringify(plural)}`);
// every 2009 existing member resolves to an already-published work, never a new duplicate
for (const slug of EXISTING_2009) if (works.some((w) => w.id === slug)) die(`${slug}: 2009 existing member wrongly created as a new work`);

// STORY_SLUGS additions = the 116 new works, in manifest (group) order.
const storySlugs = works.map((w) => w.slug);

// ── 4. Emit the static catalogue module. ───────────────────────────────────────────────────────────────
const j = (v) => JSON.stringify(v);
const workLit = (w) => `  {\n` + [
  `id: ${j(w.id)}`, `slug: ${j(w.slug)}`, `titleTa: ${j(w.titleTa)}`, `titleEn: ${j(w.titleEn)}`,
  `shelf: ${j(w.shelf)}`, `subtype: ${j(w.subtype)}`, `readerStructure: ${j(w.readerStructure)}`,
  `href: ${j(w.href)}`, `state: ${j(w.state)}`, `descTa: ${j(w.descTa)}`, `descEn: ${j(w.descEn)}`,
  `sourceRepo: ${j(w.sourceRepo)}`, `sourcePath: ${j(w.sourcePath)}`, `sourceCommit: ${j(w.sourceCommit)}`,
  `tamil: ${j(w.tamil)}`, `english: ${j(w.english)}`, `englishKind: ${j(w.englishKind)}`, `provenanceHref: ${j(w.provenanceHref)}`,
].map((s) => "    " + s).join(",\n") + `,\n  }`;
const memberLit = (m) => `      { workId: ${j(m.workId)}, ordinal: ${m.ordinal}` +
  (m.localPages ? `, localPages: ${j(m.localPages)}` : "") + (m.localScans ? `, localScans: ${j(m.localScans)}` : "") + ` }`;
const collLit = (c) => `  {\n` +
  `    id: ${j(c.id)},\n    shelf: ${j(c.shelf)},\n    titleTa: ${j(c.titleTa)},\n    titleEn: ${j(c.titleEn)},\n    kind: "anthology",\n` +
  (c.editionStatementTa ? `    editionStatementTa: ${j(c.editionStatementTa)},\n` : "") +
  `    memberCount: { value: ${c.memberCount.value}, labelTa: ${j(c.memberCount.labelTa)}, labelEn: ${j(c.memberCount.labelEn)} },\n` +
  `    href: ${j(c.href)},\n    descTa: ${j(c.descTa)},\n    descEn: ${j(c.descEn)},\n` +
  `    source: {\n      repository: ${j(c.source.repository)},\n      pinnedCommit: ${j(c.source.pinnedCommit)},\n` +
  `      collectionPath: ${j(c.source.collectionPath)},\n      collectionTree: ${j(c.source.collectionTree)},\n` +
  (c.source.scanFilename ? `      scanFilename: ${j(c.source.scanFilename)},\n` : "") +
  (c.source.scanSha256 ? `      scanSha256: ${j(c.source.scanSha256)},\n` : "") +
  `    },\n    members: [\n${c.members.map(memberLit).join(",\n")},\n    ],\n  }`;

const out = `// GENERATED by scripts/build-wave6-b7-p4.mjs — do not edit by hand.
//
// Wave 6 Batch 7 P4 catalogue layer: the 116 short-story LibraryWorks and the 5 collections that publish
// them, with each collection's membership + ordinals taken from the publication's own printed order (the
// source indexes/story-inventory.md, NOT the P1 planning arrays). The 2009 reprint records its OWN
// pagination on each member (localPages/localScans) so a member that is also a 1977 work never shows the
// 1977 edition's pages. Proven against the frozen source by scripts/validate-wave6-b7-p4-integration.ts.
import type { LibraryWork } from "@/data/library";
import type { LibraryCollection } from "@/data/collections";

export const WAVE6_B7_WORKS: LibraryWork[] = [
${works.map(workLit).join(",\n")},
];

export const WAVE6_B7_COLLECTIONS: LibraryCollection[] = [
${collections.map(collLit).join(",\n")},
];

/** The 116 new short-story slugs, in manifest (group) order, promoted into STORY_SLUGS at P4. */
export const WAVE6_B7_STORY_SLUGS_IN_ORDER: readonly string[] = [
${storySlugs.map((s) => "  " + j(s)).join(",\n")},
];
`;
fs.writeFileSync(path.join(root, "data/wave6-b7-catalogue.ts"), out);

// ── 5. Emit the P4 integration record. ─────────────────────────────────────────────────────────────────
const rec = {
  note: "Wave 6 Batch 7 P4 publication record — 116 short stories + 5 source-ordered collections. Separate from the frozen p4-integration.json.",
  wave: 6, batch: 7, family: "short-stories", sourceRepo: REPO, sourceCommit: manifest.sourceCommit,
  publish: {
    newWorks: 116, catalogue: { before: 100, after: 216 }, fiction: { before: 41, after: 157 },
    storySlugs: { before: 38, after: 154 },
    collections: { before: 1, after: 6, new: collections.map((c) => ({ id: c.id, members: c.members.length })) },
    discovery: { before: 64, after: 77, fictionEntries: { before: 5, after: 18 }, visible: { before: 39, after: 40 } },
    sitemap: { before: 3672, after: 3909, added: { story: 232, collection: 5 } },
    build: { prerender: { before: 3913, after: 3918 }, html: { before: 3908, after: 3913 } },
  },
  pluralMembers: plural,
  collections: collections.map((c) => ({
    id: c.id, group: PUBLISHED_GROUPS.find((g) => COLL[g].id === c.id), memberCount: c.members.length,
    collectionTree: c.source.collectionTree,
    members: c.members.map((m) => ({ ordinal: m.ordinal, workId: m.workId, ...(m.localPages ? { localPages: m.localPages, localScans: m.localScans } : {}) })),
  })),
  nonCollectionNewWorks: works.filter((w) => !PUBLISHED_GROUPS.includes(groupOf.get(w.slug))).map((w) => w.slug),
};
fs.writeFileSync(path.join(root, "data/internal/wave6/b7-p4-integration.json"), JSON.stringify(rec, null, 2) + "\n");

console.log(`OK — 116 works · ${collections.map((c) => `${c.id.slice(0, 4)}:${c.members.length}`).join(" ")} · plural ${j(plural)}`);
console.log(`  wrote data/wave6-b7-catalogue.ts and data/internal/wave6/b7-p4-integration.json`);
