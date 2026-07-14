"use client";

/**
 * Shareable highlight cards: select any passage in the chapter, and a small
 * floating button offers a rendered quote card (1080×1080 PNG) carrying the
 * selected text, the chapter title, its VN·chNN reference and the site name —
 * shared via the native share sheet where available, downloaded otherwise.
 * Client-only; no external services.
 */
import { ImageDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

const W = 1080;
const H = 1080;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function renderCard(quote: string, title: string, refLabel: string): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // paper ground with a marina rule at top and brass at bottom — the site's palette
  ctx.fillStyle = "#FAF7F1";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0E5D63";
  ctx.fillRect(0, 0, W, 14);
  ctx.fillStyle = "#B98A2F";
  ctx.fillRect(0, H - 14, W, 14);

  const tamilFont = '"Noto Serif Tamil", "Noto Sans Tamil", serif';
  // fit the quote: shrink font until it fits the block
  let size = 64;
  let lines: string[] = [];
  while (size >= 30) {
    ctx.font = `600 ${size}px ${tamilFont}`;
    lines = wrap(ctx, quote, W - 200);
    if (lines.length * size * 1.6 <= H - 420) break;
    size -= 4;
  }
  ctx.fillStyle = "#0F1720";
  ctx.textBaseline = "top";
  const blockH = lines.length * size * 1.6;
  let y = Math.max(140, (H - 260 - blockH) / 2);
  ctx.fillStyle = "#B98A2F";
  ctx.font = `700 ${Math.round(size * 1.6)}px Georgia, serif`;
  ctx.fillText("“", 70, y - size * 0.9);
  ctx.fillStyle = "#0F1720";
  ctx.font = `600 ${size}px ${tamilFont}`;
  for (const l of lines) {
    ctx.fillText(l, 100, y);
    y += size * 1.6;
  }

  // footer: chapter title · ref · site
  ctx.fillStyle = "#0E5D63";
  ctx.font = `500 34px ${tamilFont}`;
  const titleLines = wrap(ctx, title, W - 200).slice(0, 2);
  let fy = H - 200;
  for (const l of titleLines) {
    ctx.fillText(l, 100, fy);
    fy += 46;
  }
  ctx.fillStyle = "#B98A2F";
  ctx.font = "600 30px Georgia, serif";
  ctx.fillText(`${refLabel} · நெஞ்சுக்கு நீதி`, 100, fy + 6);
  ctx.fillStyle = "rgba(15,23,32,0.55)";
  ctx.font = "500 28px Georgia, serif";
  ctx.fillText("nenjukkuneethi.org", 100, fy + 50);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export default function ShareQuote({ title, refLabel }: { title: string; refLabel: string }) {
  const { lang } = useLang();
  const [selection, setSelection] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onSel = () => {
      const s = window.getSelection?.()?.toString().trim() ?? "";
      // only offer for real passages, and keep cards legible
      setSelection(s.length >= 12 && s.length <= 420 ? s : "");
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  if (!selection) return null;

  const share = async () => {
    setBusy(true);
    try {
      const blob = await renderCard(`“${selection}”`, title, refLabel);
      if (!blob) return;
      const file = new File([blob], `${refLabel.replace(/[^\w·-]/g, "")}-quote.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, url: window.location.href.split("?")[0] });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch {
      /* user cancelled the share sheet — nothing to do */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={share}
      disabled={busy}
      className="focus-ring fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-marina px-4 py-2.5 text-sm font-medium text-paper shadow-lg shadow-marina/30 disabled:opacity-60"
      data-print="hide"
    >
      <ImageDown className="h-4 w-4" aria-hidden />
      {busy
        ? lang === "ta" ? "உருவாக்கப்படுகிறது…" : "Rendering…"
        : lang === "ta" ? "மேற்கோள் அட்டை" : "Quote card"}
    </button>
  );
}
