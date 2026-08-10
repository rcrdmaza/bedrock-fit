import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Terms of Use | Bedrock.fit",
  description:
    "The terms governing use of Bedrock.fit, including the informational nature of the strength calculator, health and safety disclaimers, and limitation of liability.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <SiteFrame tag="//TERMS">
      <h1>Terms of Use</h1>
      <p className="eff">Effective date: August 9, 2026</p>

      <h2>1. Acceptance of These Terms</h2>
      <p>
        These Terms of Use (the &ldquo;Terms&rdquo;) govern your access to and
        use of the website located at https://www.bedrock.fit (the
        &ldquo;Site&rdquo;), operated by Bedrock.fit (&ldquo;we,&rdquo;
        &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing or using the Site
        you agree to be bound by these Terms. If you do not agree to them, do
        not use the Site.
      </p>

      <h2>2. The Site Is Informational Only</h2>
      <p>
        The Site provides general fitness and strength-training information,
        together with a calculator that produces estimates from values you
        enter. It is offered for informational and educational purposes only.
      </p>
      <p>
        <strong>
          Nothing on the Site is medical advice, physical therapy, diagnosis, or
          treatment, and nothing on it is individualised training instruction.
        </strong>{" "}
        We do not know your medical history, your injury history, your training
        experience, or the conditions under which you train. No content on the
        Site is a substitute for consultation with a qualified physician,
        physiotherapist, or certified coach who can assess you in person.
      </p>
      <p>
        Consult a physician before beginning any exercise programme, and
        particularly before beginning resistance training if you are pregnant,
        have a cardiovascular or musculoskeletal condition, are recovering from
        injury or surgery, or have been sedentary for an extended period. If you
        experience pain, dizziness, chest discomfort, or shortness of breath
        while exercising, stop and seek medical attention.
      </p>

      <h2>3. Estimates Are Estimates</h2>
      <p>
        The calculator returns an <em>estimated</em> one-repetition maximum and
        related figures derived from a published formula applied to the numbers
        you supply. Such formulas are population approximations. Individual
        results vary with technique, fatigue, training history, equipment,
        repetition range, and measurement error, and the estimate becomes less
        reliable the further your input sits from the range the formula was
        derived over. The{" "}
        <Link href="/methodology">methodology page</Link> describes the approach
        and its limits in more detail.
      </p>
      <p>
        An estimate produced by the Site is not a recommendation to attempt any
        particular load. Never attempt a maximal or near-maximal lift without
        appropriate experience, supervision, and safety equipment.
      </p>

      <h2>4. Assumption of Risk</h2>
      <p>
        Resistance training and physical exercise carry an inherent risk of
        injury. You acknowledge that any exercise you undertake is at your own
        risk, that you are solely responsible for your own health and safety and
        for evaluating whether any information on the Site is appropriate for
        you, and that you assume full responsibility for any consequences
        arising from your use of the Site or reliance on its content.
      </p>

      <h2>5. Permitted Use</h2>
      <p>
        You may use the Site for personal, non-commercial purposes. You may not
        use the Site in any manner that is unlawful, that infringes the rights of
        others, that interferes with or disrupts the Site or the servers and
        networks connected to it, or that attempts to gain unauthorised access to
        any part of the Site.
      </p>
      <p>
        You may not scrape, harvest, or systematically extract content from the
        Site by automated means without our prior written consent.
      </p>

      <h2>6. Intellectual Property</h2>
      <p>
        The text, design, charts, and other original content on the Site are
        owned by us and are protected by copyright and other intellectual
        property laws. You may quote brief excerpts with attribution and a link
        to the source page. You may not reproduce substantial portions of the
        Site&rsquo;s content without our prior written consent.
      </p>
      <p>
        Photographs on the Site are used under the licences identified in the
        credit line accompanying each image. Cited research remains the property
        of its respective publishers and is referenced under the ordinary
        conventions of citation.
      </p>

      <h2>7. Third-Party Content and Links</h2>
      <p>
        The Site links to third-party websites, including research publications
        and public health resources, and may display advertising served by
        third parties. We do not control and are not responsible for the
        content, accuracy, availability, or practices of any third-party site or
        advertisement. A link is not an endorsement.
      </p>

      <h2>8. No Warranty</h2>
      <p>
        The Site is provided on an &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; basis, without warranties of any kind, whether express
        or implied, including without limitation implied warranties of
        merchantability, fitness for a particular purpose, and non-infringement.
        We do not warrant that the Site will be uninterrupted or error-free, or
        that any information on it is complete, current, or accurate.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by applicable law, we shall not be liable
        for any indirect, incidental, special, consequential, or punitive
        damages, or for any loss of profits, data, or goodwill, arising out of or
        in connection with your access to or use of the Site, including,
        without limitation, any injury sustained while exercising or any
        decision made in reliance on information or estimates obtained from the
        Site.
      </p>
      <p>
        Some jurisdictions do not allow the exclusion or limitation of certain
        damages, so the above limitation may not apply to you in full. Nothing in
        these Terms excludes liability that cannot lawfully be excluded.
      </p>

      <h2>10. Changes to These Terms</h2>
      <p>
        We may revise these Terms from time to time. Revisions are effective upon
        posting to the Site with an updated effective date. Your continued use of
        the Site following any revision constitutes acceptance of the revised
        Terms.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms may be directed to{" "}
        <a href="mailto:hello@bedrock.fit">hello@bedrock.fit</a>, or through the{" "}
        <Link href="/contact">contact page</Link>.
      </p>
    </SiteFrame>
  );
}
