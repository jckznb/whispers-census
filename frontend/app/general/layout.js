import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata = {
  title: 'General Population — Whispers Census',
  description:
    'Race and class popularity across 1.6M+ guild roster characters on the ten highest-population US realms.',
}

export default function GeneralLayout({ children }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  )
}
