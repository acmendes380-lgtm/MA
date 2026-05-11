'use client'

import { useState } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectForm } from '@/components/projects/project-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, FolderOpen } from 'lucide-react'
import type { ProjectCategory } from '@/types'

const FILTERS: { label: string; value: ProjectCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Personal', value: 'personal' },
  { label: 'Business', value: 'business' },
  { label: 'School', value: 'school' },
  { label: 'Golf', value: 'golf' },
  { label: 'Gym', value: 'gym' },
  { label: 'Content', value: 'content' },
]

export default function ProjectsPage() {
  const [filter, setFilter] = useState<ProjectCategory | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const { data: projects, isLoading } = useProjects(
    filter === 'all' ? undefined : filter
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-500 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-5">
          <h3 className="text-sm font-medium text-white mb-4">New Project</h3>
          <ProjectForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : projects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="h-10 w-10 text-neutral-700 mb-3" />
          <p className="text-sm text-neutral-500">No projects yet</p>
          <p className="text-xs text-neutral-600 mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  )
}
