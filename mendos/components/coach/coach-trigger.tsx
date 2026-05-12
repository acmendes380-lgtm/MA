'use client'

import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { useCoachStore } from '@/store/coach'

export function CoachTrigger() {
  const { toggle, isOpen } = useCoachStore()

  if (isOpen) return null

  return (
    <motion.button
      onClick={toggle}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="fixed bottom-6 right-6 z-30 flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors"
      title="Open AI Life Coach"
    >
      <Bot className="h-5 w-5 text-white" />
    </motion.button>
  )
}
