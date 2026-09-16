// Wave 6 — Batch 7 (Short Stories) internal manifest generator.
//
//   node scripts/build-wave6-b7-manifest.mjs "<path-to-kalaignar-short-stories checkout>"
//
// Deterministic. Reads ONLY a frozen source checkout (no runtime GitHub fetch). Writes
// data/internal/wave6/b7-short-stories.json — the durable, hidden P1 identity + provenance +
// owner-decided future-collection plan for the single combined Batch 7 (116 canonical short stories).
// Records discoverable:false / sitemapExposed:false / publicCollectionExposed:false / directRouteCount:0.
// It does NOT publish anything: no data/library.ts, no data/collections.ts, no routes, no sitemap.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const die = (m) => { throw new Error("b7-manifest: " + m); };
const SRC = process.argv[2] || `${process.env.KDL_SOURCES_DIR || ".sources"}/kalaignar-short-stories`;
if (!fs.existsSync(path.join(SRC, ".git")) && !fs.existsSync(path.join(SRC, "stories"))) die(`source checkout not found at ${SRC}`);
const git = (...a) => execFileSync("git", ["-C", SRC, ...a], { encoding: "utf8" }).trim();

const SOURCE_REPO = "pugazg/kalaignar-short-stories";
const SOURCE_COMMIT = "7205a10892d0b208df2617766844f480b6a2c798";
const SOURCE_TREE = "1be34cc368fbc96ff72933a004a074ef840168ee";

// The control commit that authorized this exact Batch-7 population (merged via PR #32). Pinned so the
// implementation manifest can be proven set-equal to the frozen control artifact, not to moving main.
const CONTROL_REPO = "pugazg/kalaignar-tribute";
const CONTROL_COMMIT = "ceccd2a5cf506a6f46ad6ec8baf892abf9c17a70";
const CONTROL_MANIFEST_PATH = "projects/kalaignar-digital-library/WAVE6_BATCH7_SHORT_STORIES.md";

// ── SOURCE-FREEZE PREFLIGHT — fail closed before deriving any pin or writing the manifest ──
{
  const headCommit = git("rev-parse", "HEAD");
  if (headCommit !== SOURCE_COMMIT) die(`checkout HEAD ${headCommit} != frozen source commit ${SOURCE_COMMIT}`);
  const headTree = git("rev-parse", "HEAD^{tree}");
  if (headTree !== SOURCE_TREE) die(`checkout root tree ${headTree} != frozen source tree ${SOURCE_TREE}`);
}

// ── The verified 116 canonical Batch-7 slugs, grouped by internal validation/provenance partition ──
// (validation partitions only — Batch 7 is ONE combined implementation batch.)
const G2008 = ["antha-naal-vanthilai","appadithan-sirippen","aththiri-paachaa","edukkavo-kokkavo","ezhuchikku-adaiyaalam","ice-katti","idhayam-pesugirathu","idikkup-pin-mazhai","iramanai-patri-iraman","jaadi-kutti-poduma","kadamai-kanniyam-kattuppadu","kaniyum-kanaiyum","kannil-kaal","kazhuthaiyin-kathai","koottani","maanum-perumaanum","mamiyar-udaithaal-mattum-manchattiya","mayil-ravanan","naakkuth-tamil-manakkum","nadakkuma-nadakkatha","nalvazhiyum-nalla-vazhiyum","nandri-sollum-neram","neethi-devathaiye","onnu-kuduma","paarur-pola","panithuliyil-panai-maram","panthalile-paagarkai","porumaikku-saandru","pulivaal","saavi-thaan-illai","seera-vendama","seruppodu-iru","thalaiyil-malai","thalaiyum-nuniyum","thamizan-endru-sollada","theriyatha-pechu","thum-pam-theem-thom","unakku-vayathenna","vennai-uruguthu-veyilil","verum-kai-muzham-podum"];
const G2004 = ["aabasame-aabasam","aadik-kaatre","aandavan-dharisanam-kodutha-oor","adutha-piraviyil-aindhu-kanavan","anthak-kaalathile","aval-sonnaal","ilamai-kaalam","ilangai-mannar-parambarai","iruvarum-koodiyiruppathu-aathi-maalaithaan","kadalai-thoorppathu-miga-elithu","kaithiyin-kathai","kalliyum-rojavum","kazhuthile-oru-mudichu-atharku-oru-kathai","kizhavanin-manaivi","kollappada-vendiyathu-puli-aanaal","kootruvan-eppadip-mariththaan","krishnanaiyum-vidaatha-saathi","kuruvi-rameswaram","malaiyai-thookkuven","manaivi-sonna-vilakkam","muthiyavar-theerppu","naatham-ezhaathu-narambuthaan-arum","neeyum-kaithi-naanum-kaithi","pengalukku-en-meesai-thadiyillai","pudhir","pugazhe-nee-oru-pudhir","sirai-kodiyathu","sorgaththirku-vandhathu-eppadi","thalaivanin-parisu","uyirukku-vilai-aimbathu-latcham","valluvar-sonna-poi","veeran-thalai-kavizhnthathu-en","veeravadi","vignaanikku-thondraathu"];
const G1987 = ["agaththinai-anbu","buddhar-unarththiya-unmai","hajrath-aliyum-yuthanum","iru-nigazhvugal","jayathrathanin-veezhchi","kadu-sendra-kumanan","kajini-mugamathuvum-kavignar-pardosiyum","kurikkol","kuzhanthaiyum-kiliyum","mana-maatram","mannanum-kuruviyum","mooli-mookkukkaran","narayana-narayana","paalum-thanneerum","pugazhendhip-pulavar-kathai","samiyarum-pookkariyum","sorgaththirku-senruvantha-azhagi","thenaliraman-kathai","thenaliraman-poonai","thennai-marathil-pul","thuraviyum-seedargalum","valvil-ori","yasodhara-kaviyam"];
const G2009 = ["anil-kunju","ezhuthalar-ekalaivan","gandhi-desam","kollaipuram","malaravillai"];
const G1982 = ["petra-pillaiyai-vitra-thaai","kaasa-lesa","seemaan-veettu-seekkaali","nandiyur-nariyappan","nariyur-nandiyappan","mudiyatha-thodarkathai"];
const GPERIODICAL = ["seerazhitha-sirippu","madurai-selavu","kondru-varuga"];
const G1976 = ["naattiya-kalarani","maanam"];
const G1969 = ["neruppu"];
const G1953T = ["vilaiyal-vangalaiyo"];
const G1997 = ["nanbana"];

const GROUPS = [
  { group: "2008", label: "கலைஞர் சொன்ன கதைகள் (2008)", collectionDir: "collections/2008-kalaignar-sonna-kathaigal", slugs: G2008, publicCollectionPlanned: true, plannedCollectionMembers: [...G2008] },
  { group: "2004", label: "கலைஞரின் குட்டிக் கதைகள் (2004)", collectionDir: "collections/2004-kalaignarin-kuttik-kathaigal", slugs: G2004, publicCollectionPlanned: true, plannedCollectionMembers: [...G2004] },
  { group: "1987", label: "கலைஞர் சொன்ன குட்டிக் கதைகள் (1987, 2nd ed.)", collectionDir: "collections/1987-kalaignar-sonna-kuttik-kathaigal", slugs: G1987, publicCollectionPlanned: true,
    // 25 source members = 23 new canonicals + 2 existing-canonical cross-memberships (NOT new works).
    plannedCollectionMembers: [...G1987, "jaadi-kutti-poduma", "kuruvi-rameswaram"] },
  { group: "2009", label: "16 கதையினிலே (2009, 4th ed.)", collectionDir: "collections/2009-16-kathaiyinile", slugs: G2009, publicCollectionPlanned: true,
    // 16 source members = 5 new canonicals + 11 existing 1977-anthology canonicals via plural membership.
    plannedCollectionMembers: [...G2009, "sumanthaval", "pugazhendhi", "nalayini", "kuppai-thotti", "sangilichami", "thappivittargal", "thappavillai", "ezhai", "kannadakkam", "vazha-mudiyathavargal", "ayyo-raja"] },
  { group: "1982", label: "முடியாத தொடர்கதை (1982)", collectionDir: "collections/1982-mudiyatha-thodarkathai", slugs: G1982, publicCollectionPlanned: true, plannedCollectionMembers: [...G1982] },
  { group: "periodical", label: "Periodical canonicals (Kanchi/Murasoli Pongal Malar)", collectionDir: null, slugs: GPERIODICAL, publicCollectionPlanned: false, plannedCollectionMembers: [] },
  { group: "1976", label: "நளாயினி (1976)", collectionDir: "collections/1976-nalayini", slugs: G1976, publicCollectionPlanned: false, plannedCollectionMembers: [] },
  { group: "1969", label: "கண்ணடக்கம் (1969)", collectionDir: "collections/1969-kannadakkam", slugs: G1969, publicCollectionPlanned: false, plannedCollectionMembers: [] },
  { group: "1953-thappivittargal", label: "தப்பிவிட்டார்கள் (1953)", collectionDir: "collections/1953-thappivittargal", slugs: G1953T, publicCollectionPlanned: false, plannedCollectionMembers: [] },
  { group: "1997", label: "திராவிட இயக்க எழுத்தாளர் சிறுகதைகள் (1997)", collectionDir: "collections/1997-dravida-iyakka-ezhuthalar-sirukathaigal", slugs: G1997, publicCollectionPlanned: false, plannedCollectionMembers: [] },
];

// Witness-only source relations (provenance only; NEVER new LibraryWorks).
const WITNESSES = {
  "1987": { newCanonicals: 23, witnessOnly: 2, witnessIds: ["jaadi-kutti-poduma", "kuruvi-rameswaram"], note: "araabiya-kathai heading → witness of jaadi-kutti-poduma; kuruvi-rameswaram → existing 2004 canonical." },
  "2009": { newCanonicals: 5, witnessOnly: 11, witnessIds: ["sumanthaval", "pugazhendhi", "nalayini", "kuppai-thotti", "sangilichami", "thappivittargal", "thappavillai", "ezhai", "kannadakkam", "vazha-mudiyathavargal", "ayyo-raja"], note: "All 11 are already-implemented 1977-anthology canonicals; controlling Tamil/English remains 1977; 2009 is later-edition witness evidence." },
  "1976": { newCanonicals: 2, witnessOnly: 6, witnessIds: ["nalayini", "kadhal-kaditham", "puratchip-padam", "visham-inidhu", "palaivana-roja", "ayyo-raja"], note: "Existing canonicals; 48/48 witness pages CLOSED." },
  "1997": { newCanonicals: 1, witnessOnly: 8, witnessIds: ["kuppai-thotti", "ezhai", "kannadakkam", "sabalam", "originalil-ullapadi", "sangilichami", "thothukkili", "pretha-visaranai"], note: "Existing canonicals witnessed by the 1997 source." },
  "1953-thappivittargal": { newCanonicals: 1, witnessOnly: 3, witnessIds: ["thappivittargal", "sabalam", "munnuru-rupai"], note: "Existing-canonical witnesses." },
  "1969": { newCanonicals: 1, witnessOnly: 3, witnessIds: ["kannadakkam", "veniyin-kadhalan", "amirthamathi"], note: "Existing canonicals witnessed; source closed under the only available copy." },
  "periodical": { newCanonicals: 3, witnessOnly: 1, witnessIds: ["panangulai"], note: "panangulai (Murasoli Pongal Malar 1977) is an existing-canonical cross-witness, not a new canonical." },
  "zero-new-canonical-programmes": { sources: ["1950-vazha-mudiyathavargal", "1953-naadum-naadagamum", "1956-thaaymai", "1979-pazhakkoodai"], note: "Completed witness/provenance programmes contributing 0 Batch-7 works." },
};

// Cross-repository intentional exclusions (owner-clarified; NOT Batch-7 works).
const EXCLUSIONS = {
  thenalaigai: { source: "collections/1958-thenalaigal", sourcePdf: "TVA_BOK_0064030", mappedHeadings: 12, reason: "Already represented in the essays / கட்டுரைகள் workstream under மீசை முளைத்த வயதில் (cross-repository overlap). The 12 mapped headings are NOT Batch-7 short-story candidates; do not reopen." },
  "nadutheru-narayani": { reason: "Handled through the separate அரும்பு / short-novel source path; intentionally outside the short-story programme." },
};

// ── Assemble ──────────────────────────────────────────────────────────────────────────────────────
const allSlugs = GROUPS.flatMap((g) => g.slugs);
if (allSlugs.length !== 116) die(`expected 116 slugs, got ${allSlugs.length}`);
if (new Set(allSlugs).size !== 116) die("duplicate slug across groups");

// 1977 anthology members (already implemented) — read from the source collection, for the disjointness proof.
const anthologyDir = path.join(SRC, "collections/1977-kalaignar-karunanidhiyin-sirukathaigal");
const members1977 = new Set(
  execFileSync("bash", ["-c", `grep -rhoE 'stories/[a-z0-9-]+' ${JSON.stringify(anthologyDir)} | sed 's|stories/||' | sort -u`], { encoding: "utf8" }).trim().split(/\s+/).filter(Boolean),
);
for (const s of allSlugs) {
  if (members1977.has(s)) die(`Batch-7 slug ${s} is a 1977 anthology member (duplication)`);
  if (s === "kizhavan-kanavu") die("kizhavan-kanavu must not be a Batch-7 work");
  if (!fs.existsSync(path.join(SRC, "stories", s))) die(`source workspace missing: stories/${s}`);
}
for (const bad of ["muthaaram", "thenalaigal"]) if (allSlugs.includes(bad)) die(`excluded thenalaigai heading present: ${bad}`);
if (allSlugs.includes("nadutheru-narayani") || allSlugs.includes("nadutheru-naaraayani")) die("nadutheru-narayani must be absent");

const subtreePin = (slug) => { const o = git("ls-tree", "HEAD", `stories/${slug}`); const m = o.match(/^\d+ tree ([0-9a-f]{40})\t/); if (!m) die(`no subtree pin for ${slug}`); return m[1]; };
const collPin = (dir) => { if (!dir) return null; const o = git("ls-tree", "HEAD", dir); const m = o.match(/^\d+ tree ([0-9a-f]{40})\t/); return m ? m[1] : null; };

const groupsOut = GROUPS.map((g) => ({
  group: g.group,
  label: g.label,
  newCanonicalCount: g.slugs.length,
  collectionDir: g.collectionDir,
  collectionSubtreePin: collPin(g.collectionDir),
  publicCollectionPlanned: g.publicCollectionPlanned,
  plannedCollectionMemberCount: g.publicCollectionPlanned ? g.plannedCollectionMembers.length : 0,
  plannedCollectionMembers: g.publicCollectionPlanned ? g.plannedCollectionMembers : [],
  slugs: g.slugs.map((slug) => ({ slug, subtreePin: subtreePin(slug) })),
}));

const manifest = {
  note: "Wave 6 Batch 7 (Short Stories) — HIDDEN P1 data-foundation manifest. One combined implementation batch of 116 canonical short stories. Internal groups are validation/provenance partitions only. P1 publishes NOTHING: no catalogue, no /read discovery, no sitemap, no public collection, no reader routes. Generated by scripts/build-wave6-b7-manifest.mjs from a frozen source checkout; do not edit by hand.",
  wave: 6,
  batchId: "b7-short-stories",
  batch: 7,
  family: "short-stories",
  shelf: "fiction",
  sourceRepo: SOURCE_REPO,
  sourceCommit: SOURCE_COMMIT,
  sourceTree: SOURCE_TREE,
  controlAuthority: {
    note: "The frozen control artifact that authorized this exact 116-work Batch-7 population (merged via kalaignar-tribute PR #32). The Batch-7 validator proves this implementation manifest is set-equal to that pinned control manifest, not to moving control main.",
    repo: CONTROL_REPO,
    commit: CONTROL_COMMIT,
    manifestPath: CONTROL_MANIFEST_PATH,
  },
  workCount: 116,
  groupSum: `40 + 34 + 23 + 5 + 6 + 3 + 2 + 1 + 1 + 1 = 116`,
  refreshedWave6CompletedPopulation: 138,
  discoverable: false,
  sitemapExposed: false,
  publicCollectionExposed: false,
  directRouteCountP1: 0,
  groups: groupsOut,
  witnesses: WITNESSES,
  exclusions: EXCLUSIONS,
  futurePublicCollections: {
    count: 5,
    note: "Owner-decided future public collections (NOT created in P1; recorded for design only). No /collections routes and no data/collections.ts entries are added by P1.",
    plan: GROUPS.filter((g) => g.publicCollectionPlanned).map((g) => ({ group: g.group, memberCount: g.plannedCollectionMembers.length })),
  },
  separatelyImplemented: { note: "Already implemented and NOT part of Batch 7", the1977Anthology: members1977.size, kizhavanKanavu: true },
};

const OUT = path.join(process.cwd(), "data/internal/wave6/b7-short-stories.json");
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 1) + "\n");
console.log(`b7 manifest written: ${OUT}`);
console.log(`  works ${manifest.workCount} | groups ${groupsOut.length} | future collections ${manifest.futurePublicCollections.count}`);
console.log(`  group counts: ${groupsOut.map((g) => g.group + "=" + g.newCanonicalCount).join(" ")}`);
