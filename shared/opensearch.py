"""OpenSearch-backed vector store. Implements VectorStoreProtocol.

Lazy connection — opensearch-py doesn't actually hit the cluster until
the first request, so constructing an OpenSearchClient is safe even
before the cluster is up.
"""

import logging

from opensearchpy import OpenSearch
from opensearchpy.exceptions import NotFoundError, OpenSearchException

log = logging.getLogger(__name__)


class OpenSearchClient:
    def __init__(self, host: str, port: int = 9200, use_ssl: bool = False) -> None:
        self.client = OpenSearch(
            hosts=[{"host": host, "port": port}],
            http_compress=True,
            use_ssl=use_ssl,
            verify_certs=False,
            ssl_show_warn=False,
            timeout=10,
        )

    def upsert(
        self,
        collection: str,
        doc_id: str,
        vector: list[float],
        metadata: dict,
    ) -> None:
        body = {"vector": vector, **metadata}
        self.client.index(
            index=collection,
            id=doc_id,
            body=body,
            refresh="wait_for",
        )

    def search(
        self,
        collection: str,
        query: list[float],
        k: int = 8,
        filter_customer: str | None = None,
    ) -> list[dict]:
        knn_query = {"vector": {"vector": query, "k": k}}

        if filter_customer:
            body: dict = {
                "size": k,
                "query": {
                    "bool": {
                        "must": [{"knn": knn_query}],
                        "filter": [{"term": {"customer_id": filter_customer}}],
                    }
                },
            }
        else:
            body = {"size": k, "query": {"knn": knn_query}}

        try:
            resp = self.client.search(index=collection, body=body)
        except NotFoundError:
            log.warning("OpenSearch index %s does not exist yet", collection)
            return []
        except OpenSearchException as e:
            log.warning("OpenSearch search failed for %s: %s", collection, e)
            return []

        results: list[dict] = []
        for hit in resp["hits"]["hits"]:
            source = dict(hit["_source"])
            source.pop("vector", None)
            results.append({
                "id": hit["_id"],
                "similarity": hit["_score"],
                **source,
            })
        return results

    def delete_by_customer(self, collection: str, customer_id: str) -> None:
        try:
            self.client.delete_by_query(
                index=collection,
                body={"query": {"term": {"customer_id": customer_id}}},
                refresh=True,
            )
        except (NotFoundError, OpenSearchException) as e:
            log.warning("delete_by_customer failed for %s: %s", collection, e)
