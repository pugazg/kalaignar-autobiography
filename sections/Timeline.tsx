"use client";

import Image from "next/image";
import { useState } from "react";
import { timeline, type Milestone } from "@/data/timeline";
import { Card, RefChips, Reveal, SectionHeading } from "@/components/shared";
import { cn } from "@/lib/utils";

// Era filters derived from the milestone data itself (order-preserving).
const ERA_FILTERS = ["All", ...Array.from(new Set(timeline.map((m) => m.era)))];

function MilestoneCard({ m, side }: { m: Milestone; side: "left" | "right" }) {
  return (
    <Reveal
      className={cn(
        "relative md:w-[calc(50%-2.5rem)]",
        side === "left" ? "md:mr-auto" : "md:ml-auto"
      )}
    >
      {/* node on the spine */}
      <span
        className={cn(
          "absolute top-7 hidden h-3 w-3 rounded-full border-2 border-marina bg-paper dark:bg-night md:block",
          side === "left" ? "-right-[2.95rem]" : "-left-[2.95rem]"
        )}
        aria-hidden
      />
      <Card as="article">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-2xl font-medium text-marina dark:text-marina-light">
            {m.year}
          </p>
          <span className="rounded-full border border-ink/15 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink/60 dark:border-white/15 dark:text-night-text/60">
            {m.era}
          </span>
        </div>
        <h3 className="mt-1 font-display text-lg font-medium">{m.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70 dark:text-night-text/70">
          {m.summary}
        </p>
        {m.stat && (
          <p className="mt-4 flex items-baseline gap-2 rounded-xl bg-marina-faint px-4 py-2.5 dark:bg-marina/15">
            <span className="font-display text-xl font-semibold text-marina dark:text-marina-light">
              {m.stat.value}
            </span>
            <span className="text-xs text-ink/60 dark:text-night-text/60">{m.stat.label}</span>
          </p>
        )}
        {m.image && (
          <div className="mt-4 overflow-hidden rounded-xl border border-ink/10 dark:border-white/10">
            <Image
              src={`/placeholders/${m.image}`}
              alt={`Illustration: ${m.title}`}
              width={640}
              height={280}
              className="h-36 w-full object-cover"
            />
          </div>
        )}
        <RefChips refs={m.refs} />
      </Card>
    </Reveal>
  );
}

export default function Timeline() {
  const [era, setEra] = useState<string>("All");
  const items = timeline.filter((m) => era === "All" || m.era === era);

  return (
    <section id="timeline" className="mx-auto max-w-content px-4 py-24 sm:px-6" aria-labelledby="timeline-label">
      <SectionHeading
        id="timeline"
        tamil="காலம்"
        eyebrow="Timeline · 1924–1969"
        title="Forty-five years, seventeen turning points"
        lede="Every milestone below is drawn from the memoir itself, with chapter references you can follow into the source."
      />

      <div className="mb-12 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter timeline by era">
        {ERA_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setEra(f)}
            className={cn(
              "focus-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              era === f
                ? "bg-marina text-paper"
                : "border border-ink/15 text-ink/70 hover:border-marina/50 dark:border-white/15 dark:text-night-text/70"
            )}
            aria-pressed={era === f}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="relative flex flex-col gap-8">
        {/* the spine */}
        <span
          className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-marina/10 via-marina/40 to-marina/10 md:block"
          aria-hidden
        />
        {items.map((m, i) => (
          <MilestoneCard key={m.id} m={m} side={i % 2 === 0 ? "left" : "right"} />
        ))}
      </div>
    </section>
  );
}
