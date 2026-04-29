import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata = {
  title: 'Mythic+ Demographics — Whispers Census',
  description:
    'Spec and role breakdown for Mythic+ content — see which tank, healer, and DPS specs are most popular in rated M+ runs.',
}

export default function MythicLayout({ children }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  )
}
