"""Deterministic metrics used alongside LLM-as-judge evaluation."""

from typing import Dict, Iterable, List


def keyword_groundedness(answer: str, evidence: Iterable[str]) -> float:
    """Return a transparent lexical groundedness proxy in the range 0..1."""
    answer_tokens = {t.lower().strip(".,:;!?()[]{}\"'") for t in answer.split()}
    evidence_tokens = {
        t.lower().strip(".,:;!?()[]{}\"'")
        for item in evidence
        for t in item.split()
    }
    answer_tokens.discard("")
    evidence_tokens.discard("")

    if not answer_tokens:
        return 0.0
    return round(len(answer_tokens & evidence_tokens) / len(answer_tokens), 4)


def score_spread(scores: Iterable[float]) -> float:
    """Simple consistency signal: smaller spread means more stable scoring."""
    values = list(scores)
    if not values:
        return 0.0
    return round(max(values) - min(values), 4)


def aggregate_eval(
    relevance: float,
    groundedness: float,
    rubric_adherence: float,
    hallucination_rate: float,
) -> Dict[str, float]:
    """Combine normalized metrics without hiding the individual components."""
    quality = (
        0.30 * relevance
        + 0.30 * groundedness
        + 0.25 * rubric_adherence
        + 0.15 * (1.0 - hallucination_rate)
    )
    return {
        "relevance": round(relevance, 4),
        "groundedness": round(groundedness, 4),
        "rubric_adherence": round(rubric_adherence, 4),
        "hallucination_rate": round(hallucination_rate, 4),
        "quality_score": round(quality, 4),
    }


def pass_rate(results: List[bool]) -> float:
    if not results:
        return 0.0
    return round(sum(1 for result in results if result) / len(results), 4)
