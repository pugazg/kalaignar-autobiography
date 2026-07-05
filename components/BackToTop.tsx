"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;
  return (
    <a
      href="#top"
      className="focus-ring fixed bottom-6 right-6 z-40 rounded-full bg-marina p-3 text-paper shadow-lg shadow-marina/30 transition-transform hover:scale-105"
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </a>
  );
}
