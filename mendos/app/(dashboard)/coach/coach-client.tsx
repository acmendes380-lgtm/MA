'use client'

import { useState, useRef, useEffect } from 'react'
import { useLifeCoach } from '@/hooks/use-life-coach'
import { Button } from '@/components/ui/button'
import { Send, Bot, Trash2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const QUICK_PROMPTS = [
  'What should I prioritize today?',
  'How can I improve my golf game?',
  "Analyze my week's performance",
  'What habits should I build?',
  'Help me plan my business outreach',
  'What are my biggest growth areas?',
]

export default function CoachPage() {
  const { data: messages, isLoading, addMessage, clearHistory } = useLifeCoach()
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || aiLoading) return
    const userMsg = input.trim()
    setInput('')
    setAiLoading(true)
    await addMessage.mutateAsync({ role: 'user', content: userMsg })

    try {
      const res = await fetch('/api/ai/life-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages ?? [] }),
      })
      const data = await res.json()
      await addMessage.mutateAsync({ role: 'assistant', content: data.reply })
    } catch {
      await addMessage.mutateAsync({ role: 'assistant', content: 'Connection error. Please try again.' })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-white">AI Life Coach</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Personalized coaching powered by your real data</p>
        </div>
        {(messages?.length ?? 0) > 0 && (
          <Button variant="ghost" size="sm" onClick={() => clearHistory.mutate()}>
            <Trash2 className="h-4 w-4" />
            Clear history
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-6 space-y-4 mb-4">
        {messages?.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600/10 mb-5">
              <Sparkles className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Your Personal Life Coach</h2>
            <p className="text-sm text-neutral-500 max-w-md mb-8 leading-relaxed">
              I have access to your habits, productivity scores, golf rounds, workouts, school deadlines, and business metrics. Ask me anything.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="rounded-xl border border-white/[0.06] px-4 py-3 text-xs text-neutral-400 hover:text-white hover:border-white/[0.12] text-left transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages?.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/20 mr-2.5 mt-0.5 shrink-0">
                <Bot className="h-3.5 w-3.5 text-blue-400" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white/[0.06] text-neutral-200 rounded-tl-sm'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {aiLoading && (
          <div className="flex justify-start">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/20 mr-2.5 shrink-0">
              <Bot className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk to your life coach..."
          className="flex-1 rounded-xl border border-white/[0.08] bg-[#111111] px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/40 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend(e as unknown as React.FormEvent)
            }
          }}
        />
        <Button type="submit" size="sm" disabled={!input.trim() || aiLoading} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
