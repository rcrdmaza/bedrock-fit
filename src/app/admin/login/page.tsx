import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import LoginForm from './login-form';

// Session cookie is read on every request; never cache this page.
export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  // Already signed in? Skip the form entirely.
  if (await isAdmin()) redirect('/admin');

  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-gray-900"
        >
          Bedrock.fit
        </Link>
      </nav>

      <section className="max-w-sm mx-auto px-8 pt-24 pb-24">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Admin</h1>
        <p className="text-sm text-gray-500 mb-8">
          Sign in to review pending claims.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
