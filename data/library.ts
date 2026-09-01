// Kalaignar Digital Library — normalized catalog (Digital Library Phase 1).
//
// Principle: ONE coherent library, MULTIPLE source-faithful reader types. A memoir,
// a letter, a poem, a play and a speech each keep their own reader structure — this
// catalog is a shared envelope, not a single forced content schema.
//
// Public rendering is driven ONLY by entries whose `state` is "published" (see
// `publishedWorks` / `visibleShelves`). It is NEVER driven by folder existence in
// `public/data`. There is deliberately no filesystem auto-discovery here, so an
// accidental data directory (such as the non-authoritative
// `public/data/cinema/manohara/parts/` scratch files that Phase 2 removed) can
// never surface as a public work.
//
// Provenance note: source-repository / source-path / release-commit are DIFFERENT
// concepts from this implementation repository. They are optional and are left unset
// for works whose external source provenance is not established in the implementation
// data. Do not fabricate provenance merely to fill the type.

import { chapterIndex } from "./references";

// ── Shelves ──────────────────────────────────────────────────────────────────
// Fixed public shelf taxonomy from the cross-project master handover. All nine
// exist in the model now; empty shelves are simply not rendered.
export type ShelfId =
  | "life-writing"
  | "letters"
  | "fiction"
  | "poetry"
  | "drama"
  | "cinema-writing"
  | "speeches"
  | "essays-articles"
  | "literary-commentary";

export interface Shelf {
  id: ShelfId;
  order: number;
  ta: string;
  en: string;
}

export const SHELVES: Shelf[] = [
  { id: "life-writing", order: 1, ta: "வாழ்க்கை எழுத்து", en: "Life Writing" },
  { id: "letters", order: 2, ta: "கடிதங்கள்", en: "Letters" },
  { id: "fiction", order: 3, ta: "புனைகதை", en: "Fiction" },
  { id: "poetry", order: 4, ta: "கவிதைகள்", en: "Poetry" },
  { id: "drama", order: 5, ta: "நாடகங்கள்", en: "Drama" },
  { id: "cinema-writing", order: 6, ta: "திரை எழுத்து", en: "Cinema Writing" },
  { id: "speeches", order: 7, ta: "உரைகள்", en: "Speeches" },
  { id: "essays-articles", order: 8, ta: "கட்டுரைகள்", en: "Essays & Articles" },
  { id: "literary-commentary", order: 9, ta: "இலக்கிய உரை", en: "Literary Commentary" },
];

// ── Work model ───────────────────────────────────────────────────────────────
export type ReaderStructure =
  | "volume-chapter"
  | "letter"
  | "commentary-unit"
  // Future reader types (no published works yet; kept for the shared envelope):
  | "scene"
  | "poem"
  | "story"
  | "article"
  | "speech"
  // Fiction — a continuous novel divided by the SOURCE ARCHIVE's own assembled reading layer into
  // ordered sections. Distinct from "story" (short stories) and from "volume-chapter" (the memoir).
  | "novel"
  // Drama — a printed STAGE PLAY: numbered scenes of dialogue, speaker labels and stage directions,
  // plus any separately printed unnumbered tableau. Deliberately distinct from "scene", which is the
  // cinema screenplay-dialogue model used by Manohara.
  | "stage-play"
  // Classical commentary — a fixed four-level hierarchy (பால் → இயல் → அதிகாரம் → குறள்) in which
  // each unit pairs a poet's couplet with a separate commentator's prose on it. Deliberately
  // distinct from "commentary-unit", whose units are free-standing prose without that hierarchy and
  // without a second authorial voice to keep apart.
  | "kural-commentary"
  // Cinema songs — a collection of lyrics grouped by the FILM each belongs to, with a page per
  // lyric. The spine is film → song, not a single printed work read straight through, which is why
  // it is not "scene": the three cinema works before it are each one booklet.
  | "film-song";

// Language COVERAGE for the *intended catalog work / collection boundary* — NOT
// merely "every unit currently vendored happens to have this language". A work whose
// full collection is only partly integrated is "partial" even if every integrated
// unit carries the language.
export type Availability = "complete" | "partial" | "none";

// KIND / provenance of the English text, where established. This is a SEPARATE
// concept from coverage (see `english`). Optional: leave unset when the
// implementation repository does not establish it — do not guess an origin.
export type EnglishKind =
  | "project-created" // English translation created for/by this project
  | "separately-published" // a separately published English translation
  | "published-source-witness"; // a published English source / secondary witness

// Internal control state. Only "published" is ever surfaced publicly.
export type PublicationState = "published" | "ready-to-integrate" | "archival-in-progress";

// ── Present rights status of the UNDERLYING authored work ─────────────────────
// A reusable, evidence-based rights model for the catalog. This describes the
// PRESENT project-level rights status of the work authored by Kalaignar — a
// DIFFERENT fact from any historical rights notice printed in an old edition (that
// notice is preserved separately as a source witness on the work's provenance page).
//
// Background (Tamil: நாட்டுடைமையாக்கப்பட்டது): following the Government of Tamil Nadu's
// 2024-08-22 announcement, Kalaignar M. Karunanidhi's works were nationalised without royalty.
// The Government Order was publicly handed over to Rajathi Ammal on 2024-12-22. The GO's exact
// number and formal ISSUE date have NOT yet been verified from the order itself and are left
// unset — the handover date is NOT assumed to be the issue date. This is a project-wide fact
// applicable to works authored by Kalaignar (subject to confirming each item is in fact his work
// and falls within the order). It does NOT extend to third-party contributions (other authors'
// prefaces/essays, separately published translations, secondary witness editions,
// photographs/illustrations/cover/publisher material), nor to project-created translations,
// which retain their own distinct provenance.
export type RightsStatus =
  // Kalaignar-authored underlying work, nationalised by the Government of Tamil Nadu.
  | "nationalised-by-tamil-nadu-government"
  // Not yet brought onto this model (existing entries pending the rights audit — see
  // PHASE2_MANOHARA_HANDOVER.md). Absence of `rights` means the same thing.
  | "unclassified";

export interface WorkRights {
  /** Present rights status of the underlying authored work. */
  rightsStatus: RightsStatus;
  /** Authority that established the status, e.g. "Government of Tamil Nadu". */
  rightsAuthority?: string;
  /** The action taken, e.g. "nationalisation". */
  rightsAction?: string;
  /** ISO date the action was announced, where verified (e.g. "2024-08-22"). */
  rightsAnnouncementDate?: string;
  /** Government Order number — ONLY once verified from the GO itself. Never invented. */
  governmentOrderNumber?: string | null;
  /** Government Order formal ISSUE date — null until verified from the order itself (never inferred). */
  governmentOrderDate?: string | null;
  /**
   * Date the Government Order was publicly HANDED OVER to Rajathi Ammal (2024-12-22).
   * This is NOT asserted as the GO issue date.
   */
  governmentOrderHandoverDate?: string;
  /** Short note distinguishing this present status from historical printed edition notices. */
  note?: string;
}

export interface LibraryWork {
  /** Stable catalog id (kebab-case). */
  id: string;
  /** Stable slug (may match a route segment). */
  slug: string;
  titleTa: string;
  titleEn: string;
  shelf: ShelfId;
  /** Literary/publishing form: memoir | letters | commentary | novel | poem | ... */
  subtype: string;
  readerStructure: ReaderStructure;
  /** Public reader/collection entry point. */
  href: string;
  /** Internal publication state — public UI shows "published" only. */
  state: PublicationState;

  /** Short bilingual descriptor for the catalog card. */
  descTa?: string;
  descEn?: string;

  // ── Source/archive provenance (OPTIONAL — different from this repo; never faked) ──
  /** Authoritative source/archive repository, e.g. "pugazg/kalaignar-cinema-works". */
  sourceRepo?: string;
  /** Path of the source work within its source repository. */
  sourcePath?: string;
  /** Exact source release/commit or integrity identifier used for the import. */
  sourceCommit?: string;
  /** Publication/edition metadata, where actually established. */
  edition?: string;

  // ── Language coverage vs English provenance (kept semantically separate) ──
  /** Tamil coverage for the intended work/collection boundary. */
  tamil?: Availability;
  /** English coverage for the intended work/collection boundary. */
  english?: Availability;
  /** KIND/provenance of the English text, where established (unset = not established). */
  englishKind?: EnglishKind;

  /** Source-supported unit count, where stable. */
  unitCount?: { value: number; labelTa: string; labelEn: string };

  /**
   * Present rights status of the underlying authored work (reusable model). Unset for
   * works not yet brought onto the nationalisation-rights model — see the rights-audit
   * follow-up in PHASE2_MANOHARA_HANDOVER.md. This is DISTINCT from any historical printed
   * rights notice, which lives with the work's source provenance, not here.
   */
  rights?: WorkRights;

  /** Provenance / source-note page, where one exists. */
  provenanceHref?: string;
}

// ── The catalog ──────────────────────────────────────────────────────────────
// Fiction onboards ONE novel — பலிபீடம் நோக்கி — opening the புனைகதை shelf with its own `novel`
// reader structure. It changes no existing entry.
//
// Phase 5 (Essays & Articles) onboards ONE publication — சக்கரவர்த்தியின் திருமகன், 14
// source-numbered articles inside a single catalog work — opening the கட்டுரைகள் shelf with its own
// `article` reader structure. It changes no existing entry.
//
// Phase 4 (Poetry) onboards ONE poem — இதயத்தைத் தந்திடு அண்ணா — onto the same
// envelope with its own `poem` reader structure, opening the கவிதைகள் shelf. It
// changes no existing entry.
//
// Phase 1 exposed exactly the three already-public collections. Digital Library
// Phase 2 onboards ONE additional work — the Manohara screenplay/dialogue booklet
// — onto the same shared envelope (its own `scene` reader; source-faithful Tamil +
// a project-created English derivative). No generalized ingestion framework is
// introduced: this is a single, work-specific catalog entry, exactly like the
// others. The public UI is still driven ONLY by `state: "published"` (never by
// folder existence), so the accidental (now-removed) `public/data/cinema/
// manohara/parts/` directory — non-authoritative implementation scratch data,
// never a source — could never have surfaced as a work regardless.
export const LIBRARY_WORKS: LibraryWork[] = [
  {
    id: "nenjukku-neethi",
    slug: "nenjukku-neethi",
    titleTa: "நெஞ்சுக்கு நீதி",
    titleEn: "Nenjukku Neethi",
    shelf: "life-writing",
    subtype: "memoir",
    readerStructure: "volume-chapter",
    href: "/read/nenjukku-neethi",
    state: "published",
    descTa: "கலைஞரின் ஆறு தொகுதி நினைவுக் குறிப்புகள்",
    descEn: "Kalaignar's six-volume memoir",
    tamil: "complete",
    unitCount: { value: chapterIndex.length, labelTa: "அத்தியாயங்கள்", labelEn: "chapters" },
    // Source repository / release commit for this OCR'd memoir is not recorded in the
    // implementation data → intentionally unset (provenance is not fabricated).
  },
  {
    id: "murasoli-letters",
    slug: "murasoli",
    titleTa: "முரசொலி கடிதங்கள்",
    titleEn: "Murasoli — The Letters",
    shelf: "letters",
    subtype: "letters",
    readerStructure: "letter",
    href: "/murasoli",
    state: "published",
    descTa: "உடன்பிறப்புகளுக்கு எழுதிய கடிதங்கள்",
    descEn: "Letters to udanpirappukkal",
    // Only volumes 48–54 of the intended full "Murasoli — The Letters" collection
    // are integrated → "partial" at the work/collection boundary (even though every
    // integrated volume carries Tamil). This is a collection-boundary status, not a
    // per-unit one.
    tamil: "partial",
    // English exists for most integrated volumes but not all (e.g. vol 54 is
    // Tamil-only), and the collection itself is partial → "partial".
    english: "partial",
    // englishKind intentionally UNSET — the provenance/kind of the Murasoli English
    // layer is not established in the implementation data (not guessed).
    // Letter count grows as volumes are added → shown live on the collection surface.
  },
  {
    id: "tholkappiya-poonga",
    slug: "tholkappiyam",
    titleTa: "தொல்காப்பியப் பூங்கா",
    titleEn: "Tholkappiya Poonga",
    shelf: "literary-commentary",
    subtype: "commentary",
    readerStructure: "commentary-unit",
    href: "/tholkappiyam",
    state: "published",
    descTa: "கலைஞரின் தொல்காப்பிய உரை",
    descEn: "Kalaignar's Tolkāppiyam commentary",
    tamil: "complete",
    // English (En/Ta toggle) covers the onboarded work.
    english: "complete",
    // englishKind intentionally UNSET — whether this English is a separately
    // published translation or project-created is not established in the
    // implementation data (not guessed).
  },
  {
    // LITERARY COMMENTARY — Phase 8D-1. The second work on the இலக்கிய உரை shelf, and the first
    // with a `kural-commentary` reader: a fixed four-level hierarchy (பால் → இயல் → அதிகாரம் →
    // குறள்) in which each unit pairs Thiruvalluvar's couplet with Kalaignar's separate prose on
    // it. Deliberately not `commentary-unit`, whose units are free-standing prose without that
    // hierarchy and without a second authorial voice to hold apart.
    id: "thirukkural-kalaignar-urai",
    slug: "thirukkural",
    titleTa: "திருக்குறள் — கலைஞர் உரை",
    titleEn: "Thirukkural — Kalaignar Commentary",
    shelf: "literary-commentary",
    subtype: "commentary",
    readerStructure: "kural-commentary",
    href: "/thirukkural",
    state: "published",
    // Wording taken from the reading room's own approved copy, which in turn rests on the edition:
    // its title page reads திருக்குறள் / கலைஞர் உரை and its printed rights line reads
    // "உரிமை : உரையாசிரியருக்கு". Nothing is claimed here that those do not support.
    descTa: "திருவள்ளுவர் இயற்றிய குறள்களுக்குக் கலைஞர் வழங்கிய உரை — 133 அதிகாரங்கள்",
    descEn: "Kalaignar's commentary on Thiruvalluvar's couplets — 133 adhikarams",
    sourceRepo: "pugazg/kalaignar-literary-commentary",
    sourcePath: "works/thirukkural",
    sourceCommit: "d2a88fc62457c4bad59a3057e4f4c01e55b2f5a4",
    edition: "பூம்புகார் பதிப்பகம் — இரண்டாவது பதிப்பு, மார்ச் 2010",
    tamil: "complete",
    // `english` intentionally UNSET. The source archive holds released English page records, but
    // the reading room exposes none of them, and this field describes what a reader can actually
    // read here. Recording "complete" would advertise a layer that does not exist; recording
    // "none" would misstate the archive. An English layer is a separate phase.
    unitCount: { value: 1330, labelTa: "குறள்கள்", labelEn: "Kurals" },
    // `rights` intentionally UNSET (equivalent to "unclassified"). The nationalisation model
    // describes the PRESENT status of the underlying work AUTHORED BY KALAIGNAR. Here the
    // underlying work is Thiruvalluvar's, and Kalaignar authored the உரை alone — so applying
    // `nationalised-by-tamil-nadu-government` to this catalog entry would assert that
    // Thiruvalluvar's couplets were nationalised, which is not what the order says and not what
    // this edition's own "உரிமை : உரையாசிரியருக்கு" says either. Scoping rights to the
    // Kalaignar-authored layer needs the WorkAttribution model proposed in data/thirukkural.ts;
    // until that exists, nothing is claimed rather than something wrong.
    provenanceHref: "/thirukkural/source",
  },
  {
    id: "manohara",
    slug: "manohara",
    titleTa: "மனோகரா",
    titleEn: "Manohara",
    shelf: "cinema-writing",
    subtype: "screenplay-dialogue",
    readerStructure: "scene",
    href: "/cinema/manohara",
    state: "published",
    descTa: "கலைஞரின் திரைக்கதை–வசன நூல் (1954)",
    descEn: "Kalaignar's screenplay-dialogue booklet (1954)",
    // External source provenance IS established for this work (unlike the memoir),
    // so it is recorded here and surfaced on /cinema/manohara/source.
    sourceRepo: "pugazg/kalaignar-cinema-works",
    sourcePath: "works/manohara",
    sourceCommit: "4b5f3238bd1e5983e995ddd85cd8a81ae27de21d",
    tamil: "complete",
    english: "complete",
    // The English layer is a source-linked derivative created for this project
    // (works/manohara/translations), NOT a separately-published translation.
    englishKind: "project-created",
    // The 1954 booklet prints NO scene numbers. The 57 divisions are archive-created
    // navigation segments only — never presented as "printed scenes". The label makes
    // that explicit on the catalog card.
    unitCount: { value: 57, labelTa: "காப்பக வழிசெலுத்தல் பகுதிகள்", labelEn: "archival segments" },
    // Present rights status of Kalaignar's underlying work: nationalised by the Government of
    // Tamil Nadu (announced 2024-08-22; the GO was publicly handed over to Rajathi Ammal on
    // 2024-12-22 — its exact number and formal issue date are NOT yet verified). This is DISTINCT
    // from the 1954 edition's printed "உரிமை : ஆசிரியருக்கே." notice, which is preserved as a
    // source witness on /cinema/manohara/source.
    rights: {
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null,
      governmentOrderDate: null,
      governmentOrderHandoverDate: "2024-12-22",
      note: "Nationalisation applies to Kalaignar's underlying Tamil work; it does not extend to the project-created English translation or to third-party material. Distinct from the historical 1954 printed rights notice.",
    },
    provenanceHref: "/cinema/manohara/source",
  },
  {
    // CINEMA WRITING — Phase C. The SECOND work on the திரை எழுத்து shelf, and it shares almost
    // nothing structurally with the first.
    //
    // MANOHARA'S BOOKLET PRINTS NO SCENE NUMBERS. Its 57 divisions are archive-created navigation,
    // which is why its `unitCount` is labelled "காப்பக வழிசெலுத்தல் பகுதிகள்" / "archival segments".
    // PARASAKTHI'S BOOKLET PRINTS ITS SCENE HEADINGS. The 46 here are the booklet's own, so they are
    // labelled as scenes — and their gaps are source facts: headings 23 and 34 are never printed,
    // and two late numbers are transposed in the print. The reader follows the canonical order and
    // the provenance page records both readings.
    //
    // `subtype: "dialogue-songs"` rather than Manohara's "screenplay-dialogue": the archive types
    // this source `printed_dialogue_song_booklet`, and the booklet titles itself
    // `முழு வசனம் + பாடல்கள்`. The song layer is not incidental here — it is half the publication.
    id: "parasakthi",
    slug: "parasakthi",
    titleTa: "பராசக்தி",
    titleEn: "Parasakthi",
    shelf: "cinema-writing",
    subtype: "dialogue-songs",
    readerStructure: "scene",
    href: "/cinema/parasakthi",
    state: "published",
    // The description says what the booklet contains. It does NOT say Kalaignar wrote the songs: the
    // booklet credits six poets for them collectively and pairs none with a song, and only two of the
    // fourteen song/verse occurrences are attributed to him — on anthology evidence, not on an
    // original-film credit. That whole distinction lives on /cinema/parasakthi/source.
    descTa: "1952 திரைப்படத்தின் முழு வசனமும் பாடல்களும் — நூலில் அச்சிடப்பட்ட 46 காட்சிகள்",
    descEn: "The 1952 film's full dialogue and songs — 46 scenes as printed in the booklet",
    sourceRepo: "pugazg/kalaignar-cinema-works",
    sourcePath: "works/parasakthi",
    // The work-specific pin, and the one that carries the archive's song-attribution correction. It
    // supersedes a593db50…, which predates that correction.
    sourceCommit: "789b003b6c0dfcf0bc38b906037f92953fd8146f",
    // `edition` is deliberately unset: the booklet prints no year, edition statement or publisher,
    // and the source policy forbids inferring any of them from an undated scan.
    tamil: "complete",
    english: "complete",
    englishKind: "project-created",
    // The booklet's OWN scene headings, unlike Manohara's archive-created segments. 46 are printed;
    // the canonical range runs 1–48 because 23 and 34 appear nowhere in the book.
    unitCount: { value: 46, labelTa: "காட்சிகள்", labelEn: "scenes" },
    // `rights` is deliberately ABSENT, and this is the one place Parasakthi must NOT follow Manohara.
    // Manohara's booklet is Kalaignar's work throughout, so the nationalisation model applies to it.
    // Parasakthi is a COMPOSITE publication: his dialogue alongside songs credited to six poets, of
    // whom only one is him. Asserting `nationalised-by-tamil-nadu-government` over the whole booklet
    // would claim five other poets' songs were nationalised as his work. Scoping rights to the
    // Kalaignar-authored layer needs the WorkAttribution model that does not exist yet; until it
    // does, nothing is claimed rather than something wrong.
    provenanceHref: "/cinema/parasakthi/source",
  },
  {
    // Digital Library Phase D2.3 — the third Cinema Writing work. Reader, scene and source routes
    // shipped in D2.2; this entry only makes them discoverable from /read. Placed after Parasakthi
    // because this shelf lists works in ONBOARDING order, not by year — Manohara (1954) already
    // precedes Parasakthi (1952).
    id: "tirumbippaar",
    slug: "tirumbippaar",
    // The booklet prints the exclamation mark. It is part of the title, not catalogue decoration,
    // and is kept exactly as printed.
    titleTa: "திரும்பிப்பார்!",
    titleEn: "Tirumbippaar",
    shelf: "cinema-writing",
    // The cover credit is `கதை - வசனம்` — story and dialogue. Not Manohara's "screenplay-dialogue",
    // and deliberately not Parasakthi's "dialogue-songs": this booklet prints no complete lyric body
    // for any of its eight song/performance occurrences, so naming songs in the form would promise
    // text the book does not contain.
    subtype: "story-dialogue",
    readerStructure: "scene",
    href: "/cinema/tirumbippaar",
    state: "published",
    // Role-scoped, exactly as far as the printed cover credit reaches: story and dialogue are his.
    // The description does NOT say he wrote the songs — of the eight song/performance occurrences,
    // three are attributed to other people, five are unresolved, and none is attributed to him. That
    // whole distinction lives on /cinema/tirumbippaar/source.
    descTa: "கலைஞரின் கதை–வசனம் — 1953 நூலில் அச்சிடப்பட்ட 93 காட்சிகள்",
    descEn: "Kalaignar's story and dialogue — 93 scenes as printed in the 1953 booklet",
    sourceRepo: "pugazg/kalaignar-cinema-works",
    sourcePath: "works/tirumbippaar",
    sourceCommit: "6a8c59c445890e568dfe65cc36c2900dd2a8a0b3",
    // Unlike Parasakthi's undated scan, this booklet prints its own edition statement, so it is
    // recorded verbatim. Nothing is added to it: the printer's imprint on PDF 2 is cropped mid-line
    // (`சிட்டி பிரஸ், மதுரை ரோ…`) and is left unreconstructed rather than completed into a publisher.
    edition: "முதல் பதிப்பு: 1953",
    tamil: "complete",
    english: "complete",
    englishKind: "project-created",
    // The booklet's OWN printed scene headings, like Parasakthi's and unlike Manohara's
    // archive-created navigation segments. All 93 are printed and consecutive.
    unitCount: { value: 93, labelTa: "காட்சிகள்", labelEn: "scenes" },
    // `rights` is deliberately ABSENT, for the same reason it is absent on Parasakthi and present on
    // Manohara. Manohara's booklet is Kalaignar's throughout, so the nationalisation model fits it.
    // Tirumbippaar is a COMPOSITE cinema publication: his story and dialogue alongside song and
    // performance material that is not his — three occurrences attributed to other people, five
    // unresolved, none to him. Asserting `nationalised-by-tamil-nadu-government` over the whole
    // booklet would claim other people's work was nationalised as his. Scoping rights to the
    // Kalaignar-authored layer needs the WorkAttribution model that still does not exist; until it
    // does, nothing is claimed rather than something wrong. The 1953 printed `உரிமையுடையது.` notice
    // is a historical source statement and stays on /cinema/tirumbippaar/source, not here.
    provenanceHref: "/cinema/tirumbippaar/source",
  },
  {
    // CINEMA WRITING — Phase E3. The FOURTH work on the திரை எழுத்து shelf, and the first that is
    // not a single booklet: 54 lyrics drawn from 23 films, so its reader spine is `film-song`
    // (film → lyric) rather than the `scene` model the other three share. Appended after
    // திரும்பிப்பார்! because this shelf lists works in ONBOARDING order, not by year.
    //
    // The reader shipped in E2; this entry only makes it discoverable from /read.
    //
    // TWO DECISIONS A LATER MAINTAINER COULD EASILY FLATTEN:
    //
    // 1. AUTHORSHIP IS NOT UNIFORM ACROSS THIS WORK. The archive establishes Kalaignar's authorship
    //    for 48 of the 54 lyrics. The six அம்மையப்பன் lyrics 013–018 remain individually
    //    UNRESOLVED — the 2024 compiler printed all of that film's songs and stated he could not
    //    confirm which were his. They are displayed, they are not claimed, and they carry a
    //    source-controlled notice on the reader. So the card's `unitCount` of 54 is a CORPUS count,
    //    and neither description may say "54 songs Kalaignar wrote".
    //
    // 2. `rights` is deliberately ABSENT, for a sharper reason than on Parasakthi or Tirumbippaar.
    //    Those are composite publications; this one is a collection in which six specific items are
    //    of unresolved authorship. Applying `nationalised-by-tamil-nadu-government` to the whole
    //    54-song work would silently convert those six into Kalaignar-authored material for rights
    //    purposes — an authorship finding the evidence does not support, arrived at through a
    //    rights field. Display eligibility, authorship certainty and rights are three separate
    //    things here, and they must stay separate.
    //
    // No source/provenance fields and no provenanceHref: unlike the other three cinema works, this
    // one has NO public source page by design. Its archival apparatus — compiler, publisher, scan
    // hashes, page mappings, credits — lives outside the served tree in
    // data/internal/thirai-isai-paadalgal/provenance.json, and duplicating the pin here would
    // reintroduce on the catalogue card exactly what that boundary keeps off the public surface.
    id: "kalaignar-thirai-isai-paadalgal",
    slug: "thirai-isai-paadalgal",
    titleTa: "கலைஞர் திரை இசைப் பாடல்கள்",
    // The editorial English presentation title carried by the released data, used verbatim rather
    // than a second one invented here.
    titleEn: "Kalaignar Film Songs",
    shelf: "cinema-writing",
    subtype: "film-song-collection",
    readerStructure: "film-song",
    href: "/cinema/thirai-isai-paadalgal",
    state: "published",
    // Says what the collection contains and how it is arranged. It does NOT say who wrote the
    // songs — six of them are unresolved, and the card is not the place to litigate that. The
    // collection title itself is the established public title of the work.
    descTa: "திரைப்படம் வாரியாகத் தொகுக்கப்பட்ட பாடல் வரிகள் — மூல தமிழும் இத்திட்டத்திற்காக உருவாக்கப்பட்ட ஆங்கில வாசிப்பும்",
    descEn: "Film-grouped lyrics in the original Tamil with a project-created English reading",
    tamil: "complete",
    english: "complete",
    englishKind: "project-created",
    // A corpus count: the 54 numbered lyrics the released data carries and the reader displays.
    // Not an authorship count — 48 of them are established as Kalaignar's, six are unresolved.
    unitCount: { value: 54, labelTa: "பாடல்கள்", labelEn: "songs" },
  },
  {
    // Digital Library Phase 3 — Speeches. First benchmark: a fully-released, verified Assembly
    // speech. "Assembly" vs "public" is a SUBTYPE / source context, not a separate public shelf —
    // both belong to the single Speeches shelf.
    id: "udhaya-kathir",
    slug: "udhaya-kathir",
    titleTa: "உதயக் கதிர்",
    titleEn: "Udhaya Kathir",
    shelf: "speeches",
    subtype: "assembly-speech",
    readerStructure: "speech",
    href: "/speeches/udhaya-kathir",
    state: "published",
    descTa: "1970 சட்டமன்ற நம்பிக்கையில்லாத் தீர்மான பதிலுரை",
    descEn: "1970 Assembly reply to the no-confidence motion",
    sourceRepo: "pugazg/kalaignar-assembly-speeches",
    sourcePath: "speeches/1970/1970-09-09-no-confidence-motion",
    sourceCommit: "b1b82402642d8f2cf36927d4752c8e7d28142fdd",
    // Source publication: the standalone 1970 booklet "உதயக் கதிர்" (முதற்பதிப்பு செப்டம்பர் 1970).
    edition: "உதயக் கதிர் — முதற்பதிப்பு, செப்டம்பர் 1970",
    tamil: "complete",
    english: "complete",
    // The English is a project-created, source-linked faithful reading translation (verified
    // against the Tamil), not a separately-published translation.
    englishKind: "project-created",
    // 29 printed section headings in the source (not archive-created navigation numbering).
    unitCount: { value: 29, labelTa: "தலைப்புகள்", labelEn: "sections" },
    // Underlying Kalaignar-authored speech: nationalised by the Government of Tamil Nadu
    // (announced 2024-08-22; GO handed over to Rajathi Ammal 2024-12-22 — number and formal issue
    // date not yet verified). Distinct from the 1970 publication's own imprint.
    rights: {
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null,
      governmentOrderDate: null,
      governmentOrderHandoverDate: "2024-12-22",
      note: "Nationalisation applies to Kalaignar's underlying Tamil speech; it does not extend to the project-created English translation or to third-party material. Distinct from the 1970 publication's own imprint data.",
    },
    provenanceHref: "/speeches/udhaya-kathir/source",
  },
  {
    // Digital Library Phase 3 — Speeches. Second benchmark: a fully-released, verified PUBLIC
    // speech. It shares the single Speeches shelf with the assembly benchmark — "public" vs
    // "assembly" is a SUBTYPE / source context, not a separate public shelf.
    id: "poonthottam",
    slug: "poonthottam",
    titleTa: "பூந்தோட்டம்",
    titleEn: "Poonthottam",
    shelf: "speeches",
    subtype: "public-speech",
    readerStructure: "speech",
    href: "/speeches/poonthottam",
    state: "published",
    descTa: "1951 கிண்டி இன்ஜினியரிங் கல்லூரி பொது உரை",
    descEn: "1951 public speech at Guindy Engineering College",
    sourceRepo: "pugazg/kalaignar-public-speeches",
    sourcePath: "speeches/poonthottam",
    sourceCommit: "1ef73a709a343390befe55dcdfb029427f527bf4",
    // Source publication: the booklet "கலைஞரின் பூந்தோட்டம்" — current scanned fourth edition (2019),
    // first published 1951 (திராவிடப் பண்ணை). The speech itself was delivered 1951-12-06.
    edition: "கலைஞரின் பூந்தோட்டம் — நான்காம் பதிப்பு, 2019 (முதற்பதிப்பு 1951)",
    tamil: "complete",
    english: "complete",
    // The English is a project-created, source-linked faithful reading translation made from the
    // frozen verified Tamil, not a separately-published translation.
    englishKind: "project-created",
    // Underlying Kalaignar-authored speech: nationalised by the Government of Tamil Nadu (announced
    // 2024-08-22; GO handed over to Rajathi Ammal 2024-12-22 — number and formal issue date not yet
    // verified). Distinct from the 2019 edition's own publisher/preface and other third-party matter.
    rights: {
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null,
      governmentOrderDate: null,
      governmentOrderHandoverDate: "2024-12-22",
      note: "Nationalisation applies to Kalaignar's underlying Tamil speech; it does not extend to the project-created English translation or to third-party edition material (the 2019 publisher's preface, cover/design, photographs). Distinct from the 2019 edition's own imprint data.",
    },
    provenanceHref: "/speeches/poonthottam/source",
  },
  {
    // Digital Library Phase 3 — Speeches. Third benchmark: the first speech whose examined source
    // establishes NO speech date, venue or event. Those absences are source facts and are carried
    // as such — the April 1949 second edition is publication/edition context, never a speech date.
    id: "arappor",
    slug: "arappor",
    titleTa: "அறப்போர்",
    titleEn: "Arappor",
    shelf: "speeches",
    subtype: "public-speech",
    readerStructure: "speech",
    href: "/speeches/arappor",
    state: "published",
    descTa: "ஏப்ரல் 1949 இரண்டாம் பதிப்பில் பாதுகாக்கப்பட்ட பொது உரை",
    descEn: "Public speech preserved in the April 1949 second-edition booklet",
    sourceRepo: "pugazg/kalaignar-public-speeches",
    sourcePath: "speeches/arappor",
    sourceCommit: "1ef73a709a343390befe55dcdfb029427f527bf4",
    // Publication/edition context only — the source states no speech date.
    edition: "அறப்போர் — இரண்டாம்பதிப்பு, ஏப்ரல் 1949 (அறிவுப்பண்ணை)",
    tamil: "complete",
    english: "complete",
    englishKind: "project-created",
    // unitCount intentionally UNSET — the source publishes no meaningful printed section count for
    // this booklet, and an archive-created number must never be presented as printed structure.
    rights: {
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null,
      governmentOrderDate: null,
      governmentOrderHandoverDate: "2024-12-22",
      note: "Nationalisation applies to Kalaignar's underlying Tamil speech; it does not extend to the project-created English translation or to third-party edition material (the 1949 publisher's imprint, advertisements, cover/design).",
    },
    provenanceHref: "/speeches/arappor/source",
  },

  // ── THE 2007 ASSEMBLY ANTHOLOGY ──────────────────────────────────────────────────────────────
  // Ten dated speeches from one controlling publication, தொழில்துறை பற்றி கலைஞரின் சட்டமன்ற
  // உரைகள். They are catalogued as TEN works, not one collection card: each has its own sitting
  // date, source path, reader route, provenance route and citable identity. The anthology is the
  // controlling SOURCE PUBLICATION, not the public work boundary.
  //
  // Titles are the released identities verbatim, repetition and all. "உரை : N" is how the edition
  // itself numbers these speeches; the descriptions carry the sitting date and the source-stated
  // event, so otherwise-identical titles stay distinguishable without anything being renamed.
  //
  // `edition` is UNSET on all ten. Nine record the anthology's edition, date and publisher; the
  // 2006 speech records none of them. Writing the siblings' values onto it would flatten a
  // provenance distinction the generated data deliberately keeps, and the full publication
  // evidence already lives on each work's /source page.
  //
  // `unitCount` is UNSET. The archive publishes no unit structure for an individual speech —
  // source pages, paragraphs, blocks and the anthology's "உரை : N" sequence are none of them.
  //
  // `rights` is UNSET, deliberately and not as a TODO. The anthology provenance carries no rights
  // position, the reader correctly omits that section, and rights/WorkAttribution is out of scope.
  {
    id: "1963-03-21-industries-debate",
    slug: "1963-03-21-industries-debate",
    titleTa: "தொழில்துறை பற்றி கலைஞரின் சட்டமன்ற உரைகள் — உரை : 1",
    titleEn: "Kalaignar's Legislative Assembly Speeches on Industry — Speech 1",
    shelf: "speeches",
    subtype: "assembly-speech",
    readerStructure: "speech",
    href: "/speeches/1963-03-21-industries-debate",
    state: "published",
    descTa: "1963-03-21 · தொழில்துறை மானியத்தின்மீது உரை",
    descEn: "1963-03-21 · Speech on the Industries grant",
    sourceRepo: "pugazg/kalaignar-assembly-speeches",
    sourcePath: "speeches/1963/1963-03-21-industries-debate",
    sourceCommit: "b1b82402642d8f2cf36927d4752c8e7d28142fdd",
    tamil: "complete",
    english: "complete",
    // Project-created: every one of the ten records requires_verified_tamil and
    // verified_against_tamil, and the English was produced from the verified Tamil under the
    // archive's own translate-then-verify gates. Not a separately published translation.
    englishKind: "project-created",
    provenanceHref: "/speeches/1963-03-21-industries-debate/source",
  },
  {
    id: "1981-04-16-industries-debate",
    slug: "1981-04-16-industries-debate",
    titleTa: "தொழில்துறை பற்றி கலைஞரின் சட்டமன்ற உரைகள் — உரை : 2",
    titleEn: "Kalaignar's Legislative Assembly Speeches on Industry — Speech 2",
    shelf: "speeches",
    subtype: "assembly-speech",
    readerStructure: "speech",
    href: "/speeches/1981-04-16-industries-debate",
    state: "published",
    descTa: "1981-04-16 · தொழில் கொள்கைகள், திட்டங்கள் மற்றும் மானியக் கோரிக்கை குறித்த உரை",
    descEn: "1981-04-16 · Speech on industrial policies, plans and the grant demand",
    sourceRepo: "pugazg/kalaignar-assembly-speeches",
    sourcePath: "speeches/1981/1981-04-16-industries-debate",
    sourceCommit: "b1b82402642d8f2cf36927d4752c8e7d28142fdd",
    tamil: "complete",
    english: "complete",
    // Project-created: every one of the ten records requires_verified_tamil and
    // verified_against_tamil, and the English was produced from the verified Tamil under the
    // archive's own translate-then-verify gates. Not a separately published translation.
    englishKind: "project-created",
    provenanceHref: "/speeches/1981-04-16-industries-debate/source",
  },
  {
    id: "1989-05-03-industries-debate",
    slug: "1989-05-03-industries-debate",
    titleTa: "தொழில்துறை பற்றி கலைஞரின் சட்டமன்ற உரைகள் — உரை : 3",
    titleEn: "Kalaignar's Legislative Assembly Speeches on Industry — Speech 3",
    shelf: "speeches",
    subtype: "assembly-speech",
    readerStructure: "speech",
    href: "/speeches/1989-05-03-industries-debate",
    state: "published",
    descTa: "1989-05-03 · தொழில்துறை மானிய விவாத உரை",
    descEn: "1989-05-03 · Speech in the Industries grant debate",
    sourceRepo: "pugazg/kalaignar-assembly-speeches",
    sourcePath: "speeches/1989/1989-05-03-industries-debate",
    sourceCommit: "b1b82402642d8f2cf36927d4752c8e7d28142fdd",
    tamil: "complete",
    english: "complete",
    // Project-created: every one of the ten records requires_verified_tamil and
    // verified_against_tamil, and the English was produced from the verified Tamil under the
    // archive's own translate-then-verify gates. Not a separately published translation.
    englishKind: "project-created",
    provenanceHref: "/speeches/1989-05-03-industries-debate/source",
  },
  {
    id: "1990-04-18-industries-debate",
    slug: "1990-04-18-industries-debate",
    titleTa: "தொழில்துறை பற்றி கலைஞரின் சட்டமன்ற உரைகள் — உரை : 4",
    titleEn: "Kalaignar's Legislative Assembly Speeches on Industry — Speech 4",
    shelf: "speeches",
    subtype: "assembly-speech",
    readerStructure: "speech",
    href: "/speeches/1990-04-18-industries-debate",
    state: "published",
    descTa: "1990-04-18 · தொழில்துறை மானிய விவாத உரை",
    descEn: "1990-04-18 · Speech in the Industries grant debate",
    sourceRepo: "pugazg/kalaignar-assembly-speeches",
    sourcePath: "speeches/1990/1990-04-18-industries-debate",
    sourceCommit: "b1b82402642d8f2cf36927d4752c8e7d28142fdd",
    tamil: "complete",
    english: "complete",
    // Project-created: every one of the ten records requires_verified_tamil and
    // verified_against_tamil, and the English was produced from the verified Tamil under the
    // archive's own translate-then-verify gates. Not a separately published translation.
    englishKind: "project-created",
    provenanceHref: "/speeches/1990-04-18-industries-debate/source",
  },
  {
    id: "1996-08-14-industries-debate",
    slug: "1996-08-14-industries-debate",
    titleTa: "தொழில்துறை பற்றி கலைஞரின் சட்டமன்ற உரைகள் — உரை : 5",
    titleEn: "Kalaignar's Legislative Assembly Speeches on Industry — Speech 5",
    shelf: "speeches",
    subtype: "assembly-speech",
    readerStructure: "speech",
    href: "/speeches/1996-08-14-industries-debate",
    state: "published",
    descTa: "1996-08-14 · தொழில்துறை மானிய விவாத உரை",
    descEn: "1996-08-14 · Speech in the Industries grant debate",
    sourceRepo: "pugazg/kalaignar-assembly-speeches",
    sourcePath: "speeches/1996/1996-08-14-industries-debate",
    sourceCommit: "b1b82402642d8f2cf36927d4752c8e7d28142fdd",
    tamil: "complete",
    english: "complete",
    // Project-created: every one of the ten records requires_verified_tamil and
    // verified_against_tamil, and the English was produced from the verified Tamil under the
    // archive's own translate-then-verify gates. Not a separately published translation.
    englishKind: "project-created",
    provenanceHref: "/speeches/1996-08-14-industries-debate/source",
  },
  {
    id: "1997-04-23-industries-debate",
    slug: "1997-04-23-industries-debate",
    titleTa: "தொழில்துறை பற்றி கலைஞரின் சட்டமன்ற உரைகள் — உரை : 6",
    titleEn: "Kalaignar's Legislative Assembly Speeches on Industry — Speech 6",
    shelf: "speeches",
    subtype: "assembly-speech",
    readerStructure: "speech",
    href: "/speeches/1997-04-23-industries-debate",
    state: "published",
    descTa: "1997-04-23 · தொழில்துறை மானிய விவாத உரை",
    descEn: "1997-04-23 · Speech in the Industries grant debate",
    sourceRepo: "pugazg/kalaignar-assembly-speeches",
    sourcePath: "speeches/1997/1997-04-23-industries-debate",
    sourceCommit: "b1b82402642d8f2cf36927d4752c8e7d28142fdd",
    tamil: "complete",
    english: "complete",
    // Project-created: every one of the ten records requires_verified_tamil and
    // verified_against_tamil, and the English was produced from the verified Tamil under the
    // archive's own translate-then-verify gates. Not a separately published translation.
    englishKind: "project-created",
    provenanceHref: "/speeches/1997-04-23-industries-debate/source",
  },
  {
    id: "1998-05-14-industries-debate",
    slug: "1998-05-14-industries-debate",
    titleTa: "தொழில்துறை பற்றி கலைஞரின் சட்டமன்ற உரைகள் — உரை : 7",
    titleEn: "Kalaignar's Legislative Assembly Speeches on Industry — Speech 7",
    shelf: "speeches",
    subtype: "assembly-speech",
    readerStructure: "speech",
    href: "/speeches/1998-05-14-industries-debate",
    state: "published",
    descTa: "1998-05-14 · தொழில்துறை மானிய விவாத உரை",
    descEn: "1998-05-14 · Speech in the Industries grant debate",
    sourceRepo: "pugazg/kalaignar-assembly-speeches",
    sourcePath: "speeches/1998/1998-05-14-industries-debate",
    sourceCommit: "b1b82402642d8f2cf36927d4752c8e7d28142fdd",
    tamil: "complete",
    english: "complete",
    // Project-created: every one of the ten records requires_verified_tamil and
    // verified_against_tamil, and the English was produced from the verified Tamil under the
    // archive's own translate-then-verify gates. Not a separately published translation.
    englishKind: "project-created",
    provenanceHref: "/speeches/1998-05-14-industries-debate/source",
  },
  {
    id: "1999-04-29-industries-debate",
    slug: "1999-04-29-industries-debate",
    titleTa: "தொழில்துறை பற்றி கலைஞரின் சட்டமன்ற உரைகள் — உரை : 8",
    titleEn: "Kalaignar's Legislative Assembly Speeches on Industry — Speech 8",
    shelf: "speeches",
    subtype: "assembly-speech",
    readerStructure: "speech",
    href: "/speeches/1999-04-29-industries-debate",
    state: "published",
    descTa: "1999-04-29 · தொழில்துறை மானிய விவாத உரை",
    descEn: "1999-04-29 · Speech in the Industries grant debate",
    sourceRepo: "pugazg/kalaignar-assembly-speeches",
    sourcePath: "speeches/1999/1999-04-29-industries-debate",
    sourceCommit: "b1b82402642d8f2cf36927d4752c8e7d28142fdd",
    tamil: "complete",
    english: "complete",
    // Project-created: every one of the ten records requires_verified_tamil and
    // verified_against_tamil, and the English was produced from the verified Tamil under the
    // archive's own translate-then-verify gates. Not a separately published translation.
    englishKind: "project-created",
    provenanceHref: "/speeches/1999-04-29-industries-debate/source",
  },
  {
    id: "2000-05-08-industries-debate",
    slug: "2000-05-08-industries-debate",
    titleTa: "தொழில்துறை பற்றி கலைஞரின் சட்டமன்ற உரைகள் — உரை : 9",
    titleEn: "Kalaignar's Legislative Assembly Speeches on Industry — Speech 9",
    shelf: "speeches",
    subtype: "assembly-speech",
    readerStructure: "speech",
    href: "/speeches/2000-05-08-industries-debate",
    state: "published",
    descTa: "2000-05-08 · தொழில்துறை மானிய விவாத உரை",
    descEn: "2000-05-08 · Speech in the Industries grant debate",
    sourceRepo: "pugazg/kalaignar-assembly-speeches",
    sourcePath: "speeches/2000/2000-05-08-industries-debate",
    sourceCommit: "b1b82402642d8f2cf36927d4752c8e7d28142fdd",
    tamil: "complete",
    english: "complete",
    // Project-created: every one of the ten records requires_verified_tamil and
    // verified_against_tamil, and the English was produced from the verified Tamil under the
    // archive's own translate-then-verify gates. Not a separately published translation.
    englishKind: "project-created",
    provenanceHref: "/speeches/2000-05-08-industries-debate/source",
  },
  {
    id: "2006-08-23-industries-debate",
    slug: "2006-08-23-industries-debate",
    titleTa: "தொழில்துறை பற்றி கலைஞரின் சட்டமன்ற உரைகள் — உரை : 10",
    titleEn: "Kalaignar's Legislative Assembly Speeches on Industry — Speech 10",
    shelf: "speeches",
    subtype: "assembly-speech",
    readerStructure: "speech",
    href: "/speeches/2006-08-23-industries-debate",
    state: "published",
    descTa: "2006-08-23 · தொழில்துறை மற்றும் தகவல் தொழில்நுட்பத் துறை மானிய விவாத உரை",
    descEn: "2006-08-23 · Speech in the Industries and Information Technology grant debate",
    sourceRepo: "pugazg/kalaignar-assembly-speeches",
    sourcePath: "speeches/2006/2006-08-23-industries-debate",
    sourceCommit: "b1b82402642d8f2cf36927d4752c8e7d28142fdd",
    tamil: "complete",
    english: "complete",
    // Project-created: every one of the ten records requires_verified_tamil and
    // verified_against_tamil, and the English was produced from the verified Tamil under the
    // archive's own translate-then-verify gates. Not a separately published translation.
    englishKind: "project-created",
    provenanceHref: "/speeches/2006-08-23-industries-debate/source",
  },
  {
    // Digital Library Phase 4 — Poetry. First benchmark, and the first work on the கவிதைகள் shelf.
    // Owner-directed move to a new category: Phase 3 (Speeches) is ACTIVE but PAUSED after three
    // benchmarks. A poem gets its OWN reader structure ("poem") — verse is not speech prose — while
    // staying inside the same shared catalog envelope.
    id: "idhayathai-thanthidu-anna",
    slug: "idhayathai-thanthidu-anna",
    titleTa: "இதயத்தைத் தந்திடு அண்ணா",
    titleEn: "Lend Me Your Heart, Anna",
    shelf: "poetry",
    subtype: "poem",
    readerStructure: "poem",
    href: "/poems/idhayathai-thanthidu-anna",
    state: "published",
    descTa: "9.2.1969 சென்னை வானொலியில் பேரறிஞர் அண்ணாவுக்கு அளித்த கண்ணீர்க் கவிதாஞ்சலி",
    descEn: "A poetic tribute to Perarignar Anna, offered on Chennai Radio on 9 February 1969",
    sourceRepo: "pugazg/kalaignar-poems",
    sourcePath: "poems/idhayathai-thanthidu-anna",
    sourceCommit: "42c156d7242fa799ea80adbb0c5f2b9eba078fe9",
    // `edition` is deliberately UNSET. The controlling scan carries NO standalone publication-year
    // or edition statement, and the 15.9.2008 foreword date is a foreword-internal third-party date
    // that must never become a publication/edition year. A field is never filled merely because the
    // type allows it — the source context (9.2.1969, Chennai Radio) lives on the provenance page.
    tamil: "complete",
    english: "complete",
    // RELEASE-COMPLETE translation created for this project from the verified Tamil.
    englishKind: "project-created",
    // unitCount intentionally UNSET — the source prints no numbered poem divisions, and a derived
    // line or stanza count must never be presented as printed source structure.
    rights: {
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null,
      governmentOrderDate: null,
      governmentOrderHandoverDate: "2024-12-22",
      note: "Nationalisation applies to Kalaignar's underlying Tamil poem; it does not extend to the project-created English translation, nor to third-party material in the booklet (the என்னுரை foreword, photographs and captions, the publisher/donor advertisement and back matter, the printer imprint, cover/design).",
    },
    provenanceHref: "/poems/idhayathai-thanthidu-anna/source",
  },
  {
    // Digital Library Phase 5 — Essays & Articles. First benchmark, and the first work on the
    // கட்டுரைகள் shelf. This is ONE catalog publication containing 14 source-numbered articles —
    // never 14 catalog works. An article is ordinary prose, so it gets the `article` reader
    // structure rather than the speech, poem or scene readers.
    id: "sakkaravarththiyin-thirumagan",
    slug: "sakkaravarththiyin-thirumagan",
    titleTa: "சக்கரவர்த்தியின் திருமகன்",
    titleEn: "Chakravarthi's Son",
    shelf: "essays-articles",
    subtype: "essay-collection",
    readerStructure: "article",
    href: "/essays/sakkaravarththiyin-thirumagan",
    state: "published",
    descTa: "‘கல்கி’ இதழ்த் தொடருக்கு முரசொலியில் எழுதிய 14 கட்டுரைகள்",
    descEn: "14 articles answering the Kalki serial, written in Murasoli",
    sourceRepo: "pugazg/kalaignar-essays",
    sourcePath: "publications/sakkaravarththiyin-thirumagan",
    sourceCommit: "bff35320b668cb5beeaafc5faa58260c4f4473f8",
    // The CONTROLLING source integrated here is the 2018 reprint. The publication's own first
    // edition (மே 1956, வேலூர் திராவிடன் பதிப்பகம்) is recorded too, but the edition field must not
    // make the 2018 scan look like the 1956 physical edition.
    edition: "மறு பதிப்பு 2018 — திராவிடர் கழக (இயக்க) வெளியீடு (முதற்பதிப்பு மே 1956, வேலூர் திராவிடன் பதிப்பகம்)",
    tamil: "complete",
    english: "complete",
    englishKind: "project-created",
    // 14 articles NUMBERED IN THE PRINTED CONTENTS PAGE, with every boundary verified against its
    // heading page — source-supported publication ordering, not archive-created navigation.
    unitCount: { value: 14, labelTa: "கட்டுரைகள்", labelEn: "articles" },
    rights: {
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null,
      governmentOrderDate: null,
      governmentOrderHandoverDate: "2024-12-22",
      note: "Nationalisation applies to Kalaignar's underlying Tamil articles; it does not extend to the project-created English translation, to publisher/edition matter, cover/design, advertisements or library marks, nor to the third-party texts quoted inside the articles.",
    },
    provenanceHref: "/essays/sakkaravarththiyin-thirumagan/source",
  },
  {
    // Fiction — first novel benchmark, and the first work on the புனைகதை shelf. ONE continuous
    // novel in three assembled reading sections. `ராயசம் வெங்கண்ணா` is an INTERNAL cinematic
    // sequence of this novel — the source archive states so explicitly — so it gets no catalog
    // entry, no route and no release identity of its own.
    id: "balipeedam-nokki",
    slug: "balipeedam-nokki",
    titleTa: "பலிபீடம் நோக்கி",
    titleEn: "Towards the Sacrificial Altar",
    shelf: "fiction",
    subtype: "novel",
    readerStructure: "novel",
    href: "/novels/balipeedam-nokki",
    state: "published",
    descTa: "1947 முதற்பதிப்பு — உள்ளமைந்த ‘ராயசம் வெங்கண்ணா’ திரைக்காட்சியுடன்",
    descEn: "The 1947 first edition, with its embedded Rayasam Venganna sequence",
    sourceRepo: "pugazg/kalaignar-novels",
    sourcePath: "works/balipeedam-nokki",
    sourceCommit: "9e80c567d4a2165178c5374a02210240140685bf",
    // The scan IS the first edition, so the edition statement carries no reprint ambiguity.
    edition: "முதற்பதிப்பு ஏப்ரல் 1947 — எரிமலைப் பதிப்பகம், துறையூர் (எரிமலைப் பதிப்பக வெளியீடு 3)",
    tamil: "complete",
    english: "complete",
    englishKind: "project-created",
    // 3 sections of the SOURCE ARCHIVE's own assembled reading layer — not chapters printed in the
    // book, and not archive-created navigation numbering invented here.
    unitCount: { value: 3, labelTa: "பகுதிகள்", labelEn: "sections" },
    rights: {
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null,
      governmentOrderDate: null,
      governmentOrderHandoverDate: "2024-12-22",
      note: "Nationalisation applies to Kalaignar's underlying Tamil novel; it does not extend to the project-created English translation, to the 1947 edition's publisher/imprint matter, cover artwork or printer material, nor to the library stamps and accession marks on this physical copy.",
    },
    provenanceHref: "/novels/balipeedam-nokki/source",
  },
  {
    // FICTION — Phase 8 benchmark B. The SECOND work on the புனைகதை shelf, and the first with the
    // `story` reader structure, which has been declared in the envelope since Phase 6 and until now
    // carried no work.
    //
    // A SHORT STORY IS NOT A NOVEL, even on the same shelf. `balipeedam-nokki` is section-based
    // because the source archive's own assembled layer divides it into three ordered sections with
    // their own routes; this is ONE continuous stream from scan 7 to scan 22 with no printed
    // divisions at all. Hence `subtype: "short-story"` — the first non-`novel` subtype on this
    // shelf — and `readerStructure: "story"`.
    //
    // `கற்பனையுரை` IS NOT PART OF THE TITLE. The booklet prints it under the title as its own word
    // for what the piece is, so it belongs in the description and on the reading page, never
    // concatenated into `titleTa`. The title is `கிழவன் கனவு`, nothing more.
    //
    // THREE FIELDS ARE DELIBERATELY UNSET, and each absence is a decision, not an omission:
    //   * `edition` — the booklet states `இரண்டாம் பதிப்பு.` and that statement is published on the
    //     work's provenance page, but there is no approved catalogue edition display for it here;
    //   * `unitCount` — a single continuous story has no source-published numbered structure, and
    //     the 16 scans it occupies are an archival fact about the scan, not units of the work;
    //   * `rights` — nothing about this work's rights status has been established for the catalogue,
    //     and the novel's nationalisation block is NOT copied across. Absence means unclassified,
    //     exactly as the model says; a rights claim is never inherited from a shelf-mate.
    id: "kizhavan-kanavu",
    slug: "kizhavan-kanavu",
    titleTa: "கிழவன் கனவு",
    titleEn: "The Old Man's Dream",
    shelf: "fiction",
    subtype: "short-story",
    readerStructure: "story",
    href: "/stories/kizhavan-kanavu",
    state: "published",
    descTa: "ஒரு தொடர்ச்சியான சிறுகதை — நூல் தன் வடிவத்தை ‘கற்பனையுரை’ எனக் குறிக்கிறது",
    descEn: "One continuous short story, printed under the booklet's own form label — an imagined narrative",
    sourceRepo: "pugazg/kalaignar-short-stories",
    sourcePath: "stories/kizhavan-kanavu",
    sourceCommit: "d9a411d40bd54d9770e5b28854ac5b4e804dd419",
    // The story itself is 16 of 16 scans verified with no unresolved reading — complete at the
    // work boundary. (The booklet-wide 24-of-26 figure concerns front matter the story does not
    // occupy, and is stated on the provenance page, not here.)
    tamil: "complete",
    english: "complete",
    englishKind: "project-created",
    provenanceHref: "/stories/kizhavan-kanavu/source",
  },
  {
    // DRAMA — Phase 7 benchmark #1, and the first work on the நாடகங்கள் shelf. ONE printed stage
    // play in 38 numbered scenes plus a separate UNNUMBERED closing tableau
    // (`கண்ணகி சிலை நாட்டு விழா`). That tableau is NOT Scene 39 and is never counted among the 38,
    // so `unitCount` reports 38.
    id: "silappathikaram-nataka-kappiyam",
    slug: "silappathikaram-nataka-kappiyam",
    titleTa: "சிலப்பதிகாரம் — நாடகக் காப்பியம்",
    titleEn: "Silappathikaram — A Dramatic Epic",
    shelf: "drama",
    subtype: "stage-play",
    readerStructure: "stage-play",
    href: "/plays/silappathikaram-nataka-kappiyam",
    state: "published",
    descTa: "அஞ்சுகம் வெளியீட்டு அச்சுப் பதிப்பு — 38 காட்சிகளும் ஒரு நிறைவுக் காட்சியும்",
    descEn: "The printed Anjugam edition — 38 scenes and a closing tableau",
    sourceRepo: "pugazg/kalaignar-stage-plays",
    sourcePath: "works/silappathikaram-nataka-kappiyam",
    sourceCommit: "a66e62bbecaf63825b3db09a1d421401e1ab2e8e",
    // The edition prints NO publication year anywhere in the scan, so none is stated here. The
    // foreword's internal dates are not promoted into one.
    edition: "அஞ்சுகம் வெளியீடு, சென்னை-6 — பதிப்பாண்டு அச்சிடப்படவில்லை",
    tamil: "complete",
    english: "complete",
    englishKind: "project-created",
    unitCount: { value: 38, labelTa: "காட்சிகள்", labelEn: "scenes" },
    rights: {
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null,
      governmentOrderDate: null,
      governmentOrderHandoverDate: "2024-12-22",
      note: "Nationalisation applies to Kalaignar's underlying Tamil stage play; it does not extend to the project-created English translation, to the edition's அஞ்சுகம் வெளியீடு imprint matter, printed price or decorative artwork, to the library stamps and accession marks on this physical copy, nor to the separately copyrighted 2009 published English edition held in the source archive as analytical evidence only.",
    },
    provenanceHref: "/plays/silappathikaram-nataka-kappiyam/source",
  },
];

// ── Selectors ────────────────────────────────────────────────────────────────
/** Only intentionally published works are ever exposed publicly. */
export function publishedWorks(): LibraryWork[] {
  return LIBRARY_WORKS.filter((w) => w.state === "published");
}

export interface ShelfWithWorks {
  shelf: Shelf;
  works: LibraryWork[];
}

/**
 * Shelves that contain at least one published work, in taxonomy order. Empty
 * shelves are omitted so the public UI never renders misleading empty categories
 * or "coming soon" placeholders.
 */
export function visibleShelves(): ShelfWithWorks[] {
  const pub = publishedWorks();
  return [...SHELVES]
    .sort((a, b) => a.order - b.order)
    .map((shelf) => ({ shelf, works: pub.filter((w) => w.shelf === shelf.id) }))
    .filter((s) => s.works.length > 0);
}
