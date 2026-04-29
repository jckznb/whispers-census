import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { HubTeasers } from '@/components/HubTeasers'
import { CLASS_NAV, RACE_NAV } from '@/utils/seo-nav'

function BrowseSection() {
  const allRaces = [
    ...RACE_NAV.alliance.map(r => ({ ...r, group: 'alliance' })),
    ...RACE_NAV.horde.map(r => ({ ...r, group: 'horde' })),
    ...RACE_NAV.neutral.map(r => ({ ...r, group: 'neutral' })),
  ]
  return (
    <section className="max-w-5xl mx-auto px-4 py-10 border-t border-void-800/40">
      <h2 className="font-display text-xl font-semibold text-void-100 mb-1">Browse by Class or Race</h2>
      <p className="text-void-500 text-sm mb-6">
        Deep-dive pages for every class and race — popularity, faction split, and spec breakdowns.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <p className="text-xs text-void-500 uppercase tracking-wider font-semibold mb-3">Classes</p>
          <div className="grid grid-cols-2 gap-1.5">
            {CLASS_NAV.map(({ slug, name }) => (
              <Link key={slug} href={`/${slug}`}
                    className="card px-3 py-2 text-sm text-void-300 hover:text-void-100
                               hover:border-yogg-purple/40 transition-colors truncate">
                {name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-void-500 uppercase tracking-wider font-semibold mb-3">Races</p>
          <div className="grid grid-cols-2 gap-1.5">
            {allRaces.map(({ slug, name }) => (
              <Link key={slug} href={`/${slug}`}
                    className="card px-3 py-2 text-sm text-void-300 hover:text-void-100
                               hover:border-yogg-purple/40 transition-colors truncate">
                {name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HubPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 pt-12 pb-8">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-void-50 tracking-wide glow-eye mb-3">
            Whispers Census
          </h1>
          <p className="text-void-400 text-lg max-w-xl">
            Real WoW character data from US servers — who's playing what, across general population,
            Mythic+, and rated PvP.
          </p>
        </section>

        {/* Section teasers */}
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <HubTeasers />
        </section>

        <BrowseSection />
      </main>

      <SiteFooter />
    </>
  )
}
