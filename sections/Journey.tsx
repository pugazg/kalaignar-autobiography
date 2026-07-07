"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { places } from "@/data/places";
import { TN_DISTRICTS, TN_VIEWBOX } from "@/data/tnmap";
import { RefChips, Reveal, SectionHeading } from "@/components/shared";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { placesTa } from "@/data/i18n.ta";

export default function Journey() {
  const [sel, setSel] = useState(places[0].id);
  const { lang } = useLang();
  const active = places.find((p) => p.id === sel)!;

  return (
    <section id="journey" className="bg-mist/40 py-24 dark:bg-night-surface/40" aria-labelledby="journey-label">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading
          id="journey"
          tamil="பயணம்"
          eyebrow="The geography of a life"
          title="From a delta village to the three seas"
          lede="The places the memoir keeps returning to, plotted on the map of Tamil Nadu. Select a marker to see what happened there — and where the book records it."
        />
        <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <figure className="rounded-2xl border border-ink/10 bg-white/60 p-4 dark:border-white/10 dark:bg-night-surface/70">
              <svg viewBox={TN_VIEWBOX} role="group" aria-label="Map of Tamil Nadu with places from the memoir" className="w-full">
                {TN_DISTRICTS.map((d, i) => (
                  <path key={i} d={d} className="fill-marina/[0.06] stroke-marina/25 dark:fill-marina/10" strokeWidth="1.5" />
                ))}
                {places.map((p) => {
                  const on = p.id === sel;
                  return (
                    <g key={p.id}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={on ? 26 : 18}
                        className={cn("cursor-pointer transition-all", on ? "fill-brass stroke-paper" : "fill-marina stroke-paper hover:fill-brass dark:stroke-night")}
                        strokeWidth="5"
                        role="button"
                        tabIndex={0}
                        aria-label={`${p.name} — select`}
                        aria-pressed={on}
                        onClick={() => setSel(p.id)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(p.id)}
                      />
                      {on && (
                        <text x={p.x + 40} y={p.y + 12} className="fill-ink text-[42px] font-semibold dark:fill-night-text" style={{ fontFamily: "var(--font-inter)" }}>
                          {p.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
              <figcaption className="mt-2 text-center text-[11px] text-ink/45 dark:text-night-text/45">
                {lang === "ta" ? "தமிழ்நாடு மாவட்ட வரைபடம்; நினைவேட்டின் இடங்கள் குறிக்கப்பட்டுள்ளன." : "Tamil Nadu, by district — the places the memoir names, on real geography."}
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
              <p className="mt-3 text-sm leading-relaxed text-ink/75 dark:text-night-text/75">{lang === "ta" ? placesTa[active.id] ?? active.note : active.note}</p>
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
