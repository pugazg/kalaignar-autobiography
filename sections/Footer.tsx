"use client";

import { BookOpen, MessageSquarePlus } from "lucide-react";
import { siteMeta } from "@/data/meta";
import { useLang } from "@/lib/i18n";

export default function Footer() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <footer className="border-t border-ink/10 bg-mist/60 dark:border-white/10 dark:bg-night-surface/60">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-tamil text-xl text-marina dark:text-marina-light" lang="ta">
            {siteMeta.heroTamil}
          </p>
          <p className="mt-2 text-sm text-ink/70 dark:text-night-text/70">
            {ta
              ? "கலைஞர் மு. கருணாநிதியின் ஆறு தொகுதி சுயசரிதையின் ஊடாடும் மின்னூல வடிவம்."
              : `${siteMeta.heroTamilTransliteration}. An interactive digital edition of the complete six-volume autobiography of Kalaignar M.\u00A0Karunanidhi.`}
          </p>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="font-semibold">{ta ? "ஆசிரியர்:" : "Author:"}</dt>
            <dd className="text-ink/70 dark:text-night-text/70">{siteMeta.source.author}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">{ta ? "தொடராக வெளிவந்தது:" : "First serialised in:"}</dt>
            <dd className="text-ink/70 dark:text-night-text/70">{siteMeta.source.firstSerialisedIn}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">{ta ? "பதிப்பகம்:" : "Publisher:"}</dt>
            <dd className="text-ink/70 dark:text-night-text/70">{siteMeta.source.publisher}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">{ta ? "காலம்:" : "Period covered:"}</dt>
            <dd className="text-ink/70 dark:text-night-text/70">{siteMeta.source.periodCovered}</dd>
          </div>
        </dl>
        <div className="flex flex-col items-start gap-4">
          <a
            href="/read"
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-marina px-6 py-2.5 text-sm font-semibold text-paper shadow-md shadow-marina/25 transition-transform hover:scale-[1.03]"
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            {ta ? "வாசிப்பு அறைக்குள் நுழையுங்கள்" : "Enter the Reading Room"}
          </a>
          <p className="text-xs text-ink/55 dark:text-night-text/55">
            {ta
              ? "ஆறு தொகுதிகளின் 391 அத்தியாயங்களும் மூல தமிழில் இங்கே வாசிக்கக் கிடைக்கின்றன."
              : "All 391 chapters of the six volumes are readable here in the original Tamil."}
          </p>
          <a
            href="https://github.com/pugazg/kalaignar-autobiography/issues/new?title=Correction&labels=correction&body=Chapter%20(VN-chNN)%3A%20%0AWhat%20should%20change%3A%20%0ASource%2Freason%3A%20"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 text-xs font-medium text-marina underline-offset-2 hover:underline dark:text-marina-light"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
            {ta ? "திருத்தத்தை பரிந்துரைக்கவும்" : "Suggest a correction"}
          </a>
        </div>
      </div>
      <div className="border-t border-ink/10 py-5 text-center text-xs text-ink/55 dark:border-white/10 dark:text-night-text/55">
        <p>
          {ta
            ? "இத்தளத்தின் உள்ளடக்கம் மூல நினைவேட்டின் சுருக்கங்களும் சிறு மேற்கோள்களும் ஆகும்; எங்கும் அத்தியாய மேற்கோள்களுடன். ஏற்றப்பட்ட தொகுதிகள்: 1–6 — முழு நினைவேடு."
            : "Site content consists of original summaries of, and brief quotations from, the source memoir, with chapter citations throughout. Volumes loaded: 1\u20136 \u2014 the complete memoir."}
        </p>
        <p className="mt-1">
          {"\u00A9 "}{new Date().getFullYear()}{" \u2014 "}
          {ta
            ? "கல்வி நோக்கிலான, வணிக நோக்கமற்ற மின்னணு ஆவணமாக உருவாக்கப்பட்டது."
            : "built as an educational, non-commercial digital edition."}
        </p>
      </div>
    </footer>
  );
}
