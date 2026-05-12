'use client'

import { useState } from 'react'
import { useSubjects, useAssignments, useExams, useStudySessions } from '@/hooks/use-school'
import { SubjectManager } from '@/components/school/subject-form'
import { AssignmentList } from '@/components/school/assignment-list'
import { GradeChart } from '@/components/school/grade-chart'
import { StudyTimer } from '@/components/school/study-timer'
import { WorkForm } from '@/components/school/assignment-form'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Plus } from 'lucide-react'
import { calcWeeklyStudyHours } from '@/lib/utils/school-utils'
import { format } from 'date-fns'

const TABS = ['Overview', 'Assignments', 'Exams', 'Timer', 'AI'] as const

export default function SchoolPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Overview')
  const [showAddWork, setShowAddWork] = useState<'assignment' | 'exam' | null>(null)
  const [studyPlan, setStudyPlan] = useState<string | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const { data: subjects } = useSubjects()
  const { data: assignments } = useAssignments()
  const { data: exams } = useExams()
  const { data: sessions } = useStudySessions()

  const weeklyHours = calcWeeklyStudyHours(sessions ?? [])
  const pending = assignments?.filter((a) => a.status === 'pending').length ?? 0
  const upcomingExams = exams?.filter((e) => e.status === 'upcoming') ?? []

  async function getStudyPlan() {
    setPlanLoading(true)
    try {
      const res = await fetch('/api/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects, upcomingExams: upcomingExams.slice(0, 5), pendingAssignments: assignments?.filter(a => a.status === 'pending') }),
      })
      const data = await res.json()
      setStudyPlan(data.plan)
    } finally {
      setPlanLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${tab === t ? 'bg-purple-500/10 text-purple-400' : 'text-neutral-500 hover:text-white hover:bg-white/[0.05]'}`}
            >{t}</button>
          ))}
        </div>
        {(tab === 'Assignments' || tab === 'Exams') && (
          <Button size="sm" onClick={() => setShowAddWork(tab === 'Assignments' ? 'assignment' : 'exam')}>
            <Plus className="h-4 w-4" />{tab === 'Assignments' ? 'Add Assignment' : 'Add Exam'}
          </Button>
        )}
      </div>

      {showAddWork && (
        <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-5">
          <h3 className="text-sm font-medium text-white mb-4">New {showAddWork}</h3>
          <WorkForm type={showAddWork} onClose={() => setShowAddWork(null)} />
        </div>
      )}

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Study Hours" value={weeklyHours.toFixed(1)} unit="this week" color="#8b5cf6" />
            <StatCard label="Pending" value={pending} unit="assignments" color="#f59e0b" />
            <StatCard label="Upcoming Exams" value={upcomingExams.length} color="#ef4444" />
            <StatCard label="Subjects" value={subjects?.length ?? 0} color="#3b82f6" />
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-4">
            <h3 className="text-xs text-neutral-400 mb-3 uppercase tracking-wide">Subjects</h3>
            <SubjectManager />
          </div>
          <GradeChart />
        </div>
      )}

      {tab === 'Assignments' && <AssignmentList />}

      {tab === 'Exams' && (
        <div className="space-y-2">
          {upcomingExams.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#111111] p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{e.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: e.subjects?.color }}>{e.subjects?.name}</span>
                  <span className="text-xs text-neutral-600">{format(new Date(e.date), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          ))}
          {!upcomingExams.length && <p className="text-xs text-neutral-600 text-center py-8">No upcoming exams.</p>}
        </div>
      )}

      {tab === 'Timer' && (
        <div className="max-w-sm mx-auto">
          <StudyTimer />
        </div>
      )}

      {tab === 'AI' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">AI Study Plan</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Personalized weekly schedule based on your subjects and deadlines</p>
            </div>
            <Button size="sm" onClick={getStudyPlan} disabled={planLoading}>
              {planLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {planLoading ? 'Generating...' : 'Generate Plan'}
            </Button>
          </div>
          {studyPlan && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.04] p-5">
              <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">{studyPlan}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
