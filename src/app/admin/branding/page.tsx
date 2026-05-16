import AdminHeader from '@/app/admin/admin-header';
import AdminSidebar from '@/app/admin/admin-sidebar';
import { requireAdmin } from '@/lib/auth';
import { getBranding } from '@/lib/site-branding';
import BrandingForm from './branding-form';

// Operator-facing page for replacing the site's logo + favicon. Reads
// the singleton branding row, hands it to the client form so the
// previews and "Remove" buttons reflect current state.
//
// `force-dynamic` matches the rest of /admin: this page reads the
// admin cookie and the (uncached, by design — operators want to see
// their own write immediately) branding row.
export const dynamic = 'force-dynamic';

interface PageProps {
  // After every mutating action we redirect back with `?error=<key>`
  // on failure; the form renders a friendly banner. Success path is
  // bare redirect — the new previews are the success signal.
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminBrandingPage({ searchParams }: PageProps) {
  await requireAdmin();
  const branding = await getBranding();
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader active="branding" />

      <div className="flex">
        <AdminSidebar />
        <section className="flex-1 max-w-3xl mx-auto px-8 pt-16 pb-24">
          <div className="mb-10">
            <h1 className="text-3xl font-semibold text-stone-900 mb-1">
              Branding
            </h1>
            <p className="text-sm text-stone-500">
              Upload the site logo and favicon. New uploads go live across
              every page on the next visit — browsers may cache favicons for
              up to 24 hours.
            </p>
          </div>

          <BrandingForm
            logoDataUrl={branding.logoDataUrl}
            faviconDataUrl={branding.faviconDataUrl}
            error={error ?? null}
          />
        </section>
      </div>
    </main>
  );
}
