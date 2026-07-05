"use client";

import { motion, useReducedMotion } from "framer-motion";
import * as Lucide from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Resolve a lucide icon from its string name (used by data files). */
export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = (Lucide as unknown as Record<string, Lucide.LucideIcon>)[name];
  if (!Cmp) return null;
  return <Cmp className={className} aria-hidden="true" />;
}

/** Scroll-triggered fade/rise reveal that respects reduced motion. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.6, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Signature element: bilingual section heading.
 * A large Tamil word anchors each section, paired with the English title.
 */
export function SectionHeading({
  id,
  tamil,
  eyebrow,
  title,
  lede,
}: {
  id?: string;
  tamil: string;
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <Reveal className="mx-auto mb-12 max-w-3xl text-center">
      <p className="eyebrow" id={id ? `${id}-label` : undefined}>
        {eyebrow}
      </p>
      <div className="mt-3 flex items-baseline justify-center gap-4">
        <span
          className="font-tamil text-4xl text-marina/80 dark:text-marina-light/80 sm:text-5xl"
          lang="ta"
          aria-hidden="true"
        >
          {tamil}
        </span>
      </div>
      <h2 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        {title}
      </h2>
      {lede ? (
        <p className="mt-4 text-base leading-relaxed text-ink/70 dark:text-night-text/70">
          {lede}
        </p>
      ) : null}
    </Reveal>
  );
}

/** Animated counter that counts up when scrolled into view. */
export function AnimatedCounter({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 1400;
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(Math.round(eased * value));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, reduce]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/** Simple card shell shared across sections. */
export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  return (
    <As
      className={cn(
        "rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-night-surface/80",
        className
      )}
    >
      {children}
    </As>
  );
}

/** Chapter reference chips linking into the References section. */
export function RefChips({ refs }: { refs: string[] }) {
  return (
    <p className="mt-4 flex flex-wrap gap-1.5">
      {refs.map((r) => (
        <a
          key={r}
          href="#references"
          className="focus-ring rounded-full border border-marina/30 px-2 py-0.5 text-[11px] font-medium text-marina hover:bg-marina hover:text-paper dark:text-marina-light"
          title={`See reference ${r} — Volume ${r.slice(1, 2)}, chapter ${r.split("ch")[1]}`}
        >
          {r.replace(/^v(\d)-ch/, "V$1·")}
        </a>
      ))}
    </p>
  );
}
