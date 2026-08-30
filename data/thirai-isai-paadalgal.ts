// Cinema Writing — கலைஞர் திரை இசைப் பாடல்கள் / Kalaignar Film Songs (Digital Library Phase E1).
// Types for the generated reading data under public/data/cinema/thirai-isai-paadalgal/, produced by
// scripts/import-thirai-isai-paadalgal.mjs from a pinned commit of pugazg/kalaignar-cinema-works.
// Runtime never calls GitHub.
//
// ── A WORK-SPECIFIC MODEL, NOT A CINEMA FRAMEWORK ────────────────────────────
// This is the fourth work on the திரை எழுத்து shelf and the first that is not a single booklet.
// Manohara, Parasakthi and Tirumbippaar each have a scene or segment spine inside one printed work.
// This one is an anthology: 54 numbered lyrics drawn from 23 films, so its spine is film → song.
// Nothing here derives from the other three, and their scene machinery has no counterpart.
//
// ── THE ONE DISTINCTION THIS MODEL EXISTS TO PROTECT ─────────────────────────
// AUTHORSHIP CERTAINTY AND DISPLAY ELIGIBILITY ARE DIFFERENT FACTS, AND THEY LIVE IN DIFFERENT
// FIELDS. An earlier draft of the upstream contract collapsed them into one boolean, which forced a
// false choice: either suppress six source lyrics, or assert six authorship claims the archive
// refuses to make. The merged contract separates them, and this model must keep them separate.
//
//   * `publicDisplay` is true for all 54. They are the controlling source's own numbered corpus,
//     and the Reading Room's purpose is to present that corpus.
//   * `publicAuthorshipClaim` is true for 48. Only those songs may be presented as written by
//     Kalaignar.
//   * The six அம்மையப்பன் lyrics 013–018 are `unresolved`: displayable, not claimed, and carrying
//     `authorshipNoticeRequired`. The 2024 compiler printed all of that film's songs and stated he
//     could not confirm which were Kalaignar's; song 012 is separately established from the 1989
//     witness, and 013–018 are not.
//
// ── WHAT THE READER MUST NOT DO WITH THIS DATA ───────────────────────────────
//   * Never infer authorship from display. A song being present is not a claim about who wrote it.
//     Any surface that renders a song with `authorshipNoticeRequired` must render its notice too.
//   * Never describe an `unresolved` song as "not Kalaignar's". Unresolved means the source does not
//     say, in either direction. There is no negative-authorship state in this model and none may be
//     added.
//   * Never write a byline for a song whose `publicAuthorshipClaim` is false.
//   * Never rewrite `tamil` or `english`. Both are released archive text. The Tamil is
//     scan-adjudicated upstream; the English is project-created upstream. Line splitting, ellipses,
//     punctuation and spacing are all source facts, including title forms such as
//     `வருவாய் வருவாய்...` and `காதல் துறையே புதுமைக் கனவே (சோகம்)`.
//   * Never merge `titleTa` with `contentsTitleTa`. The anthology's contents table and its lyric
//     pages sometimes print different forms of the same song's title; both are preserved.
//   * Never surface the compilation's apparatus. Compiler, publisher, ISBN, edition, printed-page
//     counts, music and voice credits, scan page numbers and archive file paths are NOT in this
//     model and are not served. They live in data/internal/thirai-isai-paadalgal/provenance.json,
//     OUTSIDE Next.js `public/`, because everything under `public/` is a fetchable static asset and
//     a comment saying "build-time only" is not a boundary. Nothing archival was lost in moving it:
//     the validator still proves page linkage, credits and verification census from there.
//   * Never treat `anthology-attributed` as an authorship finding. It is the archive's record of how
//     the 2024 compilation presents an item, it stays unchanged for all 54, and it is deliberately
//     absent from this runtime model.

/** How the source settled a song's authorship. There is no negative state, by design. */
export type FilmSongAuthorshipDecision = "established-kalaignar" | "unresolved";

/** A song's authorship and display posture. Display never implies authorship. */
export interface FilmSongAuthorship {
  /** `established-kalaignar` for 48 songs; `unresolved` for the six அம்மையப்பன் lyrics 013–018. */
  decision: FilmSongAuthorshipDecision;
  /** True for all 54. Being displayable is not evidence of authorship. */
  publicDisplay: boolean;
  /** True only where `decision` is `established-kalaignar`. Gates any Kalaignar byline. */
  publicAuthorshipClaim: boolean;
  /** True only for the unresolved group. If true, the notice MUST be shown with the song. */
  authorshipNoticeRequired: boolean;
  /** Which notice group applies, or null when none does. */
  noticeGroupId: string | null;
}

/** One paired Tamil/English reading line, in source order. */
export interface FilmSongLine {
  /** Stable upstream line id, e.g. `kalaignar-song-en-001-s01-l001`. */
  id: string;
  tamil: string;
  english: string;
}

/** A labelled block of a lyric, as the source itself divides it. */
export interface FilmSongSection {
  ordinal: number;
  /** The label the source prints, e.g. `தொகையறா`, `பாட்டு`. */
  sourceLabelTa: string;
  /** The archive's English rendering of that label. */
  labelEn: string;
  lines: FilmSongLine[];
}

/** One complete lyric — the unit a reader page would render. */
export interface FilmSongRecord {
  workId: string;
  songId: string;
  slug: string;
  /** 1–54, the anthology's own numbering. */
  songNumber: number;
  filmId: string;
  filmSlug: string;
  filmTitleTa: string;
  yearPrinted: number;
  titleTa: string;
  titleEn: string;
  authorship: FilmSongAuthorship;
  sections: FilmSongSection[];
  // No source-page mapping and no contents-table title variant. Both describe the printed
  // compilation rather than the film or its lyric, and this reader shows films and lyrics, not
  // pages. Both remain in the internal provenance and are still validated against the pinned source.
}

/** A film grouping. The anthology orders films by first appearance, not by year. */
export interface FilmSongFilm {
  filmId: string;
  slug: string;
  ordinal: number;
  titleTa: string;
  /** null throughout: the released payload carries no English film titles, and none is invented. */
  titleEn: string | null;
  yearPrinted: number;
  songCount: number;
  songSlugs: string[];
}

/** A song's entry in the work index — enough to list and route, without its lyric body. */
export interface FilmSongSummary {
  songId: string;
  slug: string;
  songNumber: number;
  filmId: string;
  filmSlug: string;
  titleTa: string;
  titleEn: string;
  authorshipDecision: FilmSongAuthorshipDecision;
  publicDisplay: boolean;
  publicAuthorshipClaim: boolean;
  authorshipNoticeRequired: boolean;
  noticeGroupId: string | null;
  sectionCount: number;
  lineCount: number;
}

/**
 * A source-controlled authorship-uncertainty notice.
 *
 * The Tamil and English wording is imported verbatim from the source contract and must never be
 * paraphrased, shortened or translated afresh on the website.
 */
export interface FilmSongNotice {
  groupId: string;
  filmTa: string;
  status: string;
  songIds: string[];
  songSlugs: string[];
  noticeTa: string;
  noticeEn: string;
}

/** The generated work index at public/data/cinema/thirai-isai-paadalgal/index.json. */
export interface FilmSongIndex {
  workId: string;
  siteSlug: string;
  titleTa: string;
  /** Editorial English presentation title; `titleEnIsEditorial` records that it is not a source title. */
  titleEn: string;
  titleEnIsEditorial: boolean;
  shelf: "cinema-writing";
  /** film → song, not scene. */
  readerStructure: "film-song";
  navigation: {
    primary: "film";
    secondary: "song";
    /** Machine values. The archive's own prose naming the printed compilation stays internal. */
    filmOrder: "source-order";
    songOrder: "song-number";
  };
  languageDefault: string;
  languagesAvailable: string[];
  counts: {
    films: number;
    songs: number;
    lineCues: number;
    /**
     * How many lyrics the printed source runs across a page break. An aggregate, kept because it is
     * part of the reviewed census; it exposes no page numbers, and no per-song page state is public.
     */
    crossPageSongs: number;
  };
  authorship: {
    established: number;
    unresolved: number;
    displayable: number;
    publicAuthorshipClaimAllowed: number;
    authorshipNoticeRequired: number;
    /** The source's own statement that display does not resolve authorship. */
    contractNote: string;
  };
  films: FilmSongFilm[];
  songs: FilmSongSummary[];
  notices: FilmSongNotice[];
}
