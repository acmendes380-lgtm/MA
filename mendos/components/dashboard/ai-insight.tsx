'use client'

import { useAIInsight } from '@/hooks/use-ai-insight'
import { Sparkles, RefreshCw } from 'lucide-react'

export function AIInsight() {
  const { data: insight, isLoading, refetch } = useAIInsight()

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-3 animate-pulse">
        <div className="h-4 w-4 rounded bg-blue-400/20" />
        <div className="h-4 flex-1 rounded bg-blue-400/10" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-5 py-3 group">
      <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
      <p className="flex-1 text-sm text-neutral-300">{insight}</p>
      <button
        onClick={() => refetch()}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <RefreshCw className="h-3.5 w-3.5 text-neutral-600 hover:text-neutral-400 transition-colors" />
      </button>
    </div>
  )
}
