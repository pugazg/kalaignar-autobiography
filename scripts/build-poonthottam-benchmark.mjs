// Build-time staging for Phase 3 Benchmark #2 only.
//
// This is intentionally NOT a generalized ingestion framework. It creates detached, shallow
// checkouts at the two exact benchmark source commits, runs the work-specific Poonthottam
// importer/validator plus the existing Udhaya Kathir regression validator, and removes the
// temporary source trees. The generated reader JSON is local static build output; production
// never calls GitHub at runtime.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const PUBLIC_COMMIT = "c8abf95834e1d2549644e3607be3dd6f87b802c2";
const ASSEMBLY_COMMIT = "b1b82402642d8f2cf36927d4752c8e7d28142fdd";
const root = process.cwd();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "phase3-poonthottam-"));

function run(cmd, args, options = {}) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd: root, stdio: "inherit", ...options });
}

function checkout(name, repoUrl, commit) {
  const dir = path.join(tmp, name);
  fs.mkdirSync(dir, { recursive: true });
  run("git", ["init", "-q", dir]);
  run("git", ["-C", dir, "remote", "add", "origin", repoUrl]);
  run("git", ["-C", dir, "fetch", "-q", "--depth=1", "origin", commit]);
  run("git", ["-C", dir, "checkout", "-q", "--detach", "FETCH_HEAD"]);
  const head = execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (head !== commit) throw new Error(`${name}: expected ${commit}, got ${head}`);
  return dir;
}

try {
  const publicRepo = checkout(
    "public-speeches",
    "https://github.com/pugazg/kalaignar-public-speeches.git",
    PUBLIC_COMMIT,
  );
  const assemblyRepo = checkout(
    "assembly-speeches",
    "https://github.com/pugazg/kalaignar-assembly-speeches.git",
    ASSEMBLY_COMMIT,
  );

  run(process.execPath, ["scripts/import-poonthottam.mjs", publicRepo, PUBLIC_COMMIT]);
  run(process.execPath, ["scripts/validate-poonthottam.mjs", publicRepo]);
  run(process.execPath, ["scripts/validate-udhaya-kathir.mjs", assemblyRepo]);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
