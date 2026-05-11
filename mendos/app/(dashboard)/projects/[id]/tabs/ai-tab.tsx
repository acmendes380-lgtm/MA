'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import type { Project } from '@/types'

export function AITab({ project }: { project: Project }) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchSuggestions() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/project-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      })
      if (!res.ok) throw new Error('Failed to get suggestions')
      const data = await res.json()
      setSuggestions(data.suggestions)
    } catch {
      setError('Could not get suggestions. Check your OpenAI key.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">AI Suggestions</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Get actionable ideas to move this project forward
          </p>
        </div>
        <Button size="sm" onClick={fetchSuggestions} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? 'Thinking...' : 'Get Suggestions'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4"
            >
              <span className="text-xs font-bold text-blue-400 shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-sm text-neutral-200">{s}</p>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="h-8 w-8 text-neutral-700 mb-3" />
          <p className="text-sm text-neutral-500">
            Click &quot;Get Suggestions&quot; to get AI-powered ideas for this project
          </p>
        </div>
      )}
    </div>
  )
}
