// Deterministic, work-specific importer for கலைவாணர் என். எஸ். கிருஷ்ணன் நினைவு நாள் விழாவில்
// கலைஞர் உரை (Digital Library Phase 3 — Speeches; Speech Benchmark #4 — the FIRST speech whose
// controlling witness is an AUDIO RECORDING rather than a printed booklet or scan).
//
// Reads the AUTHORITATIVE source from a local clone of pugazg/kalaignar-public-speeches
// (speeches/kalaivanar-nsk-memorial-day) at a pinned commit, and vendors static bilingual reader
// data into this website under public/data/speeches/kalaivanar-nsk-memorial-day/. Runtime never
// calls GitHub and never fetches the recording.
//
// ── WHAT THIS IMPORTER DOES NOT DO ───────────────────────────────────────────────────────────
// It never opens, decodes, probes or fetches the MP3. Every audio fact it publishes — checksum,
// byte size, decoded duration, codec, sample rate, channels, bitrate, boundary finding, truncation
// finding, audit counters — is read from the source archive's metadata.json, which recorded them
// from the controlling binary upstream. Audio inspection is a completed archival gate, not
// something an integration step repeats or second-guesses. No media binary is vendored.
//
// ── SOURCE FORM, NOT SUBTYPE ─────────────────────────────────────────────────────────────────
// The work remains subtype "public-speech". Audio versus print is a SOURCE-FORM distinction and is
// carried as `sourceForm: "audio"`; inventing an "audio-speech" subtype would split the public
// speech category along the wrong axis.
//
// ── THE 12 TIMESTAMPS ────────────────────────────────────────────────────────────────────────
// The canonical Tamil and English both carry twelve `## [MM:SS]` headings. The source archive is
// explicit that these are APPROXIMATE NAVIGATION MARKERS — not source-authored section titles, not
// chapters, not printed headings, and not frame-accurate word timings. They are therefore imported
// as `time-marker` blocks, never as `heading` blocks, and the Tamil list, the English list and
// metadata.json's time-map starts must be EXACTLY equal in order or the import fails closed.
//
// ── THE EVENT-FACT CONTRACT ──────────────────────────────────────────────────────────────────
// The recording does not state a date, so `date` is null and `year` is null. The source archive's
// research/ block records secondary chronology (a 1971 event recalled in the speech; a 1974 hall
// opening) and explicitly forbids substituting either for the speech date. That block, and
// metadata.speech.date_context_note which restates it, are DELIBERATELY NOT IMPORTED: they are
// context for the archive's own reasoning, and a year that reaches public data will be read as a
// claim no matter how it is captioned. Venue and event ARE source-established and are imported
// exactly as metadata states them, with no outside expansion.
//
// Embedded XMP file timestamps are likewise not imported. They describe the digital file, the
// archive says so, and they have no place among a speech's public source facts.
//
// Usage: node scripts/import-kalaivanar-nsk-memorial-day.mjs <public-speeches-clone> <source-commit>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-kalaivanar-nsk-memorial-day.mjs <public-speeches-clone> <source-commit>");
  process.exit(1);
}

// Fail closed: the source clone's actual git HEAD must equal the supplied <source-commit>, so we
// never record a caller-supplied SHA that does not correspond to the checked-out source tree.
// `main` is never treated as an authority — only the explicit pin is.
let actualHead;
try {
  actualHead = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch (e) {
  throw new Error(`unable to read git HEAD of source clone at ${SRC_REPO}: ${e.message}`);
}
if (actualHead !== SRC_COMMIT) {
  throw new Error(
    `source-commit mismatch: supplied ${SRC_COMMIT} but ${SRC_REPO} HEAD is ${actualHead}. ` +
      `Refusing to generate data with a commit SHA that does not match the checked-out source tree.`,
  );
}

const SLUG = "kalaivanar-nsk-memorial-day";
const SOURCE_PATH = `speeches/${SLUG}`;
const SPEECH_DIR = path.join(SRC_REPO, SOURCE_PATH);
const OUT = path.join(process.cwd(), "public/data/speeches", SLUG);

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const readText = (p) => fs.readFileSync(p, "utf8");
const readJSON = (p) => JSON.parse(readText(p));

const meta = readJSON(path.join(SPEECH_DIR, "metadata.json"));
const tamilSrc = readText(path.join(SPEECH_DIR, "transcription-ta.md"));
const englishSrc = readText(path.join(SPEECH_DIR, "translation-en.md"));

// ── RELEASE GATES ────────────────────────────────────────────────────────────────────────────
// The archive publishes explicit gate state. This integration refuses to publish anything the
// archive has not itself released, so an in-progress or reopened speech can never reach the site
// through a re-run of this importer.
const gate = (cond, msg) => {
  if (!cond) throw new Error(`source release gate failed: ${msg}`);
};
gate(meta.workflow.tamil_transcription === "verified-complete", "Tamil transcription is not verified-complete");
gate(meta.workflow.english_translation === "verified-complete", "English translation is not verified-complete");
gate(meta.workflow.english_translation_final_verification === "complete", "English E3 final verification is not complete");
gate(meta.english_translation.verified_complete === true, "english_translation.verified_complete is not true");
gate(meta.direct_listening_audit.segments_checked === meta.direct_listening_audit.segments_passed, "direct-listening segments checked != passed");
gate(meta.direct_listening_audit.uncertain_readings_remaining === 0, "open Tamil uncertainties remain");
gate(meta.direct_listening_audit.recording_boundary_verified === true, "recording boundary is not verified");
gate(meta.direct_listening_audit.recording_truncated === false, "the archive does not record recording_truncated: false");
gate(meta.speech.date === null, "metadata records a speech date; this integration is built on the source's date=null finding");

// ── PARSING ──────────────────────────────────────────────────────────────────────────────────
// A timestamp marker heading, exactly as both canonical files write it.
const MARKER_RE = /^##\s+\[([0-9]{2}:[0-9]{2}(?:\.[0-9]+)?)\]\s*$/;

// Parse one canonical transcript/translation body. The body is bounded from the FIRST timestamp
// marker to end of file; everything before it (the `#` title, the `**Speaker:**` block and the
// `>` editorial-status blockquote) is archival front matter, not spoken content.
//
// Paragraphing is taken exactly as released: a blank line separates paragraphs, and nothing is
// re-wrapped, re-paragraphed, normalised, de-duplicated or repunctuated. Audio paragraphs carry
// `sourcePage: null` — a recording has no pages, and a fabricated page number would be a source
// claim this archive cannot support.
function parseBody(text, label) {
  const blocks = [];
  const markers = [];
  let started = false;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const m = line.match(MARKER_RE);
    if (m) {
      started = true;
      markers.push(m[1]);
      blocks.push({ kind: "time-marker", start: m[1], end: null, approximate: true });
      continue;
    }
    if (!started) continue; // archival front matter before the first marker
    if (line.trim() === "") continue; // paragraph separator
    if (/^#/.test(line)) throw new Error(`${label}: unexpected heading inside the body: ${line}`);
    if (/^>/.test(line)) throw new Error(`${label}: unexpected blockquote inside the body: ${line}`);
    // `sourcePage: null` and `sourcePages: []` are the honest encodings, not placeholders awaiting
    // a number: this paragraph spans no source pages because the source has none. Any integer here
    // would be a fabricated printed-page claim.
    blocks.push({
      kind: "paragraph",
      segments: [{ text: line, sourcePage: null, joinToNext: "end" }],
      sourcePages: [],
    });
  }
  if (markers.length === 0) throw new Error(`${label}: no timestamp markers found`);
  return { blocks, markers };
}

const ta = parseBody(tamilSrc, "transcription-ta.md");
const en = parseBody(englishSrc, "translation-en.md");
const mapStarts = meta.time_map.map((e) => e.start);

// FAIL CLOSED on any divergence between the three timestamp sequences. They are never aligned,
// padded, sorted or repaired here: a mismatch means the source archive is internally inconsistent,
// which is an upstream finding, not something an importer may paper over.
const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
if (!eq(ta.markers, en.markers)) {
  throw new Error(`timestamp mismatch — Tamil [${ta.markers.join(",")}] vs English [${en.markers.join(",")}]`);
}
if (!eq(ta.markers, mapStarts)) {
  throw new Error(`timestamp mismatch — transcript [${ta.markers.join(",")}] vs metadata time map [${mapStarts.join(",")}]`);
}

// The source time map supplies each segment's approximate END. Attaching it to the marker keeps
// the range available to the reader as provenance without turning the marker into a claim of
// word-level synchronisation — the block still carries `approximate: true`.
const endByStart = new Map(meta.time_map.map((e) => [e.start, e.end]));
for (const b of [...ta.blocks, ...en.blocks]) {
  if (b.kind === "time-marker") b.end = endByStart.get(b.start) ?? null;
}

const countParas = (blocks) => blocks.filter((b) => b.kind === "paragraph").length;

// ── TITLES ───────────────────────────────────────────────────────────────────────────────────
// Both titles are the RELEASED ARCHIVAL titles, taken from the archive itself rather than composed
// here. The Tamil is metadata.title.ta; the English presentation title is the H1 of the released
// translation with its file-role suffix removed. Both are cross-checked against the canonical
// files' own H1s and the import fails closed if either drifts.
const TA_TITLE_SUFFIX = " — தமிழ் ஒலிப்பதிவு எழுத்தாக்கம்";
const EN_TITLE_SUFFIX = " — English Translation";
const h1 = (text, label) => {
  const m = text.split("\n")[0].match(/^#\s+(.+?)\s*$/);
  if (!m) throw new Error(`${label}: no H1 title line`);
  return m[1];
};
const taH1 = h1(tamilSrc, "transcription-ta.md");
const enH1 = h1(englishSrc, "translation-en.md");
if (!taH1.endsWith(TA_TITLE_SUFFIX)) throw new Error(`transcription-ta.md H1 lost its expected suffix: ${taH1}`);
if (!enH1.endsWith(EN_TITLE_SUFFIX)) throw new Error(`translation-en.md H1 lost its expected suffix: ${enH1}`);
const TITLE_TA = taH1.slice(0, -TA_TITLE_SUFFIX.length);
const TITLE_EN = enH1.slice(0, -EN_TITLE_SUFFIX.length);
if (TITLE_TA !== meta.title.ta) {
  throw new Error(`Tamil title drift: transcript H1 gives "${TITLE_TA}" but metadata.title.ta is "${meta.title.ta}"`);
}

// ── VENUE / EVENT ────────────────────────────────────────────────────────────────────────────
// Tamil comes verbatim from metadata. The English labels are the forms the RELEASED TRANSLATION
// itself uses — "Kalaivanar Arangam", "Chennai" and "Kalaivanar Memorial Day function" all appear
// verbatim in translation-en.md — assembled the same way Poonthottam's English venue label was.
// They are asserted against the released English below, so no label can drift into an invention.
const VENUE_EN = "Kalaivanar Arangam, Chennai";
const EVENT_EN = "Kalaivanar Memorial Day function";
const enBody = en.blocks.filter((b) => b.kind === "paragraph").map((b) => b.segments[0].text).join("\n");
for (const frag of ["Kalaivanar Arangam", "Chennai", "Kalaivanar Memorial Day function"]) {
  if (!enBody.includes(frag)) throw new Error(`English label "${frag}" is not supported verbatim by the released translation`);
}

// ── speech.json ──────────────────────────────────────────────────────────────────────────────
const speech = {
  workId: SLUG,
  slug: SLUG,
  sourceRepo: "pugazg/kalaignar-public-speeches",
  sourcePath: SOURCE_PATH,
  sourceCommit: SRC_COMMIT,
  shelf: "speeches",
  // Audio is the SOURCE FORM. The subtype stays "public-speech": this is a public speech whose
  // controlling witness happens to be a recording.
  sourceForm: "audio",
  subtype: "public-speech",
  readerStructure: "speech",
  // The recording does not state a date. No year is derived from secondary chronology, from the
  // filename, or from the file's embedded timestamps.
  date: meta.speech.date, // null
  year: null,
  title: { ta: TITLE_TA, en: TITLE_EN },
  speechType: meta.document_type, // "public-speech-audio-recording"
  // The recording gives no honorific or style for the speaker; metadata records only the name, so
  // no role is invented.
  speaker: { nameTa: meta.creator.name_ta, nameEn: meta.creator.name_en },
  venue: { ta: meta.speech.venue, en: VENUE_EN },
  event: { ta: meta.speech.event_ta, en: EVENT_EN },
  // The archive records an occasion NOTE (that the speaker describes an annually conducted
  // memorial-day function) — which is the same fact the event already carries — and establishes no
  // separate audience. Neither is invented into a field of its own.
  transcriptionStatus: meta.workflow.tamil_transcription, // "verified-complete"
  translationStatus: meta.workflow.english_translation, // "verified-complete"
  tamil: { sectionTitleTa: "தமிழ் மூல உரை", blocks: ta.blocks },
  english: { sectionTitleEn: "English translation", blocks: en.blocks },
  // `sourcePages` is OMITTED, not emptied. A recording has no pages.
};
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "speech.json"), JSON.stringify(speech, null, 1) + "\n");

// ── provenance.json ──────────────────────────────────────────────────────────────────────────
const src = meta.source;
const dla = meta.direct_listening_audit;
const provenance = {
  workId: SLUG,
  sourceRepo: "pugazg/kalaignar-public-speeches",
  sourcePath: SOURCE_PATH,
  sourceCommit: SRC_COMMIT,
  sourceForm: "audio",
  // NO `source` block: that is print provenance (publication title, scan filename, scan page
  // count, printed range, front/back matter). This source has none of those facts, and emitting
  // them empty would present print apparatus that does not exist.
  audioSource: {
    sourceForm: "audio",
    titleTa: TITLE_TA,
    filename: src.filename,
    originalUrl: src.original_url,
    sha256: src.sha256,
    fileSizeBytes: src.file_size_bytes,
    durationSeconds: src.duration_seconds,
    durationDisplay: src.duration_display,
    codec: src.audio_stream.codec,
    sampleRateHz: src.audio_stream.sample_rate_hz,
    channels: src.audio_stream.channels,
    channelLayout: src.audio_stream.channel_layout,
    averageBitRateBps: src.audio_stream.average_bit_rate_bps,
    binaryCommitted: false,
    binaryNote: src.binary_note,
    recordingBoundary: {
      start: src.recording_boundary.start,
      end: src.recording_boundary.end,
      verified: dla.recording_boundary_verified,
      // A POSITIVE finding, not an absence of evidence. An earlier audit wrongly concluded that
      // the recording ended abruptly; that claim was withdrawn after a direct tail re-audit
      // restored the final ~25 seconds through 07:23.559, and the controlling record is named
      // below. The false truncation claim must never be reintroduced.
      truncated: dla.recording_truncated,
    },
    directListeningAudit: {
      status: dla.status,
      segmentsChecked: dla.segments_checked,
      segmentsPassed: dla.segments_passed,
      openUncertainties: dla.uncertain_readings_remaining,
      controllingRecord: dla.controlling_tail_record,
    },
    timeMap: meta.time_map.map((e) => ({
      segment: e.segment,
      start: e.start,
      end: e.end,
      boundaryStatus: e.boundary_status,
    })),
    timeMarkerNote:
      "The timestamps are the source archive's approximate navigation markers. They are not source-authored section titles, chapters or printed headings, and they are not frame-accurate or word-accurate timings; the archive establishes no word-level synchronisation.",
    speechFactsNotStated: [
      "The recording does not state the date of the speech; no date is inferred from secondary chronology, from the filename, or from the file's embedded timestamps.",
      "The recording establishes no separate audience or organiser beyond the memorial-day function it is addressed to.",
    ],
    speechFactsNoteEn:
      "Venue and event are carried exactly as the source archive establishes them from direct listening; nothing is expanded from outside historical knowledge. The exact speech date remains unresolved, which is a source fact rather than pending work.",
  },
  transcription: {
    status: meta.workflow.tamil_transcription, // verified-complete
    // The controlling witness is a recording, so the print key `verified_against_scan` would be
    // false in a way that reads as a failure. This layer records what actually happened.
    verified_against_audio: true,
    method:
      "transcribed from the controlling audio recording and audited by strict direct listening (T1-T3), replaying every segment against the source; frozen",
    direct_listening_audit: dla.status,
    segments_checked: dla.segments_checked,
    segments_passed: dla.segments_passed,
    open_uncertainties: dla.uncertain_readings_remaining,
    note:
      "Tamil is the authoritative frozen layer. Spoken wording, repetition and source-supported forms are preserved; punctuation, paragraphing and the timestamp markers are editorial aids. The recording is complete: the closing passage runs through 07:23.559 and was restored and verified by a direct tail re-audit, which superseded an earlier incomplete reading of the ending.",
  },
  translation: {
    status: meta.workflow.english_translation, // verified-complete
    type: "faithful reading translation",
    language: "en",
    from: "frozen verified-complete Tamil transcription (transcription-ta.md)",
    verified: true,
    review_complete: meta.english_translation.fidelity_review_complete,
    final_verification_complete: meta.english_translation.final_verification_complete,
    note:
      "Project-created and source-linked. Made from the frozen verified Tamil, NOT translated independently from the recording; all 12 timestamp correspondences are preserved. E2 fidelity review and E3 continuous final verification both passed with 0 omissions, 0 additions and 0 reversals.",
  },
  archiveDerived: {
    timeMarkers: ta.markers.length,
    tamilAudioParagraphs: countParas(ta.blocks),
    englishAudioParagraphs: countParas(en.blocks),
    note:
      "The controlling source is a recording, so there are no printed pages, no source-page mapping and no page boundaries to classify. The 12 timestamps are the archive's approximate navigation markers, carried as time-marker blocks rather than headings. Paragraphing follows the released canonical files exactly and is not re-derived here.",
  },
  // Present project-level rights of the UNDERLYING Kalaignar-authored speech, kept explicitly
  // distinct from any right in the RECORDING of it. GO number and formal ISSUE date are
  // unverified (null); 2024-12-22 is the public HANDOVER date only.
  projectRights: {
    appliesTo: "underlying-work-authored-by-kalaignar",
    rightsStatus: "nationalised-by-tamil-nadu-government",
    rightsAuthority: "Government of Tamil Nadu",
    rightsAction: "nationalisation",
    rightsAnnouncementDate: "2024-08-22",
    governmentOrderNumber: null,
    governmentOrderDate: null,
    governmentOrderHandoverDate: "2024-12-22",
    distinctionNote:
      "The source recording's own production, publication and cataloguing are third-party facts, distinct from and not a statement of the present rights of Kalaignar's underlying Tamil speech.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored speech. It does not extend to the project-created English translation, to the source audio recording, or to third-party material, which retain their own provenance.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created) with its own distinct provenance.",
    sourceRecordingNote:
      "The project's nationalisation position applies to Kalaignar's underlying authored Tamil speech. It does not determine or claim rights in the source audio recording itself, in the recording master, or in the third-party production that made it. Those rights are not established by this archive.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only.",
  },
  notes: [
    "The controlling source is an audio recording, not a printed publication. Its identity is preserved through the source URL, filename, SHA-256, byte size, decoded duration and stream properties. The MP3 is not committed to the source archive and is not vendored, streamed, proxied or played here.",
    "The recording does not state the speech date, so date and year are null. The source archive records secondary chronology as context and expressly forbids substituting it for the speech date; no year is inferred here, in the reader, in the catalogue or in page metadata.",
    "Venue (கலைவாணர் அரங்கம், சென்னை) and event (கலைவாணர் நினைவு நாள் விழா) are established by the archive from direct listening and are carried exactly as stated, with no expansion from outside historical knowledge.",
    "The 12 timestamps are approximate navigation markers from the source archive — not source-authored section titles, chapters or printed headings, and not word-level timings. The Tamil markers, the English markers and metadata.json's time map are required to be identical in order; any divergence fails the import closed.",
    "Tamil is the frozen verified-complete transcription, audited by strict direct listening across 12/12 segments with 0 open uncertainties and both boundaries verified. English is the verified-complete translation made from that frozen Tamil, with E2 fidelity review and E3 final verification both passed. Neither was edited during import.",
    "The recording is complete and is not truncated. An earlier audit reached an incomplete reading of the ending; that finding was withdrawn after a direct tail re-audit restored the full closing passage through 07:23.559, which is part of the canonical speech. The controlling correction record is t2-batches/batch-07-tail-correction-06-53-07-23.md.",
    "The project's nationalisation position covers Kalaignar's underlying Tamil speech only. It does not determine or claim rights in the source recording, and it does not extend to the project-created English translation.",
  ],
};
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

console.log("speech:", SLUG);
console.log("source form: audio |", src.filename);
console.log("source sha256:", src.sha256, "| bytes", src.file_size_bytes, "| duration", src.duration_display);
console.log("title ta:", TITLE_TA);
console.log("title en:", TITLE_EN);
console.log("date:", speech.date, "| year:", speech.year, "| venue:", speech.venue.ta, "| event:", speech.event.ta);
console.log("time markers ta/en/map:", ta.markers.length, "/", en.markers.length, "/", mapStarts.length, "— identical:", eq(ta.markers, en.markers) && eq(ta.markers, mapStarts));
console.log("markers:", ta.markers.join(" "));
console.log("paragraphs ta/en:", countParas(ta.blocks), "/", countParas(en.blocks));
console.log("direct listening:", dla.segments_passed + "/" + dla.segments_checked, "| uncertainties", dla.uncertain_readings_remaining, "| truncated", dla.recording_truncated);
console.log("speech.json sha256:", sha256(readText(path.join(OUT, "speech.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
