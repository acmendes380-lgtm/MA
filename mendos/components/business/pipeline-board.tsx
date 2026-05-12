'use client'

import { useState } from 'react'
import { usePipeline } from '@/hooks/use-business'
import { STAGE_ORDER, STAGE_COLORS, getPipelineStageLabel } from '@/lib/utils/business-utils'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import type { PipelineStage } from '@/lib/utils/business-utils'

export function PipelineBoard() {
  const { data: deals, createDeal, moveDeal, deleteDeal } = usePipeline()
  const [adding, setAdding] = useState<PipelineStage | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newValue, setNewValue] = useState('')

  async function handleAdd(stage: PipelineStage) {
    if (!newTitle.trim()) return
    await createDeal.mutateAsync({
      title: newTitle.trim(),
      stage,
      value: parseFloat(newValue) || 0,
      client_id: null,
      notes: null,
    })
    setNewTitle('')
    setNewValue('')
    setAdding(null)
  }

  const stages = STAGE_ORDER.slice(0, 4) as PipelineStage[]

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {stages.map((stage) => {
        const stageDeals = deals?.filter((d) => d.stage === stage) ?? []
        const stageValue = stageDeals.reduce((s, d) => s + d.value, 0)
        const color = STAGE_COLORS[stage]
        return (
          <div key={stage} className="flex-shrink-0 w-60 space-y-2">
            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-xs font-medium" style={{ color }}>
                  {getPipelineStageLabel(stage)}
                </span>
                <span className="ml-2 text-xs text-neutral-600">({stageDeals.length})</span>
              </div>
              {stageValue > 0 && (
                <span className="text-xs text-neutral-500">${stageValue.toLocaleString()}</span>
              )}
            </div>

            <div className="space-y-1.5 min-h-[60px]">
              {stageDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="group rounded-lg border border-white/[0.06] bg-[#111111] p-3 hover:border-white/[0.10] transition-colors"
                >
                  <p className="text-xs font-medium text-white mb-1">{deal.title}</p>
                  {deal.clients && (
                    <p className="text-xs text-neutral-600">{deal.clients.name}</p>
                  )}
                  {deal.value > 0 && (
                    <p className="text-xs text-cyan-400 font-mono mt-1">
                      ${deal.value.toLocaleString()}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {stages.indexOf(stage) < stages.length - 1 && (
                      <button
                        onClick={() =>
                          moveDeal.mutate({
                            id: deal.id,
                            stage: stages[stages.indexOf(stage) + 1],
                          })
                        }
                        className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white transition-colors"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => moveDeal.mutate({ id: deal.id, stage: 'won' })}
                      className="text-xs text-emerald-500 hover:text-emerald-400 ml-auto"
                    >
                      Won
                    </button>
                    <button
                      onClick={() => moveDeal.mutate({ id: deal.id, stage: 'lost' })}
                      className="text-xs text-red-500 hover:text-red-400"
                    >
                      Lost
                    </button>
                    <button onClick={() => deleteDeal.mutate(deal.id)}>
                      <Trash2 className="h-3 w-3 text-neutral-600 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {adding === stage ? (
              <div className="rounded-lg border border-white/[0.08] bg-[#111111] p-2.5 space-y-2">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Deal title"
                  autoFocus
                  className="text-xs"
                />
                <Input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Value $"
                  className="text-xs"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => setAdding(null)}
                    className="flex-1 text-xs text-neutral-500 hover:text-white py-1 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAdd(stage)}
                    className="flex-1 text-xs text-blue-400 hover:text-blue-300 py-1 transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(stage)}
                className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-white/[0.08] px-3 py-2 text-xs text-neutral-600 hover:text-neutral-400 hover:border-white/[0.15] transition-all"
              >
                <Plus className="h-3 w-3" />
                Add deal
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
