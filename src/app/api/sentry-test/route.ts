// Manual Sentry verification endpoint. Hitting GET /api/sentry-test
// throws a ReferenceError on the server, which Next forwards to
// `onRequestError` in instrumentation.ts, which forwards to Sentry.
// Lives in its own route so we can curl it without exercising any
// real surface, and nothing here breaks page renders.
//
// Delete this once Sentry is confirmed working — it's a one-time
// smoke-test endpoint, not a permanent feature. Same applies to the
// wizard's /sentry-example-page + /api/sentry-example-api alongside
// it.

// force-dynamic so Next never tries to prerender this at build time
// (it would crash the build by hitting the ReferenceError at static-
// analysis time).
export const dynamic = 'force-dynamic';

export async function GET() {
  // Sentry's verification recipe verbatim: call an undeclared
  // identifier so the runtime throws ReferenceError. The
  // ts-expect-error directive flags the intentional reference to a
  // symbol that's not in scope; without it the file wouldn't
  // typecheck.
  // @ts-expect-error -- intentional: triggers the test error.
  myUndefinedFunction();
  return new Response('unreachable', { status: 500 });
}
