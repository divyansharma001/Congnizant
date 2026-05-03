"""ACE ranking — recency-weighted scoring with conflict detection.

Given a list of facts (each with at least 'text', 'similarity', 'timestamp',
optionally 'polarity'), apply:
  - recency weighting: 0.5^(days_ago / FACT_HALF_LIFE_DAYS)
  - combined_score   : similarity × recency
  - threshold cut    : drop facts below FACT_SCORE_THRESHOLD
  - dedup by topic   : group by normalized first-4-keyword key
  - conflict detect  : if a topic has both +1 and -1 polarity facts, flag it
                       and pick the more recent one
  - sort + truncate  : top FACT_LIMIT by combined_score

Returns (ranked_facts, conflict_keys).
"""

import re
from datetime import datetime, timezone


STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "shall",
    "should", "may", "might", "must", "can", "could", "i", "me", "my",
    "we", "our", "you", "your", "he", "him", "she", "her", "it", "its",
    "they", "them", "their", "this", "that", "these", "those", "and",
    "but", "or", "so", "if", "then", "than", "of", "in", "on", "at",
    "to", "for", "with", "by", "from", "as", "into", "about", "between",
    "through", "after", "before", "during", "above", "below", "up",
    "down", "out", "off", "over",
}

NEGATION_WORDS = {
    "not", "no", "never", "neither", "nor", "don't", "doesn't",
    "didn't", "won't", "wouldn't", "can't", "couldn't", "shouldn't",
    "isn't", "aren't", "wasn't", "weren't", "hardly", "barely", "scarcely",
}

POSITIVE_WORDS = {
    "love", "like", "enjoy", "prefer", "want", "favorite", "great",
    "good", "best", "always", "happy", "excited",
}


FACT_HALF_LIFE_DAYS = 45
FACT_SCORE_THRESHOLD = 0.12
FACT_LIMIT = 6


def recency_weight(days_ago: float) -> float:
    return 0.5 ** (days_ago / FACT_HALF_LIFE_DAYS)


def normalize_key(text: str) -> str:
    tokens = re.findall(r"\w+", text.lower())
    meaningful = [t for t in tokens if t not in STOPWORDS and t not in NEGATION_WORDS]
    return " ".join(meaningful[:4])


def polarity_score(text: str) -> int:
    words = set(text.lower().split())
    has_neg = bool(words & NEGATION_WORDS)
    has_pos = bool(words & POSITIVE_WORDS)
    if has_neg and not has_pos:
        return -1
    if has_pos and not has_neg:
        return 1
    return 0


def _days_ago(timestamp_iso: str) -> float:
    try:
        ts = datetime.fromisoformat(timestamp_iso)
    except (ValueError, TypeError):
        return 0.0
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    delta = datetime.now(timezone.utc) - ts
    return max(0.0, delta.total_seconds() / 86400.0)


def rank_facts(facts: list[dict]) -> tuple[list[dict], list[str]]:
    """Apply ACE ranking. Returns (top winners, conflict keys)."""

    annotated: list[dict] = []
    for f in facts:
        days = _days_ago(f.get("timestamp", ""))
        recency = recency_weight(days)
        combined = float(f.get("similarity", 0.0)) * recency
        polarity = f.get("polarity")
        if polarity is None:
            polarity = polarity_score(f.get("text", ""))
        annotated.append({
            **f,
            "recency": recency,
            "combined_score": combined,
            "key": normalize_key(f.get("text", "")),
            "polarity": polarity,
        })

    # Filter below threshold
    kept = [f for f in annotated if f["combined_score"] >= FACT_SCORE_THRESHOLD]

    # Group by normalized key, detect conflicts
    groups: dict[str, list[dict]] = {}
    for f in kept:
        groups.setdefault(f["key"], []).append(f)

    winners: list[dict] = []
    conflicts: list[str] = []
    for key, group in groups.items():
        polarities = {f["polarity"] for f in group}
        if 1 in polarities and -1 in polarities:
            conflicts.append(key)
            winner = max(group, key=lambda f: f["recency"])
        else:
            winner = max(group, key=lambda f: f["combined_score"])
        winners.append(winner)

    winners.sort(key=lambda f: f["combined_score"], reverse=True)
    return winners[:FACT_LIMIT], conflicts
