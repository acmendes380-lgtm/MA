'use client'

import { usePathname } from 'next/navigation'
import { Bot } from 'lucide-react'
import { useCoachStore } from '@/store/coach'
import { Button } from '@/components/ui/button'

const LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/business': 'MendAI Business',
  '/golf': 'Golf',
  '/gym': 'Gym',
  '/school': 'School',
  '/coach': 'AI Coach',
  '/settings': 'Settings',
}

function getLabel(pathname: string): string {
  if (LABELS[pathname]) return LABELS[pathname]
  for (const [key, val] of Object.entries(LABELS)) {
    if (key !== '/' && pathname.startsWith(key)) return val
  }
  return 'MendOS'
}

export function TopBar() {
  const pathname = usePathname()
  const { toggle } = useCoachStore()

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/[0.06] px-6 shrink-0">
      <span className="text-sm font-medium text-white">{getLabel(pathname)}</span>
      <Button variant="ghost" size="sm" onClick={toggle}>
        <Bot className="h-4 w-4 text-blue-400" />
        AI Coach
      </Button>
    </header>
  )
}
