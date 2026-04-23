import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import SiteHeader from '@/app/site-header';
import { adminLogout } from '@/app/actions/admin';
import ImportForm from './import-form';

// The form talks to the DB and the admin cookie — no prerender.
export const dynamic = 'force-dynamic';

export default async function AdminImportPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <nav
        aria-label="Admin"
        className="flex items-center justify-end gap-5 px-8 py-3 border-b border-stone-100 bg-stone-50"
      >
        <Link
          href="/admin"
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Claims
        </Link>
        <Link
          href="/admin/events"
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Events
        </Link>
        <span className="text-sm text-stone-900 font-medium">Import results</span>
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
            Import race results
          </h1>
          <p className="text-sm text-stone-500">
            Upload a finisher CSV and attach it to an event. Every row becomes
            one result; new athletes are created as needed.
          </p>
        </div>

        <ImportForm />
      </section>
    </main>
  );
}
