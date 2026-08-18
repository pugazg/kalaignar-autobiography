// Deterministic source-vs-vendored validation for உதயக் கதிர் / Udhaya Kathir (Phase 3).
// Compares the vendored public/data/speeches/udhaya-kathir/speech.json DIRECTLY against the
// authoritative transcript.md in the pinned assembly-speeches clone. Exits non-zero on any
// failure. Usage: node scripts/validate-udhaya-kathir.mjs <assembly-speeches-clone>

import fs from "node:fs";
import path from "node:path";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-udhaya-kathir.mjs <assembly-speeches-clone>");
  process.exit(1);
}
const SPEECH_DIR = path.join(SRC_REPO, "speeches/1970/1970-09-09-no-confidence-motion");
const VEND = path.join(process.cwd(), "public/data/speeches/udhaya-kathir/speech.json");

const fails = [];
const check = (cond, msg) => {
  console.log((cond ? "  ok  " : "FAIL  ") + msg);
  if (!cond) fails.push(msg);
};

const transcript = fs.readFileSync(path.join(SPEECH_DIR, "transcript.md"), "utf8");
const speech = JSON.parse(fs.readFileSync(VEND, "utf8"));

// Re-derive the source's ordered TEXT / HEAD lines for each section (structural markers
// removed), independent of the importer, so the comparison is a genuine cross-check.
function sourceLines(sectionRe, endRe) {
  const all = transcript.split("\n");
  const start = all.findIndex((l) => sectionRe.test(l));
  const end = endRe ? all.findIndex((l, i) => i > start && endRe.test(l)) : all.length;
  const out = { texts: [], heads: [], pages: new Set() };
  for (const raw of all.slice(start + 1, end === -1 ? all.length : end)) {
    const line = raw.replace(/\s+$/, "");
    if (line.trim() === "") continue;
    let m;
    if ((m = line.match(/^<!--\s*source-page:\s*(\d+)\s*-->$/)) || (m = line.match(/^###\s+Source page\s+(\d+)\s*$/i))) {
      out.pages.add(Number(m[1]));
      continue;
    }
    if ((m = line.match(/^##\s+(.*)$/))) {
      out.heads.push(m[1].trim());
      out.texts.push(m[1].trim());
      continue;
    }
    if (/^>\s?/.test(line)) {
      out.texts.push(line.replace(/^>\s?/, ""));
      continue;
    }
    if (/^#\s+/.test(line)) continue;
    out.texts.push(line);
  }
  return out;
}
const srcTa = sourceLines(/^#\s+தமிழ்\s*மூல\s*உரை/, /^#\s+English translation/i);
const srcEn = sourceLines(/^#\s+English translation/i, null);

// Vendored: flatten a stream to ordered text pieces (segments + heading + note texts).
function vendPieces(stream) {
  const texts = [];
  const heads = [];
  const pages = new Set();
  for (const b of stream.blocks) {
    if (b.kind === "heading") {
      heads.push(b.text);
      texts.push(b.text);
      if (b.sourcePage != null) pages.add(b.sourcePage);
    } else if (b.kind === "note") {
      texts.push(b.text);
    } else if (b.kind === "paragraph") {
      for (const s of b.segments) {
        texts.push(s.text);
        if (s.sourcePage != null) pages.add(s.sourcePage);
      }
    }
  }
  return { texts, heads, pages };
}
const vTa = vendPieces(speech.tamil);
const vEn = vendPieces(speech.english);

// Render a paragraph the way the reader does (join segments per joinToNext).
const renderPara = (p) =>
  p.segments.map((s, i) => (i === 0 ? "" : p.segments[i - 1].joinToNext === "space" ? " " : "") + s.text).join("");

// 1. source pages covered exactly 5–46
check(JSON.stringify(speech.sourcePages) === JSON.stringify(Array.from({ length: 42 }, (_, i) => i + 5)), "1. source pages covered are exactly 5–46");

// 2 & 7. printed section headings unchanged; no page marker became a heading
check(JSON.stringify(vTa.heads) === JSON.stringify(srcTa.heads), `2. Tamil section headings unchanged (${vTa.heads.length})`);
check(JSON.stringify(vEn.heads) === JSON.stringify(srcEn.heads), `2. English section headings unchanged (${vEn.heads.length})`);
check(vTa.heads.length === 29 && vEn.heads.length === 29, "7. exactly 29 headings each; no page marker became a heading");

// 3 & 8. Tamil reconstruction is byte-exact to the released transcription (structural markers removed)
check(vTa.texts.join("␟") === srcTa.texts.join("␟"), "3/8. Tamil text reconstructs the authoritative released transcription exactly (verbatim, in order)");

// 9. English text unchanged
check(vEn.texts.join("␟") === srcEn.texts.join("␟"), "9. English released text unchanged (verbatim, in order)");

// 6. no source-page marker silently lost
check([...vTa.pages].sort((a, b) => a - b).join(",") === [...srcTa.pages].sort((a, b) => a - b).join(","), "6. no Tamil source-page marker lost (page set matches source)");

// 4. p7→8 mid-word: rendered paragraph joins அனைவருக் + கும் with NO whitespace
const p78 = speech.tamil.blocks.find(
  (b) => b.kind === "paragraph" && b.segments.some((s) => s.text.endsWith("அனைவருக்")) && b.segments.some((s) => s.text.startsWith("கும்")),
);
check(!!p78, "4a. found the p7→8 paragraph (spans one logical paragraph)");
if (p78) {
  const r = renderPara(p78);
  check(r.includes("அனைவருக்கும்") && !r.includes("அனைவருக் கும்"), "4b. p7→8 renders 'அனைவருக்கும்' with NO inserted whitespace");
  check(p78.sourcePages.includes(7) && p78.sourcePages.includes(8), "4c. p7→8 paragraph retains source pages 7 and 8");
  const seg = p78.segments.find((s) => s.text.endsWith("அனைவருக்"));
  check(seg && seg.joinToNext === "none", "4d. the mid-word segment's joinToNext is 'none'");
}

// 5. p5→6 continuation: same logical paragraph, joined with a single space
const p56 = speech.tamil.blocks.find(
  (b) => b.kind === "paragraph" && b.segments.some((s) => s.text.endsWith("அந்த")) && b.segments.some((s) => s.text.startsWith("இடத்திலே")),
);
check(!!p56, "5a. found the p5→6 paragraph (single logical paragraph, not split)");
if (p56) {
  const r = renderPara(p56);
  check(r.includes("அந்த இடத்திலே"), "5b. p5→6 renders '...அந்த இடத்திலே...' as continuous prose (single space)");
  check(p56.sourcePages.includes(5) && p56.sourcePages.includes(6), "5c. p5→6 paragraph retains source pages 5 and 6");
}

// Extra: only the two documented mid-word joins exist
const midword = speech.tamil.blocks.filter((b) => b.kind === "paragraph").flatMap((b) => b.segments).filter((s) => s.joinToNext === "none");
check(midword.length === 2, `extra: exactly 2 mid-word ("none") joins in Tamil (documented p7→8, p17→18) — found ${midword.length}`);

console.log();
console.log("RESULT:", fails.length === 0 ? "ALL PASS" : `${fails.length} FAILURE(S)`);
process.exit(fails.length === 0 ? 0 : 1);
