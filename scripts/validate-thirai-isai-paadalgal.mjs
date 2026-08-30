// Validator for கலைஞர் திரை இசைப் பாடல்கள் — Digital Library Cinema (Phase E1).
//
//   node scripts/validate-thirai-isai-paadalgal.mjs <kalaignar-cinema-works-clone>
//
// This proves the released website data is a faithful, deterministic projection of
// the PINNED archive. It does not — and cannot — prove the controlling scan
// visually: that adjudication happened upstream and is recorded there. What this
// asserts is parity with the published source at one exact commit.
//
// The pin is read FROM THE RELEASED DATA, never hardcoded here, so the validator
// cannot drift into checking a different tree than the one the data claims.
//
// The assertion this work exists to protect: AUTHORSHIP CERTAINTY AND DISPLAY
// ELIGIBILITY ARE INDEPENDENT. They are recomputed separately below from the
// archive's own contract, and a record that conflates them fails.
//
// The second thing it protects is the public/internal boundary. Everything under
// Next.js `public/` is a served static asset, so archival provenance kept there
// is publicly fetchable however it is labelled. Provenance therefore lives under
// data/internal/, and this validator fails if any of it reappears in the served
// tree — by file, by key, or by value.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  // Exit 2, not 1: no source clone means the check could not run, which is a
  // different fact from the released data being wrong. See docs/VALIDATOR_CONTRACT.md.
  console.error(
    "\nthirai-isai-paadalgal — CANNOT VALIDATE\n\n  usage: node scripts/validate-thirai-isai-paadalgal.mjs <kalaignar-cinema-works-clone>\n",
  );
  process.exit(2);
}

const SLUG = "thirai-isai-paadalgal";
const WORK_ID = "kalaignar-thirai-isai-paadalgal";
const WORK_DIR = path.join(SRC_REPO, "works", WORK_ID);
const DATA = path.join(process.cwd(), "public/data/cinema", SLUG);
const INTERNAL = path.join(process.cwd(), "data/internal", SLUG);
const INTERNAL_PROVENANCE = path.join(INTERNAL, "provenance.json");
const nfc = (s) => s.normalize("NFC");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const pad3 = (n) => String(n).padStart(3, "0");

let pass = 0;
const failures = [];
const check = (label, ok) => (ok ? pass++ : failures.push(label));
const eq = (label, actual, expected) =>
  check(`${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`, actual === expected);
const deepEq = (label, actual, expected) =>
  check(
    `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`,
    JSON.stringify(actual) === JSON.stringify(expected),
  );

const cannot = (msg) => {
  console.error(`\n${SLUG} — CANNOT VALIDATE\n\n  ${msg}\n`);
  process.exit(2);
};

if (!fs.existsSync(DATA)) cannot(`generated public data missing at ${DATA}`);
if (!fs.existsSync(path.join(DATA, "index.json"))) cannot("generated index.json is missing");
if (!fs.existsSync(INTERNAL_PROVENANCE)) cannot(`internal provenance missing at ${INTERNAL_PROVENANCE}`);
let prov, index;
try {
  prov = readJSON(INTERNAL_PROVENANCE);
  index = readJSON(path.join(DATA, "index.json"));
} catch (e) {
  cannot(`released data is unparseable: ${e.message}`);
}
const PIN = prov.sourceCommit;
if (!PIN) cannot("released provenance records no sourceCommit");

// The clone must be AT the pin. Never fall back to whatever `main` happens to be.
let head;
try {
  head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch {
  cannot(`${SRC_REPO} is not a git clone`);
}
if (head !== PIN) {
  cannot(
    `clone is at ${head} but the released data pins ${PIN}\n` +
      `  run: git -C ${SRC_REPO} fetch origin ${PIN} && git -C ${SRC_REPO} checkout ${PIN}`,
  );
}
if (!fs.existsSync(WORK_DIR)) cannot(`the pinned clone has no ${WORK_DIR}`);

const REL = {
  payload: `works/${WORK_ID}/integrations/reading-room/reading-room.json`,
  manifest: `works/${WORK_ID}/integrations/reading-room/manifest.json`,
  contract: `works/${WORK_ID}/authorship/public-inclusion.json`,
  songIndex: `works/${WORK_ID}/songs/index.json`,
};
for (const [k, rel] of Object.entries(REL)) {
  if (!fs.existsSync(path.join(SRC_REPO, rel))) cannot(`the pinned clone is missing ${k}: ${rel}`);
}
let payload, srcManifest, contract, songIndex;
try {
  payload = readJSON(path.join(SRC_REPO, REL.payload));
  srcManifest = readJSON(path.join(SRC_REPO, REL.manifest));
  contract = readJSON(path.join(SRC_REPO, REL.contract));
  songIndex = readJSON(path.join(SRC_REPO, REL.songIndex));
} catch (e) {
  cannot(`a pinned source input is unparseable: ${e.message}`);
}
if (!contract.public_authorship_notices) cannot("the pinned contract no longer records public authorship notices");

// ── source pins ───────────────────────────────────────────────────────────────
const payloadSha = sha256(fs.readFileSync(path.join(SRC_REPO, REL.payload)));
eq("released data pins the archive's Reading Room payload", prov.integrity.readingRoomPayloadSha256, payloadSha);
const manifestOut = (srcManifest.outputs || []).find((o) => o.path === REL.payload);
eq("the source manifest records that payload hash", manifestOut?.sha256, payloadSha);
eq("the source integration manifest is complete-verified", srcManifest.status, "payload-complete-verified");
eq("the archive still reports the site has not applied the payload", srcManifest.site_application_status, "not-applied");
eq("released data pins the controlling scan hash", prov.integrity.sourceScanSha256, payload.work.source_sha256);
eq("released data pins the 1989 witness hash", prov.source.earlierWitness.sha256, contract.witness_sha256.TVA_BOK_0065773);
eq(
  "released data pins the evidence-register hash the contract was derived from",
  prov.authorshipContract.evidenceRegisterSha256,
  contract.evidence_register_sha256,
);
eq(
  "released data pins the source-main sha the gate was adjudicated against",
  prov.authorshipContract.sourceMainShaAtAdjudication,
  contract.source_main_sha,
);

// The byte aggregate is recomputed here, not trusted from the released file.
const inputRels = [...prov.integrity.sourceInputPaths].sort();
deepEq("the recorded input set is the four consumed source files", inputRels, Object.values(REL).sort());
const agg = crypto.createHash("sha256");
for (const rel of inputRels) {
  agg.update(Buffer.from(rel, "utf8"));
  agg.update(Buffer.from([0]));
  agg.update(fs.readFileSync(path.join(SRC_REPO, rel)));
  agg.update(Buffer.from([0]));
}
eq("source input byte aggregate matches the pinned tree", prov.integrity.sourceInputAggregateSha256, agg.digest("hex"));
eq("input file count matches", prov.integrity.sourceInputFiles, inputRels.length);

// ── census ────────────────────────────────────────────────────────────────────
const srcFilms = payload.films;
const srcSongs = [];
for (const f of srcFilms) for (const s of f.songs) srcSongs.push({ f, s });
const srcLines = srcSongs.reduce((t, { s }) => t + s.sections.reduce((u, sec) => u + sec.lines.length, 0), 0);
const srcCross = srcSongs.filter(({ s }) => s.provenance.pdf_pages.length > 1).map(({ s }) => s.anthology_song_number).sort((a, b) => a - b);

eq("film count matches the archive", index.counts.films, srcFilms.length);
eq("song count matches the archive", index.counts.songs, srcSongs.length);
eq("line-cue count matches the archive", index.counts.lineCues, srcLines);
eq("cross-page song count matches the archive", index.counts.crossPageSongs, srcCross.length);
eq("the archive's own film census agrees", payload.work.counts.films, index.counts.films);
eq("the archive's own song census agrees", payload.work.counts.songs, index.counts.songs);
eq("the archive's own line-cue census agrees", payload.work.counts.line_cues, index.counts.lineCues);
eq("the archive's own cross-page census agrees", payload.work.counts.cross_page_songs, index.counts.crossPageSongs);
eq("released films array length matches the census", index.films.length, index.counts.films);
eq("released songs array length matches the census", index.songs.length, index.counts.songs);
// Per-song cross-page state is no longer served, so it is proved from the
// internal provenance. The aggregate count stays public as part of the census.
deepEq(
  "cross-page song numbers match the archive",
  (prov.songs || []).filter((s) => s.crossPage).map((s) => s.songNumber).sort((a, b) => a - b),
  srcCross,
);
check("no served record carries per-song cross-page state", !JSON.stringify(index).includes("crossPage\":"));

const srcBySong = new Map(srcSongs.map(({ f, s }) => [s.song_id, { f, s }]));
const provBySong = new Map((prov.songs || []).map((s) => [s.songId, s]));

// ── corpus identity ───────────────────────────────────────────────────────────
const numbers = index.songs.map((s) => s.songNumber).sort((a, b) => a - b);
deepEq("songs 001-054 are each present exactly once", numbers, Array.from({ length: 54 }, (_, i) => i + 1));
check("no duplicate song ids", new Set(index.songs.map((s) => s.songId)).size === index.songs.length);
check("no duplicate song slugs", new Set(index.songs.map((s) => s.slug)).size === index.songs.length);
check("no duplicate film ids", new Set(index.films.map((f) => f.filmId)).size === index.films.length);
check(
  "every song id is canonical for its number",
  index.songs.every((s) => s.songId === `kalaignar-song-${pad3(s.songNumber)}`),
);
// No editorial-only pseudo-song. The censor-blocked front-matter incipit has no
// numbered lyric body and must never appear as a 55th record.
check(
  "no editorial-only pseudo-song was imported",
  !index.songs.some((s) => s.titleTa.includes("ஆளப்பிறந்தவன்")),
);

// Film grouping and ordering are the archive's, not ours.
deepEq(
  "film grouping and order match the archive",
  index.films.map((f) => [f.ordinal, f.titleTa, f.yearPrinted, f.songCount]),
  [...srcFilms].sort((a, b) => a.film_ordinal - b.film_ordinal).map((f) => [f.film_ordinal, f.title_ta, f.year_printed, f.songs.length]),
);
check(
  "every film's song slugs are its own songs in ascending anthology order",
  index.films.every((f) => {
    const own = index.songs.filter((s) => s.filmId === f.filmId).sort((a, b) => a.songNumber - b.songNumber);
    return JSON.stringify(f.songSlugs) === JSON.stringify(own.map((s) => s.slug)) && own.length === f.songCount;
  }),
);
eq("every song belongs to a released film", index.songs.filter((s) => !index.films.some((f) => f.filmId === s.filmId)).length, 0);
check("no English film title is invented", index.films.every((f) => f.titleEn === null));

// ── authorship, recomputed from the archive's contract ────────────────────────
const established = new Set(contract.established_kalaignar_song_ids);
const unresolved = new Set(contract.unresolved_authorship_song_ids);
const displayable = new Set(contract.displayable_song_ids);
const noticeReq = new Set(contract.authorship_notice_required_song_ids);

eq("established count matches the archive contract", index.authorship.established, contract.decision_counts["established-kalaignar"]);
eq("unresolved count matches the archive contract", index.authorship.unresolved, contract.decision_counts["unresolved"]);
eq("the archive declares no established-other song", contract.decision_counts["established-other"], 0);
eq("the archive declares no insufficient-evidence song", contract.decision_counts["insufficient-evidence"], 0);
eq("the archive declares no material conflict", contract.material_conflicts, 0);
eq("released established count is 48", index.authorship.established, 48);
eq("released unresolved count is 6", index.authorship.unresolved, 6);
eq("released displayable count matches the archive contract", index.authorship.displayable, contract.songs_displayable);
eq("released displayable count is 54", index.authorship.displayable, 54);
eq("positive-claim allowance equals the established count", index.authorship.publicAuthorshipClaimAllowed, 48);
eq("notice-required count matches the archive contract", index.authorship.authorshipNoticeRequired, contract.songs_authorship_notice_required);

deepEq(
  "unresolved song numbers are exactly 013-018",
  index.songs.filter((s) => s.authorshipDecision === "unresolved").map((s) => s.songNumber).sort((a, b) => a - b),
  [13, 14, 15, 16, 17, 18],
);
deepEq(
  "notice-required song numbers are exactly 013-018",
  index.songs.filter((s) => s.authorshipNoticeRequired).map((s) => s.songNumber).sort((a, b) => a - b),
  [13, 14, 15, 16, 17, 18],
);
eq("every released song's decision matches the archive contract",
  index.songs.filter((s) => s.authorshipDecision !== (established.has(s.songId) ? "established-kalaignar" : "unresolved")).length, 0);
eq("every released song's display flag matches the archive contract",
  index.songs.filter((s) => s.publicDisplay !== displayable.has(s.songId)).length, 0);
eq("every released song's authorship claim matches the archive contract",
  index.songs.filter((s) => s.publicAuthorshipClaim !== established.has(s.songId)).length, 0);
eq("every released song's notice flag matches the archive contract",
  index.songs.filter((s) => s.authorshipNoticeRequired !== noticeReq.has(s.songId)).length, 0);

// The separation itself, asserted directly rather than inferred from counts.
eq("all 54 songs are displayable", index.songs.filter((s) => s.publicDisplay).length, 54);
eq("no unresolved song carries a positive Kalaignar-authorship claim",
  index.songs.filter((s) => s.authorshipDecision === "unresolved" && s.publicAuthorshipClaim).length, 0);
eq("every unresolved song is still displayed", index.songs.filter((s) => s.authorshipDecision === "unresolved" && !s.publicDisplay).length, 0);
eq("every unresolved song requires the notice", index.songs.filter((s) => s.authorshipDecision === "unresolved" && !s.authorshipNoticeRequired).length, 0);
eq("no established song requires the unresolved notice",
  index.songs.filter((s) => s.authorshipDecision === "established-kalaignar" && s.authorshipNoticeRequired).length, 0);
eq("every song claiming Kalaignar authorship is established",
  index.songs.filter((s) => s.publicAuthorshipClaim && s.authorshipDecision !== "established-kalaignar").length, 0);
// There is no negative-authorship state in this model, and none may be introduced.
check("no released song carries a negative-authorship decision",
  index.songs.every((s) => ["established-kalaignar", "unresolved"].includes(s.authorshipDecision)));
eq("song 012 is established", index.songs.find((s) => s.songNumber === 12)?.authorshipDecision, "established-kalaignar");
eq("song 012 carries no unresolved notice", index.songs.find((s) => s.songNumber === 12)?.authorshipNoticeRequired, false);

// ── notice group ──────────────────────────────────────────────────────────────
const srcNotices = contract.public_authorship_notices;
eq("the archive declares exactly one notice group", srcNotices.length, 1);
eq("released data carries exactly one notice group", index.notices.length, 1);
const n0 = index.notices[0];
const s0 = srcNotices[0];
eq("notice group id matches the archive", n0.groupId, s0.group_id);
eq("notice group id is ammayappan-unresolved", n0.groupId, "ammayappan-unresolved");
eq("notice film matches the archive", n0.filmTa, s0.film);
eq("notice status matches the archive", n0.status, s0.status);
deepEq("notice song ids match the archive", [...n0.songIds].sort(), [...s0.song_ids].sort());
deepEq("notice song ids are exactly 013-018", [...n0.songIds].sort(), [13, 14, 15, 16, 17, 18].map((i) => `kalaignar-song-${pad3(i)}`));
eq("the Tamil notice is imported verbatim", nfc(n0.noticeTa), nfc(s0.notice_ta));
eq("the English notice is imported verbatim", nfc(n0.noticeEn), nfc(s0.notice_en));
check("the Tamil notice is non-empty", typeof n0.noticeTa === "string" && n0.noticeTa.trim().length > 0);
check("the English notice is non-empty", typeof n0.noticeEn === "string" && n0.noticeEn.trim().length > 0);
check(
  "every notice-required song references the notice group",
  index.songs.filter((s) => s.authorshipNoticeRequired).every((s) => s.noticeGroupId === n0.groupId),
);
check(
  "no song outside the group references it",
  index.songs.filter((s) => s.noticeGroupId !== null).every((s) => s.authorshipNoticeRequired),
);
deepEq("the notice's song slugs resolve to released songs", n0.songSlugs, index.songs.filter((s) => s.authorshipNoticeRequired).map((s) => s.slug));

// ── per-song text parity ──────────────────────────────────────────────────────
let tamilDrift = 0, englishDrift = 0, orderDrift = 0, pageDrift = 0, missing = 0, lineIdDrift = 0, sectionLabelDrift = 0;
let releasedLines = 0;
for (const summary of index.songs) {
  const file = path.join(DATA, "songs", `${summary.slug}.json`);
  if (!fs.existsSync(file)) { missing++; continue; }
  const rec = readJSON(file);
  const src = srcBySong.get(summary.songId);
  if (!src) { missing++; continue; }
  const { f, s } = src;

  if (rec.titleTa !== s.titles.tamil) tamilDrift++;
  if (rec.titleEn !== s.titles.english) englishDrift++;
  if (rec.filmTitleTa !== f.title_ta || rec.yearPrinted !== f.year_printed) tamilDrift++;
  // Page linkage moved OUT of the served payload, so it is proved against the
  // internal provenance instead. Moving it must not weaken the check.
  const ip = provBySong.get(summary.songId);
  if (!ip) { missing++; continue; }
  if (JSON.stringify(ip.pdfPages) !== JSON.stringify(s.provenance.pdf_pages)) pageDrift++;
  if (ip.sectionPdfPages !== s.provenance.section_pdf_pages) pageDrift++;
  if (ip.crossPage !== (s.provenance.pdf_pages.length > 1)) pageDrift++;
  if (ip.contentsTitleTa !== s.titles.contents_tamil) tamilDrift++;

  if (rec.sections.length !== s.sections.length) { orderDrift++; continue; }
  for (let i = 0; i < s.sections.length; i++) {
    const a = rec.sections[i], b = s.sections[i];
    if (a.ordinal !== b.ordinal) orderDrift++;
    if (a.sourceLabelTa !== b.source_label || a.labelEn !== b.english_label) sectionLabelDrift++;
    if (a.lines.length !== b.lines.length) { orderDrift++; continue; }
    for (let j = 0; j < b.lines.length; j++) {
      releasedLines++;
      if (a.lines[j].tamil !== b.lines[j].tamil) tamilDrift++;
      if (a.lines[j].english !== b.lines[j].english) englishDrift++;
      if (a.lines[j].id !== b.lines[j].id) lineIdDrift++;
    }
  }
  // Authorship must agree between the index summary and the song record.
  if (rec.authorship.decision !== summary.authorshipDecision) orderDrift++;
  if (rec.authorship.publicAuthorshipClaim !== summary.publicAuthorshipClaim) orderDrift++;
}
eq("every released song has a lyric file", missing, 0);
eq("released Tamil text matches the archive exactly", tamilDrift, 0);
eq("released English text matches the archive exactly", englishDrift, 0);
eq("released line ids match the archive exactly", lineIdDrift, 0);
eq("released section labels match the archive exactly", sectionLabelDrift, 0);
eq("released section and line ordering matches the archive", orderDrift, 0);
eq("released source-page linkage matches the archive", pageDrift, 0);
eq("released lyric lines total the archive's line-cue census", releasedLines, srcLines);
eq("the songs directory holds exactly 54 files", fs.readdirSync(path.join(DATA, "songs")).filter((f) => f.endsWith(".json")).length, 54);

// ── settled source readings ───────────────────────────────────────────────────
const byNum = new Map(index.songs.map((s) => [s.songNumber, s]));
for (const [num, title] of Object.entries({
  4: "மாரி மகமாயி மாரி மகமாயி",
  7: "பேசும் யாழே பெண் மானே",
  8: "வருவாய் வருவாய்...",
  14: "காதல் துறையே புதுமைக் கனவே",
  15: "காதல் துறையே புதுமைக் கனவே (சோகம்)",
})) {
  eq(`song ${num} keeps its settled printed title`, nfc(byNum.get(Number(num))?.titleTa || ""), nfc(title));
}
eq("film 1 keeps the section-heading grouping label", index.films[0].titleTa, "மந்திரிகுமாரி");
eq("provenance records the preserved lyric-page variant", prov.settledSourceReadings.film001LyricPageVariant, "மந்திரி குமாரி");
check(
  "the archive still records that variant for song 001",
  (songIndex.records.find((r) => r.anthology_song_number === 1)?.notes || []).join(" ").includes("மந்திரி குமாரி"),
);

// ── archival attribution is untouched ─────────────────────────────────────────
eq("the archive still carries anthology-attributed as its default", payload.work.default_attribution_status, "anthology-attributed");
eq("the contract still records anthology-attributed", contract.archival_attribution_status, "anthology-attributed");
eq("all 54 archive records remain anthology-attributed",
  srcSongs.filter(({ s }) => s.attribution_status !== "anthology-attributed").length, 0);
// The archival status is a source fact, not reader content: it must not leak
// into the runtime model, where it would read as an authorship finding.
check("no runtime record carries the archival attribution status", !JSON.stringify(index).includes("anthology-attributed"));

// ── English provenance ────────────────────────────────────────────────────────
eq("English provenance is recorded as project-created", prov.english.kind, "project-created");
check("English is not presented as a published or official translation",
  !/published translation|official translation|source witness/i.test(prov.english.kindBasis.replace(/is not a[^.]*/i, "")));
// Compared as sorted entries: these are counts, and JSON key order is not a fact
// about them. A key-order-sensitive comparison here would fail on a reordering
// that changed nothing.
const sortedEntries = (o) => Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
deepEq(
  "English item-status counts match the archive",
  sortedEntries(prov.english.itemStatusCounts),
  sortedEntries(srcSongs.reduce((acc, { s }) => ((acc[s.item_status] = (acc[s.item_status] || 0) + 1), acc), {})),
);

// ── public/internal boundary ──────────────────────────────────────────────────
// The reviewed blocker: archival provenance under `public/` is a served asset and
// is fetchable however it is labelled. These assertions are the boundary.
const publicFiles = fs
  .readdirSync(DATA, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith(".json"));
check("no provenance.json exists anywhere in the served tree", !publicFiles.some((f) => f.endsWith("provenance.json")));
eq("the served tree holds exactly 55 JSON files", publicFiles.length, 55);
eq("the served tree holds exactly 54 song files", publicFiles.filter((f) => f.includes("songs")).length, 54);
check("internal provenance lives outside public/", !path.resolve(INTERNAL_PROVENANCE).includes(`${path.sep}public${path.sep}`));
check("internal provenance is plain JSON, not an importable module", INTERNAL_PROVENANCE.endsWith(".json"));

// Value-level audit. Lyric text is never searched for ordinary words: each needle
// below is an identifier, hash, path or archival term that cannot occur in a lyric.
const publicBlob = publicFiles.map((f) => readText(path.join(DATA, f))).join("\n");
for (const [label, needle] of [
  ["the source repository", "pugazg/kalaignar-cinema-works"],
  ["the controlling scan identifier", "TVA_BOK_0065867"],
  ["the 1989 witness identifier", "TVA_BOK_0065773"],
  ["the controlling scan hash", prov.integrity.sourceScanSha256],
  ["the 1989 witness hash", prov.source.earlierWitness.sha256],
  ["the evidence-register hash", prov.authorshipContract.evidenceRegisterSha256],
  ["the source-input aggregate", prov.integrity.sourceInputAggregateSha256],
  ["the source commit", prov.sourceCommit],
  ["the archival attribution status", "anthology-attributed"],
  ["an item verification state", "pilot-verified"],
  ["archive source paths", "works/kalaignar-thirai-isai-paadalgal/"],
  ["the compiler", "நெல்லை ஜெயந்தா"],
  ["the publisher", "தமிழ்நாடு இயல் இசை நாடக மன்றம்"],
  ["the ISBN", "978-81-961205-2-8"],
]) {
  check(`served data exposes no ${label}`, !publicBlob.includes(needle));
}
// Key-level audit, so a renamed value cannot smuggle the same fact through.
for (const key of [
  "pdfPages",
  "sectionPdfPages",
  "creditsAsPrinted",
  "tamilSourcePath",
  "englishSourcePath",
  "sourceCommit",
  "sourceScanSha256",
  "evidenceRegisterSha256",
  "sourceInputAggregateSha256",
  "itemStatus",
  "attributionStatus",
  "sourcePages",
  "contentsTitleTa",
]) {
  check(`served data carries no ${key} key`, !publicBlob.includes(`"${key}"`));
}
// Music and voice credits, checked by their actual printed values rather than by
// key name, since a leak could arrive under any label.
const creditValues = new Set();
for (const s of prov.songs) {
  if (s.creditsAsPrinted?.music) creditValues.add(s.creditsAsPrinted.music);
  if (s.creditsAsPrinted?.voice) creditValues.add(s.creditsAsPrinted.voice);
}
check("served data exposes no music or voice credit", ![...creditValues].some((v) => publicBlob.includes(v)));
eq("credit values were actually checked", creditValues.size > 0, true);

// ── internal provenance completeness ─────────────────────────────────────────
// Proves the archival material was MOVED, not lost.
check("internal provenance keeps the source repo and path", prov.sourceRepo === "pugazg/kalaignar-cinema-works" && typeof prov.sourcePath === "string");
check("internal provenance keeps the source commit", prov.sourceCommit === PIN);
check("internal provenance keeps the controlling scan hash", prov.integrity.sourceScanSha256 === payload.work.source_sha256);
check("internal provenance keeps the 1989 witness hash", prov.source.earlierWitness.sha256 === contract.witness_sha256.TVA_BOK_0065773);
check("internal provenance keeps the evidence-register hash", prov.authorshipContract.evidenceRegisterSha256 === contract.evidence_register_sha256);
check("internal provenance keeps the source-input aggregate and paths", typeof prov.integrity.sourceInputAggregateSha256 === "string" && Array.isArray(prov.integrity.sourceInputPaths));
eq("internal provenance holds all 54 song records", (prov.songs || []).length, 54);
// Nine songs print no singer, so `voice` is null upstream. Absent metadata is
// preserved as absent, never fabricated — so this compares to the source rather
// than demanding a string.
eq(
  "internal provenance keeps every music and voice credit exactly as printed",
  prov.songs.filter((s) => {
    const src = srcBySong.get(s.songId)?.s.credits_as_printed;
    return !src || s.creditsAsPrinted?.music !== src.music || s.creditsAsPrinted?.voice !== src.voice;
  }).length,
  0,
);
check(
  "the printed-credit absences upstream are preserved as null, not invented",
  prov.songs.filter((s) => s.creditsAsPrinted.voice === null).length ===
    srcSongs.filter(({ s }) => s.credits_as_printed.voice === null).length,
);
check("internal provenance keeps every archive source path", prov.songs.every((s) => typeof s.tamilSourcePath === "string" && typeof s.englishSourcePath === "string"));
check("internal provenance keeps every page mapping", prov.songs.every((s) => Array.isArray(s.pdfPages) && typeof s.sectionPdfPages === "string" && typeof s.crossPage === "boolean"));
check("internal provenance keeps every item verification state", prov.songs.every((s) => typeof s.itemStatus === "string"));
check("internal provenance keeps every archival attribution status", prov.songs.every((s) => s.attributionStatus === "anthology-attributed"));
eq("internal cross-page count matches the archive", prov.songs.filter((s) => s.crossPage).length, srcCross.length);
eq("internal provenance records the reader structure as film-song", prov.publicSurfacePolicy.readerStructure, "film-song");
check("internal provenance records what was withheld from the served tree", Array.isArray(prov.publicSurfacePolicy.withheldFromPublicRuntime) && prov.publicSurfacePolicy.withheldFromPublicRuntime.length > 0);
check("internal provenance keeps the archive's own navigation wording", typeof prov.publicSurfacePolicy.navigationAsPublished?.filmOrder === "string");
eq("released index declares the film-song reader structure", index.readerStructure, "film-song");

// ── publication posture ───────────────────────────────────────────────────────
// E1 deliberately ships data without exposing the work. These assertions fail if
// a later change quietly publishes it without the reviewed route stages.
eq("released navigation uses machine order values, not the archive's prose", index.navigation.filmOrder, "source-order");
eq("released song order is a machine value", index.navigation.songOrder, "song-number");
eq("no current-day rights block is asserted", prov.rights, undefined);
check("no WorkAttribution is created", !("workAttribution" in prov) && !JSON.stringify(index).includes("WorkAttribution"));
check("no route or catalogue field is present in the released data",
  !("route" in index) && !("href" in index) && !("catalogue" in index));

console.log(`\n${SLUG} — ${pass} assertions passed, ${failures.length} failed`);
console.log(`  validated against pinned source ${PIN}`);
console.log(`  served ${publicFiles.length} JSON files · archival provenance internal at ${path.relative(process.cwd(), INTERNAL_PROVENANCE)}`);
console.log(`  ${index.counts.films} films · ${index.counts.songs} songs · ${index.counts.lineCues} line-cues · ${index.counts.crossPageSongs} cross-page`);
console.log(`  authorship ${index.authorship.established} established / ${index.authorship.unresolved} unresolved`);
console.log(`  display ${index.authorship.displayable} displayable / ${index.authorship.authorshipNoticeRequired} notice-required`);
console.log("  this proves deterministic parity with the released archive, not a visual re-reading of the scan");
if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error(" ✗ " + f);
  process.exit(1);
}
console.log("ALL PASS");
