from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any


# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str


# ── Admin ─────────────────────────────────────────────────────────────────────
class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


# ── Mentor ────────────────────────────────────────────────────────────────────
class MentorCreate(BaseModel):
    name: str
    employee_id: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    department: str
    designation: Optional[str] = None

class MentorUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None


# ── Batch ─────────────────────────────────────────────────────────────────────
class BatchCreate(BaseModel):
    name: str
    branch: str
    year: int
    section: str
    batch_year: int


# ── Student ───────────────────────────────────────────────────────────────────
class StudentCreate(BaseModel):
    name: str
    roll_number: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    branch: str
    year: int
    section: str
    mentor_id: Optional[str] = None
    batch_id: Optional[str] = None
    leetcode_username: Optional[str] = None
    github_username: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    leetcode_username: Optional[str] = None
    github_username: Optional[str] = None
    preferred_domains: Optional[List[str]] = None
    expected_salary_lpa: Optional[float] = None
    target_companies: Optional[List[str]] = None
    cgpa: Optional[float] = None
    attendance_percent: Optional[float] = None
    mentor_id: Optional[str] = None
    batch_id: Optional[str] = None

class PlacementUpdate(BaseModel):
    placement_status: str
    placed_company: Optional[str] = None
    placed_package_lpa: Optional[float] = None
    placed_on: Optional[str] = None


# ── Skill ─────────────────────────────────────────────────────────────────────
class SkillCreate(BaseModel):
    skill_name: str
    domain: str
    proficiency_level: str = "beginner"


# ── Certification ─────────────────────────────────────────────────────────────
class CertificationCreate(BaseModel):
    title: str
    issuer: str
    credential_url: Optional[str] = None
    issued_date: Optional[str] = None
    expiry_date: Optional[str] = None
    domain: Optional[str] = None


# ── Project ───────────────────────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tech_stack: List[str] = []
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    domain: Optional[str] = None
    is_featured: bool = False


# ── Interview ─────────────────────────────────────────────────────────────────
class InterviewStartRequest(BaseModel):
    session_type: str

class InterviewSubmitRequest(BaseModel):
    session_id: str
    transcript: str
    speaking_pace_wpm: Optional[float] = None
    filler_words_count: Optional[int] = 0


# ── Weekly Goals ─────────────────────────────────────────────────────────────
class WeeklyGoalCreate(BaseModel):
    title: str
    target_value: int = 1
    category: str
    week_start: str
    week_end: str

class WeeklyGoalUpdate(BaseModel):
    current_value: int


# ── Skill Gap ─────────────────────────────────────────────────────────────────
class SkillGapRequest(BaseModel):
    target_role: str
