// Wave 4 P1 — standalone-poems validator.
//
// Validates the four STANDALONE poems as integrated data, against the pinned source repository. It
// is deliberately NOT built on scripts/lib/standalone-poem.mjs: an importer and its validator that
// share a parser share a defect, and a validator that re-runs the importer proves only that the
// importer is deterministic. So both reading layers are RECONSTRUCTED here by a different route:
//
//   * Tamil is re-read from sections/<slug>.md with a line-by-line fence state machine, not the
//     importer's block regex;
//   * English is re-read from the RELEASED ASSEMBLY, which is the artifact the importer reaches
//     last and only for comparison — the importer builds its English from the reviewed batches.
//
// Every check proves PRESENCE, then STRUCTURE, then EQUALITY. A comparison whose two sides are both
// empty never counts as a pass: each layer must first be shown to be non-trivial, against a count
// derived from the source file rather than from the payload under test.
//
// Usage:
//   node scripts/validate-wave4-p1-standalone-poems.mjs <wave4-freeze-clone> [<existing-poem-clone>]
//
// Two clones, because the four works do not share one pin. The three NEW imports are pinned to the
// Wave-4 freeze; the existing poem keeps its own earlier pin, whose work tree never moved. CI
// fetches each pin with --depth 1 BY SHA, so neither clone contains the other's commit and the
// existing poem's pin must be verified in the checkout that actually has it. Locally, one full clone
// serves both and the second argument may be omitted.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const EXISTING_REPO = process.argv[3] ?? process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-wave4-p1-standalone-poems.mjs <wave4-freeze-clone> [<existing-poem-clone>]");
  process.exit(1);
}

const readText = (p) => fs.readFileSync(p, "utf8");
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const gitIn = (repo, ...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8" }).trim();
const git = (...a) => gitIn(SRC_REPO, ...a);

let pass = 0;
const failures = [];
const check = (label, cond) => (cond ? pass++ : failures.push(label));
const eq = (label, actual, expected) =>
  JSON.stringify(actual) === JSON.stringify(expected)
    ? pass++
    : failures.push(`${label}\n     expected ${JSON.stringify(expected)}\n     actual   ${JSON.stringify(actual)}`);

// ── Frozen Wave-4 boundary ───────────────────────────────────────────────────────────────────────
// The three NEW imports are pinned to this commit. The existing poem keeps its own earlier pin,
// because its source work tree never moved and repinning it would rewrite a published payload for
// no source reason.
const WAVE4_FREEZE = "969823195ea8943a67fad4286ab1bc7f1c876d56";
const IDHAYATHAI_PIN = "42c156d7242fa799ea80adbb0c5f2b9eba078fe9";

// Frozen source work trees. A shared repository pin does NOT collapse N works into one provenance
// identity, so each work tree is pinned on its own.
const FROZEN_TREES = {
  "idhayathai-thanthidu-anna": "a92fb5ff742aa1c5ae11039fc55a9ffa4bdafc63",
  "anaiya-vilakku-anna": "bddc54f0493dbc38e53f9ec9fe5162e0c4e49464",
  marathi: "fda18674b928f7934f66c695ba494208344a6814",
  "thennan-kathai": "a63a171ffee75d12e6ef612c41b36262e5562a78",
};

const NEW_SLUGS = ["anaiya-vilakku-anna", "marathi", "thennan-kathai"];
const EXISTING_SLUG = "idhayathai-thanthidu-anna";
const ALL_SLUGS = [...NEW_SLUGS, EXISTING_SLUG].sort();

// The already-integrated payload of the existing poem, pinned by hash.
const IDHAYATHAI_HASHES = {
  "poem.json": "6833738340243833b712479e017f25294bb0e45b701d66d060a77f634c3e64f7",
  "provenance.json": "d06a664052178762372d42727c95620a3c3a88159f85b56e43a095e8a401e930",
};

const DATA_ROOT = path.join(process.cwd(), "public/data/poems");
const load = (slug, file) => JSON.parse(readText(path.join(DATA_ROOT, slug, file)));
const payload = Object.fromEntries(ALL_SLUGS.map((s) => [s, { poem: load(s, "poem.json"), prov: load(s, "provenance.json") }]));

// Registries are read from the TypeScript SOURCE rather than through the app runtime, so a registry
// that is empty in the type layer but populated at runtime cannot slip past.
const poemsTs = readText(path.join(process.cwd(), "data/poems.ts"));
const libraryTs = readText(path.join(process.cwd(), "data/library.ts"));
const collectionsTs = readText(path.join(process.cwd(), "data/collections.ts"));
const arrayLiteral = (src, name) => {
  const m = new RegExp(`export const ${name}[^=]*=\\s*\\[([\\s\\S]*?)\\]\\s*as const;`).exec(src);
  if (!m) return null;
  return (m[1].match(/"([^"]+)"/g) ?? []).map((x) => x.slice(1, -1));
};

// ── 1. Frozen source commit is the approved Wave-4 boundary for the three NEW imports ────────────
check("source clone HEAD is the Wave-4 freeze", git("rev-parse", "HEAD") === WAVE4_FREEZE);
for (const slug of NEW_SLUGS) {
  eq(`${slug}: poem.json pinned to the Wave-4 freeze`, payload[slug].poem.sourceCommit, WAVE4_FREEZE);
  eq(`${slug}: provenance.json pinned to the Wave-4 freeze`, payload[slug].prov.sourceCommit, WAVE4_FREEZE);
}

// ── 2. Exact source work-tree pins for the three new works ───────────────────────────────────────
for (const slug of NEW_SLUGS) {
  eq(`${slug}: frozen work tree at the Wave-4 freeze`, git("rev-parse", `${WAVE4_FREEZE}:poems/${slug}`), FROZEN_TREES[slug]);
}

// ── 3. The existing poem's frozen work tree still equals its integrated payload's source tree ────
// This is what makes byte-identity meaningful: the payload records IDHAYATHAI_PIN, and that pin's
// work tree must still be the tree the freeze carries, or the payload is stale rather than stable.
eq(`${EXISTING_SLUG}: payload records its own historical pin`, payload[EXISTING_SLUG].poem.sourceCommit, IDHAYATHAI_PIN);
eq(`${EXISTING_SLUG}: the existing-poem clone is at that pin`, gitIn(EXISTING_REPO, "rev-parse", "HEAD"), IDHAYATHAI_PIN);
eq(
  `${EXISTING_SLUG}: work tree at the payload's pin`,
  gitIn(EXISTING_REPO, "rev-parse", `${IDHAYATHAI_PIN}:poems/${EXISTING_SLUG}`),
  FROZEN_TREES[EXISTING_SLUG],
);
eq(
  `${EXISTING_SLUG}: work tree unchanged at the Wave-4 freeze`,
  git("rev-parse", `${WAVE4_FREEZE}:poems/${EXISTING_SLUG}`),
  FROZEN_TREES[EXISTING_SLUG],
);

// ── 4. Standalone workspace coverage is exactly 4/4 ──────────────────────────────────────────────
const dataDirs = fs.readdirSync(DATA_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
// The four standalone works are each vendored as a directory. Since Wave 4 P2 the poems tree also
// holds ONE poetry publication (a directory with publication.json rather than poem.json), so this
// asserts the four standalones are present and are the only STANDALONE payloads — not that the tree
// holds nothing else.
for (const slug of ALL_SLUGS) check(`public/data/poems holds the standalone work ${slug}`, dataDirs.includes(slug));
const standaloneDirs = dataDirs.filter((d) => fs.existsSync(path.join(DATA_ROOT, d, "poem.json")));
eq("the standalone payloads (poem.json) are exactly the four standalone works", standaloneDirs.sort(), ALL_SLUGS);
const registrySlugs = arrayLiteral(poemsTs, "POEM_SLUGS");
eq("POEM_SLUGS holds exactly the four standalone works", [...(registrySlugs ?? [])].sort(), ALL_SLUGS);

// ── 5–6. Each slug exists exactly once, in every place that names it ─────────────────────────────
for (const slug of ALL_SLUGS) {
  const label = NEW_SLUGS.includes(slug) ? "new" : "existing";
  eq(`${slug} (${label}): appears once in POEM_SLUGS`, (registrySlugs ?? []).filter((s) => s === slug).length, 1);
  eq(`${slug} (${label}): one catalogue work`, (libraryTs.match(new RegExp(`\\n    id: "${slug}",`, "g")) ?? []).length, 1);
  eq(`${slug} (${label}): one landing href`, (libraryTs.match(new RegExp(`href: "/poems/${slug}",`, "g")) ?? []).length, 1);
  eq(`${slug} (${label}): one provenance href`, (libraryTs.match(new RegExp(`provenanceHref: "/poems/${slug}/source",`, "g")) ?? []).length, 1);
  eq(`${slug} (${label}): one payload directory`, dataDirs.filter((d) => d === slug).length, 1);
}

// ── 7. None of the four standalone poems is a publication ────────────────────────────────────────
// P1's guard was "no publication exists at all"; P2 published one, so the invariant narrows to what
// P1 actually owns: none of the FOUR standalone poems may be modelled as a publication.
for (const slug of ALL_SLUGS) check(`${slug} is not registered as a poetry publication`, !(arrayLiteral(poemsTs, "POETRY_PUBLICATION_SLUGS") ?? []).includes(slug));
check("no poetry-publication route exists", !fs.existsSync(path.join(process.cwd(), "app/poetry")));
check("no poetry-publication payloads are vendored", !fs.existsSync(path.join(process.cwd(), "public/data/poetry")));

// ── 8. No witness relation is declared in P1 ─────────────────────────────────────────────────────
{
  const m = /export const POETRY_WITNESS_RELATIONS: PoetryWitnessRelation\[\] = \[([\s\S]*?)\];/.exec(poemsTs);
  check("POETRY_WITNESS_RELATIONS is declared", !!m);
  // P3 has landed two witness relations; they reference standalone poems as endpoints but must not
  // require any standalone PAYLOAD change — the byte-identity checks below prove that.
  check("witness relations reference only registry endpoints (no inline poem text)", !!m && !/tamil|english|elements/.test(m[1]));
}

// ── Independent reconstruction ───────────────────────────────────────────────────────────────────
// Tamil, re-read with a fence state machine rather than the importer's block regex. Two assembly
// conventions exist; both are handled here, and a file matching neither is a failure rather than an
// empty result that would silently pass an equality check.
function reconstructTamil(slug) {
  const src = readText(path.join(SRC_REPO, "poems", slug, "sections", `${slug}.md`));
  const lines = src.split("\n");
  const out = [];
  const fenced = /^<!--\s*scan\s+(\d+)\s*\/[^>]*-->\s*$/;
  const plain = /^<!--\s*scan_page:\s*(\d+)\s*-->\s*$/;
  let scan = null;
  let inFence = false;
  let expectFence = false;
  let convention = null;
  for (const raw of lines) {
    const t = raw.trim();
    const f = fenced.exec(t);
    const p = plain.exec(t);
    if (f) {
      convention ??= "fenced";
      scan = Number(f[1]);
      expectFence = true;
      continue;
    }
    if (p) {
      convention ??= "plain";
      scan = Number(p[1]);
      inFence = true; // the plain convention has no fence; the marker itself opens the region
      continue;
    }
    if (expectFence) {
      if (t === "```text") {
        inFence = true;
        expectFence = false;
      }
      continue;
    }
    if (convention === "fenced" && t === "```") {
      inFence = false;
      scan = null;
      continue;
    }
    if (!inFence || scan === null) continue;
    if (t.startsWith("<!--")) continue;
    out.push({ scan, raw: raw.replace(/\s+$/, "") });
  }
  return { convention, rows: out };
}

// English, re-read from the RELEASED ASSEMBLY. The importer builds its English from the reviewed
// BATCHES and only afterwards compares to this file, so reading it here exercises a different path
// through different artifacts.
const ASSEMBLY_REGION = {
  "idhayathai-thanthidu-anna": { startAt: "<!-- batch 01" },
  "anaiya-vilakku-anna": { startAt: "<!-- batch 01" },
  marathi: { startAfter: "# The Valiant Woman", endBefore: "## Translation notes" },
  "thennan-kathai": { startAfter: readText(path.join(SRC_REPO, "poems/thennan-kathai/translations/en/thennan-kathai-en.md")).split("\n")[0] },
};
function reconstructEnglish(slug) {
  const src = readText(path.join(SRC_REPO, "poems", slug, "translations/en", `${slug}-en.md`));
  const r = ASSEMBLY_REGION[slug];
  let from = 0;
  if (r.startAt) from = src.indexOf(r.startAt);
  else if (r.startAfter) from = src.indexOf(r.startAfter) + r.startAfter.length;
  const to = r.endBefore ? src.indexOf(r.endBefore, from) : src.length;
  if (from < 0 || to <= from) return null;
  return src
    .slice(from, to)
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l) => l.trim() !== "" && !/^<!--[\s\S]*-->$/.test(l.trim()));
}

// ── 9. Tamil canonical payload is complete for each imported work ────────────────────────────────
for (const slug of ALL_SLUGS) {
  const { convention, rows } = reconstructTamil(slug);
  const poem = payload[slug].poem;
  check(`${slug}: Tamil assembly uses a recognised convention`, convention === "fenced" || convention === "plain");
  // PRESENCE first — an empty reconstruction may never certify an empty payload.
  check(`${slug}: Tamil source assembly is non-trivial (${rows.length} source lines)`, rows.length > 50);
  check(`${slug}: Tamil payload is non-trivial (${poem.tamil.lineCount} lines)`, poem.tamil.lineCount > 50);

  const carriers = poem.tamil.elements.filter((e) => e.kind === "line" || e.kind === "source-heading");
  const expected = rows.filter((r) => r.raw.trim() !== "");
  eq(`${slug}: Tamil carries every source line, and only those`, carriers.length, expected.length);
  const rebuilt = carriers.map((e) => (e.kind === "line" ? " ".repeat(e.indent) + e.text : e.text));
  eq(`${slug}: Tamil text and order are exactly the source assembly`, rebuilt, expected.map((r) => r.raw));
  eq(`${slug}: Tamil line scan provenance is exactly the source assembly`, carriers.map((e) => e.sourceScan), expected.map((r) => r.scan));

  // STRUCTURE — the blank lines inside a scan region, re-derived from the source file.
  // A break is a blank RUN with verse on BOTH sides inside the same scan. A blank run trailing at
  // the edge of a block is not one: the block boundary is a container, not a source statement about
  // stanza structure, which is the same reason a blank cannot be expressed across a page edge.
  let breaks = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].raw.trim() !== "") continue;
    let j = i;
    while (j < rows.length && rows[j].raw.trim() === "") j++;
    const before = rows[i - 1];
    const after = rows[j];
    if (before && after && before.raw.trim() !== "" && after.raw.trim() !== "" && before.scan === after.scan) breaks++;
    i = j - 1;
  }
  eq(`${slug}: Tamil in-page stanza breaks are re-derived from the source`, poem.tamil.inPageStanzaBreaks, breaks);
  eq(`${slug}: Tamil page transitions equal scans − 1`, poem.tamil.pageTransitions, poem.poemScans.length - 1);
}

// ── 10. Released English payload exists and equals the released assembly for each work ───────────
for (const slug of ALL_SLUGS) {
  const asm = reconstructEnglish(slug);
  const poem = payload[slug].poem;
  check(`${slug}: released English assembly region resolves`, Array.isArray(asm));
  check(`${slug}: released English is non-trivial (${asm?.length ?? 0} lines)`, (asm?.length ?? 0) > 50);
  check(`${slug}: English payload is non-trivial (${poem.english.lineCount} lines)`, poem.english.lineCount > 50);
  const carriers = poem.english.elements.filter((e) => e.kind === "line" || e.kind === "source-heading");
  const rebuilt = carriers.map((e) => (e.kind === "line" ? " ".repeat(e.indent) + e.text : e.text));
  // A source heading is Markdown in the assembly and plain text in the payload, so it is compared
  // by its text with the heading marker removed — the ONLY normalisation applied anywhere here.
  eq(
    `${slug}: English text and order are exactly the released assembly`,
    rebuilt,
    (asm ?? []).map((l) => l.replace(/^#{1,6}\s+/, "")),
  );
  eq(`${slug}: English page transitions equal scans − 1`, poem.english.pageTransitions, poem.poemScans.length - 1);
  eq(`${slug}: English covers every poem scan`, [...new Set(poem.english.elements.filter((e) => e.kind === "line").map((e) => e.sourceScan))].sort((a, b) => a - b), poem.poemScans);
}

// The two layers must agree about how many headings the SOURCE prints, or one of them invented or
// swallowed one. Absence is the truthful value for a work whose source prints none.
for (const slug of ALL_SLUGS) {
  const p = payload[slug].poem;
  eq(`${slug}: both layers agree on printed source headings`, p.tamil.sourceHeadings ?? 0, p.english.sourceHeadings ?? 0);
  const declared = p.prov?.archiveDerived?.sourceHeadings;
  void declared;
}
eq("anaiya-vilakku-anna prints exactly one source heading", payload["anaiya-vilakku-anna"].poem.tamil.sourceHeadings, 1);
for (const slug of [EXISTING_SLUG, "marathi", "thennan-kathai"]) {
  eq(`${slug}: no printed source heading is claimed`, payload[slug].poem.tamil.sourceHeadings, undefined);
}

// ── 10b. The published English title IS the frozen release's title ──────────────────────────────
// A translation layer is release-cleared under a title, and changing that title downstream is a
// silent retitling of someone else's cleared work — it does not look like an error, it looks like a
// choice. This import made exactly that mistake once, publishing "Anna, the Unquenchable Lamp" for a
// release that says "Anna, the Inextinguishable Lamp", so the title is now pinned to the frozen
// bytes rather than to a constant in this file, in BOTH directions:
//
//   * where the release declares a title — `english_title:` frontmatter, an H1, or both — the
//     payload and the catalogue must equal it EXACTLY. Nothing is normalised, trimmed of its comma,
//     case-folded or reinterpreted; a synonym is a mismatch.
//   * where the release declares NONE, the work must SAY it declares none. Otherwise a
//     project-supplied reading label would be indistinguishable from a source-established title.
for (const slug of ALL_SLUGS) {
  const asmPath = path.join(SRC_REPO, "poems", slug, "translations/en", `${slug}-en.md`);
  const asm = readText(asmPath);
  const fm = /^english_title:\s*"([^"]*)"\s*$/m.exec(asm);
  // The work-title H1 is the first H1 that is NOT the document heading (which names the file, e.g.
  // "<Tamil title> — English Translation"), so a document heading is never mistaken for a title.
  const h1s = [];
  const h1re = /^#\s+(.*\S)\s*$/gm;
  let hm;
  while ((hm = h1re.exec(asm)) !== null) h1s.push(hm[1]);
  const workH1 = h1s.find((h) => !/English Translation$/.test(h));
  const declared = fm?.[1] ?? workH1 ?? null;

  const poemTitle = payload[slug].poem.title.en;
  const provTitle = payload[slug].prov.source.titleEn;
  if (declared !== null) {
    check(`${slug}: the frozen release declares an English title`, declared.length > 0);
    eq(`${slug}: poem.json English title is the released title`, poemTitle, declared);
    eq(`${slug}: provenance English title is the released title`, provTitle, declared);
    check(`${slug}: the catalogue English title is the released title`, libraryTs.includes(`titleEn: "${declared}",`));
    // Both declarations, where the release carries both, must agree with each other.
    if (fm && workH1) eq(`${slug}: the release's frontmatter and H1 titles agree`, fm[1], workH1);
    // And the title must be BYTE-equal, not merely similar — a normalisation would hide a retitling.
    check(`${slug}: the released title appears verbatim in the assembly`, asm.includes(declared));
    eq(`${slug}: no unapproved-title note where a title IS declared`, payload[slug].prov.source.englishTitleNote, undefined);
    check(`${slug}: the English title is not named as an unstated fact`, !payload[slug].poem.factsNotStated.includes("english-title"));
  } else {
    // NO APPROVED TITLE UPSTREAM ⇒ NO ENGLISH TITLE IS PUBLISHED. A note describing an invented
    // title as "project-supplied" does not make the title surfaces truthful — the reader's secondary
    // title, the share text, the catalogue card and the OpenGraph/Twitter metadata all present
    // `title.en` as the work's English title, unqualified. So the canonical Tamil title stands in
    // the English slot and nothing translated or transliterated is invented to fill it.
    const canonical = payload[slug].poem.title.ta;
    eq(`${slug}: the published English title falls back to the canonical Tamil title`, poemTitle, canonical);
    eq(`${slug}: provenance carries the same fallback`, provTitle, canonical);
    check(`${slug}: the catalogue carries the same fallback`, libraryTs.includes(`titleEn: "${canonical}",`));
    check(`${slug}: the release declares no English title, and the work says so`, payload[slug].poem.factsNotStated.includes("english-title"));
    check(`${slug}: an unapproved-title note is recorded`, typeof payload[slug].prov.source.englishTitleNote === "string");
    const note = payload[slug].prov.source.englishTitleNote ?? "";
    check(`${slug}: the note states that no final English title is approved upstream`, /NO FINAL ENGLISH TITLE IS APPROVED UPSTREAM/.test(note));
    check(`${slug}: the note states the TRANSLATION is release-complete`, /RELEASE-COMPLETE/.test(note));
    check(`${slug}: the note states an approved title would replace the fallback`, /replaces this fallback/.test(note));
    check(`${slug}: the note cites the upstream statement`, note.includes("SOURCE_MAP.md"));
    // The upstream statement it cites must actually be there, at the frozen commit.
    const srcMap = readText(path.join(SRC_REPO, "poems", slug, "translations/en/SOURCE_MAP.md"));
    check(
      `${slug}: the frozen SOURCE_MAP records that no final English title is approved`,
      /translates poem body only unless a final English title is separately approved/.test(srcMap),
    );
    check(`${slug}: the frozen release declares no english_title frontmatter`, !/^english_title:/m.test(asm));
  }
}
// The one work this rule was written for must actually be exercised by it.
eq(
  "anaiya-vilakku-anna publishes the frozen release's English title",
  payload["anaiya-vilakku-anna"].poem.title.en,
  "Anna, the Inextinguishable Lamp",
);
check(
  "the superseded invented title appears nowhere in the implementation",
  !libraryTs.includes("Unquenchable") && !JSON.stringify(payload).includes("Unquenchable"),
);
// The second rejected label — a translated title this project invented for a work whose release
// approves none. It may survive in PR and commit history explaining WHY it was rejected; it may not
// survive in anything that is generated, catalogued, or served.
{
  const REJECTED = "The Lay of the Southern King";
  check("the rejected translated title is absent from every payload", !JSON.stringify(payload).includes(REJECTED));
  check("the rejected translated title is absent from the catalogue", !libraryTs.includes(REJECTED));
  for (const dir of ["app", "components", "data", "scripts/poem-declarations"]) {
    const root = path.join(process.cwd(), dir);
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const abs = path.join(d, e.name);
        if (e.isDirectory()) walk(abs);
        else if (/\.(ts|tsx|mjs|json)$/.test(e.name)) {
          check(`${path.relative(process.cwd(), abs)} does not carry the rejected title`, !readText(abs).includes(REJECTED));
        }
      }
    };
    if (fs.existsSync(root)) walk(root);
  }
  // And nowhere in the built output, when there is one.
  const appOut = path.join(process.cwd(), ".next/server/app");
  if (fs.existsSync(appOut)) {
    const hits = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const abs = path.join(d, e.name);
        if (e.isDirectory()) walk(abs);
        else if (/\.(html|rsc|body)$/.test(e.name) && readText(abs).includes(REJECTED)) hits.push(abs);
      }
    };
    walk(appOut);
    eq("the rejected title is absent from every prerendered page", hits, []);
  }
}

// ── 11–12. Routes: no collision, exactly one landing and one /source per work ────────────────────
{
  const hrefs = ALL_SLUGS.map((s) => `/poems/${s}`);
  eq("no route slug collision", new Set(hrefs).size, hrefs.length);
  eq("no registry slug collision", new Set(registrySlugs ?? []).size, (registrySlugs ?? []).length);
  const readerRoute = fs.existsSync(path.join(process.cwd(), "app/poems/[slug]/page.tsx"));
  const sourceRoute = fs.existsSync(path.join(process.cwd(), "app/poems/[slug]/source/page.tsx"));
  check("one dynamic landing route generates every poem page", readerRoute);
  check("one dynamic /source route generates every provenance page", sourceRoute);
  // Both routes must be driven by the registry, so a work cannot exist in one and not the other.
  for (const f of ["app/poems/[slug]/page.tsx", "app/poems/[slug]/source/page.tsx"]) {
    const src = readText(path.join(process.cwd(), f));
    check(`${f} generates its params from POEM_SLUGS`, /POEM_SLUGS/.test(src) && /generateStaticParams/.test(src));
  }
}

// ── 13. Source hashes / page counts / ranges match the frozen metadata record ────────────────────
for (const slug of ALL_SLUGS) {
  const s = payload[slug].prov.source;
  const meta = readText(path.join(SRC_REPO, "poems", slug, "metadata/source.md"));
  check(`${slug}: scan filename is recorded verbatim upstream`, meta.includes(s.scanFilename));
  check(`${slug}: scan SHA-256 is recorded verbatim upstream`, meta.includes(s.scanSha256));
  check(`${slug}: scan byte size is recorded verbatim upstream`, meta.includes(s.scanFileSizeBytes.toLocaleString("en-US")));
  check(`${slug}: physical page count is recorded verbatim upstream`, meta.includes(String(s.scanTotalPages)));
  check(`${slug}: the source PDF is not vendored`, s.sourcePdfCommitted === false);
  check(`${slug}: no source PDF is committed to this repository`, !fs.existsSync(path.join(DATA_ROOT, slug, s.scanFilename)));
  const scans = payload[slug].poem.poemScans;
  eq(`${slug}: poem scans are contiguous and ascending`, scans, Array.from({ length: scans.length }, (_, i) => scans[0] + i));
  check(`${slug}: the recorded scan range matches the poem scans`, s.poemScanPages.includes(String(scans[0])) && s.poemScanPages.includes(String(scans[scans.length - 1])));
}

// ── 14. marathi retains 248 physical PDF pages and work range 58–61 ──────────────────────────────
{
  const s = payload.marathi.prov.source;
  const meta = readText(path.join(SRC_REPO, "poems/marathi/metadata/source.md"));
  eq("marathi: 248 physical PDF pages", s.scanTotalPages, 248);
  check("marathi: upstream states the 248-page identity", /Physical PDF page count: \*\*248\*\*/.test(meta));
  check("marathi: upstream states the 58–61 work range", /Work range: PDF pages \*\*58–61\*\*/.test(meta));
  eq("marathi: poem BODY is scans 59–61, the title page excluded", payload.marathi.poem.poemScans, [59, 60, 61]);
  check("marathi: the excluded title page is named in the locked exclusions", s.lockedExclusions.some((x) => x.includes("58")));
}

// ── 15. thennan-kathai retains 218 physical PDF pages and range 145–152 ──────────────────────────
{
  const s = payload["thennan-kathai"].prov.source;
  const meta = readText(path.join(SRC_REPO, "poems/thennan-kathai/metadata/source.md"));
  eq("thennan-kathai: 218 physical PDF pages", s.scanTotalPages, 218);
  check("thennan-kathai: upstream states the 218-page identity", /physical PDF page count: \*\*218\*\*/.test(meta));
  eq("thennan-kathai: work range 145–152", payload["thennan-kathai"].poem.poemScans, [145, 146, 147, 148, 149, 150, 151, 152]);
  eq("thennan-kathai: a single controlling source", s.scanFilename, "TVA_PRL_0007090_" + "முரசொலி.pdf".normalize("NFD"));
}

// ── 16. The historical page-151/152 auxiliary extracts never become controlling sources ──────────
{
  const AUX = [
    { file: "af978d0a2b6ae807620bd0167c453d1e83c95130.pdf", sha: "9020615bed68a8467dbe4adc8dca05f1e04f123c1ad038201a864bcb1bc0379d" },
    { file: "f34bc565cd5cbae27e96a92ef704cb8f21fd1270.pdf", sha: "1d1b52abd203ddaf690e659874ba58fa4344539648f1b6bfa7c66ac408c2206a" },
  ];
  const allPayloadText = ALL_SLUGS.map((s) => JSON.stringify(payload[s])).join("\n");
  for (const a of AUX) {
    check(`auxiliary extract ${a.file.slice(0, 8)}… is not a controlling source`, !allPayloadText.includes(a.file));
    check(`auxiliary extract ${a.file.slice(0, 8)}… SHA is not recorded as a scan identity`, !allPayloadText.includes(a.sha));
  }
  check("thennan-kathai's controlling scan is the complete 218-page PDF", payload["thennan-kathai"].prov.source.scanFileSizeBytes === 246184679);
}

// ── 17. thennan-kathai publication evidence ──────────────────────────────────────────────────────
{
  const pe = payload["thennan-kathai"].prov.source.publicationEstablished;
  const meta = readText(path.join(SRC_REPO, "poems/thennan-kathai/metadata/source.md"));
  check("thennan-kathai: publication evidence is present", !!pe);
  check("thennan-kathai: the publication name is recorded verbatim upstream", !!pe && meta.includes(pe.publicationTa));
  eq("thennan-kathai: publication year 1956", pe?.year, 1956);
  check("thennan-kathai: upstream states the 1956 edition/year", /Edition\/year: \*\*1956\*\*/.test(meta));
  eq("thennan-kathai: the work records the publication year", payload["thennan-kathai"].poem.publicationYear, 1956);
  check("thennan-kathai: the catalogue records the edition", libraryTs.includes(`edition: "${pe.editionStatement}"`));
  // No other standalone poem may claim a publication.
  for (const slug of [EXISTING_SLUG, "anaiya-vilakku-anna", "marathi"]) {
    eq(`${slug}: no publication is established`, payload[slug].prov.source.publicationEstablished, undefined);
    eq(`${slug}: publication year stays null`, payload[slug].poem.publicationYear, null);
    eq(`${slug}: edition statement stays null`, payload[slug].poem.editionStatement, null);
    check(`${slug}: the absence is stated, not merely omitted`, typeof payload[slug].prov.source.publicationNotEstablished === "string");
  }
}

// ── 18. thennan-kathai editorial exception is present and witness-scoped ─────────────────────────
{
  const ex = payload["thennan-kathai"].poem.editorialExceptions;
  check("thennan-kathai: an editorial exception is recorded", Array.isArray(ex) && ex.length === 1);
  const e = ex?.[0];
  eq("thennan-kathai: the exception names scan 151", e?.scan, 151);
  eq("thennan-kathai: the exception is owner-directed", e?.kind, "owner-directed-omission");
  eq("thennan-kathai: the exception applies to both reading layers", e?.appliesTo, "both-reading-layers");
  eq("thennan-kathai: no replacement was made", e?.replacement, "none");
  check("thennan-kathai: the consequence for completeness is stated", typeof e?.consequence === "string" && e.consequence.length > 0);
  check("thennan-kathai: restoration is upstream-only", typeof e?.restoration === "string" && e.restoration.includes("upstream"));
  check("thennan-kathai: the exception cites the pinned archive", Array.isArray(e?.citations) && e.citations.length >= 3);
  for (const c of e?.citations ?? []) {
    const [file] = c.split(":");
    check(`thennan-kathai: the cited document ${file} exists in the pinned source`, fs.existsSync(path.join(SRC_REPO, "poems/thennan-kathai", file)));
  }
  check("thennan-kathai: provenance explains why this is not a locked exclusion", (payload["thennan-kathai"].prov.source.editorialExceptionNote ?? "").includes("lockedExclusions"));
  // WITNESS-LOCAL. The exception belongs to this work only; no other payload may carry one.
  for (const slug of [EXISTING_SLUG, "anaiya-vilakku-anna", "marathi"]) {
    eq(`${slug}: carries no editorial exception`, payload[slug].poem.editorialExceptions, undefined);
    eq(`${slug}: carries no editorial-exception note`, payload[slug].prov.source.editorialExceptionNote, undefined);
  }
  // The exception must NOT have been filed as a locked exclusion.
  check(
    "thennan-kathai: the omission is not filed among the locked exclusions",
    !payload["thennan-kathai"].prov.source.lockedExclusions.some((x) => /omission|omitted|slur/i.test(x)),
  );
}

// ── 19. The omitted source word is not introduced anywhere for validation's sake ─────────────────
{
  // The archive does not reproduce the term, so there is nothing to compare against — which is
  // exactly why this is checked STRUCTURALLY. The Tamil payload was already proved equal to the
  // source assembly line for line above, so no lexical item can have been added; what remains is to
  // prove nothing was smuggled in through metadata, and that the flag itself is honest.
  const e = payload["thennan-kathai"].poem.editorialExceptions?.[0];
  eq("thennan-kathai: the omitted term is declared NOT reproduced", e?.omittedTermReproduced, false);
  const scan151 = readText(path.join(SRC_REPO, "poems/thennan-kathai/pages/0151.md"));
  check("upstream page 0151 documents the omission without reproducing the term", /omitted from the repository transcription without replacement/.test(scan151));
  check(
    "no payload field carries a restored or substituted term for scan 151",
    !/\b(slur|epithet|restored term|substitute)\s*[:=]/i.test(JSON.stringify(payload["thennan-kathai"])),
  );
  // And the scan-151 verse in the payload is exactly the scan-151 verse upstream — no more, no less.
  const upstream = reconstructTamil("thennan-kathai").rows.filter((r) => r.scan === 151 && r.raw.trim() !== "").map((r) => r.raw);
  const mine = payload["thennan-kathai"].poem.tamil.elements
    .filter((e2) => e2.kind === "line" && e2.sourceScan === 151)
    .map((e2) => " ".repeat(e2.indent) + e2.text);
  check("scan 151 verse is non-trivial", upstream.length > 5);
  eq("scan 151 verse equals the pinned source exactly", mine, upstream);
}

// ── 20. anaiya's internal 15-9-2008 date is NOT imported as a publication year ───────────────────
{
  const p = payload["anaiya-vilakku-anna"];
  eq("anaiya-vilakku-anna: publication year stays null", p.poem.publicationYear, null);
  eq("anaiya-vilakku-anna: edition statement stays null", p.poem.editionStatement, null);
  check("anaiya-vilakku-anna: the catalogue sets no edition", !new RegExp(`id: "anaiya-vilakku-anna",[\\s\\S]*?edition:`).test(libraryTs.slice(libraryTs.indexOf('id: "anaiya-vilakku-anna"'), libraryTs.indexOf('id: "marathi"'))));
  check("anaiya-vilakku-anna: the 2008 date is explained as a source-role fact", p.prov.source.publicationNotEstablished.includes("15-9-2008"));
  check("anaiya-vilakku-anna: no payload date field carries 2008", p.poem.publicationYear !== 2008 && p.prov.source.publicationEstablished === undefined);
  // Nor may the 1955 year in marathi's controlling filename become a publication year.
  check("marathi: the filename year is explained as file identity, not publication", payload.marathi.prov.source.publicationNotEstablished.includes("filename"));
  eq("marathi: publication year stays null", payload.marathi.poem.publicationYear, null);
}

// ── 21. No fabricated venue / occasion / context ─────────────────────────────────────────────────
for (const slug of ALL_SLUGS) {
  const { poem, prov } = payload[slug];
  const s = prov.source;
  const ctx = poem.sourceContext;
  const contextFields = [s.contextNoteTa, s.contextDatePrinted, s.contextDateIso, s.contextVenueTa, s.contextVenueEn, s.contextOccasionTa, s.contextOccasionEn];
  if (ctx) {
    // Present ⇒ every word of it must appear verbatim in the pinned source assembly.
    const asm = readText(path.join(SRC_REPO, "poems", slug, "sections", `${slug}.md`));
    for (const frag of ctx.noteTa.split("\n")) {
      check(`${slug}: context note fragment is verbatim upstream`, asm.includes(frag.replace(/^\(|\)$/g, "")));
    }
    check(`${slug}: the context note is metadata, never verse`, !poem.tamil.elements.some((e) => e.kind === "line" && ctx.noteTa.includes(e.text)));
  } else {
    // Absent ⇒ NOTHING may stand in for it. An empty string here would assert "the source says
    // nothing", which is a different and stronger claim than saying nothing at all.
    eq(`${slug}: no context is invented where the source prints none`, contextFields.filter((f) => f !== undefined), []);
    check(`${slug}: no venue is invented`, s.contextVenueTa === undefined && s.contextVenueEn === undefined);
    check(`${slug}: no occasion is invented`, s.contextOccasionTa === undefined && s.contextOccasionEn === undefined);
  }
  // No printed page number may be invented on any work whose page map records none.
  const printed = poem.tamil.elements.filter((e) => e.kind === "line").map((e) => e.printedPage);
  const mapping = s.printedPageMapping;
  if (mapping.startsWith("none")) {
    eq(`${slug}: no printed page number is inferred`, [...new Set(printed)], [null]);
  } else {
    check(`${slug}: printed page numbers are present where the source shows them`, printed.some((x) => typeof x === "number"));
    check(`${slug}: an unnumbered scan is stated rather than filled`, printed.some((x) => x === null) ? typeof s.unnumberedScanNote === "string" : true);
  }
}

// ── 22. The existing poem's public JSON hashes remain exact ──────────────────────────────────────
for (const [file, expected] of Object.entries(IDHAYATHAI_HASHES)) {
  eq(`${EXISTING_SLUG}: ${file} is byte-identical to the integrated payload`, sha256(readText(path.join(DATA_ROOT, EXISTING_SLUG, file))), expected);
}

// ── 23–24. No standalone poem is a publication; witness relations touch no standalone payload ────
check("no standalone poem is registered as a publication", ALL_SLUGS.every((slug) => !(arrayLiteral(poemsTs, "POETRY_PUBLICATION_SLUGS") ?? []).includes(slug)));
check("witness relations encode no poem text (registry-only)", !/POETRY_WITNESS_RELATIONS[\s\S]*?elements:/.test(poemsTs));

// ── 25. No second collection ─────────────────────────────────────────────────────────────────────
{
  // COLLECTION_IDS is DERIVED from LIBRARY_COLLECTIONS, so counting the derived name would prove
  // nothing about how many collections exist. The definitions themselves are counted instead.
  const m = /export const LIBRARY_COLLECTIONS:[^=]*=\s*\[([\s\S]*?)\n\];/.exec(collectionsTs);
  check("LIBRARY_COLLECTIONS is declared", !!m);
  const defs = (m?.[1].match(/^ {2}\{$/gm) ?? []).length;
  eq("exactly one LibraryCollection is defined", defs, 1);
  check("COLLECTION_IDS is derived from that one list, not hand-written", /export const COLLECTION_IDS = LIBRARY_COLLECTIONS\.map/.test(collectionsTs));
}

// ── 26. The sitemap has no duplicates ────────────────────────────────────────────────────────────
{
  const built = path.join(process.cwd(), ".next/server/app/sitemap.xml.body");
  if (fs.existsSync(built)) {
    const urls = [...readText(built).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    check(`sitemap is non-trivial (${urls.length} URLs)`, urls.length > 100);
    eq("sitemap has no duplicate URLs", urls.length - new Set(urls).size, 0);
    // Restricted to the four STANDALONE poems: since P2, /poems/ also holds the publication's own
    // 60-route family, which is the P2 validator's concern, not this one.
    const poemUrls = urls.filter((u) => u.includes("/poems/"));
    eq("sitemap poem URLs are unique", new Set(poemUrls).size, poemUrls.length);
    for (const slug of ALL_SLUGS) {
      eq(`sitemap carries exactly two URLs for ${slug}`, poemUrls.filter((u) => u.endsWith(`/poems/${slug}`) || u.endsWith(`/poems/${slug}/source`)).length, 2);
    }
  } else {
    // The registry the sitemap is derived FROM must still be duplicate-free even without a build.
    eq("registry-derived poem URLs are unique", new Set(registrySlugs ?? []).size, (registrySlugs ?? []).length);
    console.log("  (note: no build output found — sitemap URLs checked via the registry they derive from)");
  }
}

// ── REPORT ───────────────────────────────────────────────────────────────────────────────────────
console.log(`\nwave4-p1-standalone-poems — ${pass} assertions passed, ${failures.length} failed`);
if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error(" ✗ " + f);
  process.exit(1);
}
console.log("ALL PASS");
