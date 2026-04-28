import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import SiteHeader from '@/app/site-header';
import SignInForm from './sign-in-form';

// Reads the user cookie on every request — never cache.
export const dynamic = 'force-dynamic';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Already signed in? Skip the form.
  const user = await getCurrentUser();
  const { next } = await searchParams;
  if (user) redirect(next && next.startsWith('/') ? next : '/me');

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      <section className="max-w-sm mx-auto px-8 pt-24 pb-24">
        <h1 className="text-2xl font-semibold text-stone-900 mb-1">Sign in</h1>
        <p className="text-sm text-stone-500 mb-8">
          We&apos;ll email you a one-click link. No password needed.
        </p>
        <SignInForm />
      </section>
    </main>
  );
}
