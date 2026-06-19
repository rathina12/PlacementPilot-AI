from typing import Optional
from app.core.config import settings


def _get_twilio_client():
    try:
        from twilio.rest import Client
        return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    except Exception:
        return None


async def send_sms(phone_number: str, message: str) -> bool:
    """
    Send an SMS via Twilio. Returns True on success, False on failure.
    """
    if not all([
        settings.TWILIO_ACCOUNT_SID,
        settings.TWILIO_AUTH_TOKEN,
        settings.TWILIO_PHONE_NUMBER,
    ]):
        print(f"[SMS] Twilio not configured. Would send to {phone_number}: {message}")
        return False

    client = _get_twilio_client()
    if not client:
        return False

    try:
        msg = client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone_number,
        )
        print(f"[SMS] Sent SID={msg.sid} to {phone_number}")
        return True
    except Exception as e:
        print(f"[SMS] Failed to send to {phone_number}: {e}")
        return False


# ─── Message Templates ─────────────────────────────────────────────────────────

def msg_low_readiness(student_name: str, score: float) -> str:
    return (
        f"Hi {student_name}, your Placement Readiness Score has dropped to {score:.0f}/100. "
        f"Please focus on completing your weekly goals and coding practice. "
        f"Log in to your Student Digital Twin dashboard for a personalized roadmap."
    )


def msg_mentor_alert(mentor_name: str, student_name: str, score: float) -> str:
    return (
        f"Hi {mentor_name}, your student {student_name} has a low placement readiness score "
        f"({score:.0f}/100) and needs immediate attention. Please review their profile on the "
        f"Student Digital Twin platform."
    )


def msg_goal_missed(student_name: str, goal_title: str) -> str:
    return (
        f"Hi {student_name}, you missed your weekly goal: '{goal_title}'. "
        f"Stay consistent! Log in to set new targets and get back on track."
    )


def msg_goal_completed(student_name: str, goal_title: str) -> str:
    return (
        f"Congrats {student_name}! You completed your goal: '{goal_title}'. "
        f"Keep up the great work on your placement preparation!"
    )


def msg_interview_completed(student_name: str, overall_score: float) -> str:
    return (
        f"Hi {student_name}, your AI Mock Interview score is {overall_score:.0f}/100. "
        f"Check your detailed feedback and improvement tips on the platform."
    )


def msg_placement_update(student_name: str, company: str, package: float) -> str:
    return (
        f"Congratulations {student_name}! You have been placed at {company} "
        f"with a package of {package} LPA. Best wishes for your career!"
    )


# ─── Notification Triggers ─────────────────────────────────────────────────────

async def notify_low_readiness(
    student_name: str,
    student_phone: Optional[str],
    mentor_name: str,
    mentor_phone: Optional[str],
    score: float,
    db=None,
) -> None:
    """Trigger SMS to both student and mentor when readiness < 50."""
    from app.models import SMSNotification

    if student_phone:
        msg = msg_low_readiness(student_name, score)
        success = await send_sms(student_phone, msg)
        if db:
            db.add(SMSNotification(
                recipient_id=student_name,
                recipient_role="student",
                phone_number=student_phone,
                message=msg,
                trigger="low_readiness",
                status="sent" if success else "failed",
            ))

    if mentor_phone:
        msg = msg_mentor_alert(mentor_name, student_name, score)
        success = await send_sms(mentor_phone, msg)
        if db:
            db.add(SMSNotification(
                recipient_id=mentor_name,
                recipient_role="mentor",
                phone_number=mentor_phone,
                message=msg,
                trigger="low_readiness_mentor_alert",
                status="sent" if success else "failed",
            ))

    if db:
        await db.commit()
