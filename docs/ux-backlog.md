# UX / engagement backlog — Reading Room chapter pages

From reviewer feedback (July 2026). Triaged by effort and by fit with the
archive's principles (original text intact; nothing fabricated; citations
everywhere). Work through top-down in future sessions.

## Quick wins (client-side, no data changes)

- [x] **Estimated reading time** under the chapter title (word count / 200 wpm,
      computed from the loaded JSON). Pair with the existing scroll progress.
- [x] **Chapter progress %** in the reader header (scroll position already
      tracked for position-restore — surface it).
- [x] **Related/next navigation upgrade**: the prev/next cards exist; add
      "Also in this volume" (3 nearby chapters) at chapter end.
- [x] **Mark as read** (localStorage, like bookmarks) + read-count on the
      Library shelf.

## Medium (needs a data pass, no new content invention)

- [x] **Chapter teaser (2–3 sentences)** under the title. MUST be written per
      chapter and verified against the text (391 chapters → generate drafts
      from opening paragraphs + maintainer review; never invent).
- [x] **Pull quotes**: mark 1–2 key sentences per chapter (data file:
      `data/pullquotes.ts`, refs verified) rendered as styled cards inline.
- [x] **In-chapter TOC**: chapters are OCR paragraphs without headings;
      auto-generating headings would fabricate structure. Viable version:
      paragraph-anchor jump list for LONG chapters (> N paragraphs) with
      first-words as labels, clearly mechanical.
- [x] **Shareable highlight cards**: select text → canvas-rendered quote card
      (chapter title + VN·chNN + nenjukkuneethi.org) for X/Instagram.

## Heavy / needs assets or moderation (decide before building)

- [ ] **Images in chapters**: only with documented provenance (gallery policy
      applies inside chapters too). Wall posters/newspaper scans need rights
      research first.
- [ ] **Audio narration**: professional Tamil narration is an asset project;
      TTS would need a quality bar decision. Park until a narrator exists.
- [ ] **Per-paragraph discussion/comments**: requires moderation
      infrastructure; conflicts with the static-site architecture. If ever,
      start with GitHub Discussions linked per chapter.
- [ ] **Hover tooltips for names/dates**: viable via the entities pipeline
      (archive/*.json already maps people→chapters) — link names to the
      People section rather than external popups.

## Already done (for the record)

- Mobile: overflow-x clamp, Tamil-aware hero leading, dark mode existed.
- Tamil default language; transliterated search everywhere; full-text search.
- SEO: sitemap/OG/JSON-LD/Search Console (done earlier).
- Bookmarks, reading position restore, font control, share buttons.
