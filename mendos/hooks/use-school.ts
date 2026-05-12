'use client'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Subject, Assignment, Exam } from '@/types'
import { format } from 'date-fns'

export function useSubjects() {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('name')
      if (error) throw error
      return data as Subject[]
    },
  })

  const createSubject = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase.from('subjects').insert({ user_id: user.id, name, color })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  })

  const deleteSubject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subjects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  })

  return { ...query, createSubject, deleteSubject }
}

export function useAssignments() {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, subjects(name, color)')
        .order('due_date')
      if (error) throw error
      return data as (Assignment & { subjects: { name: string; color: string } | null })[]
    },
  })

  const createAssignment = useMutation({
    mutationFn: async (input: { subject_id: string; title: string; due_date: string; notes?: string }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase.from('assignments').insert({ user_id: user.id, ...input })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })

  const updateAssignment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Assignment> & { id: string }) => {
      const { error } = await supabase.from('assignments').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assignments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })

  return { ...query, createAssignment, updateAssignment, deleteAssignment }
}

export function useExams() {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*, subjects(name, color)')
        .order('date')
      if (error) throw error
      return data as (Exam & { subjects: { name: string; color: string } | null })[]
    },
  })

  const createExam = useMutation({
    mutationFn: async (input: { subject_id: string; title: string; date: string; notes?: string }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase.from('exams').insert({ user_id: user.id, ...input })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  })

  const updateExam = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Exam> & { id: string }) => {
      const { error } = await supabase.from('exams').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  })

  return { ...query, createExam, updateExam }
}

export function useStudySessions() {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['study-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .order('date', { ascending: false })
        .limit(60)
      if (error) throw error
      return data as { id: string; subject_id: string; duration_minutes: number; notes: string | null; date: string }[]
    },
  })

  const logSession = useMutation({
    mutationFn: async ({ subject_id, duration_minutes, notes }: { subject_id: string; duration_minutes: number; notes?: string }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      const { error } = await supabase.from('study_sessions').insert({
        user_id: user.id,
        subject_id,
        duration_minutes,
        notes: notes || null,
        date: format(new Date(), 'yyyy-MM-dd'),
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['study-sessions'] }),
  })

  return { ...query, logSession }
}
