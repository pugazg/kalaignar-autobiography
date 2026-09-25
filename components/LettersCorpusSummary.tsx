"use client";

import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import type { MurasoliCorpusSummary } from "@/lib/murasoli-corpus";
import { useLang } from "@/lib/i18n";

/**
 * The Letters category's corpus treatment (frozen R0 §6.2: corpus navigation by volume and sequence is
 * handled specially on the Letters category page).
 *
 * The category holds ONE canonical work, `murasoli-letters`. This panel only summarises that work's corpus
 * and hands off to /murasoli, which remains the detailed volume-by-volume browser; it does not duplicate the
 * letter list. The figures arrive already derived from the public Murasoli data (lib/murasoli-corpus.ts) —
 * nothing here is typed by hand, and no volume or letter is presented as a work of its own.
 */
export default function LettersCorpusSummary({ summary }: { summary: MurasoliCorpusSummary }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const { volumeCount, firstVolume, lastVolume, letterCount } = summary;
  const range = `${firstVolume}–${lastVolume}`;

  return (
    <section
      aria-labelledby="letters-corpus"
      className="mb-10 rounded-2xl border border-marina/30 bg-white/60 p-4 dark:bg-night-surface/60"
      data-testid="letters-corpus"
    >
      <h2 id="letters-corpus" className="flex items-center gap-2 text-sm font-medium">
        <Mail className="h-4 w-4 shrink-0 text-marina dark:text-marina-light" aria-hidden />
        {ta ? (
          <span className="font-tamil" lang="ta">
            முரசொலிக் கடிதங்கள் — தொகுதி, வரிசை வாரியாக
          </span>
        ) : (
          "Murasoli letters — by volume and sequence"
        )}
      </h2>
      <p className="mt-2 text-xs tabular-nums text-ink/65 dark:text-night-text/65" data-testid="letters-corpus-figures">
        {ta ? (
          <span className="font-tamil" lang="ta">
            தொகுதிகள் {range} · {volumeCount} தொகுதிகள் · {letterCount} கடிதங்கள்
          </span>
        ) : (
          `Volumes ${range} · ${volumeCount} volumes · ${letterCount} letters`
        )}
      </p>
      <p className="mt-1.5 text-xs leading-snug text-ink/65 dark:text-night-text/65" lang={ta ? "ta" : undefined}>
        {ta
          ? "இக்கடிதங்கள் ஒரே படைப்பின் பகுதிகள். முரசொலி வாசிப்பகத்தில் அவற்றைத் தொகுதி வாரியாக, அச்சு வரிசையில் படிக்கலாம்."
          : "The letters are one work in the catalogue. Read them volume by volume, in their printed sequence, in the Murasoli reader."}
      </p>
      {/* min-h-11: a 44px touch target. Dark-mode text and focus ring use night-text/70 rather than
          marina-light / ring-marina, which fall under 4.5:1 and 3:1 on the dark page — the same local
          treatment the /read shelf disclosure uses. */}
      <Link
        href="/murasoli"
        className="focus-ring mt-2 inline-flex min-h-11 items-center gap-1.5 rounded py-2 text-sm font-medium text-marina hover:underline dark:text-night-text/70 dark:focus-visible:ring-night-text/70"
        data-testid="letters-corpus-browse"
      >
        {ta ? (
          <span className="font-tamil" lang="ta">
            தொகுதி, வரிசை வாரியாகப் பார்க்க
          </span>
        ) : (
          "Browse by volume & sequence"
        )}
        <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </Link>
    </section>
  );
}
