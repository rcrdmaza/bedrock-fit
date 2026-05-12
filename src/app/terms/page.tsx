import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/app/site-header';

// Terms of Service. Mirrors the structure and tone of /privacy:
// plain prose, no DB, no client JS, effectively static. The content
// is a US-baseline ToS adapted to what the site does (race-result
// hosting, magic-link accounts, user-logged daily runs, claim flow,
// sponsor stripes / planned ads).
//
// AdSense and most direct-sponsor partners require a Terms of
// Service link present on the site before they'll accept an
// application — this is the last legal piece in the ads-prereq
// gating block. Linked from the site footer alongside the privacy
// policy.
//
// NOT legal advice. Update EFFECTIVE_DATE whenever the terms change
// materially, especially around content licensing, dispute
// resolution, or termination — those are the sections most likely
// to trigger a regulator's or a litigant's interest.

export const metadata: Metadata = {
  title: 'Terms of Service · Bedrock.fit',
  description:
    'The terms under which you use Bedrock.fit — accounts, content, race results, and disclaimers.',
};

const EFFECTIVE_DATE = 'April 28, 2026';
const CONTACT_EMAIL = 'support@bedrock.fit';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      <article className="max-w-3xl mx-auto px-8 pt-16 pb-24 prose-stone">
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-stone-500 mb-10">
          Effective {EFFECTIVE_DATE}
        </p>

        <Section title="Acceptance of these terms">
          <p>
            By accessing or using Bedrock.fit (&ldquo;Bedrock&rdquo;,
            &ldquo;we&rdquo;, &ldquo;us&rdquo;) you agree to these
            Terms of Service. If you don&apos;t agree, don&apos;t use
            the site. We may update these terms; the &ldquo;Effective&rdquo;
            date above reflects the latest revision, and material
            changes will be communicated by email or by an in-app
            notice before they take effect.
          </p>
        </Section>

        <Section title="What the service is">
          <p>
            Bedrock.fit is a race-results and training-log site for
            runners. We import publicly available race finisher
            data, let athletes claim their finishes, and let
            registered users log their own training runs.
            Leaderboards rank claimed and unclaimed results by
            finish time; event pages aggregate the participants of
            a specific race.
          </p>
          <p>
            The service is provided &ldquo;as is&rdquo;, without
            warranty of any kind. We don&apos;t guarantee uptime,
            data completeness, or that any specific feature will
            remain available.
          </p>
        </Section>

        <Section title="Eligibility">
          <p>
            You must be at least 13 years old to create an account.
            By creating one you represent that you meet that age
            requirement. If we learn that someone under 13 has
            signed up, we&apos;ll delete the account.
          </p>
          <p>
            Some jurisdictions set the minimum age higher (16 in
            most of the EU). If you live in one, the local minimum
            governs your eligibility.
          </p>
        </Section>

        <Section title="Accounts">
          <p>
            Accounts are created on first successful sign-in via a
            magic link sent to your email. You&apos;re responsible
            for keeping that email secure — anyone who can read it
            can sign in as you.
          </p>
          <p>
            You may close your account at any time by emailing{' '}
            <a className="text-blue-700 hover:text-blue-900" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            . Closing an account removes your personal information
            from active use; imported public race results stay on
            the leaderboards (de-linked from your profile) because
            they were never private to begin with — see the next
            section.
          </p>
        </Section>

        <Section title="Race-result data">
          <p>
            We import finisher results (name, finish time, race
            category, event) from publicly published race-result
            sources — race-operator websites, timing-company
            published lists, news reports. These results are
            already public; we organize them into a searchable
            index and let athletes link results to a profile via
            our claim flow.
          </p>
          <p>
            If you&apos;d like a specific imported result tied to
            your name removed from the site, email{' '}
            <a className="text-blue-700 hover:text-blue-900" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{' '}
            with the event name, date, and the row you want
            removed. We&apos;ll evaluate the request — we will
            generally honor good-faith takedown requests for an
            athlete&apos;s own results.
          </p>
        </Section>

        <Section title="Your content">
          <p>
            &ldquo;Your content&rdquo; means anything you submit to
            the site: profile details (display name, nickname,
            avatar, country), the daily runs you log (distance,
            duration, location, notes, tagged athletes), claim-flow
            messages, and any photos you upload through the admin
            event-management surfaces if you have access.
          </p>
          <p>
            You keep ownership of your content. By submitting it,
            you grant Bedrock a worldwide, royalty-free,
            non-exclusive license to host, display, and distribute
            it as part of operating the service — for example,
            showing your daily runs on your public profile, or
            including your display name on a leaderboard. The
            license lasts as long as the content is on the site;
            deleting your content (or your account) terminates it
            on a going-forward basis.
          </p>
          <p>
            You represent that the content you submit is yours to
            submit — that you have the rights to any photos you
            upload, the right to display the run locations you log
            (a backyard treadmill route is yours; a private estate
            you broke into isn&apos;t), and so on.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>
            Don&apos;t do any of the following:
          </p>
          <p>
            <strong>Scrape the site at scale.</strong> Reasonable
            individual browsing and the indexable surfaces we
            advertise to search engines are fine. Bulk scraping
            against rate limits or our terms is not.
          </p>
          <p>
            <strong>Tag athletes who haven&apos;t consented.</strong>{' '}
            The daily-run participant tag is meant for friends who
            actually ran with you. Tagging strangers for visibility
            is harassment and we&apos;ll remove your tagging
            ability without notice.
          </p>
          <p>
            <strong>Submit false claims.</strong> The claim flow
            asks for proof you&apos;re the named finisher. Claiming
            someone else&apos;s result is fraud and grounds for
            permanent account termination.
          </p>
          <p>
            <strong>Spam, harassment, or illegal content</strong>{' '}
            in any user-submitted field. The notes column on a
            daily run is for context about the run, not for
            promotional links or abuse.
          </p>
          <p>
            <strong>Circumvent the privacy controls.</strong> If
            another user has marked their profile private, don&apos;t
            try to enumerate their data or build pages that
            workaround the redaction.
          </p>
        </Section>

        <Section title="Sponsored content and advertising">
          <p>
            Some event pages may display a &ldquo;Presented
            by&rdquo; sponsor stripe identifying a paid sponsor of
            the event. Future versions of the site may show
            third-party advertising (e.g. AdSense) on public
            pages. When ads are present, they will be visually
            distinct from editorial content; cookie-based
            personalization is gated behind the cookie consent
            banner described in our privacy policy.
          </p>
          <p>
            We don&apos;t accept money for editorial placement on
            leaderboards or athlete profiles. Race results are
            ranked on finish time, not on whether the event paid
            for a sponsor stripe.
          </p>
        </Section>

        <Section title="Intellectual property">
          <p>
            The site&apos;s name, design, and source code (where
            not open-sourced) are Bedrock&apos;s. You may not copy
            or re-host the site as your own. Linking to public
            pages is welcome; embedding our content in a way that
            misrepresents the source is not.
          </p>
          <p>
            For DMCA / copyright takedown requests, email{' '}
            <a className="text-blue-700 hover:text-blue-900" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{' '}
            with the URL of the allegedly infringing content, a
            description of the original work, and a statement of
            good-faith belief that the use isn&apos;t authorized.
          </p>
        </Section>

        <Section title="Termination">
          <p>
            We may suspend or terminate your access if you violate
            these terms, especially the &ldquo;Acceptable use&rdquo;
            section. We&apos;ll generally give notice before
            terminating, but we may act immediately for egregious
            violations (fraud, illegal content, attacks on the
            service).
          </p>
          <p>
            You may terminate your account at any time by emailing
            us. Termination doesn&apos;t remove publicly imported
            race results from the leaderboards — those were public
            before they were on Bedrock.
          </p>
        </Section>

        <Section title="Disclaimers">
          <p>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND
            &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY
            KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
            NON-INFRINGEMENT, OR ACCURACY OF RACE-RESULT DATA.
          </p>
          <p>
            We don&apos;t guarantee that the finish times we
            display are correct — they&apos;re only as accurate as
            the public sources we import from. If you spot an
            error, tell us and we&apos;ll correct it where we can.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            TO THE FULLEST EXTENT PERMITTED BY LAW, BEDROCK WILL
            NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR
            USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM
            ARISING OUT OF OR RELATING TO THESE TERMS OR THE
            SERVICE IS LIMITED TO USD $100.
          </p>
          <p>
            Some jurisdictions don&apos;t allow these limitations;
            in those jurisdictions, our liability is limited to
            the maximum extent permitted by law.
          </p>
        </Section>

        <Section title="Indemnification">
          <p>
            You agree to indemnify and hold Bedrock harmless from
            any claim, demand, or damages (including reasonable
            attorneys&apos; fees) arising out of content you
            submit, your use of the service, or your violation of
            these terms.
          </p>
        </Section>

        <Section title="Governing law and disputes">
          <p>
            These terms are governed by the laws of the United
            States and the State of Delaware, without regard to
            conflict-of-law principles. Any dispute that can&apos;t
            be resolved by emailing us will be resolved in the
            state or federal courts located in Delaware, and you
            consent to personal jurisdiction in those courts.
          </p>
          <p>
            If a court finds any part of these terms unenforceable,
            the rest stays in effect.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            We&apos;ll update these terms when our practices
            change. The effective date at the top reflects the
            latest revision. We&apos;ll communicate material
            changes by email or by an in-app notice before they
            take effect. Continuing to use the service after a
            change takes effect means you accept the new terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms — or anything else — go
            to{' '}
            <a className="text-blue-700 hover:text-blue-900" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <p className="mt-12 text-xs text-stone-400">
          This document is provided as plain-language information
          about how the service operates and is not legal advice.
          If you have questions about how it applies to you,
          consult a qualified lawyer in your jurisdiction.
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
