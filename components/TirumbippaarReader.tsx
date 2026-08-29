"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type {
  TirumbippaarScene,
  TirumbippaarSceneStub,
  TirumbippaarTamilBlock,
  TirumbippaarEnglishUnit,
} from "@/data/tirumbippaar";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One scene of திரும்பிப்பார்! — a clean literary reading interface.
 *
 * A PUBLICATION INTERFACE. No PDF page, no printed page, no scan hash, no source commit, no dialogue
 * or translation-unit id, no QA label — not in the text, not in a tooltip, and not in an aria-label
 * either, since a name a screen reader speaks is still something the page says. All of it is
 * published in full at /cinema/tirumbippaar/source. The two interfaces are not mixed.
 *
 * ONE LANGUAGE AT A TIME. Tamil is the default and English replaces it, the way every other
 * bilingual Reading Room here works. The scene is passed in from the server, so the Tamil is in the
 * initial HTML — present for a crawler, for a reader with JavaScript off, and for Print → Save as
 * PDF — and printing yields the language on screen, never both.
 *
 * ── THE TWO TEXT LAYERS ARE MIRROR IMAGES ────────────────────────────────────
 * Tamil `text` ALREADY contains the printed speaker label with the booklet's own spacing
 * (`பாண்டியன் : தொழிலாளர்கள்` — note the space before the colon, which the source prints and which
 * was settled against the controlling scan). It is rendered exactly as stored and never rebuilt from
 * `speakerLabel` + `text`; recomposing it would quietly normalise punctuation the source chose.
 * English `text` never carries the label, so the label is rendered separately — and it is the EXACT
 * Tamil label, never expanded to an English name. Where the label is null the source labelled nobody
 * and nothing is supplied.
 *
 * ── EVERY BLOCK IS READING MATTER ────────────────────────────────────────────
 * Blocks render in source order and none is filtered by kind. Six scenes carry no speaker-labelled
 * dialogue at all — they hold stage directions, chant, newspaper and performance material — so a
 * dialogue-only reader would present six scenes as empty.
 *
 * ── THE SEPARATOR IS ORNAMENT, NOT PROSE ─────────────────────────────────────
 * The booklet divides its scenes with a printed star, and the archive keeps those 94 marks as their
 * own block kind rather than letting them become sentences. Here they render as a centred decorative
 * rule, are hidden from assistive technology, and are never spoken as reading content. The word
 * "separator" is never shown. They are also never dropped: removing them would silently join text
 * across a division the booklet actually prints.
 *
 * ── GRANULARITY IS NOT A DISCREPANCY ─────────────────────────────────────────
 * The reading stream is built from the 923 speaker-labelled blocks, not from the 1042 immutable
 * dialogue records. Ten scenes print one long speech across several paragraphs that the archive
 * indexes as several records; the records exist for provenance and alignment, and reconstructing the
 * literary text from them would reshape the page the booklet set.
 */
export default function TirumbippaarReader({
  scene, stub, total, prev, next,
}: {
  scene: TirumbippaarScene;
  stub: TirumbippaarSceneStub;
  total: number;
  prev: TirumbippaarSceneStub | null;
  next: TirumbippaarSceneStub | null;
}) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [showEn, setShowEn] = useState(false);

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label={ta ? "வழிசெலுத்தல்" : "Navigation"} className="mb-8 text-sm" data-print="hide">
        <Link href="/cinema/tirumbippaar" className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">
          திரும்பிப்பார்!
        </Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light">
          <span lang={lang}>{ta ? "மின்னூலகம்" : "The library"}</span>
        </Link>
      </nav>

      <article>
        {/* The heading is the booklet's own, verbatim. Scene 5 prints an opening bracket where a
            closing one would be expected, scene 36 prints no closing glyph at all, and scene 43
            prints a full stop after its bracket. Those readings were adjudicated against the
            controlling scan; tidying them here would undo that. */}
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

        {/* An authorship distinction, not archival furniture: which layer is authoritative. No claim
            of human editorial review is made, because the project has no such layer. */}
        {showEn ? (
          <p className="mt-4 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70">
            {ta
              ? "இது இத்திட்டத்திற்காக உருவாக்கப்பட்ட, மூலத்துடன் இணைக்கப்பட்ட ஆங்கில வாசிப்பு அடுக்கு. மூல தமிழே அதிகாரபூர்வமானது. பேச்சாளர் பெயர்கள் அச்சிட்ட தமிழ் வடிவிலேயே தரப்படுகின்றன."
              : "A project-created, source-linked English reading translation. The Tamil original remains authoritative. Speaker labels are given in the exact printed Tamil."}
          </p>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/60 dark:border-white/15 dark:text-night-text/60">
            {ta
              ? "கீழே கலைஞரின் மூல தமிழ் உரை — அச்சிட்ட நூலின்படி, மாற்றமின்றி."
              : "Below is Kalaignar's original Tamil text, verbatim from the printed booklet, unaltered."}
          </p>
        )}

        <div className={cn("mt-10 break-words", showEn ? "font-body text-base" : "font-tamil text-lg")} lang={showEn ? "en" : "ta"}>
          {showEn ? renderEnglish(scene.english.units) : renderTamil(scene.tamil.blocks)}
        </div>

        <nav aria-label={ta ? "காட்சி வழிசெலுத்தல்" : "Scene navigation"} className="mt-12 flex items-center justify-between gap-4 border-t border-ink/10 pt-6 text-sm dark:border-white/10" data-print="hide">
          {/* Ordered-registry neighbours, never n±1. This work happens to number consecutively, but
              the registry is the authority so the architecture stays source-driven. */}
          {prev ? (
            <Link href={`/cinema/tirumbippaar/${prev.slug}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">
              ← {prev.headingTa}
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/cinema/tirumbippaar/${next.slug}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">
              {next.headingTa} →
            </Link>
          ) : <span />}
        </nav>

        <div className="mt-8 text-xs leading-relaxed text-ink/45 dark:text-night-text/45">
          <Link
            href="/cinema/tirumbippaar/source"
            className="underline decoration-ink/20 underline-offset-2 hover:text-marina dark:decoration-white/20 dark:hover:text-marina-light"
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
// source's own line breaks.
function renderTamil(blocks: TirumbippaarTamilBlock[]): ReactNode[] {
  return blocks.map((b, i) => {
    if (b.kind === "separator") {
      // Ornament, not reading matter: decorative, unannounced, and never joined into the text
      // around it.
      return (
        <div key={i} className="my-8 text-center text-sm text-ink/25 dark:text-night-text/25" aria-hidden="true">
          ★
        </div>
      );
    }
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

// English: every unit, in order. The stored text carries its own lineation, so it is rendered with
// `whitespace-pre-line` rather than being re-wrapped. The label, when the source gives one, is the
// exact Tamil label and is set beside the text rather than folded into it.
function renderEnglish(units: TirumbippaarEnglishUnit[]): ReactNode[] {
  return units.map((u) => {
    // A song-reference is a reference: the booklet prints no complete lyric body for either
    // source-named song, so nothing is set as a full song here.
    if (u.kind === "song-reference" || u.kind === "chant") {
      return (
        <p key={u.id} className="mb-6 whitespace-pre-line pl-4 leading-[2] text-ink/85 dark:text-night-text/85">
          {u.text}
        </p>
      );
    }
    if (u.kind === "stage-direction") {
      return (
        <p key={u.id} className="mb-5 whitespace-pre-line leading-loose text-ink/60 dark:text-night-text/60">
          {u.text}
        </p>
      );
    }
    if (u.kind === "written-text") {
      return (
        <p key={u.id} className="mb-5 whitespace-pre-line border-l-2 border-ink/15 pl-4 leading-loose text-ink/75 dark:border-white/15 dark:text-night-text/75">
          {u.text}
        </p>
      );
    }
    return (
      <p key={u.id} className="mb-5 whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">
        {u.speakerLabel && (
          <span className="mr-2 font-tamil font-semibold text-ink dark:text-night-text" lang="ta">
            {u.speakerLabel}
          </span>
        )}
        {u.text}
      </p>
    );
  });
}
