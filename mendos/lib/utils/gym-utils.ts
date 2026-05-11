import { subDays, parseISO, isAfter } from 'date-fns'

export function calcTotalVolume(
  exercises: { sets: number; reps: number; weight: number | null }[]
): number {
  return exercises.reduce((total, ex) => {
    if (ex.weight == null) return total
    return total + ex.sets * ex.reps * ex.weight
  }, 0)
}

export function calcWeeklyWorkouts(workouts: { date: string }[]): number {
  const cutoff = subDays(new Date(), 7)
  return workouts.filter((w) => isAfter(parseISO(w.date), cutoff)).length
}

export function getStrengthProgress(
  exercises: { date: string; name: string; weight: number | null; sets: number; reps: number }[],
  exerciseName: string
): { date: string; weight: number }[] {
  const filtered = exercises.filter(
    (e) => e.name.toLowerCase() === exerciseName.toLowerCase() && e.weight != null
  )

  const byDate: Record<string, number> = {}
  for (const e of filtered) {
    byDate[e.date] = Math.max(byDate[e.date] ?? 0, e.weight!)
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, weight]) => ({ date, weight }))
}
