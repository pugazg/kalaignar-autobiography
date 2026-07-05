"use client";

import { ResearchModeProvider } from "@/lib/ResearchMode";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ResearchModeProvider>{children}</ResearchModeProvider>;
}
