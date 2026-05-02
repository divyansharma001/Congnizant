from fastapi import FastAPI

from shared.dynamo import DynamoClient
from shared.queue import make_redis, push_job
from shared.schemas import CustomerEvent, IngestEventRequest, Job

from .config import settings

app = FastAPI(title="HyperPersona Server", version="0.2.0")

dynamo = DynamoClient(endpoint=settings.dynamodb_endpoint, region=settings.aws_region)
redis_client = make_redis(settings.redis_url)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "server"}


@app.get("/")
def root() -> dict:
    return {
        "service": "hyperpersona-server",
        "version": "0.2.0",
        "redis": settings.redis_url,
        "dynamodb": settings.dynamodb_endpoint,
    }


@app.post("/events", status_code=202)
def ingest_event(req: IngestEventRequest) -> dict:
    event = CustomerEvent(**req.model_dump())
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
