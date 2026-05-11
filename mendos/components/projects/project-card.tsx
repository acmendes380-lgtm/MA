'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from '@/components/ui/progress-ring'
import { getCategoryColor, getPriorityBadge } from '@/lib/utils/project-utils'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'
import type { Project } from '@/types'

export function ProjectCard({ project }: { project: Project }) {
  const color = getCategoryColor(project.category)
  const priorityVariant = getPriorityBadge(project.priority)

  return (
    <Link href={`/projects/${project.id}`}>
      <Card hover accent={color} className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{project.title}</h3>
            {project.description && (
              <p className="text-sm text-neutral-500 mt-0.5 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          <ProgressRing
            value={project.progress}
            size={44}
            strokeWidth={4}
            color={color}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={priorityVariant as 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan'}>{project.priority}</Badge>
          <Badge variant="default" className="capitalize">{project.category}</Badge>
          <Badge
            variant={
              project.status === 'completed'
                ? 'green'
                : project.status === 'paused'
                ? 'amber'
                : 'default'
            }
          >
            {project.status}
          </Badge>
        </div>

        {project.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(project.deadline), 'MMM d, yyyy')}</span>
          </div>
        )}
      </Card>
    </Link>
  )
}
