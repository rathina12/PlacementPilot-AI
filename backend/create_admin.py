"""
Run this once to create the default admin account.
Usage: python create_admin.py
"""
import asyncio
from app.core.database import connect_db, get_db, close_db
from app.core.security import get_password_hash
from app.models import admin_doc, ADMINS


async def seed_admin():
    await connect_db()
    db = get_db()

    # Default admin credentials
    ADMIN_EMAIL    = "admin@sdt.edu"
    ADMIN_PASSWORD = "Admin@123"
    ADMIN_NAME     = "Platform Admin"

    existing = await db[ADMINS].find_one({"email": ADMIN_EMAIL})
    if existing:
        print(f"✅ Admin already exists: {ADMIN_EMAIL}")
    else:
        doc = admin_doc(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
        )
        await db[ADMINS].insert_one(doc)
        print("✅ Admin account created!")
        print(f"   Email:    {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
        print(f"   Role:     Admin")

    await close_db()


if __name__ == "__main__":
    asyncio.run(seed_admin())
