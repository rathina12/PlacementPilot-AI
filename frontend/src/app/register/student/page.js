"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { studentsAPI, mentorsAPI } from "@/lib/api";
import { LoadingSpinner, ToastProvider } from "@/components/ui";
import { GraduationCap } from "lucide-react";
import { getErrorMessage } from "@/lib/errorHelper";

const BRANCHES = ["CSE","ECE","EEE","MECH","CIVIL","IT","AIDS","AIML"];
const YEARS    = [1,2,3,4];
const SECTIONS = ["A","B","C","D","E"];

export default function StudentRegisterPage() {
  const router = useRouter();
  const [loading,  setLoading]  = useState(false);
  const [mentors,  setMentors]  = useState([]);
  const [fetching, setFetching] = useState(false);
  const [form, setForm] = useState({
    name:"", roll_number:"", email:"", password:"",
    phone:"", branch:"CSE", year:3, section:"A",
    mentor_id:"", batch_id:"", leetcode_username:"", github_username:"",
  });

  useEffect(() => {
    const fetchMentors = async () => {
      setFetching(true);
      try {
        const res = await mentorsAPI.getAvailable({ branch: form.branch, year: form.year, section: form.section });
        let list = res.data || [];
        if (list.length === 0) {
          const all = await mentorsAPI.getAvailable({ branch: form.branch });
          list = all.data || [];
        }
        const seen = new Set();
        setMentors(list.filter(m => { if (seen.has(m.mentor_id)) return false; seen.add(m.mentor_id); return true; }));
      } catch { setMentors([]); }
      setFetching(false);
    };
    fetchMentors();
  }, [form.branch, form.year, form.section]);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm(prev => ({
      ...prev,
      [field]: field === "year" ? parseInt(val) : val,
      ...(field === "branch" ? { mentor_id: "", batch_id: "" } : {}),
    }));
  };

  const handleMentorSelect = (e) => {
    const val = e.target.value;
    const selected = mentors.find(m => m.mentor_id === val);
    setForm(prev => ({ ...prev, mentor_id: selected?.mentor_id || "", batch_id: selected?.batch_id || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())        { toast.error("Name is required"); return; }
    if (!form.roll_number.trim()) { toast.error("Roll number is required"); return; }
    if (!form.email.trim())       { toast.error("Email is required"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    const payload = {
      name:              form.name.trim(),
      roll_number:       form.roll_number.trim().toUpperCase(),
      email:             form.email.trim().toLowerCase(),
      password:          form.password,
      branch:            form.branch,
      year:              parseInt(form.year),
      section:           form.section,
      phone:             form.phone.trim() || null,
      mentor_id:         form.mentor_id  || null,
      batch_id:          form.batch_id   || null,
      leetcode_username: form.leetcode_username.trim() || null,
      github_username:   form.github_username.trim()   || null,
    };

    setLoading(true);
    try {
      await studentsAPI.register(payload);
      toast.success("Registration successful! Please login.");
      router.push("/login");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <ToastProvider />
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-3">
            <GraduationCap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Student Registration</h1>
          <p className="text-gray-500 text-sm mt-1">Create your Digital Twin profile</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" placeholder="Rathina Kumar" value={form.name} onChange={set("name")} />
              </div>
              <div>
                <label className="label">Roll Number *</label>
                <input className="input" placeholder="21CS001" value={form.roll_number} onChange={set("roll_number")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" placeholder="student@college.edu" value={form.email} onChange={set("email")} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="+91 9876543210" value={form.phone} onChange={set("phone")} />
              </div>
            </div>

            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" placeholder="Min 6 characters" value={form.password} onChange={set("password")} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Branch *</label>
                <select className="input" value={form.branch} onChange={set("branch")}>
                  {BRANCHES.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Year *</label>
                <select className="input" value={form.year} onChange={set("year")}>
                  {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Section *</label>
                <select className="input" value={form.section} onChange={set("section")}>
                  {SECTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">
                Select Mentor
                <span className="text-gray-400 font-normal ml-1">(from your department)</span>
              </label>
              {fetching ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                  <LoadingSpinner size={14} /> Finding mentors...
                </div>
              ) : mentors.length === 0 ? (
                <p className="text-xs text-orange-500 mt-1 p-2 bg-orange-50 rounded-lg">
                  No mentors found for {form.branch}. You can update this later from Profile Settings.
                </p>
              ) : (
                <select className="input" value={form.mentor_id} onChange={handleMentorSelect}>
                  <option value="">-- Select a Mentor (Optional) --</option>
                  {mentors.map(m => (
                    <option key={m.mentor_id} value={m.mentor_id}>
                      {m.mentor_name} — {m.department || form.branch}
                      {m.batch_name && m.batch_name !== `${m.department} Department` ? ` (${m.batch_name})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">LeetCode Username</label>
                <input className="input" placeholder="your_handle" value={form.leetcode_username} onChange={set("leetcode_username")} />
              </div>
              <div>
                <label className="label">GitHub Username</label>
                <input className="input" placeholder="your_handle" value={form.github_username} onChange={set("github_username")} />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? <><LoadingSpinner size={16} /> Creating Account...</> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already registered?{" "}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
