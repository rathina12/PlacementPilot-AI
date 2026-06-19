"""
AI Service — uses Anthropic Claude when API key is available.
Falls back to rule-based logic automatically when key is missing.
All features work in both modes.
"""

import json
import random
from typing import Dict, Any, List, Optional
from app.core.config import settings


# ─── Client Setup (optional) ──────────────────────────────────────────────────

def _get_client():
    """Return Anthropic client if key is configured, else None."""
    if not settings.ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
        return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    except Exception:
        return None


def _call_claude(system_prompt: str, user_prompt: str, max_tokens: int = 1500) -> Optional[str]:
    """Call Claude API. Returns raw text or None if unavailable."""
    client = _get_client()
    if not client:
        return None
    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": user_prompt}],
            system=system_prompt,
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return raw.strip()
    except Exception as e:
        print(f"[AI] Claude call failed: {e}")
        return None


# ─── Interview Evaluation ──────────────────────────────────────────────────────

async def evaluate_interview_response(
    session_type: str,
    question: str,
    transcript: str,
    filler_words_count: int = 0,
    speaking_pace_wpm: float = None,
) -> Dict[str, Any]:
    """Evaluate a mock interview response. Uses Claude if available, rule-based otherwise."""

    system_prompt = """You are an expert interview coach evaluating a student's mock interview response for placement preparation at an Indian college.

Evaluate the response and return ONLY valid JSON (no markdown, no extra text) in this exact format:
{
  "communication_score": <0-100 float>,
  "confidence_score": <0-100 float>,
  "technical_score": <0-100 float or null if HR round>,
  "content_quality_score": <0-100 float>,
  "overall_score": <0-100 float>,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "sample_answer": "<a better model answer for this question>",
  "detailed_feedback": "<2-3 paragraph constructive feedback>"
}"""

    pace_info = f"\nSpeaking pace: {speaking_pace_wpm:.0f} words per minute." if speaking_pace_wpm else ""
    filler_info = f"\nFiller words used: {filler_words_count} times." if filler_words_count > 0 else ""
    round_context = {"self_intro": "Self Introduction Round", "technical": "Technical Explanation Round", "hr": "HR Behavioral Round"}.get(session_type, "Interview Round")

    user_prompt = f"""Round: {round_context}
Question: {question}
Student's Response:
\"\"\"{transcript}\"\"\"{pace_info}{filler_info}

Evaluate and return JSON only."""

    raw = _call_claude(system_prompt, user_prompt, max_tokens=1500)

    if raw:
        try:
            return json.loads(raw)
        except Exception:
            pass

    # ── Rule-based fallback ──────────────────────────────────────────────────
    return _rule_based_interview_eval(transcript, session_type, filler_words_count, speaking_pace_wpm)


def _rule_based_interview_eval(
    transcript: str,
    session_type: str,
    filler_words: int,
    pace: float,
) -> Dict[str, Any]:
    """Score interview response using simple heuristics when Claude is unavailable."""
    words = transcript.strip().split()
    word_count = len(words)

    # Base score on length (longer = more detailed)
    length_score = min(70.0, word_count * 0.5)

    # Penalise filler words
    filler_penalty = min(20.0, filler_words * 2)

    # Pace score (ideal 110-150 wpm)
    pace_score = 70.0
    if pace:
        if 110 <= pace <= 150:
            pace_score = 85.0
        elif 80 <= pace < 110 or 150 < pace <= 180:
            pace_score = 70.0
        else:
            pace_score = 55.0

    communication  = round(max(40.0, min(90.0, length_score + pace_score / 4 - filler_penalty / 2)), 1)
    confidence     = round(max(40.0, min(88.0, length_score * 0.9 - filler_penalty)), 1)
    content        = round(max(45.0, min(85.0, length_score)), 1)
    technical      = round(max(40.0, min(80.0, content * 0.95)), 1) if session_type == "technical" else None
    overall        = round((communication + confidence + content + (technical or content)) / (4 if technical else 3), 1)

    strengths = []
    improvements = []

    if word_count > 80:
        strengths.append("Provided a detailed response with good length")
    else:
        improvements.append("Expand your answer — aim for at least 100 words")

    if filler_words == 0:
        strengths.append("No filler words detected — clear and articulate speech")
    elif filler_words <= 3:
        strengths.append("Minimal filler words used")
    else:
        improvements.append(f"Reduce filler words (detected {filler_words}) — practice pausing instead of saying 'um' or 'uh'")

    if session_type == "technical":
        improvements.append("Include time complexity and real-world examples when explaining algorithms")
        strengths.append("Attempted to explain a technical concept")
    elif session_type == "hr":
        improvements.append("Use the STAR method (Situation, Task, Action, Result) for behavioral questions")
        strengths.append("Responded to the HR question")
    else:
        improvements.append("Structure your intro: Name → Education → Skills → Goals → Why this company")
        strengths.append("Provided a self introduction")

    if len(strengths) < 2:
        strengths.append("Completed the interview round — consistency will improve your score")

    feedback = (
        f"Your response was evaluated automatically (AI evaluation unavailable). "
        f"You used {word_count} words in your answer. "
        f"{'Good length! ' if word_count > 80 else 'Try to elaborate more. '}"
        f"{'No filler words detected which is excellent. ' if filler_words == 0 else f'Work on reducing filler words ({filler_words} detected). '}"
        f"\n\nTo improve your score: practice answering out loud regularly, record yourself, "
        f"and review model answers. "
        f"{'For technical rounds, always mention time/space complexity and real-world use cases.' if session_type == 'technical' else ''}"
        f"{'For HR rounds, use the STAR method to structure your answers.' if session_type == 'hr' else ''}"
        f"\n\nKeep practising! Consistent effort will significantly improve your placement readiness."
    )

    sample_answers = {
        "self_intro": "I am [Your Name], a [Year] year [Branch] student at [College]. I have solved [X] problems on LeetCode and built [Y] projects. My key skills include [skills]. I am passionate about [domain] and aim to join [target company] as a software engineer.",
        "technical":  "Let me explain Binary Search as an example. Binary Search works on sorted arrays by repeatedly dividing the search interval in half. Time complexity is O(log n) and space is O(1). Real-world use: searching in databases, finding elements in sorted lists.",
        "hr":         "I should be hired because I bring a combination of strong technical skills, a problem-solving mindset, and the ability to work effectively in teams. For example, in my last project [describe project], I demonstrated [skill] by [action], resulting in [outcome].",
    }

    return {
        "communication_score":   communication,
        "confidence_score":      confidence,
        "technical_score":       technical,
        "content_quality_score": content,
        "overall_score":         overall,
        "strengths":             strengths[:3],
        "improvements":          improvements[:3],
        "sample_answer":         sample_answers.get(session_type, sample_answers["hr"]),
        "detailed_feedback":     feedback,
    }


# ─── Recommendation Engine ─────────────────────────────────────────────────────

async def generate_recommendations(student_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate personalized recommendations. Uses Claude if available, rule-based otherwise."""

    system_prompt = """You are a career placement advisor for engineering students at Indian colleges.
Generate personalized, actionable recommendations and return ONLY valid JSON (no markdown) as a list:
[
  {
    "category": "coding|skill|career|interview",
    "title": "<short action title>",
    "description": "<1-2 sentence explanation>",
    "priority": <1=high, 2=medium, 3=low>
  }
]
Generate 8-12 recommendations. Be specific. Use Indian IT industry context."""

    user_prompt = f"""Student Profile:
- Domain interests: {', '.join(student_data.get('preferred_domains', []))}
- Expected salary: {student_data.get('expected_salary_lpa', 'Not specified')} LPA
- Target companies: {', '.join(student_data.get('target_companies', []))}
- LeetCode solved: {student_data.get('total_solved', 0)} (Easy: {student_data.get('easy_solved', 0)}, Medium: {student_data.get('medium_solved', 0)}, Hard: {student_data.get('hard_solved', 0)})
- Weak coding topics: {', '.join(student_data.get('weak_topics', []))}
- GitHub repos: {student_data.get('repo_count', 0)}, Commits: {student_data.get('total_commits', 0)}
- Skills: {', '.join([s.get('skill_name', '') for s in student_data.get('skills', [])])}
- Certifications count: {student_data.get('cert_count', 0)}
- Projects count: {student_data.get('project_count', 0)}
- Placement readiness: {student_data.get('readiness_score', 0)}/100

Generate targeted recommendations. Return JSON list only."""

    raw = _call_claude(system_prompt, user_prompt, max_tokens=2000)
    if raw:
        try:
            return json.loads(raw)
        except Exception:
            pass

    # ── Rule-based fallback ──────────────────────────────────────────────────
    return _rule_based_recommendations(student_data)


def _rule_based_recommendations(student_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate recommendations from rules when Claude is unavailable."""
    recs = []
    total_solved  = student_data.get("total_solved", 0)
    medium_solved = student_data.get("medium_solved", 0)
    cert_count    = student_data.get("cert_count", 0)
    project_count = student_data.get("project_count", 0)
    readiness     = student_data.get("readiness_score", 0)
    weak_topics   = student_data.get("weak_topics", [])
    domains       = student_data.get("preferred_domains", [])
    salary        = student_data.get("expected_salary_lpa", 0) or 0

    # Coding recommendations
    if total_solved < 50:
        recs.append({"category": "coding", "title": "Solve 50 LeetCode Easy Problems", "description": "Build your foundation by completing at least 50 easy problems. Focus on Arrays, Strings and Hashing first.", "priority": 1})
    elif total_solved < 150:
        recs.append({"category": "coding", "title": "Reach 150 LeetCode Problems", "description": f"You have solved {total_solved} problems. Target 150+ including at least 40 medium problems to be competitive.", "priority": 1})
    else:
        recs.append({"category": "coding", "title": "Focus on Hard Problems", "description": f"With {total_solved} problems solved, start tackling hard problems to stand out for product companies.", "priority": 2})

    if medium_solved < 30:
        recs.append({"category": "coding", "title": "Practise Medium Difficulty Problems", "description": "Most placement tests focus on medium level. Aim for 30+ medium problems across Trees, Graphs and DP.", "priority": 1})

    if weak_topics:
        top_weak = weak_topics[:3]
        recs.append({"category": "coding", "title": f"Strengthen Weak Topics: {', '.join(top_weak)}", "description": f"You have low scores in {', '.join(top_weak)}. Solve 10 problems in each of these topics this week.", "priority": 1})

    # Project recommendations
    if project_count == 0:
        recs.append({"category": "career", "title": "Build Your First Project", "description": "Create a project relevant to your domain. Even a simple CRUD app or ML model demo adds value to your resume.", "priority": 1})
    elif project_count < 3:
        recs.append({"category": "career", "title": f"Add More Projects (current: {project_count})", "description": "Aim for 3+ projects. Include a full-stack app, a domain-specific project and at least one with a live demo.", "priority": 2})

    # Certification recommendations
    if cert_count == 0:
        recs.append({"category": "skill", "title": "Earn Your First Certification", "description": "Get a free certification from Google, AWS, Coursera or NPTEL. Certifications signal continuous learning to recruiters.", "priority": 2})
    elif cert_count < 3:
        recs.append({"category": "skill", "title": "Collect 3+ Certifications", "description": "Add certifications in your domain. AWS Cloud Practitioner, Google Data Analytics or Meta Frontend are good options.", "priority": 3})

    # Interview recommendations
    if readiness < 50:
        recs.append({"category": "interview", "title": "Complete 5 Mock Interview Sessions", "description": "Your readiness score needs improvement. Practice self-introduction, technical and HR rounds at least once each.", "priority": 1})
    else:
        recs.append({"category": "interview", "title": "Practise Mock Interviews Weekly", "description": "Keep your interview skills sharp by doing at least one mock interview session per week.", "priority": 2})

    recs.append({"category": "interview", "title": "Perfect Your Self Introduction", "description": "Prepare a 90-second self introduction covering: name, education, skills, projects and career goals.", "priority": 1})

    # Domain-specific
    if "AI/ML" in domains or "Data Science" in domains:
        recs.append({"category": "skill", "title": "Complete a Kaggle Competition", "description": "Participate in a Kaggle competition to get hands-on ML experience and a portfolio entry.", "priority": 2})
    if "Web Development" in domains:
        recs.append({"category": "skill", "title": "Deploy a Full-Stack Project", "description": "Host your web project on Vercel/Netlify (frontend) and Render/Railway (backend) to show recruiters a live demo.", "priority": 2})
    if "Cloud Computing" in domains or "DevOps" in domains:
        recs.append({"category": "skill", "title": "Get AWS Cloud Practitioner Certified", "description": "AWS Cloud Practitioner is a free exam prep certification that is highly valued by service companies.", "priority": 2})

    # Salary-based
    if salary >= 10:
        recs.append({"category": "career", "title": "Target Product Companies", "description": f"For {salary}+ LPA you need strong DSA (200+ problems), system design basics and a standout GitHub profile.", "priority": 1})

    # GitHub
    repo_count = student_data.get("repo_count", 0)
    if repo_count < 5:
        recs.append({"category": "career", "title": "Build Your GitHub Profile", "description": "Push all your projects to GitHub with proper README files. Recruiters check GitHub before interviews.", "priority": 2})

    return recs[:12]


# ─── Resume Analysis ───────────────────────────────────────────────────────────

async def analyze_resume(resume_text: str, student_domain: List[str]) -> Dict[str, Any]:
    """Analyse a student resume. Uses Claude if available, keyword-based otherwise."""

    system_prompt = """You are an ATS expert and resume coach for engineering placements in India.
Analyze the resume and return ONLY valid JSON (no markdown):
{
  "ats_score": <0-100 float>,
  "missing_skills": ["skill1", "skill2"],
  "missing_sections": ["section1", "section2"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"],
  "strengths": ["strength1", "strength2", "strength3"],
  "overall_quality": "poor|average|good|excellent"
}"""

    user_prompt = f"""Student's target domains: {', '.join(student_domain)}

Resume content:
\"\"\"{resume_text[:3000]}\"\"\"

Evaluate for Indian IT company placements. Return JSON only."""

    raw = _call_claude(system_prompt, user_prompt, max_tokens=1200)
    if raw:
        try:
            return json.loads(raw)
        except Exception:
            pass

    # ── Rule-based fallback ──────────────────────────────────────────────────
    return _rule_based_resume_analysis(resume_text, student_domain)


def _rule_based_resume_analysis(resume_text: str, domains: List[str]) -> Dict[str, Any]:
    """Score resume using keyword matching when Claude is unavailable."""
    text_lower = resume_text.lower()
    score = 0
    strengths = []
    missing_sections = []
    missing_skills = []
    suggestions = []

    # Section checks
    section_keywords = {
        "Education":      ["education", "b.tech", "b.e.", "bachelor", "cgpa", "gpa", "university", "college"],
        "Experience":     ["experience", "internship", "intern", "worked at", "trainee"],
        "Projects":       ["project", "built", "developed", "implemented", "created"],
        "Skills":         ["skills", "technologies", "tools", "languages"],
        "Certifications": ["certification", "certified", "certificate", "course"],
        "Contact":        ["email", "phone", "linkedin", "github", "@"],
    }

    for section, keywords in section_keywords.items():
        if any(kw in text_lower for kw in keywords):
            score += 12
            if section in ["Education", "Projects", "Skills"]:
                strengths.append(f"{section} section is present")
        else:
            missing_sections.append(section)
            suggestions.append(f"Add a dedicated {section} section")

    # Tech skill checks based on domain
    domain_skills = {
        "Web Development":   ["html", "css", "javascript", "react", "node", "express", "mongodb"],
        "AI/ML":             ["python", "machine learning", "tensorflow", "scikit", "pandas", "numpy"],
        "Data Science":      ["python", "sql", "tableau", "power bi", "statistics", "r"],
        "Cloud Computing":   ["aws", "azure", "docker", "kubernetes", "cloud"],
        "Mobile Development":["flutter", "react native", "android", "kotlin", "swift"],
    }

    for domain in domains:
        expected = domain_skills.get(domain, [])
        found = [s for s in expected if s in text_lower]
        missing = [s for s in expected if s not in text_lower]
        if found:
            score += min(15, len(found) * 3)
        if missing:
            missing_skills.extend(missing[:3])

    # Length check
    word_count = len(resume_text.split())
    if word_count < 200:
        suggestions.append("Resume is too short — add more details about your projects and experience")
        score -= 10
    elif word_count > 300:
        strengths.append("Resume has good detail and length")
        score += 5

    # Action verbs
    action_verbs = ["developed", "built", "implemented", "designed", "created", "led", "managed", "optimised", "improved", "deployed"]
    found_verbs = [v for v in action_verbs if v in text_lower]
    if len(found_verbs) >= 3:
        strengths.append("Good use of action verbs")
        score += 8
    else:
        suggestions.append("Use strong action verbs like 'Developed', 'Built', 'Implemented', 'Led'")

    # LinkedIn / GitHub
    if "linkedin" in text_lower:
        score += 5
        strengths.append("LinkedIn profile included")
    else:
        suggestions.append("Add your LinkedIn profile URL")

    if "github" in text_lower:
        score += 5
        strengths.append("GitHub profile included")
    else:
        suggestions.append("Add your GitHub profile URL to showcase your code")

    # Quantification
    import re
    numbers = re.findall(r'\d+', resume_text)
    if len(numbers) >= 5:
        strengths.append("Good use of numbers and metrics")
        score += 5
    else:
        suggestions.append("Add measurable achievements — e.g. 'Improved performance by 30%', 'Solved 200+ problems'")

    score = max(20, min(95, score))

    if score >= 75:
        quality = "good"
    elif score >= 55:
        quality = "average"
    elif score >= 35:
        quality = "poor"
    else:
        quality = "poor"

    if len(strengths) == 0:
        strengths = ["Resume submitted successfully", "Content is readable", "Basic structure present"]

    return {
        "ats_score":       round(score, 1),
        "missing_skills":  list(set(missing_skills))[:6],
        "missing_sections":missing_sections[:4],
        "suggestions":     suggestions[:5],
        "strengths":       strengths[:3],
        "overall_quality": quality,
    }


# ─── Interview Question Generator ─────────────────────────────────────────────

def get_interview_question(session_type: str, student_context: Dict[str, Any] = None) -> str:
    """Return a question for the given interview round type."""
    questions = {
        "self_intro": [
            "Tell me about yourself.",
            "Walk me through your background and what makes you a strong candidate.",
            "Introduce yourself and highlight your key technical achievements.",
        ],
        "technical": [
            "Explain a sorting algorithm you know and its time complexity.",
            "What is the difference between a stack and a queue? Give real-world examples.",
            "Explain how binary search works and when you would use it.",
            "What is Object-Oriented Programming? Explain any two principles with examples.",
            "How does a HashMap work internally?",
            "Explain recursion with a practical example.",
            "What is the difference between SQL and NoSQL databases?",
        ],
        "hr": [
            "Why should we hire you?",
            "Tell me about a challenge you faced and how you overcame it.",
            "Where do you see yourself in 5 years?",
            "What are your greatest strengths and weaknesses?",
            "Describe a situation where you worked effectively in a team.",
            "How do you handle pressure and tight deadlines?",
        ],
    }
    pool = questions.get(session_type, questions["hr"])
    return random.choice(pool)


# ─── Skill Gap Analysis ────────────────────────────────────────────────────────

async def generate_skill_gap_roadmap(
    target_role: str,
    current_skills: List[str],
    student_domain: List[str],
) -> Dict[str, Any]:
    """Generate skill gap roadmap. Uses Claude if available, rule-based otherwise."""

    system_prompt = """You are a technical career coach for Indian engineering students.
Return ONLY valid JSON (no markdown):
{
  "missing_skills": ["skill1", "skill2", ...],
  "roadmap": [
    {"step": 1, "skill": "skill_name", "resources": ["resource1"], "estimated_weeks": 2},
    ...
  ],
  "priority_order": ["skill1", "skill2", ...],
  "estimated_total_weeks": <number>
}"""

    user_prompt = f"""Target role: {target_role}
Current skills: {', '.join(current_skills) if current_skills else 'None'}
Domain: {', '.join(student_domain) if student_domain else 'General'}
Return JSON only."""

    raw = _call_claude(system_prompt, user_prompt, max_tokens=1500)
    if raw:
        try:
            return json.loads(raw)
        except Exception:
            pass

    # ── Rule-based fallback ──────────────────────────────────────────────────
    return _rule_based_skill_gap(target_role, current_skills, student_domain)


def _rule_based_skill_gap(
    target_role: str,
    current_skills: List[str],
    domains: List[str],
) -> Dict[str, Any]:
    """Return skill gap roadmap from a predefined map when Claude is unavailable."""
    role_lower = target_role.lower()
    current_lower = [s.lower() for s in current_skills]

    role_skills = {
        "ai engineer":        ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "SQL", "MLOps", "Docker"],
        "data scientist":     ["Python", "R", "SQL", "Statistics", "Pandas", "Scikit-learn", "Tableau"],
        "web developer":      ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB", "Git"],
        "fullstack developer":["HTML", "CSS", "JavaScript", "React", "Node.js", "PostgreSQL", "Docker", "Git"],
        "backend developer":  ["Python", "Node.js", "PostgreSQL", "REST APIs", "Docker", "Redis", "Git"],
        "mobile developer":   ["Flutter", "Dart", "Firebase", "REST APIs", "Git"],
        "devops engineer":    ["Linux", "Docker", "Kubernetes", "CI/CD", "AWS", "Terraform", "Git"],
        "cloud engineer":     ["AWS", "Azure", "Docker", "Kubernetes", "Terraform", "Linux"],
        "software engineer":  ["Data Structures", "Algorithms", "Python", "Git", "SQL", "REST APIs"],
    }

    # Match target role
    matched_skills = []
    for role_key, skills in role_skills.items():
        if role_key in role_lower or any(word in role_lower for word in role_key.split()):
            matched_skills = skills
            break

    if not matched_skills:
        matched_skills = role_skills["software engineer"]

    missing = [s for s in matched_skills if s.lower() not in current_lower]

    resources_map = {
        "Python":           ["Python.org docs", "Automate the Boring Stuff (free)", "CS50P on edX"],
        "Machine Learning": ["Andrew Ng ML Course (Coursera)", "fast.ai", "Kaggle Learn"],
        "Deep Learning":    ["fast.ai", "DeepLearning.AI specialisation", "PyTorch tutorials"],
        "React":            ["React official docs", "The Odin Project", "freeCodeCamp"],
        "Node.js":          ["Node.js official docs", "The Odin Project", "Traversy Media YouTube"],
        "Docker":           ["Docker official docs", "TechWorld with Nana YouTube", "Play with Docker"],
        "AWS":              ["AWS Free Tier", "AWS Cloud Practitioner (free exam prep)", "A Cloud Guru"],
        "SQL":              ["SQLZoo", "Mode Analytics SQL tutorial", "LeetCode SQL"],
        "Git":              ["Pro Git book (free)", "GitHub Learning Lab", "Atlassian Git tutorial"],
        "default":          ["YouTube tutorials", "Official documentation", "freeCodeCamp"],
    }

    roadmap = []
    step = 1
    weeks_map = {"easy": 2, "medium": 3, "hard": 4}

    for skill in missing[:8]:
        resources = resources_map.get(skill, resources_map["default"])
        roadmap.append({
            "step": step,
            "skill": skill,
            "resources": resources[:2],
            "estimated_weeks": 2,
        })
        step += 1

    return {
        "missing_skills":       missing,
        "roadmap":              roadmap,
        "priority_order":       missing[:5],
        "estimated_total_weeks": len(missing) * 2,
    }
