"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { siteMeta } from "@/data/meta";
import { useLang, tr } from "@/lib/i18n";
import { chromeTa } from "@/data/i18n.ta";

export default function Hero() {
  const reduce = useReducedMotion();
  const { lang } = useLang();
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-28 text-center"
      aria-label="Introduction"
    >
      {/* Layered background: soft gradient + delta contour lines */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-marina/10 via-paper to-paper dark:from-marina/20 dark:via-night dark:to-night" />
      <svg
        className="absolute inset-x-0 bottom-0 -z-10 h-2/3 w-full text-marina/[0.07] dark:text-marina-light/[0.08]"
        viewBox="0 0 1440 480"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M0 ${180 + i * 52} C 240 ${140 + i * 52}, 480 ${220 + i * 52}, 720 ${180 + i * 52} S 1200 ${140 + i * 52}, 1440 ${190 + i * 52}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* Watermark: a single Tamil glyph, faint as an embossed manuscript initial */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[4%] top-1/2 -z-10 hidden -translate-y-1/2 select-none font-tamil text-[26rem] leading-none text-marina/[0.045] dark:text-marina-light/[0.05] lg:block"
      >
        நீ
      </span>

      {/* Kalaignar: a hand-drawn line portrait (transparent ink) balancing the
          நீ glyph. Sits directly on the page — inverts to light in dark mode.
          A faint presence on phones, a fuller one on wide screens. Opacity is
          responsive, so it is set with classes rather than a motion animation. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/kalaignar-portrait.png"
        alt="Kalaignar M. Karunanidhi"
        className="pointer-events-none absolute left-[-50%] top-1/2 -z-10 w-[125vw] max-w-none -translate-y-1/2 select-none opacity-[0.07] dark:opacity-[0.11] dark:invert lg:left-[-17rem] lg:w-[52rem] lg:max-w-[56vw] lg:opacity-[0.18] lg:dark:opacity-[0.2]"
      />

      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9 }}
        className="text-[11px] font-semibold uppercase tracking-[0.35em] text-brass"
      >
        கலைஞர் மின்னூலகம் · The Kalaignar Digital Library
      </motion.p>

      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.1 }}
        className="mt-4 font-tamil text-2xl text-marina/70 dark:text-marina-light/70 sm:text-3xl"
        lang="ta"
      >
        {siteMeta.heroTamil}
      </motion.p>

      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className={
          lang === "ta"
            ? // Tamil display type needs looser leading — கொம்பு ascenders and
              // descenders clip under leading-tight — and the Tamil face.
              "mt-4 max-w-4xl font-tamil text-3xl font-semibold leading-snug tracking-normal sm:text-5xl md:text-6xl"
            : "mt-4 max-w-4xl font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl md:text-7xl"
        }
        lang={lang}
      >
        {tr(lang, "Kalaignar M. Karunanidhi’s Legacy", chromeTa.heroTitle)}
      </motion.h1>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-5 max-w-2xl text-lg text-ink/70 dark:text-night-text/70 sm:text-xl"
      >
        {tr(lang, siteMeta.subtitle, chromeTa.heroSubtitle)} —{" "}
        {tr(
          lang,
          "the story of his six-volume autobiography, told in fifteen minutes instead of six volumes and 4,234 pages.",
          chromeTa.heroLine,
        )}
      </motion.p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.45 }}
        className="mt-9 flex flex-wrap items-center justify-center gap-4"
      >
        <a
          href="#summary"
          className="focus-ring rounded-full bg-marina px-7 py-3 text-sm font-semibold text-paper shadow-lg shadow-marina/25 transition-transform hover:scale-[1.03]"
        >
          {tr(lang, "Explore the Legacy", chromeTa.exploreCta)}
        </a>
        <a
          href="/read"
          className="focus-ring rounded-full border border-marina/40 px-7 py-3 text-sm font-semibold text-marina transition-colors hover:bg-marina hover:text-paper dark:text-marina-light"
        >
          {tr(lang, "Enter the Reading Room", chromeTa.readCta)}
        </a>
        <a
          href="#timeline"
          className="focus-ring rounded-full border border-ink/15 px-7 py-3 text-sm font-semibold text-ink/80 hover:border-marina hover:text-marina dark:border-white/20 dark:text-night-text/80 dark:hover:text-marina-light"
        >
          {tr(lang, "Jump to the timeline", chromeTa.timelineCta)}
        </a>
      </motion.div>

      <a
        href="#summary"
        className="focus-ring absolute bottom-8 rounded-full p-2 text-ink/50 dark:text-night-text/50"
        aria-label="Scroll to summary"
      >
        <ChevronDown className="h-6 w-6 animate-scrollhint" aria-hidden />
      </a>
    </section>
  );
}
