"""Pretty-print agent trace rows for a job.

Usage: make show-trace JOB=<job_id>

Reads the SQLite trace file the worker writes. Path comes from
TRACES_DB_PATH env var (falls back to the shared volume default).
"""

import json
import os
import sys

from src.trace_logger import TraceLogger


def main() -> None:
    if len(sys.argv) < 2 or not sys.argv[1].strip():
        print("usage: show_trace.py <job_id>")
        sys.exit(1)

    job_id = sys.argv[1].strip()
    db_path = os.getenv("TRACES_DB_PATH", "/app/traces/agent_traces.db")
    tracer = TraceLogger(db_path)
    rows = tracer.get_traces(job_id)

    if not rows:
        print(f"no trace rows for job {job_id}")
        return

    print(f"job {job_id} — {len(rows)} step(s)")
    print()
    for row in rows:
        ts = row["timestamp"]
        agent = row["agent_name"]
        step = row["step"]
        dur = row["duration_ms"] or 0.0
        status = row["status"]
        print(f"  {ts}  {agent:11} {step:20} {dur:7.1f}ms  {status}")
        if row["input"]:
            print(f"      in:  {json.dumps(row['input'])[:140]}")
        if row["output"]:
            print(f"      out: {json.dumps(row['output'])[:200]}")


if __name__ == "__main__":
    main()
