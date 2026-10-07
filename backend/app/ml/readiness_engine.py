"""
Placement Readiness Engine
Computes a 0-100 score using weighted heuristics + optional XGBoost model.
Designed to work even without a trained ML model on initial deployment.
"""

from typing import Dict, Any, Optional, Tuple


# ─── Scoring Weights ───────────────────────────────────────────────────────────

WEIGHTS = {
    "coding": 0.25,
    "github": 0.15,
    "certification": 0.10,
    "project": 0.15,
    "interview": 0.20,
    "communication": 0.10,
    "domain_skill": 0.05,
}


# ─── Sub-Score Calculators ─────────────────────────────────────────────────────

def score_coding(coding: Optional[Dict]) -> float:
    """Score coding profile 0-100."""
    if not coding:
        return 0.0

    total = coding.get("total_solved", 0)
    medium = coding.get("medium_solved", 0)
    hard = coding.get("hard_solved", 0)
    streak = coding.get("daily_streak", 0)
    contest = coding.get("contest_rating", 0)
    consistency = coding.get("consistency_score", 0)

    # Base score from problems solved
    base = min(50.0, total * 0.5)

    # Bonus for medium/hard (quality)
    quality_bonus = min(20.0, medium * 0.4 + hard * 1.5)

    # Streak bonus
    streak_bonus = min(10.0, streak * 0.5)

    # Contest bonus
    contest_bonus = min(10.0, max(0, (contest - 1500) * 0.01))

    # Consistency bonus
    consistency_bonus = min(10.0, consistency * 0.1)

    return round(min(100.0, base + quality_bonus + streak_bonus + contest_bonus + consistency_bonus), 1)


def score_github(github: Optional[Dict]) -> float:
    """Score GitHub profile 0-100."""
    if not github:
        return 0.0

    repos = github.get("repo_count", 0)
    commits = github.get("total_commits", 0)
    projects = github.get("project_count", 0)
    languages = len(github.get("languages_used", []))

    repo_score = min(25.0, repos * 3)
    commit_score = min(30.0, commits * 0.5)
    project_score = min(30.0, projects * 5)
    lang_score = min(15.0, languages * 3)

    return round(min(100.0, repo_score + commit_score + project_score + lang_score), 1)


def score_certifications(cert_count: int) -> float:
    """Score certifications 0-100."""
    if cert_count == 0:
        return 0.0
    if cert_count == 1:
        return 40.0
    if cert_count == 2:
        return 65.0
    if cert_count == 3:
        return 82.0
    return min(100.0, 82.0 + (cert_count - 3) * 6)


def score_projects(project_count: int, has_featured: bool = False) -> float:
    """Score projects 0-100."""
    if project_count == 0:
        return 0.0
    base = min(80.0, project_count * 20)
    featured_bonus = 20.0 if has_featured else 0.0
    return round(min(100.0, base + featured_bonus), 1)


def score_interviews(sessions: list) -> Tuple[float, float]:
    """Score interview performance. Returns (interview_score, communication_score)."""
    if not sessions:
        return 0.0, 0.0

    overall_scores = [s.get("overall_score") for s in sessions if s.get("overall_score") is not None]
    comm_scores = [s.get("communication_score") for s in sessions if s.get("communication_score") is not None]

    interview_score = sum(overall_scores) / len(overall_scores) if overall_scores else 0.0
    communication_score = sum(comm_scores) / len(comm_scores) if comm_scores else 0.0

    return round(interview_score, 1), round(communication_score, 1)


def score_domain_skills(skill_count: int, skill_levels: list) -> float:
    """Score domain skills 0-100."""
    if not skill_count:
        return 0.0

    level_weights = {"beginner": 1, "intermediate": 2, "advanced": 3}
    weighted_sum = sum(level_weights.get(level, 1) for level in skill_levels)
    max_possible = skill_count * 3

    return round(min(100.0, (weighted_sum / max(1, max_possible)) * 100), 1)


# ─── Main Engine ──────────────────────────────────────────────────────────────

def compute_placement_readiness(
    coding: Optional[Dict] = None,
    github: Optional[Dict] = None,
    cert_count: int = 0,
    project_count: int = 0,
    has_featured_project: bool = False,
    interview_sessions: list = None,
    skill_count: int = 0,
    skill_levels: list = None,
) -> Dict[str, Any]:
    """
    Compute full placement readiness profile.
    Returns all sub-scores, overall score, risk level, placement probability.
    """
    if interview_sessions is None:
        interview_sessions = []
    if skill_levels is None:
        skill_levels = []

    # Compute sub-scores
    coding_score = score_coding(coding)
    github_score = score_github(github)
    cert_score = score_certifications(cert_count)
    project_score = score_projects(project_count, has_featured_project)
    interview_score, communication_score = score_interviews(interview_sessions)
    domain_skill_score = score_domain_skills(skill_count, skill_levels)

    # Weighted overall score
    overall = (
        coding_score * WEIGHTS["coding"]
        + github_score * WEIGHTS["github"]
        + cert_score * WEIGHTS["certification"]
        + project_score * WEIGHTS["project"]
        + interview_score * WEIGHTS["interview"]
        + communication_score * WEIGHTS["communication"]
        + domain_skill_score * WEIGHTS["domain_skill"]
    )
    overall = round(overall, 1)

    # Placement probability (sigmoid-like mapping)
    if overall >= 80:
        probability = 85 + (overall - 80) * 0.75
    elif overall >= 60:
        probability = 60 + (overall - 60) * 1.25
    elif overall >= 40:
        probability = 35 + (overall - 40) * 1.25
    else:
        probability = overall * 0.875
    probability = round(min(99.0, probability), 1)

    # Risk level
    if overall >= 70:
        risk_level = "low"
        needs_attention = False
    elif overall >= 50:
        risk_level = "medium"
        needs_attention = False
    else:
        risk_level = "high"
        needs_attention = True

    return {
        "overall_score": overall,
        "placement_probability": probability,
        "coding_score": coding_score,
        "github_score": github_score,
        "certification_score": cert_score,
        "project_score": project_score,
        "interview_score": interview_score,
        "communication_score": communication_score,
        "domain_skill_score": domain_skill_score,
        "risk_level": risk_level,
        "needs_attention": needs_attention,
    }


def get_peer_benchmark(student_score: float, batch_scores: list) -> Dict[str, Any]:
    """Compute how a student compares to their batch peers."""
    if not batch_scores:
        return {
            "student_score": student_score,
            "batch_average": 0,
            "batch_top_10_avg": 0,
            "rank_in_batch": 1,
            "total_in_batch": 1,
            "percentile": 100.0,
        }

    sorted_scores = sorted(batch_scores, reverse=True)
    # Competition ranking also handles scores above the current cohort maximum.
    rank = 1 + sum(score > student_score for score in batch_scores)

    batch_average = round(sum(batch_scores) / len(batch_scores), 1)
    top_10_count = max(1, len(batch_scores) // 10)
    top_10_avg = round(sum(sorted_scores[:top_10_count]) / top_10_count, 1)
    percentile = round((1 - (rank / len(batch_scores))) * 100, 1)

    return {
        "student_score": student_score,
        "batch_average": batch_average,
        "batch_top_10_avg": top_10_avg,
        "rank_in_batch": rank,
        "total_in_batch": len(batch_scores),
        "percentile": percentile,
    }
