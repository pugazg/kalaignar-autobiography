"use client";

import { useState } from "react";
import Link from "next/link";
import type { FilmSongNotice, FilmSongSummary } from "@/data/thirai-isai-paadalgal";
import { AuthorshipNotice } from "@/components/ThiraiIsaiPaadalgalNotice";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One lyric from கலைஞர் திரை இசைப் பாடல்கள்.
 *
 * A PUBLICATION INTERFACE, AND A DELIBERATELY NARROW ONE. No song number, no year, no scan page, no
 * section page range, no music or singer credit, no archive path, no source commit or hash, no
 * verification label, no `anthology-attributed`, no line id — not in the text, not in a tooltip, and
 * not in an aria-label either, because a name a screen reader speaks is still something the page
 * says. Unlike the three cinema works before it, this one has no public source page for that
 * material to live on: the decision here was film → lyrics, and the apparatus stays internal.
 *
 * ONE LANGUAGE AT A TIME. Tamil is the default and English replaces it, the way every other
 * bilingual Reading Room here works. The song is passed in from the server, so the Tamil is in the
 * initial HTML — present for a crawler, for a reader with JavaScript off, and for Print → Save as
 * PDF — and printing yields the language on screen, never both.
 *
 * ── NO BYLINE, AND NO NEGATIVE EITHER ────────────────────────────────────────
 * Nothing here says who wrote this song. Not for the six unresolved lyrics, obviously — but not for
 * the 48 established ones either. The reader came for the words. What the page DOES carry, when the
 * archive requires it, is the source-controlled uncertainty notice, in the same language as the
 * lyric body beside it. That notice records that the compiler could not confirm which
 * அம்மையப்பன் songs Kalaignar wrote. It never says a song is not his: that finding does not exist
 * in this work, and no wording here may imply it.
 *
 * ── THE READER IS GIVEN ONLY THE WORDS ───────────────────────────────────────
 * This is a client component, so everything handed to it is serialised into the page. It is
 * therefore given a minimal lyric view rather than the archival song record: the upstream
 * translation-record line ids are projected out on the server and never reach the page at all. They
 * are correct, stable and useful upstream — they are simply not reading matter, and a page that
 * shipped 1,105 of them would be publishing an internal index in its own payload. React keys come
 * from position within the section instead, which is what position is for.
 *
 * ── LINEATION IS THE TEXT ────────────────────────────────────────────────────
 * These are song lyrics. Every stored line is rendered as its own line and never reflowed into a
 * paragraph, never joined with punctuation we supply, and never trimmed. Section labels are printed
 * exactly as stored and are absent where the source labels nothing — an unlabelled section is still
 * rendered, because dropping it would delete lyric.
 */
/** One line of a lyric, as the reader needs it: the two texts and nothing else. */
export type LyricLineView = { tamil: string; english: string };

/** One labelled block of a lyric. Either label may be null where the source labels nothing. */
export type LyricSectionView = {
  sourceLabelTa: string | null;
  labelEn: string | null;
  lines: LyricLineView[];
};

/** Exactly what a lyric page displays. Deliberately narrower than the stored record. */
export type LyricView = {
  titleTa: string;
  filmTitleTa: string;
  sections: LyricSectionView[];
};

export default function ThiraiIsaiPaadalgalReader({
  song, film, notice, prev, next,
}: {
  song: LyricView;
  film: { slug: string; titleTa: string };
  notice: FilmSongNotice | null;
  prev: FilmSongSummary | null;
  next: FilmSongSummary | null;
}) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [showEn, setShowEn] = useState(false);

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label={ta ? "வழிசெலுத்தல்" : "Navigation"} className="mb-8 text-sm" data-print="hide">
        <Link
          href={`/cinema/thirai-isai-paadalgal#${film.slug}`}
          className="font-tamil text-marina hover:underline dark:text-marina-light"
          lang="ta"
        >
          {film.titleTa}
        </Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light">
          <span lang={lang}>{ta ? "மின்னூலகம்" : "The library"}</span>
        </Link>
      </nav>

      <article>
        {/* The film, then the song. That is the whole hierarchy this work has publicly. The film
            name stays Tamil in both interface languages: no English film title exists in the data
            and none is invented here. */}
        <p className="font-tamil text-xs uppercase tracking-[0.18em] text-marina dark:text-marina-light" lang="ta">
          {song.filmTitleTa}
        </p>
        <h1 className="mt-2 font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">
          {song.titleTa}
        </h1>

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

        {/* Which layer is being read. The English is project-created for this project — never a
            published, official or historical translation — and the Tamil remains authoritative. */}
        {showEn ? (
          <p className="mt-4 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70">
            {ta
              ? "இது இத்திட்டத்திற்காக உருவாக்கப்பட்ட ஆங்கில வாசிப்பு அடுக்கு. மூல தமிழே அதிகாரபூர்வமானது."
              : "A project-created English reading layer. The Tamil original remains authoritative."}
          </p>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/60 dark:border-white/15 dark:text-night-text/60">
            {ta
              ? "கீழே மூல தமிழ் பாடல் வரிகள் — மாற்றமின்றி."
              : "Below are the original Tamil lyrics, reproduced without alteration."}
          </p>
        )}

        {/* The notice follows the LYRIC's language, not the interface language, so it is always in
            the language of the words it sits beside. It prints with the page. */}
        {notice && <AuthorshipNotice notice={notice} en={showEn} />}

        <div
          className={cn("mt-10 break-words", showEn ? "font-body text-base" : "font-tamil text-lg")}
          lang={showEn ? "en" : "ta"}
        >
          {song.sections.map((section, si) => {
            const label = showEn ? section.labelEn : section.sourceLabelTa;
            return (
              <section key={si} className="mb-8 last:mb-0">
                {/* Rendered only where the source labels the block. Sections the source leaves
                    unlabelled are still rendered — they are lyric. */}
                {label && (
                  // No `uppercase` here, unlike the interface chrome elsewhere on the site. These
                  // labels are SOURCE TEXT — `முத்தாயி`, `(Saa — source refrain cue)` — and a CSS
                  // case transform would print a reading the source does not have.
                  <p
                    className={cn(
                      "mb-2 text-xs tracking-wide text-ink/40 dark:text-night-text/40",
                      showEn ? "font-body italic" : "font-tamil",
                    )}
                    lang={showEn ? "en" : "ta"}
                  >
                    {label}
                  </p>
                )}
                {/* One stored line, one displayed line. Never reflowed, never joined. */}
                {section.lines.map((line, li) => (
                  <p
                    key={li}
                    className="leading-[2.1] text-ink/90 dark:text-night-text/90"
                  >
                    {showEn ? line.english : line.tamil}
                  </p>
                ))}
              </section>
            );
          })}
        </div>

        {/* Neighbours come from THIS FILM's ordered song list. A film's last lyric does not lead
            into the next film's first: the film is the grouping the reader is inside, and stepping
            silently across that boundary would misrepresent where a song comes from. */}
        <nav
          aria-label={ta ? "பாடல் வழிசெலுத்தல்" : "Song navigation"}
          className="mt-12 flex items-center justify-between gap-4 border-t border-ink/10 pt-6 text-sm dark:border-white/10"
          data-print="hide"
        >
          {prev ? (
            <Link
              href={`/cinema/thirai-isai-paadalgal/${prev.slug}`}
              className="font-tamil text-marina hover:underline dark:text-marina-light"
              lang="ta"
            >
              ← {prev.titleTa}
            </Link>
          ) : <span />}
          {next ? (
            <Link
              href={`/cinema/thirai-isai-paadalgal/${next.slug}`}
              className="font-tamil text-marina hover:underline dark:text-marina-light"
              lang="ta"
            >
              {next.titleTa} →
            </Link>
          ) : <span />}
        </nav>

        <div className="mt-8 text-xs leading-relaxed text-ink/45 dark:text-night-text/45" data-print="hide">
          <Link
            href={`/cinema/thirai-isai-paadalgal#${film.slug}`}
            className="underline decoration-ink/20 underline-offset-2 hover:text-marina dark:decoration-white/20 dark:hover:text-marina-light"
            lang="ta"
          >
            {film.titleTa}
          </Link>
        </div>
      </article>
    </main>
  );
}
