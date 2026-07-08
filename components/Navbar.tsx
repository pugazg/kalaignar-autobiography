"use client";

import { BookOpen, GraduationCap, Menu, Moon, Search, Sun, X } from "lucide-react";
import { useResearch } from "@/lib/ResearchMode";
import { useLang } from "@/lib/i18n";
import { chromeTa, navTa } from "@/data/i18n.ta";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useScrollSpy } from "@/lib/useScrollSpy";

export const navSections = [
  { id: "summary", label: "Summary" },
  { id: "chronicle", label: "The Chronicle" },
  { id: "principles", label: "Principles" },
  { id: "pillars", label: "Pillars" },
  { id: "timeline", label: "Timeline" },
  { id: "world", label: "World" },
  { id: "eelam", label: "Eelam" },
  { id: "journey", label: "Journey" },
  { id: "themes", label: "Themes" },
  { id: "discover", label: "Find by theme" },
  { id: "governance", label: "Governance" },
  { id: "socialjustice", label: "Social Justice" },
  { id: "people", label: "People" },
  { id: "graph", label: "Connections" },
  { id: "character", label: "Character" },
  { id: "quotes", label: "Quotes" },
  { id: "dashboard", label: "In Numbers" },
  { id: "gallery", label: "Gallery" },
  { id: "references", label: "References" },
];

export default function Navbar({ onSearch }: { onSearch: () => void }) {
  const [progress, setProgress] = useState(0);
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useScrollSpy(navSections.map((s) => s.id));
  const { research, setResearch } = useResearch();
  const { lang, setLang } = useLang();

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefers;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Reading progress */}
      <div
        className="h-0.5 bg-marina transition-[width] duration-150 dark:bg-marina-light"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
      <nav className="glass" aria-label="Primary">
        <div className="mx-auto flex max-w-content items-center justify-between px-4 py-3 sm:px-6">
          <a href="#top" className="focus-ring flex items-baseline gap-2 rounded">
            <span className="font-tamil text-lg text-marina dark:text-marina-light" lang="ta">
              நெஞ்சுக்கு நீதி
            </span>
            <span className="hidden text-xs font-medium uppercase tracking-widest text-ink/60 dark:text-night-text/60 lg:inline">
              Kalaignar Digital Library
            </span>
          </a>

          <div className="hidden">
            {navSections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "focus-ring rounded-full px-2.5 py-1.5 text-[13px] transition-colors whitespace-nowrap",
                  active === s.id
                    ? "bg-marina text-paper"
                    : "text-ink/70 hover:text-marina dark:text-night-text/70 dark:hover:text-marina-light"
                )}
                aria-current={active === s.id ? "true" : undefined}
              >
                {lang === "ta" ? navTa[s.id] ?? s.label : s.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <a
              href="/read"
              className="focus-ring hidden items-center gap-1.5 rounded-full border border-marina/30 px-3 py-1.5 text-sm font-medium text-marina hover:bg-marina hover:text-paper dark:text-marina-light sm:inline-flex"
            >
              <BookOpen className="h-4 w-4" aria-hidden /> {lang === "ta" ? chromeTa.read : "Read"}
            </a>
            <button
              onClick={() => setLang(lang === "en" ? "ta" : "en")}
              className="focus-ring rounded-full border border-ink/15 px-2.5 py-1 text-xs font-semibold text-ink/70 hover:border-marina/50 hover:text-marina dark:border-white/15 dark:text-night-text/70"
              aria-label={lang === "en" ? "தமிழில் காட்டு" : "Switch to English"}
              lang={lang === "en" ? "ta" : "en"}
            >
              {lang === "en" ? "தமிழ்" : "EN"}
            </button>
            <button
              onClick={() => setResearch(!research)}
              className={cn(
                "focus-ring rounded-full p-2",
                research
                  ? "text-marina dark:text-marina-light"
                  : "text-ink/70 hover:text-marina dark:text-night-text/70 dark:hover:text-marina-light"
              )}
              aria-label="Toggle research mode"
              aria-pressed={research}
              title="Research mode: reveal pages, provenance and downloads"
            >
              <GraduationCap className="h-5 w-5" />
            </button>
            <button
              onClick={onSearch}
              className="focus-ring rounded-full p-2 text-ink/70 hover:text-marina dark:text-night-text/70 dark:hover:text-marina-light"
              aria-label="Search the legacy"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="focus-ring rounded-full p-2 text-ink/70 hover:text-marina dark:text-night-text/70 dark:hover:text-marina-light"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="focus-ring rounded-full p-2 text-ink/70 dark:text-night-text/70"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-ink/10 px-4 pb-4 pt-2 dark:border-white/10">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
            {navSections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "focus-ring block rounded-lg px-3 py-2 text-sm",
                  lang === "ta" ? "font-tamil" : "",
                  active === s.id
                    ? "bg-marina text-paper"
                    : "text-ink/80 dark:text-night-text/80"
                )}
              >
                {lang === "ta" ? navTa[s.id] ?? s.label : s.label}
              </a>
            ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
