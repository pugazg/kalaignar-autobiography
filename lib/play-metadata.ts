// Structure-aware Next.js metadata descriptions for the Drama family.
//
// The `/plays/[slug]` and `/plays/[slug]/[scene]` page metadata must state the SOURCE's actual
// released structure — never reduce every non-continuous work to "N scenes", never manufacture a
// "Scene N" the source does not print, and never emit "Scene null", "0 scenes", or "Scene 1 of 0".
// These helpers are the single authority both page `generateMetadata` functions call, so the
// Batch-2 metadata regression test can assert on the exact strings Next.js will emit.
import type { Play, PlayReadingUnit } from "@/data/plays";

/** Format a scene-number set as a range ("2–5") when contiguous, else a list ("2, 3, 5"). */
function fmtNums(nums: number[]): string {
  if (nums.length === 0) return "";
  const s = [...nums].sort((a, b) => a - b);
  const contiguous = s.every((n, i) => i === 0 || n === s[i - 1] + 1);
  return contiguous && s.length > 1 ? `${s[0]}–${s[s.length - 1]}` : s.join(", ");
}

/** The truthful structural phrase for a play's landing description. */
export function playStructurePhrase(play: Play): string {
  if (play.structureKind === "continuous-play") return "one continuous dramatic text with no scene division";
  if (play.structureKind === "editorial-sru-sequence") {
    return `${play.readingUnits.length} editorial source-representation units; the source prints no scene numbers or acts`;
  }
  // scene-sequence — describe the ACTUAL mix, never collapse a compressed range or an unnumbered
  // scene into a plain "N scenes".
  const numbered = play.readingUnits.filter((u) => u.kind === "scene").length;
  const compressed = play.readingUnits.filter((u) => u.kind === "compressed-scene-range");
  const unnumbered = play.readingUnits.filter((u) => u.kind === "unnumbered-scene").length;
  if (compressed.length === 0 && unnumbered === 0) return `${numbered} source-numbered scenes`;
  const bits: string[] = [`${numbered} individually numbered scenes`];
  for (const c of compressed) bits.push(`one source-compressed Scenes ${fmtNums(c.sceneRange ?? [])} block`);
  if (unnumbered > 0) bits.push(unnumbered === 1 ? "one unnumbered scene" : `${unnumbered} unnumbered scenes`);
  return `${play.readingUnits.length} source-visible dramatic reading units: ${bits.join(", ")}`;
}

/** The author phrase — qualified where the selected source range prints no author line. */
export function playAuthorPhrase(play: Play): string {
  const a = play.authorAttribution;
  if (a && a.basis === "user-supplied-catalogue") {
    return `Catalogue attribution to ${play.author.en} is user-supplied; the selected source range does not itself print an author line.`;
  }
  return `by ${play.author.en}`;
}

/** The full landing-page description string Next.js emits. */
export function playLandingDescription(play: Play): string {
  const parts: string[] = [playStructurePhrase(play)];
  if (play.closingTableauCount > 0) parts.push("a closing tableau");
  if (play.openingNote) parts.push(play.openingNote.labelEn.toLowerCase());
  const structure = parts.join(", ");
  if (play.authorAttribution && play.authorAttribution.basis === "user-supplied-catalogue") {
    // No unqualified "by …" — the qualification follows the structural summary.
    return `${play.descriptor.en} — ${structure}, from the printed edition. ${playAuthorPhrase(play)}`;
  }
  return `${play.descriptor.en} ${playAuthorPhrase(play)} — ${structure}, from the printed edition.`;
}

/** The full child (reading-unit) description string Next.js emits, by reading-unit kind. */
export function playSceneDescription(play: Play, scene: PlayReadingUnit): string {
  const total = play.readingUnits.length;
  const mixed = play.readingUnits.some((u) => u.kind === "compressed-scene-range" || u.kind === "unnumbered-scene");
  switch (scene.kind) {
    case "closing-tableau":
      return `The unnumbered closing tableau of ${play.title.en} — not Scene 39.`;
    case "continuous-body":
      return `${play.title.en} — the complete continuous dramatic text, which the source prints without any scene division.`;
    case "compressed-scene-range":
      return `Source-compressed Scenes ${fmtNums(scene.sceneRange ?? [])}, preserved as one reading unit; no separate scene text is reconstructed.`;
    case "unnumbered-scene": {
      const idx = play.readingUnits.findIndex((u) => u.slug === scene.slug);
      const prevNum = [...play.readingUnits.slice(0, idx)].reverse().find((u) => u.kind === "scene" && u.order != null)?.order ?? null;
      const nextNum = play.readingUnits.slice(idx + 1).find((u) => u.kind === "scene" && u.order != null)?.order ?? null;
      const between = prevNum != null && nextNum != null ? ` between Scene ${prevNum} and Scene ${nextNum}` : "";
      const missing = prevNum != null && nextNum != null ? Array.from({ length: nextNum - prevNum - 1 }, (_, k) => prevNum + 1 + k) : [];
      const noAssign = missing.length
        ? `; no Scene ${missing.length === 2 ? missing.join(" or ") : missing.join(", ")} number is assigned`
        : "; no scene number is assigned";
      return `Source-visible unnumbered scene${between}${noAssign}.`;
    }
    case "source-representation-unit": {
      const ordinal = play.readingUnits.findIndex((u) => u.slug === scene.slug) + 1;
      return `Source-representation unit ${ordinal} of ${total} — editorial navigation, not a source scene number.`;
    }
    default:
      // Ordinary source-numbered scene. For a MIXED-structure work (a compressed range / unnumbered
      // scene present) "Scene N of ${sceneCount}" would mislead, so name it a source-numbered scene.
      return mixed
        ? `Source-numbered Scene ${scene.order} — ${scene.titleEn}.`
        : `Scene ${scene.order} of ${play.sceneCount} — ${scene.titleEn}.`;
  }
}
