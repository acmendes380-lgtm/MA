import {
  calcTotalRevenue,
  calcConversionRate,
  getPipelineStageLabel,
} from '@/lib/utils/business-utils'

describe('calcTotalRevenue', () => {
  it('returns 0 for empty clients', () => {
    expect(calcTotalRevenue([])).toBe(0)
  })
  it('sums value of active clients only', () => {
    const clients = [
      { status: 'active', value: 1000 },
      { status: 'active', value: 2000 },
      { status: 'lead', value: 5000 },
      { status: 'churned', value: 500 },
    ]
    expect(calcTotalRevenue(clients)).toBe(3000)
  })
})

describe('calcConversionRate', () => {
  it('returns 0 when no deals', () => {
    expect(calcConversionRate([])).toBe(0)
  })
  it('returns correct percentage', () => {
    const deals = [
      { stage: 'won' },
      { stage: 'won' },
      { stage: 'lost' },
      { stage: 'lead' },
    ]
    expect(calcConversionRate(deals)).toBe(50)
  })
})

describe('getPipelineStageLabel', () => {
  it('returns readable label for each stage', () => {
    expect(getPipelineStageLabel('won')).toBe('Closed Won')
    expect(getPipelineStageLabel('lost')).toBe('Closed Lost')
    expect(getPipelineStageLabel('lead')).toBe('Lead')
  })
})
