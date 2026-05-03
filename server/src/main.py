from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException

from shared.dynamo import DynamoClient
from shared.queue import make_redis, push_job
from shared.schemas import CustomerEvent, IngestEventRequest, Job

from .config import settings
from .middleware.auth import APIKeyMiddleware
from .routes import consent as consent_route
from .routes import customer as customer_route
from .routes import jobs as jobs_route
from .routes import recommend as recommend_route
from .routes import traces as traces_route

app = FastAPI(title="HyperPersona Server", version="0.8.0")

app.add_middleware(APIKeyMiddleware, api_key=settings.api_key)

app.include_router(consent_route.router)
app.include_router(customer_route.router)
app.include_router(jobs_route.router)
app.include_router(recommend_route.router)
app.include_router(traces_route.router)

dynamo = DynamoClient(endpoint=settings.dynamodb_endpoint, region=settings.aws_region)
redis_client = make_redis(settings.redis_url)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "server"}


@app.get("/")
def root() -> dict:
    return {"service": "hyperpersona-server", "version": "0.8.0"}


@app.post("/events", status_code=202)
def ingest_event(req: IngestEventRequest) -> dict:
    # Look up consent so we can (a) reject ungated customers fast and
    # (b) compute the event's TTL from the customer's retention setting.
    consent = dynamo.get_consent(req.customer_id)
    if not consent:
        raise HTTPException(status_code=403, detail="no consent record for customer")
    if "personalization" not in (consent.get("scopes") or set()):
        raise HTTPException(status_code=403, detail="missing personalization scope")

    retention_days = int(consent.get("data_retention_days", 90))
    expires_at = int(datetime.now(timezone.utc).timestamp()) + retention_days * 86400

    event = CustomerEvent(**req.model_dump(), expires_at=expires_at)
    dynamo.put_event(event.model_dump())

    job = Job(
        job_type="process_event",
        payload={
            "event_id": event.event_id,
            "customer_id": event.customer_id,
            "created_at": event.created_at,
        },
    )
    dynamo.put_job(job.model_dump())
    push_job(redis_client, job.model_dump_json())

    return {"event_id": event.event_id, "job_id": job.job_id, "status": "queued"}
