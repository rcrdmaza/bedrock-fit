// Google Consent Mode v2 — default state.
//
// Emitted as a raw inline <script> element (not next/script) so it
// lands in the server-rendered <head> and runs synchronously when the
// HTML parser hits it — before the AdSense loader's async <script>
// in the same <head> can finish downloading. Order matters: tags
// like adsbygoogle.js read the gtag/dataLayer consent state on boot,
// so the default has to be in place first.
//
// We tried `next/script` with `strategy="beforeInteractive"` here.
// In Next 16 + React 19 that strategy wraps the script body in a
// `self.__next_n.push([...])` runtime queue rather than emitting a
// literal <script> in <head>, which both delays execution past the
// AdSense loader's boot AND defeats the AdSense verification
// crawler (which greps the raw HTML for the loader's <script src>).
// Going raw fixes both.
//
// Everything ad/analytics starts `denied` — the GDPR-safe baseline.
// The cookie banner pushes a `consent: update` once the visitor
// chooses (or replays a stored choice for returning visitors).
// `wait_for_update: 500` gives that update a 500 ms window before
// the tags fall back to the denied default.
//
// `window.gtag` is intentionally global — cookie-banner.tsx calls
// `window.gtag('consent', 'update', …)` later. Defining it as a
// real function (not just seeding dataLayer) gives callers the
// canonical `arguments`-push behaviour Google's tooling expects.

export default function ConsentInit() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});`,
      }}
    />
  );
}
