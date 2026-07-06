"use client";

import { LangProvider } from "@/lib/i18n";
import { ResearchModeProvider } from "@/lib/ResearchMode";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <ResearchModeProvider>{children}</ResearchModeProvider>
    </LangProvider>
  );
}
