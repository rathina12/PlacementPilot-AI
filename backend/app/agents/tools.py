"""Explicit candidate tools for agent orchestration.

These are ordinary async Python functions first. Keeping the domain logic
framework-agnostic makes them testable and allows later binding to Anthropic,
LangChain or other tool-calling interfaces without rewriting data access.
"""

from typing import Any, Dict, List

from app.models import (
    STUDENTS,
    PROJECTS,
    INTERVIEW_SESSIONS,
    GITHUB_PROFILES,
    CODING_PROFILES,
)
from app.retrieval.candidate_context import load_candidate_context, search_evidence


async def get_candidate_profile(db, student_id: str) -> Dict[str, Any]:
    student = await db[STUDENTS].find_one({"_id": student_id}) or {}
    student.pop("hashed_password", None)
    return student


async def get_candidate_projects(db, student_id: str) -> List[Dict[str, Any]]:
    return await db[PROJECTS].find({"student_id": student_id}).to_list(100)


async def get_github_signals(db, student_id: str) -> Dict[str, Any]:
    return await db[GITHUB_PROFILES].find_one({"student_id": student_id}) or {}


async def get_leetcode_signals(db, student_id: str) -> Dict[str, Any]:
    return await db[CODING_PROFILES].find_one({"student_id": student_id}) or {}


async def get_previous_interview_answers(
    db,
    student_id: str,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    return await db[INTERVIEW_SESSIONS].find(
        {"student_id": student_id, "transcript": {"$ne": None}}
    ).sort("created_at", -1).to_list(limit)


async def search_candidate_evidence(
    db,
    student_id: str,
    query: str,
    limit: int = 8,
) -> List[Dict[str, Any]]:
    evidence = await load_candidate_context(db, student_id)
    return search_evidence(query=query, evidence=evidence, limit=limit)
