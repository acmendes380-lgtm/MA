'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Target,
  Dumbbell,
  GraduationCap,
  Bot,
  Settings,
  ChevronLeft,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard', accent: 'text-blue-400' },
  { href: '/projects', icon: FolderKanban, label: 'Projects', accent: 'text-blue-400' },
  { href: '/business', icon: Building2, label: 'MendAI', accent: 'text-cyan-400' },
  { href: '/golf', icon: Target, label: 'Golf', accent: 'text-amber-400' },
  { href: '/gym', icon: Dumbbell, label: 'Gym', accent: 'text-emerald-400' },
  { href: '/school', icon: GraduationCap, label: 'School', accent: 'text-purple-400' },
  { href: '/coach', icon: Bot, label: 'AI Coach', accent: 'text-blue-400' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex h-screen flex-col border-r border-white/[0.06] bg-[#0d0d0d] shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-4 border-b border-white/[0.06]">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 shrink-0">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-semibold text-white tracking-tight whitespace-nowrap overflow-hidden"
            >
              MendOS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-9 items-center gap-3 mx-2 rounded-lg px-2.5 text-sm transition-all duration-150',
                active
                  ? 'bg-white/[0.08] text-white'
                  : 'text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-300'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active ? item.accent : 'text-current'
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.06] py-3 space-y-0.5">
        <Link
          href="/settings"
          className="flex h-9 items-center gap-3 mx-2 rounded-lg px-2.5 text-sm text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-300 transition-all"
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-9 w-[calc(100%-16px)] mx-2 items-center gap-3 rounded-lg px-2.5 text-sm text-neutral-600 hover:text-neutral-400 transition-all"
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  )
}
