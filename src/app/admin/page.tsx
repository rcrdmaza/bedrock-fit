import Link from 'next/link';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { athletes, eventMetadata, results } from '@/db/schema';
import { requireOrgOrAdmin, type AdminOrOrg } from '@/lib/org';
import SiteHeader from '@/app/site-header';
import {
  adminLogout,
  approveClaims,
  rejectClaims,
} from '@/app/actions/admin';

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

type PendingRow = Awaited<ReturnType<typeof getPendingClaims>>[number];

// When the caller is an org member, we narrow to claims whose event
// triple matches an event_metadata row owned by the caller's org.
// Legacy admin (god-mode) sees the full pool. The join is INNER so
// org members don't see results for events that have no metadata row
// at all — those events haven't been "claimed" by any org yet, so
// nobody but god-mode admin should be reviewing their claims.
async function getPendingClaims(ctx: AdminOrOrg) {
  if (ctx.kind === 'admin') {
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
    .innerJoin(
      eventMetadata,
      and(
        eq(eventMetadata.eventName, results.eventName),
        eq(eventMetadata.eventDate, results.eventDate),
        eq(eventMetadata.raceCategory, results.raceCategory),
      ),
    )
    .where(
      and(
        eq(results.status, 'pending'),
        eq(eventMetadata.ownerOrgId, ctx.membership.org.id),
      ),
    )
    .orderBy(desc(results.claimSubmittedAt));
}

// Group key for a batched submission. claimResults() stamps a single
// `submittedAt` timestamp across every row of one bulk-claim call, so
// (email, submittedAt) pins together everything an athlete filed at
// once. Single-row claims from /results produce a group of one, which
// renders identically with one line. Email can be null defensively —
// older rows pre-claim-flow don't have it — so we coalesce to an
// empty-ish sentinel.
interface ClaimGroup {
  key: string;
  email: string | null;
  submittedAt: Date | null;
  note: string | null;
  athleteId: string;
  athleteName: string;
  rows: PendingRow[];
}

function groupPending(rows: PendingRow[]): ClaimGroup[] {
  const groups = new Map<string, ClaimGroup>();
  for (const row of rows) {
    // Millisecond timestamp gives exact equality across rows written in
    // the same transaction. Falls back to the row id if timestamp is
    // missing (shouldn't happen on new rows, but ungrouping beats
    // mis-grouping).
    const ts = row.claimSubmittedAt
      ? new Date(row.claimSubmittedAt).getTime()
      : `r-${row.id}`;
    const key = `${row.claimEmail ?? ''}|${row.athleteId}|${ts}`;
    const existing = groups.get(key);
    if (existing) {
      existing.rows.push(row);
      continue;
    }
    groups.set(key, {
      key,
      email: row.claimEmail ?? null,
      submittedAt: row.claimSubmittedAt ? new Date(row.claimSubmittedAt) : null,
      note: row.claimNote ?? null,
      athleteId: row.athleteId,
      athleteName: row.athleteName,
      rows: [row],
    });
  }
  // The DB query already orders by submittedAt desc; preserve that here.
  // Map iteration order matches insertion order in JS, so this is a no-op
  // except to be explicit about the contract for future edits.
  return [...groups.values()];
}

export default async function AdminPage() {
  const ctx = await requireOrgOrAdmin();
  const pending = await getPendingClaims(ctx);
  const groups = groupPending(pending);

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      {/* Admin-only secondary toolbar. Right-aligned under the site
          header so the admin can jump between the three admin views
          (Claims / Events / Import) without scrolling back to a menu.
          The current page's link is rendered in darker text to mark
          "you are here". */}
      <nav
        aria-label="Admin"
        className="flex items-center justify-end gap-5 px-8 py-3 border-b border-stone-100 bg-stone-50"
      >
        <span className="text-sm text-stone-900 font-medium">Claims</span>
        <Link
          href="/admin/events"
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Events
        </Link>
        <Link
          href="/admin/import"
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Import results
        </Link>
        <Link
          href="/admin/org"
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Org
        </Link>
        <form action={adminLogout}>
          <button
            type="submit"
            className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            Sign out
          </button>
        </form>
      </nav>

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-stone-900 mb-1">
            Pending claims
          </h1>
          <p className="text-sm text-stone-500">
            {pending.length === 0
              ? 'Nothing to review right now.'
              : `${pending.length} claim${pending.length !== 1 ? 's' : ''} across ${groups.length} submission${groups.length !== 1 ? 's' : ''}.`}
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm border border-dashed border-stone-200 rounded-2xl">
            You&apos;re all caught up.
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <ClaimGroupCard key={g.key} group={g} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ClaimGroupCard({ group }: { group: ClaimGroup }) {
  const isBatch = group.rows.length > 1;

  return (
    <div className="border border-stone-100 rounded-2xl p-5 hover:border-stone-300 transition-colors">
      {/* Header: athlete + submission meta */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-medium text-stone-900 text-sm">
            <Link
              href={`/athletes/${group.athleteId}`}
              className="hover:text-blue-600 transition-colors"
            >
              {group.athleteName}
            </Link>
          </div>
          <div className="text-xs text-stone-400 mt-0.5">
            {group.submittedAt
              ? `Submitted ${group.submittedAt.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}`
              : 'Submitted —'}
            {' · '}
            {group.rows.length} result{group.rows.length !== 1 ? 's' : ''}
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            isBatch
              ? 'bg-indigo-50 text-indigo-700'
              : 'bg-sky-50 text-sky-700'
          }`}
        >
          {isBatch ? `Batch · ${group.rows.length}` : 'Pending'}
        </span>
      </div>

      {/* Shared email + note — one per batch, not repeated per row */}
      <div className="rounded-lg bg-stone-50 px-4 py-3 text-xs text-stone-700 mb-4 space-y-1">
        <div>
          <span className="text-stone-400">Email: </span>
          <span className="font-medium">{group.email ?? '—'}</span>
        </div>
        <div>
          <span className="text-stone-400">Note: </span>
          <span>
            {group.note ? (
              group.note
            ) : (
              <span className="text-stone-400 italic">(none provided)</span>
            )}
          </span>
        </div>
      </div>

      {/* Per-row mini-table — shows what's in the batch */}
      <div className="border border-stone-100 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-xs">
          <thead className="bg-stone-50">
            <tr className="text-stone-500 text-left uppercase tracking-wide">
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Rank</th>
              <th className="px-3 py-2 font-medium text-right">Finish</th>
              <th className="px-3 py-2 font-medium text-right w-40">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="text-stone-700">
            {group.rows.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="px-3 py-2">
                  <div className="text-stone-900">{r.eventName}</div>
                  <div className="text-[11px] text-stone-400">
                    {r.eventDate
                      ? new Date(r.eventDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Date unknown'}
                  </div>
                </td>
                <td className="px-3 py-2">{r.raceCategory ?? '—'}</td>
                <td className="px-3 py-2 tabular-nums">
                  {r.overallRank ?? '—'}
                  {r.totalFinishers ? ` / ${r.totalFinishers}` : ''}
                </td>
                <td className="px-3 py-2 tabular-nums text-right">
                  {formatTime(r.finishTime)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <form action={approveClaims}>
                      <input
                        type="hidden"
                        name="resultIds"
                        value={r.id}
                      />
                      <button
                        type="submit"
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded transition-colors"
                        title="Approve this row"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={rejectClaims}>
                      <input
                        type="hidden"
                        name="resultIds"
                        value={r.id}
                      />
                      <button
                        type="submit"
                        className="text-[11px] text-stone-500 hover:text-stone-900 px-2 py-1 rounded transition-colors"
                        title="Reject this row"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Batch actions — single button per side, one form each, every row's
          id rides along as a hidden input. Single-row submissions get the
          same buttons but with one id in the payload. */}
      <div className="flex items-center gap-2">
        <form action={approveClaims}>
          {group.rows.map((r) => (
            <input
              key={r.id}
              type="hidden"
              name="resultIds"
              value={r.id}
            />
          ))}
          <button
            type="submit"
            className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            {isBatch ? `Approve all ${group.rows.length}` : 'Approve'}
          </button>
        </form>
        <form action={rejectClaims}>
          {group.rows.map((r) => (
            <input
              key={r.id}
              type="hidden"
              name="resultIds"
              value={r.id}
            />
          ))}
          <button
            type="submit"
            className="text-xs text-stone-600 hover:text-stone-900 px-3 py-2 transition-colors"
          >
            {isBatch ? 'Reject all' : 'Reject'}
          </button>
        </form>
      </div>
    </div>
  );
}
