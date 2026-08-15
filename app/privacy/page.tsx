import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, Section } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Kalaignar Digital Library",
  description:
    "How the Nenjukku Neethi reading app and website handle information: no accounts, no advertising, no third-party analytics; reading data stays on your device.",
};

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy" tamil="தனியுரிமைக் கொள்கை" updated="15 August 2026">
      <Section heading="What this covers">
        <p>
          This policy describes how the <em>Nenjukku Neethi — Kalaignar Digital Library</em> mobile
          app and this website handle information. The project is an independent digital archive of
          the memoir and related archival material; it is not an official publication.
        </p>
      </Section>

      <Section heading="Information the app does not request or collect">
        <p>The current version of the app does not:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>require an account, sign-in or registration;</li>
          <li>ask for your name, email address, phone number or other profile details;</li>
          <li>contain advertising;</li>
          <li>use third-party analytics or cross-app tracking software;</li>
          <li>use crash-reporting software;</li>
          <li>sell or share personal data;</li>
          <li>access your location, contacts, photos, camera, microphone or health data.</li>
        </ul>
      </Section>

      <Section heading="Information stored on your device">
        <p>
          To make reading work, the app stores data locally on your device only — it is not sent to
          the project. This includes your reading preferences (text size, line spacing, theme,
          language), reading progress and bookmarks, your list of downloaded chapters and the cached
          content itself, and your recent items and search history. You can remove downloaded and
          cached content at any time from <strong>Settings → Storage → Clear</strong>, and removing
          the app clears this local data.
        </p>
      </Section>

      <Section heading="Network requests and website hosting">
        <p>
          The app fetches archival content (the reading manifest, chapter text, search indexes and
          images) from <strong>nenjukkuneethi.org</strong>. It does not send this content to any
          other service. As with any website, routine requests to our hosting provider may be
          processed to deliver content and keep the service reliable and secure; this can involve
          standard technical information such as a network address and request details. The project
          does not use this to build advertising or marketing profiles.
        </p>
      </Section>

      <Section heading="Sharing">
        <p>
          When you choose to share a passage, the app hands the selected text to your device's system
          Share sheet so you can send it to another app you pick. This happens only when you start it,
          and the project does not receive a copy.
        </p>
      </Section>

      <Section heading="Notifications">
        <p>The current version of the app does not send push notifications.</p>
      </Section>

      <Section heading="Third-party services">
        <p>
          The app does not integrate third-party advertising, analytics or tracking services. Content
          is served from the project's own website hosting.
        </p>
      </Section>

      <Section heading="General audience">
        <p>
          This is a general-audience reference and reading app. It is not directed at children and
          does not knowingly collect information from anyone.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          If the app's behaviour changes — for example, if a future version adds notifications or
          diagnostics — this policy will be updated before that behaviour ships, and the date above
          will change.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about this policy, or requests and corrections, can be raised through the{" "}
          <Link href="/support" className="text-marina underline dark:text-marina-light">Support page</Link>.
        </p>
      </Section>
    </InfoPage>
  );
}
