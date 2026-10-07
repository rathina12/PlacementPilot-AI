"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import useAuthStore from "@/store/authStore";
import { authAPI } from "@/lib/api";
import { LoadingSpinner, ToastProvider } from "@/components/ui";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { getErrorMessage } from "@/lib/errorHelper";

export default function LoginPage() {
  const [email,   setEmail]    = useState("");
  const [password,setPassword] = useState("");
  const [showPwd, setShowPwd]  = useState(false);
  const [loading, setLoading]  = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      const { access_token, role, user_id, name } = res.data;
      login(access_token, { id: user_id, name, role });
      toast.success(`Welcome back, ${name}!`);
      router.push(`/${role}/dashboard`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <ToastProvider />
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg mb-4">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PlacementPilot AI</h1>
          <p className="text-gray-500 text-sm mt-1">Your career growth workspace</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input" placeholder="you@college.edu"
                value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} className="input pr-10"
                  placeholder="Your password" value={password}
                  onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? <><LoadingSpinner size={16} />Signing in...</> : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 space-y-2 text-sm text-center text-gray-500">
            <p>New student? <Link href="/register/student" className="text-indigo-600 font-medium hover:underline">Register here</Link></p>
            <p>New mentor? <Link href="/register/mentor" className="text-indigo-600 font-medium hover:underline">Register here</Link></p>
          </div>

        </div>
      </div>
    </div>
  );
}
