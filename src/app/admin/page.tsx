import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { athletes, results } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import { adminLogout, approveClaim, rejectClaim } from '@/app/actions/admin';

// Always render fresh — the pending list changes as soon as the admin acts.
export const dynamic = 'force-dynamic';

function formatTime(seconds: number | null): string {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

async function getPendingClaims() {
  return db
    .select({
      id: results.id,
      athleteId: athletes.id,
      athleteName: athletes.name,
      eventName: results.eventName,
      eventDate: results.eventDate,
      raceCategory: results.raceCategory,
      finishTime: results.finishTime,
      overallRank: results.overallRank,
      totalFinishers: results.totalFinishers,
      claimEmail: results.claimEmail,
      claimNote: results.claimNote,
      claimSubmittedAt: results.claimSubmittedAt,
    })
    .from(results)
    .innerJoin(athletes, eq(results.athleteId, athletes.id))
    .where(eq(results.status, 'pending'))
    .orderBy(desc(results.claimSubmittedAt));
}

export default async function AdminPage() {
  await requireAdmin();
  const pending = await getPendingClaims();

  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-gray-900"
        >
          Bedrock.fit
        </Link>
        <form action={adminLogout}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </form>
      </nav>

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">
            Pending claims
          </h1>
          <p className="text-sm text-gray-500">
            {pending.length === 0
              ? 'Nothing to review right now.'
              : `${pending.length} claim${pending.length !== 1 ? 's' : ''} awaiting review.`}
          </p>
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
            You&apos;re all caught up.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((c) => (
              <div
                key={c.id}
                className="border border-gray-100 rounded-2xl p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      <Link
                        href={`/athletes/${c.athleteId}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {c.athleteName}
                      </Link>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {c.eventName}
                      {c.raceCategory ? ` · ${c.raceCategory}` : ''}
                      {c.eventDate
                        ? ` · ${new Date(c.eventDate).toLocaleDateString(
                            'en-US',
                            { year: 'numeric', month: 'short', day: 'numeric' },
                          )}`
                        : ''}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-sky-50 text-sky-700">
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">
                      Finish time
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatTime(c.finishTime)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">
                      Overall rank
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {c.overallRank ?? '—'}
                      {c.totalFinishers ? ` / ${c.totalFinishers}` : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">
                      Submitted
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {c.claimSubmittedAt
                        ? new Date(c.claimSubmittedAt).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric' },
                          )
                        : '—'}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-700 mb-4 space-y-1">
                  <div>
                    <span className="text-gray-400">Email: </span>
                    <span className="font-medium">{c.claimEmail ?? '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Note: </span>
                    <span>
                      {c.claimNote ? c.claimNote : (
                        <span className="text-gray-400 italic">
                          (none provided)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <form action={approveClaim}>
                    <input type="hidden" name="resultId" value={c.id} />
                    <button
                      type="submit"
                      className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectClaim}>
                    <input type="hidden" name="resultId" value={c.id} />
                    <button
                      type="submit"
                      className="text-xs text-gray-600 hover:text-gray-900 px-3 py-2 transition-colors"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
