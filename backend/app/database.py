from __future__ import annotations

import json
from typing import Any, Optional

import asyncpg

from app.config import settings

pool: asyncpg.Pool | None = None


async def _init_connection(conn: asyncpg.Connection) -> None:
    """Set up JSONB codec so asyncpg auto-decodes JSONB to Python dicts."""
    await conn.set_type_codec(
        "jsonb",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )
    await conn.set_type_codec(
        "json",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )


async def create_pool() -> asyncpg.Pool:
    global pool
    dsn = settings.DATABASE_URL
    # asyncpg expects "postgresql://" scheme
    if dsn.startswith("postgres://"):
        dsn = dsn.replace("postgres://", "postgresql://", 1)
    pool = await asyncpg.create_pool(dsn, init=_init_connection)
    return pool


async def close_pool() -> None:
    global pool
    if pool:
        await pool.close()
        pool = None


def get_pool() -> asyncpg.Pool:
    assert pool is not None, "Database pool not initialized"
    return pool


def record_to_dict(record: asyncpg.Record) -> dict[str, Any]:
    """Convert asyncpg Record to dict, serializing UUIDs to strings and keeping JSON as-is."""
    d = dict(record)
    for k, v in d.items():
        if hasattr(v, "hex") and hasattr(v, "int"):
            # UUID object
            d[k] = str(v)
    return d


def json_dumps(obj: Any) -> str:
    """Serialize to JSON string for asyncpg JSONB columns."""
    return json.dumps(obj)
