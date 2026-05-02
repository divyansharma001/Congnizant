"""Pydantic models shared between server and worker."""

from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_uuid() -> str:
    return str(uuid4())


class CustomerEvent(BaseModel):
    customer_id: str
    event_id: str = Field(default_factory=new_uuid)
    event_type: str  # page_view, add_to_cart, purchase, return, search
    payload: dict
    status: str = "pending"  # pending → processing → processed | failed
    consent_scope: set[str] = Field(default_factory=set)
    created_at: str = Field(default_factory=utc_now_iso)


class ConsentRecord(BaseModel):
    customer_id: str
    scopes: set[str]  # {"personalization", "analytics", "marketing"}
    data_retention_days: int = 90
    last_updated: str = Field(default_factory=utc_now_iso)


class Job(BaseModel):
    job_id: str = Field(default_factory=new_uuid)
    job_type: str  # process_event, generate_recommendation, batch_import
    payload: dict
    status: str = "queued"  # queued → running → completed | failed
    created_at: str = Field(default_factory=utc_now_iso)
    completed_at: str | None = None
    error: str | None = None


class IngestEventRequest(BaseModel):
    customer_id: str
    event_type: str
    payload: dict
    consent_scope: set[str] = Field(default_factory=set)
