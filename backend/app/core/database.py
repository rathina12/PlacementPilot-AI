from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from typing import Optional

client: Optional[AsyncIOMotorClient] = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    # Create indexes
    await db.students.create_index("email", unique=True)
    await db.students.create_index("roll_number", unique=True)
    await db.mentors.create_index("email", unique=True)
    await db.mentors.create_index("employee_id", unique=True)
    await db.admins.create_index("email", unique=True)
    await db.interview_sessions.create_index("student_id")
    await db.recommendations.create_index("student_id")
    await db.weekly_goals.create_index("student_id")
    await db.certifications.create_index("student_id")
    await db.projects.create_index("student_id")
    print("✅ MongoDB connected and indexes created")


async def close_db():
    global client
    if client:
        client.close()
        print("👋 MongoDB connection closed")


def get_db():
    return db
