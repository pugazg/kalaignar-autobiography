#!/usr/bin/env python3
"""
apply_corrections_v4.py — Murasoli OCR correction stage (pass-through, lossless).

FIXES THE DATA-LOSS BUG: the previous stage produced only 177 of 346 pages because
pages that received no correction were not written out. This version iterates over
EVERY page in the input folder and writes EVERY non-empty page to the output —
applying token corrections where they match, leaving the page unchanged otherwise.

Principle: correction EDITS pages, it never OMITS them. The only pages that should
be absent from the output are genuinely empty ones (no Tamil text anywhere in the
OCR record), and those are logged so the drop is auditable, never silent.

v4.1 additions (field-tested on Volume 54):
  1. ZERO-WIDTH NORMALIZATION. Tesseract emits an invisible ZWNJ (U+200C) after
     nearly every pulli ("ன்‌"). Correction CSV keys typed by a human don't
     contain it, so exact token matching silently matched NOTHING (fixesApplied: 0
     everywhere). Both the page text and the CSV keys are now NFC-normalized and
     stripped of ZWNJ/ZWSP/ZWJ/BOM before comparison, and the OUTPUT text is
     written normalized too (better search, identical rendering).
  2. PUNCTUATION-AWARE MATCHING. "அச்சியற்றி," never matched CSV key "அச்சியற்றி".
     Tokens are now split into leading-punct / core / trailing-punct and the core
     is matched; punctuation is preserved around the replacement.
  3. CANDIDATE RESCUE. Pages classified low_text_or_image by the OCR stage carry
     their text in `textCandidates` (or only in `ocrLines`) with EMPTY `paragraphs`
     — e.g. V54 p311, a real page with a high-confidence line, was dropped as
     "empty". Now: paragraphs → ocrLines → textCandidates are tried in order, and
     a page is dropped only when none of them contains Tamil. Rescued pages are
     marked (`correctionStage.rescuedFrom`) and listed in rescued_pages.csv.
  4. OPT-IN SELF-HEAL (--self-heal). High-precision, corpus-validated repair of
     classic Tamil OCR first-letter confusions ("னணிந்துரை"→"அணிந்துரை",
     "ஒது"→"இது"). A token is repaired only if ALL hold:
       - it occurs at most once across the vocabulary (so it's not a real word
         in this corpus),
       - its first letter is an impossible Tamil word-initial (ன ண ழ ற ள ங) OR
         a vowel commonly mis-read for another,
       - swapping just the first letter yields a token seen >= --heal-threshold
         times in the vocabulary.
     Every repair is logged to self_heal_report.csv for human review. Feed extra
     vocabulary (e.g. the memoir corpus, other volumes) with --vocab.

Reads:
  <src>/text/mNN-pXXXX.json           the raw OCR page JSON (stage 01)
  one or more --corrections CSV files  columns: wrong,right,...,confidence,category
Writes:
  <out>/text/mNN-pXXXX.json           every non-empty page, corrected or not
  <out>/correction_report.csv         per-page: corrections applied
  <out>/dropped_pages.csv             every omitted page + why (audit trail)
  <out>/rescued_pages.csv             pages recovered from ocrLines/textCandidates
  <out>/self_heal_report.csv          every self-heal repair (only with --self-heal)

Usage:
  python3 apply_corrections_v4.py \
      --src 01_ocr_v2_full --out 03_corrected_v4 --volume 54 \
      --corrections 04_dictionary_v3_after_curated/review_corrections.csv \
      --min-confidence medium \
      --self-heal --vocab path/to/website/public/data/murasoli/text \
      --vocab path/to/website/public/data/text

Confidence gate: rows are applied only if their `confidence` is at or above
--min-confidence (order: low < medium < high). `category` is informational.
"""
import argparse, csv, glob, json, os, re, unicodedata
from collections import Counter
from datetime import datetime, timezone

CONF_ORDER = {"low": 0, "medium": 1, "high": 2}

# ---------------------------------------------------------------- normalization
ZERO_WIDTH = re.compile(r"[​‌‍﻿]")
TAMIL = re.compile(r"[஀-௿]")
# leading / core / trailing — punctuation & quotes stay put around a replacement
TOKEN_SHAPE = re.compile(r'^([\'"“”‘’(\[«]*)(.*?)([\'"“”‘’)\]»,.!?;:…]*)$', re.S)

def norm(s: str) -> str:
    """NFC + strip zero-width characters. Identical rendering, sane comparisons."""
    return ZERO_WIDTH.sub("", unicodedata.normalize("NFC", s))

def split_token(tok):
    m = TOKEN_SHAPE.match(tok)
    return m.group(1), m.group(2), m.group(3)

# ---------------------------------------------------------------- corrections
# Fixed formula words whose garbled forms are unambiguous — the letter sign-off
# "அன்புள்ள" appears at every letter's close and OCR drops its pulli marks in
# every combination. Applied before (and overridable by) the CSV rules.
BUILTIN_CORRECTIONS = {
    "அனபுளள": "அன்புள்ள",
    "அன்புளள": "அன்புள்ள",
    "அனபுள்ள": "அன்புள்ள",
}

def load_corrections(paths, min_conf):
    """Load wrong->right token map from CSVs, gated by confidence. Keys normalized."""
    threshold = CONF_ORDER.get(min_conf, 1)
    mapping = dict(BUILTIN_CORRECTIONS)
    for path in paths:
        if not os.path.exists(path):
            print(f"  ! corrections file not found: {path}")
            continue
        with open(path, encoding="utf-8-sig", newline="") as f:
            for row in csv.DictReader(f):
                wrong = norm((row.get("wrong") or "").strip())
                right = norm((row.get("right") or "").strip())
                conf = (row.get("confidence") or "medium").strip().lower()
                if not wrong or not right or wrong == right:
                    continue
                if CONF_ORDER.get(conf, 1) < threshold:
                    continue
                if wrong in mapping and mapping[wrong] != right:
                    print(f"  ! conflict for '{wrong}' — using the later file's value")
                mapping[wrong] = right
    return mapping

# The printed bullet glyph OCRs as the standalone token "ஓஒ", and sometimes as
# a lone "ஓ", "ஒ" or "@" (V54 l4051's English newspaper quotations). The
# two-char form is never a Tamil word — always safe. The single-char forms are
# repaired only when standalone AND the NEXT token is Latin text — a pattern no
# real Tamil sentence produces, but every bullet before an English quotation
# does. Emails (name@gmail.com) can't match: their @ is not a standalone token.
BULLET_MISREAD = re.compile(r"(?<!\S)ஓஒ(?!\S)")
BULLET_MISREAD_SINGLE = re.compile(r"(?<!\S)[ஓஒ@](?=\s+[A-Za-z])")

def correct_paragraph(text, mapping):
    """Whole-token replacement, punctuation-aware, on normalized text.
    Returns (new_text, n_fixes)."""
    text = BULLET_MISREAD.sub("•", norm(text))
    text = BULLET_MISREAD_SINGLE.sub("•", text)
    if not mapping:
        return text, 0
    n = 0
    out = []
    for tok in re.split(r"(\s+)", text):
        if not tok or tok.isspace():
            out.append(tok)
            continue
        lead, core, trail = split_token(tok)
        if core in mapping:
            out.append(lead + mapping[core] + trail)
            n += 1
        elif tok in mapping:            # full-token rule incl. punctuation
            out.append(mapping[tok])
            n += 1
        else:
            out.append(tok)
    return "".join(out), n

# ---------------------------------------------------------------- text recovery
def extract_paragraphs(d, min_candidate_conf=55.0):
    """paragraphs → ocrLines → textCandidates, first source with Tamil wins.
    Returns (paragraphs, rescued_from | None)."""
    paras = [p for p in d.get("paragraphs", []) if isinstance(p, str) and p.strip()]
    if any(TAMIL.search(p) for p in paras):
        return paras, None
    lines = [l.get("text", "") for l in d.get("ocrLines", [])
             if isinstance(l, dict) and l.get("text", "").strip()]
    if any(TAMIL.search(l) for l in lines):
        return lines, "ocrLines"
    cands = [c.get("text", "") for c in d.get("textCandidates", [])
             if isinstance(c, dict) and c.get("text", "").strip()
             and float(c.get("meanConfidence") or 0) >= min_candidate_conf]
    if any(TAMIL.search(c) for c in cands):
        return cands, "textCandidates"
    return [], None

# ---------------------------------------------------------------- ortho repair
# GRAMMAR-LEVEL REPAIR. Some OCR errors produce character sequences that are
# orthographically IMPOSSIBLE in Tamil — a vowel sign followed by a virama
# (த + ோ + ் in "தோ்தல்"), or a vowel sign following another vowel sign
# ("எதிாத்த"). Tesseract misreads the glyph ர as the aa-sign ா, and ேர as ோ.
# Every such sequence is by definition an error, and each has a canonical
# repair. Repairs are still validated against the trusted lexicon / corpus
# vocabulary before being applied; unvalidated repairs are logged as
# suggestions instead. Observed → repaired (V54):
#   தலைவா் → தலைவர்      கலைஞாா் → கலைஞர்     தோ்தல் → தேர்தல்
#   எதிாத்த → எதிர்த்த    உள்ளாா. → உள்ளார்.    எவ்வளவேோ → எவ்வளவோ
# Each rule maps an impossible sequence to one or more candidate repairs;
# the trusted lexicon / corpus vocabulary picks the winner (see below).
ORTHO_SEQ_RULES = [
    ("ாா்", ["ர்"]),          # aa+aa+virama : கலைஞாா் → கலைஞர்
    # aa+aa is ambiguous: உள்ளாா → உள்ளார், but கலைஞாா → கலைஞர் and
    # தீாாமானம் → தீர்மானம் — branch, the trusted lexicon decides.
    ("ாா", ["ர்", "ார்"]),
    ("ோோ", ["ேர்", "ோ"]),   # oo+oo        : தோோதல் → தேர்தல்
    # aa+virama is usually ர் (தலைவா் → தலைவர்) but sometimes a collapsed
    # ீர் (தண்ணா் → தண்ணீர்) — branch, trusted lexicon decides.
    ("ா்", ["ர்", "ீர்"]),
    ("ோ்", ["ேர்"]),         # oo+virama    : தோ்தல் → தேர்தல்
    # ee+oo is three-way ambiguous: சேோந்தபோது → சேர்ந்தபோது (ேர்),
    # எவ்வளவேோ → எவ்வளவோ (ோ), தேோர்தல் → தேர்தல் (ே).
    ("ேோ", ["ேர்", "ோ", "ே"]),
]
# a bare aa-sign right after another vowel sign is a misread ர்: எதிாத்த → எதிர்த்த
ORTHO_RE_RULES = [
    (re.compile(r"(?<=[ிீுூெேைொௌ])ா"), "ர்"),
]
INVALID_SEQ = re.compile(r"[ாிீுூெேைொோௌ][்ாிீுூெேைொோௌ]")

def ortho_candidates(core, cap=8):
    """Repair candidates for a token containing invalid sequences. Ambiguous
    rules branch; the candidate set is validated by the caller."""
    cands = {core}
    for a, opts in ORTHO_SEQ_RULES:
        nxt = set()
        for c in cands:
            if a in c:
                for b in opts:
                    nxt.add(c.replace(a, b))
            else:
                nxt.add(c)
        cands = set(list(nxt)[:cap])
    out = set()
    for c in cands:
        for rx, b in ORTHO_RE_RULES:
            c = rx.sub(b, c)
        out.add(c)
    out.discard(core)
    return out

def ortho_paragraph(text, vocab, trusted, log, page_id):
    """Repair orthographically impossible tokens; validate against lexicon/corpus.
    Returns (new_text, n_repairs)."""
    n = 0
    out = []
    for tok in re.split(r"(\s+)", text):
        if not tok or tok.isspace():
            out.append(tok)
            continue
        lead, core, trail = split_token(tok)
        if not core or not INVALID_SEQ.search(core):
            out.append(tok)
            continue
        cands = ortho_candidates(core)
        # trusted lexicon decides first; corpus frequency (>=3) second
        pick = None
        in_trusted = [c for c in cands if c in trusted]
        if len(in_trusted) == 1:
            pick = (in_trusted[0], "trusted")
        elif not in_trusted and vocab is not None:
            by_freq = sorted(((vocab[c], c) for c in cands if vocab[c] >= 5), reverse=True)
            if len(by_freq) == 1 or (len(by_freq) > 1 and by_freq[0][0] >= 3 * by_freq[1][0]):
                if by_freq:
                    pick = (by_freq[0][1], by_freq[0][0])
        if pick:
            out.append(lead + pick[0] + trail)
            log.append({"id": page_id, "action": "ortho-healed", "wrong": core,
                        "right": pick[0], "candidateFreq": pick[1], "tokenFreq": ""})
            n += 1
        else:
            if cands:
                log.append({"id": page_id, "action": "ORTHO-suggest", "wrong": core,
                            "right": " | ".join(sorted(cands)[:4]),
                            "candidateFreq": "", "tokenFreq": ""})
            out.append(tok)
    return "".join(out), n

# ---------------------------------------------------------------- glyph confusion
# SECOND LAYER: errors that leave VALID orthography but a non-word — ர read as
# ா ("தொடாந்து" for தொடர்ந்து), ேர read as ோ ("தோதல்" for தேர்தல்). The token
# itself is unremarkable to a sequence check, so the trusted lexicon is the
# gate: substitute each known confusion at each position, and repair ONLY when
# exactly ONE distinct candidate is a verified Kalaignar-usage word. Multiple
# trusted candidates → logged as a suggestion, never guessed.
GLYPH_SUBS = [("ா", "ர்"), ("ோ", "ேர்")]

def glyph_candidates(core):
    cands = set()
    for a, b in GLYPH_SUBS:
        start = 0
        while True:
            i = core.find(a, start)
            if i == -1:
                break
            cands.add(core[:i] + b + core[i + len(a):])
            start = i + 1
        if a in core:
            cands.add(core.replace(a, b))  # all occurrences at once
    cands.discard(core)
    return cands

def glyph_paragraph(text, trusted, log, page_id, ext_vocab=None):
    """Trusted-gated glyph-confusion repair. Returns (new_text, n).

    ext_vocab = token frequencies from the INDEPENDENT corpus (the memoir, via
    --vocab), not this volume. A token frequent there is a real word even if
    untrusted (அய்யா appears 25x in the memoir — repairing it to அய்யர் would
    corrupt a vocative). Tokens with ext frequency > 3 are suggested, never
    auto-healed. The volume's own counts are useless for this gate because a
    systematic misread (தோதல் x33) is frequent in the volume by definition."""
    n = 0
    out = []
    for tok in re.split(r"(\s+)", text):
        if not tok or tok.isspace():
            out.append(tok)
            continue
        lead, core, trail = split_token(tok)
        if not core or len(core) < 4 or not TAMIL.search(core) or core in trusted:
            out.append(tok)
            continue
        cands = glyph_candidates(core) if ("ா" in core or "ோ" in core) else set()
        # WORD-FINAL PULLI DROP (ரூபாய→ரூபாய், காரணத்தால→காரணத்தால்): generate
        # the ்-appended candidate ONLY for tokens rare in the independent
        # corpus — valid bare forms (என, போல, இல்லாத, தான) are frequent there
        # and must never be touched, nor flood the suggestion log.
        if (core[-1] in "கஙசஞடணதநபமயரலவழளறனஜஷஸஹ"
                and (ext_vocab is None or ext_vocab[core] <= 3)):
            cands.add(core + "்")
            # two-error chain: dropped final pulli AND a glyph confusion in the
            # same token ("தோதல" → தோதல் → தேர்தல்). Same gates apply.
            if "ா" in core or "ோ" in core:
                cands |= glyph_candidates(core + "்")
        if not cands:
            out.append(tok)
            continue
        # a candidate qualifies via the trusted lexicon OR by being an
        # established word in the independent corpus (inflected forms like
        # தேர்தலை are common in the memoir but below the trusted list's
        # frequency cut)
        hits = {c for c in cands
                if c in trusted or (ext_vocab is not None and ext_vocab[c] >= 5)}
        established = ext_vocab is not None and ext_vocab[core] > 3
        if len(hits) == 1 and established:
            log.append({"id": page_id, "action": "GLYPH-suggest", "wrong": core,
                        "right": next(iter(hits)) + " (blocked: real word, memoir freq "
                        + str(ext_vocab[core]) + ")", "candidateFreq": "", "tokenFreq": ""})
            out.append(tok)
            continue
        if len(hits) == 1:
            right = hits.pop()
            out.append(lead + right + trail)
            log.append({"id": page_id, "action": "glyph-healed", "wrong": core,
                        "right": right, "candidateFreq": "trusted", "tokenFreq": ""})
            n += 1
        else:
            if len(hits) > 1:
                log.append({"id": page_id, "action": "GLYPH-suggest", "wrong": core,
                            "right": " | ".join(sorted(hits)[:4]),
                            "candidateFreq": "", "tokenFreq": ""})
            out.append(tok)
    return "".join(out), n

# ---------------------------------------------------------------- self-heal
# Letters that CANNOT begin a Tamil word — word-initial occurrence is always OCR error.
IMPOSSIBLE_INITIALS = set("னணழறளங")
# Vowels Tesseract habitually swaps at word start (ஒது→இது etc.).
CONFUSABLE_INITIAL_VOWELS = set("அஇஉஎஒஈஏஆஓஊ")
REPLACEMENT_VOWELS = "அஇஉஎஒஏஆஈஊஓ"

def load_trusted(path):
    """Curated trusted vocabulary (e.g. trusted_terms_for_murasoli.json — terms
    verified against Kalaignar's own usage across the six memoir volumes).
    Accepts {"terms": [...]} or a plain JSON list. Normalized on load."""
    d = json.load(open(path, encoding="utf-8"))
    terms = d["terms"] if isinstance(d, dict) else d
    return {norm(t) for t in terms if isinstance(t, str)}

def build_vocab(volume_files, extra_paths):
    """Token frequency over the volume's own pages + any --vocab JSON folders."""
    vocab = Counter()
    def eat(paras):
        for p in paras:
            for tok in re.split(r"\s+", norm(p)):
                _, core, _ = split_token(tok)
                if core and TAMIL.search(core):
                    vocab[core] += 1
    for fn in volume_files:
        d = json.load(open(fn, encoding="utf-8"))
        paras, _ = extract_paragraphs(d)
        eat(paras)
    for path in extra_paths:
        files = glob.glob(os.path.join(path, "*.json")) if os.path.isdir(path) else glob.glob(path)
        for fn in files:
            try:
                d = json.load(open(fn, encoding="utf-8"))
            except Exception:
                continue
            paras = d.get("paragraphs", [])
            if isinstance(paras, list):
                eat([p for p in paras if isinstance(p, str)])
    return vocab

def self_heal_token(core, vocab, threshold, trusted=frozenset()):
    """Return (fixed_core, candidate_freq) or None. Conservative by design.

    Two regimes:
    - IMPOSSIBLE word-initial (ன ண ழ ற ள ங): no Tamil word starts with these,
      so the token is an OCR error no matter how often the error repeats.
      Heal if a first-letter swap reaches the corpus threshold.
    - CONFUSABLE vowel initial (ஒது→இது class): the token might be a real word,
      so demand strong evidence — the token must be RARE in absolute terms
      (<= 2 occurrences; real common words like ஒன்று or இரு have hundreds and
      are never touched), AND the candidate must clear the threshold AND
      outnumber the token 10:1.
      LESSON (V54 first run): without this absolute-rarity gate, mega-frequent
      function words like என்று out-frequency even legitimate ஒன்று by 10:1 and
      the healer corrupts perfectly good text. The rarity gate is load-bearing.
    """
    if len(core) < 3 or not TAMIL.search(core):
        return None
    first = core[0]
    impossible = first in IMPOSSIBLE_INITIALS
    if not impossible and first not in CONFUSABLE_INITIAL_VOWELS:
        return None
    if core in trusted:
        return None  # verified Kalaignar-usage vocabulary — NEVER touch it
    if not impossible and vocab[core] > 2:
        return None  # established word in this corpus — never touch it
    cands = []
    for v in REPLACEMENT_VOWELS:
        if v == first:
            continue
        cand = v + core[1:]
        f = vocab[cand]
        if cand in trusted:            # curated vocabulary counts as evidence
            f = max(f, threshold)
        if f >= threshold and (impossible or f >= 10 * max(vocab[core], 1)):
            cands.append((cand, f))
    if not cands:
        return None
    cands.sort(key=lambda c: -c[1])
    # VOWEL-INITIAL TOKENS ARE NEVER AUTO-HEALED. Tamil deictic pairs (இது/அது,
    # இவர்/அவர், உனக்கு/எனக்கு, எதை/அதை, அன்றி/இன்றி …) are ALL valid words —
    # only sentence context can decide between them, and frequency is not
    # context. V54 review showed every mis-heal came from this class. They are
    # logged as suggestions (with page ids) for the human corrections workflow.
    if not impossible:
        return {"action": "suggest",
                "alternatives": [f"{c}:{f}" for c, f in cands[:4]]}
    # Impossible-initial tokens are certainly OCR errors; still apply the
    # ambiguity guard before choosing a repair.
    if len(cands) > 1 and cands[1][1] * 3 >= cands[0][1]:
        return {"action": "suggest",
                "alternatives": [f"{c}:{f}" for c, f in cands[:4]]}
    return {"action": "heal", "right": cands[0][0], "freq": cands[0][1]}

def heal_paragraph(text, vocab, threshold, log, page_id, trusted=frozenset()):
    n = 0
    out = []
    for tok in re.split(r"(\s+)", text):
        if not tok or tok.isspace():
            out.append(tok)
            continue
        lead, core, trail = split_token(tok)
        healed = self_heal_token(core, vocab, threshold, trusted) if core else None
        if healed and healed["action"] == "heal":
            out.append(lead + healed["right"] + trail)
            log.append({"id": page_id, "action": "healed", "wrong": core,
                        "right": healed["right"], "candidateFreq": healed["freq"],
                        "tokenFreq": vocab[core]})
            n += 1
        else:
            if healed and healed["action"] == "suggest":
                log.append({"id": page_id, "action": "SUGGEST-review", "wrong": core,
                            "right": " | ".join(healed["alternatives"]),
                            "candidateFreq": "", "tokenFreq": vocab[core]})
            out.append(tok)
    return "".join(out), n

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="stage-01 folder (contains text/)")
    ap.add_argument("--out", required=True, help="output folder (text/ created)")
    ap.add_argument("--volume", type=int, required=True)
    ap.add_argument("--corrections", action="append", default=[],
                    help="correction CSV (repeatable)")
    ap.add_argument("--min-confidence", default="medium",
                    choices=["low", "medium", "high"])
    ap.add_argument("--self-heal", action="store_true",
                    help="corpus-validated first-letter confusion repair (logged)")
    ap.add_argument("--heal-threshold", type=int, default=3,
                    help="min corpus frequency for a self-heal replacement (default 3)")
    ap.add_argument("--vocab", action="append", default=[],
                    help="extra vocabulary: folder or glob of JSON files with "
                         "a paragraphs[] field (repeatable)")
    ap.add_argument("--trusted", default=None,
                    help="curated trusted-terms JSON (never modified; candidates "
                         "in it count as corpus evidence)")
    ap.add_argument("--min-candidate-conf", type=float, default=55.0,
                    help="min meanConfidence to rescue a textCandidates line")
    args = ap.parse_args()

    mapping = load_corrections(args.corrections, args.min_confidence)
    print(f"loaded {len(mapping)} correction rules (>= {args.min_confidence} confidence)")

    src_text = os.path.join(args.src, "text")
    out_text = os.path.join(args.out, "text")
    os.makedirs(out_text, exist_ok=True)

    files = sorted(glob.glob(f"{src_text}/m{args.volume}-p*.json"))
    if not files:
        raise SystemExit(f"No pages in {src_text}")

    vocab = None
    ext_vocab = None
    trusted = frozenset()
    if args.trusted:
        trusted = load_trusted(args.trusted)
        print(f"trusted vocabulary: {len(trusted)} terms (never modified)")
    if args.self_heal:
        ext_vocab = build_vocab([], args.vocab)   # independent corpus only
        vocab = ext_vocab + build_vocab(files, [])  # + this volume
        print(f"self-heal vocabulary: {len(vocab)} distinct tokens "
              f"({sum(vocab.values())} occurrences; "
              f"{len(ext_vocab)} from the independent corpus)")

    report, dropped, rescued, heal_log = [], [], [], []
    kept = corrected_pages = total_fixes = total_heals = 0

    for fn in files:
        d = json.load(open(fn, encoding="utf-8"))
        pid = d["id"]
        paras, rescued_from = extract_paragraphs(d, args.min_candidate_conf)

        if not paras:
            dropped.append({"id": pid, "page": d.get("page"),
                            "reason": "no_tamil_text_anywhere",
                            "pageType": d.get("pageType")})
            continue
        if rescued_from:
            rescued.append({"id": pid, "page": d.get("page"),
                            "rescuedFrom": rescued_from, "lines": len(paras),
                            "ocrStatus": d.get("ocrStatus")})

        new_paras, page_fixes, page_heals = [], 0, 0
        for p in paras:
            np_, n = correct_paragraph(p, mapping)
            page_fixes += n
            if args.self_heal:
                np_, o = ortho_paragraph(np_, vocab, trusted, heal_log, pid)
                np_, g = glyph_paragraph(np_, trusted, heal_log, pid, ext_vocab)
                np_, h = heal_paragraph(np_, vocab, args.heal_threshold, heal_log, pid, trusted)
                page_heals += h + o + g
            new_paras.append(np_)

        d["paragraphs"] = new_paras
        d["correctionStage"] = {
            "script": "apply_corrections_v4",
            "fixesApplied": page_fixes,
            "selfHeals": page_heals,
            "normalized": True,          # NFC + zero-width stripped
            "minConfidence": args.min_confidence,
            **({"rescuedFrom": rescued_from} if rescued_from else {}),
            "at": datetime.now(timezone.utc).isoformat(),
        }
        json.dump(d, open(f"{out_text}/{pid}.json", "w", encoding="utf-8"),
                  ensure_ascii=False)
        kept += 1
        total_fixes += page_fixes
        total_heals += page_heals
        if page_fixes or page_heals:
            corrected_pages += 1
        report.append({"id": pid, "page": d.get("page"), "pageType": d.get("pageType"),
                       "paragraphs": len(new_paras), "fixes": page_fixes,
                       "selfHeals": page_heals})

    os.makedirs(args.out, exist_ok=True)
    def write_csv(name, rows, fields):
        with open(f"{args.out}/{name}", "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader(); w.writerows(rows)
    write_csv("correction_report.csv", report,
              ["id", "page", "pageType", "paragraphs", "fixes", "selfHeals"])
    write_csv("dropped_pages.csv", dropped, ["id", "page", "reason", "pageType"])
    write_csv("rescued_pages.csv", rescued,
              ["id", "page", "rescuedFrom", "lines", "ocrStatus"])
    if args.self_heal:
        write_csv("self_heal_report.csv", heal_log,
                  ["id", "action", "wrong", "right", "candidateFreq", "tokenFreq"])

    print(f"\ninput pages:      {len(files)}")
    print(f"kept (written):   {kept}")
    print(f"  of which corrected: {corrected_pages}")
    print(f"  csv token fixes:    {total_fixes}")
    print(f"  self-heals:         {total_heals}  -> see self_heal_report.csv")
    print(f"rescued from ocrLines/textCandidates: {len(rescued)}  -> rescued_pages.csv")
    print(f"dropped (no Tamil anywhere): {len(dropped)}  -> dropped_pages.csv")
    print(f"\nEvery page with Tamil text is now in {out_text}/ — no silent loss.")

if __name__ == "__main__":
    main()
