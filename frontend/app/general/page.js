import Link from 'next/link'
import { CensusApp } from '@/components/CensusApp'
import { CLASS_NAV, RACE_NAV } from '@/utils/seo-nav'

function ClassGrid() {
  return (
    <div id="browse-classes" className="max-w-7xl mx-auto px-4 pt-12 pb-6">
      <h2 className="font-display text-2xl font-semibold text-void-100 mb-1">Browse by Class</h2>
      <p className="text-void-500 text-sm mb-5">
        Per-class demographics — race popularity, faction split, and spec distribution.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CLASS_NAV.map(({ slug, name }) => (
          <Link key={slug} href={`/${slug}`}
                className="card px-3 py-2 text-sm text-void-300 hover:text-void-100
                           hover:border-yogg-purple/40 transition-colors truncate">
            {name}
          </Link>
        ))}
      </div>
    </div>
  )
}

function RaceGrid() {
  return (
    <div id="browse-races" className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="font-display text-2xl font-semibold text-void-100 mb-1">Browse by Race</h2>
      <p className="text-void-500 text-sm mb-5">
        Per-race demographics — class popularity across PvP, Mythic+, and general population.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#1a6eb5' }}>Alliance</p>
          <div className="grid grid-cols-1 gap-1.5">
            {RACE_NAV.alliance.map(({ slug, name }) => (
              <Link key={slug} href={`/${slug}`}
                    className="card px-3 py-2 text-sm text-void-300 hover:text-void-100
                               hover:border-yogg-purple/40 transition-colors">
                {name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8c1c1c' }}>Horde</p>
          <div className="grid grid-cols-1 gap-1.5">
            {RACE_NAV.horde.map(({ slug, name }) => (
              <Link key={slug} href={`/${slug}`}
                    className="card px-3 py-2 text-sm text-void-300 hover:text-void-100
                               hover:border-yogg-purple/40 transition-colors">
                {name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-void-500">Neutral</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RACE_NAV.neutral.map(({ slug, name }) => (
            <Link key={slug} href={`/${slug}`}
                  className="card px-3 py-2 text-sm text-void-300 hover:text-void-100
                             hover:border-yogg-purple/40 transition-colors">
              {name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function GeneralPage() {
  return (
    <CensusApp>
      <div className="border-t border-void-800/60">
        <ClassGrid />
        <RaceGrid />
      </div>
    </CensusApp>
  )
}
