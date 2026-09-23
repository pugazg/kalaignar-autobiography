// Deterministic generator — Wave 7 P4 catalogue + collection records for B5a / B5b / B6 / Kuraloviyam.
//
//   node scripts/generate-wave7-b5-b6-k-catalogue.mjs [--verify]
//
// Writes data/wave7-b5-b6-k-catalogue.ts from the FROZEN internal manifests and the already-validated vendored
// payloads (it reads no source repository and invents nothing): 101 LibraryWorks (97 public speeches, 3
// assembly speeches, 1 Kuraloviyam) and the two முத்துக் குளியல் LibraryCollections, whose members and
// printed ordinals come from the source collections' own numbering. `--verify` requires the committed file to be
// byte-identical to a fresh generation.
//
// Rules carried into every record:
//   • no `rights` — none is established for these works in the evidence, so none is inherited from siblings;
//   • English coverage is "partial" where the English is a CONDENSED rendering, and the card says so;
//   • Kuraloviyam's Tamil/English coverage is "partial" (four permanently source-limited scans) and its card
//     states the qualification; it is ONE work — the six intake Parts are never catalogue entries;
//   • collections are publication containers: members keep their own LibraryWork identity and routes.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const VERIFY = process.argv.includes("--verify");
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const die = (m) => { console.error(`generate-wave7-b5-b6-k-catalogue: ${m}`); process.exit(1); };
const sman = readJSON("data/internal/wave7/b5-b6-speeches-manifest.json");
const kman = readJSON("data/internal/wave7/kuraloviyam-manifest.json");
if (sman.works.length !== 100) die("speech manifest is not 100 works");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dateEn = (d) => { const [y, m, dd] = d.split("-").map(Number); return dd ? `${dd} ${MONTHS[m - 1]} ${y}` : `${MONTHS[m - 1]} ${y}`; };
const dateTa = (d) => { const [y, m, dd] = d.split("-").map(Number); return dd ? `${dd}-${m}-${y}` : `${m}-${y}`; };
const PART = { "muthukkuliyal-part-1": "I", "muthukkuliyal-part-2": "II" };

const works = [];
const collectionFacts = {};
for (const w of sman.works) {
  const sp = readJSON(`public/data/speeches/${w.slug}/speech.json`);
  const pv = readJSON(`public/data/speeches/${w.slug}/provenance.json`);
  const condensed = sp.englishForm === "condensed";
  let descTa, descEn;
  if (w.collectionId) {
    const part = PART[w.collectionId];
    const total = sp.collection.total;
    descTa = `முத்துக் குளியல் — பாகம் ${part} · உரை ${w.ordinal} / ${total}${sp.date ? ` · ${dateTa(sp.date)}` : ""}${condensed ? " · ஆங்கிலம்: சுருக்க வடிவம்" : ""}`;
    descEn = `Muthukkuliyal, Part ${part} — item ${w.ordinal} of ${total}${sp.date ? ` · ${dateEn(sp.date)}` : ""}${condensed ? " · English: condensed rendering" : ""}`;
    collectionFacts[w.collectionId] ??= { firstEditionTa: pv.source.firstEditionTa, publisherTa: pv.source.publisherTa, scanFilename: pv.source.scanFilename, scanSha256: pv.source.scanSha256 };
  } else {
    descTa = `${sp.legislature.nameTa} — ${sp.event.ta}${sp.date ? ` · ${dateTa(sp.date)}` : ""}`;
    descEn = `${sp.legislature.nameEn} — ${sp.event.en}${sp.date ? ` · ${dateEn(sp.date)}` : ""}`;
  }
  works.push({
    id: w.slug,
    slug: w.slug,
    titleTa: sp.title.ta,
    titleEn: sp.title.en,
    shelf: "speeches",
    subtype: sp.subtype,
    readerStructure: "speech",
    href: `/speeches/${w.slug}`,
    state: "published",
    descTa,
    descEn,
    sourceRepo: w.sourceRepo,
    sourcePath: w.sourcePath,
    sourceCommit: w.sourceCommit,
    ...(w.collectionId && pv.source.firstEditionTa ? { edition: pv.source.firstEditionTa } : {}),
    tamil: "complete",
    english: condensed ? "partial" : "complete",
    englishKind: "project-created",
    provenanceHref: `/speeches/${w.slug}/source`,
  });
}
const kidx = readJSON("public/data/kuraloviyam/index.json");
const kprov = readJSON("public/data/kuraloviyam/provenance.json");
if (kidx.entryCount !== 300 || JSON.stringify(kprov.verification.sourceLimitedScans) !== "[13,14,15,19]" || kprov.verification.tamilTextualVerified !== 662) die("Kuraloviyam qualification drifted");
works.push({
  id: "kuraloviyam",
  slug: "kuraloviyam",
  titleTa: "குறளோவியம்",
  titleEn: "Kuraloviyam",
  shelf: "literary-commentary",
  subtype: "commentary",
  readerStructure: "commentary-unit",
  href: "/kuraloviyam",
  state: "published",
  descTa: "கலைஞரின் குறளோவியம் — 300 பகுதிகள்; ஸ்கேன் 13, 14, 15, 19 மூலத்தின் நிலையான வரம்புடையவை — அவற்றின் வாசிக்க இயலாத சொற்கள் ஊகிக்கப்படவில்லை",
  descEn: "Kalaignar's Kuraloviyam — 300 entries; scans 13, 14, 15 and 19 are permanently source-limited and their unreadable wording is not reconstructed",
  sourceRepo: kprov.sourceRepo,
  sourcePath: kprov.sourcePath,
  sourceCommit: kprov.sourceCommit,
  tamil: "partial",
  english: "partial",
  englishKind: "project-created",
  unitCount: { value: 300, labelTa: "பகுதிகள்", labelEn: "entries" },
  provenanceHref: "/kuraloviyam/source",
});
if (works.length !== 101 || new Set(works.map((w) => w.id)).size !== 101) die("population is not 101 unique works");

const collections = Object.entries(sman.collections).map(([id, c]) => {
  const part = PART[id];
  const f = collectionFacts[id];
  const members = c.members.map((slug) => ({ workId: slug, ordinal: sman.works.find((w) => w.slug === slug).ordinal }));
  if (JSON.stringify(members.map((m) => m.ordinal)) !== JSON.stringify(members.map((_, i) => i + 1))) die(`${id}: member ordinals are not 1..N in order`);
  return {
    id,
    shelf: "speeches",
    titleTa: `முத்துக் குளியல் — பாகம் ${part}`,
    titleEn: `Muthukkuliyal — Part ${part}`,
    kind: "anthology",
    ...(f.firstEditionTa ? { editionStatementTa: f.firstEditionTa } : {}),
    ...(f.publisherTa ? { publisherTa: f.publisherTa } : {}),
    memberCount: { value: c.total, labelTa: "உரைகள்", labelEn: "speeches" },
    href: `/collections/${id}`,
    descTa: `பூம்புகார் பதிப்பகம் வெளியிட்ட சொற்பொழிவுகளின் தொகுப்பு — ${c.total} உரைகள், அச்சிட்ட பொருளடக்க வரிசையில்.`,
    descEn: `A published collection of speeches — ${c.total} speeches, in the order of its printed contents.`,
    source: {
      repository: "pugazg/kalaignar-public-speeches",
      pinnedCommit: sman.sources.publicSpeeches.commit,
      collectionPath: `collections/${id}`,
      collectionTree: c.tree,
      ...(f.scanFilename ? { scanFilename: f.scanFilename } : {}),
      ...(f.scanSha256 ? { scanSha256: f.scanSha256 } : {}),
    },
    members,
  };
});

const header = `// GENERATED by scripts/generate-wave7-b5-b6-k-catalogue.mjs — do not edit by hand (CI re-generates with
// --verify). Wave 7 P4: 101 LibraryWorks (B5a 61 + B5b 36 public speeches, B6 3 assembly speeches, the qualified
// Kuraloviyam) and the two முத்துக் குளியல் LibraryCollections, derived from the frozen internal manifests
// (data/internal/wave7/b5-b6-speeches-manifest.json, kuraloviyam-manifest.json @ ${kman.source.commit.slice(0, 8)}) and the validated payloads.
// No record carries \`rights\` (none is established for these works); condensed English is "partial" and labelled.
import type { LibraryWork } from "@/data/library";
import type { LibraryCollection } from "@/data/collections";
`;
const body = `${header}
export const WAVE7_B5_B6_K_WORKS: LibraryWork[] = ${JSON.stringify(works, null, 2)};

export const WAVE7_MUTHUKKULIYAL_COLLECTIONS: LibraryCollection[] = ${JSON.stringify(collections, null, 2)};
`;
const OUT = path.join(root, "data/wave7-b5-b6-k-catalogue.ts");
if (VERIFY) {
  if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== body) die("--verify: data/wave7-b5-b6-k-catalogue.ts is not byte-identical to a fresh generation");
  console.log("generate-wave7-b5-b6-k-catalogue --verify: byte-identical (101 works, 2 collections)");
} else {
  fs.writeFileSync(OUT, body);
  console.log(`generate-wave7-b5-b6-k-catalogue — wrote ${works.length} works + ${collections.length} collections`);
}
