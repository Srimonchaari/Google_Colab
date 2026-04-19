import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

const PILLS = [
  { label: 'Rule-Based Detection',  cls: 'bg-ss-green/10  border-ss-green/30  text-green-700'  },
  { label: 'LangChain RAG',         cls: 'bg-ss-indigo/10 border-ss-indigo/30 text-indigo-700' },
  { label: 'LangGraph Workflow',    cls: 'bg-ss-blue/10   border-ss-blue/30   text-blue-700'   },
  { label: 'Python 3.10',           cls: 'bg-black/[0.04] border-black/10     text-ss-t2'      },
]

interface HeroProps {
  onScrollDown: () => void
}

export function Hero({ onScrollDown }: HeroProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white px-6 pt-12">

      {/* Background orbs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute top-1/4 right-1/4 w-[420px] h-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(88,86,214,0.18) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute bottom-1/3 left-1/4 w-[360px] h-[360px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,113,227,0.14) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, 20, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute top-1/2 left-1/2 w-[260px] h-[260px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(52,199,89,0.10) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 text-center max-w-4xl w-full">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="inline-flex items-center gap-2 bg-ss-blue/[0.08] border border-ss-blue/20
                     rounded-full px-4 py-1.5 text-xs font-medium text-ss-blue mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-ss-green" />
          Fully Offline · No API Keys · LangChain + LangGraph + Ollama
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.08, ease: EASE }}
          className="text-[clamp(56px,9vw,96px)] font-bold tracking-[-0.05em] leading-none mb-5"
        >
          <span className="text-gradient">SensorSpeak</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16, ease: EASE }}
          className="text-[clamp(20px,3vw,28px)] font-light text-ss-t2 tracking-tight mb-3"
        >
          Motion made meaningful.
        </motion.p>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
          className="text-[clamp(14px,1.6vw,17px)] text-ss-t3 max-w-xl mx-auto leading-relaxed mb-12"
        >
          Upload Bosch accelerometer data. Detect idle, walking, impact, and shaking events
          with rule-based logic. Ask plain-English questions. Everything runs on your machine.
        </motion.p>

        {/* Pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3, ease: EASE }}
          className="flex flex-wrap justify-center gap-2 mb-14"
        >
          {PILLS.map(({ label, cls }) => (
            <span key={label} className={`${cls} border text-[11px] font-medium px-3 py-1 rounded-full`}>
              {label}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.38, ease: EASE }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onScrollDown}
          className="bg-ss-blue text-white font-semibold text-[15px] px-9 py-4 rounded-full
                     shadow-lg shadow-ss-blue/25 hover:bg-[#0077ed] transition-colors"
        >
          Start Analysis ↓
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 1.5 }}
        className="absolute bottom-8 text-[11px] text-ss-t3 tracking-widest uppercase"
      >
        scroll
      </motion.div>
    </section>
  )
}

