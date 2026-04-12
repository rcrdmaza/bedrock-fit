import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="text-xl font-semibold tracking-tight text-gray-900">
          Bedrock.fit
        </span>
        <div className="flex items-center gap-6">
          <Link href="/results" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Results
          </Link>
          <Link href="/leagues" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Leagues
          </Link>
          <Link href="/signin" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Race results, reimagined
        </div>
        <h1 className="text-5xl font-semibold text-gray-900 leading-tight mb-6">
          Your race history,<br />turned into a story
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10">
          Bedrock.fit transforms finish times into rich charts, performance trends, and competitive games. Find your results, claim your profile, and see how you stack up.
        </p>

        {/* Search bar */}
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <input
            type="text"
            placeholder="Search your name to find results..."
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="bg-blue-600 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Search
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-8 py-10 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-semibold text-gray-900">10M+</div>
            <div className="text-sm text-gray-500 mt-1">Race results indexed</div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-gray-900">50K+</div>
            <div className="text-sm text-gray-500 mt-1">Events tracked</div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-gray-900">12+</div>
            <div className="text-sm text-gray-500 mt-1">Endurance disciplines</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-8 py-24">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-16">
          More than a results database
        </h2>
        <div className="grid grid-cols-3 gap-8">

          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl mb-4 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 14l4-4 3 3 4-5 3 3" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Performance charts</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Pace trends, PR progressions, field position histograms. Every result becomes a data point in your career story.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl mb-4 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="#7c3aed" strokeWidth="1.5"/>
                <path d="M10 6v4l3 2" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Competitive leagues</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Monthly leagues built on age-graded scores. Compete fairly against athletes of any age across any race.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl mb-4 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3l2 5h5l-4 3 1.5 5L10 13l-4.5 3L7 11 3 8h5z" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Achievements & XP</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Earn badges for milestones, streaks, and course mastery. Level up your profile between race seasons.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 mx-8 mb-16 rounded-3xl px-8 py-16 text-center max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Find your results and claim your profile
        </h2>
        <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
          Search millions of race results across running, triathlon, cycling and more. Your career history is waiting.
        </p>
        <button className="bg-white text-gray-900 px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
          Search results
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-8 py-8 flex items-center justify-between max-w-4xl mx-auto">
        <span className="text-sm font-medium text-gray-900">Bedrock.fit</span>
        <span className="text-xs text-gray-400">Built for endurance athletes</span>
      </footer>

    </main>
  );
}