import { calcTotalVolume, calcWeeklyWorkouts, getStrengthProgress } from '@/lib/utils/gym-utils'

describe('calcTotalVolume', () => {
  it('returns 0 for empty list', () => {
    expect(calcTotalVolume([])).toBe(0)
  })
  it('sums sets * reps * weight', () => {
    const exercises = [
      { sets: 3, reps: 10, weight: 100 },
      { sets: 3, reps: 8, weight: 80 },
    ]
    expect(calcTotalVolume(exercises)).toBe(3 * 10 * 100 + 3 * 8 * 80)
  })
  it('skips exercises with null weight', () => {
    const exercises = [{ sets: 3, reps: 10, weight: null }]
    expect(calcTotalVolume(exercises)).toBe(0)
  })
})

describe('calcWeeklyWorkouts', () => {
  it('returns 0 for empty list', () => {
    expect(calcWeeklyWorkouts([])).toBe(0)
  })
  it('counts workouts in last 7 days', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoWeeksAgo = new Date(today)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const workouts = [
      { date: today.toISOString().split('T')[0] },
      { date: yesterday.toISOString().split('T')[0] },
      { date: twoWeeksAgo.toISOString().split('T')[0] },
    ]
    expect(calcWeeklyWorkouts(workouts)).toBe(2)
  })
})

describe('getStrengthProgress', () => {
  it('returns empty array for missing exercise', () => {
    expect(getStrengthProgress([], 'Bench Press')).toEqual([])
  })
  it('returns max weight per date for given exercise', () => {
    const data = [
      { date: '2026-01-01', name: 'Bench Press', weight: 80, sets: 3, reps: 10 },
      { date: '2026-01-01', name: 'Bench Press', weight: 85, sets: 1, reps: 5 },
      { date: '2026-01-08', name: 'Bench Press', weight: 90, sets: 3, reps: 8 },
    ]
    const result = getStrengthProgress(data, 'Bench Press')
    expect(result).toEqual([
      { date: '2026-01-01', weight: 85 },
      { date: '2026-01-08', weight: 90 },
    ])
  })
})
