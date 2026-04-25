import { NextResponse } from 'next/server';
import { acceptInvite } from '@/app/actions/org';
import { getCurrentUser } from '@/lib/auth';
import { getAppUrl } from '@/lib/env';

// Invite accept entry point. The flow:
//   1. Recipient clicks the email link → lands here with ?token=...
//   2. If they're not signed in, bounce to /auth/sign-in with ?next=
//      pointing back here. They sign in via magic-link, come back.
//   3. We call acceptInvite(token, user). On success they end up in
//      /admin/org for the org they just joined. On error we still send
//      them to /admin/org with an error query param so the page can
//      surface the reason without us building a dedicated error page.
//
// Why a route handler vs. a page: we want side effects (writes to
// org_members) to happen before any HTML renders, and we want the
// failure path to be a clean redirect rather than a partially-
// rendered page.
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return redirectTo('/admin/org?invite=missing');
  }

  const user = await getCurrentUser();
  if (!user) {
    // Bounce through sign-in. The verify route already supports
    // arbitrary `next` redirects, so the user lands back here after
    // they click the magic link.
    const next = encodeURIComponent(`/auth/invite/accept?token=${token}`);
    return redirectTo(`/auth/sign-in?next=${next}`);
  }

  const result = await acceptInvite(token, {
    id: user.id,
    email: user.email.toLowerCase(),
  });

  switch (result.status) {
    case 'ok':
    case 'already-member':
      return redirectTo('/admin/org?invite=ok');
    case 'wrong-user':
      // Common case: the invitee opened the link from the wrong
      // browser session. Surface a clear error rather than silently
      // dropping them into someone else's account.
      return redirectTo('/admin/org?invite=wrong-user');
    case 'invalid':
      return redirectTo('/admin/org?invite=invalid');
  }
}

function redirectTo(path: string): Response {
  const base = getAppUrl();
  return NextResponse.redirect(new URL(path, base), { status: 303 });
}
