"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { RajaRaniReader, RajaRaniScene, RajaRaniSong, RajaRaniEnglishUnit } from "@/data/raja-rani";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One reading surface of ராஜா ராணி — one archival screenplay segment, or one numbered song.
 *
 * A PUBLICATION INTERFACE: no PDF page, scan hash, source commit, record id or QA label appears here;
 * all of it lives at /cinema/raja-rani/source.
 *
 * THE NUMBERING TRUTH, ENFORCED IN WORDING:
 *   * a SCENE shows "களஞ்சியப் பகுதி N / 58" / "Archive segment N of 58" — the booklet prints no scene
 *     numbers, so nothing here says "Scene N as printed" or "Source Scene N";
 *   * a SONG shows "பாட்டு N" / "Song N" — those numbers ARE the booklet's own.
 *
 * AUTHORSHIP: five songs are later-anthology attributed, six are unresolved. Neither tier is flattened
 * to "Lyrics by Kalaignar". The deleted T055 duplicate records and the PDF-74 ownership stamp are not
 * in the frozen data and so can never render here.
 *
 * Tamil scene text is one stored block rendered verbatim (whitespace-pre-line); English is the unit
 * stream, each unit's exact printed Tamil speaker label set beside it, never expanded to English.
 */
export default function RajaRaniReaderView({ reader, slug }: { reader: RajaRaniReader; slug: string }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [showEn, setShowEn] = useState(false);

  const isSong = slug.startsWith("song-");
  const sceneSlug = (o: number) => `scene-${String(o).padStart(3, "0")}`;
  const songSlug = (n: number) => `song-${String(n).padStart(2, "0")}`;

  if (isSong) {
    const n = Number(slug.replace("song-", ""));
    const songs = reader.numberedSongs;
    const i = songs.findIndex((s) => s.numberedSongNumber === n);
    const song = songs[i];
    if (!song) return null;
    return (
      <Shell titleTa={reader.work.titleTa} ta={ta} lang={lang}
        prev={i > 0 ? { href: songSlug(songs[i - 1].numberedSongNumber), label: songs[i - 1].tamilTitle } : null}
        next={i < songs.length - 1 ? { href: songSlug(songs[i + 1].numberedSongNumber), label: songs[i + 1].tamilTitle } : null}>
        <h1 className="font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">{song.tamilTitle}</h1>
        <p className="mt-1 font-body text-xs uppercase tracking-[0.18em] text-ink/40 dark:text-night-text/40">
          {ta ? `பாட்டு ${song.numberedSongNumber}` : `Song ${song.numberedSongNumber}`}
          <span className="mx-2 text-ink/25 dark:text-night-text/25">·</span>
          {ta ? `${songs.length}-இல்` : `of ${songs.length}`}
        </p>
        <LangToggle showEn={showEn} setShowEn={setShowEn} />
        <AuthorshipNote song={song} ta={ta} />
        <div className={cn("mt-8 break-words", showEn ? "font-body text-base" : "font-tamil text-lg")} lang={showEn ? "en" : "ta"}>
          {song.sections.map((sec) => (
            <section key={sec.ordinal} className="mb-6">
              {sec.sourceLabel && <p className="mb-1.5 font-tamil text-sm font-semibold text-ink dark:text-night-text" lang="ta">{sec.sourceLabel}</p>}
              <p className="whitespace-pre-line pl-4 leading-[2] text-ink/85 dark:text-night-text/85">
                {sec.linePairs.map((lp) => (showEn ? lp.english : lp.tamil)).join("\n")}
              </p>
            </section>
          ))}
        </div>
      </Shell>
    );
  }

  const ord = Number(slug.replace("scene-", ""));
  const scenes = reader.screenplayScenes;
  const i = scenes.findIndex((s) => s.archivalSceneOrdinal === ord);
  const scene = scenes[i];
  if (!scene) return null;
  return (
    <Shell titleTa={reader.work.titleTa} ta={ta} lang={lang}
      prev={i > 0 ? { href: sceneSlug(scenes[i - 1].archivalSceneOrdinal), label: ta ? `களஞ்சியப் பகுதி ${scenes[i - 1].archivalSceneOrdinal}` : `Segment ${scenes[i - 1].archivalSceneOrdinal}` } : null}
      next={i < scenes.length - 1 ? { href: sceneSlug(scenes[i + 1].archivalSceneOrdinal), label: ta ? `களஞ்சியப் பகுதி ${scenes[i + 1].archivalSceneOrdinal}` : `Segment ${scenes[i + 1].archivalSceneOrdinal}` } : null}>
      {/* Archive segment — NOT a source-printed scene number. */}
      <h1 className="font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text" lang={ta ? "ta" : "en"}>
        {ta ? `களஞ்சியப் பகுதி ${scene.archivalSceneOrdinal}` : `Archive segment ${scene.archivalSceneOrdinal}`}
      </h1>
      <p className="mt-1 font-body text-xs uppercase tracking-[0.18em] text-ink/40 dark:text-night-text/40">
        {ta ? `${scenes.length} பகுதிகளில்` : `of ${scenes.length} archive segments`}
        <span className="mx-2 text-ink/25 dark:text-night-text/25">·</span>
        {ta ? "மூல எண்ணிடல் அல்ல" : "not source-numbered"}
      </p>
      <LangToggle showEn={showEn} setShowEn={setShowEn} />
      <div className={cn("mt-8 break-words", showEn ? "font-body text-base" : "font-tamil text-lg")} lang={showEn ? "en" : "ta"}>
        {showEn ? renderEnglish(scene.englishUnits) : (
          <p className="whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">{scene.tamilText}</p>
        )}
      </div>
    </Shell>
  );
}

function Shell({ titleTa, ta, lang, prev, next, children }: {
  titleTa: string; ta: boolean; lang: string;
  prev: { href: string; label: string } | null; next: { href: string; label: string } | null; children: ReactNode;
}) {
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label={ta ? "வழிசெலுத்தல்" : "Navigation"} className="mb-8 text-sm" data-print="hide">
        <Link href="/cinema/raja-rani" className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">{titleTa}</Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light"><span lang={lang}>{ta ? "மின்னூலகம்" : "The library"}</span></Link>
      </nav>
      <article>
        {children}
        <nav aria-label={ta ? "பகுதி வழிசெலுத்தல்" : "Section navigation"} className="mt-12 flex items-center justify-between gap-4 border-t border-ink/10 pt-6 text-sm dark:border-white/10" data-print="hide">
          {prev ? <Link href={`/cinema/raja-rani/${prev.href}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang={ta ? "ta" : "en"}>← {prev.label}</Link> : <span />}
          {next ? <Link href={`/cinema/raja-rani/${next.href}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang={ta ? "ta" : "en"}>{next.label} →</Link> : <span />}
        </nav>
        <div className="mt-8 text-xs leading-relaxed text-ink/45 dark:text-night-text/45">
          <Link href="/cinema/raja-rani/source" className="underline decoration-ink/20 underline-offset-2 hover:text-marina dark:decoration-white/20 dark:hover:text-marina-light" lang={lang}>
            {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
          </Link>
        </div>
      </article>
    </main>
  );
}

function LangToggle({ showEn, setShowEn }: { showEn: boolean; setShowEn: (b: boolean) => void }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3" data-print="hide">
      <div className="inline-flex overflow-hidden rounded-full border border-marina/40 text-xs font-medium">
        <button onClick={() => setShowEn(false)} className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={!showEn} lang="ta">தமிழ்</button>
        <button onClick={() => setShowEn(true)} className={cn("focus-ring px-3 py-1 transition", showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={showEn}>English</button>
      </div>
    </div>
  );
}

function AuthorshipNote({ song, ta }: { song: RajaRaniSong; ta: boolean }) {
  const attributed = song.authorshipStatus === "anthology-attributed";
  return (
    <p className="mt-4 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/60 dark:border-white/15 dark:text-night-text/60" lang={ta ? "ta" : "en"}>
      {attributed
        ? (ta
          ? "பிற்கால தொகுப்புச் சான்றின்படி இப்பாடல் கலைஞருக்கு ஏற்றப்பட்டுள்ளது. இது மூல நூலின் தனி நிலைப் பாடலாசிரியப் பொறுப்பன்று."
          : "Attributed to Kalaignar on later-anthology evidence. This is not an original-booklet item-level lyric credit.")
        : (ta
          ? "கிடைக்கும் மூலச் சான்றின்படி இப்பாடலுக்குத் தனி நிலைப் பாடலாசிரியர் நிறுவப்படவில்லை."
          : "Item-level lyricist is not established by the available source evidence.")}
    </p>
  );
}

// English screenplay units in source order, each kind styled; the exact printed Tamil speaker label is
// set beside dialogue, never expanded to an English name.
function renderEnglish(units: RajaRaniEnglishUnit[]): ReactNode[] {
  return units.map((u) => {
    if (u.kind === "stage-direction") {
      return <p key={u.id} className="mb-5 whitespace-pre-line leading-loose text-ink/60 dark:text-night-text/60">{u.englishText}</p>;
    }
    if (u.kind === "performance-cue") {
      return <p key={u.id} className="mb-6 whitespace-pre-line pl-4 leading-[2] text-ink/85 dark:text-night-text/85">{u.englishText}</p>;
    }
    if (u.kind === "written-text") {
      return <p key={u.id} className="mb-5 whitespace-pre-line border-l-2 border-ink/15 pl-4 leading-loose text-ink/75 dark:border-white/15 dark:text-night-text/75">{u.englishText}</p>;
    }
    return (
      <p key={u.id} className="mb-5 whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">
        {u.speakerLabel && <span className="mr-2 font-tamil font-semibold text-ink dark:text-night-text" lang="ta">{u.speakerLabel}</span>}
        {u.englishText}
      </p>
    );
  });
}
