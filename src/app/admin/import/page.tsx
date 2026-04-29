import AdminHeader from '@/app/admin/admin-header';
import { requireAdmin } from '@/lib/auth';
import ImportForm from './import-form';

// The form talks to the DB and the admin cookie — no prerender.
export const dynamic = 'force-dynamic';

export default async function AdminImportPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader active="import" />

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
