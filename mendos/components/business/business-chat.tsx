'use client'

import { useState, useRef, useEffect } from 'react'
import { useBusinessChat, useClients, usePipeline } from '@/hooks/use-business'
import { Button } from '@/components/ui/button'
import { Send, Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function BusinessChat() {
  const { data: messages, isLoading, addMessage } = useBusinessChat()
  const { data: clients } = useClients()
  const { data: deals } = usePipeline()
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
      const res = await fetch('/api/ai/business-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: {
            activeClients: clients?.filter((c) => c.status === 'active').length ?? 0,
            totalLeads: clients?.filter((c) => c.status === 'lead').length ?? 0,
            openDeals: deals?.filter((d) => !['won', 'lost'].includes(d.stage)).length ?? 0,
          },
        }),
      })
      const data = await res.json()
      await addMessage.mutateAsync({ role: 'assistant', content: data.reply })
    } catch {
      await addMessage.mutateAsync({
        role: 'assistant',
        content: 'Connection error. Try again.',
      })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[520px] rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <Bot className="h-4 w-4 text-cyan-400" />
        <span className="text-sm font-medium text-white">MendAI Business Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages?.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-8 w-8 text-cyan-400/30 mb-3" />
            <p className="text-sm text-neutral-500">Your MendAI business strategist</p>
            <p className="text-xs text-neutral-600 mt-1">
              Ask about outreach, offers, pricing, cold DMs, or strategy
            </p>
          </div>
        )}
        {messages?.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'ml-auto bg-blue-600 text-white'
                : 'bg-white/[0.06] text-neutral-200'
            )}
          >
            {msg.content}
          </div>
        ))}
        {aiLoading && (
          <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 bg-white/[0.06]">
            <div className="flex gap-1">
              {[0, 150, 300].map((d) => (
                <div
                  key={d}
                  className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-white/[0.06]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your business assistant..."
          className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-cyan-500/30 transition-colors"
        />
        <Button type="submit" size="sm" disabled={!input.trim() || aiLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
