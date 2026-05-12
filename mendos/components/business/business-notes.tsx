'use client'

import { useState } from 'react'
import { useBusinessNotes } from '@/hooks/use-business'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, StickyNote } from 'lucide-react'

const CATEGORIES = ['idea', 'strategy', 'meeting', 'content', 'other'] as const
const CATEGORY_VARIANT: Record<string, 'purple' | 'blue' | 'green' | 'amber' | 'default'> = {
  idea: 'purple',
  strategy: 'blue',
  meeting: 'green',
  content: 'amber',
  other: 'default',
}

export function BusinessNotes() {
  const { data: notes, isLoading: _isLoading, createNote, deleteNote } = useBusinessNotes()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: 'idea', title: '', content: '' })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    await createNote.mutateAsync(form)
    setForm({ category: 'idea', title: '', content: '' })
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Quick Capture
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-white/[0.08] bg-[#111111] p-4 space-y-3"
        >
          <div className="flex gap-2">
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-2 py-1.5 text-xs text-white outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Title"
              autoFocus
              required
              className="flex-1 rounded-lg border border-white/[0.08] bg-transparent px-3 py-1.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/40"
            />
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            placeholder="Write your note..."
            rows={3}
            className="w-full resize-none rounded-lg border border-white/[0.06] bg-transparent px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-white/[0.10]"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!form.title.trim()}
              className="flex-1"
            >
              Save Note
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {notes?.map((n) => (
          <div
            key={n.id}
            className="group rounded-xl border border-white/[0.06] bg-[#111111] p-4 hover:border-white/[0.10] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={CATEGORY_VARIANT[n.category] ?? 'default'} className="capitalize">
                {n.category}
              </Badge>
              <h4 className="text-sm font-medium text-white flex-1">{n.title}</h4>
              <button
                onClick={() => deleteNote.mutate(n.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
              </button>
            </div>
            {n.content && (
              <p className="text-xs text-neutral-500 leading-relaxed">{n.content}</p>
            )}
          </div>
        ))}
        {!notes?.length && !showForm && (
          <div className="flex flex-col items-center py-12 text-center">
            <StickyNote className="h-8 w-8 text-neutral-700 mb-3" />
            <p className="text-sm text-neutral-500">No notes yet. Capture your first idea.</p>
          </div>
        )}
      </div>
    </div>
  )
}
