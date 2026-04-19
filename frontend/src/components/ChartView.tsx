import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Plotly from 'plotly.js-dist-min'
import type { ChartData, MotionEvent } from '../types'

const EV_FILL: Record<string, string> = {
  idle:    'rgba(52,199,89,0.12)',
  walking: 'rgba(50,173,230,0.12)',
  impact:  'rgba(255,59,48,0.16)',
  shaking: 'rgba(255,149,0,0.14)',
  unknown: 'rgba(142,142,147,0.10)',
}
const EV_BORDER: Record<string, string> = {
  idle:    'rgba(52,199,89,0.45)',
  walking: 'rgba(50,173,230,0.45)',
  impact:  'rgba(255,59,48,0.45)',
  shaking: 'rgba(255,149,0,0.45)',
  unknown: 'rgba(142,142,147,0.3)',
}
const EV_COLOR: Record<string, string> = {
  idle: '#34c759', walking: '#32ade6', impact: '#ff3b30',
  shaking: '#ff9500', unknown: '#8e8e93',
}

interface ChartViewProps {
  chartData: ChartData | null
  events: MotionEvent[]
  selectedEvent: MotionEvent | null
}

function eventShapes(events: MotionEvent[]) {
  return events.map(ev => ({
    type: 'rect' as const,
    xref: 'x' as const,
    yref: 'paper' as const,
    x0: ev.start, x1: ev.end,
    y0: 0, y1: 1,
    fillcolor: EV_FILL[ev.type] ?? EV_FILL.unknown,
    line: { width: 1, color: EV_BORDER[ev.type] ?? EV_BORDER.unknown },
    layer: 'below' as const,
  }))
}

export function ChartView({ chartData, events, selectedEvent }: ChartViewProps) {
  const plotRef  = useRef<HTMLDivElement>(null)
  const readyRef = useRef(false)

  // Render / update chart when data or events change
  useEffect(() => {
    const el = plotRef.current
    if (!el || !chartData) return

    readyRef.current = false
    let alive = true

    const {
      timestamps: t, accel_x, accel_y, accel_z,
      magnitude, rolling_mean, rolling_std,
      iqr_outlier_times, iqr_outlier_mags, thresholds,
    } = chartData

    const traces = [
      // Panel 1 – raw axes (yaxis)
      { x: t, y: accel_x, name: 'X lateral',  type: 'scatter', mode: 'lines',
        line: { color: '#ff3b30', width: 1 }, yaxis: 'y' },
      { x: t, y: accel_y, name: 'Y forward',  type: 'scatter', mode: 'lines',
        line: { color: '#34c759', width: 1 }, yaxis: 'y' },
      { x: t, y: accel_z, name: 'Z vertical', type: 'scatter', mode: 'lines',
        line: { color: '#0071e3', width: 1 }, yaxis: 'y' },
      // Panel 2 – magnitude (yaxis2)
      { x: t, y: magnitude, name: 'Magnitude', type: 'scatter', mode: 'lines',
        line: { color: '#af52de', width: 1.5 }, yaxis: 'y2' },
      ...(iqr_outlier_times.length ? [{
        x: iqr_outlier_times, y: iqr_outlier_mags, name: 'IQR clipped',
        type: 'scatter', mode: 'markers',
        marker: { color: '#ff3b30', size: 5, symbol: 'x' }, yaxis: 'y2',
      }] : []),
      // Panel 3 – rolling stats (yaxis3)
      { x: t, y: rolling_mean, name: 'Rolling mean', type: 'scatter', mode: 'lines',
        line: { color: '#ff9500', width: 1.2 }, yaxis: 'y3' },
      { x: t, y: rolling_std, name: 'Rolling std', type: 'scatter', mode: 'lines',
        line: { color: '#5856d6', width: 1.2 }, yaxis: 'y3' },
      { x: [t[0], t[t.length - 1]], y: [thresholds.idle_std_max, thresholds.idle_std_max],
        name: `Idle ≤${thresholds.idle_std_max}`, type: 'scatter', mode: 'lines',
        line: { color: '#34c759', width: 1, dash: 'dash' }, yaxis: 'y3' },
      { x: [t[0], t[t.length - 1]], y: [thresholds.impact_mean_min, thresholds.impact_mean_min],
        name: `Impact ≥${thresholds.impact_mean_min}`, type: 'scatter', mode: 'lines',
        line: { color: '#ff3b30', width: 1, dash: 'dash' }, yaxis: 'y3' },
    ]

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: '#f9f9fb',
      font: {
        family: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
        size: 11, color: '#3c3c43',
      },
      margin: { t: 24, b: 44, l: 54, r: 16 },
      height: 520,
      autosize: true,
      showlegend: true,
      legend: {
        orientation: 'h', x: 0, y: 1.05, xanchor: 'left', yanchor: 'bottom',
        bgcolor: 'rgba(255,255,255,0.92)', bordercolor: '#e5e5ea', borderwidth: 1,
        font: { size: 10 },
      },
      shapes: eventShapes(events),
      // Three stacked panels via yaxis domains; single shared xaxis at bottom
      xaxis:  { title: { text: 'Time (s)' }, showgrid: true, gridcolor: '#e5e5ea', zeroline: false },
      yaxis:  { domain: [0.70, 1.00], showgrid: true, gridcolor: '#e5e5ea', zeroline: false, title: { text: 'Axes (m/s²)', font: { size: 10 } } },
      yaxis2: { domain: [0.37, 0.67], showgrid: true, gridcolor: '#e5e5ea', zeroline: false, title: { text: 'Magnitude', font: { size: 10 } } },
      yaxis3: { domain: [0.02, 0.32], showgrid: true, gridcolor: '#e5e5ea', zeroline: false, title: { text: 'Rolling', font: { size: 10 } } },
    }

    const config = {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d'],
      toImageButtonOptions: { format: 'png', filename: 'sensorspeak_chart', scale: 2 },
    }

    // Plotly.react handles both first-render and subsequent updates safely
    Plotly.react(el, traces, layout, config)
      .then(() => { if (alive) readyRef.current = true })
      .catch(console.error)

    return () => {
      alive = false
      readyRef.current = false
      try { Plotly.purge(el) } catch { /* noop */ }
    }
  }, [chartData, events]) // eslint-disable-line react-hooks/exhaustive-deps

  // Zoom to selected event
  useEffect(() => {
    const el = plotRef.current
    if (!el || !readyRef.current) return
    if (selectedEvent) {
      const pad = Math.max((selectedEvent.end - selectedEvent.start) * 0.3, 0.5)
      Plotly.relayout(el, {
        'xaxis.range': [selectedEvent.start - pad, selectedEvent.end + pad],
      }).catch(() => {})
    } else {
      Plotly.relayout(el, { 'xaxis.autorange': true }).catch(() => {})
    }
  }, [selectedEvent]) // eslint-disable-line react-hooks/exhaustive-deps

  const downloadCSV = useCallback(() => {
    if (!chartData) return
    const { timestamps: t, accel_x, accel_y, accel_z, magnitude, rolling_mean, rolling_std } = chartData
    const rows = ['timestamp,accel_x,accel_y,accel_z,magnitude,rolling_mean,rolling_std']
    for (let i = 0; i < t.length; i++) {
      rows.push([t[i], accel_x[i], accel_y[i], accel_z[i], magnitude[i], rolling_mean[i], rolling_std[i]].join(','))
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'sensorspeak_data.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }, [chartData])

  if (!chartData) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-6xl mx-auto px-6 pb-16"
    >
      <div className="card p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <p className="section-label">Signal Overview</p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {selectedEvent && (
              <span className="text-[11px] text-ss-blue font-medium px-2.5 py-1
                               bg-ss-blue/[0.08] rounded-full border border-ss-blue/20">
                Zoomed: {selectedEvent.type} {selectedEvent.start.toFixed(1)}s–{selectedEvent.end.toFixed(1)}s
              </span>
            )}
            <button
              onClick={downloadCSV}
              className="text-[11px] text-ss-t2 hover:text-ss-blue transition-colors
                         px-3 py-1.5 rounded-lg border border-black/10 hover:border-ss-blue/30
                         hover:bg-ss-blue/[0.04] font-medium"
            >
              ↓ CSV
            </button>
          </div>
        </div>

        {/* Plotly container — explicit height; width:100% fills the card content area */}
        <div ref={plotRef} style={{ width: '100%', height: '520px' }} />

        {/* Event band legend */}
        {events.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-black/[0.06]">
            <span className="text-[10px] text-ss-t3">Event bands:</span>
            {Object.keys(EV_COLOR).map(type => (
              <span
                key={type}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full capitalize border"
                style={{ backgroundColor: EV_FILL[type], borderColor: EV_BORDER[type], color: EV_COLOR[type] }}
              >
                {type}
              </span>
            ))}
            <span className="text-[10px] text-ss-t3 ml-1">· Click an event row to zoom</span>
          </div>
        )}

      </div>
    </motion.section>
  )
}
