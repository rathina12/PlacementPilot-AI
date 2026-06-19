"""
MongoDB document helpers.
No ORM - we use plain dicts with these helper functions.
All IDs are strings (UUID4).
"""
import uuid
from datetime import datetime, timezone


def new_id() -> str:
    return str(uuid.uuid4())


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Collection names ──────────────────────────────────────────────────────────
ADMINS             = "admins"
MENTORS            = "mentors"
BATCHES            = "batches"
STUDENTS           = "students"
CODING_PROFILES    = "coding_profiles"
GITHUB_PROFILES    = "github_profiles"
SKILL_PROFILES     = "skill_profiles"
CERTIFICATIONS     = "certifications"
PROJECTS           = "projects"
INTERVIEW_SESSIONS = "interview_sessions"
PLACEMENT_READINESS= "placement_readiness"
RECOMMENDATIONS    = "recommendations"
WEEKLY_GOALS       = "weekly_goals"
RESUME_ANALYSES    = "resume_analyses"
SMS_NOTIFICATIONS  = "sms_notifications"


# ── Document factories ────────────────────────────────────────────────────────

def admin_doc(name, email, hashed_password, phone=None):
    return {
        "_id": new_id(), "name": name, "email": email.lower(),
        "hashed_password": hashed_password, "phone": phone,
        "is_active": True, "role": "admin",
        "created_at": now(), "updated_at": now(),
    }


def mentor_doc(name, employee_id, email, hashed_password,
               department, designation=None, phone=None):
    return {
        "_id": new_id(), "name": name, "employee_id": employee_id,
        "email": email.lower(), "hashed_password": hashed_password,
        "phone": phone, "department": department, "designation": designation,
        "is_active": True, "role": "mentor",
        "created_at": now(), "updated_at": now(),
    }


def batch_doc(mentor_id, name, branch, year, section, batch_year):
    return {
        "_id": new_id(), "mentor_id": mentor_id, "name": name,
        "branch": branch, "year": year, "section": section,
        "batch_year": batch_year, "is_active": True,
        "created_at": now(),
    }


def student_doc(name, roll_number, email, hashed_password,
                branch, year, section, phone=None,
                mentor_id=None, batch_id=None,
                leetcode_username=None, github_username=None):
    return {
        "_id": new_id(), "name": name, "roll_number": roll_number,
        "email": email.lower(), "hashed_password": hashed_password,
        "phone": phone, "branch": branch, "year": year, "section": section,
        "mentor_id": mentor_id, "batch_id": batch_id,
        "leetcode_username": leetcode_username,
        "github_username": github_username,
        "preferred_domains": [], "expected_salary_lpa": None,
        "target_companies": [], "cgpa": None, "attendance_percent": None,
        "placement_status": "in_progress",
        "placed_company": None, "placed_package_lpa": None, "placed_on": None,
        "is_active": True, "role": "student",
        "created_at": now(), "updated_at": now(),
    }


def coding_profile_doc(student_id):
    return {
        "_id": new_id(), "student_id": student_id,
        "total_solved": 0, "easy_solved": 0, "medium_solved": 0, "hard_solved": 0,
        "contest_rating": 0, "global_ranking": None, "daily_streak": 0,
        "consistency_score": 0, "topic_progress": {}, "weak_topics": [],
        "pending_problems": 0, "last_synced": None,
        "created_at": now(), "updated_at": now(),
    }


def github_profile_doc(student_id):
    return {
        "_id": new_id(), "student_id": student_id,
        "repo_count": 0, "total_commits": 0, "project_count": 0,
        "languages_used": [], "contribution_data": {},
        "stars_received": 0, "followers": 0, "last_synced": None,
        "created_at": now(), "updated_at": now(),
    }


def placement_readiness_doc(student_id):
    return {
        "_id": new_id(), "student_id": student_id,
        "overall_score": 0, "placement_probability": 0,
        "coding_score": 0, "github_score": 0, "certification_score": 0,
        "project_score": 0, "interview_score": 0, "communication_score": 0,
        "domain_skill_score": 0, "risk_level": "high", "needs_attention": True,
        "updated_at": now(),
    }


def interview_session_doc(student_id, session_type, question):
    return {
        "_id": new_id(), "student_id": student_id,
        "session_type": session_type, "question": question,
        "transcript": None, "video_url": None,
        "communication_score": None, "confidence_score": None,
        "technical_score": None, "content_quality_score": None,
        "overall_score": None, "strengths": [], "improvements": [],
        "sample_answer": None, "detailed_feedback": None,
        "filler_words_count": 0, "speaking_pace_wpm": None,
        "created_at": now(),
    }


def weekly_goal_doc(student_id, title, target_value, category, week_start, week_end):
    return {
        "_id": new_id(), "student_id": student_id,
        "title": title, "target_value": target_value, "current_value": 0,
        "category": category, "status": "pending",
        "week_start": week_start, "week_end": week_end,
        "created_at": now(),
    }


def recommendation_doc(student_id, category, title, description, priority):
    return {
        "_id": new_id(), "student_id": student_id,
        "category": category, "title": title,
        "description": description, "priority": priority,
        "is_completed": False, "created_at": now(),
    }


def certification_doc(student_id, title, issuer,
                      credential_url=None, issued_date=None,
                      expiry_date=None, domain=None):
    return {
        "_id": new_id(), "student_id": student_id,
        "title": title, "issuer": issuer,
        "credential_url": credential_url, "issued_date": issued_date,
        "expiry_date": expiry_date, "domain": domain,
        "created_at": now(),
    }


def project_doc(student_id, title, description=None, tech_stack=None,
                github_url=None, live_url=None, domain=None, is_featured=False):
    return {
        "_id": new_id(), "student_id": student_id,
        "title": title, "description": description,
        "tech_stack": tech_stack or [], "github_url": github_url,
        "live_url": live_url, "domain": domain, "is_featured": is_featured,
        "created_at": now(),
    }


def skill_profile_doc(student_id, skill_name, domain, proficiency_level="beginner"):
    return {
        "_id": new_id(), "student_id": student_id,
        "skill_name": skill_name, "domain": domain,
        "proficiency_level": proficiency_level, "is_verified": False,
        "created_at": now(),
    }


def resume_analysis_doc(student_id, ats_score, missing_skills,
                        missing_sections, suggestions, strengths, overall_quality):
    return {
        "_id": new_id(), "student_id": student_id,
        "ats_score": ats_score, "missing_skills": missing_skills,
        "missing_sections": missing_sections, "suggestions": suggestions,
        "strengths": strengths, "overall_quality": overall_quality,
        "created_at": now(),
    }
