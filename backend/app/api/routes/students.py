from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from app.core.database import get_db
from app.core.security import get_password_hash, require_student, require_any
from app.models import (
    STUDENTS, CODING_PROFILES, GITHUB_PROFILES, CERTIFICATIONS,
    PROJECTS, SKILL_PROFILES, PLACEMENT_READINESS, WEEKLY_GOALS,
    RECOMMENDATIONS, RESUME_ANALYSES, MENTORS,
    student_doc, coding_profile_doc, github_profile_doc,
    placement_readiness_doc, certification_doc, project_doc,
    skill_profile_doc, weekly_goal_doc, resume_analysis_doc, now
)
from app.schemas import (
    StudentCreate, StudentUpdate, SkillCreate, CertificationCreate,
    ProjectCreate, WeeklyGoalCreate, WeeklyGoalUpdate, PlacementUpdate
)
from app.services.leetcode_service import fetch_leetcode_profile
from app.services.github_service import fetch_github_profile
from app.services.ai_service import generate_recommendations, analyze_resume
from app.ml.readiness_engine import compute_placement_readiness
from app.services.sms_service import notify_low_readiness
import io
import traceback

router = APIRouter(prefix="/students", tags=["Students"])


def _clean(doc):
    if doc and isinstance(doc, dict):
        d = dict(doc)
        d["id"] = d.pop("_id", None)
        d.pop("hashed_password", None)
        return d
    return doc


# ── Register ──────────────────────────────────────────────────────────────────
@router.post("/register")
async def register_student(data: StudentCreate):
    try:
        db = get_db()
        if db is None:
            raise HTTPException(503, "Database not connected. Check MongoDB URL in .env")

        existing = await db[STUDENTS].find_one(
            {"$or": [{"email": data.email.lower()}, {"roll_number": data.roll_number}]}
        )
        if existing:
            raise HTTPException(400, "Email or roll number already registered")

        doc = student_doc(
            name=data.name,
            roll_number=data.roll_number,
            email=data.email,
            hashed_password=get_password_hash(data.password),
            branch=data.branch,
            year=int(data.year),
            section=data.section,
            phone=data.phone,
            mentor_id=data.mentor_id,
            batch_id=data.batch_id,
            leetcode_username=data.leetcode_username,
            github_username=data.github_username,
        )
        await db[STUDENTS].insert_one(doc)
        await db[CODING_PROFILES].insert_one(coding_profile_doc(doc["_id"]))
        await db[GITHUB_PROFILES].insert_one(github_profile_doc(doc["_id"]))
        await db[PLACEMENT_READINESS].insert_one(placement_readiness_doc(doc["_id"]))
        return _clean(doc)

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Register] Error: {e}")
        traceback.print_exc()
        raise HTTPException(500, "Registration failed. Please try again later.")


# ── Profile ───────────────────────────────────────────────────────────────────
@router.get("/me")
async def get_me(current_user: dict = Depends(require_student)):
    db = get_db()
    s = await db[STUDENTS].find_one({"_id": current_user["id"]})
    if not s:
        raise HTTPException(404, "Student not found")
    return _clean(s)


@router.patch("/me")
async def update_me(data: StudentUpdate, current_user: dict = Depends(require_student)):
    db = get_db()
    update = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    update["updated_at"] = now()
    await db[STUDENTS].update_one({"_id": current_user["id"]}, {"$set": update})
    s = await db[STUDENTS].find_one({"_id": current_user["id"]})
    return _clean(s)


@router.get("/me/readiness")
async def get_readiness(current_user: dict = Depends(require_student)):
    db = get_db()
    r = await db[PLACEMENT_READINESS].find_one({"student_id": current_user["id"]})
    if not r:
        raise HTTPException(404, "Readiness not yet calculated")
    return _clean(r)


@router.get("/{student_id}")
async def get_student(student_id: str, current_user: dict = Depends(require_any)):
    db = get_db()
    s = await db[STUDENTS].find_one({"_id": student_id})
    if not s:
        raise HTTPException(404, "Student not found")
    if current_user["role"] == "student" and current_user["id"] != student_id:
        raise HTTPException(403, "Access denied")
    if current_user["role"] == "mentor" and s.get("mentor_id") != current_user["id"]:
        raise HTTPException(403, "Access denied")
    return _clean(s)


# ── Sync LeetCode ─────────────────────────────────────────────────────────────
@router.post("/me/sync-leetcode")
async def sync_leetcode(current_user: dict = Depends(require_student)):
    db = get_db()
    student = await db[STUDENTS].find_one({"_id": current_user["id"]})
    if not student or not student.get("leetcode_username"):
        raise HTTPException(400, "No LeetCode username set. Update your profile first.")
    data = await fetch_leetcode_profile(student["leetcode_username"])
    if not data:
        raise HTTPException(502, "Could not fetch LeetCode profile. Check your username.")
    data["updated_at"] = now()
    await db[CODING_PROFILES].update_one(
        {"student_id": current_user["id"]}, {"$set": data}, upsert=True
    )
    await _recalculate_readiness(current_user["id"])
    return {"message": "LeetCode profile synced!", "data": data}


# ── Sync GitHub ───────────────────────────────────────────────────────────────
@router.post("/me/sync-github")
async def sync_github(current_user: dict = Depends(require_student)):
    db = get_db()
    student = await db[STUDENTS].find_one({"_id": current_user["id"]})
    if not student or not student.get("github_username"):
        raise HTTPException(400, "No GitHub username set. Update your profile first.")
    data = await fetch_github_profile(student["github_username"])
    if not data:
        raise HTTPException(502, "Could not fetch GitHub profile. Check your username.")
    data["updated_at"] = now()
    await db[GITHUB_PROFILES].update_one(
        {"student_id": current_user["id"]}, {"$set": data}, upsert=True
    )
    await _recalculate_readiness(current_user["id"])
    return {"message": "GitHub profile synced!", "data": data}


# ── Certifications ────────────────────────────────────────────────────────────
@router.get("/me/certifications")
async def list_certs(current_user: dict = Depends(require_student)):
    db = get_db()
    docs = await db[CERTIFICATIONS].find({"student_id": current_user["id"]}).to_list(100)
    return [_clean(d) for d in docs]


@router.post("/me/certifications")
async def add_cert(data: CertificationCreate, current_user: dict = Depends(require_student)):
    db = get_db()
    doc = certification_doc(current_user["id"], **data.model_dump())
    await db[CERTIFICATIONS].insert_one(doc)
    await _recalculate_readiness(current_user["id"])
    return _clean(doc)


@router.delete("/me/certifications/{cert_id}")
async def delete_cert(cert_id: str, current_user: dict = Depends(require_student)):
    db = get_db()
    result = await db[CERTIFICATIONS].delete_one(
        {"_id": cert_id, "student_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Certification not found")
    return {"message": "Deleted"}


# ── Projects ──────────────────────────────────────────────────────────────────
@router.get("/me/projects")
async def list_projects(current_user: dict = Depends(require_student)):
    db = get_db()
    docs = await db[PROJECTS].find({"student_id": current_user["id"]}).to_list(100)
    return [_clean(d) for d in docs]


@router.post("/me/projects")
async def add_project(data: ProjectCreate, current_user: dict = Depends(require_student)):
    db = get_db()
    doc = project_doc(current_user["id"], **data.model_dump())
    await db[PROJECTS].insert_one(doc)
    await _recalculate_readiness(current_user["id"])
    return _clean(doc)


@router.delete("/me/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(require_student)):
    db = get_db()
    result = await db[PROJECTS].delete_one(
        {"_id": project_id, "student_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Project not found")
    return {"message": "Deleted"}


# ── Skills ────────────────────────────────────────────────────────────────────
@router.get("/me/skills")
async def list_skills(current_user: dict = Depends(require_student)):
    db = get_db()
    docs = await db[SKILL_PROFILES].find({"student_id": current_user["id"]}).to_list(100)
    return [_clean(d) for d in docs]


@router.post("/me/skills")
async def add_skill(data: SkillCreate, current_user: dict = Depends(require_student)):
    db = get_db()
    doc = skill_profile_doc(current_user["id"], **data.model_dump())
    await db[SKILL_PROFILES].insert_one(doc)
    await _recalculate_readiness(current_user["id"])
    return _clean(doc)


# ── Goals ─────────────────────────────────────────────────────────────────────
@router.get("/me/goals")
async def list_goals(current_user: dict = Depends(require_student)):
    db = get_db()
    docs = await db[WEEKLY_GOALS].find({"student_id": current_user["id"]}).to_list(200)
    return [_clean(d) for d in docs]


@router.post("/me/goals")
async def add_goal(data: WeeklyGoalCreate, current_user: dict = Depends(require_student)):
    db = get_db()
    doc = weekly_goal_doc(current_user["id"], **data.model_dump())
    await db[WEEKLY_GOALS].insert_one(doc)
    return _clean(doc)


@router.patch("/me/goals/{goal_id}")
async def update_goal(goal_id: str, data: WeeklyGoalUpdate,
                      current_user: dict = Depends(require_student)):
    db = get_db()
    goal = await db[WEEKLY_GOALS].find_one(
        {"_id": goal_id, "student_id": current_user["id"]}
    )
    if not goal:
        raise HTTPException(404, "Goal not found")
    new_val = data.current_value
    status  = "completed" if new_val >= goal["target_value"] else "pending"
    await db[WEEKLY_GOALS].update_one(
        {"_id": goal_id}, {"$set": {"current_value": new_val, "status": status}}
    )
    goal["current_value"] = new_val
    goal["status"] = status
    return _clean(goal)


# ── Recommendations ───────────────────────────────────────────────────────────
@router.get("/me/recommendations")
async def get_recs(current_user: dict = Depends(require_student)):
    db = get_db()
    docs = await db[RECOMMENDATIONS].find(
        {"student_id": current_user["id"]}
    ).sort("priority", 1).to_list(50)
    return [_clean(d) for d in docs]


@router.post("/me/generate-recommendations")
async def generate_recs(current_user: dict = Depends(require_student)):
    db = get_db()
    student  = await db[STUDENTS].find_one({"_id": current_user["id"]}) or {}
    coding   = await db[CODING_PROFILES].find_one({"student_id": current_user["id"]}) or {}
    skills   = await db[SKILL_PROFILES].find({"student_id": current_user["id"]}).to_list(50)
    certs    = await db[CERTIFICATIONS].find({"student_id": current_user["id"]}).to_list(50)
    projects = await db[PROJECTS].find({"student_id": current_user["id"]}).to_list(50)
    readiness= await db[PLACEMENT_READINESS].find_one({"student_id": current_user["id"]}) or {}

    student_data = {
        "preferred_domains":   student.get("preferred_domains", []),
        "expected_salary_lpa": student.get("expected_salary_lpa"),
        "target_companies":    student.get("target_companies", []),
        "total_solved":        coding.get("total_solved", 0),
        "easy_solved":         coding.get("easy_solved", 0),
        "medium_solved":       coding.get("medium_solved", 0),
        "hard_solved":         coding.get("hard_solved", 0),
        "weak_topics":         coding.get("weak_topics", []),
        "repo_count":          0,
        "skills":              [{"skill_name": s["skill_name"]} for s in skills],
        "cert_count":          len(certs),
        "project_count":       len(projects),
        "readiness_score":     readiness.get("overall_score", 0),
    }

    recs = await generate_recommendations(student_data)
    await db[RECOMMENDATIONS].delete_many(
        {"student_id": current_user["id"], "is_completed": False}
    )
    from app.models import recommendation_doc
    for rec in recs:
        doc = recommendation_doc(
            student_id=current_user["id"],
            category=rec.get("category", "skill"),
            title=rec.get("title", ""),
            description=rec.get("description", ""),
            priority=rec.get("priority", 2),
        )
        await db[RECOMMENDATIONS].insert_one(doc)
    return {"message": "Recommendations generated", "count": len(recs)}


@router.patch("/me/recommendations/{rec_id}/complete")
async def complete_rec(rec_id: str, current_user: dict = Depends(require_student)):
    db = get_db()
    await db[RECOMMENDATIONS].update_one(
        {"_id": rec_id, "student_id": current_user["id"]},
        {"$set": {"is_completed": True}}
    )
    return {"message": "Marked complete"}


# ── Resume Analyzer ───────────────────────────────────────────────────────────
@router.post("/me/analyze-resume")
async def analyze_resume_endpoint(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_student)
):
    db = get_db()
    student = await db[STUDENTS].find_one({"_id": current_user["id"]})
    content = await file.read()
    resume_text = ""
    fname = file.filename or ""

    if fname.endswith(".pdf"):
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                resume_text = "\n".join(p.extract_text() or "" for p in pdf.pages)
        except Exception:
            resume_text = content.decode("utf-8", errors="ignore")
    elif fname.endswith(".docx"):
        try:
            from docx import Document
            doc = Document(io.BytesIO(content))
            resume_text = "\n".join(p.text for p in doc.paragraphs)
        except Exception:
            resume_text = content.decode("utf-8", errors="ignore")
    else:
        resume_text = content.decode("utf-8", errors="ignore")

    if not resume_text.strip():
        raise HTTPException(400, "Could not extract text from resume")

    domains  = student.get("preferred_domains", []) if student else []
    analysis = await analyze_resume(resume_text, domains)
    doc = resume_analysis_doc(current_user["id"], **analysis)
    await db[RESUME_ANALYSES].insert_one(doc)
    return _clean(doc)


# ── Placement Status ──────────────────────────────────────────────────────────
@router.patch("/me/placement-status")
async def update_placement(data: PlacementUpdate,
                           current_user: dict = Depends(require_student)):
    db = get_db()
    update = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    update["updated_at"] = now()
    await db[STUDENTS].update_one({"_id": current_user["id"]}, {"$set": update})
    return {"message": "Placement status updated"}




@router.get("/me/coding-profile")
async def get_coding_profile(current_user: dict = Depends(require_student)):
    db = get_db()
    doc = await db[CODING_PROFILES].find_one({"student_id": current_user["id"]})
    if not doc:
        return {}
    return _clean(doc)


@router.get("/me/github-profile")
async def get_github_profile(current_user: dict = Depends(require_student)):
    db = get_db()
    doc = await db[GITHUB_PROFILES].find_one({"student_id": current_user["id"]})
    if not doc:
        return {}
    return _clean(doc)

# ── Internal helper ───────────────────────────────────────────────────────────
async def _recalculate_readiness(student_id: str):
    try:
        db = get_db()
        coding   = await db[CODING_PROFILES].find_one({"student_id": student_id}) or {}
        github   = await db[GITHUB_PROFILES].find_one({"student_id": student_id}) or {}
        certs    = await db[CERTIFICATIONS].find({"student_id": student_id}).to_list(100)
        projects = await db[PROJECTS].find({"student_id": student_id}).to_list(100)
        sessions = await db["interview_sessions"].find({"student_id": student_id}).to_list(50)
        skills   = await db[SKILL_PROFILES].find({"student_id": student_id}).to_list(100)

        scores = compute_placement_readiness(
            coding=coding or None,
            github=github or None,
            cert_count=len(certs),
            project_count=len(projects),
            has_featured_project=any(p.get("is_featured") for p in projects),
            interview_sessions=sessions,
            skill_count=len(skills),
            skill_levels=[s.get("proficiency_level", "beginner") for s in skills],
        )
        scores["updated_at"] = now()
        await db[PLACEMENT_READINESS].update_one(
            {"student_id": student_id}, {"$set": scores}, upsert=True
        )

        if scores.get("needs_attention"):
            student = await db[STUDENTS].find_one({"_id": student_id})
            if student and student.get("mentor_id"):
                mentor = await db[MENTORS].find_one({"_id": student["mentor_id"]})
                await notify_low_readiness(
                    student_name=student["name"],
                    student_phone=student.get("phone"),
                    mentor_name=mentor["name"] if mentor else "Mentor",
                    mentor_phone=mentor.get("phone") if mentor else None,
                    score=scores["overall_score"],
                )
    except Exception as e:
        print(f"[Readiness] Error recalculating for {student_id}: {e}")
