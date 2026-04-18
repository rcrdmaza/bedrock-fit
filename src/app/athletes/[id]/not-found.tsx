import Link from 'next/link';

export default function AthleteNotFound() {
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

      <section className="max-w-xl mx-auto px-8 pt-24 pb-24 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Athlete not found
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          We couldn&apos;t find an athlete with that id. They may have been
          removed, or the link might be wrong.
        </p>
        <Link
          href="/results"
          className="inline-block text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Browse all results
        </Link>
      </section>
    </main>
  );
}
