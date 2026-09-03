// Source-linked validator — Reading Room Wayfinding Phase 1, the collection layer.
//
//   node scripts/validate-collections.mjs <path-to-kalaignar-short-stories-clone>
//
// ── WHAT THIS PROVES, AND WHY IT IS NOT THE WAVE-2 VALIDATOR ────────────────────────────────────────
// scripts/validate-1977-short-stories.mjs already proves the ARCHIVE: that the 37 released stories are
// faithful to the frozen source, that their ordinals run 1–37, that page and scan ranges match. None of
// that is repeated here.
//
// This validator proves something the archive validator cannot: that the CATALOGUE-FACING collection
// declaration — the roster /read and /collections render from — equals the collection the source
// archive actually registers. A declaration is a new, hand-written artefact. It can drift from the
// archive it claims to describe while every story in that archive remains perfectly valid.
//
// ── TWO INDEPENDENT WITNESSES ───────────────────────────────────────────────────────────────────────
// The expectation is re-derived from the SOURCE ARCHIVE'S OWN collection registration —
//   collections/<id>/metadata/source.md      the publication's identity, edition, publisher, size
//   collections/<id>/indexes/story-inventory.md   the printed contents: ordinal, pages, story path
// — parsed here, in this file, from the frozen clone. It is never taken from data/collections.ts, and
// never from the generated public/data records the importer wrote. If the declaration and this
// validator both read the declaration, they would agree about a lie.
//
// A third witness, the generated per-story records, is used only where the source markdown does not
// carry the fact (whether a released story is typed as an anthology story at all).
//
// ── CONTRACT (docs/VALIDATOR_CONTRACT.md) ───────────────────────────────────────────────────────────
//   0  declaration matches the frozen source
//   1  it does not — the message names what differs
//   2  the source clone is missing or unusable
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SOURCES = process.argv[2];
if (!SOURCES) {
  console.error("usage: node scripts/validate-collections.mjs <sources-dir>");
  process.exit(2);
}
if (!fs.existsSync(SOURCES) || !fs.statSync(SOURCES).isDirectory()) {
  console.error(`source clone not found or not a directory: ${SOURCES}`);
  process.exit(2);
}

// ── Assertions ──────────────────────────────────────────────────────────────────────────────────────
let checks = 0;
const failures = [];
const groups = [];
let group = null;
const startGroup = (name) => {
  group = { name, checks: 0, failures: 0 };
  groups.push(group);
};
const ok = (label, cond) => {
  checks++;
  group.checks++;
  if (!cond) {
    failures.push(label);
    group.failures++;
  }
};
const eq = (label, actual, want) => {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(want);
  checks++;
  group.checks++;
  if (a !== b) {
    failures.push(`${label}\n     expected ${b}\n     actual   ${a}`);
    group.failures++;
  }
};

// ── The implementation declaration, read from the real module ───────────────────────────────────────
// Dumped through tsx rather than text-parsed: a regex over TypeScript would pass whenever the file
// merely LOOKED right, and the thing under test is the value the app actually renders.
function tsxDump(body) {
  // A temp module rather than `tsx -e`: eval mode does not resolve this project's local TS imports,
  // and a silent empty result would look like a passing check.
  const tmp = path.join(process.cwd(), `.collections-dump-${process.pid}.ts`);
  fs.writeFileSync(tmp, body);
  try {
    const r = spawnSync("npx", ["tsx", "--tsconfig", "tsconfig.scripts.json", tmp], { encoding: "utf8" });
    const out = (r.stdout ?? "") + (r.stderr ?? "");
    const marker = out.indexOf("@@JSON@@");
    if (r.status !== 0 || marker < 0) return { error: out.slice(0, 2000) };
    return { value: JSON.parse(out.slice(marker + 8).split("\n")[0]) };
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

function loadDeclaration() {
  const r = tsxDump(`import { LIBRARY_COLLECTIONS, COLLECTION_IDS, collectionForWork } from "./data/collections";
import { publishedWorks } from "./data/library";
const works = publishedWorks().map((w) => ({ id: w.id, href: w.href, shelf: w.shelf, unitCount: w.unitCount ?? null }));
console.log("@@JSON@@" + JSON.stringify({
  collections: LIBRARY_COLLECTIONS,
  ids: COLLECTION_IDS,
  works,
  reverse: works.filter((w) => collectionForWork(w.id)).map((w) => [w.id, collectionForWork(w.id)!.id]),
}));
`);
  if (r.error) {
    console.error("could not load data/collections.ts\n" + r.error);
    process.exit(2);
  }
  return r.value;
}

// ── The source witness ──────────────────────────────────────────────────────────────────────────────
const COLLECTION_ID = "1977-kalaignar-karunanidhiyin-sirukathaigal";
const collDir = path.join(SOURCES, "collections", COLLECTION_ID);
if (!fs.existsSync(collDir)) {
  console.error(`collection not present in the source clone: ${collDir}`);
  process.exit(2);
}
const readSource = (rel) => {
  const p = path.join(collDir, rel);
  if (!fs.existsSync(p)) {
    console.error(`source file missing: ${p}`);
    process.exit(2);
  }
  return fs.readFileSync(p, "utf8");
};
const sourceMd = readSource("metadata/source.md");
const inventoryMd = readSource("indexes/story-inventory.md");

/** One field from the source registration's bullet list: `- Label: **value**` or `` `value` ``. */
function sourceField(label) {
  const re = new RegExp(`^- ${label}:\\s*(?:\\*\\*(.+?)\\*\\*|\`(.+?)\`|(.+))$`, "m");
  const m = re.exec(sourceMd);
  return m ? (m[1] ?? m[2] ?? m[3]).trim() : null;
}

/**
 * The printed contents, from the source's own inventory table.
 *
 * Each row is `| n | TOC title | opening heading | first–last | scans | … stories/<slug>/ |`. The slug
 * comes from the story path the archive itself records, so the mapping ordinal → work is the archive's,
 * not this file's guess from a title.
 */
function sourceInventory() {
  const rows = [];
  for (const line of inventoryMd.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 7) continue;
    const ordinal = Number(cells[1]);
    if (!Number.isInteger(ordinal)) continue; // header / separator rows
    const pages = /^(\d+)\s*[–-]\s*(\d+)$/.exec(cells[4].replace(/`/g, ""));
    const slugM = /stories\/([a-z0-9-]+)\//.exec(cells[6]);
    rows.push({
      ordinal,
      printedPages: pages ? { first: Number(pages[1]), last: Number(pages[2]) } : null,
      slug: slugM ? slugM[1] : null,
    });
  }
  return rows.sort((a, b) => a.ordinal - b.ordinal);
}

/** Git tree of the collection directory at the clone's HEAD — the freeze guard. */
function collectionTreeSha() {
  const r = spawnSync("git", ["rev-parse", `HEAD:collections/${COLLECTION_ID}`], { cwd: SOURCES, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}
function headSha() {
  const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: SOURCES, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

/** Released per-story records — the third witness, used only for the released source FORM. */
function releasedAnthologyStories() {
  const base = path.join(process.cwd(), "public/data/stories");
  if (!fs.existsSync(base)) return null;
  const out = new Map();
  for (const slug of fs.readdirSync(base)) {
    const p = path.join(base, slug, "story.json");
    if (!fs.existsSync(p)) continue;
    try {
      const s = JSON.parse(fs.readFileSync(p, "utf8"));
      out.set(slug, { sourceForm: s.sourceForm ?? null, anthology: s.anthology ?? null });
    } catch {
      /* a malformed record is the archive validator's business, not this one's */
    }
  }
  return out;
}

const decl = loadDeclaration();
const inventory = sourceInventory();
const released = releasedAnthologyStories();

// ── A. Declaration presence and source identity ─────────────────────────────────────────────────────
startGroup("DECLARATION AND SOURCE IDENTITY");
const c = decl.collections.find((x) => x.id === COLLECTION_ID);
ok("the collection registry exists and is non-empty", Array.isArray(decl.collections) && decl.collections.length > 0);
ok(`the benchmark collection ${COLLECTION_ID} is declared`, Boolean(c));
if (!c) {
  // Report before exiting. A validator that stops without naming the assertion that stopped it forces
  // the reader to guess, and the guess is usually "the source is broken" when the truth is that the
  // declaration was renamed.
  console.log("");
  for (const g of groups) console.log(`  ${g.failures === 0 ? "PASS" : "FAIL"}  ${g.name} (${g.checks} assertions, ${g.failures} failed)`);
  console.log(`\ncollections — ${checks} assertions, ${failures.length} FAILED\n`);
  for (const f of failures) console.log(`  \u2717 ${f}`);
  console.log(`\n  the benchmark collection is not declared; nothing further could be checked\n`);
  process.exit(1);
}
ok("the collection id is exported in the route registry", decl.ids.includes(COLLECTION_ID));
eq("shelf", c.shelf, "fiction");
eq("kind", c.kind, "anthology");
eq("source repository", c.source.repository, "pugazg/kalaignar-short-stories");
eq("source collection path", c.source.collectionPath, `collections/${COLLECTION_ID}`);

const head = headSha();
const tree = collectionTreeSha();
ok("the source clone is a git checkout", Boolean(head) && Boolean(tree));
eq("the clone is at the declared pinned commit", head, c.source.pinnedCommit);
eq("the collection tree matches the declared freeze", tree, c.source.collectionTree);

// Identity facts, each against the source registration rather than against each other.
eq("printed title matches the source registration", c.titleTa, sourceField("Printed title"));
eq("edition statement matches the source registration", c.editionStatementTa, sourceField("Edition statement"));
eq("publisher imprint matches the source registration", c.publisherTa, sourceField("Publisher imprint"));
eq("controlling scan filename matches the source registration", c.source.scanFilename, sourceField("Source filename"));
eq("controlling scan SHA-256 matches the source registration", c.source.scanSha256, sourceField("SHA-256"));

// ── B. Inventory structure — presence, then shape, before any equality ──────────────────────────────
startGroup("INVENTORY STRUCTURE");
ok("the source inventory table was parsed", inventory.length > 0);
ok("every source inventory row names a story directory", inventory.every((r) => r.slug));
ok("every source inventory row carries a printed page range", inventory.every((r) => r.printedPages));
ok("the declaration has a non-empty member list", Array.isArray(c.members) && c.members.length > 0);
ok("every member is an object with a workId string", c.members.every((m) => m && typeof m.workId === "string" && m.workId));
ok("every member ordinal is a positive integer", c.members.every((m) => Number.isInteger(m.ordinal) && m.ordinal > 0));
ok("memberCount is a positive integer with both labels", Number.isInteger(c.memberCount?.value) && c.memberCount.value > 0 && Boolean(c.memberCount.labelTa) && Boolean(c.memberCount.labelEn));

// ── C. Source equality ──────────────────────────────────────────────────────────────────────────────
startGroup("SOURCE EQUALITY");
const sourceCount = Number(/lists \*\*(\d+) short stories\*\*/.exec(sourceMd)?.[1]);
ok("the source registration states its own story count", Number.isInteger(sourceCount));
eq("the source inventory lists exactly that many stories", inventory.length, sourceCount);
eq("the declaration has exactly as many members as the source", c.members.length, inventory.length);
eq("memberCount equals the source-stated collection size", c.memberCount.value, sourceCount);

const declBySlug = new Map(c.members.map((m) => [m.workId, m]));
const srcBySlug = new Map(inventory.map((r) => [r.slug, r]));
// SET EQUALITY, both directions — a subset must never pass.
const missing = [...srcBySlug.keys()].filter((s) => !declBySlug.has(s));
const extra = [...declBySlug.keys()].filter((s) => !srcBySlug.has(s));
eq("no source story is missing from the declaration", missing, []);
eq("the declaration adds no work the source does not list", extra, []);
eq("no duplicate member workId", c.members.length, new Set(c.members.map((m) => m.workId)).size);
eq("no duplicate ordinal", c.members.length, new Set(c.members.map((m) => m.ordinal)).size);

const ordinalMismatch = [...srcBySlug.entries()]
  .filter(([slug, r]) => declBySlug.get(slug) && declBySlug.get(slug).ordinal !== r.ordinal)
  .map(([slug, r]) => `${slug}: source ${r.ordinal}, declared ${declBySlug.get(slug).ordinal}`);
eq("every member ordinal equals the source printed ordinal", ordinalMismatch, []);
eq(
  "the ordinals are exactly the source's printed sequence with no gap",
  [...c.members].map((m) => m.ordinal).sort((a, b) => a - b),
  inventory.map((r) => r.ordinal),
);

// Every member must resolve to a live catalogue work, on this collection's shelf.
const workById = new Map(decl.works.map((w) => [w.id, w]));
const unresolved = c.members.filter((m) => !workById.has(m.workId)).map((m) => m.workId);
eq("every declared member resolves to a published work", unresolved, []);
const offShelf = c.members.filter((m) => workById.get(m.workId) && workById.get(m.workId).shelf !== c.shelf).map((m) => m.workId);
eq("every member sits on the collection's own shelf", offShelf, []);

// The released records must agree that these are anthology stories of THIS collection.
if (released) {
  const wrongForm = c.members.filter((m) => released.get(m.workId)?.sourceForm !== "anthology-story").map((m) => m.workId);
  eq("every member's released record is typed as an anthology story", wrongForm, []);
  const wrongCollection = c.members
    .filter((m) => released.get(m.workId)?.anthology?.collectionSlug !== COLLECTION_ID)
    .map((m) => m.workId);
  eq("every member's released record names this collection", wrongCollection, []);
}

// ── D. Exclusion ────────────────────────────────────────────────────────────────────────────────────
startGroup("EXCLUSION");
// கிழவன் கனவு is a Fiction short story with its own story route and its own source pin, and it is NOT
// in this anthology. It is the specific work a careless "every story is a member" rule would swallow.
ok("kizhavan-kanavu is a published work", workById.has("kizhavan-kanavu"));
ok("kizhavan-kanavu is NOT a declared member", !declBySlug.has("kizhavan-kanavu"));
ok("the source inventory does not list kizhavan-kanavu", !srcBySlug.has("kizhavan-kanavu"));
if (released) {
  ok(
    "kizhavan-kanavu's released record carries no anthology block",
    released.get("kizhavan-kanavu") && !released.get("kizhavan-kanavu").anthology,
  );
}
const fictionWorks = decl.works.filter((w) => w.shelf === "fiction");
ok("the Fiction shelf still holds more works than the collection has members", fictionWorks.length > c.members.length);
const nonMemberFiction = fictionWorks.filter((w) => !declBySlug.has(w.id)).map((w) => w.id).sort();
eq("exactly the two standalone Fiction works remain outside the collection", nonMemberFiction, ["balipeedam-nokki", "kizhavan-kanavu"]);

// ── E. Count semantics ──────────────────────────────────────────────────────────────────────────────
startGroup("COUNT SEMANTICS");
eq("memberCount.value is the source-backed member total", c.memberCount.value, inventory.length);
// memberCount counts WORKS; unitCount counts a work's internal reading units. Substituting one for the
// other is the specific confusion the two names exist to prevent.
ok("the collection declares no unitCount of its own", !("unitCount" in c));
const membersWithUnitCount = c.members.filter((m) => workById.get(m.workId)?.unitCount).map((m) => m.workId);
eq("no member work gained a unitCount by joining the collection", membersWithUnitCount, []);
// The reverse map must be derived from the roster, not stored twice.
eq(
  "the derived reverse lookup covers exactly the declared members",
  decl.reverse.map(([w]) => w).sort(),
  c.members.map((m) => m.workId).sort(),
);
ok("every reverse entry points at this collection", decl.reverse.every(([, id]) => id === COLLECTION_ID));

// ── F. No inference from presentation prose ─────────────────────────────────────────────────────────
startGroup("NO INFERENCE");
const declSrc = fs.readFileSync(path.join(process.cwd(), "data/collections.ts"), "utf8");
const code = declSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
// The module DECLARES descTa/descEn — they are card copy. What must never happen is membership being
// READ out of them, so this tests property access and matching, not the identifiers themselves.
for (const forbidden of [".descEn", ".descTa", ".startsWith(", ".endsWith(", ".match(", "titleTa.slice", "RegExp("]) {
  ok(`the collection module derives no membership from ${forbidden}`, !code.includes(forbidden));
}
ok("membership is not filtered out of the work descriptions", !/desc(Ta|En)[\s\S]{0,40}(includes|indexOf|test)\(/.test(code));
ok("the member roster is a literal list, not a filter over the catalogue", !/members:\s*(LIBRARY_WORKS|publishedWorks)/.test(code));

// ── G. Member work identity is untouched ────────────────────────────────────────────────────────────
startGroup("WORK IDENTITY REGRESSION");
const hrefMismatch = c.members
  .filter((m) => workById.get(m.workId)?.href !== `/stories/${m.workId}`)
  .map((m) => `${m.workId} -> ${workById.get(m.workId)?.href}`);
eq("every member keeps its own /stories/<slug> route", hrefMismatch, []);
const slugDump = tsxDump(`import { STORY_SLUGS } from "./data/stories";
console.log("@@JSON@@" + JSON.stringify(STORY_SLUGS));
`);
if (slugDump.value) {
  const slugs = slugDump.value;
  const notRegistered = c.members.filter((m) => !slugs.includes(m.workId)).map((m) => m.workId);
  eq("every member is still in STORY_SLUGS", notRegistered, []);
  ok("STORY_SLUGS still carries the standalone booklet too", slugs.includes("kizhavan-kanavu"));
  eq("STORY_SLUGS covers the members plus the standalone booklet", slugs.length, c.members.length + 1);
} else {
  ok("STORY_SLUGS could be read", false);
}

// ── H. Sitemap regression ───────────────────────────────────────────────────────────────────────────
startGroup("SITEMAP");
const sitemapSrc = fs.readFileSync(path.join(process.cwd(), "app/sitemap.ts"), "utf8");
ok("the sitemap still enumerates story routes from STORY_SLUGS", /STORY_SLUGS\.flatMap/.test(sitemapSrc));
ok("the sitemap still emits each story's reader route", sitemapSrc.includes("/stories/${slug}`"));
ok("the sitemap still emits each story's source route", sitemapSrc.includes("/stories/${slug}/source`"));
ok("the sitemap adds collection landings from the declarations", /LIBRARY_COLLECTIONS\.map/.test(sitemapSrc));
ok("the collection route family is /collections/", c.href.startsWith("/collections/"));
eq("the collection href matches its id", c.href, `/collections/${c.id}`);
// /read/<id> is the memoir's 391-chapter namespace; a collection must not enter it.
ok("the collection route does not enter the /read namespace", !c.href.startsWith("/read/"));

// ── Report ──────────────────────────────────────────────────────────────────────────────────────────
console.log("");
for (const g of groups) {
  console.log(`  ${g.failures === 0 ? "PASS" : "FAIL"}  ${g.name} (${g.checks} assertions, ${g.failures} failed)`);
}
console.log("");
if (failures.length) {
  console.log(`collections — ${checks} assertions, ${failures.length} FAILED\n`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  console.log("");
  process.exitCode = 1;
} else {
  console.log(`collections — ${checks} assertions, 0 failed across ${groups.length} groups`);
  console.log(
    `  ${c.titleTa} · ${c.members.length} members, ordinals 1–${c.members.length} · tree ${c.source.collectionTree.slice(0, 8)}\n`,
  );
}
