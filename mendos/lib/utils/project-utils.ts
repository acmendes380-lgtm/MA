import type { ProjectCategory, Priority } from '@/types'

export const CATEGORY_COLORS: Record<ProjectCategory, string> = {
  personal: '#3b82f6',
  business: '#06b6d4',
  school: '#8b5cf6',
  golf: '#f59e0b',
  gym: '#10b981',
  content: '#ec4899',
}

export function getCategoryColor(category: ProjectCategory): string {
  return CATEGORY_COLORS[category] ?? '#3b82f6'
}

export function getPriorityBadge(priority: Priority): string {
  const map: Record<Priority, string> = {
    low: 'default',
    medium: 'blue',
    high: 'amber',
    urgent: 'red',
  }
  return map[priority]
}

export function computeProjectProgress(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0
  const done = tasks.filter((t) => t.status === 'done').length
  return Math.round((done / tasks.length) * 100)
}
