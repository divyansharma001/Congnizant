"""Stub handler for generate_recommendation jobs.

Filled in Phase 8 — for now it just logs so the dispatcher has a target
when the server starts emitting these jobs.
"""

import logging

from shared.dynamo import DynamoClient

log = logging.getLogger(__name__)


def handle(job: dict, dynamo: DynamoClient) -> None:
    customer_id = job["payload"].get("customer_id", "unknown")
    log.info("Generating recommendation for customer %s (stub)", customer_id)
