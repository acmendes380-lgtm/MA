'use client'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Client, PipelineDeal } from '@/types'

export function useClients() {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Client[]
    },
  })

  const createClientMutation = useMutation({
    mutationFn: async (input: Omit<Client, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase.from('clients').insert({ user_id: user.id, ...input })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })

  const updateClient = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { error } = await supabase.from('clients').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })

  return { ...query, createClient: createClientMutation, updateClient, deleteClient }
}

export function usePipeline() {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['pipeline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_deals')
        .select('*, clients(name, company)')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as (PipelineDeal & { clients: { name: string; company: string | null } | null })[]
    },
  })

  const createDeal = useMutation({
    mutationFn: async (input: Omit<PipelineDeal, 'id' | 'user_id' | 'updated_at'>) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase.from('pipeline_deals').insert({ user_id: user.id, ...input })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  })

  const moveDeal = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase
        .from('pipeline_deals')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  })

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pipeline_deals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  })

  return { ...query, createDeal, moveDeal, deleteDeal }
}

export function useBusinessNotes() {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['business-notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_notes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as { id: string; user_id: string; category: string; title: string; content: string; created_at: string }[]
    },
  })

  const createNote = useMutation({
    mutationFn: async ({
      category,
      title,
      content,
    }: {
      category: string
      title: string
      content: string
    }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase
        .from('business_notes')
        .insert({ user_id: user.id, category, title, content })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-notes'] }),
  })

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('business_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-notes'] }),
  })

  return { ...query, createNote, deleteNote }
}

export function useBusinessTasks() {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['business-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_tasks')
        .select('*, clients(name)')
        .order('deadline', { nullsFirst: false })
      if (error) throw error
      return data as {
        id: string
        user_id: string
        title: string
        priority: string
        status: string
        deadline: string | null
        client_id: string | null
        clients: { name: string } | null
      }[]
    },
  })

  const createTask = useMutation({
    mutationFn: async (input: {
      title: string
      priority: string
      deadline?: string
      client_id?: string
    }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase.from('business_tasks').insert({ user_id: user.id, ...input })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-tasks'] }),
  })

  const toggleTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('business_tasks').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-tasks'] }),
  })

  return { ...query, createTask, toggleTask }
}

export function useBusinessChat() {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['business-chat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_chat_messages')
        .select('*')
        .order('created_at')
        .limit(60)
      if (error) throw error
      return data as {
        id: string
        user_id: string
        role: string
        content: string
        created_at: string
      }[]
    },
  })

  const addMessage = useMutation({
    mutationFn: async ({ role, content }: { role: 'user' | 'assistant'; content: string }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase
        .from('business_chat_messages')
        .insert({ user_id: user.id, role, content })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-chat'] }),
  })

  return { ...query, addMessage }
}
