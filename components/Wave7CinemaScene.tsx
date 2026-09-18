"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { Wave7CinemaWork, Wave7CinemaUnit } from "@/data/wave7-cinema";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One reading surface of a Wave-7 Batch-1 cinema work — a single screenplay scene/segment.
 *
 * A PUBLICATION INTERFACE: no PDF page, scan hash, source commit, record id or QA label is shown here;
 * that lives on /cinema/<slug>/source. Tamil scene text is the one stored verbatim block (rendered
 * whitespace-pre-line, never reassembled); English is the source unit stream, each dialogue unit's exact
 * printed Tamil speaker label set beside it (never expanded to an English name). Song / performance-cue
 * units are source occurrence references, NEVER standalone authored lyrics. A source scene number is
 * shown only when the payload marks its numbering as printed; an unnumbered opening stays unnumbered.
 */
export default function Wave7CinemaScene({ work, slug }: { work: Wave7CinemaWork; slug: string }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [showEn, setShowEn] = useState(false);

  const scenes = work.scenes;
  const i = scenes.findIndex((s) => s.sectionSlug === slug);
  const scene = scenes[i];
  if (!scene) return null;
  const label = (s: (typeof scenes)[number]) =>
    s.numberingIsPrinted && s.sourceSceneNumber != null
      ? (ta ? `காட்சி ${s.sourceSceneNumber}` : `Scene ${s.sourceSceneNumber}`)
      : (ta ? `பகுதி ${s.navOrdinal}` : `Segment ${s.navOrdinal}`);

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label={ta ? "வழிசெலுத்தல்" : "Navigation"} className="mb-8 text-sm" data-print="hide">
        <Link href={`/cinema/${work.slug}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">{work.titleTa}</Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light"><span lang={lang}>{ta ? "மின்னூலகம்" : "The library"}</span></Link>
      </nav>
      <article>
        <h1 className="font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text" lang={ta ? "ta" : "en"}>{label(scene)}</h1>
        {scene.headingTa && <p className="mt-1 font-tamil text-sm text-ink/70 dark:text-night-text/70" lang="ta">{scene.headingTa}</p>}
        {scene.locationTa && <p className="mt-0.5 font-tamil text-xs text-ink/55 dark:text-night-text/55" lang="ta">{scene.locationTa}</p>}
        <p className="mt-1 font-body text-xs uppercase tracking-[0.18em] text-ink/40 dark:text-night-text/40">
          {ta ? `${scenes.length} பகுதிகளில்` : `of ${scenes.length}`}
          {!scene.numberingIsPrinted && <><span className="mx-2 text-ink/25 dark:text-night-text/25">·</span>{ta ? "மூல எண்ணிடல் அல்ல" : "not source-numbered"}</>}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3" data-print="hide">
          <div className="inline-flex overflow-hidden rounded-full border border-marina/40 text-xs font-medium">
            <button onClick={() => setShowEn(false)} className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={!showEn} lang="ta">தமிழ்</button>
            <button onClick={() => setShowEn(true)} className={cn("focus-ring px-3 py-1 transition", showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={showEn}>English</button>
          </div>
        </div>

        <div className={cn("mt-8 break-words", showEn ? "font-body text-base" : "font-tamil text-lg")} lang={showEn ? "en" : "ta"}>
          {showEn ? renderEnglish(scene.units) : <p className="whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">{scene.tamilText}</p>}
        </div>

        <nav aria-label={ta ? "பகுதி வழிசெலுத்தல்" : "Section navigation"} className="mt-12 flex items-center justify-between gap-4 border-t border-ink/10 pt-6 text-sm dark:border-white/10" data-print="hide">
          {i > 0 ? <Link href={`/cinema/${work.slug}/${scenes[i - 1].sectionSlug}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang={ta ? "ta" : "en"}>← {label(scenes[i - 1])}</Link> : <span />}
          {i < scenes.length - 1 ? <Link href={`/cinema/${work.slug}/${scenes[i + 1].sectionSlug}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang={ta ? "ta" : "en"}>{label(scenes[i + 1])} →</Link> : <span />}
        </nav>
        <div className="mt-8 text-xs leading-relaxed text-ink/45 dark:text-night-text/45">
          <Link href={`/cinema/${work.slug}/source`} className="underline decoration-ink/20 underline-offset-2 hover:text-marina dark:decoration-white/20 dark:hover:text-marina-light" lang={lang}>
            {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
          </Link>
        </div>
      </article>
    </main>
  );
}

/** English units in source order, styled by kind. Speaker label is the exact printed Tamil, never expanded. */
function renderEnglish(units: Wave7CinemaUnit[]): ReactNode[] {
  return units.map((u) => {
    if (u.kind === "stage-direction" || u.kind === "narrative") {
      return <p key={u.id} className="mb-5 whitespace-pre-line italic leading-loose text-ink/60 dark:text-night-text/60">{u.englishText}</p>;
    }
    if (u.kind === "structural-separator") {
      return <p key={u.id} className="mb-5 text-center text-ink/40 dark:text-night-text/40">{u.englishText || "* * *"}</p>;
    }
    if (u.kind === "song" || u.kind === "performance-cue" || u.kind === "chant") {
      return (
        <p key={u.id} className="mb-5 whitespace-pre-line rounded-md border-l-2 border-marina/30 pl-3 leading-loose text-ink/70 dark:text-night-text/70">
          {u.speakerLabelTa && <span className="mr-2 font-tamil text-sm text-ink/55 dark:text-night-text/55" lang="ta">{u.speakerLabelTa}</span>}
          {u.englishText}
        </p>
      );
    }
    // dialogue / written-text and any other spoken unit
    return (
      <p key={u.id} className="mb-5 whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">
        {u.speakerLabelTa && <span className="mr-2 font-tamil font-medium text-marina dark:text-marina-light" lang="ta">{u.speakerLabelTa}:</span>}
        {u.englishText}
      </p>
    );
  });
}
