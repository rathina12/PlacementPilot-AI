# Student Digital Twin Platform

AI-Powered Student Placement Readiness & Mentor Monitoring System

---

## 🔐 Default Admin Credentials

| Field    | Value             |
|----------|-------------------|
| Email    | admin@sdt.edu     |
| Password | Admin@123         |
| Role     | Admin             |

**To create the admin account, run this once after starting the backend:**
```powershell
cd C:\Users\kavi1\Downloads\sdt\backend
venv\Scripts\Activate.ps1
python create_admin.py
```

---

## 🚀 Quick Start (Windows)

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Community Server (local) OR MongoDB Atlas (cloud)

### Backend Setup

```powershell
cd sdt\backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Configure environment
copy .env.example .env
notepad .env   # Fill in your MongoDB URL

# Create admin account (run once)
python create_admin.py

# Start backend
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup (new PowerShell window)

```powershell
cd sdt\frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
npm run dev
```

Visit: **http://localhost:3000**
API Docs: **http://localhost:8000/docs**

---

## 📋 .env File (backend)

```env
SECRET_KEY=changethissecretkey123456789abc
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=student_digital_twin
ANTHROPIC_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
GITHUB_TOKEN=
FRONTEND_URL=http://localhost:3000
```

For MongoDB Atlas replace MONGODB_URL with:
```
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
```

---

## 🤖 AI Features (No API Key Required)

The platform uses **rule-based AI** when no Anthropic API key is provided:

| Feature | With API Key | Without API Key |
|---------|-------------|-----------------|
| Mock Interview Scoring | Claude AI | Rule-based scoring (word count, filler words, pace) |
| Recommendations | Claude AI | Domain + goal-based rule engine |
| Resume Analysis | Claude AI | Keyword matching + ATS scoring |
| Skill Gap Analysis | Claude AI | Predefined role→skill maps |

**Everything works without any API key.**

If you get an Anthropic API key later, add it to `.env` and AI features automatically upgrade.

---

## 👥 User Roles

### Admin
- Login: admin@sdt.edu / Admin@123
- View platform-wide analytics
- Manage all students and mentors
- Branch/batch drill-down views
- Placement tracking with charts

### Mentor
- Register at /register/mentor
- Create batches for your students
- Monitor student progress
- View coding stats, GitHub, interview scores
- Get SMS alerts for at-risk students

### Student
- Register at /register/student
- Select mentor from your department
- Connect LeetCode + GitHub profiles
- Take AI mock interviews (type/record/upload)
- Get personalized roadmap and recommendations
- Upload resume for AI analysis

---

## 📁 Project Structure

```
sdt/
├── backend/
│   ├── app/
│   │   ├── api/routes/     ← All API endpoints
│   │   ├── core/           ← DB, config, security
│   │   ├── models/         ← MongoDB document factories
│   │   ├── schemas/        ← Pydantic request/response models
│   │   ├── services/       ← LeetCode, GitHub, AI, SMS
│   │   └── ml/             ← Placement readiness engine
│   ├── create_admin.py     ← Run once to create admin
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    └── src/
        ├── app/
        │   ├── login/
        │   ├── register/student|mentor/
        │   ├── student/    ← dashboard, coding, github, skills,
        │   │                  certs, projects, interview, roadmap,
        │   │                  resume, goals, profile
        │   ├── mentor/     ← dashboard, students, batches, at-risk
        │   └── admin/      ← dashboard, students, mentors,
        │                      branches, batches, placements, analytics
        ├── components/ui/  ← Reusable components
        ├── lib/api.js      ← Axios API client
        └── store/          ← Zustand auth store
```

---

## 🔗 API Endpoints

```
POST /api/auth/login

POST /api/students/register
GET  /api/students/me
POST /api/students/me/sync-leetcode
POST /api/students/me/sync-github
GET  /api/students/me/readiness
POST /api/students/me/generate-recommendations
POST /api/students/me/analyze-resume
GET  /api/students/me/certifications
POST /api/students/me/certifications
GET  /api/students/me/projects
POST /api/students/me/projects
GET  /api/students/me/skills
POST /api/students/me/skills
GET  /api/students/me/goals
POST /api/students/me/goals

POST /api/interviews/start
POST /api/interviews/submit
GET  /api/interviews/my-sessions

POST /api/mentors/register
GET  /api/mentors/available?branch=CSE
POST /api/mentors/batches
GET  /api/mentors/my-students
GET  /api/mentors/dashboard

GET  /api/admin/dashboard
GET  /api/admin/branch/{branch}
GET  /api/admin/students
GET  /api/admin/analytics/placement-trends
GET  /api/admin/analytics/top-performers
```

---

## 🎯 Features Checklist

- ✅ Student registration with mentor selection (by department)
- ✅ Mentor registration and batch management
- ✅ Admin dashboard with college-wide analytics
- ✅ LeetCode profile sync (GraphQL + fallback APIs)
- ✅ GitHub profile sync (official REST API)
- ✅ AI Mock Interview (type answer / record video / upload video)
- ✅ Rule-based AI evaluation (no API key needed)
- ✅ Placement readiness score (0-100) with sub-scores
- ✅ Peer benchmarking within batch
- ✅ AI learning roadmap + recommendations
- ✅ Resume analyzer (PDF, DOCX, TXT)
- ✅ Weekly goals tracking
- ✅ Skill gap analysis
- ✅ SMS alerts for at-risk students (Twilio)
- ✅ Mentor monitoring dashboard
- ✅ Branch/batch drill-down for admin
- ✅ Placement status tracking (placed/not placed/not interested)
- ✅ Company-wise placement charts

---

## 🛠 Troubleshooting

**"Registration failed"**
→ Check backend terminal for error. Most common: MongoDB not running, or duplicate email.

**"LeetCode sync failed"**
→ LeetCode's API sometimes blocks automated requests. Try again in a few minutes.

**"Cannot resolve @/store/authStore"**
→ Make sure `jsconfig.json` exists in the frontend folder.

**"border-border class does not exist"**
→ Replace `globals.css` with the one from the latest zip.

**Password errors**
→ Make sure you're using the latest `security.py` with direct bcrypt.
