import SiteHeader from '@/app/site-header';

// Rendered automatically by Next.js while the /results server component
// fetches from Postgres. Matches the real page chrome so the hand-off is
// invisible.
export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Find your results
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Search by name to find and claim your race history.
        </p>

        {/* Skeleton search input */}
        <div
          className="h-[46px] w-full rounded-lg bg-gray-100 animate-pulse mb-10"
          aria-hidden="true"
        />

        {/* Skeleton cards — visible hint that data is on the way */}
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="border border-gray-100 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-1/2 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only">Loading results…</span>
      </section>
    </main>
  );
}
