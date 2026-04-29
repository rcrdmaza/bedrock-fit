import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import AdminHeader from '@/app/admin/admin-header';
import LoginForm from './login-form';

// Session cookie is read on every request; never cache this page.
export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  // Already signed in? Skip the form entirely.
  if (await isAdmin()) redirect('/admin');

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Pre-auth variant — navy chrome with no nav links and no
          sign-out, since we don't have a session yet. */}
      <AdminHeader variant="pre-auth" />

      <section className="max-w-sm mx-auto px-8 pt-24 pb-24">
        <h1 className="text-2xl font-semibold text-stone-900 mb-1">Admin</h1>
        <p className="text-sm text-stone-500 mb-8">
          Sign in to review pending claims.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
