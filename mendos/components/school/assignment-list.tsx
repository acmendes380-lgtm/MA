'use client'

import { useAssignments } from '@/hooks/use-school'
import { Skeleton } from '@/components/ui/skeleton'
import { getDaysUntil } from '@/lib/utils/school-utils'
import { cn } from '@/lib/utils/cn'
import { CheckCircle2, Clock, Trash2 } from 'lucide-react'

export function AssignmentList() {
  const { data: assignments, isLoading, updateAssignment, deleteAssignment } = useAssignments()

  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>
  if (!assignments?.length) return <p className="text-xs text-neutral-600 text-center py-8">No assignments yet.</p>

  return (
    <div className="space-y-2">
      {assignments.map((a) => {
        const days = getDaysUntil(a.due_date)
        const urgent = days <= 2 && a.status === 'pending'
        return (
          <div key={a.id} className={cn(
            'group flex items-center gap-3 rounded-xl border p-3 transition-colors',
            a.status === 'graded' ? 'border-white/[0.04] opacity-60' :
            urgent ? 'border-red-500/20 bg-red-500/[0.03]' :
            'border-white/[0.06] hover:border-white/[0.10]'
          )}>
            <button
              onClick={() => {
                const nextStatus = a.status === 'pending' ? 'submitted' : a.status === 'submitted' ? 'graded' : 'pending'
                updateAssignment.mutate({ id: a.id, status: nextStatus })
              }}
              className={cn('shrink-0 transition-colors',
                a.status === 'graded' ? 'text-emerald-400' :
                a.status === 'submitted' ? 'text-blue-400' :
                urgent ? 'text-red-400' : 'text-neutral-600 hover:text-white'
              )}
            >
              {a.status === 'graded' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm', a.status === 'graded' && 'line-through text-neutral-600')}>{a.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {a.subjects && (
                  <span className="text-xs" style={{ color: a.subjects.color }}>{a.subjects.name}</span>
                )}
                <span className="text-xs text-neutral-600">
                  {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `${days} days left`}
                </span>
              </div>
            </div>
            {a.grade != null && (
              <span className="text-sm font-bold text-emerald-400">{a.grade}%</span>
            )}
            <button onClick={() => deleteAssignment.mutate(a.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
