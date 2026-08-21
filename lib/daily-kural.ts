/**
 * இன்றைய குறள் — deterministic daily selection.
 *
 * One Kural per calendar day, the same one for every reader on earth. No database, no runtime
 * randomness, no per-visitor state: given a date, the answer is a pure function of that date.
 *
 * WHY A HASH RATHER THAN `dayOfYear % 1330`
 * A sequential walk would take 1330 days — three and a half years — to come back around, so most
 * readers would only ever meet the அறத்துப்பால் Kurals, in order, and the அதிகாரம் would change
 * only every ten days. Hashing the date scatters the choice across all three பால் so consecutive
 * days are unrelated, while staying completely reproducible.
 *
 * WHY FNV-1a
 * It is small enough to read in one sitting and verify by hand, has no dependencies, and is fully
 * specified — the same input gives the same output in any language, on any platform, forever. That
 * last property is the important one here: this value is a claim about a date, and it must not
 * drift because a runtime changed. A cryptographic hash would also work but buys nothing, since
 * nothing here needs to resist an adversary.
 *
 * WHY THE DATE IS COMPUTED IN Asia/Kolkata
 * "Today" has to mean one thing worldwide, and for this library that day is the Indian one. A
 * reader in Toronto at 22:00 sees the same Kural as a reader in Chennai, who is already in the next
 * morning. India observes no daylight saving, so the offset never shifts, but the zone is resolved
 * through `Intl` rather than by adding 5.5 hours by hand, so the rule stays correct by name rather
 * than by arithmetic.
 */

/** Total Kurals in the edition. Asserted against the released index by the test script. */
export const TOTAL_KURALS = 1330;

/** The calendar date in India, as `YYYY-MM-DD`. */
export function istDateString(date: Date = new Date()): string {
  // `en-CA` formats as YYYY-MM-DD, which is the ISO order without needing to reassemble parts.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * FNV-1a, 32-bit. Offset basis 2166136261, prime 16777619.
 * `Math.imul` keeps the multiply in 32-bit space; `>>> 0` keeps the result unsigned.
 */
export function fnv1a(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * The Kural number for a given day, 1..1330 inclusive.
 *
 * Accepts a `Date` (resolved to its Indian calendar date) or a `YYYY-MM-DD` string already in IST,
 * so callers that have the date string can avoid a redundant timezone round-trip and tests can pin
 * a date without constructing one.
 */
export function getDailyKural(date: Date | string = new Date()): number {
  const day = typeof date === "string" ? date : istDateString(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error(`getDailyKural expects a YYYY-MM-DD date string or a Date, received "${day}"`);
  }
  return (fnv1a(day) % TOTAL_KURALS) + 1;
}
