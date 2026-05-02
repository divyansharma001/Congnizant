"""Stub handler for process_event jobs.

Phase 5+ replaces the body with a call to the supervisor agent. For now we
flip the event through processing → processed so we can verify the queue
loop end-to-end.
"""

import logging
import time

from shared.dynamo import DynamoClient

log = logging.getLogger(__name__)


def handle(job: dict, dynamo: DynamoClient) -> None:
    payload = job["payload"]
    customer_id = payload["customer_id"]
    event_id = payload["event_id"]
    created_at = payload["created_at"]

    log.info("Processing event %s for customer %s", event_id, customer_id)

    dynamo.update_event_status(customer_id, created_at, event_id, "processing")
    time.sleep(1)  # simulate work so the "processing" state is observable
    dynamo.update_event_status(customer_id, created_at, event_id, "processed")

    log.info("Event %s marked as processed", event_id)
