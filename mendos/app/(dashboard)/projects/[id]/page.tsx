'use client'

import { useState } from 'react'
import { use } from 'react'
import { useProject } from '@/hooks/use-projects'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Badge } from '@/components/ui/badge'
import { getCategoryColor, getPriorityBadge } from '@/lib/utils/project-utils'
import { OverviewTab } from './tabs/overview-tab'
import { TasksTab } from './tabs/tasks-tab'
import { NotesTab } from './tabs/notes-tab'
import { ResourcesTab } from './tabs/resources-tab'
import { AITab } from './tabs/ai-tab'
import { Skeleton } from '@/components/ui/skeleton'

const TABS = ['Overview', 'Tasks', 'Notes', 'Resources', 'AI'] as const
type Tab = (typeof TABS)[number]

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: project, isLoading } = useProject(id)
  const [activeTab, setActiveTab] = useState<Tab>('Tasks')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!project) {
    return <p className="text-neutral-600 text-sm">Project not found.</p>
  }

  const color = getCategoryColor(project.category)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default" className="capitalize">{project.category}</Badge>
            <Badge variant={getPriorityBadge(project.priority) as 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan'}>{project.priority}</Badge>
            <Badge
              variant={project.status === 'completed' ? 'green' : project.status === 'paused' ? 'amber' : 'default'}
            >
              {project.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold text-white">{project.title}</h1>
          {project.description && (
            <p className="text-sm text-neutral-500 mt-1">{project.description}</p>
          )}
        </div>
        <ProgressRing value={project.progress} size={64} strokeWidth={5} color={color} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab
                ? 'border-blue-500 text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && <OverviewTab project={project} />}
      {activeTab === 'Tasks' && <TasksTab projectId={project.id} />}
      {activeTab === 'Notes' && <NotesTab projectId={project.id} />}
      {activeTab === 'Resources' && <ResourcesTab projectId={project.id} />}
      {activeTab === 'AI' && <AITab project={project} />}
    </div>
  )
}
