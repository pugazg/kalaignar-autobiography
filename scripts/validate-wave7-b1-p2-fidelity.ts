/**
 * Wave 7 — Batch 1 P2 INDEPENDENT semantic / render-fidelity validator. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave7-b1-p2-fidelity.ts
 *
 * PURPOSE. Prove the render layer (data/wave7-cinema.ts normalizer + the components that consume it) can
 * display the three vendored Reading-Room payloads WITHOUT losing or inventing source semantics — and prove
 * it INDEPENDENTLY. This validator:
 *   • does NOT import or call the P1 importer (scripts/import-wave7-b1-cinema.mjs);
 *   • does NOT trust provenance.json counts as the source of truth — it re-derives every count from the raw
 *     vendored reader.json with its own traversal, then also asserts provenance.json AGREES (an honesty
 *     cross-check, not the anchor);
 *   • anchors on FROZEN governing checkpoints hard-coded below, so a payload that silently changed shape
 *     would fail here even if provenance.json were edited to match.
 *
 * FIDELITY CLAIM. For each work it proves, against an independent raw traversal:
 *   scene/segment count · verbatim per-scene tamil_text (byte-identical, never reassembled) · translation
 *   unit count · immutable Tamil↔English dialogue-link count · source numbering semantics (a scene number
 *   is surfaced ONLY where the source marks it printed; the unnumbered opening stays unnumbered) · section
 *   slugs derived from each scene's own ordinal (contiguous, unique, never a reconstructed 1..N over the
 *   printed numbers) · speaker labels present only where the source unit carries one · song/performance/chant
 *   units retained as occurrence references, never turned into authored lyrics · Vandikkaran's 6 unresolved
 *   item-level lyric authorships preserved unresolved · Naam's authoritative Reading-Room payload SHA.
 * The frozen source pins + byte-identity of the vendored payload are owned by the P1 validators; this one
 * owns render-semantic fidelity. Reads only the vendored payloads under public/data/cinema — no network.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { normalizeWave7Cinema, sectionSlug, unitEnglishText, WAVE7_CINEMA_SLUGS, type Wave7CinemaSlug } from "../data/wave7-cinema";

const root = process.cwd();
let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };

const readerPath = (slug: string) => path.join(root, "public/data/cinema", slug, "reader.json");
const provPath = (slug: string) => path.join(root, "public/data/cinema", slug, "provenance.json");
const rawOf = (slug: string) => JSON.parse(fs.readFileSync(readerPath(slug), "utf8")) as Record<string, unknown>;
const provOf = (slug: string) => JSON.parse(fs.readFileSync(provPath(slug), "utf8")) as Record<string, any>;

// FROZEN governing checkpoints (from the P1 authority + the batch charter). Independent anchor.
type CK = {
  arrayKey: string; prefix: string; scenes: number; units: number; links: number;
  numbered: number; unnumbered: number; readingRoomSha: string;
  // units whose English is carried ONLY as a non-empty `english_lines` array (empty `english_text`).
  // Frozen census (independently reproduced below): maruthanattu 0, vandikkaran 54, naam 7 → 61 total.
  linesOnly: number;
  // optional per-work source blocks that must survive as `extras` and must NOT be invented away
  perfBlockKey?: string; perfCount?: number; unresolvedLyricAuthorships?: number;
};
const CHECK: Record<Wave7CinemaSlug, CK> = {
  "maruthanattu-ilavarasi": {
    arrayKey: "segments", prefix: "segment", scenes: 10, units: 228, links: 208, numbered: 9, unnumbered: 1,
    readingRoomSha: "25715b161b9df7e47d158871aab56f479be226d7bde624e45e5c3f50724acbb2", linesOnly: 0,
  },
  "vandikkaran-magan": {
    arrayKey: "screenplay_scenes", prefix: "scene", scenes: 72, units: 1181, links: 773, numbered: 72, unnumbered: 0,
    readingRoomSha: "1d1b611c1261eac75577c8c0499123c260406005f26448bb9aac5f6df22339ba", linesOnly: 54,
    perfBlockKey: "performance_occurrences", perfCount: 9, unresolvedLyricAuthorships: 6,
  },
  naam: {
    arrayKey: "scenes", prefix: "scene", scenes: 45, units: 797, links: 590, numbered: 45, unnumbered: 0,
    readingRoomSha: "9b97493b820ebd42c822b5fbdc53beda8dbe1d61103a1c9d2abb06a552bcf825", linesOnly: 7,
    perfBlockKey: "performance_inventory", perfCount: 7,
  },
};
const TOTAL_UNITS_EXPECTED = 2206;   // 228 + 1181 + 797
const TOTAL_LINES_ONLY_EXPECTED = 61; // 0 + 54 + 7
let totalUnitsSeen = 0, totalLinesOnlySeen = 0;

ok(JSON.stringify([...WAVE7_CINEMA_SLUGS]) === JSON.stringify(Object.keys(CHECK)), "normalizer slug roster == frozen 3-work roster");

for (const slug of WAVE7_CINEMA_SLUGS) {
  const ck = CHECK[slug];
  ok(fs.existsSync(readerPath(slug)), `${slug}: reader.json present`);
  ok(fs.existsSync(provPath(slug)), `${slug}: provenance.json present`);
  const raw = rawOf(slug);
  const prov = provOf(slug);

  // (0) Authoritative Reading-Room SHA — independently recomputed over the vendored bytes, NOT read from
  //     provenance. Naam must be the reading-room payload SHA (9b97493b…), never its reader_json_sha256.
  const bytesSha = crypto.createHash("sha256").update(fs.readFileSync(readerPath(slug))).digest("hex");
  ok(bytesSha === ck.readingRoomSha, `${slug}: vendored payload SHA-256 == frozen Reading-Room SHA (got ${bytesSha.slice(0, 12)}…)`);
  ok(prov.readingRoomPayloadSha256 === ck.readingRoomSha, `${slug}: provenance.readingRoomPayloadSha256 agrees with frozen SHA`);

  // (1) INDEPENDENT raw traversal — counts computed here, not taken from provenance.
  const arr = raw[ck.arrayKey] as any[];
  ok(Array.isArray(arr) && arr.length === ck.scenes, `${slug}: raw ${ck.arrayKey}.length == ${ck.scenes} (independent)`);
  let rawUnits = 0, rawLinks = 0, rawNumbered = 0, rawUnnumbered = 0;
  for (const s of arr) {
    const us: any[] = Array.isArray(s.english_units) ? s.english_units : [];
    rawUnits += us.length;
    for (const u of us) if (typeof u.source_record_id === "string" && u.source_record_id.length) rawLinks++;
    // numbering: maruthanattu marks unnumbered opening via segment_kind; the rest print a scene number.
    if (slug === "maruthanattu-ilavarasi") {
      if (s.segment_kind === "unnumbered-opening") rawUnnumbered++; else if (typeof s.source_scene_number === "number") rawNumbered++;
    } else if (slug === "vandikkaran-magan") {
      if (s.source_scene_numbering_is_printed === true) rawNumbered++; else rawUnnumbered++;
    } else {
      if (typeof s.source_scene_number === "number") rawNumbered++; else rawUnnumbered++;
    }
  }
  ok(rawUnits === ck.units, `${slug}: raw english_units total == ${ck.units} (got ${rawUnits})`);
  ok(rawLinks === ck.links, `${slug}: raw immutable dialogue links == ${ck.links} (got ${rawLinks})`);
  ok(rawNumbered === ck.numbered, `${slug}: raw source-numbered scenes == ${ck.numbered} (got ${rawNumbered})`);
  ok(rawUnnumbered === ck.unnumbered, `${slug}: raw unnumbered scenes == ${ck.unnumbered} (got ${rawUnnumbered})`);

  // (2) provenance.json HONESTY cross-check — must equal the independently derived counts.
  const pc = prov.counts || {};
  const pScenes = pc.segments ?? pc.screenplay_scenes ?? pc.scene_count;
  const pUnits = pc.translation_units ?? pc.english_units;
  ok(pScenes === ck.scenes, `${slug}: provenance scene count agrees (${pScenes})`);
  ok(pUnits === ck.units, `${slug}: provenance unit count agrees (${pUnits})`);
  ok((pc.immutable_dialogue_links ?? -1) === ck.links, `${slug}: provenance link count agrees`);

  // (3) NORMALIZER render fidelity — normalize the SAME raw and prove nothing is lost or invented.
  const work = normalizeWave7Cinema(slug, raw);
  ok(work.scenes.length === ck.scenes, `${slug}: normalized scene count == ${ck.scenes}`);
  ok(work.scenes.reduce((n, s) => n + s.units.length, 0) === ck.units, `${slug}: normalized unit total == ${ck.units}`);
  ok(work.scenes.reduce((n, s) => n + s.units.filter((u) => u.sourceRecordId).length, 0) === ck.links, `${slug}: normalized link total == ${ck.links}`);
  ok(work.scenes.filter((s) => s.numberingIsPrinted).length === ck.numbered, `${slug}: normalized printed-number scenes == ${ck.numbered}`);
  ok(work.scenes.filter((s) => !s.numberingIsPrinted).length === ck.unnumbered, `${slug}: normalized unnumbered scenes == ${ck.unnumbered}`);

  // (3a) VERBATIM tamil_text per scene — byte-identical to the raw payload's own field (never reassembled).
  let verbatimBad = 0, numberInvented = 0, labelInvented = 0, authoredLyric = 0;
  for (let i = 0; i < arr.length; i++) {
    const rs = arr[i]; const ns = work.scenes[i];
    const rawTa = typeof rs.tamil_text === "string" ? rs.tamil_text : "";
    if (ns.tamilText !== rawTa) verbatimBad++;
    // a scene number is surfaced ONLY when the source marks it printed; unnumbered → sourceSceneNumber null.
    if (ns.numberingIsPrinted && ns.sourceSceneNumber == null) numberInvented++;
    if (!ns.numberingIsPrinted && ns.sourceSceneNumber != null) numberInvented++;
    const rawUnitsArr: any[] = Array.isArray(rs.english_units) ? rs.english_units : [];
    for (let k = 0; k < ns.units.length; k++) {
      const ru = rawUnitsArr[k]; const nu = ns.units[k];
      const rawLabel = (typeof ru.speaker_label_ta === "string" && ru.speaker_label_ta) || (typeof ru.speaker_label === "string" && ru.speaker_label) || null;
      if ((nu.speakerLabelTa ?? null) === null && rawLabel) labelInvented++; // dropped a real label
      if (nu.speakerLabelTa && !rawLabel) labelInvented++;                    // invented a label
      // song / performance-cue / chant carry NO authorship field synthesised by the render layer.
      if ((nu.kind === "song" || nu.kind === "performance-cue" || nu.kind === "chant") && (nu as any).author) authoredLyric++;
    }
  }
  ok(verbatimBad === 0, `${slug}: every scene tamilText byte-identical to raw tamil_text (${verbatimBad} differ)`);
  ok(numberInvented === 0, `${slug}: no scene numbering invented or dropped (${numberInvented})`);
  ok(labelInvented === 0, `${slug}: speaker labels neither invented nor dropped (${labelInvented})`);
  ok(authoredLyric === 0, `${slug}: no song/performance/chant unit carries a synthesised author (${authoredLyric})`);

  // (3c) DEEP per-unit fidelity — EVERY normalized English unit vs its raw source unit, field by field,
  //      in source order. This is what catches a renderer/normalizer that silently drops line-array content.
  const asStr = (v: unknown): string | null => (typeof v === "string" && v.length ? v : null);
  let idBad = 0, kindBad = 0, textBad = 0, linesBad = 0, labelBad = 0, recBad = 0, occBad = 0, delimBad = 0, ppBad = 0, orderBad = 0;
  let unitsSeen = 0, linesOnlySeen = 0, effectiveEmpty = 0, lineDropReorderDup = 0;
  for (let i = 0; i < arr.length; i++) {
    const rawUnitsArr: any[] = Array.isArray(arr[i].english_units) ? arr[i].english_units : [];
    const nUnits = work.scenes[i].units;
    if (rawUnitsArr.length !== nUnits.length) orderBad++;
    for (let k = 0; k < nUnits.length; k++) {
      const ru = rawUnitsArr[k]; const nu = nUnits[k];
      unitsSeen++; totalUnitsSeen++;
      if (!ru) { orderBad++; continue; }
      if (nu.id !== String(ru.id ?? "")) { idBad++; orderBad++; }       // id unchanged AND at the same index (order preserved)
      if (nu.kind !== String(ru.kind ?? "unit")) kindBad++;
      // englishText == raw english_text, or the intentional empty fallback ("") when the source has none.
      const rawText = typeof ru.english_text === "string" ? ru.english_text : "";
      if (nu.englishText !== rawText) textBad++;
      // englishLines EXACTLY equals raw english_lines when present (deep, order-sensitive), else null.
      const rawLines = Array.isArray(ru.english_lines) ? (ru.english_lines as string[]) : null;
      if (JSON.stringify(nu.englishLines) !== JSON.stringify(rawLines)) linesBad++;
      // speaker label, record/occurrence ids, delimiter — unchanged (normalizer reads both label spellings).
      const rawLabel = asStr(ru.speaker_label_ta) ?? asStr(ru.speaker_label);
      if ((nu.speakerLabelTa ?? null) !== rawLabel) labelBad++;
      if ((nu.sourceRecordId ?? null) !== asStr(ru.source_record_id)) recBad++;
      if ((nu.sourceOccurrenceId ?? null) !== asStr(ru.source_occurrence_id)) occBad++;
      if ((nu.sourceDelimiter ?? null) !== asStr(ru.source_delimiter)) delimBad++;
      // page provenance preserved exactly (pdf_page / printed_page, null-preserving).
      const rawPP = (Array.isArray(ru.page_provenance) ? ru.page_provenance : []).map((p: any) => ({ pdfPage: typeof p.pdf_page === "number" ? p.pdf_page : null, printedPage: typeof p.printed_page === "number" ? p.printed_page : null }));
      if (JSON.stringify(nu.pageProvenance) !== JSON.stringify(rawPP)) ppBad++;
      // Line-array-only unit: empty english_text + non-empty english_lines. Prove the effective reading
      // text survives (non-empty) and equals the source lines exactly (no line dropped/reordered/duplicated).
      const isLinesOnly = rawText.length === 0 && !!rawLines && rawLines.length > 0;
      if (isLinesOnly) {
        linesOnlySeen++; totalLinesOnlySeen++;
        const eff = unitEnglishText(nu);
        if (eff.trim().length === 0) effectiveEmpty++;
        if (JSON.stringify(eff.split("\n")) !== JSON.stringify(rawLines)) lineDropReorderDup++; // exact lines, in order, none added
      }
    }
  }
  ok(idBad === 0, `${slug}: every unit id unchanged and in source order (${idBad} off)`);
  ok(orderBad === 0, `${slug}: unit order + count preserved exactly (${orderBad} off)`);
  ok(kindBad === 0, `${slug}: every unit kind unchanged (${kindBad} off)`);
  ok(textBad === 0, `${slug}: englishText == raw english_text or "" fallback (${textBad} off)`);
  ok(linesBad === 0, `${slug}: englishLines exactly equals raw english_lines (${linesBad} off)`);
  ok(labelBad === 0, `${slug}: speaker label unchanged per unit (${labelBad} off)`);
  ok(recBad === 0, `${slug}: sourceRecordId unchanged per unit (${recBad} off)`);
  ok(occBad === 0, `${slug}: sourceOccurrenceId unchanged per unit (${occBad} off)`);
  ok(delimBad === 0, `${slug}: sourceDelimiter unchanged per unit (${delimBad} off)`);
  ok(ppBad === 0, `${slug}: page provenance preserved exactly per unit (${ppBad} off)`);
  ok(unitsSeen === ck.units, `${slug}: deep-compared all ${ck.units} English units (${unitsSeen})`);
  // Line-array-only survival — the concrete P2 defect this correction fixes.
  ok(linesOnlySeen === ck.linesOnly, `${slug}: ${ck.linesOnly} line-array-only English units present (got ${linesOnlySeen})`);
  ok(effectiveEmpty === 0, `${slug}: no line-array-only unit renders empty effective English (${effectiveEmpty} empty)`);
  ok(lineDropReorderDup === 0, `${slug}: line-array units keep every line, in order, none dropped/reordered/duplicated (${lineDropReorderDup} off)`);

  // (3b) SECTION SLUGS — derived from each scene's own navOrdinal, contiguous + unique, matching the helper.
  const slugsSeen = work.scenes.map((s) => s.sectionSlug);
  ok(new Set(slugsSeen).size === slugsSeen.length, `${slug}: section slugs unique`);
  ok(slugsSeen.every((sl, i) => sl === sectionSlug(ck.prefix, work.scenes[i].navOrdinal)), `${slug}: section slugs == prefix+ordinal derivation`);
  ok(slugsSeen.every((sl) => sl.startsWith(ck.prefix + "-")), `${slug}: section slugs use the '${ck.prefix}' prefix`);

  // (4) PER-WORK optional source blocks must survive as extras (not flattened away).
  if (ck.perfBlockKey) {
    const rawBlock = raw[ck.perfBlockKey] as any[];
    ok(Array.isArray(rawBlock) && rawBlock.length === ck.perfCount, `${slug}: raw ${ck.perfBlockKey}.length == ${ck.perfCount}`);
    const carried = slug === "vandikkaran-magan" ? work.extras.performanceOccurrences : work.extras.performanceInventory;
    ok(Array.isArray(carried) && (carried as any[]).length === ck.perfCount, `${slug}: extras carry all ${ck.perfCount} performance records`);
  }
  // Vandikkaran: the 6 unresolved item-level lyric authorships stay unresolved and are never inferred.
  if (slug === "vandikkaran-magan") {
    const occ = raw.performance_occurrences as any[];
    const unresolved = occ.filter((o) => o.authorship_status === "unresolved-item-level").length;
    ok(unresolved === ck.unresolvedLyricAuthorships, `${slug}: 6 unresolved item-level lyric authorships present (got ${unresolved})`);
    const inferred = occ.filter((o) => o.authorship_status === "unresolved-item-level" && (o.author_as_printed || o.resolved_author)).length;
    ok(inferred === 0, `${slug}: no unresolved authorship resolved/inferred by the payload`);
    ok((raw.film_level_credit_context as any).item_level_authorship_inferred === false, `${slug}: film-level item_level_authorship_inferred stays false`);
    ok(prov.counts.unresolved_item_level_lyric_authorships === 6, `${slug}: provenance records 6 unresolved authorships`);
  }
  if (slug === "naam") {
    const a = raw.authorship as any;
    ok(Array.isArray(a.unresolved_item_level) && a.unresolved_item_level.length === 6, `${slug}: 6 unresolved item-level authorship rows preserved`);
    ok((a.unsupported_downstream_upgrades ?? 0) === 0, `${slug}: 0 unsupported downstream authorship upgrades`);
  }

  // (5) titles surfaced from the source `work` block, not invented; editorial-English flag honoured.
  ok(!!work.titleTa && work.titleTa === prov.title.ta, `${slug}: normalized titleTa == source/provenance Tamil title`);
  ok(!!work.titleEn, `${slug}: normalized titleEn present (editorial)`);
}

// (6) CROSS-WORK totals — every English unit deep-compared; the full line-array-only census reproduced.
ok(totalUnitsSeen === TOTAL_UNITS_EXPECTED, `all ${TOTAL_UNITS_EXPECTED} English units deep-compared across the 3 works (got ${totalUnitsSeen})`);
ok(totalLinesOnlySeen === TOTAL_LINES_ONLY_EXPECTED, `all ${TOTAL_LINES_ONLY_EXPECTED} line-array-only English units survive normalization with non-empty effective text (got ${totalLinesOnlySeen})`);

if (fail.length) {
  console.error(`\nwave7-b1-p2-fidelity — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 50)) console.error("  ✗ " + f);
  if (fail.length > 50) console.error(`  … and ${fail.length - 50} more`);
  process.exit(1);
}
console.log(`\nwave7-b1-p2-fidelity — ${checks} checks, 0 failed`);
console.log(`  3 cinema payloads re-derived independently · all ${TOTAL_UNITS_EXPECTED} English units deep-compared field-by-field (id/kind/text/lines/label/record/occurrence/delimiter/page-provenance/order) · ${TOTAL_LINES_ONLY_EXPECTED} line-array-only units keep non-empty, in-order, unduplicated English · verbatim tamil_text · exact counts + numbering semantics · authorships unresolved · Naam Reading-Room SHA · normalizer loses/invents nothing`);
