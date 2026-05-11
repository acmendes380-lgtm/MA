'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Project, ProjectCategory, Priority } from '@/types'

export function useProjects(category?: ProjectCategory) {
  const supabase = createClient()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['projects', category],
    queryFn: async () => {
      let q = supabase.from('projects').select('*').order('created_at', { ascending: false })
      if (category) q = q.eq('category', category)
      const { data, error } = await q
      if (error) throw error
      return data as Project[]
    },
  })

  const createProject = useMutation({
    mutationFn: async (input: {
      title: string
      description?: string
      category: ProjectCategory
      priority: Priority
      deadline?: string
      color: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('projects')
        .insert({ user_id: user.id, ...input })
        .select()
        .single()
      if (error) throw error
      return data as Project
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { error } = await supabase.from('projects').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  return { ...query, createProject, updateProject, deleteProject }
}

export function useProject(id: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Project
    },
    enabled: !!id,
  })
}
