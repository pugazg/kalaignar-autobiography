# Nenjukku Neethi — Documentary production system

A reusable, source-faithful pipeline for turning each chapter of *Nenjukku Neethi* into a
dignified, historically responsible narrated video. Pilot: **v1-ch01 · பிறந்த ஆண்டு**.

## Folder layout (per chapter)
```
documentary/
  README.md                 ← this file (workflow)
  terminology.md            ← shared translation glossary (all chapters)
  chapters/<id>/
    metadata.json           ← volume, chapter, versions, review + rights + render status
    source/                 ← chapter text + provenance
    script/                 ← narration (TA+EN), source-verification table, pronunciation, terminology refs
    storyboard/             ← timestamped storyboard + shot list
    subtitles/              ← <id>.ta.srt, <id>.en.srt
    audio/                  ← (empty until narration/music produced)
    assets/                 ← visual/audio asset list + rights status
    rights/                 ← attribution ledger + end-credit screen
    render/                 ← thumbnail concept, then final mp4 + thumbnail
    review/                 ← summary/timeline/entities, human-review items
```

## Workflow (do in order; gate each stage)
1. **Read** the chapter from the site as the primary source (`source/`).
2. **Analyse** → summary, timeline, entities (`review/chapter-summary.md`).
3. **Verify** → source-verification table; flag every uncertain date/quote (`script/`, `review/`).
4. **Script** → Tamil narration + English, labelled 〔Q〕/〔P〕/〔C〕/〔F〕 (`script/narration.md`).
5. **Subtitles** → author `.ta.srt` + `.en.srt` **from the approved script**, not from audio.
6. **Storyboard** → timestamped scenes + shot list; honour the "do not use" list.
7. **Assets & rights** → list every asset; record source + licence; nothing assumed PD.
8. **Pronunciation test** → render the 6-item Tamil test clip; review before full narration.
9. **Human review** → resolve every item in `review/human-review-items.md`.
10. **Render** → only after 1–9 are signed off. Update `metadata.json` (`renderStatus`,
    `finalRenderDate`, versions).

## Non-negotiable integrity rules
- The chapter text is the **primary source**. Do not invent quotations, incidents, dates,
  people, places, emotions, or historical claims.
- Distinguish direct quotation vs paraphrase vs external (dated, sourced) context.
- Any AI-generated historical reconstruction carries the on-screen label
  **"காட்சிப்படுத்தலுக்கான கற்பனை மறுவடிவம் · Illustrative reconstruction."**
- No fabricated photographs presented as genuine; no copyrighted film music or party imagery;
  no war-trailer tone. Voice-only documentary preferred; do not imitate Kalaignar's voice.
- End credits always list: primary text source, visuals, music, tools, and an AI-assistance
  statement.

## Tooling status (this environment)
This workspace can produce **all text deliverables** (script, subtitles, tables, storyboard,
metadata). It **cannot** by itself render MP4 video, synthesise the Tamil voice, or generate
final imagery — those require an external tool (e.g. HeyGen for voice; a video editor for the
cut). HeyGen is **not** connected here; when it is, follow step 8 before step 10.
