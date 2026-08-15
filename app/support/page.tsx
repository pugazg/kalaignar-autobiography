import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, Section } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Support — Kalaignar Digital Library",
  description:
    "Help for the Nenjukku Neethi reading app: content loading, offline downloads, clearing cached data, Tamil display, search, and how to report an issue.",
};

const ISSUES_URL = "https://github.com/pugazg/kalaignar-autobiography/issues";

export default function SupportPage() {
  return (
    <InfoPage title="Support" tamil="உதவி">
      <Section heading="About the app">
        <p>
          <em>Nenjukku Neethi — Kalaignar Digital Library</em> is a native reading app for the
          six-volume memoir of Kalaignar M. Karunanidhi and related archival material, with offline
          reading, Tamil and English text where available, search, a timeline, and the Murasoli
          letters. Content is read from <strong>nenjukkuneethi.org</strong>.
        </p>
      </Section>

      <Section heading="Content won't load">
        <p>
          The app needs a network connection the first time it opens, and to open any chapter you
          have not downloaded. If content fails to load, check your connection and try again. A
          chapter you have already read or downloaded remains available offline.
        </p>
      </Section>

      <Section heading="Offline reading and downloads">
        <p>
          Downloaded chapters (including their images) are stored on your device and can be read
          without a network. Full-text search works offline for volumes you have already opened.
          Downloading is per chapter; there is no whole-volume bulk download in the current version.
        </p>
      </Section>

      <Section heading="Clearing downloaded and cached data">
        <p>
          Open <strong>Settings → Storage</strong> to see how much is stored and tap{" "}
          <strong>Clear</strong> to remove all downloaded chapters and cached data. You can download
          content again when you are back online.
        </p>
      </Section>

      <Section heading="Tamil display">
        <p>
          The app ships with a Tamil serif typeface and honours your device's Dynamic Type text-size
          setting. Text size and line spacing can also be adjusted per your preference in{" "}
          <strong>Settings → Reading</strong> and from the reader's controls.
        </p>
      </Section>

      <Section heading="Search">
        <p>
          Search covers the memoir's chapter text and can be filtered by volume. It searches content
          you can reach; a volume becomes searchable offline once it has been opened.
        </p>
      </Section>

      <Section heading="Reporting a content or technical issue">
        <p>
          To report a transcription or content problem, a display issue, or anything else, please open
          an issue on the project's public repository:{" "}
          <a href={ISSUES_URL} className="text-marina underline dark:text-marina-light" rel="noopener noreferrer" target="_blank">
            github.com/pugazg/kalaignar-autobiography
          </a>
          . Corrections to the archival text are welcome there.
        </p>
      </Section>

      <Section heading="More">
        <p>
          See the{" "}
          <Link href="/privacy" className="text-marina underline dark:text-marina-light">Privacy Policy</Link>,{" "}
          the{" "}
          <Link href="/about" className="text-marina underline dark:text-marina-light">About page</Link>, or the{" "}
          <Link href="/" className="text-marina underline dark:text-marina-light">library home</Link>.
        </p>
      </Section>
    </InfoPage>
  );
}
