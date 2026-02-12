"""
Database module — aiomysql connection pool + query/execute helpers.
Mirrors server/mcp/src/db.ts exactly.
"""
from __future__ import annotations

import os
import ssl
from datetime import date, datetime
from decimal import Decimal

import aiomysql

_pool: aiomysql.Pool | None = None


async def get_pool() -> aiomysql.Pool:
    """Return the shared connection pool, creating it on first call."""
    global _pool
    if _pool is None:
        # For cloud deployments (Railway), use SSL with permissive cert checks
        ssl_ctx = None
        if os.getenv("ENV") == "production":
            ssl_ctx = ssl.create_default_context()
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = ssl.CERT_NONE

        _pool = await aiomysql.create_pool(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "npa_user"),
            password=os.getenv("DB_PASSWORD", "npa_password"),
            db=os.getenv("DB_NAME", "npa_workbench"),
            minsize=1,
            maxsize=10,
            autocommit=True,
            ssl=ssl_ctx,
        )
    return _pool


def _serialize_row(row: dict) -> dict:
    """Convert MySQL types (datetime, Decimal, bytes) to JSON-safe Python types."""
    out = {}
    for key, val in row.items():
        if isinstance(val, datetime):
            out[key] = val.isoformat()
        elif isinstance(val, date):
            out[key] = val.isoformat()
        elif isinstance(val, Decimal):
            out[key] = float(val)
        elif isinstance(val, (bytes, bytearray)):
            out[key] = val.decode("utf-8", errors="replace")
        else:
            out[key] = val
    return out


async def query(sql: str, params: list | None = None) -> list[dict]:
    """Execute a SELECT and return all rows as JSON-safe dicts."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(sql, params or [])
            rows = await cur.fetchall()
            return [_serialize_row(r) for r in rows]


async def execute(sql: str, params: list | None = None) -> int:
    """Execute an INSERT/UPDATE/DELETE and return lastrowid."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, params or [])
            return cur.lastrowid


async def health_check() -> bool:
    """Verify database connectivity."""
    try:
        await query("SELECT 1")
        return True
    except Exception:
        return False


def reset_pool() -> None:
    """Discard the current pool so the next call to get_pool() creates a fresh one.
    Call this after running health_check() in a temporary event loop."""
    global _pool
    _pool = None


async def close_pool() -> None:
    """Close the pool on shutdown."""
    global _pool
    if _pool is not None:
        _pool.close()
        await _pool.wait_closed()
        _pool = None
