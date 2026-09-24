// Wave 8 P2 — the public-safe rule for NON-AUTHORED prose (translator notes, archive descriptions).
//
// The archive's apparatus mixes two kinds of sentence. Genuine, durable clarification ("`மச்சான்` is retained as
// *machan* …", "figures are preserved as source claims, not independently verified") belongs to readers. Workflow
// prose — the stage a file reached, what it was closed or audited against, who adjudicated a scan and when, which
// capture pass recorded it, where its authority file lives — is audit history. It stays in the hidden P1 data and is
// never part of a public reader payload. Filtering happens sentence by sentence (and clause by clause within a
// sentence), keeping every surviving word verbatim: nothing is paraphrased, reworded or added.
//
// Applied ONLY to apparatus, never to Kalaignar's text or to a translation body.

/** Workflow / status / authority phrasing. Each pattern names a specific process fact, not a general word. */
export const PROCESS_PATTERNS: readonly RegExp[] = [
  /\bImmediate authority\b/i,
  /\baudited\b/i,
  /\bcanonical (Tamil|record|artifact|page)\b/i,
  /\b(closed|locked) (Tamil|scene|source|artifact|layer|files?)\b/i,
  /\bsource-closed\b/i,
  /\blocked\b[^.;]*\b(conventions?|glossary|treatment|artifact|scene|source|Tamil|layer|line)\b/i,
  /\b(alignment|translation) (has been|was) (verified|reviewed)\b/i,
  /\b(reproduced|preserved) (in full )?below\b/i,
  /\b(terminal|explicit) holds?\b|\bheld (action|word|lodging)\b|\bsource hold\b|\bhold status\b|\binherit (that|the|this) hold\b|\bsource-secure\b/i,
  /\bresolved (Tamil|action|word)\b/i,
  /\bpilot (translation|conventions)\b/i,
  /\b(bilingual|source)[- ](source-)?alignment review\b|\bpassed [a-z -]*review\b|\beditorial review\b/i,
  /\buser[- ](source )?(adjudicat\w*|transcription)\b|\badjudicated (from|on)\b|\bsource adjudication\b/i,
  /\bScans? \d+(\s*(,|and|–|-)\s*\d+)* (is|are|was|were|remains?)\b/i,
  /\bformerly held\b|\bglobally blocked\b/i,
  /\bPass-\d\b|\bWFV\b|\bGate [A-Z]\d?\b/,
  /\bno OCR\b|\bOCR (reconstruction|completion)\b|\bPDF redrafting\b/i,
  /\bsecondary (published )?English witness\b|\bcross-witness\b/i,
  /\breproduced below and remains authoritative\b|\bfollows and remains authoritative\b/i,
  /`[^`]*\.md`/,
];

export const isProcessText = (s: string) => PROCESS_PATTERNS.some((re) => re.test(s));

/** Split one paragraph into sentences, and each sentence into `;`-clauses, keeping the separators. */
function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z`*“"(஀-௿])/);
}

/** Drop process sentences / clauses from one line of apparatus prose; return what survives (verbatim) or "". */
export function publicSentences(line: string): string {
  const kept: string[] = [];
  for (const s of sentences(line)) {
    if (!isProcessText(s)) { kept.push(s); continue; }
    const clauses = s.split(/;\s+/);
    if (clauses.length > 1) {
      const ok = clauses.filter((c) => !isProcessText(c));
      if (ok.length) kept.push(ok.join("; ").replace(/[,;:]\s*$/, "") + (/[.!?]$/.test(ok[ok.length - 1]) ? "" : "."));
    }
  }
  return kept.join(" ").trim();
}

/**
 * Public-safe form of a block of apparatus prose: Markdown list items (`- …`) and blockquote lines are filtered one
 * by one; an item left empty is dropped, as is a heading-only remainder. Returns null when nothing public remains.
 */
export function publicApparatus(text: string | null): string | null {
  if (!text) return null;
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    const m = raw.match(/^(\s*(?:[-*]\s+|>\s?)?)(.*)$/)!;
    const [prefix, body] = [m[1], m[2]];
    if (!body.trim()) { if (out.length && out[out.length - 1].trim() !== prefix.trim()) out.push(raw); continue; }
    if (/^\*\*[^*]+\*\*$/.test(body.trim())) { out.push(raw); continue; } // a bold label (e.g. "Translator’s note")
    const kept = publicSentences(body);
    if (kept) out.push(prefix + kept);
  }
  const joined = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  // Only labels / empty quote markers left → nothing public.
  const substantive = joined.split("\n").some((l) => { const b = l.replace(/^\s*(?:[-*]\s+|>\s?)?/, "").trim(); return b && !/^\*\*[^*]+\*\*$/.test(b); });
  return substantive ? joined : null;
}
