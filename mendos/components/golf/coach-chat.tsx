'use client'

import { useState, useRef, useEffect } from 'react'
import { useGolfCoachMessages, useGolfRounds } from '@/hooks/use-golf-rounds'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function CoachChat() {
  const { data: messages, isLoading: loadingMessages, addMessage } = useGolfCoachMessages()
  const { data: rounds } = useGolfRounds(10)
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
      const res = await fetch('/api/ai/golf-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, rounds: rounds ?? [] }),
      })
      const data = await res.json()
      await addMessage.mutateAsync({ role: 'assistant', content: data.reply })
    } catch {
      await addMessage.mutateAsync({
        role: 'assistant',
        content: 'I had trouble connecting. Please try again.',
      })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[500px] rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <Bot className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-medium text-white">Golf Coach</span>
        <span className="ml-auto text-xs text-neutral-600">Powered by GPT-4o-mini</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loadingMessages ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-10 w-2/3 ml-auto" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-8 w-8 text-amber-400/30 mb-3" />
            <p className="text-sm text-neutral-500">Ask your golf coach anything</p>
            <p className="text-xs text-neutral-600 mt-1">
              e.g. &quot;What are my biggest weaknesses?&quot; or &quot;Give me a putting drill&quot;
            </p>
          </div>
        ) : (
          messages?.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'bg-white/[0.06] text-neutral-200'
              )}
            >
              {msg.content}
            </div>
          ))
        )}
        {aiLoading && (
          <div className="max-w-[80%] rounded-xl px-3.5 py-2.5 bg-white/[0.06]">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0ms]" />
              <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:150ms]" />
              <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-white/[0.06]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your golf coach..."
          className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/30 transition-colors"
        />
        <Button type="submit" size="sm" disabled={!input.trim() || aiLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
