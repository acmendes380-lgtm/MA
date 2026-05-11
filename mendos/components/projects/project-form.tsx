'use client'

import { useState } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORY_COLORS } from '@/lib/utils/project-utils'
import type { ProjectCategory, Priority } from '@/types'

const CATEGORIES: ProjectCategory[] = ['personal', 'business', 'school', 'golf', 'gym', 'content']
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

interface ProjectFormProps {
  onClose: () => void
}

export function ProjectForm({ onClose }: ProjectFormProps) {
  const { createProject } = useProjects()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ProjectCategory>('personal')
  const [priority, setPriority] = useState<Priority>('medium')
  const [deadline, setDeadline] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await createProject.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      deadline: deadline || undefined,
      color: CATEGORY_COLORS[category],
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-neutral-400 mb-1.5 block">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project name..."
          autoFocus
          required
        />
      </div>

      <div>
        <label className="text-xs text-neutral-400 mb-1.5 block">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this project about?"
          rows={2}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/50 transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProjectCategory)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 capitalize"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 capitalize"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p} className="capitalize">{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-400 mb-1.5 block">Deadline (optional)</label>
        <Input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="[color-scheme:dark]"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!title.trim() || createProject.isPending}
          className="flex-1"
        >
          {createProject.isPending ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  )
}
