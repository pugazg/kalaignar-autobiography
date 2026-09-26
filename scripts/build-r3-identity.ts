/**
 * Reading Room IA v2 R3 — identity and relation generator (deterministic; `--verify` fails unless every output is
 * byte-identical).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/build-r3-identity.ts                 # write
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/build-r3-identity.ts --verify        # check
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/build-r3-identity.ts --freeze-pre-r3 # R3-A only: record the boundary
 *
 * Authority: the frozen R3 plan (pugazg/kalaignar-tribute READING_ROOM_IA_V2_R3_PLAN.md, merged at bab2fd4d) and the
 * frozen resolved manifest, vendored byte-for-byte in data/internal/r3/ and REFUSED unless its git blob is b7b3530d….
 *
 * Inputs (all read-only): the frozen resolved manifest; the frozen pre-R3 boundary (the live R2 catalogue, collections,
 * sitemap and build — recorded once by --freeze-pre-r3 and then pinned by sha256 below); the reader payloads of the 11
 * contributing publications. Outputs:
 *   data/internal/r3/identity-manifest.json — the 249 CREATE identities, the 11 publications' unit-role maps, stage state
 *   data/internal/r3/relations.json         — the ONE relation registry (49 records), each with its stage and state
 *   data/poems.ts (POETRY_WITNESS_RELATIONS) — a GENERATED compatibility view of the two live Poetry relations
 *   data/r3-catalogue.ts                    — the canonical LibraryWork records of every PUBLISHED R3 identity, and the
 *                                             ids of the publications demoted so far (the catalogue slice)
 * The stage state decides what is published: a CREATE identity becomes a LibraryWork, and a publication leaves the
 * canonical catalogue for LIBRARY_PUBLICATIONS, only when its stage is in PUBLISHED_STAGES.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const DIR = path.join(root, "data/internal/r3");
const MANIFEST = path.join(DIR, "READING_ROOM_IA_V2_RESOLVED_MANIFEST.frozen.json");
const BOUNDARY = path.join(DIR, "pre-r3-boundary.json");
const IDENTITY = path.join(DIR, "identity-manifest.json");
const RELATIONS = path.join(DIR, "relations.json");
const POEMS_TS = path.join(root, "data/poems.ts");
const CATALOGUE_TS = path.join(root, "data/r3-catalogue.ts");

/** The frozen resolved manifest's git blob (READING_ROOM_IA_V2_RESOLVED_MANIFEST.json at pugazg/kalaignar-tribute). */
const MANIFEST_GIT_BLOB = "b7b3530d54ba9c354b43313eecd69e78e76a92b5";
/** sha256 of the frozen pre-R3 boundary file, recorded at R3-A. */
const BOUNDARY_SHA256 = "d2975f49c000dcd19f31b092a0e097451ceaef3af85f486798e3cff0d00b40b6";

/** The R3 stage state. The ONLY switch that activates R3 content; each later stage PR advances it by one stage. */
const STAGE_ORDER = ["R3-A", "R3-B", "R3-C", "R3-D"] as const;
type Stage = (typeof STAGE_ORDER)[number];
const PUBLISHED_STAGES: readonly Stage[] = ["R3-A", "R3-B"];

/** Frozen plan §13: the stage that introduces each CREATE family and demotes each publication. */
const FAMILY_STAGE: Record<string, Stage> = {
  "poetry-kaalap": "R3-B", "poetry-kavithaigal": "R3-B", "poetry-1975": "R3-B", "ina-poem": "R3-B", meesai: "R3-B",
  "ina-prose": "R3-C", "essays-kolaikkalam": "R3-C", "essays-perumoochu": "R3-C", "essays-sinthanaiyum-seyalum": "R3-C",
  "essays-thiraavida-sampaththu": "R3-C", "essays-thudikkum-ilamai": "R3-C", "essays-unarchchimaalai": "R3-C",
};
const PUBLICATIONS: { id: string; kind: "poems" | "essays"; demotedIn: Stage }[] = [
  { id: "kaalap-pezhaiyum-kavithai-saaviyum", kind: "poems", demotedIn: "R3-B" },
  { id: "kalaignarin-kavithaigal", kind: "poems", demotedIn: "R3-B" },
  { id: "kalaignarin-kaviyaranga-kavithaigal-1975", kind: "poems", demotedIn: "R3-B" },
  { id: "meesai-mulaiththa-vayathil", kind: "essays", demotedIn: "R3-B" },
  { id: "ina-muzhakkam", kind: "essays", demotedIn: "R3-C" },
  { id: "unarchchimaalai", kind: "essays", demotedIn: "R3-C" },
  { id: "thiraavida-sampaththu", kind: "essays", demotedIn: "R3-C" },
  { id: "kolaikkalam", kind: "essays", demotedIn: "R3-C" },
  { id: "sinthanaiyum-seyalum", kind: "essays", demotedIn: "R3-C" },
  { id: "perumoochu", kind: "essays", demotedIn: "R3-C" },
  { id: "thudikkum-ilamai", kind: "essays", demotedIn: "R3-C" },
];
/** The ina-muzhakkam unit whose 11 printed poems take fragment identities (frozen plan §5.3). */
const INA = { publicationId: "ina-muzhakkam", unitSlug: "kavithaigal" };

/**
 * The public notes of the two relations already live before R3 (moved here from data/poems.ts, where the literal now
 * becomes a generated view). Keyed by their existing, declaration-authored relation ids.
 */
const LIVE_POETRY_RELATIONS: Record<string, { witnessKey: string; publicNote: { ta: string; en: string } }> = {
  "idhayathai-thanthidu-anna--kalaignarin-kavithaigal--item-01": {
    witnessKey: "give-me-your-heart-anna",
    publicNote: { ta: "இதே கவிதையின் மற்றொரு மூல ஆதாரப் பதிப்பும் கிடைக்கிறது.", en: "Another source witness of this same poem is available." },
  },
  "thennan-kathai--kalaignarin-kavithaigal--item-02": {
    witnessKey: "the-tale-of-the-southerner",
    publicNote: { ta: "இதே கவிதையின் மற்றொரு மூல ஆதாரப் பதிப்பும் கிடைக்கிறது.", en: "Another source witness of this same poem is available." },
  },
};

// ── helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────
const fail = (msg: string): never => {
  throw new Error(`build-r3-identity: ${msg}`);
};
const readJSON = <T,>(p: string): T => JSON.parse(fs.readFileSync(p, "utf8")) as T;
const gitBlob = (buf: Buffer) => crypto.createHash("sha1").update(Buffer.concat([Buffer.from(`blob ${buf.length}\0`), buf])).digest("hex");
const sha256 = (s: string | Buffer) => crypto.createHash("sha256").update(s).digest("hex");
const json = (v: unknown) => JSON.stringify(v, null, 1) + "\n";
const stageActive = (s: Stage | "live-pre-R3") => s === "live-pre-R3" || PUBLISHED_STAGES.includes(s);
const tally = <T,>(xs: T[], k: (x: T) => string) => xs.reduce<Record<string, number>>((o, x) => ((o[k(x)] = (o[k(x)] ?? 0) + 1), o), {});
const sortObj = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

type Row = {
  decision: string; key: string; family: string; titleTa: string; titleEn: string; currentRoute: string;
  unitRef?: { pub?: string; ordinal?: string | number; parentUnit?: string };
  witnesses?: { witness: string; relation: string; status: string; evidence: string }[];
  resolved: { decision: string; classification: string; canonicalId: string; shelf: string; subtype: string; witnessOf?: { kind: string; id: string } };
};
type Manifest = {
  entries: Row[];
  futureR2Actions: { action: string; existingLibraryWorkId: string; existingRoute: string; existingCollections: string[]; canonicalId: string; ownerDecisionRef: string }[];
  sangatamilOruthalaikVerification: { sangatamilSource: string; rows: { sangatamil: string; bestStandaloneSection: number; diagonal: number }[] };
  thenalaigal1958Mapping: { alai: number; headingTa: string; pdfScans: string; printedPages: string; meesai: null | { ordinal: number; key: string; canonicalId?: string; level: string } }[];
};

// ── the frozen pre-R3 boundary (recorded once, then pinned) ─────────────────────────────────────────────────────
async function freezeBoundary() {
  const { LIBRARY_WORKS } = await import("../data/library");
  const { LIBRARY_COLLECTIONS, discoveryShelves } = await import("../data/collections");
  const sitemap = (await import("../app/sitemap")).default;
  const paths = sitemap().map((e) => e.url.replace("https://nenjukkuneethi.org", "") || "/").sort();
  const works = LIBRARY_WORKS.filter((w) => w.state === "published");
  const boundary = {
    note: "Pre-R3 public boundary: the live R2 final state at implementation 597e65fd (tree da22e2f4). Recorded once at R3-A; never rewritten.",
    implementationBase: "597e65fde3266baffda98351de716507368b5ebc",
    catalogue: { count: works.length, shelves: sortObj(tally(works, (w) => w.shelf)), records: LIBRARY_WORKS },
    collections: { count: LIBRARY_COLLECTIONS.length, records: LIBRARY_COLLECTIONS },
    discovery: Object.fromEntries(discoveryShelves().map((s) => [s.shelf.id, s.entries.length])),
    sitemap: { count: paths.length, sha256: sha256(paths.join("\n")), paths },
    // Measured by the clean R2-C build (merge CI 36215615102; local clean build of tree da22e2f4).
    build: { prerender: 5280, html: 5275 },
  };
  fs.writeFileSync(BOUNDARY, json(boundary));
  console.log(`froze ${path.relative(root, BOUNDARY)} sha256 ${sha256(fs.readFileSync(BOUNDARY))}`);
}

type Boundary = {
  catalogue: { count: number; shelves: Record<string, number>; records: Record<string, unknown>[] };
  collections: { count: number; records: { id: string; members: { workId: string; ordinal?: number }[] }[] };
  discovery: Record<string, number>;
  sitemap: { count: number; sha256: string; paths: string[] };
  build: { prerender: number; html: number };
};

// ── generation ───────────────────────────────────────────────────────────────────────────────────────────────────
function generate() {
  const mbuf = fs.readFileSync(MANIFEST);
  if (gitBlob(mbuf) !== MANIFEST_GIT_BLOB) fail(`resolved manifest blob ${gitBlob(mbuf)} ≠ frozen ${MANIFEST_GIT_BLOB} — refusing`);
  const bbuf = fs.readFileSync(BOUNDARY);
  if (sha256(bbuf) !== BOUNDARY_SHA256) fail(`pre-R3 boundary sha256 ${sha256(bbuf)} ≠ pinned ${BOUNDARY_SHA256} — refusing`);
  const m = JSON.parse(mbuf.toString("utf8")) as Manifest;
  const boundary = JSON.parse(bbuf.toString("utf8")) as Boundary;
  const E = m.entries;
  const dec = (d: string) => E.filter((e) => e.resolved.decision === d);

  // Census, derived (never typed as authority; the validator checks it against the frozen adjudication).
  const decisions = sortObj(tally(E, (e) => e.resolved.decision));
  const CREATE = dec("CREATE");
  const ids = CREATE.map((e) => e.resolved.canonicalId);
  if (new Set(ids).size !== ids.length) fail("CREATE canonical ids are not unique");
  const liveIds = new Set(boundary.catalogue.records.map((r) => r.id as string));
  const liveSlugs = new Set(boundary.catalogue.records.map((r) => r.slug as string));
  const collIds = new Set(boundary.collections.records.map((c) => c.id));
  const collisions = ids.filter((i) => liveIds.has(i) || liveSlugs.has(i) || collIds.has(i));
  if (collisions.length) fail(`CREATE ids collide with live ids/slugs/collections: ${collisions.join(", ")}`);
  for (const e of CREATE) if (!FAMILY_STAGE[e.family]) fail(`CREATE family ${e.family} has no stage`);

  // Publication unit-role maps, from each publication's own payload; every unit must match exactly one manifest row.
  const byRoute = new Map<string, Row[]>();
  for (const e of E) byRoute.set(e.currentRoute, [...(byRoute.get(e.currentRoute) ?? []), e]);
  const roleOf = (e: Row) =>
    e.resolved.decision === "CREATE" ? "canonical" : e.resolved.decision === "ADD_WITNESS" ? "witness" : e.resolved.decision === "DO_NOT_PROMOTE" ? "dependent-heading" : fail(`unit row ${e.key} has decision ${e.resolved.decision}`);
  const locator = (route: string, fragment: string | null) => (fragment ? `${route}#${fragment}` : route);
  const creLocator = new Map<string, { route: string; fragment: string | null; publicationId: string; unitSlug: string }>();
  const witnessLocator = new Map<string, { publicationId: string; unitSlug: string; fragment: string | null; route: string }>();
  const publications = PUBLICATIONS.map((p) => {
    const payload = readJSON<{ items?: { slug: string }[]; articles?: { slug: string; tamil: { blocks: { kind: string; text: string }[] }; english?: { blocks: { kind: string }[] } }[] }>(
      path.join(root, "public/data", p.kind, p.id, "publication.json"),
    );
    const unitSlugs = p.kind === "poems" ? (payload.items ?? []).map((i) => i.slug) : (payload.articles ?? []).map((a) => a.slug);
    const units: { unit: string; locator: string; role: string; canonicalId: string | null; manifestKey: string }[] = [];
    for (const slug of unitSlugs) {
      const route = p.kind === "poems" ? `/poems/${p.id}/${slug}` : `/essays/${p.id}/articles/${slug}`;
      const isInaHeading = p.id === INA.publicationId && slug === INA.unitSlug;
      const rows = isInaHeading ? E.filter((e) => e.family === "ina-prose" && e.key === INA.unitSlug) : byRoute.get(route) ?? [];
      if (rows.length !== 1) fail(`${route}: ${rows.length} manifest rows (expected exactly 1)`);
      const r = rows[0];
      const role = roleOf(r);
      units.push({ unit: slug, locator: route, role, canonicalId: role === "dependent-heading" ? null : r.resolved.canonicalId, manifestKey: `${r.family}:${r.key}` });
      if (role === "canonical") creLocator.set(r.resolved.canonicalId, { route, fragment: null, publicationId: p.id, unitSlug: slug });
      if (role === "witness") witnessLocator.set(`${r.family}:${r.key}`, { publicationId: p.id, unitSlug: slug, fragment: null, route });
      if (isInaHeading) {
        // The 11 printed poems inside the heading unit: bounded by the unit's own printed subheadings (plan §5.2).
        const art = (payload.articles ?? []).find((a) => a.slug === slug)!;
        const subs = art.tamil.blocks.filter((b) => b.kind === "subheading");
        const enSubs = (art.english?.blocks ?? []).filter((b) => b.kind === "subheading");
        if (subs.length !== 11 || enSubs.length !== 11) fail(`ina kavithaigal: ${subs.length} Tamil / ${enSubs.length} English subheadings (expected 11)`);
        subs.forEach((b, i) => {
          const ordinal = `6.${i + 1}`;
          const pr = E.filter((e) => e.family === "ina-poem" && String(e.unitRef?.ordinal) === ordinal);
          if (pr.length !== 1) fail(`ina poem ${ordinal}: ${pr.length} manifest rows`);
          if (pr[0].titleTa.trim() !== b.text.trim()) fail(`ina poem ${ordinal}: printed subheading "${b.text}" ≠ manifest title "${pr[0].titleTa}"`);
          const fragment = `poem-6-${i + 1}`;
          const prole = roleOf(pr[0]);
          units.push({ unit: `${slug}#${fragment}`, locator: locator(route, fragment), role: prole, canonicalId: pr[0].resolved.canonicalId, manifestKey: `ina-poem:${pr[0].key}` });
          if (prole === "canonical") creLocator.set(pr[0].resolved.canonicalId, { route, fragment, publicationId: p.id, unitSlug: slug });
          else witnessLocator.set(`ina-poem:${pr[0].key}`, { publicationId: p.id, unitSlug: slug, fragment, route });
        });
      }
    }
    const rec = boundary.catalogue.records.find((r) => r.id === p.id) ?? fail(`publication ${p.id} is not a pre-R3 LibraryWork`);
    return { id: p.id, formerShelf: rec.shelf as string, href: rec.href as string, demotedIn: p.demotedIn, state: stageActive(p.demotedIn) ? "demoted" : "canonical-until-demotion", roleCounts: sortObj(tally(units, (u) => u.role)), units };
  });
  for (const e of CREATE) if (!creLocator.has(e.resolved.canonicalId)) fail(`CREATE ${e.resolved.canonicalId} has no unit in its publication payload`);

  const works = CREATE.map((e) => {
    const loc = creLocator.get(e.resolved.canonicalId)!;
    const stage = FAMILY_STAGE[e.family];
    return {
      id: e.resolved.canonicalId, titleTa: e.titleTa, titleEn: e.titleEn, shelf: e.resolved.shelf, subtype: e.resolved.subtype,
      family: e.family, parentPublicationId: loc.publicationId, locator: { route: loc.route, fragment: loc.fragment, href: locator(loc.route, loc.fragment) },
      introducedIn: stage, state: stageActive(stage) ? "published" : "dormant",
    };
  });

  // ── relations (the one registry; frozen plan §8) ───────────────────────────────────────────────────────────────
  type Rel = { id: string; class: string; canonicalId: string; introducedIn: Stage | "live-pre-R3"; [field: string]: unknown };
  const rels: Rel[] = [];
  const add = (r: Rel) => rels.push({ ...r, state: stageActive(r.introducedIn) ? "active" : "dormant" });
  const targetStage = (id: string): Stage | "existing" => (liveIds.has(id) ? "existing" : FAMILY_STAGE[CREATE.find((e) => e.resolved.canonicalId === id)?.family ?? ""] ?? fail(`relation target ${id} is neither live nor CREATE`));
  const later = (a: Stage | "existing", b: Stage): Stage => (a === "existing" || STAGE_ORDER.indexOf(a) <= STAGE_ORDER.indexOf(b) ? b : a);

  // (1) the 16 witness units (ADD_WITNESS rows with a witnessOf target)
  for (const e of dec("ADD_WITNESS").filter((x) => x.resolved.witnessOf?.id)) {
    const key = `${e.family}:${e.key}`;
    const w = witnessLocator.get(key) ?? fail(`witness ${key} has no unit locator`);
    const target = e.resolved.witnessOf!.id;
    const live = Object.entries(LIVE_POETRY_RELATIONS).find(([, v]) => v.witnessKey === e.key && w.publicationId === "kalaignarin-kavithaigal");
    const sectionMatch = target === "idhaya-perikai"
      ? /section (\d+) '([^']+)'/.exec((dec("ADD_WITNESS").find((x) => x.key === "idhaya-perikai")?.witnesses ?? []).find((x) => x.witness.includes(`${e.key === "poompuhar" ? "unit 3" : "unit 4"}`))?.witness ?? "") ?? fail(`idhaya-perikai section for ${e.key}`)
      : null;
    add({
      id: live ? live[0] : `r3:${w.publicationId}/${w.unitSlug}${w.fragment ? "#" + w.fragment : ""}->${target}`,
      class: "source-publication", relation: e.resolved.classification, level: sectionMatch ? "section" : "work",
      canonicalId: target, ...(sectionMatch ? { canonicalSection: { ordinal: Number(sectionMatch[1]), titleTa: sectionMatch[2] } } : {}),
      witness: { kind: "publication-unit", publicationId: w.publicationId, unitSlug: w.unitSlug, fragment: w.fragment, locator: locator(w.route, w.fragment), titleTa: e.titleTa },
      evidence: { manifestRow: key, ownerDecisionRef: (e as unknown as { ownerDecisionRef?: string }).ownerDecisionRef ?? null },
      introducedIn: live ? "live-pre-R3" : later(targetStage(target), target === "idhaya-perikai" ? "R3-C" : "R3-B"),
      ...(live ? { publicNote: live[1].publicNote, legacyPoetryView: true } : {}),
    });
  }
  // (2) extra witnesses carried on receiving rows (existing targets) and CREATE rows: 1975 scan ranges, the 1968 volume
  const extra = (target: string, list: Row["witnesses"]) => {
    for (const x of list ?? []) {
      const range = /kalaignarin-kaviyaranga-kavithaigal-1975 scans (\d+)–(\d+)/.exec(x.witness);
      const ext = /\((\d{4}), (TVA_BOK_\d+)\) — external/.exec(x.witness);
      if (!range && !ext) continue; // unit witnesses are already carried by their own rows above
      add({
        id: range ? `r3:kalaignarin-kaviyaranga-kavithaigal-1975/scans-${range[1]}-${range[2]}->${target}` : `r3:external/${ext![2]}->${target}`,
        class: "source-publication", relation: x.relation, level: "work", canonicalId: target,
        witness: range
          ? { kind: "publication-scan-range", publicationId: "kalaignarin-kaviyaranga-kavithaigal-1975", scans: [Number(range[1]), Number(range[2])], locator: null }
          : { kind: "external-publication", externalId: ext![2], year: Number(ext![1]), titleTa: x.witness.split(" (")[0], locator: null },
        evidence: { witnessStatus: x.status, basis: x.evidence },
        introducedIn: later(targetStage(target), "R3-B"),
      });
    }
  };
  for (const e of dec("ADD_WITNESS").filter((x) => !x.resolved.witnessOf?.id)) extra(e.key, e.witnesses);
  for (const e of CREATE) extra(e.resolved.canonicalId, e.witnesses);

  // (3) the five merged existing works — verbatim former LibraryWork records, from the frozen boundary
  // futureR2Actions (R3 actions under the frozen R2 plan §6) holds exactly the 5 merges plus the one Sangatamil
  // publication-witness record, which is realised section by section in (4) below. Any other action fails closed.
  const sangatamilAction = m.futureR2Actions.filter((a) => a.action === "RECORD_PUBLICATION_WITNESS_NO_NEW_WORK");
  if (sangatamilAction.length !== 1 || sangatamilAction[0].existingLibraryWorkId !== "oruthalaik-kathal") fail("expected exactly one Sangatamil → oruthalaik-kathal publication-witness action");
  const merges = m.futureR2Actions.filter((a) => a.action === "MERGE_EXISTING_WORK_AS_WITNESS");
  if (merges.length + sangatamilAction.length !== m.futureR2Actions.length || merges.length !== 5) fail("futureR2Actions must be exactly 5 merges + 1 Sangatamil record");
  for (const a of merges) {
    const legacy = boundary.catalogue.records.find((r) => r.id === a.existingLibraryWorkId) ?? fail(`merge source ${a.existingLibraryWorkId} is not a pre-R3 LibraryWork`);
    add({
      id: `r3:merged/${a.existingLibraryWorkId}->${a.canonicalId}`, class: "merged-witness", relation: "merged-witness", level: "work",
      canonicalId: a.canonicalId, witness: { kind: "legacy-work", locator: legacy.href, collections: a.existingCollections, record: legacy },
      evidence: { ownerDecisionRef: a.ownerDecisionRef }, introducedIn: "R3-D",
    });
  }
  // (4) Sangatamil ↔ oruthalaik-kathal, section-level (adjudication §10)
  const sg = m.sangatamilOruthalaikVerification.rows;
  if (sg.length !== 11) fail(`Sangatamil verification rows ${sg.length} ≠ 11`);
  sg.forEach((r, i) => {
    const n = i + 1;
    if (r.bestStandaloneSection !== n) fail(`Sangatamil §${n} best match is ${r.bestStandaloneSection}`);
    const route = `/sangatamil/${String(91 + n).padStart(3, "0")}-oruthalaik-kaadhal-${String(n).padStart(2, "0")}`;
    if (!boundary.sitemap.paths.includes(route)) fail(`${route} is not a live route`);
    add({
      id: `r3:sangatamil/${route.split("/")[2]}->oruthalaik-kathal#section-${n}`, class: "commentary-section", relation: "same-canonical-alternate-witness", level: "section",
      canonicalId: "oruthalaik-kathal", canonicalSection: { ordinal: n, route: `/poems/oruthalaik-kathal/section-${n}` },
      witness: { kind: "commentary-section", workId: "sangatamil", sectionRoute: route, locator: route },
      evidence: { diagonal: r.diagonal, source: m.sangatamilOruthalaikVerification.sangatamilSource }, introducedIn: "R3-D",
    });
  });
  // (5) the 1958 தேனலைகள் — 10 chapter-level + 1 publication-level; அலை 3 has no relation (adjudication §11)
  for (const a of m.thenalaigal1958Mapping) {
    if (!a.meesai) continue;
    const chapter = a.meesai.level === "chapter";
    const target = chapter ? a.meesai.canonicalId! : a.meesai.key;
    if (!ids.includes(target)) fail(`1958 target ${target} is not a CREATE id`);
    add({
      id: chapter ? `r3:external/1958-thenalaigal/alai-${a.alai}->${target}` : `r3:external/1958-thenalaigal->${target}`,
      class: "external-publication", relation: chapter ? "same-canonical-alternate-witness" : "publication-level-witness", level: chapter ? "chapter" : "publication",
      canonicalId: target,
      witness: chapter
        ? { kind: "external-publication", externalId: "1958-thenalaigal", alai: a.alai, headingTa: a.headingTa, pdfScans: a.pdfScans, printedPages: a.printedPages, locator: null }
        : { kind: "external-publication", externalId: "1958-thenalaigal", indicates: { alai: a.alai, headingTa: a.headingTa }, locator: null },
      evidence: { ownerDecisionRef: "OD6", level: a.meesai.level }, introducedIn: "R3-D",
    });
  }
  const relIds = rels.map((r) => r.id);
  if (new Set(relIds).size !== relIds.length) fail("relation ids are not unique");

  // ── the canonical catalogue slice: one LibraryWork per PUBLISHED identity, generated from its parent publication ──
  // Fields come only from the parent's own pre-R3 catalogue record and payload: source pins, edition and rights are
  // inherited only where the parent carries them; the description states publication, year and printed position only.
  const payloadFacts = (pubId: string) => {
    const p = PUBLICATIONS.find((x) => x.id === pubId)!;
    const j = readJSON<{ title: { ta: string; en: string }; publicationYear?: number; firstEdition?: { year?: number }; items?: { slug: string; ordinal: number }[]; articles?: { slug: string; number: number }[]; itemCount?: number; articleCount?: number }>(
      path.join(root, "public/data", p.kind, p.id, "publication.json"),
    );
    const units = p.kind === "poems" ? (j.items ?? []).map((i) => ({ slug: i.slug, n: i.ordinal })) : (j.articles ?? []).map((a) => ({ slug: a.slug, n: a.number }));
    return { title: j.title, year: j.publicationYear ?? j.firstEdition?.year ?? null, count: j.itemCount ?? j.articleCount ?? units.length, units };
  };
  const INHERIT = ["sourceRepo", "sourcePath", "sourceCommit", "edition", "tamil", "english", "englishKind", "rights", "provenanceHref"] as const;
  const catalogue = works.filter((w) => w.state === "published").map((w) => {
    const parent = boundary.catalogue.records.find((r) => r.id === w.parentPublicationId)!;
    const f = payloadFacts(w.parentPublicationId);
    const loc = creLocator.get(w.id)!;
    const unit = f.units.find((u) => u.slug === loc.unitSlug) ?? fail(`${w.id}: unit ${loc.unitSlug} not in payload`);
    const pos = loc.fragment ? loc.fragment.replace(/^poem-/, "").replace("-", ".") : String(unit.n);
    const pubTa = `${f.title.ta}${f.year ? ` (${f.year})` : ""}`;
    const pubEn = `${f.title.en}${f.year ? ` (${f.year})` : ""}`;
    const [descTa, descEn] = loc.fragment
      ? [`${pubTa} — «${unit.slug === INA.unitSlug ? "கவிதைகள்" : unit.slug}» பகுதியின் கவிதை ${pos}`, `${pubEn} — poem ${pos}, in its unit “Kavithaigal”`]
      : w.subtype === "ezhuthoviyam"
        ? [`${pubTa} — எழுத்தோவியம் ${pos} / ${f.count}`, `${pubEn} — piece ${pos} of ${f.count} (எழுத்தோவியம், a prose-poem)`]
        : [`${pubTa} — கவிதை ${pos} / ${f.count}`, `${pubEn} — poem ${pos} of ${f.count}`];
    const rec: Record<string, unknown> = {
      id: w.id, slug: w.id, titleTa: w.titleTa, titleEn: w.titleEn, shelf: w.shelf, subtype: w.subtype,
      readerStructure: "publication-unit", href: w.locator.href, state: "published", descTa, descEn,
    };
    for (const k of INHERIT) if (parent[k] !== undefined) rec[k] = parent[k];
    rec.publication = { id: w.parentPublicationId, unit: loc.unitSlug, fragment: loc.fragment };
    return rec;
  });
  const demotedIds = publications.filter((p) => p.state === "demoted").map((p) => ({ id: p.id, demotedIn: p.demotedIn }));
  const catalogueTs =
    `// GENERATED by scripts/build-r3-identity.ts — do not edit by hand (CI re-generates with --verify).\n` +
    `// Reading Room IA v2 R3: the canonical LibraryWork record of every PUBLISHED R3 identity (stages ${PUBLISHED_STAGES.join(", ")}),\n` +
    `// derived from data/internal/r3/identity-manifest.json, the frozen pre-R3 boundary and the reader payloads, and the\n` +
    `// publications demoted so far. Every record reuses its existing reading route; no text is copied here.\n` +
    `import type { LibraryWork } from "@/data/library";\n\n` +
    `export const R3_PUBLISHED_WORKS: LibraryWork[] = ${JSON.stringify(catalogue, null, 2)};\n\n` +
    `export const R3_DEMOTED_PUBLICATIONS: { id: string; demotedIn: "R3-B" | "R3-C" }[] = ${JSON.stringify(demotedIds, null, 2)};\n`;

  const identity = {
    schema: 1,
    note: "Reading Room IA v2 R3 identity manifest — GENERATED by scripts/build-r3-identity.ts; do not edit. Runtime/planning identity data: only stages in stageState.published are live.",
    input: {
      resolvedManifest: { path: path.relative(root, MANIFEST), gitBlob: MANIFEST_GIT_BLOB },
      preR3Boundary: { path: path.relative(root, BOUNDARY), sha256: BOUNDARY_SHA256 },
    },
    stageState: { order: STAGE_ORDER, published: PUBLISHED_STAGES },
    census: {
      rows: E.length, decisions,
      create: { count: CREATE.length, unique: new Set(ids).size, liveCollisions: collisions.length, byShelf: sortObj(tally(CREATE, (e) => e.resolved.shelf)), byFamily: sortObj(tally(CREATE, (e) => e.family)), byStage: sortObj(tally(works, (w) => w.introducedIn)) },
      relations: { count: rels.length, byClass: sortObj(tally(rels, (r) => r.class)), byLevel: sortObj(tally(rels, (r) => String(r.level))), byStage: sortObj(tally(rels, (r) => r.introducedIn)) },
    },
    works,
    publications,
  };
  const relations = { schema: 1, note: "Reading Room IA v2 R3 relation registry — GENERATED by scripts/build-r3-identity.ts; the ONE relation authority. Dormant records never render.", relations: rels };

  // The GENERATED compatibility view in data/poems.ts: exactly the active legacyPoetryView relations.
  const view = rels.filter((r) => r.legacyPoetryView && r.state === "active").map((r) => {
    const w = r.witness as { publicationId: string; unitSlug: string };
    const n = r.publicNote as { ta: string; en: string };
    return `  {\n    id: ${JSON.stringify(r.id)},\n    relation: "same-canonical-poem-alternate-witness",\n    a: { slug: ${JSON.stringify(r.canonicalId)} },\n    b: { slug: ${JSON.stringify(w.publicationId)}, itemSlug: ${JSON.stringify(w.unitSlug)} },\n    publicNote: {\n      ta: ${JSON.stringify(n.ta)},\n      en: ${JSON.stringify(n.en)},\n    },\n  },\n`;
  });
  const block = `export const POETRY_WITNESS_RELATIONS: PoetryWitnessRelation[] = [\n${view.join("")}];\n`;
  const poems = fs.readFileSync(POEMS_TS, "utf8");
  const BEGIN = "// <r3-generated POETRY_WITNESS_RELATIONS: from data/internal/r3/relations.json by scripts/build-r3-identity.ts — do not edit>\n";
  const END = "// </r3-generated>\n";
  const at = poems.indexOf(BEGIN), to = poems.indexOf(END);
  if (at === -1 || to === -1 || to < at) fail("data/poems.ts is missing the r3-generated POETRY_WITNESS_RELATIONS markers");
  const poemsOut = poems.slice(0, at + BEGIN.length) + block + poems.slice(to);

  return { [IDENTITY]: json(identity), [RELATIONS]: json(relations), [POEMS_TS]: poemsOut, [CATALOGUE_TS]: catalogueTs };
}

async function main() {
  if (process.argv.includes("--freeze-pre-r3")) return freezeBoundary();
  const outputs = generate();
  const verify = process.argv.includes("--verify");
  const drift: string[] = [];
  for (const [file, content] of Object.entries(outputs)) {
    if (verify) {
      if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content) drift.push(path.relative(root, file));
    } else fs.writeFileSync(file, content);
  }
  if (verify && drift.length) {
    console.error(`build-r3-identity --verify: outputs are not the deterministic regeneration: ${drift.join(", ")}`);
    process.exit(1);
  }
  console.log(`build-r3-identity${verify ? " --verify" : ""}: ${Object.keys(outputs).length} outputs ${verify ? "byte-identical" : "written"}`);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
