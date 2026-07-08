"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A deliberately lightweight share affordance — an X (Twitter) intent link and
 * a copy-link button. No third-party social SDKs, no tracking scripts: keeps the
 * archive fast and ad-free. `url` defaults to the current page at runtime.
 */
export default function ShareButtons({ title, path }: { title: string; path?: string }) {
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);

  const url =
    (typeof window !== "undefined" ? window.location.origin : "https://kalaignar-autobiography.vercel.app") +
    (path ?? (typeof window !== "undefined" ? window.location.pathname : ""));

  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className="inline-flex items-center gap-1.5" role="group" aria-label={lang === "ta" ? "பகிர்" : "Share"}>
      <Share2 className="h-3.5 w-3.5 text-ink/40 dark:text-night-text/40" aria-hidden />
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring rounded-full border border-ink/15 px-2.5 py-1 text-xs text-ink/65 hover:border-marina/50 hover:text-marina dark:border-white/15 dark:text-night-text/65"
        aria-label={lang === "ta" ? "X-இல் பகிர்" : "Share on X"}
      >
        X
      </a>
      <button
        onClick={copy}
        className={cn(
          "focus-ring inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition",
          copied
            ? "border-marina/50 text-marina dark:text-marina-light"
            : "border-ink/15 text-ink/65 hover:border-marina/50 hover:text-marina dark:border-white/15 dark:text-night-text/65",
        )}
        aria-label={lang === "ta" ? "இணைப்பை நகலெடு" : "Copy link"}
      >
        {copied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
        {copied ? (lang === "ta" ? "நகலெடுக்கப்பட்டது" : "Copied") : lang === "ta" ? "இணைப்பு" : "Link"}
      </button>
    </div>
  );
}
