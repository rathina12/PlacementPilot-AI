from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db
from app.core.security import require_student, require_any
from app.models import STUDENTS, interview_session_doc, now
from app.schemas import InterviewStartRequest, InterviewSubmitRequest
from app.services.ai_service import evaluate_interview_response, get_interview_question
from app.services.sms_service import send_sms, msg_interview_completed

router = APIRouter(prefix="/interviews", tags=["Mock Interviews"])


def _clean(doc):
    if doc:
        doc["id"] = doc.pop("_id", None)
    return doc


@router.post("/start")
async def start_interview(data: InterviewStartRequest,
                          current_user: dict = Depends(require_student)):
    db = get_db()
    valid = ["self_intro", "technical", "hr"]
    if data.session_type not in valid:
        raise HTTPException(400, f"session_type must be one of: {valid}")
    question = get_interview_question(data.session_type)
    doc = interview_session_doc(current_user["id"], data.session_type, question)
    await db["interview_sessions"].insert_one(doc)
    return _clean(doc)


@router.post("/submit")
async def submit_interview(data: InterviewSubmitRequest,
                           current_user: dict = Depends(require_student)):
    db = get_db()
    session = await db["interview_sessions"].find_one(
        {"_id": data.session_id, "student_id": current_user["id"]}
    )
    if not session:
        raise HTTPException(404, "Interview session not found")
    if session.get("overall_score") is not None:
        raise HTTPException(400, "Session already evaluated")

    try:
        evaluation = await evaluate_interview_response(
            session_type=session["session_type"],
            question=session["question"],
            transcript=data.transcript,
            filler_words_count=data.filler_words_count or 0,
            speaking_pace_wpm=data.speaking_pace_wpm,
        )
    except Exception as e:
        print(f"[Interview] Eval error: {e}")
        evaluation = {
            "communication_score": 50, "confidence_score": 50,
            "technical_score": None, "content_quality_score": 50,
            "overall_score": 50, "strengths": ["Response submitted"],
            "improvements": ["Try again for detailed feedback"],
            "sample_answer": "", "detailed_feedback": "Evaluation unavailable. Please try again.",
        }

    update = {
        "transcript": data.transcript,
        "filler_words_count": data.filler_words_count or 0,
        "speaking_pace_wpm": data.speaking_pace_wpm,
        **evaluation,
    }
    await db["interview_sessions"].update_one(
        {"_id": data.session_id}, {"$set": update}
    )
    session.update(update)

    student = await db[STUDENTS].find_one({"_id": current_user["id"]})
    if student and student.get("phone") and evaluation.get("overall_score"):
        await send_sms(student["phone"],
                       msg_interview_completed(student["name"], evaluation["overall_score"]))

    return _clean(session)


@router.get("/my-sessions")
async def get_my_sessions(current_user: dict = Depends(require_student)):
    db = get_db()
    docs = await db["interview_sessions"].find(
        {"student_id": current_user["id"]}
    ).sort("created_at", -1).to_list(50)
    return [_clean(d) for d in docs]


@router.get("/session/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(require_any)):
    db = get_db()
    doc = await db["interview_sessions"].find_one({"_id": session_id})
    if not doc:
        raise HTTPException(404, "Session not found")
    if current_user["role"] == "student" and doc["student_id"] != current_user["id"]:
        raise HTTPException(403, "Access denied")
    if current_user["role"] == "mentor":
        student = await db[STUDENTS].find_one({"_id": doc["student_id"], "mentor_id": current_user["id"]})
        if not student:
            raise HTTPException(403, "Access denied")
    return _clean(doc)


@router.get("/student/{student_id}/sessions")
async def get_student_sessions(student_id: str,
                               current_user: dict = Depends(require_any)):
    db = get_db()
    if current_user["role"] == "student" and student_id != current_user["id"]:
        raise HTTPException(403, "Access denied")
    if current_user["role"] == "mentor":
        student = await db[STUDENTS].find_one({"_id": student_id, "mentor_id": current_user["id"]})
        if not student:
            raise HTTPException(403, "Access denied")
    docs = await db["interview_sessions"].find(
        {"student_id": student_id}
    ).sort("created_at", -1).to_list(50)
    return [_clean(d) for d in docs]
