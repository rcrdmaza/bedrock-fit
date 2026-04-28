import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/app/site-header';

// Privacy policy. Plain prose page, no DB, no client JS — server-rendered
// once and effectively static. The content is a generic GDPR + CCPA +
// US-baseline policy adapted to what the site actually does (account
// emails, profile data, daily runs, race-result imports, optional
// analytics + ads after consent). It is NOT legal advice; see the
// effective-date stanza if a real lawyer ever reviews it and rewrites
// chunks. Update EFFECTIVE_DATE whenever the policy changes materially.
//
// Linked from the site footer and from the cookie banner. Crawlable.

export const metadata: Metadata = {
  title: 'Privacy policy · Bedrock.fit',
  description:
    'How Bedrock.fit collects, uses, and protects information about runners and visitors.',
};

const EFFECTIVE_DATE = 'April 28, 2026';
const CONTACT_EMAIL = 'support@bedrock.fit';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      <article className="max-w-3xl mx-auto px-8 pt-16 pb-24 prose-stone">
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          Privacy policy
        </h1>
        <p className="text-sm text-stone-500 mb-10">
          Effective {EFFECTIVE_DATE}
        </p>

        <Section title="Who we are">
          <p>
            Bedrock.fit (&ldquo;Bedrock&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;) operates this race-results and training-log
            site. We act as the data controller for the personal information
            described below. You can reach us at{' '}
            <a className="text-blue-700 hover:text-blue-900" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="What we collect">
          <p>We collect three kinds of information:</p>
          <p>
            <strong>Information you give us.</strong> When you create an
            account we collect your email address. If you fill in your
            profile we additionally collect your display name, nickname,
            avatar image, distance-unit preference, and any privacy choices
            you make. When you log a daily run we collect the date,
            distance, duration, location, optional Strava activity link,
            tagged athletes, and free-text notes you provide.
          </p>
          <p>
            <strong>Information from race results.</strong> Race finish
            data (name, finish time, race category, event, country) is
            imported from publicly published race results. If a published
            result matches your account, you can &ldquo;claim&rdquo; it to
            associate it with your profile.
          </p>
          <p>
            <strong>Information collected automatically.</strong> When you
            visit the site we automatically collect basic request data
            (IP address, user-agent, referrer, pages visited, timestamps).
            We use cookies as described in the &ldquo;Cookies&rdquo;
            section below. If error monitoring is enabled, our error
            tracker (Sentry) records diagnostic context for runtime
            errors.
          </p>
        </Section>

        <Section title="Why we use it">
          <p>
            We use the information to operate the service: authenticate
            you, render your profile and runs, build leaderboards from
            race results, send you sign-in links and operational emails,
            keep the site secure, debug errors, and comply with the law.
            With your consent, we use it to measure usage of the site and
            to show advertising that helps fund the service.
          </p>
        </Section>

        <Section title="Legal bases (GDPR)">
          <p>
            For visitors in the European Economic Area, the United
            Kingdom, and Switzerland, we rely on the following legal bases
            under the General Data Protection Regulation:
          </p>
          <p>
            <strong>Contract.</strong> Processing required to provide the
            service you signed up for &mdash; for example, creating your
            account or storing the runs you log.
          </p>
          <p>
            <strong>Legitimate interests.</strong> Operating, securing,
            and improving the site &mdash; for example, rate-limiting
            sign-ins, debugging errors, or imported public race results.
            You can object to processing based on legitimate interests at
            any time.
          </p>
          <p>
            <strong>Consent.</strong> Non-essential cookies, analytics,
            and advertising. You can withdraw consent at any time using
            the &ldquo;Cookie preferences&rdquo; link in the footer.
          </p>
          <p>
            <strong>Legal obligation.</strong> Where we are required by
            law to process or retain certain information.
          </p>
        </Section>

        <Section title="Cookies and similar technologies">
          <p>
            We use a small number of cookies. We split them into two
            buckets:
          </p>
          <p>
            <strong>Essential cookies</strong> are required for the site
            to work &mdash; for example, the cookie that keeps you signed
            in, the cookie that records your consent choice, and CSRF
            cookies. We set these without asking because the site cannot
            function without them.
          </p>
          <p>
            <strong>Non-essential cookies</strong> &mdash; analytics and
            advertising &mdash; are set only after you consent through
            the cookie banner. You can change your mind any time using
            the &ldquo;Cookie preferences&rdquo; link in the footer.
          </p>
        </Section>

        <Section title="Who we share with">
          <p>
            We do not sell your personal information. We share it only
            with service providers acting on our behalf:
          </p>
          <p>
            Our hosting provider runs the application servers and the
            Postgres database that stores your account and runs. Our
            email provider delivers sign-in links you request. Our error
            monitor receives diagnostic context for runtime errors.
            Advertising and analytics partners receive only what you
            consent to.
          </p>
          <p>
            We may also disclose information to comply with a valid legal
            request, to protect our rights or the safety of others, or in
            connection with a corporate transaction (for example, an
            acquisition), in which case we will give you advance notice
            where the law allows.
          </p>
        </Section>

        <Section title="International transfers">
          <p>
            Our servers are located in the United States. If you access
            the site from outside the United States, your information
            will be transferred to and processed in the United States.
            Where the GDPR applies, we rely on Standard Contractual
            Clauses or another approved transfer mechanism for transfers
            out of the EEA, United Kingdom, or Switzerland.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep account information for as long as your account is
            active. Daily-run entries you log are kept until you delete
            them or close your account. Imported public race results may
            be retained indefinitely as part of the historical
            leaderboard. Server logs are typically retained for 30 days.
            Backups are typically retained for 30 days and are then
            overwritten.
          </p>
        </Section>

        <Section title="Your rights (GDPR / UK GDPR)">
          <p>
            If the GDPR applies to your information, you have the right
            to access, rectify, erase, restrict processing of, or port
            your data, and the right to object to processing based on
            legitimate interests. You can exercise these rights by
            emailing us at{' '}
            <a className="text-blue-700 hover:text-blue-900" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            . You also have the right to lodge a complaint with your
            local data-protection supervisory authority.
          </p>
        </Section>

        <Section title="Your rights (California / CCPA)">
          <p>
            California residents have the right to know what personal
            information we collect, to request deletion or correction of
            their information, and to opt out of any &ldquo;sale&rdquo;
            or &ldquo;sharing&rdquo; of personal information as those
            terms are defined under the CCPA and CPRA. We do not sell
            your personal information for money. Some advertising
            cookies, when consented to, may constitute &ldquo;sharing&rdquo;
            under California law; you can opt out of those by rejecting
            advertising cookies in the cookie banner. We will not
            discriminate against you for exercising any of these rights.
          </p>
          <p>
            To submit a verifiable consumer request, email us at{' '}
            <a className="text-blue-700 hover:text-blue-900" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{' '}
            and include the email address on your account. You can
            authorize an agent to make a request on your behalf.
          </p>
        </Section>

        <Section title="Security">
          <p>
            We use industry-standard safeguards to protect your
            information, including TLS in transit, scoped session
            cookies, hashed login tokens, and signed admin sessions. No
            system is perfectly secure; if you become aware of a
            vulnerability, please report it to{' '}
            <a className="text-blue-700 hover:text-blue-900" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="Children">
          <p>
            The site is not directed to children under 13, and we do not
            knowingly collect personal information from children under
            13. If you believe a child has signed up, contact us and we
            will delete the account.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We will update this page when our practices change. The
            effective date at the top reflects the latest revision. Material
            changes will be communicated by email or by an in-app notice
            before they take effect.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For any privacy question, email us at{' '}
            <a className="text-blue-700 hover:text-blue-900" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <p className="mt-12 text-xs text-stone-400">
          This policy is provided as plain-language information about our
          practices and is not legal advice. If you have questions about
          how it applies to you, consult a qualified lawyer in your
          jurisdiction.
        </p>

        <p className="mt-8 text-sm">
          <Link
            href="/"
            className="text-blue-700 hover:text-blue-900"
          >
            ← Back to home
          </Link>
        </p>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-stone-900 mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-stone-700 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
