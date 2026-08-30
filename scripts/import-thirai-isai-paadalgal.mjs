#!/usr/bin/env node
// Deterministic கலைஞர் திரை இசைப் பாடல்கள் import — Digital Library Phase E1.
//
// Consumes ONLY the pinned, published film-song derivatives from
// pugazg/kalaignar-cinema-works and emits the website's generated reading data.
// Nothing here reaches the network: the caller supplies a clone, and every fact
// this script asserts comes from that clone at one approved commit.
//
// Usage: node scripts/import-thirai-isai-paadalgal.mjs <clone-dir> <commit-sha>
//
// ── WHAT MAKES THIS WORK DIFFERENT ────────────────────────────────────────────
// The three cinema works already imported are single booklets with a scene or
// segment spine. This one is an anthology of 54 numbered lyrics drawn from 23
// films, so the reader spine is film → song, not scene. Two consequences must
// not be flattened:
//
//   * AUTHORSHIP CERTAINTY AND DISPLAY ELIGIBILITY ARE DIFFERENT FIELDS. All 54
//     lyrics are displayable because all 54 are the controlling source's own
//     numbered corpus. Only 48 are established as Kalaignar's. The six
//     அம்மையப்பன் lyrics 013–018 are displayable AND unresolved, and they carry
//     a source-controlled authorship notice instead of an authorship claim.
//     Collapsing these two ideas back into one boolean would either suppress six
//     source lyrics or assert six authorship claims the archive refuses to make.
//   * THE PUBLIC SURFACE IS FILM → LYRICS, NOT A BIBLIOGRAPHIC EDITION. Music and
//     voice credits, item verification states, source file paths and the scan's
//     own page numbering are archival apparatus, not reader content.
//
// ── WHY PROVENANCE IS NOT WRITTEN UNDER public/ ───────────────────────────────
// Everything under Next.js `public/` is a served static asset, so a file placed
// there is publicly fetchable whether or not any component imports it. Labelling
// such a file "build-time only" is a comment, not a boundary. The archival
// provenance for this work therefore lives OUTSIDE `public/`, under
// data/internal/, as plain JSON that only scripts read — a location no client
// bundle can reach by import. Nothing archival is lost: it is moved, and the
// validator still proves page linkage, credits and verification census against
// the pinned source from there.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-thirai-isai-paadalgal.mjs <clone-dir> <commit-sha>");
  process.exit(2);
}
const die = (m) => {
  console.error(`import-thirai-isai-paadalgal: ${m}`);
  process.exit(1);
};

// ── APPROVED PIN AND EXPECTED SOURCE FACTS ────────────────────────────────────
// Every constant below is a fact of the published archive at this commit. They
// are assertions, not configuration: if the archive changes, this importer must
// fail loudly rather than quietly emit data that claims a pin it did not match.
const APPROVED_SOURCE_COMMIT = "d6f3128381235e80891cc6647d19464b838f4103";
const EXPECT_SCAN_SHA256 = "f0beac14c33ffc73c0231bd54ca57ec4093eef6e85072bd68ce48f7b5e258b05";
const EXPECT_WITNESS_1989_SHA256 = "56d414a65a61a73b990632eadc17a3b1efdc764d47f64b851060c161a3f98e3b";
const EXPECT_PAYLOAD_SHA256 = "8ec0e25f7fc1f1a9750d370ccbef5dd07caa66629a3dfacb8425bbeebd08fcce";
const EXPECT_SOURCE_INPUT_AGGREGATE = "9d499beb2c54c692cf972e5fe269c7e7f21d3bafa07a5d4c76d2bf9acb027935";
const EXPECT_SOURCE_INPUT_FILES = 4;

const EXPECT_WORK_ID = "kalaignar-thirai-isai-paadalgal";
const EXPECT_FILMS = 23;
const EXPECT_SONGS = 54;
const EXPECT_LINE_CUES = 1105;
const EXPECT_CROSS_PAGE_SONGS = 8;
const EXPECT_CROSS_PAGE_NUMBERS = [9, 19, 23, 24, 36, 37, 51, 52];
const EXPECT_ITEM_STATUS = { verified: 51, "pilot-verified": 3 };
const EXPECT_ARCHIVAL_ATTRIBUTION = "anthology-attributed";

// The authorship/display contract, settled upstream and merged into source main.
const EXPECT_ESTABLISHED = 48;
const EXPECT_UNRESOLVED = 6;
const EXPECT_ESTABLISHED_OTHER = 0;
const EXPECT_INSUFFICIENT = 0;
const EXPECT_DISPLAYABLE = 54;
const EXPECT_NOTICE_REQUIRED = 6;
const EXPECT_UNRESOLVED_NUMBERS = [13, 14, 15, 16, 17, 18];
const EXPECT_NOTICE_GROUP_ID = "ammayappan-unresolved";
const EXPECT_NOTICE_FILM = "அம்மையப்பன்";

// Source readings settled upstream. Asserted so a later archive change cannot
// silently reintroduce a superseded form into the published website text.
const EXPECT_FILM_001_GROUPING = "மந்திரிகுமாரி";
const EXPECT_FILM_001_LYRIC_VARIANT = "மந்திரி குமாரி";
const SETTLED_TITLES = {
  4: "மாரி மகமாயி மாரி மகமாயி",
  7: "பேசும் யாழே பெண் மானே",
  8: "வருவாய் வருவாய்...",
  14: "காதல் துறையே புதுமைக் கனவே",
  15: "காதல் துறையே புதுமைக் கனவே (சோகம்)",
};
// An editorial-only item named in the 2024 front matter that has NO numbered
// lyric body. It must never become a 55th song.
const FORBIDDEN_EDITORIAL_ONLY = "ஆளப்பிறந்தவன்";

const SITE_SLUG = "thirai-isai-paadalgal";
const W = path.join(SRC_REPO, "works", EXPECT_WORK_ID);
// Public: served static assets, the film → lyrics data a reader needs.
const OUT = path.join(process.cwd(), "public/data/cinema", SITE_SLUG);
const SONG_OUT = path.join(OUT, "songs");
// Internal: never served, never importable by a client component.
const INTERNAL_OUT = path.join(process.cwd(), "data/internal", SITE_SLUG);
const INTERNAL_PROVENANCE = path.join(INTERNAL_OUT, "provenance.json");
// A stale provenance file left behind under public/ would still be fetchable, so
// the importer removes it rather than trusting that it was deleted by hand.
const LEGACY_PUBLIC_PROVENANCE = path.join(OUT, "provenance.json");

const nfc = (s) => s.normalize("NFC");
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const pad3 = (n) => String(n).padStart(3, "0");
const pad2 = (n) => String(n).padStart(2, "0");

// ── 1. PIN AND HEAD ───────────────────────────────────────────────────────────
if (SRC_COMMIT !== APPROVED_SOURCE_COMMIT) {
  die(`commit ${SRC_COMMIT} is not the approved film-song pin ${APPROVED_SOURCE_COMMIT}.`);
}
const headFile = path.join(SRC_REPO, ".git/HEAD");
if (!fs.existsSync(headFile)) die(`${SRC_REPO} is not a git clone.`);
let head = readText(headFile).trim();
if (head.startsWith("ref:")) {
  const ref = head.slice(4).trim();
  const rp = path.join(SRC_REPO, ".git", ref);
  head = fs.existsSync(rp)
    ? readText(rp).trim()
    : (readText(path.join(SRC_REPO, ".git/packed-refs")).split("\n").find((l) => l.endsWith(` ${ref}`)) || "").split(" ")[0];
}
if (head !== APPROVED_SOURCE_COMMIT) die(`clone HEAD is ${head}, expected ${APPROVED_SOURCE_COMMIT}.`);
// The aggregate below proves the bytes behind this output. That proof is only
// meaningful if the working tree is exactly the pinned commit, so a dirty clone
// is refused rather than silently hashed. The source is never mutated here.
try {
  const status = execFileSync("git", ["-C", SRC_REPO, "status", "--porcelain"], { encoding: "utf8" }).trim();
  if (status) {
    die(
      `the source clone has uncommitted changes at ${APPROVED_SOURCE_COMMIT}:\n${status}\n` +
        `Refusing to import: the byte aggregate would describe a tree that is not the pinned commit.`,
    );
  }
} catch (e) {
  if (e?.status === 1 || e?.stdout !== undefined) throw e;
  die(`could not check whether the source clone is clean: ${e.message}`);
}

// ── 2. SOURCE SURFACES ────────────────────────────────────────────────────────
const REL = {
  payload: `works/${EXPECT_WORK_ID}/integrations/reading-room/reading-room.json`,
  manifest: `works/${EXPECT_WORK_ID}/integrations/reading-room/manifest.json`,
  contract: `works/${EXPECT_WORK_ID}/authorship/public-inclusion.json`,
  songIndex: `works/${EXPECT_WORK_ID}/songs/index.json`,
};
for (const [k, rel] of Object.entries(REL)) {
  if (!fs.existsSync(path.join(SRC_REPO, rel))) die(`missing required source input (${k}): ${rel}`);
}
const payload = readJSON(path.join(SRC_REPO, REL.payload));
const srcManifest = readJSON(path.join(SRC_REPO, REL.manifest));
const contract = readJSON(path.join(SRC_REPO, REL.contract));
const songIndex = readJSON(path.join(SRC_REPO, REL.songIndex));

// Byte aggregate over the exact inputs consumed, sorted by repo-relative path.
const inputRels = Object.values(REL).sort();
const agg = crypto.createHash("sha256");
for (const rel of inputRels) {
  agg.update(Buffer.from(rel, "utf8"));
  agg.update(Buffer.from([0]));
  agg.update(fs.readFileSync(path.join(SRC_REPO, rel)));
  agg.update(Buffer.from([0]));
}
const inputAggregate = agg.digest("hex");
if (inputRels.length !== EXPECT_SOURCE_INPUT_FILES) {
  die(`consumed ${inputRels.length} source inputs, expected ${EXPECT_SOURCE_INPUT_FILES}.`);
}
if (inputAggregate !== EXPECT_SOURCE_INPUT_AGGREGATE) {
  die(`source input aggregate is ${inputAggregate}, expected ${EXPECT_SOURCE_INPUT_AGGREGATE}.`);
}

// The archive hashes its own released payload. Check ours is that exact file.
const payloadSha = sha256(fs.readFileSync(path.join(SRC_REPO, REL.payload)));
if (payloadSha !== EXPECT_PAYLOAD_SHA256) die(`payload sha256 is ${payloadSha}, expected ${EXPECT_PAYLOAD_SHA256}.`);
const manifestOut = (srcManifest.outputs || []).find((o) => o.path === REL.payload);
if (!manifestOut) die("the source integration manifest does not record the Reading Room payload as an output.");
if (manifestOut.sha256 !== payloadSha) {
  die(`the source manifest records payload sha256 ${manifestOut.sha256} but the file hashes to ${payloadSha}.`);
}
if (srcManifest.status !== "payload-complete-verified") {
  die(`source integration manifest status is ${srcManifest.status}, expected payload-complete-verified.`);
}
// E1 imports data only. The archive must still say the site has not applied it.
if (srcManifest.site_application_status !== "not-applied") {
  die(`source site_application_status is ${srcManifest.site_application_status}, expected not-applied.`);
}

// ── 3. WORK-LEVEL ASSERTIONS ──────────────────────────────────────────────────
const work = payload.work;
if (work.id !== EXPECT_WORK_ID) die(`payload work id is ${work.id}.`);
if (work.source_sha256 !== EXPECT_SCAN_SHA256) die(`payload scan sha256 is ${work.source_sha256}.`);
if (work.default_attribution_status !== EXPECT_ARCHIVAL_ATTRIBUTION) {
  die(`payload default attribution is ${work.default_attribution_status}, expected ${EXPECT_ARCHIVAL_ATTRIBUTION}.`);
}
const c = work.counts;
if (c.films !== EXPECT_FILMS) die(`payload films ${c.films} != ${EXPECT_FILMS}.`);
if (c.songs !== EXPECT_SONGS) die(`payload songs ${c.songs} != ${EXPECT_SONGS}.`);
if (c.line_cues !== EXPECT_LINE_CUES) die(`payload line cues ${c.line_cues} != ${EXPECT_LINE_CUES}.`);
if (c.cross_page_songs !== EXPECT_CROSS_PAGE_SONGS) die(`payload cross-page ${c.cross_page_songs} != ${EXPECT_CROSS_PAGE_SONGS}.`);

// ── 4. AUTHORSHIP / DISPLAY CONTRACT ──────────────────────────────────────────
// Read from the archive's own generated contract, never restated here.
if (contract.controlling_source_sha256 !== EXPECT_SCAN_SHA256) die("contract controlling-source hash mismatch.");
if (contract.witness_sha256?.TVA_BOK_0065867 !== EXPECT_SCAN_SHA256) die("contract 2024 witness hash mismatch.");
if (contract.witness_sha256?.TVA_BOK_0065773 !== EXPECT_WITNESS_1989_SHA256) die("contract 1989 witness hash mismatch.");
if (contract.archival_attribution_status !== EXPECT_ARCHIVAL_ATTRIBUTION) die("contract archival attribution mismatch.");
const dc = contract.decision_counts;
if (dc["established-kalaignar"] !== EXPECT_ESTABLISHED) die(`contract established ${dc["established-kalaignar"]} != ${EXPECT_ESTABLISHED}.`);
if (dc["unresolved"] !== EXPECT_UNRESOLVED) die(`contract unresolved ${dc["unresolved"]} != ${EXPECT_UNRESOLVED}.`);
if (dc["established-other"] !== EXPECT_ESTABLISHED_OTHER) die("contract established-other must be 0.");
if (dc["insufficient-evidence"] !== EXPECT_INSUFFICIENT) die("contract insufficient-evidence must be 0.");
if (contract.songs_displayable !== EXPECT_DISPLAYABLE) die(`contract displayable ${contract.songs_displayable} != ${EXPECT_DISPLAYABLE}.`);
if (contract.songs_authorship_notice_required !== EXPECT_NOTICE_REQUIRED) die("contract notice-required count mismatch.");
if (contract.material_conflicts !== 0) die("contract declares a material conflict.");

const displayable = new Set(contract.displayable_song_ids);
const established = new Set(contract.established_kalaignar_song_ids);
const unresolved = new Set(contract.unresolved_authorship_song_ids);
const noticeRequired = new Set(contract.authorship_notice_required_song_ids);
if (displayable.size !== EXPECT_DISPLAYABLE) die("contract displayable id list is not 54 distinct ids.");
if (established.size !== EXPECT_ESTABLISHED) die("contract established id list is not 48 distinct ids.");
if (unresolved.size !== EXPECT_UNRESOLVED) die("contract unresolved id list is not 6 distinct ids.");
if (noticeRequired.size !== EXPECT_NOTICE_REQUIRED) die("contract notice id list is not 6 distinct ids.");
for (const id of unresolved) {
  if (established.has(id)) die(`${id} is both established and unresolved in the contract.`);
  if (!displayable.has(id)) die(`${id} is unresolved but not displayable; E1 requires all 54 displayable.`);
  if (!noticeRequired.has(id)) die(`${id} is unresolved but carries no authorship notice requirement.`);
}
for (const id of established) {
  if (noticeRequired.has(id)) die(`${id} is established yet flagged notice-required.`);
}
const unresolvedNumbers = [...unresolved].map((id) => Number(id.slice(-3))).sort((a, b) => a - b);
if (JSON.stringify(unresolvedNumbers) !== JSON.stringify(EXPECT_UNRESOLVED_NUMBERS)) {
  die(`contract unresolved song numbers are ${unresolvedNumbers}, expected ${EXPECT_UNRESOLVED_NUMBERS}.`);
}

const notices = contract.public_authorship_notices || [];
if (notices.length !== 1) die(`contract carries ${notices.length} notice groups, expected exactly 1.`);
const notice = notices[0];
if (notice.group_id !== EXPECT_NOTICE_GROUP_ID) die(`notice group id is ${notice.group_id}.`);
if (notice.film !== EXPECT_NOTICE_FILM) die(`notice film is ${notice.film}.`);
if (!notice.notice_ta || !notice.notice_ta.trim()) die("the Tamil authorship notice is empty.");
if (!notice.notice_en || !notice.notice_en.trim()) die("the English authorship notice is empty.");
if (JSON.stringify([...notice.song_ids].sort()) !== JSON.stringify([...noticeRequired].sort())) {
  die("the notice group's song ids do not equal the contract's notice-required ids.");
}

// ── 5. FILMS AND SONGS ────────────────────────────────────────────────────────
const films = payload.films;
if (films.length !== EXPECT_FILMS) die(`payload holds ${films.length} films.`);
const allSongs = [];
for (const f of films) for (const s of f.songs) allSongs.push({ film: f, song: s });
if (allSongs.length !== EXPECT_SONGS) die(`payload holds ${allSongs.length} songs.`);

const seenNumbers = new Set();
const seenIds = new Set();
for (const { song } of allSongs) {
  const n = song.anthology_song_number;
  if (!Number.isInteger(n) || n < 1 || n > EXPECT_SONGS) die(`song number ${n} is out of range.`);
  if (seenNumbers.has(n)) die(`song number ${n} appears more than once.`);
  seenNumbers.add(n);
  if (seenIds.has(song.song_id)) die(`song id ${song.song_id} appears more than once.`);
  seenIds.add(song.song_id);
  if (song.song_id !== `kalaignar-song-${pad3(n)}`) die(`song ${n} has non-canonical id ${song.song_id}.`);
  if (song.attribution_status !== EXPECT_ARCHIVAL_ATTRIBUTION) {
    die(`${song.song_id} archival attribution is ${song.attribution_status}, expected ${EXPECT_ARCHIVAL_ATTRIBUTION}.`);
  }
  if (!displayable.has(song.song_id)) die(`${song.song_id} is in the payload but not displayable in the contract.`);
}
if (seenNumbers.size !== EXPECT_SONGS) die("songs 001-054 are not each present exactly once.");

const itemStatus = {};
for (const { song } of allSongs) itemStatus[song.item_status] = (itemStatus[song.item_status] || 0) + 1;
for (const [k, v] of Object.entries(EXPECT_ITEM_STATUS)) {
  if (itemStatus[k] !== v) die(`item_status ${k} is ${itemStatus[k]}, expected ${v}.`);
}

// Settled Tamil titles and the preserved film-label variant.
for (const [num, title] of Object.entries(SETTLED_TITLES)) {
  const got = allSongs.find(({ song }) => song.anthology_song_number === Number(num))?.song.titles.tamil;
  if (nfc(got || "") !== nfc(title)) die(`song ${num} title is ${JSON.stringify(got)}, expected ${JSON.stringify(title)}.`);
}
if (films[0].title_ta !== EXPECT_FILM_001_GROUPING) {
  die(`film 1 grouping label is ${films[0].title_ta}, expected ${EXPECT_FILM_001_GROUPING}.`);
}
const song001Notes = (songIndex.records.find((r) => r.anthology_song_number === 1)?.notes || []).join(" ");
if (!song001Notes.includes(EXPECT_FILM_001_LYRIC_VARIANT)) {
  die(`the archive no longer records the ${EXPECT_FILM_001_LYRIC_VARIANT} lyric-page variant for song 001.`);
}
// No editorial-only item may have become a numbered song.
for (const { song } of allSongs) {
  if (song.titles.tamil.includes(FORBIDDEN_EDITORIAL_ONLY)) {
    die(`${song.song_id} carries the editorial-only incipit ${FORBIDDEN_EDITORIAL_ONLY}; it has no numbered lyric body.`);
  }
}

// Cross-page songs, derived rather than restated.
const crossNumbers = allSongs
  .filter(({ song }) => song.provenance.pdf_pages.length > 1)
  .map(({ song }) => song.anthology_song_number)
  .sort((a, b) => a - b);
if (JSON.stringify(crossNumbers) !== JSON.stringify(EXPECT_CROSS_PAGE_NUMBERS)) {
  die(`cross-page songs are ${crossNumbers}, expected ${EXPECT_CROSS_PAGE_NUMBERS}.`);
}

let lineTotal = 0;
for (const { song } of allSongs) for (const sec of song.sections) lineTotal += sec.lines.length;
if (lineTotal !== EXPECT_LINE_CUES) die(`line cues total ${lineTotal} != ${EXPECT_LINE_CUES}.`);

// ── 6. EMIT ───────────────────────────────────────────────────────────────────
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(SONG_OUT, { recursive: true });
fs.rmSync(INTERNAL_OUT, { recursive: true, force: true });
fs.mkdirSync(INTERNAL_OUT, { recursive: true });
const writeJSON = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n", "utf8");

const filmSlug = (ordinal) => `film-${pad2(ordinal)}`;
const songSlug = (n) => `song-${pad3(n)}`;
const authorshipOf = (id) => ({
  decision: established.has(id) ? "established-kalaignar" : "unresolved",
  publicDisplay: displayable.has(id),
  publicAuthorshipClaim: established.has(id),
  authorshipNoticeRequired: noticeRequired.has(id),
  noticeGroupId: noticeRequired.has(id) ? notice.group_id : null,
});

const orderedFilms = [...films].sort((a, b) => a.film_ordinal - b.film_ordinal);
const filmEntries = [];
const songSummaries = [];
const songProvenance = [];

for (const f of orderedFilms) {
  const songs = [...f.songs].sort((a, b) => a.anthology_song_number - b.anthology_song_number);
  filmEntries.push({
    filmId: f.film_id,
    slug: filmSlug(f.film_ordinal),
    ordinal: f.film_ordinal,
    titleTa: f.title_ta,
    // The released payload carries no English film title. Absent metadata is
    // represented honestly rather than invented or transliterated here.
    titleEn: null,
    yearPrinted: f.year_printed,
    songCount: f.song_count,
    songSlugs: songs.map((s) => songSlug(s.anthology_song_number)),
  });

  for (const s of songs) {
    const n = s.anthology_song_number;
    const a = authorshipOf(s.song_id);
    const crossPage = s.provenance.pdf_pages.length > 1;

    songSummaries.push({
      songId: s.song_id,
      slug: songSlug(n),
      songNumber: n,
      filmId: f.film_id,
      filmSlug: filmSlug(f.film_ordinal),
      titleTa: s.titles.tamil,
      titleEn: s.titles.english,
      authorshipDecision: a.decision,
      publicDisplay: a.publicDisplay,
      publicAuthorshipClaim: a.publicAuthorshipClaim,
      authorshipNoticeRequired: a.authorshipNoticeRequired,
      noticeGroupId: a.noticeGroupId,
      sectionCount: s.sections.length,
      lineCount: s.sections.reduce((t, sec) => t + sec.lines.length, 0),
    });

    writeJSON(path.join(SONG_OUT, `${songSlug(n)}.json`), {
      workId: EXPECT_WORK_ID,
      songId: s.song_id,
      slug: songSlug(n),
      songNumber: n,
      filmId: f.film_id,
      filmSlug: filmSlug(f.film_ordinal),
      filmTitleTa: f.title_ta,
      yearPrinted: f.year_printed,
      titleTa: s.titles.tamil,
      titleEn: s.titles.english,
      // No source-page mapping and no contents-table title variant: both are
      // facts about the printed compilation, and this reader shows films and
      // lyrics, not pages. Both are preserved in the internal provenance.
      authorship: a,
      sections: s.sections.map((sec) => ({
        ordinal: sec.ordinal,
        sourceLabelTa: sec.source_label,
        labelEn: sec.english_label,
        lines: sec.lines.map((l) => ({ id: l.id, tamil: l.tamil, english: l.english })),
      })),
    });

    // Build-time only. Music, voice, verification state and archive file paths
    // are provenance, not reader content, and never enter the runtime song file.
    songProvenance.push({
      songId: s.song_id,
      songNumber: n,
      translationId: s.translation_id,
      itemStatus: s.item_status,
      attributionStatus: s.attribution_status,
      creditsAsPrinted: { music: s.credits_as_printed.music, voice: s.credits_as_printed.voice },
      contentsTitleTa: s.titles.contents_tamil,
      pdfPages: [...s.provenance.pdf_pages],
      sectionPdfPages: s.provenance.section_pdf_pages,
      crossPage,
      tamilSourcePath: s.provenance.tamil_source_path,
      englishSourcePath: s.provenance.english_source_path,
    });
  }
}

writeJSON(path.join(OUT, "index.json"), {
  workId: EXPECT_WORK_ID,
  siteSlug: SITE_SLUG,
  titleTa: work.title_ta,
  titleEn: work.presentation_title_en,
  titleEnIsEditorial: work.presentation_title_en_is_editorial,
  shelf: "cinema-writing",
  readerStructure: "film-song",
  navigation: {
    primary: "film",
    secondary: "song",
    // Machine values, not the archive's prose. The archive's own wording names
    // the printed compilation and is kept in the internal provenance instead.
    filmOrder: "source-order",
    songOrder: "song-number",
  },
  languageDefault: payload.language_presentation.default,
  languagesAvailable: [...payload.language_presentation.available],
  counts: {
    films: EXPECT_FILMS,
    songs: EXPECT_SONGS,
    lineCues: EXPECT_LINE_CUES,
    crossPageSongs: EXPECT_CROSS_PAGE_SONGS,
  },
  authorship: {
    established: EXPECT_ESTABLISHED,
    unresolved: EXPECT_UNRESOLVED,
    displayable: EXPECT_DISPLAYABLE,
    publicAuthorshipClaimAllowed: EXPECT_ESTABLISHED,
    authorshipNoticeRequired: EXPECT_NOTICE_REQUIRED,
    contractNote: contract.contract_note,
  },
  films: filmEntries,
  songs: songSummaries,
  notices: [
    {
      groupId: notice.group_id,
      filmTa: notice.film,
      status: notice.status,
      songIds: [...notice.song_ids].sort(),
      songSlugs: [...notice.anthology_song_numbers].sort((a, b) => a - b).map(songSlug),
      noticeTa: notice.notice_ta,
      noticeEn: notice.notice_en,
    },
  ],
});

writeJSON(INTERNAL_PROVENANCE, {
  workId: EXPECT_WORK_ID,
  siteSlug: SITE_SLUG,
  sourceRepo: "pugazg/kalaignar-cinema-works",
  sourcePath: `works/${EXPECT_WORK_ID}`,
  sourceCommit: APPROVED_SOURCE_COMMIT,
  sourceCommitNote:
    "The source-repository main commit that merged the reviewed 54-song authorship evidence gate and the Reading Room display contract (PR #8). It is the archive's authoritative checkpoint for this work.",
  source: {
    identifier: "TVA_BOK_0065867",
    scanSha256: EXPECT_SCAN_SHA256,
    scanType: "image_only",
    controllingSourceNote:
      "The controlling source is the 2024 scanned anthology, which is not committed to either repository. Every reading here derives from the archive's scan-adjudicated derivatives at the pinned commit.",
    earlierWitness: {
      identifier: "TVA_BOK_0065773",
      sha256: EXPECT_WITNESS_1989_SHA256,
      role: "earlier printed witness used upstream for authorship evidence only; no lyric text is imported from it",
    },
  },
  census: {
    films: EXPECT_FILMS,
    songs: EXPECT_SONGS,
    lineCues: EXPECT_LINE_CUES,
    crossPageSongs: EXPECT_CROSS_PAGE_SONGS,
    crossPageSongNumbers: EXPECT_CROSS_PAGE_NUMBERS,
  },
  authorshipContract: {
    contractPath: REL.contract,
    manifestVersion: contract.manifest_version,
    evidenceRegisterSha256: contract.evidence_register_sha256,
    sourceMainShaAtAdjudication: contract.source_main_sha,
    established: EXPECT_ESTABLISHED,
    unresolved: EXPECT_UNRESOLVED,
    establishedOther: EXPECT_ESTABLISHED_OTHER,
    insufficientEvidence: EXPECT_INSUFFICIENT,
    materialConflicts: contract.material_conflicts,
    displayable: EXPECT_DISPLAYABLE,
    noticeRequired: EXPECT_NOTICE_REQUIRED,
    unresolvedSongNumbers: EXPECT_UNRESOLVED_NUMBERS,
    separationNote:
      "Authorship certainty and display eligibility are independent. All 54 numbered lyrics are displayable because they are the controlling source's own corpus; only the 48 established songs may carry a positive Kalaignar-authorship claim. Displaying a song never resolves its authorship, and the six unresolved songs are neither claimed as Kalaignar's nor denied to him.",
  },
  english: {
    kind: "project-created",
    kindBasis:
      "An archive-produced translation derived from the archive's own scan-adjudicated Tamil derivatives. It is not a historical or officially published translation and is not a source witness.",
    lineCues: EXPECT_LINE_CUES,
    itemStatusCounts: EXPECT_ITEM_STATUS,
    itemStatusNote:
      "`verified` and `pilot-verified` are the archive's own recorded states for its translation review. They are archive states, not a claim of independent re-verification here, and they are build-time metadata only.",
  },
  settledSourceReadings: {
    film001Grouping: EXPECT_FILM_001_GROUPING,
    film001LyricPageVariant: EXPECT_FILM_001_LYRIC_VARIANT,
    variantNote:
      "The film section heading prints மந்திரிகுமாரி and the numbered lyric page prints மந்திரி குமாரி. The section-heading form controls film grouping; the lyric-page form is preserved upstream as a source variant, not a correction.",
    settledTitles: SETTLED_TITLES,
    editorialOnlyExcluded: {
      incipit: "ஆளப்பிறந்தவன் தமிழன் அவனிதனிலே",
      reason:
        "Named in the 2024 front matter as a Kalaignar film song whose censor-blocked lyric body is not printed in the numbered corpus. It has no numbered lyric and must never be imported as a 55th song.",
    },
  },
  publicSurfacePolicy: {
    readerStructure: "film-song",
    note:
      "The intended public experience is film → lyrics, not a bibliographic reproduction of the 2024 compilation. Compiler, publisher, ISBN, edition, printed-page counts, music and voice credits, item verification states and archive file paths are recorded here for validation only and are deliberately absent from the runtime song files.",
    runtimeData: [`public/data/cinema/${SITE_SLUG}/index.json`, `public/data/cinema/${SITE_SLUG}/songs/song-NNN.json`],
    internalOnly: [`data/internal/${SITE_SLUG}/provenance.json`],
    internalLocationNote:
      "Everything under Next.js public/ is a served static asset, so archival provenance placed there would be publicly fetchable however it was labelled. This file therefore lives outside public/, as plain JSON that only build-time scripts read.",
    withheldFromPublicRuntime: [
      "source repository, path and commit",
      "controlling-scan and witness identifiers and hashes",
      "evidence-register hash and source-input aggregate",
      "archive source file paths",
      "archival attribution status (anthology-attributed)",
      "item verification states (verified / pilot-verified)",
      "music and voice credits as printed",
      "scan page numbers, section page ranges and per-song cross-page state",
      "the contents-table title variant",
    ],
    navigationAsPublished: {
      filmOrder: payload.navigation.film_order,
      songOrder: payload.navigation.song_order,
    },
  },
  integrity: {
    sourceScanSha256: EXPECT_SCAN_SHA256,
    readingRoomPayloadSha256: EXPECT_PAYLOAD_SHA256,
    sourceInputAggregateSha256: inputAggregate,
    sourceInputFiles: inputRels.length,
    sourceInputPaths: inputRels,
    aggregateNote:
      "The aggregate is sha256 over `relative path + NUL + raw bytes + NUL` for the sorted input set. It proves the bytes behind this import, not merely the commit identity.",
  },
  songs: songProvenance,
  notes: [
    "Phase E1 generated data only. No public route, catalogue entry, reader component or sitemap URL exists for this work.",
    "No current-day rights determination is asserted, and no WorkAttribution is created. Archival attribution remains anthology-attributed for all 54 records.",
  ],
});

if (fs.existsSync(LEGACY_PUBLIC_PROVENANCE)) {
  fs.rmSync(LEGACY_PUBLIC_PROVENANCE, { force: true });
}
// Fail closed rather than ship a served copy of the archival apparatus.
const strayPublic = fs
  .readdirSync(OUT, { recursive: true })
  .filter((f) => String(f).endsWith("provenance.json"));
if (strayPublic.length) die(`provenance must not be written under public/: found ${strayPublic.join(", ")}`);

console.log("import-thirai-isai-paadalgal — OK");
console.log(`  source pin        ${APPROVED_SOURCE_COMMIT}`);
console.log(`  input aggregate   ${inputAggregate} (${inputRels.length} files)`);
console.log(`  payload sha256    ${payloadSha}`);
console.log(`  films/songs/lines ${EXPECT_FILMS}/${EXPECT_SONGS}/${EXPECT_LINE_CUES} (cross-page ${EXPECT_CROSS_PAGE_SONGS})`);
console.log(`  authorship        ${EXPECT_ESTABLISHED} established / ${EXPECT_UNRESOLVED} unresolved`);
console.log(`  display           ${EXPECT_DISPLAYABLE} displayable / ${EXPECT_NOTICE_REQUIRED} notice-required`);
console.log(`  public runtime    ${path.relative(process.cwd(), OUT)}`);
console.log(`  internal only     ${path.relative(process.cwd(), INTERNAL_PROVENANCE)}`);
