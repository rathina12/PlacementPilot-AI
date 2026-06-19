from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db
from app.core.security import get_password_hash, require_mentor, require_any
from app.models import (
    MENTORS, BATCHES, STUDENTS, CODING_PROFILES, GITHUB_PROFILES,
    PLACEMENT_READINESS, CERTIFICATIONS, PROJECTS,
    mentor_doc, batch_doc, now
)
from app.schemas import MentorCreate, MentorUpdate, BatchCreate
from app.ml.readiness_engine import get_peer_benchmark
import traceback

router = APIRouter(prefix="/mentors", tags=["Mentors"])


def _clean(doc):
    if doc and isinstance(doc, dict):
        d = dict(doc)
        d["id"] = d.pop("_id", None)
        d.pop("hashed_password", None)
        return d
    return doc


# ── Register ──────────────────────────────────────────────────────────────────
@router.post("/register")
async def register_mentor(data: MentorCreate):
    try:
        db = get_db()
        existing = await db[MENTORS].find_one(
            {"$or": [{"email": data.email.lower()}, {"employee_id": data.employee_id}]}
        )
        if existing:
            raise HTTPException(400, "Email or Employee ID already registered")
        doc = mentor_doc(
            name=data.name, employee_id=data.employee_id, email=data.email,
            hashed_password=get_password_hash(data.password),
            department=data.department, designation=data.designation, phone=data.phone,
        )
        await db[MENTORS].insert_one(doc)
        return _clean(doc)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Registration error: {str(e)}")


# ── Profile ───────────────────────────────────────────────────────────────────
@router.get("/me")
async def get_me(current_user: dict = Depends(require_mentor)):
    db = get_db()
    m = await db[MENTORS].find_one({"_id": current_user["id"]})
    if not m:
        raise HTTPException(404, "Not found")
    return _clean(m)


@router.patch("/me")
async def update_me(data: MentorUpdate, current_user: dict = Depends(require_mentor)):
    db = get_db()
    update = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    update["updated_at"] = now()
    await db[MENTORS].update_one({"_id": current_user["id"]}, {"$set": update})
    m = await db[MENTORS].find_one({"_id": current_user["id"]})
    return _clean(m)


# ── Batches ───────────────────────────────────────────────────────────────────
@router.post("/batches")
async def create_batch(data: BatchCreate, current_user: dict = Depends(require_mentor)):
    db = get_db()
    doc = batch_doc(current_user["id"], **data.model_dump())
    await db[BATCHES].insert_one(doc)
    return _clean(doc)


@router.get("/batches")
async def list_batches(current_user: dict = Depends(require_mentor)):
    db = get_db()
    docs = await db[BATCHES].find({"mentor_id": current_user["id"]}).to_list(100)
    return [_clean(d) for d in docs]


@router.delete("/batches/{batch_id}")
async def delete_batch(batch_id: str, current_user: dict = Depends(require_mentor)):
    db = get_db()
    result = await db[BATCHES].delete_one({"_id": batch_id, "mentor_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(404, "Batch not found")
    return {"message": "Deleted"}


# ── Students ──────────────────────────────────────────────────────────────────
@router.get("/my-students")
async def get_my_students(current_user: dict = Depends(require_mentor)):
    db = get_db()
    docs = await db[STUDENTS].find({"mentor_id": current_user["id"]}).to_list(500)
    return [_clean(d) for d in docs]


@router.get("/my-students/needs-attention")
async def get_at_risk(current_user: dict = Depends(require_mentor)):
    db = get_db()
    students = await db[STUDENTS].find({"mentor_id": current_user["id"]}).to_list(500)
    result = []
    for s in students:
        r = await db[PLACEMENT_READINESS].find_one({"student_id": s["_id"]})
        if r and r.get("needs_attention"):
            result.append({
                "student": {
                    "id": s["_id"], "name": s["name"],
                    "roll_number": s["roll_number"], "branch": s["branch"],
                    "year": s["year"], "section": s["section"],
                },
                "readiness_score": r.get("overall_score", 0),
                "risk_level":      r.get("risk_level", "high"),
            })
    return result


@router.get("/my-students/{student_id}/full-profile")
async def get_student_full_profile(student_id: str,
                                   current_user: dict = Depends(require_mentor)):
    db = get_db()
    student = await db[STUDENTS].find_one({"_id": student_id, "mentor_id": current_user["id"]})
    if not student:
        raise HTTPException(404, "Student not found or not assigned to you")

    coding   = await db[CODING_PROFILES].find_one({"student_id": student_id}) or {}
    github   = await db[GITHUB_PROFILES].find_one({"student_id": student_id}) or {}
    readiness= await db[PLACEMENT_READINESS].find_one({"student_id": student_id}) or {}
    certs    = await db[CERTIFICATIONS].find({"student_id": student_id}).to_list(50)
    projects = await db[PROJECTS].find({"student_id": student_id}).to_list(50)
    sessions = await db["interview_sessions"].find(
        {"student_id": student_id}
    ).sort("created_at", -1).limit(10).to_list(10)

    return {
        "student": {
            "id": student["_id"], "name": student["name"],
            "roll_number": student["roll_number"], "email": student["email"],
            "branch": student["branch"], "year": student["year"],
            "section": student["section"],
            "preferred_domains":   student.get("preferred_domains", []),
            "expected_salary_lpa": student.get("expected_salary_lpa"),
            "target_companies":    student.get("target_companies", []),
            "placement_status":    student.get("placement_status", "in_progress"),
            "cgpa":                student.get("cgpa"),
            "leetcode_username":   student.get("leetcode_username"),
            "github_username":     student.get("github_username"),
        },
        "coding": {
            "total_solved":   coding.get("total_solved", 0),
            "easy_solved":    coding.get("easy_solved", 0),
            "medium_solved":  coding.get("medium_solved", 0),
            "hard_solved":    coding.get("hard_solved", 0),
            "contest_rating": coding.get("contest_rating", 0),
            "daily_streak":   coding.get("daily_streak", 0),
            "topic_progress": coding.get("topic_progress", {}),
            "weak_topics":    coding.get("weak_topics", []),
            "last_synced":    coding.get("last_synced"),
        },
        "github": {
            "repo_count":     github.get("repo_count", 0),
            "total_commits":  github.get("total_commits", 0),
            "languages_used": github.get("languages_used", []),
            "stars_received": github.get("stars_received", 0),
        },
        "certifications": [
            {"title": c["title"], "issuer": c["issuer"], "domain": c.get("domain")}
            for c in certs
        ],
        "projects": [
            {"title": p["title"], "tech_stack": p.get("tech_stack", []),
             "is_featured": p.get("is_featured", False)}
            for p in projects
        ],
        "readiness": {
            "overall_score":        readiness.get("overall_score", 0),
            "placement_probability":readiness.get("placement_probability", 0),
            "risk_level":           readiness.get("risk_level", "high"),
            "coding_score":         readiness.get("coding_score", 0),
            "github_score":         readiness.get("github_score", 0),
            "interview_score":      readiness.get("interview_score", 0),
            "communication_score":  readiness.get("communication_score", 0),
            "certification_score":  readiness.get("certification_score", 0),
            "project_score":        readiness.get("project_score", 0),
        },
        "recent_interviews": [
            {
                "session_type":      s.get("session_type"),
                "overall_score":     s.get("overall_score"),
                "communication_score":s.get("communication_score"),
                "created_at":        s.get("created_at"),
            }
            for s in sessions
        ],
    }


@router.get("/my-students/{student_id}/benchmark")
async def get_benchmark(student_id: str, current_user: dict = Depends(require_mentor)):
    db = get_db()
    student = await db[STUDENTS].find_one({"_id": student_id})
    if not student:
        raise HTTPException(404, "Student not found")
    batch_students = await db[STUDENTS].find(
        {"batch_id": student.get("batch_id")}
    ).to_list(500)
    batch_ids = [s["_id"] for s in batch_students]
    readiness_docs = await db[PLACEMENT_READINESS].find(
        {"student_id": {"$in": batch_ids}}
    ).to_list(500)
    scores_map    = {r["student_id"]: r.get("overall_score", 0) for r in readiness_docs}
    student_score = scores_map.get(student_id, 0)
    return get_peer_benchmark(student_score, list(scores_map.values()))


@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(require_mentor)):
    db = get_db()
    students = await db[STUDENTS].find({"mentor_id": current_user["id"]}).to_list(500)
    ids = [s["_id"] for s in students]
    if not ids:
        return {"total_students": 0, "active_students": 0, "placement_ready": 0,
                "needs_attention": 0, "avg_readiness_score": 0, "placed_count": 0}
    readiness_docs = await db[PLACEMENT_READINESS].find(
        {"student_id": {"$in": ids}}
    ).to_list(500)
    scores = [r.get("overall_score", 0) for r in readiness_docs]
    return {
        "total_students":     len(students),
        "active_students":    sum(1 for s in students if s.get("is_active")),
        "placement_ready":    sum(1 for r in readiness_docs if r.get("overall_score", 0) >= 70),
        "needs_attention":    sum(1 for r in readiness_docs if r.get("needs_attention")),
        "avg_readiness_score":round(sum(scores) / len(scores), 1) if scores else 0,
        "placed_count":       sum(1 for s in students if s.get("placement_status") == "placed"),
    }


# ── Available mentors for student registration ────────────────────────────────
@router.get("/available")
async def get_available_mentors(
    branch: str = None,
    year: int = None,
    section: str = None,
):
    """
    Returns mentors available for student selection.
    - First tries to match by batch (branch+year+section)
    - If no batch match, returns all mentors in the department/branch
    """
    db = get_db()
    result = []
    seen_mentors = set()

    # Step 1: Try exact batch match
    batch_filter = {}
    if branch:  batch_filter["branch"]  = branch
    if year:    batch_filter["year"]    = year
    if section: batch_filter["section"] = section

    batches = await db[BATCHES].find(batch_filter).to_list(200)
    for b in batches:
        mentor = await db[MENTORS].find_one({"_id": b["mentor_id"], "is_active": True})
        if mentor and mentor["_id"] not in seen_mentors:
            seen_mentors.add(mentor["_id"])
            result.append({
                "mentor_id":   mentor["_id"],
                "mentor_name": mentor["name"],
                "department":  mentor["department"],
                "batch_id":    b["_id"],
                "batch_name":  b["name"],
                "branch":      b["branch"],
                "year":        b["year"],
                "section":     b["section"],
            })

    # Step 2: If no results and branch given, show all mentors in that department
    if not result and branch:
        all_mentors = await db[MENTORS].find(
            {"department": branch, "is_active": True}
        ).to_list(100)
        # Also try by department name variations
        if not all_mentors:
            all_mentors = await db[MENTORS].find({"is_active": True}).to_list(100)

        for mentor in all_mentors:
            if mentor["_id"] not in seen_mentors:
                seen_mentors.add(mentor["_id"])
                result.append({
                    "mentor_id":   mentor["_id"],
                    "mentor_name": mentor["name"],
                    "department":  mentor["department"],
                    "batch_id":    None,
                    "batch_name":  f"{mentor['department']} Department",
                    "branch":      branch,
                    "year":        year or 0,
                    "section":     section or "",
                })

    return result
