import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata = {
  title: 'PvP Demographics — Whispers Census',
  description:
    'Spec and role breakdown for rated PvP — see which specs dominate the arena and battleground leaderboards.',
}

export default function PvpLayout({ children }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  )
}
