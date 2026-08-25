"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { ParasakthiScene, ParasakthiSceneStub, ParasakthiTamilBlock, ParasakthiEnglishUnit } from "@/data/parasakthi";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One scene of பராசக்தி — a clean literary reading interface.
 *
 * A PUBLICATION INTERFACE. No PDF page, no printed page, no scan hash, no archive id, no dialogue or
 * translation-unit id, no QA label, no evidence tier — not in the text, not in a tooltip, and not in
 * an aria-label either, since a name a screen reader speaks is still something the page says. All of
 * it is published in full at /cinema/parasakthi/source. The two interfaces are not mixed.
 *
 * ONE LANGUAGE AT A TIME. Tamil is the default and English replaces it, the way every other
 * bilingual Reading Room here works. The scene is passed in from the server, so the Tamil is in the
 * initial HTML — present for a crawler, for a reader with JavaScript off, and for Print → Save as
 * PDF — and printing yields the language on screen, never both.
 *
 * ── THE TWO TEXT LAYERS ARE MIRROR IMAGES, AND THE DIFFERENCE IS LOAD-BEARING ───────────────────
 * Tamil `text` ALREADY contains the printed speaker label with the booklet's own spacing
 * (`ஞான : தம்பி!…`), so it is rendered exactly as stored and never rebuilt from
 * `speakerLabel` + `text` — recomposing it would quietly change punctuation the source chose.
 * English `text` never contains the label (0 of 636 labelled units), so the label is rendered
 * separately — and it is the EXACT TAMIL label. The archive keeps `ஞான` rather than expanding it to
 * "Gnanasekaran" deliberately, and this reader does not second-guess that: expanding abbreviations
 * would mean inventing names the source never prints, from a character mapping that is not fully
 * resolved. Where the label is null the source labelled nobody, and nothing is supplied.
 *
 * ── EVERY BLOCK IS READING MATTER ───────────────────────────────────────────────────────────────
 * Blocks render in source order and none is filtered by kind. Scenes 26, 29 and 48 carry no labelled
 * dialogue at all — they are stage directions and complete songs — so a reader that showed only
 * dialogue would present three scenes as empty. Verse keeps its source lineation, on both sides.
 *
 * ── SONG ATTRIBUTION IS NOT SHOWN HERE ──────────────────────────────────────────────────────────
 * The booklet credits six poets for the songs as a whole and pairs none of them with a song, and the
 * item-level attributions rest on three tiers of unequal weight — a secondary tracklist, the verified
 * Kalaignar film-song anthology, and the booklet's own words. That is evidence with tiers, and it
 * belongs on the source page. Two occurrences are Kalaignar's; the reader shows that no more than it
 * shows any other attribution. Where the booklet's own text names a poet inside the story, it is
 * already part of the reading text and is preserved as written.
 */
export default function ParasakthiReader({
  scene, stub, total, prev, next,
}: {
  scene: ParasakthiScene;
  stub: ParasakthiSceneStub;
  total: number;
  prev: ParasakthiSceneStub | null;
  next: ParasakthiSceneStub | null;
}) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [showEn, setShowEn] = useState(false);

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label={ta ? "வழிசெலுத்தல்" : "Navigation"} className="mb-8 text-sm" data-print="hide">
        <Link href="/cinema/parasakthi" className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">
          பராசக்தி
        </Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light">
          <span lang={lang}>{ta ? "மின்னூலகம்" : "The library"}</span>
        </Link>
      </nav>

      <article>
        {/* The scene's identity is its CANONICAL number. For the two transposed scenes the booklet
            prints a different one; that is provenance and is recorded on the source page, never
            shown here as the scene's name. */}
        <h1 className="font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">
          {scene.headingTa}
        </h1>
        <p className="mt-1 font-body text-xs uppercase tracking-[0.18em] text-ink/40 dark:text-night-text/40">
          {ta ? `காட்சி ${stub.canonicalScene}` : `Scene ${stub.canonicalScene}`}
          <span className="mx-2 text-ink/25 dark:text-night-text/25">·</span>
          {ta ? `${total} காட்சிகளில்` : `of ${total} scenes`}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3" data-print="hide">
          <div className="inline-flex overflow-hidden rounded-full border border-marina/40 text-xs font-medium">
            <button
              onClick={() => setShowEn(false)}
              className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")}
              aria-pressed={!showEn}
              lang="ta"
            >
              தமிழ்
            </button>
            <button
              onClick={() => setShowEn(true)}
              className={cn("focus-ring px-3 py-1 transition", showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")}
              aria-pressed={showEn}
            >
              English
            </button>
          </div>
        </div>

        <div className={cn("mt-10 break-words", showEn ? "font-body text-base" : "font-tamil text-lg")} lang={showEn ? "en" : "ta"}>
          {showEn ? renderEnglish(scene.english.units) : renderTamil(scene.tamil.blocks)}
        </div>

        <nav aria-label={ta ? "காட்சி வழிசெலுத்தல்" : "Scene navigation"} className="mt-12 flex items-center justify-between gap-4 border-t border-ink/10 pt-5 text-sm dark:border-white/10" data-print="hide">
          {/* Ordered-registry navigation, never n±1: scene 22 is followed by 24 and 33 by 35,
              because 23 and 34 are not printed in the booklet. */}
          {prev ? (
            <Link href={`/cinema/parasakthi/${prev.slug}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">
              ← {prev.headingTa}
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/cinema/parasakthi/${next.slug}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">
              {next.headingTa} →
            </Link>
          ) : <span />}
        </nav>

        <div className="mt-8 text-xs leading-relaxed text-ink/45 dark:text-night-text/45">
          <Link
            href="/cinema/parasakthi/source"
            className={cn("underline decoration-ink/20 underline-offset-2 hover:text-marina dark:decoration-white/20 dark:hover:text-marina-light", ta && "font-tamil")}
            lang={lang}
          >
            {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
          </Link>
        </div>
      </article>
    </main>
  );
}

// Tamil: every block, in order, rendered from its stored text. `whitespace-pre-line` keeps the
// source's own line breaks, which is what carries verse lineation.
function renderTamil(blocks: ParasakthiTamilBlock[]): ReactNode[] {
  return blocks.map((b, i) => {
    if (b.kind === "verse") {
      return (
        <p key={i} className="mb-6 whitespace-pre-line pl-4 leading-[2] text-ink/85 dark:text-night-text/85">
          {b.text}
        </p>
      );
    }
    if (b.kind === "stage-direction") {
      return (
        <p key={i} className="mb-5 whitespace-pre-line leading-loose text-ink/60 dark:text-night-text/60">
          {b.text}
        </p>
      );
    }
    // dialogue and prose alike: the stored text is the reading, label and punctuation included.
    return (
      <p key={i} className="mb-5 whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">
        {b.text}
      </p>
    );
  });
}

// English: every unit, in order. Lineated units keep their lines; the label, when the source gives
// one, is the exact Tamil label and is set above the text rather than folded into it.
function renderEnglish(units: ParasakthiEnglishUnit[]): ReactNode[] {
  return units.map((u) => {
    const body = u.lines ? (
      <span className="block whitespace-pre-line">{u.lines.join("\n")}</span>
    ) : (
      u.text
    );
    if (u.kind === "song" || u.kind === "quoted-verse") {
      return (
        <p key={u.id} className="mb-6 pl-4 leading-[2] text-ink/85 dark:text-night-text/85">
          {body}
        </p>
      );
    }
    if (u.kind === "stage-direction") {
      return (
        <p key={u.id} className="mb-5 leading-loose text-ink/60 dark:text-night-text/60">
          {body}
        </p>
      );
    }
    return (
      <p key={u.id} className="mb-5 leading-loose text-ink/90 dark:text-night-text/90">
        {u.speakerLabel && (
          <span className="mr-2 font-tamil font-semibold text-ink dark:text-night-text" lang="ta">
            {u.speakerLabel}
          </span>
        )}
        {body}
      </p>
    );
  });
}
