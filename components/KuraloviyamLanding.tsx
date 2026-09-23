"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Home, Info, ScrollText } from "lucide-react";
import type { KuraloviyamIndex, KuraloviyamUnitSummary } from "@/data/kuraloviyam";
import { kuraloviyamUnitLabel } from "@/data/kuraloviyam";
import { useLang } from "@/lib/i18n";

// The குறளோவியம் landing: title, the source qualification stated plainly, and the book's own contents —
// front matter, the 300 printed-contents entries in printed order, and the printed contents/back cover.
// Adhikaram placements are shown as archive-derived navigation, never as printed headings.
export default function KuraloviyamLanding({ index }: { index: KuraloviyamIndex }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const front = index.units.filter((u) => u.kind === "front-matter");
  const entries = index.units.filter((u) => u.kind === "entry");
  const back = index.units.filter((u) => u.kind === "back-matter");
  const firstEntry = entries[0];

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 bg-mist/40 dark:border-white/10 dark:bg-night-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
          <div className="flex items-center gap-3 text-xs text-ink/60 dark:text-night-text/60">
            <Link href="/read" className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {ta ? "மின்னூலகம்" : "The library"}
            </Link>
            <Link href="/" className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light" aria-label="Home">
              <Home className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <p className="mt-5 flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-marina dark:text-marina-light">
            <ScrollText className="h-3.5 w-3.5" aria-hidden /> {ta ? "இலக்கிய உரை" : "Literary Commentary"}
          </p>
          <h1 className="mt-2 font-tamil text-3xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">{index.titleTa}</h1>
          <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">{index.titleEn}</p>
          <p className="mt-2 text-sm text-ink/60 dark:text-night-text/60" lang={ta ? "ta" : "en"}>{ta ? index.authorTa : index.authorEn}</p>

          {/* QUALIFICATION — stated as source facts, in the same place a reader starts. Visual and textual
              verification are different claims and are never merged into one "verified" number. */}
          <p className="mt-4 max-w-2xl rounded-xl border border-dashed border-ink/20 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/20 dark:bg-white/[0.03] dark:text-night-text/65" lang={ta ? "ta" : "en"} data-testid="kuraloviyam-qualification">
            {ta
              ? `${index.scanTotal} ஸ்கேன் பக்கங்களும் காட்சிநிலையில் சரிபார்க்கப்பட்டவை; தமிழ் உரை 662 பக்கங்களில் சரிபார்க்கப்பட்டது. ஸ்கேன் 13, 14, 15, 19 மூலத்தின் நிலையான வரம்புடையவை — மூன்று கையெழுத்து முகப்புரைப் படிவங்களும் மங்கிய சொற்கள் கொண்ட ஒரு பக்கமும்; அவற்றின் வாசிக்க இயலாத சொற்கள் ஊகிக்கப்படவில்லை.`
              : `All ${index.scanTotal} scans are visually verified; the Tamil text is verified on 662 pages. Scans 13, 14, 15 and 19 are permanently limited by the source — three handwritten preface facsimiles and one page with washed-out words — and their unreadable wording is not supplied.`}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {firstEntry && (
              <Link href={`/kuraloviyam/${firstEntry.id}`} className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-marina px-4 py-1.5 text-sm font-medium text-paper hover:bg-marina/90">
                <BookOpen className="h-4 w-4" aria-hidden /> {ta ? "வாசிக்கத் தொடங்கு" : "Start reading"}
              </Link>
            )}
            <Link href="/kuraloviyam/source" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-1.5 text-sm hover:border-marina/50 dark:border-white/15">
              <Info className="h-4 w-4 text-marina" aria-hidden /> {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        <Section title={ta ? "முன்பகுதி" : "Front matter"} units={front} ta={ta} />
        <h2 className="mt-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-marina dark:text-marina-light">
          {ta ? `பொருளடக்கம் — ${entries.length} பகுதிகள்` : `Contents — ${entries.length} entries`}
        </h2>
        <p className="mt-1 text-[11px] text-ink/45 dark:text-night-text/45" lang={ta ? "ta" : "en"}>
          {ta
            ? "நூலின் அச்சிட்ட பொருளடக்க வரிசையும் சொற்களும். அதிகார இணைப்புகள் காப்பகம் பக்கங்களிலிருந்து நிறுவியவை; வேறு பதிப்பிலிருந்து நிரப்பப்படவில்லை."
            : "In the order and words of the book's printed contents. Adhikaram placements are established by the archive from the pages themselves; none is filled from another edition."}
        </p>
        <ol className="mt-3">
          {entries.map((u) => (
            <li key={u.id} className="border-b border-ink/5 last:border-0 dark:border-white/5">
              <Link href={`/kuraloviyam/${u.id}`} className="focus-ring group flex gap-3 rounded py-2.5 hover:text-marina dark:hover:text-marina-light">
                <span className="w-8 shrink-0 pt-0.5 text-right text-xs tabular-nums text-ink/40 dark:text-night-text/40">{u.number}</span>
                <span className="min-w-0">
                  <span className="block font-tamil text-[0.98rem] leading-snug text-ink/90 dark:text-night-text/90" lang="ta">{u.contentsKey}</span>
                  <span className="mt-0.5 block text-[11px] text-ink/40 dark:text-night-text/40">
                    {ta ? "அச்சுப் பக்கம்" : "printed"} {u.printedSpan[0]}
                    {u.assignments?.length ? ` · ${u.assignments.map((a) => `${ta ? "அதிகாரம்" : "Adhikaram"} ${a.chapter}`).join(", ")}` : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <Section title={ta ? "பின்பகுதி" : "End matter"} units={back} ta={ta} />
      </main>
    </div>
  );
}

function Section({ title, units, ta }: { title: string; units: KuraloviyamUnitSummary[]; ta: boolean }) {
  return (
    <>
      <h2 className="mt-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-marina first:mt-0 dark:text-marina-light">{title}</h2>
      <ul className="mt-3">
        {units.map((u) => (
          <li key={u.id} className="border-b border-ink/5 last:border-0 dark:border-white/5">
            <Link href={`/kuraloviyam/${u.id}`} className="focus-ring flex flex-wrap items-baseline gap-x-3 rounded py-2.5 text-sm hover:text-marina dark:hover:text-marina-light">
              <span className={ta ? "font-tamil" : undefined} lang={ta ? "ta" : "en"}>{kuraloviyamUnitLabel(u, ta)}</span>
              <span className="text-[11px] text-ink/40 dark:text-night-text/40">
                {ta ? "ஸ்கேன்" : "scans"} {u.scanSpan[0]}–{u.scanSpan[1]}
                {u.sourceLimitedScans?.length ? ` · ${ta ? "மூல வரம்புடைய ஸ்கேன்" : "source-limited scans"} ${u.sourceLimitedScans.join(", ")}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
