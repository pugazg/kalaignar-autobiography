// Client-safe English-text rule for Wave-7 Batch-1 cinema units. Kept in its OWN module (no node:fs/path)
// so the "use client" scene reader can import it without pulling the fs-using loader in data/wave7-cinema.ts
// into the browser bundle. The type import is erased at compile time, so this module has no runtime deps.
import type { Wave7CinemaUnit } from "./wave7-cinema";

/**
 * The source-established English reading text of one unit, exactly as the source presents it.
 *
 * Some source units (song/chant lyrics, and one dialogue unit) carry their English in a line-array
 * `english_lines` with an EMPTY `english_text`, so a renderer that reads only `englishText` would show
 * nothing. This is the single, source-faithful rule both the renderer and the fidelity validator use:
 * prefer the non-empty line array (joined with newlines, source line order preserved) and otherwise fall
 * back to `englishText`. The two are NEVER concatenated (no duplication), lyric/chant lineation is
 * preserved as line breaks (render with `whitespace-pre-line`), and nothing is inferred.
 */
export function unitEnglishText(u: Wave7CinemaUnit): string {
  return u.englishLines && u.englishLines.length > 0 ? u.englishLines.join("\n") : u.englishText;
}
