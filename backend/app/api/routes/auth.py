from fastapi import APIRouter, HTTPException, status
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.schemas import LoginRequest, TokenResponse
from app.models import ADMINS, MENTORS, STUDENTS

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    db = get_db()
    email = data.email.lower().strip()

    # Try Admin
    admin = await db[ADMINS].find_one({"email": email})
    if admin and verify_password(data.password, admin["hashed_password"]):
        token = create_access_token({"sub": admin["_id"], "role": "admin"})
        return TokenResponse(access_token=token, role="admin",
                             user_id=admin["_id"], name=admin["name"])

    # Try Mentor
    mentor = await db[MENTORS].find_one({"email": email})
    if mentor and verify_password(data.password, mentor["hashed_password"]):
        if not mentor.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account deactivated")
        token = create_access_token({"sub": mentor["_id"], "role": "mentor"})
        return TokenResponse(access_token=token, role="mentor",
                             user_id=mentor["_id"], name=mentor["name"])

    # Try Student
    student = await db[STUDENTS].find_one({"email": email})
    if student and verify_password(data.password, student["hashed_password"]):
        if not student.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account deactivated")
        token = create_access_token({"sub": student["_id"], "role": "student"})
        return TokenResponse(access_token=token, role="student",
                             user_id=student["_id"], name=student["name"])

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Incorrect email or password")
