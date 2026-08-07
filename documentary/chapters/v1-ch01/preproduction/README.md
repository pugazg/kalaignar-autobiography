# v1-ch01 · பிறந்த ஆண்டு — AI documentary preproduction pack

This directory is a **documentation-only preproduction layer** for the Chapter 1 documentary pilot of *நெஞ்சுக்கு நீதி (Nenjukku Neethi)*.

It is intentionally isolated on branch `agent/v1-ch01-ai-preproduction` so the existing Nenjukku Neethi website and documentary setup remain untouched.

## Scope

- Work: *நெஞ்சுக்கு நீதி*
- Volume: 1
- Chapter: 1
- Chapter title: **பிறந்த ஆண்டு** / *The Year of Birth*
- Existing narration target: ~3:45
- Existing credits tail: to ~4:05
- Output format assumed by the existing package: 1920×1080, 16:9, 25 fps

## What this pack adds

This adapts the richer visual-development approach previously used for the Manimekalai screenplay workflow to a short historical documentary. Instead of generating images immediately, it creates a traceable preproduction package first.

- `01_storyboard.md`
  - scene IDs and shot IDs
  - timing and narration anchors
  - composition, blocking, lens, camera and movement
  - lighting and colour intent
  - evidence / reconstruction class
  - continuity requirements
  - AI still-image prompts and negative prompts
  - edit and motion notes
- `02_production-design.md`
  - global visual bible
  - scene-by-scene environment design
  - location, architecture, props, paper/map/newsprint language
  - Kalaignar portrait treatment
  - period-world rules
  - lighting, colour and texture
  - continuity controls and asset IDs
  - image-generation production order

## Source hierarchy

Every visual idea must carry one of these labels:

- **[TEXT]** — directly described or clearly anchored in the Chapter 1 source/narration.
- **[HISTORY]** — external historical context already included in the approved documentary script and still subject to normal source verification.
- **[INTERPRETATION]** — editorial visual metaphor or graphic treatment; not a claim that the depicted event literally occurred as shown.
- **[RECONSTRUCTION]** — AI-generated or illustrated recreation of a historical environment for which no verified photograph is being presented.

A generated reconstruction must never be presented as archival evidence. Where appropriate, the finished documentary should carry:

> **காட்சிப்படுத்தலுக்கான கற்பனை மறுவடிவம் · Illustrative reconstruction.**

## Non-negotiable integrity rules

1. The chapter text remains the primary source.
2. Do not invent incidents, dialogue, dates, people, relationships or emotions that are not supported by the source.
3. Do not generate a fake childhood photograph of Kalaignar and present it as genuine.
4. Do not use generic North-Indian visual language for Tamil settings.
5. Do not use campaign-poster, rally, triumphalist or war-trailer aesthetics.
6. Kalaignar may appear through a rights-cleared real portrait or a clearly editorial/illustrative treatment; avoid uncanny deepfake-style performance recreation.
7. Tamil text should be composed outside the image-generation model whenever exact wording matters; add typography in post so spelling and shaping remain correct.
8. External historical figures and events should be represented through verified archival material, maps, documents, or clearly labelled illustration rather than fabricated “photographs”.
9. Existing open review items in `metadata.json`, especially print verification of quotations and rights clearance, still apply.

## Relationship to existing files

This pack does **not** replace:

- `documentary/chapters/v1-ch01/metadata.json`
- `documentary/chapters/v1-ch01/script/narration.md`
- `documentary/chapters/v1-ch01/storyboard/storyboard.md`
- subtitles, rights ledgers or existing render tooling

It expands the visual planning before image generation.

## Production sequence after review

1. Review `01_storyboard.md` for narrative and shot rhythm.
2. Review `02_production-design.md` for historical and visual consistency.
3. Verify any historical/location assumptions that are marked unresolved.
4. Generate low-resolution storyboard stills by shot ID.
5. Review character / portrait / environment continuity.
6. Generate final production-design keyframes and hero plates.
7. Add exact Tamil typography in post rather than relying on generated text.
8. Assemble the documentary only after rights and quotation review gates are cleared.

## Branch safety

This branch is preproduction-only. It must not modify the current website UI, routes, deployed assets, chapter content, or production render setup unless a later task explicitly asks for that work.