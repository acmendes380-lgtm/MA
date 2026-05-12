import { differenceInCalendarDays, parseISO, subDays, isAfter } from 'date-fns'

export function calcSubjectAverage(grades: (number | null)[]): number | null {
  const valid = grades.filter((g): g is number => g != null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

export function calcWeeklyStudyHours(sessions: { date: string; duration_minutes: number }[]): number {
  const cutoff = subDays(new Date(), 7)
  const recent = sessions.filter((s) => isAfter(parseISO(s.date), cutoff))
  const totalMinutes = recent.reduce((sum, s) => sum + s.duration_minutes, 0)
  return totalMinutes / 60
}

export function getDaysUntil(dateStr: string): number {
  const target = parseISO(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return differenceInCalendarDays(target, today)
}
