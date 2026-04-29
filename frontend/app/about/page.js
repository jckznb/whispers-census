export const metadata = {
  title: 'About — Whispers Census',
  description: 'Whispers Census is a hobby project by a dad and gamer who makes apps for games he loves.',
}

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-semibold text-void-100 tracking-wide mb-8">
        About Whispers Census
      </h1>

      <div className="space-y-5 text-void-300 leading-relaxed">
        <p>
          Hi — I&apos;m Chris. I&apos;m a dad, a software developer, and a WoW player who has been
          staring at character select screens for longer than I&apos;d like to admit.
        </p>
        <p>
          Whispers Census started because I kept wondering what everyone else was actually playing.
          Not theorycrafting spreadsheets — real data, from real players. So I built a crawler that
          pulls character data from the Blizzard API and turns it into something you can actually
          look at.
        </p>
        <p>
          This is a hobby project, full stop. There&apos;s no company behind it, no VC money,
          no growth targets. Just a person who makes apps for games he likes and puts them on
          the internet.
        </p>
        <p>
          If you find it useful, or just enjoy poking around the data, I&apos;d love to hear
          about it. And if you want to help keep the servers running, a Ko-fi goes a long way.
        </p>

        <div className="pt-4">
          <a
            href="https://ko-fi.com/whisperscensus"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            Support on Ko-fi
          </a>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-void-700/40 text-void-600 text-xs">
        Whispers Census is not affiliated with or endorsed by Blizzard Entertainment.
        World of Warcraft is a trademark of Blizzard Entertainment, Inc.
      </div>
    </div>
  )
}
