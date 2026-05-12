import { calcSubjectAverage, calcWeeklyStudyHours, getDaysUntil } from '@/lib/utils/school-utils'

describe('calcSubjectAverage', () => {
  it('returns null for empty grades', () => {
    expect(calcSubjectAverage([])).toBeNull()
  })
  it('returns average of grades', () => {
    expect(calcSubjectAverage([80, 90, 100])).toBeCloseTo(90)
  })
  it('ignores null grades', () => {
    expect(calcSubjectAverage([null, 80, null, 100])).toBeCloseTo(90)
  })
})

describe('calcWeeklyStudyHours', () => {
  it('returns 0 for no sessions', () => {
    expect(calcWeeklyStudyHours([])).toBe(0)
  })
  it('sums minutes and converts to hours', () => {
    const today = new Date()
    const d1 = new Date(today); d1.setDate(d1.getDate() - 1)
    const old = new Date(today); old.setDate(old.getDate() - 10)
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    const sessions = [
      { date: fmt(today), duration_minutes: 60 },
      { date: fmt(d1), duration_minutes: 90 },
      { date: fmt(old), duration_minutes: 120 },
    ]
    expect(calcWeeklyStudyHours(sessions)).toBeCloseTo(2.5)
  })
})

describe('getDaysUntil', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getDaysUntil(today)).toBe(0)
  })
  it('returns positive for future dates', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 3)
    expect(getDaysUntil(tomorrow.toISOString().split('T')[0])).toBe(3)
  })
})
