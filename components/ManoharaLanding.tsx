"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Clapperboard, FileText, Home, Info, Languages, Mail } from "lucide-react";
import type { ManoharaIndex, ManoharaProvenance } from "@/data/manohara";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  index: ManoharaIndex;
  source: ManoharaProvenance["source"] | null;
};

export default function ManoharaLanding({ index, source }: Props) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const segments = index.segments;
  const first = segments[0];

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 bg-mist/40 dark:border-white/10 dark:bg-night-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
          <div className="flex items-center gap-3 text-xs text-ink/60 dark:text-night-text/60">
            <Link
              href="/read"
              className="focus-ring inline-flex items-center gap-1.5 rounded hover:text-marina dark:hover:text-marina-light"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden /> {ta ? "மின்னூலகம்" : "Library"}
            </Link>
            <Link href="/" className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light" aria-label="Home">
              <Home className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <p className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-marina/70 dark:text-marina-light/70">
            <Clapperboard className="h-3.5 w-3.5" aria-hidden /> {ta ? "திரை எழுத்து" : "Cinema Writing"}
          </p>
          <h1 className="mt-2 font-tamil text-4xl font-medium tracking-tight" lang="ta">
            மனோகரா
          </h1>
          <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">Manohara</p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
            {ta
              ? "கலைஞர் மு. கருணாநிதி எழுதிய திரைக்கதை–வசன நூல். மூல தமிழுடன், மூலத்துடன் இணைக்கப்பட்ட ஆங்கில வாசிப்பு அடுக்குடன்."
              : "Kalaignar M. Karunanidhi's screenplay and dialogue booklet — the original Tamil, with a source-linked English reading layer."}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {first && (
              <Link
                href={`/cinema/manohara/${first.slug}`}
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-marina px-4 py-2 text-sm font-medium text-paper transition hover:bg-marina-light"
              >
                {ta ? "வாசிக்கத் தொடங்கு" : "Start reading"} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
            <Link
              href="/cinema/manohara/source"
              className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-2 text-sm text-ink/70 transition hover:border-marina/50 hover:text-marina dark:border-white/15 dark:text-night-text/70"
            >
              <Info className="h-4 w-4" aria-hidden /> {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        {/* Booklet provenance — shown strictly AS PRINTED, no interpretation. */}
        {source && (
          <section className="rounded-2xl border border-ink/10 bg-white/50 p-5 dark:border-white/10 dark:bg-night-surface/50">
            <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50">
              <FileText className="h-3.5 w-3.5" aria-hidden /> {ta ? "நூல் விவரம் — அச்சிட்டபடி" : "The booklet — as printed"}
            </h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-ink/45 dark:text-night-text/45">{ta ? "வரவு" : "Credit"}</dt>
                <dd className="font-tamil text-ink/85 dark:text-night-text/85" lang="ta">
                  {source.credit_role} · {source.credit_name}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink/45 dark:text-night-text/45">{ta ? "பதிப்பு" : "Edition"}</dt>
                <dd className="font-tamil text-ink/85 dark:text-night-text/85" lang="ta">
                  {source.edition_statement_as_printed}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink/45 dark:text-night-text/45">{ta ? "பதிப்பகம்" : "Publisher"}</dt>
                <dd className="font-tamil text-ink/85 dark:text-night-text/85" lang="ta">
                  {source.publisher_name}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink/45 dark:text-night-text/45">{ta ? "விலை (அச்சிட்டபடி)" : "Price (as printed)"}</dt>
                <dd className="font-tamil text-ink/85 dark:text-night-text/85" lang="ta">
                  {source.price_as_printed}
                </dd>
              </div>
            </dl>

            {/* Printed rights notice — a historical source-witness quotation only. The PRESENT
                rights status (Tamil Nadu Government nationalisation) is a different fact, shown
                on /cinema/manohara/source. */}
            <div className="mt-4 rounded-xl border-l-4 border-ink/20 bg-ink/[0.03] py-2.5 pl-4 pr-4 dark:border-white/20 dark:bg-white/[0.03]">
              <p className="text-[11px] uppercase tracking-wider text-ink/45 dark:text-night-text/45">
                {ta ? "இப்பதிப்பில் உரிமை அறிவிப்பு — அச்சிட்டபடி" : "Rights notice in this edition — as printed"}
              </p>
              <p className="mt-1 font-tamil text-sm text-ink/80 dark:text-night-text/80" lang="ta">
                “{source.rights_notice_as_printed}”
              </p>
              <p className="mt-1.5 text-[11px] leading-snug text-ink/45 dark:text-night-text/45" lang={lang}>
                {ta ? (
                  <>கலைஞரின் படைப்புகள் தமிழ்நாடு அரசால் தேசியமயமாக்கப்பட்டுள்ளன — தற்போதைய உரிமை நிலைக்கு <Link href="/cinema/manohara/source" className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina">மூலப் பக்கம்</Link> காண்க.</>
                ) : (
                  <>Kalaignar's works have since been nationalised by the Government of Tamil Nadu — see the <Link href="/cinema/manohara/source" className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina dark:hover:text-marina-light">source page</Link> for present rights status.</>
                )}
              </p>
            </div>
          </section>
        )}

        {/* Language availability. */}
        <section className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-marina/30 bg-marina/5 px-3 py-1 text-marina dark:text-marina-light">
            <Languages className="h-3.5 w-3.5" aria-hidden /> {ta ? "தமிழ் — முழுமை (மூலம்)" : "Tamil — complete (source)"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 text-ink/65 dark:border-white/15 dark:text-night-text/65">
            {ta ? "ஆங்கிலம் — முழுமை (இத்திட்டத்திற்காக உருவாக்கப்பட்ட மூல இணைப்பு)" : "English — complete (project-created, source-linked)"}
          </span>
        </section>

        {/* Archival-segmentation disclaimer — the load-bearing terminology guard. */}
        <section className="mt-4 rounded-2xl border border-dashed border-brass/50 bg-brass/[0.06] p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brass">
            <Info className="h-3.5 w-3.5" aria-hidden /> {ta ? "பகுதிகள் குறித்து" : "About the segments"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink/75 dark:text-night-text/75" lang={lang}>
            {ta
              ? `இந்நூல் ${index.segmentCount} காட்சிகளாக அச்சில் எண்ணிடப்படவில்லை. இங்குள்ள ${index.segmentCount} பகுதிகள் வாசிப்பை எளிதாக்கும் காப்பக வழிசெலுத்தல் பிரிவுகள் மட்டுமே — அச்சிடப்பட்ட காட்சி எண்கள் அல்ல.`
              : `The booklet does not number its scenes in print. The ${index.segmentCount} divisions here are archive-created navigation segments only — an aid to reading, not printed scene numbers.`}
          </p>
        </section>

        {/* Contents — all 57 archival segments. */}
        <section className="mt-8" aria-labelledby="manohara-contents">
          <h2
            id="manohara-contents"
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50"
          >
            {ta ? `உள்ளடக்கம் · ${index.segmentCount} பகுதிகள்` : `Contents · ${index.segmentCount} segments`}
          </h2>
          <ol className="grid gap-2 sm:grid-cols-2">
            {segments.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/cinema/manohara/${s.slug}`}
                  className={cn(
                    "focus-ring group flex items-baseline gap-2.5 rounded-xl border border-ink/10 bg-white/40 px-3.5 py-2.5 transition hover:border-marina/50 dark:border-white/10 dark:bg-night-surface/40",
                  )}
                >
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink/40 dark:text-night-text/40">
                    {String(s.ordinal).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wider text-ink/40 dark:text-night-text/40">
                      {ta ? `பகுதி ${s.ordinal}` : `Segment ${s.ordinal}`}
                    </span>
                    <span className="block truncate font-tamil text-sm text-ink/85 group-hover:text-marina dark:text-night-text/85 dark:group-hover:text-marina-light" lang="ta">
                      {s.readerLabelTa}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* Cross-links to Kalaignar's other works. */}
        <div className="mt-10 rounded-2xl border border-ink/10 bg-white/40 p-4 dark:border-white/10 dark:bg-night-surface/40">
          <p className="text-[11px] uppercase tracking-wider text-marina dark:text-marina-light">
            {ta ? "கலைஞர் வேறிடங்களில்" : "Elsewhere Kalaignar writes"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Link href="/read/nenjukku-neethi" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-marina/50 dark:border-white/15" lang={lang}>
              <BookOpen className="h-3.5 w-3.5 text-marina" aria-hidden /> {ta ? "நெஞ்சுக்கு நீதி" : "Nenjukku Neethi"}
            </Link>
            <Link href="/murasoli" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-marina/50 dark:border-white/15" lang={lang}>
              <Mail className="h-3.5 w-3.5 text-marina" aria-hidden /> {ta ? "முரசொலி கடிதங்கள்" : "Murasoli letters"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
