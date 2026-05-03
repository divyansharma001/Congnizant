"""Trace lookup.

Reads the SQLite file the worker writes. Both containers mount the same
shared volume (see docker-compose.yml), so the server can read whatever
the worker has written.
"""

import json
import os
import sqlite3

from fastapi import APIRouter, HTTPException

from ..config import settings


router = APIRouter()


@router.get("/traces/{job_id}")
def get_traces(job_id: str) -> list:
    db_path = settings.traces_db_path
    if not os.path.exists(db_path):
        raise HTTPException(
            status_code=503,
            detail=f"trace database not available at {db_path}",
        )

    conn = sqlite3.connect(db_path)
    try:
        cur = conn.execute(
            "SELECT id, job_id, agent_name, step, input, output, "
            "duration_ms, timestamp, status "
            "FROM traces WHERE job_id = ? ORDER BY id",
            (job_id,),
        )
        rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail="no trace rows for job")

    return [
        {
            "id": r[0],
            "job_id": r[1],
            "agent_name": r[2],
            "step": r[3],
            "input": json.loads(r[4]) if r[4] else None,
            "output": json.loads(r[5]) if r[5] else None,
            "duration_ms": r[6],
            "timestamp": r[7],
            "status": r[8],
        }
        for r in rows
    ]
