// POST /auth/sign-out clears the public-user cookie and redirects
// home. We use POST (not GET) so an <img src=".../sign-out"> can't log
// someone out by accident; the header renders a <form method="post">
// which hits this handler.
import { NextResponse } from 'next/server';
import { clearUserCookie } from '@/lib/auth';
import { getAppUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  await clearUserCookie();
  return NextResponse.redirect(`${getAppUrl()}/`, { status: 303 });
}
