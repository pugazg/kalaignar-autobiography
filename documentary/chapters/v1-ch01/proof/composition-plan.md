# Opening proof — render-ready composition plan

> **No video has been rendered.** No render/voice tool (HeyGen, Remotion, ffmpeg, Higgsfield)
> is connected in this environment. This is the exact recipe to assemble the ~58 s proof once
> a voice track and (optional) test clips exist — in any editor (DaVinci Resolve / Premiere /
> After Effects / Remotion).

## Sequence settings
- 1920×1080, 16:9, **25 fps**, ~00:58 duration, MP4 (H.264, ~10–16 Mbps), audio 48 kHz stereo.

## Track layout
| Track | Content |
|---|---|
| V4 | Overlays: illustrative-reconstruction label (P4,P5); print-pending chip (P2,P3); CTA card |
| V3 | Tamil typography (Noto Serif Tamil) — titles + on-screen quotes, composited per storyboard |
| V2 | Base visuals: P1 Test A / P2 nib / P3 paper / P4 Test B / P5 Test C (fallbacks: paper+type) |
| V1 | Paper-texture backplate + நீ watermark |
| A1 | Tamil narration (from approved voice test → full opening VO) |
| A2 | Music bed (placeholder — must be licensed; see rights) |
| A3 | Foley/ambience (page-settle, pen, dawn wind) |
| Subs | Tamil `.srt` (burned or sidecar) + English `.srt` (sidecar) |

## Cut sheet (frames @25fps)
| Scene | In | Out | Base (V2) | Type (V3) | Overlay (V4) | Subtitle |
|---|---|---|---|---|---|---|
| P1 | 00:00:00 | 00:00:14 | Test A / paper | நெஞ்சுக்கு நீதி · தொகுதி 1 · 1924–1969 · பிறந்த ஆண்டு | — | 1–3 |
| P2 | 00:00:14 | 00:00:35 | nib / paper | opening question | print-pending chip | 4–5 |
| P3 | 00:00:35 | 00:00:47 | paper | "பெரிய மனிதர்களுக்குத்தான்…" | print-pending chip | 6 |
| P4 | 00:00:47 | 00:00:52 | Test B / paper | 1924 | Illustrative-reconstruction label | 7 |
| P5 | 00:00:52 | 00:00:58 | Test C / paper | திருக்குவளை | Illustrative-reconstruction label | 8 |
| End | 00:00:58 | 00:01:02 | paper + நீ | CTA nenjukkuneethi.org | — | — |

## Proof subtitle text (exact)
See `proof/opening-proof-subs.ta.srt` / `.en.srt` if generated; otherwise use beats 1–8 in
`opening-proof-script.md`. Subtitles are authored from the **approved script**, not inferred
from audio.

## Asset dependencies (status)
- Narration VO — **pending** (approve a pacing option in `narration-test-ta.md` first).
- Test A/B/C clips — **pending** (Higgsfield not connected; see `higgsfield-setup-status.md`).
  Fallback = typography-on-paper, which still yields a complete proof.
- Paper texture, நீ watermark, fonts — buildable now (OFL fonts; project-owned watermark).
- Music/foley — **pending licensing** (no unlicensed music).

## Definition of "proof done"
A ≤60 s MP4 that: states title/volume/chapter, presents the opening self-question, conveys
"history belongs to ordinary people too," transitions to 1924, glimpses Thirukkuvalai, ends
naturally; carries Tamil + English subtitles; shows the illustrative-reconstruction label on
any generated shot; uses no unlicensed music; and marks quotes as print-pending until R4 is
cleared.
