#!/usr/bin/env python3
"""
Build a reviewable Tamil OCR lexicon from page JSON files.

The output is meant to sit between OCR extraction and JSON correction:
- trusted-ish Kalaignar lexicon from repeated words
- raw and normalized frequency tables
- high-confidence deterministic correction candidates
- lower-confidence near-match suggestions for manual review
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

TAMIL_BLOCK_RE = re.compile(r"[\u0B80-\u0BFF]+")
PULLI = "\u0BCD"
AA_SIGN = "\u0BBE"
ODD_FINAL_VOWEL_SIGNS = (AA_SIGN,)

SEED_TERMS = {
    "அண்ணா",
    "அமைச்சர்",
    "அவர்கள்",
    "அரசு",
    "ஆனால்",
    "என்று",
    "கடிதங்கள்",
    "கலைஞர்",
    "கலைஞரின்",
    "கழகம்",
    "கருணாநிதி",
    "சென்னை",
    "தமிழகம்",
    "தமிழ்நாடு",
    "திமுக",
    "தலைவர்",
    "தேர்தல்",
    "திராவிட",
    "பிரதமர்",
    "மத்திய",
    "முதலமைச்சர்",
    "முதல்வர்",
    "முரசொலி",
    "ஸ்டாலின்",
}

KNOWN_REVIEW_CORRECTIONS = {
    "அமைச்சா": "அமைச்சர்",
    "அமைச்சாதான்": "அமைச்சர்தான்",
    "ஆனால": "ஆனால்",
    "எனறு": "என்று",
    "கரதங்கள்": "கடிதங்கள்",
    "கலைஞா": "கலைஞர்",
    "கலைஞாா": "கலைஞர்",
    "கலைஞாரா்": "கலைஞர்",
    "கலைஞாரர்": "கலைஞர்",
    "கலைஞார்": "கலைஞர்",
    "காநாடக": "கர்நாடக",
    "தண்ணா்": "தண்ணீர்",
    "தண்ணர்": "தண்ணீர்",
    "தோோவாணையத்தின்": "தேர்வாணையத்தின்",
    "தோவாணையத்தின்": "தேர்வாணையத்தின்",
    "தொகுத்": "தொகுதி",
    "தோதல": "தேர்தல்",
    "தோதலகள்": "தேர்தல்கள்",
    "தோதலகளில்": "தேர்தல்களில்",
    "தோதலகளைக்": "தேர்தல்களைக்",
    "தோதல்": "தேர்தல்",
    "இத்தோதல்களை": "இத்தேர்தல்களை",
    "முதல்்வாகள்": "முதல்வர்கள்",
    "முதல்வாகள்": "முதல்வர்கள்",
    "முதல்்வாகளை": "முதல்வர்களை",
    "முதல்வாகளை": "முதல்வர்களை",
    "முதல்மைச்சர்": "முதலமைச்சர்",
}

KNOWN_REVIEW_PREFIX_CORRECTIONS = (
    ("அமைச்சாகள்", "அமைச்சர்கள்"),
    ("காநாடக", "கர்நாடக"),
    ("இத்தோதல்", "இத்தேர்தல்"),
    ("தோதல்", "தேர்தல்"),
    ("தோதல", "தேர்தல"),
)

KNOWN_JUNK_TOKENS = {
    "ஊர்்ட",
    "ஊர்ட",
    "ககத்காா்",
    "ககத்கர்",
    "கசைகைைகைகைைையை",
    "கசைகைகைகையை",
    "ச்்ட்ப்டு",
    "ச்ட்ப்டு",
    "பர்த்வா்க்துல்",
    "பர்த்வர்க்துல்",
    "முதல்்முதல்ாக",
    "முதல்முதல்ாக",
    "வார்கர்்",
    "வார்கர்",
}

MANUAL_REVIEW_ONLY_TOKENS = {
    "சா்பிலேயே",
    "சர்பிலேயே",
    "சொன்னா்களே",
    "சொன்னர்களே",
    "பாயலா்",
    "பாயலர்",
}

KNOWN_SUFFIXES = (
    "கள்",
    "ர்கள்",
    "த்தில்",
    "த்தின்",
    "த்தைக்",
    "த்தை",
    "க்கு",
    "க்குப்",
    "வும்",
    "மும்",
    "னால்",
    "மாக",
    "மாகும்",
    "தான்",
    "ர்",
)

OCR_PATTERN_DEFINITIONS = {
    AA_SIGN + PULLI: "aa_sign_plus_pulli_read_as_r",
    AA_SIGN + AA_SIGN + PULLI: "double_aa_plus_pulli",
    PULLI + PULLI: "double_pulli",
    AA_SIGN + AA_SIGN: "repeated_aa_mark",
    "னறு": "missing_pullied_n_before_ru",
    "எனறு": "enru_without_pullied_n",
    "ஆனால": "aanaal_without_final_pullied_l",
    "தோதல்": "therthal_vowel_confusion",
    "முதல்மைச்ச": "mudhalamaichar_missing_a",
}


def tamil_sort_key(word: str) -> str:
    return unicodedata.normalize("NFC", word)


def normalize_text(text: str) -> str:
    return unicodedata.normalize("NFC", text or "")


def is_tamil_number_char(ch: str) -> bool:
    return unicodedata.category(ch).startswith("N")


def token_has_letters(word: str) -> bool:
    return any(unicodedata.category(ch).startswith("L") for ch in word)


def base_letter_count(word: str) -> int:
    return sum(1 for ch in word if unicodedata.category(ch).startswith("L"))


def looks_like_fragment(word: str) -> bool:
    bases = base_letter_count(word)
    if bases <= 1:
        return True
    if PULLI + PULLI in word and bases <= 2:
        return True
    return False


def known_correction_for(raw: str, normalized: str) -> str | None:
    for word in (raw, normalized):
        exact = KNOWN_REVIEW_CORRECTIONS.get(word)
        if exact:
            return exact

        for wrong_prefix, right_prefix in KNOWN_REVIEW_PREFIX_CORRECTIONS:
            if word.startswith(wrong_prefix) and len(word) > len(wrong_prefix):
                return right_prefix + word[len(wrong_prefix) :]

    return None


def is_known_junk(raw: str, normalized: str) -> bool:
    return raw in KNOWN_JUNK_TOKENS or normalized in KNOWN_JUNK_TOKENS


def is_manual_review_only(raw: str, normalized: str) -> bool:
    return raw in MANUAL_REVIEW_ONLY_TOKENS or normalized in MANUAL_REVIEW_ONLY_TOKENS


def has_known_suffix(word: str) -> bool:
    return any(word.endswith(suffix) for suffix in KNOWN_SUFFIXES)


def trust_details(
    word: str,
    count: int,
    manual_terms: set[str],
) -> tuple[int, list[str], list[str]]:
    score = min(count, 20)
    signals: list[str] = [f"frequency:{count}"]
    penalties: list[str] = []

    if word in SEED_TERMS:
        score += 100
        signals.append("trusted_seed")
    if word in manual_terms:
        score += 100
        signals.append("manual_seed")
    if has_known_suffix(word):
        score += 2
        signals.append("known_suffix")
    if len(word) >= 4:
        score += 1
        signals.append("word_length")

    synthetic_issues = classify_raw_word(word, word, count)

    if known_correction_for(word, word):
        score -= 100
        penalties.append("known_ocr_suspect")
    if is_known_junk(word, word):
        score -= 100
        penalties.append("known_junk_token")
    if is_manual_review_only(word, word):
        score -= 50
        penalties.append("manual_review_only")
    if looks_like_fragment(word):
        score -= 100
        penalties.append("fragment_like_token")
    if any(is_tamil_number_char(ch) for ch in word):
        score -= 100
        penalties.append("contains_tamil_number")
    if "repeated_aa_mark" in synthetic_issues:
        score -= 25
        penalties.append("repeated_aa_mark")
    if "double_pulli" in synthetic_issues:
        score -= 25
        penalties.append("double_pulli")
    if word.endswith(ODD_FINAL_VOWEL_SIGNS):
        score -= 8
        penalties.append("odd_final_vowel_mark")

    return score, signals, penalties


def tokenize(text: str) -> list[str]:
    words: list[str] = []

    for match in TAMIL_BLOCK_RE.finditer(normalize_text(text)):
        word = match.group(0).strip()
        if len(word) < 2:
            continue
        if not token_has_letters(word):
            continue
        words.append(word)

    return words


def canonicalize(word: str) -> str:
    w = normalize_text(word)

    # Common Tesseract Tamil issue: "கலைஞா்" / "அவா்கள்" should be "கலைஞர்" / "அவர்கள்".
    w = w.replace(AA_SIGN + AA_SIGN + PULLI, "ர்")
    w = w.replace(AA_SIGN + PULLI, "ர்")

    # Extra virama commonly appears at word end: "முதல்்" -> "முதல்".
    while PULLI + PULLI in w:
        w = w.replace(PULLI + PULLI, PULLI)

    # Collapse repeated vowel signs that are usually OCR noise. Do not collapse
    # repeated "ா"; in OCR it can mean either a bad duplicate or a missing "ர்".
    for mark in ("ி", "ீ", "ு", "ூ", "ெ", "ே", "ை", "ொ", "ோ", "ௌ"):
        while mark + mark in w:
            w = w.replace(mark + mark, mark)

    return w


def load_manual_terms(paths: list[Path]) -> set[str]:
    terms: set[str] = set()

    for path in paths:
        if not path.exists():
            raise FileNotFoundError(f"manual term file not found: {path}")

        if path.suffix.lower() == ".json":
            data = json.loads(path.read_text(encoding="utf-8"))
            values = data.get("terms", data) if isinstance(data, dict) else data
            for value in values:
                if isinstance(value, str):
                    terms.add(canonicalize(value.strip()))
            continue

        with path.open(encoding="utf-8") as f:
            for line in f:
                value = line.strip()
                if not value or value.startswith("#"):
                    continue
                if "," in value:
                    value = value.split(",", 1)[0].strip()
                terms.add(canonicalize(value))

    return {term for term in terms if term}


def iter_json_pages(folder: Path):
    for path in sorted(folder.glob("*.json")):
        if path.name.startswith("._"):
            continue

        with path.open(encoding="utf-8") as f:
            data = json.load(f)

        yield path, data


def collect_tokens(folder: Path):
    raw_counter: Counter[str] = Counter()
    norm_counter: Counter[str] = Counter()
    variants: dict[str, Counter[str]] = defaultdict(Counter)
    first_page: dict[str, str] = {}
    raw_first_page: dict[str, str] = {}
    page_count = 0

    for path, data in iter_json_pages(folder):
        page_count += 1
        page_id = data.get("id") or path.stem

        for para in data.get("paragraphs", []):
            for raw in tokenize(para):
                normalized = canonicalize(raw)

                raw_counter[raw] += 1
                norm_counter[normalized] += 1
                variants[normalized][raw] += 1
                first_page.setdefault(normalized, page_id)
                raw_first_page.setdefault(raw, page_id)

    return {
        "page_count": page_count,
        "raw_counter": raw_counter,
        "norm_counter": norm_counter,
        "variants": variants,
        "first_page": first_page,
        "raw_first_page": raw_first_page,
    }


def classify_raw_word(raw: str, normalized: str, count: int) -> list[str]:
    issues: list[str] = []

    if raw != normalized:
        issues.append("deterministic_normalization")
    if known_correction_for(raw, normalized):
        issues.append("known_review_correction")
    if is_known_junk(raw, normalized):
        issues.append("known_junk_token")
    if is_manual_review_only(raw, normalized):
        issues.append("manual_review_only")
    if AA_SIGN + PULLI in raw or AA_SIGN + AA_SIGN + PULLI in raw:
        issues.append("aa_pulli_for_r")
    if PULLI + PULLI in raw:
        issues.append("double_pulli")
    if AA_SIGN + AA_SIGN in raw:
        issues.append("repeated_aa_mark")
    if any(is_tamil_number_char(ch) for ch in raw):
        issues.append("contains_tamil_number")
    if len(raw) <= 2:
        issues.append("short_fragment")
    if looks_like_fragment(raw):
        issues.append("fragment_like_token")
    if count <= 2 and len(raw) >= 7:
        issues.append("rare_long_word")
    if raw.endswith(ODD_FINAL_VOWEL_SIGNS) and count <= 2:
        issues.append("odd_final_vowel_mark")

    return issues


def is_trusted_word(
    word: str,
    count: int,
    manual_terms: set[str],
    min_count: int,
    min_score: int,
) -> bool:
    if word in manual_terms or word in SEED_TERMS:
        return True
    if count < min_count:
        return False
    if len(word) <= 2 or looks_like_fragment(word):
        return False
    if any(is_tamil_number_char(ch) for ch in word):
        return False
    if not token_has_letters(word):
        return False
    score, _signals, penalties = trust_details(word, count, manual_terms)
    if any(
        penalty in penalties
        for penalty in ("known_ocr_suspect", "known_junk_token", "manual_review_only")
    ):
        return False
    return score >= min_score


def levenshtein(a: str, b: str, max_distance: int) -> int | None:
    if abs(len(a) - len(b)) > max_distance:
        return None

    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        current = [i]
        row_min = i

        for j, cb in enumerate(b, 1):
            cost = 0 if ca == cb else 1
            value = min(
                previous[j] + 1,
                current[j - 1] + 1,
                previous[j - 1] + cost,
            )
            current.append(value)
            row_min = min(row_min, value)

        if row_min > max_distance:
            return None

        previous = current

    distance = previous[-1]
    return distance if distance <= max_distance else None


def build_near_match_suggestions(
    raw_counter: Counter[str],
    norm_counter: Counter[str],
    raw_first_page: dict[str, str],
    trusted_words: set[str],
    seed_words: set[str],
    min_suggestion_count: int,
    max_distance: int,
    limit: int,
) -> list[dict[str, object]]:
    by_key: dict[tuple[str, int], list[str]] = defaultdict(list)
    suggestion_words = trusted_words | seed_words

    for word in suggestion_words:
        if word not in seed_words and norm_counter.get(word, 0) < min_suggestion_count:
            continue
        if not word:
            continue
        by_key[(word[0], len(word))].append(word)

    suggestions: list[dict[str, object]] = []

    candidates = sorted(
        raw_counter.items(),
        key=lambda item: (item[1], -len(item[0]), tamil_sort_key(item[0])),
    )

    for raw, count in candidates:
        if len(suggestions) >= limit:
            break
        if count > 2 or len(raw) < 4 or len(raw) > 22:
            continue
        if any(is_tamil_number_char(ch) for ch in raw):
            continue

        normalized = canonicalize(raw)
        if is_known_junk(raw, normalized) or is_manual_review_only(raw, normalized):
            continue
        if normalized in trusted_words:
            continue

        pool: list[str] = []
        for length in range(len(normalized) - max_distance, len(normalized) + max_distance + 1):
            pool.extend(by_key.get((normalized[0], length), []))

        best: tuple[int, int, int, str] | None = None
        for word in pool:
            distance = levenshtein(normalized, word, max_distance)
            if distance is None:
                continue
            seed_rank = 0 if word in seed_words else 1
            score = (distance, seed_rank, -norm_counter.get(word, 0), word)
            if best is None or score < best:
                best = score

        if best is None:
            continue

        distance, _seed_rank, _negative_count, suggestion = best
        suggestions.append(
            {
                "word": raw,
                "normalized": normalized,
                "suggestion": suggestion,
                "word_count": count,
                "suggestion_count": norm_counter.get(suggestion, 0),
                "distance": distance,
                "example_page": raw_first_page.get(raw, ""),
            }
        )

    return suggestions


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def correction_confidence(
    normalized: str,
    count: int,
    issues: list[str],
    trusted_words: set[str],
) -> str:
    if "known_review_correction" in issues:
        return "high"
    if normalized in trusted_words:
        return "high"
    if count >= 2 and ("double_pulli" in issues or "aa_pulli_for_r" in issues):
        return "high"
    if count >= 3:
        return "high"
    return "medium"


def correction_category(
    right: str,
    issues: list[str],
    confidence: str,
    trusted_words: set[str],
    seed_words: set[str],
) -> str:
    if "known_junk_token" in issues:
        return "ignore"
    if "manual_review_only" in issues:
        return "manual_review_only"
    if "contains_tamil_number" in issues or "fragment_like_token" in issues:
        return "ignore"
    if "known_review_correction" in issues:
        return "needs_review"
    if confidence == "high" and right in (trusted_words | seed_words):
        return "automatic"
    return "needs_review"


def collect_ocr_patterns(raw_counter: Counter[str]) -> dict[str, object]:
    pattern_counts: Counter[str] = Counter()
    examples: dict[str, list[dict[str, object]]] = defaultdict(list)
    exact_patterns = {"ஆனால", "எனறு", "தோதல்"}

    for word, count in raw_counter.items():
        for pattern in OCR_PATTERN_DEFINITIONS:
            if pattern in exact_patterns:
                hits = 1 if word == pattern else 0
            else:
                hits = word.count(pattern)
            if not hits:
                continue

            pattern_counts[pattern] += hits * count
            if len(examples[pattern]) < 10:
                examples[pattern].append({"word": word, "count": count})

    return {
        "patternCounts": {
            pattern: {
                "count": pattern_counts[pattern],
                "name": OCR_PATTERN_DEFINITIONS[pattern],
                "examples": examples.get(pattern, []),
            }
            for pattern, _count in pattern_counts.most_common()
        }
    }


def write_outputs(
    outdir: Path,
    collected: dict[str, object],
    manual_terms: set[str],
    min_trusted_count: int,
    min_trust_score: int,
    min_suggestion_count: int,
    max_distance: int,
    suggestion_limit: int,
) -> dict[str, object]:
    outdir.mkdir(parents=True, exist_ok=True)

    raw_counter: Counter[str] = collected["raw_counter"]  # type: ignore[assignment]
    norm_counter: Counter[str] = collected["norm_counter"]  # type: ignore[assignment]
    variants: dict[str, Counter[str]] = collected["variants"]  # type: ignore[assignment]
    first_page: dict[str, str] = collected["first_page"]  # type: ignore[assignment]
    raw_first_page: dict[str, str] = collected["raw_first_page"]  # type: ignore[assignment]
    page_count: int = collected["page_count"]  # type: ignore[assignment]
    seed_words = SEED_TERMS | manual_terms

    trusted_words = {
        word
        for word, count in norm_counter.items()
        if is_trusted_word(word, count, manual_terms, min_trusted_count, min_trust_score)
    }

    lexicon_entries = []
    for word in sorted(trusted_words, key=lambda w: (-norm_counter[w], tamil_sort_key(w))):
        raw_variants = variants[word].most_common()
        trust_score, trust_signals, trust_penalties = trust_details(word, norm_counter[word], manual_terms)
        lexicon_entries.append(
            {
                "word": word,
                "count": norm_counter[word],
                "source": "seed" if word in SEED_TERMS else "manual" if word in manual_terms else "frequency",
                "trustScore": trust_score,
                "trustSignals": trust_signals,
                "trustPenalties": trust_penalties,
                "firstPage": first_page.get(word, ""),
                "variants": [
                    {"form": form, "count": count}
                    for form, count in raw_variants
                    if form != word
                ][:10],
            }
        )

    (outdir / "kalaignar_lexicon.txt").write_text(
        "\n".join(sorted(trusted_words, key=tamil_sort_key)) + "\n",
        encoding="utf-8",
    )

    with (outdir / "kalaignar_lexicon.json").open("w", encoding="utf-8") as f:
        json.dump(
            {
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "pages": page_count,
                "minTrustedCount": min_trusted_count,
                "minTrustScore": min_trust_score,
                "entryCount": len(lexicon_entries),
                "entries": lexicon_entries,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    frequency_rows = [
        {
            "word": word,
            "count": count,
            "variant_count": len(variants[word]),
            "first_page": first_page.get(word, ""),
            "trusted": "yes" if word in trusted_words else "no",
            "trust_score": trust_details(word, count, manual_terms)[0],
            "trust_penalties": ";".join(trust_details(word, count, manual_terms)[2]),
        }
        for word, count in norm_counter.most_common()
    ]
    write_csv(
        outdir / "frequencies.csv",
        frequency_rows,
        ["word", "count", "variant_count", "first_page", "trusted", "trust_score", "trust_penalties"],
    )

    raw_rows = [
        {
            "word": word,
            "normalized": canonicalize(word),
            "count": count,
            "first_page": raw_first_page.get(word, ""),
        }
        for word, count in raw_counter.most_common()
    ]
    write_csv(outdir / "raw_frequencies.csv", raw_rows, ["word", "normalized", "count", "first_page"])

    review_rows = []
    correction_rows = []
    for raw, count in sorted(raw_counter.items(), key=lambda item: (-item[1], tamil_sort_key(item[0]))):
        normalized = canonicalize(raw)
        known_right = known_correction_for(raw, normalized)
        known_junk = is_known_junk(raw, normalized)
        manual_only = is_manual_review_only(raw, normalized)
        right = "" if known_junk or manual_only else known_right or normalized
        issues = classify_raw_word(raw, normalized, count)
        if not issues:
            continue

        confidence = (
            correction_confidence(right, count, issues, trusted_words | seed_words)
            if right and raw != right
            else ""
        )
        category = (
            correction_category(right, issues, confidence, trusted_words, seed_words)
            if right and raw != right
            else "ignore" if known_junk
            else "manual_review_only" if manual_only
            else "review"
        )

        row = {
            "word": raw,
            "normalized": right or normalized,
            "count": count,
            "issues": ";".join(issues),
            "example_page": raw_first_page.get(raw, ""),
            "action": category if category != "review" else "review",
        }
        review_rows.append(row)

        if (
            right
            and raw != right
            and category in {"automatic", "needs_review"}
            and not any(is_tamil_number_char(ch) for ch in raw)
        ):
            correction_rows.append(
                {
                    "wrong": raw,
                    "right": right,
                    "count": count,
                    "reason": ";".join(issues),
                    "example_page": raw_first_page.get(raw, ""),
                    "confidence": confidence,
                    "category": category,
                }
            )

    write_csv(
        outdir / "review_candidates.csv",
        review_rows,
        ["word", "normalized", "count", "issues", "example_page", "action"],
    )
    write_csv(
        outdir / "correction_candidates.csv",
        correction_rows,
        ["wrong", "right", "count", "reason", "example_page", "confidence", "category"],
    )
    write_csv(
        outdir / "automatic_corrections.csv",
        [row for row in correction_rows if row["category"] == "automatic"],
        ["wrong", "right", "count", "reason", "example_page", "confidence", "category"],
    )
    write_csv(
        outdir / "review_corrections.csv",
        [row for row in correction_rows if row["category"] == "needs_review"],
        ["wrong", "right", "count", "reason", "example_page", "confidence", "category"],
    )
    write_csv(
        outdir / "ignored_tokens.csv",
        [row for row in review_rows if row["action"] == "ignore"],
        ["word", "normalized", "count", "issues", "example_page", "action"],
    )
    write_csv(
        outdir / "manual_review_tokens.csv",
        [row for row in review_rows if row["action"] == "manual_review_only"],
        ["word", "normalized", "count", "issues", "example_page", "action"],
    )

    near_matches = build_near_match_suggestions(
        raw_counter,
        norm_counter,
        raw_first_page,
        trusted_words,
        seed_words,
        min_suggestion_count,
        max_distance,
        suggestion_limit,
    )
    write_csv(
        outdir / "near_match_suggestions.csv",
        near_matches,
        ["word", "normalized", "suggestion", "word_count", "suggestion_count", "distance", "example_page"],
    )

    with (outdir / "top100.txt").open("w", encoding="utf-8") as f:
        for word, count in norm_counter.most_common(100):
            f.write(f"{count:6d}  {word}\n")

    with (outdir / "ocr_patterns.json").open("w", encoding="utf-8") as f:
        json.dump(collect_ocr_patterns(raw_counter), f, ensure_ascii=False, indent=2)

    with (outdir / "trusted_seed.json").open("w", encoding="utf-8") as f:
        json.dump(
            {
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "terms": sorted(seed_words, key=tamil_sort_key),
                "sources": {
                    "builtInSeedCount": len(SEED_TERMS),
                    "manualSeedCount": len(manual_terms),
                },
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    stats = {
        "pages": page_count,
        "total_raw_words": sum(raw_counter.values()),
        "unique_raw_words": len(raw_counter),
        "total_normalized_words": sum(norm_counter.values()),
        "unique_normalized_words": len(norm_counter),
        "trusted_lexicon_words": len(trusted_words),
        "review_candidates": len(review_rows),
        "correction_candidates": len(correction_rows),
        "automatic_corrections": sum(1 for row in correction_rows if row["category"] == "automatic"),
        "review_corrections": sum(1 for row in correction_rows if row["category"] == "needs_review"),
        "ignored_tokens": sum(1 for row in review_rows if row["action"] == "ignore"),
        "manual_review_only_tokens": sum(
            1 for row in review_rows if row["action"] == "manual_review_only"
        ),
        "high_confidence_corrections": sum(
            1 for row in correction_rows if row["confidence"] == "high"
        ),
        "near_match_suggestions": len(near_matches),
        "top_word": norm_counter.most_common(1)[0][0] if norm_counter else "",
        "top_word_count": norm_counter.most_common(1)[0][1] if norm_counter else 0,
    }
    with (outdir / "statistics.json").open("w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    return stats


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("folder", type=Path, help="Folder containing OCR JSON pages")
    ap.add_argument("--output", type=Path, default=Path("dictionary"))
    ap.add_argument("--manual-terms", type=Path, action="append", default=[])
    ap.add_argument("--min-trusted-count", type=int, default=3)
    ap.add_argument("--min-trust-score", type=int, default=8)
    ap.add_argument("--min-suggestion-count", type=int, default=5)
    ap.add_argument("--max-distance", type=int, default=2)
    ap.add_argument("--suggestion-limit", type=int, default=500)
    args = ap.parse_args()

    if not args.folder.exists():
        raise FileNotFoundError(f"OCR JSON folder not found: {args.folder}")

    manual_terms = load_manual_terms(args.manual_terms)
    collected = collect_tokens(args.folder)
    stats = write_outputs(
        args.output,
        collected,
        manual_terms,
        args.min_trusted_count,
        args.min_trust_score,
        args.min_suggestion_count,
        args.max_distance,
        args.suggestion_limit,
    )

    print()
    print("Kalaignar lexicon packet created")
    print(f"Pages                         : {stats['pages']}")
    print(f"Raw unique words              : {stats['unique_raw_words']}")
    print(f"Normalized unique words       : {stats['unique_normalized_words']}")
    print(f"Trusted lexicon words         : {stats['trusted_lexicon_words']}")
    print(f"Automatic corrections         : {stats['automatic_corrections']}")
    print(f"Review corrections            : {stats['review_corrections']}")
    print(f"High-confidence corrections   : {stats['high_confidence_corrections']}")
    print(f"Near-match suggestions        : {stats['near_match_suggestions']}")
    print(f"Output folder                 : {args.output}")


if __name__ == "__main__":
    main()
