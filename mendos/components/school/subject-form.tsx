'use client'

import { useState } from 'react'
import { useSubjects } from '@/hooks/use-school'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export function SubjectManager() {
  const { data: subjects, createSubject, deleteSubject } = useSubjects()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await createSubject.mutateAsync({ name: name.trim(), color })
    setName('')
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="flex gap-2 items-center">
        <div className="flex gap-1 shrink-0">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`h-5 w-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white/20 ring-offset-1 ring-offset-[#111]' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Subject name" className="flex-1" />
        <Button type="submit" size="sm" disabled={!name.trim()}>Add</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {subjects?.map((s) => (
          <div key={s.id} className="group flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5">
            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-sm text-neutral-200">{s.name}</span>
            <button onClick={() => deleteSubject.mutate(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              <Trash2 className="h-3 w-3 text-neutral-600 hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
