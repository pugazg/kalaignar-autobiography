"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, ChevronDown, ExternalLink, Home, Mail, Search } from "lucide-react";
import type { MurasoliIndex, MurasoliLettersIndex } from "@/data/murasoli";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { matchesQuery } from "@/lib/transliterate";

/** "Volumes 42–47" / "Volume 54" / "Volumes 42–45, 47" — contiguous runs collapsed. */
function volRange(vols: number[], ta: boolean) {
  const s = [...vols].sort((a, b) => a - b);
  const runs: string[] = [];
  for (let i = 0; i < s.length; i++) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    runs.push(i === j ? `${s[i]}` : `${s[i]}–${s[j]}`);
    i = j;
  }
  return ta ? `தொகுதி ${runs.join(", ")}` : `${s.length > 1 ? "Volumes" : "Volume"} ${runs.join(", ")}`;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${Number(d)}.${Number(m)}.${y}`;
}

export default function MurasoliLibrary() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [idx, setIdx] = useState<MurasoliIndex | null>(null);
  const [letters, setLetters] = useState<MurasoliLettersIndex | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  // "Your shelf": letters read + last read (per-device), mirroring /read.
  const [read, setRead] = useState<string[]>([]);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/murasoli/index.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: MurasoliIndex | null) => {
        setIdx(d);
        if (d?.volumes?.length) setOpen(d.volumes[0].volume);
      })
      .catch(() => setIdx(null));
    fetch("/data/murasoli/letters-index.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: MurasoliLettersIndex | null) => setLetters(d))
      .catch(() => setLetters(null));
    try {
      setRead(JSON.parse(localStorage.getItem("mu:read") || "[]"));
      setLast(localStorage.getItem("mu:last"));
    } catch {}
  }, []);

  const q = query.trim().toLowerCase();
  const label = (t: { en: string; ta: string }) => (ta ? t.ta : t.en);
  const totalLetters = letters?.volumes.reduce((n, v) => n + v.letterCount, 0) ?? 0;

  // Resolve saved letter ids to titles for the shelf.
  const letterById = new Map(
    (letters?.volumes ?? []).flatMap((v) => v.letters.map((l) => [l.id, { ...l, volume: v.volume }] as const)),
  );
  const lastLetter = last ? letterById.get(last) : null;
  const readCount = read.filter((id) => letterById.has(id)).length;

  // Derive the "what's available" copy from the data so it never goes stale as
  // volumes arrive. Letter-volumes (empty `pages`) carry full English; the
  // page-scan volumes (e.g. 54) are Tamil-only. Fallbacks match the current
  // corpus for the brief moment before the indexes finish loading.
  const allVols = idx?.volumes.map((v) => v.volume) ?? [];
  const letterVols = idx?.volumes.filter((v) => v.pages.length === 0).map((v) => v.volume) ?? [];
  const tamilOnlyVols = allVols.filter((v) => !letterVols.includes(v));
  const firstVol = allVols.length ? Math.min(...allVols) : null;
  const lastVol = allVols.length ? Math.max(...allVols) : null;
  // How each volume's Tamil was established, from the index itself: the Wave-8 volumes (42–47) are carried from
  // archival page records verified against the scanned printed volume; the others keep their original OCR pipeline.
  const verifiedVols = idx?.volumes.filter((v) => v.textProvenance === "source-verified-page-records").map((v) => v.volume) ?? [];
  const ocrVols = allVols.filter((v) => !verifiedVols.includes(v));
  // No year span is stated: the per-letter dates are not a reliable basis for one across the integrated volumes.

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 bg-mist/40 dark:border-white/10 dark:bg-night-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href="/" className="focus-ring inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60">
              <Home className="h-3.5 w-3.5" aria-hidden /> Kalaignar Digital Library
            </Link>
            <Link href="/read" className="focus-ring inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60">
              <BookOpen className="h-3.5 w-3.5" aria-hidden /> {ta ? "வாசிப்பு அறை — நெஞ்சுக்கு நீதி" : "Reading Room — Nenjukku Neethi"}
            </Link>
          </div>
          <p className="mt-5 font-tamil text-2xl text-marina/80 dark:text-marina-light/80" lang="ta">
            முரசொலி — உடன்பிறப்புகளுக்கு
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">
            {ta ? "முரசொலி கடிதங்கள்" : "Murasoli — The Letters"}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink/65 dark:text-night-text/65">
            {ta
              ? "உடன்பிறப்புகளுக்கு கலைஞர் முரசொலியில் எழுதிய கடிதங்கள் — மூல தமிழில், தொகுதி வாரியாக. இத்தொகுப்பு படிப்படியாக 54 தொகுதிகளாக விரிவடையும்."
              : "Karunanidhi's letters to udanpirappukkal, published in Murasoli — in original Tamil, volume by volume. This collection is growing toward all 54 volumes."}
          </p>
          {firstVol !== null && (
            <p className="mt-3 max-w-xl rounded-xl border border-marina/25 bg-marina/[0.05] px-4 py-2.5 text-sm text-ink/70 dark:bg-marina/10 dark:text-night-text/70" data-testid="murasoli-availability">
              {ta
                ? `54 தொகுதிகளில் தொகுதி ${firstVol} முதல் ${lastVol} வரை இப்போது வாசிக்கக் கிடைக்கின்றன${letterVols.length ? ` — ${volRange(letterVols, true)}: தமிழ் மூலத்துடன் முழு ஆங்கில மொழிபெயர்ப்பும்` : ""}${tamilOnlyVols.length ? `; ${volRange(tamilOnlyVols, true)}: தமிழ் மட்டும்` : ""}. எஞ்சிய தொகுதிகள் ஒவ்வொன்றாக வந்து சேரும்.`
                : `Volumes ${firstVol} to ${lastVol} of the fifty-four are available now${letterVols.length ? ` — ${volRange(letterVols, false)} with a full English translation alongside the authoritative Tamil` : ""}${tamilOnlyVols.length ? `; ${volRange(tamilOnlyVols, false)} in Tamil only` : ""}. The rest are on their way, each joining as its text is completed.`}
            </p>
          )}
          {idx && (
            <p className="mt-3 text-xs text-ink/45 dark:text-night-text/45">
              {ta
                ? `${idx.volumeCount} தொகுதி${totalLetters ? ` · ${totalLetters} கடிதங்கள்` : ""} · ${idx.totalPages} பக்கங்கள் இதுவரை`
                : `${idx.volumeCount} volume${idx.volumeCount > 1 ? "s" : ""}${totalLetters ? ` · ${totalLetters} letters` : ""} · ${idx.totalPages} pages so far`}
            </p>
          )}
          <Link href="/tholkappiyam" className="focus-ring mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brass underline-offset-2 hover:underline">
            {ta ? "தொல்காப்பியப் பூங்கா — கலைஞரின் உரையையும் பார்க்கவும் →" : "Also explore Tholkappiya Poonga — Kalaignar's Tolkāppiyam commentary →"}
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        {!idx ? (
          <p className="text-center text-sm text-ink/50 dark:text-night-text/50">
            {ta ? "ஏற்றப்படுகிறது…" : "Loading the collection…"}
          </p>
        ) : (
          <>
            {(lastLetter || readCount > 0) && (
              <section aria-label={ta ? "உங்கள் அலமாரி" : "Your shelf"} className="mb-6 rounded-2xl border border-marina/30 bg-marina/[0.06] p-4">
                {readCount > 0 && (
                  <div className="mb-2">
                    <p className="mb-1 text-sm text-ink/55 dark:text-night-text/55">
                      {ta ? `${readCount} / ${totalLetters} கடிதங்கள் வாசித்தவை` : `${readCount} of ${totalLetters} letters read`}
                    </p>
                    <div
                      className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-ink/10 dark:bg-white/10"
                      role="progressbar"
                      aria-valuenow={readCount}
                      aria-valuemin={0}
                      aria-valuemax={totalLetters}
                      aria-label={ta ? "வாசித்த கடிதங்கள்" : "Letters read"}
                    >
                      <div className="h-full rounded-full bg-brass" style={{ width: `${totalLetters ? (readCount / totalLetters) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
                {lastLetter && (
                  <p className="text-sm">
                    <span className="text-ink/55 dark:text-night-text/55">{ta ? "தொடர்ந்து வாசி" : "Continue reading"} · </span>
                    <Link href={`/murasoli/${lastLetter.id}`} className="focus-ring font-tamil text-marina underline-offset-2 hover:underline dark:text-marina-light" lang="ta">
                      {lastLetter.title.ta}
                    </Link>
                    <span className="text-ink/45 dark:text-night-text/45"> ({ta ? `தொகுதி ${lastLetter.volume}` : `Vol ${lastLetter.volume}`})</span>
                  </p>
                )}
              </section>
            )}

            <div className="mb-6 flex items-center gap-2 rounded-full border border-ink/15 bg-white/70 px-4 py-2.5 dark:border-white/15 dark:bg-night-surface/70" data-print="hide">
              <Search className="h-4 w-4 shrink-0 text-ink/40 dark:text-night-text/40" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ta ? "கடிதம் / பக்கத் தலைப்பில் தேடு…" : "Search letter or page titles…"}
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40 dark:placeholder:text-night-text/40"
                aria-label={ta ? "தலைப்பில் தேடு" : "Search titles"}
              />
              {query && (
                <button onClick={() => setQuery("")} className="focus-ring shrink-0 rounded px-1.5 text-xs text-ink/50 hover:text-marina dark:text-night-text/50" aria-label="Clear search">✕</button>
              )}
            </div>

            <div className="mb-6 rounded-2xl border border-dashed border-brass/50 bg-brass/[0.06] p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-brass" aria-hidden />
                <div className="text-sm leading-relaxed text-ink/75 dark:text-night-text/75" lang={lang}>
                  {/* Provenance differs by volume — stated per cohort, never as a blanket claim. */}
                  {ta ? (
                    <p data-testid="murasoli-provenance-note">
                      {verifiedVols.length > 0 && <>{volRange(verifiedVols, true)}: அச்சிட்ட நூலின் ஸ்கேனுடன் ஒப்பிட்டுச் சரிபார்க்கப்பட்ட ஆவணப் பக்கப் பதிவுகளிலிருந்து தரப்பட்டவை. </>}
                      {ocrVols.length > 0 && <>{volRange(ocrVols, true)}: அச்சு நூல்களிலிருந்து OCR தொழில்நுட்பத்தால் எடுக்கப்பட்டவை — <strong>எழுத்துப் பிழைகள் இருக்கலாம்</strong>; திருத்தங்கள் தொடர்ந்து நடைபெறுகின்றன. </>}
                      ஒவ்வொரு கடிதத்தின் மூல விவரமும் அதன் பக்கத்திலேயே உள்ளது. பிழை கண்டால் தெரிவியுங்கள்:
                    </p>
                  ) : (
                    <p data-testid="murasoli-provenance-note">
                      {verifiedVols.length > 0 && <>{volRange(verifiedVols, false)} {verifiedVols.length > 1 ? "are" : "is"} carried from archival page records verified against the scanned printed volumes. </>}
                      {ocrVols.length > 0 && <>{volRange(ocrVols, false)} {ocrVols.length > 1 ? "were" : "was"} OCR-extracted from the printed volumes — <strong>they may contain recognition errors</strong>; correction is ongoing. </>}
                      Each letter&apos;s reader carries its own source details. If you spot a mistake, please tell us:
                    </p>
                  )}
                  <a
                    href="https://github.com/pugazg/kalaignar-autobiography/issues/new?title=Murasoli%20correction&labels=correction&body=Letter%2Fpage%20id%3A%20%0AWhat%20should%20change%3A%20%0ASource%2Freason%3A%20"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded-full border border-brass/50 px-3 py-1 text-xs font-medium text-brass transition hover:bg-brass hover:text-paper"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    {ta ? "திருத்தத்தைப் பரிந்துரைக்கவும் (GitHub)" : "Suggest a correction (GitHub)"}
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {idx.volumes.map((v) => {
                const isOpen = open === v.volume;
                const volLetters = letters?.volumes.find((lv) => lv.volume === v.volume)?.letters ?? [];
                const filteredLetters = q
                  ? volLetters.filter((l) => matchesQuery(`${l.title.ta} ${l.title.en} ${l.number ?? ""}`, q))
                  : volLetters;
                const pages = q
                  ? v.pages.filter((p) => matchesQuery(`${label(p.title)} ${p.id}`, q))
                  : v.pages;
                if (q && filteredLetters.length === 0 && pages.length === 0) return null;
                const hasLetters = volLetters.length > 0;
                return (
                  <section key={v.volume} className="overflow-hidden rounded-2xl border border-ink/10 bg-white/60 dark:border-white/10 dark:bg-night-surface/60">
                    <button
                      onClick={() => setOpen(isOpen ? null : v.volume)}
                      className="focus-ring flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="font-display text-lg font-medium">
                        {ta ? `தொகுதி ${v.volume}` : `Volume ${v.volume}`}
                        <span className="text-ink/45 dark:text-night-text/45">
                          {hasLetters
                            ? <> · {volLetters.length} {ta ? "கடிதங்கள்" : "letters"} · {v.pageCount} {ta ? "பக்கங்கள்" : "pages"}</>
                            : <> · {v.pageCount} {ta ? "பக்கங்கள்" : "pages"}</>}
                        </span>
                      </span>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink/40 transition-transform dark:text-night-text/40", (isOpen || q) && "rotate-180")} aria-hidden />
                    </button>
                    {(isOpen || q) && (
                      <div className="border-t border-ink/10 px-3 py-3 dark:border-white/10">
                        {hasLetters ? (
                          <>
                            <ol>
                              {filteredLetters.map((l) => (
                                <li key={l.id}>
                                  <Link
                                    href={`/murasoli/${l.id}`}
                                    className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-mist/60 dark:hover:bg-white/5"
                                  >
                                    <Mail className="h-3.5 w-3.5 shrink-0 text-brass/60" aria-hidden />
                                    <span className="shrink-0 text-xs font-semibold text-brass/60">{l.number ?? "?"}</span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate font-tamil text-marina dark:text-marina-light" lang="ta">{l.title.ta}</span>
                                      <span className="block text-[11px] text-ink/40 dark:text-night-text/40">
                                        {l.date ? `${formatDate(l.date)} · ` : ""}{l.pageCount ?? l.pages.length} {ta ? "பக்கங்கள்" : "pages"}
                                      </span>
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ol>
                            {v.sourceUrl && (
                              <a
                                href={v.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-ink/55 hover:text-marina dark:text-night-text/55"
                              >
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                {ta ? "மூல நூல் — தமிழ் இணைய நூலகம்" : "Source volume — Tamil Digital Library"}
                              </a>
                            )}
                          </>
                        ) : null}
                        {!hasLetters && (
                          <ol className={hasLetters ? "mt-1 border-t border-ink/5 pt-2 dark:border-white/5" : ""}>
                            {pages.map((p) => (
                              <li key={p.id}>
                                <Link
                                  href={`/murasoli/${p.id}`}
                                  className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-mist/60 dark:hover:bg-white/5"
                                >
                                  <span className="shrink-0 text-xs font-semibold text-brass/50">{p.page}</span>
                                  <span className="flex-1 font-tamil text-marina dark:text-marina-light" lang={ta ? "ta" : undefined}>
                                    {label(p.title)}
                                  </span>
                                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-ink/30 dark:text-night-text/30" aria-hidden />
                                </Link>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            <p className="mt-10 rounded-xl border border-brass/30 bg-brass/[0.05] p-4 text-xs italic text-ink/55 dark:text-night-text/55">
              {ta
                ? "மூலமும் சான்றும் ஒவ்வொரு தொகுதியுடனும் கடிதத்துடனும் தரப்பட்டுள்ளன. உரிமை: நாட்டுடைமையாக்கப்பட்டது."
                : "Source and provenance details are carried with each integrated volume and letter. Rights: nationalised."}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
