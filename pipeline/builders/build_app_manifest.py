#!/usr/bin/env python3
"""Build the versioned app-content manifest consumed by the mobile app.

The website + archive JSON remain the source of truth. This builder reads the
already-published archive data (public/data/*) and emits a single versioned
manifest the mobile app fetches once and caches for offline use:

    public/data/app/manifest.v1.json

The manifest never contains historical prose — only structure and the URLs at
which the app fetches chapter text, search indexes, letters and feature data.
Chapter text (`/data/text/<id>.json`), English (`/data/text-en/<id>.json`),
per-volume search indexes (`/data/fulltext/v<N>.json`), visuals
(`/data/visuals/<id>.json`) and Murasoli letters are reused as-is.

Run:  python3 pipeline/builders/build_app_manifest.py
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "public" / "data"
OUT_DIR = DATA / "app"
SCHEMA_VERSION = 1
DATA_BASE = "/data"  # app resolves against its configured origin (nenjukkuneethi.org)


def sha_short(*paths: Path) -> str:
    h = hashlib.sha256()
    for p in sorted(paths):
        if p.exists():
            h.update(p.read_bytes())
    return h.hexdigest()[:12]


def feature_url(name: str) -> str | None:
    """Feature datasets (timeline, governance, …) are exported as JSON by the
    feature-data exporter. Reference them only when the file actually exists."""
    p = OUT_DIR / "features" / f"{name}.json"
    return f"{DATA_BASE}/app/features/{name}.json" if p.exists() else None


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    meta = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
    meta_by_n = {v["n"]: v for v in meta.get("volumes", [])}

    volumes = []
    index_files = []
    for n in range(1, 7):
        idx_path = DATA / f"volume{n}.index.json"
        if not idx_path.exists():
            continue
        index_files.append(idx_path)
        idx = json.loads(idx_path.read_text(encoding="utf-8"))
        m = meta_by_n.get(n, {})
        chapters = []
        for c in idx.get("chapters", []):
            cid = c["id"]
            has_en = (DATA / "text-en" / f"{cid}.json").exists()
            has_vis = (DATA / "visuals" / f"{cid}.json").exists()
            chapters.append(
                {
                    "id": cid,
                    "title": c.get("title", ""),
                    "startPage": c.get("startPage"),
                    "endPage": c.get("endPage"),
                    "textUrl": f"{DATA_BASE}/text/{cid}.json",
                    "textEnUrl": f"{DATA_BASE}/text-en/{cid}.json" if has_en else None,
                    "visualsUrl": f"{DATA_BASE}/visuals/{cid}.json" if has_vis else None,
                }
            )
        volumes.append(
            {
                "n": n,
                "titleTa": idx.get("titleTamil"),
                "titleEn": idx.get("titleEnglish"),
                "period": m.get("period"),
                "serialisedIn": m.get("serialisedIn"),
                "chapterCount": idx.get("chapterCount", len(chapters)),
                "pages": idx.get("totalPages", m.get("pages")),
                "searchIndexUrl": f"{DATA_BASE}/fulltext/v{n}.json"
                if (DATA / "fulltext" / f"v{n}.json").exists()
                else None,
                "chapters": chapters,
            }
        )

    # Murasoli letters collection (separate archive)
    murasoli = None
    m_index = DATA / "murasoli" / "index.json"
    m_letters = DATA / "murasoli" / "letters-index.json"
    if m_index.exists():
        mi = json.loads(m_index.read_text(encoding="utf-8"))
        li = json.loads(m_letters.read_text(encoding="utf-8")) if m_letters.exists() else {"volumes": []}
        murasoli = {
            "title": mi.get("title"),
            "indexUrl": f"{DATA_BASE}/murasoli/index.json",
            "lettersIndexUrl": f"{DATA_BASE}/murasoli/letters-index.json",
            "letterUrlTemplate": f"{DATA_BASE}/murasoli/letters/{{id}}.json",
            "letterEnUrlTemplate": f"{DATA_BASE}/murasoli/letters-en/{{id}}.json",
            "volumeCount": mi.get("volumeCount"),
            "totalLetters": sum(v.get("letterCount", 0) for v in li.get("volumes", [])),
        }

    content_version = sha_short(*index_files, DATA / "manifest.json")
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "contentVersion": content_version,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "dataBase": DATA_BASE,
        "work": {
            "titleTa": "நெஞ்சுக்கு நீதி",
            "titleEn": "Nenjukku Neethi",
            "author": "மு. கருணாநிதி (M. Karunanidhi)",
            "siteUrl": "https://nenjukkuneethi.org",
        },
        "volumes": volumes,
        "murasoli": murasoli,
        "features": {
            "timeline": feature_url("timeline"),
            "governance": feature_url("governance"),
            "people": feature_url("people"),
            "places": feature_url("places"),
            "themes": feature_url("themes"),
            "quotes": feature_url("quotes"),
            "stats": f"{DATA_BASE}/stats.json" if (DATA / "stats.json").exists() else None,
        },
    }

    out = OUT_DIR / "manifest.v1.json"
    out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    total_ch = sum(v["chapterCount"] for v in volumes)
    print(f"Wrote {out.relative_to(ROOT)}")
    print(f"  contentVersion={content_version} · volumes={len(volumes)} · chapters={total_ch}")
    print(f"  murasoli={'yes' if murasoli else 'no'} · features present: "
          f"{[k for k,v in manifest['features'].items() if v]}")


if __name__ == "__main__":
    main()
