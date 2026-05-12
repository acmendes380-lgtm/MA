'use client'

import { useState, useEffect, useRef } from 'react'
import { useSubjects, useStudySessions } from '@/hooks/use-school'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Timer, Play, Pause, RotateCcw } from 'lucide-react'

const MODES = { focus: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 }
type Mode = keyof typeof MODES

export function StudyTimer() {
  const { data: subjects } = useSubjects()
  const { logSession } = useStudySessions()
  const [mode, setMode] = useState<Mode>('focus')
  const [seconds, setSeconds] = useState(MODES.focus)
  const [running, setRunning] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [sessionsToday, setSessionsToday] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    setSeconds(MODES[mode])
    setRunning(false)
  }, [mode])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (mode === 'focus' && selectedSubject) {
              logSession.mutate({ subject_id: selectedSubject, duration_minutes: 25 })
              setSessionsToday((n) => n + 1)
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  function reset() {
    setRunning(false)
    setSeconds(MODES[mode])
  }

  const total = MODES[mode]
  const progress = ((total - seconds) / total) * 100
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  const color = mode === 'focus' ? '#8b5cf6' : '#10b981'
  const radius = 54
  const circumference = 2 * Math.PI * radius

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Timer className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-medium text-white">Study Timer</h3>
        {sessionsToday > 0 && (
          <span className="ml-auto text-xs text-neutral-500">{sessionsToday} sessions today</span>
        )}
      </div>

      <div className="flex gap-1 mb-6">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${mode === m ? 'bg-purple-500/10 text-purple-400' : 'text-neutral-500 hover:text-white hover:bg-white/[0.05]'}`}
          >
            {m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center">
          <svg width={120} height={120} viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={`${circumference * (1 - progress / 100)}`}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute text-3xl font-bold text-white tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setRunning(!running)} style={{ backgroundColor: color }}>
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {running ? 'Pause' : 'Start'}
          </Button>
        </div>

        {mode === 'focus' && subjects && subjects.length > 0 && (
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="">Select subject (optional)</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>
    </Card>
  )
}
