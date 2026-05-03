"""Scan an OpenSearch collection.

Usage:
  python /app/scripts/scan_vectors.py <collection> [<customer_id>]

Examples:
  python /app/scripts/scan_vectors.py customer-facts
  python /app/scripts/scan_vectors.py customer-facts cust_1
"""

import json
import os
import sys

from opensearchpy import OpenSearch
from opensearchpy.exceptions import NotFoundError, OpenSearchException


HOST = os.getenv("OPENSEARCH_HOST", "localhost")
PORT = int(os.getenv("OPENSEARCH_PORT", "9200"))


def main() -> None:
    if len(sys.argv) < 2:
        print("usage: scan_vectors.py <collection> [<customer_id>]")
        sys.exit(1)

    collection = sys.argv[1]
    customer_id = sys.argv[2] if len(sys.argv) > 2 else None

    client = OpenSearch(
        hosts=[{"host": HOST, "port": PORT}],
        use_ssl=False,
        verify_certs=False,
    )

    body: dict = {"size": 100}
    if customer_id:
        body["query"] = {"term": {"customer_id": customer_id}}

    try:
        resp = client.search(index=collection, body=body)
    except NotFoundError:
        print(f"index {collection!r} does not exist (run make setup-opensearch)")
        sys.exit(1)
    except OpenSearchException as e:
        print(f"error: {e}")
        sys.exit(1)

    hits = resp["hits"]["hits"]
    suffix = f" for {customer_id}" if customer_id else ""
    print(f"{collection}: {len(hits)} item(s){suffix}")

    for hit in hits:
        source = dict(hit["_source"])
        source.pop("vector", None)
        print(f"  id={hit['_id']}  {json.dumps(source)}")


if __name__ == "__main__":
    main()
