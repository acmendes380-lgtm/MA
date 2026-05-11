'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExternalLink, Trash2, Plus, Link as LinkIcon } from 'lucide-react'

interface Resource { id: string; title: string; url: string }

export function ResourcesTab({ projectId }: { projectId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  const { data: resources } = useQuery({
    queryKey: ['project-resources', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_resources')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      return (data ?? []) as Resource[]
    },
  })

  const addMutation = useMutation({
    mutationFn: async ({ title, url }: { title: string; url: string }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Not authenticated')
      await supabase.from('project_resources').insert({
        project_id: projectId, user_id: user.id, title, url,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-resources', projectId] })
      setTitle('')
      setUrl('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('project_resources').delete().eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-resources', projectId] }),
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    await addMutation.mutateAsync({ title: title.trim(), url: normalizedUrl })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="flex-1" required />
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" className="flex-1" required />
        <Button type="submit" size="sm" disabled={!title.trim() || !url.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-2">
        {resources?.map((r) => (
          <div key={r.id} className="group flex items-center gap-3 rounded-lg border border-white/[0.04] p-3 hover:border-white/[0.08] transition-colors">
            <LinkIcon className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{r.title}</p>
              <p className="text-xs text-neutral-600 truncate">{r.url}</p>
            </div>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <ExternalLink className="h-3.5 w-3.5 text-neutral-500 hover:text-blue-400 transition-colors" />
            </a>
            <button onClick={() => deleteMutation.mutate(r.id)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
            </button>
          </div>
        ))}
        {resources?.length === 0 && (
          <p className="text-center text-xs text-neutral-600 py-8">No resources yet.</p>
        )}
      </div>
    </div>
  )
}
