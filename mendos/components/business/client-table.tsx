'use client'

import { useClients } from '@/hooks/use-business'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Users } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_VARIANT: Record<string, 'amber' | 'green' | 'default'> = {
  lead: 'amber',
  active: 'green',
  churned: 'default',
}

export function ClientTable() {
  const { data: clients, isLoading, deleteClient } = useClients()

  if (isLoading)
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    )

  if (!clients?.length)
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Users className="h-10 w-10 text-neutral-700 mb-3" />
        <p className="text-sm text-neutral-500">No clients yet. Add your first one.</p>
      </div>
    )

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            {['Name', 'Company', 'Status', 'Value', 'Last Contact', ''].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-neutral-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {clients.map((c) => (
            <tr key={c.id} className="group hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 font-medium text-white">{c.name}</td>
              <td className="px-4 py-3 text-neutral-400">{c.company ?? '—'}</td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[c.status] ?? 'default'}>{c.status}</Badge>
              </td>
              <td className="px-4 py-3 text-neutral-300 font-mono">
                {c.value > 0 ? `$${c.value.toLocaleString()}` : '—'}
              </td>
              <td className="px-4 py-3 text-neutral-500 text-xs">
                {c.last_contact ? format(new Date(c.last_contact), 'MMM d') : '—'}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => deleteClient.mutate(c.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5 text-neutral-600 hover:text-red-400 transition-colors" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
