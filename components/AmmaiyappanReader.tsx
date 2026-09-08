"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { AmmaiyappanReader, AmmaiyappanEnglishUnit } from "@/data/ammaiyappan";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One reading surface of அம்மையப்பன் — one archival screenplay segment.
 *
 * A PUBLICATION INTERFACE: no PDF page, scan hash, source commit, record id or QA label appears here;
 * all of it lives at /cinema/ammaiyappan/source.
 *
 * THE NUMBERING TRUTH, ENFORCED IN WORDING: a segment shows "களஞ்சியப் பகுதி N / 63" / "Archive segment
 * N of 63". The 1954 booklet prints no scene numbers, so nothing here says "Scene N as printed" or a
 * source scene number.
 *
 * SONG OCCURRENCES: the few in-scene song/performance references (kind "song-reference") are occurrence
 * references only — never rendered as standalone Kalaignar-authored lyrics.
 *
 * Tamil scene text is one stored block rendered verbatim (whitespace-pre-line); English is the unit
 * stream, each unit's exact printed Tamil speaker label set beside it, never expanded to English.
 */
export default function AmmaiyappanReaderView({ reader, slug }: { reader: AmmaiyappanReader; slug: string }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [showEn, setShowEn] = useState(false);
  const sceneSlug = (o: number) => `scene-${String(o).padStart(3, "0")}`;

  const ord = Number(slug.replace("scene-", ""));
  const scenes = reader.screenplayScenes;
  const i = scenes.findIndex((s) => s.archivalSceneOrdinal === ord);
  const scene = scenes[i];
  if (!scene) return null;
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label={ta ? "வழிசெலுத்தல்" : "Navigation"} className="mb-8 text-sm" data-print="hide">
        <Link href="/cinema/ammaiyappan" className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">{reader.work.titleTa}</Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light"><span lang={lang}>{ta ? "மின்னூலகம்" : "The library"}</span></Link>
      </nav>
      <article>
        {/* Archive segment — NOT a source-printed scene number. */}
        <h1 className="font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text" lang={ta ? "ta" : "en"}>
          {ta ? `களஞ்சியப் பகுதி ${scene.archivalSceneOrdinal}` : `Archive segment ${scene.archivalSceneOrdinal}`}
        </h1>
        {scene.sourceHeadingTa && (
          <p className="mt-1 font-tamil text-sm text-ink/70 dark:text-night-text/70" lang="ta">{scene.sourceHeadingTa}</p>
        )}
        <p className="mt-1 font-body text-xs uppercase tracking-[0.18em] text-ink/40 dark:text-night-text/40">
          {ta ? `${scenes.length} பகுதிகளில்` : `of ${scenes.length} archive segments`}
          <span className="mx-2 text-ink/25 dark:text-night-text/25">·</span>
          {ta ? "மூல எண்ணிடல் அல்ல" : "not source-numbered"}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3" data-print="hide">
          <div className="inline-flex overflow-hidden rounded-full border border-marina/40 text-xs font-medium">
            <button onClick={() => setShowEn(false)} className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={!showEn} lang="ta">தமிழ்</button>
            <button onClick={() => setShowEn(true)} className={cn("focus-ring px-3 py-1 transition", showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={showEn}>English</button>
          </div>
        </div>

        <div className={cn("mt-8 break-words", showEn ? "font-body text-base" : "font-tamil text-lg")} lang={showEn ? "en" : "ta"}>
          {showEn ? renderEnglish(scene.englishUnits) : (
            <p className="whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">{scene.tamilText}</p>
          )}
        </div>

        <nav aria-label={ta ? "பகுதி வழிசெலுத்தல்" : "Section navigation"} className="mt-12 flex items-center justify-between gap-4 border-t border-ink/10 pt-6 text-sm dark:border-white/10" data-print="hide">
          {i > 0 ? <Link href={`/cinema/ammaiyappan/${sceneSlug(scenes[i - 1].archivalSceneOrdinal)}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang={ta ? "ta" : "en"}>← {ta ? `களஞ்சியப் பகுதி ${scenes[i - 1].archivalSceneOrdinal}` : `Segment ${scenes[i - 1].archivalSceneOrdinal}`}</Link> : <span />}
          {i < scenes.length - 1 ? <Link href={`/cinema/ammaiyappan/${sceneSlug(scenes[i + 1].archivalSceneOrdinal)}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang={ta ? "ta" : "en"}>{ta ? `களஞ்சியப் பகுதி ${scenes[i + 1].archivalSceneOrdinal}` : `Segment ${scenes[i + 1].archivalSceneOrdinal}`} →</Link> : <span />}
        </nav>
        <div className="mt-8 text-xs leading-relaxed text-ink/45 dark:text-night-text/45">
          <Link href="/cinema/ammaiyappan/source" className="underline decoration-ink/20 underline-offset-2 hover:text-marina dark:decoration-white/20 dark:hover:text-marina-light" lang={lang}>
            {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
          </Link>
        </div>
      </article>
    </main>
  );
}

// English screenplay units in source order, each kind styled; the exact printed Tamil speaker label is
// set beside dialogue, never expanded to an English name. Song-reference and japa units are rendered
// as source-visible references, never as standalone authored lyrics.
function renderEnglish(units: AmmaiyappanEnglishUnit[]): ReactNode[] {
  return units.map((u) => {
    if (u.kind === "stage-direction") {
      return <p key={u.id} className="mb-5 whitespace-pre-line leading-loose text-ink/60 dark:text-night-text/60">{u.englishText}</p>;
    }
    if (u.kind === "song-reference" || u.kind === "japa") {
      return <p key={u.id} className="mb-6 whitespace-pre-line border-l-2 border-ink/15 pl-4 leading-[2] text-ink/75 dark:border-white/15 dark:text-night-text/75">{u.englishText}</p>;
    }
    return (
      <p key={u.id} className="mb-5 whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">
        {u.speakerLabel && <span className="mr-2 font-tamil font-semibold text-ink dark:text-night-text" lang="ta">{u.speakerLabel}</span>}
        {u.englishText}
      </p>
    );
  });
}
