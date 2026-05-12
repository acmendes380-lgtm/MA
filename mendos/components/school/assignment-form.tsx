'use client'

import { useState } from 'react'
import { useSubjects, useAssignments, useExams } from '@/hooks/use-school'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'

interface Props {
  type: 'assignment' | 'exam'
  onClose: () => void
}

export function WorkForm({ type, onClose }: Props) {
  const { data: subjects } = useSubjects()
  const { createAssignment } = useAssignments()
  const { createExam } = useExams()
  const [subjectId, setSubjectId] = useState(subjects?.[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subjectId || !title.trim()) return
    if (type === 'assignment') {
      await createAssignment.mutateAsync({ subject_id: subjectId, title: title.trim(), due_date: date })
    } else {
      await createExam.mutateAsync({ subject_id: subjectId, title: title.trim(), date })
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === 'assignment' ? 'Assignment title' : 'Exam name'} autoFocus required />
      <div className="grid grid-cols-2 gap-3">
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">Select subject</option>
          {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="[color-scheme:dark]" required />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" size="sm" disabled={!title.trim() || !subjectId} className="flex-1">
          Add {type}
        </Button>
      </div>
    </form>
  )
}
