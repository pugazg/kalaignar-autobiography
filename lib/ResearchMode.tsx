"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Research Mode — a site-wide toggle that reveals the scholarly layer:
 * exact page ranges, extraction provenance, citations, and data downloads.
 * Persisted per visitor. Normal Mode stays calm; Research Mode stays honest.
 */
const ResearchContext = createContext<{
  research: boolean;
  setResearch: (v: boolean) => void;
}>({ research: false, setResearch: () => {} });

export function ResearchModeProvider({ children }: { children: React.ReactNode }) {
  const [research, setResearchState] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem("nn-research") === "1") setResearchState(true);
    } catch {}
  }, []);

  const setResearch = (v: boolean) => {
    setResearchState(v);
    try {
      window.localStorage.setItem("nn-research", v ? "1" : "0");
    } catch {}
  };

  return (
    <ResearchContext.Provider value={{ research, setResearch }}>
      {children}
    </ResearchContext.Provider>
  );
}

export function useResearch() {
  return useContext(ResearchContext);
}

/** Chicago-style citation for a chapter of the archive. */
export function chapterCitation(c: {
  id: string;
  volume: number;
  title: string;
  pages: string;
}) {
  return `Karunanidhi, M. நெஞ்சுக்கு நீதி (Nenjukku Neethi), Vol. ${c.volume}, "${c.title}," ${c.pages}. Kalaignar Digital Library, https://kalaignar-autobiography.vercel.app/read/${c.id}.`;
}
