"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { themes } from "@/data/themes";
import { Icon, RefChips, Reveal, SectionHeading } from "@/components/shared";
import { cn } from "@/lib/utils";

export default function Themes() {
  const [open, setOpen] = useState<string | null>(themes[0]?.id ?? null);

  return (
    <section
      id="themes"
      className="bg-mist/40 py-24 dark:bg-night-surface/40"
      aria-labelledby="themes-label"
    >
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading
          id="themes"
          tamil="கருப்பொருள்"
          eyebrow="Thematic deep dives"
          title="Six ways to read one life"
          lede="Each theme condenses dozens of chapters into a narrative, its key initiatives, its achievements — and the numbers the book itself records."
        />

        <div className="flex flex-col gap-5">
          {themes.map((t, i) => {
            const isOpen = open === t.id;
            return (
              <Reveal key={t.id} delay={i * 0.03}>
                <article
                  id={`theme-${t.id}`}
                  className={cn(
                    "scroll-mt-28 rounded-2xl border bg-white/70 shadow-sm dark:bg-night-surface/80",
                    isOpen ? "border-marina" : "border-ink/10 dark:border-white/10"
                  )}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : t.id)}
                    className="focus-ring flex w-full items-center gap-4 rounded-2xl p-5 text-left sm:p-6"
                    aria-expanded={isOpen}
                    aria-controls={`theme-body-${t.id}`}
                  >
                    <span className="rounded-xl bg-marina-faint p-3 text-marina dark:bg-marina/20 dark:text-marina-light">
                      <Icon name={t.icon} className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-3">
                        <span className="font-tamil text-lg text-marina/70 dark:text-marina-light/70" lang="ta" aria-hidden>
                          {t.tamil}
                        </span>
                        <span className="font-display text-xl font-medium">{t.title}</span>
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-ink/40 transition-transform dark:text-night-text/40",
                        isOpen && "rotate-180"
                      )}
                      aria-hidden
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`theme-body-${t.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="grid gap-8 border-t border-ink/10 p-5 dark:border-white/10 sm:p-6 lg:grid-cols-[1.4fr_1fr]">
                          <div>
                            <p className="leading-relaxed text-ink/80 dark:text-night-text/80">
                              {t.narrative}
                            </p>

                            <h4 className="mt-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-marina dark:text-marina-light">
                              <Sparkles className="h-4 w-4" aria-hidden /> Key initiatives
                            </h4>
                            <ul className="mt-2 space-y-1.5">
                              {t.initiatives.map((x) => (
                                <li key={x} className="flex gap-2 text-sm text-ink/75 dark:text-night-text/75">
                                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-marina" aria-hidden />
                                  {x}
                                </li>
                              ))}
                            </ul>

                            <h4 className="mt-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-marina dark:text-marina-light">
                              <CheckCircle2 className="h-4 w-4" aria-hidden /> Notable achievements
                            </h4>
                            <ul className="mt-2 space-y-1.5">
                              {t.achievements.map((x) => (
                                <li key={x} className="flex gap-2 text-sm text-ink/75 dark:text-night-text/75">
                                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brass" aria-hidden />
                                  {x}
                                </li>
                              ))}
                            </ul>
                            <RefChips refs={t.refs} />
                          </div>

                          {/* Mini infographic: theme stats */}
                          <div className="flex flex-col gap-4">
                            {t.stats.map((s) => (
                              <div
                                key={s.label}
                                className="rounded-2xl border border-marina/20 bg-marina-faint p-5 dark:bg-marina/10"
                              >
                                <p className="font-display text-3xl font-semibold text-marina dark:text-marina-light">
                                  {s.value}
                                </p>
                                <p className="mt-1 text-sm text-ink/70 dark:text-night-text/70">{s.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
