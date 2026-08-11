"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, Flower2, Home, Languages, Search, Sparkles } from "lucide-react";
import type { TpIndex, TpMalarMeta } from "@/data/tholkappiyam";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { matchesQuery } from "@/lib/transliterate";

type FtEntry = { i: string; t: string; x: string };
type AdhKey = "ezhuttu" | "sol" | "porul";

const READ_KEY = "tp:read";
const LAST_KEY = "tp:last";
const COLLAPSE_KEY = "tp:collapsed";

// Short descriptors for the two entry pieces — surfaced as subtitles + tooltips
// so a first-time reader knows what each door opens onto.
const INTRO_BLURB: Record<string, { ta: string; en: string }> = {
  "tp-aninthurai": {
    ta: "நூலுக்கு அறிஞர்கள் வழங்கிய அணிந்துரைகள்",
    en: "Scholars' forewords to the book",
  },
  "tp-pugumun": {
    ta: "கலைஞரின் முன்னுரை — பூங்காவிற்குள் நுழைவதற்கு முன்",
    en: "Kalaignar's own introduction, before you enter",
  },
};

export default function TholkappiyamLibrary() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [idx, setIdx] = useState<TpIndex | null>(null);
  const [filter, setFilter] = useState<AdhKey | "all">("all");
  const [query, setQuery] = useState("");
  const [read, setRead] = useState<Set<string>>(new Set());
  const [last, setLast] = useState<string | null>(null);
  // Which adhikāram sections are collapsed in the browse-all view (persisted).
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Full-text search: fetched lazily on first text query, cached for the session.
  const [ft, setFt] = useState<FtEntry[] | null>(null);
  const ftReq = useRef(false);

  useEffect(() => {
    fetch("/data/tholkappiyam/index.json")
      .then((r) => (r.ok ? r.json() : null))
      .then(setIdx)
      .catch(() => setIdx(null));
    try {
      setRead(new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")));
      setLast(localStorage.getItem(LAST_KEY));
      setCollapsed(new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "[]")));
    } catch {}
  }, []);

  const toggleSection = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

  const q = query.trim();
  const sutraQuery = /^\d+$/.test(q) ? Number(q) : null;

  // Lazy-load the full-text bundle only when a text (non-numeric, ≥2 char) query is typed.
  useEffect(() => {
    if (ft || ftReq.current || q.length < 2 || sutraQuery !== null) return;
    ftReq.current = true;
    fetch("/data/tholkappiyam/fulltext.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFt(d))
      .catch(() => {});
  }, [q, sutraQuery, ft]);

  const malars = idx?.malars ?? [];
  const label = (t: { ta: string; en?: string }) => (ta ? t.ta : t.en ?? t.ta);

  const textHitIds = useMemo(() => {
    if (!ft || q.length < 2 || sutraQuery !== null) return null;
    const ids = new Set<string>();
    for (const e of ft) if (matchesQuery(e.x, q)) ids.add(e.i);
    return ids;
  }, [ft, q, sutraQuery]);

  const visible = malars.filter((m) => {
    if (filter !== "all" && (m.kind !== "malar" || m.adhikaram?.key !== filter)) return false;
    if (sutraQuery !== null) return m.sutras.includes(sutraQuery);
    if (q.length >= 2) {
      if (matchesQuery(label(m.title), q) || matchesQuery(m.summary, q)) return true;
      return textHitIds?.has(m.id) ?? false;
    }
    return true;
  });
  const visibleMalars = visible.filter((m) => m.kind === "malar");
  // Browse-all view (no filter/search): group into collapsible adhikāram sections.
  const browseAll = filter === "all" && q.length < 2 && sutraQuery === null;

  // Segmented progress — grammar isn't read front-to-back, so show per-adhikāram.
  const progress = (idx?.adhikarams ?? []).map((a) => ({
    ...a,
    done: malars.filter((m) => m.adhikaram?.key === a.key && read.has(m.id)).length,
  }));

  const intros = malars.filter((m) => m.kind === "intro");
  const lastMalar = last ? malars.find((m) => m.id === last) : null;

  const chip = (active: boolean) =>
    cn(
      "focus-ring rounded-full border px-3.5 py-1 text-sm font-medium transition",
      active
        ? "border-brass bg-brass text-paper"
        : "border-ink/15 text-ink/70 hover:border-brass/50 dark:border-white/15 dark:text-night-text/70",
    );

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text">
      <header className="relative overflow-hidden border-b border-ink/10 bg-brass/[0.05] dark:border-white/10 dark:bg-brass/[0.08]">
        <Flower2 className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-brass/10 dark:text-brass/[0.12]" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-5 py-12 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href="/" className="focus-ring inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-brass dark:text-night-text/60">
              <Home className="h-3.5 w-3.5" aria-hidden /> {ta ? "கலைஞர் நூலகம்" : "Kalaignar Digital Library"}
            </Link>
            <Link href="/read" className="focus-ring inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-brass dark:text-night-text/60">
              <BookOpen className="h-3.5 w-3.5" aria-hidden /> {ta ? "வாசிப்பு அறை" : "Reading Room"}
            </Link>
            <span aria-current="page" className={cn("inline-flex items-center gap-1.5 text-xs text-brass", ta && "font-tamil")} lang={ta ? "ta" : undefined}>
              <Flower2 className="h-3.5 w-3.5" aria-hidden /> {ta ? "தொல்காப்பியப் பூங்கா" : "Tholkappiya Poonga"}
            </span>
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-brass">
            {ta ? "கலைஞரின் உரை · தொல்காப்பியம்" : "Kalaignar's commentary · Tolkāppiyam"}
          </p>
          <h1 className="mt-2 font-tamil text-4xl font-medium tracking-tight" lang="ta">தொல்காப்பியப் பூங்கா</h1>
          <p className="mt-1 font-display text-lg text-ink/60 dark:text-night-text/60">Tholkappiya Poonga</p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/70 dark:text-night-text/70">
            {ta
              ? "தொல்காப்பியம் அஞ்சி நுழையும் அடர்காடு அல்ல — கலைஞர் அதை மலர்ந்து மணக்கும் பூங்காவாகக் காட்டுகிறார். ஒவ்வொரு நூற்பாவும் ஒரு மலர்; வரலாறு, நடப்பியல் தொடர்பு, நகைச்சுவையுடன் விளக்கப்படுகிறது."
              : "Not a forest to be feared, but a garden in bloom — Kalaignar opens the Tolkāppiyam as a poonga where each sutra is a flower, explained with history, modern relevance, and his characteristic wit."}
          </p>

          {idx && (
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/55 dark:text-night-text/55">
              {[
                [`${idx.adhikarams.length}`, ta ? "அதிகாரம்" : "books"],
                [`${idx.malarCount}`, ta ? "மலர்" : "blossoms"],
                [`${idx.sutraCount}`, ta ? "நூற்பா விளக்கம்" : "sutras commented"],
                [`${idx.scanPages}`, ta ? "பக்கம்" : "pages"],
              ].map(([n, l]) => (
                <span key={l}>
                  <span className="font-semibold text-ink/80 dark:text-night-text/80">{n}</span> {l}
                </span>
              ))}
            </div>
          )}

          {idx?.english && (
            <p className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-full border border-brass/30 bg-brass/[0.06] px-3 py-1 text-xs text-ink/70 dark:text-night-text/70">
              <Languages className="h-3.5 w-3.5 text-brass" aria-hidden />
              {ta
                ? `${idx.english.blossomCount} மலர்களும் ஆங்கிலத்திலும் — ஒவ்வொரு மலரிலும் தமிழ்/English மாற்றி`
                : `All ${idx.english.blossomCount} blossoms now in English too — toggle Tamil/English in any blossom`}
            </p>
          )}
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        {/* Continue + segmented progress */}
        {(lastMalar || progress.some((p) => p.done > 0)) && (
          <div className="mb-6 grid gap-3 sm:grid-cols-[1fr,auto] sm:items-center">
            {lastMalar ? (
              <Link href={`/tholkappiyam/${lastMalar.id}`} className="focus-ring group rounded-2xl border border-brass/30 bg-brass/[0.04] px-4 py-3 hover:border-brass/60">
                <p className="text-[11px] uppercase tracking-wider text-brass">{ta ? "தொடர்ந்து வாசி" : "Continue reading"}</p>
                <p className="mt-0.5 font-tamil text-lg group-hover:text-brass" lang="ta">
                  {lastMalar.kind === "malar" ? `மலர் ${lastMalar.number} · ` : ""}{lastMalar.title.ta}
                </p>
              </Link>
            ) : <span />}
            <div className="flex flex-wrap gap-3 text-xs">
              {progress.map((p) => (
                <div key={p.key} className="min-w-[92px]">
                  <div className="flex justify-between text-ink/60 dark:text-night-text/60">
                    <span className="font-tamil" lang="ta">{p.ta}</span><span>{p.done}/{p.malarCount}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-ink/10 dark:bg-white/10">
                    <div className="h-1 rounded-full bg-brass" style={{ width: `${p.malarCount ? (p.done / p.malarCount) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sticky search + filter bar */}
        <div className="sticky top-0 z-20 -mx-5 mb-6 border-b border-ink/8 bg-paper/90 px-5 pt-3 backdrop-blur dark:border-white/8 dark:bg-night/90 sm:-mx-6 sm:px-6" data-print="hide">
        {/* Search */}
        <div className="mb-3 flex items-center gap-2 rounded-full border border-ink/15 bg-white/70 px-4 py-2.5 dark:border-white/15 dark:bg-night-surface/70">
          <Search className="h-4 w-4 shrink-0 text-ink/40 dark:text-night-text/40" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ta ? "பூங்காவில் தேடு — தலைப்பு, உரை, அல்லது நூற்பா எண்…" : "Search the garden — title, commentary, or a sutra number…"}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40 dark:placeholder:text-night-text/40"
            aria-label={ta ? "பூங்காவில் தேடு" : "Search Tholkappiya Poonga"}
            lang="ta"
          />
          {query && <button onClick={() => setQuery("")} className="focus-ring shrink-0 rounded px-1.5 text-xs text-ink/50 dark:text-night-text/50" aria-label="Clear search">✕</button>}
        </div>

        {/* Adhikāram filter */}
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <button onClick={() => setFilter("all")} className={chip(filter === "all")}>{ta ? "அனைத்தும்" : "All"}</button>
          {(idx?.adhikarams ?? []).map((a) => (
            <button key={a.key} onClick={() => setFilter(a.key as AdhKey)} className={cn(chip(filter === a.key), "font-tamil")} lang="ta">
              {a.ta}
            </button>
          ))}
        </div>
        </div>

        {sutraQuery !== null && (
          <p className="mb-4 text-xs text-ink/55 dark:text-night-text/55">
            {ta ? `நூற்பா ${sutraQuery} தொடர்பான மலர்கள்` : `Blossoms discussing sutra ${sutraQuery}`}
          </p>
        )}

        {/* Intro pieces (only when unfiltered/unsearched) */}
        {filter === "all" && q.length < 2 && sutraQuery === null && intros.length > 0 && (
          <div className="mb-6 rounded-2xl border border-brass/20 bg-brass/[0.04] p-4 dark:border-brass/25 dark:bg-brass/[0.06]">
            <p className="mb-3 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-brass">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> {ta ? "பூங்கா நடைபாதை" : "Enter the garden"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {intros.map((m) => {
                const blurb = INTRO_BLURB[m.id];
                const sub = blurb ? (ta ? blurb.ta : blurb.en) : "";
                return (
                  <Link
                    key={m.id}
                    href={`/tholkappiyam/${m.id}`}
                    title={sub || undefined}
                    className="focus-ring group flex items-start gap-3 rounded-xl border border-brass/30 bg-white/60 px-4 py-3 transition hover:border-brass/70 hover:bg-brass/[0.06] dark:bg-night-surface/50"
                  >
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-brass" aria-hidden />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="font-tamil text-[15px] font-medium group-hover:text-brass" lang="ta">{m.title.ta}</span>
                        {read.has(m.id) && <span className="shrink-0 text-brass" aria-label={ta ? "வாசித்தாயிற்று" : "Read"}>✓</span>}
                      </span>
                      {sub && (
                        <span className="mt-0.5 block text-xs leading-snug text-ink/55 dark:text-night-text/55" lang={ta ? "ta" : undefined}>{sub}</span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Malar list */}
        {!idx ? (
          <p className="text-center text-sm text-ink/50 dark:text-night-text/50">{ta ? "பூங்கா ஏற்றப்படுகிறது…" : "Opening the garden…"}</p>
        ) : visibleMalars.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink/50 dark:text-night-text/50">
            {ta ? "இந்தத் தேடலுக்கு மலர் எதுவும் இல்லை — வேறு சொல்லில் அல்லது நூற்பா எண்ணில் முயலுங்கள்." : "No blossoms match — try another word or a sutra number."}
          </p>
        ) : browseAll ? (
          <div className="space-y-3">
            {(idx.adhikarams ?? []).map((a) => {
              const rows = visibleMalars.filter((m) => m.adhikaram?.key === a.key);
              if (rows.length === 0) return null;
              const isOpen = !collapsed.has(a.key);
              const done = rows.filter((m) => read.has(m.id)).length;
              return (
                <section key={a.key} className="overflow-hidden rounded-2xl border border-ink/10 dark:border-white/10">
                  <button
                    onClick={() => toggleSection(a.key)}
                    aria-expanded={isOpen}
                    aria-label={ta ? `${a.ta} பிரிவு — ${rows.length} இல் ${done} வாசித்தது` : `${a.en} section — ${done} of ${rows.length} read`}
                    className="focus-ring flex w-full items-center gap-3 bg-white/40 px-4 py-3 text-left transition hover:bg-brass/[0.05] dark:bg-night-surface/40"
                  >
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-brass transition-transform", !isOpen && "-rotate-90")} aria-hidden />
                    <span className="font-tamil text-base font-medium" lang="ta">{a.ta}</span>
                    <span className="hidden text-xs text-ink/45 dark:text-night-text/45 sm:inline">{a.en}</span>
                    <span className="ml-auto text-xs tabular-nums text-ink/50 dark:text-night-text/50">{done}/{rows.length}</span>
                  </button>
                  {isOpen && (
                    <ul className="divide-y divide-ink/8 border-t border-ink/8 px-4 dark:divide-white/8 dark:border-white/8">
                      {rows.map((m) => (
                        <MalarRow key={m.id} m={m} ta={ta} isRead={read.has(m.id)} />
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <ul className="divide-y divide-ink/8 dark:divide-white/8">
            {visibleMalars.map((m) => (
              <MalarRow key={m.id} m={m} ta={ta} isRead={read.has(m.id)} />
            ))}
          </ul>
        )}

        {/* Provenance */}
        {idx && (
          <p className="mt-10 border-t border-ink/10 pt-5 text-xs italic leading-relaxed text-ink/45 dark:border-white/10 dark:text-night-text/45" lang={lang}>
            {ta
              ? `கலைஞரின் உரை · ${idx.publisher}, ${idx.year}. மூல அச்சுப் பக்கங்களுடன் ஒப்பிட்டுப் பதிவுசெய்யப்பட்டது. `
              : `Kalaignar's commentary · ${idx.publisher}, ${idx.year}. Transcribed and checked against the printed source. `}
            <a href={idx.sourceRepo} target="_blank" rel="noopener noreferrer" className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-brass">
              {ta ? "மூல மின்னாக்கம்" : "Source transcription"}
            </a>
          </p>
        )}
      </main>
    </div>
  );
}

function MalarRow({ m, ta, isRead }: { m: TpMalarMeta; ta: boolean; isRead: boolean }) {
  const sutraLabel =
    m.sutras.length > 0
      ? ta
        ? `நூற்பா ${m.sutras.join(", ")}`
        : `Sutra ${m.sutras.join(", ")}`
      : null;
  return (
    <li>
      <Link href={`/tholkappiyam/${m.id}`} className="focus-ring group flex items-start gap-3 py-3.5 hover:bg-brass/[0.04]">
        <span className="mt-0.5 w-9 shrink-0 text-right text-sm tabular-nums text-ink/40 dark:text-night-text/40">{m.number}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="font-tamil text-[17px] leading-snug group-hover:text-brass" lang="ta">{m.title.ta}</span>
            {isRead && <span className="shrink-0 text-brass" aria-label={ta ? "வாசித்தாயிற்று" : "Read"}>✓</span>}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink/50 dark:text-night-text/50">
            {m.adhikaram && <span className="font-tamil" lang="ta">{m.adhikaram.ta}{m.iyal ? ` · ${m.iyal}` : ""}</span>}
            {sutraLabel && <span className="rounded bg-brass/10 px-1.5 py-0.5 font-tamil text-brass" lang="ta">{sutraLabel}</span>}
            {m.pages.printStart && <span>{ta ? `பக். ${m.pages.printStart}` : `p. ${m.pages.printStart}`}</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}
