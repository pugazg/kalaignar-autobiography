"use client";

import { Globe, MapPin } from "lucide-react";
import { useState } from "react";
import { worldEvents, worldScopeLabels, type WorldScope } from "@/data/world";
import { RefChips, Reveal, SectionHeading } from "@/components/shared";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SCOPES = ["all", "world", "india"] as const;

export default function AgainstTheWorld() {
  const [scope, setScope] = useState<string>("all");
  const { lang } = useLang();
  const t = (o: { en: string; ta: string }) => (lang === "ta" ? o.ta : o.en);

  const items = worldEvents.filter((e) => scope === "all" || e.scope === scope);

  return (
    <section id="world" className="mx-auto max-w-content px-4 py-24 sm:px-6" aria-labelledby="world-label">
      <SectionHeading
        id="world"
        tamil="உலகின் பின்னணியில்"
        eyebrow="A life against its times"
        title="The memoir set against national and world history"
        lede="Karunanidhi dates his own story by the world's clock — born the year Hitler wrote Mein Kampf, coming of age as the Second World War began, responding to the China war, Bangladesh, Gorbachev and Ayodhya as they happened. Every connection below is drawn from the chapter where the book itself makes it."
      />

      <div className="mb-10 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Filter by scope">
        {SCOPES.map((sc) => (
          <button
            key={sc}
            onClick={() => setScope(sc)}
            className={cn(
              "focus-ring inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              scope === sc
                ? "bg-marina text-paper"
                : "border border-ink/10 text-ink/60 hover:border-marina/50 hover:text-marina dark:border-white/10 dark:text-night-text/60",
            )}
            aria-pressed={scope === sc}
          >
            {sc === "world" && <Globe className="h-3.5 w-3.5" aria-hidden />}
            {sc === "india" && <MapPin className="h-3.5 w-3.5" aria-hidden />}
            {sc === "all"
              ? lang === "ta" ? "அனைத்தும்" : "All"
              : t(worldScopeLabels[sc as WorldScope])}
          </button>
        ))}
      </div>

      {/* A center spine with alternating cards — his life threaded through world time */}
      <div className="relative mx-auto max-w-4xl">
        <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-brass/50 via-marina/30 to-transparent md:left-1/2" aria-hidden />
        <ol className="space-y-6">
          {items.map((e, i) => (
            <Reveal key={e.id} delay={(i % 2) * 0.05}>
              <li
                className={cn(
                  "relative pl-12 md:w-1/2",
                  i % 2 === 0 ? "md:pr-10 md:pl-0 md:text-right" : "md:ml-auto md:pl-10",
                )}
              >
                <span
                  className={cn(
                    "absolute top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-paper text-paper shadow dark:border-night",
                    e.scope === "world" ? "bg-marina" : "bg-brass",
                    "left-0 md:left-auto",
                    i % 2 === 0 ? "md:-right-4" : "md:-left-4",
                  )}
                  aria-hidden
                >
                  {e.scope === "world" ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                </span>
                <div className="rounded-2xl border border-ink/10 bg-white/70 p-5 dark:border-white/10 dark:bg-night-surface/80">
                  <div className={cn("flex items-baseline gap-2", i % 2 === 0 ? "md:justify-end" : "")}>
                    <span className="font-display text-lg font-semibold text-brass">{e.year}</span>
                    <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink/60 dark:bg-white/10 dark:text-night-text/60">
                      {t(worldScopeLabels[e.scope])}
                    </span>
                  </div>
                  <p className={cn("mt-1 font-medium", lang === "ta" ? "font-tamil text-lg" : "")} lang={lang}>
                    {t(e.event)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
                    {t(e.connection)}
                  </p>
                  <div className={cn("mt-3 flex", i % 2 === 0 ? "md:justify-end" : "")}>
                    <RefChips refs={e.refs} />
                  </div>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
