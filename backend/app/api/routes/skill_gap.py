from fastapi import APIRouter, Depends
from app.core.database import get_db
from app.core.security import require_student
from app.models import SKILL_PROFILES, STUDENTS
from app.schemas import SkillGapRequest
from app.services.ai_service import generate_skill_gap_roadmap

router = APIRouter(prefix="/skill-gap", tags=["Skill Gap"])


@router.post("/analyze")
async def analyze(data: SkillGapRequest, current_user: dict = Depends(require_student)):
    db = get_db()
    student = await db[STUDENTS].find_one({"_id": current_user["id"]})
    skills  = await db[SKILL_PROFILES].find({"student_id": current_user["id"]}).to_list(100)
    skill_names = [s["skill_name"] for s in skills]
    domains = student.get("preferred_domains", []) if student else []
    return await generate_skill_gap_roadmap(data.target_role, skill_names, domains)
