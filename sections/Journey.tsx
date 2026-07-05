"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { places } from "@/data/places";
import { RefChips, Reveal, SectionHeading } from "@/components/shared";
import { cn } from "@/lib/utils";

/**
 * A schematic (not cartographic) outline of Tamil Nadu, in the site's own
 * line-drawing language — the same restraint as the hero's delta contours.
 */
const TN_OUTLINE =
  "M 300 62 C 330 70, 352 88, 350 118 C 348 150, 336 178, 330 210 C 324 244, 318 268, 306 296 C 294 326, 280 352, 262 382 C 246 408, 232 436, 214 456 C 202 470, 190 474, 182 462 C 172 448, 176 430, 170 414 C 162 392, 148 378, 136 358 C 122 336, 108 318, 100 294 C 92 270, 96 246, 106 224 C 116 200, 132 184, 148 166 C 166 146, 186 130, 208 114 C 232 96, 258 76, 288 64 C 292 62, 296 61, 300 62 Z";

export default function Journey() {
  const [sel, setSel] = useState(places[0].id);
  const active = places.find((p) => p.id === sel)!;

  return (
    <section id="journey" className="bg-mist/40 py-24 dark:bg-night-surface/40" aria-labelledby="journey-label">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading
          id="journey"
          tamil="பயணம்"
          eyebrow="The geography of a life"
          title="From a delta village to the three seas"
          lede="The places the memoir keeps returning to, plotted on a schematic map. Select a marker to see what happened there — and where the book records it."
        />
        <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <figure className="rounded-2xl border border-ink/10 bg-white/60 p-4 dark:border-white/10 dark:bg-night-surface/70">
              <svg viewBox="0 0 400 500" role="group" aria-label="Schematic map of Tamil Nadu with places from the memoir" className="w-full">
                <path d={TN_OUTLINE} className="fill-marina/[0.05] stroke-marina/40 dark:fill-marina/10" strokeWidth="1.5" />
                {/* Cauvery hint — the delta of Volume 1 */}
                <path d="M 130 250 C 180 246, 230 258, 300 292" className="stroke-marina/25" fill="none" strokeWidth="1" strokeDasharray="3 4" />
                {places.map((p) => {
                  const on = p.id === sel;
                  return (
                    <g key={p.id}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={on ? 7 : 5}
                        className={cn("cursor-pointer transition-all", on ? "fill-brass stroke-paper" : "fill-marina stroke-paper hover:fill-brass dark:stroke-night")}
                        strokeWidth="1.5"
                        role="button"
                        tabIndex={0}
                        aria-label={`${p.name} — select`}
                        aria-pressed={on}
                        onClick={() => setSel(p.id)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(p.id)}
                      />
                      {on && (
                        <text x={p.x + 11} y={p.y + 4} className="fill-ink text-[13px] font-medium dark:fill-night-text" style={{ fontFamily: "var(--font-inter)" }}>
                          {p.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
              <figcaption className="mt-2 text-center text-[11px] text-ink/45 dark:text-night-text/45">
                Schematic — positions approximate, in the spirit of a museum floor plan.
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-ink/10 bg-white/70 p-6 dark:border-white/10 dark:bg-night-surface/80">
              <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-brass">
                <MapPin className="h-3.5 w-3.5" aria-hidden /> Place
              </p>
              <p className="mt-2 font-tamil text-2xl text-marina dark:text-marina-light" lang="ta">{active.tamil}</p>
              <h3 className="font-display text-2xl font-medium">{active.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/75 dark:text-night-text/75">{active.note}</p>
              <div className="mt-4"><RefChips refs={active.refs} /></div>

              <ul className="mt-6 grid grid-cols-2 gap-1 border-t border-ink/10 pt-4 dark:border-white/10" aria-label="All places">
                {places.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => setSel(p.id)}
                      className={cn(
                        "focus-ring w-full rounded px-2 py-1 text-left text-xs transition",
                        p.id === sel ? "bg-marina/10 font-medium text-marina dark:text-marina-light" : "text-ink/60 hover:text-marina dark:text-night-text/60",
                      )}
                      aria-pressed={p.id === sel}
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
