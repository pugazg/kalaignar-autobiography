"use client";

import Link from "next/link";
import { BookOpen, Drama, Info } from "lucide-react";
import type { Play } from "@/data/plays";
import { useLang } from "@/lib/i18n";

/**
 * The play's landing page: identity, edition facts, and the printed reading-unit list.
 *
 * A play is not necessarily a sequence of scenes. Where `structureKind` is `continuous-play` the
 * edition prints ONE continuous dramatic text with no scene division, so this page must not offer a
 * scene list, a scene count or a "Scene 1" — it offers the single reading route the work has.
 */
export default function PlayLanding({ play }: { play: Play }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const first = play.readingUnits[0];
  const continuous = play.structureKind === "continuous-play";

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-marina dark:text-marina-light">
          <Drama className="h-3.5 w-3.5" aria-hidden /> {ta ? "நாடகம்" : "Drama"}
        </p>
        <h1 className="mt-3 font-tamil text-3xl font-semibold leading-tight text-ink dark:text-night-text sm:text-4xl" lang="ta">
          {play.title.ta}
        </h1>
        <p className="mt-1 font-tamil text-lg text-ink/70 dark:text-night-text/70" lang="ta">{play.descriptor.ta}</p>
        <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">
          {play.title.en} — {play.descriptor.en}
        </p>
        <p className="mt-3 font-tamil text-sm text-ink/70 dark:text-night-text/70" lang="ta">{play.author.ta}</p>

        <dl className="mt-6 space-y-1.5 text-sm">
          {/* A composite volume prints its collection title once, in shared front matter. Naming it
              here is how a reader learns the work was printed inside a larger book. */}
          {play.edition.collectionTitleTa && (
            <div className="flex gap-2">
              <dt className="shrink-0 text-ink/50 dark:text-night-text/50">{ta ? "தொகுப்பு" : "Printed in"}</dt>
              <dd className="font-tamil text-ink/80 dark:text-night-text/80" lang="ta">{play.edition.collectionTitleTa}</dd>
            </div>
          )}
          {play.edition.publisherTa && (
            <div className="flex gap-2">
              <dt className="shrink-0 text-ink/50 dark:text-night-text/50">{ta ? "பதிப்பகம்" : "Publisher"}</dt>
              <dd className="font-tamil text-ink/80 dark:text-night-text/80" lang="ta">
                {play.edition.publisherTa}{play.edition.placeTa ? `, ${play.edition.placeTa}` : ""}
              </dd>
            </div>
          )}
          {play.edition.priceTa && (
            <div className="flex gap-2">
              <dt className="shrink-0 text-ink/50 dark:text-night-text/50">{ta ? "அச்சு விலை" : "Printed price"}</dt>
              <dd className="font-tamil text-ink/80 dark:text-night-text/80" lang="ta">{play.edition.priceTa}</dd>
            </div>
          )}
          {/* The edition prints no year. Saying so is more honest than leaving a blank field. */}
          <div className="flex gap-2">
            <dt className="shrink-0 text-ink/50 dark:text-night-text/50">{ta ? "பதிப்பாண்டு" : "Year"}</dt>
            <dd className="text-ink/70 dark:text-night-text/70" lang={ta ? "ta" : "en"}>
              {ta ? "இப்பதிப்பில் அச்சிடப்படவில்லை — ஊகிக்கப்படவில்லை" : "not printed in this edition — not inferred"}
            </dd>
          </div>
        </dl>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={`/plays/${play.slug}/${first.slug}`} className="focus-ring inline-flex items-center gap-2 rounded-full bg-marina px-5 py-2.5 text-sm font-medium text-paper hover:bg-marina/90">
            <BookOpen className="h-4 w-4" aria-hidden /> {ta ? "வாசிக்கத் தொடங்கு" : "Start reading"}
          </Link>
          <Link href={`/plays/${play.slug}/source`} className="focus-ring inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm text-ink/75 hover:border-marina hover:text-marina dark:border-white/20 dark:text-night-text/75">
            <Info className="h-4 w-4" aria-hidden /> {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45">
            {continuous
              ? ta ? "தொடர் நாடகப் பகுதி" : "Continuous dramatic text"
              : ta ? `காட்சிகள் — ${play.sceneCount}` : `Scenes — ${play.sceneCount}`}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-ink/55 dark:text-night-text/55" lang={ta ? "ta" : "en"}>
            {continuous
              ? ta
                ? "இந்நூலை மூலம் காட்சிகளாகப் பிரிக்கவில்லை; ஒரே தொடர்ச்சியான நாடகப் பகுதியாகவே அச்சிட்டுள்ளது. எனவே இங்கு காட்சி எண்ணும் இல்லை, “காட்சி 1”-உம் இல்லை."
                : "The edition prints this work as one continuous dramatic text, with no scene division at all. It therefore has no scene numbers and no “Scene 1”."
              : play.closingTableauCount > 0
                ? ta
                  ? `இந்நூல் ${play.sceneCount} எண்ணிடப்பட்ட காட்சிகளையும், அதன்பின் எண்ணிடப்படாத ஒரு நிறைவுக் காட்சியையும் கொண்டது. அந்நிறைவுக் காட்சி காட்சி-39 அல்ல.`
                  : `The edition prints ${play.sceneCount} numbered scenes, followed by one unnumbered closing tableau. That tableau is not Scene 39.`
                : ta
                  ? `இந்நூலில் மூலம் அச்சிட்ட ${play.sceneCount} காட்சிகள் உள்ளன.`
                  : `The edition prints ${play.sceneCount} numbered scenes.`}
          </p>
          {/* Printed pre-dramatic material is announced here, but it is NOT a list entry: it has no
              route, no number, and is never counted among the scenes. It reads at the head of the
              unit the source prints it before. */}
          {play.openingNote && (
            <p className="mt-2 inline-flex items-start gap-1.5 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-3 py-2 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={ta ? "ta" : "en"}>
              <Drama className="mt-0.5 h-3.5 w-3.5 shrink-0 text-marina" aria-hidden />
              <span>
                {ta
                  ? `மூலம் ${play.openingNote.labelTa} ஒன்றை நாடகப் பகுதிக்கு முன் அச்சிட்டுள்ளது (ஸ்கேன் ${play.openingNote.sourceScans.join(", ")}). அது காட்சி அல்ல; காட்சி எண்ணிக்கையில் சேர்க்கப்படவில்லை.`
                  : `The source prints ${play.openingNote.labelEn.toLowerCase()} before the dramatic body (scan${play.openingNote.sourceScans.length > 1 ? "s" : ""} ${play.openingNote.sourceScans.join(", ")}). It is not a scene and is not counted among them.`}
              </span>
            </p>
          )}
          <ol className="mt-4 divide-y divide-ink/10 dark:divide-white/10">
            {play.readingUnits.map((s) => (
              <li key={s.slug}>
                <Link href={`/plays/${play.slug}/${s.slug}`} className="focus-ring group flex gap-3 py-3">
                  <span className="w-8 shrink-0 pt-0.5 text-right text-xs tabular-nums text-ink/40 dark:text-night-text/40">
                    {s.order ?? "—"}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-tamil text-[15px] text-ink group-hover:text-marina dark:text-night-text" lang="ta">{s.titleTa}</span>
                    <span className="block font-display text-sm text-ink/55 dark:text-night-text/55">{s.titleEn}</span>
                    {s.kind === "closing-tableau" && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded border border-dashed border-marina/40 px-1.5 py-0.5 text-[11px] text-ink/60 dark:text-night-text/60" lang={ta ? "ta" : "en"}>
                        <Drama className="h-3 w-3 text-marina" aria-hidden />
                        {ta ? "எண்ணிடப்படாத நிறைவுக் காட்சி — காட்சி-39 அல்ல" : "unnumbered closing tableau — not Scene 39"}
                      </span>
                    )}
                    {s.kind === "continuous-body" && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded border border-dashed border-marina/40 px-1.5 py-0.5 text-[11px] text-ink/60 dark:text-night-text/60" lang={ta ? "ta" : "en"}>
                        <Drama className="h-3 w-3 text-marina" aria-hidden />
                        {ta ? "காட்சிப் பிரிவின்றி ஒரே தொடர் பகுதி" : "one continuous text — the source prints no scenes"}
                      </span>
                    )}
                    <span className="mt-0.5 block text-[11px] text-ink/40 dark:text-night-text/40">
                      {ta ? "ஸ்கேன்" : "scans"} {s.sourceScans.join(", ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
