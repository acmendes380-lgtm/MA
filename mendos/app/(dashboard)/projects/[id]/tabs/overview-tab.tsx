'use client'

import { useState } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import type { Project, ProjectStatus } from '@/types'

const STATUSES: ProjectStatus[] = ['active', 'paused', 'completed', 'archived']

export function OverviewTab({ project }: { project: Project }) {
  const { updateProject } = useProjects()
  const [editProgress, setEditProgress] = useState(false)
  const [progressVal, setProgressVal] = useState(String(project.progress))

  function handleProgressSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(progressVal)
    if (isNaN(n) || n < 0 || n > 100) return
    updateProject.mutate({ id: project.id, progress: n })
    setEditProgress(false)
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <h3 className="text-xs text-neutral-500 mb-3 uppercase tracking-wide">Progress</h3>
        {editProgress ? (
          <form onSubmit={handleProgressSubmit} className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              value={progressVal}
              onChange={(e) => setProgressVal(e.target.value)}
              autoFocus
              className="w-24"
            />
            <span className="text-sm text-neutral-400">%</span>
            <Button type="submit" size="sm">Save</Button>
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <button
              onClick={() => setEditProgress(true)}
              className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
            >
              {project.progress}%
            </button>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-xs text-neutral-500 mb-3 uppercase tracking-wide">Status</h3>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateProject.mutate({ id: project.id, status: s })}
              className={`rounded-lg px-3 py-1.5 text-xs capitalize transition-all ${
                project.status === s
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-500 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {project.deadline && (
        <Card>
          <h3 className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Deadline</h3>
          <p className="text-white font-medium">
            {format(new Date(project.deadline), 'MMMM d, yyyy')}
          </p>
        </Card>
      )}
    </div>
  )
}
