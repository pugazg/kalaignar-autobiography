# Higgsfield — setup status & required action

## Status: CONNECTED, but BLOCKED on credits + no dedicated Tamil voice
Checked on the proof date via the Higgsfield MCP connector:

- **Connector:** ✔ connected (image / video / voice generation tools available).
- **Balance:** **0 credits · free plan.** No generation can run until funded.
- **Costs (preflight — nothing was spent):**
  - Video (`kling3_0_turbo`, 5 s, 16:9) ≈ **7.5 credits per clip** → 3 test clips ≈ **22.5**.
  - Speech (`seed_audio`, short line) ≈ **0.4 credits** → 20–30 s voice test ≈ **1–2**.
- **Tamil voice:** ⚠ **No dedicated Tamil preset** among the 65 built-in voices (all
  English/Western: Emily, John, Marcus, Naomi…). The Seed Audio engine is multilingual and
  *may* read Tamil, but this is **unverified**, and Tamil TTS is error-prone (a Latin voice
  reads only digits/punctuation). Quality must be proven with a small **paid** test before any
  narration.

**No clips and no audio were generated** (0 credits). No trial started, no credits bought — those
are your financial decisions.

## Exact manual action required from you (choose)
1. **Fund generation:**
   - (a) Start the Higgsfield **free 3-day $0 Plus trial** — *requires a card and auto-charges
     after 3 days unless cancelled* (say "cancel auto-renewal" to stop). This is a financial
     commitment; I will only start it on your explicit "yes". **or**
   - (b) **Top up credits** (one-time pack). Say the word and I'll open the pricing widget with
     checkout links.
2. **Approve a tiny Tamil-voice test first** (≈1–2 credits once funded): I generate the 20–30 s
   `narration-test-ta.md` in 1–2 Seed Audio voices and you judge Tamil pronunciation
   (நெஞ்சுக்கு நீதி · மு. கருணாநிதி · திருக்குவளை · 1924 · வரலாறு). If it fails, we switch to a
   human Tamil narrator or another engine — **before** spending on visuals.
3. Only after 1 + 2 pass do we spend ~22.5 credits on Test A/B/C.

## Generation log (filled only when media actually exists)
| item | model | settings | seed | output-ID | cost/credits | date | status |
|---|---|---|---|---|---|---|---|
| Voice test | seed_audio | — | — | — | ~0.4/line | — | not generated (0 credits) |
| Test A | kling3_0_turbo | 5 s · 16:9 | — | — | ~7.5 | — | not generated (0 credits) |
| Test B | kling3_0_turbo | 5 s · 16:9 | — | — | ~7.5 | — | not generated (0 credits) |
| Test C | kling3_0_turbo | 5 s · 16:9 | — | — | ~7.5 | — | not generated (0 credits) |
