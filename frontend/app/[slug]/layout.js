import { SiteHeader } from '@/components/SiteHeader'

export default function SlugLayout({ children }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-void-800/60 py-6 mt-8">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-void-600">
          <a href="/" className="hover:text-void-400 transition-colors font-display tracking-wide">
            Whispers Census
          </a>
          <span>Data from US Blizzard API — updated regularly</span>
        </div>
      </footer>
    </>
  )
}
