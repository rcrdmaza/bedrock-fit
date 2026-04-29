import { redirect } from 'next/navigation';
import AdminHeader from '@/app/admin/admin-header';
import { removeMember } from '@/app/actions/org';
import { listOrgMembers, requireOrgOrAdmin } from '@/lib/org';
import InviteForm from './invite-form';

// Org settings: shows the active org's members + an invite form for
// owners. Renders a "create your org" form for users who aren't yet
// in any org — the legacy admin sees this as "you're in god-mode,
// create an org if you want to use the multi-tenant flow."
export const dynamic = 'force-dynamic';

// Next 16 passes searchParams as a Promise so the page is statically
// renderable until the dynamic API is awaited. We only read it for the
// invite-status flash banner.
interface PageProps {
  searchParams: Promise<{ invite?: string }>;
}

export default async function AdminOrgPage({ searchParams }: PageProps) {
  const ctx = await requireOrgOrAdmin();
  const { invite } = await searchParams;

  // Legacy-admin path: god-mode user without a magic-link sign-in. We
  // route them to /auth/sign-in so they can attach an org to their
  // user identity. (If they already signed in as a magic-link user
  // *and* the legacy admin cookie is set, requireOrgOrAdmin returned
  // 'admin' first — the recovery is to sign in via magic-link.)
  if (ctx.kind === 'admin') {
    redirect('/auth/sign-in?next=/admin/org');
  }

  const { user, membership } = ctx;
  const members = await listOrgMembers(membership.org.id);
  const isOwner = membership.role === 'owner';

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader active="org" />

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24 space-y-12">
        <header>
          <h1 className="text-3xl font-semibold text-stone-900 mb-1">
            {membership.org.name}
          </h1>
          <p className="text-sm text-stone-500">
            You are signed in as{' '}
            <span className="font-medium text-stone-700">{user.email}</span>
            {' · '}
            <span className="capitalize">{membership.role}</span>
          </p>
        </header>

        <InviteFlash status={invite} />


        {/* Members list */}
        <div>
          <h2 className="text-base font-semibold text-stone-900 mb-3">
            Members
          </h2>
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Member</th>
                  <th className="text-left font-medium px-5 py-3">Role</th>
                  <th className="text-left font-medium px-5 py-3">Joined</th>
                  {isOwner && <th className="px-5 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.userId}
                    className="border-t border-slate-100"
                  >
                    <td className="px-5 py-3">
                      <div className="text-stone-900">{m.name ?? m.email}</div>
                      {m.name && (
                        <div className="text-xs text-stone-400">{m.email}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-stone-600 capitalize">
                      {m.role}
                    </td>
                    <td className="px-5 py-3 text-stone-500 tabular-nums">
                      {m.joinedAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    {isOwner && (
                      <td className="px-5 py-3 text-right">
                        {m.userId === user.id ? null : (
                          <form action={removeMember}>
                            <input
                              type="hidden"
                              name="userId"
                              value={m.userId}
                            />
                            <button
                              type="submit"
                              className="text-xs text-stone-500 hover:text-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          </form>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite form — owners only. We deliberately don't show a
            "you can't invite" message to admins; just hide the form. */}
        {isOwner && (
          <div>
            <h2 className="text-base font-semibold text-stone-900 mb-1">
              Invite a teammate
            </h2>
            <p className="text-sm text-stone-500 mb-4">
              They&apos;ll get an email with a one-click accept link. The
              invite expires in 7 days.
            </p>
            <InviteForm />
          </div>
        )}
      </section>
    </main>
  );
}

// Renders a single colored line for the various ?invite=... outcomes
// the accept route redirects with. Returns null for unknown / absent
// states so it stays out of the way during normal page loads.
function InviteFlash({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, { color: string; text: string }> = {
    ok: {
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      text: 'Invite accepted — welcome to the team.',
    },
    'wrong-user': {
      color: 'bg-amber-50 border-amber-200 text-amber-800',
      text: 'That invite was sent to a different email. Sign in with the invited address and try again.',
    },
    invalid: {
      color: 'bg-red-50 border-red-200 text-red-800',
      text: 'That invite link is no longer valid. Ask the inviter to send a new one.',
    },
    missing: {
      color: 'bg-red-50 border-red-200 text-red-800',
      text: 'That invite link is missing its token.',
    },
  };
  const cfg = map[status];
  if (!cfg) return null;
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${cfg.color}`}>
      {cfg.text}
    </div>
  );
}

