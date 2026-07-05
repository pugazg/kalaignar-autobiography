"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { people } from "@/data/people";
import { RefChips, Reveal, SectionHeading } from "@/components/shared";
import { cn } from "@/lib/utils";

export default function People() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section id="people" className="mx-auto max-w-content px-4 py-24 sm:px-6" aria-labelledby="people-label">
      <SectionHeading
        id="people"
        tamil="மாந்தர்கள்"
        eyebrow="The people of the memoir"
        title="A life told through its companions"
        lede="Ten figures the six volumes keep returning to — each profile grounded in the chapters where the book itself places them."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {people.map((p, i) => {
          const isOpen = open === p.id;
          return (
            <Reveal key={p.id} delay={(i % 2) * 0.05}>
              <article className={cn("h-full rounded-2xl border bg-white/70 transition-colors dark:bg-night-surface/80", isOpen ? "border-marina/40" : "border-ink/10 dark:border-white/10")}>
                <button
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  className="focus-ring flex w-full items-start justify-between gap-3 p-5 text-left"
                  aria-expanded={isOpen}
                >
                  <div>
                    <p className="font-tamil text-lg text-marina dark:text-marina-light" lang="ta">{p.tamil}</p>
                    <h3 className="font-display text-xl font-medium">{p.name}</h3>
                    <p className="mt-0.5 text-xs uppercase tracking-wider text-brass">{p.role}</p>
                  </div>
                  <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-ink/40 transition-transform dark:text-night-text/40", isOpen && "rotate-180")} aria-hidden />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-ink/10 px-5 pb-5 pt-4 dark:border-white/10">
                        <p className="text-sm leading-relaxed text-ink/75 dark:text-night-text/75">{p.relationship}</p>
                        <p className="mt-3 text-xs text-ink/50 dark:text-night-text/50">
                          First appears · {p.firstAppears}
                        </p>
                        <div className="mt-3">
                          <RefChips refs={p.refs} />
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
    </section>
  );
}
