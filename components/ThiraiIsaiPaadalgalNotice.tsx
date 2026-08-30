"use client";

import type { FilmSongNotice } from "@/data/thirai-isai-paadalgal";
import { useLang } from "@/lib/i18n";

/**
 * The source-controlled authorship-uncertainty notice.
 *
 * ── WHY THIS IS ITS OWN COMPONENT ────────────────────────────────────────────
 * The wording is not ours. It is imported verbatim from the archive's display contract, and the
 * landing and the lyric reader must show the SAME text — so it is rendered from one place rather
 * than typed out twice and allowed to drift. Nothing here paraphrases, shortens, or translates
 * afresh: `noticeTa` and `noticeEn` are printed exactly as stored.
 *
 * ── WHAT IT SAYS AND WHAT IT MUST NOT ────────────────────────────────────────
 * The 2024 compilation prints all of அம்மையப்பன்'s songs and states that the compiler could not
 * confirm which of them Kalaignar wrote; song 012 is separately established and 013–018 are not.
 * That is uncertainty, in one direction only. The notice never says these songs are not
 * Kalaignar's — there is no negative-authorship state in this work — and it is never rendered as a
 * warning, an error, or a disclaimer badge. It is ordinary reading matter, available to assistive
 * technology as plain text, and it prints with the page.
 */
export function AuthorshipNotice({ notice, en }: { notice: FilmSongNotice; en: boolean }) {
  return (
    <aside
      className="mt-6 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-3 text-xs leading-relaxed text-ink/70 dark:border-white/15 dark:text-night-text/70"
      lang={en ? "en" : "ta"}
    >
      <p className={en ? "font-body" : "font-tamil"}>{en ? notice.noticeEn : notice.noticeTa}</p>
    </aside>
  );
}

/**
 * The landing's copy, which follows the site-wide interface language rather than a per-page lyric
 * toggle. The reader page uses `AuthorshipNotice` directly, because there the notice must follow
 * the language of the lyric body the reader is actually looking at.
 */
export default function LangAwareAuthorshipNotice({ notice }: { notice: FilmSongNotice }) {
  const { lang } = useLang();
  return <AuthorshipNotice notice={notice} en={lang === "en"} />;
}
