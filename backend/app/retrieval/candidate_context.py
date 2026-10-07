"""Candidate-context retrieval with explicit evidence provenance.

The LLM should never receive an untraceable blob of profile data. This module
normalizes candidate facts into small evidence records with stable source IDs so
questions and evaluations can cite exactly what they relied on.
"""

from typing import Any, Dict, Iterable, List

from app.models import (
    STUDENTS,
    CODING_PROFILES,
    GITHUB_PROFILES,
    SKILL_PROFILES,
    CERTIFICATIONS,
    PROJECTS,
    INTERVIEW_SESSIONS,
)


Evidence = Dict[str, Any]


def _evidence(source: str, key: str, text: str, value: Any = None) -> Evidence:
    return {
        "evidence_id": f"{source}:{key}",
        "source": source,
        "key": key,
        "text": text.strip(),
        "value": value,
    }


def normalize_candidate_evidence(
    student: Dict[str, Any],
    coding: Dict[str, Any],
    github: Dict[str, Any],
    skills: Iterable[Dict[str, Any]],
    certifications: Iterable[Dict[str, Any]],
    projects: Iterable[Dict[str, Any]],
    interviews: Iterable[Dict[str, Any]],
) -> List[Evidence]:
    """Convert heterogeneous profile data into grounded evidence records."""
    records: List[Evidence] = []

    if student.get("branch"):
        records.append(_evidence(
            "profile", "branch",
            f"Academic branch: {student['branch']}",
            student["branch"],
        ))
    if student.get("cgpa") is not None:
        records.append(_evidence(
            "profile", "cgpa",
            f"CGPA: {student['cgpa']}",
            student["cgpa"],
        ))
    for i, domain in enumerate(student.get("preferred_domains", []) or []):
        records.append(_evidence(
            "profile", f"preferred_domain_{i}",
            f"Preferred domain: {domain}", domain,
        ))

    solved = coding.get("total_solved")
    if solved is not None:
        records.append(_evidence(
            "leetcode", "total_solved",
            (
                f"LeetCode solved: {solved} total "
                f"({coding.get('easy_solved', 0)} easy, "
                f"{coding.get('medium_solved', 0)} medium, "
                f"{coding.get('hard_solved', 0)} hard)"
            ),
            solved,
        ))
    if coding.get("contest_rating"):
        records.append(_evidence(
            "leetcode", "contest_rating",
            f"LeetCode contest rating: {coding['contest_rating']}",
            coding["contest_rating"],
        ))

    if github.get("repo_count") is not None:
        records.append(_evidence(
            "github", "repo_count",
            f"GitHub public repositories: {github.get('repo_count', 0)}",
            github.get("repo_count", 0),
        ))
    for i, language in enumerate(github.get("languages_used", []) or []):
        records.append(_evidence(
            "github", f"language_{i}",
            f"GitHub language signal: {language}", language,
        ))

    for item in skills:
        name = item.get("skill_name")
        if not name:
            continue
        level = item.get("proficiency_level", "unspecified")
        records.append(_evidence(
            "skill", str(item.get("_id") or name).replace(" ", "_"),
            f"Skill: {name}; proficiency: {level}",
            {"skill": name, "proficiency": level},
        ))

    for item in certifications:
        title = item.get("title")
        if not title:
            continue
        issuer = item.get("issuer") or "unknown issuer"
        records.append(_evidence(
            "certification", str(item.get("_id") or title).replace(" ", "_"),
            f"Certification: {title} issued by {issuer}",
            {"title": title, "issuer": issuer},
        ))

    for item in projects:
        title = item.get("title")
        if not title:
            continue
        tech = ", ".join(item.get("tech_stack", []) or [])
        description = item.get("description") or ""
        records.append(_evidence(
            "project", str(item.get("_id") or title).replace(" ", "_"),
            f"Project: {title}. Tech: {tech}. {description}".strip(),
            {
                "title": title,
                "tech_stack": item.get("tech_stack", []) or [],
                "github_url": item.get("github_url"),
            },
        ))

    for item in interviews:
        question = item.get("question")
        transcript = item.get("transcript")
        if not question or not transcript:
            continue
        session_id = str(item.get("_id") or "unknown")
        records.append(_evidence(
            "interview", session_id,
            f"Previous interview answer. Question: {question} Answer: {transcript}",
            {"overall_score": item.get("overall_score")},
        ))

    return [record for record in records if record["text"]]


async def load_candidate_context(db, student_id: str) -> List[Evidence]:
    """Load a candidate's evidence from MongoDB in one retrieval boundary."""
    student = await db[STUDENTS].find_one({"_id": student_id}) or {}
    coding = await db[CODING_PROFILES].find_one({"student_id": student_id}) or {}
    github = await db[GITHUB_PROFILES].find_one({"student_id": student_id}) or {}
    skills = await db[SKILL_PROFILES].find({"student_id": student_id}).to_list(100)
    certifications = await db[CERTIFICATIONS].find({"student_id": student_id}).to_list(100)
    projects = await db[PROJECTS].find({"student_id": student_id}).to_list(100)
    interviews = await db[INTERVIEW_SESSIONS].find(
        {"student_id": student_id, "transcript": {"$ne": None}}
    ).sort("created_at", -1).to_list(20)

    return normalize_candidate_evidence(
        student=student,
        coding=coding,
        github=github,
        skills=skills,
        certifications=certifications,
        projects=projects,
        interviews=interviews,
    )


def search_evidence(
    query: str,
    evidence: Iterable[Evidence],
    limit: int = 8,
) -> List[Evidence]:
    """Transparent lexical retriever used as a deterministic baseline.

    A vector retriever can replace this later; keeping this baseline lets us
    measure whether embeddings actually improve retrieval quality.
    """
    terms = {
        token.lower().strip(".,:;!?()[]{}\"'")
        for token in query.split()
        if token.strip()
    }

    scored = []
    for record in evidence:
        haystack = set(record["text"].lower().split())
        overlap = len(terms & haystack)
        if overlap:
            scored.append((overlap, record["evidence_id"], record))

    scored.sort(key=lambda item: (-item[0], item[1]))
    return [item[2] for item in scored[: max(1, limit)]]
