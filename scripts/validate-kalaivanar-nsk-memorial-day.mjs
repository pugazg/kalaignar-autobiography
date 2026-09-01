// Deterministic source-vs-vendored validation for கலைவாணர் என். எஸ். கிருஷ்ணன் நினைவு நாள்
// விழாவில் கலைஞர் உரை (Phase 3, Speech Benchmark #4 — the first AUDIO-sourced speech).
//
// Proves, against a clone of pugazg/kalaignar-public-speeches checked out at the exact pinned
// provenance commit: source identity (repo/path/commit/HEAD, checksum, byte size, duration);
// the audio source-form model; the event-fact contract (date null, NO inferred year, venue and
// event exactly as the source establishes them); the verification state (Tamil and English
// verified-complete, 12/12 direct listening, 0 uncertainties, both boundaries verified, not
// truncated); exact three-way timestamp parity; verbatim Tamil and English including the restored
// closing passage; the ABSENCE of any fabricated page/scan/print provenance; that no media binary,
// player or runtime media fetch exists; and that the nationalisation position is scoped to the
// underlying Tamil speech and explicitly excludes the source recording and the project English.
//
// Usage: node scripts/validate-kalaivanar-nsk-memorial-day.mjs <public-speeches-clone>

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-kalaivanar-nsk-memorial-day.mjs <public-speeches-clone>");
  process.exit(1);
}

const SLUG = "kalaivanar-nsk-memorial-day";
const SOURCE_PATH = `speeches/${SLUG}`;
const PIN = "1ef73a709a343390befe55dcdfb029427f527bf4";
const SPEECH_DIR = path.join(SRC_REPO, SOURCE_PATH);
const OUT_DIR = path.join(process.cwd(), "public/data/speeches", SLUG);
const VEND = path.join(OUT_DIR, "speech.json");
const PROV = path.join(OUT_DIR, "provenance.json");
const IMPORTER = path.join(process.cwd(), "scripts/import-kalaivanar-nsk-memorial-day.mjs");

const fails = [];
const check = (cond, msg) => {
  console.log((cond ? "  ok  " : "FAIL  ") + msg);
  if (!cond) fails.push(msg);
};

const meta = JSON.parse(fs.readFileSync(path.join(SPEECH_DIR, "metadata.json"), "utf8"));
const tamilSrc = fs.readFileSync(path.join(SPEECH_DIR, "transcription-ta.md"), "utf8");
const englishSrc = fs.readFileSync(path.join(SPEECH_DIR, "translation-en.md"), "utf8");
const speech = JSON.parse(fs.readFileSync(VEND, "utf8"));
const prov = JSON.parse(fs.readFileSync(PROV, "utf8"));
const importerSrc = fs.readFileSync(IMPORTER, "utf8");
const READER = fs.readFileSync(path.join(process.cwd(), "components/SpeechReader.tsx"), "utf8");
const SOURCE_COMP = fs.readFileSync(path.join(process.cwd(), "components/SpeechSource.tsx"), "utf8");
const SPEECHES_TS = fs.readFileSync(path.join(process.cwd(), "data/speeches.ts"), "utf8");
const SITEMAP = fs.readFileSync(path.join(process.cwd(), "app/sitemap.ts"), "utf8");

const au = prov.audioSource;
const src = meta.source;
const dla = meta.direct_listening_audit;

// Independently re-derive the source bodies the way the archive writes them, so the vendored
// streams are compared against the CANONICAL FILES rather than against the importer's own view.
const MARKER_RE = /^##\s+\[([0-9]{2}:[0-9]{2}(?:\.[0-9]+)?)\]\s*$/;
function sourceBody(text) {
  const texts = [];
  const markers = [];
  let started = false;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const m = line.match(MARKER_RE);
    if (m) { started = true; markers.push(m[1]); continue; }
    if (!started || line.trim() === "") continue;
    texts.push(line);
  }
  return { texts, markers };
}
const srcTa = sourceBody(tamilSrc);
const srcEn = sourceBody(englishSrc);

function vendPieces(stream) {
  const texts = [];
  const markers = [];
  const pages = new Set();
  const kinds = new Set();
  for (const b of stream.blocks) {
    kinds.add(b.kind);
    if (b.kind === "time-marker") markers.push(b.start);
    else if (b.kind === "paragraph") for (const s of b.segments) { texts.push(s.text); pages.add(s.sourcePage); }
  }
  return { texts, markers, pages, kinds };
}
const vTa = vendPieces(speech.tamil);
const vEn = vendPieces(speech.english);
const mapStarts = meta.time_map.map((e) => e.start);
const EXPECT_MARKERS = ["00:00", "00:18", "00:55", "01:11", "02:21", "02:51", "03:15", "04:00", "04:44", "05:42", "06:02", "06:53"];
const provText = JSON.stringify(prov);
const speechText = JSON.stringify(speech);
const generatedText = speechText + "\n" + provText;

// ── SOURCE IDENTITY ──────────────────────────────────────────────────────────────────────────

// 1-3. repo / path / commit exactly as pinned, in both generated artifacts
check(speech.sourceRepo === "pugazg/kalaignar-public-speeches" && prov.sourceRepo === speech.sourceRepo, "1. source repository exact: pugazg/kalaignar-public-speeches (speech + provenance)");
check(speech.sourcePath === SOURCE_PATH && prov.sourcePath === SOURCE_PATH, `2. source path exact: ${SOURCE_PATH} (speech + provenance)`);
check(speech.sourceCommit === PIN && prov.sourceCommit === PIN, `3. source commit exact: pinned to ${PIN.slice(0, 7)} (speech + provenance)`);

// 4. the clone actually IS at that commit, with a clean tree (no source-repository modification)
let head = "", dirty = "?";
try { head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch {}
try { dirty = execFileSync("git", ["-C", SRC_REPO, "status", "--porcelain"], { encoding: "utf8" }).trim(); } catch {}
check(head === PIN && dirty === "", "4. source clone HEAD exact and working tree clean (source repository unmodified)");

// 5-7. the controlling binary's identity, carried from the archive and never recomputed here
check(au.sha256 === src.sha256 && au.sha256 === "7457004d3c3ee87722edfe6814e830d3521b834dcf29b4de45bb7174a2278148", "5. source SHA-256 exact and equal to metadata.json");
check(au.fileSizeBytes === src.file_size_bytes && au.fileSizeBytes === 7087106, "6. source byte size exact: 7,087,106");
check(au.durationSeconds === src.duration_seconds && au.durationSeconds === 443.559 && au.durationDisplay === "00:07:23.559", "7. decoded duration exact: 443.559s / 00:07:23.559");
check(au.filename === src.filename && au.filename === "05.Kalaivanar N.S.Krishnan Ninnaivu Naal Vizha vil Kalaigar Speech.mp3", "7b. controlling filename exact");
check(au.originalUrl === src.original_url && /^https:\/\//.test(au.originalUrl), "7c. original source URL preserved verbatim from the archive");

// ── SOURCE FORM AND SUBTYPE ──────────────────────────────────────────────────────────────────

// 8-9. audio is a SOURCE FORM; the subtype is unchanged and no audio subtype was invented
check(speech.sourceForm === "audio" && prov.sourceForm === "audio" && au.sourceForm === "audio", "8. sourceForm = audio (speech + provenance + audio source block)");
check(speech.subtype === "public-speech" && !("legislature" in speech), "9. subtype remains public-speech, with NO legislature object");
check(!/"audio-speech"/.test(generatedText) && !/audio-speech/.test(SPEECHES_TS), "9b. no 'audio-speech' public subtype invented anywhere");
check(/sourceForm\?: "print" \| "audio"/.test(SPEECHES_TS), "9c. the type models source form as print|audio, orthogonal to subtype");

// ── THE EVENT-FACT CONTRACT ──────────────────────────────────────────────────────────────────

// 10-11. no date, and above all no inferred year
check(speech.date === null && meta.speech.date === null, "10. date = null, exactly as the source establishes");
check(speech.year === null, "11. year = null — no year inferred from secondary chronology");
check(!/\b19(7[0-9]|6[0-9]|8[0-9]|9[0-9])\b/.test(generatedText), "11b. no 19xx year appears anywhere in the generated data");
check(!/1974|1971|1973|1975/.test(generatedText), "11c. specifically: 1971 / 1973 / 1974 / 1975 appear nowhere in generated data");

// 12-13. venue and event exactly as the source establishes them, never expanded
check(speech.venue?.ta === meta.speech.venue && speech.venue.ta === "கலைவாணர் அரங்கம், சென்னை", "12. venue Tamil exact = கலைவாணர் அரங்கம், சென்னை (from metadata)");
check(speech.venue?.en === "Kalaivanar Arangam, Chennai" && srcEn.texts.join("\n").includes("Kalaivanar Arangam") && srcEn.texts.join("\n").includes("Chennai"), "12b. venue English label is supported verbatim by the released translation");
check(speech.event?.ta === meta.speech.event_ta && speech.event.ta === "கலைவாணர் நினைவு நாள் விழா", "13. event Tamil exact = கலைவாணர் நினைவு நாள் விழா (from metadata)");
check(speech.event?.en === "Kalaivanar Memorial Day function" && srcEn.texts.join("\n").includes("Kalaivanar Memorial Day function"), "13b. event English label is supported verbatim by the released translation");
check(!("occasion" in speech) && !("audience" in speech), "13c. occasion / audience remain unset — neither is invented from the venue or the event");
// The archive's secondary-chronology reasoning must not travel into public data at all.
// The test names the research block's own KEYS. It deliberately does not forbid the PHRASE
// "secondary chronology": the generated provenance uses it in a NEGATION — recording that the
// archive keeps that chronology as context and expressly forbids substituting it for the speech
// date — and banning the words would suppress the very statement that makes the absence explicit.
// Assertions 11b/11c independently prove that no year of any kind reaches the generated data.
check(!/date_context_note|renovated_hall_opening|recording_date_inference|likely_not_before|chronology_status|earlier_event|exact_date_known|must_not_replace_source_date|official_catalogue_identity/i.test(generatedText), "13d. the archive's secondary-chronology research block is NOT imported into public data (spoken historical references inside the speech body are content, not claims, and are untouched)");
check(!/xmp|Adobe Audition|2024-06-04/i.test(generatedText), "13e. embedded file timestamps / software agent are NOT imported as speech provenance");

// ── VERIFICATION STATE ───────────────────────────────────────────────────────────────────────

// 14-15. released status, verbatim
check(speech.transcriptionStatus === "verified-complete" && speech.transcriptionStatus === meta.workflow.tamil_transcription && String(prov.transcription.status) === "verified-complete", "14. Tamil status verified-complete (speech + provenance == metadata)");
check(speech.translationStatus === "verified-complete" && speech.translationStatus === meta.workflow.english_translation && String(prov.translation.status) === "verified-complete", "15. English status verified-complete (speech + provenance == metadata)");
check(prov.translation.final_verification_complete === true && meta.english_translation.final_verification_complete === true, "15b. English E3 final verification recorded as complete");

// 16-20. the direct-listening audit and the boundary findings
check(au.directListeningAudit.segmentsChecked === 12 && au.directListeningAudit.segmentsPassed === 12 && dla.segments_checked === 12 && dla.segments_passed === 12, "16. direct listening 12/12 segments checked and passed");
check(au.directListeningAudit.openUncertainties === 0 && dla.uncertain_readings_remaining === 0, "17. open Tamil uncertainties = 0");
check(au.recordingBoundary.verified === true && dla.recording_boundary_verified === true && typeof au.recordingBoundary.start === "string" && au.recordingBoundary.start.length > 0, "18. recording beginning verified (boundary verified, source description carried)");
check(au.recordingBoundary.verified === true && typeof au.recordingBoundary.end === "string" && au.recordingBoundary.end === src.recording_boundary.end, "19. recording ending verified (source boundary description carried verbatim)");
check(au.recordingBoundary.truncated === false && dla.recording_truncated === false, "20. recording_truncated = false");
check(au.directListeningAudit.controllingRecord === dla.controlling_tail_record && /batch-07-tail-correction/.test(au.directListeningAudit.controllingRecord), "20b. the controlling tail-correction record is named in provenance");

// ── TIMESTAMPS ───────────────────────────────────────────────────────────────────────────────

const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// 21-26. three-way parity, exact values, first and last
check(vTa.markers.length === 12 && srcTa.markers.length === 12, "21. Tamil timestamp markers = 12 (vendored == transcription-ta.md)");
check(vEn.markers.length === 12 && srcEn.markers.length === 12, "22. English timestamp markers = 12 (vendored == translation-en.md)");
check(mapStarts.length === 12 && meta.time_map.length === 12, "23. metadata time-map entries = 12");
check(eq(vTa.markers, vEn.markers) && eq(vTa.markers, mapStarts) && eq(vTa.markers, srcTa.markers) && eq(vEn.markers, srcEn.markers), "24. all timestamp sequences equal and in order (Tamil == English == time map == source files)");
check(eq(vTa.markers, EXPECT_MARKERS), `24b. the released marker values are exactly ${EXPECT_MARKERS.join(" ")}`);
check(vTa.markers[0] === "00:00", "25. first marker exact = 00:00");
check(vTa.markers[11] === "06:53", "26. final marker exact = 06:53");

// 27. the TRUE duration is represented — the final segment runs to 07:23.559, not to the last marker
const lastSeg = meta.time_map[11];
const lastBlockTa = speech.tamil.blocks.filter((b) => b.kind === "time-marker").slice(-1)[0];
check(lastSeg.end === "07:23.559" && lastBlockTa.end === "07:23.559" && au.timeMap[11].end === "07:23.559" && au.durationDisplay === "00:07:23.559", "27. true duration 07:23.559 represented (final segment end, final marker end, time map, decoded duration)");

// 28-29. markers are modelled and described as APPROXIMATE, never as sections or word timings
check(speech.tamil.blocks.every((b) => b.kind !== "time-marker" || b.approximate === true) && speech.english.blocks.every((b) => b.kind !== "time-marker" || b.approximate === true), "28. every time-marker block is flagged approximate");
check(!vTa.kinds.has("heading") && !vEn.kinds.has("heading"), "28b. timestamps are NOT imported as headings — no heading block exists in either stream");
check(/approximate navigation markers/.test(au.timeMarkerNote) && /not frame-accurate|not word-level|no word-level/i.test(au.timeMarkerNote + provText), "28c. provenance describes the timestamps as approximate navigation markers, not word timings");
check(!/frame[- ]accurate (word )?tim|word[- ]accurate|exact word tim/i.test(generatedText.replace(/not frame-accurate[^"]*/gi, "").replace(/frame-accurate word timings/g, "")), "28d. no generated text CLAIMS frame-accurate or word-accurate timing");
check(!/"sections?"\s*:/.test(provText) && au.timeMap.every((s) => !("subject" in s)) && prov.archiveDerived.timeMarkers === 12 && prov.archiveDerived.sectionHeadings == null, "29. the 12 markers are reported as timeMarkers, never as sections or printed headings");

// ── TEXT FIDELITY ────────────────────────────────────────────────────────────────────────────

// 30-33. verbatim, in order, both languages
check(vTa.texts.join("␟") === srcTa.texts.join("␟") && vTa.texts.length === srcTa.texts.length, "30. frozen Tamil is verbatim and in order (== transcription-ta.md body)");
check(vEn.texts.join("␟") === srcEn.texts.join("␟") && vEn.texts.length === srcEn.texts.length, "31. verified English is verbatim and in order (== translation-en.md body)");
check(vTa.texts.length === 19 && JSON.stringify(vTa.texts) === JSON.stringify(srcTa.texts), "32. Tamil paragraph order exact (19 paragraphs, released sequence unchanged)");
check(vEn.texts.length === 19 && JSON.stringify(vEn.texts) === JSON.stringify(srcEn.texts), "33. English paragraph order exact (19 paragraphs, released sequence unchanged)");

// ── NO FABRICATED PAGE / SCAN / PRINT PROVENANCE ─────────────────────────────────────────────

// 34-36. an audio speech must carry no page apparatus at all
check([...vTa.pages].every((p) => p === null) && [...vEn.pages].every((p) => p === null), "34. no fake sourcePage on audio text — every segment sourcePage is null");
check(speech.tamil.blocks.every((b) => b.kind !== "paragraph" || (Array.isArray(b.sourcePages) && b.sourcePages.length === 0)) && speech.english.blocks.every((b) => b.kind !== "paragraph" || b.sourcePages.length === 0), "34b. every audio paragraph spans zero source pages (empty, never a fabricated range)");
check(!("sourcePages" in speech), "35. no printed-page provenance fabricated — speech.sourcePages is absent, not an invented range");
check(prov.source === undefined && !/publicationTitleTa|scanFilename|scanTotalPages|speechScanPages|printedSpeechPages|frontMatterScanPages|advertisementScanPages|scanSha256|speechPrintedPages/.test(provText), "36. no scan provenance fabricated — the print `source` block and every print/scan key are absent");
check(prov.archiveDerived.sourcePagesCovered == null && prov.archiveDerived.boundaryAudit == null && prov.crossPageJoinPolicy == null && prov.blockers == null, "36b. no page-boundary audit, join policy, page count or blocker apparatus invented for an unpaginated source");
check(!vTa.kinds.has("unresolved-break") && !vEn.kinds.has("unresolved-break"), "36c. no unresolved page-boundary breaks — an audio source has no page boundaries to leave unresolved");

// ── NO MEDIA BINARY, PLAYER, DOWNLOAD OR RUNTIME FETCH ───────────────────────────────────────

// 37-40.
const outFiles = fs.readdirSync(OUT_DIR);
check(outFiles.length === 2 && outFiles.includes("speech.json") && outFiles.includes("provenance.json"), "37. no MP3 in generated output — exactly speech.json + provenance.json");
check(!outFiles.some((f) => /\.(mp3|wav|m4a|aac|flac|ogg|opus|webm)$/i.test(f)) && au.binaryCommitted === false && src.binary_committed === false, "38. no audio binary committed by this integration (and the archive commits none either)");
check(!/https:\/\/(api\.)?github\.com|raw\.githubusercontent/.test(READER + SOURCE_COMP) && /fetch\(`\/data\/speeches\//.test(READER), "39. no runtime GitHub dependency — the reader fetches only local vendored JSON");
const MEDIA_MARKERS = /<audio[\s>/]|<video[\s>/]|createElement\(["']audio["']|new Audio\(|HTMLAudioElement|MediaSource|\.play\(\)|autoPlay|preload=|controls=|controlsList/i;
check(!MEDIA_MARKERS.test(READER + SOURCE_COMP), "40. no audio/video element, playback call, autoplay, preload or media controls in the speech components");
check(!new RegExp(au.originalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(READER), "40b. the reader never references the source media URL — no runtime media fetch from the reading page");
check(/target="_blank"/.test(SOURCE_COMP) && /rel="noopener noreferrer external"/.test(SOURCE_COMP), "40c. the provenance page links the source URL as an ordinary external link only");
check(!/download|\/audio|\/play|\/transcript|\/timestamps/.test(SOURCE_COMP.replace(/downloaded/g, "")), "40d. no download control, proxy route or media route on the provenance page");

// ── ENGLISH PROVENANCE AND RIGHTS ────────────────────────────────────────────────────────────

// 41. project-created, from the frozen Tamil — not translated independently from the audio
check(prov.translation.type === "faithful reading translation" && /frozen verified-complete Tamil/.test(String(prov.translation.from)) && /NOT translated independently from the recording/.test(String(prov.translation.note)), "41. English marked project-created and source-linked, made from the frozen Tamil (not from the audio)");

// 42-47. the rights scope
const pr = prov.projectRights;
check(pr.appliesTo === "underlying-work-authored-by-kalaignar" && pr.rightsStatus === "nationalised-by-tamil-nadu-government" && pr.rightsAuthority === "Government of Tamil Nadu" && pr.rightsAction === "nationalisation" && pr.rightsAnnouncementDate === "2024-08-22", "42. rights scope applies to the underlying Kalaignar-authored Tamil speech");
check(typeof pr.sourceRecordingNote === "string" && /does not determine or claim rights in the source audio recording/.test(pr.sourceRecordingNote), "43. rights scope EXPLICITLY excludes the source recording");
check(/does not extend to the project-created English translation/.test(pr.thirdPartyNote) && /project-created/.test(pr.projectTranslationNote), "44. rights scope excludes the project-created English translation");
check(pr.governmentOrderNumber === null, "45. GO number null");
check(pr.governmentOrderDate === null, "46. GO formal issue date null");
check(pr.governmentOrderHandoverDate === "2024-12-22", "47. GO handover date exactly 2024-12-22");
check(/sourceRecordingNote/.test(SOURCE_COMP) && !/nationalised/i.test(SOURCE_COMP.match(/Audio binary vendored[\s\S]{0,400}/)?.[0] ?? ""), "47b. the provenance component renders the recording-rights exclusion beside the nationalisation section");

// ── ROUTES AND PUBLICATION SURFACE ───────────────────────────────────────────────────────────

// 48-50.
check(!/\b\d{4}-\d{2}-\d{2}\b/.test(JSON.stringify({ d: speech.date, t: speech.title, v: speech.venue, e: speech.event, y: speech.year })), "48. no exact speech date appears in the generated work identity (title / date / venue / event)");
check(!/1974/.test(speechText), "49. no inferred 1974 appears in the generated work data");
check(speech.slug === SLUG && speech.workId === SLUG && prov.workId === SLUG && new RegExp(`"${SLUG}"`).test(SPEECHES_TS), "50. route slug matches the generated slug and is registered in SPEECH_SLUGS");

// ── SOURCE-SPECIFIC AND INTEGRATION ASSERTIONS ───────────────────────────────────────────────

// 51. the restored closing passage is present in full, in BOTH languages, as the final paragraph
const TA_CLOSE = "அந்த நிம்மதிதான் கலைவாணருடைய காலடியிலே நான் வைக்கின்ற காணிக்கை என்று மாத்திரம் நான் குறிப்பிட்டுக் கொள்ள விரும்புகின்றேன்.";
const EN_CLOSE = "that peace itself is the offering I place at Kalaivanar's feet.";
check(vTa.texts[vTa.texts.length - 1].endsWith(TA_CLOSE) && tamilSrc.includes(TA_CLOSE), "51. the restored Tamil closing passage is present in full as the final paragraph");
check(vEn.texts[vEn.texts.length - 1].endsWith(EN_CLOSE) && englishSrc.includes(EN_CLOSE), "51b. the restored English closing passage is present in full as the final paragraph");
check(vTa.texts.join("\n").includes("வெங்கடாசலம்") && vTa.texts.join("\n").includes("தங்கப்பன்") && vTa.texts.join("\n").includes("பகவதி"), "51c. the final segment's named recipients are present (தங்கப்பன், பகவதி, வெங்கடாசலம்)");

// 52. the superseded truncated reading is gone: no em dash after என்பதையும், and the withdrawn
//     abrupt-ending / stale-duration claims appear nowhere in generated public data.
const taAll = vTa.texts.join("\n");
check(!/என்பதையும்\s*[—–-]\s*$/m.test(taAll) && taAll.includes("என்பதையும் நீங்கள் அறிவீர்கள்"), "52. the superseded em-dash truncation of the final sentence is absent; the sentence completes");
check(!/07:22\.549|00:07:22/.test(generatedText), "52b. the obsolete duration 00:07:22.549 appears nowhere in generated data");
check(!/ends abruptly|abrupt ending|abrupt-ending|is truncated|unfinished/i.test(generatedText), "52c. no stale false-truncation claim in generated public data");

// 53. the opening is the verified salutation sequence
check(vTa.texts[0].startsWith("கலைவாணர் நினைவுக் குழுவின் தலைவர்") && vTa.texts[0].includes("ஏ. எல். சீனிவாசன்"), "53. Tamil opens at the verified salutation with the audited form ஏ. எல். சீனிவாசன்");
check(vEn.texts[0].startsWith("Chairman of the Kalaivanar Memorial Committee"), "53b. English opens at the corresponding salutation");

// 54. the audited Tamil corrections survived import; the superseded readings did not
const AUDITED = ["மெத்த உணர்ச்சிப் பெருக்கோடும்", "பேரார்வத்தோடும்", "புதுப்பிக்கப்பெற்று", "கலைவாணருடைய பெயர் ஏற்றி வைக்கப்பட்டது", "வள்ளல் தன்மையோடு"];
check(AUDITED.every((f) => taAll.includes(f)), `54. all ${AUDITED.length} audited Tamil forms retained verbatim`);
check(!taAll.includes("புதுப்பிக்கப்பட்டு") && !/\[[^\]]*\?\]/.test(taAll), "54b. superseded reading புதுப்பிக்கப்பட்டு and all bracketed uncertainties are absent");

// 55. titles come from the released archive, not from this repository
check(speech.title.ta === meta.title.ta && tamilSrc.startsWith(`# ${speech.title.ta} — `), "55. Tamil title is the released archival title (metadata + transcript H1)");
check(speech.title.en === "Kalaivanar N. S. Krishnan Memorial-Day Speech" && englishSrc.startsWith(`# ${speech.title.en} — English Translation`), "55b. English title is the released archival presentation title (translation H1)");

// 56. speechType is the archive's own document type, unaltered
check(speech.speechType === meta.document_type && speech.speechType === "public-speech-audio-recording", "56. speechType = the archive's document_type (public-speech-audio-recording)");

// 57. the archive-derived counts agree with the streams they describe
check(prov.archiveDerived.timeMarkers === vTa.markers.length && prov.archiveDerived.tamilAudioParagraphs === vTa.texts.length && prov.archiveDerived.englishAudioParagraphs === vEn.texts.length, "57. archive-derived counts agree with the vendored streams (12 markers, 19/19 paragraphs)");

// 58. the importer's fail-closed guards
check(/rev-parse", "HEAD"/.test(importerSrc) && /source-commit mismatch/.test(importerSrc), "58. importer retains the fail-closed source-HEAD guard");
check(/timestamp mismatch — Tamil/.test(importerSrc) && /timestamp mismatch — transcript/.test(importerSrc), "58b. importer fails closed on any Tamil/English/time-map timestamp divergence");
check(/source release gate failed/.test(importerSrc) && /verified-complete/.test(importerSrc), "58c. importer refuses to publish source layers the archive has not released");

// 59. the importer never touches the media binary
check(!/\.mp3|ffprobe|ffmpeg|readFileSync\(.*audio|https?:\/\/tamildigitallibrary/i.test(importerSrc.replace(/^\/\/.*$/gm, "").replace(/^ \* .*$/gm, "")), "59. the importer never opens, probes or fetches the MP3 — audio facts come from metadata.json");

// 60. no base64 media blob or large asset anywhere in the generated output
check(!/data:audio\/|base64,/i.test(generatedText), "60. no base64 media blob in generated data");
const totalBytes = outFiles.reduce((n, f) => n + fs.statSync(path.join(OUT_DIR, f)).size, 0);
check(totalBytes < 200_000, `60b. generated output is text-only and small (${totalBytes.toLocaleString("en-US")} bytes, no media asset)`);

// 61. the reader renders an audio branch and never claims a printed source for it
check(/sourceForm === "audio"/.test(READER), "61. the reader branches on sourceForm === audio");
check(/controlling audio recording/.test(READER) && /approximate navigation markers, not frame-accurate word timings/.test(READER), "61b. the audio reader copy names the controlling recording and calls the timestamps approximate");
check(/Transcribed and verified against the printed source/.test(READER) && /Transcribed and verified directly against the controlling audio recording/.test(READER), "61c. print speeches keep their printed-source footer; the audio speech gets its own");
check(/kind === "time-marker"/.test(READER) && !/<h2[^>]*>\{?\s*b\.start/.test(READER), "61d. the reader renders time-markers as their own subdued block, not as headings");

// 62. the provenance page has an audio branch that carries no print apparatus
check(/audioSource/.test(SOURCE_COMP) && /Source facts \(audio recording\)/.test(SOURCE_COMP) && /மூல உண்மைகள் \(ஒலிப்பதிவு\)/.test(SOURCE_COMP), "62. the provenance page has an audio source-facts section with audio-specific headings");
check(/Source facts \(the printed publication\)/.test(SOURCE_COMP) && /\{s && \(/.test(SOURCE_COMP), "62b. the print source-facts section is retained verbatim and gated on a print source");

// 63. the sitemap was NOT modified for this work — publication is automatic through SPEECH_SLUGS
check(/SPEECH_SLUGS\.flatMap/.test(SITEMAP) && !new RegExp(SLUG).test(SITEMAP), "63. app/sitemap.ts names no work-specific route — the two URLs come from SPEECH_SLUGS");

// 64. the catalogue is untouched: this speech has no /read card in A1
const LIBRARY = fs.readFileSync(path.join(process.cwd(), "data/library.ts"), "utf8");
check(!new RegExp(SLUG).test(LIBRARY), "64. data/library.ts carries no entry for this speech — catalogue exposure is not part of A1");

console.log();
console.log("RESULT:", fails.length === 0 ? "ALL PASS" : `${fails.length} FAILURE(S)`);
process.exit(fails.length === 0 ? 0 : 1);
