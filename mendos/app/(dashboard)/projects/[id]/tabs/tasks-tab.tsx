'use client'

import { useState } from 'react'
import { useTasks } from '@/hooks/use-tasks'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Check, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TaskStatus } from '@/types'

export function TasksTab({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading, createTask, updateTask, deleteTask } = useTasks(projectId)
  const [newTitle, setNewTitle] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    await createTask.mutateAsync({ title: newTitle.trim() })
    setNewTitle('')
  }

  const todo = tasks?.filter((t) => t.status === 'todo') ?? []
  const inProgress = tasks?.filter((t) => t.status === 'in_progress') ?? []
  const done = tasks?.filter((t) => t.status === 'done') ?? []

  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/40 transition-colors"
        />
        <Button type="submit" size="sm" disabled={!newTitle.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {[
        { label: 'To Do', items: todo },
        { label: 'In Progress', items: inProgress },
        { label: 'Done', items: done },
      ].map(({ label, items }) =>
        items.length > 0 ? (
          <div key={label}>
            <p className="text-xs text-neutral-500 mb-2">{label} ({items.length})</p>
            <div className="space-y-1.5">
              {items.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 rounded-lg border border-white/[0.04] p-3 hover:border-white/[0.08] transition-colors"
                >
                  <button
                    onClick={() => {
                      const next: Record<TaskStatus, TaskStatus> = {
                        todo: 'in_progress',
                        in_progress: 'done',
                        done: 'todo',
                      }
                      updateTask.mutate({ id: task.id, status: next[task.status] })
                    }}
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all shrink-0',
                      task.status === 'done' ? 'bg-blue-600 border-blue-600' :
                      task.status === 'in_progress' ? 'border-blue-500' :
                      'border-white/20'
                    )}
                  >
                    {task.status === 'done' && <Check className="h-3 w-3 text-white" />}
                    {task.status === 'in_progress' && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                  </button>

                  <span className={cn(
                    'flex-1 text-sm',
                    task.status === 'done' ? 'line-through text-neutral-600' : 'text-neutral-200'
                  )}>
                    {task.title}
                  </span>

                  <button
                    onClick={() => deleteTask.mutate(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}

      {tasks?.length === 0 && (
        <p className="text-center text-xs text-neutral-600 py-8">
          No tasks yet. Add one above.
        </p>
      )}
    </div>
  )
}
