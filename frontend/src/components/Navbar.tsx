import { motion } from 'framer-motion'

interface NavbarProps {
  pipelineReady: boolean
  isRunning: boolean
}

export function Navbar({ pipelineReady, isRunning }: NavbarProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-black/[0.06]"
    >
      <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold tracking-tight text-ss-t1">
            ⚡ SensorSpeak
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-xs text-ss-t3">
            Fully offline · No API keys
          </span>
          {isRunning ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-ss-amber">
              <span className="w-1.5 h-1.5 rounded-full bg-ss-amber animate-pulse" />
              Running…
            </div>
          ) : pipelineReady ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-ss-green">
              <span className="w-1.5 h-1.5 rounded-full bg-ss-green" />
              Ready
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-ss-t3">
              <span className="w-1.5 h-1.5 rounded-full bg-ss-t3" />
              Idle
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  )
}
