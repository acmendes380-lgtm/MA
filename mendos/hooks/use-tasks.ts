'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Task, Priority } from '@/types'

export function useTasks(projectId: string) {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .is('parent_task_id', null)
        .order('order_index')
      if (error) throw error
      return data as Task[]
    },
    enabled: !!projectId,
  })

  const createTask = useMutation({
    mutationFn: async (input: { title: string; priority?: Priority; deadline?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const order = (query.data?.length ?? 0)
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        project_id: projectId,
        order_index: order,
        ...input,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  return { ...query, createTask, updateTask, deleteTask }
}
