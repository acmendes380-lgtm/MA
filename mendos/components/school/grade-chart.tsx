'use client'

import { useSubjects, useAssignments, useExams } from '@/hooks/use-school'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { calcSubjectAverage } from '@/lib/utils/school-utils'

export function GradeChart() {
  const { data: subjects } = useSubjects()
  const { data: assignments } = useAssignments()
  const { data: exams } = useExams()

  const data = subjects?.map((s) => {
    const aGrades = assignments?.filter((a) => a.subject_id === s.id && a.grade != null).map((a) => a.grade as number) ?? []
    const eGrades = exams?.filter((e) => e.subject_id === s.id && e.grade != null).map((e) => e.grade as number) ?? []
    const avg = calcSubjectAverage([...aGrades, ...eGrades])
    return { name: s.name, avg: avg != null ? Math.round(avg) : null, color: s.color }
  }).filter((d): d is { name: string; avg: number; color: string } => d.avg != null) ?? []

  if (!data.length) return (
    <Card>
      <p className="text-xs text-neutral-600 text-center py-6">Grade data will appear once assignments are graded.</p>
    </Card>
  )

  return (
    <Card>
      <h3 className="text-sm font-medium text-white mb-4">Grade Averages</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={28}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 11 }} />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#f0f0f0' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value}%`, 'Average']}
          />
          <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
