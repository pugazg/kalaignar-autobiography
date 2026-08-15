import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp, useTheme } from "@/data/AppState";
import { api } from "@/data/client";
import { EmptyState, Eyebrow, Loading, Screen, T } from "@/components/ui";
import { radius, spacing } from "@/theme/theme";
import type { TimelineFeature, TimelineMilestone, VolumeEntry } from "@/data/types";

// Increment 2: when `manifest.features.timeline` is present the screen renders the
// real dated milestones (data/timeline.ts, exported to JSON) grouped by era, each
// deep-linking to the memoir chapter it cites. It degrades to the Increment-1
// view — the six volumes as eras from their `period` metadata — whenever the
// feature JSON is absent, still loading offline without a cache, or malformed.
export function TimelineScreen() {
  const { status, manifest, reload, chapterById } = useApp();
  const nav = useNavigation<any>();
  const c = useTheme();

  const feature = useTimelineFeature(manifest?.features.timeline ?? null);

  if (status === "loading") return <Screen><Loading label="Building the timeline…" /></Screen>;
  if (!manifest)
    return (
      <Screen>
        <EmptyState title="The timeline couldn't load" body="Check your connection." actionLabel="Try again" onAction={reload} />
      </Screen>
    );

  const showMilestones = feature.status === "ready";

  return (
    <Screen scroll>
      <Eyebrow>1924 – 2005 · Eighty-one years</Eyebrow>
      <T ta bold heading size={26} style={{ marginBottom: spacing(2) }}>காலக்கோடு</T>
      <T muted style={{ marginBottom: spacing(6) }}>
        {showMilestones
          ? "Kalaignar's life in dated milestones from the memoir. Tap an event to open the chapter."
          : "Kalaignar's life across the six volumes of the memoir. Tap an era to open its volume."}
      </T>

      {feature.status === "loading" ? (
        <Loading label="Loading the timeline…" />
      ) : showMilestones ? (
        <MilestoneList
          c={c}
          data={feature.data}
          resolves={(id) => !!chapterById(id)}
          chapterTitle={(id) => chapterById(id)?.chapter.title}
          volumeOf={(id) => chapterById(id)?.volume.n}
          onOpen={(id) => nav.navigate("Reader", { id })}
        />
      ) : (
        <EraFallback c={c} volumes={manifest.volumes} onOpen={(n) => nav.navigate("Volume", { n })} />
      )}
    </Screen>
  );
}

// ── Feature loading (offline-first via the data layer) + defensive validation ──
type FeatureState =
  | { status: "loading" }
  | { status: "ready"; data: TimelineFeature }
  | { status: "unavailable" };

function useTimelineFeature(featureUrl: string | null): FeatureState {
  const [state, setState] = useState<FeatureState>(
    featureUrl ? { status: "loading" } : { status: "unavailable" },
  );

  useEffect(() => {
    let alive = true;
    if (!featureUrl) {
      setState({ status: "unavailable" });
      return;
    }
    setState({ status: "loading" });
    api
      .feature<unknown>(featureUrl)
      .then((raw) => {
        if (!alive) return;
        const data = parseTimeline(raw);
        setState(data ? { status: "ready", data } : { status: "unavailable" });
      })
      .catch(() => {
        if (alive) setState({ status: "unavailable" }); // no cache + offline → fallback
      });
    return () => {
      alive = false;
    };
  }, [featureUrl]);

  return state;
}

/** Accept the payload only if its structure matches the contract; never coerce. */
function parseTimeline(raw: unknown): TimelineFeature | null {
  if (!raw || typeof raw !== "object") return null;
  const { eras, timeline } = raw as Record<string, unknown>;
  if (!Array.isArray(eras) || !Array.isArray(timeline) || timeline.length === 0) return null;
  for (const e of eras) {
    if (!e || typeof (e as any).id !== "string" || typeof (e as any).label !== "string") return null;
  }
  for (const m of timeline) {
    const mm = m as any;
    if (!mm || typeof mm.id !== "string" || typeof mm.era !== "string") return null;
    if (typeof mm.title !== "string" || typeof mm.year !== "string") return null;
    if (!Array.isArray(mm.refs)) return null;
  }
  return raw as TimelineFeature;
}

// ── Milestones ────────────────────────────────────────────────────────────────
function MilestoneList({
  c,
  data,
  resolves,
  chapterTitle,
  volumeOf,
  onOpen,
}: {
  c: any;
  data: TimelineFeature;
  resolves: (id: string) => boolean;
  chapterTitle: (id: string) => string | undefined;
  volumeOf: (id: string) => number | undefined;
  onOpen: (id: string) => void;
}) {
  const eraLabel = new Map(data.eras.map((e) => [e.id, e]));
  const total = data.timeline.length;
  let prevEra: string | null = null;

  return (
    <View>
      {data.timeline.map((m, i) => {
        const header = m.era !== prevEra ? eraLabel.get(m.era) : undefined;
        prevEra = m.era;
        return (
          <View key={m.id}>
            {header ? (
              <View style={{ marginTop: i === 0 ? 0 : spacing(4), marginBottom: spacing(2) }}>
                <Eyebrow>
                  {header.label}
                  {header.years ? ` · ${header.years}` : ""}
                </Eyebrow>
              </View>
            ) : null}
            <MilestoneRow
              c={c}
              m={m}
              first={i === 0}
              last={i === total - 1}
              primaryTitle={chapterTitle(m.refs[0])}
              primaryVolume={volumeOf(m.refs[0])}
              canOpen={m.refs.length > 0 && resolves(m.refs[0])}
              onOpen={() => onOpen(m.refs[0])}
            />
          </View>
        );
      })}
    </View>
  );
}

function MilestoneRow({
  c,
  m,
  first,
  last,
  primaryTitle,
  primaryVolume,
  canOpen,
  onOpen,
}: {
  c: any;
  m: TimelineMilestone;
  first: boolean;
  last: boolean;
  primaryTitle?: string;
  primaryVolume?: number;
  canOpen: boolean;
  onOpen: () => void;
}) {
  return (
    <View style={{ flexDirection: "row" }}>
      {/* Rail + node */}
      <View style={{ width: 28, alignItems: "center" }}>
        <View style={{ width: 2, height: spacing(3), backgroundColor: first ? "transparent" : c.border }} />
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.accent, borderWidth: 3, borderColor: c.bg }} />
        <View style={{ width: 2, flex: 1, backgroundColor: last ? "transparent" : c.border }} />
      </View>

      {/* Card */}
      <Pressable
        onPress={canOpen ? onOpen : undefined}
        disabled={!canOpen}
        accessibilityRole={canOpen ? "button" : undefined}
        accessibilityLabel={
          canOpen
            ? `${m.year}. ${m.title}. Opens the chapter in the reader.`
            : `${m.year}. ${m.title}.`
        }
        style={({ pressed }) => ({
          flex: 1,
          marginBottom: spacing(3),
          marginLeft: spacing(2),
          backgroundColor: c.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: c.border,
          padding: spacing(4),
          opacity: pressed && canOpen ? 0.85 : 1,
        })}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <T bold size={14} style={{ color: c.accent }}>{m.year}</T>
          {m.location ? <T muted size={12} style={{ flexShrink: 1, textAlign: "right", marginLeft: spacing(2) }}>{m.location}</T> : null}
        </View>

        <T bold size={17} style={{ marginTop: spacing(1) }}>{m.title}</T>
        <T muted size={14} style={{ marginTop: spacing(2), lineHeight: 21 }}>{m.summary}</T>

        {m.stat ? (
          <View style={{ alignSelf: "flex-start", marginTop: spacing(3), paddingVertical: spacing(1), paddingHorizontal: spacing(2), borderRadius: radius.sm, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }}>
            <T size={12}><T bold size={12} style={{ color: c.accent }}>{m.stat.value}</T>{`  ${m.stat.label}`}</T>
          </View>
        ) : null}

        {canOpen ? (
          <T ta size={13} style={{ marginTop: spacing(3), color: c.primary }}>
            {`தொகுதி ${primaryVolume ?? ""} · ${primaryTitle ?? ""} ›`}
          </T>
        ) : null}
      </Pressable>
    </View>
  );
}

// ── Fallback: six volumes as eras (Increment-1 behaviour, preserved) ───────────
function EraFallback({ c, volumes, onOpen }: { c: any; volumes: VolumeEntry[]; onOpen: (n: number) => void }) {
  const eras = [...volumes].sort((a, b) => startYear(a) - startYear(b));
  return (
    <View>
      {eras.map((v, i) => (
        <EraRow key={v.n} c={c} volume={v} first={i === 0} last={i === eras.length - 1} onPress={() => onOpen(v.n)} />
      ))}
    </View>
  );
}

function EraRow({
  c,
  volume,
  first,
  last,
  onPress,
}: {
  c: any;
  volume: VolumeEntry;
  first: boolean;
  last: boolean;
  onPress: () => void;
}) {
  return (
    <View style={{ flexDirection: "row" }}>
      {/* Rail + node */}
      <View style={{ width: 28, alignItems: "center" }}>
        <View style={{ width: 2, flex: first ? 0 : undefined, height: first ? spacing(3) : spacing(3), backgroundColor: first ? "transparent" : c.border }} />
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c.primary, borderWidth: 3, borderColor: c.bg }} />
        <View style={{ width: 2, flex: 1, backgroundColor: last ? "transparent" : c.border }} />
      </View>

      {/* Card */}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Volume ${volume.n}, ${volume.period}`}
        style={({ pressed }) => ({
          flex: 1,
          marginBottom: spacing(3),
          marginLeft: spacing(2),
          backgroundColor: c.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: c.border,
          padding: spacing(4),
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <T bold size={15} style={{ color: c.accent }}>{volume.period ?? "—"}</T>
        <T ta bold size={18} style={{ marginTop: spacing(1) }}>
          {volume.titleTa ?? `தொகுதி ${volume.n}`}
        </T>
        <T muted size={13} style={{ marginTop: spacing(2) }}>
          தொகுதி {volume.n} · {volume.chapterCount} chapters
          {volume.pages ? ` · ${volume.pages} pages` : ""}
        </T>
      </Pressable>
    </View>
  );
}

function startYear(v: VolumeEntry): number {
  const m = v.period?.match(/\d{4}/);
  return m ? parseInt(m[0], 10) : v.n;
}
