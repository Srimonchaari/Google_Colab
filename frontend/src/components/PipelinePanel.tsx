import { useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { EventType, IQRReport, MotionEvent } from '../types'

const EASE = [0.16, 1, 0.3, 1] as const

const EV_STYLE: Record<string, { badge: string; row: string }> = {
  idle:    { badge: 'bg-green-50 text-green-700 border-green-200',   row: 'hover:border-green-200/80'  },
  walking: { badge: 'bg-sky-50 text-sky-700 border-sky-200',         row: 'hover:border-sky-200/80'    },
  impact:  { badge: 'bg-red-50 text-red-700 border-red-200',         row: 'hover:border-red-200/80'    },
  shaking: { badge: 'bg-amber-50 text-amber-700 border-amber-200',   row: 'hover:border-amber-200/80'  },
  unknown: { badge: 'bg-gray-100 text-gray-500 border-gray-200',     row: 'hover:border-gray-200/80'   },
}

const SEV_STYLE: Record<string, string> = {
  low:      'bg-green-50 text-green-600',
  moderate: 'bg-sky-50 text-sky-600',
  high:     'bg-amber-50 text-amber-600',
  severe:   'bg-red-50 text-red-600',
}

const BACKENDS = [
  { value: 'ollama',   label: 'Ollama — local, no key (default)' },
  { value: 'openai',   label: 'OpenAI GPT — needs OPENAI_API_KEY' },
  { value: 'hf_api',   label: 'HuggingFace API — needs HF_API_KEY' },
  { value: 'hf_local', label: 'HuggingFace Local — no key' },
]

interface PipelinePanelProps {
  onRun: (file: File | null, backend: string) => Promise<void>
  isRunning: boolean
  statusLog: string
  events: MotionEvent[]
  iqr: IQRReport | null
  selectedEvent: MotionEvent | null
  onEventSelect: (ev: MotionEvent | null) => void
}

const ALL_TYPES: Array<EventType | 'all'> = ['all', 'idle', 'walking', 'impact', 'shaking', 'unknown']

export function PipelinePanel({ onRun, isRunning, statusLog, events, iqr, selectedEvent, onEventSelect }: PipelinePanelProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [backend, setBackend] = useState('ollama')
  const [dragOver, setDragOver] = useState(false)
  const [filter, setFilter] = useState<EventType | 'all'>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  const visibleEvents = useMemo(
    () => filter === 'all' ? events : events.filter(e => e.type === filter),
    [events, filter]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.csv')) setCsvFile(f)
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Config card */}
      <div className="card p-6">
        <p className="section-label mb-5">Configuration</p>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer
                      transition-all duration-200 mb-4 select-none
            ${dragOver
              ? 'border-ss-blue bg-ss-blue/[0.04] scale-[1.01]'
              : 'border-black/[0.10] hover:border-ss-blue/40 hover:bg-ss-blue/[0.02]'}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) setCsvFile(f) }}
          />
          <div className="text-3xl mb-2 pointer-events-none">{csvFile ? '📄' : '📁'}</div>
          <p className="text-[13px] font-medium text-ss-t1 pointer-events-none">
            {csvFile ? csvFile.name : 'Drop CSV or click to browse'}
          </p>
          <p className="text-[11px] text-ss-t3 mt-1 pointer-events-none">
            {csvFile
              ? `${(csvFile.size / 1024).toFixed(1)} KB · click to change`
              : 'Leave empty to use synthetic data'}
          </p>
          {csvFile && (
            <button
              onClick={e => { e.stopPropagation(); setCsvFile(null) }}
              className="absolute top-2.5 right-3.5 text-ss-t3 hover:text-ss-red
                         text-xs transition-colors leading-none"
            >
              ✕
            </button>
          )}
        </div>

        {/* Backend */}
        <div className="mb-5">
          <label className="section-label mb-2 block">LLM Backend</label>
          <select
            value={backend}
            onChange={e => setBackend(e.target.value)}
            className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2.5
                       text-[13px] text-ss-t1 focus:outline-none focus:border-ss-blue
                       focus:ring-2 focus:ring-ss-blue/10 transition-all appearance-none cursor-pointer"
          >
            {BACKENDS.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

        {/* Run button */}
        <motion.button
          whileHover={isRunning ? {} : { scale: 1.01, y: -1 }}
          whileTap={isRunning ? {} : { scale: 0.99 }}
          onClick={() => onRun(csvFile, backend)}
          disabled={isRunning}
          className={`w-full py-4 rounded-xl font-semibold text-[14px] text-white
                      transition-all duration-200
            ${isRunning
              ? 'bg-ss-indigo/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-ss-indigo to-ss-blue shadow-lg shadow-ss-blue/20 hover:shadow-xl hover:shadow-ss-blue/30'}`}
        >
          {isRunning
            ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running pipeline…
              </span>
            )
            : '▶  Run Pipeline'
          }
        </motion.button>
      </div>

      {/* Terminal */}
      <AnimatePresence>
        {statusLog && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="rounded-2xl overflow-hidden border border-black/[0.08]"
          >
            <div className="bg-[#1c1c1e] px-4 py-2.5 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-[11px] text-white/25 font-mono tracking-wide">
                pipeline.log
              </span>
            </div>
            <pre className="bg-[#1c1c1e] text-[#34c759] font-mono text-[12px] leading-[1.7]
                            px-4 pb-4 pt-3 overflow-x-auto whitespace-pre-wrap">
              {statusLog}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events */}
      <AnimatePresence>
        {events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="section-label">Detected Events ({events.length})</p>
              {filter !== 'all' && (
                <span className="text-[10px] text-ss-t3">{visibleEvents.length} shown</span>
              )}
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ALL_TYPES.map(t => {
                const active = filter === t
                const cfg = t !== 'all' ? EV_STYLE[t] ?? EV_STYLE.unknown : null
                return (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase
                                tracking-wider font-mono transition-all border
                      ${active
                        ? cfg
                          ? `${cfg.badge} scale-105`
                          : 'bg-ss-t1 text-white border-ss-t1'
                        : 'bg-ss-bg text-ss-t3 border-black/10 hover:border-ss-t3'
                      }`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>

            {/* Scrollable list */}
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 260 }}>
              <AnimatePresence>
                {visibleEvents.map((ev, i) => {
                  const st = EV_STYLE[ev.type] ?? EV_STYLE.unknown
                  return (
                    <motion.div
                      key={`${ev.type}-${ev.start}`}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ delay: i * 0.03, duration: 0.35, ease: EASE }}
                      onClick={() => onEventSelect(
                        selectedEvent?.start === ev.start && selectedEvent?.type === ev.type ? null : ev
                      )}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer
                                  border transition-all flex-shrink-0 ${st.row}
                                  ${selectedEvent?.start === ev.start && selectedEvent?.type === ev.type
                                    ? 'bg-ss-blue/[0.06] border-ss-blue/30 shadow-sm'
                                    : 'bg-ss-bg border-transparent'}`}
                    >
                      <span className={`${st.badge} border text-[10px] font-bold px-2.5 py-1
                                        rounded-full uppercase tracking-wider font-mono
                                        flex-shrink-0 min-w-[62px] text-center`}>
                        {ev.type}
                      </span>
                      <span className="text-[11px] text-ss-t2 font-mono whitespace-nowrap">
                        {ev.start.toFixed(1)}s–{ev.end.toFixed(1)}s
                      </span>
                      <span className={`${SEV_STYLE[ev.severity] ?? ''} text-[10px] font-medium
                                        px-2 py-0.5 rounded-full`}>
                        {ev.severity}
                      </span>
                      <span className="ml-auto text-[11px] text-ss-t3 font-mono flex-shrink-0">
                        ↑{ev.max_mag.toFixed(3)}
                      </span>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {visibleEvents.length === 0 && (
                <p className="text-[12px] text-ss-t3 text-center py-4">No {filter} events detected.</p>
              )}
            </div>

            {/* IQR block */}
            {iqr && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: events.length * 0.045 + 0.15 }}
                className="mt-4 bg-[#1c1c1e] rounded-xl p-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]
                               text-[#a5a3f7] mb-3 pb-2 border-b border-white/[0.06]">
                  ◈ IQR Outlier Removal
                </p>
                {([
                  ['Q1 / Q3',     `${iqr.q1} / ${iqr.q3}`,        false],
                  ['IQR',         String(iqr.iqr),                  false],
                  ['Lower fence', String(iqr.lower_fence),          false],
                  ['Upper fence', String(iqr.upper_fence),          false],
                  ['Clipped',     `${iqr.n_clipped} (${iqr.pct_clipped}%)`, iqr.n_clipped > 0],
                ] as [string, string, boolean][]).map(([k, v, hot]) => (
                  <div key={k} className="flex justify-between py-1.5
                                          border-b border-white/[0.04] last:border-0">
                    <span className="text-[11px] text-white/30 font-mono">{k}</span>
                    <span className={`text-[11px] font-mono ${hot ? 'text-[#ff453a] font-semibold' : 'text-white/55'}`}>
                      {v}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
