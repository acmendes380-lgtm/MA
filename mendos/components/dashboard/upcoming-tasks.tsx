'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, CircleDot } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import type { Task } from '@/types'

export function UpcomingTasks() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['upcoming-tasks'],
    queryFn: async () => {
      const supabase = createClient()
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .neq('status', 'done')
        .gte('deadline', today)
        .order('deadline')
        .limit(6)
      if (error) throw error
      return data as Task[]
    },
  })

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-medium text-white">Upcoming</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9" />)}
        </div>
      ) : tasks?.length === 0 ? (
        <p className="text-xs text-neutral-600 text-center py-6">
          No upcoming tasks
        </p>
      ) : (
        <div className="space-y-2">
          {tasks?.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-2.5 rounded-lg border border-white/[0.04] p-2.5"
            >
              <CircleDot className="h-3.5 w-3.5 text-neutral-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-200 truncate">{task.title}</p>
                {task.deadline && (
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
