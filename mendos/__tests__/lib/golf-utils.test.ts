import {
  calcFairwayPct,
  calcGIRPct,
  calcPuttsPerHole,
  scoreRelativeToPar,
  buildWeaknessScores,
} from '@/lib/utils/golf-utils'

describe('calcFairwayPct', () => {
  it('returns 50 when half are hit', () => {
    expect(calcFairwayPct(7, 14)).toBe(50)
  })
  it('returns 0 when total is 0', () => {
    expect(calcFairwayPct(0, 0)).toBe(0)
  })
})

describe('calcGIRPct', () => {
  it('returns 100 when all 18 hit', () => {
    expect(calcGIRPct(18)).toBe(100)
  })
})

describe('calcPuttsPerHole', () => {
  it('returns 2 for 36 putts over 18 holes', () => {
    expect(calcPuttsPerHole(36)).toBeCloseTo(2)
  })
})

describe('scoreRelativeToPar', () => {
  it('returns +4 for 76 on a par 72', () => {
    expect(scoreRelativeToPar(76, 72)).toBe(4)
  })
  it('returns -2 for 70 on a par 72', () => {
    expect(scoreRelativeToPar(70, 72)).toBe(-2)
  })
})

describe('buildWeaknessScores', () => {
  it('returns scores between 0 and 100', () => {
    const rounds = [
      { fairways_hit: 7, fairways_total: 14, gir: 9, putts: 32, scrambling: 60, score: 80 },
    ]
    const scores = buildWeaknessScores(rounds)
    Object.values(scores).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    })
  })
})
