import Script from 'next/script';

// Google Consent Mode v2 — default state.
//
// Runs `beforeInteractive` so it executes before the AdSense loader
// (which is `afterInteractive`): Google's tags read this `default`
// consent the moment they boot. Everything ad/analytics-related
// starts `denied` — the GDPR-safe baseline — which keeps the loader
// in the document head for AdSense verification while honouring the
// promise in our privacy policy that advertising cookies are set
// only after the visitor opts in.
//
// `wait_for_update: 500` gives the cookie banner a 500 ms window to
// push a `consent: update` (for a returning visitor whose choice is
// already in the cookie, or a first-time visitor who clicks) before
// the tags fall back to the denied default. The banner's mount
// effect runs well within that window.
//
// The `gtag` function defined here is intentionally global —
// cookie-banner.tsx calls `window.gtag('consent', 'update', …)`
// later. Defining it as a real function (not just seeding
// dataLayer) means callers get the canonical `arguments`-push
// behaviour Google's tooling expects.

export default function ConsentInit() {
  return (
    <Script id="consent-mode-default" strategy="beforeInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('consent', 'default', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          wait_for_update: 500
        });
      `}
    </Script>
  );
}
