import SiteHeader from '@/app/site-header';

export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      {/* Banner skeleton — keeps the layout from jumping when the real
          page resolves and a tinted tier banner replaces the neutral
          placeholder. */}
      <section className="bg-stone-50 pt-12 pb-10" aria-hidden="true">
        <div className="max-w-3xl mx-auto px-8 flex flex-col items-center text-center gap-3">
          <div className="w-24 h-24 rounded-full bg-stone-100 animate-pulse" />
          <div className="h-5 w-24 bg-stone-100 rounded-full animate-pulse" />
          <div className="h-8 w-56 bg-stone-100 rounded animate-pulse mt-2" />
          <div className="h-4 w-40 bg-stone-100 rounded animate-pulse" />
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-8 pt-12 pb-24">
        {/* Stats row skeleton — matches the 6-cell, 2-row layout. */}
        <div
          className="grid grid-cols-3 gap-x-4 gap-y-6 mb-10 pb-10 border-b border-stone-100"
          aria-hidden="true"
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-stone-100 rounded animate-pulse" />
              <div className="h-7 w-16 bg-stone-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Results list skeleton */}
        <div className="h-4 w-32 bg-stone-100 rounded animate-pulse mb-4" />
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border border-stone-100 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-1/2 space-y-2">
                  <div className="h-4 bg-stone-100 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-stone-100 rounded animate-pulse" />
                </div>
                <div className="h-5 w-20 bg-stone-100 rounded-full animate-pulse" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-3 w-16 bg-stone-100 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-stone-100 rounded animate-pulse" />
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
