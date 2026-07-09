"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { GraphData, GraphNode } from "@/data/graph";
import { Reveal, SectionHeading } from "@/components/shared";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function RelationshipGraph() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [data, setData] = useState<GraphData | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/graph.json")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <section id="graph" className="mx-auto max-w-content px-4 py-24 sm:px-6">
        <SectionHeading
          id="graph"
          tamil="உறவுகளின் வலை"
          eyebrow="The web of a life"
          title="Who appears with whom"
          lede="A map of the people the memoir names, linked when they share chapters."
        />
        <p className="text-center text-sm text-ink/50 dark:text-night-text/50">
          {ta ? "வரைபடம் ஏற்றப்படுகிறது…" : "Loading the graph…"}
        </p>
      </section>
    );
  }

  const byId = (id: string) => data.nodes.find((n) => n.id === id);
  const selNode = sel ? byId(sel) : null;
  // edges connected to the selected node, strongest first
  const selEdges = sel
    ? data.edges
        .filter((e) => e.source === sel || e.target === sel)
        .sort((a, b) => b.weight - a.weight)
    : [];
  const connected = new Set(
    selEdges.flatMap((e) => [e.source, e.target]),
  );

  const label = (n: GraphNode) => (ta && n.ta ? n.ta : n.en);

  return (
    <section id="graph" className="mx-auto max-w-content px-4 py-24 sm:px-6" aria-labelledby="graph-label">
      <SectionHeading
        id="graph"
        tamil="உறவுகளின் வலை"
        eyebrow="The web of a life"
        title="Who appears with whom"
        lede="The people the memoir names most, linked when they share chapters — the thicker the line, the more often two lives cross on the page. Tap a figure to trace their connections and read them in context. Built from the text itself, not from outside knowledge."
      />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
            <svg viewBox="0 0 900 900" className="w-full min-w-[520px]" role="group" aria-label="Relationship graph">
            <desc>
              {`A network of ${data.nodes.length} figures the memoir names, connected when they share chapters. Strongest tie: ${data.nodes[0]?.en ?? ""}. Use the list in the side panel to explore connections.`}
            </desc>
            {/* edges */}
            {data.edges.map((e, i) => {
              const s = byId(e.source), t = byId(e.target);
              if (!s || !t) return null;
              const dim = sel && !(e.source === sel || e.target === sel);
              return (
                <line
                  key={i}
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  className={cn(
                    "transition-opacity",
                    dim ? "stroke-ink/5 dark:stroke-white/5" : "stroke-marina/25",
                  )}
                  strokeWidth={1 + e.strength * 6}
                />
              );
            })}
            {/* nodes */}
            {data.nodes.map((n) => {
              const isSel = n.id === sel;
              const dim = sel && !isSel && !connected.has(n.id);
              return (
                <g
                  key={n.id}
                  className="cursor-pointer"
                  onClick={() => setSel(isSel ? null : n.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={label(n)}
                  aria-pressed={isSel}
                  onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && setSel(isSel ? null : n.id)}
                >
                  {/* transparent halo — enlarges the touch target on mobile without changing visuals */}
                  <circle cx={n.x} cy={n.y} r={n.r + 14} fill="transparent" />
                  <circle
                    cx={n.x} cy={n.y} r={n.r}
                    className={cn(
                      "transition-all",
                      isSel ? "fill-brass stroke-paper" : dim ? "fill-marina/30" : "fill-marina stroke-paper hover:fill-brass",
                      "dark:stroke-night",
                    )}
                    strokeWidth="3"
                  />
                  <text
                    x={n.x} y={n.y - n.r - 8}
                    textAnchor="middle"
                    className={cn("fill-ink font-tamil dark:fill-night-text transition-opacity", dim && "opacity-30")}
                    style={{ fontSize: 22 }}
                  >
                    {ta && n.ta ? n.ta : n.en.split("(")[0].trim()}
                  </text>
                </g>
              );
            })}
            </svg>
          </div>
        </Reveal>

        {/* Visually-hidden text equivalent — screen-reader users get the data, not just a picture */}
        <div className="sr-only">
          <h3>{ta ? "உறவுகளின் பட்டியல்" : "List of connections"}</h3>
          <ul>
            {data.nodes.map((n) => {
              const ties = data.edges
                .filter((e) => e.source === n.id || e.target === n.id)
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 5)
                .map((e) => {
                  const other = byId(e.source === n.id ? e.target : e.source);
                  return other ? `${label(other)} (${e.weight})` : "";
                })
                .filter(Boolean)
                .join(", ");
              return (
                <li key={n.id}>
                  {label(n)} — {n.mentions} {ta ? "குறிப்புகள்" : "mentions"}, {n.chapters} {ta ? "அத்தியாயங்கள்" : "chapters"}.
                  {ties && ` ${ta ? "தொடர்புகள்" : "Connected to"}: ${ties}.`}
                </li>
              );
            })}
          </ul>
        </div>

        {/* side panel */}
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-ink/10 bg-white/70 p-6 dark:border-white/10 dark:bg-night-surface/80">
            {selNode ? (
              <>
                <p className="font-tamil text-2xl text-marina dark:text-marina-light" lang="ta">{selNode.ta}</p>
                <h3 className="font-display text-xl font-medium">{selNode.en}</h3>
                <p className="mt-1 text-sm text-ink/60 dark:text-night-text/60">{selNode.role}</p>
                <p className="mt-3 text-xs text-ink/50 dark:text-night-text/50">
                  {ta
                    ? `${selNode.mentions} குறிப்புகள் · ${selNode.chapters} அத்தியாயங்களில்`
                    : `${selNode.mentions} mentions across ${selNode.chapters} chapters`}
                </p>
                <Link
                  href={`/read/${selNode.firstChapter}`}
                  className="focus-ring mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-marina underline-offset-2 hover:underline dark:text-marina-light"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  {ta ? "முதல் தோற்றத்தில் வாசிக்க" : "Read from first appearance"}
                </Link>

                <div className="mt-5 border-t border-ink/10 pt-4 dark:border-white/10">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-night-text/45">
                    {ta ? "வலுவான தொடர்புகள்" : "Strongest connections"}
                  </p>
                  <ul className="space-y-1.5">
                    {selEdges.slice(0, 6).map((e, i) => {
                      const otherId = e.source === sel ? e.target : e.source;
                      const other = byId(otherId);
                      if (!other) return null;
                      return (
                        <li key={i}>
                          <button
                            onClick={() => setSel(otherId)}
                            className="focus-ring flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left text-sm hover:bg-mist/60 dark:hover:bg-white/5"
                          >
                            <span lang={ta ? "ta" : undefined} className={ta ? "font-tamil" : ""}>{label(other)}</span>
                            <span className="text-xs text-ink/45 dark:text-night-text/45">
                              {e.weight} {ta ? "அத்." : "ch."}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="font-tamil text-lg text-marina dark:text-marina-light">ஒரு மாந்தரைத் தேர்ந்தெடுக்கவும்</p>
                <p className="mt-1 text-sm text-ink/55 dark:text-night-text/55">
                  {ta ? "தொடர்புகளைக் காண ஒரு வட்டத்தைத் தட்டவும்." : "Tap a figure to trace how their life crosses the others across the six volumes."}
                </p>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
