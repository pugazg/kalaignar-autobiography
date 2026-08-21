/**
 * Tests for இன்றைய குறள் selection.
 *
 *   npx tsx scripts/test-daily-kural.ts
 *
 * Plain assertions run by tsx — the repo has no test runner, and adding one for a pure function of
 * a date string would be a larger change than the thing under test. Exits non-zero on failure so it
 * can be wired into CI alongside the archival validators.
 */

import fs from "node:fs";
import path from "node:path";
import { getDailyKural, istDateString, fnv1a, TOTAL_KURALS } from "../lib/daily-kural";

let checks = 0;
const failures: string[] = [];
const ok = (cond: boolean, label: string) => { checks++; if (!cond) failures.push(label); };
const eq = <T,>(a: T, b: T, label: string) =>
  ok(a === b, `${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

// ── The edition's length must come from the released archive, not from a constant we chose ──────
const index = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "public/data/thirukkural/index.json"), "utf8"),
) as { counts: { kurals: number }; kurals: { number: number }[] };
eq(TOTAL_KURALS, index.counts.kurals, "TOTAL_KURALS matches the released index");
eq(index.kurals.length, index.counts.kurals, "released index row count");

// ── FNV-1a against published vectors, so a rewrite cannot silently change every day's Kural ─────
eq(fnv1a(""), 2166136261, "FNV-1a of the empty string is the offset basis");
eq(fnv1a("a"), 0xe40c292c, "FNV-1a('a')");
eq(fnv1a("foobar"), 0xbf9cf968, "FNV-1a('foobar')");

// ── Determinism: the same date always yields the same Kural ─────────────────────────────────────
{
  const fixed = "2026-08-21";
  const first = getDailyKural(fixed);
  let stable = true;
  for (let i = 0; i < 1000; i++) if (getDailyKural(fixed) !== first) stable = false;
  ok(stable, `${fixed} did not return a stable Kural across 1000 calls`);
  // Pinned expectation: if this changes, every reader's daily Kural changed with it.
  eq(first, 319, `${fixed} maps to a pinned Kural number`);
}

// ── A Date and its IST date string must agree, from any wall-clock instant ──────────────────────
{
  let agree = true;
  for (let i = 0; i < 2000; i++) {
    const d = new Date(Date.UTC(2020, 0, 1) + Math.floor(Math.random() * 3.15e11));
    if (getDailyKural(d) !== getDailyKural(istDateString(d))) agree = false;
  }
  ok(agree, "getDailyKural(Date) disagreed with getDailyKural(istDateString(Date))");
}

// ── Timezone independence: one instant is one Kural, wherever the reader is ─────────────────────
// 2026-08-21T20:00Z is 2026-08-22 01:30 in India — so it must serve the 22nd's Kural, not the 21st's.
{
  const instant = new Date("2026-08-21T20:00:00Z");
  eq(istDateString(instant), "2026-08-22", "an instant past 18:30 UTC is already the next Indian day");
  eq(getDailyKural(instant), getDailyKural("2026-08-22"), "that instant serves the Indian day's Kural");
  const before = new Date("2026-08-21T18:00:00Z"); // 23:30 IST, still the 21st
  eq(istDateString(before), "2026-08-21", "an instant before 18:30 UTC is still the same Indian day");
}

// ── Range: 10 000 dates must all land inside the edition ────────────────────────────────────────
{
  let out = 0;
  let nonInteger = 0;
  for (let i = 0; i < 10000; i++) {
    const d = new Date(Date.UTC(1900, 0, 1) + Math.floor(Math.random() * 6.3e12));
    const n = getDailyKural(d);
    if (!Number.isInteger(n)) nonInteger++;
    if (n < 1 || n > TOTAL_KURALS) out++;
  }
  eq(out, 0, "dates produced a Kural outside 1..1330");
  eq(nonInteger, 0, "dates produced a non-integer Kural");
}

// ── Distribution over four years: no collapse, no clustering, full range in use ──────────────────
{
  const counts = new Map<number, number>();
  const start = Date.UTC(2026, 0, 1);
  const days = 365 * 4;
  for (let i = 0; i < days; i++) {
    const n = getDailyKural(new Date(start + i * 86400000));
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  const distinct = counts.size;
  const worst = Math.max(...Array.from(counts.values()));
  // Not a uniformity proof — with 1460 draws from 1330 slots, repeats are expected. These bounds
  // only catch a hash that has collapsed: a constant, a short cycle, or a stuck high bit.
  ok(distinct > days * 0.6, `only ${distinct} distinct Kurals across ${days} days — hash may be degenerate`);
  ok(worst <= 6, `one Kural appeared ${worst} times in ${days} days — hash may be degenerate`);

  // Consecutive days must not walk in step; a sequential fallback would show up here immediately.
  let sequential = 0;
  for (let i = 1; i < days; i++) {
    const a = getDailyKural(new Date(start + (i - 1) * 86400000));
    const b = getDailyKural(new Date(start + i * 86400000));
    if (b === a + 1) sequential++;
  }
  ok(sequential < days * 0.02, `${sequential} of ${days} consecutive days advanced by exactly 1`);

  // All three பால் must be reachable — a reader should not only ever meet அறத்துப்பால்.
  const paal = new Set(
    Array.from(counts.keys()).map((n) => (n <= 380 ? 1 : n <= 1080 ? 2 : 3)),
  );
  eq(paal.size, 3, "four years of daily Kurals did not reach all three பால்");
  console.log(`  distribution: ${distinct} distinct Kurals over ${days} days, max repeat ${worst}, ` +
    `${sequential} sequential steps, ${paal.size}/3 பால் reached`);
}

// ── Malformed input is rejected rather than silently hashed ─────────────────────────────────────
for (const bad of ["21-08-2026", "2026-8-21", "today", ""]) {
  let threw = false;
  try { getDailyKural(bad); } catch { threw = true; }
  ok(threw, `getDailyKural("${bad}") should have thrown`);
}

// ── Report ──────────────────────────────────────────────────────────────────────────────────────
console.log(`\ndaily-kural — ${checks} checks · ${checks - failures.length} passed · ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log("  DAILY KURAL SELECTION — DETERMINISTIC, IN RANGE, WELL DISTRIBUTED\n");
