#!/usr/bin/env python3
"""
Apply reviewed OCR corrections to page JSON files (conservative, automatic-only).
Reads outputs/murasoli_dictionary/automatic_corrections.csv by default.
Exact Tamil-token replacement; keeps original JSON untouched; writes corrected
JSON + CSV/JSON audit reports. See murasoli-ocr-guide.md for the full workflow.
Full source: provided by the project maintainer (Pugazh).
"""
# NOTE: canonical version maintained by the user. This copy is kept in-repo as
# documentation of the correction stage. See apply_curated_corrections.py for the
# token+phrase curated variant.
