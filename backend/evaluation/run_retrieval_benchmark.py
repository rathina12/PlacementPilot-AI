"""Offline retrieval benchmark for candidate evidence.

Run from backend/:
    python -m evaluation.run_retrieval_benchmark

This intentionally uses synthetic fixture data. Real candidate benchmarks should
be added only with consent and should never hard-code private resume content.
"""

import json
from pathlib import Path

from app.retrieval.candidate_context import normalize_candidate_evidence, search_evidence


FIXTURE = {
    "student": {
        "branch": "Computer Science and Business Systems",
        "cgpa": 8.0,
        "preferred_domains": ["AI", "Backend"],
    },
    "coding": {
        "total_solved": 150,
        "easy_solved": 60,
        "medium_solved": 75,
        "hard_solved": 15,
        "contest_rating": 1700,
    },
    "github": {
        "repo_count": 7,
        "languages_used": ["Python", "TypeScript", "Java"],
    },
    "skills": [
        {"_id": "s1", "skill_name": "FastAPI", "proficiency_level": "advanced"},
        {"_id": "s2", "skill_name": "Python", "proficiency_level": "advanced"},
    ],
    "certifications": [
        {
            "_id": "c1",
            "title": "AWS Certified Cloud Practitioner",
            "issuer": "AWS",
        }
    ],
    "projects": [
        {
            "_id": "p1",
            "title": "PlacementPilot AI",
            "description": "AI interview and candidate-readiness platform",
            "tech_stack": ["Python", "FastAPI", "Anthropic"],
        }
    ],
    "interviews": [],
}


def run() -> dict:
    dataset_path = Path(__file__).with_name("datasets") / "retrieval_cases.json"
    cases = json.loads(dataset_path.read_text(encoding="utf-8"))
    evidence = normalize_candidate_evidence(**FIXTURE)

    passed = 0
    details = []

    for case in cases:
        results = search_evidence(case["query"], evidence, limit=3)
        matched = any(
            item["source"] == case["expected_source"]
            and case["expected_term"].lower() in item["text"].lower()
            for item in results
        )
        passed += int(matched)
        details.append({
            "id": case["id"],
            "passed": matched,
            "retrieved_ids": [item["evidence_id"] for item in results],
        })

    total = len(cases)
    return {
        "passed": passed,
        "total": total,
        "pass_rate": round(passed / total, 4) if total else 0.0,
        "details": details,
    }


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
