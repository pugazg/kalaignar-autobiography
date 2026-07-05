import type { Metadata } from "next";
import { Inter, Newsreader, Noto_Serif_Tamil } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
});
const tamil = Noto_Serif_Tamil({
  subsets: ["tamil"],
  weight: ["400", "600"],
  variable: "--font-tamil",
});

export const metadata: Metadata = {
  title: "Kalaignar M. Karunanidhi's Legacy — Nenjukku Neethi, Interactive",
  description:
    "An interactive digital retelling of Nenjukku Neethi (Volume 1), the autobiography of Kalaignar M. Karunanidhi: 1924–1969, from a delta village to the seat of government.",
  keywords: [
    "Karunanidhi",
    "Kalaignar",
    "Nenjukku Neethi",
    "Tamil Nadu",
    "Dravidian movement",
    "DMK",
    "autobiography",
  ],
  openGraph: {
    title: "Kalaignar M. Karunanidhi's Legacy",
    description:
      "Understand Volume 1 of Nenjukku Neethi in fifteen minutes: timeline, themes, statistics and references.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${newsreader.variable} ${tamil.variable} font-body`}
      >
        <a
          href="#summary"
          className="focus-ring sr-only z-[100] rounded bg-marina px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
