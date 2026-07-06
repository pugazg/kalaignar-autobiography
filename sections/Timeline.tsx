"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { timeline, type Milestone } from "@/data/timeline";
import { Card, RefChips, Reveal, SectionHeading } from "@/components/shared";
import { cn } from "@/lib/utils";
import { chapterById } from "@/data/references";
import { useResearch } from "@/lib/ResearchMode";
import { useLang } from "@/lib/i18n";
import { erasTa, tagsTa, timelineTa, chromeTa } from "@/data/i18n.ta";

// Era filters derived from the milestone data itself (order-preserving).
const ERA_FILTERS = ["All", ...Array.from(new Set(timeline.map((m) => m.era)))];
const TAG_FILTERS = ["All topics", ...Array.from(new Set(timeline.flatMap((m) => m.tags ?? []))).sort()];

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
        {(m.location || m.tags) && (
          <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50 dark:text-night-text/50">
            {m.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-brass" aria-hidden /> {m.location}
              </span>
            )}
            {m.tags?.map((t) => (
              <span key={t} className="rounded-full bg-mist px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink/55 dark:bg-white/10 dark:text-night-text/55">
                {t}
              </span>
            ))}
          </p>
        )}
        <RefChips refs={m.refs} />
        <ResearchSources refs={m.refs} />
      </Card>
    </Reveal>
  );
}

export default function Timeline() {
  const [era, setEra] = useState<string>("All");
  const [tag, setTag] = useState<string>("All topics");
  const { lang } = useLang();
  const items = timeline
    .filter(
      (m) => (era === "All" || m.era === era) && (tag === "All topics" || (m.tags ?? []).includes(tag)),
    )
    .map((m) => {
      const ta = lang === "ta" ? timelineTa[m.id] : undefined;
      if (!ta) return m;
      return {
        ...m,
        title: ta.title,
        summary: ta.summary,
        stat: m.stat && ta.statLabel ? { ...m.stat, label: ta.statLabel } : m.stat,
      };
    });

  return (
    <section id="timeline" className="mx-auto max-w-content px-4 py-24 sm:px-6" aria-labelledby="timeline-label">
      <SectionHeading
        id="timeline"
        tamil="காலம்"
        eyebrow="Timeline · 1924–2005"
        title="Eighty-one years, forty-two turning points"
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

      <div className="mb-12 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Filter timeline by topic">
        {TAG_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setTag(f)}
            className={cn(
              "focus-ring rounded-full px-3 py-1 text-xs transition-colors",
              tag === f
                ? "bg-brass text-paper"
                : "border border-ink/10 text-ink/55 hover:border-brass/60 hover:text-brass dark:border-white/10 dark:text-night-text/55"
            )}
            aria-pressed={tag === f}
          >
            {lang === "ta" ? tagsTa[f] ?? f : f}
          </button>
        ))}
      </div>

      {items.length === 0 && (
        <p className="mb-8 text-center text-sm text-ink/55 dark:text-night-text/55">
          {lang === "ta" ? chromeTa.noMilestone : "No milestone carries both filters — try widening one."}
        </p>
      )}

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

function ResearchSources({ refs }: { refs: string[] }) {
  const { research } = useResearch();
  if (!research) return null;
  return (
    <p className="mt-2 border-t border-dashed border-marina/25 pt-2 font-mono text-[11px] text-marina/80 dark:text-marina-light/80">
      {refs
        .map((r) => {
          const c = chapterById.get(r);
          return c ? `${r} · ${c.pages}` : r;
        })
        .join("   ")}
    </p>
  );
}
