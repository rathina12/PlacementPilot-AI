from fastapi import APIRouter, Depends
from app.core.database import get_db
from app.core.security import require_student

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/me")
async def get_my_recommendations(current_user: dict = Depends(require_student)):
    db = get_db()
    docs = await db["recommendations"].find(
        {"student_id": current_user["id"]}
    ).sort("priority", 1).to_list(50)
    for d in docs:
        d["id"] = d.pop("_id", None)
    return docs


@router.patch("/me/{rec_id}/complete")
async def mark_complete(rec_id: str, current_user: dict = Depends(require_student)):
    db = get_db()
    await db["recommendations"].update_one(
        {"_id": rec_id, "student_id": current_user["id"]},
        {"$set": {"is_completed": True}}
    )
    return {"message": "Marked complete"}
