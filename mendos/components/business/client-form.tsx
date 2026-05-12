'use client'

import { useState } from 'react'
import { useClients } from '@/hooks/use-business'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Client } from '@/types'

export function ClientForm({ onClose }: { onClose: () => void }) {
  const { createClient } = useClients()
  const [form, setForm] = useState({ name: '', company: '', email: '', status: 'lead', value: '' })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    await createClient.mutateAsync({
      name: form.name.trim(),
      company: form.company || null,
      email: form.email || null,
      status: form.status as Client['status'],
      value: parseFloat(form.value) || 0,
      notes: null,
      last_contact: null,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input value={form.name} onChange={set('name')} placeholder="Name" required autoFocus />
        <Input value={form.company} onChange={set('company')} placeholder="Company" />
        <Input type="email" value={form.email} onChange={set('email')} placeholder="Email" />
        <Input
          type="number"
          value={form.value}
          onChange={set('value')}
          placeholder="Contract value $"
          min="0"
          step="100"
        />
      </div>
      <select
        value={form.status}
        onChange={set('status')}
        className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none"
      >
        <option value="lead">Lead</option>
        <option value="active">Active Client</option>
        <option value="churned">Churned</option>
      </select>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!form.name.trim() || createClient.isPending}
          className="flex-1"
        >
          Add Client
        </Button>
      </div>
    </form>
  )
}
