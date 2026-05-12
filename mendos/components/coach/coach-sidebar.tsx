'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLifeCoach } from '@/hooks/use-life-coach'
import { useCoachStore } from '@/store/coach'
import { Button } from '@/components/ui/button'
import { Send, Bot, X, Trash2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function CoachSidebar() {
  const { isOpen, close } = useCoachStore()
  const { data: messages, isLoading, addMessage, clearHistory } = useLifeCoach()
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [isOpen, messages])

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
      await addMessage.mutateAsync({ role: 'assistant', content: 'Connection error. Try again.' })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-[#0d0d0d] shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 shrink-0">
                <Bot className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-white">AI Life Coach</h2>
                <p className="text-xs text-neutral-500">Knows your goals, habits, and data</p>
              </div>
              <button
                onClick={() => clearHistory.mutate()}
                className="text-neutral-600 hover:text-neutral-400 transition-colors"
                title="Clear history"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={close} className="text-neutral-600 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages?.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 mb-4">
                    <Sparkles className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">Your Personal Life Coach</h3>
                  <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                    I know your habits, golf scores, workouts, school deadlines, and business metrics. Ask me anything.
                  </p>
                  <div className="mt-6 grid gap-2 w-full">
                    {[
                      'What should I focus on today?',
                      "How's my golf game trending?",
                      'What habits am I neglecting?',
                      'Help me plan my week',
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setInput(prompt)}
                        className="rounded-xl border border-white/[0.06] px-3 py-2.5 text-xs text-neutral-400 hover:text-white hover:border-white/[0.12] text-left transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'ml-auto bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white/[0.06] text-neutral-200 rounded-tl-sm'
                  )}
                >
                  {msg.content}
                </div>
              ))}

              {aiLoading && (
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:150ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-white/[0.06] p-4">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your life coach..."
                  className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500/40 transition-colors"
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
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
