import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { athletes } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import SiteHeader from '@/app/site-header';
import SettingsForm, {
  type SettingsFormInitial,
} from './settings-form';

// Settings rendered from the live athletes row, not the cookie. We
// always re-fetch so the form reflects the current DB state — even if
// a previous tab saved minutes ago.
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  // Owner-only — anonymous visitors get bounced through sign-in and
  // come back here. requireUser sets the `?next=` for us.
  const user = await requireUser('/me/settings');

  // Should be linked at sign-in, but the auth lib doesn't strictly
  // enforce it; render a polite empty state if the FK is missing rather
  // than blowing up.
  if (!user.athleteId) {
    return (
      <main className="min-h-screen bg-white">
        <SiteHeader />
        <section className="max-w-2xl mx-auto px-8 pt-16 pb-24">
          <h1 className="text-2xl font-semibold text-stone-900 mb-2">
            Profile settings
          </h1>
          <p className="text-sm text-stone-500">
            Your account isn&apos;t linked to an athlete profile yet. Sign
            out and back in to relink, or{' '}
            <Link href="/results" className="text-blue-700 hover:text-blue-900">
              browse results
            </Link>{' '}
            to find one to claim.
          </p>
        </section>
      </main>
    );
  }

  const rows = await db
    .select()
    .from(athletes)
    .where(eq(athletes.id, user.athleteId))
    .limit(1);
  const athlete = rows[0];
  if (!athlete) {
    // Same posture — admin nuked the athlete row, we don't 500.
    return (
      <main className="min-h-screen bg-white">
        <SiteHeader />
        <section className="max-w-2xl mx-auto px-8 pt-16 pb-24">
          <h1 className="text-2xl font-semibold text-stone-900 mb-2">
            Profile settings
          </h1>
          <p className="text-sm text-stone-500">
            We couldn&apos;t find your athlete profile. Reach out to an
            admin to relink.
          </p>
        </section>
      </main>
    );
  }

  const initial: SettingsFormInitial = {
    name: athlete.name,
    nickname: athlete.nickname ?? '',
    // Narrow the DB string to the form's union; anything off-band falls
    // back to 'name' so the radio renders something selected.
    displayPreference:
      athlete.displayPreference === 'nickname' ? 'nickname' : 'name',
    isPrivate: athlete.isPrivate,
    avatarUrl: athlete.avatarUrl,
  };

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <section className="max-w-2xl mx-auto px-8 pt-16 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-stone-900 mb-2">
            Profile settings
          </h1>
          <p className="text-sm text-stone-500">
            Update what other users see on your profile and across
            leaderboards.{' '}
            <Link
              href={`/athletes/${athlete.id}`}
              className="text-blue-700 hover:text-blue-900"
            >
              View my profile →
            </Link>
          </p>
        </div>

        <SettingsForm initial={initial} />
      </section>
    </main>
  );
}
