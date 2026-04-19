import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { runPipeline, sendChat } from './api'
import type { ChatMessage, MotionEvent, PipelineResult } from './types'

import { Navbar }        from './components/Navbar'
import { Hero }          from './components/Hero'
import { AboutSection }  from './components/AboutSection'
import { StatsGrid }     from './components/StatsGrid'
import { PipelinePanel } from './components/PipelinePanel'
import { ChatPanel }     from './components/ChatPanel'
import { ChartView }     from './components/ChartView'

let _id = 0
const nextId = () => String(++_id)
const EASE = [0.16, 1, 0.3, 1] as const

export default function App() {
  const [result,        setResult]        = useState<PipelineResult | null>(null)
  const [isRunning,     setIsRunning]     = useState(false)
  const [statusLog,     setStatusLog]     = useState('')
  const [messages,      setMessages]      = useState<ChatMessage[]>([])
  const [isWaiting,     setIsWaiting]     = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<MotionEvent | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const chartRef   = useRef<HTMLDivElement>(null)

  const handleEventSelect = (ev: MotionEvent | null) => {
    setSelectedEvent(ev)
    if (ev) chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleRun = async (file: File | null, backend: string) => {
    setIsRunning(true)
    setSelectedEvent(null)
    setStatusLog('⏳  Starting pipeline…\n')
    try {
      const data = await runPipeline(file, backend)
      setResult(data)
      const tag = data.index_active ? 'LlamaIndex + LLM' : 'keyword fallback'
      setStatusLog(
        (data.warn ? `⚠   ${data.warn}\n\n` : '') +
        `✅  Pipeline ready\n` +
        `    Samples    : ${data.samples.toLocaleString()}\n` +
        `    Duration   : ${data.duration}s @ 100 Hz\n` +
        `    Events     : ${data.event_count}\n` +
        `    IQR clipped: ${data.iqr.n_clipped} (${data.iqr.pct_clipped}%)\n` +
        `    Backend    : ${data.backend}  [${tag}]\n` +
        `    Source     : ${data.source}`
      )
      // after hero is unmounted, scroll the results into view
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setStatusLog(`❌  ${msg}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleChat = async (question: string) => {
    const user: ChatMessage = { id: nextId(), role: 'user', content: question }
    setMessages(prev => [...prev, user])
    setIsWaiting(true)
    try {
      const answer = await sendChat(question)
      setMessages(prev => [...prev, { id: nextId(), role: 'assistant', content: answer }])
    } catch {
      setMessages(prev => [
        ...prev,
        { id: nextId(), role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setIsWaiting(false)
    }
  }

  return (
    <div className="min-h-screen bg-ss-bg font-sans">
      <Navbar pipelineReady={result !== null} isRunning={isRunning} />

      {/* Hero — simple conditional render, NO AnimatePresence/exit animation.
          Animated exit with min-h-screen breaks layout (min-height overrides height:0). */}
      {result === null && (
        <Hero onScrollDown={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      )}

      {/* About — always visible so the page doesn't collapse after a run */}
      <AboutSection />

      {/* Stats strip — animates in once results are ready */}
      {result !== null && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <StatsGrid
            samples={result.samples}
            eventCount={result.event_count}
            dominantType={result.dominant_type}
            iqrClipped={result.iqr.n_clipped}
            visible={true}
          />
        </motion.div>
      )}

      {/* ── Results zone ─────────────────────────────────────────── */}
      <div ref={resultsRef} className="border-t border-black/[0.07] bg-[#f0f0f2]">

        {/* Pipeline + Chat */}
        <section className="max-w-6xl mx-auto px-6 pt-8 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            <div className="lg:col-span-2">
              <PipelinePanel
                onRun={handleRun}
                isRunning={isRunning}
                statusLog={statusLog}
                events={result?.events ?? []}
                iqr={result?.iqr ?? null}
                selectedEvent={selectedEvent}
                onEventSelect={handleEventSelect}
              />
            </div>
            <div className="lg:col-span-3">
              <ChatPanel
                messages={messages}
                onSend={handleChat}
                onClear={() => setMessages([])}
                pipelineReady={result !== null}
                isWaiting={isWaiting}
              />
            </div>
          </motion.div>
        </section>

        {/* Chart */}
        <div ref={chartRef}>
          <ChartView
            chartData={result?.chart_data ?? null}
            events={result?.events ?? []}
            selectedEvent={selectedEvent}
          />
        </div>

      </div>
      {/* ────────────────────────────────────────────────────────── */}

      <footer className="border-t border-black/[0.06] py-10 text-center bg-white">
        <p className="text-[12px] text-ss-t3">
          SensorSpeak · Fully local · No API keys · LangChain + LangGraph + Ollama
        </p>
      </footer>
    </div>
  )
}
