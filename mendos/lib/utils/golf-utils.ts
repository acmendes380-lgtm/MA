import type { GolfRound } from '@/types'

export function calcFairwayPct(hit: number, total: number): number {
  if (total === 0) return 0
  return Math.round((hit / total) * 100)
}

export function calcGIRPct(gir: number, holes = 18): number {
  return Math.round((gir / holes) * 100)
}

export function calcPuttsPerHole(putts: number, holes = 18): number {
  return putts / holes
}

export function scoreRelativeToPar(score: number, par = 72): number {
  return score - par
}

export function buildWeaknessScores(
  rounds: Pick<GolfRound, 'fairways_hit' | 'fairways_total' | 'gir' | 'putts' | 'scrambling' | 'score'>[]
): Record<string, number> {
  if (rounds.length === 0) {
    return { Driving: 50, Approach: 50, Putting: 50, 'Short Game': 50, Scoring: 50 }
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  const fairwayPcts = rounds.map((r) => calcFairwayPct(r.fairways_hit, r.fairways_total))
  const girPcts = rounds.map((r) => calcGIRPct(r.gir))
  const puttsPerHole = rounds.map((r) => calcPuttsPerHole(r.putts))
  const scramblingPcts = rounds.filter((r) => r.scrambling != null).map((r) => r.scrambling!)
  const avgScore = avg(rounds.map((r) => r.score))

  const scoringScore = Math.max(0, Math.min(100, Math.round(100 - (avgScore - 72) * 3)))
  const drivingScore = Math.round(avg(fairwayPcts))
  const approachScore = Math.round(avg(girPcts))
  const puttingScore = Math.max(0, Math.min(100, Math.round(100 - (avg(puttsPerHole) - 1.5) * 40)))
  const shortGameScore = scramblingPcts.length > 0 ? Math.round(avg(scramblingPcts)) : 50

  return {
    Driving: drivingScore,
    Approach: approachScore,
    Putting: puttingScore,
    'Short Game': shortGameScore,
    Scoring: scoringScore,
  }
}
