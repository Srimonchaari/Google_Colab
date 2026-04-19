import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

function useCountUp(target: number, enabled: boolean, duration = 1200) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    if (!enabled) { setValue(0); return }
    cancelAnimationFrame(rafRef.current)
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, enabled, duration])

  return value
}

const TYPE_COLOR: Record<string, string> = {
  idle:    'text-ss-green',
  walking: 'text-ss-teal',
  impact:  'text-ss-red',
  shaking: 'text-ss-amber',
  unknown: 'text-ss-t3',
}

interface StatsGridProps {
  samples: number
  eventCount: number
  dominantType: string | null
  iqrClipped: number
  visible: boolean
}

export function StatsGrid({ samples, eventCount, dominantType, iqrClipped, visible }: StatsGridProps) {
  const s = useCountUp(samples, visible)
  const e = useCountUp(eventCount, visible)
  const c = useCountUp(iqrClipped, visible)

  const cards = [
    { val: visible ? s.toLocaleString() : '—', label: 'Samples',     color: 'text-ss-blue'  },
    { val: visible ? String(e)           : '—', label: 'Events',      color: 'text-ss-green' },
    { val: visible ? String(c)           : '—', label: 'IQR Clipped', color: 'text-ss-red'   },
  ]

  return (
    <section className="max-w-6xl mx-auto px-6 pt-4 pb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 24 }}
            animate={visible ? { opacity: 1, y: 0 } : { opacity: 0.4, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: EASE }}
            whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.09)' }}
            className="card p-6 cursor-default transition-shadow"
          >
            <div className={`text-[40px] font-bold tracking-tight leading-none mb-2 ${card.color}`}>
              {card.val}
            </div>
            <div className="section-label">{card.label}</div>
          </motion.div>
        ))}

        {/* Dominant event */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0.4, y: 0 }}
          transition={{ duration: 0.6, delay: 0.21, ease: EASE }}
          whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.09)' }}
          className="card p-6 cursor-default transition-shadow"
        >
          <div className={`text-[40px] font-bold tracking-tight leading-none mb-2 capitalize
            ${visible && dominantType ? (TYPE_COLOR[dominantType] ?? 'text-ss-t2') : 'text-ss-t3'}`}
          >
            {visible && dominantType ? dominantType : '—'}
          </div>
          <div className="section-label">Top Event</div>
        </motion.div>
      </div>
    </section>
  )
}
