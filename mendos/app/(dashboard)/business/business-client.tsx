'use client'

import { useState } from 'react'
import { useClients, usePipeline, useBusinessNotes } from '@/hooks/use-business'
import { ClientTable } from '@/components/business/client-table'
import { ClientForm } from '@/components/business/client-form'
import { PipelineBoard } from '@/components/business/pipeline-board'
import { BusinessChat } from '@/components/business/business-chat'
import { BusinessNotes } from '@/components/business/business-notes'
import { RevenueChart } from '@/components/business/revenue-chart'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { calcTotalRevenue, calcConversionRate } from '@/lib/utils/business-utils'

const TABS = ['Overview', 'Clients', 'Pipeline', 'Notes', 'AI Assistant'] as const

export default function BusinessPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Overview')
  const [showClientForm, setShowClientForm] = useState(false)
  const { data: clients } = useClients()
  const { data: deals } = usePipeline()

  const revenue = calcTotalRevenue(clients ?? [])
  const activeClients = clients?.filter((c) => c.status === 'active').length ?? 0
  const leads = clients?.filter((c) => c.status === 'lead').length ?? 0
  const conversionRate = calcConversionRate(deals ?? [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${tab === t ? 'bg-cyan-500/10 text-cyan-400' : 'text-neutral-500 hover:text-white hover:bg-white/[0.05]'}`}
            >{t}</button>
          ))}
        </div>
        {tab === 'Clients' && (
          <Button size="sm" onClick={() => setShowClientForm(true)}>
            <Plus className="h-4 w-4" />Add Client
          </Button>
        )}
      </div>

      {showClientForm && (
        <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-5">
          <h3 className="text-sm font-medium text-white mb-4">New Client</h3>
          <ClientForm onClose={() => setShowClientForm(false)} />
        </div>
      )}

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="MRR" value={`$${revenue.toLocaleString()}`} color="#06b6d4" />
            <StatCard label="Active Clients" value={activeClients} color="#10b981" />
            <StatCard label="Leads" value={leads} color="#f59e0b" />
            <StatCard label="Conversion Rate" value={`${conversionRate}%`} color="#3b82f6" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RevenueChart />
            <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
              <h3 className="text-sm font-medium text-white mb-3">Pipeline Summary</h3>
              <div className="space-y-2">
                {['lead','contacted','proposal'].map((stage) => {
                  const count = deals?.filter((d) => d.stage === stage).length ?? 0
                  const value = deals?.filter((d) => d.stage === stage).reduce((s, d) => s + d.value, 0) ?? 0
                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400 capitalize">{stage}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-600">{count} deals</span>
                        {value > 0 && <span className="text-xs font-mono text-white">${value.toLocaleString()}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Clients' && <ClientTable />}
      {tab === 'Pipeline' && <PipelineBoard />}
      {tab === 'Notes' && <BusinessNotes />}
      {tab === 'AI Assistant' && <BusinessChat />}
    </div>
  )
}
