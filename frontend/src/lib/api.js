import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({ baseURL: BASE, headers: { "Content-Type": "application/json" } });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("sdt-auth");
      const token = raw ? JSON.parse(raw)?.state?.token : null;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (_) {}
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("sdt-auth");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
};
export const studentsAPI = {
  register:          (d) => api.post("/students/register", d),
  getMe:             ()  => api.get("/students/me"),
  updateMe:          (d) => api.patch("/students/me", d),
  syncLeetCode:      ()  => api.post("/students/me/sync-leetcode"),
  syncGitHub:        ()  => api.post("/students/me/sync-github"),
  getReadiness:      ()  => api.get("/students/me/readiness"),
  generateRecs:      ()  => api.post("/students/me/generate-recommendations"),
  analyzeResume:     (f) => api.post("/students/me/analyze-resume", f, { headers: { "Content-Type": "multipart/form-data" } }),
  updatePlacement:   (d) => api.patch("/students/me/placement-status", d),
  getCertifications: ()  => api.get("/students/me/certifications"),
  addCertification:  (d) => api.post("/students/me/certifications", d),
  deleteCertification:(id)=>api.delete(`/students/me/certifications/${id}`),
  getProjects:       ()  => api.get("/students/me/projects"),
  addProject:        (d) => api.post("/students/me/projects", d),
  deleteProject:     (id)=>api.delete(`/students/me/projects/${id}`),
  getSkills:         ()  => api.get("/students/me/skills"),
  addSkill:          (d) => api.post("/students/me/skills", d),
  getGoals:          ()  => api.get("/students/me/goals"),
  addGoal:           (d) => api.post("/students/me/goals", d),
  updateGoal:        (id, d) => api.patch(`/students/me/goals/${id}`, d),
  getRecommendations:()  => api.get("/students/me/recommendations"),
  completeRec:       (id)=>api.patch(`/students/me/recommendations/${id}/complete`),
  getById:           (id)=>api.get(`/students/${id}`),
};
export const interviewsAPI = {
  start:        (t)  => api.post("/interviews/start", { session_type: t }),
  submit:       (d)  => api.post("/interviews/submit", d),
  getMySessions:()   => api.get("/interviews/my-sessions"),
  getSession:   (id) => api.get(`/interviews/session/${id}`),
  getForStudent:(id) => api.get(`/interviews/student/${id}/sessions`),
};
export const mentorsAPI = {
  register:          (d)     => api.post("/mentors/register", d),
  getMe:             ()      => api.get("/mentors/me"),
  updateMe:          (d)     => api.patch("/mentors/me", d),
  createBatch:       (d)     => api.post("/mentors/batches", d),
  getBatches:        ()      => api.get("/mentors/batches"),
  deleteBatch:       (id)    => api.delete(`/mentors/batches/${id}`),
  getMyStudents:     ()      => api.get("/mentors/my-students"),
  getAtRisk:         ()      => api.get("/mentors/my-students/needs-attention"),
  getStudentProfile: (id)    => api.get(`/mentors/my-students/${id}/full-profile`),
  getBenchmark:      (id)    => api.get(`/mentors/my-students/${id}/benchmark`),
  getDashboard:      ()      => api.get("/mentors/dashboard"),
  getAvailable:      (params)=> api.get("/mentors/available", { params }),
};
export const adminAPI = {
  register:           (d)      => api.post("/admin/register", d),
  getDashboard:       ()       => api.get("/admin/dashboard"),
  getBranchOverview:  (branch) => api.get(`/admin/branch/${branch}`),
  listStudents:       (params) => api.get("/admin/students", { params }),
  listMentors:        ()       => api.get("/admin/mentors"),
  toggleMentor:       (id)     => api.patch(`/admin/mentors/${id}/toggle-active`),
  getReadinessDist:   ()       => api.get("/admin/analytics/readiness-distribution"),
  getPlacementTrends: ()       => api.get("/admin/analytics/placement-trends"),
  getTopPerformers:   (params) => api.get("/admin/analytics/top-performers", { params }),
};
