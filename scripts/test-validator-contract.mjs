// Proves a validator obeys the exit-code contract in docs/VALIDATOR_CONTRACT.md.
//
//   node scripts/test-validator-contract.mjs <sources-dir>
//
// where <sources-dir> holds the source clones, one per repository, exactly as
// `npm run validate` and the CI workflow lay them out (KDL_SOURCES_DIR, default `.sources`).
//
// Four paths, per validator:
//
//   unmodified pair            → 0
//   corrupted released data    → 1   (and the message must name what differs)
//   missing source clone       → 2
//   no argument at all         → 2
//
// Corruption is applied to a disposable COPY of the released data. Nothing here writes to
// public/data/ or to any source archive: the archives are read-only, and a test that mutated one
// would be indistinguishable from the defect it is meant to catch.
//
// Validators are registered here as they are migrated. An unregistered validator is reported as
// pending rather than silently skipped, so this file also serves as the migration's progress board.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SOURCES = process.argv[2];
if (!SOURCES) {
  console.error("usage: node scripts/test-validator-contract.mjs <sources-dir>");
  process.exit(2);
}

/**
 * One entry per migrated validator.
 *
 * `corrupt` receives a writable copy of the work's released data and must make a change the
 * validator is required to reject, returning a fragment of the expected message. It should alter
 * MEANING, not shape — a truncated file would be caught by almost anything, whereas a plausible
 * wrong reading is the failure that actually threatens an archive.
 *
 * Validators differ in how they can be pointed at that copy, and the harness adapts rather than
 * requiring them to change:
 *   `dataFlag`  the validator accepts an explicit path (Thirukkural's `--data`);
 *   otherwise   the copy is placed at the work's own path inside a temporary working directory and
 *               the validator is run from there, since those validators resolve their data against
 *               process.cwd(). Either way nothing writes to this repository's public/data/.
 */
const VALIDATORS = [
  {
    name: "manohara",
    script: "scripts/validate-manohara.mjs",
    repo: "kalaignar-cinema-works",
    // Shares an archive with Tirumbippaar but pins an older commit, so each has
    // its own checkout directory.
    sourceDir: "kalaignar-cinema-works-manohara",
    data: "public/data/cinema/manohara",
    // No --data flag, so the copy is run from a temporary working directory instead.
    corrupt(dir) {
      // Repoint a released segment at a different source scene. The file stays well-formed and
      // every Tamil character is untouched, so only a validator actually comparing the release
      // against the archive notices — which is the failure worth guarding. (An earlier attempt
      // renamed a slug instead; Manohara does not assert slugs against the source, so it passed
      // 70/70 and would have made this a vacuous test.)
      const f = path.join(dir, "segments", "segment-001.json");
      const j = JSON.parse(fs.readFileSync(f, "utf8"));
      j.sceneId = "not-the-source-scene-id";
      fs.writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
      return "segment ids match the source scene ids in order";
    },
  },
  {
    name: "tirumbippaar",
    script: "scripts/validate-tirumbippaar.mjs",
    repo: "kalaignar-cinema-works",
    sourceDir: "kalaignar-cinema-works-tirumbippaar",
    data: "public/data/cinema/tirumbippaar",
    // No --data flag, so the copy is run from a temporary working directory instead.
    corrupt(dir) {
      // Reintroduce the superseded ஊஹூம் reading into one scene. The file stays
      // well-formed and the change is a single vowel sign, so only a validator that
      // actually compares the release against the pinned archive notices — which is
      // exactly the regression this work's guards exist to prevent.
      const f = path.join(dir, "scenes", "scene-06.json");
      const j = JSON.parse(fs.readFileSync(f, "utf8"));
      for (const b of j.tamil.blocks) b.text = b.text.replace(/ஊஹும்/g, "ஊஹூம்");
      fs.writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
      return "the superseded reading ஊஹூம் is absent from the imported text";
    },
  },
  {
    name: "thirukkural",
    script: "scripts/validate-thirukkural.mjs",
    repo: "kalaignar-literary-commentary",
    data: "public/data/thirukkural",
    dataFlag: (dir) => ["--data", dir],
    corrupt(dir) {
      // The மதிப்புரை trap: the edition's front-matter essays quote Kural 1 in a different sandhi
      // from Kalaignar's printed text. Publishing a reviewer's wording under his name is the exact
      // failure this work's importer and validator exist to prevent, so it is what we inject.
      const f = path.join(dir, "adhikarams", "001.json");
      const j = JSON.parse(fs.readFileSync(f, "utf8"));
      j.kurals[0].tamilText = ["குணமென்னும் குன்றேறி நின்றார் வெகுளி", "கணமேயும் காத்தல் அரிது."];
      fs.writeFileSync(f, JSON.stringify(j, null, 1) + "\n");
      return "Tamil text differs from the source";
    },
  },
];

const ALL = fs.readdirSync("scripts").filter((f) => /^validate-.*\.mjs$/.test(f));
const registered = new Set(VALIDATORS.map((v) => path.basename(v.script)));
const pending = ALL.filter((f) => !registered.has(f));

const run = (script, args, cwd) => {
  const r = spawnSync("node", [path.resolve(script), ...args], { encoding: "utf8", cwd });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
};

let checks = 0;
const failures = [];
const expect = (label, actual, want, extra = "") => {
  checks++;
  if (actual !== want) failures.push(`${label} — expected exit ${want}, got ${actual}${extra}`);
};

console.log(`\nvalidator contract — ${VALIDATORS.length} registered, ${pending.length} pending\n`);

for (const v of VALIDATORS) {
  // Absolute: cwd-mode validators are run from a temporary directory, where a relative path
  // would resolve to nothing and be reported as an unusable source rather than as bad data.
  // Works whose archive is shared but pinned differently live in their own checkout
  // directory, so a validator may name one explicitly instead of using the repo name.
  const src = path.resolve(SOURCES, v.sourceDir ?? v.repo);
  if (!fs.existsSync(src)) {
    console.error(`  ${v.name}: source clone not found at ${src} — cannot test`);
    process.exit(2);
  }

  // 0 — the unmodified pair
  const okRun = run(v.script, [src]);
  expect(`${v.name}: unmodified pair`, okRun.code, 0);

  // 1 — corrupted released data, on a disposable copy
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `contract-${v.name}-`));
  const copy = v.dataFlag ? tmp : path.join(tmp, v.data);
  fs.mkdirSync(path.dirname(copy), { recursive: true });
  fs.cpSync(v.data, copy, { recursive: true });
  const needle = v.corrupt(copy);
  const bad = v.dataFlag
    ? run(v.script, [src, ...v.dataFlag(copy)])
    : run(v.script, [src], tmp);
  expect(`${v.name}: corrupted data`, bad.code, 1);
  checks++;
  if (!bad.out.includes(needle)) {
    failures.push(`${v.name}: corrupted data — message did not name the difference (expected "${needle}")`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });

  // 2 — missing source clone
  expect(`${v.name}: missing source`, run(v.script, [path.join(os.tmpdir(), "definitely-not-here")]).code, 2);

  // 2 — no argument
  const noArg = run(v.script, []);
  expect(`${v.name}: no argument`, noArg.code, 2);
  checks++;
  if (!/usage:/i.test(noArg.out)) failures.push(`${v.name}: no argument — did not print usage`);

  // the released data must be untouched by this test
  checks++;
  const dirty = spawnSync("git", ["status", "--porcelain", v.data], { encoding: "utf8" }).stdout.trim();
  if (dirty) failures.push(`${v.name}: the test modified ${v.data}\n      ${dirty}`);

  console.log(`  ${v.name}: 0 ✓  1 ✓  2 (missing) ✓  2 (no arg) ✓`);
}

if (pending.length) {
  console.log(`\n  pending migration (docs/VALIDATOR_CONTRACT.md):`);
  for (const f of pending.sort()) console.log(`    · ${f}`);
}

console.log(`\n  ${checks} checks · ${checks - failures.length} passed · ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error("  ✗ " + f);
  console.error("");
  process.exit(1);
}
console.log("  VALIDATOR CONTRACT UPHELD\n");
