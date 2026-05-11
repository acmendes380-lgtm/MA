import { getCategoryColor, getPriorityBadge, computeProjectProgress } from '@/lib/utils/project-utils'

describe('getCategoryColor', () => {
  it('returns correct color for golf', () => {
    expect(getCategoryColor('golf')).toBe('#f59e0b')
  })
  it('returns fallback for unknown category', () => {
    expect(getCategoryColor('unknown' as any)).toBe('#3b82f6')
  })
})

describe('getPriorityBadge', () => {
  it('returns urgent variant for urgent priority', () => {
    expect(getPriorityBadge('urgent')).toBe('red')
  })
  it('returns default variant for low priority', () => {
    expect(getPriorityBadge('low')).toBe('default')
  })
  it('returns blue variant for medium priority', () => {
    expect(getPriorityBadge('medium')).toBe('blue')
  })
  it('returns amber variant for high priority', () => {
    expect(getPriorityBadge('high')).toBe('amber')
  })
})

describe('computeProjectProgress', () => {
  it('returns 0 for empty task list', () => {
    expect(computeProjectProgress([])).toBe(0)
  })
  it('returns 100 when all tasks are done', () => {
    const tasks = [
      { status: 'done' as const },
      { status: 'done' as const },
    ]
    expect(computeProjectProgress(tasks)).toBe(100)
  })
  it('returns 50 when half are done', () => {
    const tasks = [
      { status: 'done' as const },
      { status: 'todo' as const },
    ]
    expect(computeProjectProgress(tasks)).toBe(50)
  })
})
