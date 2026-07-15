import type { Metadata } from "next";
import { Inter, Newsreader, Noto_Serif_Tamil } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

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
  metadataBase: new URL("https://nenjukkuneethi.org"),
  keywords: [
    "Kalaignar", "Karunanidhi", "Nenjukku Neethi", "நெஞ்சுக்கு நீதி",
    "Karunanidhi autobiography", "Kalaignar autobiography", "DMK history",
    "Dravidian movement", "Tamil Nadu history", "கலைஞர்", "கருணாநிதி",
  ],
  openGraph: {
    title: "Kalaignar Digital Library — Nenjukku Neethi, the Complete Memoir",
    description:
      "The complete six-volume autobiography of Kalaignar M. Karunanidhi (1924–2005) as an interactive digital archive: read all 391 chapters in Tamil, explore the timeline, people, places and governance record.",
    url: "https://nenjukkuneethi.org",
    siteName: "Kalaignar Digital Library",
    locale: "ta_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalaignar Digital Library — Nenjukku Neethi",
    description:
      "The complete six-volume memoir of Kalaignar M. Karunanidhi, 1924–2005, as an interactive archive.",
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
  title: "Kalaignar Digital Library — Nenjukku Neethi, the Complete Memoir",
  description:
    "An interactive digital retelling of Nenjukku Neethi, the complete six-volume autobiography of Kalaignar M. Karunanidhi: 1924–2005, from a delta village through the whole arc of a public life.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Book",
  name: "\u0BA8\u0BC6\u0B9E\u0BCD\u0B9A\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0BA8\u0BC0\u0BA4\u0BBF (Nenjukku Neethi)",
  alternateName: "Justice for the Heart",
  author: { "@type": "Person", name: "M. Karunanidhi", alternateName: "Kalaignar" },
  inLanguage: "ta",
  numberOfPages: 4234,
  bookFormat: "https://schema.org/EBook",
  description:
    "The complete six-volume autobiography of Kalaignar M. Karunanidhi, 1924\u20132005, presented as an interactive digital archive.",
  url: "https://nenjukkuneethi.org",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${newsreader.variable} ${tamil.variable} font-body`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
