"use client";

import { Check, Copy, Download, Quote } from "lucide-react";
import { useState } from "react";
import { CITATION_FORMATS, type Citable } from "@/lib/citations";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A self-contained "Cite this chapter" widget: pick a format (Chicago, MLA,
 * BibTeX, RIS), copy to clipboard or download as a file. Used in the Reader.
 */
export default function CiteButton({ chapter }: { chapter: Citable }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [fmt, setFmt] = useState(0);
  const [copied, setCopied] = useState(false);

  const active = CITATION_FORMATS[fmt];
  const text = active.fn(chapter);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const download = () => {
    const ext = active.id === "bibtex" ? "bib" : active.id === "ris" ? "ris" : "txt";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chapter.id}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-marina/40 px-3 py-1 text-xs font-medium text-marina hover:bg-marina hover:text-paper dark:text-marina-light"
        aria-expanded={open}
      >
        <Quote className="h-3 w-3" aria-hidden />
        {lang === "ta" ? "மேற்கோள்" : "Cite"}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(92vw,26rem)] rounded-xl border border-ink/15 bg-paper p-3 shadow-xl dark:border-white/15 dark:bg-night-surface">
          <div className="mb-2 flex flex-wrap gap-1">
            {CITATION_FORMATS.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setFmt(i)}
                className={cn(
                  "focus-ring rounded-full px-2.5 py-1 text-xs font-medium transition",
                  fmt === i
                    ? "bg-marina text-paper"
                    : "border border-ink/10 text-ink/60 hover:border-marina/50 dark:border-white/10 dark:text-night-text/60",
                )}
                aria-pressed={fmt === i}
              >
                {f.label}
              </button>
            ))}
          </div>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-mist/60 p-3 text-left font-mono text-[11px] leading-relaxed text-ink/80 dark:bg-black/30 dark:text-night-text/80">
            {text}
          </pre>
          <div className="mt-2 flex gap-2">
            <button
              onClick={copy}
              className="focus-ring inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-marina px-3 py-1.5 text-xs font-medium text-paper"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? (lang === "ta" ? "நகலெடுக்கப்பட்டது" : "Copied") : lang === "ta" ? "நகலெடு" : "Copy"}
            </button>
            <button
              onClick={download}
              className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:border-marina/50 dark:border-white/15 dark:text-night-text/70"
            >
              <Download className="h-3.5 w-3.5" />
              {lang === "ta" ? "பதிவிறக்கு" : "Download"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
