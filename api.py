"""
api.py — SensorSpeak FastAPI backend  (replaces Gradio ui_app.py)

Run:
    python api.py            # http://localhost:8000
    python api.py --port 9000
"""
import sys
import tempfile
import os

import uvicorn
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import pandas as pd

from sensorspeak_core import (
    run_pipeline, query_events as _query_events,
    _severity_label, IDLE_STD_MAX, IMPACT_MEAN_MIN,
)
from llm_config import LLMBackend, get_llm, get_embed_model

app = FastAPI(title='SensorSpeak API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

_state: dict = {'df': None, 'events': [], 'summaries': [], 'index': None}

_BACKEND_MAP = {
    'ollama':   LLMBackend.OLLAMA,
    'openai':   LLMBackend.OPENAI,
    'hf_api':   LLMBackend.HUGGINGFACE_API,
    'hf_local': LLMBackend.HUGGINGFACE_LOCAL,
}

def _build_chart_data(df: pd.DataFrame) -> dict:
    ts = df['timestamp'].tolist()
    out_mask = df['_iqr_outlier'] if '_iqr_outlier' in df.columns else pd.Series(False, index=df.index)
    out_df = df[out_mask]
    return {
        'timestamps':        ts,
        'accel_x':           df['_raw_accel_x'].tolist() if '_raw_accel_x' in df.columns else df['accel_x'].tolist(),
        'accel_y':           df['_raw_accel_y'].tolist() if '_raw_accel_y' in df.columns else df['accel_y'].tolist(),
        'accel_z':           df['_raw_accel_z'].tolist() if '_raw_accel_z' in df.columns else df['accel_z'].tolist(),
        'magnitude':         df['accel_magnitude'].tolist(),
        'rolling_mean':      df['rolling_mean'].tolist(),
        'rolling_std':       df['rolling_std'].tolist(),
        'iqr_outlier_times': out_df['timestamp'].tolist(),
        'iqr_outlier_mags':  out_df['accel_magnitude'].tolist(),
        'thresholds': {
            'idle_std_max':    IDLE_STD_MAX,
            'impact_mean_min': IMPACT_MEAN_MIN,
        },
    }


@app.get('/api/health')
def health():
    return {'status': 'ok', 'pipeline_ready': _state['df'] is not None}


@app.post('/api/run')
async def run_endpoint(
    csv_file: UploadFile = File(None),
    backend: str = Form('ollama'),
):
    backend_enum = _BACKEND_MAP.get(backend, LLMBackend.OLLAMA)
    warn = ''
    try:
        llm = get_llm(backend_enum)
        embed_model = get_embed_model(backend_enum)
    except (ImportError, ValueError) as e:
        llm = embed_model = None
        warn = str(e)

    tmp_path = None
    if csv_file and csv_file.filename:
        content = await csv_file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as tmp:
            tmp.write(content)
            tmp_path = tmp.name

    try:
        result = run_pipeline(csv_path=tmp_path, llm=llm, embed_model=embed_model)
    except ValueError as e:
        return JSONResponse({'error': str(e)}, status_code=400)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

    _state.update(result)
    df = result['df']
    events = result['events']
    iqr = result['iqr_report']

    counts: dict = {}
    for ev in events:
        counts[ev.type] = counts.get(ev.type, 0) + 1
    dominant = max(counts, key=counts.get) if counts else None

    return {
        'samples':       len(df),
        'duration':      round(float(df['timestamp'].iloc[-1]), 1),
        'event_count':   len(events),
        'dominant_type': dominant,
        'iqr':           iqr,
        'chart_data':    _build_chart_data(df),
        'backend':       backend,
        'index_active':  result['index'] is not None,
        'warn':          warn,
        'source':        'uploaded CSV' if tmp_path else 'synthetic data',
        'events': [
            {
                'type':     ev.type,
                'start':    ev.start,
                'end':      ev.end,
                'duration': round(ev.end - ev.start, 2),
                'max_mag':  round(ev.max_mag, 4),
                'mean_mag': round(ev.mean_mag, 4),
                'severity': _severity_label(ev.max_mag),
                'summary':  result['summaries'][i],
            }
            for i, ev in enumerate(events)
        ],
    }


class ChatBody(BaseModel):
    question: str


@app.post('/api/chat')
def chat_endpoint(body: ChatBody):
    if _state['df'] is None:
        return {'answer': 'Run the pipeline first before asking questions.'}
    return {'answer': _query_events(
        body.question, index=_state['index'], summaries=_state['summaries']
    )}


_DIST = os.path.join(os.path.dirname(__file__), 'frontend', 'dist')
if os.path.isdir(_DIST):
    app.mount('/', StaticFiles(directory=_DIST, html=True), name='static')


if __name__ == '__main__':
    port = 8000
    args = sys.argv[1:]
    for i, a in enumerate(args):
        if a == '--port' and i + 1 < len(args):
            port = int(args[i + 1])
        elif a.startswith('--port='):
            port = int(a.split('=')[1])
    uvicorn.run('api:app', host='0.0.0.0', port=port, reload=False)
