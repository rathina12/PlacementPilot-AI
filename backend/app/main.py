from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import connect_db, close_db
from app.api.routes import auth, students, mentors, admin, interviews
from app.api.routes.recommendations import router as recommendations_router
from app.api.routes.skill_gap import router as skill_gap_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Student Digital Twin API",
    description="AI-powered Student Placement Readiness Platform",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,            prefix="/api")
app.include_router(students.router,        prefix="/api")
app.include_router(mentors.router,         prefix="/api")
app.include_router(admin.router,           prefix="/api")
app.include_router(interviews.router,      prefix="/api")
app.include_router(recommendations_router, prefix="/api")
app.include_router(skill_gap_router,       prefix="/api")


@app.get("/")
async def root():
    return {"message": "Student Digital Twin API v2.0 (MongoDB)", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
