export function SiteFooter() {
  return (
    <footer className="border-t border-void-800/40 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-void-600 text-xs">
        <span>
          Data provided by{' '}
          <a
            href="https://develop.battle.net"
            className="text-void-400 hover:text-void-200 underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Blizzard Entertainment
          </a>
          . Whispers Census is not affiliated with Blizzard Entertainment.
        </span>
        <div className="flex items-center gap-4">
          <a href="/about" className="hover:text-void-400 transition-colors">About</a>
          <a
            href="https://ko-fi.com/whisperscensus"
            className="hover:text-void-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Support on Ko-fi
          </a>
        </div>
      </div>
    </footer>
  )
}
