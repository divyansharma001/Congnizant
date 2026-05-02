import logging

from shared.dynamo import DynamoClient
from shared.queue import make_redis, pop_job

from .config import settings
from .job_handler import dispatch

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
log = logging.getLogger("worker")


def main() -> None:
    redis_client = make_redis(settings.redis_url)
    dynamo = DynamoClient(endpoint=settings.dynamodb_endpoint, region=settings.aws_region)

    redis_client.ping()
    log.info("worker started, waiting for jobs (redis=%s)", settings.redis_url)

    while True:
        try:
            payload = pop_job(redis_client, timeout=0)
            if payload is None:
                continue
            dispatch(payload, dynamo)
        except KeyboardInterrupt:
            log.info("worker shutting down")
            break
        except Exception:
            log.exception("worker loop error — continuing")


if __name__ == "__main__":
    main()
