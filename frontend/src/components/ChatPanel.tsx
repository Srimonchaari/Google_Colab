import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ChatMessage } from '../types'

const EASE = [0.16, 1, 0.3, 1] as const

const HINTS = [
  'Were there any dangerous events?',
  'How long was the device idle?',
  'Describe the shaking event.',
  'What happened after 13 seconds?',
  'Summarise all events in order.',
  'What was the peak acceleration?',
]

interface ChatPanelProps {
  messages: ChatMessage[]
  onSend: (question: string) => Promise<void>
  onClear: () => void
  pipelineReady: boolean
  isWaiting: boolean
}

export function ChatPanel({ messages, onSend, onClear, pipelineReady, isWaiting }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isWaiting])

  const handleSend = async () => {
    const q = input.trim()
    if (!q || isWaiting || !pipelineReady) return
    setInput('')
    await onSend(q)
  }

  return (
    <div className="card p-6 flex flex-col" style={{ minHeight: 540 }}>
      <div className="flex items-center justify-between mb-4">
        <p className="section-label">Ask About Your Data</p>
        {messages.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClear}
            className="text-[11px] text-ss-t3 hover:text-ss-red transition-colors font-medium"
          >
            Clear
          </motion.button>
        )}
      </div>

      {/* Question pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {HINTS.map(h => (
          <motion.button
            key={h}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setInput(h)}
            className="text-[11px] font-medium px-3 py-1.5 rounded-full
                       bg-ss-indigo/[0.07] border border-ss-indigo/20 text-ss-indigo
                       hover:bg-ss-indigo/[0.13] hover:border-ss-indigo/40 transition-all"
          >
            {h}
          </motion.button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 px-1 pb-2" style={{ minHeight: 220 }}>
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-[13px] font-medium text-ss-t2">
              {pipelineReady
                ? 'Ask anything about your sensor data'
                : 'Run the pipeline first, then ask questions'}
            </p>
            <p className="text-[11px] text-ss-t3 mt-1.5">
              Try one of the pills above, or type your own question
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: EASE }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed
                               whitespace-pre-wrap break-words
                    ${msg.role === 'user'
                      ? 'bg-ss-blue text-white rounded-br-[6px]'
                      : 'bg-[#e9e9eb] text-ss-t1 rounded-bl-[6px]'}`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Typing indicator */}
        {isWaiting && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start"
          >
            <div className="bg-[#e9e9eb] rounded-2xl rounded-bl-[6px] px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.13 }}
                  className="w-2 h-2 bg-[#aeaeb2] rounded-full block"
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-black/[0.06]">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() }
          }}
          placeholder={pipelineReady ? 'Ask about your sensor data…' : 'Run pipeline first…'}
          disabled={!pipelineReady || isWaiting}
          className="flex-1 bg-ss-bg border border-black/[0.10] rounded-full px-4 py-2.5
                     text-[13px] text-ss-t1 placeholder:text-ss-t3
                     focus:outline-none focus:border-ss-blue focus:ring-2 focus:ring-ss-blue/10
                     disabled:opacity-50 transition-all"
        />
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => void handleSend()}
          disabled={!pipelineReady || !input.trim() || isWaiting}
          className="bg-ss-blue text-white rounded-full w-10 h-10 flex items-center justify-center
                     flex-shrink-0 disabled:opacity-40 hover:bg-[#0077ed] transition-colors"
          aria-label="Send"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </motion.button>
      </div>
    </div>
  )
}
