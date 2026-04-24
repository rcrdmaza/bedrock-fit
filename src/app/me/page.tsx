// /me is a convenience redirect to the signed-in user's public athlete
// profile. The profile template is already built and cached; /me just
// looks up the athleteId the verify handler linked at sign-in and
// bounces there.
//
// We keep /athletes/[id] as the canonical URL so a shared link still
// works after the person signs out — "my profile" and "your profile
// someone sent you" are the same page.
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const user = await requireUser('/me');
  if (user.athleteId) redirect(`/athletes/${user.athleteId}`);
  // Shouldn't normally happen — verify auto-links or creates an
  // athletes row — but if an admin wiped a user's athlete FK we send
  // them somewhere useful rather than a 500.
  redirect('/results');
}
