'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { StatCard } from '@/components/ui/stat-card'
import { Building2, Target, Dumbbell, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export function SectionHealth() {
  const { data } = useQuery({
    queryKey: ['section-health'],
    queryFn: async () => {
      const supabase = createClient()
      const [golf, workouts, assignments, clients] = await Promise.all([
        supabase.from('golf_rounds').select('score').order('date', { ascending: false }).limit(1),
        supabase.from('workouts').select('date').order('date', { ascending: false }).limit(1),
        supabase.from('assignments').select('id').eq('status', 'pending').limit(99),
        supabase.from('clients').select('status').eq('status', 'active'),
      ])
      return {
        lastGolfScore: golf.data?.[0]?.score ?? null,
        lastWorkout: workouts.data?.[0]?.date ?? null,
        pendingAssignments: assignments.data?.length ?? 0,
        activeClients: clients.data?.length ?? 0,
      }
    },
  })

  const cards = [
    {
      label: 'Last Golf Score',
      value: data?.lastGolfScore ?? '—',
      icon: Target,
      color: '#f59e0b',
      href: '/golf',
    },
    {
      label: 'Last Workout',
      value: data?.lastWorkout
        ? new Date(data.lastWorkout).toLocaleDateString('en', { weekday: 'short' })
        : '—',
      icon: Dumbbell,
      color: '#10b981',
      href: '/gym',
    },
    {
      label: 'Pending Work',
      value: data?.pendingAssignments ?? '—',
      unit: 'assignments',
      icon: GraduationCap,
      color: '#8b5cf6',
      href: '/school',
    },
    {
      label: 'Active Clients',
      value: data?.activeClients ?? '—',
      icon: Building2,
      color: '#06b6d4',
      href: '/business',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <Link key={c.href} href={c.href}>
          <StatCard
            label={c.label}
            value={c.value}
            unit={c.unit}
            color={c.color}
            className="hover:border-white/[0.10] transition-colors cursor-pointer"
          />
        </Link>
      ))}
    </div>
  )
}
