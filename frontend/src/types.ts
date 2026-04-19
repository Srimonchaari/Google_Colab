export type EventType = 'idle' | 'walking' | 'impact' | 'shaking' | 'unknown';
export type Severity = 'low' | 'moderate' | 'high' | 'severe';

export interface MotionEvent {
  type: EventType;
  start: number;
  end: number;
  duration: number;
  max_mag: number;
  mean_mag: number;
  severity: Severity;
  summary: string;
}

export interface IQRReport {
  q1: number;
  q3: number;
  iqr: number;
  lower_fence: number;
  upper_fence: number;
  n_clipped: number;
  pct_clipped: number;
  rows_total: number;
}

export interface ChartData {
  timestamps: number[];
  accel_x: number[];
  accel_y: number[];
  accel_z: number[];
  magnitude: number[];
  rolling_mean: number[];
  rolling_std: number[];
  iqr_outlier_times: number[];
  iqr_outlier_mags: number[];
  thresholds: { idle_std_max: number; impact_mean_min: number };
}

export interface PipelineResult {
  samples: number;
  duration: number;
  events: MotionEvent[];
  event_count: number;
  dominant_type: string | null;
  iqr: IQRReport;
  chart_data: ChartData;
  backend: string;
  index_active: boolean;
  warn: string;
  source: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
