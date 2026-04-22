import SiteHeader from '@/app/site-header';

export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24">
        {/* Profile header skeleton */}
        <div className="mb-10 space-y-3" aria-hidden="true">
          <div className="h-8 w-56 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Stats row skeleton — matches the 6-cell, 2-row layout. */}
        <div
          className="grid grid-cols-3 gap-x-4 gap-y-6 mb-10 pb-10 border-b border-gray-100"
          aria-hidden="true"
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Results list skeleton */}
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border border-gray-100 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-1/2 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only">Loading athlete profile…</span>
      </section>
    </main>
  );
}
