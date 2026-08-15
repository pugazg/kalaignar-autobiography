import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, Section } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "About — Kalaignar Digital Library",
  description:
    "An independent digital archive presenting Kalaignar M. Karunanidhi's six-volume memoir Nenjukku Neethi and related material, with source and provenance information where available.",
};

export default function AboutPage() {
  return (
    <InfoPage title="About" tamil="இந்தத் திட்டம் பற்றி">
      <Section heading="The project">
        <p>
          The Kalaignar Digital Library is an independent digital archival and reading initiative
          built around the autobiographical and related archival material of Kalaignar
          M. Karunanidhi (1924–2005). It presents structured, searchable access to the memoir and
          associated texts on the web and in a companion reading app.
        </p>
      </Section>

      <Section heading="What it contains">
        <p>
          At its centre is <span className="font-tamil" lang="ta">நெஞ்சுக்கு நீதி</span> (Nenjukku
          Neethi), the six-volume memoir, presented chapter by chapter in the original Tamil with
          English where a translation is available. Alongside it are the Murasoli letters, a Tolkāppiyam
          commentary, and structured explorations of the memoir's timeline, people, places, themes and
          governance record.
        </p>
      </Section>

      <Section heading="Independent, not official">
        <p>
          This is an independent project. It is not an official publication and does not claim
          endorsement by or affiliation with Kalaignar's family, the DMK, Murasoli, or any government
          or archive. Names and marks belong to their respective owners.
        </p>
      </Section>

      <Section heading="Sources and provenance">
        <p>
          The project presents archival material with source and provenance information where
          available. Memoir text is digitised from published editions and made available via
          nenjukkuneethi.org; the Murasoli letter volumes are drawn from digitised source material
          (including the Tamil Nadu Government Digital Library, as noted in the collection data).
          Corrections and provenance notes are welcome — see the{" "}
          <Link href="/support" className="text-marina underline dark:text-marina-light">Support page</Link>.
        </p>
      </Section>

      <Section heading="More">
        <p>
          Read the{" "}
          <Link href="/privacy" className="text-marina underline dark:text-marina-light">Privacy Policy</Link>, find help on the{" "}
          <Link href="/support" className="text-marina underline dark:text-marina-light">Support page</Link>, or open the{" "}
          <Link href="/" className="text-marina underline dark:text-marina-light">library home</Link>.
        </p>
      </Section>
    </InfoPage>
  );
}
