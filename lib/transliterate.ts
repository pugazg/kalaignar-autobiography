/**
 * English → Tamil phonetic transliteration for SEARCH.
 *
 * Every text input on this site is a search/find box, so instead of an input
 * method editor (which must fight the keystroke buffer), we EXPAND the query:
 * the user's Latin text is kept as typed, and matching also runs against its
 * Tamil transliteration ("thondan" also matches தொண்டன்). Components show the
 * Tamil reading as a hint chip.
 *
 * Greedy longest-match over a standard phonetic scheme (ITRANS-adjacent, as
 * used by common Tamil typing tools): aa/A → ஆ, zh → ழ, th → த, ng → ங …
 */

const VOWELS: Record<string, { ind: string; sign: string }> = {
  aa: { ind: "ஆ", sign: "ா" }, A: { ind: "ஆ", sign: "ா" },
  ai: { ind: "ஐ", sign: "ை" },
  au: { ind: "ஔ", sign: "ௌ" },
  ii: { ind: "ஈ", sign: "ீ" }, I: { ind: "ஈ", sign: "ீ" }, ee: { ind: "ஈ", sign: "ீ" },
  uu: { ind: "ஊ", sign: "ூ" }, U: { ind: "ஊ", sign: "ூ" }, oo: { ind: "ஊ", sign: "ூ" },
  E: { ind: "ஏ", sign: "ே" }, ae: { ind: "ஏ", sign: "ே" },
  O: { ind: "ஓ", sign: "ோ" }, oa: { ind: "ஓ", sign: "ோ" },
  a: { ind: "அ", sign: "" },
  i: { ind: "இ", sign: "ி" },
  u: { ind: "உ", sign: "ு" },
  e: { ind: "எ", sign: "ெ" },
  o: { ind: "ஒ", sign: "ொ" },
};

const CONSONANTS: Record<string, string> = {
  // multi-letter first (greedy match relies on key length ordering below).
  // Tamil nasals are positional — the clusters bake in the assimilation:
  // nd→ண்ட (thondan), nn→ண்ண (anna), nj→ஞ்ச (nenju), ng→ங்க-family, n+p→ன்ப
  // (udanpirappu), gn→ஞ (kalaignar).
  ksh: "க்ஷ", ndr: "ன்ற", nth: "ந்த", nch: "ஞ்ச", ngk: "ங்க",
  nd: "ண்ட", nn: "ண்ண", nk: "ங்க", nj: "ஞ்ச", np: "ன்ப", nb: "ன்ப",
  nm: "ன்ம", gn: "ஞ", mb: "ம்ப",
  zh: "ழ", ch: "ச", th: "த", dh: "த", sh: "ஷ", Sh: "ஷ",
  ng: "ங", ny: "ஞ", tr: "ற்ற", Rr: "ற", ll: "ல்ல",
  k: "க", g: "க", c: "ச", s: "ச", S: "ஸ", j: "ஜ",
  t: "ட", d: "ட", T: "ட", D: "ட", N: "ண",
  n: "ந", p: "ப", b: "ப", m: "ம",
  y: "ய", r: "ர", R: "ற", l: "ல", L: "ள",
  v: "வ", w: "வ", z: "ஜ", h: "ஹ", f: "ஃப", q: "க", x: "க்ஸ",
};

const PULLI = "்";
const CONS_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length);
const VOWEL_KEYS = Object.keys(VOWELS).sort((a, b) => b.length - a.length);

function matchAt(src: string, i: number, keys: string[]): string | null {
  for (const k of keys) {
    if (src.startsWith(k, i)) return k;
  }
  return null;
}

/** Transliterate one Latin word into Tamil. Non-Latin input returns as-is. */
export function transliterateWord(word: string): string {
  if (!/^[A-Za-z]+$/.test(word)) return word;
  let out = "";
  let i = 0;
  const n = word.length;
  while (i < n) {
    const ck = matchAt(word, i, CONS_KEYS);
    if (ck) {
      const base = CONSONANTS[ck];
      i += ck.length;
      // single "n" is positional: word-initial ந (nalla → நல்ல), everywhere
      // else ன (manam → மனம், thondan → தொண்டன்)
      const cons = ck === "n" && out.length > 0 ? "ன" : base;
      const vk = matchAt(word, i, VOWEL_KEYS);
      if (vk) {
        out += cons + VOWELS[vk].sign;
        i += vk.length;
      } else {
        out += cons + PULLI;
      }
      continue;
    }
    const vk = matchAt(word, i, VOWEL_KEYS);
    if (vk) {
      out += VOWELS[vk].ind;
      i += vk.length;
      continue;
    }
    out += word[i];
    i += 1;
  }
  return out;
}

/** Transliterate a whole query, word by word; Tamil/digits pass through. */
export function transliterate(text: string): string {
  return text
    .split(/(\s+)/)
    .map((tok) => (tok.trim() ? transliterateWord(tok) : tok))
    .join("");
}

/** True when the query contains Latin letters worth transliterating. */
export function hasLatin(text: string): boolean {
  return /[A-Za-z]{2,}/.test(text);
}

/**
 * The forms a search should match against: the query as typed, plus its Tamil
 * transliteration when the query is Latin. Deduplicated.
 */
export function queryForms(q: string): string[] {
  const forms = [q];
  if (hasLatin(q)) {
    const ta = transliterate(q);
    if (ta !== q) forms.push(ta);
  }
  return forms;
}

/**
 * Phonetic fold for MATCHING only (never displayed): the letter families a
 * Latin query cannot distinguish are merged — ற→ர, ன/ண→ந, ள/ழ→ல — so
 * "udanpirappu" (உடன்பிரப்பு) still finds உடன்பிறப்பு. Apply to both the
 * haystack and the needle.
 */
export function fold(s: string): string {
  return s
    .replace(/ற/g, "ர")
    .replace(/[னண]/g, "ந")
    .replace(/[ளழ]/g, "ல")
    .toLowerCase();
}

/** Does `haystack` contain `q` in any form (raw, transliterated, folded)? */
export function matchesQuery(haystack: string, q: string): boolean {
  const h = haystack.toLowerCase();
  const hf = fold(haystack);
  return queryForms(q).some((f) => h.includes(f.toLowerCase()) || hf.includes(fold(f)));
}
