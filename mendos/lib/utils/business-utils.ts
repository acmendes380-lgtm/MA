export function calcTotalRevenue(clients: { status: string; value: number }[]): number {
  return clients
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => sum + c.value, 0)
}

export function calcConversionRate(deals: { stage: string }[]): number {
  if (deals.length === 0) return 0
  const won = deals.filter((d) => d.stage === 'won').length
  return Math.round((won / deals.length) * 100)
}

export function getPipelineStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    lead: 'Lead',
    contacted: 'Contacted',
    proposal: 'Proposal',
    won: 'Closed Won',
    lost: 'Closed Lost',
  }
  return labels[stage] ?? stage
}

export const STAGE_ORDER = ['lead', 'contacted', 'proposal', 'won', 'lost'] as const
export type PipelineStage = (typeof STAGE_ORDER)[number]

export const STAGE_COLORS: Record<PipelineStage, string> = {
  lead: '#555',
  contacted: '#3b82f6',
  proposal: '#f59e0b',
  won: '#10b981',
  lost: '#ef4444',
}
