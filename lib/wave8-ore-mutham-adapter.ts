// Wave 8 P2 — ஒரே முத்தம் (`ore-mutham`): hidden P1 data → the existing stage-play `Play` model (SERVER-ONLY).
//
// Reads data/internal/wave8/ore-mutham/ore-mutham.json (never public/data), so the generic /plays/[slug] routes cannot
// serve this work until P3 registers it. The work prints TWO numbering scopes — the main play (காட்சி 1–30) and a
// separately titled `நகைச் சுவைப் பகுதி.` (காட்சி 1–3) — carried as `Play.parts` + `PlayReadingUnit.partId`; no scene
// is ever renumbered (never 31–33). Scene text becomes typed units by the same rules as the Wave-7 Drama importer,
// with this edition's own label separators (`பெயர்:-` / `பெயர்: ` in Tamil, `Name: ` in English):
//   ornament-only → ornament · `[` → square stage direction (a bracket left open is closed by a later `]` paragraph)
//   · `(` → round stage direction · opening quotation mark → verse · `#` line → heading · `label:-` → dialogue with the
//   label EXACTLY as printed · anything else → dialogue with NO printed label (never attributed to anyone).
// Each scene's printed setting line (`இடம்:-` / `Location:`) is the unit's setting, kept verbatim. The archive's
// `## Assembly provenance` (Tamil) is workflow apparatus and never becomes text; the English `## Translation notes`
// are carried as translation notes, rendered apart from the translation.
import fs from "node:fs";
import path from "node:path";
import type { Play, PlayProvenance, PlayReadingUnit, PlayUnit, PlayNote } from "@/data/plays";

type P1Unit = {
  id: string; partId: string; printedSceneNumber: number; headingTa: string; headingEn: string;
  sourceScans: number[]; printedPages: number[];
  tamil: { text: string; apparatus: string }; english: { text: string; apparatus: string };
};
type P1Part = { id: string; headingTa: string | null; headingEn: string | null; unitCount: number };
export type OreMuthamP1 = {
  id: string; slug: string; titleTa: string; authorTa: string; publisherTa: string; editionTa: string; editionEvidence: string;
  source: { repo: string; commit: string; repoTree: string; path: string; workTree: string };
  controllingSource: { filename: string; sha256: string; fileSizeBytes: number; physicalScans: number };
  verification: { pageRecords: number; pageStatus: Record<string, number>; blocked: number; needsReview: number };
  parts: P1Part[]; units: P1Unit[];
};

export function loadOreMuthamP1(): OreMuthamP1 {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/internal/wave8/ore-mutham/ore-mutham.json"), "utf8"));
}

const SETTING = { ta: /^இடம்\s*:-?\s*/, en: /^Location:\s*/ };
// A printed label and its separator, both kept exactly as printed. Tamil prints `:-` for almost every speech, and
// occasionally `: `, ` - ` or `.-` (e.g. `விபீஷ - …`, `2 வது கா.- …`); a dash label is at most 20 characters, so prose
// containing a dash is never read as a label. A label printed alone on its line (`விபீஷணன் குரலும் நிழலும்:-`,
// `Vibhishanan's Voice and Shadow:`) is a label with no speech text of its own — the verse that follows stays verse.
const SPEAKER = {
  ta: /^(?:([^[\]\n(“"]{1,40}?)(:-\s?|\s*:\s)(?!\s)|([^[\]\n(“"]{1,20}?)(\s+-\s+|\.-\s*)(?=\S)|([^[\]\n(“"]{1,40}?)(:-|:)$)/,
  en: /^(?:([^[\]\n(“"]{1,40}?)(:\s)(?!\s)|([^[\]\n(“"]{1,40}?)(:)$)/,
};
/** The first alternative that matched: groups come in (label, separator) pairs. */
function speakerOf(m: RegExpExecArray): { label: string; sep: string } {
  for (let g = 1; g < m.length; g += 2) if (m[g] !== undefined) return { label: m[g], sep: m[g + 1] };
  throw new Error("speaker regex matched without a label");
}
const ORNAMENT = /^[*\s]+$/;
type UnitDraft = PlayUnit extends infer U ? (U extends PlayUnit ? Omit<U, "hasLineBreaks"> : never) : never;
const opens = (x: string) => (x.match(/\[/g) || []).length > (x.match(/]/g) || []).length;
const closes = (x: string) => (x.match(/]/g) || []).length > (x.match(/\[/g) || []).length;

/** Scene text → { setting, units }. Paragraph = blank-line-separated block; every source line is kept. */
export function parseSceneText(text: string, lang: "ta" | "en"): { setting: string | null; units: PlayUnit[] } {
  const paras = text.split(/\n[ \t]*\n/).map((p) => p.replace(/\s+$/, "")).filter((p) => p.trim());
  let setting: string | null = null;
  if (paras.length && SETTING[lang].test(paras[0].trim())) setting = paras.shift()!.trim();
  const units: PlayUnit[] = [];
  const mk = (u: UnitDraft): PlayUnit => ({ ...u, hasLineBreaks: u.text.includes("\n") }) as PlayUnit;
  for (let i = 0; i < paras.length; i++) {
    const chunk = paras[i];
    const t = chunk.trim();
    const h = /^(#{1,6})\s+(.+)$/.exec(t);
    if (h && !t.includes("\n")) { units.push(mk({ kind: "heading", level: h[1].length, text: h[2] })); continue; }
    if (ORNAMENT.test(t)) { units.push(mk({ kind: "ornament", text: chunk })); continue; }
    if (t.startsWith("[")) {
      if (opens(t)) {
        const end = paras.findIndex((p, j) => j > i && closes(p.trim()));
        const blocked = end > i && paras.slice(i + 1, end).some((p) => /^[[(“"#]/.test(p.trim()) || SPEAKER[lang].test(p.trim()));
        if (end > i && !blocked) { units.push(mk({ kind: "stage-direction", delimiter: "square", text: paras.slice(i, end + 1).join("\n\n") })); i = end; continue; }
      }
      units.push(mk({ kind: "stage-direction", delimiter: "square", text: chunk })); continue;
    }
    if (t.startsWith("(")) { units.push(mk({ kind: "stage-direction", delimiter: "round", text: chunk })); continue; }
    if (t.startsWith("“") || t.startsWith('"')) { units.push(mk({ kind: "verse", text: chunk })); continue; }
    if (closes(t)) { units.push(mk({ kind: "stage-direction", delimiter: "square", text: chunk })); continue; }
    const sp = SPEAKER[lang].exec(t);
    if (sp) { const { label, sep } = speakerOf(sp); units.push(mk({ kind: "dialogue", speakerAsPrinted: label, speakerSeparator: sep, text: chunk.slice(chunk.indexOf(sp[0]) + sp[0].length) })); continue; }
    units.push(mk({ kind: "dialogue", speakerAsPrinted: null, speakerSeparator: null, text: chunk }));
  }
  return { setting, units };
}

/** The English `## Translation notes` apparatus → translation notes (never translation text). */
function translationNotes(apparatus: string): PlayNote[] {
  const body = apparatus.replace(/^## Translation notes\s*\n?/, "").trim();
  return body ? [{ kind: "translation-note", text: body }] : [];
}

export function toOreMuthamPlay(p1: OreMuthamP1 = loadOreMuthamP1()): Play {
  const parts = p1.parts.map((p) => ({ id: p.id, headingTa: p.headingTa, headingEn: p.headingEn }));
  const readingUnits: PlayReadingUnit[] = p1.units.map((u) => {
    const part = p1.parts.find((p) => p.id === u.partId)!;
    const ta = parseSceneText(u.tamil.text, "ta");
    const en = parseSceneText(u.english.text, "en");
    // The part heading prefixes the title only where the source prints one (the supplementary part), so a reader
    // never meets a context-free second "காட்சி 1".
    return {
      order: u.printedSceneNumber,
      partId: u.partId,
      slug: u.id,
      kind: "scene",
      headingTa: u.headingTa,
      headingEn: u.headingEn,
      titleTa: part.headingTa ? `${part.headingTa} · ${u.headingTa}` : u.headingTa,
      titleEn: part.headingEn ? `${part.headingEn} · ${u.headingEn}` : u.headingEn,
      settingTa: ta.setting,
      settingEn: en.setting,
      sourceScans: u.sourceScans,
      tamil: { units: ta.units },
      english: { units: en.units, notes: translationNotes(u.english.apparatus) },
    };
  });
  const scans = p1.units.flatMap((u) => u.sourceScans);
  return {
    workId: p1.id,
    slug: p1.slug,
    title: { ta: p1.titleTa, en: "Ore Mutham" },
    // Printed on the title page (scan 3): `சரித்திரக் கற்பனை நாடகம்.`
    descriptor: { ta: "சரித்திரக் கற்பனை நாடகம்", en: "A historical imaginative play" },
    author: { ta: p1.authorTa, en: "Kalaignar M. Karunanidhi" },
    edition: { publisherTa: p1.publisherTa, editionStatementTa: p1.editionTa, year: null },
    sourceRepo: p1.source.repo,
    sourcePath: p1.source.path,
    sourceCommit: p1.source.commit,
    structureKind: "scene-sequence",
    // Every source-printed scene heading, across both numbering scopes; the parts carry the scopes.
    sceneCount: readingUnits.length,
    closingTableauCount: 0,
    scanProvenance: "per-unit-group",
    bodyScans: { from: Math.min(...scans), to: Math.max(...scans) },
    readingUnits,
    parts,
  };
}

// The PRESENT project-level rights status of Kalaignar's authored works (the same record every Drama work carries).
const PROJECT_RIGHTS: PlayProvenance["projectRights"] = {
  appliesTo: "underlying-work-authored-by-kalaignar",
  rightsStatus: "nationalised-by-tamil-nadu-government",
  rightsAuthority: "Government of Tamil Nadu",
  rightsAction: "nationalisation",
  rightsAnnouncementDate: "2024-08-22",
  governmentOrderNumber: null,
  governmentOrderDate: null,
  governmentOrderHandoverDate: "2024-12-22",
  distinctionNote: "This is the PRESENT project-level rights status of Kalaignar's underlying stage play. The edition's own publisher and edition lines are edition facts, not statements about those rights.",
  thirdPartyNote: "Nationalisation applies to Kalaignar's underlying authored play. It does NOT extend to the edition's publisher/imprint matter, decorative artwork, illustrations, advertisements, or the library's stamps and accession marks.",
  projectTranslationNote: "The English reading layer is a project-created, source-linked independent translation with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
  archivalStatusNote: "The source repository's completion/release status is an editorial and archival judgement about transcription and translation completeness. It is NOT, by itself, a copyright, public-domain or republication-rights determination.",
  evidencePending: "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
};

/**
 * The durable source/provenance facts for a future /plays/ore-mutham/source page, in the Drama provenance shape.
 * Built from source facts only — no P1 workflow/status objects. It must pass through `toPublicPlayProvenance` (the
 * allowlisted boundary) before anything reaches a client component.
 */
export function toOreMuthamProvenance(p1: OreMuthamP1 = loadOreMuthamP1()): PlayProvenance {
  const play = toOreMuthamPlay(p1);
  const all = (lang: "tamil" | "english") => play.readingUnits.flatMap((r) => r[lang].units);
  const ta = all("tamil");
  const main = p1.parts.find((p) => p.headingTa === null)!, supp = p1.parts.find((p) => p.headingTa !== null)!;
  return {
    sourceRepo: p1.source.repo,
    sourcePath: p1.source.path,
    sourceCommit: p1.source.commit,
    source: {
      scanFilename: p1.controllingSource.filename,
      scanSha256: p1.controllingSource.sha256,
      scanFileSizeBytes: p1.controllingSource.fileSizeBytes,
      scanTotalPages: p1.controllingSource.physicalScans,
      sourcePdfCommitted: false,
      scanIdentityBasis: "Filename, byte size and SHA-256 as recorded by the source archive's metadata/source.md; the PDF itself is not committed.",
      pageRecordsVerified: `${p1.verification.pageRecords} / ${p1.controllingSource.physicalScans} page records verified against the scan`,
      sourceAudit: "Every scene is assembled from verified page records; no source-condition hold remains in the reading text.",
      assembledLayer: `${play.readingUnits.length} reading units — ${main.unitCount} main-play scenes (காட்சி 1–${main.unitCount}) and the ${supp.unitCount} scenes of the separately titled ${supp.headingTa} (காட்சி 1–${supp.unitCount})`,
      bodyScans: `${play.bodyScans.from}–${play.bodyScans.to}`,
      publicationYearNote: `The edition statement is carried as printed (${p1.editionTa}); no publication year is promoted to the catalogue.`,
      unnumberedSceneNote: `After the main play's காட்சி 1–${main.unitCount}, the edition prints a separately titled part, ${supp.headingTa}, whose scenes are numbered காட்சி 1–${supp.unitCount} afresh. They are shown as that part's scenes — never renumbered ${main.unitCount + 1}–${main.unitCount + supp.unitCount}.`,
    },
    english: {
      kind: "project-created",
      status: `${play.readingUnits.length} / ${play.readingUnits.length} scenes translated and reviewed against the verified Tamil`,
      independence: "The reader's English is the project-created independent translation, drafted and reviewed WITHOUT any published English edition.",
      secondaryWitnessNote: "No secondary/published English witness was used to draft or review this translation.",
      notesSeparated: "The English layer's translation notes are carried OUTSIDE the reading body in a separately labelled area.",
    },
    archiveDerived: {
      scenes: play.readingUnits.length,
      closingTableau: 0,
      tamilUnits: ta.length,
      englishUnits: all("english").length,
      tamilDialogue: ta.filter((u) => u.kind === "dialogue").length,
      tamilStageDirections: ta.filter((u) => u.kind === "stage-direction").length,
      tamilVerse: ta.filter((u) => u.kind === "verse").length,
      ornaments: ta.filter((u) => u.kind === "ornament").length,
      inBodyHeadings: ta.filter((u) => u.kind === "heading").length,
      distinctSpeakerLabels: new Set(ta.flatMap((u) => (u.kind === "dialogue" && u.speakerAsPrinted ? [u.speakerAsPrinted] : []))).size,
      unlabelledDialogueUnits: ta.filter((u) => u.kind === "dialogue" && u.speakerAsPrinted === null).length,
      scenesWithoutPrintedSetting: play.readingUnits.filter((r) => r.settingTa === null).length,
      multiScanScenes: play.readingUnits.filter((r) => r.sourceScans.length > 1).length,
      translationNotes: play.readingUnits.reduce((n, r) => n + r.english.notes.length, 0),
      interpretiveNotes: 0,
      note: "Derived structure only. The verified page records remain the controlling archival text; this integration reads the archive's own assembled scene layer built from those records.",
      speakerNote: "Speaker labels are rendered EXACTLY as printed. They are source data and are never expanded or unified.",
      unlabelledNote: "Dialogue units with no printed label stay unlabelled; absence of a label is never resolved into an attribution.",
    },
    lockedExclusions: [
      "the assembled layer's archival apparatus — assembly provenance and source-boundary comments",
      "the English layer's translation notes, held outside the reading body",
      "front matter (cover, title page, edition history, preface, cast list) and back-matter advertisements — not scene text",
    ],
    projectRights: PROJECT_RIGHTS,
    notes: [
      "The controlling source is the supplied scanned PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan count.",
      "Speaker labels, stage-direction delimiters, settings, punctuation and historical spelling are carried exactly as printed. Nothing is modernised, expanded or normalised.",
    ],
  };
}
