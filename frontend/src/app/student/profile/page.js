"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner } from "@/components/ui";
import { studentsAPI, mentorsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { User, Save, Target, DollarSign, Code2, GitBranch } from "lucide-react";

const DOMAINS   = ["AI/ML","Data Science","Web Development","Mobile Development","Cloud Computing","Cyber Security","DevOps","UI/UX","Data Engineering"];
const COMPANIES = ["TCS","Infosys","Wipro","HCL","Cognizant","Accenture","Zoho","Amazon","Google","Microsoft","Flipkart","Swiggy","Freshworks"];
const SALARIES  = [3,5,6,8,10,12,15,20];

export default function ProfilePage() {
  const [student,  setStudent]  = useState(null);
  const [mentors,  setMentors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({});

  useEffect(() => {
    studentsAPI.getMe().then(async (r) => {
      const s = r.data;
      setStudent(s);
      setForm({
        name:              s.name || "",
        phone:             s.phone || "",
        leetcode_username: s.leetcode_username || "",
        github_username:   s.github_username   || "",
        preferred_domains: s.preferred_domains || [],
        expected_salary_lpa: s.expected_salary_lpa || "",
        target_companies:  s.target_companies  || [],
        cgpa:              s.cgpa || "",
        attendance_percent:s.attendance_percent || "",
        mentor_id:         s.mentor_id || "",
      });
      // Fetch mentors for department
      try {
        const mRes = await mentorsAPI.getAvailable({ branch: s.branch });
        setMentors(mRes.data || []);
      } catch { setMentors([]); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleDomain  = (d) => setForm(p => ({
    ...p,
    preferred_domains: p.preferred_domains.includes(d)
      ? p.preferred_domains.filter(x => x !== d)
      : [...p.preferred_domains, d],
  }));
  const toggleCompany = (c) => setForm(p => ({
    ...p,
    target_companies: p.target_companies.includes(c)
      ? p.target_companies.filter(x => x !== c)
      : [...p.target_companies, c],
  }));

  const save = async () => {
    setSaving(true);
    try {
      await studentsAPI.updateMe(form);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed");
    }
    setSaving(false);
  };

  if (loading) return (
    <DashboardLayout requiredRole="student">
      <div className="flex justify-center py-16"><LoadingSpinner size={32} /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout requiredRole="student">
      <SectionHeader title="Profile Settings" subtitle="Update your digital twin profile" />

      <div className="max-w-2xl space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <User size={16} /> Personal Info
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name}
                onChange={e => setForm(p => ({...p, name: e.target.value}))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone}
                onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
            </div>
          </div>
          {student && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-sm">
              <div><span className="font-medium text-gray-700">Roll No:</span> <span className="text-gray-500">{student.roll_number}</span></div>
              <div><span className="font-medium text-gray-700">Branch:</span> <span className="text-gray-500">{student.branch}</span></div>
              <div><span className="font-medium text-gray-700">Year/Sec:</span> <span className="text-gray-500">{student.year}{student.section}</span></div>
            </div>
          )}
        </div>

        {/* Mentor Selection */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            👨‍🏫 Mentor
          </h3>
          {mentors.length === 0 ? (
            <p className="text-sm text-gray-400">No mentors available for your department yet.</p>
          ) : (
            <select className="input" value={form.mentor_id}
              onChange={e => setForm(p => ({...p, mentor_id: e.target.value}))}>
              <option value="">-- No Mentor Selected --</option>
              {mentors.map(m => (
                <option key={m.mentor_id} value={m.mentor_id}>
                  {m.mentor_name} — {m.department}
                  {m.batch_name && m.batch_name !== `${m.department} Department`
                    ? ` (${m.batch_name})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* External Profiles */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Code2 size={16} /> External Profiles
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-2">
                <Code2 size={12} /> LeetCode Username
              </label>
              <input className="input" placeholder="your_handle"
                value={form.leetcode_username}
                onChange={e => setForm(p => ({...p, leetcode_username: e.target.value}))} />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <GitBranch size={12} /> GitHub Username
              </label>
              <input className="input" placeholder="your_handle"
                value={form.github_username}
                onChange={e => setForm(p => ({...p, github_username: e.target.value}))} />
            </div>
          </div>
        </div>

        {/* Academic */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">📚 Academic Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">CGPA</label>
              <input type="number" step="0.01" min="0" max="10" className="input"
                placeholder="8.5" value={form.cgpa}
                onChange={e => setForm(p => ({...p, cgpa: e.target.value}))} />
            </div>
            <div>
              <label className="label">Attendance %</label>
              <input type="number" min="0" max="100" className="input"
                placeholder="85" value={form.attendance_percent}
                onChange={e => setForm(p => ({...p, attendance_percent: e.target.value}))} />
            </div>
          </div>
        </div>

        {/* Career Goals */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Target size={16} /> Career Goals
          </h3>
          <div className="mb-4">
            <label className="label flex items-center gap-2">
              <DollarSign size={12} /> Expected Salary (LPA)
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SALARIES.map(s => (
                <button key={s} type="button"
                  onClick={() => setForm(p => ({...p, expected_salary_lpa: s}))}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    form.expected_salary_lpa == s
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>
                  {s} LPA{s === 20 ? "+" : ""}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="label">Preferred Domains</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {DOMAINS.map(d => (
                <button key={d} type="button" onClick={() => toggleDomain(d)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    (form.preferred_domains || []).includes(d)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Target Companies</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {COMPANIES.map(c => (
                <button key={c} type="button" onClick={() => toggleCompany(c)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    (form.target_companies || []).includes(c)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary w-full justify-center py-3">
          {saving ? <><LoadingSpinner size={16} /> Saving...</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>
    </DashboardLayout>
  );
}
