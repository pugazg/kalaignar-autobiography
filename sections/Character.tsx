"use client";

import { useState } from "react";
import { beliefs, traits } from "@/data/character";
import { RefChips, Reveal, SectionHeading } from "@/components/shared";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function Character() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [active, setActive] = useState(0);

  // lay the beliefs out on a circle
  const R = 150;
  const cx = 210, cy = 210;

  return (
    <section id="character" className="mx-auto max-w-content px-4 py-24 sm:px-6" aria-labelledby="character-label">
      <SectionHeading
        id="character"
        tamil="கொள்கையும் பண்பும்"
        eyebrow="The man and his beliefs"
        title="What he believed — and how he lived it"
        lede="At the centre, the convictions the movement was built on. Around them, the character the memoir documents — each trait shown not as a compliment but through a specific moment the book records."
      />

      {/* The beliefs wheel */}
      <Reveal>
        <div className="mb-16 flex justify-center">
          <svg viewBox="0 0 420 420" className="w-full max-w-lg" role="group" aria-label="Core beliefs">
            {/* spokes */}
            {beliefs.map((_, i) => {
              const a = (i / beliefs.length) * 2 * Math.PI - Math.PI / 2;
              return <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} className="stroke-marina/15" strokeWidth="1" />;
            })}
            <circle cx={cx} cy={cy} r="52" className="fill-marina" />
            <text x={cx} y={cy - 4} textAnchor="middle" className="fill-paper font-tamil" style={{ fontSize: 17 }}>கலைஞர்</text>
            <text x={cx} y={cy + 15} textAnchor="middle" className="fill-paper/80" style={{ fontSize: 10, fontFamily: "var(--font-inter)" }}>his beliefs</text>
            {beliefs.map((b, i) => {
              const a = (i / beliefs.length) * 2 * Math.PI - Math.PI / 2;
              const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
              return (
                <g key={b.id}>
                  <circle cx={x} cy={y} r="24" className="fill-mist stroke-brass/50 dark:fill-night-surface" strokeWidth="1.5" />
                  <text x={x} y={y + 4} textAnchor="middle" className="fill-marina font-tamil dark:fill-marina-light" style={{ fontSize: 13, fontWeight: 600 }}>
                    {i + 1}
                  </text>
                  <text x={x} y={y - 34} textAnchor="middle" className="fill-ink font-tamil dark:fill-night-text" style={{ fontSize: 12 }}>
                    {b.tamil}
                  </text>
                  <text x={x} y={y + 40} textAnchor="middle" className="fill-ink/55 dark:fill-night-text/55" style={{ fontSize: 8.5, fontFamily: "var(--font-inter)" }}>
                    {b.en}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </Reveal>

      {/* How he lived it — traits with documented moments */}
      <Reveal>
        <h3 className="mb-6 text-center font-display text-xl font-medium">
          {ta ? "அந்தக் கொள்கைகளை அவர் வாழ்ந்த விதம்" : "How he lived those beliefs"}
        </h3>
      </Reveal>
      <div className="mb-6 flex flex-wrap justify-center gap-1.5">
        {traits.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActive(i)}
            className={cn(
              "focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active === i ? "bg-marina text-paper" : "border border-ink/10 text-ink/60 hover:border-marina/50 dark:border-white/10 dark:text-night-text/60",
            )}
            aria-pressed={active === i}
          >
            {ta ? t.tamil : t.title}
          </button>
        ))}
      </div>
      <Reveal>
        <article className="mx-auto max-w-2xl rounded-2xl border border-ink/10 bg-white/70 p-7 text-center dark:border-white/10 dark:bg-night-surface/80">
          <p className="font-tamil text-2xl text-marina dark:text-marina-light" lang="ta">{traits[active].tamil}</p>
          <h4 className="font-display text-xl font-medium">{traits[active].title}</h4>
          <p className="mt-3 text-sm leading-relaxed text-ink/75 dark:text-night-text/75" lang={lang}>
            {ta ? traits[active].moment.ta : traits[active].moment.en}
          </p>
          <div className="mt-4 flex justify-center">
            <RefChips refs={traits[active].refs} />
          </div>
        </article>
      </Reveal>
    </section>
  );
}
