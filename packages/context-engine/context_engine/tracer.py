"""
Pipeline Tracer (Sprint 3)

Traces context assembly pipeline stages for observability.
Emits structured logs compatible with Langfuse/OpenTelemetry.

Blueprint Section 13 — Observability.

Status: IMPLEMENTED
"""

from __future__ import annotations

import json
import uuid
from typing import Any
from datetime import datetime, timezone


def create_trace(request_id: str) -> dict:
    """
    Returns trace object with unique trace_id (UUID).
    """
    return {
        "trace_id": str(uuid.uuid4()),
        "request_id": request_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "stages": [],
        "total_duration_ms": 0.0,
        "total_tokens": 0,
        "finalized": False
    }


def add_stage_event(trace: dict, stage_name: str, data: dict) -> dict:
    """
    Adds a stage event recording:
      stage_name, started_at, duration_ms,
      items_in, items_out, tokens_in, tokens_out,
      decisions[] (e.g., "dropped 3 low-authority chunks")
    """
    if trace.get("finalized"):
        return trace
        
    event = {
        "stage_name": stage_name,
        "started_at": data.get("started_at", datetime.now(timezone.utc).isoformat()),
        "duration_ms": float(data.get("duration_ms", 0.0)),
        "items_in": int(data.get("items_in", 0)),
        "items_out": int(data.get("items_out", 0)),
        "tokens_in": int(data.get("tokens_in", 0)),
        "tokens_out": int(data.get("tokens_out", 0)),
        "decisions": data.get("decisions", [])
    }
    
    trace["stages"].append(event)
    return trace


def finalize_trace(trace: dict) -> dict:
    """
    Finalizes trace with totals (total_duration_ms, total_tokens).
    """
    if trace.get("finalized"):
        return trace
        
    total_duration = 0.0
    total_tokens = 0
    
    for stage in trace.get("stages", []):
        total_duration += stage.get("duration_ms", 0.0)
        total_tokens += stage.get("tokens_out", 0)
        
    trace["total_duration_ms"] = total_duration
    trace["total_tokens"] = total_tokens
    trace["finalized"] = True
    trace["finalized_at"] = datetime.now(timezone.utc).isoformat()
    return trace


def get_trace_metrics(trace: dict) -> dict:
    """
    Returns { stages[], total_duration_ms, total_tokens, per_stage_tokens{} }
    """
    per_stage_tokens = {}
    total_duration = trace.get("total_duration_ms", 0.0)
    total_tokens = trace.get("total_tokens", 0)
    
    for stage in trace.get("stages", []):
        name = stage.get("stage_name", "unknown")
        per_stage_tokens[name] = stage.get("tokens_out", 0)
    
    return {
        "stages": trace.get("stages", []),
        "total_duration_ms": total_duration,
        "total_tokens": total_tokens,
        "per_stage_tokens": per_stage_tokens
    }


def serialize_trace(trace: dict) -> str:
    """
    Returns JSON string for logging.
    """
    return json.dumps(trace)


def reset_cache() -> None:
    """Reset any module-level state. (No-op here)"""
    pass

# Stub wrappers to satisfy backwards capability if imported by existing tests
def trace_stage(stage_name: str, input_data: Any, output_data: Any, duration_ms: float) -> dict:
    """Record a pipeline stage execution trace. (Stub wrapper)"""
    return {"stage": stage_name, "duration_ms": duration_ms}


def get_pipeline_trace(trace_id: str) -> list[dict]:
    """Retrieve all traces for a pipeline execution. (Stub wrapper)"""
    return []
