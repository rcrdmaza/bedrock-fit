import type { Metadata } from "next";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Privacy Policy — Bedrock.fit",
  description:
    "How Bedrock.fit collects, uses, and discloses information, including cookies, advertising, and your privacy rights.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <SiteFrame tag="//PRIVACY">
      <h1>Privacy Policy</h1>
      <p className="eff">Effective date — July 3, 2026</p>

      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy governs the manner in which Bedrock.fit
        (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects,
        uses, and discloses information obtained from users (&ldquo;you&rdquo;)
        of the website located at https://www.bedrock.fit (the
        &ldquo;Site&rdquo;). By accessing or using the Site, you consent to the
        practices described in this Policy.
      </p>

      <h2>2. Information We Collect</h2>
      <p>
        We do not require you to create an account or to submit personal
        identifying information to use the Site. Any values you enter into the
        Site&rsquo;s calculator are processed within your browser and are not
        transmitted to or stored by us.
      </p>
      <p>
        We and our third-party service providers automatically collect certain
        information through cookies and similar technologies, including your IP
        address, browser type, device identifiers, referring URLs, pages
        viewed, and dates and times of access.
      </p>

      <h2>3. Cookies and Advertising</h2>
      <p>
        The Site uses cookies and similar technologies to operate the Site,
        analyze usage, and deliver advertising.
      </p>
      <p>
        Third-party vendors, including Google, use cookies to serve
        advertisements based on your prior visits to the Site and other
        websites. Google&rsquo;s use of advertising cookies enables it and its
        partners to serve ads to you based on such visits.
      </p>
      <p>
        You may opt out of personalized advertising by adjusting your Google Ads
        Settings at{" "}
        <a href="https://www.google.com/settings/ads">https://www.google.com/settings/ads</a>.
        You may also opt out of a third-party vendor&rsquo;s use of cookies for
        personalized advertising by visiting{" "}
        <a href="https://www.aboutads.info/choices/">https://www.aboutads.info/choices/</a>.
        Additional information regarding Google&rsquo;s practices is available at{" "}
        <a href="https://policies.google.com/technologies/partner-sites">
          https://policies.google.com/technologies/partner-sites
        </a>
        .
      </p>

      <h2>4. Analytics</h2>
      <p>
        The Site uses analytics services, including Google Analytics, to collect
        aggregate usage data through cookies. This information is used to
        understand and improve Site performance. You may opt out of Google
        Analytics by installing the opt-out browser add-on available at{" "}
        <a href="https://tools.google.com/dlpage/gaoptout">https://tools.google.com/dlpage/gaoptout</a>.
      </p>

      <h2>5. Your Rights</h2>
      <p>
        Depending on your jurisdiction, you may have the right to access,
        correct, delete, or restrict the processing of your personal
        information, and to object to certain processing.
      </p>
      <p>
        Residents of the European Economic Area and the United Kingdom: where
        required, consent for non-essential and advertising cookies is obtained
        through a consent management platform, and such consent may be withdrawn
        at any time through the Site&rsquo;s cookie settings.
      </p>
      <p>
        Residents of California: we do not sell personal information for monetary
        consideration. Certain advertising-related disclosures of information may
        constitute a &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; under applicable
        California law, and you may exercise your opt-out rights through the
        mechanisms described in Section 3 and through applicable browser-based
        opt-out signals.
      </p>

      <h2>6. Children&rsquo;s Privacy</h2>
      <p>
        The Site is intended for a general audience and is not directed to
        children under the age of 13 (or the applicable minimum age in your
        jurisdiction). We do not knowingly collect personal information from
        children. If you believe a child has provided us with personal
        information, please contact us and we will take appropriate steps to
        delete it.
      </p>

      <h2>7. Third-Party Links</h2>
      <p>
        The Site may contain links to third-party websites. We are not
        responsible for the privacy practices or content of such websites, and
        this Policy does not apply to them.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may revise this Policy from time to time. Revisions are effective upon
        posting to the Site with an updated effective date. Your continued use of
        the Site following any revision constitutes acceptance of the revised
        Policy.
      </p>

      <h2>9. Contact</h2>
      <p>
        Inquiries regarding this Policy may be directed to{" "}
        <a href="mailto:privacy@bedrock.fit">privacy@bedrock.fit</a>.
      </p>
    </SiteFrame>
  );
}
