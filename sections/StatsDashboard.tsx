"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  assemblySplit1967,
  counters,
  numberCards,
  saidapetVotes,
  seatGrowth,
  strikeRates,
} from "@/lib/archive";
import { AnimatedCounter, Card, Icon, Reveal, SectionHeading } from "@/components/shared";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(15,23,32,0.1)",
  background: "rgba(250,247,241,0.95)",
  fontSize: 13,
};

function ChartCard({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <Card as="article" className="flex h-full flex-col">
      <h3 className="font-display text-lg font-medium">{title}</h3>
      <p className="mb-4 mt-1 text-xs text-ink/55 dark:text-night-text/55">{note}</p>
      <div className="h-64 w-full">{children}</div>
    </Card>
  );
}

export default function StatsDashboard() {
  return (
    <section id="dashboard" className="mx-auto max-w-content px-4 py-24 sm:px-6" aria-labelledby="dashboard-label">
      <SectionHeading
        id="dashboard"
        tamil="எண்கள்"
        eyebrow="Statistics dashboard"
        title="The life in numbers"
        lede="Numbers as narrative: a movement that entered the Assembly with 15 members in 1957 was governing with 184 by 1971, fell to 48 in the Emergency's wake, and returned with 167 — every figure below carries its chapter."
      />

      {/* Animated counters */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counters.map((c, i) => (
          <Reveal key={c.label} delay={i * 0.05}>
            <Card className="text-center">
              <div className="mx-auto mb-3 inline-flex rounded-xl bg-marina-faint p-3 text-marina dark:bg-marina/20 dark:text-marina-light">
                <Icon name={c.icon} className="h-6 w-6" />
              </div>
              <p className="font-display text-4xl font-semibold text-marina dark:text-marina-light">
                <AnimatedCounter value={c.value} suffix={c.suffix} />
              </p>
              <p className="mt-1 text-sm text-ink/65 dark:text-night-text/65">{c.label}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Reveal>
          <ChartCard
            title="From 15 to 138 seats"
            note="DMK Assembly strength across the arc: 1957 debut, 1967 sweep, 1971 landslide, 1977 opposition, 1996 return (V1·61, V1·128, V2·36, V3·18, V5·01)."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seatGrowth} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(14,93,99,0.06)" }} />
                <Bar dataKey="seats" fill="#0E5D63" radius={[8, 8, 0, 0]} maxBarSize={72} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Reveal>

        <Reveal delay={0.05}>
          <ChartCard
            title="The 1967 Assembly"
            note="233 seats polled: DMK 138, Congress 49, others 46 (ch. 128)."
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assemblySplit1967}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={3}
                  stroke="none"
                >
                  {assemblySplit1967.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Reveal>

        <Reveal delay={0.1}>
          <ChartCard
            title="Saidapet, February 1967"
            note="His own constituency result as he announced it that evening (ch. 128)."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={saidapetVotes}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(14,93,99,0.06)" }} />
                <Bar dataKey="votes" radius={[0, 8, 8, 0]} maxBarSize={36}>
                  {saidapetVotes.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Reveal>
      </div>

      {/* Strike-rate progress bars */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {strikeRates.map((s, i) => {
          const pct = Math.round((s.won / s.of) * 100);
          return (
            <Reveal key={s.label} delay={i * 0.05}>
              <Card>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="font-display text-lg font-semibold text-marina dark:text-marina-light">
                    {s.won}/{s.of} · {pct}%
                  </p>
                </div>
                <div
                  className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink/10 dark:bg-white/10"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={s.label}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-marina to-marina-light transition-[width] duration-1000"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>

      {/* Number cards */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {numberCards.map((n, i) => (
          <Reveal key={n.label} delay={i * 0.04}>
            <Card className="flex items-center gap-4">
              <p className="font-display text-2xl font-semibold text-brass">{n.value}</p>
              <div className="min-w-0">
                <p className="text-sm text-ink/75 dark:text-night-text/75">{n.label}</p>
                <a
                  href="#references"
                  className="focus-ring text-[11px] font-medium text-marina hover:underline dark:text-marina-light"
                >
                  {n.ref.replace("v1-", "V1·")}
                </a>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
