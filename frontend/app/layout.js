import { Cinzel, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
  },
  title: 'Whispers Census — WoW Character Demographics',
  description:
    'See what races and classes real WoW players are choosing. Population data from US PvP leaderboards, Mythic+ runs, and 1.6M+ guild roster characters.',
  metadataBase: new URL('https://whisperscensus.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://whisperscensus.com/',
    title: 'Whispers Census — WoW Character Demographics',
    description:
      'See what races and classes real WoW players are choosing. Population data from US PvP leaderboards, Mythic+ runs, and 1.6M+ guild roster characters.',
    images: [{ url: '/android-chrome-512x512.png' }],
  },
  twitter: {
    card: 'summary',
    title: 'Whispers Census — WoW Character Demographics',
    description:
      'See what races and classes real WoW players are choosing. Population data from US PvP leaderboards, Mythic+ runs, and 1.6M+ guild roster characters.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
