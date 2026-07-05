"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { pillars } from "@/data/meta";
import { Icon, RefChips, Reveal, SectionHeading } from "@/components/shared";
import { cn } from "@/lib/utils";

export default function Pillars() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section
      id="pillars"
      className="bg-mist/40 py-24 dark:bg-night-surface/40"
      aria-labelledby="pillars-label"
    >
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading
          id="pillars"
          tamil="தூண்கள்"
          eyebrow="Legacy overview"
          title="The pillars of a public life"
          lede="Eight threads run through the memoir. Select a pillar to see how the book develops it — and which chapters carry it."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
          {pillars.map((p, i) => {
            const open = openId === p.id;
            return (
              <Reveal key={p.id} delay={i * 0.04} className={cn(open && "sm:col-span-2")}>
                <li className="h-full">
                  <div
                    className={cn(
                      "h-full rounded-2xl border bg-white/70 shadow-sm transition-all dark:bg-night-surface/80",
                      open
                        ? "border-marina shadow-md"
                        : "border-ink/10 hover:border-marina/40 dark:border-white/10"
                    )}
                  >
                    <button
                      onClick={() => setOpenId(open ? null : p.id)}
                      className="focus-ring flex w-full items-start gap-4 rounded-2xl p-5 text-left"
                      aria-expanded={open}
                      aria-controls={`pillar-${p.id}`}
                    >
                      <span className="rounded-xl bg-marina-faint p-2.5 text-marina dark:bg-marina/20 dark:text-marina-light">
                        <Icon name={p.icon} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="font-display text-base font-medium">{p.title}</span>
                          <span className="font-tamil text-sm text-marina/60 dark:text-marina-light/60" lang="ta" aria-hidden>
                            {p.tamil}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm text-ink/60 dark:text-night-text/60">
                          {p.short}
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0 text-ink/40 transition-transform dark:text-night-text/40",
                          open && "rotate-180"
                        )}
                        aria-hidden
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          id={`pillar-${p.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-ink/10 px-5 pb-5 pt-4 dark:border-white/10">
                            <p className="text-sm leading-relaxed text-ink/75 dark:text-night-text/75">
                              {p.detail}
                            </p>
                            <RefChips refs={p.refs} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </li>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
