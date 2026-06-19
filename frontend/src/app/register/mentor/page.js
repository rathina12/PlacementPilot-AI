"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { mentorsAPI } from "@/lib/api";
import { LoadingSpinner, ToastProvider } from "@/components/ui";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { getErrorMessage } from "@/lib/errorHelper";

const DEPARTMENTS  = ["CSE","ECE","EEE","MECH","CIVIL","IT","AIDS","AIML","MCA","MBA"];
const DESIGNATIONS = ["Assistant Professor","Associate Professor","Professor","HOD","Lab Instructor"];

export default function MentorRegisterPage() {
  const router  = useRouter();
  const [loading,setLoading]=useState(false);
  const [showPwd,setShowPwd]=useState(false);
  const [form,   setForm]   =useState({name:"",employee_id:"",email:"",password:"",phone:"",department:"CSE",designation:"Assistant Professor"});

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())        { toast.error("Name is required"); return; }
    if (!form.employee_id.trim()) { toast.error("Employee ID is required"); return; }
    if (!form.email.trim())       { toast.error("Email is required"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    const payload = {
      name:        form.name.trim(),
      employee_id: form.employee_id.trim(),
      email:       form.email.trim().toLowerCase(),
      password:    form.password,
      phone:       form.phone.trim() || null,
      department:  form.department,
      designation: form.designation,
    };

    setLoading(true);
    try {
      await mentorsAPI.register(payload);
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
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-3">
            <GraduationCap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mentor Registration</h1>
          <p className="text-gray-500 text-sm mt-1">Create your mentor account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" placeholder="Dr. Kumar" value={form.name} onChange={set("name")} />
              </div>
              <div>
                <label className="label">Employee ID *</label>
                <input className="input" placeholder="EMP001" value={form.employee_id} onChange={set("employee_id")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" placeholder="faculty@college.edu" value={form.email} onChange={set("email")} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="+91 9876543210" value={form.phone} onChange={set("phone")} />
              </div>
            </div>
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} className="input pr-10"
                  placeholder="Min 6 characters" value={form.password} onChange={set("password")} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Department</label>
                <select className="input" value={form.department} onChange={set("department")}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Designation</label>
                <select className="input" value={form.designation} onChange={set("designation")}>
                  {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? <><LoadingSpinner size={16} /> Creating Account...</> : "Create Mentor Account"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
