'use client'

import { usePathname } from 'next/navigation'
import BottomNavigation, { shouldShowBottomNav } from './BottomNavigation'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const withNav = shouldShowBottomNav(pathname)

  return (
    <div className={`app-root gpu-layer ${withNav ? 'app-page-with-nav' : ''}`}>
      <main className="w-full max-w-full overflow-x-hidden scroll-surface gpu-layer">{children}</main>
      <BottomNavigation />
    </div>
  )
}
