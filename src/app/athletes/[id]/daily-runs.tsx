// Daily-runs section rendered on /athletes/[id]. Server component:
// fetches runs the athlete authored *or* was tagged in, then renders
// each as a card. The owner sees a "+ Log a run" toggle and a Delete
// button on rows they authored; everyone else gets the read-only view.
//
// The section is hidden entirely on a redacted private profile (the
// page-level guard handles that). When the athlete has no runs and
// isn't the owner, we render nothing so the layout doesn't carry an
// empty header for visitors.

import Link from 'next/link';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import {
  athletes,
  dailyRunParticipants,
  dailyRuns,
} from '@/db/schema';
import {
  formatDistance,
  formatDuration,
  paceLabel,
  isDistanceUnit,
} from '@/lib/daily-runs';
import { getDisplayName } from '@/lib/athlete-display';
import DailyRunsToggle from './daily-runs-toggle';
import DeleteDailyRunButton from './delete-daily-run-button';

interface Props {
  athleteId: string;
  // Whether the viewing user owns this profile. Drives the form
  // toggle + the Delete button on rows the owner authored.
  isOwner: boolean;
}

// Shape we render in the "with…" line. Carries enough to call
// getDisplayName so a tagged athlete with a nickname preference shows
// their nickname rather than legal name.
type CompanionAthlete = {
  id: string;
  name: string;
  nickname: string | null;
  displayPreference: string;
};

function formatRunDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function DailyRunsSection({ athleteId, isOwner }: Props) {
  // Step 1: collect run IDs the athlete is connected to. This is
  // either as the author (createdByAthleteId) or as a tagged
  // participant. We do the union of two cheap selects rather than a
  // join + DISTINCT so each branch is index-friendly (the table has
  // an index on each side). De-duplicate in JS afterwards.
  const [authored, tagged] = await Promise.all([
    db
      .select({ id: dailyRuns.id })
      .from(dailyRuns)
      .where(eq(dailyRuns.createdByAthleteId, athleteId)),
    db
      .select({ id: dailyRunParticipants.dailyRunId })
      .from(dailyRunParticipants)
      .where(eq(dailyRunParticipants.athleteId, athleteId)),
  ]);

  const runIds = Array.from(
    new Set([...authored.map((r) => r.id), ...tagged.map((r) => r.id)]),
  );

  if (runIds.length === 0) {
    // No runs at all. Owner still sees the section so they can log
    // their first one; non-owners see nothing.
    if (!isOwner) return null;
    return (
      <section
        aria-label="Daily runs"
        className="mt-12 pt-10 border-t border-stone-100"
      >
        <Header isOwner={isOwner} count={0} />
        <p className="text-sm text-stone-500 mt-3">
          Log your training runs here — distance, time, where you ran,
          even who you ran with.
        </p>
      </section>
    );
  }

  // Step 2: fetch the runs themselves, newest first.
  const runs = await db
    .select()
    .from(dailyRuns)
    .where(inArray(dailyRuns.id, runIds))
    .orderBy(desc(dailyRuns.runDate), desc(dailyRuns.createdAt));

  // Step 3: fetch all participant rows for these runs in one shot,
  // then resolve the athletes named on them so we can render proper
  // links. We separately need the *authors* of any runs where the
  // viewer is a tagged participant — so the card can show "with
  // <Author>" instead of just "with <other guests>".
  const participantRows = await db
    .select({
      runId: dailyRunParticipants.dailyRunId,
      athleteId: dailyRunParticipants.athleteId,
    })
    .from(dailyRunParticipants)
    .where(inArray(dailyRunParticipants.dailyRunId, runIds));

  const referencedAthleteIds = new Set<string>();
  for (const row of participantRows) referencedAthleteIds.add(row.athleteId);
  for (const r of runs) referencedAthleteIds.add(r.createdByAthleteId);
  // Skip the profile owner — we don't want to render their own name on
  // their own card.
  referencedAthleteIds.delete(athleteId);

  const athleteRows: CompanionAthlete[] =
    referencedAthleteIds.size > 0
      ? await db
          .select({
            id: athletes.id,
            name: athletes.name,
            nickname: athletes.nickname,
            displayPreference: athletes.displayPreference,
          })
          .from(athletes)
          .where(inArray(athletes.id, Array.from(referencedAthleteIds)))
      : [];
  const athletesById = new Map(athleteRows.map((a) => [a.id, a]));

  // Step 4: pre-group participants per run for O(1) lookup at render.
  const participantsByRun = new Map<string, string[]>();
  for (const row of participantRows) {
    const existing = participantsByRun.get(row.runId);
    if (existing) existing.push(row.athleteId);
    else participantsByRun.set(row.runId, [row.athleteId]);
  }

  return (
    <section
      aria-label="Daily runs"
      className="mt-12 pt-10 border-t border-stone-100"
    >
      <Header isOwner={isOwner} count={runs.length} />

      <ul className="mt-5 space-y-3">
        {runs.map((run) => {
          const isAuthor = run.createdByAthleteId === athleteId;
          // The cast is safe — the action layer rejects anything that
          // isn't 'mi'/'km' before insert. The runtime guard is here so
          // a hand-edited DB row never crashes the formatter.
          const unit = isDistanceUnit(run.distanceUnit) ? run.distanceUnit : 'mi';
          // The distance value comes back from numeric() as a string.
          // formatDistance + paceLabel both accept either, but we
          // normalize once for the pace path which needs a number.
          const distanceNumber = Number(run.distanceValue);

          // Build the "with…" line. If the viewer is on someone else's
          // card (i.e. tagged), show the author *and* the other tagged
          // athletes minus the viewer themselves. If the viewer is the
          // author's profile, show only the tagged crew.
          const taggedIds = participantsByRun.get(run.id) ?? [];
          const companionIds = isAuthor
            ? taggedIds
            : [
                run.createdByAthleteId,
                ...taggedIds.filter((a) => a !== athleteId),
              ];
          const companions: CompanionAthlete[] = [];
          for (const id of companionIds) {
            const a = athletesById.get(id);
            if (a) companions.push(a);
          }

          return (
            <li
              key={run.id}
              className="rounded-2xl border border-stone-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {/* Date + distance + duration is the lead row. We
                      lean on font weights instead of icons so the card
                      reads cleanly at the small sizes we use. */}
                  <div className="text-sm font-semibold text-stone-900">
                    {formatDistance(distanceNumber, unit)}
                    <span className="text-stone-400 font-normal mx-1.5">·</span>
                    {formatDuration(run.durationSeconds)}
                    <span className="text-stone-400 font-normal mx-1.5">·</span>
                    <span className="text-stone-500 font-normal">
                      {paceLabel(run.durationSeconds, distanceNumber, unit)}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    {formatRunDate(run.runDate)}
                    {run.location ? (
                      <>
                        <span className="mx-1.5">·</span>
                        {run.location}
                      </>
                    ) : null}
                  </div>

                  {companions.length > 0 ? (
                    <div className="text-xs text-stone-500 mt-1.5">
                      with{' '}
                      {companions.map((a, idx, arr) => (
                        <span key={a.id}>
                          <Link
                            href={`/athletes/${a.id}`}
                            className="text-blue-700 hover:text-blue-900"
                          >
                            {getDisplayName(a)}
                          </Link>
                          {idx < arr.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {run.notes ? (
                    <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                      {run.notes}
                    </p>
                  ) : null}
                </div>

                {/* Right rail — Strava link + (owner-only) delete.
                    Stays compact so the card doesn't feel button-heavy. */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {run.stravaUrl ? (
                    <a
                      href={run.stravaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      Strava ↗
                    </a>
                  ) : null}
                  {isOwner && isAuthor ? (
                    <DeleteDailyRunButton runId={run.id} />
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Header({ isOwner, count }: { isOwner: boolean; count: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Daily runs</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          {count === 0
            ? 'No runs logged yet.'
            : `${count} run${count === 1 ? '' : 's'} logged.`}
        </p>
      </div>
      {isOwner ? <DailyRunsToggle /> : null}
    </div>
  );
}
