'use client'

import { useState, useEffect } from 'react'
import { useQuickNotes } from '@/hooks/use-quick-notes'
import { Card } from '@/components/ui/card'
import { StickyNote } from 'lucide-react'

export function QuickNotes() {
  const { data: saved, isLoading, debouncedSave, isSaving } = useQuickNotes()
  const [content, setContent] = useState('')

  useEffect(() => {
    if (saved !== undefined && content === '') {
      setContent(saved)
    }
  }, [saved])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    debouncedSave(e.target.value)
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-medium text-white">Quick Notes</h3>
        </div>
        {isSaving && (
          <span className="text-xs text-neutral-600">Saving...</span>
        )}
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Capture a thought, idea, or note..."
        disabled={isLoading}
        rows={4}
        className="w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-white/[0.10] transition-colors"
      />
    </Card>
  )
}
