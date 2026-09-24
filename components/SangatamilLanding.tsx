"use client";

import Link from "next/link";
import { BookOpen, ImageIcon, Info, ScrollText } from "lucide-react";
import type { PublicSangatamilContents } from "@/lib/wave8-public-provenance";
import { useLang } from "@/lib/i18n";

/**
 * சங்கத் தமிழ் landing and contents: the book's own sequence of 102 poem-commentary sections, framed by its front
 * matter and back cover. Each entry gives the printed pages and scans it covers and, where the section carries one,
 * the scan of its full-page illustration — an illustration is a page of the book, never a section of its own.
 */
export default function SangatamilLanding({ work }: { work: PublicSangatamilContents }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const poems = work.sections.filter((s) => s.kind === "section");
  const first = poems[0] ?? work.sections[0];
  const illustrations = work.sections.reduce((n, s) => n + s.illustrationScans.length, 0);
  const pages = work.sections.reduce((n, s) => n + s.pageCount, 0);

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6" data-testid="sangatamil-landing">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-marina dark:text-marina-light">
          <ScrollText className="h-3.5 w-3.5" aria-hidden /> {ta ? "இலக்கிய விளக்கம்" : "Literary commentary"}
        </p>
        <h1 className="mt-3 font-tamil text-3xl font-semibold leading-tight text-ink dark:text-night-text sm:text-4xl" lang="ta">{work.title.ta}</h1>
        <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">{work.title.en}</p>
        <p className="mt-2 text-sm text-ink/70 dark:text-night-text/70" lang={ta ? "ta" : "en"}>{ta ? work.author.ta : work.author.en}</p>
        <p className="mt-5 text-sm leading-relaxed text-ink/75 dark:text-night-text/75" lang={ta ? "ta" : "en"} data-testid="sangatamil-structure">
          {ta
            ? `சங்க இலக்கியப் பாடல்களுக்குக் கலைஞர் எழுதிய எளிய நடை விளக்கக் கவிதைகள் — ${poems.length} பகுதிகள், முன்பக்கங்களும் பின்னட்டையும் சேர்த்து ${pages} ஸ்கேன் பக்கங்கள் (அவற்றில் ${illustrations} முழுப்பக்க ஓவியங்கள்). ஒவ்வொரு பகுதியிலும் அவரது விளக்கக் கவிதை, மேற்கோள் காட்டப்படும் சங்கப் பாடல், அதன் மூலக் குறிப்பு, சொற்பொருள் ஆகியவை தனித்தனியே காட்டப்படுகின்றன.`
            : `Kalaignar's plain-verse retellings of Sangam poems — ${poems.length} sections, ${pages} scanned pages with the front matter and back cover (${illustrations} of them full-page illustrations). In each section his verse commentary, the Sangam poem he quotes, its printed source citation and the word-glosses are kept distinct.`}
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={`/sangatamil/${first.slug}`} className="focus-ring inline-flex items-center gap-2 rounded-full bg-marina px-5 py-2.5 text-sm font-medium text-paper hover:bg-marina/90">
            <BookOpen className="h-4 w-4" aria-hidden /> {ta ? "வாசிக்கத் தொடங்கு" : "Start reading"}
          </Link>
          <Link href="/sangatamil/source" className="focus-ring inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm text-ink/75 hover:border-marina hover:text-marina dark:border-white/20 dark:text-night-text/75">
            <Info className="h-4 w-4" aria-hidden /> {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45">
            {ta ? `பொருளடக்கம் — ${poems.length} பகுதிகள்` : `Contents — ${poems.length} sections`}
          </h2>
          <ol className="mt-4 divide-y divide-ink/10 dark:divide-white/10" data-testid="sangatamil-contents">
            {work.sections.map((s) => (
              <li key={s.slug} data-section={s.slug} data-kind={s.kind}>
                <Link href={`/sangatamil/${s.slug}`} className="focus-ring group flex gap-3 py-3">
                  <span className="w-8 shrink-0 pt-0.5 text-right text-xs tabular-nums text-ink/40 dark:text-night-text/40">{s.kind === "section" ? s.seq : "—"}</span>
                  <span className="min-w-0">
                    <span className="block font-tamil text-[15px] text-ink group-hover:text-marina dark:text-night-text" lang="ta">{s.headingTa}</span>
                    {s.headingEn && <span className="block font-display text-sm text-ink/55 dark:text-night-text/55">{s.headingEn}</span>}
                    <span className="mt-0.5 block text-[11px] text-ink/40 dark:text-night-text/40" lang={ta ? "ta" : "en"}>
                      {ta ? "அச்சுப் பக்கம்" : "printed"} {s.printedPages} · {ta ? "ஸ்கேன்" : "scans"} {s.scans[0]}–{s.scans[1]}
                      {s.illustrationScans.length > 0 && (
                        <span className="ml-1 inline-flex items-center gap-0.5" data-testid="illustration-scans">
                          · <ImageIcon className="h-3 w-3" aria-hidden /> {ta ? "ஓவியம்" : "illustration"} {s.illustrationScans.join(", ")}
                        </span>
                      )}
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
