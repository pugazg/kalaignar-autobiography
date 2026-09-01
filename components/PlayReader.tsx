"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Drama, Home, List, Minus, Plus } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import type { Play, PlayOpeningNote, PlayReadingUnit, PlayUnit } from "@/data/plays";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OBSTRUCTION = "⟦later library stamp obscures leading letters⟧";

/**
 * Renders one printed scene of the stage play.
 *
 * The four printed unit kinds are kept visually distinct — a stage direction must never read as
 * speech, and speech must never read as direction. The speaker label is rendered EXACTLY as the
 * edition prints it, including its inconsistent abbreviations; where the edition prints no label
 * (a speech resuming after the two-column break) none is shown and none is invented.
 */
export default function PlayReader({
  play, scene, prev, next,
}: { play: Play; scene: PlayReadingUnit; prev: PlayReadingUnit | null; next: PlayReadingUnit | null }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [font, setFont] = useState(1);
  // Source-first: the verified Tamil is authoritative and is the default reading layer.
  const [showEn, setShowEn] = useState(false);

  const sizes = ["text-base", "text-lg", "text-xl"];
  const units = showEn ? scene.english.units : scene.tamil.units;
  // Printed pre-dramatic material reads at the head of the unit the source prints it before. It is
  // source text, but it is NOT a scene: it carries no number and never joins the scene navigation.
  const openingNote: PlayOpeningNote | null =
    play.openingNote && play.openingNote.attachedTo === scene.slug ? play.openingNote : null;
  const openingUnits = openingNote ? (showEn ? openingNote.english.units : openingNote.tamil.units) : [];
  const continuous = scene.kind === "continuous-body";
  const notes = scene.english.notes;
  const heading = showEn ? scene.headingEn ?? scene.headingTa : scene.headingTa;
  const title = showEn ? scene.titleEn : scene.titleTa;
  const setting = showEn ? scene.settingEn : scene.settingTa;

  /**
   * Splits text on the source-obstruction marker so the marker itself renders as visible archival
   * evidence. It carries NO `data-print="hide"` — it must survive Print and Save-as-PDF, because a
   * printed page that silently drops it would assert a completeness the source does not have.
   */
  const withObstruction = (text: string) =>
    text.split(OBSTRUCTION).flatMap((part, i) =>
      i === 0
        ? [<span key={`t${i}`}>{part}</span>]
        : [
            <span
              key={`o${i}`}
              className="mx-0.5 inline-flex items-baseline rounded border border-dashed border-marina/60 bg-marina/[0.08] px-1 text-[0.72em] font-medium not-italic tracking-tight text-marina dark:text-marina-light"
              title={ta ? "பிற்காலப் பதிவு முத்திரை மூல எழுத்துகளை மறைக்கிறது" : "A later library stamp obscures the leading letters here"}
            >
              <span aria-hidden>⟦…⟧</span>
              <span className="sr-only">
                {ta ? "இங்கு பிற்காலப் பதிவக முத்திரை அச்செழுத்துகளை மறைக்கிறது; மறைந்த எழுத்துகள் மீட்கப்படவில்லை." : "A later library stamp obscures the printed letters here; the covered characters are not recovered."}
              </span>
            </span>,
            <span key={`t${i}`}>{part}</span>,
          ],
    );

  const renderUnit = (u: PlayUnit, i: number) => {
    if (u.kind === "ornament") {
      return (
        <p key={i} className="my-7 text-center text-lg tracking-[0.6em] text-ink/35 dark:text-night-text/35" aria-hidden>
          {u.text}
        </p>
      );
    }
    if (u.kind === "stage-direction") {
      // The edition's own delimiter is kept in the text; directions are never rewritten as prose.
      return (
        <p key={i} className={cn("my-4 whitespace-pre-line border-l-2 border-marina/30 pl-4 italic leading-relaxed text-ink/70 dark:text-night-text/70")}>
          {withObstruction(u.text)}
        </p>
      );
    }
    if (u.kind === "verse") {
      return (
        <blockquote key={i} className="my-5 whitespace-pre-line border-l-2 border-ink/20 pl-4 leading-relaxed text-ink/80 dark:border-white/20 dark:text-night-text/80">
          {withObstruction(u.text)}
        </blockquote>
      );
    }
    // Dialogue.
    return (
      <p key={i} className="my-4 leading-relaxed">
        {u.speakerAsPrinted !== null && (
          <span className="font-semibold text-marina dark:text-marina-light">{u.speakerAsPrinted}{u.speakerSeparator}</span>
        )}
        <span className="whitespace-pre-line">{withObstruction(u.text)}</span>
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={`/plays/${play.slug}`} className="focus-ring inline-flex items-center gap-1 rounded p-1.5 text-xs text-ink/60 hover:text-marina dark:text-night-text/60">
              <ArrowLeft className="h-4 w-4" aria-hidden /> <span>{ta ? "பொருளடக்கம்" : "Contents"}</span>
            </Link>
            <Link href="/" className="focus-ring rounded p-1.5 text-ink/50 hover:text-marina dark:text-night-text/50" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden />
            </Link>
            <span className="truncate font-tamil text-sm text-ink/70 dark:text-night-text/70" lang="ta">{play.title.ta}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1" data-print="hide">
            <button onClick={() => setFont((f) => Math.max(0, f - 1))} className="focus-ring rounded p-1.5 text-ink/50 hover:text-marina dark:text-night-text/50" aria-label={ta ? "எழுத்து சிறிதாக" : "Smaller text"}>
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <button onClick={() => setFont((f) => Math.min(2, f + 1))} className="focus-ring rounded p-1.5 text-ink/50 hover:text-marina dark:text-night-text/50" aria-label={ta ? "எழுத்து பெரிதாக" : "Larger text"}>
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-marina dark:text-marina-light">
          <Drama className="h-3.5 w-3.5" aria-hidden />{" "}
          {scene.kind === "closing-tableau"
            ? ta ? "நிறைவுக் காட்சி" : "Closing tableau"
            : continuous
              // A continuous work has no scene number and no "of N" — the source prints no scenes,
              // so there is nothing to count and nothing to be the first of.
              ? ta ? "தொடர் நாடகப் பகுதி" : "Continuous dramatic text"
              : ta ? `காட்சி ${scene.order} / ${play.sceneCount}` : `Scene ${scene.order} of ${play.sceneCount}`}
        </p>

        {heading && (
          <p className="mt-3 font-tamil text-sm text-ink/55 dark:text-night-text/55" lang={showEn ? "en" : "ta"}>{heading}</p>
        )}
        <h1 className={cn("mt-1 text-2xl font-semibold leading-snug text-ink dark:text-night-text sm:text-3xl", showEn ? "font-display" : "font-tamil")} lang={showEn ? "en" : "ta"}>
          {title}
        </h1>
        {setting && (
          <p className={cn("mt-1 text-base text-ink/60 dark:text-night-text/60", showEn ? "font-display" : "font-tamil")} lang={showEn ? "en" : "ta"}>
            {setting}
          </p>
        )}

        {/* The tableau is printed after காட்சி-38 without a scene number. Saying so where a reader
            meets it stops it being read as a 39th scene. */}
        {scene.kind === "closing-tableau" && (
          <p className="mt-3 inline-flex items-start gap-1.5 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-3 py-2 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={ta ? "ta" : "en"}>
            <Drama className="mt-0.5 h-3.5 w-3.5 shrink-0 text-marina" aria-hidden />
            <span>
              {ta
                ? "இது காட்சி-38-க்குப் பின் எண்ணிடப்படாமல் அச்சிடப்பட்ட தனி நிறைவுக் காட்சி; இது காட்சி-39 அல்ல."
                : "Printed after Scene 38 without a scene number — a separate closing tableau, not Scene 39."}
            </span>
          </p>
        )}

        {continuous && (
          <p className="mt-3 inline-flex items-start gap-1.5 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-3 py-2 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={ta ? "ta" : "en"}>
            <Drama className="mt-0.5 h-3.5 w-3.5 shrink-0 text-marina" aria-hidden />
            <span>
              {ta
                ? "மூலம் இவ்வாக்கத்தைக் காட்சிகளாகப் பிரிக்கவில்லை — ஒரே தொடர்ச்சியான நாடகப் பகுதியாகவே அச்சிட்டுள்ளது. இந்த முகவரிப் பெயர் வழிசெலுத்தலுக்கானது; அது மூலத்தின் காட்சி எண் அல்ல."
                : "The source prints this work without any scene division — one continuous dramatic text. This page's URL slug is navigation, not a source scene number."}
            </span>
          </p>
        )}

        <p className="mt-2 text-xs text-ink/50 dark:text-night-text/50" lang={ta ? "ta" : "en"}>
          {ta ? "மூல ஸ்கேன்" : "Source scans"} {scene.sourceScans.join(", ")}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3" data-print="hide">
          <ShareButtons title={`${play.title.ta} · ${scene.titleEn}`} path={`/plays/${play.slug}/${scene.slug}`} />
          <div className="inline-flex overflow-hidden rounded-full border border-marina/40 text-xs font-medium">
            <button onClick={() => setShowEn(false)} className={cn("focus-ring px-3 py-1 transition", !showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={!showEn} lang="ta">தமிழ்</button>
            <button onClick={() => setShowEn(true)} className={cn("focus-ring px-3 py-1 transition", showEn ? "bg-marina text-paper" : "text-marina hover:bg-marina/10 dark:text-marina-light")} aria-pressed={showEn}>English</button>
          </div>
        </div>

        <p className={cn("mt-4 rounded-xl border border-dashed px-4 py-2.5 text-xs leading-relaxed", showEn ? "border-marina/40 bg-marina/[0.06] text-ink/70 dark:text-night-text/70" : "border-ink/15 bg-ink/[0.02] text-ink/60 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/60")} lang={ta ? "ta" : "en"}>
          {showEn
            ? ta
              ? "இது திட்டத்தால் உருவாக்கப்பட்ட, தனித்து மதிப்பிடப்பட்ட ஆங்கில மொழிபெயர்ப்பு. தமிழ் மூலமே சான்றுநிலை."
              : "The project-created independent English translation, carried exactly as released. The Tamil original remains authoritative."
            : ta
              ? "கீழே அச்சுப் பதிப்பின்படி சரிபார்க்கப்பட்ட தமிழ் உரை — பேச்சாளர் பெயர்கள், சுருக்கங்கள், அரங்கக் குறிப்புகள், நிறுத்தக் குறிகள் அனைத்தும் மூலத்தின்படியே."
              : "The verified Tamil text of the printed edition — speaker labels, abbreviations, stage directions and punctuation exactly as the edition sets them."}
        </p>

        {/* THE PRINTED SCENE. Unit order and paragraph structure come from the archive's own
            assembled scene layer and are never re-split or merged here. */}
        {openingNote && (
          <section className={cn("mt-8", showEn ? "font-body" : "font-tamil", sizes[font])} lang={showEn ? "en" : "ta"} aria-label={showEn ? openingNote.labelEn : openingNote.labelTa}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45" lang={ta ? "ta" : "en"}>
              {ta ? openingNote.labelTa : openingNote.labelEn}
              <span className="ml-2 font-normal normal-case tracking-normal text-ink/35 dark:text-night-text/35">
                {ta ? "ஸ்கேன்" : "scan"} {openingNote.sourceScans.join(", ")}
              </span>
            </p>
            {openingUnits.map(renderUnit)}
            <hr className="my-8 border-ink/10 dark:border-white/10" />
          </section>
        )}

        <div className={cn("mt-8", showEn ? "font-body" : "font-tamil", sizes[font])} lang={showEn ? "en" : "ta"}>
          {units.map(renderUnit)}
        </div>

        {/* Translator/editorial apparatus. The interpretive note is the archive's own commentary —
            the source calls it "interpretive context, not translated source text" — so it is held
            apart from both Kalaignar's words and the translation. */}
        {showEn && notes.length > 0 && (
          <aside className="mt-10 rounded-2xl border border-dashed border-ink/20 bg-ink/[0.02] p-4 dark:border-white/20 dark:bg-white/[0.03]" aria-label="Translator and editorial notes — not part of Kalaignar's text">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45">
              {ta ? "மொழிபெயர்ப்பு / விளக்கக் குறிப்புகள் — கலைஞரின் உரை அல்ல" : "Translation and interpretive notes — not part of Kalaignar's text"}
            </p>
            {notes.map((n, i) => (
              <div key={i} className="mt-3">
                <p className="text-[11px] font-semibold text-ink/60 dark:text-night-text/60" lang="en">
                  {n.kind === "translation-note" ? "Translation notes" : "Interpretive note — not translated source text"}
                </p>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink/65 dark:text-night-text/65" lang="en">{n.text}</p>
              </div>
            ))}
          </aside>
        )}

        <nav className="mt-10 flex items-center justify-between gap-3 border-t border-ink/10 pt-5 dark:border-white/10" aria-label={continuous ? (ta ? "வழிசெலுத்தல்" : "Navigation") : ta ? "காட்சி வழிசெலுத்தல்" : "Scene navigation"}>
          {prev ? (
            <Link href={`/plays/${play.slug}/${prev.slug}`} className="focus-ring inline-flex max-w-[45%] items-center gap-1.5 rounded text-sm text-ink/70 hover:text-marina dark:text-night-text/70">
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate font-tamil" lang="ta">{prev.titleTa}</span>
            </Link>
          ) : <span />}
          <Link href={`/plays/${play.slug}`} className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded text-xs text-ink/55 hover:text-marina dark:text-night-text/55">
            <List className="h-3.5 w-3.5" aria-hidden /> {ta ? "பொருளடக்கம்" : "Contents"}
          </Link>
          {next ? (
            <Link href={`/plays/${play.slug}/${next.slug}`} className="focus-ring inline-flex max-w-[45%] items-center justify-end gap-1.5 rounded text-sm text-ink/70 hover:text-marina dark:text-night-text/70">
              <span className="truncate font-tamil" lang="ta">{next.titleTa}</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          ) : <span />}
        </nav>
      </article>
    </div>
  );
}
