// Wave 7 Batch 1 (Cinema) — INDEPENDENT source-pinned, fail-closed validator.
//
//   node scripts/validate-wave7-b1-cinema.mjs <path-to-kalaignar-cinema-works-clone>
//
// It does NOT import scripts/import-wave7-b1-cinema.mjs. It independently re-reads the pinned source and
// the vendored payloads and proves, per work: (1) the clone is at the frozen commit + tree + workTree;
// (2) the source reading-room.json's SHA equals the source manifest's own declared output SHA (source is
// internally consistent); (3) the vendored public/data/cinema/<slug>/reader.json is byte-identical to the
// pinned source reading-room.json; (4) provenance.json records the correct pins, payload SHA/bytes, title,
// kind, hidden flags; (5) the source manifest checkpoint counts match the frozen manifest + reader.json.
// Contract: exit 0 all-pass, exit 1 a proven difference, exit 2 an unusable source clone.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(path.join(SRC, "works"))) { console.error("usage: node scripts/validate-wave7-b1-cinema.mjs <cinema-works clone>"); process.exit(2); }
const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave7/b1-cinema.json"), "utf8"));
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
let checks = 0; const fail = [];
const ok = (c, l) => { checks++; if (!c) fail.push(l); };
const eq = (a, b, l) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`); };
let git;
try { git = (...a) => execFileSync("git", ["-C", SRC, ...a], { encoding: "utf8" }).trim(); git("rev-parse", "HEAD"); }
catch { console.error("source clone is not a usable git checkout"); process.exit(2); }

// ── Source-pin integrity ──────────────────────────────────────────────────────────────────────────
eq(git("rev-parse", "HEAD"), manifest.sourceCommit, "source clone HEAD == frozen sourceCommit");
eq(git("rev-parse", "HEAD^{tree}"), manifest.sourceTree, "source clone tree == frozen sourceTree");
eq(manifest.workCount, 3, "manifest declares exactly 3 works");
eq(manifest.works.length, 3, "manifest lists exactly 3 works");
eq(manifest.discoverable === false && manifest.sitemapExposed === false && manifest.publicRoutesP1 === 0, true, "manifest records the hidden P1 intent");

const findDeclared = (man) => { const s = new Set(); const walk = (n) => { if (!n || typeof n !== "object") return; if (typeof n.path === "string" && n.path.endsWith("reading-room.json") && typeof n.sha256 === "string") s.add(n.sha256); for (const v of Object.values(n)) walk(v); }; walk(man); return s; };

for (const w of manifest.works) {
  // work subtree pin
  eq(git("rev-parse", `HEAD:${w.sourcePath}`), w.workTree, `${w.slug}: work subtree == frozen workTree`);
  const rrAbs = path.join(SRC, w.readingRoom.path);
  ok(fs.existsSync(rrAbs), `${w.slug}: source reading-room.json present`);
  if (!fs.existsSync(rrAbs)) continue;
  const srcBytes = fs.readFileSync(rrAbs);
  const srcSha = sha256(srcBytes);
  // (2) source internal consistency
  const srcMan = JSON.parse(fs.readFileSync(path.join(path.dirname(rrAbs), "manifest.json"), "utf8"));
  ok(findDeclared(srcMan).has(srcSha), `${w.slug}: source manifest self-declares its reading-room.json SHA`);
  // frozen expectation
  eq(srcSha, w.readingRoom.sha256, `${w.slug}: source reading-room.json SHA == frozen manifest SHA`);
  eq(srcBytes.length, w.readingRoom.bytes, `${w.slug}: source reading-room.json bytes == frozen`);
  // (3) vendored payload byte-identical to source
  const vendAbs = path.join(root, "public/data/cinema", w.slug, "reader.json");
  ok(fs.existsSync(vendAbs), `${w.slug}: vendored reader.json present`);
  if (fs.existsSync(vendAbs)) {
    const vend = fs.readFileSync(vendAbs);
    eq(sha256(vend), srcSha, `${w.slug}: vendored reader.json is byte-identical to the pinned source payload`);
  }
  // (4) provenance correctness
  const prov = JSON.parse(fs.readFileSync(path.join(root, "public/data/cinema", w.slug, "provenance.json"), "utf8"));
  eq(prov.slug, w.slug, `${w.slug}: provenance slug`);
  eq([prov.sourceCommit, prov.repoTree, prov.workTree], [manifest.sourceCommit, manifest.sourceTree, w.workTree], `${w.slug}: provenance pins`);
  eq(prov.readingRoomPayloadSha256, w.readingRoom.sha256, `${w.slug}: provenance payload SHA`);
  eq(prov.source.scanSha256, w.sourceScanSha256, `${w.slug}: provenance controlling-scan SHA`);
  eq([prov.title.ta, prov.title.en, prov.kind], [w.titleTa, w.titleEn, w.kind], `${w.slug}: provenance title/kind`);
  eq(prov.hidden.discoverable === false && prov.hidden.sitemapExposed === false && prov.hidden.publicRoute === false, true, `${w.slug}: provenance hidden flags`);
  // (5) counts consistency (frozen manifest counts appear in the source manifest checkpoint)
  const cp = srcMan.checkpoint ?? srcMan;
  for (const [k, v] of Object.entries(w.counts)) {
    const sv = cp[k] ?? srcMan[k];
    ok(sv === v || (Array.isArray(sv) && sv.length === v), `${w.slug}: count ${k}=${v} matches source manifest`);
  }
}

if (fail.length) {
  console.error(`\nwave7-b1-cinema — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b1-cinema — ${checks} checks, 0 failed`);
console.log(`  3 cinema works vendored byte-identical from the pinned source (${manifest.sourceCommit.slice(0, 10)}); provenance + counts + pins verified; still hidden`);
