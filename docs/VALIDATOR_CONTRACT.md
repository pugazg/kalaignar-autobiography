# Validator contract

Every published work in the Digital Library has a validator under `scripts/validate-*.mjs` that
proves the released data in `public/data/` still matches the source archive it claims to come from.
There are nine of them. They were written one at a time, alongside the works they check, and they do
not currently agree on how to report *why* they failed.

This document defines the contract they should all meet. It is a description of intent plus a record
of the current gap — **no validator is changed by this document**. Migration is tracked below and is
done one validator per commit.

## Exit codes

| Code | Meaning | The question it answers |
|---:|---|---|
| `0` | Validation passed | The released data matches the source. |
| `1` | Data / content integrity failure | **The archive and the released data disagree.** |
| `2` | Configuration, environment, or source unavailable | **The check could not be run at all.** |

The distinction between `1` and `2` is the whole point, and it is not cosmetic.

`1` is a claim about the library's content: something in `public/data/` no longer reflects the
source, and a person needs to look at the text. `2` is a claim about the run: the source clone was
missing, at the wrong commit, or unreadable, so nothing was learned either way.

Conflating them is dangerous in one specific direction. A CI job that reports `1` for a missing
clone invites the reading "the data is broken", when the truth is "we did not check". The opposite
misreading is worse: a run that could not fetch its source must never be mistaken for a run that
found nothing wrong. **Absence of validation is not evidence of validity** — the same principle the
importers apply to the archive itself.

### What belongs in each code

**`2` — could not run.** No argument supplied; the source path does not exist; it exists but is not
a git repository; the pinned commit is not present in it; the pin is not a commit at all; the
released data or its `provenance.json` is missing or unparseable; the upstream manifest no longer
records the identity level the work was released under. In every case the validator has learned
nothing about the data and must say so.

**`1` — checked, and it is wrong.** Any assertion about the released content failing: a missing or
duplicated unit, text that differs from the source, absent provenance, a broken structural
invariant, released material that traces to a source the work excludes.

**`0`** is reserved for a complete run with zero failed assertions. A validator must never exit `0`
because it found nothing to check — a vacuous pass is a defect, and validators should assert that
their own inputs were non-empty.

## Required behaviour

1. **Take the source clone as `argv[2]`.** No environment-variable fallback for the path itself;
   `npm run validate` supplies it via `${KDL_SOURCES_DIR:-.sources}`.
2. **Refuse to run unpinned.** Compare `git rev-parse HEAD` of the clone against the commit recorded
   in the work's own `provenance.json`. A mismatch is `2`: validating against a different revision
   proves nothing about the released data.
3. **Read the pin from the released data**, never hardcode it. If a pin moves, the validator follows
   it — this is also how `.github/workflows/library-ci.yml` decides what to fetch.
4. **Derive expectations from the source, not from the importer.** A validator must not import from
   its importer, or a defect in the importer will validate itself. Counts in particular should be
   computed from the archive rather than written as constants.
5. **Report a count.** Print assertions attempted, passed and failed, and on failure name the unit
   and what differed. A validator that prints only "FAILED" makes the next person re-derive it.
6. **Be deterministic.** Same inputs, same output, same exit code.

## Current conformance

Measured by running each validator with a missing path and with no argument at all
(2026-08-21, `main` `8c11fae`):

| Validator | missing source | no argument | conformant |
|---|---:|---:|:--:|
| `validate-thirukkural.mjs` | `2` | `2` | ✅ |
| `validate-manohara.mjs` | `2` | `1` | ⚠️ partial |
| `validate-arappor.mjs` | `1` | `1` | ❌ |
| `validate-balipeedam-nokki.mjs` | `1` | `1` | ❌ |
| `validate-idhayathai-thanthidu-anna.mjs` | `1` | `1` | ❌ |
| `validate-poonthottam.mjs` | `1` | `1` | ❌ |
| `validate-sakkaravarththiyin-thirumagan.mjs` | `1` | `1` | ❌ |
| `validate-silappathikaram.mjs` | `1` | `1` | ❌ |
| `validate-udhaya-kathir.mjs` | `1` | `1` | ❌ |

Only `validate-thirukkural.mjs` meets the contract on both paths. `validate-manohara.mjs` has the
`die() → exit 2` helper for an unusable source but still exits `1` when invoked with no argument at
all, so it is a partial reference, not a complete one.

This gap has a visible consequence today. Running `npm run validate` on a machine without
`.sources/` stops at the first validator and exits `2` — because that validator happens to be
Manohara. Had the chain begun with any of the seven, the same missing-source condition would have
reported `1`, indistinguishable from corrupted data.

## Migration

One validator per commit, each with negative tests proving both paths, and no behaviour change
beyond the exit code and its message.

1. `validate-thirukkural.mjs` — already conformant; confirm with tests and treat as the reference.
2. `validate-manohara.mjs` — fix the usage guard only.
3. The remaining seven, in any order.

For each, the negative tests must show:

- a corrupted copy of the released data → **exit 1**, naming the unit that differs;
- a missing or wrongly-pinned source clone → **exit 2**, naming the repository and pin;
- no argument → **exit 2** with usage;
- the unmodified pair → **exit 0**.

Mutations are applied to disposable **copies**. Source archives are read-only and are never written
to by a test.

## Relationship to CI

`.github/workflows/library-ci.yml` runs every validator as its own step, so a failure names the work
in the Actions UI. The fetch step resolves each work's pin from its `provenance.json` and fetches by
SHA, failing loudly if a pin cannot be obtained rather than validating against whatever `main`
happens to be.

Once every validator distinguishes `1` from `2`, CI can act on the difference — an integrity failure
and an unavailable archive are different incidents and deserve different responses. Until then the
distinction is only reliable for Thirukkural.

`npm run test:daily-kural` is **not** a validator and is not covered by this contract. It tests a
deterministic function of a date against the released index, needs no source clone, and runs in the
build job.
