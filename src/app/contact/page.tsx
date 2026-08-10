import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Contact | Bedrock.fit",
  description:
    "How to reach Bedrock.fit: general enquiries, corrections to sourced claims, privacy requests, and press.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <SiteFrame tag="//CONTACT">
      <h1>Contact</h1>
      <p className="eff">Last updated August 9, 2026</p>

      <h2>Who runs this</h2>
      <p>
        Bedrock.fit is an independent site. One person writes it and keeps it
        going, rather than a company or an editorial team. It has no ties to any
        gym, equipment maker, supplement brand, or certifying body.
      </p>

      <h2>General enquiries</h2>
      <p>
        Email <a href="mailto:hello@bedrock.fit">hello@bedrock.fit</a>. Expect a
        reply within a few days. This is a side project rather than a staffed
        inbox, so it will not be immediate.
      </p>

      <h2>Corrections</h2>
      <p>
        Every figure on this site should trace back to primary research or to
        national health guidance. Each article carries a numbered source list. If
        a number looks wrong, or a source does not support the claim attached to
        it, or a study has since been overturned, please say so. Email{" "}
        <a href="mailto:hello@bedrock.fit">hello@bedrock.fit</a> with the page,
        the claim, and the source you believe is correct.
      </p>
      <p>
        Corrections to sourced claims are treated as the highest-priority mail
        this site receives. A site that argues from evidence has no business
        being slow to fix its evidence.
      </p>

      <h2>Privacy requests</h2>
      <p>
        Email{" "}
        <a href="mailto:privacy@bedrock.fit">privacy@bedrock.fit</a> with anything
        about data, cookies or advertising. Use the same address to make a request
        under privacy law. The{" "}
        <Link href="/privacy">privacy policy</Link> sets out what is collected
        and why.
      </p>

      <h2>What this site will not do</h2>
      <p>
        We do not write individual training programmes. We do not coach, assess
        your form, advise on injuries, or answer personal medical questions.
        Those require someone who can assess you in person, and answering them by
        email would be irresponsible. See the{" "}
        <Link href="/terms">terms of use</Link> for the full disclaimer.
      </p>
      <p>
        We also do not accept guest posts, sponsored articles, paid link
        placements, or link-exchange requests. Mail of that kind will not receive
        a reply.
      </p>

      <h2>Elsewhere on the site</h2>
      <p>
        The <Link href="/methodology">methodology page</Link> explains how the
        strength estimates are produced and where they are least reliable. The{" "}
        <Link href="/training">training articles</Link> are the long-form,
        footnoted pieces. The <Link href="/">strength scan</Link> is the
        calculator itself.
      </p>
    </SiteFrame>
  );
}
