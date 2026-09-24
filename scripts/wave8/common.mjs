// Wave 8 P1 — shared helpers for the three source-pinned importers (Murasoli 42–47, ஒரே முத்தம், சங்கத் தமிழ்).
//
// Every importer is fail-closed: the source clone must sit at the FROZEN commit and every scoped subtree must equal
// its frozen tree id before a single byte is read. Output is deterministic JSON (sorted structure is the importer's
// job; this module only serialises and hashes). Text is carried byte-for-byte as the source prints it — no Unicode
// normalisation, no whitespace rewriting beyond stripping the file's own trailing newline.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

/** The frozen Wave-8 P0 source boundary (pugazg/kalaignar-tribute WAVE8_COMPLETED_WORKS_CENSUS.md §3). */
export const WAVE8_PINS = {
  murasoli: {
    repo: "pugazg/kalaignar-murasoli-letters",
    commit: "bd0bb7904c85bdbfe05aa4970ac098d701a6967f",
    repoTree: "ff604c584ab05d0d769abe4a0c685b79a7a79e5b",
    volumes: {
      42: "0bb4cfe677badd63fb0fbf5b66ea0fae9897339d",
      43: "35162a6263ed7e9eb7aba872008f86d1d185ee2c",
      44: "b9142e10a44df2e58d365066de098ffa4a9c351d",
      45: "9efc967a226b519888fa3cf9af4eca6b8c70a5c7",
      46: "f111d393681b384aed7c288353a16931ca083fb0",
      47: "71998ba7bcc3aa0d800a44bcd89d9d61c09c7a7f",
    },
  },
  oreMutham: {
    repo: "pugazg/kalaignar-stage-plays",
    commit: "521fe5452e3e9ed54baa81e672325ce6ba501c5e",
    repoTree: "cea50efb13baf27390b794b39b76b039a9ccaead",
    workPath: "works/ore-mutham",
    workTree: "0839c6efc7bfd41fd11d30db3a46b0a2b3c901e6",
  },
  sangatamil: {
    repo: "pugazg/kalaignar-literary-commentary",
    commit: "e23548b09547a2308407e60e5e67c1a03fee5354",
    repoTree: "2302d1fc6cbe9386a8010b344a9caba2f4913fa4",
    workPath: "works/sangatamil",
    workTree: "25231d62c62e22228a248fd2976e0ee9c43939c1",
  },
};

export const die = (m) => { throw new Error(m); };
export const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

const git = (dir, ...a) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8" }).trim();

/** Fail closed unless `dir` is a clone at exactly `commit` whose repo tree and every scoped subtree match. */
export function assertPinned(dir, { commit, repoTree }, subtrees) {
  if (!dir || !fs.existsSync(dir)) die(`source clone not found: ${dir}`);
  const head = git(dir, "rev-parse", "HEAD");
  if (head !== commit) die(`${dir}: HEAD ${head} is not the frozen commit ${commit}`);
  const tree = git(dir, "rev-parse", "HEAD^{tree}");
  if (tree !== repoTree) die(`${dir}: repo tree ${tree} is not the frozen tree ${repoTree}`);
  for (const [p, want] of Object.entries(subtrees)) {
    const got = git(dir, "rev-parse", `HEAD:${p}`);
    if (got !== want) die(`${dir}: subtree ${p} is ${got}, frozen ${want}`);
  }
  // Tracked-file cleanliness: the importer reads the working tree, so it must equal the commit.
  const dirty = git(dir, "status", "--porcelain", "--untracked-files=no");
  if (dirty) die(`${dir}: working tree differs from the frozen commit:\n${dirty}`);
}

/** Read a source text file exactly (UTF-8), rejecting CR line endings rather than silently rewriting them. */
export function readSource(file) {
  const t = fs.readFileSync(file, "utf8");
  if (t.includes("\r")) die(`${file}: CR line endings present — refusing to normalise`);
  return t;
}

/** Split a `---` YAML front-matter block from the body. Returns null front matter when the file has none. */
export function splitFrontMatter(t) {
  if (!t.startsWith("---\n")) return { fm: null, body: t };
  const end = t.indexOf("\n---\n", 4);
  if (end < 0) die("unterminated front matter");
  return { fm: t.slice(4, end), body: t.slice(end + 5) };
}

/**
 * Minimal, strict YAML scalar reader for the flat front matter these archives use (`key: value`, quoted strings,
 * numbers, null, and inline `[a, b]` lists). Nested structures are not expected in the fields we read; a key we
 * need that fails to parse is a fail-closed error at the call site.
 */
export function parseFlatYaml(fm) {
  const out = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s?(.*)$/);
    if (!m) continue; // continuation / list-item lines of fields we do not consume
    out[m[1]] = scalar(m[2].trim());
  }
  return out;
}
function scalar(v) {
  if (v === "" ) return "";
  if (v === "null" || v === "~") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  if (v.startsWith("\"") && v.endsWith("\"") && v.length >= 2) return JSON.parse(v);
  if (v.startsWith("'") && v.endsWith("'") && v.length >= 2) return v.slice(1, -1).replace(/''/g, "'");
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    return inner === "" ? [] : inner.split(",").map((x) => scalar(x.trim()));
  }
  return v;
}

/** Trim leading/trailing blank lines only (interior text, spacing and hard-break spaces are untouched). */
export const trimBlankLines = (s) => s.replace(/^(?:[ \t]*\n)+/, "").replace(/(?:\n[ \t]*)+$/, "");

/** Separate standalone archival HTML comments from reading text. Returns { text, annotations }. */
export function splitComments(s) {
  const annotations = [];
  const text = s.replace(/<!--([\s\S]*?)-->/g, (_m, inner) => { annotations.push(inner.trim()); return ""; });
  return { text: text.replace(/\n{3,}/g, "\n\n"), annotations };
}

/** Deterministic pretty JSON with a trailing newline. */
export const toJson = (v) => JSON.stringify(v, null, 1) + "\n";

/** Write (or, in verify mode, compare) a generated file. Returns its sha256. */
export function emit(root, rel, content, { verify, mismatches }) {
  const abs = path.join(root, rel);
  if (verify) {
    const cur = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
    if (cur !== content) mismatches.push(rel);
  } else {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return sha256(content);
}
