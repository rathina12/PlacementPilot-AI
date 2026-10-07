from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db
from app.core.security import get_password_hash, require_admin
from app.models import (
    ADMINS, STUDENTS, MENTORS, BATCHES, PLACEMENT_READINESS,
    admin_doc, now
)
from app.schemas import AdminCreate
from typing import Optional

router = APIRouter(prefix="/admin", tags=["Admin"])


def _clean(doc):
    if doc:
        doc["id"] = doc.pop("_id", None)
        doc.pop("hashed_password", None)
    return doc


@router.post("/register")
async def register_admin(data: AdminCreate, current_user: dict = Depends(require_admin)):
    """Existing admins can invite admins; initial admin is bootstrapped by CLI."""
    db = get_db()
    existing = await db[ADMINS].find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(400, "Admin already exists")
    doc = admin_doc(data.name, data.email,
                    get_password_hash(data.password), data.phone)
    await db[ADMINS].insert_one(doc)
    return _clean(doc)


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(require_admin)):
    db = get_db()
    total_students = await db[STUDENTS].count_documents({})
    total_mentors  = await db[MENTORS].count_documents({})
    total_batches  = await db[BATCHES].count_documents({})

    # Placement breakdown
    placed        = await db[STUDENTS].count_documents({"placement_status": "placed"})
    not_placed    = await db[STUDENTS].count_documents({"placement_status": "not_placed"})
    not_interested= await db[STUDENTS].count_documents({"placement_status": "not_interested"})
    in_progress   = await db[STUDENTS].count_documents({"placement_status": "in_progress"})

    # Average readiness
    all_readiness = await db[PLACEMENT_READINESS].find({}).to_list(5000)
    scores = [r.get("overall_score", 0) for r in all_readiness]
    avg_readiness = round(sum(scores) / len(scores), 1) if scores else 0

    # Branch stats
    all_students = await db[STUDENTS].find({}).to_list(5000)
    branch_map = {}
    for s in all_students:
        b = s.get("branch", "Unknown")
        if b not in branch_map:
            branch_map[b] = {"branch": b, "total_students": 0, "placed_count": 0, "scores": []}
        branch_map[b]["total_students"] += 1
        if s.get("placement_status") == "placed":
            branch_map[b]["placed_count"] += 1

    readiness_by_student = {r["student_id"]: r.get("overall_score", 0) for r in all_readiness}
    for s in all_students:
        b = s.get("branch", "Unknown")
        if b in branch_map:
            branch_map[b]["scores"].append(readiness_by_student.get(s["_id"], 0))

    branch_stats = []
    for b, data in branch_map.items():
        sc = data.pop("scores")
        data["avg_readiness_score"] = round(sum(sc) / len(sc), 1) if sc else 0
        branch_stats.append(data)

    # Batch stats
    batches = await db[BATCHES].find({}).to_list(200)
    batch_stats = []
    for bat in batches:
        mentor = await db[MENTORS].find_one({"_id": bat["mentor_id"]})
        bat_students = [s for s in all_students if s.get("batch_id") == bat["_id"]]
        bat_scores   = [readiness_by_student.get(s["_id"], 0) for s in bat_students]
        bat_placed   = sum(1 for s in bat_students if s.get("placement_status") == "placed")
        batch_stats.append({
            "batch_id": bat["_id"], "batch_name": bat["name"],
            "branch": bat["branch"], "year": bat["year"], "section": bat["section"],
            "mentor_name": mentor["name"] if mentor else "Unknown",
            "total_students": len(bat_students),
            "avg_readiness_score": round(sum(bat_scores) / len(bat_scores), 1) if bat_scores else 0,
            "placed_count": bat_placed,
        })

    return {
        "total_students": total_students, "total_mentors": total_mentors,
        "total_batches": total_batches,
        "placement_status": {
            "placed": placed, "not_placed": not_placed,
            "not_interested": not_interested, "in_progress": in_progress,
        },
        "avg_readiness_score": avg_readiness,
        "branch_stats": sorted(branch_stats, key=lambda x: x["branch"]),
        "batch_stats": batch_stats,
    }


@router.get("/branch/{branch}")
async def branch_overview(branch: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    students = await db[STUDENTS].find({"branch": branch}).to_list(1000)
    if not students:
        return {"branch": branch, "total_students": 0, "years": []}

    all_ids = [s["_id"] for s in students]
    readiness_docs = await db[PLACEMENT_READINESS].find(
        {"student_id": {"$in": all_ids}}
    ).to_list(1000)
    readiness_map = {r["student_id"]: r for r in readiness_docs}

    year_map = {}
    for s in students:
        yr = s.get("year", 1)
        if yr not in year_map:
            year_map[yr] = {
                "year": yr, "total": 0, "placed": 0, "not_placed": 0,
                "not_interested": 0, "in_progress": 0,
                "scores": [], "students": [],
            }
        r = readiness_map.get(s["_id"], {})
        score = r.get("overall_score", 0)
        yr_data = year_map[yr]
        yr_data["total"] += 1
        yr_data[s.get("placement_status", "in_progress")] = yr_data.get(s.get("placement_status", "in_progress"), 0) + 1
        yr_data["scores"].append(score)
        yr_data["students"].append({
            "id": s["_id"], "name": s["name"],
            "roll_number": s["roll_number"], "section": s.get("section"),
            "placement_status": s.get("placement_status", "in_progress"),
            "placed_company": s.get("placed_company"),
            "placed_package_lpa": s.get("placed_package_lpa"),
            "readiness_score": score,
            "risk_level": r.get("risk_level", "high"),
        })

    years = []
    for yr_data in sorted(year_map.values(), key=lambda x: x["year"]):
        sc = yr_data.pop("scores")
        yr_data["avg_readiness"] = round(sum(sc) / len(sc), 1) if sc else 0
        years.append(yr_data)

    return {"branch": branch, "total_students": len(students), "years": years}


@router.get("/students")
async def list_students(
    branch: Optional[str] = None, year: Optional[int] = None,
    section: Optional[str] = None, placement_status: Optional[str] = None,
    batch_id: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    filt = {}
    if branch:           filt["branch"]           = branch
    if year:             filt["year"]              = year
    if section:          filt["section"]           = section
    if placement_status: filt["placement_status"]  = placement_status
    if batch_id:         filt["batch_id"]          = batch_id

    students = await db[STUDENTS].find(filt).sort("name", 1).to_list(2000)
    all_ids  = [s["_id"] for s in students]
    readiness_docs = await db[PLACEMENT_READINESS].find(
        {"student_id": {"$in": all_ids}}
    ).to_list(2000)
    readiness_map = {r["student_id"]: r for r in readiness_docs}

    return [
        {
            "id": s["_id"], "name": s["name"], "roll_number": s["roll_number"],
            "email": s["email"], "branch": s["branch"],
            "year": s["year"], "section": s.get("section"),
            "placement_status": s.get("placement_status", "in_progress"),
            "placed_company": s.get("placed_company"),
            "placed_package_lpa": s.get("placed_package_lpa"),
            "readiness_score": readiness_map.get(s["_id"], {}).get("overall_score", 0),
            "risk_level": readiness_map.get(s["_id"], {}).get("risk_level", "high"),
        }
        for s in students
    ]


@router.get("/mentors")
async def list_mentors(current_user: dict = Depends(require_admin)):
    db = get_db()
    mentors = await db[MENTORS].find({}).sort("name", 1).to_list(500)
    result = []
    for m in mentors:
        count = await db[STUDENTS].count_documents({"mentor_id": m["_id"]})
        result.append({
            "id": m["_id"], "name": m["name"], "employee_id": m["employee_id"],
            "email": m["email"], "department": m["department"],
            "student_count": count, "is_active": m.get("is_active", True),
        })
    return result


@router.patch("/mentors/{mentor_id}/toggle-active")
async def toggle_mentor(mentor_id: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    mentor = await db[MENTORS].find_one({"_id": mentor_id})
    if not mentor:
        raise HTTPException(404, "Mentor not found")
    new_state = not mentor.get("is_active", True)
    await db[MENTORS].update_one({"_id": mentor_id}, {"$set": {"is_active": new_state}})
    return {"message": f"Mentor {'activated' if new_state else 'deactivated'}", "is_active": new_state}


@router.get("/analytics/readiness-distribution")
async def readiness_distribution(current_user: dict = Depends(require_admin)):
    db = get_db()
    docs = await db[PLACEMENT_READINESS].find({}).to_list(5000)
    scores = [d.get("overall_score", 0) for d in docs]
    buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for s in scores:
        if s <= 20:   buckets["0-20"]   += 1
        elif s <= 40: buckets["21-40"]  += 1
        elif s <= 60: buckets["41-60"]  += 1
        elif s <= 80: buckets["61-80"]  += 1
        else:         buckets["81-100"] += 1
    return {"distribution": buckets, "total": len(scores)}


@router.get("/analytics/placement-trends")
async def placement_trends(current_user: dict = Depends(require_admin)):
    db = get_db()
    students = await db[STUDENTS].find({}).to_list(5000)
    all_readiness = await db[PLACEMENT_READINESS].find({}).to_list(5000)
    readiness_map = {r["student_id"]: r.get("overall_score", 0) for r in all_readiness}
    trends = {}
    for s in students:
        key = f"{s.get('branch','?')}__{s.get('year', 1)}"
        if key not in trends:
            trends[key] = {"branch": s.get("branch"), "year": s.get("year"),
                           "total": 0, "placed": 0, "scores": []}
        trends[key]["total"] += 1
        if s.get("placement_status") == "placed":
            trends[key]["placed"] += 1
        trends[key]["scores"].append(readiness_map.get(s["_id"], 0))
    result = []
    for t in trends.values():
        sc = t.pop("scores")
        t["avg_readiness"]   = round(sum(sc) / len(sc), 1) if sc else 0
        t["placement_rate"]  = round(t["placed"] / t["total"] * 100, 1) if t["total"] else 0
        result.append(t)
    return sorted(result, key=lambda x: (x["branch"], x["year"]))


@router.get("/analytics/top-performers")
async def top_performers(limit: int = 20, branch: Optional[str] = None,
                         current_user: dict = Depends(require_admin)):
    db = get_db()
    filt = {}
    if branch: filt["branch"] = branch
    students = await db[STUDENTS].find(filt).to_list(5000)
    all_ids  = [s["_id"] for s in students]
    readiness_docs = await db[PLACEMENT_READINESS].find(
        {"student_id": {"$in": all_ids}}
    ).to_list(5000)
    readiness_map = {r["student_id"]: r.get("overall_score", 0) for r in readiness_docs}
    enriched = sorted(
        [{"student": s, "score": readiness_map.get(s["_id"], 0)} for s in students],
        key=lambda x: -x["score"]
    )[:limit]
    return [
        {
            "rank": i + 1, "id": e["student"]["_id"],
            "name": e["student"]["name"], "roll_number": e["student"]["roll_number"],
            "branch": e["student"]["branch"], "year": e["student"]["year"],
            "readiness_score": e["score"],
            "placement_status": e["student"].get("placement_status", "in_progress"),
        }
        for i, e in enumerate(enriched)
    ]
