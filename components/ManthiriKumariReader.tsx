"use client";

import { useState } from "react";
import Link from "next/link";
import type { ManthiriReader } from "@/data/manthiri-kumari";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One reading surface of மந்திரி குமாரி — the story summary, or one of the 15 performance blocks.
 *
 * A PUBLICATION INTERFACE. No PDF page, scan hash, source commit, record id or QA label appears here
 * (not in text, tooltip or aria-label); all of that lives at /cinema/manthiri-kumari/source.
 *
 * ONE LANGUAGE AT A TIME, Tamil default, exactly as every bilingual reader here works. The item is
 * passed from the server, so the Tamil is in the initial HTML.
 *
 * WHAT THIS READER MUST NOT DO:
 *   * never present a performance as a screenplay scene, and never imply the booklet printed a
 *     "Performance N" number — the ordinal shown is archive navigation;
 *   * never imply Kalaignar wrote the songs. Every one of the 15 blocks is item-level lyricist
 *     UNRESOLVED, and the note under each performance says exactly that;
 *   * never collapse Performance 13's internal turn labels (பார்த்திபன் / அமுதவல்லி) into its printed
 *     compound heading பார்த்திபன்—மந்திரிகுமாரி. The heading is the heading; the section labels are
 *     the exact printed Tamil turn labels, rendered beside their lines.
 */

type Item =
  | { kind: "story-summary"; slug: "story-summary" }
  | { kind: "performance"; slug: string; sourceOrder: number };

export default function ManthiriKumariReader({ reader, slug }: { reader: ManthiriReader; slug: string }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [showEn, setShowEn] = useState(false);

  // Ordered navigation list, registry-driven: story summary first, then the 15 performances in
  // source occurrence order.
  const items: Item[] = [
    { kind: "story-summary", slug: "story-summary" },
    ...reader.performances.map((p) => ({ kind: "performance" as const, slug: `performance-${String(p.sourceOrder).padStart(2, "0")}`, sourceOrder: p.sourceOrder })),
  ];
  const i = items.findIndex((x) => x.slug === slug);
  const cur = items[i];
  const prev = i > 0 ? items[i - 1] : null;
  const next = i >= 0 && i < items.length - 1 ? items[i + 1] : null;

  const label = (it: Item) =>
    it.kind === "story-summary"
      ? ta ? reader.storySummary.titleTa : reader.storySummary.titleEn
      : (() => { const p = reader.performances.find((x) => x.sourceOrder === (it as { sourceOrder: number }).sourceOrder)!; return p.headingTa; })();

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label={ta ? "வழிசெலுத்தல்" : "Navigation"} className="mb-8 text-sm" data-print="hide">
        <Link href="/cinema/manthiri-kumari" className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">
          {reader.work.titleTa}
        </Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light">
          <span lang={lang}>{ta ? "மின்னூலகம்" : "The library"}</span>
        </Link>
      </nav>

      <article>
        {cur?.kind === "story-summary" ? (
          <StorySummary reader={reader} ta={ta} showEn={showEn} setShowEn={setShowEn} />
        ) : cur?.kind === "performance" ? (
          <Performance reader={reader} sourceOrder={cur.sourceOrder} ta={ta} showEn={showEn} setShowEn={setShowEn} />
        ) : null}

        <nav aria-label={ta ? "காட்சி வழிசெலுத்தல்" : "Section navigation"} className="mt-12 flex items-center justify-between gap-4 border-t border-ink/10 pt-6 text-sm dark:border-white/10" data-print="hide">
          {prev ? (
            <Link href={`/cinema/manthiri-kumari/${prev.slug}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">
              ← {label(prev)}
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/cinema/manthiri-kumari/${next.slug}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">
              {label(next)} →
            </Link>
          ) : <span />}
        </nav>

        <div className="mt-8 text-xs leading-relaxed text-ink/45 dark:text-night-text/45">
          <Link href="/cinema/manthiri-kumari/source" className="underline decoration-ink/20 underline-offset-2 hover:text-marina dark:decoration-white/20 dark:hover:text-marina-light" lang={lang}>
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

function StorySummary({ reader, ta, showEn, setShowEn }: { reader: ManthiriReader; ta: boolean; showEn: boolean; setShowEn: (b: boolean) => void }) {
  const ss = reader.storySummary;
  return (
    <>
      <h1 className="font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">{ss.titleTa}</h1>
      <p className="mt-1 font-body text-xs uppercase tracking-[0.18em] text-ink/40 dark:text-night-text/40">
        {ta ? "கதைச்சுருக்கம்" : "Story summary"}
        <span className="mx-2 text-ink/25 dark:text-night-text/25">·</span>
        {ta ? `${ss.units.length} பகுதிகள்` : `${ss.units.length} units`}
      </p>
      <LangToggle showEn={showEn} setShowEn={setShowEn} />
      <div className={cn("mt-10 break-words", showEn ? "font-body text-base" : "font-tamil text-lg")} lang={showEn ? "en" : "ta"}>
        {ss.units.map((u) => (
          <p key={u.ordinal} className="mb-5 whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">
            {showEn ? u.english : u.tamil}
          </p>
        ))}
      </div>
    </>
  );
}

function Performance({ reader, sourceOrder, ta, showEn, setShowEn }: { reader: ManthiriReader; sourceOrder: number; ta: boolean; showEn: boolean; setShowEn: (b: boolean) => void }) {
  const p = reader.performances.find((x) => x.sourceOrder === sourceOrder)!;
  return (
    <>
      {/* Printed heading, verbatim — for Performance 13 this is the compound பார்த்திபன்—மந்திரிகுமாரி,
          kept distinct from the internal turn labels rendered per section below. */}
      <h1 className="font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">{p.headingTa}</h1>
      <p className="mt-1 font-body text-xs uppercase tracking-[0.18em] text-ink/40 dark:text-night-text/40">
        {/* Archive navigation, not a printed source number. */}
        {ta ? `களஞ்சிய வரிசை ${p.sourceOrder}` : `Archive navigation ${p.sourceOrder}`}
        <span className="mx-2 text-ink/25 dark:text-night-text/25">·</span>
        {ta ? `${reader.performances.length}-இல்` : `of ${reader.performances.length}`}
      </p>
      <LangToggle showEn={showEn} setShowEn={setShowEn} />

      {/* Item-level lyric authorship is UNRESOLVED for all 15 blocks — stated plainly, never as
          "not by Kalaignar" and never promoted to a Kalaignar lyric credit. */}
      <p className="mt-4 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/60 dark:border-white/15 dark:text-night-text/60" lang={ta ? "ta" : "en"}>
        {ta
          ? "இந்தக் காட்சிக்கு நூல் ஒரு தனிப் பாடலாசிரியரை உறுதிப்படுத்தவில்லை. அட்டைப் பட்டியலின் கதை–வசனப் பொறுப்பு பாடலாசிரியப் பொறுப்பை நிறுவாது."
          : "The booklet does not establish an item-level lyricist for this performance. The cover's story-and-dialogue credit does not establish song authorship."}
      </p>

      <div className={cn("mt-10 break-words", showEn ? "font-body text-base" : "font-tamil text-lg")} lang={showEn ? "en" : "ta"}>
        {p.sections.map((s) => (
          <section key={s.ordinal} className="mb-7">
            {/* The internal turn label, when the source prints one, is the EXACT printed Tamil label —
                never expanded to an English name and never merged into the heading. */}
            {s.sourceLabel && (
              <p className="mb-1.5 font-tamil text-sm font-semibold text-ink dark:text-night-text" lang="ta">{s.sourceLabel}</p>
            )}
            <p className="whitespace-pre-line leading-loose text-ink/90 dark:text-night-text/90">
              {(showEn ? s.englishLines : s.tamilLines).join("\n")}
            </p>
          </section>
        ))}
      </div>
    </>
  );
}
