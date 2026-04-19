import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

const EVENTS = [
  { type: 'idle',    color: 'text-ss-green',  bg: 'bg-green-50  border-green-200',  rule: 'rolling_std < 0.15',               desc: 'Device stationary — no movement' },
  { type: 'walking', color: 'text-ss-teal',   bg: 'bg-sky-50    border-sky-200',    rule: 'mean 0.8–2.5 · std 0.10–1.8',      desc: 'Rhythmic periodic motion'        },
  { type: 'impact',  color: 'text-ss-red',    bg: 'bg-red-50    border-red-200',    rule: 'mean > 2.5 · std > 1.0',           desc: 'Sudden high-energy transient'    },
  { type: 'shaking', color: 'text-ss-amber',  bg: 'bg-amber-50  border-amber-200',  rule: 'rolling_std > 1.8',                desc: 'Rapid sustained oscillation'     },
]

const PIPELINE_STEPS = [
  { n: '1', label: 'Signal processing',       desc: 'Normalise x/y/z, compute magnitude, smooth with rolling stats'  },
  { n: '2', label: 'IQR outlier removal',     desc: 'Clip sensor dropout glitches; preserve high-energy events'      },
  { n: '3', label: 'Rule-based detection',    desc: 'Apply thresholds to rolling mean and std to label every sample' },
  { n: '4', label: 'Event summarisation',     desc: 'One plain-English sentence per detected event'                  },
  { n: '5', label: 'LangChain indexing',      desc: 'Embed summaries with bge-small-en-v1.5, store in vector index'  },
  { n: '6', label: 'LangGraph query flow',    desc: 'Stateful graph: question → retrieve → LLM → answer'             },
]

const AXES = [
  { label: 'accel_x', meaning: 'Left / right movement (lateral)',                      color: 'text-ss-red',   dot: 'bg-ss-red'   },
  { label: 'accel_y', meaning: 'Front / back movement (forward)',                      color: 'text-ss-green', dot: 'bg-ss-green' },
  { label: 'accel_z', meaning: 'Up / down + gravity (~9.81 m/s² when device is flat)', color: 'text-ss-blue',  dot: 'bg-ss-blue'  },
]

const QUESTIONS = [
  'Did any impact occur?',
  'When was the device idle?',
  'Was there shaking? How severe?',
  'What happened after 13 seconds?',
  'Summarise all events in order.',
  'What was the peak acceleration?',
]

function fade(delay: number) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.6, delay, ease: EASE },
  }
}

export function AboutSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-6 pb-10 space-y-16">

      {/* What it does */}
      <motion.div {...fade(0)} className="grid md:grid-cols-2 gap-8 items-start">
        <div>
          <p className="section-label mb-3">What SensorSpeak does</p>
          <p className="text-[15px] text-ss-t2 leading-relaxed mb-3">
            A Bosch accelerometer outputs a stream of numbers at 100 readings per second.
            Those numbers are meaningless on their own. SensorSpeak turns them into
            labelled motion events and lets you ask questions about them in plain English.
          </p>
          <p className="text-[15px] text-ss-t2 leading-relaxed">
            Rule-based logic handles detection — no machine learning, no training data.
            LangChain and LangGraph handle the query pipeline: embedding event summaries,
            retrieving the relevant ones, and generating a grounded LLM answer.
          </p>
        </div>
        <div className="card p-5">
          <p className="section-label mb-3">Stack at a glance</p>
          {[
            ['Signal processing', 'pandas · numpy'],
            ['Event detection',   'Rule-based thresholds'],
            ['LLM orchestration', 'LangChain'],
            ['Query workflow',    'LangGraph'],
            ['LLM (local)',       'Ollama · qwen2.5:0.5b'],
            ['Embeddings',        'bge-small-en-v1.5'],
            ['API',               'FastAPI · Python 3.10'],
            ['UI',                'React · Tailwind · Framer Motion'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-black/[0.05] last:border-0">
              <span className="text-[12px] text-ss-t2">{k}</span>
              <span className="text-[12px] font-medium text-ss-t1 font-mono">{v}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* What an accelerometer is + readings */}
      <motion.div {...fade(0)}>
        <p className="section-label mb-6">What the sensor data looks like</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-5">
            <p className="text-[13px] font-semibold text-ss-t1 mb-2">What is an accelerometer?</p>
            <p className="text-[13px] text-ss-t2 leading-relaxed mb-3">
              A small chip that measures how fast something is speeding up or slowing down in
              three directions at once. The Bosch MEMS chips are used in phones, industrial
              machines, conveyor belts, and robots. They output numbers continuously —
              typically 100 per second.
            </p>
            <p className="text-[13px] text-ss-t2 leading-relaxed">
              When the device sits still, the numbers barely change.
              When it is dropped, all three axes spike simultaneously.
              Those patterns are what this pipeline detects.
            </p>
          </div>

          <div className="card p-5">
            <p className="text-[13px] font-semibold text-ss-t1 mb-3">What each column means</p>
            <div className="space-y-3">
              {AXES.map(({ label, meaning, color, dot }) => (
                <div key={label} className="flex gap-3 items-start">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                  <div>
                    <span className={`font-mono text-[12px] font-bold ${color}`}>{label}</span>
                    <p className="text-[12px] text-ss-t2 mt-0.5">{meaning}</p>
                  </div>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-black/[0.06]">
                <p className="text-[11px] text-ss-t3">
                  Still device on a flat surface: accel_x ≈ 0, accel_y ≈ 0, accel_z ≈ 9.81 (gravity)
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div {...fade(0)}>
        <p className="section-label mb-6">How it works</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PIPELINE_STEPS.map(({ n, label, desc }) => (
            <div key={n} className="card p-4">
              <div className="w-7 h-7 rounded-full bg-ss-blue/10 text-ss-blue text-[12px]
                              font-bold flex items-center justify-center mb-3">
                {n}
              </div>
              <p className="text-[13px] font-semibold text-ss-t1 mb-1">{label}</p>
              <p className="text-[11px] text-ss-t3 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Event types */}
      <motion.div {...fade(0)}>
        <p className="section-label mb-6">Detected event types</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EVENTS.map(({ type, color, bg, rule, desc }) => (
            <div key={type} className={`${bg} border rounded-2xl p-4`}>
              <span className={`font-mono text-[13px] font-bold ${color} uppercase tracking-wide`}>
                {type}
              </span>
              <p className="text-[11px] text-ss-t2 mt-2 mb-1 leading-relaxed">{desc}</p>
              <p className="text-[10px] font-mono text-ss-t3 leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* LangChain + LangGraph */}
      <motion.div {...fade(0)}>
        <p className="section-label mb-6">Why LangChain and LangGraph</p>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-ss-indigo" />
              <p className="text-[13px] font-semibold text-ss-t1">LangChain</p>
            </div>
            <p className="text-[13px] text-ss-t2 leading-relaxed">
              Provides the building blocks: document loaders that turn event summaries into
              indexed documents, embedding integrations for HuggingFace and OpenAI, vector stores
              for semantic retrieval, and a unified LLM interface so you can swap Ollama for
              OpenAI by changing one line.
            </p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-ss-blue" />
              <p className="text-[13px] font-semibold text-ss-t1">LangGraph</p>
            </div>
            <p className="text-[13px] text-ss-t2 leading-relaxed">
              Defines the query pipeline as a directed graph of steps with explicit state.
              Each node (receive question → retrieve docs → generate answer) is independently
              testable. When the LLM is unavailable, LangGraph routes to the keyword fallback
              path instead of failing silently.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Example questions */}
      <motion.div {...fade(0)} className="pb-4">
        <p className="section-label mb-4">Example questions you can ask</p>
        <div className="flex flex-wrap gap-2">
          {QUESTIONS.map(q => (
            <span key={q}
              className="text-[12px] font-medium px-3 py-1.5 rounded-full
                         bg-ss-indigo/[0.07] border border-ss-indigo/20 text-ss-indigo"
            >
              {q}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-ss-t3 mt-3">
          Run the pipeline first, then type any question in the chat panel below.
        </p>
      </motion.div>

    </section>
  )
}
